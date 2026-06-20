import type { SidebarItem } from './note'

/** Full workspace document persisted locally or on the server. */
export type WorkspaceSnapshot = {
  items: SidebarItem[]
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
