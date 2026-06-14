import { useEffect, useRef, useState } from 'react'
import { normalizeUrl } from '../utils/url'

type AddLinkDialogProps = {
  open: boolean
  onClose: () => void
  onAdd: (url: string, title?: string) => boolean
}

export function AddLinkDialog({ open, onClose, onAdd }: AddLinkDialogProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    setUrl('')
    setTitle('')
    setError(null)
    urlRef.current?.focus()
  }, [open])

  if (!open) return null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!normalizeUrl(url)) {
      setError('Enter a valid web address (e.g. https://example.com).')
      return
    }

    const added = onAdd(url, title.trim() || undefined)
    if (!added) {
      setError('Could not add that link. Check the URL and try again.')
      return
    }

    onClose()
  }

  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <form
        className="dialog"
        onClick={event => event.stopPropagation()}
        onSubmit={handleSubmit}
        aria-labelledby="add-link-title"
      >
        <h2 id="add-link-title">Add smart link</h2>
        <p className="dialog-hint">
          Paste a URL to keep an external page in your sidebar, like Confluence smart links.
        </p>

        <label className="dialog-field">
          <span>URL</span>
          <input
            ref={urlRef}
            type="url"
            value={url}
            onChange={event => {
              setUrl(event.target.value)
              setError(null)
            }}
            placeholder="https://example.com/docs"
            required
          />
        </label>

        <label className="dialog-field">
          <span>Display name (optional)</span>
          <input
            type="text"
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Uses the site name if left blank"
          />
        </label>

        {error ? <p className="dialog-error">{error}</p> : null}

        <div className="dialog-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary btn-inline">
            Add link
          </button>
        </div>
      </form>
    </div>
  )
}
