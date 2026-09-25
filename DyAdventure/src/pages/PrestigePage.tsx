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
  listPerks,
  recallRequiredDepth,
} from '../worker/simLogic'
import { formatDuration, formatNumber } from '../utils/format'
import { QtySelector, type BuyQty } from '../components/QtySelector'
import type { PerkDef } from '../types'

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
        Gear, inventory, discoveries, zone unlocks, and learned augments are always kept.
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
                Ascensions: {state.ascendCount} · Echoes earned this Ascension: {formatNumber(state.echoesEarned)}
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
                  if (confirm(`Ascend now for ${formatNumber(ascendSigils)} Sigils? This also resets your Echoes and Echo perks.`)) ascend()
                }}
              >
                Ascend
              </button>
            </div>

            <div>
              <QtySelector value={perkQty} onChange={setPerkQty} />
              <div className="panel p-3 mt-3">
                <div className="fw-bold mb-1">Sigil Perks <span className="text-body-secondary small fw-normal">· permanent</span></div>
                <div className="perk-grid">
                  {PERKS.filter((p) => p.currency === 'sigils').map((perk) => <PerkRow key={perk.id} perk={perk} qty={perkQty} />)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
