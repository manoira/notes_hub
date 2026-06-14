import type { Note } from '../types/note'

type NoteEditorProps = {
  note: Note
  onChange: (patch: Partial<Pick<Note, 'title' | 'content'>>) => void
  onDelete: () => void
}

export function NoteEditor({ note, onChange, onDelete }: NoteEditorProps) {
  return (
    <section className="editor">
      <div className="editor-toolbar">
        <span className="editor-meta">
          Last edited {new Date(note.updatedAt).toLocaleString()}
        </span>
        <button type="button" className="btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
      <input
        className="editor-title"
        value={note.title}
        onChange={e => onChange({ title: e.target.value })}
        placeholder="Untitled"
        aria-label="Note title"
      />
      <textarea
        className="editor-body"
        value={note.content}
        onChange={e => onChange({ content: e.target.value })}
        placeholder="Start writing..."
        aria-label="Note content"
      />
    </section>
  )
}
