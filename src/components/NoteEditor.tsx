import { useEffect, useRef, useState } from 'react'
import type { Page } from '../types/note'
import {
  applyHeadingAtCursor,
  currentHeadingAtCursor,
  type HeadingLevel,
} from '../utils/heading'

type NoteEditorProps = {
  note: Page
  onChange: (patch: Partial<Pick<Page, 'title' | 'content'>>) => void
  onDelete: () => void
}

const HEADING_OPTIONS: { level: HeadingLevel; label: string }[] = [
  { level: 0, label: 'Normal text' },
  { level: 1, label: 'Heading 1' },
  { level: 2, label: 'Heading 2' },
  { level: 3, label: 'Heading 3' },
]

export function NoteEditor({ note, onChange, onDelete }: NoteEditorProps) {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [activeHeading, setActiveHeading] = useState<HeadingLevel>(0)

  useEffect(() => {
    setActiveHeading(0)
  }, [note.id])

  function syncHeadingFromCursor() {
    const textarea = bodyRef.current
    if (!textarea) return
    setActiveHeading(currentHeadingAtCursor(note.content, textarea.selectionStart))
  }

  function applyHeading(level: HeadingLevel) {
    const textarea = bodyRef.current
    if (!textarea) return

    const cursor = textarea.selectionStart
    const result = applyHeadingAtCursor(note.content, cursor, level)
    onChange({ content: result.content })
    setActiveHeading(level)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.cursor, result.cursor)
    })
  }

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
      <div className="editor-format-toolbar">
        <label className="editor-format-label" htmlFor={`heading-format-${note.id}`}>
          Text format
        </label>
        <select
          id={`heading-format-${note.id}`}
          className="editor-format-select"
          value={activeHeading}
          onChange={event => applyHeading(Number(event.target.value) as HeadingLevel)}
        >
          {HEADING_OPTIONS.map(option => (
            <option key={option.level} value={option.level}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="editor-format-buttons" role="group" aria-label="Heading format">
          {HEADING_OPTIONS.filter(option => option.level > 0).map(option => (
            <button
              key={option.level}
              type="button"
              className="btn-secondary btn-inline editor-format-btn"
              onClick={() => applyHeading(option.level)}
            >
              H{option.level}
            </button>
          ))}
        </div>
      </div>
      <textarea
        ref={bodyRef}
        className="editor-body"
        value={note.content}
        onChange={e => onChange({ content: e.target.value })}
        onKeyUp={syncHeadingFromCursor}
        onClick={syncHeadingFromCursor}
        onSelect={syncHeadingFromCursor}
        placeholder="Start writing..."
        aria-label="Note content"
      />
    </section>
  )
}
