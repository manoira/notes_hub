import { stripHeadingPrefix, stripListPrefix } from './linePrefix'

export type ListType = 0 | 1 | 2 | 3 | 4 | 5 | 6

const LIST_PREFIX: Record<Exclude<ListType, 0>, string> = {
  1: '- ',
  2: '* ',
  3: '+ ',
  4: '1. ',
  5: '- [ ] ',
  6: '- [x] ',
}

export const LIST_OPTIONS: { type: ListType; label: string; short: string }[] = [
  { type: 0, label: 'No list', short: '—' },
  { type: 1, label: 'Bullet (dash)', short: '−' },
  { type: 2, label: 'Bullet (asterisk)', short: '*' },
  { type: 3, label: 'Bullet (plus)', short: '+' },
  { type: 4, label: 'Numbered list', short: '1.' },
  { type: 5, label: 'Task (open)', short: '☐' },
  { type: 6, label: 'Task (done)', short: '☑' },
]

export function listFromLine(line: string): ListType {
  if (line.startsWith('- [ ] ')) return 5
  if (/^- \[[xX]\] /.test(line)) return 6
  if (/^\d+\. /.test(line)) return 4
  if (line.startsWith('- ')) return 1
  if (line.startsWith('* ')) return 2
  if (line.startsWith('+ ')) return 3
  return 0
}

export function applyListToLine(line: string, type: ListType): string {
  const text = stripListPrefix(stripHeadingPrefix(line))
  if (type === 0) return text
  return `${LIST_PREFIX[type]}${text}`
}

export function applyListAtCursor(
  content: string,
  cursor: number,
  type: ListType,
): { content: string; cursor: number } {
  const lineStart = content.lastIndexOf('\n', cursor - 1) + 1
  const lineEndIndex = content.indexOf('\n', cursor)
  const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex

  const currentLine = content.slice(lineStart, lineEnd)
  const nextLine = applyListToLine(currentLine, type)
  const nextContent = content.slice(0, lineStart) + nextLine + content.slice(lineEnd)
  const cursorOffset = nextLine.length - currentLine.length

  return {
    content: nextContent,
    cursor: cursor + cursorOffset,
  }
}

export function currentListAtCursor(content: string, cursor: number): ListType {
  const lineStart = content.lastIndexOf('\n', cursor - 1) + 1
  const lineEndIndex = content.indexOf('\n', cursor)
  const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex
  return listFromLine(content.slice(lineStart, lineEnd))
}
