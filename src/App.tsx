import { useEffect } from 'react'
import { LinkPreview } from './components/LinkPreview'
import { EditorTopbar } from './components/EditorTopbar'
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
    sections,
    activeItem,
    activeId,
    persistence,
    selectItem,
    addPage,
    addLink,
    addSection,
    updateSection,
    deleteSection,
    moveItemToSection,
    moveItem,
    moveItemToSectionEnd,
    renameItem,
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
        sections={sections}
        activeId={activeId}
        persistence={persistence}
        onSelect={selectItem}
        onAddPage={addPage}
        onAddLink={addLink}
        onAddSection={() => addSection()}
        onUpdateSection={updateSection}
        onDeleteSection={deleteSection}
        onMoveItemToSection={moveItemToSection}
        onMoveItem={moveItem}
        onMoveItemToSectionEnd={moveItemToSectionEnd}
        onRenameItem={renameItem}
        onDeleteItem={deleteItem}
      />
      <div className="main-column">
        {activeItem ? (
          <EditorTopbar items={items} activeId={activeItem.id} onSelect={selectItem} />
        ) : null}
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
    </div>
  )
}

export default App
