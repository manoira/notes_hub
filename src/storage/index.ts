import { appConfig, isRemoteStorageConfigured } from '../config/appConfig'
import { localWorkspaceStorage } from './localStorageAdapter'
import { createRemoteWorkspaceStorage } from './remoteStorageAdapter'
import type { WorkspaceStorage } from './types'
import { hasLocalSnapshot, loadLocalSnapshot } from './workspace'

export function createWorkspaceStorage(): WorkspaceStorage {
  if (isRemoteStorageConfigured()) {
    return createRemoteWorkspaceStorage()
  }

  return localWorkspaceStorage
}

/** Upload browser-only data to the server the first time remote sync is enabled. */
export async function migrateLocalSnapshotToRemote(storage: WorkspaceStorage): Promise<boolean> {
  if (storage.mode !== 'remote' || !hasLocalSnapshot()) return false

  const local = loadLocalSnapshot()
  const remote = await storage.load()

  if (remote.items.length > 0) return false

  await storage.save(local)
  return true
}

export function storageModeLabel(mode: WorkspaceStorage['mode']): string {
  if (mode === 'remote') return 'Cloud sync'
  return 'This browser only'
}

export function isRemoteModeRequested(): boolean {
  return appConfig.storageMode === 'remote'
}
