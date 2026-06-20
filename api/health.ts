import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hasRedisEnv } from '../lib/workspace-api/types'
import { loadWorkspace } from '../lib/workspace-api/workspaceStore'

export const config = {
  runtime: 'nodejs',
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const storage = hasRedisEnv() ? 'redis' : 'memory'

    if (storage === 'redis') {
      await loadWorkspace()
    }

    res.status(200).json({ ok: true, storage })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Health check failed.',
    })
  }
}
