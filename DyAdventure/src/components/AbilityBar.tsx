import abilitiesData from '../content/abilities.json'
import groupsData from '../content/groups.json'
import { useGameStore } from '../store/gameStore'
import { computeEffectiveCooldownMs } from '../worker/simLogic'
import type { AbilityDef, GroupDef } from '../types'
import { Icon } from './icons'

const ABILITIES = abilitiesData as AbilityDef[]
const GROUPS = groupsData.abilityGroups as GroupDef[]

export default function AbilityBar() {
  const state = useGameStore((s) => s)

  return (
    <div className="ability-bar">
      {GROUPS.map((group) => {
        const members = ABILITIES.filter((a) => a.group === group.id)
        if (members.length === 0) return null
        return (
          <div key={group.id} className="ability-bar-group" style={{ borderColor: group.color }}>
            <div className="ability-bar-label" style={{ color: group.color }}>
              {group.name}{group.resource ? ` · ${group.resource}` : ''}
            </div>
            <div className="ability-bar-tiles">
              {members.map((ability) => {
                const progress = state.abilities[ability.id]
                const rank = progress ? progress.rank : 0
                const cooldownRemaining = state.abilityCooldowns[ability.id] ?? 0
                const totalCooldown = computeEffectiveCooldownMs(state, ability.id)
                const readyPct = totalCooldown > 0 ? Math.max(0, Math.min(100, (1 - cooldownRemaining / totalCooldown) * 100)) : 100
                const ready = cooldownRemaining <= 0

                return (
                  <div
                    key={ability.id}
                    className={`ability-tile ${ability.type}`}
                    style={{ opacity: rank === 0 ? 0.55 : 1 }}
                    title={rank === 0 ? `${ability.name} — not trained yet` : ability.description}
                  >
                    <Icon name={ability.icon} size={18} />
                    <span style={{ fontSize: '11.5px', fontWeight: 600 }}>{ability.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      {rank === 0 ? 'locked' : `R${rank} · ${ability.resourceCost}`}
                    </span>
                    <div className="cooldown-track">
                      <div
                        style={{
                          width: `${readyPct}%`,
                          height: '100%',
                          background: ready ? 'var(--hp)' : group.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
