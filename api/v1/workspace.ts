import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireWorkspaceAuth } from '../lib/auth'
import { loadWorkspace, updateWorkspace } from '../lib/workspaceStore'
import type { WorkspaceRecord } from '../lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireWorkspaceAuth(req, res)) return

  if (req.method === 'GET') {
    const record = await loadWorkspace()
    res.status(200).json(record)
    return
  }

  if (req.method === 'PUT') {
    const body = req.body as WorkspaceRecord

    if (!body || typeof body !== 'object' || !Array.isArray(body.items)) {
      res.status(400).json({ error: 'Invalid workspace payload.' })
      return
    }

    if (typeof body.revision !== 'number') {
      res.status(400).json({ error: 'Missing workspace revision.' })
      return
    }

    const result = await updateWorkspace({
      items: body.items,
      activeId: body.activeId ?? null,
      revision: body.revision,
      updatedAt: body.updatedAt ?? new Date().toISOString(),
    })

    if (!result.ok) {
      const current = await loadWorkspace()
      res.status(409).json({
        error: 'Workspace conflict.',
        conflict: true,
        serverRevision: result.serverRevision,
        revision: current.revision,
        items: current.items,
        activeId: current.activeId,
        updatedAt: current.updatedAt,
      })
      return
    }

    res.status(200).json(result.record)
    return
  }

  res.setHeader('Allow', 'GET, PUT')
  res.status(405).json({ error: 'Method not allowed.' })
}
