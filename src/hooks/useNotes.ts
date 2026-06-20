import { useCallback, useEffect, useState } from 'react'
import type { Note, Page, SidebarItem, SmartLink } from '../types/note'
import { collectDescendantIds, isValidParentId } from '../utils/tree'
import { normalizeUrl, titleFromUrl } from '../utils/url'

const STORAGE_KEY = 'notes_hub_v2'
const LEGACY_STORAGE_KEY = 'notes_hub_v1'

function createPage(title = 'Untitled', parentId: string | null = null): Page {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    kind: 'page',
    title,
    content: '',
    parentId,
    updatedAt: now,
  }
}

function createLink(
  url: string,
  title?: string,
  parentId: string | null = null,
): SmartLink {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    kind: 'link',
    title: title?.trim() || titleFromUrl(url),
    url,
    parentId,
    updatedAt: now,
  }
}

function seedItems(): SidebarItem[] {
  const welcome = createPage('Welcome')
  welcome.content =
    'Notes Hub is your space for notes and data.\n\nUse the sidebar to switch pages, add smart links, or create new ones.'

  const ideas = createPage('Ideas')
  ideas.content = '- Project roadmap\n- Meeting notes\n- Research links'

  const repo = createLink('https://github.com/manoira/notes_hub', 'notes_hub on GitHub')

  return [welcome, ideas, repo]
}

function toPage(note: Note): Page {
  return {
    ...note,
    kind: 'page',
    parentId: note.parentId ?? null,
  }
}

function withParentId(item: SidebarItem): SidebarItem {
  return { ...item, parentId: item.parentId ?? null }
}

function isValidItem(item: unknown): item is SidebarItem {
  if (!item || typeof item !== 'object') return false
  const record = item as SidebarItem
  if (typeof record.id !== 'string' || typeof record.title !== 'string') return false
  if (typeof record.updatedAt !== 'string') return false
  if (
    record.parentId !== null &&
    record.parentId !== undefined &&
    typeof record.parentId !== 'string'
  ) {
    return false
  }

  if (record.kind === 'page') {
    return typeof record.content === 'string'
  }

  if (record.kind === 'link') {
    return typeof record.url === 'string' && normalizeUrl(record.url) !== null
  }

  return false
}

function normalizeItems(items: SidebarItem[]): SidebarItem[] {
  const withParents = items.map(withParentId)
  const ids = new Set(withParents.map(item => item.id))

  return withParents.map(item => {
    if (item.parentId && !ids.has(item.parentId)) {
      return { ...item, parentId: null }
    }
    return item
  })
}

function loadLegacyState(): { items: SidebarItem[]; activeId: string | null } | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { notes: Note[]; activeId: string | null }
    if (!Array.isArray(parsed.notes) || parsed.notes.length === 0) return null

    const items = parsed.notes.map(toPage)
    const activeId =
      parsed.activeId && items.some(item => item.id === parsed.activeId)
        ? parsed.activeId
        : items[0].id

    return { items, activeId }
  } catch {
    return null
  }
}

function loadState(): { items: SidebarItem[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const legacy = loadLegacyState()
      if (legacy) return legacy

      const items = seedItems()
      return { items, activeId: items[0]?.id ?? null }
    }

    const parsed = JSON.parse(raw) as { items: SidebarItem[]; activeId: string | null }
    const items = normalizeItems(
      Array.isArray(parsed.items) ? parsed.items.filter(isValidItem) : [],
    )

    if (items.length === 0) {
      const seeded = seedItems()
      return { items: seeded, activeId: seeded[0]?.id ?? null }
    }

    const activeId =
      parsed.activeId && items.some(item => item.id === parsed.activeId)
        ? parsed.activeId
        : items[0].id

    return { items, activeId }
  } catch {
    const items = seedItems()
    return { items, activeId: items[0]?.id ?? null }
  }
}

export function useNotes() {
  const [items, setItems] = useState<SidebarItem[]>(() => loadState().items)
  const [activeId, setActiveId] = useState<string | null>(() => loadState().activeId)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, activeId }))
  }, [items, activeId])

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
    items,
    activeItem,
    activeId,
    selectItem,
    addPage,
    addLink,
    updatePage,
    updateLink,
    deleteItem,
  }
}
