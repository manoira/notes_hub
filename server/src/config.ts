const port = Number(process.env.PORT ?? 3001)
const workspaceToken = process.env.WORKSPACE_TOKEN ?? ''
const dataFile = process.env.WORKSPACE_DATA_FILE ?? 'data/workspace.json'
const corsOrigin = process.env.CORS_ORIGIN ?? '*'

export const config = {
  port,
  workspaceToken,
  dataFile,
  corsOrigin,
  requireAuth: workspaceToken.length > 0,
} as const
