import type { ReactNode } from 'react'

type SidebarTopbarProps = {
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onAddPage: () => void
  onAddLink: () => void
  onAddSection: () => void
}

function TopbarIcon({
  label,
  title,
  onClick,
  children,
}: {
  label: string
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="sidebar-topbar-icon"
      onClick={onClick}
      aria-label={label}
      title={title}
    >
      {children}
    </button>
  )
}

export function SidebarTopbar({
  expanded,
  onExpand,
  onCollapse,
  onAddPage,
  onAddLink,
  onAddSection,
}: SidebarTopbarProps) {
  return (
    <header className="sidebar-topbar">
      {expanded ? (
        <>
          <div className="sidebar-topbar-brand" aria-label="Notes Hub">
            <span className="sidebar-topbar-logo" aria-hidden="true">
              N
            </span>
            <span className="sidebar-topbar-brand-label">Notes Hub</span>
          </div>
          <div className="sidebar-topbar-actions">
            <TopbarIcon label="New page" title="New page" onClick={onAddPage}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3 2.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5zm1 1v9h9V3.5H4zm4 1.75h1v2.75H11v1H9v2.75H8V9.5H6v-1h2V5.25z"
                  fill="currentColor"
                />
              </svg>
            </TopbarIcon>
            <TopbarIcon label="Add smart link" title="Smart link" onClick={onAddLink}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M6.5 3.5h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3M9 2.5h4v4M7.5 8.5 13 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </TopbarIcon>
            <TopbarIcon label="New section" title="New section" onClick={onAddSection}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M2.5 4.5h11M2.5 8h7M2.5 11.5h9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              </svg>
            </TopbarIcon>
            <TopbarIcon label="Collapse sidebar" title="Collapse sidebar" onClick={onCollapse}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M10 3.5 6.5 8 10 12.5M3.5 3.5v9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </TopbarIcon>
          </div>
        </>
      ) : (
        <div className="sidebar-topbar-actions sidebar-topbar-actions-collapsed">
          <TopbarIcon label="Expand sidebar" title="Expand sidebar" onClick={onExpand}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M6 3.5 9.5 8 6 12.5M12.5 3.5v9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </TopbarIcon>
          <TopbarIcon label="New page" title="New page" onClick={onAddPage}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M8 3.5v9M3.5 8h9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
          </TopbarIcon>
          <TopbarIcon label="Add smart link" title="Smart link" onClick={onAddLink}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M6.5 3.5h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3M9 2.5h4v4M7.5 8.5 13 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </TopbarIcon>
        </div>
      )}
    </header>
  )
}
