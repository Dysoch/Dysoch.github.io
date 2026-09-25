import type { ReactNode } from 'react'
import statsData from '../content/stats.json'
import abilitiesData from '../content/abilities.json'
import { useGameStore } from '../store/gameStore'
import { automationUnlockRecalls, isAutomationUnlocked, totalPendingLevels } from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from '../components/icons'
import type { AbilityDef, AutomationFeature, DuplicateMode, StatDef } from '../types'

const STATS = statsData as StatDef[]
const ABILITIES = abilitiesData as AbilityDef[]

const DUPLICATE_MODES: { id: DuplicateMode; label: string; description: string; feature?: AutomationFeature }[] = [
  { id: 'keep', label: 'Keep', description: 'Duplicates wait on the item you own as pending levels. Fuse them from the Inventory page.' },
  { id: 'salvage', label: 'Auto-salvage', description: 'Duplicates are salvaged on the spot for Focus and materials.' },
  { id: 'fuse', label: 'Auto-fuse', description: 'Duplicates fuse into the item you own right away.', feature: 'autoFuse' },
]

function LockNote({ feature, recalls }: { feature: AutomationFeature; recalls: number }) {
  return (
    <span className="small" style={{ color: 'var(--text-dim)' }}>
      🔒 Unlocks after {automationUnlockRecalls(feature)} Recalls ({recalls} so far)
    </span>
  )
}

function WeightStepper({ value, onChange, disabled = false }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const btn = { padding: '0 8px', lineHeight: 1.4 }
  return (
    <div className="d-flex align-items-center gap-1">
      <button type="button" className="btn btn-sm btn-outline-secondary" style={btn} disabled={disabled || value <= 0} onClick={() => onChange(value - 1)}>−</button>
      <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: 600, color: value === 0 ? 'var(--text-dim)' : 'var(--text)' }}>{value}</span>
      <button type="button" className="btn btn-sm btn-outline-secondary" style={btn} disabled={disabled || value >= 10} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="panel" style={{ padding: '16px' }}>
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap" style={{ marginBottom: '10px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 600 }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  )
}

/** A feature the player can't use yet: no name, no details — just what unlocks it. */
function LockedSection({ feature, recalls }: { feature: AutomationFeature; recalls: number }) {
  return (
    <Section title="?????" right={<LockNote feature={feature} recalls={recalls} />}>
      <div className="small" style={{ color: 'var(--text-dim)' }}>Keep Recalling to reveal this.</div>
    </Section>
  )
}

function Toggle({ id, checked, disabled, onChange, label }: { id: string; checked: boolean; disabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="form-check form-switch mb-0">
      <input className="form-check-input" type="checkbox" role="switch" id={id} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <label className="form-check-label small" htmlFor={id}>{label}</label>
    </div>
  )
}

export default function AutomationPage() {
  const state = useGameStore((s) => s)
  const setAutomation = useGameStore((s) => s.setAutomation)
  const a = state.automation
  const recalls = state.lifetime.recalls ?? 0
  const trainUnlocked = isAutomationUnlocked(state, 'autoTrain')
  const abilitiesUnlocked = isAutomationUnlocked(state, 'autoAbilities')
  const pending = totalPendingLevels(state)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p className="text-body-secondary small mb-0" style={{ maxWidth: '900px' }}>
        Automation takes over repetitive clicking. More features unlock as you Recall. Unlocks count every Recall you've ever made, so an Ascend never locks them again.
      </p>

      {!trainUnlocked ? <LockedSection feature="autoTrain" recalls={recalls} /> : (
      <Section
        title="Auto-train"
        right={<Toggle id="auto-train" label="Enabled" checked={a.autoTrain} disabled={false} onChange={(v) => setAutomation({ autoTrain: v })} />}
      >
        <div className="small mb-2" style={{ color: 'var(--text-dim)' }}>
          The autobuyer always buys whatever is cheapest compared to its weight. A weight of 2 keeps training that stat until it costs twice as much as the weight-1 stats. A weight of 0 skips it.
        </div>
        <div className="stat-grid" style={{ gap: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {STATS.map((stat) => (
            <div key={stat.id} className="d-flex align-items-center justify-content-between inventory-card" style={{ flexDirection: 'row', padding: '6px 10px' }}>
              <span className="d-flex align-items-center gap-2 small">
                <Icon name={stat.icon} size={14} /> {stat.name}
                <span style={{ color: 'var(--text-dim)' }}>Lv {formatNumber(state.statLevels[stat.id] ?? 0)}</span>
              </span>
              <WeightStepper
                value={a.statWeights[stat.id] ?? 0}
                onChange={(v) => setAutomation({ statWeights: { ...a.statWeights, [stat.id]: v } })}
              />
            </div>
          ))}
        </div>
      </Section>
      )}

      {!abilitiesUnlocked ? <LockedSection feature="autoAbilities" recalls={recalls} /> : (
      <Section
        title="Auto-upgrade abilities"
        right={<Toggle id="auto-abilities" label="Enabled" checked={a.autoAbilities} disabled={false} onChange={(v) => setAutomation({ autoAbilities: v })} />}
      >
        <div className="small mb-2" style={{ color: 'var(--text-dim)' }}>
          Works like Auto-train, sharing the same Focus. Locked abilities (rank 0) get unlocked too unless their weight is 0.
        </div>
        <div className="stat-grid" style={{ gap: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {ABILITIES.map((ability) => {
            const rank = state.abilities[ability.id]?.rank ?? 0
            return (
              <div key={ability.id} className="d-flex align-items-center justify-content-between inventory-card" style={{ flexDirection: 'row', padding: '6px 10px' }}>
                <span className="d-flex align-items-center gap-2 small">
                  <Icon name={ability.icon} size={14} /> {ability.name}
                  <span style={{ color: 'var(--text-dim)' }}>{rank >= ability.maxRank ? 'Max' : `R${rank}`}</span>
                </span>
                <WeightStepper
                  value={a.abilityWeights[ability.id] ?? 0}
                  onChange={(v) => setAutomation({ abilityWeights: { ...a.abilityWeights, [ability.id]: v } })}
                />
              </div>
            )
          })}
        </div>
      </Section>
      )}

      {/* Only meaningful once an autobuyer exists, so it stays hidden until then */}
      {(trainUnlocked || abilitiesUnlocked) && (
      <Section title="Spending limit">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <input
            type="range"
            className="form-range"
            style={{ maxWidth: '320px' }}
            min={1}
            max={100}
            value={a.maxCostPct}
            onChange={(e) => setAutomation({ maxCostPct: Number(e.target.value) })}
          />
          <span className="small">
            Autobuyers only buy when one purchase costs at most <strong>{a.maxCostPct}%</strong> of your current Focus
            {a.maxCostPct === 100 ? ' (spend freely)' : ', so some Focus is always left for crafting and manual buys'}.
          </span>
        </div>
      </Section>
      )}

      <Section title="Duplicate gear" right={isAutomationUnlocked(state, 'autoFuse') ? undefined : <LockNote feature="autoFuse" recalls={recalls} />}>
        <div className="d-flex flex-wrap gap-2" style={{ marginBottom: '8px' }}>
          {DUPLICATE_MODES.map((mode) => {
            const locked = mode.feature ? !isAutomationUnlocked(state, mode.feature) : false
            const active = a.duplicateMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                disabled={locked}
                onClick={() => setAutomation({ duplicateMode: mode.id })}
              >
                {locked ? '🔒 ?????' : mode.label}
              </button>
            )
          })}
        </div>
        <div className="small" style={{ color: 'var(--text-dim)' }}>
          {DUPLICATE_MODES.find((m) => m.id === a.duplicateMode)?.description}
          {a.duplicateMode === 'keep' && pending > 0 && ` ${formatNumber(pending)} levels are waiting to be fused.`}
        </div>
        <div className="small mt-1" style={{ color: 'var(--text-dim)' }}>Keep and Auto-salvage are available from the start. Crafted copies always fuse right away.</div>
      </Section>

    </div>
  )
}
