export type SidebarItemBase = {
  id: string
  title: string
  updatedAt: string
  parentId: string | null
}

export type Page = SidebarItemBase & {
  kind: 'page'
  content: string
}

export type SmartLink = SidebarItemBase & {
  kind: 'link'
  url: string
}

export type SidebarItem = Page | SmartLink

export type WorkspaceState = {
  items: SidebarItem[]
  activeId: string | null
}

/** @deprecated Use Page — kept for migration from older saves */
export type Note = Omit<Page, 'kind' | 'parentId'> & { parentId?: string | null }
