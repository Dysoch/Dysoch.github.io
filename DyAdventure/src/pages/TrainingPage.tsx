import { useState } from 'react'
import statsData from '../content/stats.json'
import { useGameStore } from '../store/gameStore'
import { computeMaxTrainCount, computeTrainCostN } from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from '../components/icons'
import { QtySelector, type BuyQty } from '../components/QtySelector'
import type { StatDef } from '../types'

const STATS = statsData as StatDef[]

export default function TrainingPage() {
  const stats = useGameStore((s) => s.stats)
  const focus = useGameStore((s) => s.focus)
  const trainStat = useGameStore((s) => s.trainStat)
  const [qty, setQty] = useState<BuyQty>(1)

  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body-secondary small" style={{ maxWidth: '760px' }}>
        Spend Focus, earned from kills, to permanently train your attributes. Each point feeds directly into combat.
        Focus available: <strong style={{ color: 'var(--text)' }}>{formatNumber(focus)}</strong>
      </p>

      <QtySelector value={qty} onChange={setQty} />

      <div className="stat-grid">
        {STATS.map((stat) => {
          const level = stats[stat.id] ?? 0
          const buyCount = qty === 'max' ? Math.max(1, computeMaxTrainCount(stat.id, level, focus)) : qty
          const cost = computeTrainCostN(stat.id, level, buyCount)
          const affordable = focus >= cost
          return (
            <div key={stat.id} className="panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div className="hud-portrait" style={{ width: '38px', height: '38px', borderRadius: '9px' }}>
                  <Icon name={stat.icon} size={18} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{stat.name}</div>
              </div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', fontWeight: 600, marginBottom: '6px' }}>
                {formatNumber(level)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '14px', minHeight: '32px' }}>
                {stat.description}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary w-100"
                disabled={!affordable}
                onClick={() => trainStat(stat.id, buyCount)}
              >
                {buyCount > 1 ? `Train ×${buyCount}` : 'Train'} — {formatNumber(cost)} Focus
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
