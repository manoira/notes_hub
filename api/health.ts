import { hasRedisEnv } from '../lib/workspace-api/types'

export default async function handler() {
  try {
    return Response.json({
      ok: true,
      storage: hasRedisEnv() ? 'redis' : 'memory',
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Health check failed.',
      },
      { status: 500 },
    )
  }
}
