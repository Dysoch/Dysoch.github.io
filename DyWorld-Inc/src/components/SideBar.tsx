import { useGameStore } from '../store/gameStore'
import { GAME_TABS, BOTTOM_TABS } from '../constants'

export default function SideBar() {
  const activeTab = useGameStore((s) => s.activeTab)
  const setActiveTab = useGameStore((s) => s.setActiveTab)
  const activeJob = useGameStore((s) => s.activeJob)

  return (
    <nav
      className="d-flex flex-column border-end"
      style={{
        position: 'fixed',
        top: 56,
        left: 0,
        width: 220,
        height: 'calc(100vh - 56px)',
        zIndex: 1020,
        overflowY: 'auto',
      }}
    >
      <div className="flex-grow-1 pt-2">
        {GAME_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-link d-flex align-items-center gap-2 w-100 text-start text-decoration-none px-3 py-2 rounded-0 ${
              activeTab === tab.id ? 'active fw-semibold' : 'text-body-secondary'
            }`}
            style={activeTab === tab.id ? { color: 'var(--bs-emphasis-color)' } : undefined}
          >
            <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>{tab.icon}</span>
            {tab.label}
            {tab.id === 'manual-labor' && activeJob !== null && (
              <span
                className="rounded-circle bg-danger ms-auto flex-shrink-0"
                style={{ width: 8, height: 8, display: 'inline-block' }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="pb-2">
        <hr className="my-1" />
        {BOTTOM_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-link d-flex align-items-center gap-2 w-100 text-start text-decoration-none px-3 py-2 rounded-0 ${
              activeTab === tab.id ? 'active fw-semibold' : 'text-body-secondary'
            }`}
            style={activeTab === tab.id ? { color: 'var(--bs-emphasis-color)' } : undefined}
          >
            <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
