import { useEffect, useRef, useState } from 'react'
import type { PageTypography } from '../types/note'
import {
  BODY_FONTS,
  DEFAULT_BODY_FONT,
  DEFAULT_HEADING_FONT,
  HEADING_FONTS,
  fontFamilyCss,
  type PageFontId,
} from '../utils/pageFonts'

type PageTypographyPickerProps = {
  typography: PageTypography | undefined
  onChange: (typography: PageTypography) => void
}

export function PageTypographyPicker({ typography, onChange }: PageTypographyPickerProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const headingFont = typography?.headingFont ?? DEFAULT_HEADING_FONT
  const bodyFont = typography?.bodyFont ?? DEFAULT_BODY_FONT

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [open])

  function setHeadingFont(id: PageFontId) {
    onChange({ ...typography, headingFont: id })
  }

  function setBodyFont(id: PageFontId) {
    onChange({ ...typography, bodyFont: id })
  }

  return (
    <div className="page-typography-picker-wrap" ref={wrapRef}>
      <button
        type="button"
        className="page-typography-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(value => !value)}
      >
        Aa
      </button>
      {open ? (
        <div className="page-typography-popover" role="dialog" aria-label="Page fonts">
          <section className="page-typography-section">
            <div className="page-typography-section-header">
              <h3>Heading font</h3>
              <button
                type="button"
                className="page-typography-reset"
                onClick={() => setHeadingFont(DEFAULT_HEADING_FONT)}
              >
                Reset
              </button>
            </div>
            <div className="page-typography-grid">
              {HEADING_FONTS.map(font => (
                <button
                  key={font.id}
                  type="button"
                  className={`page-typography-option${headingFont === font.id ? ' is-selected' : ''}`}
                  style={{ fontFamily: fontFamilyCss(font.id, 'heading') }}
                  onClick={() => setHeadingFont(font.id)}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </section>
          <section className="page-typography-section">
            <div className="page-typography-section-header">
              <h3>Body font</h3>
              <button
                type="button"
                className="page-typography-reset"
                onClick={() => setBodyFont(DEFAULT_BODY_FONT)}
              >
                Reset
              </button>
            </div>
            <div className="page-typography-grid">
              {BODY_FONTS.map(font => (
                <button
                  key={font.id}
                  type="button"
                  className={`page-typography-option${bodyFont === font.id ? ' is-selected' : ''}`}
                  style={{ fontFamily: fontFamilyCss(font.id, 'body') }}
                  onClick={() => setBodyFont(font.id)}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
