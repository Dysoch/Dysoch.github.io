
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

export type TabId = 'combat' | 'training' | 'abilities' | 'inventory' | 'zones' | 'crafting' | 'automation' | 'statistics' | 'prestige' | 'guide' | 'settings'

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
  /** Absent = a normal damage ability. */
  kind?: 'dot' | 'buff'
  /** Damage abilities: at/below this monster HP fraction, damage is multiplied by executeMultiplier. */
  executeThresholdPct?: number
  executeMultiplier?: number
  /** Damage abilities: leftover kill damage carries into the next monster, but never across a depth change. */
  overkill?: boolean
  /** kind: 'dot' */
  dotTicks?: number
  dotTickIntervalMs?: number
  /** kind: 'buff' */
  buffStatId?: PrimaryStat
  buffDurationMs?: number
}

export interface AbilityProgress {
  rank: number
}

export interface RarityDef {
  id: Rarity
  name: string
  color: string
  augmentSlots: number
  /** Relative weight when picking among multiple eligible drop candidates (default 1 if absent). Lets rare tiers stay rare even once depth-eligible. */
  dropWeight?: number
  /** Multiplier on level gained per duplicate fused in (default 1 if absent). Lets higher rarities level slower than common. */
  fuseRate?: number
  /** Level a duplicate-fused item of this rarity can never exceed (default uncapped if absent). Keeps a maxed-out lower tier from ever outscaling a fresh copy of the next tier, so reforging (where available) is never a net downgrade. */
  maxLevel?: number
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
  /** Catalog id of the item this reforges into at the next rarity tier, if any. */
  nextTierId?: string
  /** Zone whose maxDepthByZone entry gates reforging into this item (its own minDepth is the required depth). */
  zoneId?: string
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
  /** Levels from duplicate drops held back while duplicate handling is 'keep', applied by fusing. */
  pendingLevels?: number
}

/** What a duplicate gear drop does: wait on its item as pending levels, get salvaged, or fuse in right away. */
export type DuplicateMode = 'keep' | 'salvage' | 'fuse'

export type AutomationFeature = 'autoTrain' | 'autoAbilities' | 'autoFuse'

export interface AutomationSettings {
  duplicateMode: DuplicateMode
  autoTrain: boolean
  autoAbilities: boolean
  /** Relative priority per stat / ability (0 = never buy). The autobuyer picks the lowest cost ÷ weight. */
  statWeights: Record<StatId, number>
  abilityWeights: Record<string, number>
  /** Only buy while one purchase costs at most this % of current Focus (100 = spend freely). */
  maxCostPct: number
}

export interface AugmentDef {
  id: string
  name: string
  icon: string
  description: string
  statId: PrimaryStat | 'focusGain'
  magnitude: number
  /** [primary, secondary] materials spent to Imbue (raise the rank of) this augment */
  imbueMaterials?: [string, string]
}

export interface MilestoneTier {
  name: string
  threshold: number
  /** Added to perkBonus(effect) once reached */
  value: number
}

export interface MilestoneTrack {
  id: string
  /** Lifetime statistics counter this track follows */
  statKey: string
  label: string
  format?: 'time'
  effect: PerkEffect
  /** Reward text; {value} is replaced by value × displayScale */
  rewardLabel: string
  displayScale: number
  tiers: MilestoneTier[]
}

/** What happened during offline catch-up, shown once when the game is reopened. */
export interface OfflineSummary {
  elapsedMs: number
  /** True when the time away exceeded the offline cap and was cut short */
  capped: boolean
  kills: number
  bossKills: number
  focusEarned: number
  itemsFound: number
  duplicates: number
  itemsSalvaged: number
  materialsGathered: number
  faints: number
  depthBefore: number
  depthAfter: number
  deepestBefore: number
  deepestAfter: number
  statLevelsGained: number
  abilityRanksGained: number
  milestonesReached: string[]
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
  /** Zone unlocked by defeating this zone's Gate Boss (the boss at depth bossesRequiredToUnlockNext * bossEvery) */
  unlocksZoneId?: string
  /** Number of this zone's bosses (not a full maxDepth clear) that must fall before unlocksZoneId opens */
  bossesRequiredToUnlockNext?: number
}

export interface MaterialDef {
  id: string
  name: string
  description: string
}

export type PerkEffect =
  | 'trainGain'
  | 'focusGain'
  | 'hpCap'
  | 'dropChance'
  | 'echoGain'
  | 'damage'
  | 'critChance'
  | 'critDamage'
  | 'resistance'
  | 'lifeSteal'
  | 'materialFind'
  | 'regen'
  | 'staminaCap'
  | 'manaCap'
  | 'speed'
  | 'buffDuration'
  | 'bonusDotTicks'
  | 'overkillPower'
  | 'executeThreshold'

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
  | { kind: 'damage'; source: 'player' | 'monster'; amount: number; abilityId?: string; crit?: boolean; count?: number; timestamp: number }
  | { kind: 'loot'; item: GearItem; timestamp: number }
  | { kind: 'fuse'; catalogId: string; newLevel: number; count?: number; timestamp: number }
  | { kind: 'salvage'; catalogId: string; focusGained: number; materialId: string; materialsGained: number; timestamp: number }
  | { kind: 'crafted'; catalogId: string; count?: number; timestamp: number }
  | { kind: 'reforge'; fromCatalogId: string; toCatalogId: string; timestamp: number }
  | { kind: 'duplicateKept'; catalogId: string; pendingLevels: number; timestamp: number }
  | { kind: 'milestone'; milestoneId: string; timestamp: number }
  | { kind: 'imbued'; augmentId: string; newRank: number; timestamp: number }
  | { kind: 'kill'; monsterName: string; depth: number; timestamp: number }
  | { kind: 'levelUp'; statId: StatId; newLevel: number; timestamp: number }
  | { kind: 'bossDefeated'; depth: number; timestamp: number }
  | { kind: 'faint'; checkpointDepth: number; timestamp: number }
  | { kind: 'zoneUnlocked'; zoneId: string; timestamp: number }
  | { kind: 'recovered'; timestamp: number }
  | { kind: 'buff'; statId: PrimaryStat; magnitude: number; durationMs: number; timestamp: number }

export interface SimState {
  saveVersion: number
  stamina: ResourcePool
  mana: ResourcePool
  playerHp: ResourcePool
  fainted: boolean
  focus: number
  /** Trained value of each stat (times trained × the stat gain per train at the time). */
  stats: Record<StatId, number>
  /** Times each stat has been trained this run; drives the training cost. */
  statLevels: Record<StatId, number>
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
  activeBuffs: { statId: PrimaryStat; magnitude: number; remainingMs: number; sourceAbilityId: string }[]
  monsterDot: { damagePerTick: number; ticksRemaining: number; tickIntervalMs: number; msUntilNextTick: number } | null
  /** Advances by 1 every tick; used to rotate ability firing priority so one ability can't permanently starve the rest. */
  tickCount: number
  /** Deepest a Recall has ever been performed at, this Ascension. Drives Recall's permanent trainGain/damage bonus. */
  bestRecallDepth: number
  /** Most Echoes ever spent on a single Ascend (never reset by Ascend). Drives Ascend's permanent trainGain bonus. */
  bestAscendEchoes: number
  /** Highest boss HP ever defeated (never reset by Recall or Ascend). Drives a permanent, compounding damage bonus that keeps pace with monster scaling at extreme depth. */
  bestBossPowerDefeated: number
  automation: AutomationSettings
  /** Imbue rank per augment id (never reset); each rank strengthens that augment everywhere it's socketed */
  augmentRanks: Record<string, number>
  /** Milestone ids ("trackId:tierIndex") already reached (never reset) */
  milestonesReached: string[]
}

export type MainToWorkerMessage =
  | { type: 'INIT'; state: SimState }
  | { type: 'SET_DEPTH_MODE'; depthMode: DepthMode }
  | { type: 'SELECT_ZONE'; zoneId: string }
  | { type: 'TRAIN_STAT'; statId: StatId; count?: number }
  | { type: 'UPGRADE_ABILITY'; abilityId: string; count?: number }
  | { type: 'EQUIP_ITEM'; instanceId: string }
  | { type: 'UNEQUIP_ITEM'; slot: GearSlot }
  | { type: 'SOCKET_AUGMENT'; instanceId: string; augmentId: string }
  | { type: 'SALVAGE_ITEM'; instanceId: string }
  | { type: 'SALVAGE_ITEMS'; instanceIds: string[] }
  | { type: 'FUSE_ITEM'; instanceId: string }
  | { type: 'FUSE_ALL' }
  | { type: 'SET_AUTOMATION'; automation: Partial<AutomationSettings> }
  | { type: 'IMBUE_AUGMENT'; augmentId: string; count?: number }
  | { type: 'REFORGE_ITEM'; instanceId: string }
  | { type: 'RECALL' }
  | { type: 'ASCEND' }
  | { type: 'BUY_PERK'; perkId: string; count?: number }
  | { type: 'CRAFT_ITEM'; catalogId: string; count?: number }
  | { type: 'IMPORT_SAVE'; state: SimState }

export type WorkerToMainMessage =
  | { type: 'STATE_UPDATE'; state: SimState }
  | { type: 'EVENT'; event: CombatEvent }
  | { type: 'OFFLINE_SUMMARY'; summary: OfflineSummary }
