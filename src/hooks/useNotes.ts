import { useCallback, useEffect, useRef, useState } from 'react'
import type { Page, SidebarItem, SmartLink } from '../types/note'
import type { PersistenceState, SidebarSection } from '../types/workspace'
import { appConfig } from '../config/appConfig'
import {
  createWorkspaceStorage,
  migrateLocalSnapshotToRemote,
} from '../storage'
import { WorkspaceConflictError } from '../storage/types'
import {
  createLink,
  createPage,
  createSection,
  createSnapshot,
  loadLocalSnapshot,
  normalizeItems,
  normalizeSections,
  saveLocalSnapshot,
} from '../storage/workspace'
import { collectDescendantIds, isValidParentId, nextSectionOrder } from '../utils/tree'
import { applyItemDrop, applyItemDropToSection, assignMissingOrders, orderForNewSibling } from '../utils/itemOrder'
import type { DropPosition } from '../utils/itemOrder'
import { normalizeUrl } from '../utils/url'

type AddItemContext = {
  parentId?: string | null
  sectionId?: string | null
}

export function useNotes() {
  const storageRef = useRef(createWorkspaceStorage())
  const revisionRef = useRef(0)
  const allowRemoteSaveRef = useRef(true)
  const [loaded, setLoaded] = useState(false)
  const [items, setItems] = useState<SidebarItem[]>([])
  const [sections, setSections] = useState<SidebarSection[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [persistence, setPersistence] = useState<PersistenceState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    const storage = storageRef.current

    async function loadWorkspace() {
      try {
        if (storage.mode === 'remote') {
          await migrateLocalSnapshotToRemote(storage)
        }

        const snapshot = await storage.load()
        if (cancelled) return

        const sections = normalizeSections(snapshot.sections ?? [])
        const items = assignMissingOrders(normalizeItems(snapshot.items, sections))

        revisionRef.current = snapshot.revision
        allowRemoteSaveRef.current = true
        setItems(items)
        setSections(sections)
        setActiveId(snapshot.activeId)
        setPersistence({ status: 'ready', mode: storage.mode })
        setLoaded(true)
      } catch (error) {
        if (cancelled) return

        const fallback = loadLocalSnapshot()
        revisionRef.current = fallback.revision
        allowRemoteSaveRef.current = storage.mode !== 'remote'
        setItems(fallback.items)
        setSections(fallback.sections ?? [])
        setActiveId(fallback.activeId)
        setPersistence({
          status: 'error',
          mode: storage.mode,
          message:
            error instanceof Error
              ? error.message
              : 'Could not load workspace. Showing this browser copy.',
        })
        setLoaded(true)
      }
    }

    void loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loaded) return

    const storage = storageRef.current
    if (storage.mode === 'remote' && !allowRemoteSaveRef.current) return

    setPersistence(current =>
      current.status === 'error' ? current : { status: 'saving', mode: storage.mode },
    )

    const timeout = window.setTimeout(() => {
      void (async () => {
        const snapshot = createSnapshot(items, sections, activeId, revisionRef.current)

        try {
          await storage.save(snapshot)
          revisionRef.current = snapshot.revision + 1

          if (storage.mode === 'remote') {
            saveLocalSnapshot(snapshot)
          }

          setPersistence({
            status: 'saved',
            mode: storage.mode,
            savedAt: snapshot.updatedAt,
          })
        } catch (error) {
          if (error instanceof WorkspaceConflictError) {
            try {
              const remote = await storage.load()
              revisionRef.current = remote.revision
              setItems(remote.items)
              setSections(remote.sections ?? [])
              setActiveId(remote.activeId)
              saveLocalSnapshot(remote)
              setPersistence({ status: 'ready', mode: storage.mode })
            } catch (reloadError) {
              setPersistence({
                status: 'error',
                mode: storage.mode,
                message:
                  reloadError instanceof Error
                    ? reloadError.message
                    : 'Sync conflict. Reload the page.',
              })
            }
            return
          }

          setPersistence({
            status: 'error',
            mode: storage.mode,
            message:
              error instanceof Error ? error.message : 'Could not save workspace.',
          })
        }
      })()
    }, appConfig.saveDebounceMs)

    return () => window.clearTimeout(timeout)
  }, [items, sections, activeId, loaded])

  const activeItem = items.find(item => item.id === activeId) ?? null

  const selectItem = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const addPage = useCallback(
    ({ parentId = null, sectionId = null }: AddItemContext = {}) => {
      if (!isValidParentId(items, parentId)) return null

      const page = createPage('Untitled', parentId, sectionId)
      page.order = orderForNewSibling(items, parentId, parentId ? null : sectionId)
      setItems(prev => [page, ...prev])
      setActiveId(page.id)
      return page.id
    },
    [items],
  )

  const addLink = useCallback(
    (
      rawUrl: string,
      title?: string,
      { parentId = null, sectionId = null }: AddItemContext = {},
    ) => {
      const url = normalizeUrl(rawUrl)
      if (!url || !isValidParentId(items, parentId)) return false

      const link = createLink(url, title, parentId, sectionId)
      link.order = orderForNewSibling(items, parentId, parentId ? null : sectionId)
      setItems(prev => [link, ...prev])
      setActiveId(link.id)
      return true
    },
    [items],
  )

  const addSection = useCallback((title = 'New section') => {
    const section = createSection(title, nextSectionOrder(sections))
    setSections(prev => [...prev, section])
    return section.id
  }, [sections])

  const updateSection = useCallback((id: string, patch: Partial<Pick<SidebarSection, 'title'>>) => {
    setSections(prev =>
      prev.map(section => (section.id === id ? { ...section, ...patch } : section)),
    )
  }, [])

  const deleteSection = useCallback((id: string) => {
    setSections(prev => prev.filter(section => section.id !== id))
    setItems(prev =>
      prev.map(item =>
        item.sectionId === id ? { ...item, sectionId: null, updatedAt: new Date().toISOString() } : item,
      ),
    )
  }, [])

  const moveItemToSection = useCallback((itemId: string, sectionId: string | null) => {
    setItems(prev => applyItemDropToSection(prev, itemId, sectionId) ?? prev)
  }, [])

  const renameItem = useCallback((id: string, title: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, title, updatedAt: new Date().toISOString() } : item,
      ),
    )
  }, [])

  const moveItem = useCallback(
    (draggedId: string, targetId: string, position: DropPosition) => {
      setItems(prev => applyItemDrop(prev, draggedId, targetId, position) ?? prev)
    },
    [],
  )

  const moveItemToSectionEnd = useCallback((draggedId: string, sectionId: string | null) => {
    setItems(prev => applyItemDropToSection(prev, draggedId, sectionId) ?? prev)
  }, [])

  const updatePage = useCallback((id: string, patch: Partial<Pick<Page, 'title' | 'content'>>) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id && item.kind === 'page'
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }, [])

  const updateLink = useCallback((id: string, patch: Partial<Pick<SmartLink, 'title' | 'url'>>) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id || item.kind !== 'link') return item

        const nextUrl = patch.url !== undefined ? normalizeUrl(patch.url) : item.url
        if (!nextUrl) return item

        return {
          ...item,
          ...patch,
          url: nextUrl,
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }, [])

  const deleteItem = useCallback((id: string) => {
    setItems(prev => {
      const removeIds = collectDescendantIds(prev, id)
      const next = prev.filter(item => !removeIds.has(item.id))

      if (next.length === 0) {
        const page = createPage()
        setActiveId(page.id)
        return [page]
      }

      setActiveId(current => {
        if (!current || !removeIds.has(current)) return current
        return next[0]?.id ?? null
      })

      return next
    })
  }, [])

  return {
    loaded,
    items,
    sections,
    activeItem,
    activeId,
    persistence,
    selectItem,
    addPage,
    addLink,
    addSection,
    updateSection,
    deleteSection,
    moveItemToSection,
    moveItem,
    moveItemToSectionEnd,
    renameItem,
    updatePage,
    updateLink,
    deleteItem,
  }
}
