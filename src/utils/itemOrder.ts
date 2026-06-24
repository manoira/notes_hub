import type { SidebarItem } from '../types/note'
import { collectDescendantIds } from './tree'

export type DropPosition = 'before' | 'after' | 'inside'

export function siblingContext(item: SidebarItem): {
  parentId: string | null
  sectionId: string | null
} {
  const parentId = item.parentId ?? null
  return {
    parentId,
    sectionId: parentId === null ? (item.sectionId ?? null) : null,
  }
}

export function compareItemOrder(a: SidebarItem, b: SidebarItem): number {
  const orderDiff = (a.order ?? 0) - (b.order ?? 0)
  if (orderDiff !== 0) return orderDiff
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function getSortedSiblings(
  items: SidebarItem[],
  parentId: string | null,
  sectionId: string | null,
): SidebarItem[] {
  return items
    .filter(item => {
      const context = siblingContext(item)
      return context.parentId === parentId && context.sectionId === sectionId
    })
    .sort(compareItemOrder)
}

export function orderForNewSibling(
  items: SidebarItem[],
  parentId: string | null,
  sectionId: string | null,
): number {
  const siblings = getSortedSiblings(items, parentId, sectionId)
  if (siblings.length === 0) return 0
  return Math.min(...siblings.map(item => item.order ?? 0)) - 1
}

export function assignMissingOrders(items: SidebarItem[]): SidebarItem[] {
  const groups = new Map<string, SidebarItem[]>()

  for (const item of items) {
    const { parentId, sectionId } = siblingContext(item)
    const key = `${parentId}:${sectionId ?? ''}`
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }

  const orderById = new Map<string, number>()

  for (const group of groups.values()) {
    const sorted = [...group].sort(compareItemOrder)
    sorted.forEach((item, index) => {
      orderById.set(item.id, item.order ?? index)
    })
  }

  return items.map(item => ({
    ...item,
    order: orderById.get(item.id) ?? 0,
  }))
}

function reindexSiblings(
  items: SidebarItem[],
  parentId: string | null,
  sectionId: string | null,
  orderedIds: string[],
): SidebarItem[] {
  const orderById = new Map(orderedIds.map((id, index) => [id, index]))
  return items.map(item => {
    const context = siblingContext(item)
    if (context.parentId !== parentId || context.sectionId !== sectionId) return item
    const order = orderById.get(item.id)
    if (order === undefined) return item
    return { ...item, order, updatedAt: new Date().toISOString() }
  })
}

export function applyItemDrop(
  items: SidebarItem[],
  draggedId: string,
  targetId: string,
  position: DropPosition,
): SidebarItem[] | null {
  if (draggedId === targetId) return null

  const dragged = items.find(item => item.id === draggedId)
  const target = items.find(item => item.id === targetId)
  if (!dragged || !target) return null
  if (collectDescendantIds(items, draggedId).has(targetId)) return null

  if (position === 'inside' && target.kind === 'link') return null

  const oldContext = siblingContext(dragged)
  let newParentId: string | null
  let newSectionId: string | null

  if (position === 'inside') {
    newParentId = target.id
    newSectionId = null
  } else {
    const targetContext = siblingContext(target)
    newParentId = targetContext.parentId
    newSectionId = targetContext.sectionId
  }

  let nextItems = items.map(item => {
    if (item.id !== draggedId) return item
    return {
      ...item,
      parentId: newParentId,
      sectionId: newSectionId,
    }
  })

  const destinationSiblings = getSortedSiblings(nextItems, newParentId, newSectionId).filter(
    item => item.id !== draggedId,
  )

  let insertIndex = destinationSiblings.findIndex(item => item.id === targetId)
  if (position === 'after') insertIndex += 1
  if (position === 'inside') insertIndex = destinationSiblings.length
  if (insertIndex < 0) insertIndex = destinationSiblings.length

  const moved = nextItems.find(item => item.id === draggedId)!
  const orderedIds = [...destinationSiblings.map(item => item.id)]
  orderedIds.splice(insertIndex, 0, moved.id)

  nextItems = reindexSiblings(nextItems, newParentId, newSectionId, orderedIds)

  const oldGroupChanged =
    oldContext.parentId !== newParentId || oldContext.sectionId !== newSectionId

  if (oldGroupChanged) {
    const oldSiblingIds = getSortedSiblings(nextItems, oldContext.parentId, oldContext.sectionId)
      .filter(item => item.id !== draggedId)
      .map(item => item.id)
    nextItems = reindexSiblings(
      nextItems,
      oldContext.parentId,
      oldContext.sectionId,
      oldSiblingIds,
    )
  }

  return nextItems
}

export function applyItemDropToSection(
  items: SidebarItem[],
  draggedId: string,
  sectionId: string | null,
): SidebarItem[] | null {
  const dragged = items.find(item => item.id === draggedId)
  if (!dragged) return null

  const oldContext = siblingContext(dragged)
  let nextItems = items.map(item => {
    if (item.id !== draggedId) return item
    return {
      ...item,
      parentId: null,
      sectionId,
    }
  })

  const siblingIds = getSortedSiblings(nextItems, null, sectionId)
    .filter(item => item.id !== draggedId)
    .map(item => item.id)
  siblingIds.push(draggedId)

  nextItems = reindexSiblings(nextItems, null, sectionId, siblingIds)

  if (oldContext.parentId !== null || oldContext.sectionId !== sectionId) {
    const oldSiblingIds = getSortedSiblings(nextItems, oldContext.parentId, oldContext.sectionId)
      .filter(item => item.id !== draggedId)
      .map(item => item.id)
    nextItems = reindexSiblings(
      nextItems,
      oldContext.parentId,
      oldContext.sectionId,
      oldSiblingIds,
    )
  }

  return nextItems
}

export function dropPositionFromPointer(
  clientY: number,
  rect: DOMRect,
  allowInside: boolean,
): DropPosition {
  const height = rect.height
  const offset = clientY - rect.top
  const edge = Math.min(8, height * 0.25)

  if (offset <= edge) return 'before'
  if (offset >= height - edge) return 'after'
  return allowInside ? 'inside' : offset < height / 2 ? 'before' : 'after'
}
