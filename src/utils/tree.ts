import type { SidebarItem, SmartLink } from '../types/note'
import type { SidebarSection } from '../types/workspace'
import { compareItemOrder } from './itemOrder'

export type TreeNode = {
  item: SidebarItem
  children: TreeNode[]
}

export type SidebarGroup = {
  section: SidebarSection | null
  nodes: TreeNode[]
}

export function buildTree(
  items: SidebarItem[],
  parentId: string | null = null,
): TreeNode[] {
  return items
    .filter(item => (item.parentId ?? null) === parentId)
    .sort(compareItemOrder)
    .map(item => ({
      item,
      children: buildTree(items, item.id),
    }))
}

export function buildSidebarGroups(
  items: SidebarItem[],
  sections: SidebarSection[],
): SidebarGroup[] {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)
  const groups: SidebarGroup[] = []

  const unsectioned = buildTree(
    items.filter(item => (item.parentId ?? null) === null && (item.sectionId ?? null) === null),
  )
  if (unsectioned.length > 0) {
    groups.push({ section: null, nodes: unsectioned })
  }

  for (const section of sortedSections) {
    const nodes = buildTree(
      items.filter(
        item => (item.parentId ?? null) === null && (item.sectionId ?? null) === section.id,
      ),
    )
    groups.push({ section, nodes })
  }

  return groups
}

export function collectDescendantIds(items: SidebarItem[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId])

  for (const item of items) {
    if (item.parentId && ids.has(item.parentId)) {
      ids.add(item.id)
    }
  }

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
    .sort(compareItemOrder)
}

export function nextSectionOrder(sections: SidebarSection[]): number {
  if (sections.length === 0) return 0
  return Math.max(...sections.map(section => section.order)) + 1
}
