import { applyHeadingAtCursor, type HeadingLevel } from './heading'
import { applyListAtCursor, type ListType } from './list'

export type SlashCommandKind = 'heading' | 'list'

export type SlashCommand = {
  id: string
  label: string
  description: string
  icon: string
  group: 'Text' | 'Lists'
  kind: SlashCommandKind
  value: HeadingLevel | ListType
  keywords: string[]
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'text',
    label: 'Normal text',
    description: 'Plain paragraph',
    icon: '¶',
    group: 'Text',
    kind: 'heading',
    value: 0,
    keywords: ['text', 'paragraph', 'normal', 'p'],
  },
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Large section title',
    icon: 'H1',
    group: 'Text',
    kind: 'heading',
    value: 1,
    keywords: ['h1', 'heading1', 'heading', 'title'],
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium section title',
    icon: 'H2',
    group: 'Text',
    kind: 'heading',
    value: 2,
    keywords: ['h2', 'heading2', 'subtitle'],
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small section title',
    icon: 'H3',
    group: 'Text',
    kind: 'heading',
    value: 3,
    keywords: ['h3', 'heading3'],
  },
  {
    id: 'bullet-dash',
    label: 'Bullet list',
    description: 'Unordered list with dashes',
    icon: '−',
    group: 'Lists',
    kind: 'list',
    value: 1,
    keywords: ['bullet', 'ul', 'list', 'dash', 'unordered'],
  },
  {
    id: 'bullet-star',
    label: 'Bullet list (asterisk)',
    description: 'Unordered list with asterisks',
    icon: '*',
    group: 'Lists',
    kind: 'list',
    value: 2,
    keywords: ['asterisk', 'star', 'bullet2'],
  },
  {
    id: 'bullet-plus',
    label: 'Bullet list (plus)',
    description: 'Unordered list with plus signs',
    icon: '+',
    group: 'Lists',
    kind: 'list',
    value: 3,
    keywords: ['plus', 'bullet3'],
  },
  {
    id: 'numbered',
    label: 'Numbered list',
    description: 'Ordered list with numbers',
    icon: '1.',
    group: 'Lists',
    kind: 'list',
    value: 4,
    keywords: ['numbered', 'ol', 'ordered', 'number', '1'],
  },
  {
    id: 'task-open',
    label: 'To-do list',
    description: 'Unchecked task item',
    icon: '☐',
    group: 'Lists',
    kind: 'list',
    value: 5,
    keywords: ['todo', 'task', 'checkbox', 'check', 'open'],
  },
  {
    id: 'task-done',
    label: 'Checked to-do',
    description: 'Completed task item',
    icon: '☑',
    group: 'Lists',
    kind: 'list',
    value: 6,
    keywords: ['done', 'checked', 'complete', 'task-done'],
  },
]

export type SlashMenuState = {
  query: string
  slashStart: number
  lineStart: number
  cursor: number
}

export function getSlashMenuState(content: string, cursor: number): SlashMenuState | null {
  const lineStart = content.lastIndexOf('\n', cursor - 1) + 1
  const lineBeforeCursor = content.slice(lineStart, cursor)
  const match = lineBeforeCursor.match(/\/([a-zA-Z0-9]*)$/)
  if (!match || match.index === undefined) return null

  const beforeSlash = lineBeforeCursor.slice(0, match.index)
  if (beforeSlash.trim().length > 0) return null

  return {
    query: match[1].toLowerCase(),
    slashStart: lineStart + match.index,
    lineStart,
    cursor,
  }
}

export function filterSlashCommands(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS

  return SLASH_COMMANDS.filter(command => {
    const haystack = [
      command.label,
      command.description,
      ...command.keywords,
    ]
      .join(' ')
      .toLowerCase()

    return (
      command.keywords.some(keyword => keyword.startsWith(query)) ||
      haystack.includes(query) ||
      command.label.toLowerCase().startsWith(query)
    )
  })
}

export function applySlashCommand(
  content: string,
  state: SlashMenuState,
  command: SlashCommand,
): { content: string; cursor: number } {
  const lineEndIndex = content.indexOf('\n', state.cursor)
  const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex
  const lineAfterCursor = content.slice(state.cursor, lineEnd)

  const contentWithoutSlash =
    content.slice(0, state.slashStart) + lineAfterCursor + content.slice(lineEnd)
  const cursorAfterRemoval = state.slashStart + lineAfterCursor.length

  if (command.kind === 'heading') {
    return applyHeadingAtCursor(
      contentWithoutSlash,
      cursorAfterRemoval,
      command.value as HeadingLevel,
    )
  }

  return applyListAtCursor(contentWithoutSlash, cursorAfterRemoval, command.value as ListType)
}
