import { LinkPreview } from './components/LinkPreview'
import { NoteEditor } from './components/NoteEditor'
import { Sidebar } from './components/Sidebar'
import { useNotes } from './hooks/useNotes'
import './App.css'

function App() {
  const {
    items,
    activeItem,
    activeId,
    selectItem,
    addPage,
    addLink,
    updatePage,
    updateLink,
    deleteItem,
  } = useNotes()

  return (
    <div className="app-shell">
      <Sidebar
        items={items}
        activeId={activeId}
        onSelect={selectItem}
        onAddPage={addPage}
        onAddLink={addLink}
      />
      {activeItem?.kind === 'page' ? (
        <NoteEditor
          key={activeItem.id}
          note={activeItem}
          onChange={patch => updatePage(activeItem.id, patch)}
          onDelete={() => deleteItem(activeItem.id)}
        />
      ) : activeItem?.kind === 'link' ? (
        <LinkPreview
          key={activeItem.id}
          link={activeItem}
          onChange={patch => updateLink(activeItem.id, patch)}
          onDelete={() => deleteItem(activeItem.id)}
        />
      ) : (
        <main className="editor-empty">Select or create a page or smart link</main>
      )}
    </div>
  )
}

export default App
