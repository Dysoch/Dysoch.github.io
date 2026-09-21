import abilitiesData from '../content/abilities.json'
import { useGameStore } from '../store/gameStore'
import { computeAbilityRankCost } from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from '../components/icons'
import type { AbilityDef } from '../types'

const ABILITIES = abilitiesData as AbilityDef[]

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
          const cost = computeAbilityRankCost(ability.id, rank)
          const affordable = focus >= cost && rank < ability.maxRank

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
                onClick={() => upgradeAbility(ability.id)}
              >
                {rank >= ability.maxRank ? 'Max rank' : `Upgrade — ${formatNumber(cost)} Focus`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
