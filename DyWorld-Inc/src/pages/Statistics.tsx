import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../utils/format'
import {
  getJobRewardMinMult, getJobRewardMaxMult, getJobDurationMult,
  getBuildingOutputMult, getBuildingCostMult,
  getMarketSellMult, getMarketBuyMult, getMarketCeilingMult, getMarketFloorMult,
  getCraftDurationMult, getCraftOutputMult, getCraftWorkerCount,
  getCraftFreeChance, getCraftDoubleChance,
} from '../utils/multipliers'
import resourcesData from '../content/resources.json'
import jobsData from '../content/jobs.json'
import buildingsData from '../content/buildings.json'
import recipesData from '../content/recipes.json'
import type { Resource, Job, Building, Recipe } from '../types'

const resources = resourcesData as Resource[]
const jobs = jobsData as Job[]
const buildings = buildingsData as Building[]
const recipes = recipesData as Recipe[]

type StatsTab = 'capital' | 'basic' | 'crafted' | 'manual-labor' | 'properties' | 'crafting' | 'modifiers'

const STATS_TABS: { id: StatsTab; label: string }[] = [
  { id: 'capital',      label: '💰 Capital' },
  { id: 'basic',        label: '🪵 Basic Resources' },
  { id: 'crafted',      label: '🔨 Crafted Resources' },
  { id: 'manual-labor', label: '⛏️ Manual Labor' },
  { id: 'properties',   label: '🏗️ Properties' },
  { id: 'crafting',     label: '🔨 Crafting' },
  { id: 'modifiers',    label: '⚡ Modifiers' },
]

function multFmt(val: number): string {
  return `×${val.toFixed(2)}`
}
function reductionFmt(val: number): string {
  const pct = ((1 - val) * 100).toFixed(1)
  return `${multFmt(val)} (−${pct}%)`
}
function bonusFmt(val: number): string {
  const pct = ((val - 1) * 100).toFixed(1)
  return `${multFmt(val)} (+${pct}%)`
}

function fmt(n: number) {
  return formatNumber(n)
}

export default function Statistics() {
  const { resources: balances, stats, prevVentureStats, lifetimeStats, purchasedSkills, purchasedUpgrades } = useGameStore()
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTab>('capital')

  const capitalResources = resources.filter((r) => r.category === 'capital')
  const basicResources   = resources.filter((r) => r.category === 'basic')
  const craftedResources = resources.filter((r) => r.category === 'crafted')

  function ResourceTable({ list }: { list: Resource[] }) {
    return (
      <div className="card" style={{ maxWidth: 780 }}>
        <div className="card-body p-0">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th style={{ fontSize: '0.8rem' }}>Resource</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Balance</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Earned (This)</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Earned (Prev)</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Earned (All)</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Spent (This)</th>
                <th className="text-end" style={{ fontSize: '0.8rem' }}>Spent (All)</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontSize: '0.875rem' }}>{r.icon} {r.name}</td>
                  <td className="text-end fw-semibold" style={{ fontSize: '0.875rem' }}>
                    {fmt(balances[r.id] ?? 0)}
                  </td>
                  <td className="text-end text-success" style={{ fontSize: '0.875rem' }}>
                    {fmt(stats[`${r.id}_earned`] ?? 0)}
                  </td>
                  <td className="text-end text-body-secondary" style={{ fontSize: '0.875rem' }}>
                    {fmt(prevVentureStats[`${r.id}_earned`] ?? 0)}
                  </td>
                  <td className="text-end text-success" style={{ fontSize: '0.875rem' }}>
                    {fmt(lifetimeStats[`${r.id}_earned`] ?? 0)}
                  </td>
                  <td className="text-end text-danger" style={{ fontSize: '0.875rem' }}>
                    {fmt(stats[`${r.id}_spent`] ?? 0)}
                  </td>
                  <td className="text-end text-danger" style={{ fontSize: '0.875rem' }}>
                    {fmt(lifetimeStats[`${r.id}_spent`] ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function StatRow3({ label, thisVal, prevVal, allVal }: {
    label: string; thisVal: number; prevVal: number; allVal: number
  }) {
    return (
      <tr>
        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>{label}</td>
        <td className="text-end fw-semibold" style={{ fontSize: '0.875rem' }}>{fmt(thisVal)}</td>
        <td className="text-end text-body-secondary" style={{ fontSize: '0.875rem' }}>{fmt(prevVal)}</td>
        <td className="text-end" style={{ fontSize: '0.875rem' }}>{fmt(allVal)}</td>
      </tr>
    )
  }

  return (
    <div className="p-4">
      <h2>📊 Statistics</h2>
      <p className="text-body-secondary mb-3">
        A summary of everything you have earned and accomplished.
      </p>

      <ul className="nav nav-pills mb-4">
        {STATS_TABS.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link ${activeStatsTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveStatsTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeStatsTab === 'capital' && (
        <div>
          <div className="text-body-secondary mb-2" style={{ fontSize: '0.8rem' }}>
            This Venture / Previous Venture / All Time
          </div>
          <ResourceTable list={capitalResources} />
        </div>
      )}

      {activeStatsTab === 'basic' && (
        <div>
          <div className="text-body-secondary mb-2" style={{ fontSize: '0.8rem' }}>
            This Venture / Previous Venture / All Time
          </div>
          <ResourceTable list={basicResources} />
        </div>
      )}

      {activeStatsTab === 'crafted' && (
        <div>
          <div className="text-body-secondary mb-2" style={{ fontSize: '0.8rem' }}>
            This Venture / Previous Venture / All Time
          </div>
          <ResourceTable list={craftedResources} />
        </div>
      )}

      {activeStatsTab === 'manual-labor' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header fw-semibold">⛏️ Manual Labor</div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: '0.8rem' }}>Stat</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>This Run</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Prev Run</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>All Time</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <StatRow3
                    key={`${job.id}_comp`}
                    label={`${job.icon} ${job.name} — completions`}
                    thisVal={stats[`job_${job.id}_completed`] ?? 0}
                    prevVal={prevVentureStats[`job_${job.id}_completed`] ?? 0}
                    allVal={lifetimeStats[`job_${job.id}_completed`] ?? 0}
                  />
                ))}
                {jobs.flatMap((job) =>
                  job.rewards.map((r) => {
                    const res = resources.find((res) => res.id === r.resourceId)
                    const key = `job_${job.id}_${r.resourceId}_earned`
                    return (
                      <StatRow3
                        key={`${job.id}_${r.resourceId}`}
                        label={`${job.icon} ${job.name} — ${res?.name ?? r.resourceId} earned`}
                        thisVal={stats[key] ?? 0}
                        prevVal={prevVentureStats[key] ?? 0}
                        allVal={lifetimeStats[key] ?? 0}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeStatsTab === 'properties' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header fw-semibold">🏗️ Properties</div>
          <div className="card-body p-0">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: '0.8rem' }}>Stat</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>This Run</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>Prev Run</th>
                  <th className="text-end" style={{ fontSize: '0.8rem' }}>All Time</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((b) => (
                  <StatRow3
                    key={`${b.id}_count`}
                    label={`${b.icon} ${b.name} — purchased`}
                    thisVal={stats[`building_${b.id}_count`] ?? 0}
                    prevVal={prevVentureStats[`building_${b.id}_count`] ?? 0}
                    allVal={lifetimeStats[`building_${b.id}_count`] ?? 0}
                  />
                ))}
                {buildings.flatMap((b) =>
                  b.production.map((p) => {
                    const res = resources.find((r) => r.id === p.resourceId)
                    const key = `building_${b.id}_produced_${p.resourceId}`
                    return (
                      <StatRow3
                        key={`${b.id}_${p.resourceId}`}
                        label={`${b.icon} ${b.name} — ${res?.name ?? p.resourceId} produced`}
                        thisVal={stats[key] ?? 0}
                        prevVal={prevVentureStats[key] ?? 0}
                        allVal={lifetimeStats[key] ?? 0}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeStatsTab === 'modifiers' && (() => {
        const activeJobRows = jobs.map((job) => ({
          job,
          minMult: getJobRewardMinMult(job.id, purchasedUpgrades, purchasedSkills),
          maxMult: getJobRewardMaxMult(job.id, purchasedUpgrades, purchasedSkills),
          durMult: getJobDurationMult(job.id, purchasedSkills),
        })).filter((r) => r.minMult !== 1 || r.maxMult !== 1 || r.durMult !== 1)

        const activeBuildingRows = buildings.map((b) => ({
          building: b,
          outputMult: getBuildingOutputMult(b.id, purchasedUpgrades, purchasedSkills),
          costMult: getBuildingCostMult(b.id, purchasedSkills),
        })).filter((r) => r.outputMult !== 1 || r.costMult !== 1)

        const sellMult    = getMarketSellMult(purchasedSkills)
        const buyMult     = getMarketBuyMult(purchasedSkills)
        const ceilMult    = getMarketCeilingMult(purchasedSkills)
        const floorMult   = getMarketFloorMult(purchasedSkills)
        const craftDur    = getCraftDurationMult('all', purchasedSkills, purchasedUpgrades)
        const craftOut    = getCraftOutputMult(purchasedUpgrades)
        const craftSlots  = getCraftWorkerCount(purchasedSkills)
        const freeChance  = getCraftFreeChance(purchasedSkills)
        const dblChance   = getCraftDoubleChance(purchasedSkills)

        return (
          <div className="d-flex flex-column gap-4" style={{ maxWidth: 900 }}>

            {/* Jobs */}
            <div>
              <h5 className="mb-2">⛏️ Job Modifiers</h5>
              {activeJobRows.length === 0 ? (
                <p className="text-body-secondary fst-italic" style={{ fontSize: '0.875rem' }}>
                  No job modifiers active. Buy skills on the Prestige page and upgrades on the Upgrades page.
                </p>
              ) : (
                <div className="card">
                  <div className="card-body p-0">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th style={{ fontSize: '0.8rem' }}>Job</th>
                          <th className="text-end" style={{ fontSize: '0.8rem' }}>Reward Min</th>
                          <th className="text-end" style={{ fontSize: '0.8rem' }}>Reward Max</th>
                          <th className="text-end" style={{ fontSize: '0.8rem' }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeJobRows.map(({ job, minMult, maxMult, durMult }) => (
                          <tr key={job.id}>
                            <td style={{ fontSize: '0.875rem' }}>{job.icon} {job.name}</td>
                            <td className="text-end text-success" style={{ fontSize: '0.875rem' }}>
                              {minMult !== 1 ? bonusFmt(minMult) : <span className="text-body-secondary">—</span>}
                            </td>
                            <td className="text-end text-success" style={{ fontSize: '0.875rem' }}>
                              {maxMult !== 1 ? bonusFmt(maxMult) : <span className="text-body-secondary">—</span>}
                            </td>
                            <td className="text-end text-info" style={{ fontSize: '0.875rem' }}>
                              {durMult !== 1 ? reductionFmt(durMult) : <span className="text-body-secondary">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Buildings */}
            <div>
              <h5 className="mb-2">🏗️ Building Modifiers</h5>
              {activeBuildingRows.length === 0 ? (
                <p className="text-body-secondary fst-italic" style={{ fontSize: '0.875rem' }}>
                  No building modifiers active. Buy upgrades on the Upgrades page and skills on the Prestige page.
                </p>
              ) : (
                <div className="card">
                  <div className="card-body p-0">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th style={{ fontSize: '0.8rem' }}>Building</th>
                          <th className="text-end" style={{ fontSize: '0.8rem' }}>Output</th>
                          <th className="text-end" style={{ fontSize: '0.8rem' }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeBuildingRows.map(({ building, outputMult, costMult }) => (
                          <tr key={building.id}>
                            <td style={{ fontSize: '0.875rem' }}>{building.icon} {building.name}</td>
                            <td className="text-end text-success" style={{ fontSize: '0.875rem' }}>
                              {outputMult !== 1 ? bonusFmt(outputMult) : <span className="text-body-secondary">—</span>}
                            </td>
                            <td className="text-end text-info" style={{ fontSize: '0.875rem' }}>
                              {costMult !== 1 ? reductionFmt(costMult) : <span className="text-body-secondary">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Market */}
            <div>
              <h5 className="mb-2">🏪 Market Modifiers</h5>
              <div className="card">
                <div className="card-body p-0">
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th style={{ fontSize: '0.8rem' }}>Modifier</th>
                        <th className="text-end" style={{ fontSize: '0.8rem' }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Sell Price</td>
                        <td className={`text-end fw-semibold ${sellMult !== 1 ? 'text-success' : ''}`} style={{ fontSize: '0.875rem' }}>
                          {sellMult !== 1 ? bonusFmt(sellMult) : <span className="text-body-secondary">×1.00 (no bonus)</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Buy Price</td>
                        <td className={`text-end fw-semibold ${buyMult !== 1 ? 'text-info' : ''}`} style={{ fontSize: '0.875rem' }}>
                          {buyMult !== 1 ? reductionFmt(buyMult) : <span className="text-body-secondary">×1.00 (no bonus)</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Price Ceiling</td>
                        <td className={`text-end fw-semibold ${ceilMult !== 1 ? 'text-success' : ''}`} style={{ fontSize: '0.875rem' }}>
                          {ceilMult !== 1 ? bonusFmt(ceilMult) : <span className="text-body-secondary">×1.00 (no bonus)</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Price Floor</td>
                        <td className={`text-end fw-semibold ${floorMult !== 1 ? 'text-info' : ''}`} style={{ fontSize: '0.875rem' }}>
                          {floorMult !== 1 ? reductionFmt(floorMult) : <span className="text-body-secondary">×1.00 (no bonus)</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Crafting */}
            <div>
              <h5 className="mb-2">🔨 Crafting Modifiers</h5>
              <div className="card">
                <div className="card-body p-0">
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th style={{ fontSize: '0.8rem' }}>Modifier</th>
                        <th className="text-end" style={{ fontSize: '0.8rem' }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Craft Speed</td>
                        <td className={`text-end fw-semibold ${craftDur !== 1 ? 'text-info' : ''}`} style={{ fontSize: '0.875rem' }}>
                          {craftDur !== 1 ? reductionFmt(craftDur) : <span className="text-body-secondary">×1.00 (no bonus)</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Output Bonus</td>
                        <td className={`text-end fw-semibold ${craftOut !== 1 ? 'text-success' : ''}`} style={{ fontSize: '0.875rem' }}>
                          {craftOut !== 1 ? bonusFmt(craftOut) : <span className="text-body-secondary">×1.00 (no bonus)</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Craft Slots</td>
                        <td className={`text-end fw-semibold ${craftSlots > 1 ? 'text-success' : ''}`} style={{ fontSize: '0.875rem' }}>
                          {craftSlots}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Free Craft Chance</td>
                        <td className={`text-end fw-semibold ${freeChance > 0 ? 'text-success' : ''}`} style={{ fontSize: '0.875rem' }}>
                          {freeChance > 0 ? `${(freeChance * 100).toFixed(0)}%` : <span className="text-body-secondary">0% (no bonus)</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-body-secondary" style={{ fontSize: '0.875rem' }}>Double Output Chance</td>
                        <td className={`text-end fw-semibold ${dblChance > 0 ? 'text-success' : ''}`} style={{ fontSize: '0.875rem' }}>
                          {dblChance > 0 ? `${(dblChance * 100).toFixed(0)}%` : <span className="text-body-secondary">0% (no bonus)</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )
      })()}

      {activeStatsTab === 'crafting' && (
        <div className="d-flex flex-column gap-4">
          <div className="card" style={{ maxWidth: 640 }}>
            <div className="card-header fw-semibold">🔨 Recipe Completions</div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th style={{ fontSize: '0.8rem' }}>Stat</th>
                    <th className="text-end" style={{ fontSize: '0.8rem' }}>This Run</th>
                    <th className="text-end" style={{ fontSize: '0.8rem' }}>Prev Run</th>
                    <th className="text-end" style={{ fontSize: '0.8rem' }}>All Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.map((recipe) => (
                    <StatRow3
                      key={`${recipe.id}_comp`}
                      label={`${recipe.icon} ${recipe.name} — completions`}
                      thisVal={stats[`craft_${recipe.id}_completed`] ?? 0}
                      prevVal={prevVentureStats[`craft_${recipe.id}_completed`] ?? 0}
                      allVal={lifetimeStats[`craft_${recipe.id}_completed`] ?? 0}
                    />
                  ))}
                  {recipes.flatMap((recipe) =>
                    recipe.outputs.map((out) => {
                      const res = resources.find((r) => r.id === out.resourceId)
                      const key = `craft_${recipe.id}_${out.resourceId}_produced`
                      return (
                        <StatRow3
                          key={`${recipe.id}_${out.resourceId}_prod`}
                          label={`${recipe.icon} ${recipe.name} — ${res?.name ?? out.resourceId} produced`}
                          thisVal={stats[key] ?? 0}
                          prevVal={prevVentureStats[key] ?? 0}
                          allVal={lifetimeStats[key] ?? 0}
                        />
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
