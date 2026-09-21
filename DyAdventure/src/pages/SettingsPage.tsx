import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { APP_NAME, APP_VERSION } from '../constants'
import changelog from '../content/changelog.json'
import type { ChangelogEntry } from '../types'

const CHANGELOG = changelog as ChangelogEntry[]

export default function SettingsPage() {
  const exportSave = useGameStore((s) => s.exportSave)
  const importSave = useGameStore((s) => s.importSave)
  const resetGame = useGameStore((s) => s.resetGame)
  const saveNow = useGameStore((s) => s.saveNow)
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <div className="mb-4">
        <div className="fw-bold">{APP_NAME} v{APP_VERSION}</div>
      </div>

      <div className="mb-4">
        <h6>Save</h6>
        <p className="text-body-secondary small mb-2">
          Your progress autosaves to this browser every few seconds while you play, and is restored automatically
          when you reopen the game.
        </p>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={() => {
            const success = saveNow()
            setSavedAt(success ? new Date().toLocaleTimeString() : null)
            setMessage(success ? null : 'Save failed — your browser may be blocking local storage.')
          }}
        >
          Save now
        </button>
        {savedAt && <div className="small text-body-secondary mb-2">Saved at {savedAt}.</div>}

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={async () => {
            const data = exportSave()
            try {
              await navigator.clipboard.writeText(data)
              setMessage('Save copied to clipboard.')
            } catch {
              setMessage(data)
            }
          }}
        >
          Export save
        </button>

        <textarea
          className="form-control form-control-sm mb-2"
          rows={3}
          placeholder="Paste a save string here to import"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-primary mb-2"
          disabled={!importText.trim()}
          onClick={() => {
            if (!confirm('Importing will overwrite your current save. Continue?')) return
            const success = importSave(importText.trim())
            setMessage(success ? 'Save imported.' : 'Import failed — invalid save string.')
            if (success) setImportText('')
          }}
        >
          Import save
        </button>

        {message && <div className="small text-body-secondary">{message}</div>}
      </div>

      <div className="mb-4">
        <h6>Reset</h6>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => {
            if (confirm('This will permanently erase your progress. Are you sure?')) resetGame()
          }}
        >
          Reset game
        </button>
      </div>

      <div>
        <h6>Changelog</h6>
        {CHANGELOG.map((entry) => (
          <div key={entry.version} className="mb-2">
            <div className="fw-bold small">v{entry.version} — {entry.date}</div>
            <ul className="small mb-0">
              {entry.changes.map((change, i) => <li key={i}>{change}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
