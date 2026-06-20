import { bumpSnapshot, loadLocalSnapshot, saveLocalSnapshot } from './workspace'
import type { WorkspaceStorage } from './types'

export const localWorkspaceStorage: WorkspaceStorage = {
  mode: 'local',

  async load() {
    return loadLocalSnapshot()
  },

  async save(snapshot) {
    saveLocalSnapshot(bumpSnapshot(snapshot))
  },
}
