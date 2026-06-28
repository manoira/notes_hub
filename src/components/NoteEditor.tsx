import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { InfoPanel, Page, PageCover, PageTypography, SmartLink } from '../types/note'
import type { PersistenceState } from '../types/workspace'
import { useGoogleFont } from '../hooks/useGoogleFont'
import { getTextareaCaretRect } from '../utils/caretPosition'
import {
  DEFAULT_BODY_FONT,
  DEFAULT_HEADING_FONT,
  fontFamilyCss,
} from '../utils/pageFonts'
import {
  applySlashCommand,
  filterSlashCommands,
  getSlashMenuState,
  removeSlashQuery,
  type SlashCommand,
  type SlashMenuState,
} from '../utils/slashCommands'
import { storageHint } from '../utils/storageHint'
import { InfoPanels } from './InfoPanels'
import { PageCover as PageCoverBanner } from './PageCover'
import { PageLinkBookmarks } from './PageLinkBookmarks'
import { PageTypographyPicker } from './PageTypographyPicker'
import { SlashMenu } from './SlashMenu'

type NoteEditorProps = {
  note: Page
  childLinks?: SmartLink[]
  onSelectLink?: (id: string) => void
  persistence: PersistenceState
  onChange: (patch: Partial<Pick<Page, 'title' | 'content' | 'panels' | 'cover' | 'typography'>>) => void
  onDelete: () => void
}

export function NoteEditor({
  note,
  childLinks = [],
  onSelectLink,
  persistence,
  onChange,
  onDelete,
}: NoteEditorProps) {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [cursor, setCursor] = useState(0)
  const [slashState, setSlashState] = useState<SlashMenuState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 360 })
  const [autoFocusPanelId, setAutoFocusPanelId] = useState<string | null>(null)

  const panels = note.panels ?? []
  const headingFont = note.typography?.headingFont ?? DEFAULT_HEADING_FONT
  const bodyFont = note.typography?.bodyFont ?? DEFAULT_BODY_FONT
  const hasCover = Boolean(note.cover)
  const menuCommands = slashState ? filterSlashCommands(slashState.query) : []

  useGoogleFont(headingFont, bodyFont)

  useEffect(() => {
    setCursor(0)
    setSlashState(null)
    setSelectedIndex(0)
    setAutoFocusPanelId(null)
  }, [note.id])

  const handlePanelsChange = useCallback(
    (next: InfoPanel[]) => onChange({ panels: next }),
    [onChange],
  )

  const handleCoverChange = useCallback(
    (cover: PageCover | null) => onChange({ cover }),
    [onChange],
  )

  const handleTypographyChange = useCallback(
    (typography: PageTypography) => onChange({ typography }),
    [onChange],
  )

  const clearAutoFocusPanel = useCallback(() => setAutoFocusPanelId(null), [])

  function insertInformationPanel() {
    const panel: InfoPanel = { id: crypto.randomUUID(), icon: '💡', text: '' }
    onChange({ panels: [...panels, panel] })
    setAutoFocusPanelId(panel.id)
  }

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

    if (command.kind === 'panel') {
      const result = removeSlashQuery(textarea.value, slashState)
      onChange({ content: result.content })
      setSlashState(null)
      setCursor(result.cursor)
      insertInformationPanel()
      return
    }

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
      <PageCoverBanner cover={note.cover} onChange={handleCoverChange} />
      <div className={`editor-page${hasCover ? ' editor-page-has-cover' : ''}`}>
        <input
          className="editor-title"
          value={note.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="Untitled"
          aria-label="Note title"
          style={{ fontFamily: fontFamilyCss(headingFont, 'heading') }}
        />
        <div className="editor-meta-row">
          <span className="editor-meta">
            Edited {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <div className="editor-meta-actions">
            <PageTypographyPicker typography={note.typography} onChange={handleTypographyChange} />
            <button type="button" className="editor-delete-btn" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
        {onSelectLink ? (
          <PageLinkBookmarks links={childLinks} onSelectLink={onSelectLink} />
        ) : null}
        <div style={{ fontFamily: fontFamilyCss(bodyFont, 'body') }}>
          <InfoPanels
            panels={panels}
            autoFocusId={autoFocusPanelId}
            onChange={handlePanelsChange}
            onAutoFocusHandled={clearAutoFocusPanel}
          />
        </div>
        <div className="editor-body-wrap">
        <textarea
          ref={bodyRef}
          className="editor-body"
          value={note.content}
          style={{ fontFamily: fontFamilyCss(bodyFont, 'body') }}
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
      </div>
      <p className="editor-storage-hint">{storageHint(persistence)}</p>
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
