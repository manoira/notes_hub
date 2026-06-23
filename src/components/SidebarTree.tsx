import { useState } from 'react'
import type { SidebarItem } from '../types/note'
import type { SidebarSection } from '../types/workspace'
import { buildSidebarGroups, type TreeNode } from '../utils/tree'
import { hostnameFromUrl } from '../utils/url'
import { SidebarSectionHeader } from './SidebarSectionHeader'

type SidebarTreeProps = {
  items: SidebarItem[]
  sections: SidebarSection[]
  activeId: string | null
  onSelect: (id: string) => void
  onAddPage: (context?: { parentId?: string | null; sectionId?: string | null }) => void
  onAddLink: (context?: { parentId?: string | null; sectionId?: string | null }) => void
  onUpdateSection: (id: string, patch: Partial<Pick<SidebarSection, 'title' | 'collapsed'>>) => void
  onDeleteSection: (id: string) => void
  onMoveItemToSection: (itemId: string, sectionId: string | null) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function itemSubtitle(item: SidebarItem) {
  if (item.kind === 'link') return hostnameFromUrl(item.url)
  return formatDate(item.updatedAt)
}

type TreeRowProps = {
  node: TreeNode
  depth: number
  activeId: string | null
  collapsedIds: Set<string>
  sections: SidebarSection[]
  currentSectionId: string | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onAddPage: (context?: { parentId?: string | null; sectionId?: string | null }) => void
  onAddLink: (context?: { parentId?: string | null; sectionId?: string | null }) => void
  onMoveItemToSection: (itemId: string, sectionId: string | null) => void
}

function TreeRow({
  node,
  depth,
  activeId,
  collapsedIds,
  sections,
  currentSectionId,
  onToggle,
  onSelect,
  onAddPage,
  onAddLink,
  onMoveItemToSection,
}: TreeRowProps) {
  const { item, children } = node
  const hasChildren = children.length > 0
  const isCollapsed = collapsedIds.has(item.id)
  const isActive = item.id === activeId
  const isTopLevel = depth === 0

  return (
    <div className="note-tree-branch">
      <div className="note-tree-row" style={{ paddingLeft: `${8 + depth * 14}px` }}>
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

        <button
          type="button"
          className={`note-item${isActive ? ' active' : ''}${item.kind === 'link' ? ' note-item-link' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          <span className="note-item-row">
            {item.kind === 'link' ? (
              <span className="note-item-icon" aria-hidden="true">
                ↗
              </span>
            ) : null}
            <span className="note-item-title">{item.title || 'Untitled'}</span>
          </span>
          <span className="note-item-date">{itemSubtitle(item)}</span>
        </button>

        <div className="note-tree-actions">
          {isTopLevel && sections.length > 0 ? (
            <select
              className="note-tree-section-select"
              value={currentSectionId ?? ''}
              title="Move to section"
              aria-label={`Move ${item.title || 'item'} to section`}
              onClick={event => event.stopPropagation()}
              onChange={event => {
                const value = event.target.value
                onMoveItemToSection(item.id, value === '' ? null : value)
              }}
            >
              <option value="">Ungrouped</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            className="note-tree-action"
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
            className="note-tree-action"
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

      {hasChildren && !isCollapsed
        ? children.map(child => (
            <TreeRow
              key={child.item.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              collapsedIds={collapsedIds}
              sections={sections}
              currentSectionId={currentSectionId}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddPage={onAddPage}
              onAddLink={onAddLink}
              onMoveItemToSection={onMoveItemToSection}
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
  onUpdateSection,
  onDeleteSection,
  onMoveItemToSection,
}: SidebarTreeProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set())
  const groups = buildSidebarGroups(items, sections)

  function toggleCollapsed(id: string) {
    setCollapsedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
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
    if (context?.sectionId) {
      onUpdateSection(context.sectionId, { collapsed: false })
    }
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
    if (context?.sectionId) {
      onUpdateSection(context.sectionId, { collapsed: false })
    }
  }

  if (groups.length === 0 && sections.length === 0) {
    return <p className="sidebar-empty">No pages yet — create one above.</p>
  }

  return (
    <>
      {groups.map(group => {
        const groupKey = group.section?.id ?? 'ungrouped'

        return (
          <div key={groupKey} className="sidebar-section-group">
            {group.section ? (
              <SidebarSectionHeader
                section={group.section}
                onToggleCollapsed={() =>
                  onUpdateSection(group.section!.id, {
                    collapsed: !group.section!.collapsed,
                  })
                }
                onRename={title => onUpdateSection(group.section!.id, { title })}
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

            {group.section?.collapsed ? null : (
              <div className="sidebar-section-items">
                {group.nodes.map(node => (
                  <TreeRow
                    key={node.item.id}
                    node={node}
                    depth={0}
                    activeId={activeId}
                    collapsedIds={collapsedIds}
                    sections={sections}
                    currentSectionId={group.section?.id ?? null}
                    onToggle={toggleCollapsed}
                    onSelect={onSelect}
                    onAddPage={handleAddPage}
                    onAddLink={handleAddLink}
                    onMoveItemToSection={onMoveItemToSection}
                  />
                ))}
                {group.section && group.nodes.length === 0 ? (
                  <p className="sidebar-section-empty">No pages in this section</p>
                ) : null}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
