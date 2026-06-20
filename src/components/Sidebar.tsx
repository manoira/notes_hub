import { useState } from 'react'
import { APP_VERSION } from '../buildInfo'
import type { SidebarItem } from '../types/note'
import { AddLinkDialog } from './AddLinkDialog'
import { SidebarTree } from './SidebarTree'

type SidebarProps = {
  items: SidebarItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onAddPage: (parentId?: string | null) => void
  onAddLink: (url: string, title?: string, parentId?: string | null) => boolean
}

export function Sidebar({
  items,
  activeId,
  onSelect,
  onAddPage,
  onAddLink,
}: SidebarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkParentId, setLinkParentId] = useState<string | null>(null)

  function openLinkDialog(parentId: string | null) {
    setLinkParentId(parentId)
    setLinkDialogOpen(true)
  }

  function handleAddLink(parentId: string | null) {
    openLinkDialog(parentId)
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Notes Hub</h1>
          <div className="sidebar-actions">
            <button type="button" className="btn-primary" onClick={() => onAddPage(null)}>
              + New page
            </button>
            <button
              type="button"
              className="btn-secondary btn-inline"
              onClick={() => openLinkDialog(null)}
            >
              + Smart link
            </button>
          </div>
        </div>
        <nav className="note-list" aria-label="Pages and links">
          <SidebarTree
            items={items}
            activeId={activeId}
            onSelect={onSelect}
            onAddPage={onAddPage}
            onAddLink={handleAddLink}
          />
        </nav>
        <p className="sidebar-build">Build {APP_VERSION}</p>
      </aside>

      <AddLinkDialog
        open={linkDialogOpen}
        onClose={() => {
          setLinkDialogOpen(false)
          setLinkParentId(null)
        }}
        onAdd={(url, title) => {
          const ok = onAddLink(url, title, linkParentId)
          if (ok) {
            setLinkDialogOpen(false)
            setLinkParentId(null)
          }
          return ok
        }}
      />
    </>
  )
}
