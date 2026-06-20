import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { emptyWorkspace, type WorkspaceRecord } from '../types.js'

async function ensureDataDir() {
  await mkdir(path.dirname(config.dataFile), { recursive: true })
}

export async function loadWorkspace(): Promise<WorkspaceRecord> {
  try {
    const raw = await readFile(config.dataFile, 'utf8')
    const parsed = JSON.parse(raw) as WorkspaceRecord
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : null,
      revision: typeof parsed.revision === 'number' ? parsed.revision : 0,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return emptyWorkspace()
  }
}

export async function saveWorkspace(record: WorkspaceRecord): Promise<void> {
  await ensureDataDir()
  await writeFile(config.dataFile, JSON.stringify(record, null, 2), 'utf8')
}

export async function updateWorkspace(
  incoming: WorkspaceRecord,
): Promise<{ ok: true; record: WorkspaceRecord } | { ok: false; serverRevision: number }> {
  const current = await loadWorkspace()

  if (incoming.revision !== current.revision) {
    return { ok: false, serverRevision: current.revision }
  }

  const next: WorkspaceRecord = {
    items: incoming.items,
    activeId: incoming.activeId,
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
  }

  await saveWorkspace(next)
  return { ok: true, record: next }
}
