import { useState } from 'react'
import { APP_VERSION } from '../buildInfo'
import type { SidebarItem } from '../types/note'
import type { PersistenceState, SidebarSection } from '../types/workspace'
import { AddLinkDialog } from './AddLinkDialog'
import { SidebarTree } from './SidebarTree'
import { SyncStatus } from './SyncStatus'

type LinkContext = {
  parentId: string | null
  sectionId: string | null
}

type SidebarProps = {
  items: SidebarItem[]
  sections: SidebarSection[]
  activeId: string | null
  persistence: PersistenceState
  onSelect: (id: string) => void
  onAddPage: (context?: { parentId?: string | null; sectionId?: string | null }) => void
  onAddLink: (
    url: string,
    title?: string,
    context?: { parentId?: string | null; sectionId?: string | null },
  ) => boolean
  onAddSection: () => void
  onUpdateSection: (id: string, patch: Partial<Pick<SidebarSection, 'title' | 'collapsed'>>) => void
  onDeleteSection: (id: string) => void
  onMoveItemToSection: (itemId: string, sectionId: string | null) => void
}

export function Sidebar({
  items,
  sections,
  activeId,
  persistence,
  onSelect,
  onAddPage,
  onAddLink,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onMoveItemToSection,
}: SidebarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkContext, setLinkContext] = useState<LinkContext>({
    parentId: null,
    sectionId: null,
  })

  function openLinkDialog(context: LinkContext = { parentId: null, sectionId: null }) {
    setLinkContext(context)
    setLinkDialogOpen(true)
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Notes Hub</h1>
          <div className="sidebar-actions">
            <button type="button" className="btn-primary" onClick={() => onAddPage()}>
              + New page
            </button>
            <button
              type="button"
              className="btn-secondary btn-inline"
              onClick={() => openLinkDialog()}
            >
              + Smart link
            </button>
            <button type="button" className="btn-secondary btn-inline" onClick={onAddSection}>
              + New section
            </button>
          </div>
        </div>
        <nav className="note-list" aria-label="Pages and links">
          <SidebarTree
            items={items}
            sections={sections}
            activeId={activeId}
            onSelect={onSelect}
            onAddPage={onAddPage}
            onAddLink={context => openLinkDialog({
              parentId: context?.parentId ?? null,
              sectionId: context?.sectionId ?? null,
            })}
            onUpdateSection={onUpdateSection}
            onDeleteSection={onDeleteSection}
            onMoveItemToSection={onMoveItemToSection}
          />
        </nav>
        <SyncStatus persistence={persistence} />
        <p className="sidebar-build">Build {APP_VERSION}</p>
      </aside>

      <AddLinkDialog
        open={linkDialogOpen}
        onClose={() => {
          setLinkDialogOpen(false)
          setLinkContext({ parentId: null, sectionId: null })
        }}
        onAdd={(url, title) => {
          const ok = onAddLink(url, title, linkContext)
          if (ok) {
            setLinkDialogOpen(false)
            setLinkContext({ parentId: null, sectionId: null })
          }
          return ok
        }}
      />
    </>
  )
}
