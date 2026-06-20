import { useCallback, useEffect, useRef, useState } from 'react'
import type { Page, SidebarItem, SmartLink } from '../types/note'
import type { PersistenceState } from '../types/workspace'
import { appConfig } from '../config/appConfig'
import {
  createWorkspaceStorage,
  migrateLocalSnapshotToRemote,
} from '../storage'
import { WorkspaceConflictError } from '../storage/types'
import {
  createLink,
  createPage,
  createSnapshot,
  loadLocalSnapshot,
  saveLocalSnapshot,
} from '../storage/workspace'
import { collectDescendantIds, isValidParentId } from '../utils/tree'
import { normalizeUrl } from '../utils/url'

export function useNotes() {
  const storageRef = useRef(createWorkspaceStorage())
  const revisionRef = useRef(0)
  const [loaded, setLoaded] = useState(false)
  const [items, setItems] = useState<SidebarItem[]>([])
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

        revisionRef.current = snapshot.revision
        setItems(snapshot.items)
        setActiveId(snapshot.activeId)
        setPersistence({ status: 'ready', mode: storage.mode })
        setLoaded(true)
      } catch (error) {
        if (cancelled) return

        const fallback = loadLocalSnapshot()
        revisionRef.current = fallback.revision
        setItems(fallback.items)
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
    setPersistence(current =>
      current.status === 'error' ? current : { status: 'saving', mode: storage.mode },
    )

    const timeout = window.setTimeout(() => {
      void (async () => {
        const snapshot = createSnapshot(items, activeId, revisionRef.current)

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
  }, [items, activeId, loaded])

  const activeItem = items.find(item => item.id === activeId) ?? null

  const selectItem = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const addPage = useCallback(
    (parentId: string | null = null) => {
      if (!isValidParentId(items, parentId)) return null

      const page = createPage('Untitled', parentId)
      setItems(prev => [page, ...prev])
      setActiveId(page.id)
      return page.id
    },
    [items],
  )

  const addLink = useCallback(
    (rawUrl: string, title?: string, parentId: string | null = null) => {
      const url = normalizeUrl(rawUrl)
      if (!url || !isValidParentId(items, parentId)) return false

      const link = createLink(url, title, parentId)
      setItems(prev => [link, ...prev])
      setActiveId(link.id)
      return true
    },
    [items],
  )

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
    activeItem,
    activeId,
    persistence,
    selectItem,
    addPage,
    addLink,
    updatePage,
    updateLink,
    deleteItem,
  }
}
