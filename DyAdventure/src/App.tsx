import './App.css'
import { useGameStore } from './store/gameStore'
import HudHeader from './components/HudHeader'
import TabBar from './components/TabBar'
import CombatPage from './pages/CombatPage'
import TrainingPage from './pages/TrainingPage'
import AbilitiesPage from './pages/AbilitiesPage'
import InventoryPage from './pages/InventoryPage'
import ZonesPage from './pages/ZonesPage'
import PrestigePage from './pages/PrestigePage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const activeTab = useGameStore((s) => s.activeTab)

  return (
    <div className="app-shell">
      <HudHeader />
      <TabBar />
      <div className="page-content">
        {activeTab === 'combat' && <CombatPage />}
        {activeTab === 'training' && <TrainingPage />}
        {activeTab === 'abilities' && <AbilitiesPage />}
        {activeTab === 'inventory' && <InventoryPage />}
        {activeTab === 'zones' && <ZonesPage />}
        {activeTab === 'prestige' && <PrestigePage />}
        {activeTab === 'settings' && <SettingsPage />}
      </div>
    </div>
  )
}

export default App
