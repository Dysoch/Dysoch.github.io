import { useState } from 'react'
import augmentsData from '../content/augments.json'
import { useGameStore } from '../store/gameStore'
import {
  computeEquippedSetCounts,
  computeReforgeCost,
  computeReforgeDepthRequirement,
  computeSetBonusForStat,
  compareGear,
  effectiveGearStats,
  getStatLabel,
  gearBonusForStat,
  getGearCatalogItem,
  getRarityDef,
  getSetDef,
  getZoneDef,
  listMaterials,
  listSets,
} from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from '../components/icons'
import type { AugmentDef, GearItem, GearSlot, PrimaryStat, SimState } from '../types'

const AUGMENTS = augmentsData as AugmentDef[]
const MATERIALS = listMaterials()

const statLabel = getStatLabel

function materialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id
}

function ReforgeButton({ item, state, onReforge }: { item: GearItem; state: SimState; onReforge: (instanceId: string) => void }) {
  const targetId = getGearCatalogItem(item.catalogId).nextTierId
  if (!targetId) return null
  const cost = computeReforgeCost(item.catalogId)!
  const targetRarity = getRarityDef(getGearCatalogItem(targetId).rarity)
  const depthReq = computeReforgeDepthRequirement(item.catalogId)
  const depthReached = depthReq ? (state.maxDepthByZone[depthReq.zoneId] ?? 0) : 0
  const depthMet = !depthReq || depthReached >= depthReq.depth
  const affordable = state.focus >= cost.focus && cost.materials.every((m) => (state.materials[m.materialId] ?? 0) >= m.amount)
  const title = depthMet
    ? `${cost.materials.map((m) => `${formatNumber(m.amount)} ${materialName(m.materialId)}`).join(', ')}, ${formatNumber(cost.focus)} Focus`
    : `Requires reaching depth ${formatNumber(depthReq!.depth)} in ${getZoneDef(depthReq!.zoneId).name} (currently ${formatNumber(depthReached)})`
  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-warning"
      disabled={!affordable || !depthMet}
      title={title}
      onClick={() => onReforge(item.instanceId)}
    >
      Reforge → {targetRarity.name}
    </button>
  )
}

const SLOT_LABELS: Record<GearSlot, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  boots: 'Boots',
  gloves: 'Gloves',
  focusItem: 'Focus Item',
  robe: 'Robe',
  amulet: 'Amulet',
  ring: 'Ring',
  trinket1: 'Trinket',
  trinket2: 'Trinket',
}

const OVERVIEW_STATS: PrimaryStat[] = ['might', 'grit', 'arcana', 'willpower', 'fortune', 'speed', 'staminaCap', 'manaCap', 'hpCap', 'critChance', 'critDamage', 'regen', 'resistance', 'lifeSteal', 'focusGain', 'materialFind']

function ItemLine({ item }: { item: GearItem }) {
  const catalogDef = getGearCatalogItem(item.catalogId)
  const rarityDef = getRarityDef(catalogDef.rarity)
  return (
    <span>
      <span style={{ color: rarityDef.color }}>{catalogDef.name}</span>{' '}
      <span style={{ color: 'var(--text-dim)' }}>Lv.{Math.round(item.level * 10) / 10} · {effectiveGearStats(item).map((st) => `+${formatNumber(st.value)} ${statLabel(st.statId)}`).join(', ')}</span>
    </span>
  )
}

export default function InventoryPage() {
  const state = useGameStore((s) => s)
  const equipItem = useGameStore((s) => s.equipItem)
  const unequipItem = useGameStore((s) => s.unequipItem)
  const socketAugment = useGameStore((s) => s.socketAugment)
  const salvageItem = useGameStore((s) => s.salvageItem)
  const reforgeItem = useGameStore((s) => s.reforgeItem)
  const [augmentChoice, setAugmentChoice] = useState<Record<string, string>>({})

  const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({})

  const setCounts = computeEquippedSetCounts(state)
  const allSets = listSets()
  // Only sets with at least one discovered piece are shown; the most-worn sets come first
  const discoveredSets = allSets
    .filter((set) => set.itemIds.some((id) => state.discoveredItemIds.includes(id)))
    .sort((a, b) => (setCounts[b.id] ?? 0) - (setCounts[a.id] ?? 0))

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div className="panel" style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Gear Stats Overview <span style={{ color: 'var(--text-dim)', fontSize: '12px', fontWeight: 400 }}>· includes set bonuses</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px' }}>
          {OVERVIEW_STATS.map((statId) => (
            <div key={statId} style={{ fontSize: '12.5px' }}>
              <div style={{ color: 'var(--text-dim)' }}>{statLabel(statId)}</div>
              <div style={{ fontWeight: 600 }}>+{formatNumber(gearBonusForStat(state, statId) + computeSetBonusForStat(state, statId))}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>
          Set Progress <span style={{ color: 'var(--text-dim)', fontSize: '12px', fontWeight: 400 }}>· {discoveredSets.length}/{allSets.length} discovered</span>
        </div>
        {discoveredSets.length === 0 && <div className="text-body-secondary small">No set pieces found yet.</div>}
        <div className="set-grid">
          {discoveredSets.map((set) => {
            const equipped = setCounts[set.id] ?? 0
            const found = set.itemIds.filter((id) => state.discoveredItemIds.includes(id)).length
            const open = expandedSets[set.id] ?? false
            return (
              <div key={set.id} className="set-card">
                <button
                  type="button"
                  className="set-card-header"
                  onClick={() => setExpandedSets((prev) => ({ ...prev, [set.id]: !open }))}
                >
                  <span style={{ fontWeight: 600 }}>{set.name}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{equipped}/{set.itemIds.length} worn · {found} found {open ? '▴' : '▾'}</span>
                </button>
                {open && (
                  <div style={{ marginTop: '6px', fontSize: '12px' }}>
                    {set.bonuses.map((tier, i) => (
                      <div key={i} style={{ color: equipped >= tier.pieces ? 'var(--hp)' : 'var(--text-dim)' }}>
                        {tier.pieces}pc: {tier.description}{equipped >= tier.pieces ? ' ✓' : ''}
                      </div>
                    ))}
                    <div style={{ color: 'var(--text-dim)', marginTop: '4px' }}>
                      {set.itemIds.map((id) => (state.discoveredItemIds.includes(id) ? getGearCatalogItem(id).name : '???')).join(' · ')}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="inventory-split">
      <div>
        <h6>Equipped</h6>
        {(Object.entries(state.gear) as [GearSlot, GearItem | null][]).map(([slot, item]) => (
          <div key={slot} className="d-flex align-items-center justify-content-between border-bottom py-2">
            <div>
              <div className="text-body-secondary small">{SLOT_LABELS[slot]}</div>
              {item ? <ItemLine item={item} /> : <div className="text-body-secondary">Empty</div>}
            </div>
            {item && (
              <div className="d-flex gap-2 flex-wrap justify-content-end">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => unequipItem(slot)}>Unequip</button>
                <ReforgeButton item={item} state={state} onReforge={reforgeItem} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <h6>Inventory ({state.inventory.length})</h6>
        {state.inventory.length === 0 && <div className="text-body-secondary small">No items yet — keep fighting for loot.</div>}
        <div className="inventory-grid">
        {state.inventory.map((item) => {
          const catalogDef = getGearCatalogItem(item.catalogId)
          const rarityDef = getRarityDef(catalogDef.rarity)
          const equippedInSlot = state.gear[catalogDef.slot]
          const deltas = equippedInSlot ? compareGear(item, equippedInSlot) : null
          const socketedAugments = item.augmentIds.map((id) => AUGMENTS.find((a) => a.id === id)!).filter(Boolean)
          const openSlots = item.augmentIds.length < rarityDef.augmentSlots
          const setLabel = catalogDef.setId ? getSetDef(catalogDef.setId).name : null

          return (
            <div key={item.instanceId} className="inventory-card">
              <div className="d-flex flex-column gap-2">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <Icon name={catalogDef.icon} size={16} />
                    <ItemLine item={item} />
                    <span style={{ fontSize: '10px', color: rarityDef.color, border: `1px solid ${rarityDef.color}`, borderRadius: '4px', padding: '0 5px' }}>
                      {rarityDef.name}
                    </span>
                  </div>
                  {setLabel && <div className="text-body-secondary small">{setLabel} set · {SLOT_LABELS[catalogDef.slot]}</div>}
                  {deltas && deltas.length > 0 && (
                    <div className="small">
                      {deltas.map((d) => (
                        <span key={d.statId} style={{ marginRight: '8px', color: d.value >= 0 ? 'var(--hp)' : 'var(--physical)' }}>
                          {d.value >= 0 ? '▲ +' : '▼ '}{formatNumber(d.value)} {statLabel(d.statId)}
                        </span>
                      ))}
                      <span className="text-body-secondary">vs. equipped</span>
                    </div>
                  )}
                  {!equippedInSlot && <div className="text-body-secondary small">Nothing equipped in this slot yet</div>}
                  {socketedAugments.map((aug) => (
                    <div key={aug.id} className="small" style={{ color: 'var(--focus)' }}>{aug.name}: {aug.description}</div>
                  ))}
                </div>
                <div className="d-flex gap-2 flex-wrap mt-auto">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => equipItem(item.instanceId)}>Equip</button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => salvageItem(item.instanceId)}>Salvage</button>
                  <ReforgeButton item={item} state={state} onReforge={reforgeItem} />
                </div>
              </div>

              {openSlots && state.learnedAugmentIds.length > 0 && (
                <div className="d-flex gap-2 mt-2">
                  <select
                    className="form-select form-select-sm"
                    value={augmentChoice[item.instanceId] ?? ''}
                    onChange={(e) => setAugmentChoice((prev) => ({ ...prev, [item.instanceId]: e.target.value }))}
                  >
                    <option value="">Choose augment…</option>
                    {state.learnedAugmentIds
                      .filter((id) => !item.augmentIds.includes(id))
                      .map((id) => {
                        const def = AUGMENTS.find((a) => a.id === id)!
                        return <option key={id} value={id}>{def.name} — {def.description}</option>
                      })}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={!augmentChoice[item.instanceId]}
                    onClick={() => {
                      const augId = augmentChoice[item.instanceId]
                      if (augId) socketAugment(item.instanceId, augId)
                    }}
                  >
                    Socket
                  </button>
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>
      </div>
    </div>
  )
}
