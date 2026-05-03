import { useTheme } from '../hooks/useTheme'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="p-4">
      <h2>⚙️ Settings</h2>

      <div className="card mt-3" style={{ maxWidth: 480 }}>
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
    </div>
  )
}
