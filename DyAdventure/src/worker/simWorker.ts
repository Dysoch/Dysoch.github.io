import { TICK_MS, STATE_SYNC_MS, MAX_OFFLINE_SIMULATED_MS } from '../constants'
import type { CombatEvent, MainToWorkerMessage, SimState, WorkerToMainMessage } from '../types'
import {
  advanceTick,
  ascend,
  buyPerk,
  createInitialState,
  equipItem,
  recall,
  salvageItem,
  selectZone,
  setDepthMode,
  simulateOfflineElapsed,
  socketAugment,
  trainStat,
  triggerManualAbility,
  unequipItem,
  upgradeAbility,
} from './simLogic'

const ctx = self as unknown as DedicatedWorkerGlobalScope

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
  const deltaMs = now - lastTickAt
  lastTickAt = now

  const result = advanceTick(state, deltaMs, now)
  state = result.state
  for (const event of result.events) post({ type: 'EVENT', event })

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
      const elapsed = Math.min(now - msg.state.lastTickTimestamp, MAX_OFFLINE_SIMULATED_MS)
      try {
        state = elapsed > 1000 ? simulateOfflineElapsed(msg.state, elapsed) : msg.state
      } catch (err) {
        console.error('Offline simulation failed, loading save without catch-up', err)
        state = msg.state
      }
      initialized = true
      lastTickAt = now
      syncState()
      break
    }
    case 'SET_MODE':
      state = { ...state, combatMode: msg.mode }
      break
    case 'TRIGGER_ABILITY': {
      const events: CombatEvent[] = []
      state = triggerManualAbility(state, msg.abilityId, now, events)
      for (const event of events) post({ type: 'EVENT', event })
      break
    }
    case 'SET_DEPTH_MODE':
      state = setDepthMode(state, msg.depthMode)
      break
    case 'SELECT_ZONE':
      state = selectZone(state, msg.zoneId)
      break
    case 'TRAIN_STAT':
      state = trainStat(state, msg.statId)
      break
    case 'UPGRADE_ABILITY':
      state = upgradeAbility(state, msg.abilityId)
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
    case 'RECALL':
      state = recall(state)
      break
    case 'ASCEND':
      state = ascend(state)
      break
    case 'BUY_PERK':
      state = buyPerk(state, msg.perkId)
      break
    case 'IMPORT_SAVE':
      state = msg.state
      initialized = true
      break
  }

  syncState()
}
