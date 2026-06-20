import {
  emptyWorkspace,
  getRedisRestConfig,
  normalizeWorkspace,
  redisGetJson,
  redisSetJson,
  type WorkspaceRecord,
} from './types.js'

const WORKSPACE_KEY = 'notes_hub:workspace'

let memoryFallback: WorkspaceRecord | null = null

export async function loadWorkspace(): Promise<WorkspaceRecord> {
  if (getRedisRestConfig()) {
    const stored = await redisGetJson<WorkspaceRecord>(WORKSPACE_KEY)
    return stored ? normalizeWorkspace(stored) : emptyWorkspace()
  }

  return memoryFallback ? normalizeWorkspace(memoryFallback) : emptyWorkspace()
}

export async function saveWorkspace(record: WorkspaceRecord): Promise<void> {
  const normalized = normalizeWorkspace(record)

  if (getRedisRestConfig()) {
    await redisSetJson(WORKSPACE_KEY, normalized)
    return
  }

  memoryFallback = normalized
}

export async function updateWorkspace(
  incoming: WorkspaceRecord,
): Promise<{ ok: true; record: WorkspaceRecord } | { ok: false; serverRevision: number }> {
  const current = await loadWorkspace()

  if (incoming.revision !== current.revision) {
    return { ok: false, serverRevision: current.revision }
  }

  const next: WorkspaceRecord = {
    items: incoming.items,
    activeId: incoming.activeId,
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
  }

  await saveWorkspace(next)
  return { ok: true, record: next }
}
