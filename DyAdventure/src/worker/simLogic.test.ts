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
