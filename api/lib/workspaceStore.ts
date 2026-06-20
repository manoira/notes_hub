import { Redis } from '@upstash/redis'
import { emptyWorkspace, normalizeWorkspace, type WorkspaceRecord } from './types'

const WORKSPACE_KEY = 'notes_hub:workspace'

let memoryFallback: WorkspaceRecord | null = null

function createRedisClient(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Redis.fromEnv()
  }

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }

  return null
}

function hasRedisConfig(): boolean {
  return createRedisClient() !== null
}

export async function loadWorkspace(): Promise<WorkspaceRecord> {
  const redis = createRedisClient()

  if (redis) {
    const stored = await redis.get<WorkspaceRecord>(WORKSPACE_KEY)
    return stored ? normalizeWorkspace(stored) : emptyWorkspace()
  }

  return memoryFallback ? normalizeWorkspace(memoryFallback) : emptyWorkspace()
}

export async function saveWorkspace(record: WorkspaceRecord): Promise<void> {
  const normalized = normalizeWorkspace(record)
  const redis = createRedisClient()

  if (redis) {
    await redis.set(WORKSPACE_KEY, normalized)
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

export function storageBackendLabel(): 'redis' | 'memory' {
  return hasRedisConfig() ? 'redis' : 'memory'
}
