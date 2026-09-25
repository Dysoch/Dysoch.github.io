import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  computeCraftCostN,
  computeFuseRate,
  computeFuseRoomCopies,
  computeFuseTargetId,
  computeMaxCraftCount,
  computeImbueCostN,
  computeMaxImbueCount,
  describeAugment,
  getAugmentDef,
  getGearCatalogItem,
  getOwnedItem,
  getRarityDef,
  getStatLabel,
  getSetDef,
  getTierChain,
  listCraftableItems,
  listMaterials,
} from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from '../components/icons'
import { BuyButtonRow, type BuyRowOption } from '../components/BuyButtonRow'
import type { CraftCost } from '../worker/simLogic'
import type { GearCatalogItemDef, SimState } from '../types'

const MATERIALS = listMaterials()
const QTY_STEPS = [1, 5, 10, 25] as const

function materialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id
}

function describeCost(cost: CraftCost): string {
  const parts = cost.materials.map((m) => `${formatNumber(m.amount)} ${materialName(m.materialId)}`)
  if (cost.focus > 0) parts.push(`${formatNumber(cost.focus)} Focus`)
  return parts.join(', ')
}

function canPay(state: SimState, cost: CraftCost): boolean {
  return state.focus >= cost.focus && cost.materials.every((m) => (state.materials[m.materialId] ?? 0) >= m.amount)
}

function levelText(level: number): string {
  return `Lv.${Math.round(level * 100) / 100}`
}

/** Imbuing: spend surplus materials to permanently strengthen a learned augment, wherever it's socketed. */
function ImbuePanel({ state, onImbue }: { state: SimState; onImbue: (augmentId: string, count: number) => void }) {
  if (state.learnedAugmentIds.length === 0) return null
  return (
    <div>
      <h6>Imbue augments</h6>
      <p className="text-body-secondary small" style={{ maxWidth: '900px' }}>
        Spend materials to permanently strengthen an augment you've learned. Every item with that augment socketed benefits, and Imbue ranks are never reset.
      </p>
      <div className="inventory-grid">
        {state.learnedAugmentIds.map((augmentId) => {
          const def = getAugmentDef(augmentId)
          const rank = state.augmentRanks[augmentId] ?? 0
          const perRank = computeImbueCostN(augmentId, rank, 1)
          const maxQty = Math.max(1, computeMaxImbueCount(state, augmentId))
          const option = (qty: number, label: string): BuyRowOption => {
            const cost = computeImbueCostN(augmentId, rank, qty)
            return { qty, label, cost: cost.materials[0].amount, affordable: canPay(state, cost), title: describeCost(cost) }
          }
          return (
            <div key={augmentId} className="inventory-card">
              <div className="d-flex align-items-center gap-2">
                <Icon name={def.icon} size={16} />
                <span style={{ fontWeight: 600, color: 'var(--focus)' }}>{def.name}</span>
                <span className="small" style={{ color: 'var(--text-dim)', marginLeft: 'auto' }}>Rank {rank}</span>
              </div>
              <div className="small">{describeAugment(state, augmentId)}</div>
              <div className="small">
                <span style={{ color: 'var(--text-dim)' }}>Next rank: </span>
                {perRank.materials.map((m) => (
                  <span key={m.materialId} style={{ marginRight: '8px', color: (state.materials[m.materialId] ?? 0) >= m.amount ? 'var(--text)' : 'var(--physical)' }}>
                    {formatNumber(m.amount)} {materialName(m.materialId)}
                  </span>
                ))}
              </div>
              <div className="mt-auto">
                <BuyButtonRow steps={QTY_STEPS.map((qty) => option(qty, `×${qty}`))} maxOption={option(maxQty, 'Max')} onBuy={(qty) => onImbue(augmentId, qty)} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** One card per item line: every discovered rarity tier of the same piece, with a rarity picker. */
function CraftLineCard({ tiers, state, onCraft }: { tiers: GearCatalogItemDef[]; state: SimState; onCraft: (catalogId: string, count: number) => void }) {
  const [selectedId, setSelectedId] = useState(tiers[tiers.length - 1].id)
  const item = tiers.find((t) => t.id === selectedId) ?? tiers[tiers.length - 1]
  const rarity = getRarityDef(item.rarity)

  // Highest tier of this line the player owns — what crafted copies will fuse into
  const ownedId = computeFuseTargetId(state, getTierChain(item.id)[0])
  const owned = ownedId ? getOwnedItem(state, ownedId) : null
  const ownedDef = ownedId ? getGearCatalogItem(ownedId) : null
  const equipped = owned ? Object.values(state.gear).some((g) => g?.instanceId === owned.instanceId) : false
  const fuseTargetId = computeFuseTargetId(state, item.id)

  const roomCopies = computeFuseRoomCopies(state, item.id)
  const perCraft = computeCraftCostN(item.id, 1)
  const maxQty = Math.max(1, computeMaxCraftCount(state, item.id))
  const option = (qty: number, label: string): BuyRowOption => {
    const cost = computeCraftCostN(item.id, qty)
    const fits = qty <= roomCopies
    return { qty, label, cost: cost.focus, affordable: fits && canPay(state, cost), title: fits ? describeCost(cost) : `Only ${roomCopies} more fit before the level cap` }
  }

  return (
    <div className="inventory-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon name={item.icon} size={16} />
        <span style={{ color: rarity.color, fontWeight: 600 }}>{item.name}</span>
      </div>

      <div className="small" style={{ color: 'var(--text-dim)' }}>
        {owned && ownedDef ? (
          <>
            Owned: <span style={{ color: getRarityDef(ownedDef.rarity).color }}>{getRarityDef(ownedDef.rarity).name}</span> {levelText(owned.level)}
            {equipped ? ' · equipped' : ''}
          </>
        ) : (
          'Not owned'
        )}
      </div>

      {tiers.length > 1 && (
        <div className="d-flex flex-wrap gap-1">
          {tiers.map((t) => {
            const r = getRarityDef(t.rarity)
            const active = t.id === item.id
            return (
              <button
                key={t.id}
                type="button"
                className="btn btn-sm"
                onClick={() => setSelectedId(t.id)}
                style={{
                  padding: '0 7px',
                  fontSize: '10.5px',
                  color: active ? 'var(--bg)' : r.color,
                  background: active ? r.color : 'transparent',
                  border: `1px solid ${r.color}`,
                }}
              >
                {r.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="small text-body-secondary">
        <span style={{ color: rarity.color }}>{rarity.name}</span>: {item.stats.map((st) => `+${formatNumber(st.value)} ${getStatLabel(st.statId)}`).join(', ')}
      </div>

      <div className="small">
        <span style={{ color: 'var(--text-dim)' }}>Per craft: </span>
        {perCraft.materials.map((m) => (
          <span key={m.materialId} style={{ marginRight: '8px', color: (state.materials[m.materialId] ?? 0) >= m.amount ? 'var(--text)' : 'var(--physical)' }}>
            {formatNumber(m.amount)} {materialName(m.materialId)}
          </span>
        ))}
        <span style={{ color: state.focus >= perCraft.focus ? 'var(--text)' : 'var(--physical)' }}>{formatNumber(perCraft.focus)} Focus</span>
      </div>

      <div className="small" style={{ color: 'var(--text-dim)' }}>
        {fuseTargetId && roomCopies <= 0
          ? `Your ${getRarityDef(getGearCatalogItem(fuseTargetId).rarity).name} is at its level cap — nothing left to craft`
          : fuseTargetId
            ? `Each craft: +${formatNumber(computeFuseRate(item.id, fuseTargetId))} levels to your ${getRarityDef(getGearCatalogItem(fuseTargetId).rarity).name}${Number.isFinite(roomCopies) ? ` (${formatNumber(roomCopies)} more until max)` : ''}`
            : 'First craft adds it to your inventory; more copies fuse in as levels'}
      </div>

      <div className="mt-auto">
        <BuyButtonRow
          steps={QTY_STEPS.map((qty) => option(qty, `×${qty}`))}
          maxOption={option(maxQty, 'Max')}
          onBuy={(qty) => onCraft(item.id, qty)}
        />
      </div>
    </div>
  )
}

export default function CraftingPage() {
  const state = useGameStore((s) => s)
  const craftItem = useGameStore((s) => s.craftItem)
  const imbueAugment = useGameStore((s) => s.imbueAugment)
  const items = listCraftableItems(state)

  // One line per reforge chain (lowest tier first), keyed by its root item
  const lines = new Map<string, GearCatalogItemDef[]>()
  for (const item of items) {
    const root = getTierChain(item.id)[0]
    lines.set(root, [...(lines.get(root) ?? []), item])
  }
  for (const [root, tiers] of lines) {
    const chain = getTierChain(root)
    tiers.sort((a, b) => chain.indexOf(a.id) - chain.indexOf(b.id))
  }

  // Group lines by set; lines without a set go last
  const groups = new Map<string, GearCatalogItemDef[][]>()
  for (const tiers of lines.values()) {
    const key = tiers[0].setId ?? ''
    groups.set(key, [...(groups.get(key) ?? []), tiers])
  }
  const orderedKeys = [...groups.keys()].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="panel" style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Materials</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          {MATERIALS.map((m) => (
            <div key={m.id} style={{ fontSize: '12.5px' }} title={m.description}>
              <div style={{ color: 'var(--text-dim)' }}>{m.name}</div>
              <div style={{ fontWeight: 600 }}>{formatNumber(state.materials[m.id] ?? 0)}</div>
            </div>
          ))}
        </div>
        <div className="text-body-secondary small mt-2">
          Dropped by monsters and gained from salvaging. Focus: {formatNumber(state.focus)}. Craft buttons show Focus and Imbue buttons show the first material; hover for the full cost.
        </div>
      </div>

      <ImbuePanel state={state} onImbue={imbueAugment} />

      {items.length === 0 && (
        <div className="text-body-secondary small">You haven't discovered any gear yet — pieces you find can be crafted here later.</div>
      )}

      {orderedKeys.map((key) => (
        <div key={key || 'none'}>
          <h6>{key ? getSetDef(key).name : 'Other gear'}</h6>
          <div className="inventory-grid">
            {groups.get(key)!.map((tiers) => (
              <CraftLineCard key={getTierChain(tiers[0].id)[0]} tiers={tiers} state={state} onCraft={craftItem} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
