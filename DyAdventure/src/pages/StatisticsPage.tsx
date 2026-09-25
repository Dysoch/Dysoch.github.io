import statisticsData from '../content/statistics.json'
import abilitiesData from '../content/abilities.json'
import zonesData from '../content/zones.json'
import { useGameStore } from '../store/gameStore'
import {
  computeCritChance,
  computeCritMultiplier,
  computeFortune,
  computeLifeStealPct,
  computeMaterialFindMultiplier,
  computeRegenMultiplier,
  computeResistance,
  computeHpCap,
  computeManaCap,
  computePhysicalPower,
  computeMagicPower,
  computeStaminaCap,
  computeStatGainPerTrain,
  describeMilestoneReward,
  listMilestoneTracks,
  milestoneId,
  focusGainMultiplier,
  listMaterials,
} from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import type { AbilityDef, ZoneDef } from '../types'

interface StatRow {
  key: string
  label: string
  format?: 'time'
}

interface StatSection {
  title: string
  rows: StatRow[]
  /** Only a lifetime total makes sense (e.g. total Recalls) */
  totalOnly?: boolean
}

interface DisplayRow {
  label: string
  run?: string
  last?: string
  total: string
}

const SECTIONS = statisticsData as StatSection[]
const ABILITIES = abilitiesData as AbilityDef[]
const ZONES = zonesData as ZoneDef[]
const MATERIALS = listMaterials()

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

function Section({ title, rows, showRuns }: { title: string; rows: DisplayRow[]; showRuns: boolean }) {
  if (rows.length === 0) return null
  return (
    <div className="panel" style={{ padding: '16px' }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>{title}</div>
      {showRuns && (
        <div className="stat-row small text-body-secondary">
          <span />
          <span>This run</span>
          <span>Previous</span>
          <span>Total</span>
        </div>
      )}
      {rows.map((row) => (
        <div key={row.label} className={showRuns ? 'stat-row small border-bottom py-1' : 'd-flex justify-content-between small border-bottom py-1'}>
          <span className="text-body-secondary">{row.label}</span>
          {showRuns && <span>{row.run ?? '—'}</span>}
          {showRuns && <span>{row.last ?? '—'}</span>}
          <span style={{ fontWeight: 600 }}>{row.total}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Milestones: permanent bonuses for lifetime counters. A track only appears once its counter has
 * started, and the next tier's name and reward stay hidden (?????) until it's reached.
 */
function MilestonesPanel({ lifetime, reached }: { lifetime: Record<string, number>; reached: string[] }) {
  const tracks = listMilestoneTracks().filter((t) => (lifetime[t.statKey] ?? 0) > 0)
  if (tracks.length === 0) return null
  const fmt = (n: number, format?: 'time') => (format === 'time' ? formatDuration(n) : formatNumber(n))
  return (
    <div className="panel" style={{ padding: '16px', marginBottom: '16px' }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>
        Milestones <span style={{ color: 'var(--text-dim)', fontSize: '12px', fontWeight: 400 }}>· {reached.length} reached · bonuses are permanent</span>
      </div>
      <div className="stat-page-grid" style={{ gap: '10px' }}>
        {tracks.map((track) => {
          const value = lifetime[track.statKey] ?? 0
          const nextIndex = track.tiers.findIndex((_, i) => !reached.includes(milestoneId(track, i)))
          const next = nextIndex >= 0 ? track.tiers[nextIndex] : null
          const pct = next ? Math.min(100, (value / next.threshold) * 100) : 100
          return (
            <div key={track.id} className="inventory-card">
              <div className="small" style={{ fontWeight: 600 }}>{track.label}</div>
              {track.tiers.map((tier, i) =>
                reached.includes(milestoneId(track, i)) ? (
                  <div key={i} className="small" style={{ color: 'var(--hp)' }}>✓ {tier.name} — {describeMilestoneReward(track, i)}</div>
                ) : null,
              )}
              {next ? (
                <>
                  <div className="small" style={{ color: 'var(--text-dim)' }}>
                    ????? — {fmt(value, track.format)} / {fmt(next.threshold, track.format)}
                  </div>
                  <div className="hud-bar-track">
                    <div className="hud-bar-fill" style={{ width: `${pct}%`, background: 'var(--focus)' }} />
                  </div>
                </>
              ) : (
                <div className="small" style={{ color: 'var(--focus)' }}>All milestones reached</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function StatisticsPage() {
  const state = useGameStore((s) => s)
  const { lifetime, runStats, lastRunStats } = state
  const hasPreviousRun = Object.keys(lastRunStats).length > 0

  const fmt = (n: number, format?: 'time') => (format === 'time' ? formatDuration(n) : formatNumber(n))
  const counterRow = (label: string, key: string, format?: 'time'): DisplayRow => ({
    label,
    run: fmt(runStats[key] ?? 0, format),
    last: hasPreviousRun ? fmt(lastRunStats[key] ?? 0, format) : undefined,
    total: fmt(lifetime[key] ?? 0, format),
  })

  const current = [
    { label: 'Physical power', total: `×${computePhysicalPower(state).toFixed(2)}` },
    { label: 'Magic power', total: `×${computeMagicPower(state).toFixed(2)}` },
    { label: 'Max HP', total: formatNumber(computeHpCap(state)) },
    { label: 'Max Stamina', total: formatNumber(computeStaminaCap(state)) },
    { label: 'Max Mana', total: formatNumber(computeManaCap(state)) },
    { label: 'Fortune', total: formatNumber(computeFortune(state)) },
    { label: 'Focus gain', total: `×${focusGainMultiplier(state).toFixed(2)}` },
    { label: 'Crit chance', total: `${(computeCritChance(state) * 100).toFixed(1)}%` },
    { label: 'Crit damage', total: `×${computeCritMultiplier(state).toFixed(2)}` },
    { label: 'Damage resistance', total: `${(computeResistance(state) * 100).toFixed(1)}%` },
    { label: 'Regeneration', total: `×${computeRegenMultiplier(state).toFixed(2)}` },
    { label: 'Life steal (max HP per hit)', total: `${(computeLifeStealPct(state) * 100).toFixed(2)}%` },
    { label: 'Material find', total: `×${computeMaterialFindMultiplier(state).toFixed(2)}` },
    { label: 'Stat gain per train', total: `×${computeStatGainPerTrain(state).toFixed(2)}` },
  ]

  // Nothing that hasn't happened yet is shown (except the General basics), so unreached features
  // and locked zones/abilities stay hidden until they come up in play.
  const happened = (key: string) => (lifetime[key] ?? 0) > 0 || (runStats[key] ?? 0) > 0

  const zoneRows = ZONES.filter((zone) => state.unlockedZoneIds.includes(zone.id)).flatMap((zone): DisplayRow[] => {
    const deepestKey = `deepest_${zone.id}`
    const runDeepest = Math.max(runStats[deepestKey] ?? 0, state.maxDepthByZone[zone.id] ?? 0)
    return [
      {
        label: `${zone.name} — deepest depth`,
        run: formatNumber(runDeepest),
        last: hasPreviousRun ? formatNumber(lastRunStats[deepestKey] ?? 0) : undefined,
        total: formatNumber(Math.max(lifetime[deepestKey] ?? 0, runDeepest)),
      },
      counterRow(`${zone.name} — monsters defeated`, `kills_${zone.id}`),
    ]
  })

  return (
    <div style={{ padding: '24px' }}>
      <MilestonesPanel lifetime={lifetime} reached={state.milestonesReached} />
      <div className="stat-page-grid">
        <Section title="Current" rows={current} showRuns={false} />

        {SECTIONS.map((section) => (
          <Section
            key={section.title}
            title={section.title}
            showRuns={!section.totalOnly}
            rows={section.rows.filter((row) => section.title === 'General' || happened(row.key)).map((row) =>
              section.totalOnly
                ? { label: row.label, total: fmt(lifetime[row.key] ?? 0, row.format) }
                : counterRow(row.label, row.key, row.format),
            )}
          />
        ))}

        <Section title="Zones" rows={zoneRows} showRuns />
        <Section
          title="Materials gathered"
          rows={MATERIALS.filter((m) => happened(`material_${m.id}_gathered`)).map((m) => counterRow(m.name, `material_${m.id}_gathered`))}
          showRuns
        />
        <Section
          title="Ability uses"
          rows={ABILITIES.filter((a) => happened(`ability_${a.id}_uses`) || (state.abilities[a.id]?.rank ?? 0) > 0).map((a) => counterRow(a.name, `ability_${a.id}_uses`))}
          showRuns
        />
      </div>
      <p className="text-body-secondary small mt-3">
        A run lasts from one Recall to the next. Totals are kept through Recall and Ascend. Tracking started when this page was added.
      </p>
    </div>
  )
}
