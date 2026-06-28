import { useState } from 'react'
import type { PageCover } from '../types/note'
import { CoverPickerDialog } from './CoverPickerDialog'

type PageCoverProps = {
  cover: PageCover | null | undefined
  onChange: (cover: PageCover | null) => void
}

export function PageCover({ cover, onChange }: PageCoverProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  function handleSelect(next: PageCover) {
    onChange(next)
    setPickerOpen(false)
  }

  if (!cover) {
    return (
      <>
        <div
          className="page-cover-placeholder"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {hovered ? (
            <button type="button" className="page-cover-action" onClick={() => setPickerOpen(true)}>
              Add cover
            </button>
          ) : null}
        </div>
        <CoverPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleSelect}
        />
      </>
    )
  }

  return (
    <>
      <div
        className="page-cover"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img className="page-cover-image" src={cover.url} alt="" loading="lazy" />
        <div className="page-cover-gradient" aria-hidden="true" />
        {hovered ? (
          <div className="page-cover-actions">
            <button type="button" className="page-cover-action" onClick={() => setPickerOpen(true)}>
              Change cover
            </button>
            <button type="button" className="page-cover-action" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        ) : null}
        {cover.source === 'unsplash' && cover.attribution ? (
          <span className="page-cover-credit">Photo by {cover.attribution}</span>
        ) : null}
      </div>
      <CoverPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />
    </>
  )
}
