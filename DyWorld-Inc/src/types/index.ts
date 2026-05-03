export type ThemeType = 'light' | 'dark'
export type NumberFormatType = 'engineering' | 'scientific' | 'normal'
export type TabType =
  | 'manual-labor'
  | 'properties'
  | 'statistics'
  | 'market'
  | 'bank'
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
