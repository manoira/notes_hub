import type { PersistenceState } from '../types/workspace'

export function storageHint(persistence: PersistenceState): string {
  if (persistence.status === 'loading') {
    return 'Loading workspace…'
  }

  if (persistence.status === 'error') {
    return persistence.message
  }

  if (persistence.mode === 'remote') {
    return 'Notes sync to your cloud workspace and follow you across devices.'
  }

  return 'Notes are saved in this browser. Enable cloud sync to use them on other devices.'
}
