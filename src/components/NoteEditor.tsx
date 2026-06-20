import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Page, SmartLink } from '../types/note'
import { APP_VERSION } from '../buildInfo'
import { getTextareaCaretRect } from '../utils/caretPosition'
import {
  applySlashCommand,
  filterSlashCommands,
  getSlashMenuState,
  type SlashCommand,
  type SlashMenuState,
} from '../utils/slashCommands'
import { PageLinkBookmarks } from './PageLinkBookmarks'
import { SlashMenu } from './SlashMenu'

type NoteEditorProps = {
  note: Page
  childLinks?: SmartLink[]
  onSelectLink?: (id: string) => void
  onChange: (patch: Partial<Pick<Page, 'title' | 'content'>>) => void
  onDelete: () => void
}

export function NoteEditor({
  note,
  childLinks = [],
  onSelectLink,
  onChange,
  onDelete,
}: NoteEditorProps) {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [cursor, setCursor] = useState(0)
  const [slashState, setSlashState] = useState<SlashMenuState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 360 })

  const menuCommands = slashState ? filterSlashCommands(slashState.query) : []

  useEffect(() => {
    setCursor(0)
    setSlashState(null)
    setSelectedIndex(0)
  }, [note.id])

  useEffect(() => {
    setSelectedIndex(current => (current < menuCommands.length ? current : 0))
  }, [menuCommands.length, slashState?.query])

  useLayoutEffect(() => {
    const textarea = bodyRef.current
    if (!slashState || !textarea) return
    setMenuPosition(getTextareaCaretRect(textarea, slashState.cursor))
  }, [slashState, note.content, cursor])

  function syncSlashFromTextarea(textarea: HTMLTextAreaElement) {
    const position = textarea.selectionStart
    setCursor(position)
    setSlashState(getSlashMenuState(textarea.value, position))
  }

  function selectSlashCommand(command: SlashCommand) {
    const textarea = bodyRef.current
    if (!textarea || !slashState) return

    const result = applySlashCommand(textarea.value, slashState, command)
    onChange({ content: result.content })
    setSlashState(null)

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
        setSlashState(null)
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
      setSlashState(null)
      setCursor(state.slashStart)
    }
  }

  return (
    <section className="editor">
      <div className="editor-toolbar">
        <span className="editor-meta">
          Last edited {new Date(note.updatedAt).toLocaleString()} · build {APP_VERSION}
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
      {onSelectLink ? (
        <PageLinkBookmarks links={childLinks} onSelectLink={onSelectLink} />
      ) : null}
      <div className="editor-body-wrap">
        <textarea
          ref={bodyRef}
          className="editor-body"
          value={note.content}
          onChange={event => {
            const textarea = event.currentTarget
            onChange({ content: textarea.value })
            syncSlashFromTextarea(textarea)
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={event => syncSlashFromTextarea(event.currentTarget)}
          onClick={event => syncSlashFromTextarea(event.currentTarget)}
          onSelect={event => syncSlashFromTextarea(event.currentTarget)}
          onScroll={() => {
            const textarea = bodyRef.current
            if (textarea && slashState) {
              setMenuPosition(getTextareaCaretRect(textarea, slashState.cursor))
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
