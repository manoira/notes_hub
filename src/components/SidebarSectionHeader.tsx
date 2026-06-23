import { useEffect, useRef, useState } from 'react'
import type { SidebarSection } from '../types/workspace'

type SidebarSectionHeaderProps = {
  section: SidebarSection
  onToggleCollapsed: () => void
  onRename: (title: string) => void
  onDelete: () => void
  onAddPage: () => void
  onAddLink: () => void
}

export function SidebarSectionHeader({
  section,
  onToggleCollapsed,
  onRename,
  onDelete,
  onAddPage,
  onAddLink,
}: SidebarSectionHeaderProps) {
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(section.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) {
      setDraftTitle(section.title)
    }
  }, [section.title, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commitTitle() {
    const next = draftTitle.trim() || 'Untitled section'
    onRename(next)
    setEditing(false)
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <button
          type="button"
          className="sidebar-section-toggle"
          aria-label={section.collapsed ? 'Expand section' : 'Collapse section'}
          aria-expanded={!section.collapsed}
          onClick={onToggleCollapsed}
        >
          {section.collapsed ? '▸' : '▾'}
        </button>

        {editing ? (
          <input
            ref={inputRef}
            className="sidebar-section-title-input"
            value={draftTitle}
            onChange={event => setDraftTitle(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitTitle()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setDraftTitle(section.title)
                setEditing(false)
              }
            }}
            aria-label="Section name"
          />
        ) : (
          <button
            type="button"
            className="sidebar-section-title"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {section.title || 'Untitled section'}
          </button>
        )}

        <div className="sidebar-section-actions">
          <button
            type="button"
            className="note-tree-action"
            title="Add page to section"
            aria-label={`Add page to ${section.title}`}
            onClick={onAddPage}
          >
            +
          </button>
          <button
            type="button"
            className="note-tree-action"
            title="Add smart link to section"
            aria-label={`Add smart link to ${section.title}`}
            onClick={onAddLink}
          >
            ↗
          </button>
          <button
            type="button"
            className="note-tree-action sidebar-section-delete"
            title="Delete section"
            aria-label={`Delete section ${section.title}`}
            onClick={onDelete}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
