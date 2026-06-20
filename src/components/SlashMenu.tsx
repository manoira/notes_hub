import type { SlashCommand } from '../utils/slashCommands'

type SlashMenuProps = {
  commands: SlashCommand[]
  selectedIndex: number
  query: string
  position: { top: number; left: number }
  onSelect: (command: SlashCommand) => void
  onHover: (index: number) => void
}

export function SlashMenu({
  commands,
  selectedIndex,
  query,
  position,
  onSelect,
  onHover,
}: SlashMenuProps) {
  const top = Math.min(Math.max(position.top, 16), window.innerHeight - 340)
  const left = Math.min(Math.max(position.left, 16), window.innerWidth - 336)

  if (commands.length === 0) {
    return (
      <div
        className="slash-menu"
        style={{ top, left }}
        role="listbox"
        aria-label="Slash commands"
      >
        <div className="slash-menu-empty">No matching commands for /{query}</div>
      </div>
    )
  }

  const groups = ['Text', 'Lists'] as const

  return (
    <div
      className="slash-menu"
      style={{ top, left }}
      role="listbox"
      aria-label="Slash commands"
    >
      <div className="slash-menu-header">Blocks</div>
      {groups.map(group => {
        const groupCommands = commands.filter(command => command.group === group)
        if (groupCommands.length === 0) return null

        return (
          <div key={group} className="slash-menu-group">
            <div className="slash-menu-group-label">{group}</div>
            {groupCommands.map(command => {
              const globalIndex = commands.indexOf(command)
              const isSelected = globalIndex === selectedIndex

              return (
                <button
                  key={command.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`slash-menu-item${isSelected ? ' is-selected' : ''}`}
                  onMouseDown={event => event.preventDefault()}
                  onMouseEnter={() => onHover(globalIndex)}
                  onClick={() => onSelect(command)}
                >
                  <span className="slash-menu-icon">{command.icon}</span>
                  <span className="slash-menu-copy">
                    <span className="slash-menu-label">{command.label}</span>
                    <span className="slash-menu-description">{command.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
