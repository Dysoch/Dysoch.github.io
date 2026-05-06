import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import { getBuildingOutputMult, getBuildingCostMult } from '../utils/multipliers'
import { isUnlocked } from '../utils/unlock'
import buildingsData from '../content/buildings.json'
import resourcesData from '../content/resources.json'
import type { Building, BuildingCost, Resource } from '../types'

const allBuildings = buildingsData as Building[]
const resources = resourcesData as Resource[]
const resourceMap = Object.fromEntries(resources.map((r) => [r.id, r]))

function getCurrentCost(building: Building, owned: number, costMult: number): BuildingCost[] {
  return building.baseCost.map((c) => ({
    resourceId: c.resourceId,
    amount: Math.floor(c.amount * Math.pow(building.costMultiplier, owned) * costMult),
  }))
}

function getMultiBuyCost(building: Building, owned: number, costMult: number, count: number): BuildingCost[] {
  return building.baseCost.map((c) => {
    let total = 0
    for (let i = 0; i < count; i++) {
      total += Math.floor(c.amount * Math.pow(building.costMultiplier, owned + i) * costMult)
    }
    return { resourceId: c.resourceId, amount: total }
  })
}

function getMaxAffordable(building: Building, owned: number, costMult: number, balances: Record<string, number>): number {
  const tempBalances = { ...balances }
  let count = 0
  while (count < 10000) {
    const nextCost = building.baseCost.map((c) => ({
      resourceId: c.resourceId,
      amount: Math.floor(c.amount * Math.pow(building.costMultiplier, owned + count) * costMult),
    }))
    if (!nextCost.every((c) => (tempBalances[c.resourceId] ?? 0) >= c.amount)) break
    for (const c of nextCost) {
      tempBalances[c.resourceId] = (tempBalances[c.resourceId] ?? 0) - c.amount
    }
    count++
  }
  return count
}

function canAfford(costs: BuildingCost[], balances: Record<string, number>): boolean {
  return costs.every((c) => (balances[c.resourceId] ?? 0) >= c.amount)
}

const QTY_OPTIONS = [1, 5, 10, 25, 50, 100] as const
type BuyQty = 1 | 5 | 10 | 25 | 50 | 100 | 'max'

export default function Properties() {
  const [buyQty, setBuyQty] = useState<BuyQty>(1)
  const {
    buildings: owned, resources: balances, buyBuilding, buyBuildingN,
    purchasedUpgrades, purchasedSkills, stats, lifetimeStats, prestigeCount,
  } = useGameStore()

  const unlockState = { stats, lifetimeStats, purchasedSkills, purchasedUpgrades, prestigeCount }
  const buildings = allBuildings.filter((b) => isUnlocked(b.unlock, unlockState))

  return (
    <div className="p-4">
      <h2>🏗️ Properties</h2>
      <p className="text-body-secondary mb-4">
        Purchase buildings to generate passive income. Cost increases with each purchase.
      </p>

      <div className="mb-3 d-flex gap-2 align-items-center">
        <span className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Buy:</span>
        {QTY_OPTIONS.map((q) => (
          <button
            key={q}
            className={`btn btn-sm ${buyQty === q ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setBuyQty(q)}
          >
            ×{q}
          </button>
        ))}
        <button
          className={`btn btn-sm ${buyQty === 'max' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setBuyQty('max')}
        >
          Max
        </button>
      </div>

      <div className="row g-2" style={{ maxWidth: 1500 }}>
        {buildings.map((building) => {
          const ownedCount = owned[building.id] ?? 0
          const costMult = getBuildingCostMult(building.id, purchasedSkills)
          const outputMult = getBuildingOutputMult(building.id, purchasedUpgrades, purchasedSkills)
          const maxAffordable = buyQty === 'max' ? getMaxAffordable(building, ownedCount, costMult, balances) : null
          const actualQty = buyQty === 'max' ? (maxAffordable ?? 0) : buyQty
          const displayCost = actualQty > 0
            ? getMultiBuyCost(building, ownedCount, costMult, actualQty)
            : getCurrentCost(building, ownedCount, costMult)
          const affordable = actualQty > 0 && canAfford(displayCost, balances)

          return (
            <div className="col-12 col-md-3" key={building.id}>
              <div className={`card h-100 ${affordable ? 'border-primary' : ''}`}>
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <h5 className="card-title mb-0">
                      {building.icon} {building.name}
                    </h5>
                    <span className="badge bg-secondary ms-2 flex-shrink-0">
                      Owned: {ownedCount}
                    </span>
                  </div>

                  <p className="text-body-secondary mb-2" style={{ fontSize: '0.875rem' }}>
                    {building.description}
                  </p>

                  <div className="mb-2" style={{ fontSize: '0.875rem' }}>
                    {building.production.map((p) => {
                      const res = resourceMap[p.resourceId]
                      const effectivePerSec = p.amountPerSecond * outputMult
                      const totalPerSec = effectivePerSec * ownedCount
                      return (
                        <div key={p.resourceId} className="text-success">
                          {res?.icon} +{effectivePerSec.toFixed(3)}/s per building
                          {ownedCount > 0 && (
                            <span className="text-body-secondary ms-1">
                              ({formatNumber(totalPerSec)}/s total)
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {building.consumption?.map((c) => {
                      const res = resourceMap[c.resourceId]
                      const totalPerSec = c.amountPerSecond * ownedCount
                      return (
                        <div key={`cons_${c.resourceId}`} className="text-danger">
                          {res?.icon} -{c.amountPerSecond.toFixed(3)}/s per building
                          {ownedCount > 0 && (
                            <span className="text-body-secondary ms-1">
                              ({formatNumber(totalPerSec)}/s total)
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mb-3" style={{ fontSize: '0.875rem' }}>
                    <span className="text-body-secondary">
                      Cost{actualQty > 1 ? ` (×${actualQty})` : ''}:{' '}
                    </span>
                    {displayCost.map((c, i) => {
                      const res = resourceMap[c.resourceId]
                      const have = balances[c.resourceId] ?? 0
                      return (
                        <span
                          key={c.resourceId}
                          className={`${i > 0 ? 'ms-2' : ''} ${have >= c.amount ? '' : 'text-danger'}`}
                        >
                          {res?.icon} {formatNumber(c.amount)} {res?.name}
                        </span>
                      )
                    })}
                  </div>

                  <button
                    className="btn btn-sm btn-primary w-100"
                    disabled={!affordable}
                    onClick={() => {
                      if (buyQty === 'max') {
                        if (maxAffordable && maxAffordable > 0) buyBuildingN(building.id, maxAffordable)
                      } else if (buyQty === 1) {
                        buyBuilding(building.id)
                      } else {
                        buyBuildingN(building.id, buyQty)
                      }
                    }}
                  >
                    Buy{actualQty > 1 ? ` ×${actualQty}` : ''}
                  </button>
                </div>

                {ownedCount > 0 && (
                  <div className="card-footer text-body-secondary" style={{ fontSize: '0.8rem' }}>
                    {building.baseCost.map((c, i) => {
                      const res = resourceMap[c.resourceId]
                      return (
                        <span key={c.resourceId} className={i > 0 ? 'ms-2' : ''}>
                          {res?.icon} {res?.name}: {formatNumber(balances[c.resourceId] ?? 0)}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
