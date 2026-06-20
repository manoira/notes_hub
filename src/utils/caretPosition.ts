const MIRROR_STYLE_PROPS = [
  'boxSizing',
  'width',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'textTransform',
  'wordSpacing',
  'textIndent',
  'lineHeight',
] as const

function copyTextareaStyles(
  textarea: HTMLTextAreaElement,
  mirror: HTMLDivElement,
): void {
  const style = window.getComputedStyle(textarea)
  for (const prop of MIRROR_STYLE_PROPS) {
    mirror.style[prop] = style[prop]
  }
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'
  mirror.style.overflow = 'hidden'
}

export function getTextareaCaretRect(
  textarea: HTMLTextAreaElement,
  position: number,
): { top: number; left: number; width: number } {
  const textareaRect = textarea.getBoundingClientRect()
  const style = window.getComputedStyle(textarea)
  const lineHeight =
    Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.6
  const menuWidth = Math.min(360, textareaRect.width)
  const maxMenuHeight = 280

  const mirror = document.createElement('div')
  copyTextareaStyles(textarea, mirror)
  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.top = '0px'
  mirror.style.left = '-9999px'
  mirror.style.width = `${textareaRect.width}px`

  const textBefore = textarea.value.slice(0, position)
  mirror.textContent = textBefore

  const marker = document.createElement('span')
  marker.textContent = textarea.value.slice(position, position + 1) || '.'
  mirror.appendChild(marker)

  document.body.appendChild(mirror)

  const markerTop = marker.offsetTop
  const markerLeft = marker.offsetLeft

  document.body.removeChild(mirror)

  let top = textareaRect.top + markerTop - textarea.scrollTop + lineHeight
  let left = textareaRect.left + markerLeft - textarea.scrollLeft

  if (top + maxMenuHeight > window.innerHeight - 16) {
    top = Math.max(16, top - maxMenuHeight - lineHeight)
  }

  top = Math.min(Math.max(top, 16), window.innerHeight - maxMenuHeight)
  left = Math.min(Math.max(left, 16), window.innerWidth - menuWidth - 16)

  return { top, left, width: menuWidth }
}
