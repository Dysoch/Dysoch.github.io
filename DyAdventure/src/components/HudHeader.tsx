import { useGameStore } from '../store/gameStore'
import { computeMagicPower, computePhysicalPower, getZoneDef } from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from './icons'

function Bar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  return (
    <div className="hud-bar">
      <div className="hud-bar-label">
        <span>{label}</span>
        <span>{formatNumber(current)} / {formatNumber(max)}</span>
      </div>
      <div className="hud-bar-track">
        <div className="hud-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function HudHeader() {
  const state = useGameStore((s) => s)
  const combatPower = Math.round((computePhysicalPower(state) + computeMagicPower(state)) * 50)
  const setActiveTab = useGameStore((s) => s.setActiveTab)
  const zone = getZoneDef(state.currentZoneId)

  return (
    <header className="hud-header">
      <div className="hud-portrait">
        <Icon name="sword" size={20} />
      </div>
      <div style={{ minWidth: '110px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 600, fontSize: '14px' }}>Adventurer</div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>Power {formatNumber(combatPower)}</div>
      </div>

      <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />

      <div style={{ display: 'flex', gap: '16px', flexGrow: 1, flexWrap: 'wrap' }}>
        <Bar label="HP" current={state.playerHp.current} max={state.playerHp.max} color="var(--hp)" />
        <Bar label="Stamina" current={state.stamina.current} max={state.stamina.max} color="var(--physical)" />
        <Bar label="Mana" current={state.mana.current} max={state.mana.max} color="var(--arcane)" />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="hud-chip" style={{ color: 'var(--focus)' }}>
          <Icon name="flame" size={15} />
          <span style={{ color: 'var(--text)' }}>{formatNumber(state.focus)}</span>
        </div>
        <button
          type="button"
          className="hud-chip"
          title="Go to Combat"
          onClick={() => setActiveTab('combat')}
          style={{ cursor: 'pointer', color: 'var(--text)' }}
        >
          <Icon name={state.currentMonster?.isBoss ? 'crown' : 'map'} size={15} />
          <span>
            {zone.name} · Depth {formatNumber(state.currentDepth)}
            {!state.depthMode.auto && <span style={{ color: 'var(--text-dim)' }}> (pinned)</span>}
          </span>
        </button>
        {state.fainted && (
          <div className="hud-chip" style={{ color: 'var(--physical)', borderColor: 'var(--physical)' }}>
            Fainted — recovering…
          </div>
        )}
      </div>
    </header>
  )
}
