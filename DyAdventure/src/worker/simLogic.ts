import statsData from '../content/stats.json'
import abilitiesData from '../content/abilities.json'
import gearData from '../content/gear.json'
import augmentsData from '../content/augments.json'
import zonesData from '../content/zones.json'
import prestigeData from '../content/prestige.json'
import materialsData from '../content/materials.json'
import {
  BASE_HP_CAP,
  DEPTH_CLEARS_MAX,
  DEPTH_CLEARS_MIN,
  DESCEND_COOLDOWN_MS,
  DESCEND_REGEN_MULTIPLIER,
  FAINT_RECOVERY_THRESHOLD_PCT,
  GRIT_DEFENSE_FACTOR,
  HP_REGEN_PCT_PER_SEC,
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
  GearStatDef,
  MaterialDef,
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
const MATERIALS = materialsData.materials as MaterialDef[]
const SLOT_MATERIALS = materialsData.slotMaterials as Record<GearSlot, [string, string]>
const CRAFT_COSTS = materialsData.craftCostByRarity as Record<string, { materials: number; focus: number }>
const RECALL_CONFIG = prestigeData.recall
const ASCEND_CONFIG = prestigeData.ascend

const BASE_STAMINA_CAP = 100
const BASE_MANA_CAP = 100
const REGEN_PCT_PER_SEC = 0.05

/** Adds to a statistics counter, both lifetime and for the current run (see the Statistics page). */
export function addStat(state: SimState, key: string, amount: number): SimState {
  return {
    ...state,
    lifetime: { ...state.lifetime, [key]: (state.lifetime[key] ?? 0) + amount },
    runStats: { ...state.runStats, [key]: (state.runStats[key] ?? 0) + amount },
  }
}

/** Raises a "best" counter (lifetime and current run) if the value is higher. */
function maxStat(state: SimState, key: string, value: number): SimState {
  const lifetime = (state.lifetime[key] ?? 0) >= value ? state.lifetime : { ...state.lifetime, [key]: value }
  const runStats = (state.runStats[key] ?? 0) >= value ? state.runStats : { ...state.runStats, [key]: value }
  if (lifetime === state.lifetime && runStats === state.runStats) return state
  return { ...state, lifetime, runStats }
}

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

export function listMaterials(): MaterialDef[] {
  return MATERIALS
}

export interface CraftCost {
  focus: number
  materials: { materialId: string; amount: number }[]
}

export function computeCraftCost(catalogId: string): CraftCost {
  const def = getGearCatalogItem(catalogId)
  const cost = CRAFT_COSTS[def.rarity] ?? CRAFT_COSTS.common
  const [primary, secondary] = SLOT_MATERIALS[def.slot]
  return {
    focus: cost.focus,
    materials: [
      { materialId: primary, amount: cost.materials },
      { materialId: secondary, amount: Math.ceil(cost.materials / 2) },
    ],
  }
}

/** Items the player can craft: discovered, and not a boss-only unique. */
export function listCraftableItems(state: SimState): GearCatalogItemDef[] {
  return GEAR_ITEMS.filter((i) => !i.bossOnly && state.discoveredItemIds.includes(i.id))
}

export function canAffordCraft(state: SimState, catalogId: string): boolean {
  const cost = computeCraftCost(catalogId)
  return state.focus >= cost.focus && cost.materials.every((m) => (state.materials[m.materialId] ?? 0) >= m.amount)
}

/** Total cost to craft `count` copies of an item (cost per copy is flat, so this is just cost × count). */
export function computeCraftCostN(catalogId: string, count: number): CraftCost {
  const cost = computeCraftCost(catalogId)
  return {
    focus: cost.focus * count,
    materials: cost.materials.map((m) => ({ materialId: m.materialId, amount: m.amount * count })),
  }
}

/** How many copies of an item can be crafted in a row with the current Focus and material balances. */
export function computeMaxCraftCount(state: SimState, catalogId: string): number {
  const cost = computeCraftCost(catalogId)
  let max = cost.focus > 0 ? Math.floor(state.focus / cost.focus) : Number.MAX_SAFE_INTEGER
  for (const m of cost.materials) {
    if (m.amount <= 0) continue
    const have = state.materials[m.materialId] ?? 0
    max = Math.min(max, Math.floor(have / m.amount))
  }
  return Math.max(0, max)
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

/** Total cost to raise a perk by up to `count` levels (capped at maxLevel), starting from currentLevel. */
export function computePerkCostN(perk: PerkDef, currentLevel: number, count: number): number {
  let total = 0
  let level = currentLevel
  for (let i = 0; i < count && level < perk.maxLevel; i++, level++) total += computePerkCost(perk, level)
  return total
}

/** How many levels can be afforded in a row (capped at maxLevel) with the given currency balance. */
export function computeMaxPerkCount(perk: PerkDef, currentLevel: number, balance: number): number {
  let remaining = balance
  let level = currentLevel
  let count = 0
  while (level < perk.maxLevel) {
    const cost = computePerkCost(perk, level)
    if (cost > remaining) break
    remaining -= cost
    level++
    count++
  }
  return count
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

/** Total cost to train `count` times in a row, starting from currentLevel. */
export function computeTrainCostN(statId: StatId, currentLevel: number, count: number): number {
  let total = 0
  for (let i = 0; i < count; i++) total += computeTrainCost(statId, currentLevel + i)
  return total
}

/** How many times training can be afforded in a row with the given Focus balance. */
export function computeMaxTrainCount(statId: StatId, currentLevel: number, focus: number): number {
  let remaining = focus
  let count = 0
  while (true) {
    const cost = computeTrainCost(statId, currentLevel + count)
    if (cost > remaining) break
    remaining -= cost
    count++
  }
  return count
}

export function computeAbilityRankCost(abilityId: string, currentRank: number): number {
  const def = getAbilityDef(abilityId)
  return Math.floor(def.baseRankCost * Math.pow(def.rankCostMultiplier, currentRank))
}

/** Total cost to raise an ability by up to `count` ranks (capped at maxRank), starting from currentRank. */
export function computeAbilityRankCostN(abilityId: string, currentRank: number, count: number): number {
  const def = getAbilityDef(abilityId)
  let total = 0
  let rank = currentRank
  for (let i = 0; i < count && rank < def.maxRank; i++, rank++) total += computeAbilityRankCost(abilityId, rank)
  return total
}

/** How many ranks can be afforded in a row (capped at maxRank) with the given Focus balance. */
export function computeMaxAbilityCount(abilityId: string, currentRank: number, focus: number): number {
  const def = getAbilityDef(abilityId)
  let remaining = focus
  let rank = currentRank
  let count = 0
  while (rank < def.maxRank) {
    const cost = computeAbilityRankCost(abilityId, rank)
    if (cost > remaining) break
    remaining -= cost
    rank++
    count++
  }
  return count
}

/** Every stat an owned item gives, scaled by its level (+1% per level). */
export function effectiveGearStats(item: GearItem): GearStatDef[] {
  const catalogDef = getGearCatalogItem(item.catalogId)
  const levelScale = 1 + 0.01 * (item.level - 1)
  return catalogDef.stats.map((s) => ({ statId: s.statId, value: s.value * levelScale }))
}

/** Per-stat difference between two items (item minus other); stats only one of them has count as 0 on the other. */
export function compareGear(item: GearItem, other: GearItem | null): GearStatDef[] {
  const mine = effectiveGearStats(item)
  const theirs = other ? effectiveGearStats(other) : []
  const ids = [...new Set([...mine, ...theirs].map((s) => s.statId))]
  const valueOf = (list: GearStatDef[], id: PrimaryStat) => list.find((s) => s.statId === id)?.value ?? 0
  return ids.map((id) => ({ statId: id, value: valueOf(mine, id) - valueOf(theirs, id) })).filter((d) => Math.abs(d.value) > 0.005)
}

const CAP_LABELS: Record<string, string> = {
  staminaCap: 'Stamina Cap',
  manaCap: 'Mana Cap',
  hpCap: 'HP Cap',
  critChance: 'Crit Chance',
  critDamage: 'Crit Damage',
  regen: 'Regeneration',
  resistance: 'Resistance',
  lifeSteal: 'Life Steal',
  focusGain: 'Focus Gain',
  materialFind: 'Material Find',
}

export function getStatLabel(statId: PrimaryStat): string {
  if (statId in CAP_LABELS) return CAP_LABELS[statId]
  return STATS.find((s) => s.id === statId)?.name ?? statId
}

export function gearBonusForStat(state: SimState, statId: PrimaryStat): number {
  let base = 0
  let augmentMultiplier = 1
  for (const item of Object.values(state.gear)) {
    if (!item) continue
    for (const stat of effectiveGearStats(item)) {
      if (stat.statId === statId) base += stat.value
    }
    for (const augId of item.augmentIds) {
      const aug = getAugmentDef(augId)
      if (aug.statId === statId && statId !== 'focusGain') augmentMultiplier += aug.magnitude
    }
  }
  return base * augmentMultiplier
}

export function focusGainMultiplier(state: SimState): number {
  let multiplier = 1 + perkBonus(state, 'focusGain') + bonusFor(state, 'focusGain') * 0.01
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

/** Sum of active temporary buffs (from 'buff'-kind abilities) for one stat. */
export function buffBonusForStat(state: SimState, statId: PrimaryStat): number {
  let total = 0
  for (const buff of state.activeBuffs) {
    if (buff.statId === statId) total += buff.magnitude
  }
  return total
}

/** Gear plus set plus active-buff bonuses for one stat. */
export function bonusFor(state: SimState, statId: PrimaryStat): number {
  return gearBonusForStat(state, statId) + computeSetBonusForStat(state, statId) + buffBonusForStat(state, statId)
}

/** Chance (0-0.75) that an ability hit is a critical hit: +0.5% per point, plus perks. */
export function computeCritChance(state: SimState): number {
  return Math.min(0.75, bonusFor(state, 'critChance') * 0.005 + perkBonus(state, 'critChance'))
}

/** Damage multiplier on a crit: 1.5x base, +2% per point of Crit Damage, plus perks. */
export function computeCritMultiplier(state: SimState): number {
  return 1.5 + bonusFor(state, 'critDamage') * 0.02 + perkBonus(state, 'critDamage')
}

/** Damage reduction (0-0.6): 0.5% per point of Resistance, plus perks. */
export function computeResistance(state: SimState): number {
  return Math.min(0.6, bonusFor(state, 'resistance') * 0.005 + perkBonus(state, 'resistance'))
}

/** Regeneration speed multiplier for HP, Stamina and Mana: +1% per point, plus perks. */
export function computeRegenMultiplier(state: SimState): number {
  return 1 + bonusFor(state, 'regen') * 0.01 + perkBonus(state, 'regen')
}

/** Fraction of max HP healed per ability hit: 0.1% per point of Life Steal, plus perks. */
export function computeLifeStealPct(state: SimState): number {
  return bonusFor(state, 'lifeSteal') * 0.001 + perkBonus(state, 'lifeSteal')
}

/** Multiplier on material drop chance: +1% per point of Material Find, plus perks. */
export function computeMaterialFindMultiplier(state: SimState): number {
  return 1 + bonusFor(state, 'materialFind') * 0.01 + perkBonus(state, 'materialFind')
}

export function computeEffectiveStat(state: SimState, statId: StatId): number {
  return state.stats[statId] + computeSetBonusForStat(state, statId)
}

export function computeStaminaCap(state: SimState): number {
  return BASE_STAMINA_CAP + gearBonusForStat(state, 'staminaCap') + computeSetBonusForStat(state, 'staminaCap') + perkBonus(state, 'staminaCap')
}

export function computeManaCap(state: SimState): number {
  const totalWillpower = computeEffectiveStat(state, 'willpower') + gearBonusForStat(state, 'willpower')
  return BASE_MANA_CAP + gearBonusForStat(state, 'manaCap') + computeSetBonusForStat(state, 'manaCap') + perkBonus(state, 'manaCap') + totalWillpower * 1.5
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
  const speed = computeEffectiveStat(state, 'speed') + gearBonusForStat(state, 'speed') + buffBonusForStat(state, 'speed') + perkBonus(state, 'speed')
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
  return (rawDamage / (1 + totalGrit * GRIT_DEFENSE_FACTOR)) * (1 - computeResistance(state))
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

/** Boss floors are a single fight; every other floor needs a random number of clears before descending. */
function rollClearsRequired(zone: ZoneDef, depth: number): number {
  if (isBossDepth(zone, depth)) return 1
  return DEPTH_CLEARS_MIN + Math.floor(Math.random() * (DEPTH_CLEARS_MAX - DEPTH_CLEARS_MIN + 1))
}

type EncounterFields = Pick<SimState, 'currentMonster' | 'monsterActionTimerMs' | 'depthClears' | 'depthClearsRequired' | 'descendCooldownMs'>

/** Fresh encounter on a (new) depth: resets the clear counter and any descend cooldown. */
function resetMonsterEncounter(zone: ZoneDef, depth: number): EncounterFields {
  return {
    currentMonster: spawnMonster(zone, depth),
    monsterActionTimerMs: 0,
    depthClears: 0,
    depthClearsRequired: rollClearsRequired(zone, depth),
    descendCooldownMs: 0,
  }
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
  const totalValue = catalogDef.stats.reduce((sum, s) => sum + s.value, 0)
  return Math.max(1, Math.round(totalValue * item.level * (rarityWeight[catalogDef.rarity] ?? 1)))
}

export function salvageItem(state: SimState, instanceId: string): { state: SimState; event: CombatEvent | null } {
  const index = state.inventory.findIndex((i) => i.instanceId === instanceId)
  if (index < 0) return { state, event: null }
  const item = state.inventory[index]
  const focusGained = computeSalvageValue(item)
  const inventory = state.inventory.filter((i) => i.instanceId !== instanceId)
  const materialId = SLOT_MATERIALS[getGearCatalogItem(item.catalogId).slot][0]
  const materialsGained = Math.max(1, Math.round(focusGained / materialsData.salvageMaterialDivisor))
  const next = {
    ...state,
    inventory,
    focus: state.focus + focusGained,
    materials: { ...state.materials, [materialId]: (state.materials[materialId] ?? 0) + materialsGained },
  }
  const tracked = addStat(addStat(addStat(next, 'itemsSalvaged', 1), 'focusEarned', focusGained), `material_${materialId}_gathered`, materialsGained)
  return { state: tracked, event: { kind: 'salvage', catalogId: item.catalogId, focusGained, materialId, materialsGained, timestamp: Date.now() } }
}

function applyRegen(state: SimState, baseDeltaSeconds: number): SimState {
  const deltaSeconds = baseDeltaSeconds * computeRegenMultiplier(state)
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

/** Adds a catalog item to the player `count` times: fuses into an owned copy (level += count) or creates a new inventory item at that level. */
function grantGearItem(state: SimState, catalogEntry: GearCatalogItemDef, now: number, events: CombatEvent[], count: number = 1): SimState {
  let next = state
  if (!next.discoveredItemIds.includes(catalogEntry.id)) {
    next = { ...next, discoveredItemIds: [...next.discoveredItemIds, catalogEntry.id] }
  }
  const equippedSlot = (Object.keys(next.gear) as GearSlot[]).find((slot) => next.gear[slot]?.catalogId === catalogEntry.id)
  const inventoryIndex = next.inventory.findIndex((i) => i.catalogId === catalogEntry.id)

  if (equippedSlot) {
    const existing = next.gear[equippedSlot]!
    const leveled = { ...existing, level: existing.level + count }
    next = { ...next, gear: { ...next.gear, [equippedSlot]: leveled } }
    events.push({ kind: 'fuse', catalogId: catalogEntry.id, newLevel: leveled.level, count, timestamp: now })
    next = addStat(next, 'itemsFused', count)
  } else if (inventoryIndex >= 0) {
    const existing = next.inventory[inventoryIndex]
    const leveled = { ...existing, level: existing.level + count }
    const inventory = [...next.inventory]
    inventory[inventoryIndex] = leveled
    next = { ...next, inventory }
    events.push({ kind: 'fuse', catalogId: catalogEntry.id, newLevel: leveled.level, count, timestamp: now })
    next = addStat(next, 'itemsFused', count)
  } else {
    const newItem: GearItem = {
      instanceId: `${catalogEntry.id}_${now}_${Math.floor(Math.random() * 1e6)}`,
      catalogId: catalogEntry.id,
      level: count,
      augmentIds: [],
    }
    next = { ...next, inventory: [...next.inventory, newItem] }
    events.push({ kind: 'loot', item: newItem, timestamp: now })
    next = addStat(next, 'itemsFound', 1)
    if (count > 1) next = addStat(next, 'itemsFused', count - 1)
  }
  return next
}

function rollMaterialDrops(state: SimState, zone: ZoneDef, depth: number, isBoss: boolean): SimState {
  const amount = (1 + Math.floor(depth / materialsData.killDropDepthStep)) * (isBoss ? materialsData.bossDropMultiplier : 1)
  let next = state
  for (const drop of zone.materialDrops) {
    if (Math.random() < Math.min(1, drop.chance * computeMaterialFindMultiplier(state))) {
      next = { ...next, materials: { ...next.materials, [drop.materialId]: (next.materials[drop.materialId] ?? 0) + amount } }
      next = addStat(next, `material_${drop.materialId}_gathered`, amount)
    }
  }
  return next
}

export function craftItem(state: SimState, catalogId: string, now: number, count: number = 1): { state: SimState; events: CombatEvent[] } {
  const events: CombatEvent[] = []
  const def = GEAR_ITEMS.find((i) => i.id === catalogId)
  if (!def || def.bossOnly || !state.discoveredItemIds.includes(catalogId)) {
    return { state, events }
  }
  const actual = Math.min(count, computeMaxCraftCount(state, catalogId))
  if (actual <= 0) return { state, events }

  const cost = computeCraftCostN(catalogId, actual)
  const materials = { ...state.materials }
  for (const m of cost.materials) materials[m.materialId] = (materials[m.materialId] ?? 0) - m.amount
  const paid = addStat(addStat({ ...state, focus: state.focus - cost.focus, materials }, 'itemsCrafted', actual), 'focusSpent', cost.focus)
  events.push({ kind: 'crafted', catalogId, count: actual, timestamp: now })
  return { state: grantGearItem(paid, def, now, events, actual), events }
}

function handleMonsterDeath(state: SimState, now: number, events: CombatEvent[]): SimState {
  const monster = state.currentMonster
  if (!monster) return state
  const zone = getZoneDef(state.currentZoneId)
  const focusGained = computeFocusReward(state, monster.depth)
  events.push({ kind: 'kill', monsterName: monster.name, depth: monster.depth, timestamp: now })

  let next: SimState = addStat(addStat(addStat({ ...state, focus: state.focus + focusGained }, 'kills', 1), `kills_${zone.id}`, 1), 'focusEarned', focusGained)
  if (monster.isBoss) {
    events.push({ kind: 'bossDefeated', depth: monster.depth, timestamp: now })
    next = addStat(next, 'bossKills', 1)
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
    next = grantGearItem(next, catalogEntry, now, events)
  }

  next = rollMaterialDrops(next, zone, monster.depth, monster.isBoss)

  const nextDepth = next.depthMode.auto
    ? Math.min(zone.maxDepth, next.currentDepth + 1)
    : next.depthMode.pinnedDepth

  const clears = next.depthClears + 1
  // Still clearing this floor
  if (clears < next.depthClearsRequired) {
    return { ...next, depthClears: clears, currentMonster: spawnMonster(zone, next.currentDepth), monsterActionTimerMs: 0 }
  }
  // Pinned depth (or bottom floor): keep farming it
  if (nextDepth === next.currentDepth) {
    return { ...next, ...resetMonsterEncounter(zone, nextDepth) }
  }
  // Descend: brief cooldown with no monster, so HP and resources can recover
  const maxDepthByZone = { ...next.maxDepthByZone, [zone.id]: Math.max(getMaxDepthReached(next, zone), nextDepth) }
  return maxStat({
    ...next,
    currentDepth: nextDepth,
    maxDepthByZone,
    currentMonster: null,
    monsterActionTimerMs: 0,
    depthClears: 0,
    depthClearsRequired: rollClearsRequired(zone, nextDepth),
    descendCooldownMs: DESCEND_COOLDOWN_MS,
  }, `deepest_${zone.id}`, nextDepth)
}

/**
 * Applies damage to the current monster. On a kill, any bleed on that target ends, and if
 * `overkill` is set and the kill left leftover damage and a new monster spawned on the same
 * depth (not a depth transition), the leftover chains into it — recursively, so one big hit can
 * clear several monsters, but it never spills across a depth change.
 */
function applyDamageToMonster(
  state: SimState,
  damage: number,
  now: number,
  events: CombatEvent[],
  depthAtStart: number,
  overkill: boolean,
): SimState {
  if (!state.currentMonster) return state
  const remainingHp = state.currentMonster.hp - damage
  if (remainingHp > 0) {
    return { ...state, currentMonster: { ...state.currentMonster, hp: remainingHp } }
  }
  let next = handleMonsterDeath({ ...state, monsterDot: null }, now, events)
  const spillover = overkill ? -remainingHp * (1 + perkBonus(state, 'overkillPower')) : -remainingHp
  if (overkill && spillover > 0 && next.currentMonster && next.currentDepth === depthAtStart) {
    next = applyDamageToMonster(next, spillover, now, events, depthAtStart, overkill)
  }
  return next
}

/** kind: 'dot' — sets/refreshes the bleed on the current monster (no stacking). */
function applyDot(state: SimState, def: AbilityDef): SimState {
  const damagePerTick = computeAbilityDamage(state, def.id)
  const tickIntervalMs = def.dotTickIntervalMs ?? 1000
  const ticksRemaining = (def.dotTicks ?? 0) + Math.round(perkBonus(state, 'bonusDotTicks'))
  return {
    ...state,
    monsterDot: { damagePerTick, ticksRemaining, tickIntervalMs, msUntilNextTick: tickIntervalMs },
  }
}

/** kind: 'buff' — upserts (by ability id) a temporary stat bonus in activeBuffs. */
function applyBuff(state: SimState, def: AbilityDef, rank: number, now: number, events: CombatEvent[]): SimState {
  const magnitude = def.baseEffect + def.effectPerRank * (rank - 1)
  const durationMs = (def.buffDurationMs ?? 0) * (1 + perkBonus(state, 'buffDuration'))
  const statId = def.buffStatId!
  events.push({ kind: 'buff', statId, magnitude, durationMs, timestamp: now })
  return {
    ...state,
    activeBuffs: [
      ...state.activeBuffs.filter((b) => b.sourceAbilityId !== def.id),
      { statId, magnitude, remainingMs: durationMs, sourceAbilityId: def.id },
    ],
  }
}

function fireAbility(state: SimState, abilityId: string, now: number, events: CombatEvent[]): SimState {
  if (state.fainted || !state.currentMonster) return state
  const def = getAbilityDef(abilityId)
  const progress = state.abilities[abilityId]
  if (!progress || progress.rank <= 0) return state
  if ((state.abilityCooldowns[abilityId] ?? 0) > 0) return state

  const pool = def.type === 'physical' ? state.stamina : state.mana
  if (pool.current < def.resourceCost) {
    return state
  }

  const spentPool = { ...pool, current: pool.current - def.resourceCost }
  const cooldownMs = computeEffectiveCooldownMs(state, abilityId)
  const abilityCooldowns = { ...state.abilityCooldowns, [abilityId]: cooldownMs }
  let next: SimState =
    def.type === 'physical'
      ? { ...state, stamina: spentPool, abilityCooldowns }
      : { ...state, mana: spentPool, abilityCooldowns }

  if (def.kind === 'dot') return applyDot(next, def)
  if (def.kind === 'buff') return applyBuff(next, def, progress.rank, now, events)

  const crit = Math.random() < computeCritChance(next)
  let damage = computeAbilityDamage(next, abilityId) * (crit ? computeCritMultiplier(next) : 1)
  if (def.executeThresholdPct != null && def.executeMultiplier != null) {
    const hpPct = next.currentMonster!.hp / next.currentMonster!.maxHp
    if (hpPct <= def.executeThresholdPct + perkBonus(next, 'executeThreshold')) damage *= def.executeMultiplier
  }
  events.push({ kind: 'damage', source: 'player', amount: damage, abilityId, crit, timestamp: now })

  next = addStat(maxStat(next, 'highestHit', damage), 'damageDealt', damage)
  next = addStat(addStat(next, 'abilityUses', 1), `ability_${abilityId}_uses`, 1)

  if (crit) next = addStat(next, 'crits', 1)
  const lifeSteal = computeLifeStealPct(next)
  if (lifeSteal > 0) {
    const hpMax = computeHpCap(next)
    next = { ...next, playerHp: { max: hpMax, current: Math.min(hpMax, next.playerHp.current + hpMax * lifeSteal) } }
  }

  return applyDamageToMonster(next, damage, now, events, next.currentDepth, !!def.overkill)
}

export interface TickResult {
  state: SimState
  events: CombatEvent[]
}

/** Ticks down remainingMs on every active buff, dropping expired ones. */
function decayBuffs(state: SimState, deltaMs: number): SimState {
  if (state.activeBuffs.length === 0) return state
  const activeBuffs = state.activeBuffs
    .map((b) => ({ ...b, remainingMs: b.remainingMs - deltaMs }))
    .filter((b) => b.remainingMs > 0)
  return { ...state, activeBuffs }
}

/**
 * Applies any due bleed ticks (there may be several if deltaMs is large, e.g. offline catch-up).
 * A tick that kills the monster ends the bleed and does not carry over to whatever spawns next.
 */
function tickMonsterDot(state: SimState, deltaMs: number, now: number, events: CombatEvent[]): SimState {
  let next = state
  let remaining = deltaMs
  while (next.monsterDot && next.currentMonster && remaining >= next.monsterDot.msUntilNextTick) {
    const dot = next.monsterDot
    remaining -= dot.msUntilNextTick
    events.push({ kind: 'damage', source: 'player', amount: dot.damagePerTick, timestamp: now })
    next = applyDamageToMonster(next, dot.damagePerTick, now, events, next.currentDepth, false)
    if (next.monsterDot) {
      const ticksRemaining = next.monsterDot.ticksRemaining - 1
      next = {
        ...next,
        monsterDot: ticksRemaining > 0 ? { ...next.monsterDot, ticksRemaining, msUntilNextTick: next.monsterDot.tickIntervalMs } : null,
      }
    }
  }
  if (next.monsterDot && remaining > 0) {
    next = { ...next, monsterDot: { ...next.monsterDot, msUntilNextTick: next.monsterDot.msUntilNextTick - remaining } }
  }
  return next
}

export function advanceTick(state: SimState, deltaMs: number, now: number): TickResult {
  const events: CombatEvent[] = []
  let next = decayBuffs(addStat(applyRegen(state, deltaMs / 1000), 'timeMs', deltaMs), deltaMs)

  if (next.descendCooldownMs > 0) {
    // Cooldown between floors: extra regen, no monster, nothing attacks
    const remaining = Math.max(0, next.descendCooldownMs - deltaMs)
    next = applyRegen(next, (deltaMs / 1000) * (DESCEND_REGEN_MULTIPLIER - 1))
    next = { ...next, descendCooldownMs: remaining }
    if (remaining === 0) {
      const zone = getZoneDef(next.currentZoneId)
      next = { ...next, currentMonster: spawnMonster(zone, next.currentDepth), monsterActionTimerMs: 0 }
    }
    return { state: { ...next, lastTickTimestamp: now }, events }
  }

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
    next = addStat({ ...next, playerHp: { ...next.playerHp, current: newHp } }, 'damageTaken', dmg)
    if (newHp <= 0) {
      const checkpointDepth = getCheckpointDepth(zone, monster.depth)
      next = {
        ...next,
        fainted: true,
        currentDepth: checkpointDepth,
        depthMode: next.depthMode.auto ? next.depthMode : { auto: false, pinnedDepth: Math.min(next.depthMode.pinnedDepth, checkpointDepth) },
        monsterDot: null,
        ...resetMonsterEncounter(zone, checkpointDepth),
      }
      events.push({ kind: 'faint', checkpointDepth, timestamp: now })
      next = addStat(next, 'faints', 1)
    }
  }
  next = { ...next, monsterActionTimerMs: monsterTimer }

  if (next.fainted) {
    return { state: { ...next, lastTickTimestamp: now }, events }
  }

  next = tickMonsterDot(next, deltaMs, now, events)

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
    next = fireAbility(next, abilityId, now, events)
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
    materials: {},
    lifetime: {},
    runStats: {},
    lastRunStats: {},
    echoes: 0,
    echoesEarned: 0,
    sigils: 0,
    perkLevels: {},
    lastTickTimestamp: Date.now(),
    activeBuffs: [],
    monsterDot: null,
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
    lastRunStats: state.runStats,
    runStats: {},
    activeBuffs: [],
    monsterDot: null,
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
  const counted = addStat(addStat(state, 'recalls', 1), 'echoesEarnedTotal', echoes)
  return {
    ...resetRun(counted),
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
  const counted = addStat(addStat(state, 'ascends', 1), 'sigilsEarnedTotal', sigils)
  return {
    ...resetRun(counted),
    recallCount: 0,
    echoes: 0,
    echoesEarned: 0,
    perkLevels: keptPerks,
    sigils: state.sigils + sigils,
    ascendCount: state.ascendCount + 1,
  }
}

export function buyPerk(state: SimState, perkId: string, count: number = 1): SimState {
  const perk = PERKS.find((p) => p.id === perkId)
  if (!perk) return state
  const level = state.perkLevels[perkId] ?? 0
  const balance = perk.currency === 'echoes' ? state.echoes : state.sigils
  const actual = Math.min(count, computeMaxPerkCount(perk, level, balance))
  if (actual <= 0) return state
  const cost = computePerkCostN(perk, level, actual)
  return {
    ...state,
    echoes: perk.currency === 'echoes' ? state.echoes - cost : state.echoes,
    sigils: perk.currency === 'sigils' ? state.sigils - cost : state.sigils,
    perkLevels: { ...state.perkLevels, [perkId]: level + actual },
  }
}

export function trainStat(state: SimState, statId: StatId, count: number = 1): SimState {
  const actual = Math.min(count, computeMaxTrainCount(statId, state.stats[statId], state.focus))
  if (actual <= 0) return state
  const cost = computeTrainCostN(statId, state.stats[statId], actual)
  const gain = computeStatGainPerTrain(state) * actual
  return addStat({
    ...state,
    focus: state.focus - cost,
    stats: { ...state.stats, [statId]: state.stats[statId] + gain },
  }, 'focusSpent', cost)
}

export function upgradeAbility(state: SimState, abilityId: string, count: number = 1): SimState {
  const progress = state.abilities[abilityId] ?? { rank: 0 }
  const actual = Math.min(count, computeMaxAbilityCount(abilityId, progress.rank, state.focus))
  if (actual <= 0) return state
  const cost = computeAbilityRankCostN(abilityId, progress.rank, actual)
  return addStat({
    ...state,
    focus: state.focus - cost,
    abilities: { ...state.abilities, [abilityId]: { rank: progress.rank + actual } },
  }, 'focusSpent', cost)
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
