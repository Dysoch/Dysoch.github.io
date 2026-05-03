export type ThemeType = 'light' | 'dark'
export type NumberFormatType = 'engineering' | 'scientific' | 'normal'
export type TabType =
  | 'manual-labor'
  | 'properties'
  | 'upgrades'
  | 'statistics'
  | 'market'
  | 'bank'
  | 'prestige'
  | 'settings'
  | 'about'

export interface ChangelogEntry {
  version: string
  date: string
  added: string[]
  changed: string[]
  fixed: string[]
  removed: string[]
}

export interface Resource {
  id: string
  name: string
  nameSingular: string
  icon: string
  description: string
  category: string
  tier: number
}

export interface JobReward {
  resourceId: string
  min: number
  max: number
}

export interface JobCost {
  resourceId: string
  amount: number
}

export interface Job {
  id: string
  name: string
  description: string
  icon: string
  category: string
  durationSeconds: number
  rewards: JobReward[]
  costs?: JobCost[]
}

export interface ExchangeRate {
  fromId: string
  toId: string
  rate: number
}

export interface ActiveJob {
  jobId: string
  startTime: number
  endTime: number
}

export interface BuildingCost {
  resourceId: string
  amount: number
}

export interface BuildingProduction {
  resourceId: string
  amountPerSecond: number
}

export interface Building {
  id: string
  name: string
  icon: string
  description: string
  baseCost: BuildingCost[]
  costMultiplier: number
  production: BuildingProduction[]
}

export interface MarketItem {
  resourceId: string
  basePrice: number
  minPrice: number
  maxPrice: number
}

export type PriceTrend = 'up' | 'down' | 'same'

export interface SkillDef {
  id: string
  tree: string
  treeLabel: string
  name: string
  description: string
  maxLevel: number
  costs: number[]
  effect: string
  magnitude: number
  target: string
}

export interface PrestigeInsightWeight {
  resourceId: string
  weight: number
}

export interface PrestigeConfig {
  requirement: { resourceId: string; amount: number }
  insightWeights: PrestigeInsightWeight[]
}

export interface UpgradeDef {
  id: string
  category: string
  name: string
  description: string
  target: string
  effect: string
  magnitude: number
  maxLevel: number
  costsPerLevel: Array<Array<{ resourceId: string; amount: number }>>
}
