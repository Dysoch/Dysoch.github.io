import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import { getBuildingOutputMult, getBuildingCostMult } from '../utils/multipliers'
import buildingsData from '../content/buildings.json'
import resourcesData from '../content/resources.json'
import type { Building, BuildingCost, Resource } from '../types'

const buildings = buildingsData as Building[]
const resources = resourcesData as Resource[]
const resourceMap = Object.fromEntries(resources.map((r) => [r.id, r]))

function getCurrentCost(building: Building, owned: number, costMult: number): BuildingCost[] {
  return building.baseCost.map((c) => ({
    resourceId: c.resourceId,
    amount: Math.floor(c.amount * Math.pow(building.costMultiplier, owned) * costMult),
  }))
}

function canAfford(costs: BuildingCost[], balances: Record<string, number>): boolean {
  return costs.every((c) => (balances[c.resourceId] ?? 0) >= c.amount)
}

export default function Properties() {
  const { buildings: owned, resources: balances, buyBuilding, purchasedUpgrades, purchasedSkills } = useGameStore()

  return (
    <div className="p-4">
      <h2>🏗️ Properties</h2>
      <p className="text-body-secondary mb-4">
        Purchase buildings to generate passive income. Cost increases with each purchase.
      </p>

      <div className="row g-3" style={{ maxWidth: 720 }}>
        {buildings.map((building) => {
          const ownedCount = owned[building.id] ?? 0
          const costMult = getBuildingCostMult(building.id, purchasedSkills)
          const outputMult = getBuildingOutputMult(building.id, purchasedUpgrades, purchasedSkills)
          const currentCost = getCurrentCost(building, ownedCount, costMult)
          const affordable = canAfford(currentCost, balances)

          return (
            <div className="col-12 col-md-6" key={building.id}>
              <div className="card h-100">
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
                  </div>

                  <div className="mb-3" style={{ fontSize: '0.875rem' }}>
                    <span className="text-body-secondary">Cost: </span>
                    {currentCost.map((c, i) => {
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
                    onClick={() => buyBuilding(building.id)}
                  >
                    Buy
                  </button>
                </div>

                {ownedCount > 0 && (
                  <div className="card-footer text-body-secondary" style={{ fontSize: '0.8rem' }}>
                    {building.production.map((p) => {
                      const res = resourceMap[p.resourceId]
                      return (
                        <span key={p.resourceId}>
                          {res?.icon} {res?.name}: {formatNumber(balances[p.resourceId] ?? 0)}
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
