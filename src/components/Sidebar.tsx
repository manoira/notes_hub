import { useEffect, useState } from 'react'
import { APP_VERSION } from '../buildInfo'
import type { SidebarItem } from '../types/note'
import type { PersistenceState, SidebarSection } from '../types/workspace'
import type { DropPosition } from '../utils/itemOrder'
import { AddLinkDialog } from './AddLinkDialog'
import { SidebarTopbar } from './SidebarTopbar'
import { SidebarTree } from './SidebarTree'
import { SyncStatus } from './SyncStatus'

type LinkContext = {
  parentId: string | null
  sectionId: string | null
}

const SIDEBAR_OPEN_KEY = 'notes_hub_sidebar_open'

function readSidebarOpenPreference(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_OPEN_KEY)
    if (stored === 'false') return false
    if (stored === 'true') return true
  } catch {
    // ignore
  }
  return true
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
  onUpdateSection: (id: string, patch: Partial<Pick<SidebarSection, 'title'>>) => void
  onDeleteSection: (id: string) => void
  onMoveItemToSection: (itemId: string, sectionId: string | null) => void
  onMoveItem: (draggedId: string, targetId: string, position: DropPosition) => void
  onMoveItemToSectionEnd: (draggedId: string, sectionId: string | null) => void
  onRenameItem: (id: string, title: string) => void
  onDeleteItem: (id: string) => void
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
  onMoveItem,
  onMoveItemToSectionEnd,
  onRenameItem,
  onDeleteItem,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(readSidebarOpenPreference)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkContext, setLinkContext] = useState<LinkContext>({
    parentId: null,
    sectionId: null,
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_OPEN_KEY, String(expanded))
    } catch {
      // ignore
    }
  }, [expanded])

  function openLinkDialog(context: LinkContext = { parentId: null, sectionId: null }) {
    setLinkContext(context)
    setLinkDialogOpen(true)
  }

  return (
    <>
      <div className={`sidebar-column${expanded ? '' : ' sidebar-column-collapsed'}`}>
        <SidebarTopbar
          expanded={expanded}
          onExpand={() => setExpanded(true)}
          onCollapse={() => setExpanded(false)}
          onAddPage={() => onAddPage()}
          onAddLink={() => openLinkDialog()}
          onAddSection={onAddSection}
        />
        <aside className={`sidebar${expanded ? '' : ' sidebar-collapsed'}`}>
          {expanded ? (
            <>
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
                  onDeleteSection={onDeleteSection}
                  onMoveItemToSection={onMoveItemToSection}
                  onMoveItem={onMoveItem}
                  onMoveItemToSectionEnd={onMoveItemToSectionEnd}
                  onRenameItem={onRenameItem}
                  onDeleteItem={onDeleteItem}
                  onUpdateSectionTitle={(id, title) => onUpdateSection(id, { title })}
                />
              </nav>
              <SyncStatus persistence={persistence} />
              <p className="sidebar-build">Build {APP_VERSION}</p>
            </>
          ) : null}
        </aside>
      </div>

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
