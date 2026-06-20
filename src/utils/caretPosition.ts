export function getTextareaAnchorRect(
  textarea: HTMLTextAreaElement,
): { top: number; left: number; width: number } {
  const rect = textarea.getBoundingClientRect()
  return {
    top: Math.max(16, rect.bottom - 8),
    left: Math.max(16, rect.left),
    width: Math.min(360, rect.width),
  }
}
