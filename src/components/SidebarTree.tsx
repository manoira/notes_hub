import { useEffect, useRef, useState } from 'react'
import type { SidebarItem } from '../types/note'
import type { SidebarSection } from '../types/workspace'
import type { DropPosition } from '../utils/itemOrder'
import { dropPositionFromPointer } from '../utils/itemOrder'
import { buildSidebarGroups, type TreeNode } from '../utils/tree'

type DropHint = {
  targetId: string
  position: DropPosition
}

type SidebarTreeProps = {
  items: SidebarItem[]
  sections: SidebarSection[]
  activeId: string | null
  onSelect: (id: string) => void
  onAddPage: (context?: { parentId?: string | null; sectionId?: string | null }) => void
  onAddLink: (context?: { parentId?: string | null; sectionId?: string | null }) => void
  onRenameItem: (id: string, title: string) => void
  onDeleteItem: (id: string) => void
  onDeleteSection: (id: string) => void
  onMoveItemToSection: (itemId: string, sectionId: string | null) => void
  onMoveItem: (draggedId: string, targetId: string, position: DropPosition) => void
  onMoveItemToSectionEnd: (draggedId: string, sectionId: string | null) => void
  onUpdateSectionTitle: (id: string, title: string) => void
}

type TreeRowProps = {
  node: TreeNode
  depth: number
  activeId: string | null
  collapsedIds: Set<string>
  sections: SidebarSection[]
  draggedId: string | null
  dropHint: DropHint | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onAddPage: (context?: { parentId?: string | null; sectionId?: string | null }) => void
  onAddLink: (context?: { parentId?: string | null; sectionId?: string | null }) => void
  onRenameItem: (id: string, title: string) => void
  onDeleteItem: (id: string) => void
  onMoveItemToSection: (itemId: string, sectionId: string | null) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDragOverItem: (targetId: string, position: DropPosition) => void
  onDropOnItem: (targetId: string, position: DropPosition) => void
}

function TreeRow({
  node,
  depth,
  activeId,
  collapsedIds,
  sections,
  draggedId,
  dropHint,
  onToggle,
  onSelect,
  onAddPage,
  onAddLink,
  onRenameItem,
  onDeleteItem,
  onMoveItemToSection,
  onDragStart,
  onDragEnd,
  onDragOverItem,
  onDropOnItem,
}: TreeRowProps) {
  const { item, children } = node
  const hasChildren = children.length > 0
  const isCollapsed = collapsedIds.has(item.id)
  const isActive = item.id === activeId
  const isTopLevel = depth === 0
  const isDragging = draggedId === item.id
  const rowRef = useRef<HTMLDivElement>(null)
  const showDropBefore = dropHint?.targetId === item.id && dropHint.position === 'before'
  const showDropAfter = dropHint?.targetId === item.id && dropHint.position === 'after'
  const showDropInside = dropHint?.targetId === item.id && dropHint.position === 'inside'
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(item.title)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraftTitle(item.title)
  }, [item.title, editing])

  useEffect(() => {
    if (editing) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  function commitRename() {
    const next = draftTitle.trim() || 'Untitled'
    onRenameItem(item.id, next)
    setEditing(false)
  }

  return (
    <div className="note-tree-branch">
      {showDropBefore ? <div className="note-drop-indicator" aria-hidden="true" /> : null}
      <div
        ref={rowRef}
        className={`note-item-wrap${isActive ? ' active' : ''}${isDragging ? ' dragging' : ''}${showDropInside ? ' drop-inside' : ''}`}
        style={{ paddingLeft: `${4 + depth * 12}px` }}
        onDragOver={event => {
          if (!draggedId || draggedId === item.id || !rowRef.current) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
          const position = dropPositionFromPointer(
            event.clientY,
            rowRef.current.getBoundingClientRect(),
            item.kind === 'page',
          )
          onDragOverItem(item.id, position)
        }}
        onDrop={event => {
          if (!draggedId || draggedId === item.id || !rowRef.current) return
          event.preventDefault()
          const position = dropPositionFromPointer(
            event.clientY,
            rowRef.current.getBoundingClientRect(),
            item.kind === 'page',
          )
          onDropOnItem(item.id, position)
        }}
      >
        <span
          className="note-drag-handle"
          draggable={!editing}
          title="Drag to reorder"
          aria-label={`Drag ${item.title || 'Untitled'}`}
          onDragStart={event => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', item.id)
            onDragStart(item.id)
          }}
          onDragEnd={onDragEnd}
        >
          ⠿
        </span>

        {hasChildren ? (
          <button
            type="button"
            className="note-tree-toggle"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            aria-expanded={!isCollapsed}
            onClick={event => {
              event.stopPropagation()
              onToggle(item.id)
            }}
          >
            {isCollapsed ? '▸' : '▾'}
          </button>
        ) : (
          <span className="note-tree-toggle-spacer" aria-hidden="true" />
        )}

        {editing ? (
          <input
            ref={titleInputRef}
            className="note-item-title-input"
            value={draftTitle}
            onChange={event => setDraftTitle(event.target.value)}
            onBlur={commitRename}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitRename()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setDraftTitle(item.title)
                setEditing(false)
              }
            }}
            aria-label="Page name"
          />
        ) : (
          <button
            type="button"
            className={`note-item${item.kind === 'link' ? ' note-item-link' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            {item.kind === 'link' ? (
              <span className="note-item-icon" aria-hidden="true">
                ↗
              </span>
            ) : (
              <span className="note-item-icon note-item-icon-page" aria-hidden="true">
                ◦
              </span>
            )}
            <span className="note-item-title">{item.title || 'Untitled'}</span>
          </button>
        )}

        <div className="note-tree-actions">
          <div className="note-tree-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="note-tree-action note-tree-action-ghost"
              title="More options"
              aria-label={`More options for ${item.title || 'Untitled'}`}
              aria-expanded={menuOpen}
              onClick={event => {
                event.stopPropagation()
                setMenuOpen(open => !open)
              }}
            >
              ···
            </button>
            {menuOpen ? (
              <div className="note-tree-menu" role="menu">
                <button
                  type="button"
                  className="note-tree-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    setEditing(true)
                  }}
                >
                  Rename
                </button>
                {isTopLevel && sections.length > 0 ? (
                  <>
                    <div className="note-tree-menu-label">Move to section</div>
                    <button
                      type="button"
                      className="note-tree-menu-item"
                      role="menuitem"
                      onClick={() => {
                        onMoveItemToSection(item.id, null)
                        setMenuOpen(false)
                      }}
                    >
                      Ungrouped
                    </button>
                    {sections.map(section => (
                      <button
                        key={section.id}
                        type="button"
                        className="note-tree-menu-item"
                        role="menuitem"
                        onClick={() => {
                          onMoveItemToSection(item.id, section.id)
                          setMenuOpen(false)
                        }}
                      >
                        {section.title}
                      </button>
                    ))}
                  </>
                ) : null}
                <button
                  type="button"
                  className="note-tree-menu-item note-tree-menu-item-danger"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    if (window.confirm(`Delete "${item.title || 'Untitled'}"?`)) {
                      onDeleteItem(item.id)
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="note-tree-action note-tree-action-ghost"
            title="Add subpage"
            aria-label={`Add subpage under ${item.title || 'Untitled'}`}
            onClick={event => {
              event.stopPropagation()
              onAddPage({ parentId: item.id })
            }}
          >
            +
          </button>
          <button
            type="button"
            className="note-tree-action note-tree-action-ghost"
            title="Add smart link"
            aria-label={`Add smart link under ${item.title || 'Untitled'}`}
            onClick={event => {
              event.stopPropagation()
              onAddLink({ parentId: item.id })
            }}
          >
            ↗
          </button>
        </div>
      </div>
      {showDropAfter ? <div className="note-drop-indicator" aria-hidden="true" /> : null}

      {hasChildren && !isCollapsed
        ? children.map(child => (
            <TreeRow
              key={child.item.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              collapsedIds={collapsedIds}
              sections={sections}
              draggedId={draggedId}
              dropHint={dropHint}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddPage={onAddPage}
              onAddLink={onAddLink}
              onRenameItem={onRenameItem}
              onDeleteItem={onDeleteItem}
              onMoveItemToSection={onMoveItemToSection}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOverItem={onDragOverItem}
              onDropOnItem={onDropOnItem}
            />
          ))
        : null}
    </div>
  )
}

export function SidebarTree({
  items,
  sections,
  activeId,
  onSelect,
  onAddPage,
  onAddLink,
  onRenameItem,
  onDeleteItem,
  onDeleteSection,
  onMoveItemToSection,
  onMoveItem,
  onMoveItemToSectionEnd,
  onUpdateSectionTitle,
}: SidebarTreeProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set())
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<Set<string>>(
    () => new Set(sections.map(section => section.id)),
  )
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<DropHint | null>(null)
  const groups = buildSidebarGroups(items, sections)

  useEffect(() => {
    setCollapsedSectionIds(prev => {
      const next = new Set(prev)
      let changed = false
      for (const section of sections) {
        if (!next.has(section.id)) {
          next.add(section.id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [sections])

  function toggleCollapsed(id: string) {
    setCollapsedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandSection(sectionId: string) {
    setCollapsedSectionIds(prev => {
      const next = new Set(prev)
      next.delete(sectionId)
      return next
    })
  }

  function handleAddPage(context?: { parentId?: string | null; sectionId?: string | null }) {
    onAddPage(context)
    if (context?.parentId) {
      setCollapsedIds(prev => {
        const next = new Set(prev)
        next.delete(context.parentId!)
        return next
      })
    }
    if (context?.sectionId) expandSection(context.sectionId)
  }

  function handleAddLink(context?: { parentId?: string | null; sectionId?: string | null }) {
    onAddLink(context)
    if (context?.parentId) {
      setCollapsedIds(prev => {
        const next = new Set(prev)
        next.delete(context.parentId!)
        return next
      })
    }
    if (context?.sectionId) expandSection(context.sectionId)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDropHint(null)
  }

  function handleDropOnItem(targetId: string, position: DropPosition) {
    if (!draggedId) return
    onMoveItem(draggedId, targetId, position)
    if (position === 'inside') {
      setCollapsedIds(prev => {
        const next = new Set(prev)
        next.delete(targetId)
        return next
      })
    }
    handleDragEnd()
  }

  function handleSectionDrop(sectionId: string | null) {
    if (!draggedId) return
    onMoveItemToSectionEnd(draggedId, sectionId)
    if (sectionId) expandSection(sectionId)
    handleDragEnd()
  }

  if (groups.length === 0 && sections.length === 0) {
    return <p className="sidebar-empty">No pages yet — create one above.</p>
  }

  return (
    <>
      {groups.map(group => {
        const groupKey = group.section?.id ?? 'ungrouped'
        const sectionCollapsed = group.section
          ? collapsedSectionIds.has(group.section.id)
          : false

        return (
          <div key={groupKey} className="sidebar-section-group">
            {group.section ? (
              <SidebarSectionBlock
                section={group.section}
                isCollapsed={sectionCollapsed}
                onToggleCollapsed={() =>
                  setCollapsedSectionIds(prev => {
                    const next = new Set(prev)
                    if (next.has(group.section!.id)) next.delete(group.section!.id)
                    else next.add(group.section!.id)
                    return next
                  })
                }
                onRename={title => onUpdateSectionTitle(group.section!.id, title)}
                onDelete={() => {
                  if (
                    window.confirm(
                      `Delete section "${group.section!.title}"? Pages and links will move to Ungrouped.`,
                    )
                  ) {
                    onDeleteSection(group.section!.id)
                  }
                }}
                onAddPage={() => handleAddPage({ sectionId: group.section!.id })}
                onAddLink={() => handleAddLink({ sectionId: group.section!.id })}
              />
            ) : null}

            {!sectionCollapsed ? (
              <div
                className={`sidebar-section-items${draggedId ? ' is-drop-target' : ''}`}
                onDragOver={event => {
                  if (!draggedId) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                }}
                onDrop={event => {
                  event.preventDefault()
                  handleSectionDrop(group.section?.id ?? null)
                }}
              >
                {group.nodes.map(node => (
                  <TreeRow
                    key={node.item.id}
                    node={node}
                    depth={0}
                    activeId={activeId}
                    collapsedIds={collapsedIds}
                    sections={sections}
                    draggedId={draggedId}
                    dropHint={dropHint}
                    onToggle={toggleCollapsed}
                    onSelect={onSelect}
                    onAddPage={handleAddPage}
                    onAddLink={handleAddLink}
                    onRenameItem={onRenameItem}
                    onDeleteItem={onDeleteItem}
                    onMoveItemToSection={onMoveItemToSection}
                    onDragStart={setDraggedId}
                    onDragEnd={handleDragEnd}
                    onDragOverItem={(targetId, position) =>
                      setDropHint({ targetId, position })
                    }
                    onDropOnItem={handleDropOnItem}
                  />
                ))}
                {group.section && group.nodes.length === 0 ? (
                  <p className="sidebar-section-empty">No pages in this section</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

type SidebarSectionBlockProps = {
  section: SidebarSection
  isCollapsed: boolean
  onToggleCollapsed: () => void
  onRename: (title: string) => void
  onDelete: () => void
  onAddPage: () => void
  onAddLink: () => void
}

function SidebarSectionBlock({
  section,
  isCollapsed,
  onToggleCollapsed,
  onRename,
  onDelete,
  onAddPage,
  onAddLink,
}: SidebarSectionBlockProps) {
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(section.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraftTitle(section.title)
  }, [section.title, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commitTitle() {
    onRename(draftTitle.trim() || 'Untitled section')
    setEditing(false)
  }

  return (
    <div className="sidebar-section-header-wrap">
      <div className="sidebar-section-header">
        <button
          type="button"
          className="sidebar-section-toggle"
          aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
          aria-expanded={!isCollapsed}
          onClick={onToggleCollapsed}
        >
          {isCollapsed ? '▸' : '▾'}
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
            className="note-tree-action note-tree-action-ghost"
            title="Add page to section"
            aria-label={`Add page to ${section.title}`}
            onClick={onAddPage}
          >
            +
          </button>
          <button
            type="button"
            className="note-tree-action note-tree-action-ghost"
            title="Add smart link to section"
            aria-label={`Add smart link to ${section.title}`}
            onClick={onAddLink}
          >
            ↗
          </button>
          <button
            type="button"
            className="note-tree-action note-tree-action-ghost sidebar-section-delete"
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
