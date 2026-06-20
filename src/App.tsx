import { useEffect } from 'react'
import { LinkPreview } from './components/LinkPreview'
import { NoteEditor } from './components/NoteEditor'
import { Sidebar } from './components/Sidebar'
import { APP_VERSION } from './buildInfo'
import { useNotes } from './hooks/useNotes'
import { getChildLinks } from './utils/tree'
import './App.css'

function App() {
  useEffect(() => {
    document.title = `Notes Hub · ${APP_VERSION}`
  }, [])

  const {
    loaded,
    items,
    activeItem,
    activeId,
    persistence,
    selectItem,
    addPage,
    addLink,
    updatePage,
    updateLink,
    deleteItem,
  } = useNotes()

  if (!loaded) {
    return (
      <main className="editor-empty app-loading" aria-busy="true">
        Loading workspace…
      </main>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        items={items}
        activeId={activeId}
        persistence={persistence}
        onSelect={selectItem}
        onAddPage={addPage}
        onAddLink={addLink}
      />
      {activeItem?.kind === 'page' ? (
        <NoteEditor
          key={activeItem.id}
          note={activeItem}
          childLinks={getChildLinks(items, activeItem.id)}
          onSelectLink={selectItem}
          onChange={patch => updatePage(activeItem.id, patch)}
          onDelete={() => deleteItem(activeItem.id)}
          persistence={persistence}
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
