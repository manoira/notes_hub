import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireWorkspaceAuth } from '../_lib/auth.js'
import type { WorkspaceRecord } from '../_lib/types.js'
import { loadWorkspace, updateWorkspace } from '../_lib/workspaceStore.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
        sections: body.sections,
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
          sections: current.sections,
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
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Workspace request failed.',
    })
  }
}
