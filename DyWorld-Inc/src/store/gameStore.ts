import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEY } from '../constants'
import type {
  TabType, ThemeType, ActiveJob, NumberFormatType,
  Building, JobCost, MarketItem, PriceTrend, SkillDef, UpgradeDef, Job, PrestigeConfig,
} from '../types'
import resourcesData from '../content/resources.json'
import buildingsData from '../content/buildings.json'
import marketItemsData from '../content/market_items.json'
import skillsData from '../content/skills.json'
import upgradesData from '../content/upgrades.json'
import jobsData from '../content/jobs.json'
import prestigeConfigData from '../content/prestige_config.json'
import {
  getBuildingOutputMult,
  getBuildingCostMult,
  getMarketCeilingMult,
  getMarketFloorMult,
  getMarketSellMult,
  getMarketBuyMult,
  getMaxQueueSize,
  getJobDurationMult,
} from '../utils/multipliers'

const initialResources = Object.fromEntries(resourcesData.map((r) => [r.id, 0]))
const initialBuildings = Object.fromEntries(buildingsData.map((b) => [b.id, 0]))
const initialMarketPrices = Object.fromEntries((marketItemsData as MarketItem[]).map((m) => [m.resourceId, m.basePrice]))
const initialMarketTrends: Record<string, PriceTrend> = Object.fromEntries(
  (marketItemsData as MarketItem[]).map((m) => [m.resourceId, 'same' as PriceTrend])
)

// Pure helper: adds delta to both current-venture stats and lifetime stats atomically.
function addStats(
  current: Record<string, number>,
  lifetime: Record<string, number>,
  delta: Record<string, number>
): { stats: Record<string, number>; lifetimeStats: Record<string, number> } {
  const newCurrent = { ...current }
  const newLifetime = { ...lifetime }
  for (const [key, amount] of Object.entries(delta)) {
    newCurrent[key] = (newCurrent[key] ?? 0) + amount
    newLifetime[key] = (newLifetime[key] ?? 0) + amount
  }
  return { stats: newCurrent, lifetimeStats: newLifetime }
}

interface GameStore {
  // UI
  theme: ThemeType
  activeTab: TabType
  numberFormat: NumberFormatType

  // Game data
  resources: Record<string, number>
  stats: Record<string, number>
  activeJob: ActiveJob | null
  buildings: Record<string, number>
  lastPassiveTick: number

  // Market
  marketPrices: Record<string, number>
  marketPriceTrend: Record<string, PriceTrend>
  lastMarketTick: number

  // Prestige
  prestigeCount: number
  insight: number
  purchasedSkills: Record<string, number>
  purchasedUpgrades: Record<string, number>
  jobQueue: string[]
  lifetimeStats: Record<string, number>
  prevVentureStats: Record<string, number>

  // UI actions
  setTheme: (theme: ThemeType) => void
  setActiveTab: (tab: TabType) => void
  setNumberFormat: (format: NumberFormatType) => void

  // Resource actions
  addResource: (id: string, amount: number) => void
  spendResource: (id: string, amount: number) => boolean

  // Stats
  incrementStat: (key: string, amount?: number) => void

  // Job actions
  startJob: (jobId: string, durationSeconds: number, costs?: JobCost[]) => void
  completeJob: (jobId: string, rewards: Array<{ resourceId: string; amount: number }>) => void
  cancelJob: () => void

  // Building actions
  buyBuilding: (id: string) => boolean
  tickPassiveIncome: (deltaMs: number) => void

  // Market actions
  tickMarket: () => void
  buyMarketResource: (resourceId: string, quantity: number) => boolean
  sellMarketResource: (resourceId: string, quantity: number) => boolean

  // Exchange
  exchange: (fromId: string, toId: string, rate: number, count: number) => void

  // Prestige actions
  prestige: () => void
  buySkill: (skillId: string) => boolean
  buyUpgrade: (upgradeId: string) => boolean
  addToQueue: (jobId: string) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void

  // Save / meta
  exportSave: () => string
  importSave: (encoded: string) => boolean
  resetGame: () => void
}

const DEFAULT_STATE = {
  theme: 'dark' as ThemeType,
  activeTab: 'manual-labor' as TabType,
  numberFormat: 'engineering' as NumberFormatType,
  resources: { ...initialResources },
  stats: {} as Record<string, number>,
  activeJob: null as ActiveJob | null,
  buildings: { ...initialBuildings },
  lastPassiveTick: Date.now(),
  marketPrices: { ...initialMarketPrices },
  marketPriceTrend: { ...initialMarketTrends },
  lastMarketTick: Date.now() - 30000,
  prestigeCount: 0,
  insight: 0,
  purchasedSkills: {} as Record<string, number>,
  purchasedUpgrades: {} as Record<string, number>,
  jobQueue: [] as string[],
  lifetimeStats: {} as Record<string, number>,
  prevVentureStats: {} as Record<string, number>,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setTheme: (theme) => set({ theme }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setNumberFormat: (format) => set({ numberFormat: format }),

      addResource: (id, amount) =>
        set((s) => ({
          resources: { ...s.resources, [id]: (s.resources[id] ?? 0) + amount },
        })),

      spendResource: (id, amount) => {
        const state = get()
        if ((state.resources[id] ?? 0) < amount) return false
        set((s) => ({
          resources: { ...s.resources, [id]: (s.resources[id] ?? 0) - amount },
        }))
        return true
      },

      incrementStat: (key, amount = 1) => {
        const state = get()
        const { stats, lifetimeStats } = addStats(state.stats, state.lifetimeStats, { [key]: amount })
        set({ stats, lifetimeStats })
      },

      startJob: (jobId, durationSeconds, costs?) => {
        const state = get()
        if (costs?.length) {
          for (const cost of costs) {
            if ((state.resources[cost.resourceId] ?? 0) < cost.amount) return
          }
          const updatedResources = { ...state.resources }
          const costDelta: Record<string, number> = {}
          for (const cost of costs) {
            updatedResources[cost.resourceId] = (updatedResources[cost.resourceId] ?? 0) - cost.amount
            costDelta[`${cost.resourceId}_spent`] = (costDelta[`${cost.resourceId}_spent`] ?? 0) + cost.amount
          }
          const { stats, lifetimeStats } = addStats(state.stats, state.lifetimeStats, costDelta)
          const now = Date.now()
          set({
            resources: updatedResources,
            stats,
            lifetimeStats,
            activeJob: { jobId, startTime: now, endTime: now + durationSeconds * 1000 },
          })
        } else {
          const now = Date.now()
          set({
            activeJob: { jobId, startTime: now, endTime: now + durationSeconds * 1000 },
          })
        }
      },

      completeJob: (jobId, rewards) => {
        const state = get()
        const delta: Record<string, number> = { [`job_${jobId}_completed`]: 1 }
        for (const { resourceId, amount } of rewards) {
          delta[`job_${jobId}_${resourceId}_earned`] = (delta[`job_${jobId}_${resourceId}_earned`] ?? 0) + amount
          delta[`${resourceId}_earned`] = (delta[`${resourceId}_earned`] ?? 0) + amount
        }
        const { stats: s1, lifetimeStats: l1 } = addStats(state.stats, state.lifetimeStats, delta)

        let newResources = { ...state.resources }
        for (const { resourceId, amount } of rewards) {
          newResources[resourceId] = (newResources[resourceId] ?? 0) + amount
        }
        let stats = { ...s1 }
        let lifetimeStats = { ...l1 }
        let newActiveJob: ActiveJob | null = null
        const newQueue = [...state.jobQueue]

        // Auto-start next queued job
        if (newQueue.length > 0) {
          const nextJobId = newQueue[0]
          const jobDef = (jobsData as Job[]).find((j) => j.id === nextJobId)
          if (jobDef) {
            let canAfford = true
            if (jobDef.costs?.length) {
              for (const cost of jobDef.costs) {
                if ((newResources[cost.resourceId] ?? 0) < cost.amount) { canAfford = false; break }
              }
            }
            if (canAfford) {
              if (jobDef.costs?.length) {
                const costDelta: Record<string, number> = {}
                for (const cost of jobDef.costs) {
                  newResources[cost.resourceId] = (newResources[cost.resourceId] ?? 0) - cost.amount
                  costDelta[`${cost.resourceId}_spent`] = (costDelta[`${cost.resourceId}_spent`] ?? 0) + cost.amount
                }
                const result = addStats(stats, lifetimeStats, costDelta)
                stats = result.stats
                lifetimeStats = result.lifetimeStats
              }
              const durMult = getJobDurationMult(nextJobId, state.purchasedSkills)
              const effectiveMs = jobDef.durationSeconds * durMult * 1000
              const now = Date.now()
              newActiveJob = { jobId: nextJobId, startTime: now, endTime: now + effectiveMs }
              newQueue.shift()
            } else {
              newQueue.shift() // drop unaffordable job from queue
            }
          } else {
            newQueue.shift() // unknown job — drop it
          }
        }

        set({ activeJob: newActiveJob, resources: newResources, stats, lifetimeStats, jobQueue: newQueue })
      },

      cancelJob: () => set({ activeJob: null }),

      buyBuilding: (id) => {
        const state = get()
        const def = (buildingsData as Building[]).find((b) => b.id === id)
        if (!def) return false
        const owned = state.buildings[id] ?? 0
        const costMult = getBuildingCostMult(id, state.purchasedSkills)
        const currentCosts = def.baseCost.map((c) => ({
          resourceId: c.resourceId,
          amount: Math.floor(c.amount * Math.pow(def.costMultiplier, owned) * costMult),
        }))
        for (const cost of currentCosts) {
          if ((state.resources[cost.resourceId] ?? 0) < cost.amount) return false
        }
        const updatedResources = { ...state.resources }
        const costDelta: Record<string, number> = { [`building_${id}_count`]: 1 }
        for (const cost of currentCosts) {
          updatedResources[cost.resourceId] = (updatedResources[cost.resourceId] ?? 0) - cost.amount
          costDelta[`${cost.resourceId}_spent`] = (costDelta[`${cost.resourceId}_spent`] ?? 0) + cost.amount
        }
        const { stats, lifetimeStats } = addStats(state.stats, state.lifetimeStats, costDelta)
        set({
          resources: updatedResources,
          buildings: { ...state.buildings, [id]: owned + 1 },
          stats,
          lifetimeStats,
        })
        return true
      },

      tickPassiveIncome: (deltaMs) => {
        const state = get()
        const updatedResources = { ...state.resources }
        const delta: Record<string, number> = {}
        const deltaSeconds = deltaMs / 1000
        for (const building of buildingsData as Building[]) {
          const owned = state.buildings[building.id] ?? 0
          if (owned === 0) continue
          const outputMult = getBuildingOutputMult(building.id, state.purchasedUpgrades, state.purchasedSkills)
          for (const prod of building.production) {
            const amount = prod.amountPerSecond * owned * deltaSeconds * outputMult
            updatedResources[prod.resourceId] = (updatedResources[prod.resourceId] ?? 0) + amount
            delta[`building_${building.id}_produced_${prod.resourceId}`] =
              (delta[`building_${building.id}_produced_${prod.resourceId}`] ?? 0) + amount
            delta[`${prod.resourceId}_earned`] = (delta[`${prod.resourceId}_earned`] ?? 0) + amount
          }
        }
        const { stats, lifetimeStats } = addStats(state.stats, state.lifetimeStats, delta)
        set({ resources: updatedResources, stats, lifetimeStats, lastPassiveTick: Date.now() })
      },

      tickMarket: () => {
        const state = get()
        const ceilingMult = getMarketCeilingMult(state.purchasedSkills)
        const floorMult = getMarketFloorMult(state.purchasedSkills)
        const newPrices: Record<string, number> = {}
        const newTrends: Record<string, PriceTrend> = {}
        for (const item of marketItemsData as MarketItem[]) {
          const effectiveMin = item.minPrice * floorMult
          const effectiveMax = item.maxPrice * ceilingMult
          const current = state.marketPrices[item.resourceId] ?? item.basePrice
          const change = (Math.random() * 0.30 - 0.15) * item.basePrice
          const raw = Math.max(effectiveMin, Math.min(effectiveMax, current + change))
          const newPrice = Math.round(raw * 100) / 100
          newPrices[item.resourceId] = newPrice
          newTrends[item.resourceId] = newPrice > current ? 'up' : newPrice < current ? 'down' : 'same'
        }
        set({
          marketPrices: { ...state.marketPrices, ...newPrices },
          marketPriceTrend: { ...state.marketPriceTrend, ...newTrends },
          lastMarketTick: Date.now(),
        })
      },

      buyMarketResource: (resourceId, quantity) => {
        if (quantity <= 0) return false
        const state = get()
        const basePrice = state.marketPrices[resourceId]
        if (basePrice == null) return false
        const buyMult = getMarketBuyMult(state.purchasedSkills)
        const effectivePrice = basePrice * buyMult
        const totalCost = effectivePrice * quantity
        if ((state.resources['copper_coins'] ?? 0) < totalCost) return false
        const delta = {
          copper_coins_spent: totalCost,
          [`${resourceId}_earned`]: quantity,
        }
        const { stats, lifetimeStats } = addStats(state.stats, state.lifetimeStats, delta)
        set((s) => ({
          resources: {
            ...s.resources,
            copper_coins: (s.resources['copper_coins'] ?? 0) - totalCost,
            [resourceId]: (s.resources[resourceId] ?? 0) + quantity,
          },
          stats,
          lifetimeStats,
        }))
        return true
      },

      sellMarketResource: (resourceId, quantity) => {
        if (quantity <= 0) return false
        const state = get()
        if ((state.resources[resourceId] ?? 0) < quantity) return false
        const basePrice = state.marketPrices[resourceId]
        if (basePrice == null) return false
        const sellMult = getMarketSellMult(state.purchasedSkills)
        const totalRevenue = basePrice * sellMult * quantity
        const delta = {
          [`${resourceId}_spent`]: quantity,
          copper_coins_earned: totalRevenue,
        }
        const { stats, lifetimeStats } = addStats(state.stats, state.lifetimeStats, delta)
        set((s) => ({
          resources: {
            ...s.resources,
            [resourceId]: (s.resources[resourceId] ?? 0) - quantity,
            copper_coins: (s.resources['copper_coins'] ?? 0) + totalRevenue,
          },
          stats,
          lifetimeStats,
        }))
        return true
      },

      exchange: (fromId, toId, rate, count) => {
        const state = get()
        const available = state.resources[fromId] ?? 0
        const cost = rate * count
        if (available < cost) return
        const delta = {
          [`${fromId}_spent`]: cost,
          [`${toId}_earned`]: count,
        }
        const { stats, lifetimeStats } = addStats(state.stats, state.lifetimeStats, delta)
        set({
          resources: {
            ...state.resources,
            [fromId]: available - cost,
            [toId]: (state.resources[toId] ?? 0) + count,
          },
          stats,
          lifetimeStats,
        })
      },

      prestige: () => {
        const state = get()
        const cfg = prestigeConfigData as PrestigeConfig
        const req = cfg.requirement
        if ((state.resources[req.resourceId] ?? 0) < req.amount) return

        // Compute venture score: sum of capital earned * insight weight
        let score = 0
        for (const { resourceId, weight } of cfg.insightWeights) {
          score += (state.stats[`${resourceId}_earned`] ?? 0) * weight
        }
        const insightEarned = Math.max(1, Math.floor(Math.log2(score + 1)))
        set({
          prestigeCount: state.prestigeCount + 1,
          insight: state.insight + insightEarned,
          prevVentureStats: { ...state.stats },
          // Keep: purchasedSkills, lifetimeStats, theme, numberFormat
          // Reset:
          resources: { ...initialResources },
          stats: {},
          activeJob: null,
          jobQueue: [],
          buildings: { ...initialBuildings },
          purchasedUpgrades: {},
          marketPrices: { ...initialMarketPrices },
          marketPriceTrend: { ...initialMarketTrends },
          lastPassiveTick: Date.now(),
          lastMarketTick: Date.now() - 30000,
        })
      },

      buySkill: (skillId) => {
        const state = get()
        const def = (skillsData as SkillDef[]).find((s) => s.id === skillId)
        if (!def) return false
        const currentLevel = state.purchasedSkills[skillId] ?? 0
        if (currentLevel >= def.maxLevel) return false
        const cost = def.costs[currentLevel]
        if ((state.insight ?? 0) < cost) return false
        set({
          insight: state.insight - cost,
          purchasedSkills: { ...state.purchasedSkills, [skillId]: currentLevel + 1 },
        })
        return true
      },

      buyUpgrade: (upgradeId) => {
        const state = get()
        const def = (upgradesData as UpgradeDef[]).find((u) => u.id === upgradeId)
        if (!def) return false
        const currentLevel = state.purchasedUpgrades[upgradeId] ?? 0
        if (currentLevel >= def.maxLevel) return false
        const costs = def.costsPerLevel[currentLevel]
        for (const cost of costs) {
          if ((state.resources[cost.resourceId] ?? 0) < cost.amount) return false
        }
        const updatedResources = { ...state.resources }
        const costDelta: Record<string, number> = {}
        for (const cost of costs) {
          updatedResources[cost.resourceId] = (updatedResources[cost.resourceId] ?? 0) - cost.amount
          costDelta[`${cost.resourceId}_spent`] = (costDelta[`${cost.resourceId}_spent`] ?? 0) + cost.amount
        }
        const { stats, lifetimeStats } = addStats(state.stats, state.lifetimeStats, costDelta)
        set({
          resources: updatedResources,
          purchasedUpgrades: { ...state.purchasedUpgrades, [upgradeId]: currentLevel + 1 },
          stats,
          lifetimeStats,
        })
        return true
      },

      addToQueue: (jobId) => {
        const state = get()
        const maxSize = getMaxQueueSize(state.purchasedSkills)
        if (maxSize === 0 || state.jobQueue.length >= maxSize) return
        set({ jobQueue: [...state.jobQueue, jobId] })
      },

      removeFromQueue: (index) =>
        set((s) => ({ jobQueue: s.jobQueue.filter((_, i) => i !== index) })),

      clearQueue: () => set({ jobQueue: [] }),

      exportSave: () => {
        const {
          theme, activeTab, resources, stats, activeJob, numberFormat,
          buildings, lastPassiveTick, marketPrices, marketPriceTrend, lastMarketTick,
          prestigeCount, insight, purchasedSkills, purchasedUpgrades,
          jobQueue, lifetimeStats, prevVentureStats,
        } = get()
        return btoa(JSON.stringify({
          theme, activeTab, resources, stats, activeJob, numberFormat,
          buildings, lastPassiveTick, marketPrices, marketPriceTrend, lastMarketTick,
          prestigeCount, insight, purchasedSkills, purchasedUpgrades,
          jobQueue, lifetimeStats, prevVentureStats,
        }))
      },

      importSave: (encoded) => {
        try {
          const data = JSON.parse(atob(encoded)) as Partial<GameStore>
          const patch: Partial<typeof DEFAULT_STATE> = {}
          if (data.theme === 'light' || data.theme === 'dark') patch.theme = data.theme
          if (typeof data.activeTab === 'string') patch.activeTab = data.activeTab as TabType
          if (data.resources && typeof data.resources === 'object') patch.resources = data.resources
          if (data.stats && typeof data.stats === 'object') patch.stats = data.stats
          if (data.activeJob !== undefined) patch.activeJob = data.activeJob
          if (['engineering', 'scientific', 'normal'].includes(data.numberFormat as string))
            patch.numberFormat = data.numberFormat as NumberFormatType
          if (data.buildings && typeof data.buildings === 'object') patch.buildings = data.buildings as Record<string, number>
          if (typeof data.lastPassiveTick === 'number') patch.lastPassiveTick = data.lastPassiveTick
          if (data.marketPrices && typeof data.marketPrices === 'object') patch.marketPrices = data.marketPrices as Record<string, number>
          if (data.marketPriceTrend && typeof data.marketPriceTrend === 'object') patch.marketPriceTrend = data.marketPriceTrend as Record<string, PriceTrend>
          if (typeof data.lastMarketTick === 'number') patch.lastMarketTick = data.lastMarketTick
          if (typeof data.prestigeCount === 'number') patch.prestigeCount = data.prestigeCount
          if (typeof data.insight === 'number') patch.insight = data.insight
          if (data.purchasedSkills && typeof data.purchasedSkills === 'object') patch.purchasedSkills = data.purchasedSkills as Record<string, number>
          if (data.purchasedUpgrades && typeof data.purchasedUpgrades === 'object') patch.purchasedUpgrades = data.purchasedUpgrades as Record<string, number>
          if (Array.isArray(data.jobQueue)) patch.jobQueue = data.jobQueue as string[]
          if (data.lifetimeStats && typeof data.lifetimeStats === 'object') patch.lifetimeStats = data.lifetimeStats as Record<string, number>
          if (data.prevVentureStats && typeof data.prevVentureStats === 'object') patch.prevVentureStats = data.prevVentureStats as Record<string, number>
          set(patch)
          return true
        } catch {
          return false
        }
      },

      resetGame: () => {
        localStorage.removeItem(STORAGE_KEY)
        set({
          ...DEFAULT_STATE,
          theme: get().theme,
          resources: { ...initialResources },
          stats: {},
          lifetimeStats: {},
          prevVentureStats: {},
          activeJob: null,
          jobQueue: [],
          numberFormat: 'engineering',
          buildings: { ...initialBuildings },
          lastPassiveTick: Date.now(),
          marketPrices: { ...initialMarketPrices },
          marketPriceTrend: { ...initialMarketTrends },
          lastMarketTick: Date.now() - 30000,
          prestigeCount: 0,
          insight: 0,
          purchasedSkills: {},
          purchasedUpgrades: {},
        })
      },
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        // Seed lifetimeStats from stats for saves that predate the prestige system
        if (
          state &&
          Object.keys(state.lifetimeStats ?? {}).length === 0 &&
          Object.keys(state.stats ?? {}).length > 0
        ) {
          state.lifetimeStats = { ...state.stats }
        }
      },
    }
  )
)
