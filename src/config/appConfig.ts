import type { StorageMode } from '../types/workspace'

function readStorageMode(): StorageMode {
  const raw = import.meta.env.VITE_STORAGE_MODE
  return raw === 'remote' ? 'remote' : 'local'
}

export const appConfig = {
  storageMode: readStorageMode(),
  /** Base URL for the Notes Hub API. Leave empty on Vercel (same-origin /api/...). */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
  /** Bearer token that identifies the workspace (single-user MVP). */
  workspaceToken: import.meta.env.VITE_WORKSPACE_TOKEN ?? '',
  saveDebounceMs: 600,
} as const

export function isRemoteStorageConfigured(): boolean {
  return appConfig.storageMode === 'remote'
}

/** False when remote sync is enabled but the build has no usable API token. */
export function isWorkspaceTokenConfigured(): boolean {
  const token = appConfig.workspaceToken.trim()
  if (!token) return false
  // Common misconfiguration: copying VITE_STORAGE_MODE value into VITE_WORKSPACE_TOKEN.
  if (token === 'remote' || token === 'local') return false
  return true
}
