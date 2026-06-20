import { useState } from 'react'
import type { SidebarItem } from '../types/note'
import { buildTree, type TreeNode } from '../utils/tree'
import { hostnameFromUrl } from '../utils/url'

type SidebarTreeProps = {
  items: SidebarItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onAddPage: (parentId: string | null) => void
  onAddLink: (parentId: string | null) => void
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
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onAddPage: (parentId: string | null) => void
  onAddLink: (parentId: string | null) => void
}

function TreeRow({
  node,
  depth,
  activeId,
  collapsedIds,
  onToggle,
  onSelect,
  onAddPage,
  onAddLink,
}: TreeRowProps) {
  const { item, children } = node
  const hasChildren = children.length > 0
  const isCollapsed = collapsedIds.has(item.id)
  const isActive = item.id === activeId

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
          <button
            type="button"
            className="note-tree-action"
            title="Add subpage"
            aria-label={`Add subpage under ${item.title || 'Untitled'}`}
            onClick={event => {
              event.stopPropagation()
              onAddPage(item.id)
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
              onAddLink(item.id)
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
              onToggle={onToggle}
              onSelect={onSelect}
              onAddPage={onAddPage}
              onAddLink={onAddLink}
            />
          ))
        : null}
    </div>
  )
}

export function SidebarTree({
  items,
  activeId,
  onSelect,
  onAddPage,
  onAddLink,
}: SidebarTreeProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set())
  const tree = buildTree(items)

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

  function handleAddPage(parentId: string | null) {
    onAddPage(parentId)
    if (parentId) {
      setCollapsedIds(prev => {
        const next = new Set(prev)
        next.delete(parentId)
        return next
      })
    }
  }

  function handleAddLink(parentId: string | null) {
    onAddLink(parentId)
    if (parentId) {
      setCollapsedIds(prev => {
        const next = new Set(prev)
        next.delete(parentId)
        return next
      })
    }
  }

  return (
    <>
      {tree.map(node => (
        <TreeRow
          key={node.item.id}
          node={node}
          depth={0}
          activeId={activeId}
          collapsedIds={collapsedIds}
          onToggle={toggleCollapsed}
          onSelect={onSelect}
          onAddPage={handleAddPage}
          onAddLink={handleAddLink}
        />
      ))}
    </>
  )
}
