/**
 * Progression simulator: drives the real game logic (not a reimplementation) with a "diligent
 * but not optimal" bot, to sanity-check pacing/balance after a change — same idea as the
 * scratchpad scripts used ad hoc earlier, generalized and parameterized so it doesn't need to be
 * rewritten each time.
 *
 * Usage:
 *   npm run sim                              # 6h, threshold-recall policy
 *   npm run sim -- --hours 14                # longer run
 *   npm run sim -- --recall never            # never Recall, just push depth
 *   npm run sim -- --recall asap             # Recall the instant eligible (exploit check)
 *   npm run sim -- --hours 14 --recall threshold > before.log   # keep a report to diff against
 */
import {
  createInitialState,
  advanceTick,
  trainStat,
  upgradeAbility,
  equipItem,
  computeTrainCost,
  computeAbilityRankCost,
  computeRecallEchoes,
  canRecall,
  recall,
  computeAscendSigils,
  canAscend,
  ascend,
  ascendRequiredEchoes,
  computeStatGainPerTrain,
  listPerks,
  computePerkCost,
  buyPerk,
} from '../src/worker/simLogic.ts'
import statsData from '../src/content/stats.json' with { type: 'json' }
import abilitiesData from '../src/content/abilities.json' with { type: 'json' }
import type { AbilityDef, StatDef, StatId } from '../src/types/index.ts'

type RecallPolicy = 'never' | 'threshold' | 'asap'
type AscendPolicy = 'never' | 'threshold' | 'asap'

function parseArgs(): { hours: number; recall: RecallPolicy; ascend: AscendPolicy } {
  const args = process.argv.slice(2)
  let hours = 6
  let recallPolicy: RecallPolicy = 'threshold'
  let ascendPolicy: AscendPolicy = 'never'
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--hours') hours = Number(args[++i])
    if (args[i] === '--recall') recallPolicy = args[++i] as RecallPolicy
    if (args[i] === '--ascend') ascendPolicy = args[++i] as AscendPolicy
  }
  return { hours, recall: recallPolicy, ascend: ascendPolicy }
}

const { hours: SIM_HOURS, recall: RECALL_POLICY, ascend: ASCEND_POLICY } = parseArgs()
const STATS = statsData as StatDef[]
const ABILITIES = abilitiesData as AbilityDef[]
const PERKS = listPerks()

const TICK_MS = 100
const DECISION_INTERVAL_MS = 5000
const TOTAL_MS = SIM_HOURS * 60 * 60 * 1000
// 'threshold' policy: how much further the deepest-ever depth must grow past the last Recall
// before recalling again (pushing deeper first makes the Echo payout worth the full reset).
const RECALL_DEPTH_THRESHOLD = 50
// 'threshold' Ascend policy: earn this multiple of the minimum required Echoes before Ascending,
// instead of the instant it's eligible — tests whether hoarding a bigger Sigil payout (sigils
// scale with sqrt(echoesEarned), so hoarding has diminishing returns) beats Ascending on cooldown.
const ASCEND_ECHOES_MULTIPLIER = 5

let state = createInitialState()
let now = Date.now()
let msSinceDecision = 0
let firstDepth51At: number | null = null
let depthAtLastRecall = 0
let recallCount = 0
let ascendCountLocal = 0
let firstAscendAt: number | null = null
const recallLog: { minute: number; depth: number; echoes: number }[] = []
const ascendLog: { minute: number; echoesEarned: number; sigils: number; multiplierAfter: number }[] = []
const depthSnapshots: {
  minute: number
  depth: number
  maxDepth: number
  focus: number
  faints: number
  kills: number
  avgLevel: number
  echoesIfRecalledNow: number
}[] = []

// Round-robin spend targets: unlock/rank up every ability, train every stat, evenly —
// approximates a diligent player who doesn't neglect any part of the kit.
const spendTargets: { kind: 'stat' | 'ability'; id: string }[] = [
  ...STATS.map((s) => ({ kind: 'stat' as const, id: s.id })),
  ...ABILITIES.map((a) => ({ kind: 'ability' as const, id: a.id })),
]
let spendIdx = 0

function decide() {
  let spentSomething = true
  let guard = 0
  while (spentSomething && guard < 200) {
    spentSomething = false
    guard++
    for (let i = 0; i < spendTargets.length; i++) {
      const target = spendTargets[spendIdx]
      spendIdx = (spendIdx + 1) % spendTargets.length
      if (target.kind === 'stat') {
        const level = state.stats[target.id as StatId]
        const cost = computeTrainCost(target.id as StatId, level)
        if (state.focus >= cost) {
          state = trainStat(state, target.id as StatId)
          spentSomething = true
          break
        }
      } else {
        const rank = state.abilities[target.id]?.rank ?? 0
        const def = ABILITIES.find((a) => a.id === target.id)!
        if (rank >= def.maxRank) continue
        const cost = computeAbilityRankCost(target.id, rank)
        if (state.focus >= cost) {
          state = upgradeAbility(state, target.id)
          spentSomething = true
          break
        }
      }
    }
  }
}

// Spend all available Echoes/Sigils on perks, cheapest-affordable-first (both currencies pooled
// this way since a diligent player wouldn't leave prestige currency sitting idle).
function spendPerks() {
  let bought = true
  while (bought) {
    bought = false
    let cheapest: { perk: (typeof PERKS)[number]; cost: number } | null = null
    for (const perk of PERKS) {
      const level = state.perkLevels[perk.id] ?? 0
      if (level >= perk.maxLevel) continue
      const balance = perk.currency === 'echoes' ? state.echoes : state.sigils
      const cost = computePerkCost(perk, level)
      if (balance < cost) continue
      if (!cheapest || cost < cheapest.cost) cheapest = { perk, cost }
    }
    if (cheapest) {
      state = buyPerk(state, cheapest.perk.id)
      bought = true
    }
  }
}

console.log(`Simulating ${SIM_HOURS}h, recall policy: ${RECALL_POLICY}, ascend policy: ${ASCEND_POLICY}\n`)

let lastMinuteLogged = -1

for (let t = 0; t < TOTAL_MS; t += TICK_MS) {
  const result = advanceTick(state, TICK_MS, now)
  state = result.state
  now += TICK_MS

  for (const event of result.events) {
    if (event.kind === 'loot') {
      // Simple auto-equip: always equip a newly found item (good enough for a pacing check).
      state = equipItem(state, event.item.instanceId)
    }
  }

  msSinceDecision += TICK_MS
  if (msSinceDecision >= DECISION_INTERVAL_MS) {
    msSinceDecision = 0
    decide()
    spendPerks()

    if (RECALL_POLICY !== 'never') {
      const deepestNow = state.lifetime['deepest_' + state.currentZoneId] ?? 0
      const requiredGrowth = RECALL_POLICY === 'asap' ? 0 : RECALL_DEPTH_THRESHOLD
      if (canRecall(state) && deepestNow - depthAtLastRecall >= requiredGrowth) {
        const echoes = Math.round(computeRecallEchoes(state))
        state = recall(state)
        spendPerks()
        recallCount++
        depthAtLastRecall = deepestNow
        recallLog.push({ minute: Math.round(t / 60000), depth: deepestNow, echoes })
      }
    }

    if (ASCEND_POLICY !== 'never') {
      const requiredEchoes = ASCEND_POLICY === 'asap' ? ascendRequiredEchoes() : ascendRequiredEchoes() * ASCEND_ECHOES_MULTIPLIER
      if (canAscend(state) && state.echoesEarned >= requiredEchoes) {
        const echoesEarned = state.echoesEarned
        const sigils = computeAscendSigils(state)
        state = ascend(state)
        spendPerks()
        ascendCountLocal++
        if (firstAscendAt === null) firstAscendAt = t
        ascendLog.push({
          minute: Math.round(t / 60000),
          echoesEarned,
          sigils,
          multiplierAfter: computeStatGainPerTrain(state),
        })
      }
    }
  }

  const reachedDepth = state.lifetime['deepest_' + state.currentZoneId] ?? 0
  if (firstDepth51At === null && reachedDepth >= 51) {
    firstDepth51At = t
    console.log(`*** First reached depth 51 at t=${(t / 60000).toFixed(1)} minutes ***\n`)
  }

  const minute = Math.floor(t / 60000)
  if (minute !== lastMinuteLogged && minute % 5 === 0) {
    lastMinuteLogged = minute
    const avgLevel = Object.values(state.stats).reduce((a: number, b: number) => a + b, 0) / Object.keys(state.stats).length
    depthSnapshots.push({
      minute,
      depth: state.currentDepth,
      maxDepth: reachedDepth,
      focus: Math.round(state.focus),
      faints: state.lifetime.faints ?? 0,
      kills: state.lifetime.kills ?? 0,
      avgLevel: Math.round(avgLevel * 10) / 10,
      echoesIfRecalledNow: Math.round(computeRecallEchoes(state)),
    })
  }
}

console.log('minute\tdepth\tmaxDepth\tfocus\tfaints\tkills\tavgStatLvl\techoesIfRecalledNow')
for (const s of depthSnapshots) {
  console.log(`${s.minute}\t${s.depth}\t${s.maxDepth}\t${s.focus}\t${s.faints}\t${s.kills}\t${s.avgLevel}\t${s.echoesIfRecalledNow}`)
}

if (recallLog.length > 0) {
  console.log('\n--- Recalls ---')
  console.log('minute\tdepthReached\techoesGained')
  for (const r of recallLog) console.log(`${r.minute}\t${r.depth}\t${r.echoes}`)
}

if (ascendLog.length > 0) {
  console.log('\n--- Ascends ---')
  console.log('minute\techoesEarnedSpent\tsigilsGained\ttrainGainMultiplierAfter')
  for (const a of ascendLog) console.log(`${a.minute}\t${a.echoesEarned}\t${a.sigils}\t${a.multiplierAfter.toFixed(3)}`)
}

if (recallLog.length > 0 || ascendLog.length > 0) {
  console.log('\n--- Perk levels ---')
  for (const p of PERKS) console.log(`  ${p.id} (${p.currency}): ${state.perkLevels[p.id] ?? 0}/${p.maxLevel}`)
}

console.log('\n--- Final ability ranks ---')
for (const a of ABILITIES) console.log(`  ${a.id}: rank ${state.abilities[a.id]?.rank ?? 0}`)
console.log('\n--- Final stat levels ---')
for (const s of STATS) console.log(`  ${s.id}: ${state.stats[s.id as StatId].toFixed(1)}`)

console.log(`\nTotal Recalls: ${recallCount}`)
console.log(`Total lifetime Echoes earned: ${Math.round(state.lifetime.echoesEarnedTotal ?? 0)}`)
console.log(`Total Ascends: ${ascendCountLocal}`)
console.log(`Total lifetime Sigils earned: ${Math.round(state.lifetime.sigilsEarnedTotal ?? 0)}`)
console.log(`Current sigils on hand: ${state.sigils}`)
console.log(`Current trainGain multiplier (computeStatGainPerTrain): ${computeStatGainPerTrain(state).toFixed(3)}`)
console.log(`Total faints: ${state.lifetime.faints ?? 0}`)
console.log(`Total kills: ${state.lifetime.kills ?? 0}`)
console.log(
  `Deepest ever reached: ${state.lifetime['deepest_' + state.currentZoneId] ?? 0}`,
)
console.log(`Time to depth 51: ${firstDepth51At !== null ? (firstDepth51At / 60000).toFixed(1) + ' minutes' : 'NOT REACHED in ' + SIM_HOURS + 'h'}`)
console.log(`Time to first Ascend: ${firstAscendAt !== null ? (firstAscendAt / 60000).toFixed(1) + ' minutes' : 'NOT REACHED in ' + SIM_HOURS + 'h'}`)
