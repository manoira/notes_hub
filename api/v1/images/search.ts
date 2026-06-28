import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireWorkspaceAuth } from '../../_lib/auth.js'

type UnsplashPhoto = {
  id: string
  alt_description: string | null
  description: string | null
  urls: { regular: string; small: string }
  user: { name: string; links: { html: string } }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (!requireWorkspaceAuth(req, res)) return

  const accessKey = process.env.UNSPLASH_ACCESS_KEY ?? ''
  if (!accessKey) {
    res.status(503).json({ error: 'Unsplash is not configured.' })
    return
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!query) {
    res.status(400).json({ error: 'Missing search query.' })
    return
  }

  const page = typeof req.query.page === 'string' ? Math.max(1, Number(req.query.page) || 1) : 1

  try {
    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: '20',
      orientation: 'landscape',
    })

    const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    })

    if (!response.ok) {
      res.status(response.status).json({ error: 'Unsplash search failed.' })
      return
    }

    const body = (await response.json()) as { results: UnsplashPhoto[] }
    const results = (body.results ?? []).map(photo => ({
      id: photo.id,
      url: `${photo.urls.regular}&w=1400&h=320&fit=crop&auto=format`,
      thumbUrl: photo.urls.small,
      alt: photo.alt_description ?? photo.description ?? query,
      attribution: photo.user.name,
      photographerUrl: photo.user.links.html,
    }))

    res.status(200).json({ results })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Image search failed.',
    })
  }
}
