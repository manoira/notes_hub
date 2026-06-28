export type SidebarItemBase = {
  id: string
  title: string
  updatedAt: string
  /** Parent page in the tree (nested pages / links). */
  parentId: string | null
  /** Top-level grouping in the sidebar (Notion-style section). Ignored when parentId is set. */
  sectionId: string | null
  /** Sort order among siblings (lower = higher in the list). */
  order?: number
}

/** Notion-style callout: an icon paired with a block of text. */
export type InfoPanel = {
  id: string
  icon: string
  text: string
}

export type PageCover = {
  url: string
  source: 'upload' | 'link' | 'unsplash'
  attribution?: string
}

/** Per-page font choices (Google Fonts family ids). */
export type PageTypography = {
  headingFont?: string
  bodyFont?: string
}

export type Page = SidebarItemBase & {
  kind: 'page'
  content: string
  /** Information panels (callouts) rendered above the page body. */
  panels?: InfoPanel[]
  cover?: PageCover | null
  typography?: PageTypography
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
