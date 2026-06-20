import type { StorageMode, WorkspaceSnapshot } from '../types/workspace'

export type WorkspaceStorage = {
  readonly mode: StorageMode
  load(): Promise<WorkspaceSnapshot>
  save(snapshot: WorkspaceSnapshot): Promise<void>
}

export class WorkspaceConflictError extends Error {
  readonly serverRevision: number

  constructor(serverRevision: number) {
    super('Workspace was updated on another device.')
    this.name = 'WorkspaceConflictError'
    this.serverRevision = serverRevision
  }
}

export class WorkspaceAuthError extends Error {
  constructor() {
    super('Could not access remote workspace. Check your sync token.')
    this.name = 'WorkspaceAuthError'
  }
}
