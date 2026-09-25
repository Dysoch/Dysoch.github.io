import { TICK_MS, STATE_SYNC_MS, MAX_OFFLINE_SIMULATED_MS } from '../constants'
import type { CombatEvent, MainToWorkerMessage, SimState, WorkerToMainMessage } from '../types'
import {
  advanceTick,
  ascend,
  buyPerk,
  craftItem,
  createInitialState,
  equipItem,
  fuseAll,
  fuseItem,
  imbueAugment,
  summarizeOffline,
  recall,
  reforgeItem,
  salvageItem,
  salvageItems,
  setAutomation,
  selectZone,
  setDepthMode,
  simulateOfflineElapsed,
  socketAugment,
  trainStat,
  unequipItem,
  upgradeAbility,
} from './simLogic'

const ctx = self as unknown as DedicatedWorkerGlobalScope
const MAX_STEP_MS = 1000
const MAX_EVENTS_PER_TICK = 50
// Shorter absences (a quick reload) aren't worth interrupting the player with a summary
const OFFLINE_SUMMARY_MIN_MS = 60_000

let state: SimState = createInitialState()
let initialized = false
let msSinceLastSync = 0
let lastTickAt = Date.now()

function post(message: WorkerToMainMessage) {
  ctx.postMessage(message)
}

function syncState() {
  post({ type: 'STATE_UPDATE', state })
}

ctx.setInterval(() => {
  // Never sync before the saved state has been loaded, or the default state would overwrite the save
  if (!initialized) return
  const now = Date.now()
  const deltaMs = Math.min(now - lastTickAt, MAX_OFFLINE_SIMULATED_MS)
  lastTickAt = now

  // Browsers throttle timers in background tabs, so one tick can cover seconds or minutes.
  // Step through it like offline catch-up does, so abilities get their turns in between
  // monster attacks, and only forward the newest events (the combat log keeps ~50 anyway).
  const events: CombatEvent[] = []
  for (let remaining = deltaMs; remaining > 0; remaining -= MAX_STEP_MS) {
    const result = advanceTick(state, Math.min(MAX_STEP_MS, remaining), now)
    state = result.state
    events.push(...result.events)
    if (events.length > MAX_EVENTS_PER_TICK * 2) events.splice(0, events.length - MAX_EVENTS_PER_TICK)
  }
  for (const event of events.slice(-MAX_EVENTS_PER_TICK)) post({ type: 'EVENT', event })

  msSinceLastSync += deltaMs
  if (msSinceLastSync >= STATE_SYNC_MS) {
    msSinceLastSync = 0
    syncState()
  }
}, TICK_MS)

ctx.onmessage = (e: MessageEvent<MainToWorkerMessage>) => {
  const msg = e.data
  const now = Date.now()

  switch (msg.type) {
    case 'INIT': {
      const away = now - msg.state.lastTickTimestamp
      const elapsed = Math.min(away, MAX_OFFLINE_SIMULATED_MS)
      try {
        state = elapsed > 1000 ? simulateOfflineElapsed(msg.state, elapsed) : msg.state
        if (elapsed >= OFFLINE_SUMMARY_MIN_MS) {
          post({ type: 'OFFLINE_SUMMARY', summary: summarizeOffline(msg.state, state, elapsed, away > MAX_OFFLINE_SIMULATED_MS) })
        }
      } catch (err) {
        console.error('Offline simulation failed, loading save without catch-up', err)
        state = msg.state
      }
      initialized = true
      lastTickAt = now
      syncState()
      break
    }
    case 'SET_DEPTH_MODE':
      state = setDepthMode(state, msg.depthMode)
      break
    case 'SELECT_ZONE':
      state = selectZone(state, msg.zoneId)
      break
    case 'TRAIN_STAT':
      state = trainStat(state, msg.statId, msg.count)
      break
    case 'UPGRADE_ABILITY':
      state = upgradeAbility(state, msg.abilityId, msg.count)
      break
    case 'EQUIP_ITEM':
      state = equipItem(state, msg.instanceId)
      break
    case 'UNEQUIP_ITEM':
      state = unequipItem(state, msg.slot)
      break
    case 'SOCKET_AUGMENT':
      state = socketAugment(state, msg.instanceId, msg.augmentId)
      break
    case 'SALVAGE_ITEM': {
      const result = salvageItem(state, msg.instanceId)
      state = result.state
      if (result.event) post({ type: 'EVENT', event: result.event })
      break
    }
    case 'SALVAGE_ITEMS': {
      const result = salvageItems(state, msg.instanceIds)
      state = result.state
      for (const event of result.events) post({ type: 'EVENT', event })
      break
    }
    case 'FUSE_ITEM': {
      const result = fuseItem(state, msg.instanceId, now)
      state = result.state
      if (result.event) post({ type: 'EVENT', event: result.event })
      break
    }
    case 'FUSE_ALL': {
      const result = fuseAll(state, now)
      state = result.state
      for (const event of result.events) post({ type: 'EVENT', event })
      break
    }
    case 'SET_AUTOMATION':
      state = setAutomation(state, msg.automation)
      break
    case 'IMBUE_AUGMENT': {
      const result = imbueAugment(state, msg.augmentId, now, msg.count)
      state = result.state
      if (result.event) post({ type: 'EVENT', event: result.event })
      break
    }
    case 'REFORGE_ITEM': {
      const result = reforgeItem(state, msg.instanceId, now)
      state = result.state
      if (result.event) post({ type: 'EVENT', event: result.event })
      break
    }
    case 'RECALL':
      state = recall(state)
      break
    case 'ASCEND':
      state = ascend(state)
      break
    case 'CRAFT_ITEM': {
      const result = craftItem(state, msg.catalogId, now, msg.count)
      state = result.state
      for (const event of result.events) post({ type: 'EVENT', event })
      break
    }
    case 'BUY_PERK':
      state = buyPerk(state, msg.perkId, msg.count)
      break
    case 'IMPORT_SAVE':
      state = msg.state
      initialized = true
      break
  }

  syncState()
}
