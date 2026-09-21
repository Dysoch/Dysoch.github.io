import statisticsData from '../content/statistics.json'
import abilitiesData from '../content/abilities.json'
import zonesData from '../content/zones.json'
import { useGameStore } from '../store/gameStore'
import {
  computeFortune,
  computeHpCap,
  computeManaCap,
  computePhysicalPower,
  computeMagicPower,
  computeStaminaCap,
  computeStatGainPerTrain,
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
    { label: 'Stat gain per train', total: `×${computeStatGainPerTrain(state).toFixed(2)}` },
  ]

  const zoneRows = ZONES.flatMap((zone): DisplayRow[] => {
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
      <div className="stat-page-grid">
        <Section title="Current" rows={current} showRuns={false} />

        {SECTIONS.map((section) => (
          <Section
            key={section.title}
            title={section.title}
            showRuns={!section.totalOnly}
            rows={section.rows.map((row) =>
              section.totalOnly
                ? { label: row.label, total: fmt(lifetime[row.key] ?? 0, row.format) }
                : counterRow(row.label, row.key, row.format),
            )}
          />
        ))}

        <Section title="Zones" rows={zoneRows} showRuns />
        <Section
          title="Materials gathered"
          rows={MATERIALS.map((m) => counterRow(m.name, `material_${m.id}_gathered`))}
          showRuns
        />
        <Section
          title="Ability uses"
          rows={ABILITIES.map((a) => counterRow(a.name, `ability_${a.id}_uses`))}
          showRuns
        />
      </div>
      <p className="text-body-secondary small mt-3">
        A run lasts from one Recall to the next. Totals are kept through Recall and Ascend. Tracking started when this page was added.
      </p>
    </div>
  )
}
