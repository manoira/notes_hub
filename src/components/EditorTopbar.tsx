import type { SidebarItem } from '../types/note'
import { getItemBreadcrumb } from '../utils/tree'

type EditorTopbarProps = {
  items: SidebarItem[]
  activeId: string
  onSelect: (id: string) => void
}

function itemIcon(item: SidebarItem): string {
  return item.kind === 'link' ? '↗' : '📄'
}

export function EditorTopbar({ items, activeId, onSelect }: EditorTopbarProps) {
  const crumbs = getItemBreadcrumb(items, activeId)
  if (crumbs.length === 0) return null

  return (
    <header className="editor-topbar">
      <nav className="editor-breadcrumb" aria-label="Breadcrumb">
        {crumbs.map((item, index) => (
          <div key={item.id} className="editor-breadcrumb-segment">
            {index > 0 ? (
              <span className="editor-breadcrumb-sep" aria-hidden="true">
                ›
              </span>
            ) : null}
            <button
              type="button"
              className={`editor-breadcrumb-btn${index === crumbs.length - 1 ? ' is-current' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="editor-breadcrumb-icon" aria-hidden="true">
                {itemIcon(item)}
              </span>
              <span className="editor-breadcrumb-label">{item.title || 'Untitled'}</span>
            </button>
          </div>
        ))}
      </nav>
    </header>
  )
}
