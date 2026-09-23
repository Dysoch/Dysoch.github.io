import { formatNumber } from '../utils/format'

export interface BuyRowOption {
  qty: number
  label: string
  cost: number
}

/**
 * Direct-purchase controls: a row of fixed-quantity buttons (×1/×5/×10/×25) on top, each buying that
 * quantity on click, plus one large "Max" button below showing exactly how many that would buy right now.
 */
export function BuyButtonRow({ steps, maxOption, balance, onBuy }: { steps: BuyRowOption[]; maxOption: BuyRowOption; balance: number; onBuy: (qty: number) => void }) {
  const maxAffordable = maxOption.qty > 0 && balance >= maxOption.cost
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: '4px', marginBottom: '4px' }}>
        {steps.map((opt, i) => {
          const affordable = opt.qty > 0 && balance >= opt.cost
          return (
            <button
              key={i}
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={!affordable}
              style={{ padding: '4px 2px', fontSize: '10.5px', lineHeight: 1.35 }}
              onClick={() => onBuy(opt.qty)}
            >
              <div style={{ fontWeight: 600 }}>{opt.label}</div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>{formatNumber(opt.cost)}</div>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-warning w-100"
        disabled={!maxAffordable}
        onClick={() => onBuy(maxOption.qty)}
      >
        Max — ×{formatNumber(maxOption.qty)} ({formatNumber(maxOption.cost)})
      </button>
    </div>
  )
}
