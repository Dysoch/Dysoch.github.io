import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatNumber, formatDuration } from '../utils/format'
import { isUnlocked } from '../utils/unlock'
import recipesData from '../content/recipes.json'
import resourcesData from '../content/resources.json'
import type { Recipe, Resource } from '../types'
import {
  getCraftWorkerCount,
  getCraftDurationMult,
  getCraftFreeChance,
  getCraftDoubleChance,
  getCraftOutputMult,
} from '../utils/multipliers'

const allRecipes = recipesData as Recipe[]
const resources = resourcesData as Resource[]
const resourceMap = Object.fromEntries(resources.map((r) => [r.id, r]))

function ProgressBar({ startTime, endTime }: { startTime: number; endTime: number }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100)
    return () => clearInterval(id)
  }, [])

  const now = Date.now()
  const total = endTime - startTime
  const elapsed = Math.min(now - startTime, total)
  const pct = total > 0 ? (elapsed / total) * 100 : 100
  const remaining = Math.max(0, (endTime - now) / 1000)

  return (
    <div>
      <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem' }}>
        <span className="text-body-secondary">Crafting…</span>
        <span className="text-body-secondary">{formatDuration(remaining)}</span>
      </div>
      <div className="progress" style={{ height: 6 }}>
        <div
          className="progress-bar bg-warning"
          style={{ width: `${pct}%`, transition: 'width 0.1s linear' }}
        />
      </div>
    </div>
  )
}

export default function Crafting() {
  const {
    resources: balances,
    activeCrafts,
    craftQueue,
    purchasedSkills,
    purchasedUpgrades,
    removeCraftFromQueue,
    clearCraftQueue,
    cancelActiveCraft, 
    stats, 
    lifetimeStats,
    prestigeCount,
  } = useGameStore()

  const unlockState = { stats, lifetimeStats, purchasedSkills, purchasedUpgrades, prestigeCount }
  const recipes = allRecipes.filter((r) => isUnlocked(r.unlock, unlockState))

  const maxWorkers = getCraftWorkerCount(purchasedSkills)
  const freeChance = getCraftFreeChance(purchasedSkills)
  const doubleChance = getCraftDoubleChance(purchasedSkills)
  const outputMult = getCraftOutputMult(purchasedUpgrades)

  function maxAffordable(recipe: Recipe): number {
    if (recipe.inputs.length === 0) return 99
    return Math.floor(
      Math.min(...recipe.inputs.map((inp) => (balances[inp.resourceId] ?? 0) / inp.amount))
    )
  }

  function addN(recipeId: string, n: number) {
    for (let i = 0; i < n; i++) {
      useGameStore.getState().addToCraftQueue(recipeId)
    }
  }

  function effectiveDuration(recipe: Recipe): number {
    return recipe.durationSeconds * getCraftDurationMult(recipe.id, purchasedSkills, purchasedUpgrades)
  }

  function effectiveOutput(recipe: Recipe): Array<{ resourceId: string; amount: number }> {
    return recipe.outputs.map((o) => ({
      resourceId: o.resourceId,
      amount: Math.max(1, Math.round(o.amount * outputMult)),
    }))
  }

  const slots = Array.from({ length: maxWorkers }, (_, i) =>
    activeCrafts.find((c) => c.slotIndex === i) ?? null
  )

  return (
    <div className="p-4">
      <h2>🔨 Crafting</h2>
      <p className="text-body-secondary mb-3">
        Convert raw materials into refined goods. Crafted items can be sold at the Market.
      </p>

      <div className="row g-4">

        {/* ── Left panel: Workbenches + Queue ── */}
        <div className="col-12 col-lg-4">

          <h6 className="text-body-secondary text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            Workbenches ({activeCrafts.length}/{maxWorkers} active)
          </h6>

          <div className="d-flex flex-column gap-2 mb-3">
            {slots.map((craft, idx) => {
              const recipe = craft ? allRecipes.find((r) => r.id === craft.recipeId) : null
              return (
                <div key={idx} className={`card ${craft ? 'border-warning' : ''}`}>
                  <div className="card-body py-2 px-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>
                        Workbench {idx + 1}
                      </span>
                      {craft && (
                        <button
                          className="btn btn-sm btn-outline-danger py-0 px-1"
                          style={{ fontSize: '0.7rem' }}
                          onClick={() => cancelActiveCraft(craft.id)}
                          title="Cancel and refund inputs"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {craft && recipe ? (
                      <>
                        <div className="d-flex align-items-center gap-1 mb-2">
                          <span style={{ fontSize: '1rem' }}>{recipe.icon}</span>
                          <span style={{ fontSize: '0.85rem' }}>{recipe.name}</span>
                        </div>
                        <ProgressBar startTime={craft.startTime} endTime={craft.endTime} />
                      </>
                    ) : (
                      <div className="text-body-secondary" style={{ fontSize: '0.8rem' }}>Idle</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="text-body-secondary text-uppercase mb-0" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
              Queue ({craftQueue.length})
            </h6>
            {craftQueue.length > 0 && (
              <button
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                style={{ fontSize: '0.7rem' }}
                onClick={clearCraftQueue}
              >
                Clear All
              </button>
            )}
          </div>

          {craftQueue.length === 0 ? (
            <div
              className="text-body-secondary text-center py-3 rounded"
              style={{ fontSize: '0.8rem', border: '1px dashed var(--bs-border-color)' }}
            >
              Queue empty
            </div>
          ) : (
            <div
              className="list-group"
              style={{ maxHeight: 400, overflowY: 'auto' }}
            >
              {craftQueue.map((recipeId, idx) => {
                const r = allRecipes.find((rec) => rec.id === recipeId)
                return (
                  <div
                    key={idx}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-1 px-3"
                  >
                    <span style={{ fontSize: '0.82rem' }}>
                      {idx + 1}. {r?.icon} {r?.name ?? recipeId}
                    </span>
                    <button
                      className="btn btn-sm btn-link text-danger py-0"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => removeCraftFromQueue(idx)}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Active bonuses */}
          {(freeChance > 0 || doubleChance > 0 || outputMult > 1) && (
            <div className="mt-3 p-2 rounded" style={{ fontSize: '0.75rem', border: '1px solid var(--bs-info-border-subtle)', background: 'var(--bs-info-bg-subtle)' }}>
              <div className="fw-semibold mb-1 text-info-emphasis">Active bonuses</div>
              {freeChance > 0 && <div>🎲 Free craft: {(freeChance * 100).toFixed(0)}%</div>}
              {doubleChance > 0 && <div>✨ Double output: {(doubleChance * 100).toFixed(0)}%</div>}
              {outputMult > 1 && <div>📦 Output ×{outputMult.toFixed(2)}</div>}
            </div>
          )}
        </div>

        {/* ── Right panel: Recipes ── */}
        <div className="col-12 col-lg-8">

          <h6 className="text-body-secondary text-uppercase mb-3" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            Recipes
          </h6>

          <div className="row g-3">
            {recipes.map((recipe) => {
              const max = maxAffordable(recipe)
              const canCraft = max >= 1
              const duration = effectiveDuration(recipe)
              const outputs = effectiveOutput(recipe)

              return (
                <div className="col-12 col-xl-6" key={recipe.id}>
                  <div className={`card h-100 ${canCraft ? 'border-success' : ''}`}>
                    <div className="card-body pb-2">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ fontSize: '1.5rem' }}>{recipe.icon}</span>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: '0.95rem' }}>{recipe.name}</div>
                          <div className="text-body-secondary" style={{ fontSize: '0.72rem' }}>
                            {recipe.description}
                          </div>
                        </div>
                      </div>

                      <div className="row g-2 mb-2" style={{ fontSize: '0.8rem' }}>
                        <div className="col-6">
                          <div className="text-body-secondary mb-1">Inputs</div>
                          {recipe.inputs.map((inp) => {
                            const res = resourceMap[inp.resourceId]
                            const have = balances[inp.resourceId] ?? 0
                            const enough = have >= inp.amount
                            return (
                              <div key={inp.resourceId} className={enough ? 'text-success' : 'text-danger'}>
                                {res?.icon} {formatNumber(have)} / {formatNumber(inp.amount)} {res?.name}
                              </div>
                            )
                          })}
                        </div>
                        <div className="col-6">
                          <div className="text-body-secondary mb-1">Output</div>
                          {outputs.map((out) => {
                            const res = resourceMap[out.resourceId]
                            return (
                              <div key={out.resourceId}>
                                {res?.icon} {formatNumber(out.amount)} {res?.name}
                              </div>
                            )
                          })}
                          <div className="text-body-secondary mt-1">
                            ⏱ {formatDuration(duration)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer p-2">
                      <div className="btn-group w-100">
                        <button
                          className="btn btn-sm btn-success"
                          disabled={!canCraft}
                          onClick={() => addN(recipe.id, 1)}
                        >
                          Craft
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          disabled={!canCraft}
                          onClick={() => addN(recipe.id, Math.min(5, max))}
                        >
                          ×5
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          disabled={!canCraft}
                          onClick={() => addN(recipe.id, Math.min(10, max))}
                        >
                          ×10
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          disabled={!canCraft}
                          onClick={() => addN(recipe.id, max)}
                          title={`Queue ${max} crafts`}
                        >
                          Max ({formatNumber(max)})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
