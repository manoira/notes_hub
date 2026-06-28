import { put } from '@vercel/blob'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireWorkspaceAuth } from '../_lib/auth.js'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (!requireWorkspaceAuth(req, res)) return

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: 'Blob storage is not configured.' })
    return
  }

  const body = req.body as {
    filename?: string
    contentType?: string
    data?: string
  }

  if (!body?.data || typeof body.data !== 'string') {
    res.status(400).json({ error: 'Missing file data.' })
    return
  }

  const contentType = body.contentType ?? 'application/octet-stream'
  if (!ALLOWED_TYPES.has(contentType)) {
    res.status(400).json({ error: 'Unsupported image type.' })
    return
  }

  try {
    const buffer = Buffer.from(body.data, 'base64')
    if (buffer.length > MAX_BYTES) {
      res.status(400).json({ error: 'Image exceeds 5 MB limit.' })
      return
    }

    const safeName = (body.filename ?? 'cover.jpg').replace(/[^\w.-]+/g, '-')
    const pathname = `covers/${Date.now()}-${safeName}`

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    res.status(200).json({ url: blob.url })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Upload failed.',
    })
  }
}
