import type { PersistenceState } from '../types/workspace'
import { storageModeLabel } from '../storage'

type SyncStatusProps = {
  persistence: PersistenceState
}

function statusMessage(persistence: PersistenceState): string {
  switch (persistence.status) {
    case 'loading':
      return 'Loading…'
    case 'ready':
      return storageModeLabel(persistence.mode)
    case 'saving':
      return persistence.mode === 'remote' ? 'Syncing…' : 'Saving…'
    case 'saved':
      return persistence.mode === 'remote' ? 'Synced' : 'Saved in this browser'
    case 'error':
      return persistence.message
  }
}

function statusClass(persistence: PersistenceState): string {
  if (persistence.status === 'error') return 'sync-status sync-status-error'
  if (persistence.status === 'loading') return 'sync-status sync-status-local'
  if (persistence.status === 'saved' && persistence.mode === 'remote') {
    return 'sync-status sync-status-synced'
  }
  if (persistence.mode === 'remote') return 'sync-status sync-status-remote'
  return 'sync-status sync-status-local'
}

export function SyncStatus({ persistence }: SyncStatusProps) {
  return (
    <p className={statusClass(persistence)} title={statusMessage(persistence)}>
      {statusMessage(persistence)}
    </p>
  )
}
