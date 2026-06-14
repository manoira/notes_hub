import { useCallback, useEffect, useState } from 'react'
import type { Note } from '../types/note'

const STORAGE_KEY = 'notes_hub_v1'

function createNote(title = 'Untitled'): Note {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title,
    content: '',
    updatedAt: now,
  }
}

function seedNotes(): Note[] {
  const welcome = createNote('Welcome')
  welcome.content =
    'Notes Hub is your space for notes and data.\n\nUse the sidebar to switch pages or create new ones.'
  const ideas = createNote('Ideas')
  ideas.content = '- Project roadmap\n- Meeting notes\n- Research links'
  return [welcome, ideas]
}

function loadState(): { notes: Note[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const notes = seedNotes()
      return { notes, activeId: notes[0]?.id ?? null }
    }
    const parsed = JSON.parse(raw) as { notes: Note[]; activeId: string | null }
    if (!Array.isArray(parsed.notes) || parsed.notes.length === 0) {
      const notes = seedNotes()
      return { notes, activeId: notes[0]?.id ?? null }
    }
    const activeId =
      parsed.activeId && parsed.notes.some(n => n.id === parsed.activeId)
        ? parsed.activeId
        : parsed.notes[0].id
    return { notes: parsed.notes, activeId }
  } catch {
    const notes = seedNotes()
    return { notes, activeId: notes[0]?.id ?? null }
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadState().notes)
  const [activeId, setActiveId] = useState<string | null>(() => loadState().activeId)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes, activeId }))
  }, [notes, activeId])

  const activeNote = notes.find(n => n.id === activeId) ?? null

  const selectNote = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const addNote = useCallback(() => {
    const note = createNote()
    setNotes(prev => [note, ...prev])
    setActiveId(note.id)
  }, [])

  const updateNote = useCallback((id: string, patch: Partial<Pick<Note, 'title' | 'content'>>) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id
          ? { ...note, ...patch, updatedAt: new Date().toISOString() }
          : note,
      ),
    )
  }, [])

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id)
      if (next.length === 0) {
        const note = createNote()
        setActiveId(note.id)
        return [note]
      }
      setActiveId(current => {
        if (current !== id) return current
        return next[0]?.id ?? null
      })
      return next
    })
  }, [])

  return { notes, activeNote, activeId, selectNote, addNote, updateNote, deleteNote }
}
