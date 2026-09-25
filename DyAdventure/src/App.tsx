import './App.css'
import { useGameStore } from './store/gameStore'
import HudHeader from './components/HudHeader'
import TabBar from './components/TabBar'
import OfflineSummaryModal from './components/OfflineSummaryModal'
import CombatPage from './pages/CombatPage'
import TrainingPage from './pages/TrainingPage'
import AbilitiesPage from './pages/AbilitiesPage'
import InventoryPage from './pages/InventoryPage'
import ZonesPage from './pages/ZonesPage'
import CraftingPage from './pages/CraftingPage'
import AutomationPage from './pages/AutomationPage'
import StatisticsPage from './pages/StatisticsPage'
import PrestigePage from './pages/PrestigePage'
import GuidePage from './pages/GuidePage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const activeTab = useGameStore((s) => s.activeTab)

  return (
    <div className="app-shell">
      <OfflineSummaryModal />
      <HudHeader />
      <TabBar />
      <div className="page-content">
        {activeTab === 'combat' && <CombatPage />}
        {activeTab === 'training' && <TrainingPage />}
        {activeTab === 'abilities' && <AbilitiesPage />}
        {activeTab === 'inventory' && <InventoryPage />}
        {activeTab === 'zones' && <ZonesPage />}
        {activeTab === 'crafting' && <CraftingPage />}
        {activeTab === 'automation' && <AutomationPage />}
        {activeTab === 'statistics' && <StatisticsPage />}
        {activeTab === 'prestige' && <PrestigePage />}
        {activeTab === 'guide' && <GuidePage />}
        {activeTab === 'settings' && <SettingsPage />}
      </div>
    </div>
  )
}

export default App
