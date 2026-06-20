export function getTextareaCaretRect(
  textarea: HTMLTextAreaElement,
  position: number,
): { top: number; left: number; height: number } {
  const style = window.getComputedStyle(textarea)
  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.6
  const paddingTop = Number.parseFloat(style.paddingTop) || 0
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0

  const textBefore = textarea.value.slice(0, position)
  const lines = textBefore.split('\n')
  const lineIndex = lines.length - 1
  const colIndex = lines[lineIndex]?.length ?? 0

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  let charWidth = 8
  if (context) {
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    charWidth = context.measureText('m').width
  }

  const rect = textarea.getBoundingClientRect()

  return {
    top: rect.top + paddingTop + lineIndex * lineHeight - textarea.scrollTop + lineHeight,
    left: rect.left + paddingLeft + colIndex * charWidth - textarea.scrollLeft,
    height: lineHeight,
  }
}
