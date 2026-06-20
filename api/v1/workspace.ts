import { requireWorkspaceAuth } from '../_lib/auth.js'
import type { WorkspaceRecord } from '../_lib/types.js'
import { loadWorkspace, updateWorkspace } from '../_lib/workspaceStore.js'

export default async function handler(request: Request) {
  try {
    const authError = requireWorkspaceAuth(request)
    if (authError) return authError

    if (request.method === 'GET') {
      const record = await loadWorkspace()
      return Response.json(record)
    }

    if (request.method === 'PUT') {
      const body = (await request.json()) as WorkspaceRecord

      if (!body || typeof body !== 'object' || !Array.isArray(body.items)) {
        return Response.json({ error: 'Invalid workspace payload.' }, { status: 400 })
      }

      if (typeof body.revision !== 'number') {
        return Response.json({ error: 'Missing workspace revision.' }, { status: 400 })
      }

      const result = await updateWorkspace({
        items: body.items,
        activeId: body.activeId ?? null,
        revision: body.revision,
        updatedAt: body.updatedAt ?? new Date().toISOString(),
      })

      if (!result.ok) {
        const current = await loadWorkspace()
        return Response.json(
          {
            error: 'Workspace conflict.',
            conflict: true,
            serverRevision: result.serverRevision,
            revision: current.revision,
            items: current.items,
            activeId: current.activeId,
            updatedAt: current.updatedAt,
          },
          { status: 409 },
        )
      }

      return Response.json(result.record)
    }

    return Response.json({ error: 'Method not allowed.' }, {
      status: 405,
      headers: { Allow: 'GET, PUT' },
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Workspace request failed.',
      },
      { status: 500 },
    )
  }
}
