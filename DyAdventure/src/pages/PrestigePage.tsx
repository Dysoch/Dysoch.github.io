import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  ascendRequiredEchoes,
  canAscend,
  canRecall,
  computeAscendSigils,
  computeMaxPerkCount,
  computePerkCostN,
  computeRecallEchoes,
  computeStatGainPerTrain,
  listPerks,
  recallRequiredDepth,
} from '../worker/simLogic'
import { formatNumber } from '../utils/format'
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

export default function PrestigePage() {
  const state = useGameStore((s) => s)
  const recall = useGameStore((s) => s.recall)
  const ascend = useGameStore((s) => s.ascend)
  const gain = computeStatGainPerTrain(state)
  const [perkQty, setPerkQty] = useState<BuyQty>(1)

  const recallEchoes = computeRecallEchoes(state)
  const ascendSigils = computeAscendSigils(state)

  return (
    <div style={{ padding: '24px', maxWidth: '720px' }}>
      <p className="text-body-secondary small">
        Recall resets your depth, stats, and ability ranks in exchange for <strong>Echoes</strong> — the deeper you got, the more you earn.
        Ascend resets your Echoes and Echo perks for <strong>Sigils</strong>, based on every Echo earned since your last Ascend.
        Gear, inventory, discoveries, zone unlocks, and learned augments are always kept.
      </p>

      <div className="d-flex gap-3 mb-3">
        <div className="hud-chip"><span className="text-body-secondary">Echoes</span> {formatNumber(state.echoes)}</div>
        <div className="hud-chip"><span className="text-body-secondary">Sigils</span> {formatNumber(state.sigils)}</div>
      </div>

      <div className="panel p-3 mb-3">
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

      <div className="panel p-3 mb-3">
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

      <QtySelector value={perkQty} onChange={setPerkQty} />

      <div className="panel p-3 mb-3">
        <div className="fw-bold mb-1">Echo Perks <span className="text-body-secondary small fw-normal">· reset on Ascend</span></div>
        {PERKS.filter((p) => p.currency === 'echoes').map((perk) => <PerkRow key={perk.id} perk={perk} qty={perkQty} />)}
      </div>

      <div className="panel p-3">
        <div className="fw-bold mb-1">Sigil Perks <span className="text-body-secondary small fw-normal">· permanent</span></div>
        {PERKS.filter((p) => p.currency === 'sigils').map((perk) => <PerkRow key={perk.id} perk={perk} qty={perkQty} />)}
      </div>
    </div>
  )
}
