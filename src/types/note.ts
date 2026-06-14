export type Note = {
  id: string
  title: string
  content: string
  updatedAt: string
}

export type NotesState = {
  notes: Note[]
  activeId: string | null
}
