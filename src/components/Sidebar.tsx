import { useState } from 'react'
import type { SidebarItem } from '../types/note'
import { hostnameFromUrl } from '../utils/url'
import { AddLinkDialog } from './AddLinkDialog'

type SidebarProps = {
  items: SidebarItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onAddPage: () => void
  onAddLink: (url: string, title?: string) => boolean
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

export function Sidebar({ items, activeId, onSelect, onAddPage, onAddLink }: SidebarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  const sorted = [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Notes Hub</h1>
          <div className="sidebar-actions">
            <button type="button" className="btn-primary" onClick={onAddPage}>
              + New page
            </button>
            <button
              type="button"
              className="btn-secondary btn-inline"
              onClick={() => setLinkDialogOpen(true)}
            >
              + Smart link
            </button>
          </div>
        </div>
        <nav className="note-list" aria-label="Pages and links">
          {sorted.map(item => (
            <button
              key={item.id}
              type="button"
              className={`note-item${item.id === activeId ? ' active' : ''}${item.kind === 'link' ? ' note-item-link' : ''}`}
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
          ))}
        </nav>
      </aside>

      <AddLinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onAdd={onAddLink}
      />
    </>
  )
}
