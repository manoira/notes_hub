import type { SidebarItem } from './note'

/** Collapsible sidebar heading that groups top-level pages and links. */
export type SidebarSection = {
  id: string
  title: string
  /** Lower values appear first. */
  order: number
  collapsed?: boolean
}

/** Full workspace document persisted locally or on the server. */
export type WorkspaceSnapshot = {
  items: SidebarItem[]
  sections: SidebarSection[]
  activeId: string | null
  /** Monotonic counter for optimistic concurrency when syncing. */
  revision: number
  updatedAt: string
}

export type StorageMode = 'local' | 'remote'

export type PersistenceState =
  | { status: 'loading' }
  | { status: 'ready'; mode: StorageMode }
  | { status: 'saving'; mode: StorageMode }
  | { status: 'saved'; mode: StorageMode; savedAt: string }
  | { status: 'error'; mode: StorageMode; message: string }
