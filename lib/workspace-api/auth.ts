import type { VercelRequest, VercelResponse } from '@vercel/node'

export function requireWorkspaceAuth(req: VercelRequest, res: VercelResponse): boolean {
  const workspaceToken = process.env.WORKSPACE_TOKEN ?? ''
  if (!workspaceToken) return true

  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''

  if (token !== workspaceToken) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }

  return true
}
