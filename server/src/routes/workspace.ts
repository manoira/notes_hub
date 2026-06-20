import { Router } from 'express'
import { loadWorkspace, updateWorkspace } from '../storage/fileStore.js'
import type { WorkspaceRecord } from '../types.js'

export const workspaceRouter = Router()

workspaceRouter.get('/', async (_req, res) => {
  const record = await loadWorkspace()
  res.json(record)
})

workspaceRouter.put('/', async (req, res) => {
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

  res.json(result.record)
})
