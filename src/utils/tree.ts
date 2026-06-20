import type { SidebarItem, SmartLink } from '../types/note'

export type TreeNode = {
  item: SidebarItem
  children: TreeNode[]
}

export function buildTree(
  items: SidebarItem[],
  parentId: string | null = null,
): TreeNode[] {
  return items
    .filter(item => (item.parentId ?? null) === parentId)
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .map(item => ({
      item,
      children: buildTree(items, item.id),
    }))
}

export function collectDescendantIds(items: SidebarItem[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId])

  for (const item of items) {
    if (item.parentId && ids.has(item.parentId)) {
      ids.add(item.id)
    }
  }

  // Repeat until no new descendants (handles arbitrary depth)
  let previousSize = 0
  while (ids.size !== previousSize) {
    previousSize = ids.size
    for (const item of items) {
      if (item.parentId && ids.has(item.parentId)) {
        ids.add(item.id)
      }
    }
  }

  return ids
}

export function isValidParentId(
  items: SidebarItem[],
  parentId: string | null,
  itemId?: string,
): boolean {
  if (parentId === null) return true
  if (itemId && parentId === itemId) return false

  const parent = items.find(item => item.id === parentId)
  if (!parent) return false
  if (itemId && collectDescendantIds(items, itemId).has(parentId)) return false

  return true
}

export function getChildLinks(items: SidebarItem[], parentId: string): SmartLink[] {
  return items
    .filter(
      (item): item is SmartLink => item.kind === 'link' && item.parentId === parentId,
    )
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
}
