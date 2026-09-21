import { useGameStore } from '../store/gameStore'
import type { TabId } from '../types'
import { Icon } from './icons'

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'combat', icon: 'sword', label: 'Combat' },
  { id: 'training', icon: 'cog', label: 'Training' },
  { id: 'abilities', icon: 'sparkles', label: 'Abilities' },
  { id: 'inventory', icon: 'backpack', label: 'Inventory' },
  { id: 'zones', icon: 'map', label: 'Zones' },
  { id: 'prestige', icon: 'crown', label: 'Prestige' },
  { id: 'settings', icon: 'cog', label: 'Settings' },
]

export default function TabBar() {
  const activeTab = useGameStore((s) => s.activeTab)
  const setActiveTab = useGameStore((s) => s.setActiveTab)

  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'active' : ''}
          onClick={() => setActiveTab(tab.id)}
        >
          <Icon name={tab.icon} size={15} />
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
