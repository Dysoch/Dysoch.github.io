import { useGameStore } from '../store/gameStore'
import { canRecall } from '../worker/simLogic'
import type { TabId } from '../types'
import { Icon } from './icons'

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'combat', icon: 'sword', label: 'Combat' },
  { id: 'training', icon: 'cog', label: 'Training' },
  { id: 'abilities', icon: 'sparkles', label: 'Abilities' },
  { id: 'inventory', icon: 'backpack', label: 'Inventory' },
  { id: 'zones', icon: 'map', label: 'Zones' },
  { id: 'crafting', icon: 'cog', label: 'Crafting' },
  { id: 'statistics', icon: 'crown', label: 'Statistics' },
  { id: 'prestige', icon: 'crown', label: 'Prestige' },
  { id: 'guide', icon: 'book', label: 'Guide' },
  { id: 'settings', icon: 'cog', label: 'Settings' },
]

export default function TabBar() {
  const activeTab = useGameStore((s) => s.activeTab)
  const setActiveTab = useGameStore((s) => s.setActiveTab)
  // Once unlocked, stays visible forever — canRecall alone would flicker off right after every
  // Recall/Ascend (both wipe maxDepthByZone), so a permanent lifetime counter backs it up.
  const prestigeUnlocked = useGameStore((s) => canRecall(s) || (s.lifetime.recalls ?? 0) > 0)
  const tabs = TABS.filter((tab) => tab.id !== 'prestige' || prestigeUnlocked)

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
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
