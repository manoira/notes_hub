import type { Note, Page, SidebarItem, SmartLink } from '../types/note'
import type { WorkspaceSnapshot } from '../types/workspace'
import { normalizeUrl, titleFromUrl } from '../utils/url'

export const STORAGE_KEY = 'notes_hub_v2'
export const LEGACY_STORAGE_KEY = 'notes_hub_v1'

export function createPage(title = 'Untitled', parentId: string | null = null): Page {
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

export function createLink(
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

export function seedItems(): SidebarItem[] {
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

export function isValidItem(item: unknown): item is SidebarItem {
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

export function normalizeItems(items: SidebarItem[]): SidebarItem[] {
  const withParents = items.map(withParentId)
  const ids = new Set(withParents.map(item => item.id))

  return withParents.map(item => {
    if (item.parentId && !ids.has(item.parentId)) {
      return { ...item, parentId: null }
    }
    return item
  })
}

function resolveActiveId(items: SidebarItem[], activeId: string | null): string | null {
  if (activeId && items.some(item => item.id === activeId)) return activeId
  return items[0]?.id ?? null
}

export function createSnapshot(
  items: SidebarItem[],
  activeId: string | null,
  revision = 0,
): WorkspaceSnapshot {
  const normalized = normalizeItems(items)
  return {
    items: normalized,
    activeId: resolveActiveId(normalized, activeId),
    revision,
    updatedAt: new Date().toISOString(),
  }
}

function loadLegacyState(): WorkspaceSnapshot | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { notes: Note[]; activeId: string | null }
    if (!Array.isArray(parsed.notes) || parsed.notes.length === 0) return null

    const items = parsed.notes.map(toPage)
    return createSnapshot(items, parsed.activeId, 0)
  } catch {
    return null
  }
}

export function loadLocalSnapshot(): WorkspaceSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const legacy = loadLegacyState()
      if (legacy) return legacy

      const items = seedItems()
      return createSnapshot(items, items[0]?.id ?? null, 0)
    }

    const parsed = JSON.parse(raw) as {
      items?: SidebarItem[]
      activeId?: string | null
      revision?: number
      updatedAt?: string
    }

    const items = normalizeItems(
      Array.isArray(parsed.items) ? parsed.items.filter(isValidItem) : [],
    )

    if (items.length === 0) {
      const seeded = seedItems()
      return createSnapshot(seeded, seeded[0]?.id ?? null, 0)
    }

    return {
      items,
      activeId: resolveActiveId(items, parsed.activeId ?? null),
      revision: typeof parsed.revision === 'number' ? parsed.revision : 0,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    const items = seedItems()
    return createSnapshot(items, items[0]?.id ?? null, 0)
  }
}

export function saveLocalSnapshot(snapshot: WorkspaceSnapshot): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function hasLocalSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null || localStorage.getItem(LEGACY_STORAGE_KEY) !== null
}

export function bumpSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    ...snapshot,
    revision: snapshot.revision + 1,
    updatedAt: new Date().toISOString(),
  }
}
