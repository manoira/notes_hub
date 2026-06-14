import { NoteEditor } from './components/NoteEditor'
import { Sidebar } from './components/Sidebar'
import { useNotes } from './hooks/useNotes'
import './App.css'

function App() {
  const { notes, activeNote, activeId, selectNote, addNote, updateNote, deleteNote } = useNotes()

  return (
    <div className="app-shell">
      <Sidebar
        notes={notes}
        activeId={activeId}
        onSelect={selectNote}
        onAdd={addNote}
      />
      {activeNote ? (
        <NoteEditor
          key={activeNote.id}
          note={activeNote}
          onChange={patch => updateNote(activeNote.id, patch)}
          onDelete={() => deleteNote(activeNote.id)}
        />
      ) : (
        <main className="editor-empty">Select or create a page</main>
      )}
    </div>
  )
}

export default App
