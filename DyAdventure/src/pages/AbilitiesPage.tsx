import abilitiesData from '../content/abilities.json'
import { useGameStore } from '../store/gameStore'
import { computeAbilityRankCostN, computeMaxAbilityCount } from '../worker/simLogic'
import { Icon } from '../components/icons'
import { BuyButtonRow, type BuyRowOption } from '../components/BuyButtonRow'
import type { AbilityDef } from '../types'

const ABILITIES = abilitiesData as AbilityDef[]
const QTY_STEPS = [1, 5, 10, 25] as const

function mechanicTag(ability: AbilityDef): string | null {
  if (ability.kind === 'dot') return `Bleed ×${ability.dotTicks}`
  if (ability.kind === 'buff') return `Buff ${Math.round((ability.buffDurationMs ?? 0) / 1000)}s`
  if (ability.overkill) return 'Overkill'
  if (ability.executeThresholdPct != null) return `Execute <${Math.round(ability.executeThresholdPct * 100)}% HP`
  return null
}

export default function AbilitiesPage() {
  const abilities = useGameStore((s) => s.abilities)
  const focus = useGameStore((s) => s.focus)
  const upgradeAbility = useGameStore((s) => s.upgradeAbility)

  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body-secondary small" style={{ maxWidth: '760px' }}>
        Upgrade ability ranks with Focus. Each ability fires on its own cooldown whenever it's ready and affordable —
        physical abilities draw from Stamina, spells from Mana, and several can be active at once.
      </p>

      <div className="ability-grid">
        {ABILITIES.map((ability) => {
          const progress = abilities[ability.id]
          const rank = progress ? progress.rank : 0
          const maxedOut = rank >= ability.maxRank
          const remainingRanks = ability.maxRank - rank
          const maxQty = Math.max(1, computeMaxAbilityCount(ability.id, rank, focus))
          const steps: BuyRowOption[] = QTY_STEPS.map((step) => {
            const qty = Math.min(step, remainingRanks)
            return { qty, label: `×${qty}`, cost: computeAbilityRankCostN(ability.id, rank, qty) }
          })
          const maxOption: BuyRowOption = { qty: maxQty, label: 'Max', cost: computeAbilityRankCostN(ability.id, rank, maxQty) }
          const tag = mechanicTag(ability)

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
                {tag && (
                  <span className="hud-chip" style={{ marginLeft: 'auto', fontSize: '10.5px' }}>
                    {tag}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px', minHeight: '32px' }}>
                {ability.description}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '14px' }}>
                Cost {ability.resourceCost} {ability.type === 'physical' ? 'Stamina' : 'Mana'} · Cooldown {(ability.cooldownMs / 1000).toFixed(1)}s
              </div>
              {maxedOut ? (
                <div className="btn btn-sm btn-outline-secondary w-100 disabled">Max rank</div>
              ) : (
                <BuyButtonRow steps={steps} maxOption={maxOption} balance={focus} onBuy={(qty) => upgradeAbility(ability.id, qty)} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
