import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEY } from '../constants'
import type { TabType, ThemeType, ActiveJob } from '../types'
import resourcesData from '../content/resources.json'

const initialResources = Object.fromEntries(
  resourcesData.map((r) => [r.id, 0])
)

interface GameStore {
  // UI
  theme: ThemeType
  activeTab: TabType

  // Game data
  resources: Record<string, number>
  stats: Record<string, number>
  activeJob: ActiveJob | null

  // UI actions
  setTheme: (theme: ThemeType) => void
  setActiveTab: (tab: TabType) => void

  // Resource actions
  addResource: (id: string, amount: number) => void
  spendResource: (id: string, amount: number) => boolean

  // Stats
  incrementStat: (key: string, amount?: number) => void

  // Job actions
  startJob: (jobId: string, durationSeconds: number) => void
  completeJob: (jobId: string, rewardResourceId: string, amount: number) => void
  cancelJob: () => void

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
  resources: { ...initialResources },
  stats: {} as Record<string, number>,
  activeJob: null as ActiveJob | null,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setTheme: (theme) => set({ theme }),
      setActiveTab: (tab) => set({ activeTab: tab }),

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

      startJob: (jobId, durationSeconds) => {
        const now = Date.now()
        set({
          activeJob: {
            jobId,
            startTime: now,
            endTime: now + durationSeconds * 1000,
          },
        })
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
            [`${rewardResourceId}_earned`]: (s.stats[`${rewardResourceId}_earned`] ?? 0) + amount,
          },
        })),

      cancelJob: () => set({ activeJob: null }),

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
        const { theme, activeTab, resources, stats, activeJob } = get()
        return btoa(JSON.stringify({ theme, activeTab, resources, stats, activeJob }))
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
        })
      },
    }),
    { name: STORAGE_KEY }
  )
)
