import type { StorageMode } from '../types/workspace'

function readStorageMode(): StorageMode {
  const raw = import.meta.env.VITE_STORAGE_MODE
  return raw === 'remote' ? 'remote' : 'local'
}

export const appConfig = {
  storageMode: readStorageMode(),
  /** Base URL for the Notes Hub API, e.g. https://notes-hub-api.onrender.com */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
  /** Bearer token that identifies the workspace (single-user MVP). */
  workspaceToken: import.meta.env.VITE_WORKSPACE_TOKEN ?? '',
  saveDebounceMs: 600,
} as const

export function isRemoteStorageConfigured(): boolean {
  return appConfig.storageMode === 'remote'
}
