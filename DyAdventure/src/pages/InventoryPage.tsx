import { useState } from 'react'
import augmentsData from '../content/augments.json'
import { useGameStore } from '../store/gameStore'
import {
  computeAllTimeDepth,
  computeEquippedSetCounts,
  computeReforgeCost,
  computeReforgeDepthRequirement,
  computeSetBonusForStat,
  describeAugment,
  compareGear,
  effectiveDuplicateMode,
  effectiveGearStats,
  gearVerdict,
  getStatLabel,
  gearBonusForStat,
  getGearCatalogItem,
  getRarityDef,
  getSetDef,
  getZoneDef,
  listMaterials,
  listSets,
  listWorseItems,
  overflowSalvagedKey,
  totalPendingLevels,
  type GearVerdict,
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
  const depthReached = depthReq ? (computeAllTimeDepth(state, depthReq.zoneId)) : 0
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

/** Always-visible reforge cost and depth requirement, so it's clear what's missing while the button is disabled. */
function ReforgeInfo({ item, state }: { item: GearItem; state: SimState }) {
  const targetId = getGearCatalogItem(item.catalogId).nextTierId
  if (!targetId) return null
  const cost = computeReforgeCost(item.catalogId)!
  const targetRarity = getRarityDef(getGearCatalogItem(targetId).rarity)
  const depthReq = computeReforgeDepthRequirement(item.catalogId)
  const depthReached = depthReq ? (computeAllTimeDepth(state, depthReq.zoneId)) : 0
  const depthMet = !depthReq || depthReached >= depthReq.depth
  const ok = 'var(--text)'
  const missing = 'var(--physical)'
  return (
    <div className="small" style={{ color: 'var(--text-dim)' }}>
      Reforge to <span style={{ color: targetRarity.color }}>{targetRarity.name}</span>:{' '}
      {cost.materials.map((m) => (
        <span key={m.materialId} style={{ marginRight: '6px', color: (state.materials[m.materialId] ?? 0) >= m.amount ? ok : missing }}>
          {formatNumber(m.amount)} {materialName(m.materialId)}
        </span>
      ))}
      <span style={{ color: state.focus >= cost.focus ? ok : missing }}>{formatNumber(cost.focus)} Focus</span>
      {depthReq && (
        <div style={{ color: depthMet ? 'var(--text-dim)' : missing }}>
          {depthMet ? '✓ ' : ''}Needs depth {formatNumber(depthReq.depth)} in {getZoneDef(depthReq.zoneId).name}
          {!depthMet && ` (your deepest: ${formatNumber(depthReached)})`}
        </div>
      )}
    </div>
  )
}

/** Socketed augments on an item, plus a picker to socket another while it has open slots. */
function AugmentSection({ item, learnedAugmentIds, onSocket }: { item: GearItem; learnedAugmentIds: string[]; onSocket: (instanceId: string, augmentId: string) => void }) {
  const state = useGameStore((s) => s)
  const [choice, setChoice] = useState('')
  const slots = getRarityDef(getGearCatalogItem(item.catalogId).rarity).augmentSlots
  const socketed = item.augmentIds.map((id) => AUGMENTS.find((a) => a.id === id)).filter((a): a is AugmentDef => !!a)
  const available = learnedAugmentIds.filter((id) => !item.augmentIds.includes(id))
  const openSlots = item.augmentIds.length < slots
  if (slots === 0) return null
  return (
    <div className="small">
      {socketed.map((aug) => (
        <div key={aug.id} style={{ color: 'var(--focus)' }}>◆ {aug.name}: {describeAugment(state, aug.id)}{(state.augmentRanks[aug.id] ?? 0) > 0 ? ` (Imbue rank ${state.augmentRanks[aug.id]})` : ''}</div>
      ))}
      {openSlots && (
        <div style={{ color: 'var(--text-dim)' }}>
          {slots - item.augmentIds.length} open augment slot{slots - item.augmentIds.length > 1 ? 's' : ''}
          {available.length === 0 && ' · defeat bosses to learn augments'}
        </div>
      )}
      {openSlots && available.length > 0 && (
        <div className="d-flex gap-2 mt-1">
          <select className="form-select form-select-sm" value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value="">Choose augment…</option>
            {available.map((id) => {
              const def = AUGMENTS.find((a) => a.id === id)!
              return <option key={id} value={id}>{def.name} — {describeAugment(state, id)}</option>
            })}
          </select>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={!choice}
            onClick={() => {
              onSocket(item.instanceId, choice)
              setChoice('')
            }}
          >
            Socket
          </button>
        </div>
      )}
    </div>
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

const VERDICTS: Record<GearVerdict, { label: string; color: string; order: number }> = {
  emptySlot: { label: '▲ Empty slot', color: 'var(--hp)', order: 0 },
  upgrade: { label: '▲ Upgrade', color: 'var(--hp)', order: 1 },
  sidegrade: { label: '◆ Sidegrade', color: 'var(--focus)', order: 2 },
  worse: { label: '▼ Worse', color: 'var(--physical)', order: 3 },
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const OVERVIEW_STATS: PrimaryStat[] = ['might', 'grit', 'arcana', 'willpower', 'fortune', 'speed', 'staminaCap', 'manaCap', 'hpCap', 'critChance', 'critDamage', 'regen', 'resistance', 'lifeSteal', 'focusGain', 'materialFind']

type Filter = 'all' | 'upgrades' | GearSlot

function levelText(level: number): string {
  return `Lv.${Math.round(level * 100) / 100}`
}

function ItemHeader({ item }: { item: GearItem }) {
  const def = getGearCatalogItem(item.catalogId)
  const rarity = getRarityDef(def.rarity)
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
      <Icon name={def.icon} size={16} />
      <span style={{ color: rarity.color, fontWeight: 600 }}>{def.name}</span>
      <span style={{ fontSize: '10px', color: rarity.color, border: `1px solid ${rarity.color}`, borderRadius: '4px', padding: '0 5px' }}>{rarity.name}</span>
      <span className="small" style={{ color: 'var(--text-dim)' }}>{levelText(item.level)}</span>
      {rarity.maxLevel != null && item.level >= rarity.maxLevel && (
        <span style={{ fontSize: '10px', color: 'var(--focus)', border: '1px solid var(--focus)', borderRadius: '4px', padding: '0 5px' }} title={`Level cap for ${rarity.name}`}>MAX</span>
      )}
    </div>
  )
}

/** For an item at its level cap: duplicates can no longer level it, so they're salvaged — show how many so far. */
function MaxedNote({ item, lifetime }: { item: GearItem; lifetime: Record<string, number> }) {
  const maxLevel = getRarityDef(getGearCatalogItem(item.catalogId).rarity).maxLevel
  if (maxLevel == null || item.level + (item.pendingLevels ?? 0) < maxLevel) return null
  const salvaged = lifetime[overflowSalvagedKey(item.catalogId)] ?? 0
  return (
    <div className="small" style={{ color: 'var(--text-dim)' }}>
      {item.level >= maxLevel ? 'Max level' : 'Max level once fused'} — further duplicates are salvaged
      {salvaged > 0 ? ` (${formatNumber(salvaged)} so far)` : ''}
      {getGearCatalogItem(item.catalogId).nextTierId ? '. Reforge to keep leveling.' : '.'}
    </div>
  )
}

function ItemStats({ item }: { item: GearItem }) {
  return (
    <div className="small" style={{ color: 'var(--text-dim)' }}>
      {effectiveGearStats(item).map((st) => `+${formatNumber(st.value)} ${statLabel(st.statId)}`).join(' · ')}
    </div>
  )
}

function PendingFuse({ item, onFuse }: { item: GearItem; onFuse: (instanceId: string) => void }) {
  if (!item.pendingLevels) return null
  return (
    <div className="d-flex align-items-center gap-2 small" style={{ color: 'var(--focus)' }}>
      +{formatNumber(item.pendingLevels)} levels from duplicates
      <button type="button" className="btn btn-sm btn-outline-warning" style={{ padding: '0 8px' }} onClick={() => onFuse(item.instanceId)}>Fuse</button>
    </div>
  )
}

export default function InventoryPage() {
  const state = useGameStore((s) => s)
  const equipItem = useGameStore((s) => s.equipItem)
  const unequipItem = useGameStore((s) => s.unequipItem)
  const socketAugment = useGameStore((s) => s.socketAugment)
  const salvageItem = useGameStore((s) => s.salvageItem)
  const salvageItems = useGameStore((s) => s.salvageItems)
  const reforgeItem = useGameStore((s) => s.reforgeItem)
  const fuseItem = useGameStore((s) => s.fuseItem)
  const fuseAll = useGameStore((s) => s.fuseAll)
  const setActiveTab = useGameStore((s) => s.setActiveTab)
  const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<Filter>('all')
  const [confirmSalvage, setConfirmSalvage] = useState(false)

  const setCounts = computeEquippedSetCounts(state)
  const allSets = listSets()
  // Only sets with at least one discovered piece are shown; the most-worn sets come first
  const discoveredSets = allSets
    .filter((set) => set.itemIds.some((id) => state.discoveredItemIds.includes(id)))
    .sort((a, b) => (setCounts[b.id] ?? 0) - (setCounts[a.id] ?? 0))

  const pending = totalPendingLevels(state)
  const worseItems = listWorseItems(state)
  const duplicateMode = effectiveDuplicateMode(state)

  // Best candidates first: upgrades, then sidegrades, then by rarity and level
  const rows = state.inventory
    .map((item) => ({ item, def: getGearCatalogItem(item.catalogId), verdict: gearVerdict(state, item) }))
    .sort(
      (a, b) =>
        VERDICTS[a.verdict].order - VERDICTS[b.verdict].order ||
        RARITY_ORDER.indexOf(b.def.rarity) - RARITY_ORDER.indexOf(a.def.rarity) ||
        b.item.level - a.item.level,
    )
  const slotCounts = new Map<GearSlot, number>()
  for (const { def } of rows) slotCounts.set(def.slot, (slotCounts.get(def.slot) ?? 0) + 1)
  const upgradeCount = rows.filter((r) => r.verdict === 'upgrade' || r.verdict === 'emptySlot').length
  // A slot filter whose last item just left the inventory falls back to showing everything
  const activeFilter: Filter = (filter === 'upgrades' && upgradeCount === 0) || (filter !== 'all' && filter !== 'upgrades' && !slotCounts.has(filter)) ? 'all' : filter
  const visible = rows.filter(({ def, verdict }) =>
    activeFilter === 'all' ? true : activeFilter === 'upgrades' ? verdict === 'upgrade' || verdict === 'emptySlot' : def.slot === activeFilter,
  )

  const chip = (id: Filter, label: string, count: number) => (
    <button
      key={id}
      type="button"
      className={`btn btn-sm ${activeFilter === id ? 'btn-primary' : 'btn-outline-secondary'}`}
      style={{ padding: '1px 9px', fontSize: '12px' }}
      onClick={() => setFilter(id)}
    >
      {label} <span style={{ opacity: 0.7 }}>{count}</span>
    </button>
  )

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="panel d-flex align-items-center gap-3 flex-wrap" style={{ padding: '12px 16px' }}>
        <button type="button" className="btn btn-sm btn-outline-warning" disabled={pending <= 0} onClick={fuseAll}>
          Fuse all{pending > 0 ? ` (+${formatNumber(pending)} levels)` : ''}
        </button>
        <button
          type="button"
          className={`btn btn-sm ${confirmSalvage ? 'btn-danger' : 'btn-outline-danger'}`}
          disabled={worseItems.length === 0}
          title="Salvages every inventory item that is worse than what you're wearing in its slot, on raw stats. Items with augments are skipped."
          onClick={() => {
            if (!confirmSalvage) return setConfirmSalvage(true)
            salvageItems(worseItems.map((i) => i.instanceId))
            setConfirmSalvage(false)
          }}
          onBlur={() => setConfirmSalvage(false)}
        >
          {confirmSalvage ? `Confirm: salvage ${worseItems.length} items` : `Salvage all worse (${worseItems.length})`}
        </button>
        <span className="small" style={{ color: 'var(--text-dim)' }}>
          Duplicates: <strong style={{ color: 'var(--text)' }}>{duplicateMode === 'keep' ? 'kept for fusing' : duplicateMode === 'salvage' ? 'auto-salvaged' : 'auto-fused'}</strong>
          {' · '}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => setActiveTab('automation')}>change</button>
        </span>
      </div>

      <div>
        <h6>Equipped</h6>
        <div className="gear-slot-grid">
          {(Object.entries(state.gear) as [GearSlot, GearItem | null][]).map(([slot, item]) => (
            <div key={slot} className="inventory-card" style={item ? undefined : { opacity: 0.6 }}>
              <div className="small" style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10.5px' }}>{SLOT_LABELS[slot]}</div>
              {item ? (
                <>
                  <ItemHeader item={item} />
                  <ItemStats item={item} />
                  <PendingFuse item={item} onFuse={fuseItem} />
                  <MaxedNote item={item} lifetime={state.lifetime} />
                  <AugmentSection item={item} learnedAugmentIds={state.learnedAugmentIds} onSocket={socketAugment} />
                  <ReforgeInfo item={item} state={state} />
                  <div className="d-flex gap-2 flex-wrap mt-auto pt-1">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => unequipItem(slot)}>Unequip</button>
                    <ReforgeButton item={item} state={state} onReforge={reforgeItem} />
                  </div>
                </>
              ) : (
                <div className="small" style={{ color: 'var(--text-dim)' }}>Empty</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h6>Inventory ({state.inventory.length})</h6>
        {state.inventory.length === 0 ? (
          <div className="text-body-secondary small">No items yet — keep fighting for loot.</div>
        ) : (
          <>
            <div className="d-flex flex-wrap gap-1 mb-2">
              {chip('all', 'All', rows.length)}
              {upgradeCount > 0 && chip('upgrades', '▲ Upgrades', upgradeCount)}
              {(Object.keys(SLOT_LABELS) as GearSlot[]).filter((slot) => slotCounts.has(slot)).map((slot) => chip(slot, SLOT_LABELS[slot], slotCounts.get(slot)!))}
            </div>
            <div className="inventory-grid">
              {visible.map(({ item, def, verdict }) => {
                const equipped = state.gear[def.slot]
                const deltas = equipped ? compareGear(item, equipped) : []
                const setLabel = def.setId ? getSetDef(def.setId).name : null
                return (
                  <div key={item.instanceId} className="inventory-card">
                    <div className="d-flex justify-content-between gap-2">
                      <span className="small" style={{ color: 'var(--text-dim)' }}>{SLOT_LABELS[def.slot]}{setLabel ? ` · ${setLabel}` : ''}</span>
                      <span className="small" style={{ color: VERDICTS[verdict].color, whiteSpace: 'nowrap' }}>{VERDICTS[verdict].label}</span>
                    </div>
                    <ItemHeader item={item} />
                    <ItemStats item={item} />
                    {deltas.length > 0 && (
                      <div className="small">
                        {deltas.map((d) => (
                          <span key={d.statId} style={{ marginRight: '8px', color: d.value >= 0 ? 'var(--hp)' : 'var(--physical)' }}>
                            {d.value >= 0 ? '+' : ''}{formatNumber(d.value)} {statLabel(d.statId)}
                          </span>
                        ))}
                        <span className="text-body-secondary">vs. equipped</span>
                      </div>
                    )}
                    <PendingFuse item={item} onFuse={fuseItem} />
                    <MaxedNote item={item} lifetime={state.lifetime} />
                    <AugmentSection item={item} learnedAugmentIds={state.learnedAugmentIds} onSocket={socketAugment} />
                    <ReforgeInfo item={item} state={state} />
                    <div className="d-flex gap-2 flex-wrap mt-auto pt-1">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => equipItem(item.instanceId)}>Equip</button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => salvageItem(item.instanceId)}>Salvage</button>
                      <ReforgeButton item={item} state={state} onReforge={reforgeItem} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="panel" style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Gear Stats Overview <span style={{ color: 'var(--text-dim)', fontSize: '12px', fontWeight: 400 }}>· includes set bonuses</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
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
    </div>
  )
}
