import statsData from '../content/stats.json'
import abilitiesData from '../content/abilities.json'
import gearData from '../content/gear.json'
import augmentsData from '../content/augments.json'
import zonesData from '../content/zones.json'
import prestigeData from '../content/prestige.json'
import {
  BASE_HP_CAP,
  FAINT_RECOVERY_THRESHOLD_PCT,
  GRIT_DEFENSE_FACTOR,
  HP_REGEN_PCT_PER_SEC,
  MANUAL_TRIGGER_DAMAGE_MULTIPLIER,
  SPEED_COOLDOWN_FACTOR,
} from '../constants'
import type {
  AbilityDef,
  AugmentDef,
  CombatEvent,
  CurrentMonster,
  DepthMode,
  GearCatalogItemDef,
  GearItem,
  GearSlot,
  PerkDef,
  PerkEffect,
  PrimaryStat,
  RarityDef,
  SetDef,
  SimState,
  StatDef,
  StatId,
  ZoneDef,
} from '../types'

const STATS = statsData as StatDef[]
const ABILITIES = abilitiesData as AbilityDef[]
const RARITIES = gearData.rarities as RarityDef[]
const GEAR_ITEMS = gearData.items as GearCatalogItemDef[]
const SETS = gearData.sets as SetDef[]
const AUGMENTS = augmentsData as AugmentDef[]
const ZONES = zonesData as ZoneDef[]
const PERKS = prestigeData.perks as PerkDef[]
const RECALL_CONFIG = prestigeData.recall
const ASCEND_CONFIG = prestigeData.ascend

const BASE_STAMINA_CAP = 100
const BASE_MANA_CAP = 100
const REGEN_PCT_PER_SEC = 0.05

export function getStatDef(id: StatId): StatDef {
  const def = STATS.find((s) => s.id === id)
  if (!def) throw new Error(`Unknown stat: ${id}`)
  return def
}

export function getAbilityDef(id: string): AbilityDef {
  const def = ABILITIES.find((a) => a.id === id)
  if (!def) throw new Error(`Unknown ability: ${id}`)
  return def
}

export function getZoneDef(id: string): ZoneDef {
  const def = ZONES.find((z) => z.id === id)
  if (!def) throw new Error(`Unknown zone: ${id}`)
  return def
}

export function listPerks(): PerkDef[] {
  return PERKS
}

/** Sum of every owned perk's bonus for one effect. */
export function perkBonus(state: SimState, effect: PerkEffect): number {
  let total = 0
  for (const perk of PERKS) {
    if (perk.effect === effect) total += (state.perkLevels[perk.id] ?? 0) * perk.perLevel
  }
  return total
}

export function computePerkCost(perk: PerkDef, currentLevel: number): number {
  return Math.max(1, Math.floor(perk.baseCost * Math.pow(perk.costMultiplier, currentLevel)))
}

export function getDefaultZoneId(): string {
  return ZONES[0].id
}

export function getRarityDef(id: string): RarityDef {
  const def = RARITIES.find((r) => r.id === id)
  if (!def) throw new Error(`Unknown rarity: ${id}`)
  return def
}

export function getAugmentDef(id: string): AugmentDef {
  const def = AUGMENTS.find((a) => a.id === id)
  if (!def) throw new Error(`Unknown augment: ${id}`)
  return def
}

export function getGearCatalogItem(id: string): GearCatalogItemDef {
  const def = GEAR_ITEMS.find((i) => i.id === id)
  if (!def) throw new Error(`Unknown gear item: ${id}`)
  return def
}

export function getSetDef(id: string): SetDef {
  const def = SETS.find((s) => s.id === id)
  if (!def) throw new Error(`Unknown set: ${id}`)
  return def
}

export function listSets(): SetDef[] {
  return SETS
}

export function computeTrainCost(statId: StatId, currentLevel: number): number {
  const def = getStatDef(statId)
  return Math.floor(def.baseTrainCost * Math.pow(def.trainCostMultiplier, currentLevel))
}

export function computeAbilityRankCost(abilityId: string, currentRank: number): number {
  const def = getAbilityDef(abilityId)
  return Math.floor(def.baseRankCost * Math.pow(def.rankCostMultiplier, currentRank))
}

export function effectiveGearValue(item: GearItem): number {
  const catalogDef = getGearCatalogItem(item.catalogId)
  return catalogDef.baseValue * (1 + 0.01 * (item.level - 1))
}

export function gearBonusForStat(state: SimState, statId: PrimaryStat): number {
  let base = 0
  let augmentMultiplier = 1
  for (const item of Object.values(state.gear)) {
    if (!item) continue
    const catalogDef = getGearCatalogItem(item.catalogId)
    if (catalogDef.primaryStat === statId) base += effectiveGearValue(item)
    for (const augId of item.augmentIds) {
      const aug = getAugmentDef(augId)
      if (aug.statId === statId) augmentMultiplier += aug.magnitude
    }
  }
  return base * augmentMultiplier
}

export function focusGainMultiplier(state: SimState): number {
  let multiplier = 1 + perkBonus(state, 'focusGain')
  for (const item of Object.values(state.gear)) {
    if (!item) continue
    for (const augId of item.augmentIds) {
      const aug = getAugmentDef(augId)
      if (aug.statId === 'focusGain') multiplier += aug.magnitude
    }
  }
  return multiplier
}

export function computeEquippedSetCounts(state: SimState): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of Object.values(state.gear)) {
    if (!item) continue
    const catalogDef = getGearCatalogItem(item.catalogId)
    if (!catalogDef.setId) continue
    counts[catalogDef.setId] = (counts[catalogDef.setId] ?? 0) + 1
  }
  return counts
}

export function computeSetBonusForStat(state: SimState, statId: PrimaryStat): number {
  const counts = computeEquippedSetCounts(state)
  let bonus = 0
  for (const set of SETS) {
    const equipped = counts[set.id] ?? 0
    for (const tier of set.bonuses) {
      if (equipped >= tier.pieces && tier.statId === statId) bonus += tier.magnitude
    }
  }
  return bonus
}

export function computeEffectiveStat(state: SimState, statId: StatId): number {
  return state.stats[statId] + computeSetBonusForStat(state, statId)
}

export function computeStaminaCap(state: SimState): number {
  return BASE_STAMINA_CAP + gearBonusForStat(state, 'staminaCap') + computeSetBonusForStat(state, 'staminaCap')
}

export function computeManaCap(state: SimState): number {
  const totalWillpower = computeEffectiveStat(state, 'willpower') + gearBonusForStat(state, 'willpower')
  return BASE_MANA_CAP + gearBonusForStat(state, 'manaCap') + computeSetBonusForStat(state, 'manaCap') + totalWillpower * 1.5
}

export function computeHpCap(state: SimState): number {
  const totalGrit = computeEffectiveStat(state, 'grit') + gearBonusForStat(state, 'grit')
  return BASE_HP_CAP + gearBonusForStat(state, 'hpCap') + computeSetBonusForStat(state, 'hpCap') + perkBonus(state, 'hpCap') + totalGrit * 1.5
}

export function computePhysicalPower(state: SimState): number {
  const trained = 1 + computeEffectiveStat(state, 'might') * 0.08
  const geared = 1 + gearBonusForStat(state, 'might') * 0.05
  return trained * geared
}

export function computeMagicPower(state: SimState): number {
  const trained = 1 + computeEffectiveStat(state, 'arcana') * 0.08
  const geared = 1 + gearBonusForStat(state, 'arcana') * 0.05
  return trained * geared
}

export function computeFortune(state: SimState): number {
  return computeEffectiveStat(state, 'fortune') + gearBonusForStat(state, 'fortune')
}

export function computeEffectiveCooldownMs(state: SimState, abilityId: string): number {
  const def = getAbilityDef(abilityId)
  const speed = computeEffectiveStat(state, 'speed')
  return def.cooldownMs / (1 + speed * SPEED_COOLDOWN_FACTOR)
}

export function computeAbilityDamage(state: SimState, abilityId: string): number {
  const def = getAbilityDef(abilityId)
  const progress = state.abilities[abilityId]
  const rank = progress ? progress.rank : 0
  if (rank <= 0) return 0
  const power = def.type === 'physical' ? computePhysicalPower(state) : computeMagicPower(state)
  const effect = def.baseEffect + def.effectPerRank * (rank - 1)
  return effect * power * (1 + perkBonus(state, 'damage'))
}

export function computeMonsterMaxHp(zone: ZoneDef, depth: number, isBoss: boolean): number {
  const scaled = zone.baseMonsterPower * Math.pow(1 + zone.perDepthGrowthPct / 100, depth - 1)
  return Math.ceil(scaled * (isBoss ? zone.bossPowerMultiplier : 1) * 10)
}

export function computeMonsterDamage(zone: ZoneDef, depth: number, isBoss: boolean): number {
  const scaled = zone.baseMonsterDamage * Math.pow(1 + zone.perDepthGrowthPct / 100, depth - 1)
  return Math.ceil(scaled * (isBoss ? zone.bossPowerMultiplier : 1))
}

export function computeIncomingDamage(state: SimState, rawDamage: number): number {
  const totalGrit = computeEffectiveStat(state, 'grit') + gearBonusForStat(state, 'grit')
  return rawDamage / (1 + totalGrit * GRIT_DEFENSE_FACTOR)
}

export function computeMonsterAttackIntervalMs(zone: ZoneDef, isBoss: boolean): number {
  return isBoss ? zone.baseMonsterAttackIntervalMs * zone.bossAttackIntervalMultiplier : zone.baseMonsterAttackIntervalMs
}

/** Deepest depth the player has reached in a zone (never below the zone's first floor). */
export function getMaxDepthReached(state: SimState, zone: ZoneDef): number {
  return Math.max(zone.minDepth, state.maxDepthByZone[zone.id] ?? zone.minDepth, state.currentDepth)
}

/** Checkpoint = the first floor after the last boss defeated (or the zone's first floor). */
export function getCheckpointDepth(zone: ZoneDef, depth: number): number {
  const bossesDefeated = Math.floor((depth - 1) / zone.bossEvery)
  return Math.max(zone.minDepth, bossesDefeated * zone.bossEvery + 1)
}

export function isBossDepth(zone: ZoneDef, depth: number): boolean {
  return depth % zone.bossEvery === 0
}

export function spawnMonster(zone: ZoneDef, depth: number): CurrentMonster {
  const boss = isBossDepth(zone, depth)
  const names = boss ? zone.bossNames : zone.monsterNames
  const name = names[Math.floor(Math.random() * names.length)]
  const maxHp = computeMonsterMaxHp(zone, depth, boss)
  return { name, isBoss: boss, hp: maxHp, maxHp, depth }
}

function resetMonsterEncounter(zone: ZoneDef, depth: number): Pick<SimState, 'currentMonster' | 'monsterActionTimerMs'> {
  return { currentMonster: spawnMonster(zone, depth), monsterActionTimerMs: 0 }
}

export function computeFocusReward(state: SimState, depth: number): number {
  const base = 1 + depth * 0.1
  const fortuneBonus = 1 + computeFortune(state) * 0.02
  return Math.max(1, Math.round(base * fortuneBonus * focusGainMultiplier(state)))
}

function rollLootCatalogEntry(state: SimState, zone: ZoneDef, depth: number, isBoss: boolean): GearCatalogItemDef | null {
  const fortune = computeFortune(state)
  const dropChance = 0.12 + fortune * 0.002 + perkBonus(state, 'dropChance')
  if (Math.random() > dropChance) return null
  const eligible = GEAR_ITEMS.filter(
    (i) => zone.gearItemIds.includes(i.id) && i.minDepth <= depth && (!i.bossOnly || isBoss),
  )
  if (eligible.length === 0) return null
  return eligible[Math.floor(Math.random() * eligible.length)]
}

export function computeSalvageValue(item: GearItem): number {
  const catalogDef = getGearCatalogItem(item.catalogId)
  const rarityWeight: Record<string, number> = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16 }
  return Math.max(1, Math.round(catalogDef.baseValue * item.level * (rarityWeight[catalogDef.rarity] ?? 1)))
}

export function salvageItem(state: SimState, instanceId: string): { state: SimState; event: CombatEvent | null } {
  const index = state.inventory.findIndex((i) => i.instanceId === instanceId)
  if (index < 0) return { state, event: null }
  const item = state.inventory[index]
  const focusGained = computeSalvageValue(item)
  const inventory = state.inventory.filter((i) => i.instanceId !== instanceId)
  const next = { ...state, inventory, focus: state.focus + focusGained }
  return { state: next, event: { kind: 'salvage', catalogId: item.catalogId, focusGained, timestamp: Date.now() } }
}

function applyRegen(state: SimState, deltaSeconds: number): SimState {
  const staminaCap = computeStaminaCap(state)
  const manaCap = computeManaCap(state)
  const hpCap = computeHpCap(state)
  return {
    ...state,
    stamina: {
      max: staminaCap,
      current: Math.min(staminaCap, state.stamina.current + staminaCap * REGEN_PCT_PER_SEC * deltaSeconds),
    },
    mana: {
      max: manaCap,
      current: Math.min(manaCap, state.mana.current + manaCap * REGEN_PCT_PER_SEC * deltaSeconds),
    },
    playerHp: {
      max: hpCap,
      current: Math.min(hpCap, state.playerHp.current + hpCap * HP_REGEN_PCT_PER_SEC * deltaSeconds),
    },
  }
}

function handleMonsterDeath(state: SimState, now: number, events: CombatEvent[]): SimState {
  const monster = state.currentMonster
  if (!monster) return state
  const zone = getZoneDef(state.currentZoneId)
  const focusGained = computeFocusReward(state, monster.depth)
  events.push({ kind: 'kill', monsterName: monster.name, depth: monster.depth, timestamp: now })

  let next = { ...state, focus: state.focus + focusGained }
  if (monster.isBoss) {
    events.push({ kind: 'bossDefeated', depth: monster.depth, timestamp: now })
    if (zone.unlocksZoneId && monster.depth >= zone.maxDepth && !next.unlockedZoneIds.includes(zone.unlocksZoneId)) {
      next = { ...next, unlockedZoneIds: [...next.unlockedZoneIds, zone.unlocksZoneId] }
      events.push({ kind: 'zoneUnlocked', zoneId: zone.unlocksZoneId, timestamp: now })
    }
    const unlearned = AUGMENTS.filter((a) => !next.learnedAugmentIds.includes(a.id))
    if (unlearned.length > 0) {
      const learned = unlearned[Math.floor(Math.random() * unlearned.length)]
      next = { ...next, learnedAugmentIds: [...next.learnedAugmentIds, learned.id] }
    }
  }

  const catalogEntry = rollLootCatalogEntry(next, zone, monster.depth, monster.isBoss)
  if (catalogEntry) {
    if (!next.discoveredItemIds.includes(catalogEntry.id)) {
      next = { ...next, discoveredItemIds: [...next.discoveredItemIds, catalogEntry.id] }
    }
    const equippedSlot = (Object.keys(next.gear) as GearSlot[]).find((slot) => next.gear[slot]?.catalogId === catalogEntry.id)
    const inventoryIndex = next.inventory.findIndex((i) => i.catalogId === catalogEntry.id)

    if (equippedSlot) {
      const existing = next.gear[equippedSlot]!
      const leveled = { ...existing, level: existing.level + 1 }
      next = { ...next, gear: { ...next.gear, [equippedSlot]: leveled } }
      events.push({ kind: 'fuse', catalogId: catalogEntry.id, newLevel: leveled.level, timestamp: now })
    } else if (inventoryIndex >= 0) {
      const existing = next.inventory[inventoryIndex]
      const leveled = { ...existing, level: existing.level + 1 }
      const inventory = [...next.inventory]
      inventory[inventoryIndex] = leveled
      next = { ...next, inventory }
      events.push({ kind: 'fuse', catalogId: catalogEntry.id, newLevel: leveled.level, timestamp: now })
    } else {
      const newItem: GearItem = {
        instanceId: `${catalogEntry.id}_${now}_${Math.floor(Math.random() * 1e6)}`,
        catalogId: catalogEntry.id,
        level: 1,
        augmentIds: [],
      }
      next = { ...next, inventory: [...next.inventory, newItem] }
      events.push({ kind: 'loot', item: newItem, timestamp: now })
    }
  }

  const nextDepth = next.depthMode.auto
    ? Math.min(zone.maxDepth, next.currentDepth + 1)
    : next.depthMode.pinnedDepth
  const maxDepthByZone = { ...next.maxDepthByZone, [zone.id]: Math.max(getMaxDepthReached(next, zone), nextDepth) }
  return { ...next, currentDepth: nextDepth, maxDepthByZone, ...resetMonsterEncounter(zone, nextDepth) }
}

function fireAbility(state: SimState, abilityId: string, now: number, events: CombatEvent[], manual: boolean): SimState {
  if (state.fainted || !state.currentMonster) return state
  const def = getAbilityDef(abilityId)
  const progress = state.abilities[abilityId]
  if (!progress || progress.rank <= 0) return state
  if ((state.abilityCooldowns[abilityId] ?? 0) > 0) return state

  const pool = def.type === 'physical' ? state.stamina : state.mana
  if (pool.current < def.resourceCost) {
    if (manual) events.push({ kind: 'notEnoughResource', abilityId, timestamp: now })
    return state
  }

  const baseDamage = computeAbilityDamage(state, abilityId)
  const damage = manual ? baseDamage * MANUAL_TRIGGER_DAMAGE_MULTIPLIER : baseDamage
  events.push({ kind: 'damage', source: 'player', amount: damage, abilityId, manual, timestamp: now })

  const spentPool = { ...pool, current: pool.current - def.resourceCost }
  const cooldownMs = computeEffectiveCooldownMs(state, abilityId)
  const abilityCooldowns = { ...state.abilityCooldowns, [abilityId]: cooldownMs }
  let next: SimState =
    def.type === 'physical'
      ? { ...state, stamina: spentPool, abilityCooldowns }
      : { ...state, mana: spentPool, abilityCooldowns }

  const remainingHp = next.currentMonster!.hp - damage
  if (remainingHp <= 0) {
    next = handleMonsterDeath(next, now, events)
  } else {
    next = { ...next, currentMonster: { ...next.currentMonster!, hp: remainingHp } }
  }
  return next
}

export function triggerManualAbility(state: SimState, abilityId: string, now: number, events: CombatEvent[]): SimState {
  if (state.combatMode !== 'active') return state
  return fireAbility(state, abilityId, now, events, true)
}

export interface TickResult {
  state: SimState
  events: CombatEvent[]
}

export function advanceTick(state: SimState, deltaMs: number, now: number): TickResult {
  const events: CombatEvent[] = []
  let next = applyRegen(state, deltaMs / 1000)

  if (!next.currentMonster) {
    const zone = getZoneDef(next.currentZoneId)
    next = { ...next, ...resetMonsterEncounter(zone, next.currentDepth) }
  }

  if (next.fainted) {
    const hpCap = computeHpCap(next)
    if (next.playerHp.current >= hpCap * FAINT_RECOVERY_THRESHOLD_PCT) {
      next = { ...next, fainted: false }
      events.push({ kind: 'recovered', timestamp: now })
    }
    return { state: { ...next, lastTickTimestamp: now }, events }
  }

  const zone = getZoneDef(next.currentZoneId)
  const monster = next.currentMonster!
  const attackIntervalMs = computeMonsterAttackIntervalMs(zone, monster.isBoss)
  let monsterTimer = next.monsterActionTimerMs + deltaMs
  if (monsterTimer >= attackIntervalMs) {
    monsterTimer -= attackIntervalMs
    const raw = computeMonsterDamage(zone, monster.depth, monster.isBoss)
    const dmg = computeIncomingDamage(next, raw)
    const newHp = Math.max(0, next.playerHp.current - dmg)
    events.push({ kind: 'damage', source: 'monster', amount: dmg, timestamp: now })
    next = { ...next, playerHp: { ...next.playerHp, current: newHp } }
    if (newHp <= 0) {
      const checkpointDepth = getCheckpointDepth(zone, monster.depth)
      next = {
        ...next,
        fainted: true,
        currentDepth: checkpointDepth,
        depthMode: next.depthMode.auto ? next.depthMode : { auto: false, pinnedDepth: Math.min(next.depthMode.pinnedDepth, checkpointDepth) },
        ...resetMonsterEncounter(zone, checkpointDepth),
      }
      events.push({ kind: 'faint', checkpointDepth, timestamp: now })
    }
  }
  next = { ...next, monsterActionTimerMs: monsterTimer }

  if (next.fainted) {
    return { state: { ...next, lastTickTimestamp: now }, events }
  }

  const cooldowns = { ...next.abilityCooldowns }
  for (const abilityId of Object.keys(next.abilities)) {
    const progress = next.abilities[abilityId]
    if (!progress || progress.rank <= 0) continue
    cooldowns[abilityId] = Math.max(0, (cooldowns[abilityId] ?? 0) - deltaMs)
  }
  next = { ...next, abilityCooldowns: cooldowns }

  for (const abilityId of Object.keys(next.abilities)) {
    const progress = next.abilities[abilityId]
    if (!progress || progress.rank <= 0) continue
    if ((next.abilityCooldowns[abilityId] ?? 0) > 0) continue
    if (!next.currentMonster) break
    next = fireAbility(next, abilityId, now, events, false)
  }

  return { state: { ...next, lastTickTimestamp: now }, events }
}

export function computeStatGainPerTrain(state: SimState): number {
  return (1 + state.recallCount * 0.1) * (1 + state.ascendCount * 0.5) * (1 + perkBonus(state, 'trainGain'))
}

export function createInitialState(): SimState {
  const zoneId = getDefaultZoneId()
  const zone = getZoneDef(zoneId)
  const stats = Object.fromEntries(STATS.map((s) => [s.id, 0])) as Record<StatId, number>
  const abilities = Object.fromEntries(ABILITIES.map((a) => [a.id, { rank: a.id === 'strike' || a.id === 'bolt' ? 1 : 0 }]))
  const gear = {
    weapon: null,
    armor: null,
    boots: null,
    gloves: null,
    focusItem: null,
    robe: null,
    amulet: null,
    ring: null,
    trinket1: null,
    trinket2: null,
  }
  return {
    saveVersion: 1,
    stamina: { current: BASE_STAMINA_CAP, max: BASE_STAMINA_CAP },
    mana: { current: BASE_MANA_CAP, max: BASE_MANA_CAP },
    playerHp: { current: BASE_HP_CAP, max: BASE_HP_CAP },
    fainted: false,
    focus: 0,
    stats,
    abilities,
    abilityCooldowns: {},
    combatMode: 'idle',
    currentZoneId: zoneId,
    unlockedZoneIds: [zoneId],
    depthMode: { auto: true },
    currentDepth: zone.minDepth,
    maxDepthByZone: {},
    gear,
    inventory: [],
    learnedAugmentIds: [],
    discoveredItemIds: [],
    recallCount: 0,
    ascendCount: 0,
    echoes: 0,
    echoesEarned: 0,
    sigils: 0,
    perkLevels: {},
    lastTickTimestamp: Date.now(),
    ...resetMonsterEncounter(zone, zone.minDepth),
  }
}

/** Resets everything a run builds up (stats, abilities, focus, depth). Gear, discoveries and zone unlocks are kept. */
function resetRun(state: SimState): SimState {
  const zone = getZoneDef(state.currentZoneId)
  const resetAbilities = Object.fromEntries(
    Object.keys(state.abilities).map((id) => [id, { rank: id === 'strike' || id === 'bolt' ? 1 : 0 }]),
  )
  return {
    ...state,
    stats: Object.fromEntries(Object.keys(state.stats).map((id) => [id, 0])) as Record<StatId, number>,
    abilities: resetAbilities,
    abilityCooldowns: {},
    focus: 0,
    stamina: { current: BASE_STAMINA_CAP, max: BASE_STAMINA_CAP },
    mana: { current: BASE_MANA_CAP, max: BASE_MANA_CAP },
    playerHp: { current: BASE_HP_CAP, max: BASE_HP_CAP },
    fainted: false,
    currentDepth: zone.minDepth,
    maxDepthByZone: {},
    ...resetMonsterEncounter(zone, zone.minDepth),
  }
}

/** Echoes a Recall would grant right now: the best zone's deepest depth, scaled by depth and zone tier. */
export function computeRecallEchoes(state: SimState): number {
  let best = 0
  for (const zone of ZONES) {
    const depth = getMaxDepthReached(state, zone)
    if (depth < RECALL_CONFIG.minDepth) continue
    const echoes = RECALL_CONFIG.baseEchoes * Math.pow(depth / RECALL_CONFIG.minDepth, RECALL_CONFIG.depthExponent) * zone.echoMultiplier
    best = Math.max(best, echoes)
  }
  return Math.floor(best * (1 + perkBonus(state, 'echoGain')))
}

export function canRecall(state: SimState): boolean {
  return computeRecallEchoes(state) > 0
}

export function recallRequiredDepth(): number {
  return RECALL_CONFIG.minDepth
}

/** Sigils an Ascend would grant right now, based on all Echoes earned since the last Ascend. */
export function computeAscendSigils(state: SimState): number {
  if (state.echoesEarned < ASCEND_CONFIG.minEchoesEarned) return 0
  return Math.floor(Math.sqrt(state.echoesEarned / ASCEND_CONFIG.echoesPerSigilSquared))
}

export function canAscend(state: SimState): boolean {
  return computeAscendSigils(state) > 0
}

export function ascendRequiredEchoes(): number {
  return ASCEND_CONFIG.minEchoesEarned
}

export function recall(state: SimState): SimState {
  const echoes = computeRecallEchoes(state)
  if (echoes <= 0) return state
  return {
    ...resetRun(state),
    recallCount: state.recallCount + 1,
    echoes: state.echoes + echoes,
    echoesEarned: state.echoesEarned + echoes,
  }
}

export function ascend(state: SimState): SimState {
  const sigils = computeAscendSigils(state)
  if (sigils <= 0) return state
  // Echo perks and unspent Echoes are lost; Sigil perks stay
  const keptPerks = Object.fromEntries(
    Object.entries(state.perkLevels).filter(([id]) => PERKS.find((p) => p.id === id)?.currency === 'sigils'),
  )
  return {
    ...resetRun(state),
    recallCount: 0,
    echoes: 0,
    echoesEarned: 0,
    perkLevels: keptPerks,
    sigils: state.sigils + sigils,
    ascendCount: state.ascendCount + 1,
  }
}

export function buyPerk(state: SimState, perkId: string): SimState {
  const perk = PERKS.find((p) => p.id === perkId)
  if (!perk) return state
  const level = state.perkLevels[perkId] ?? 0
  if (level >= perk.maxLevel) return state
  const cost = computePerkCost(perk, level)
  const balance = perk.currency === 'echoes' ? state.echoes : state.sigils
  if (balance < cost) return state
  return {
    ...state,
    echoes: perk.currency === 'echoes' ? state.echoes - cost : state.echoes,
    sigils: perk.currency === 'sigils' ? state.sigils - cost : state.sigils,
    perkLevels: { ...state.perkLevels, [perkId]: level + 1 },
  }
}

export function trainStat(state: SimState, statId: StatId): SimState {
  const cost = computeTrainCost(statId, state.stats[statId])
  if (state.focus < cost) return state
  const gain = computeStatGainPerTrain(state)
  return {
    ...state,
    focus: state.focus - cost,
    stats: { ...state.stats, [statId]: state.stats[statId] + gain },
  }
}

export function upgradeAbility(state: SimState, abilityId: string): SimState {
  const def = getAbilityDef(abilityId)
  const progress = state.abilities[abilityId] ?? { rank: 0 }
  if (progress.rank >= def.maxRank) return state
  const cost = computeAbilityRankCost(abilityId, progress.rank)
  if (state.focus < cost) return state
  return {
    ...state,
    focus: state.focus - cost,
    abilities: { ...state.abilities, [abilityId]: { rank: progress.rank + 1 } },
  }
}

export function equipItem(state: SimState, instanceId: string): SimState {
  const item = state.inventory.find((i) => i.instanceId === instanceId)
  if (!item) return state
  const slot = getGearCatalogItem(item.catalogId).slot
  const previous = state.gear[slot]
  const inventory = state.inventory.filter((i) => i.instanceId !== instanceId)
  return {
    ...state,
    gear: { ...state.gear, [slot]: item },
    inventory: previous ? [...inventory, previous] : inventory,
  }
}

export function unequipItem(state: SimState, slot: GearSlot): SimState {
  const item = state.gear[slot]
  if (!item) return state
  return {
    ...state,
    gear: { ...state.gear, [slot]: null },
    inventory: [...state.inventory, item],
  }
}

export function socketAugment(state: SimState, instanceId: string, augmentId: string): SimState {
  if (!state.learnedAugmentIds.includes(augmentId)) return state
  const applyTo = (item: GearItem): GearItem => {
    if (item.instanceId !== instanceId) return item
    const maxSlots = getRarityDef(getGearCatalogItem(item.catalogId).rarity).augmentSlots
    if (item.augmentIds.length >= maxSlots || item.augmentIds.includes(augmentId)) return item
    return { ...item, augmentIds: [...item.augmentIds, augmentId] }
  }
  const gear = Object.fromEntries(
    Object.entries(state.gear).map(([slot, item]) => [slot, item ? applyTo(item) : item]),
  ) as SimState['gear']
  const inventory = state.inventory.map(applyTo)
  return { ...state, gear, inventory }
}

export function selectZone(state: SimState, zoneId: string): SimState {
  if (!state.unlockedZoneIds.includes(zoneId)) return state
  const zone = getZoneDef(zoneId)
  return {
    ...state,
    currentZoneId: zoneId,
    currentDepth: zone.minDepth,
    ...resetMonsterEncounter(zone, zone.minDepth),
  }
}

export function setDepthMode(state: SimState, depthMode: DepthMode): SimState {
  const zone = getZoneDef(state.currentZoneId)
  const clampedMode: DepthMode = depthMode.auto
    ? depthMode
    : { auto: false, pinnedDepth: Math.min(getMaxDepthReached(state, zone), zone.maxDepth, Math.max(zone.minDepth, depthMode.pinnedDepth)) }
  const depth = clampedMode.auto ? state.currentDepth : clampedMode.pinnedDepth
  return {
    ...state,
    depthMode: clampedMode,
    currentDepth: depth,
    ...resetMonsterEncounter(zone, depth),
  }
}

export function simulateOfflineElapsed(state: SimState, elapsedMs: number): SimState {
  const STEP_MS = 1000
  let remaining = Math.max(0, elapsedMs)
  let current = state
  const now = Date.now()
  while (remaining > 0) {
    const step = Math.min(STEP_MS, remaining)
    const result = advanceTick(current, step, now)
    current = result.state
    remaining -= step
  }
  return current
}
