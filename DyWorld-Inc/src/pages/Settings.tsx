import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useGameStore } from '../store/gameStore'
import type { NumberFormatType } from '../types'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { numberFormat, setNumberFormat } = useGameStore()
  const [activeSettingsTab, setActiveSettingsTab] = useState<'ui' | 'gameplay'>('ui')
  const [pendingFormat, setPendingFormat] = useState<NumberFormatType>(numberFormat)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setNumberFormat(pendingFormat)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4">
      <h2>⚙️ Settings</h2>

      <ul className="nav nav-pills mt-3 mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeSettingsTab === 'ui' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('ui')}
          >
            UI
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeSettingsTab === 'gameplay' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('gameplay')}
          >
            Gameplay
          </button>
        </li>
      </ul>

      {activeSettingsTab === 'ui' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-body">
            <h5 className="card-title mb-3">Display</h5>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="fw-semibold">Dark Mode</div>
                <div className="text-body-secondary" style={{ fontSize: '0.875rem' }}>
                  Switch between light and dark theme
                </div>
              </div>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="darkModeToggle"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  style={{ width: '3rem', height: '1.5rem', cursor: 'pointer' }}
                />
                <label className="form-check-label visually-hidden" htmlFor="darkModeToggle">
                  Dark Mode
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSettingsTab === 'gameplay' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-body">
            <h5 className="card-title mb-3">Number Format</h5>
            <div className="mb-3">
              <label htmlFor="numberFormatSelect" className="form-label">
                How large numbers are displayed
              </label>
              <select
                id="numberFormatSelect"
                className="form-select"
                value={pendingFormat}
                onChange={(e) => setPendingFormat(e.target.value as NumberFormatType)}
              >
                <option value="engineering">Engineering (1.23K, 4.56M, 7.89B)</option>
                <option value="scientific">Scientific (1.23e3, 4.56e6, 7.89e9)</option>
                <option value="normal">Normal (1.23k, 4.56 million, 7.89 billion)</option>
              </select>
            </div>
            <button
              className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
              onClick={handleSave}
              disabled={pendingFormat === numberFormat}
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
