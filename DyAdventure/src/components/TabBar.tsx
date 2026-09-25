import { useGameStore } from '../store/gameStore'
import { canRecall } from '../worker/simLogic'
import type { SimState, TabId } from '../types'
import { Icon } from './icons'

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'combat', icon: 'sword', label: 'Combat' },
  { id: 'training', icon: 'cog', label: 'Training' },
  { id: 'abilities', icon: 'sparkles', label: 'Abilities' },
  { id: 'inventory', icon: 'backpack', label: 'Inventory' },
  { id: 'zones', icon: 'map', label: 'Zones' },
  { id: 'crafting', icon: 'cog', label: 'Crafting' },
  { id: 'automation', icon: 'lightning', label: 'Automation' },
  { id: 'statistics', icon: 'crown', label: 'Statistics' },
  { id: 'prestige', icon: 'crown', label: 'Prestige' },
  { id: 'guide', icon: 'book', label: 'Guide' },
  { id: 'settings', icon: 'cog', label: 'Settings' },
]

// Tabs not listed here are always shown. The rest stay hidden until they're usable, and each gate
// only ever opens (discoveries, unlocked zones and lifetime counters never shrink), so a tab never
// flickers away again — canRecall alone would switch off right after every Recall/Ascend (both wipe
// maxDepthByZone), so the lifetime Recall counter backs it up.
const TAB_GATES: Partial<Record<TabId, (s: SimState) => boolean>> = {
  inventory: (s) => s.discoveredItemIds.length > 0,
  crafting: (s) => s.discoveredItemIds.length > 0,
  automation: (s) => s.discoveredItemIds.length > 0,
  zones: (s) => s.unlockedZoneIds.length > 1,
  prestige: (s) => canRecall(s) || (s.lifetime.recalls ?? 0) > 0,
}

export default function TabBar() {
  const activeTab = useGameStore((s) => s.activeTab)
  const setActiveTab = useGameStore((s) => s.setActiveTab)
  // Selector returns a joined string so the bar only re-renders when the visible set changes
  const visible = useGameStore((s) => TABS.filter((tab) => TAB_GATES[tab.id]?.(s) ?? true).map((tab) => tab.id).join(','))
  const tabs = TABS.filter((tab) => visible.split(',').includes(tab.id))

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
