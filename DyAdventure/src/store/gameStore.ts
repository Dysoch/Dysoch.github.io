import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { SAVE_DEBOUNCE_MS, SAVE_VERSION, STORAGE_KEY } from '../constants'
import { createInitialState } from '../worker/simLogic'
import type {
  CombatEvent,
  CombatMode,
  DepthMode,
  GearSlot,
  SimState,
  StatId,
  TabId,
  MainToWorkerMessage,
  WorkerToMainMessage,
} from '../types'

const COMBAT_LOG_LIMIT = 50

type PersistedSlice = SimState

interface GameStore extends PersistedSlice {
  activeTab: TabId
  combatLog: CombatEvent[]
  setActiveTab: (id: TabId) => void
  setMode: (mode: CombatMode) => void
  triggerAbility: (abilityId: string) => void
  setDepthMode: (depthMode: DepthMode) => void
  selectZone: (zoneId: string) => void
  trainStat: (statId: StatId) => void
  upgradeAbility: (abilityId: string) => void
  equipItem: (instanceId: string) => void
  unequipItem: (slot: GearSlot) => void
  socketAugment: (instanceId: string, augmentId: string) => void
  salvageItem: (instanceId: string) => void
  recall: () => void
  ascend: () => void
  buyPerk: (perkId: string) => void
  exportSave: () => string
  importSave: (data: string) => boolean
  resetGame: () => void
  saveNow: () => boolean
}

const PERSISTED_KEYS = Object.keys(createInitialState())

function omitUiFields(state: GameStore): PersistedSlice {
  const result: Record<string, unknown> = {}
  for (const key of PERSISTED_KEYS) result[key] = (state as unknown as Record<string, unknown>)[key]
  return result as unknown as PersistedSlice
}

function createDebouncedLocalStorage(delayMs: number): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: string | null = null
  let pendingName = ''
  const flush = () => {
    if (timer) clearTimeout(timer)
    timer = null
    if (pending !== null) localStorage.setItem(pendingName, pending)
    pending = null
  }
  // Flush on page unload / HMR reload so the debounce never drops the latest state
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
  if (import.meta.hot) import.meta.hot.dispose(flush)
  return {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => {
      pending = value
      pendingName = name
      if (timer) return
      timer = setTimeout(flush, delayMs)
    },
    removeItem: (name) => {
      if (timer) clearTimeout(timer)
      timer = null
      pending = null
      localStorage.removeItem(name)
    },
  }
}

const worker = new Worker(new URL('../worker/simWorker.ts', import.meta.url), { type: 'module' })

function post(message: MainToWorkerMessage) {
  worker.postMessage(message)
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      activeTab: 'combat',
      combatLog: [],

      setActiveTab: (id) => set({ activeTab: id }),

      setMode: (mode) => post({ type: 'SET_MODE', mode }),
      triggerAbility: (abilityId) => post({ type: 'TRIGGER_ABILITY', abilityId }),
      setDepthMode: (depthMode) => post({ type: 'SET_DEPTH_MODE', depthMode }),
      selectZone: (zoneId) => post({ type: 'SELECT_ZONE', zoneId }),
      trainStat: (statId) => post({ type: 'TRAIN_STAT', statId }),
      upgradeAbility: (abilityId) => post({ type: 'UPGRADE_ABILITY', abilityId }),
      equipItem: (instanceId) => post({ type: 'EQUIP_ITEM', instanceId }),
      unequipItem: (slot) => post({ type: 'UNEQUIP_ITEM', slot }),
      socketAugment: (instanceId, augmentId) => post({ type: 'SOCKET_AUGMENT', instanceId, augmentId }),
      salvageItem: (instanceId) => post({ type: 'SALVAGE_ITEM', instanceId }),
      recall: () => post({ type: 'RECALL' }),
      ascend: () => post({ type: 'ASCEND' }),
      buyPerk: (perkId) => post({ type: 'BUY_PERK', perkId }),

      exportSave: () => btoa(JSON.stringify(omitUiFields(get()))),

      importSave: (data) => {
        try {
          const parsed = JSON.parse(atob(data))
          if (typeof parsed !== 'object' || parsed === null) return false
          if (typeof parsed.saveVersion !== 'number' || typeof parsed.focus !== 'number') return false
          // Exports from before discovery tracking lack this field
          if (!Array.isArray(parsed.discoveredItemIds)) parsed.discoveredItemIds = []
          if (typeof parsed.maxDepthByZone !== 'object' || parsed.maxDepthByZone === null) {
            parsed.maxDepthByZone = { [parsed.currentZoneId]: parsed.currentDepth }
          }
          const merged = { ...createInitialState(), ...parsed } as SimState
          set(merged)
          post({ type: 'IMPORT_SAVE', state: merged })
          return true
        } catch {
          return false
        }
      },

      resetGame: () => {
        const fresh = createInitialState()
        set({ ...fresh, activeTab: 'combat', combatLog: [] })
        post({ type: 'IMPORT_SAVE', state: fresh })
      },

      saveNow: () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: omitUiFields(get()), version: SAVE_VERSION }))
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => createDebouncedLocalStorage(SAVE_DEBOUNCE_MS)),
      partialize: (state) => omitUiFields(state),
      migrate: (persistedState, version) => (version < SAVE_VERSION ? createInitialState() : (persistedState as PersistedSlice)),
      // Fill in fields added since the save was written (new stats, abilities, ...) so old saves keep working
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedSlice>
        const fresh = createInitialState()
        return {
          ...current,
          ...saved,
          stats: { ...fresh.stats, ...saved.stats },
          abilities: { ...fresh.abilities, ...saved.abilities },
          gear: { ...fresh.gear, ...saved.gear },
          maxDepthByZone: saved.maxDepthByZone ?? { [saved.currentZoneId ?? fresh.currentZoneId]: saved.currentDepth ?? fresh.currentDepth },
          // Saves from before discovery tracking: infer from what the player currently owns
          discoveredItemIds: [
            ...new Set([
              ...(saved.discoveredItemIds ?? []),
              ...(saved.inventory ?? []).map((i) => i.catalogId),
              ...Object.values(saved.gear ?? {}).flatMap((i) => (i ? [i.catalogId] : [])),
            ]),
          ],
        }
      },
      onRehydrateStorage: () => (state) => {
        // Only the plain sim state can be structured-cloned to the worker; the store also holds action functions
        if (state) post({ type: 'INIT', state: omitUiFields(state) })
      },
    },
  ),
)

worker.onmessage = (e: MessageEvent<WorkerToMainMessage>) => {
  const msg = e.data
  if (msg.type === 'STATE_UPDATE') {
    useGameStore.setState(msg.state)
  } else if (msg.type === 'EVENT') {
    useGameStore.setState((prev) => ({
      combatLog: [msg.event, ...prev.combatLog].slice(0, COMBAT_LOG_LIMIT),
    }))
  }
}
