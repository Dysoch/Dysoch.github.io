import { describe, test, expect } from 'vitest'
import {
  createInitialState,
  advanceTick,
  computeTrainCost,
  computeTrainCostN,
  computeMaxTrainCount,
  computeAbilityRankCost,
  computeAbilityRankCostN,
  computeMaxAbilityCount,
  computeCraftCost,
  computeCraftCostN,
  computeMaxCraftCount,
  craftItem,
  computeReforgeCost,
  computeReforgeDepthRequirement,
  reforgeItem,
  pickWeighted,
  effectiveGearStats,
  computePerkCost,
  computePerkCostN,
  computeMaxPerkCount,
  listPerks,
  computeCritChance,
  computeCritMultiplier,
  computeResistance,
  computeRegenMultiplier,
  computeLifeStealPct,
  computeMaterialFindMultiplier,
  computeHpCap,
  computeStaminaCap,
  computeManaCap,
  computeEffectiveCooldownMs,
  computeAbilityDamage,
  computeStatGainPerTrain,
  focusGainMultiplier,
  computeRecallEchoes,
  recall,
  ascend,
  ascendRequiredEchoes,
  canAscend,
  computeBossPowerMultiplier,
  zoneGateDepth,
  getZoneDef,
  trainStat,
  migrateSave,
  computeFuseRate,
  getTierChain,
  fuseAll,
  salvageItem,
  setAutomation,
  runAutobuyers,
  defaultAutomation,
  listWorseItems,
  automationUnlockRecalls,
  computeFuseRoomCopies,
  perkBonus,
  listMilestoneTracks,
  milestoneId,
  imbueAugment,
  computeImbueCostN,
  computeMaxImbueCount,
  computeAugmentMagnitude,
  gearBonusForStat,
  summarizeOffline,
  simulateOfflineElapsed,
  computeEchoRatePerHour,
  overflowSalvagedKey,
  getGearCatalogItem,
} from './simLogic'
import abilitiesData from '../content/abilities.json'
import gearData from '../content/gear.json'
import type { AbilityDef, GearCatalogItemDef, PerkEffect, RarityDef, SimState } from '../types'

const ABILITIES = abilitiesData as AbilityDef[]

/** All abilities at rank 0, so a test can turn on only the ones it cares about. */
function zeroedAbilities(state: SimState): SimState['abilities'] {
  return Object.fromEntries(Object.keys(state.abilities).map((id) => [id, { rank: 0 }]))
}

describe('ability firing fairness (regression: fixed-order firing let cheap abilities starve the rest)', () => {
  test('every ranked ability in a pool eventually fires, not just the first ones in abilities.json', () => {
    const physicalIds = ABILITIES.filter((a) => a.type === 'physical').map((a) => a.id)
    let state: SimState = {
      ...createInitialState(),
      abilities: Object.fromEntries(Object.keys(createInitialState().abilities).map((id) => [id, { rank: physicalIds.includes(id) ? 5 : 0 }])),
    }
    let now = Date.now()
    for (let i = 0; i < 300; i++) {
      // 30 simulated seconds
      state = advanceTick(state, 100, now).state
      now += 100
    }
    for (const id of physicalIds) {
      expect(state.lifetime[`ability_${id}_uses`] ?? 0, `${id} never fired`).toBeGreaterThan(0)
    }
  })
})

describe('ability-uses stat coverage (regression: dot/buff kinds never incremented their own counter)', () => {
  test('dot and buff kind abilities increment ability_<id>_uses and the abilityUses total', () => {
    const base = createInitialState()
    let state: SimState = { ...base, abilities: { ...zeroedAbilities(base), rend: { rank: 5 }, battle_focus: { rank: 5 } } }
    let now = Date.now()
    for (let i = 0; i < 300; i++) {
      state = advanceTick(state, 100, now).state
      now += 100
    }
    expect(state.lifetime['ability_rend_uses'] ?? 0).toBeGreaterThan(0)
    expect(state.lifetime['ability_battle_focus_uses'] ?? 0).toBeGreaterThan(0)
    expect(state.lifetime['abilityUses'] ?? 0).toBeGreaterThan(0)
  })
})

describe('DoT (bleed)', () => {
  test('ticks for damage and clears without carrying to the next monster when a tick kills the target', () => {
    const base = createInitialState()
    let state: SimState = { ...base, abilities: { ...zeroedAbilities(base), rend: { rank: 20 } } }
    let now = Date.now()
    for (let i = 0; i < 100 && !state.monsterDot; i++) {
      state = advanceTick(state, 100, now).state
      now += 100
    }
    expect(state.monsterDot).not.toBeNull()

    // Force the current target to the brink of death, so the next scheduled tick kills it.
    state = { ...state, currentMonster: { ...state.currentMonster!, hp: 0.01 } }
    for (let i = 0; i < 15; i++) {
      state = advanceTick(state, 100, now).state
      now += 100
    }
    expect(state.monsterDot).toBeNull()
    expect(state.lifetime.bleedDamageDealt ?? 0).toBeGreaterThan(0)
  })
})

describe('buffs', () => {
  test('a buff ability populates activeBuffs, and Extended Focus extends its duration', () => {
    const base = createInitialState()
    const makeState = (perkLevels: Record<string, number>): SimState => ({
      ...base,
      abilities: { ...zeroedAbilities(base), battle_focus: { rank: 1 } },
      perkLevels,
    })

    const plain = advanceTick(makeState({}), 100, Date.now()).state
    const buff = plain.activeBuffs.find((b) => b.sourceAbilityId === 'battle_focus')
    expect(buff).toBeDefined()

    const boosted = advanceTick(makeState({ extended_focus: 1 }), 100, Date.now()).state
    const boostedBuff = boosted.activeBuffs.find((b) => b.sourceAbilityId === 'battle_focus')
    expect(boostedBuff!.remainingMs).toBeGreaterThan(buff!.remainingMs)
  })
})

describe('overkill', () => {
  test('chains leftover kill damage into monsters on the same depth', () => {
    const base = createInitialState()
    const state: SimState = {
      ...base,
      abilities: { ...zeroedAbilities(base), cleave: { rank: 50 } },
      depthClears: 0,
      depthClearsRequired: 50, // plenty of headroom so a depth transition doesn't cut the chain short
      currentMonster: { ...base.currentMonster!, hp: 1, maxHp: 1 },
    }
    const result = advanceTick(state, 100, Date.now())
    expect(result.state.lifetime.overkillKills ?? 0).toBeGreaterThan(0)
  })

  test('never spills across a depth transition', () => {
    const base = createInitialState()
    const state: SimState = {
      ...base,
      abilities: { ...zeroedAbilities(base), cleave: { rank: 50 } },
      depthClears: 0,
      depthClearsRequired: 1, // the very next kill advances the depth
      currentMonster: { ...base.currentMonster!, hp: 1, maxHp: 1 },
    }
    const depthBefore = state.currentDepth
    const result = advanceTick(state, 100, Date.now())
    expect(result.state.lifetime.overkillKills ?? 0).toBe(0)
    // Depth genuinely advanced (or is mid-descend-cooldown) rather than staying put to chain-kill more.
    const advanced = result.state.currentDepth > depthBefore || result.state.descendCooldownMs > 0
    expect(advanced).toBe(true)
  })
})

describe('execute', () => {
  test('multiplies damage only at/below the HP threshold', () => {
    const base = createInitialState()
    const makeState = (hpFraction: number): SimState => ({
      ...base,
      abilities: { ...zeroedAbilities(base), finishing_blow: { rank: 1 } },
      currentMonster: { ...base.currentMonster!, hp: base.currentMonster!.maxHp * hpFraction },
    })
    const aboveThreshold = advanceTick(makeState(1), 100, Date.now())
    const belowThreshold = advanceTick(makeState(0.1), 100, Date.now())
    const dmgAbove = aboveThreshold.events.find((e) => e.kind === 'damage')?.amount ?? 0
    const dmgBelow = belowThreshold.events.find((e) => e.kind === 'damage')?.amount ?? 0
    expect(dmgAbove).toBeGreaterThan(0)
    // No crit chance in a fresh state, so this is deterministic: exactly the 2x execute multiplier.
    expect(dmgBelow).toBeCloseTo(dmgAbove * 2, 5)
  })

  test('Executioner perk widens the threshold', () => {
    const base = createInitialState()
    const makeState = (perkLevels: Record<string, number>): SimState => ({
      ...base,
      abilities: { ...zeroedAbilities(base), finishing_blow: { rank: 1 } },
      // 30% HP: above the base 25% threshold, but within a +3%/level (level 2 = +6%) widened one.
      currentMonster: { ...base.currentMonster!, hp: base.currentMonster!.maxHp * 0.3 },
      perkLevels,
    })
    const without = advanceTick(makeState({}), 100, Date.now())
    const withPerk = advanceTick(makeState({ executioner: 2 }), 100, Date.now())
    const dmgWithout = without.events.find((e) => e.kind === 'damage')?.amount ?? 0
    const dmgWithPerk = withPerk.events.find((e) => e.kind === 'damage')?.amount ?? 0
    expect(dmgWithPerk).toBeGreaterThan(dmgWithout)
  })
})

describe('bleed tick count perk', () => {
  test('Lingering Wounds increases the number of bleed ticks applied', () => {
    const base = createInitialState()
    const makeState = (perkLevels: Record<string, number>): SimState => ({
      ...base,
      abilities: { ...zeroedAbilities(base), rend: { rank: 1 } },
      perkLevels,
    })
    const plain = advanceTick(makeState({}), 100, Date.now()).state
    const boosted = advanceTick(makeState({ lingering_wounds: 1 }), 100, Date.now()).state
    expect(plain.monsterDot?.ticksRemaining ?? 0).toBeGreaterThan(0)
    expect(boosted.monsterDot?.ticksRemaining ?? 0).toBeGreaterThan(plain.monsterDot?.ticksRemaining ?? 0)
  })
})

describe('buy-N cost math is self-consistent', () => {
  test('training: cost of buying N in one call equals the sum of N individual costs', () => {
    const N = 7
    let sum = 0
    for (let i = 0; i < N; i++) sum += computeTrainCost('might', i)
    expect(computeTrainCostN('might', 0, N)).toBeCloseTo(sum, 5)
  })

  test('training: computeMaxTrainCount never suggests an unaffordable count', () => {
    const focus = 500
    const count = computeMaxTrainCount('might', 0, focus)
    expect(computeTrainCostN('might', 0, count)).toBeLessThanOrEqual(focus)
    expect(computeTrainCostN('might', 0, count + 1)).toBeGreaterThan(focus)
  })

  test('ability ranks: cost of buying N in one call equals the sum of N individual costs', () => {
    const N = 5
    let sum = 0
    for (let i = 0; i < N; i++) sum += computeAbilityRankCost('strike', i)
    expect(computeAbilityRankCostN('strike', 0, N)).toBeCloseTo(sum, 5)
  })

  test('ability ranks: computeMaxAbilityCount never suggests an unaffordable count', () => {
    const focus = 300
    const count = computeMaxAbilityCount('strike', 0, focus)
    expect(computeAbilityRankCostN('strike', 0, count)).toBeLessThanOrEqual(focus)
    expect(computeAbilityRankCostN('strike', 0, count + 1)).toBeGreaterThan(focus)
  })

  test('perks: cost of buying N in one call equals the sum of N individual costs', () => {
    const perk = listPerks().find((p) => p.id === 'swift_learner')!
    const N = 4
    let sum = 0
    for (let i = 0; i < N; i++) sum += computePerkCost(perk, i)
    expect(computePerkCostN(perk, 0, N)).toBeCloseTo(sum, 5)
  })

  test('perks: computeMaxPerkCount never suggests an unaffordable count', () => {
    const perk = listPerks().find((p) => p.id === 'swift_learner')!
    const balance = 20
    const count = computeMaxPerkCount(perk, 0, balance)
    expect(computePerkCostN(perk, 0, count)).toBeLessThanOrEqual(balance)
    expect(computePerkCostN(perk, 0, count + 1)).toBeGreaterThan(balance)
  })

  test('crafting: cost of buying N matches N times the per-unit cost, and computeMaxCraftCount respects balances', () => {
    const catalogId = gearData.items[0].id
    const unit = computeCraftCost(catalogId)
    const N = 4
    const totalN = computeCraftCostN(catalogId, N)
    expect(totalN.focus).toBeCloseTo(unit.focus * N, 5)
    for (const m of totalN.materials) {
      const perUnit = unit.materials.find((u) => u.materialId === m.materialId)!.amount
      expect(m.amount).toBe(perUnit * N)
    }

    const state: SimState = {
      ...createInitialState(),
      focus: totalN.focus,
      materials: Object.fromEntries(totalN.materials.map((m) => [m.materialId, m.amount])),
    }
    expect(computeMaxCraftCount(state, catalogId)).toBe(N)
  })
})

describe('reforge: jumping an owned item to its next rarity tier', () => {
  const baseId = 'vanguard_sword'
  const uncommonId = 'vanguard_sword_uncommon'
  const legendaryId = 'vanguard_sword_legendary'

  test('computeReforgeCost matches the target tier craft cost, and is null once there is no further tier', () => {
    const cost = computeReforgeCost(baseId)
    expect(cost).not.toBeNull()
    expect(cost!.focus).toBe(computeCraftCost(uncommonId).focus)
    expect(computeReforgeCost(legendaryId)).toBeNull()
  })

  test('reforging an inventory item deducts the cost, repoints catalogId, and resets level, once depth is reached', () => {
    const cost = computeReforgeCost(baseId)!
    const depthReq = computeReforgeDepthRequirement(baseId)!
    const item = { instanceId: 'test_inv', catalogId: baseId, level: 7, augmentIds: [] }
    const state: SimState = {
      ...createInitialState(),
      focus: cost.focus,
      materials: Object.fromEntries(cost.materials.map((m) => [m.materialId, m.amount])),
      maxDepthByZone: { [depthReq.zoneId]: depthReq.depth },
      inventory: [item],
    }
    const { state: next, event } = reforgeItem(state, 'test_inv', Date.now())
    expect(next.inventory[0]).toEqual({ instanceId: 'test_inv', catalogId: uncommonId, level: 1, augmentIds: [] })
    expect(next.focus).toBe(0)
    for (const m of cost.materials) expect(next.materials[m.materialId]).toBe(0)
    expect(next.discoveredItemIds).toContain(uncommonId)
    expect(event?.kind).toBe('reforge')
  })

  test('reforging an equipped item upgrades it in place, once depth is reached', () => {
    const cost = computeReforgeCost(baseId)!
    const depthReq = computeReforgeDepthRequirement(baseId)!
    const item = { instanceId: 'test_eq', catalogId: baseId, level: 3, augmentIds: [] }
    const state: SimState = {
      ...createInitialState(),
      focus: cost.focus,
      materials: Object.fromEntries(cost.materials.map((m) => [m.materialId, m.amount])),
      maxDepthByZone: { [depthReq.zoneId]: depthReq.depth },
      gear: { ...createInitialState().gear, weapon: item },
    }
    const { state: next } = reforgeItem(state, 'test_eq', Date.now())
    expect(next.gear.weapon).toEqual({ instanceId: 'test_eq', catalogId: uncommonId, level: 1, augmentIds: [] })
  })

  test('reforge is a no-op when materials or focus are short', () => {
    const depthReq = computeReforgeDepthRequirement(baseId)!
    const item = { instanceId: 'test_poor', catalogId: baseId, level: 1, augmentIds: [] }
    const state: SimState = {
      ...createInitialState(),
      focus: 0,
      materials: {},
      maxDepthByZone: { [depthReq.zoneId]: depthReq.depth },
      inventory: [item],
    }
    const { state: next, event } = reforgeItem(state, 'test_poor', Date.now())
    expect(next).toBe(state)
    expect(event).toBeNull()
  })

  test('reforge is a no-op for an item with no next tier defined', () => {
    const item = { instanceId: 'test_maxed', catalogId: legendaryId, level: 1, augmentIds: [] }
    const state: SimState = {
      ...createInitialState(),
      focus: 1e9,
      materials: { wood: 1e9, stone: 1e9, leather: 1e9, crystals: 1e9 },
      maxDepthByZone: { whispering_woods: 1000 },
      inventory: [item],
    }
    const { state: next, event } = reforgeItem(state, 'test_maxed', Date.now())
    expect(next).toBe(state)
    expect(event).toBeNull()
  })

  test('regression: reforge is refused below the target tier\'s depth requirement, even with unlimited materials and focus', () => {
    const depthReq = computeReforgeDepthRequirement(baseId)!
    const item = { instanceId: 'test_shallow', catalogId: baseId, level: 1, augmentIds: [] }
    const state: SimState = {
      ...createInitialState(),
      focus: 1e9,
      materials: { wood: 1e9, stone: 1e9, leather: 1e9, crystals: 1e9 },
      maxDepthByZone: { [depthReq.zoneId]: depthReq.depth - 1 },
      inventory: [item],
    }
    const { state: next, event } = reforgeItem(state, 'test_shallow', Date.now())
    expect(next).toBe(state)
    expect(event).toBeNull()
  })

  const CHAIN_BASE_IDS = [
    'vanguard_sword', 'vanguard_armor', 'vanguard_boots', 'vanguard_gloves',
    'vanguard_amulet', 'vanguard_ring', 'vanguard_charm', 'vanguard_banner',
    'adept_wand', 'adept_robe', 'adept_amulet', 'adept_ring',
    'adept_boots', 'adept_gloves', 'adept_tome', 'adept_orb',
  ]
  const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

  test('chain integrity: every zone-1 item chains common -> uncommon -> rare -> epic -> legendary with no dangling nextTierId', () => {
    const byId = Object.fromEntries((gearData.items as GearCatalogItemDef[]).map((i) => [i.id, i]))
    for (const baseId of CHAIN_BASE_IDS) {
      let current: GearCatalogItemDef | undefined = byId[baseId]
      const seenRarities: string[] = []
      for (let i = 0; i < RARITY_ORDER.length; i++) {
        expect(current, `${baseId}: chain ended early at "${seenRarities.join(' -> ')}"`).toBeDefined()
        seenRarities.push(current!.rarity)
        current = current!.nextTierId ? byId[current!.nextTierId!] : undefined
      }
      expect(seenRarities, baseId).toEqual(RARITY_ORDER)
      expect(current, `${baseId}: legendary entry should have no further nextTierId`).toBeUndefined()
    }
  })
})

describe('weighted loot pick (regression: a low-dropWeight tier like legendary must stay rare, not uniform-odds)', () => {
  test('a low-weight entry is picked far less often than a weight-1 entry over many trials', () => {
    const entries = ['common', 'legendary']
    const weight = (id: string) => (id === 'legendary' ? 0.05 : 1)
    const trials = 5000
    let legendaryCount = 0
    for (let i = 0; i < trials; i++) {
      if (pickWeighted(entries, weight) === 'legendary') legendaryCount++
    }
    const expectedFraction = 0.05 / 1.05
    const observedFraction = legendaryCount / trials
    expect(observedFraction).toBeGreaterThan(expectedFraction * 0.4)
    expect(observedFraction).toBeLessThan(expectedFraction * 2.5)
  })
})

describe('fuse rate: duplicate pickups level up slower at higher rarities (regression: shallow-depth material farming should not out-level a deep push)', () => {
  function levelAfterTwoCrafts(catalogId: string): number {
    const unit = computeCraftCost(catalogId)
    let state: SimState = {
      ...createInitialState(),
      discoveredItemIds: [catalogId],
      focus: unit.focus * 10,
      materials: Object.fromEntries(unit.materials.map((m) => [m.materialId, m.amount * 10])),
    }
    state = craftItem(state, catalogId, Date.now(), 1).state
    state = craftItem(state, catalogId, Date.now(), 1).state
    return state.inventory.find((i) => i.catalogId === catalogId)!.level
  }

  test('a common item (fuseRate 1) gains a full level per duplicate; an epic item (fuseRate 0.125) gains a fraction', () => {
    expect(levelAfterTwoCrafts('vanguard_boots')).toBeCloseTo(2, 5)
    expect(levelAfterTwoCrafts('vanguard_sword_epic')).toBeCloseTo(1.125, 5)
  })
})

describe('gear level cap (regression: a maxed-out lower rarity must never outscale a fresh copy of the next tier, or reforging is a net downgrade)', () => {
  test('level growth stops at the rarity maxLevel no matter how many duplicates are fused in', () => {
    const catalogId = 'vanguard_boots' // common
    const maxLevel = (gearData.rarities as RarityDef[]).find((r) => r.id === 'common')!.maxLevel!
    const cost = computeCraftCostN(catalogId, 1000)
    const state: SimState = {
      ...createInitialState(),
      discoveredItemIds: [catalogId],
      focus: cost.focus,
      materials: Object.fromEntries(cost.materials.map((m) => [m.materialId, m.amount])),
    }
    const { state: next } = craftItem(state, catalogId, Date.now(), 1000)
    expect(next.inventory.find((i) => i.catalogId === catalogId)!.level).toBe(maxLevel)
  })

  test('a maxed-out item of every capped rarity is still weaker than a fresh level-1 copy of the next tier up', () => {
    const chain: { catalogId: string; rarity: string }[] = [
      { catalogId: 'vanguard_sword', rarity: 'common' },
      { catalogId: 'vanguard_sword_uncommon', rarity: 'uncommon' },
      { catalogId: 'vanguard_sword_rare', rarity: 'rare' },
      { catalogId: 'vanguard_sword_epic', rarity: 'epic' },
      { catalogId: 'vanguard_sword_legendary', rarity: 'legendary' },
    ]
    const rarities = Object.fromEntries((gearData.rarities as RarityDef[]).map((r) => [r.id, r]))
    for (let i = 0; i < chain.length - 1; i++) {
      const maxLevel = rarities[chain[i].rarity].maxLevel!
      const maxedLower = { instanceId: 'a', catalogId: chain[i].catalogId, level: maxLevel, augmentIds: [] }
      const freshNext = { instanceId: 'b', catalogId: chain[i + 1].catalogId, level: 1, augmentIds: [] }
      const lowerMight = effectiveGearStats(maxedLower).find((s) => s.statId === 'might')!.value
      const nextMight = effectiveGearStats(freshNext).find((s) => s.statId === 'might')!.value
      expect(nextMight, `${chain[i].catalogId} (Lv.${maxLevel}) should be weaker than ${chain[i + 1].catalogId} (Lv.1)`).toBeGreaterThan(lowerMight)
    }
  })
})

describe('perk effect wiring coverage (regression: a perk added without hooking up its formula)', () => {
  // Only effects with a plain, exported compute* function are probed here. buffDuration,
  // bonusDotTicks and executeThreshold are covered above by dedicated mechanic tests instead
  // (they only show up inside advanceTick's ability-firing path, not a standalone formula).
  // dropChance (module-private, RNG-based loot roll) and overkillPower (only observable via a
  // precisely-tuned multi-monster chain) are exercised by gameplay but not independently asserted.
  const probes: Partial<Record<PerkEffect, (state: SimState) => number>> = {
    critChance: computeCritChance,
    critDamage: computeCritMultiplier,
    resistance: computeResistance,
    regen: computeRegenMultiplier,
    lifeSteal: computeLifeStealPct,
    materialFind: computeMaterialFindMultiplier,
    hpCap: computeHpCap,
    staminaCap: computeStaminaCap,
    manaCap: computeManaCap,
    speed: (state) => computeEffectiveCooldownMs(state, 'strike'),
    damage: (state) => computeAbilityDamage({ ...state, abilities: { ...state.abilities, strike: { rank: 1 } } }, 'strike'),
    trainGain: computeStatGainPerTrain,
    focusGain: focusGainMultiplier,
    echoGain: (state) => computeRecallEchoes({ ...state, currentDepth: 60, maxDepthByZone: { [state.currentZoneId]: 60 } }),
  }

  test.each(Object.entries(probes))('perk effect "%s" changes its formula output when a perk with that effect is leveled', (effect, probe) => {
    const perksWithEffect = listPerks().filter((p) => p.effect === effect)
    expect(perksWithEffect.length, `no perk in prestige.json uses effect "${effect}"`).toBeGreaterThan(0)
    const base = createInitialState()
    const before = probe(base)
    const leveled: SimState = { ...base, perkLevels: { ...base.perkLevels, [perksWithEffect[0].id]: 1 } }
    const after = probe(leveled)
    expect(after, `perk effect "${effect}" had no measurable effect on its formula`).not.toBeCloseTo(before, 5)
  })
})

describe('Recall economy (regression: bonus scaled with recall count, so spam-shallow-recalling out-paced real progress)', () => {
  function atDepth(depth: number): SimState {
    const base = createInitialState()
    return { ...base, currentDepth: depth, maxDepthByZone: { [base.currentZoneId]: depth } }
  }

  test('recalling at the same depth twice does not raise bestRecallDepth further', () => {
    let state = recall(atDepth(60))
    const after1 = state.bestRecallDepth
    expect(after1).toBeGreaterThan(0)
    state = recall({ ...state, currentDepth: 60, maxDepthByZone: { [state.currentZoneId]: 60 } })
    expect(state.bestRecallDepth).toBe(after1)
  })

  test('recalling deeper raises bestRecallDepth and the trainGain multiplier', () => {
    let state = recall(atDepth(60))
    const gainAfter1 = computeStatGainPerTrain(state)
    state = recall({ ...state, currentDepth: 120, maxDepthByZone: { [state.currentZoneId]: 120 } })
    expect(state.bestRecallDepth).toBeGreaterThan(60)
    expect(computeStatGainPerTrain(state)).toBeGreaterThan(gainAfter1)
  })

  test('Ascend resets bestRecallDepth to 0', () => {
    let state = recall(atDepth(60))
    expect(state.bestRecallDepth).toBeGreaterThan(0)
    state = ascend({ ...state, echoesEarned: 100000 })
    expect(state.bestRecallDepth).toBe(0)
  })
})

describe('Ascend economy (regression: bonus scaled with ascend count, so spam-minimum-Ascending out-paced hoarding a real Echo payout)', () => {
  const minEchoes = ascendRequiredEchoes()

  test('Ascend requires banking Echoes again after resetting echoesEarned to 0', () => {
    const state = ascend({ ...createInitialState(), echoesEarned: minEchoes })
    expect(state.echoesEarned).toBe(0)
    expect(canAscend(state)).toBe(false)
  })

  test('ascending twice at the minimum echoesEarned does not raise bestAscendEchoes further', () => {
    let state = ascend({ ...createInitialState(), echoesEarned: minEchoes })
    const after1 = state.bestAscendEchoes
    expect(after1).toBeGreaterThan(0)
    state = ascend({ ...state, echoesEarned: minEchoes })
    expect(state.bestAscendEchoes).toBe(after1)
  })

  test('a single bigger Ascend raises bestAscendEchoes and the trainGain multiplier more than repeated minimum Ascends', () => {
    // Spam path: Ascend at the minimum threshold repeatedly (cheap, fast to repeat in real play).
    let spamState = createInitialState()
    for (let i = 0; i < 5; i++) {
      spamState = ascend({ ...spamState, echoesEarned: minEchoes })
    }
    // Hoard path: a single Ascend banking a much bigger Echo payout before cashing in.
    const hoardState = ascend({ ...createInitialState(), echoesEarned: minEchoes * 25 })
    expect(computeStatGainPerTrain(hoardState)).toBeGreaterThan(computeStatGainPerTrain(spamState))
  })

  test('ascending deeper (more Echoes banked) raises bestAscendEchoes and the trainGain multiplier', () => {
    let state = ascend({ ...createInitialState(), echoesEarned: minEchoes })
    const gainAfter1 = computeStatGainPerTrain(state)
    state = ascend({ ...state, echoesEarned: minEchoes * 10 })
    expect(state.bestAscendEchoes).toBe(minEchoes * 10)
    expect(computeStatGainPerTrain(state)).toBeGreaterThan(gainAfter1)
  })
})

describe('Boss Power (a permanent, never-reset damage bonus driven by the toughest boss ever defeated, so deep depth stays reachable without spam-Ascend-style farming)', () => {
  function withBoss(depth: number, hp: number): SimState {
    const base = createInitialState()
    return {
      ...base,
      abilities: { ...zeroedAbilities(base), strike: { rank: 1 } },
      currentDepth: depth,
      currentMonster: { ...base.currentMonster!, isBoss: true, depth, hp, maxHp: hp },
    }
  }

  test('defeating a boss raises bestBossPowerDefeated and the damage multiplier', () => {
    const state = withBoss(50, 0.01)
    const before = computeBossPowerMultiplier(state)
    const result = advanceTick(state, 100, Date.now())
    expect(result.state.bestBossPowerDefeated).toBeGreaterThan(0)
    expect(computeBossPowerMultiplier(result.state)).toBeGreaterThan(before)
  })

  test('defeating an equally-deep boss again does not raise bestBossPowerDefeated further', () => {
    const first = advanceTick(withBoss(50, 0.01), 100, Date.now()).state
    const after1 = first.bestBossPowerDefeated
    expect(after1).toBeGreaterThan(0)
    const second = advanceTick({ ...withBoss(50, 0.01), bestBossPowerDefeated: after1 }, 100, Date.now()).state
    expect(second.bestBossPowerDefeated).toBe(after1)
  })

  test('defeating a deeper boss raises bestBossPowerDefeated further', () => {
    const shallow = advanceTick(withBoss(50, 0.01), 100, Date.now()).state
    const deeper = advanceTick({ ...withBoss(150, 0.01), bestBossPowerDefeated: shallow.bestBossPowerDefeated }, 100, Date.now()).state
    expect(deeper.bestBossPowerDefeated).toBeGreaterThan(shallow.bestBossPowerDefeated)
  })

  test('bestBossPowerDefeated survives Recall and Ascend (unlike bestRecallDepth/bestAscendEchoes)', () => {
    const afterBoss = advanceTick(withBoss(50, 0.01), 100, Date.now()).state
    expect(afterBoss.bestBossPowerDefeated).toBeGreaterThan(0)
    const afterRecall = recall({ ...afterBoss, currentDepth: 60, maxDepthByZone: { [afterBoss.currentZoneId]: 60 } })
    expect(afterRecall.bestBossPowerDefeated).toBe(afterBoss.bestBossPowerDefeated)
    const afterAscendState = ascend({ ...afterRecall, echoesEarned: ascendRequiredEchoes() })
    expect(afterAscendState.bestBossPowerDefeated).toBe(afterBoss.bestBossPowerDefeated)
  })
})

describe('Zone gate (regression: a zone unlocked the next only at a full maxDepth clear, which was unreachable — now a configurable partial boss-count gate)', () => {
  test('zoneGateDepth is a partial clear, well short of the zone\'s full maxDepth', () => {
    const zone = getZoneDef(getInitialZoneId())
    expect(zone.bossesRequiredToUnlockNext).toBeDefined()
    expect(zoneGateDepth(zone)).toBeLessThan(zone.maxDepth)
  })

  test('defeating the gate boss unlocks the next zone without clearing the full zone', () => {
    const base = createInitialState()
    const zone = getZoneDef(base.currentZoneId)
    const gateDepth = zoneGateDepth(zone)
    const state: SimState = {
      ...base,
      abilities: { ...zeroedAbilities(base), strike: { rank: 1 } },
      currentDepth: gateDepth,
      currentMonster: { ...base.currentMonster!, isBoss: true, depth: gateDepth, hp: 0.01, maxHp: 0.01 },
    }
    const result = advanceTick(state, 100, Date.now())
    expect(result.state.unlockedZoneIds).toContain(zone.unlocksZoneId)
  })

  test('defeating an earlier boss (short of the gate) does not unlock the next zone yet', () => {
    const base = createInitialState()
    const zone = getZoneDef(base.currentZoneId)
    const earlierBossDepth = zoneGateDepth(zone) - zone.bossEvery
    const state: SimState = {
      ...base,
      abilities: { ...zeroedAbilities(base), strike: { rank: 1 } },
      currentDepth: earlierBossDepth,
      currentMonster: { ...base.currentMonster!, isBoss: true, depth: earlierBossDepth, hp: 0.01, maxHp: 0.01 },
    }
    const result = advanceTick(state, 100, Date.now())
    expect(result.state.unlockedZoneIds).not.toContain(zone.unlocksZoneId)
  })

  function getInitialZoneId(): string {
    return createInitialState().currentZoneId
  }
})

describe('Overkill chain cap (regression: a chain could recurse once per kill with no bound, stack-overflowing when damage vastly exceeds a shallow monster\'s HP, e.g. right after a Recall reset with a high permanent damage multiplier)', () => {
  test('a single massively-overkilling hit stays bounded, not unbounded', () => {
    const base = createInitialState()
    const state: SimState = {
      ...base,
      abilities: { ...zeroedAbilities(base), cleave: { rank: 50 } },
      depthClears: 0,
      depthClearsRequired: 100000, // never advance depth mid-chain, so the cap is what stops it
      currentMonster: { ...base.currentMonster!, hp: 0.0001, maxHp: 0.0001 },
    }
    const before = state.lifetime.kills ?? 0
    const result = advanceTick(state, 100, Date.now())
    const killsThisHit = (result.state.lifetime.kills ?? 0) - before
    expect(killsThisHit).toBeGreaterThan(0)
    expect(killsThisHit).toBeLessThan(1000)
  })
})

describe('faint loop (regression: a banked monster swing timer survived fainting and fired every tick after recovery, before any ability)', () => {
  test('fainting resets the monster swing timer, even when a long tick banked several attacks', () => {
    const base = createInitialState()
    const state: SimState = {
      ...base,
      playerHp: { current: 1, max: base.playerHp.max },
      monsterActionTimerMs: 60_000, // e.g. a throttled background-tab tick
    }
    const result = advanceTick(state, 100, Date.now()).state
    expect(result.fainted).toBe(true)
    expect(result.monsterActionTimerMs).toBe(0)
  })

  test('recovering from a faint starts the monster swing timer from zero', () => {
    const base = createInitialState()
    const state: SimState = {
      ...base,
      fainted: true,
      playerHp: { current: base.playerHp.max, max: base.playerHp.max },
      monsterActionTimerMs: 999_999,
    }
    const result = advanceTick(state, 100, Date.now()).state
    expect(result.fainted).toBe(false)
    expect(result.monsterActionTimerMs).toBe(0)
  })

  test('a surviving player never carries a full attack interval in the timer into the next tick', () => {
    const base = createInitialState()
    const zone = getZoneDef(base.currentZoneId)
    const state: SimState = { ...base, playerHp: { current: 1e9, max: 1e9 }, monsterActionTimerMs: 60_000 }
    const result = advanceTick(state, 100, Date.now()).state
    expect(result.monsterActionTimerMs).toBeLessThan(zone.baseMonsterAttackIntervalMs)
  })
})

describe('training cost (regression: cost was driven by the stat value, so every trainGain bonus raised the cost as much as the stat and cancelled out)', () => {
  test('cost follows times trained (statLevels); the stat value grows by the gain multiplier', () => {
    const base = createInitialState()
    const state: SimState = { ...base, focus: 1e9, bestRecallDepth: 200 } // trainGain ×3
    const gain = computeStatGainPerTrain(state)
    expect(gain).toBeGreaterThan(2)
    const after = trainStat(state, 'might', 10)
    expect(after.statLevels.might).toBe(10)
    expect(after.stats.might).toBeCloseTo(10 * gain, 5)
    expect(state.focus - after.focus).toBe(computeTrainCostN('might', 0, 10))
  })

  test('a higher trainGain gives more stat for the same Focus', () => {
    const base = createInitialState()
    const plain = trainStat({ ...base, focus: 5000 }, 'might', 1000)
    const boosted = trainStat({ ...base, focus: 5000, bestRecallDepth: 200 }, 'might', 1000)
    expect(boosted.statLevels.might).toBe(plain.statLevels.might)
    expect(boosted.stats.might).toBeGreaterThan(plain.stats.might * 2)
  })

  test('migrateSave estimates statLevels for saves written before they existed', () => {
    const base = createInitialState()
    const legacy = { ...base, bestRecallDepth: 100, stats: { ...base.stats, might: 40 } } as SimState
    delete (legacy as Partial<SimState>).statLevels
    const migrated = migrateSave(legacy)
    expect(migrated.statLevels.might).toBe(20) // 40 value / ×2 gain
    expect(migrated.statLevels.grit).toBe(0)
    expect(migrateSave(migrated)).toBe(migrated)
  })
})

describe('lower-tier merge (regression: once reforged, an item could only level by crafting its new tier — lower-tier drops piled up as useless inventory)', () => {
  function stocked(overrides: Partial<SimState>): SimState {
    return { ...createInitialState(), focus: 1e9, materials: { wood: 1e9, stone: 1e9, crystals: 1e9, leather: 1e9 }, ...overrides }
  }

  test('a lower-tier copy fuses into the owned higher tier instead of creating a new item', () => {
    const owned = { instanceId: 'u1', catalogId: 'vanguard_sword_uncommon', level: 3, augmentIds: [] }
    const state = stocked({ discoveredItemIds: ['vanguard_sword', 'vanguard_sword_uncommon'], gear: { ...createInitialState().gear, weapon: owned } })
    const after = craftItem(state, 'vanguard_sword', Date.now(), 4).state
    expect(after.inventory).toHaveLength(0)
    expect(after.gear.weapon!.level).toBeCloseTo(3 + 4 * computeFuseRate('vanguard_sword', 'vanguard_sword_uncommon'), 5)
  })

  test('merges go to the highest owned tier of the line', () => {
    const state = stocked({
      discoveredItemIds: ['vanguard_sword', 'vanguard_sword_uncommon', 'vanguard_sword_rare'],
      inventory: [
        { instanceId: 'u1', catalogId: 'vanguard_sword_uncommon', level: 1, augmentIds: [] },
        { instanceId: 'r1', catalogId: 'vanguard_sword_rare', level: 1, augmentIds: [] },
      ],
    })
    const after = craftItem(state, 'vanguard_sword', Date.now(), 1).state
    expect(after.inventory.find((i) => i.instanceId === 'u1')!.level).toBe(1)
    expect(after.inventory.find((i) => i.instanceId === 'r1')!.level).toBeGreaterThan(1)
  })

  test('a higher-tier copy never fuses down into a lower tier', () => {
    const state = stocked({
      discoveredItemIds: ['vanguard_sword', 'vanguard_sword_uncommon'],
      inventory: [{ instanceId: 'c1', catalogId: 'vanguard_sword', level: 5, augmentIds: [] }],
    })
    const after = craftItem(state, 'vanguard_sword_uncommon', Date.now(), 1).state
    expect(after.inventory).toHaveLength(2)
  })

  test('crafting a lower tier to feed a higher one is never cheaper per level than crafting the higher tier', () => {
    for (const chainRoot of ['vanguard_sword', 'adept_ring']) {
      const chain = getTierChain(chainRoot)
      for (let lo = 0; lo < chain.length; lo++) {
        for (let hi = lo + 1; hi < chain.length; hi++) {
          const viaLower = computeCraftCost(chain[lo]).focus / computeFuseRate(chain[lo], chain[hi])
          const direct = computeCraftCost(chain[hi]).focus / computeFuseRate(chain[hi], chain[hi])
          expect(viaLower, `${chain[lo]} -> ${chain[hi]}`).toBeGreaterThanOrEqual(direct - 1e-6)
        }
      }
    }
  })
})

describe('duplicate handling (keep / auto-salvage / gated auto-fuse)', () => {
  const sword = () => ({ instanceId: 's1', catalogId: 'vanguard_sword', level: 1, augmentIds: [] as string[] })
  /** Rolls kills with a guaranteed drop until at least one vanguard_sword duplicate lands. */
  function dropDuplicates(state: SimState): SimState {
    // Only the sword is eligible, with a 100% drop chance, so every kill drops it
    const zone = getZoneDef(state.currentZoneId)
    const original = zone.gearItemIds
    zone.gearItemIds = ['vanguard_sword']
    try {
      let next: SimState = { ...state, perkLevels: { lucky_find: 100 }, playerHp: { current: 1e12, max: 1e12 }, abilities: { ...zeroedAbilities(state), strike: { rank: 200 } } }
      let now = Date.now()
      for (let i = 0; i < 50; i++) {
        next = advanceTick(next, 100, now).state
        now += 100
      }
      return next
    } finally {
      zone.gearItemIds = original
    }
  }

  test('keep: duplicates become pending levels on the owned item, and Fuse all applies them', () => {
    const state = dropDuplicates({ ...createInitialState(), inventory: [sword()], discoveredItemIds: ['vanguard_sword'] })
    const item = state.inventory.find((i) => i.instanceId === 's1')!
    expect(state.inventory).toHaveLength(1)
    expect(item.level).toBe(1)
    expect(item.pendingLevels ?? 0).toBeGreaterThan(0)
    const fused = fuseAll(state, Date.now()).state.inventory[0]
    expect(fused.level).toBeCloseTo(1 + item.pendingLevels!, 5)
    expect(fused.pendingLevels).toBe(0)
  })

  test('auto-salvage: duplicates turn into Focus and materials, the owned item is untouched', () => {
    const base = createInitialState()
    const state = dropDuplicates({ ...base, inventory: [sword()], discoveredItemIds: ['vanguard_sword'], automation: { ...defaultAutomation(), duplicateMode: 'salvage' } })
    expect(state.inventory[0].level).toBe(1)
    expect(state.inventory[0].pendingLevels ?? 0).toBe(0)
    expect(state.lifetime.itemsSalvaged ?? 0).toBeGreaterThan(0)
  })

  test('auto-fuse is refused before its Recall unlock, and works after it', () => {
    const locked = setAutomation(createInitialState(), { duplicateMode: 'fuse' })
    expect(locked.automation.duplicateMode).toBe('keep')
    const unlocked = setAutomation({ ...createInitialState(), lifetime: { recalls: automationUnlockRecalls('autoFuse') } }, { duplicateMode: 'fuse' })
    expect(unlocked.automation.duplicateMode).toBe('fuse')
    const state = dropDuplicates({ ...unlocked, inventory: [sword()], discoveredItemIds: ['vanguard_sword'] })
    expect(state.inventory[0].level).toBeGreaterThan(1)
  })

  test('pending levels never exceed what the item can still absorb before its level cap', () => {
    const cap = (gearData.rarities as RarityDef[]).find((r) => r.id === 'common')!.maxLevel!
    const state = dropDuplicates({ ...createInitialState(), inventory: [{ ...sword(), level: cap - 0.5 }], discoveredItemIds: ['vanguard_sword'] })
    expect(state.inventory[0].pendingLevels).toBeCloseTo(0.5, 5)
  })

  test('salvaging an item also pays for its pending levels', () => {
    const base = createInitialState()
    const plain = salvageItem({ ...base, inventory: [sword()] }, 's1').state.focus
    const withPending = salvageItem({ ...base, inventory: [{ ...sword(), pendingLevels: 3 }] }, 's1').state.focus
    expect(withPending).toBeGreaterThan(plain)
  })

  test('migrateSave keeps auto-fuse on for pre-automation saves that already unlocked it', () => {
    const legacy = { ...createInitialState(), lifetime: { recalls: automationUnlockRecalls('autoFuse') } } as SimState
    delete (legacy as Partial<SimState>).automation
    expect(migrateSave(legacy).automation.duplicateMode).toBe('fuse')
    const fresh = { ...createInitialState() } as SimState
    delete (fresh as Partial<SimState>).automation
    expect(migrateSave(fresh).automation.duplicateMode).toBe('keep')
  })
})

describe('bulk salvage', () => {
  test('only strictly-worse, un-augmented items are listed', () => {
    const base = createInitialState()
    const state: SimState = {
      ...base,
      gear: { ...base.gear, weapon: { instanceId: 'eq', catalogId: 'vanguard_sword', level: 50, augmentIds: [] } },
      inventory: [
        { instanceId: 'worse', catalogId: 'vanguard_sword', level: 1, augmentIds: [] },
        { instanceId: 'augmented', catalogId: 'vanguard_sword', level: 1, augmentIds: ['x'] },
        { instanceId: 'otherSlot', catalogId: 'vanguard_boots', level: 1, augmentIds: [] },
      ],
    }
    expect(listWorseItems(state).map((i) => i.instanceId)).toEqual(['worse'])
  })
})

describe('autobuyers', () => {
  const unlocked = (overrides: Partial<SimState['automation']>): SimState => {
    const base = createInitialState()
    // Small enough that one call (capped at maxPurchasesPerTick) can spend it all
    return { ...base, lifetime: { recalls: 100 }, focus: 5_000, automation: { ...defaultAutomation(), ...overrides } }
  }

  test('do nothing while locked, even if the setting is on', () => {
    const base = createInitialState()
    const state = { ...base, focus: 100_000, automation: { ...defaultAutomation(), autoTrain: true } }
    expect(runAutobuyers(state)).toBe(state)
  })

  test('auto-train spends Focus and respects weights (weight 0 is skipped, higher weight gets more levels)', () => {
    const weights = { might: 3, grit: 1, arcana: 0, willpower: 1, fortune: 1, speed: 1 }
    const after = runAutobuyers(unlocked({ autoTrain: true, statWeights: weights }))
    expect(after.focus).toBeLessThan(5_000)
    expect(after.statLevels.arcana).toBe(0)
    expect(after.statLevels.might).toBeGreaterThan(after.statLevels.grit)
  })

  test('maxCostPct keeps a share of Focus unspent', () => {
    const after = runAutobuyers(unlocked({ autoTrain: true, maxCostPct: 10 }))
    // Every purchase cost at most 10% of the Focus held at the time, so a lot must be left over
    expect(after.focus).toBeGreaterThan(5_000 * 0.05)
    const free = runAutobuyers(unlocked({ autoTrain: true, maxCostPct: 100 }))
    expect(free.focus).toBeLessThan(after.focus)
  })

  test('auto-abilities never exceeds max rank', () => {
    const after = runAutobuyers({ ...unlocked({ autoAbilities: true }), focus: 1e30 })
    for (const def of ABILITIES) expect(after.abilities[def.id].rank).toBeLessThanOrEqual(def.maxRank)
  })
})

describe('level-capped items (regression: duplicates of a maxed item vanished without a trace, and crafting one wasted the cost)', () => {
  const cap = () => (gearData.rarities as RarityDef[]).find((r) => r.id === 'common')!.maxLevel!
  const stocked = (level: number): SimState => ({
    ...createInitialState(),
    focus: 1e9,
    materials: { wood: 1e9, stone: 1e9, crystals: 1e9, leather: 1e9 },
    discoveredItemIds: ['vanguard_sword'],
    inventory: [{ instanceId: 's1', catalogId: 'vanguard_sword', level, augmentIds: [] }],
  })

  test('crafting stops at the level cap instead of charging for copies that add nothing', () => {
    const state = stocked(cap() - 2)
    expect(computeFuseRoomCopies(state, 'vanguard_sword')).toBe(2)
    const after = craftItem(state, 'vanguard_sword', Date.now(), 25).state
    expect(after.inventory[0].level).toBe(cap())
    expect(after.lifetime.itemsCrafted).toBe(2)
    expect(computeMaxCraftCount(after, 'vanguard_sword')).toBe(0)
  })

  test('dropped duplicates past the cap are salvaged and counted per item, in every duplicate mode', () => {
    for (const duplicateMode of ['keep', 'fuse'] as const) {
      const base = stocked(cap())
      const state = { ...base, lifetime: { recalls: 100 }, automation: { ...defaultAutomation(), duplicateMode } }
      const zone = getZoneDef(state.currentZoneId)
      const original = zone.gearItemIds
      zone.gearItemIds = ['vanguard_sword']
      let next: SimState = { ...state, perkLevels: { lucky_find: 100 }, playerHp: { current: 1e12, max: 1e12 }, abilities: { ...zeroedAbilities(state), strike: { rank: 200 } } }
      try {
        let now = Date.now()
        for (let i = 0; i < 50; i++) {
          next = advanceTick(next, 100, now).state
          now += 100
        }
      } finally {
        zone.gearItemIds = original
      }
      expect(next.inventory[0].level).toBe(cap())
      expect(next.inventory[0].pendingLevels ?? 0).toBe(0)
      expect(next.lifetime[overflowSalvagedKey('vanguard_sword')] ?? 0, duplicateMode).toBeGreaterThan(0)
      expect(next.focus).toBeGreaterThan(state.focus)
    }
  })
})

describe('reforge depth requirement uses the all-time deepest depth (regression: it locked again after every Recall)', () => {
  test('a depth reached in an earlier run still allows the reforge after a Recall wiped maxDepthByZone', () => {
    const target = getGearCatalogItem('vanguard_sword_uncommon')
    const cost = computeReforgeCost('vanguard_sword')!
    const state: SimState = {
      ...createInitialState(),
      maxDepthByZone: {},
      lifetime: { [`deepest_${target.zoneId}`]: target.minDepth },
      focus: cost.focus,
      materials: Object.fromEntries(cost.materials.map((m) => [m.materialId, m.amount])),
      inventory: [{ instanceId: 'i1', catalogId: 'vanguard_sword', level: 5, augmentIds: [] }],
    }
    expect(reforgeItem(state, 'i1', Date.now()).state.inventory[0].catalogId).toBe('vanguard_sword_uncommon')
  })
})

describe('milestones', () => {
  test('crossing a lifetime threshold reaches the milestone once, logs it, and adds its reward to perkBonus', () => {
    const track = listMilestoneTracks().find((t) => t.id === 'kills')!
    const base = createInitialState()
    const before = perkBonus(base, track.effect)
    const state: SimState = { ...base, lifetime: { kills: track.tiers[1].threshold } }
    const result = advanceTick(state, 100, Date.now())
    expect(result.state.milestonesReached).toEqual([milestoneId(track, 0), milestoneId(track, 1)])
    expect(result.events.filter((e) => e.kind === 'milestone')).toHaveLength(2)
    expect(perkBonus(result.state, track.effect)).toBeCloseTo(before + track.tiers[0].value + track.tiers[1].value, 9)
    // Already reached: no duplicate events on later ticks
    const again = advanceTick(result.state, 100, Date.now())
    expect(again.events.filter((e) => e.kind === 'milestone')).toHaveLength(0)
  })

  test('every track uses a perk effect that some formula reads (reuses the perk wiring)', () => {
    const effects = new Set(listPerks().map((p) => p.effect))
    for (const track of listMilestoneTracks()) expect(effects.has(track.effect), track.id).toBe(true)
  })

  test('tiers are in ascending threshold order', () => {
    for (const track of listMilestoneTracks()) {
      for (let i = 1; i < track.tiers.length; i++) expect(track.tiers[i].threshold, track.id).toBeGreaterThan(track.tiers[i - 1].threshold)
    }
  })
})

describe('imbue (materials sink)', () => {
  const learned = (materials: Record<string, number>): SimState => ({ ...createInitialState(), learnedAugmentIds: ['aug_might'], materials })

  test('spends materials, raises the rank, and strengthens the augment on socketed gear', () => {
    const cost = computeImbueCostN('aug_might', 0, 3)
    const state = learned(Object.fromEntries(cost.materials.map((m) => [m.materialId, m.amount])))
    const withGear: SimState = { ...state, gear: { ...state.gear, weapon: { instanceId: 'w', catalogId: 'vanguard_sword', level: 1, augmentIds: ['aug_might'] } } }
    const after = imbueAugment(withGear, 'aug_might', Date.now(), 25).state
    expect(after.augmentRanks.aug_might).toBe(3)
    for (const m of cost.materials) expect(after.materials[m.materialId]).toBe(0)
    expect(computeAugmentMagnitude(after, 'aug_might')).toBeGreaterThan(computeAugmentMagnitude(withGear, 'aug_might'))
    expect(gearBonusForStat(after, 'might')).toBeGreaterThan(gearBonusForStat(withGear, 'might'))
  })

  test('computeMaxImbueCount never suggests an unaffordable count', () => {
    const state = learned({ stone: 50_000, leather: 50_000 })
    const count = computeMaxImbueCount(state, 'aug_might')
    const cost = computeImbueCostN('aug_might', 0, count)
    for (const m of cost.materials) expect(m.amount).toBeLessThanOrEqual(state.materials[m.materialId])
    const tooMuch = computeImbueCostN('aug_might', 0, count + 1)
    expect(tooMuch.materials.some((m) => m.amount > state.materials[m.materialId])).toBe(true)
  })

  test('an augment that has not been learned cannot be imbued', () => {
    const state = { ...createInitialState(), materials: { stone: 1e9, leather: 1e9 } }
    expect(imbueAugment(state, 'aug_might', Date.now(), 1).state).toBe(state)
  })
})

describe('offline summary and Echo rate', () => {
  test('summarizes what happened during catch-up', () => {
    const base = createInitialState()
    const before: SimState = { ...base, abilities: { ...zeroedAbilities(base), strike: { rank: 50 } } }
    const after = simulateOfflineElapsed(before, 5 * 60_000)
    const summary = summarizeOffline(before, after, 5 * 60_000, false)
    expect(summary.kills).toBeGreaterThan(0)
    expect(summary.focusEarned).toBeGreaterThan(0)
    expect(summary.deepestAfter).toBeGreaterThanOrEqual(summary.deepestBefore)
    expect(summary.capped).toBe(false)
  })

  test('Echo rate is Echoes-if-Recalled-now per hour of run time, and descending records the peak', () => {
    const base = createInitialState()
    const state: SimState = { ...base, currentDepth: 100, maxDepthByZone: { [base.currentZoneId]: 100 }, runStats: { timeMs: 3_600_000 } }
    expect(computeEchoRatePerHour(state)).toBeCloseTo(computeRecallEchoes(state), 6)
    expect(computeEchoRatePerHour({ ...state, runStats: { timeMs: 7_200_000 } })).toBeCloseTo(computeRecallEchoes(state) / 2, 6)
  })
})

describe('zone set reforge chains', () => {
  test('every set piece in zones 2-4 chains up to a boss-only legendary gated inside its own zone', () => {
    const items = gearData.items as GearCatalogItemDef[]
    for (const setId of ['crypt_warden', 'ember_zealot', 'frost_sentinel']) {
      const set = (gearData.sets as { id: string; itemIds: string[] }[]).find((s) => s.id === setId)!
      for (const baseId of set.itemIds) {
        const chain = getTierChain(baseId)
        const top = items.find((i) => i.id === chain[chain.length - 1])!
        expect(top.rarity, baseId).toBe('legendary')
        expect(top.bossOnly, baseId).toBe(true)
        const zone = getZoneDef(top.zoneId!)
        expect(zone.gearItemIds, baseId).toContain(top.id)
        expect(top.minDepth, baseId).toBeLessThanOrEqual(zone.maxDepth)
      }
    }
  })
})
