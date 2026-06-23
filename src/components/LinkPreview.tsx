import { useEffect, useState } from 'react'
import type { SmartLink } from '../types/note'
import { embedUrl, hostnameFromUrl, normalizeUrl, usesInsecureHttp } from '../utils/url'

type LinkPreviewProps = {
  link: SmartLink
  onChange: (patch: Partial<Pick<SmartLink, 'title' | 'url'>>) => void
  onDelete: () => void
}

export function LinkPreview({ link, onChange, onDelete }: LinkPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const hostname = hostnameFromUrl(link.url)
  const urlIsValid = normalizeUrl(link.url) !== null
  const iframeSrc = urlIsValid ? embedUrl(link.url) : ''
  const savedAsHttp = usesInsecureHttp(link.url)

  useEffect(() => {
    setIsFullscreen(false)
  }, [link.id, link.url])

  useEffect(() => {
    if (!isFullscreen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  return (
    <>
      <section className="link-preview">
        <div className="editor-toolbar">
          <span className="editor-meta">
            Smart link · {hostname}
          </span>
          <div className="link-toolbar-actions">
            {urlIsValid ? (
              <button
                type="button"
                className="btn-secondary btn-inline"
                onClick={() => setIsFullscreen(true)}
              >
                Fullscreen
              </button>
            ) : null}
            <a
              className="btn-secondary btn-inline"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in new tab
            </a>
            <button type="button" className="btn-danger" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>

        <input
          className="editor-title"
          value={link.title}
          onChange={event => onChange({ title: event.target.value })}
          placeholder="Link title"
          aria-label="Link title"
        />

        <label className="link-url-field">
          <span>URL</span>
          <input
            type="url"
            value={link.url}
            onChange={event => onChange({ url: event.target.value })}
            placeholder="https://example.com"
            aria-label="Link URL"
          />
        </label>

        {!urlIsValid ? (
          <p className="link-embed-fallback">
            Enter a valid URL above to preview this page.
          </p>
        ) : (
          <div className="link-embed-wrap">
            <iframe
              key={iframeSrc}
              className="link-embed"
              src={iframeSrc}
              title={link.title}
            />
            <button
              type="button"
              className="link-embed-fullscreen-btn"
              onClick={() => setIsFullscreen(true)}
            >
              Fullscreen
            </button>
            <p className="link-embed-hint">
              {savedAsHttp
                ? 'Preview uses HTTPS automatically — browsers block HTTP pages inside HTTPS apps. Update the URL to https:// if needed.'
                : 'If the preview is blank, the site blocks embedding — use Open in new tab.'}
            </p>
          </div>
        )}
      </section>

      {isFullscreen && urlIsValid ? (
        <div
          className="link-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label={`${link.title} fullscreen preview`}
        >
          <header className="link-fullscreen-header">
            <div className="link-fullscreen-title">
              <span className="link-fullscreen-name">{link.title || hostname}</span>
              <span className="link-fullscreen-host">{hostname}</span>
            </div>
            <div className="link-fullscreen-actions">
              <a
                className="btn-secondary btn-inline"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in new tab
              </a>
              <button
                type="button"
                className="btn-primary btn-inline"
                onClick={() => setIsFullscreen(false)}
              >
                Exit fullscreen
              </button>
            </div>
          </header>
          <iframe
            key={`fullscreen-${iframeSrc}`}
            className="link-fullscreen-embed"
            src={iframeSrc}
            title={`${link.title} fullscreen`}
          />
        </div>
      ) : null}
    </>
  )
}
