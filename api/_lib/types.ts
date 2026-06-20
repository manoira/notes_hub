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

export function getRedisRestConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? ''

  if (!url || !token) return null
  return { url: url.replace(/\/$/, ''), token }
}

type RedisCommandResponse = {
  result?: unknown
  error?: string
}

export async function redisCommand(command: unknown[]): Promise<unknown> {
  const config = getRedisRestConfig()
  if (!config) {
    throw new Error('Redis is not configured.')
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })

  if (!response.ok) {
    throw new Error(`Redis request failed (${response.status}).`)
  }

  const payload = (await response.json()) as RedisCommandResponse
  if (payload.error) {
    throw new Error(payload.error)
  }

  return payload.result
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const result = await redisCommand(['GET', key])
  if (result === null || result === undefined) return null
  if (typeof result === 'string') {
    try {
      return JSON.parse(result) as T
    } catch {
      return null
    }
  }
  return result as T
}

export async function redisSetJson(key: string, value: unknown): Promise<void> {
  await redisCommand(['SET', key, JSON.stringify(value)])
}
