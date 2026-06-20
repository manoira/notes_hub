import type { NextFunction, Request, Response } from 'express'
import { config } from '../config.js'

export function requireWorkspaceAuth(req: Request, res: Response, next: NextFunction) {
  if (!config.requireAuth) {
    next()
    return
  }

  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''

  if (token !== config.workspaceToken) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}
