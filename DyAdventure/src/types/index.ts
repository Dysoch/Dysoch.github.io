
export type StatId = 'might' | 'grit' | 'arcana' | 'willpower' | 'fortune' | 'speed'

export type GearTrack = 'physical' | 'arcane'

export type GearSlot =
  | 'weapon'
  | 'armor'
  | 'boots'
  | 'gloves'
  | 'focusItem'
  | 'robe'
  | 'amulet'
  | 'ring'
  | 'trinket1'
  | 'trinket2'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type AbilityType = 'physical' | 'spell'

export type TabId = 'combat' | 'training' | 'abilities' | 'inventory' | 'zones' | 'crafting' | 'statistics' | 'prestige' | 'guide' | 'settings'

export type ExtraStat = 'critChance' | 'critDamage' | 'regen' | 'resistance' | 'lifeSteal' | 'focusGain' | 'materialFind'
export type PrimaryStat = StatId | 'staminaCap' | 'manaCap' | 'hpCap' | ExtraStat

export interface StatDef {
  id: StatId
  name: string
  icon: string
  description: string
  baseTrainCost: number
  trainCostMultiplier: number
}

export interface AbilityDef {
  id: string
  name: string
  icon: string
  description: string
  type: AbilityType
  resourceCost: number
  cooldownMs: number
  baseEffect: number
  effectPerRank: number
  baseRankCost: number
  rankCostMultiplier: number
  maxRank: number
}

export interface AbilityProgress {
  rank: number
}

export interface RarityDef {
  id: Rarity
  name: string
  color: string
  augmentSlots: number
}

export interface GearStatDef {
  statId: PrimaryStat
  value: number
}

export interface GearCatalogItemDef {
  id: string
  name: string
  icon: string
  slot: GearSlot
  track: GearTrack | 'universal'
  /** Every stat this item boosts (more stats on higher rarities) */
  stats: GearStatDef[]
  rarity: Rarity
  setId: string | null
  minDepth: number
  bossOnly?: boolean
}

export interface SetBonusDef {
  pieces: number
  statId: PrimaryStat
  magnitude: number
  description: string
}

export interface SetDef {
  id: string
  name: string
  description: string
  itemIds: string[]
  bonuses: SetBonusDef[]
}

export interface GearItem {
  instanceId: string
  catalogId: string
  level: number
  augmentIds: string[]
}

export interface AugmentDef {
  id: string
  name: string
  icon: string
  description: string
  statId: PrimaryStat | 'focusGain'
  magnitude: number
}

export interface ZoneDef {
  id: string
  name: string
  description: string
  minDepth: number
  maxDepth: number
  bossEvery: number
  baseMonsterPower: number
  perDepthGrowthPct: number
  bossPowerMultiplier: number
  baseMonsterDamage: number
  baseMonsterAttackIntervalMs: number
  bossAttackIntervalMultiplier: number
  monsterNames: string[]
  bossNames: string[]
  gearItemIds: string[]
  /** Multiplier applied to Echoes earned when Recalling from this zone */
  echoMultiplier: number
  materialDrops: { materialId: string; chance: number }[]
  /** Zone unlocked by defeating this zone's Gate Boss (the boss at maxDepth) */
  unlocksZoneId?: string
}

export interface MaterialDef {
  id: string
  name: string
  description: string
}

export type PerkEffect = 'trainGain' | 'focusGain' | 'hpCap' | 'dropChance' | 'echoGain' | 'damage'

export interface PerkDef {
  id: string
  name: string
  description: string
  currency: 'echoes' | 'sigils'
  maxLevel: number
  baseCost: number
  costMultiplier: number
  effect: PerkEffect
  perLevel: number
}

export interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

export interface ResourcePool {
  current: number
  max: number
}

export type DepthMode = { auto: true } | { auto: false; pinnedDepth: number }

export interface CurrentMonster {
  name: string
  isBoss: boolean
  hp: number
  maxHp: number
  depth: number
}

export type CombatEvent =
  | { kind: 'damage'; source: 'player' | 'monster'; amount: number; abilityId?: string; crit?: boolean; timestamp: number }
  | { kind: 'loot'; item: GearItem; timestamp: number }
  | { kind: 'fuse'; catalogId: string; newLevel: number; timestamp: number }
  | { kind: 'salvage'; catalogId: string; focusGained: number; materialId: string; materialsGained: number; timestamp: number }
  | { kind: 'crafted'; catalogId: string; timestamp: number }
  | { kind: 'kill'; monsterName: string; depth: number; timestamp: number }
  | { kind: 'levelUp'; statId: StatId; newLevel: number; timestamp: number }
  | { kind: 'bossDefeated'; depth: number; timestamp: number }
  | { kind: 'faint'; checkpointDepth: number; timestamp: number }
  | { kind: 'zoneUnlocked'; zoneId: string; timestamp: number }
  | { kind: 'recovered'; timestamp: number }

export interface SimState {
  saveVersion: number
  stamina: ResourcePool
  mana: ResourcePool
  playerHp: ResourcePool
  fainted: boolean
  focus: number
  stats: Record<StatId, number>
  abilities: Record<string, AbilityProgress>
  abilityCooldowns: Record<string, number>
  currentZoneId: string
  unlockedZoneIds: string[]
  depthMode: DepthMode
  currentDepth: number
  maxDepthByZone: Record<string, number>
  currentMonster: CurrentMonster | null
  monsterActionTimerMs: number
  depthClears: number
  depthClearsRequired: number
  descendCooldownMs: number
  gear: Record<GearSlot, GearItem | null>
  inventory: GearItem[]
  learnedAugmentIds: string[]
  discoveredItemIds: string[]
  recallCount: number
  ascendCount: number
  materials: Record<string, number>
  /** Lifetime counters for the Statistics page (never reset by Recall or Ascend) */
  lifetime: Record<string, number>
  /** Same counters, for the current run (since the last Recall) */
  runStats: Record<string, number>
  /** Counters of the run that ended with the last Recall or Ascend */
  lastRunStats: Record<string, number>
  echoes: number
  echoesEarned: number
  sigils: number
  perkLevels: Record<string, number>
  lastTickTimestamp: number
}

export type MainToWorkerMessage =
  | { type: 'INIT'; state: SimState }
  | { type: 'SET_DEPTH_MODE'; depthMode: DepthMode }
  | { type: 'SELECT_ZONE'; zoneId: string }
  | { type: 'TRAIN_STAT'; statId: StatId }
  | { type: 'UPGRADE_ABILITY'; abilityId: string }
  | { type: 'EQUIP_ITEM'; instanceId: string }
  | { type: 'UNEQUIP_ITEM'; slot: GearSlot }
  | { type: 'SOCKET_AUGMENT'; instanceId: string; augmentId: string }
  | { type: 'SALVAGE_ITEM'; instanceId: string }
  | { type: 'RECALL' }
  | { type: 'ASCEND' }
  | { type: 'BUY_PERK'; perkId: string }
  | { type: 'CRAFT_ITEM'; catalogId: string }
  | { type: 'IMPORT_SAVE'; state: SimState }

export type WorkerToMainMessage =
  | { type: 'STATE_UPDATE'; state: SimState }
  | { type: 'EVENT'; event: CombatEvent }
