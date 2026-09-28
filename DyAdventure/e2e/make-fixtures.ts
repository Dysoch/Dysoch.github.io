/**
 * Writes the saves the e2e tests load into localStorage (e2e/.fixtures, git-ignored), built with the
 * real game logic so they always match the current content and save format.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createInitialState, craftItem } from '../src/worker/simLogic.ts'
import { SAVE_VERSION } from '../src/constants/index.ts'
import type { GearItem, SimState } from '../src/types/index.ts'

const dir = path.join(import.meta.dirname, '.fixtures')
fs.mkdirSync(dir, { recursive: true })
// A timestamp slightly in the future: no offline catch-up (or "while you were away" popup) on load
const now = Date.now() + 10 * 60_000

function write(name: string, state: SimState) {
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({ state: { ...state, lastTickTimestamp: now }, version: SAVE_VERSION }))
}

// A mid-game character: some gear worn, better pieces waiting in the inventory, augments learned
let geared: SimState = {
  ...createInitialState(),
  focus: 50_000,
  materials: { wood: 5000, stone: 5000, crystals: 5000, leather: 5000 },
  stats: { ...createInitialState().stats, might: 40, grit: 40, speed: 20 },
  abilities: { ...createInitialState().abilities, strike: { rank: 15 }, bolt: { rank: 5 } },
  learnedAugmentIds: ['aug_might', 'aug_grit'],
  lifetime: { recalls: 3 },
}
for (const id of ['vanguard_sword', 'vanguard_armor', 'vanguard_helm', 'vanguard_ring', 'adept_wand', 'adept_robe', 'lucky_charm', 'woods_warden_fang']) {
  geared = { ...geared, discoveredItemIds: [...geared.discoveredItemIds, id] }
  geared = craftItem(geared, id, now, 1).state
}
const sword = geared.inventory.find((i) => i.catalogId === 'vanguard_sword')!
geared = { ...geared, gear: { ...geared.gear, mainHand: sword }, inventory: geared.inventory.filter((i) => i !== sword) }
write('geared', geared)

// A save from before the 11-slot gear rework (old slot names and item ids), to exercise the migration
const item = (instanceId: string, catalogId: string): GearItem => ({ instanceId, catalogId, level: 5, augmentIds: [] })
const legacy = {
  ...createInitialState(),
  gear: { weapon: item('sword', 'vanguard_sword'), focusItem: item('wand', 'adept_wand'), armor: item('armor', 'vanguard_armor'), trinket1: item('charm', 'vanguard_charm'), trinket2: null },
  inventory: [item('pouch', 'tattered_pouch')],
  discoveredItemIds: ['vanguard_sword', 'adept_wand', 'vanguard_armor', 'vanguard_charm', 'tattered_pouch'],
} as unknown as SimState
write('legacy-slots', legacy)
