import type { SmartLink } from '../types/note'
import { embedUrl, hostnameFromUrl, normalizeUrl } from '../utils/url'

type PageLinkBookmarksProps = {
  links: SmartLink[]
  onSelectLink: (id: string) => void
}

type LinkBookmarkCardProps = {
  link: SmartLink
  onSelect: () => void
}

function LinkBookmarkCard({ link, onSelect }: LinkBookmarkCardProps) {
  const hostname = hostnameFromUrl(link.url)
  const urlIsValid = normalizeUrl(link.url) !== null

  return (
    <button type="button" className="link-bookmark" onClick={onSelect}>
      <div className="link-bookmark-preview" aria-hidden="true">
        {urlIsValid ? (
          <iframe
            className="link-bookmark-iframe"
            src={embedUrl(link.url)}
            title=""
            tabIndex={-1}
          />
        ) : (
          <div className="link-bookmark-fallback">
            <span className="link-bookmark-fallback-icon">↗</span>
          </div>
        )}
      </div>
      <div className="link-bookmark-meta">
        <span className="link-bookmark-icon" aria-hidden="true">
          ↗
        </span>
        <span className="link-bookmark-copy">
          <span className="link-bookmark-title">{link.title || hostname}</span>
          <span className="link-bookmark-host">{hostname}</span>
        </span>
      </div>
    </button>
  )
}

export function PageLinkBookmarks({ links, onSelectLink }: PageLinkBookmarksProps) {
  if (links.length === 0) return null

  return (
    <section className="page-link-bookmarks" aria-label="Smart link bookmarks">
      <div className="page-link-bookmarks-grid">
        {links.map(link => (
          <LinkBookmarkCard key={link.id} link={link} onSelect={() => onSelectLink(link.id)} />
        ))}
      </div>
    </section>
  )
}
