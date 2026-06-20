import type { VercelRequest, VercelResponse } from '@vercel/node'
import { storageBackendLabel } from './lib/workspaceStore'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    storage: storageBackendLabel(),
  })
}
