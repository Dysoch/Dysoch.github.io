import { useGameStore } from '../store/gameStore'
import { computeMonsterAttackIntervalMs, getCheckpointDepth, getGearCatalogItem, getMaxDepthReached, getZoneDef } from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import AbilityBar from '../components/AbilityBar'
import { Icon } from '../components/icons'
import type { CombatEvent } from '../types'

function describeEvent(event: CombatEvent): string {
  switch (event.kind) {
    case 'damage':
      if (event.source === 'monster') return `The monster hit you for ${formatNumber(event.amount)} damage`
      return `You hit for ${formatNumber(event.amount)} damage${event.manual ? ' (manual!)' : ''}`
    case 'kill':
      return `Defeated ${event.monsterName} at depth ${event.depth}`
    case 'bossDefeated':
      return `👑 Boss defeated at depth ${event.depth}! A new augment has been discovered.`
    case 'loot':
      return `Loot: ${getGearCatalogItem(event.item.catalogId).name}`
    case 'fuse':
      return `Fused a duplicate — item is now level ${event.newLevel}`
    case 'salvage':
      return `Salvaged an item for ${formatNumber(event.focusGained)} Focus`
    case 'levelUp':
      return `${event.statId} increased to ${event.newLevel}`
    case 'faint':
      return `You fainted and were sent back to depth ${event.checkpointDepth}. Recovering…`
    case 'zoneUnlocked':
      return `Gate Boss defeated — new zone unlocked: ${getZoneDef(event.zoneId).name}!`
    case 'recovered':
      return `You've recovered and rejoined the fight`
    case 'notEnoughResource':
      return `Not enough resource for ${event.abilityId}`
  }
}

export default function CombatPage() {
  const state = useGameStore((s) => s)
  const setMode = useGameStore((s) => s.setMode)
  const setDepthMode = useGameStore((s) => s.setDepthMode)
  const combatLog = useGameStore((s) => s.combatLog)
  const zone = getZoneDef(state.currentZoneId)
  const maxReached = getMaxDepthReached(state, zone)
  const monster = state.currentMonster
  const hpPct = monster ? Math.max(0, Math.min(100, (monster.hp / monster.maxHp) * 100)) : 0
  const attackIntervalMs = monster ? computeMonsterAttackIntervalMs(zone, monster.isBoss) : 1
  const monsterTimerPct = Math.max(0, Math.min(100, (state.monsterActionTimerMs / attackIntervalMs) * 100))

  return (
    <div className="combat-page">
      <div className="combat-feed">
        <div className="combat-main">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>{zone.name}</h2>
              <div style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>Depth {state.currentDepth} of {zone.maxDepth}</div>
            </div>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm ${state.combatMode === 'idle' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setMode('idle')}
              >
                Idle
              </button>
              <button
                type="button"
                className={`btn btn-sm ${state.combatMode === 'active' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setMode('active')}
              >
                Active
              </button>
            </div>
          </div>

          {monster && (
            <div className="panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="hud-portrait" style={{ borderColor: 'var(--physical)', color: 'var(--physical)' }}>
                  <Icon name={monster.isBoss ? 'crown' : 'axe'} size={18} />
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '5px' }}>{monster.name}</div>
                  <div className="hud-bar-track" style={{ height: '9px' }}>
                    <div className="hud-bar-fill" style={{ width: `${hpPct}%`, height: '100%', background: monster.isBoss ? 'var(--focus)' : 'var(--hp)' }} />
                  </div>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                  {formatNumber(monster.hp)} / {formatNumber(monster.maxHp)}
                </div>
              </div>

              <div className="hud-bar-label">
                <span>Monster's next attack</span>
                <span>{Math.round(monsterTimerPct)}%</span>
              </div>
              <div className="hud-bar-track">
                <div className="hud-bar-fill" style={{ width: `${monsterTimerPct}%`, background: 'var(--physical)' }} />
              </div>
            </div>
          )}

          <div className="d-flex align-items-center gap-3 small">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="auto-descend"
                checked={state.depthMode.auto}
                onChange={(e) => setDepthMode(e.target.checked ? { auto: true } : { auto: false, pinnedDepth: state.currentDepth })}
              />
              <label className="form-check-label" htmlFor="auto-descend">Auto-descend</label>
            </div>
            {!state.depthMode.auto && (
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ width: '100px' }}
                min={zone.minDepth}
                max={maxReached}
                value={state.depthMode.auto ? state.currentDepth : state.depthMode.pinnedDepth}
                onChange={(e) => setDepthMode({ auto: false, pinnedDepth: Math.min(maxReached, Number(e.target.value) || zone.minDepth) })}
              />
            )}
            <span className="text-body-secondary">
              Deepest: {maxReached} · Checkpoint: {getCheckpointDepth(zone, state.currentDepth)}
            </span>
          </div>

          <AbilityBar />
        </div>

        <div className="combat-log panel">
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Combat Log</div>
          {combatLog.length === 0 && <div className="text-body-secondary small">Combat log will appear here.</div>}
          {combatLog.map((event, i) => (
            <div key={`${event.timestamp}-${i}`} className="combat-log-entry">{describeEvent(event)}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
