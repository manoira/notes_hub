import { useEffect, useRef, useState } from 'react'
import type { Page } from '../types/note'
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
  const menuOpenRef = useRef(false)
  const [menuCommands, setMenuCommands] = useState<SlashCommand[]>([])
  const [menuQuery, setMenuQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)

  useEffect(() => {
    closeSlashMenu()
  }, [note.id])

  function closeSlashMenu() {
    menuOpenRef.current = false
    setSlashMenuOpen(false)
    setMenuCommands([])
    setMenuQuery('')
    setSelectedIndex(0)
  }

  function openSlashMenu(content: string, cursor: number) {
    const state = getSlashMenuState(content, cursor)
    if (!state) {
      closeSlashMenu()
      return
    }

    const commands = filterSlashCommands(state.query)
    menuOpenRef.current = true
    setSlashMenuOpen(true)
    setMenuCommands(commands)
    setMenuQuery(state.query)
    setSelectedIndex(current => (current < commands.length ? current : 0))
  }

  function syncSlashMenu(content: string, cursor: number) {
    openSlashMenu(content, cursor)
  }

  function syncSlashMenuFromTextarea() {
    const textarea = bodyRef.current
    if (!textarea) return
    syncSlashMenu(textarea.value, textarea.selectionStart)
  }

  function selectSlashCommand(command: SlashCommand) {
    const textarea = bodyRef.current
    if (!textarea) return

    const state = getSlashMenuState(textarea.value, textarea.selectionStart)
    if (!state) return

    const result = applySlashCommand(textarea.value, state, command)
    onChange({ content: result.content })
    closeSlashMenu()

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.cursor, result.cursor)
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget

    if (
      !menuOpenRef.current &&
      event.key === '/' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const { selectionStart, selectionEnd, value } = textarea
      const nextValue =
        value.slice(0, selectionStart) + '/' + value.slice(selectionEnd)
      requestAnimationFrame(() => {
        openSlashMenu(nextValue, selectionStart + 1)
      })
    }

    if (!menuOpenRef.current) return

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
          placeholder="Start writing... Type / for headings, lists, and more."
          aria-label="Note content"
        />
        {slashMenuOpen && (
          <SlashMenu
            commands={menuCommands}
            selectedIndex={selectedIndex}
            query={menuQuery}
            onSelect={selectSlashCommand}
            onHover={setSelectedIndex}
          />
        )}
      </div>
      <p className="editor-storage-hint">
        Notes are saved in this browser only (not on the server yet).
      </p>
    </section>
  )
}
