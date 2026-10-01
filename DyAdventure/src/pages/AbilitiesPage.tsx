import abilitiesData from '../content/abilities.json'
import groupsData from '../content/groups.json'
import { useGameStore } from '../store/gameStore'
import { computeAbilityRankCostN, computeMaxAbilityCount, getSpecDef, isAbilityLocked, listPerks } from '../worker/simLogic'
import { LockedGroupsNote } from '../components/LockedGroupsNote'
import { Icon } from '../components/icons'
import { BuyButtonRow, type BuyRowOption } from '../components/BuyButtonRow'
import type { AbilityDef, GroupDef } from '../types'

const ABILITIES = abilitiesData as AbilityDef[]
const GROUPS = groupsData.abilityGroups as GroupDef[]
const QTY_STEPS = [1, 5, 10, 25] as const

const PERKS = listPerks()

function schoolColor(ability: AbilityDef): string {
  if (ability.adaptive) return 'var(--focus)'
  return ability.type === 'physical' ? 'var(--physical)' : 'var(--arcane)'
}

function resourceName(ability: AbilityDef): string {
  if (ability.adaptive) return 'Stamina or Mana'
  return ability.type === 'physical' ? 'Stamina' : 'Mana'
}

/** The current spec's signature ability before its Sigil perk is bought: only the requirement shows. */
function LockedSignature({ ability }: { ability: AbilityDef }) {
  const perk = PERKS.find((p) => p.id === ability.unlockPerkId)
  return (
    <div className="panel" style={{ padding: '18px', opacity: 0.7 }}>
      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>?????</div>
      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
        Unlocked with a Sigil perk on the Prestige page{perk ? ` (${perk.baseCost} Sigils)` : ''}.
      </div>
    </div>
  )
}

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
  const state = useGameStore((s) => s)
  const lockedGroups = getSpecDef(state.spec).lockedGroups
  // Signature abilities only mean something once Sigils exist, i.e. after the first Ascend
  const signaturesRevealed = (state.lifetime.ascends ?? 0) > 0

  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body-secondary small" style={{ maxWidth: '760px' }}>
        Upgrade ability ranks with Focus. Each ability fires on its own cooldown whenever it's ready and affordable —
        physical abilities draw from Stamina, spells from Mana, and several can be active at once.
      </p>

      <LockedGroupsNote groups={GROUPS} />

      {GROUPS.map((group) => {
        const members = ABILITIES.filter((a) => a.group === group.id && (!a.spec || (a.spec === state.spec && signaturesRevealed)))
        if (members.length === 0 || lockedGroups.includes(group.id)) return null
        return (
          <section key={group.id} className="group-section">
            <div className="group-header" style={{ borderColor: group.color }}>
              <span className="group-title" style={{ color: group.color }}>{group.name}</span>
              {group.resource && <span className="group-meta">uses {group.resource}</span>}
              <span className="group-meta">{group.description}</span>
            </div>
            <div className="ability-grid">
              {members.map((ability) => {
                if (isAbilityLocked(state, ability.id)) return <LockedSignature key={ability.id} ability={ability} />
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
                  <div key={ability.id} className="panel" style={{ padding: '18px', borderColor: schoolColor(ability) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div className="hud-portrait" style={{ width: '38px', height: '38px', borderRadius: '9px', borderColor: schoolColor(ability), color: schoolColor(ability) }}>
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
                      Cost {ability.resourceCost} {resourceName(ability)} · Cooldown {(ability.cooldownMs / 1000).toFixed(1)}s
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
          </section>
        )
      })}
    </div>
  )
}
