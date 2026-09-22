import { useState } from 'react'
import abilitiesData from '../content/abilities.json'
import { useGameStore } from '../store/gameStore'
import { computeAbilityRankCostN, computeMaxAbilityCount } from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from '../components/icons'
import { QtySelector, type BuyQty } from '../components/QtySelector'
import type { AbilityDef } from '../types'

const ABILITIES = abilitiesData as AbilityDef[]

export default function AbilitiesPage() {
  const abilities = useGameStore((s) => s.abilities)
  const focus = useGameStore((s) => s.focus)
  const upgradeAbility = useGameStore((s) => s.upgradeAbility)
  const [qty, setQty] = useState<BuyQty>(1)

  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body-secondary small" style={{ maxWidth: '760px' }}>
        Upgrade ability ranks with Focus. Each ability fires on its own cooldown whenever it's ready and affordable —
        physical abilities draw from Stamina, spells from Mana, and several can be active at once.
      </p>

      <QtySelector value={qty} onChange={setQty} />

      <div className="ability-grid">
        {ABILITIES.map((ability) => {
          const progress = abilities[ability.id]
          const rank = progress ? progress.rank : 0
          const maxedOut = rank >= ability.maxRank
          const remainingRanks = ability.maxRank - rank
          const buyCount = qty === 'max' ? Math.max(1, computeMaxAbilityCount(ability.id, rank, focus)) : Math.min(qty, remainingRanks)
          const cost = computeAbilityRankCostN(ability.id, rank, buyCount)
          const affordable = !maxedOut && focus >= cost

          return (
            <div key={ability.id} className={`panel ${ability.type === 'physical' ? '' : ''}`} style={{ padding: '18px', borderColor: ability.type === 'physical' ? 'var(--physical)' : 'var(--arcane)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div className="hud-portrait" style={{ width: '38px', height: '38px', borderRadius: '9px', borderColor: ability.type === 'physical' ? 'var(--physical)' : 'var(--arcane)', color: ability.type === 'physical' ? 'var(--physical)' : 'var(--arcane)' }}>
                  <Icon name={ability.icon} size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{ability.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Rank {rank} / {ability.maxRank}</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px', minHeight: '32px' }}>
                {ability.description}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '14px' }}>
                Cost {ability.resourceCost} {ability.type === 'physical' ? 'Stamina' : 'Mana'} · Cooldown {(ability.cooldownMs / 1000).toFixed(1)}s
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary w-100"
                disabled={!affordable}
                onClick={() => upgradeAbility(ability.id, buyCount)}
              >
                {maxedOut ? 'Max rank' : `${buyCount > 1 ? `Upgrade ×${buyCount}` : 'Upgrade'} — ${formatNumber(cost)} Focus`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
