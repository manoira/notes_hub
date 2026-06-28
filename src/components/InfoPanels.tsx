import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { InfoPanel } from '../types/note'

const ICON_CHOICES = [
  '💡',
  'ℹ️',
  '⚠️',
  '✅',
  '❌',
  '📌',
  '🔥',
  '⭐',
  '📝',
  '🚀',
  '❓',
  '💬',
  '🔔',
  '🎯',
  '📅',
  '🧠',
]

type InfoPanelsProps = {
  panels: InfoPanel[]
  /** Panel id that should grab focus on mount (a freshly created panel). */
  autoFocusId?: string | null
  onChange: (panels: InfoPanel[]) => void
  onAutoFocusHandled?: () => void
}

type InfoPanelCardProps = {
  panel: InfoPanel
  autoFocus: boolean
  onChange: (patch: Partial<Pick<InfoPanel, 'icon' | 'text'>>) => void
  onDelete: () => void
  onAutoFocusHandled?: () => void
}

function InfoPanelCard({
  panel,
  autoFocus,
  onChange,
  onDelete,
  onAutoFocusHandled,
}: InfoPanelCardProps) {
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  function autosize(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  useLayoutEffect(() => {
    if (textRef.current) autosize(textRef.current)
  }, [panel.text])

  useEffect(() => {
    if (!autoFocus) return
    const textarea = textRef.current
    if (textarea) {
      textarea.focus()
      const end = textarea.value.length
      textarea.setSelectionRange(end, end)
    }
    onAutoFocusHandled?.()
  }, [autoFocus, onAutoFocusHandled])

  return (
    <div className="info-panel">
      <div className="info-panel-icon-wrap">
        <button
          type="button"
          className="info-panel-icon"
          aria-label="Change icon"
          aria-haspopup="true"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(open => !open)}
        >
          {panel.icon}
        </button>
        {pickerOpen ? (
          <>
            <div className="info-panel-picker-backdrop" onClick={() => setPickerOpen(false)} />
            <div className="info-panel-picker" role="menu" aria-label="Choose an icon">
              {ICON_CHOICES.map(icon => (
                <button
                  key={icon}
                  type="button"
                  role="menuitem"
                  className={`info-panel-picker-option${
                    icon === panel.icon ? ' is-selected' : ''
                  }`}
                  onClick={() => {
                    onChange({ icon })
                    setPickerOpen(false)
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <textarea
        ref={textRef}
        className="info-panel-text"
        value={panel.text}
        rows={1}
        placeholder="Write something…"
        aria-label="Information panel text"
        onChange={event => {
          onChange({ text: event.target.value })
          autosize(event.currentTarget)
        }}
      />
      <button
        type="button"
        className="info-panel-delete"
        aria-label="Delete information panel"
        onClick={onDelete}
      >
        ×
      </button>
    </div>
  )
}

export function InfoPanels({
  panels,
  autoFocusId,
  onChange,
  onAutoFocusHandled,
}: InfoPanelsProps) {
  if (panels.length === 0) return null

  function updatePanel(id: string, patch: Partial<Pick<InfoPanel, 'icon' | 'text'>>) {
    onChange(panels.map(panel => (panel.id === id ? { ...panel, ...patch } : panel)))
  }

  function deletePanel(id: string) {
    onChange(panels.filter(panel => panel.id !== id))
  }

  return (
    <section className="info-panels" aria-label="Information panels">
      {panels.map(panel => (
        <InfoPanelCard
          key={panel.id}
          panel={panel}
          autoFocus={panel.id === autoFocusId}
          onChange={patch => updatePanel(panel.id, patch)}
          onDelete={() => deletePanel(panel.id)}
          onAutoFocusHandled={onAutoFocusHandled}
        />
      ))}
    </section>
  )
}
