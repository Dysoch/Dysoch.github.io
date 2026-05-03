import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import upgradesData from '../content/upgrades.json'
import resourcesData from '../content/resources.json'
import jobsData from '../content/jobs.json'
import buildingsData from '../content/buildings.json'
import type { UpgradeDef, Resource, Job, Building } from '../types'

const upgrades = upgradesData as UpgradeDef[]
const resourceMap = Object.fromEntries((resourcesData as Resource[]).map((r) => [r.id, r]))
const jobMap = Object.fromEntries((jobsData as Job[]).map((j) => [j.id, j]))
const buildingMap = Object.fromEntries((buildingsData as Building[]).map((b) => [b.id, b]))

const manualLaborUpgrades = upgrades.filter((u) => u.category === 'manual_labor')
const propertyUpgrades    = upgrades.filter((u) => u.category === 'property')

function targetLabel(upg: UpgradeDef): string {
  const job = jobMap[upg.target]
  if (job) return `${job.icon} ${job.name}`
  const building = buildingMap[upg.target]
  if (building) return `${building.icon} ${building.name}`
  return upg.target
}

function effectMultiplierLabel(upg: UpgradeDef, level: number): string {
  if (level === 0) return ''
  const total = Math.pow(upg.magnitude, level)
  return `(×${total.toFixed(2)} at L${level})`
}

export default function Upgrades() {
  const { resources: balances, purchasedUpgrades, buyUpgrade } = useGameStore()

  function renderSection(title: string, icon: string, list: UpgradeDef[]) {
    return (
      <div className="mb-5">
        <h5 className="mb-3">{icon} {title}</h5>
        <div className="row g-3" style={{ maxWidth: 720 }}>
          {list.map((upg) => {
            const currentLevel = purchasedUpgrades[upg.id] ?? 0
            const isMaxed = currentLevel >= upg.maxLevel
            const nextCosts = isMaxed ? [] : upg.costsPerLevel[currentLevel]
            const canAfford = !isMaxed && nextCosts.every(
              (c) => (balances[c.resourceId] ?? 0) >= c.amount
            )

            return (
              <div className="col-12 col-md-6" key={upg.id}>
                <div className={`card h-100 ${canAfford ? 'border-primary' : ''}`}>
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-1">
                      <h6 className="card-title mb-0">{upg.name}</h6>
                      <span className={`badge ms-2 flex-shrink-0 ${isMaxed ? 'bg-success' : 'bg-secondary'}`}>
                        {currentLevel}/{upg.maxLevel}
                      </span>
                    </div>

                    <div className="text-body-secondary mb-1" style={{ fontSize: '0.8rem' }}>
                      {targetLabel(upg)}
                    </div>

                    <p className="text-body-secondary mb-2" style={{ fontSize: '0.875rem' }}>
                      {upg.description}
                      {currentLevel > 0 && (
                        <span className="ms-1 text-success">{effectMultiplierLabel(upg, currentLevel)}</span>
                      )}
                    </p>

                    {!isMaxed && (
                      <div className="mb-2" style={{ fontSize: '0.875rem' }}>
                        <span className="text-body-secondary">Cost: </span>
                        {nextCosts.map((c, i) => {
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
                    )}

                    <button
                      className={`btn btn-sm w-100 ${isMaxed ? 'btn-outline-success' : 'btn-primary'}`}
                      disabled={!canAfford}
                      onClick={() => buyUpgrade(upg.id)}
                    >
                      {isMaxed ? 'Maxed' : 'Buy'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2>⬆️ Upgrades</h2>
      <p className="text-body-secondary mb-4">
        One-time purchases that boost outputs within this venture. Upgrades reset on Prestige.
      </p>
      {renderSection('Manual Labor', '⛏️', manualLaborUpgrades)}
      {renderSection('Properties', '🏗️', propertyUpgrades)}
    </div>
  )
}
