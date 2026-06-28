import { useEffect, useRef, useState } from 'react'
import type { PageCover } from '../types/note'
import { isCoverApiAvailable, searchCoverImages, uploadCoverImage } from '../utils/coverApi'
import { normalizeUrl } from '../utils/url'

type CoverPickerDialogProps = {
  open: boolean
  onClose: () => void
  onSelect: (cover: PageCover) => void
}

type Tab = 'search' | 'link' | 'upload'

export function CoverPickerDialog({ open, onClose, onSelect }: CoverPickerDialogProps) {
  const [tab, setTab] = useState<Tab>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchCoverImages>>>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const apiAvailable = isCoverApiAvailable()

  useEffect(() => {
    if (!open) return
    setTab(apiAvailable ? 'search' : 'link')
    setQuery('')
    setResults([])
    setSearchError(null)
    setLinkUrl('')
    setLinkError(null)
    setUploadError(null)
  }, [open, apiAvailable])

  useEffect(() => {
    if (!open || tab !== 'search' || !apiAvailable) return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      return
    }

    const timeout = window.setTimeout(() => {
      setSearching(true)
      setSearchError(null)
      void searchCoverImages(trimmed)
        .then(setResults)
        .catch(error => {
          setResults([])
          setSearchError(error instanceof Error ? error.message : 'Search failed.')
        })
        .finally(() => setSearching(false))
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [open, tab, query, apiAvailable])

  if (!open) return null

  function handleLinkSubmit(event: React.FormEvent) {
    event.preventDefault()
    const normalized = normalizeUrl(linkUrl.trim())
    if (!normalized) {
      setLinkError('Enter a valid https:// image URL.')
      return
    }
    onSelect({ url: normalized, source: 'link' })
  }

  async function handleFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be 5 MB or smaller.')
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const url = await uploadCoverImage(file)
      onSelect({ url, source: 'upload' })
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="dialog dialog-wide"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="cover-picker-title"
      >
        <h2 id="cover-picker-title">Choose a cover</h2>

        <div className="cover-picker-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'search'}
            className={`cover-picker-tab${tab === 'search' ? ' is-active' : ''}`}
            disabled={!apiAvailable}
            onClick={() => setTab('search')}
          >
            Search
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'link'}
            className={`cover-picker-tab${tab === 'link' ? ' is-active' : ''}`}
            onClick={() => setTab('link')}
          >
            Link
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'upload'}
            className={`cover-picker-tab${tab === 'upload' ? ' is-active' : ''}`}
            disabled={!apiAvailable}
            onClick={() => setTab('upload')}
          >
            Upload
          </button>
        </div>

        {!apiAvailable ? (
          <p className="dialog-hint">
            Search and upload require cloud API access. Link paste works in all modes.
          </p>
        ) : null}

        {tab === 'search' ? (
          <div className="cover-picker-panel">
            <label className="dialog-field">
              <span>Search Unsplash</span>
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Nature, workspace, abstract…"
                autoFocus
              />
            </label>
            {searchError ? <p className="dialog-error">{searchError}</p> : null}
            {searching ? <p className="cover-picker-status">Searching…</p> : null}
            <div className="cover-picker-grid">
              {results.map(result => (
                <button
                  key={result.id}
                  type="button"
                  className="cover-picker-thumb"
                  onClick={() =>
                    onSelect({
                      url: result.url,
                      source: 'unsplash',
                      attribution: result.attribution,
                    })
                  }
                >
                  <img src={result.thumbUrl} alt={result.alt} loading="lazy" />
                  <span className="cover-picker-thumb-credit">{result.attribution}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {tab === 'link' ? (
          <form className="cover-picker-panel" onSubmit={handleLinkSubmit}>
            <label className="dialog-field">
              <span>Image URL</span>
              <input
                type="url"
                value={linkUrl}
                onChange={event => {
                  setLinkUrl(event.target.value)
                  setLinkError(null)
                }}
                placeholder="https://example.com/image.jpg"
                autoFocus
              />
            </label>
            {linkError ? <p className="dialog-error">{linkError}</p> : null}
            <div className="dialog-actions">
              <button type="button" className="btn-secondary btn-inline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary btn-inline">
                Use image
              </button>
            </div>
          </form>
        ) : null}

        {tab === 'upload' ? (
          <div className="cover-picker-panel">
            <div
              className="cover-picker-dropzone"
              onDragOver={event => event.preventDefault()}
              onDrop={event => {
                event.preventDefault()
                void handleFile(event.dataTransfer.files[0] ?? null)
              }}
            >
              <p>{uploading ? 'Uploading…' : 'Drag an image here, or choose a file'}</p>
              <button
                type="button"
                className="btn-secondary btn-inline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                Choose file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={event => void handleFile(event.target.files?.[0] ?? null)}
              />
            </div>
            {uploadError ? <p className="dialog-error">{uploadError}</p> : null}
          </div>
        ) : null}

        {tab === 'search' ? (
          <div className="dialog-actions">
            <button type="button" className="btn-secondary btn-inline" onClick={onClose}>
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
