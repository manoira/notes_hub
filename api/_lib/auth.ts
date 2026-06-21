import type { VercelRequest, VercelResponse } from '@vercel/node'

export function getBearerToken(req: VercelRequest): string {
  const header = req.headers.authorization ?? ''
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
}

export function requireWorkspaceAuth(req: VercelRequest, res: VercelResponse): boolean {
  const workspaceToken = process.env.WORKSPACE_TOKEN ?? ''
  if (!workspaceToken) return true

  if (getBearerToken(req) !== workspaceToken) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }

  return true
}
