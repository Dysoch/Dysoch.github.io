export type ThemeType = 'light' | 'dark'
export type TabType =
  | 'manual-labor'
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

export interface Job {
  id: string
  name: string
  description: string
  icon: string
  category: string
  durationSeconds: number
  rewards: JobReward[]
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
