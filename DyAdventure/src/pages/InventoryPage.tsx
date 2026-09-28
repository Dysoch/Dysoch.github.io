import { useMemo, useState } from 'react'
import augmentsData from '../content/augments.json'
import { useGameStore } from '../store/gameStore'
import {
  LOADOUT_ASPECTS,
  compareGear,
  compareToEquipped,
  computeAllTimeDepth,
  computeEquippedSetCounts,
  computeLoadoutScore,
  computeReforgeCost,
  computeReforgeDepthRequirement,
  computeSalvageYield,
  computeSetBonusForStat,
  describeAugment,
  effectiveDuplicateMode,
  effectiveGearStats,
  equipSlotsFor,
  gearBonusForStat,
  getGearCatalogItem,
  getRarityDef,
  getSetDef,
  getStatLabel,
  getZoneDef,
  listMaterials,
  listSets,
  listWorseItems,
  overflowSalvagedKey,
  planSetLoadout,
  getTierChain,
  totalPendingLevels,
  type GearComparison,
  type GearVerdict,
  type LoadoutAspect,
} from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from '../components/icons'
import type { AugmentDef, GearCatalogItemDef, GearItem, GearSlot, PrimaryStat, SimState } from '../types'

const AUGMENTS = augmentsData as AugmentDef[]
const MATERIALS = listMaterials()

const statLabel = getStatLabel

function materialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id
}

const SLOT_LABELS: Record<GearSlot, string> = {
  head: 'Head',
  body: 'Body',
  legs: 'Legs',
  feet: 'Feet',
  hands: 'Hands',
  mainHand: 'Main Hand',
  offHand: 'Off Hand',
  neck: 'Neck',
  back: 'Back',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
}

/** Slot label for an item's kind rather than a specific equip slot (a ring fits either ring slot). */
function slotKindLabel(def: GearCatalogItemDef): string {
  return def.slot === 'ring' ? 'Ring' : SLOT_LABELS[def.slot]
}

const VERDICTS: Record<GearVerdict, { label: string; color: string; order: number }> = {
  emptySlot: { label: '▲ Empty slot', color: 'var(--hp)', order: 0 },
  upgrade: { label: '▲ Upgrade', color: 'var(--hp)', order: 1 },
  sidegrade: { label: '◆ Sidegrade', color: 'var(--focus)', order: 2 },
  worse: { label: '▼ Worse', color: 'var(--physical)', order: 3 },
}

const ASPECT_LABELS: Record<LoadoutAspect, { label: string; title: string }> = {
  offense: { label: 'Offense', title: 'Damage output: Might/Arcana (weighted by your ability ranks), crit and Speed' },
  defense: { label: 'Defense', title: 'Effective HP: HP Cap, Grit and Resistance' },
  sustain: { label: 'Sustain', title: 'Healing over time: Regeneration and Life Steal' },
  resources: { label: 'Resources', title: 'Stamina and Mana caps' },
  economy: { label: 'Economy', title: 'Focus gain, Fortune and Material Find' },
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const OVERVIEW_STATS: PrimaryStat[] = ['might', 'grit', 'arcana', 'willpower', 'fortune', 'speed', 'staminaCap', 'manaCap', 'hpCap', 'critChance', 'critDamage', 'regen', 'resistance', 'lifeSteal', 'focusGain', 'materialFind']

type Filter = 'all' | 'upgrades' | GearSlot
type SortKey = 'best' | 'rarity' | 'level' | 'name'
type Selection = { kind: 'equipped'; slot: GearSlot } | { kind: 'inventory'; instanceId: string } | null

const SLOT_ORDER = Object.keys(SLOT_LABELS) as GearSlot[]

function levelText(level: number): string {
  return `Lv.${Math.round(level * 100) / 100}`
}

function pctText(value: number): string {
  const pct = value * 100
  const digits = Math.abs(pct) < 0.1 ? 2 : 1
  return `${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(digits)}%`
}

function verdictText(c: GearComparison): string {
  if (c.verdict === 'emptySlot') return VERDICTS.emptySlot.label
  if (c.verdict === 'worse') return VERDICTS.worse.label
  return `${c.verdict === 'upgrade' ? '▲' : '◆'} ${pctText(c.net)}`
}

/** Set bonus tiers gained or lost by a change in worn pieces, e.g. "loses +3 Might". */
function describeSetChange(change: GearComparison['setChanges'][number]): { text: string; gained: boolean } {
  const set = getSetDef(change.setId)
  const gained = change.after > change.before
  const lo = Math.min(change.before, change.after)
  const hi = Math.max(change.before, change.after)
  const tiers = set.bonuses.filter((t) => t.pieces > lo && t.pieces <= hi).map((t) => t.description)
  const effect = tiers.length > 0 ? `: ${gained ? 'gains' : 'loses'} ${tiers.join(', ')}` : ''
  return { text: `${set.name} ${change.before}→${change.after} pieces${effect}`, gained }
}

function RarityBadge({ def }: { def: GearCatalogItemDef }) {
  const rarity = getRarityDef(def.rarity)
  return <span style={{ fontSize: '10px', color: rarity.color, border: `1px solid ${rarity.color}`, borderRadius: '4px', padding: '0 5px' }}>{rarity.name}</span>
}

function ItemHeader({ item }: { item: GearItem }) {
  const def = getGearCatalogItem(item.catalogId)
  const rarity = getRarityDef(def.rarity)
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
      <Icon name={def.icon} size={18} />
      <span style={{ color: rarity.color, fontWeight: 600, fontSize: '15px' }}>{def.name}</span>
      <RarityBadge def={def} />
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
      {item.level >= maxLevel ? 'Max level' : 'Max level once fused'}: further duplicates are salvaged
      {salvaged > 0 ? ` (${formatNumber(salvaged)} so far)` : ''}
      {getGearCatalogItem(item.catalogId).nextTierId ? '. Reforge to keep leveling.' : '.'}
    </div>
  )
}

/** Reforge cost, depth requirement and button; what's missing is shown in red while the button is disabled. */
function ReforgeSection({ item, state, onReforge }: { item: GearItem; state: SimState; onReforge: (instanceId: string) => void }) {
  const targetId = getGearCatalogItem(item.catalogId).nextTierId
  if (!targetId) return null
  const cost = computeReforgeCost(item.catalogId)!
  const targetRarity = getRarityDef(getGearCatalogItem(targetId).rarity)
  const depthReq = computeReforgeDepthRequirement(item.catalogId)
  const depthReached = depthReq ? computeAllTimeDepth(state, depthReq.zoneId) : 0
  const depthMet = !depthReq || depthReached >= depthReq.depth
  const affordable = state.focus >= cost.focus && cost.materials.every((m) => (state.materials[m.materialId] ?? 0) >= m.amount)
  const ok = 'var(--text)'
  const missing = 'var(--physical)'
  return (
    <div className="detail-section">
      <div className="detail-label">Reforge</div>
      <div className="small">
        To <span style={{ color: targetRarity.color }}>{targetRarity.name}</span> (resets to Lv.1):{' '}
        {cost.materials.map((m) => (
          <span key={m.materialId} style={{ marginRight: '6px', color: (state.materials[m.materialId] ?? 0) >= m.amount ? ok : missing }}>
            {formatNumber(m.amount)} {materialName(m.materialId)}
          </span>
        ))}
        <span style={{ color: state.focus >= cost.focus ? ok : missing }}>{formatNumber(cost.focus)} Focus</span>
      </div>
      {depthReq && (
        <div className="small" style={{ color: depthMet ? 'var(--text-dim)' : missing }}>
          {depthMet ? '✓ ' : ''}Needs depth {formatNumber(depthReq.depth)} in {getZoneDef(depthReq.zoneId).name}
          {!depthMet && ` (your deepest: ${formatNumber(depthReached)})`}
        </div>
      )}
      <div>
        <button type="button" className="btn btn-sm btn-outline-warning mt-1" disabled={!affordable || !depthMet} onClick={() => onReforge(item.instanceId)}>
          Reforge → {targetRarity.name}
        </button>
      </div>
    </div>
  )
}

/** Socketed augments (each removable for free) plus a picker for any open slots. */
function AugmentSection({ item, state, onSocket, onUnsocket }: {
  item: GearItem
  state: SimState
  onSocket: (instanceId: string, augmentId: string) => void
  onUnsocket: (instanceId: string, augmentId: string) => void
}) {
  const [choice, setChoice] = useState('')
  const slots = getRarityDef(getGearCatalogItem(item.catalogId).rarity).augmentSlots
  if (slots === 0) return null
  const socketed = item.augmentIds.map((id) => AUGMENTS.find((a) => a.id === id)).filter((a): a is AugmentDef => !!a)
  const available = state.learnedAugmentIds.filter((id) => !item.augmentIds.includes(id))
  const open = slots - item.augmentIds.length
  return (
    <div className="detail-section">
      <div className="detail-label">Augments <span style={{ textTransform: 'none', letterSpacing: 0 }}>· {item.augmentIds.length}/{slots}</span></div>
      {socketed.map((aug) => (
        <div key={aug.id} className="d-flex align-items-center gap-2 small" style={{ color: 'var(--focus)' }}>
          <span>◆ {aug.name}: {describeAugment(state, aug.id)}{(state.augmentRanks[aug.id] ?? 0) > 0 ? ` (Imbue rank ${state.augmentRanks[aug.id]})` : ''}</span>
          <button
            type="button"
            className="btn btn-sm btn-link p-0 ms-auto"
            style={{ color: 'var(--text-dim)', textDecoration: 'none' }}
            title="Remove this augment. It stays learned and can be socketed again anywhere."
            onClick={() => onUnsocket(item.instanceId, aug.id)}
          >
            ✕ remove
          </button>
        </div>
      ))}
      {open > 0 && available.length === 0 && (
        <div className="small" style={{ color: 'var(--text-dim)' }}>
          {open} open slot{open > 1 ? 's' : ''}{state.learnedAugmentIds.length === 0 ? ' · defeat bosses to learn augments' : ''}
        </div>
      )}
      {open > 0 && available.length > 0 && (
        <div className="d-flex gap-2 mt-1">
          <select className="form-select form-select-sm" value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value="">Choose augment ({open} open slot{open > 1 ? 's' : ''})…</option>
            {available.map((id) => {
              const def = AUGMENTS.find((a) => a.id === id)!
              return <option key={id} value={id}>{def.name}: {describeAugment(state, id)}</option>
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

/** What equipping an inventory item would change: overall score, per-aspect changes, set bonuses and raw stats. */
function ComparisonSection({ comparison, item, state }: { comparison: GearComparison; item: GearItem; state: SimState }) {
  const equipped = state.gear[comparison.slot]
  const deltas = compareGear(item, equipped)
  const verdict = VERDICTS[comparison.verdict]
  return (
    <div className="detail-section">
      <div className="detail-label">
        If equipped in {SLOT_LABELS[comparison.slot]}
        {equipped ? ` (replacing ${getGearCatalogItem(equipped.catalogId).name})` : ''}
      </div>
      <div style={{ color: verdict.color, fontWeight: 600 }}>
        {verdict.label}
        {comparison.verdict !== 'worse' && <span style={{ marginLeft: '6px' }}>{pctText(comparison.net)} overall</span>}
      </div>
      <div className="aspect-grid">
        {LOADOUT_ASPECTS.map((k) => {
          const v = comparison.aspects[k]
          const flat = Math.abs(v) < 1e-4
          return (
            <div key={k} title={ASPECT_LABELS[k].title}>
              <span style={{ color: 'var(--text-dim)' }}>{ASPECT_LABELS[k].label} </span>
              <span style={{ color: flat ? 'var(--text-dim)' : v > 0 ? 'var(--hp)' : 'var(--physical)' }}>{flat ? '—' : pctText(v)}</span>
            </div>
          )
        })}
      </div>
      {comparison.setChanges.map((change) => {
        const { text, gained } = describeSetChange(change)
        return <div key={change.setId} className="small" style={{ color: gained ? 'var(--hp)' : 'var(--physical)' }}>{gained ? '▲' : '▼'} {text}</div>
      })}
      {deltas.length > 0 && (
        <div className="small">
          {deltas.map((d) => (
            <span key={d.statId} style={{ marginRight: '8px', color: d.value >= 0 ? 'var(--hp)' : 'var(--physical)' }}>
              {d.value >= 0 ? '+' : ''}{formatNumber(d.value)} {statLabel(d.statId)}
            </span>
          ))}
          <span className="text-body-secondary">item stats</span>
        </div>
      )}
      {equipped && equipped.augmentIds.length > 0 && (
        <div className="small" style={{ color: 'var(--text-dim)' }}>Augments on the replaced item move over to open slots.</div>
      )}
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

/** Two-click salvage button that previews the payout. */
function SalvageButton({ item, onSalvage }: { item: GearItem; onSalvage: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const payout = computeSalvageYield(item)
  return (
    <button
      type="button"
      className={`btn btn-sm ${confirm ? 'btn-danger' : 'btn-outline-danger'}`}
      onClick={() => {
        if (!confirm) return setConfirm(true)
        onSalvage()
        setConfirm(false)
      }}
      onBlur={() => setConfirm(false)}
    >
      {confirm ? 'Confirm salvage' : 'Salvage'} → {formatNumber(payout.focus)} Focus, {formatNumber(payout.materials)} {materialName(payout.materialId)}
    </button>
  )
}

export default function InventoryPage() {
  const state = useGameStore((s) => s)
  const equipItem = useGameStore((s) => s.equipItem)
  const unequipItem = useGameStore((s) => s.unequipItem)
  const equipSet = useGameStore((s) => s.equipSet)
  const socketAugment = useGameStore((s) => s.socketAugment)
  const unsocketAugment = useGameStore((s) => s.unsocketAugment)
  const salvageItem = useGameStore((s) => s.salvageItem)
  const salvageItems = useGameStore((s) => s.salvageItems)
  const reforgeItem = useGameStore((s) => s.reforgeItem)
  const fuseItem = useGameStore((s) => s.fuseItem)
  const fuseAll = useGameStore((s) => s.fuseAll)
  const setActiveTab = useGameStore((s) => s.setActiveTab)
  const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<Filter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('best')
  const [search, setSearch] = useState('')
  const [hideWorse, setHideWorse] = useState(false)
  const [includeSetPieces, setIncludeSetPieces] = useState(false)
  const [confirmSalvage, setConfirmSalvage] = useState(false)
  const [selection, setSelection] = useState<Selection>(null)
  const [compareSlot, setCompareSlot] = useState<GearSlot | null>(null)

  // Comparing every inventory item runs the loadout formulas per item; the worker re-sends state several
  // times a second, so only recompute when something that feeds the comparison actually changed.
  const comparisonKey = JSON.stringify([state.gear, state.inventory, state.stats, state.abilities, state.perkLevels, state.augmentRanks, state.milestonesReached])
  const { rows, worseItems, setPlans } = useMemo(() => {
    const base = computeLoadoutScore(state)
    return {
      rows: state.inventory.map((item) => {
        // One comparison per slot it fits (two for a ring); the headline one is the best of them
        const bySlot = Object.fromEntries(equipSlotsFor(item.catalogId).map((slot) => [slot, compareToEquipped(state, item, base, slot)])) as Partial<Record<GearSlot, GearComparison>>
        return { item, def: getGearCatalogItem(item.catalogId), bySlot, comparison: compareToEquipped(state, item, base) }
      }),
      worseItems: listWorseItems(state, includeSetPieces),
      setPlans: Object.fromEntries(listSets().map((set) => [set.id, planSetLoadout(state, set.id, base)])),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisonKey, includeSetPieces])

  const setCounts = computeEquippedSetCounts(state)
  const allSets = listSets()
  // Only sets with at least one discovered piece are shown; the most-worn sets come first
  const discoveredSets = allSets
    .filter((set) => set.itemIds.some((id) => state.discoveredItemIds.includes(id)))
    .sort((a, b) => (setCounts[b.id] ?? 0) - (setCounts[a.id] ?? 0))

  const pending = totalPendingLevels(state)
  const duplicateMode = effectiveDuplicateMode(state)
  const bulkPayout = new Map<string, number>()
  let bulkFocus = 0
  for (const item of worseItems) {
    const payout = computeSalvageYield(item)
    bulkFocus += payout.focus
    bulkPayout.set(payout.materialId, (bulkPayout.get(payout.materialId) ?? 0) + payout.materials)
  }

  const isImprovement = (c: GearComparison) => c.verdict === 'upgrade' || c.verdict === 'emptySlot'
  const fitsSlot = (def: GearCatalogItemDef, slot: GearSlot) => equipSlotsFor(def.id).includes(slot)
  const upgradesForSlot = (slot: GearSlot) => rows.filter((r) => r.bySlot[slot] && isImprovement(r.bySlot[slot])).length

  const sorted = [...rows].sort((a, b) => {
    if (sortKey === 'rarity') return RARITY_ORDER.indexOf(b.def.rarity) - RARITY_ORDER.indexOf(a.def.rarity) || b.item.level - a.item.level
    if (sortKey === 'level') return b.item.level - a.item.level
    if (sortKey === 'name') return a.def.name.localeCompare(b.def.name)
    return VERDICTS[a.comparison.verdict].order - VERDICTS[b.comparison.verdict].order || b.comparison.net - a.comparison.net
  })
  const slotCounts = new Map<GearSlot, number>()
  for (const { def } of rows) {
    for (const slot of equipSlotsFor(def.id).slice(0, 1)) slotCounts.set(slot, (slotCounts.get(slot) ?? 0) + 1)
  }
  const upgradeCount = rows.filter((r) => isImprovement(r.comparison)).length
  // A filter that no longer matches anything falls back to showing everything
  const activeFilter: Filter = (filter === 'upgrades' && upgradeCount === 0) || (filter !== 'all' && filter !== 'upgrades' && !slotCounts.has(filter)) ? 'all' : filter
  const query = search.trim().toLowerCase()
  const visible = sorted.filter(({ def, comparison }) => {
    if (hideWorse && comparison.verdict === 'worse') return false
    if (query && !def.name.toLowerCase().includes(query)) return false
    if (activeFilter === 'upgrades') return isImprovement(comparison)
    if (activeFilter !== 'all') return fitsSlot(def, activeFilter)
    return true
  })

  // Resolve the selection; a vanished item (equipped, salvaged) falls back to the first visible row
  const selectedRow = selection?.kind === 'inventory' ? rows.find((r) => r.item.instanceId === selection.instanceId) : undefined
  const selectedSlot = selection?.kind === 'equipped' ? selection.slot : null
  const fallbackRow = !selectedRow && !selectedSlot ? visible[0] : undefined
  const detailRow = selectedRow ?? fallbackRow
  const detailSlot = detailRow ? null : (selectedSlot ?? SLOT_ORDER.find((s) => state.gear[s]) ?? null)

  const select = (next: Selection) => {
    setSelection(next)
    setCompareSlot(null)
  }

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

  const renderDetail = () => {
    if (detailRow) {
      const { item, def } = detailRow
      const slots = equipSlotsFor(def.id)
      const comparison = (compareSlot && detailRow.bySlot[compareSlot]) || detailRow.comparison
      return (
        <>
          <div className="small" style={{ color: 'var(--text-dim)' }}>
            Inventory · {slotKindLabel(def)}{def.setId ? ` · ${getSetDef(def.setId).name}` : ''}
          </div>
          <ItemHeader item={item} />
          <div className="small">{effectiveGearStats(item).map((st) => `+${formatNumber(st.value)} ${statLabel(st.statId)}`).join(' · ')}</div>
          {slots.length > 1 && (
            <div className="d-flex align-items-center gap-1 small">
              <span style={{ color: 'var(--text-dim)' }}>Compare with:</span>
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`btn btn-sm ${comparison.slot === slot ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ padding: '0 8px', fontSize: '11.5px' }}
                  onClick={() => setCompareSlot(slot)}
                >
                  {SLOT_LABELS[slot]}
                </button>
              ))}
            </div>
          )}
          <ComparisonSection comparison={comparison} item={item} state={state} />
          <PendingFuse item={item} onFuse={fuseItem} />
          <MaxedNote item={item} lifetime={state.lifetime} />
          <AugmentSection key={item.instanceId} item={item} state={state} onSocket={socketAugment} onUnsocket={unsocketAugment} />
          <ReforgeSection item={item} state={state} onReforge={reforgeItem} />
          <div className="d-flex gap-2 flex-wrap pt-1">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                equipItem(item.instanceId, comparison.slot)
                select({ kind: 'equipped', slot: comparison.slot })
              }}
            >
              Equip{slots.length > 1 ? ` in ${SLOT_LABELS[comparison.slot]}` : ''}
            </button>
            <SalvageButton key={item.instanceId} item={item} onSalvage={() => salvageItem(item.instanceId)} />
          </div>
        </>
      )
    }
    if (detailSlot) {
      const item = state.gear[detailSlot]
      const candidates = sorted
        .filter((r) => r.bySlot[detailSlot])
        .map((r) => ({ ...r, comparison: r.bySlot[detailSlot]! }))
        .sort((a, b) => VERDICTS[a.comparison.verdict].order - VERDICTS[b.comparison.verdict].order || b.comparison.net - a.comparison.net)
      return (
        <>
          <div className="small" style={{ color: 'var(--text-dim)' }}>Equipped · {SLOT_LABELS[detailSlot]}{item && getGearCatalogItem(item.catalogId).setId ? ` · ${getSetDef(getGearCatalogItem(item.catalogId).setId!).name}` : ''}</div>
          {item ? (
            <>
              <ItemHeader item={item} />
              <div className="small">{effectiveGearStats(item).map((st) => `+${formatNumber(st.value)} ${statLabel(st.statId)}`).join(' · ')}</div>
              <PendingFuse item={item} onFuse={fuseItem} />
              <MaxedNote item={item} lifetime={state.lifetime} />
              <AugmentSection key={item.instanceId} item={item} state={state} onSocket={socketAugment} onUnsocket={unsocketAugment} />
              <ReforgeSection item={item} state={state} onReforge={reforgeItem} />
              <div className="pt-1">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => unequipItem(detailSlot)}>Unequip</button>
              </div>
            </>
          ) : (
            <div className="small" style={{ color: 'var(--text-dim)' }}>Nothing equipped.</div>
          )}
          <div className="detail-section">
            <div className="detail-label">In your inventory for this slot</div>
            {candidates.length === 0 && <div className="small" style={{ color: 'var(--text-dim)' }}>Nothing yet.</div>}
            {candidates.map(({ item: c, def, comparison }) => (
              <div key={c.instanceId} className="d-flex align-items-center gap-2 small">
                <button type="button" className="btn btn-link btn-sm p-0 text-start" style={{ color: getRarityDef(def.rarity).color, textDecoration: 'none' }} onClick={() => select({ kind: 'inventory', instanceId: c.instanceId })}>
                  {def.name} <span style={{ color: 'var(--text-dim)' }}>{levelText(c.level)}</span>
                </button>
                <span style={{ color: VERDICTS[comparison.verdict].color, whiteSpace: 'nowrap' }}>{verdictText(comparison)}</span>
                <button type="button" className="btn btn-sm btn-outline-primary ms-auto" style={{ padding: '0 8px' }} onClick={() => equipItem(c.instanceId, detailSlot)}>Equip</button>
              </div>
            ))}
          </div>
        </>
      )
    }
    return <div className="small" style={{ color: 'var(--text-dim)' }}>Select an item to see its details.</div>
  }

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
          title="Salvages every inventory item that would improve nothing if equipped, counting set bonuses and augments."
          onClick={() => {
            if (!confirmSalvage) return setConfirmSalvage(true)
            salvageItems(worseItems.map((i) => i.instanceId))
            setConfirmSalvage(false)
          }}
          onBlur={() => setConfirmSalvage(false)}
        >
          {confirmSalvage ? `Confirm: salvage ${worseItems.length} items` : `Salvage all worse (${worseItems.length})`}
          {worseItems.length > 0 && ` → ${formatNumber(bulkFocus)} Focus, ${[...bulkPayout].map(([id, n]) => `${formatNumber(n)} ${materialName(id)}`).join(', ')}`}
        </button>
        <label className="small d-flex align-items-center gap-1" style={{ color: 'var(--text-dim)' }} title="Set pieces are kept by default: a piece that's worse today can complete a set bonus later.">
          <input type="checkbox" checked={includeSetPieces} onChange={(e) => setIncludeSetPieces(e.target.checked)} />
          include set pieces
        </label>
        <span className="small ms-auto" style={{ color: 'var(--text-dim)' }}>
          Duplicates: <strong style={{ color: 'var(--text)' }}>{duplicateMode === 'keep' ? 'kept for fusing' : duplicateMode === 'salvage' ? 'auto-salvaged' : 'auto-fused'}</strong>
          {' · '}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => setActiveTab('automation')}>change</button>
        </span>
      </div>

      <div className="inv-layout">
        <div className="inv-lists">
          <div className="panel" style={{ padding: '12px' }}>
            <h6 style={{ marginBottom: '8px' }}>Equipped</h6>
            <div className="inv-list">
              {SLOT_ORDER.map((slot) => {
                const item = state.gear[slot]
                const def = item ? getGearCatalogItem(item.catalogId) : null
                const upgrades = upgradesForSlot(slot)
                const selected = !detailRow && detailSlot === slot
                return (
                  <button key={slot} type="button" className={`inv-row${selected ? ' selected' : ''}`} onClick={() => select({ kind: 'equipped', slot })}>
                    <span className="inv-row-slot">{SLOT_LABELS[slot]}</span>
                    {item && def ? (
                      <>
                        <Icon name={def.icon} size={14} />
                        <span className="inv-row-name" style={{ color: getRarityDef(def.rarity).color }}>{def.name}</span>
                        <span className="inv-row-meta">{levelText(item.level)}</span>
                        {item.augmentIds.length > 0 && <span className="inv-row-meta" style={{ color: 'var(--focus)' }} title="Socketed augments">◆{item.augmentIds.length}</span>}
                        {item.pendingLevels ? <span className="inv-row-meta" style={{ color: 'var(--focus)' }} title="Levels waiting to be fused">+{formatNumber(item.pendingLevels)} lv</span> : null}
                      </>
                    ) : (
                      <span className="inv-row-name" style={{ color: 'var(--text-dim)' }}>Empty</span>
                    )}
                    {upgrades > 0 && <span className="inv-row-badge" title={`${upgrades} item${upgrades > 1 ? 's' : ''} in your inventory would improve this slot`}>▲{upgrades}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="panel" style={{ padding: '12px' }}>
            <h6 style={{ marginBottom: '8px' }}>Inventory ({state.inventory.length})</h6>
            {state.inventory.length === 0 ? (
              <div className="text-body-secondary small">No items yet. Keep fighting for loot.</div>
            ) : (
              <>
                <div className="d-flex flex-wrap gap-1 mb-2">
                  {chip('all', 'All', rows.length)}
                  {upgradeCount > 0 && chip('upgrades', '▲ Upgrades', upgradeCount)}
                  {SLOT_ORDER.filter((slot) => slotCounts.has(slot)).map((slot) => chip(slot, slot === 'ring1' ? 'Ring' : SLOT_LABELS[slot], slotCounts.get(slot)!))}
                </div>
                <div className="d-flex flex-wrap gap-2 mb-2 align-items-center">
                  <input type="search" className="form-control form-control-sm" style={{ maxWidth: '180px' }} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  <select className="form-select form-select-sm" style={{ width: 'auto' }} value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                    <option value="best">Best first</option>
                    <option value="rarity">Rarity</option>
                    <option value="level">Level</option>
                    <option value="name">Name</option>
                  </select>
                  <label className="small d-flex align-items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={hideWorse} onChange={(e) => setHideWorse(e.target.checked)} />
                    hide worse
                  </label>
                </div>
                <div className="inv-list">
                  {visible.length === 0 && <div className="small" style={{ color: 'var(--text-dim)' }}>No items match.</div>}
                  {visible.map(({ item, def, comparison }) => (
                    <button
                      key={item.instanceId}
                      type="button"
                      className={`inv-row${detailRow?.item.instanceId === item.instanceId ? ' selected' : ''}`}
                      onClick={() => select({ kind: 'inventory', instanceId: item.instanceId })}
                    >
                      <span className="inv-row-verdict" style={{ color: VERDICTS[comparison.verdict].color }}>{verdictText(comparison)}</span>
                      <Icon name={def.icon} size={14} />
                      <span className="inv-row-name" style={{ color: getRarityDef(def.rarity).color }}>{def.name}</span>
                      <span className="inv-row-meta">{levelText(item.level)}</span>
                      {item.pendingLevels ? <span className="inv-row-meta" style={{ color: 'var(--focus)' }} title="Levels waiting to be fused">+{formatNumber(item.pendingLevels)} lv</span> : null}
                      <span className="inv-row-meta inv-row-kind">{slotKindLabel(def)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={`panel inv-detail${selection ? ' open' : ''}`}>
          <button type="button" className="btn btn-sm btn-outline-secondary inv-detail-close" onClick={() => select(null)}>Close</button>
          {renderDetail()}
        </div>
      </div>

      <div className="panel" style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>
          Sets <span style={{ color: 'var(--text-dim)', fontSize: '12px', fontWeight: 400 }}>· {discoveredSets.length}/{allSets.length} discovered · what wearing each one would do for you</span>
        </div>
        {discoveredSets.length === 0 && <div className="text-body-secondary small">No set pieces found yet.</div>}
        <div className="set-grid">
          {discoveredSets.map((set) => {
            const equipped = setCounts[set.id] ?? 0
            const plan = setPlans[set.id]
            const wornAfter = plan.setChanges.find((c) => c.setId === set.id)?.after ?? equipped
            const open = expandedSets[set.id] ?? false
            const verdictColor = plan.net > 1e-4 ? 'var(--hp)' : plan.net < -1e-4 ? 'var(--physical)' : 'var(--text-dim)'
            return (
              <div key={set.id} className="set-card">
                <button type="button" className="set-card-header" onClick={() => setExpandedSets((prev) => ({ ...prev, [set.id]: !open }))}>
                  <span style={{ fontWeight: 600 }}>{set.name}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{equipped}/{plan.total} worn · {plan.owned} owned {open ? '▴' : '▾'}</span>
                </button>
                <div className="d-flex align-items-center flex-wrap gap-2 mt-1" style={{ whiteSpace: 'nowrap' }}>
                  {plan.swaps.length === 0 ? (
                    <span style={{ color: 'var(--text-dim)' }}>{plan.owned === 0 ? 'No pieces owned yet.' : 'Wearing every piece you own.'}</span>
                  ) : (
                    <>
                      <span style={{ color: verdictColor }} title={LOADOUT_ASPECTS.map((k) => `${ASPECT_LABELS[k].label} ${pctText(plan.aspects[k])}`).join(', ')}>
                        {plan.net > 1e-4 ? '▲' : plan.net < -1e-4 ? '▼' : '◆'} {pctText(plan.net)} overall
                      </span>
                      <span style={{ color: 'var(--text-dim)' }}>· {plan.swaps.length} swap{plan.swaps.length > 1 ? 's' : ''} → {wornAfter}/{plan.total} worn</span>
                      <button type="button" className="btn btn-sm btn-outline-primary ms-auto" style={{ padding: '0 8px' }} onClick={() => equipSet(set.id)}>
                        Equip set
                      </button>
                    </>
                  )}
                </div>
                {open && (
                  <div style={{ marginTop: '6px', fontSize: '12px' }}>
                    {plan.swaps.length > 0 && (
                      <div className="aspect-grid mb-1">
                        {LOADOUT_ASPECTS.map((k) => {
                          const v = plan.aspects[k]
                          const flat = Math.abs(v) < 1e-4
                          return (
                            <div key={k} title={ASPECT_LABELS[k].title}>
                              <span style={{ color: 'var(--text-dim)' }}>{ASPECT_LABELS[k].label} </span>
                              <span style={{ color: flat ? 'var(--text-dim)' : v > 0 ? 'var(--hp)' : 'var(--physical)' }}>{flat ? '—' : pctText(v)}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {set.bonuses.map((tier, i) => {
                      const active = equipped >= tier.pieces
                      const gained = !active && wornAfter >= tier.pieces
                      return (
                        <div key={i} style={{ color: active ? 'var(--hp)' : gained ? 'var(--focus)' : 'var(--text-dim)' }}>
                          {tier.pieces}pc: {tier.description}{active ? ' ✓' : gained ? ' (with this set)' : ''}
                        </div>
                      )
                    })}
                    <div className="set-pieces">
                      {[...set.itemIds].sort((a, b) => SLOT_ORDER.indexOf(equipSlotsFor(a)[0]) - SLOT_ORDER.indexOf(equipSlotsFor(b)[0])).map((root) => {
                        const chain = getTierChain(root)
                        const def = getGearCatalogItem(root)
                        const discovered = [...chain].reverse().find((id) => state.discoveredItemIds.includes(id))
                        const owned = [...chain].reverse().map((id) => rows.find((r) => r.item.catalogId === id)?.item ?? Object.values(state.gear).find((g) => g?.catalogId === id)).find((i) => !!i)
                        const worn = owned && Object.values(state.gear).some((g) => g?.instanceId === owned.instanceId)
                        return (
                          <div key={root} className="d-flex gap-2">
                            <span style={{ color: 'var(--text-dim)', flex: '0 0 72px' }}>{slotKindLabel(def)}</span>
                            <span style={{ flex: 1, color: owned ? getRarityDef(getGearCatalogItem(owned.catalogId).rarity).color : 'var(--text-dim)' }}>
                              {owned ? getGearCatalogItem(owned.catalogId).name : discovered ? getGearCatalogItem(discovered).name : '???'}
                            </span>
                            <span style={{ color: worn ? 'var(--hp)' : 'var(--text-dim)' }}>{worn ? 'worn' : owned ? levelText(owned.level) : 'not owned'}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
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

    </div>
  )
}

