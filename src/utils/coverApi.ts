import { appConfig, isWorkspaceTokenConfigured } from '../config/appConfig'

export type CoverSearchResult = {
  id: string
  url: string
  thumbUrl: string
  alt: string
  attribution: string
  photographerUrl?: string
}

function apiUrl(path: string): string {
  const base = appConfig.apiBaseUrl
  return base ? `${base}${path}` : path
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (appConfig.workspaceToken) {
    headers.Authorization = `Bearer ${appConfig.workspaceToken}`
  }
  return headers
}

export function isCoverApiAvailable(): boolean {
  return isWorkspaceTokenConfigured()
}

export async function searchCoverImages(query: string, page = 1): Promise<CoverSearchResult[]> {
  const params = new URLSearchParams({ q: query, page: String(page) })
  const response = await fetch(apiUrl(`/api/v1/images/search?${params}`), {
    headers: authHeaders(),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(body || `Search failed (${response.status})`)
  }

  const data = (await response.json()) as { results: CoverSearchResult[] }
  return data.results ?? []
}

export async function uploadCoverImage(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  const data = btoa(binary)

  const response = await fetch(apiUrl('/api/v1/uploads'), {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      data,
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(body || `Upload failed (${response.status})`)
  }

  const payload = (await response.json()) as { url: string }
  return payload.url
}
