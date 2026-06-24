import type { Note, Page, SidebarItem, SmartLink } from '../types/note'
import type { SidebarSection, WorkspaceSnapshot } from '../types/workspace'
import { assignMissingOrders } from '../utils/itemOrder'
import { normalizeUrl, titleFromUrl } from '../utils/url'

export const STORAGE_KEY = 'notes_hub_v2'
export const LEGACY_STORAGE_KEY = 'notes_hub_v1'

export function createPage(
  title = 'Untitled',
  parentId: string | null = null,
  sectionId: string | null = null,
): Page {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    kind: 'page',
    title,
    content: '',
    parentId,
    sectionId: parentId ? null : sectionId,
    updatedAt: now,
  }
}

export function createLink(
  url: string,
  title?: string,
  parentId: string | null = null,
  sectionId: string | null = null,
): SmartLink {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    kind: 'link',
    title: title?.trim() || titleFromUrl(url),
    url,
    parentId,
    sectionId: parentId ? null : sectionId,
    updatedAt: now,
  }
}

export function createSection(title = 'New section', order = 0): SidebarSection {
  return {
    id: crypto.randomUUID(),
    title,
    order,
    collapsed: false,
  }
}

export function seedWorkspace(): { items: SidebarItem[]; sections: SidebarSection[] } {
  const section = createSection('General', 0)
  const welcome = createPage('Welcome', null, section.id)
  welcome.order = 0
  welcome.content =
    'Notes Hub is your space for notes and data.\n\nUse the sidebar to switch pages, add smart links, or create new ones.'

  const ideas = createPage('Ideas', null, section.id)
  ideas.order = 1
  ideas.content = '- Project roadmap\n- Meeting notes\n- Research links'

  const repo = createLink(
    'https://github.com/manoira/notes_hub',
    'notes_hub on GitHub',
    null,
    section.id,
  )
  repo.order = 2

  return { items: [welcome, ideas, repo], sections: [section] }
}

export function seedItems(): SidebarItem[] {
  return seedWorkspace().items
}

export function seedSections(): SidebarSection[] {
  return seedWorkspace().sections
}

function toPage(note: Note): Page {
  return {
    ...note,
    kind: 'page',
    parentId: note.parentId ?? null,
    sectionId: note.sectionId ?? null,
  }
}

function withDefaults(item: SidebarItem): SidebarItem {
  return {
    ...item,
    parentId: item.parentId ?? null,
    sectionId: item.parentId ? null : (item.sectionId ?? null),
  }
}

export function isValidSection(section: unknown): section is SidebarSection {
  if (!section || typeof section !== 'object') return false
  const record = section as SidebarSection
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.order === 'number'
  )
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
  if (
    record.sectionId !== null &&
    record.sectionId !== undefined &&
    typeof record.sectionId !== 'string'
  ) {
    return false
  }

  if (
    record.order !== null &&
    record.order !== undefined &&
    typeof record.order !== 'number'
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

export function normalizeSections(sections: SidebarSection[]): SidebarSection[] {
  return sections
    .filter(isValidSection)
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({
      ...section,
      order: index,
      collapsed: section.collapsed ?? false,
    }))
}

export function normalizeItems(
  items: SidebarItem[],
  sections: SidebarSection[],
): SidebarItem[] {
  const sectionIds = new Set(sections.map(section => section.id))
  const withParents = items.map(withDefaults)
  const ids = new Set(withParents.map(item => item.id))

  return withParents.map(item => {
    let next = item

    if (next.parentId && !ids.has(next.parentId)) {
      next = { ...next, parentId: null }
    }

    if (next.sectionId && !sectionIds.has(next.sectionId)) {
      next = { ...next, sectionId: null }
    }

    if (next.parentId) {
      next = { ...next, sectionId: null }
    }

    return next
  })
}

function resolveActiveId(items: SidebarItem[], activeId: string | null): string | null {
  if (activeId && items.some(item => item.id === activeId)) return activeId
  return items[0]?.id ?? null
}

export function createSnapshot(
  items: SidebarItem[],
  sections: SidebarSection[],
  activeId: string | null,
  revision = 0,
): WorkspaceSnapshot {
  const normalizedSections = normalizeSections(sections)
  const normalized = assignMissingOrders(normalizeItems(items, normalizedSections))
  return {
    items: normalized,
    sections: normalizedSections,
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
    return createSnapshot(items, [], parsed.activeId, 0)
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

      const { items, sections } = seedWorkspace()
      return createSnapshot(items, sections, items[0]?.id ?? null, 0)
    }

    const parsed = JSON.parse(raw) as {
      items?: SidebarItem[]
      sections?: SidebarSection[]
      activeId?: string | null
      revision?: number
      updatedAt?: string
    }

    const sections = normalizeSections(
      Array.isArray(parsed.sections) ? parsed.sections.filter(isValidSection) : [],
    )
    const items = assignMissingOrders(
      normalizeItems(
        Array.isArray(parsed.items) ? parsed.items.filter(isValidItem) : [],
        sections,
      ),
    )

    if (items.length === 0) {
      const seeded = seedWorkspace()
      return createSnapshot(seeded.items, seeded.sections, seeded.items[0]?.id ?? null, 0)
    }

    return {
      items,
      sections,
      activeId: resolveActiveId(items, parsed.activeId ?? null),
      revision: typeof parsed.revision === 'number' ? parsed.revision : 0,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    const seeded = seedWorkspace()
    return createSnapshot(seeded.items, seeded.sections, seeded.items[0]?.id ?? null, 0)
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
