import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { requireWorkspaceAuth } from './middleware/auth.js'
import { workspaceRouter } from './routes/workspace.js'

const app = express()

app.use(
  cors({
    origin: config.corsOrigin,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/v1/workspace', requireWorkspaceAuth, workspaceRouter)

app.listen(config.port, () => {
  console.log(`Notes Hub API listening on http://localhost:${config.port}`)
  if (!config.requireAuth) {
    console.warn('WORKSPACE_TOKEN is not set — API accepts unauthenticated requests.')
  }
})
