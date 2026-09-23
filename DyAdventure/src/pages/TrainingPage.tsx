import statsData from '../content/stats.json'
import { useGameStore } from '../store/gameStore'
import { computeMaxTrainCount, computeTrainCostN } from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from '../components/icons'
import { BuyButtonRow, type BuyRowOption } from '../components/BuyButtonRow'
import type { StatDef } from '../types'

const STATS = statsData as StatDef[]
const QTY_STEPS = [1, 5, 10, 25] as const

export default function TrainingPage() {
  const stats = useGameStore((s) => s.stats)
  const focus = useGameStore((s) => s.focus)
  const trainStat = useGameStore((s) => s.trainStat)

  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body-secondary small" style={{ maxWidth: '760px' }}>
        Spend Focus, earned from kills, to permanently train your attributes. Each point feeds directly into combat.
        Focus available: <strong style={{ color: 'var(--text)' }}>{formatNumber(focus)}</strong>
      </p>

      <div className="stat-grid">
        {STATS.map((stat) => {
          const level = stats[stat.id] ?? 0
          const maxQty = Math.max(1, computeMaxTrainCount(stat.id, level, focus))
          const steps: BuyRowOption[] = QTY_STEPS.map((qty) => ({ qty, label: `×${qty}`, cost: computeTrainCostN(stat.id, level, qty) }))
          const maxOption: BuyRowOption = { qty: maxQty, label: 'Max', cost: computeTrainCostN(stat.id, level, maxQty) }
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
              <BuyButtonRow steps={steps} maxOption={maxOption} balance={focus} onBuy={(qty) => trainStat(stat.id, qty)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
