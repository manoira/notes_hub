import { appConfig } from '../config/appConfig'
import type { WorkspaceSnapshot } from '../types/workspace'
import {
  WorkspaceAuthError,
  WorkspaceConflictError,
  type WorkspaceStorage,
} from './types'

type RemoteWorkspaceResponse = WorkspaceSnapshot & {
  conflict?: boolean
  serverRevision?: number
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  if (appConfig.workspaceToken) {
    headers.Authorization = `Bearer ${appConfig.workspaceToken}`
  }

  return headers
}

function workspaceUrl(): string {
  const base = appConfig.apiBaseUrl
  return base ? `${base}/api/v1/workspace` : '/api/v1/workspace'
}

async function parseResponse(response: Response): Promise<RemoteWorkspaceResponse> {
  if (response.status === 401 || response.status === 403) {
    throw new WorkspaceAuthError()
  }

  const body = (await response.json().catch(() => null)) as RemoteWorkspaceResponse | null

  if (response.status === 409) {
    throw new WorkspaceConflictError(body?.serverRevision ?? body?.revision ?? 0)
  }

  if (!response.ok) {
    throw new Error(body ? JSON.stringify(body) : `Request failed (${response.status})`)
  }

  if (!body) {
    throw new Error('Empty response from workspace API.')
  }

  return body
}

export function createRemoteWorkspaceStorage(): WorkspaceStorage {
  return {
    mode: 'remote',

    async load() {
      const response = await fetch(workspaceUrl(), {
        method: 'GET',
        headers: authHeaders(),
      })

      return parseResponse(response)
    },

    async save(snapshot) {
      const response = await fetch(workspaceUrl(), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(snapshot),
      })

      await parseResponse(response)
    },
  }
}
