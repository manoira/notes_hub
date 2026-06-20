import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Page } from '../types/note'
import { getTextareaCaretRect } from '../utils/caretPosition'
import {
  applySlashCommand,
  filterSlashCommands,
  getSlashMenuState,
  type SlashCommand,
} from '../utils/slashCommands'
import { SlashMenu } from './SlashMenu'

type NoteEditorProps = {
  note: Page
  onChange: (patch: Partial<Pick<Page, 'title' | 'content'>>) => void
  onDelete: () => void
}

export function NoteEditor({ note, onChange, onDelete }: NoteEditorProps) {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [menuCommands, setMenuCommands] = useState<SlashCommand[]>([])
  const [menuQuery, setMenuQuery] = useState('')
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const slashStateRef = useRef<ReturnType<typeof getSlashMenuState>>(null)

  useEffect(() => {
    closeSlashMenu()
  }, [note.id])

  function closeSlashMenu() {
    slashStateRef.current = null
    setSlashMenuOpen(false)
    setMenuCommands([])
    setMenuQuery('')
    setSelectedIndex(0)
  }

  function syncSlashMenu(content: string, cursor: number) {
    const textarea = bodyRef.current
    if (!textarea) return

    const state = getSlashMenuState(content, cursor)
    slashStateRef.current = state

    if (!state) {
      closeSlashMenu()
      return
    }

    const commands = filterSlashCommands(state.query)
    setSlashMenuOpen(true)
    setMenuCommands(commands)
    setMenuQuery(state.query)
    setSelectedIndex(current => (current < commands.length ? current : 0))
    setMenuPosition(getTextareaCaretRect(textarea, state.cursor))
  }

  function syncSlashMenuFromTextarea() {
    const textarea = bodyRef.current
    if (!textarea) return
    syncSlashMenu(textarea.value, textarea.selectionStart)
  }

  function selectSlashCommand(command: SlashCommand) {
    const textarea = bodyRef.current
    const state = slashStateRef.current
    if (!textarea || !state) return

    const result = applySlashCommand(textarea.value, state, command)
    onChange({ content: result.content })
    closeSlashMenu()

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.cursor, result.cursor)
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!slashMenuOpen) return

    if (menuCommands.length === 0) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeSlashMenu()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex(current => (current + 1) % menuCommands.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(current => (current - 1 + menuCommands.length) % menuCommands.length)
      return
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      const command = menuCommands[selectedIndex]
      if (command) selectSlashCommand(command)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeSlashMenu()
    }
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
      <div className="editor-body-wrap">
        <textarea
          ref={bodyRef}
          className="editor-body"
          value={note.content}
          onChange={event => {
            const { value, selectionStart } = event.target
            onChange({ content: value })
            syncSlashMenu(value, selectionStart)
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={syncSlashMenuFromTextarea}
          onClick={syncSlashMenuFromTextarea}
          onSelect={syncSlashMenuFromTextarea}
          onScroll={syncSlashMenuFromTextarea}
          placeholder="Start writing... Type / for headings, lists, and more."
          aria-label="Note content"
        />
        {slashMenuOpen &&
          createPortal(
            <SlashMenu
              commands={menuCommands}
              selectedIndex={selectedIndex}
              query={menuQuery}
              position={menuPosition}
              onSelect={selectSlashCommand}
              onHover={setSelectedIndex}
            />,
            document.body,
          )}
      </div>
    </section>
  )
}
