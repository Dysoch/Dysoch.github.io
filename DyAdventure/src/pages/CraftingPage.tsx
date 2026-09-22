import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  computeCraftCostN,
  computeMaxCraftCount,
  getRarityDef,
  getStatLabel,
  getSetDef,
  listCraftableItems,
  listMaterials,
} from '../worker/simLogic'
import { formatNumber } from '../utils/format'
import { Icon } from '../components/icons'
import { QtySelector, type BuyQty } from '../components/QtySelector'
import type { GearCatalogItemDef } from '../types'

const MATERIALS = listMaterials()

function materialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id
}

export default function CraftingPage() {
  const state = useGameStore((s) => s)
  const craftItem = useGameStore((s) => s.craftItem)
  const items = listCraftableItems(state)
  const [qty, setQty] = useState<BuyQty>(1)

  // Group craftable items by set; items without a set go last
  const groups = new Map<string, GearCatalogItemDef[]>()
  for (const item of items) {
    const key = item.setId ?? ''
    groups.set(key, [...(groups.get(key) ?? []), item])
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
          Dropped by monsters and gained from salvaging. Focus: {formatNumber(state.focus)}
        </div>
      </div>

      <QtySelector value={qty} onChange={setQty} />

      {items.length === 0 && (
        <div className="text-body-secondary small">You haven't discovered any gear yet — pieces you find can be crafted here later.</div>
      )}

      {orderedKeys.map((key) => (
        <div key={key || 'none'}>
          <h6>{key ? getSetDef(key).name : 'Other gear'}</h6>
          <div className="inventory-grid">
            {groups.get(key)!.map((item) => {
              const rarity = getRarityDef(item.rarity)
              const buyCount = qty === 'max' ? Math.max(1, computeMaxCraftCount(state, item.id)) : qty
              const cost = computeCraftCostN(item.id, buyCount)
              const affordable = state.focus >= cost.focus && cost.materials.every((m) => (state.materials[m.materialId] ?? 0) >= m.amount)
              return (
                <div key={item.id} className="inventory-card">
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <Icon name={item.icon} size={16} />
                    <span style={{ color: rarity.color }}>{item.name}</span>
                    <span style={{ fontSize: '10px', color: rarity.color, border: `1px solid ${rarity.color}`, borderRadius: '4px', padding: '0 5px' }}>
                      {rarity.name}
                    </span>
                  </div>
                  <div className="small text-body-secondary">
                    {item.stats.map((st) => `+${formatNumber(st.value)} ${getStatLabel(st.statId)}`).join(', ')}
                  </div>
                  <div className="small">
                    {cost.materials.map((m) => {
                      const have = state.materials[m.materialId] ?? 0
                      return (
                        <span key={m.materialId} style={{ marginRight: '10px', color: have >= m.amount ? 'var(--text)' : 'var(--physical)' }}>
                          {formatNumber(m.amount)} {materialName(m.materialId)}
                        </span>
                      )
                    })}
                    <span style={{ color: state.focus >= cost.focus ? 'var(--text)' : 'var(--physical)' }}>{formatNumber(cost.focus)} Focus</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mt-auto"
                    disabled={!affordable}
                    onClick={() => craftItem(item.id, buyCount)}
                  >
                    {buyCount > 1 ? `Craft ×${buyCount}` : 'Craft'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
