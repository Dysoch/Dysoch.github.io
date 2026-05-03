import { useState } from 'react'
import { APP_NAME, APP_VERSION } from '../constants'
import changelogData from '../content/changelog.json'
import type { ChangelogEntry } from '../types'

const changelog = changelogData as ChangelogEntry[]

const SECTION_CONFIG: { key: keyof ChangelogEntry; label: string; badgeClass: string }[] = [
  { key: 'added',   label: 'Added',   badgeClass: 'bg-success' },
  { key: 'changed', label: 'Changed', badgeClass: 'bg-primary' },
  { key: 'fixed',   label: 'Fixed',   badgeClass: 'bg-warning text-dark' },
  { key: 'removed', label: 'Removed', badgeClass: 'bg-danger' },
]

export default function About() {
  const [openVersions, setOpenVersions] = useState<Set<string>>(
    () => new Set([changelog[0]?.version])
  )

  const toggle = (version: string) =>
    setOpenVersions((prev) => {
      const next = new Set(prev)
      next.has(version) ? next.delete(version) : next.add(version)
      return next
    })

  return (
    <div className="p-4" style={{ maxWidth: 800 }}>
      {/* Developer info */}
      <h2>ℹ️ About</h2>

      <div className="card mt-3 mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div>
              <h5 className="card-title mb-0">Dysoch</h5>
              <span className="text-body-secondary" style={{ fontSize: '0.875rem' }}>
                Developer
              </span>
            </div>
          </div>
          <p className="card-text text-body-secondary mb-2">
            Hobby game developer and tinkerer. {APP_NAME} is a personal incremental idle game
            project — built for fun and to explore game mechanics over time.
          </p>
          <a
            href="https://github.com/Dysoch"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-secondary"
          >
            GitHub: Dysoch
          </a>
        </div>
      </div>

      {/* Game info */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <h5 className="mb-0">{APP_NAME}</h5>
        <span className="badge bg-secondary fw-normal">v{APP_VERSION}</span>
      </div>
      <p className="text-body-secondary mb-4" style={{ fontSize: '0.875rem' }}>
        An incremental idle game. Build your empire from the ground up — gather resources,
        unlock new abilities, and grow your wealth over time.
      </p>

      {/* Changelog */}
      <h5 className="mb-3">Changelog</h5>

      <div className="accordion">
        {changelog.map((entry) => {
          const isOpen = openVersions.has(entry.version)
          return (
            <div className="accordion-item" key={entry.version}>
              <h2 className="accordion-header">
                <button
                  className={`accordion-button ${isOpen ? '' : 'collapsed'}`}
                  type="button"
                  onClick={() => toggle(entry.version)}
                >
                  <span className="fw-semibold me-2">v{entry.version}</span>
                  <span className="text-body-secondary fw-normal" style={{ fontSize: '0.875rem' }}>
                    {entry.date}
                  </span>
                </button>
              </h2>

              <div className={`accordion-collapse ${isOpen ? 'show' : 'collapse'}`}>
                <div className="accordion-body">
                  {SECTION_CONFIG.map(({ key, label, badgeClass }) => {
                    const items = entry[key] as string[]
                    if (items.length === 0) return null
                    return (
                      <div key={key} className="mb-3">
                        <span className={`badge ${badgeClass} mb-2`}>{label}</span>
                        <ul className="mb-0" style={{ paddingLeft: '1.25rem' }}>
                          {items.map((item, i) => (
                            <li key={i} className="text-body-secondary" style={{ fontSize: '0.875rem' }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
