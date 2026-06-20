export type WorkspaceRecord = {
  items: unknown[]
  activeId: string | null
  revision: number
  updatedAt: string
}

export const emptyWorkspace = (): WorkspaceRecord => ({
  items: [],
  activeId: null,
  revision: 0,
  updatedAt: new Date().toISOString(),
})
