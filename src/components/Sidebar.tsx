import type { Note } from '../types/note'

type SidebarProps = {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function Sidebar({ notes, activeId, onSelect, onAdd }: SidebarProps) {
  const sorted = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Notes Hub</h1>
        <button type="button" className="btn-primary" onClick={onAdd}>
          + New page
        </button>
      </div>
      <nav className="note-list" aria-label="Notes">
        {sorted.map(note => (
          <button
            key={note.id}
            type="button"
            className={`note-item${note.id === activeId ? ' active' : ''}`}
            onClick={() => onSelect(note.id)}
          >
            <span className="note-item-title">{note.title || 'Untitled'}</span>
            <span className="note-item-date">{formatDate(note.updatedAt)}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
