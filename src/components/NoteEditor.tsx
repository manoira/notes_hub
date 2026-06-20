import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Page } from '../types/note'
import { getTextareaAnchorRect } from '../utils/caretPosition'
import {
  applySlashCommand,
  filterSlashCommands,
  getSlashMenuState,
  type SlashCommand,
} from '../utils/slashCommands'
import { SlashMenu } from './SlashMenu'

declare const __APP_VERSION__: string

type NoteEditorProps = {
  note: Page
  onChange: (patch: Partial<Pick<Page, 'title' | 'content'>>) => void
  onDelete: () => void
}

export function NoteEditor({ note, onChange, onDelete }: NoteEditorProps) {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [cursor, setCursor] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 360 })

  const slashState = getSlashMenuState(note.content, cursor)
  const menuCommands = slashState ? filterSlashCommands(slashState.query) : []

  useEffect(() => {
    setCursor(0)
    setSelectedIndex(0)
  }, [note.id])

  useEffect(() => {
    setSelectedIndex(current => (current < menuCommands.length ? current : 0))
  }, [menuCommands.length, slashState?.query])

  useLayoutEffect(() => {
    const textarea = bodyRef.current
    if (!slashState || !textarea) return
    setMenuPosition(getTextareaAnchorRect(textarea))
  }, [slashState, note.content, cursor])

  function updateCursor(textarea: HTMLTextAreaElement) {
    setCursor(textarea.selectionStart)
  }

  function selectSlashCommand(command: SlashCommand) {
    const textarea = bodyRef.current
    if (!textarea || !slashState) return

    const result = applySlashCommand(note.content, slashState, command)
    onChange({ content: result.content })

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.cursor, result.cursor)
      setCursor(result.cursor)
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget
    const state = getSlashMenuState(textarea.value, textarea.selectionStart)
    if (!state) return

    const commands = filterSlashCommands(state.query)
    if (commands.length === 0) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setCursor(state.slashStart)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex(current => (current + 1) % commands.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(current => (current - 1 + commands.length) % commands.length)
      return
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      const command = commands[selectedIndex]
      if (command) selectSlashCommand(command)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setCursor(state.slashStart)
    }
  }

  return (
    <section className="editor">
      <div className="editor-toolbar">
        <span className="editor-meta">
          Last edited {new Date(note.updatedAt).toLocaleString()} · build{' '}
          {__APP_VERSION__.slice(0, 7)}
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
            setCursor(selectionStart)
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={event => updateCursor(event.currentTarget)}
          onClick={event => updateCursor(event.currentTarget)}
          onSelect={event => updateCursor(event.currentTarget)}
          onScroll={() => {
            const textarea = bodyRef.current
            if (textarea && slashState) {
              setMenuPosition(getTextareaAnchorRect(textarea))
            }
          }}
          placeholder="Start writing... Type / for headings, lists, and more."
          aria-label="Note content"
        />
      </div>
      <p className="editor-storage-hint">
        Notes are saved in this browser only (not on the server yet).
      </p>
      {slashState &&
        createPortal(
          <div
            className="slash-menu-portal"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
          >
            <SlashMenu
              commands={menuCommands}
              selectedIndex={selectedIndex}
              query={slashState.query}
              onSelect={selectSlashCommand}
              onHover={setSelectedIndex}
            />
          </div>,
          document.body,
        )}
    </section>
  )
}
