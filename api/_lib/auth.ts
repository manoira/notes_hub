export function getBearerToken(request: Request): string {
  const header = request.headers.get('authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
}

export function requireWorkspaceAuth(request: Request): Response | null {
  const workspaceToken = process.env.WORKSPACE_TOKEN ?? ''
  if (!workspaceToken) return null

  if (getBearerToken(request) !== workspaceToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
