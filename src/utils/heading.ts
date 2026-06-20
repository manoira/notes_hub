import { stripHeadingPrefix, stripListPrefix } from './linePrefix'

export type HeadingLevel = 0 | 1 | 2 | 3

const HEADING_PREFIX: Record<Exclude<HeadingLevel, 0>, string> = {
  1: '# ',
  2: '## ',
  3: '### ',
}

export function headingFromLine(line: string): HeadingLevel {
  if (line.startsWith('### ')) return 3
  if (line.startsWith('## ')) return 2
  if (line.startsWith('# ')) return 1
  return 0
}

export { stripHeadingPrefix } from './linePrefix'

export function applyHeadingToLine(line: string, level: HeadingLevel): string {
  const text = stripHeadingPrefix(stripListPrefix(line))
  if (level === 0) return text
  return `${HEADING_PREFIX[level]}${text}`
}

export function applyHeadingAtCursor(
  content: string,
  cursor: number,
  level: HeadingLevel,
): { content: string; cursor: number } {
  const lineStart = content.lastIndexOf('\n', cursor - 1) + 1
  const lineEndIndex = content.indexOf('\n', cursor)
  const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex

  const currentLine = content.slice(lineStart, lineEnd)
  const nextLine = applyHeadingToLine(currentLine, level)
  const nextContent = content.slice(0, lineStart) + nextLine + content.slice(lineEnd)
  const cursorOffset = nextLine.length - currentLine.length

  return {
    content: nextContent,
    cursor: cursor + cursorOffset,
  }
}

export function currentHeadingAtCursor(content: string, cursor: number): HeadingLevel {
  const lineStart = content.lastIndexOf('\n', cursor - 1) + 1
  const lineEndIndex = content.indexOf('\n', cursor)
  const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex
  return headingFromLine(content.slice(lineStart, lineEnd))
}
