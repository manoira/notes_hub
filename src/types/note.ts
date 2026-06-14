export type Page = {
  id: string
  kind: 'page'
  title: string
  content: string
  updatedAt: string
}

export type SmartLink = {
  id: string
  kind: 'link'
  title: string
  url: string
  updatedAt: string
}

export type SidebarItem = Page | SmartLink

export type WorkspaceState = {
  items: SidebarItem[]
  activeId: string | null
}

/** @deprecated Use Page — kept for migration from older saves */
export type Note = Omit<Page, 'kind'>
