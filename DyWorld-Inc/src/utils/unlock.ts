import type { UnlockCondition } from '../types'

interface UnlockState {
  stats: Record<string, number>
  lifetimeStats: Record<string, number>
  purchasedSkills: Record<string, number>
  purchasedUpgrades: Record<string, number>
  prestigeCount: number
}

export function isUnlocked(cond: UnlockCondition | undefined, state: UnlockState): boolean {
  if (!cond || cond.type === 'always') return true
  switch (cond.type) {
    case 'stat':          return (state.stats[cond.key] ?? 0) >= cond.amount
    case 'life_stat':     return (state.lifetimeStats[cond.key] ?? 0) >= cond.amount
    case 'skill':         return (state.purchasedSkills[cond.skillId] ?? 0) >= cond.level
    case 'upgrade':       return (state.purchasedUpgrades[cond.upgradeId] ?? 0) >= cond.level
    case 'prestige':      return state.prestigeCount >= cond.count
  }
}