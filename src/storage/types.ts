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
  constructor(reason: 'missing' | 'rejected' = 'rejected') {
    super(
      reason === 'missing'
        ? 'Cloud sync token missing in this build. Set VITE_WORKSPACE_TOKEN on Vercel and redeploy.'
        : 'Cloud sync rejected — VITE_WORKSPACE_TOKEN must match WORKSPACE_TOKEN on the server. Redeploy after fixing.',
    )
    this.name = 'WorkspaceAuthError'
  }
}
