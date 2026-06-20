export type WorkspaceRecord = {
  items: unknown[]
  activeId: string | null
  revision: number
  updatedAt: string
}

export function emptyWorkspace(): WorkspaceRecord {
  return {
    items: [],
    activeId: null,
    revision: 0,
    updatedAt: new Date().toISOString(),
  }
}

export function normalizeWorkspace(value: unknown): WorkspaceRecord {
  if (!value || typeof value !== 'object') return emptyWorkspace()

  const record = value as WorkspaceRecord
  return {
    items: Array.isArray(record.items) ? record.items : [],
    activeId: typeof record.activeId === 'string' ? record.activeId : null,
    revision: typeof record.revision === 'number' ? record.revision : 0,
    updatedAt:
      typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
  }
}
