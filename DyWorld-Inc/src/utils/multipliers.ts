import skillsData from '../content/skills.json'
import upgradesData from '../content/upgrades.json'
import type { SkillDef, UpgradeDef } from '../types'

const skills = skillsData as SkillDef[]
const upgrades = upgradesData as UpgradeDef[]

// Exact-match stack: Math.pow(magnitude, level) for each skill matching effect + target.
// Uses exact string comparison — 'all' only matches skills where s.target === 'all'.
function skillMult(
  effect: string,
  target: string,
  purchasedSkills: Record<string, number>
): number {
  let result = 1
  for (const s of skills) {
    if (s.effect !== effect || s.target !== target) continue
    const level = purchasedSkills[s.id] ?? 0
    if (level > 0) result *= Math.pow(s.magnitude, level)
  }
  return result
}

function upgradeMult(
  effect: string,
  target: string,
  purchasedUpgrades: Record<string, number>
): number {
  let result = 1
  for (const u of upgrades) {
    if (u.effect !== effect || u.target !== target) continue
    const level = purchasedUpgrades[u.id] ?? 0
    if (level > 0) result *= Math.pow(u.magnitude, level)
  }
  return result
}

// --- Public API ---

export function getJobRewardMinMult(
  jobId: string,
  _purchasedUpgrades: Record<string, number>,
  purchasedSkills: Record<string, number>
): number {
  // Skills only for min — 'all' target and per-job target both apply
  return skillMult('job_reward_min_mult', 'all', purchasedSkills) *
         skillMult('job_reward_min_mult', jobId, purchasedSkills)
}

export function getJobRewardMaxMult(
  jobId: string,
  purchasedUpgrades: Record<string, number>,
  purchasedSkills: Record<string, number>
): number {
  const fromSkills =
    skillMult('job_reward_max_mult', 'all', purchasedSkills) *
    skillMult('job_reward_max_mult', jobId, purchasedSkills)
  const fromUpgrades = upgradeMult('job_reward_max_mult', jobId, purchasedUpgrades)
  return fromSkills * fromUpgrades
}

// Returns a multiplier < 1 for faster jobs (e.g. 0.9 = 10% faster).
// General ('all') and per-job stacks are multiplied together.
export function getJobDurationMult(
  jobId: string,
  purchasedSkills: Record<string, number>
): number {
  const general = skillMult('job_speed_mult', 'all', purchasedSkills)
  const specific = skillMult('job_speed_mult', jobId, purchasedSkills)
  return general * specific
}

export function getBuildingOutputMult(
  buildingId: string,
  purchasedUpgrades: Record<string, number>,
  purchasedSkills: Record<string, number>
): number {
  const fromSkills = skillMult('building_output_mult', buildingId, purchasedSkills)
  const fromUpgrades = upgradeMult('building_output_mult', buildingId, purchasedUpgrades)
  return fromSkills * fromUpgrades
}

// Returns a multiplier < 1 for cheaper buildings.
export function getBuildingCostMult(
  buildingId: string,
  purchasedSkills: Record<string, number>
): number {
  return skillMult('building_cost_mult', buildingId, purchasedSkills)
}

export function getMarketCeilingMult(purchasedSkills: Record<string, number>): number {
  return skillMult('market_price_ceiling_mult', 'all', purchasedSkills)
}

export function getMarketFloorMult(purchasedSkills: Record<string, number>): number {
  return skillMult('market_price_floor_mult', 'all', purchasedSkills)
}

// Returns multiplier > 1 for higher sell revenue.
export function getMarketSellMult(purchasedSkills: Record<string, number>): number {
  return skillMult('market_sell_mult', 'all', purchasedSkills)
}

// Returns multiplier < 1 for cheaper buy cost.
export function getMarketBuyMult(purchasedSkills: Record<string, number>): number {
  return skillMult('market_buy_mult', 'all', purchasedSkills)
}

// Flat (not multiplicative): returns magnitude * level for the queue skill.
export function getMaxQueueSize(purchasedSkills: Record<string, number>): number {
  const queueSkill = skills.find((s) => s.effect === 'job_queue_size')
  if (!queueSkill) return 0
  const level = purchasedSkills[queueSkill.id] ?? 0
  return queueSkill.magnitude * level
}

// --- Crafting multipliers ---

// Returns duration multiplier < 1 for faster crafting.
export function getCraftDurationMult(
  recipeId: string,
  purchasedSkills: Record<string, number>,
  purchasedUpgrades: Record<string, number>
): number {
  return skillMult('craft_speed_mult', 'all', purchasedSkills) *
         skillMult('craft_speed_mult', recipeId, purchasedSkills) *
         upgradeMult('craft_speed_mult', 'all', purchasedUpgrades)
}

// Returns output multiplier > 1 (applied to output amounts, then rounded).
export function getCraftOutputMult(purchasedUpgrades: Record<string, number>): number {
  return upgradeMult('craft_output_mult', 'all', purchasedUpgrades)
}

// Returns number of simultaneous craft slots (base 1 + skill bonus).
export function getCraftWorkerCount(purchasedSkills: Record<string, number>): number {
  const workerSkill = skills.find((s) => s.effect === 'craft_worker_count')
  if (!workerSkill) return 1
  const level = purchasedSkills[workerSkill.id] ?? 0
  return 1 + workerSkill.magnitude * level
}

// Returns probability (0–0.95) that inputs are not consumed on craft.
export function getCraftFreeChance(purchasedSkills: Record<string, number>): number {
  let total = 0
  for (const s of skills) {
    if (s.effect !== 'craft_free_chance') continue
    total += s.magnitude * (purchasedSkills[s.id] ?? 0)
  }
  return Math.min(total, 0.95)
}

// Returns probability (0–0.95) that output is doubled on craft.
export function getCraftDoubleChance(purchasedSkills: Record<string, number>): number {
  let total = 0
  for (const s of skills) {
    if (s.effect !== 'craft_double_chance') continue
    total += s.magnitude * (purchasedSkills[s.id] ?? 0)
  }
  return Math.min(total, 0.95)
}
