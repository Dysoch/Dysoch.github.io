import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEY } from '../constants'
import type { TabType, ThemeType, ActiveJob, NumberFormatType, Building, JobCost, MarketItem, PriceTrend } from '../types'
import resourcesData from '../content/resources.json'
import buildingsData from '../content/buildings.json'
import marketItemsData from '../content/market_items.json'

const initialResources = Object.fromEntries(resourcesData.map((r) => [r.id, 0]))
const initialBuildings = Object.fromEntries(buildingsData.map((b) => [b.id, 0]))
const initialMarketPrices = Object.fromEntries((marketItemsData as MarketItem[]).map((m) => [m.resourceId, m.basePrice]))
const initialMarketTrends: Record<string, PriceTrend> = Object.fromEntries(
  (marketItemsData as MarketItem[]).map((m) => [m.resourceId, 'same' as PriceTrend])
)

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
  completeJob: (jobId: string, rewardResourceId: string, amount: number) => void
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
  lastMarketTick: Date.now() - 30000, // triggers immediate update on first load
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

      incrementStat: (key, amount = 1) =>
        set((s) => ({
          stats: { ...s.stats, [key]: (s.stats[key] ?? 0) + amount },
        })),

      startJob: (jobId, durationSeconds, costs?) => {
        const state = get()
        if (costs?.length) {
          for (const cost of costs) {
            if ((state.resources[cost.resourceId] ?? 0) < cost.amount) return
          }
          const updatedResources = { ...state.resources }
          const updatedStats = { ...state.stats }
          for (const cost of costs) {
            updatedResources[cost.resourceId] = (updatedResources[cost.resourceId] ?? 0) - cost.amount
            updatedStats[`${cost.resourceId}_spent`] = (updatedStats[`${cost.resourceId}_spent`] ?? 0) + cost.amount
          }
          const now = Date.now()
          set({
            resources: updatedResources,
            stats: updatedStats,
            activeJob: { jobId, startTime: now, endTime: now + durationSeconds * 1000 },
          })
        } else {
          const now = Date.now()
          set({
            activeJob: { jobId, startTime: now, endTime: now + durationSeconds * 1000 },
          })
        }
      },

      completeJob: (jobId, rewardResourceId, amount) =>
        set((s) => ({
          activeJob: null,
          resources: {
            ...s.resources,
            [rewardResourceId]: (s.resources[rewardResourceId] ?? 0) + amount,
          },
          stats: {
            ...s.stats,
            [`job_${jobId}_completed`]: (s.stats[`job_${jobId}_completed`] ?? 0) + 1,
            [`job_${jobId}_${rewardResourceId}_earned`]: (s.stats[`job_${jobId}_${rewardResourceId}_earned`] ?? 0) + amount,
            [`${rewardResourceId}_earned`]: (s.stats[`${rewardResourceId}_earned`] ?? 0) + amount,
          },
        })),

      cancelJob: () => set({ activeJob: null }),

      buyBuilding: (id) => {
        const state = get()
        const def = (buildingsData as Building[]).find((b) => b.id === id)
        if (!def) return false
        const owned = state.buildings[id] ?? 0
        const currentCosts = def.baseCost.map((c) => ({
          resourceId: c.resourceId,
          amount: Math.floor(c.amount * Math.pow(def.costMultiplier, owned)),
        }))
        for (const cost of currentCosts) {
          if ((state.resources[cost.resourceId] ?? 0) < cost.amount) return false
        }
        const updatedResources = { ...state.resources }
        const updatedStats = { ...state.stats }
        for (const cost of currentCosts) {
          updatedResources[cost.resourceId] = (updatedResources[cost.resourceId] ?? 0) - cost.amount
          updatedStats[`${cost.resourceId}_spent`] = (updatedStats[`${cost.resourceId}_spent`] ?? 0) + cost.amount
        }
        updatedStats[`building_${id}_count`] = (updatedStats[`building_${id}_count`] ?? 0) + 1
        set({
          resources: updatedResources,
          buildings: { ...state.buildings, [id]: owned + 1 },
          stats: updatedStats,
        })
        return true
      },

      tickPassiveIncome: (deltaMs) => {
        const state = get()
        const updatedResources = { ...state.resources }
        const updatedStats = { ...state.stats }
        const deltaSeconds = deltaMs / 1000
        for (const building of buildingsData as Building[]) {
          const owned = state.buildings[building.id] ?? 0
          if (owned === 0) continue
          for (const prod of building.production) {
            const amount = prod.amountPerSecond * owned * deltaSeconds
            updatedResources[prod.resourceId] = (updatedResources[prod.resourceId] ?? 0) + amount
            updatedStats[`building_${building.id}_produced_${prod.resourceId}`] =
              (updatedStats[`building_${building.id}_produced_${prod.resourceId}`] ?? 0) + amount
            updatedStats[`${prod.resourceId}_earned`] =
              (updatedStats[`${prod.resourceId}_earned`] ?? 0) + amount
          }
        }
        set({ resources: updatedResources, stats: updatedStats, lastPassiveTick: Date.now() })
      },

      tickMarket: () => {
        const state = get()
        const newPrices: Record<string, number> = {}
        const newTrends: Record<string, PriceTrend> = {}
        for (const item of marketItemsData as MarketItem[]) {
          const current = state.marketPrices[item.resourceId] ?? item.basePrice
          const change = (Math.random() * 0.30 - 0.15) * item.basePrice
          const raw = Math.max(item.minPrice, Math.min(item.maxPrice, current + change))
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
        const price = state.marketPrices[resourceId]
        if (price == null) return false
        const totalCost = price * quantity
        if ((state.resources['copper_coins'] ?? 0) < totalCost) return false
        set((s) => ({
          resources: {
            ...s.resources,
            copper_coins: (s.resources['copper_coins'] ?? 0) - totalCost,
            [resourceId]: (s.resources[resourceId] ?? 0) + quantity,
          },
          stats: {
            ...s.stats,
            [`copper_coins_spent`]: (s.stats['copper_coins_spent'] ?? 0) + totalCost,
            [`${resourceId}_earned`]: (s.stats[`${resourceId}_earned`] ?? 0) + quantity,
          },
        }))
        return true
      },

      sellMarketResource: (resourceId, quantity) => {
        if (quantity <= 0) return false
        const state = get()
        if ((state.resources[resourceId] ?? 0) < quantity) return false
        const price = state.marketPrices[resourceId]
        if (price == null) return false
        const totalRevenue = price * quantity
        set((s) => ({
          resources: {
            ...s.resources,
            [resourceId]: (s.resources[resourceId] ?? 0) - quantity,
            copper_coins: (s.resources['copper_coins'] ?? 0) + totalRevenue,
          },
          stats: {
            ...s.stats,
            [`${resourceId}_spent`]: (s.stats[`${resourceId}_spent`] ?? 0) + quantity,
            [`copper_coins_earned`]: (s.stats['copper_coins_earned'] ?? 0) + totalRevenue,
          },
        }))
        return true
      },

      exchange: (fromId, toId, rate, count) =>
        set((s) => {
          const available = s.resources[fromId] ?? 0
          const cost = rate * count
          if (available < cost) return s
          return {
            resources: {
              ...s.resources,
              [fromId]: available - cost,
              [toId]: (s.resources[toId] ?? 0) + count,
            },
            stats: {
              ...s.stats,
              [`${fromId}_spent`]: (s.stats[`${fromId}_spent`] ?? 0) + cost,
              [`${toId}_earned`]: (s.stats[`${toId}_earned`] ?? 0) + count,
            },
          }
        }),

      exportSave: () => {
        const {
          theme, activeTab, resources, stats, activeJob, numberFormat,
          buildings, lastPassiveTick, marketPrices, marketPriceTrend, lastMarketTick,
        } = get()
        return btoa(JSON.stringify({
          theme, activeTab, resources, stats, activeJob, numberFormat,
          buildings, lastPassiveTick, marketPrices, marketPriceTrend, lastMarketTick,
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
          activeJob: null,
          numberFormat: 'engineering',
          buildings: { ...initialBuildings },
          lastPassiveTick: Date.now(),
          marketPrices: { ...initialMarketPrices },
          marketPriceTrend: { ...initialMarketTrends },
          lastMarketTick: Date.now() - 30000,
        })
      },
    }),
    { name: STORAGE_KEY }
  )
)
