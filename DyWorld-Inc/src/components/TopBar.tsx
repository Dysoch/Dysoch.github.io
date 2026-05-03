import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { APP_NAME, APP_VERSION } from '../constants'
import { formatNumber } from '../utils/format'
import resourcesData from '../content/resources.json'
import type { Resource } from '../types'

const capitalResources = (resourcesData as Resource[]).filter((r) => r.category === 'capital')

export default function TopBar() {
  const [now, setNow] = useState(() => new Date())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { exportSave, importSave, resetGame, resources } = useGameStore()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)

  const handleSave = () => {
    useGameStore.persist.rehydrate()
    setDropdownOpen(false)
  }

  const handleLoad = () => {
    useGameStore.persist.rehydrate()
    setDropdownOpen(false)
  }

  const handleExport = () => {
    const data = exportSave()
    navigator.clipboard.writeText(data).then(
      () => alert('Save data copied to clipboard!'),
      () => prompt('Copy your save data:', data)
    )
    setDropdownOpen(false)
  }

  const handleImport = () => {
    const encoded = prompt('Paste your save data:')
    if (encoded) {
      const ok = importSave(encoded.trim())
      alert(ok ? 'Save imported successfully!' : 'Invalid save data.')
    }
    setDropdownOpen(false)
  }

  const handleReset = () => {
    if (window.confirm('Reset all game data? This cannot be undone.')) {
      resetGame()
    }
    setDropdownOpen(false)
  }

  return (
    <nav
      className="navbar navbar-expand px-3"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 1030 }}
    >
      {/* App name */}
      <span className="navbar-brand mb-0 h6 me-3 text-secondary fw-semibold flex-shrink-0">
        {APP_NAME}
        <span className="ms-2 badge bg-secondary fw-normal" style={{ fontSize: '0.65rem' }}>
          v{APP_VERSION}
        </span>
      </span>

      {/* Capital coin overview — centered */}
      <div className="d-flex align-items-center gap-3 mx-auto" style={{ fontSize: '0.85rem' }}>
        {capitalResources.map((r) => (
          <span
            key={r.id}
            title={r.name}
            style={{ cursor: 'default', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
          >
            {r.icon} {formatNumber(resources[r.id] ?? 0)}
          </span>
        ))}
        <span className="text-body-secondary" style={{ opacity: 0.4 }}>|</span>
        <span className="text-body fw-semibold" style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem' }}>
          {formattedTime}
        </span>
      </div>

      {/* Menu */}
      <div className="ms-3 flex-shrink-0" ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setDropdownOpen((o) => !o)}
          aria-expanded={dropdownOpen}
        >
          ☰ Menu
        </button>

        {dropdownOpen && (
          <ul
            className="dropdown-menu show"
            style={{ position: 'absolute', right: 0, top: '100%', minWidth: 160 }}
          >
            <li>
              <button className="dropdown-item" onClick={handleSave}>
                💾 Save
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleLoad}>
                📂 Load
              </button>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button className="dropdown-item" onClick={handleExport}>
                📤 Export
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleImport}>
                📥 Import
              </button>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button className="dropdown-item text-danger" onClick={handleReset}>
                🗑️ Reset
              </button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  )
}
