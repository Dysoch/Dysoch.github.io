import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  ascendRequiredEchoes,
  canAscend,
  canRecall,
  computeAscendSigils,
  computeEchoRatePerHour,
  computeMaxPerkCount,
  computePerkCostN,
  computeRecallEchoes,
  computeStatGainPerTrain,
  describeSpec,
  getSpecDef,
  listPerks,
  listSpecs,
  recallRequiredDepth,
} from '../worker/simLogic'
import { Icon } from '../components/icons'
import { formatDuration, formatNumber } from '../utils/format'
import { QtySelector, type BuyQty } from '../components/QtySelector'
import type { PerkDef, SpecId } from '../types'

const PERKS = listPerks()

function PerkRow({ perk, qty }: { perk: PerkDef; qty: BuyQty }) {
  const level = useGameStore((s) => s.perkLevels[perk.id] ?? 0)
  const balance = useGameStore((s) => (perk.currency === 'echoes' ? s.echoes : s.sigils))
  const buyPerk = useGameStore((s) => s.buyPerk)
  const maxed = level >= perk.maxLevel
  const remainingLevels = perk.maxLevel - level
  const buyCount = qty === 'max' ? Math.max(1, computeMaxPerkCount(perk, level, balance)) : Math.min(qty, remainingLevels)
  const cost = computePerkCostN(perk, level, buyCount)
  const affordable = !maxed && balance >= cost

  return (
    <div className="d-flex align-items-center justify-content-between border-bottom py-2 gap-3">
      <div>
        <div className="fw-semibold">{perk.name} <span className="text-body-secondary small">Lv.{level}/{perk.maxLevel}</span></div>
        <div className="text-body-secondary small">{perk.description}</div>
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary text-nowrap"
        disabled={!affordable}
        onClick={() => buyPerk(perk.id, buyCount)}
      >
        {maxed ? 'Maxed' : `${buyCount > 1 ? `×${buyCount} — ` : ''}${formatNumber(cost)} ${perk.currency === 'echoes' ? 'Echoes' : 'Sigils'}`}
      </button>
    </div>
  )
}

type PrestigeLayer = 'recall' | 'ascend'

const SPECS = listSpecs()

/** "a Warrior", "an Adventurer" */
function withArticle(name: string): string {
  return `${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name}`
}

/** Pick the spec for the next Ascension. The choice only takes effect by Ascending. */
function SpecPicker({ value, current, onChange }: { value: SpecId; current: SpecId; onChange: (spec: SpecId) => void }) {
  return (
    <div className="d-flex flex-column gap-2 my-2" role="radiogroup" aria-label="Spec for the next Ascension">
      {SPECS.map((spec) => {
        const selected = spec.id === value
        return (
          <button
            key={spec.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className="inventory-card text-start"
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderColor: selected ? 'var(--focus)' : undefined, boxShadow: selected ? '0 0 0 1px var(--focus)' : undefined, cursor: 'pointer' }}
            onClick={() => onChange(spec.id)}
          >
            <span className="hud-portrait" style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0 }}>
              <Icon name={spec.icon} size={16} />
            </span>
            <span>
              <span className="fw-semibold">{spec.name}</span>
              {spec.id === current && <span className="small text-body-secondary"> · current</span>}
              <span className="d-block small text-body-secondary">{describeSpec(spec)}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Rates for deciding when to Recall. Echoes only rise when depth does, while run time keeps growing,
 * so Echoes/hour peaks and then sags once progress slows — that sag is the usual cue to Recall.
 */
function RecallTiming() {
  const state = useGameStore((s) => s)
  const runMs = state.runStats.timeMs ?? 0
  const echoRate = computeEchoRatePerHour(state)
  const peakRate = state.runStats.peakEchoRate ?? 0
  const peakAtMs = state.runStats.peakEchoRateAtMs ?? 0
  const focusPerMin = runMs > 0 ? (state.runStats.focusEarned ?? 0) / (runMs / 60_000) : 0
  const pastPeak = peakRate > 0 && echoRate < peakRate * 0.9
  const row = (label: string, value: string) => (
    <div className="d-flex justify-content-between small border-bottom py-1">
      <span className="text-body-secondary">{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
  return (
    <div className="panel p-3 mt-3" style={{ height: 'fit-content' }}>
      <div className="fw-bold mb-1">Recall timing</div>
      {row('This run', formatDuration(runMs / 1000))}
      {row('Focus per minute', formatNumber(focusPerMin))}
      {row('Echoes per hour (if you Recall now)', echoRate > 0 ? formatNumber(echoRate) : '—')}
      {peakRate > 0 && row('Best this run', `${formatNumber(peakRate)}/h at ${formatDuration(peakAtMs / 1000)}`)}
      <div className="small mt-2" style={{ color: pastPeak ? 'var(--focus)' : 'var(--text-dim)' }}>
        {peakRate === 0
          ? 'Echoes per hour appears once a Recall would pay out.'
          : pastPeak
            ? 'Your Echo rate is past its peak — progress has slowed, so Recalling now is efficient.'
            : 'Your Echo rate is still climbing.'}
        {' '}A deeper Recall also raises your permanent Recall bonus, so pushing a little further can still be worth it.
      </div>
    </div>
  )
}

export default function PrestigePage() {
  const state = useGameStore((s) => s)
  const recall = useGameStore((s) => s.recall)
  const ascend = useGameStore((s) => s.ascend)
  const gain = computeStatGainPerTrain(state)
  const [perkQty, setPerkQty] = useState<BuyQty>(1)
  const [nextSpec, setNextSpec] = useState<SpecId>(state.spec)
  const nextSpecName = getSpecDef(nextSpec).name

  const recallEchoes = computeRecallEchoes(state)
  const ascendSigils = computeAscendSigils(state)
  // Ascend is meaningless before a first Recall (it needs Echoes, which only Recall grants), so its
  // layer stays hidden until then — recallCount resets on Ascend, so lifetime.recalls is what's checked.
  const ascendUnlocked = (state.lifetime.recalls ?? 0) > 0
  const [layer, setLayer] = useState<PrestigeLayer>('recall')
  const activeLayer = layer === 'ascend' && !ascendUnlocked ? 'recall' : layer

  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body-secondary small" style={{ maxWidth: '900px' }}>
        Recall resets your depth, stats, and ability ranks in exchange for <strong>Echoes</strong> — the deeper you got, the more you earn.
        Ascend resets your Echoes and Echo perks for <strong>Sigils</strong>, based on every Echo earned since your last Ascend.
        Ascending is a clean slate: it also removes your gear, materials, learned augments and discoveries, and lets you choose your spec:
        <strong> Warrior</strong>, <strong>Mage</strong> or <strong>Adventurer</strong>. Sigil perks make every Ascension stronger than the last.
        Recall keeps your gear, materials, augments and discoveries. Zone unlocks and milestones are always kept.
      </p>

      <div className="d-flex gap-2 mb-3">
        <button
          type="button"
          className={`btn btn-sm ${activeLayer === 'recall' ? 'btn-warning' : 'btn-outline-secondary'}`}
          onClick={() => setLayer('recall')}
        >
          Recall <span className="text-body-secondary">· {formatNumber(state.echoes)} Echoes</span>
        </button>
        {ascendUnlocked && (
          <button
            type="button"
            className={`btn btn-sm ${activeLayer === 'ascend' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => setLayer('ascend')}
          >
            Ascend <span className="text-body-secondary">· {formatNumber(state.sigils)} Sigils</span>
          </button>
        )}
      </div>

      <div className="inventory-split">
        {activeLayer === 'recall' ? (
          <>
            <div>
            <div className="panel p-3" style={{ height: 'fit-content' }}>
              <div className="fw-bold">Recall</div>
              <div className="small text-body-secondary">Recalls this Ascension: {state.recallCount} · Stat gain per train: ×{gain.toFixed(2)}</div>
              {canRecall(state) ? (
                <div className="small mb-2">Recalling now grants <strong>{formatNumber(recallEchoes)} Echoes</strong>.</div>
              ) : (
                <div className="small mb-2 text-body-secondary">Reach depth {recallRequiredDepth()} in any zone to Recall.</div>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                disabled={!canRecall(state)}
                onClick={() => {
                  if (confirm(`Recall now for ${formatNumber(recallEchoes)} Echoes? This resets depth, stats, and ability ranks.`)) recall()
                }}
              >
                Recall
              </button>
            </div>
            <RecallTiming />
            </div>

            <div>
              <QtySelector value={perkQty} onChange={setPerkQty} />
              <div className="panel p-3 mt-3">
                <div className="fw-bold mb-1">Echo Perks <span className="text-body-secondary small fw-normal">· reset on Ascend</span></div>
                <div className="perk-grid">
                  {PERKS.filter((p) => p.currency === 'echoes').map((perk) => <PerkRow key={perk.id} perk={perk} qty={perkQty} />)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="panel p-3" style={{ height: 'fit-content' }}>
              <div className="fw-bold">Ascend</div>
              <div className="small text-body-secondary">
                Ascensions: {state.ascendCount} · Echoes earned this Ascension: {formatNumber(state.echoesEarned)} · Spec: {getSpecDef(state.spec).name}
              </div>
              <div className="small mt-2">Choose your spec for the next Ascension. It stays until you Ascend again.</div>
              <SpecPicker value={nextSpec} current={state.spec} onChange={setNextSpec} />
              <div className="small mb-2" style={{ color: 'var(--physical)' }}>
                Ascending removes all your gear, materials, learned augments (and their Imbue ranks) and discoveries, except what your Sigil perks keep.
              </div>
              {canAscend(state) ? (
                <div className="small mb-2">Ascending now grants <strong>{formatNumber(ascendSigils)} Sigils</strong>.</div>
              ) : (
                <div className="small mb-2 text-body-secondary">Earn {formatNumber(ascendRequiredEchoes())} Echoes in total to Ascend.</div>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                disabled={!canAscend(state)}
                onClick={() => {
                  if (confirm(`Ascend as ${withArticle(nextSpecName)} for ${formatNumber(ascendSigils)} Sigils? This resets your Echoes and Echo perks and removes your gear, materials, augments and discoveries.`)) ascend(nextSpec)
                }}
              >
                Ascend as {nextSpecName}
              </button>
            </div>

            <div>
              <QtySelector value={perkQty} onChange={setPerkQty} />
              <div className="panel p-3 mt-3">
                <div className="fw-bold mb-1">Sigil Perks <span className="text-body-secondary small fw-normal">· permanent</span></div>
                <div className="perk-grid">
                  {PERKS.filter((p) => p.currency === 'sigils' && !p.spec).map((perk) => <PerkRow key={perk.id} perk={perk} qty={perkQty} />)}
                </div>
              </div>
              {/* Your own spec first; the others can be bought ahead of switching to them */}
              {[...SPECS].sort((a, b) => Number(b.id === state.spec) - Number(a.id === state.spec)).map((spec) => (
                <div key={spec.id} className="panel p-3 mt-3" style={spec.id === state.spec ? { borderColor: 'var(--focus)' } : undefined}>
                  <div className="fw-bold mb-1 d-flex align-items-center gap-2">
                    <Icon name={spec.icon} size={15} /> {spec.name} Perks
                    <span className="small fw-normal" style={{ color: spec.id === state.spec ? 'var(--focus)' : 'var(--text-dim)' }}>
                      · {spec.id === state.spec ? 'active' : `only while you are ${withArticle(spec.name)}`}
                    </span>
                  </div>
                  <div className="perk-grid">
                    {PERKS.filter((p) => p.spec === spec.id).map((perk) => <PerkRow key={perk.id} perk={perk} qty={perkQty} />)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
