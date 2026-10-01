/**
 * Build-balance check: runs the simulator once per spec (Adventurer, Warrior, Mage) in parallel, each
 * from a fresh start as that spec (the simulator's --spec what-if; real games start as an Adventurer and
 * pick a spec on Ascend), climbing through the zones until a goal, and prints the hours at which each
 * zone unlocked.
 *   npm run balance                                   # goal: beat Frostbound Peaks' first floor, 400h cap
 *   npm run balance -- --until ember_caverns:2 --hours 200
 * Extra simulator flags are passed through (e.g. --ascend threshold).
 */
import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : fallback
}
const until = flag('--until', 'frostbound_peaks:2')
const hours = flag('--hours', '400')
const passThrough = args.filter((a, i) => !['--until', '--hours'].includes(a) && !['--until', '--hours'].includes(args[i - 1]))
const BUILDS = [
  { name: 'Adventurer', flags: [] },
  { name: 'Warrior', flags: ['--spec', 'warrior'] },
  { name: 'Mage', flags: ['--spec', 'mage'] },
]

function run(build) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', 'scripts/simulate.ts', '--hours', hours, '--auto-zone', '--until', until, ...build.flags, ...passThrough], { shell: true })
    const unlocks = {}
    let goal = null
    let faints = null
    let buffer = ''
    const onData = (chunk) => {
      buffer += chunk
      let nl
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl)
        buffer = buffer.slice(nl + 1)
        const unlock = line.match(/t=([\d.]+)min zone unlocked: (\w+)/)
        if (unlock) unlocks[unlock[2]] = Number(unlock[1]) / 60
        const reached = line.match(/^\[goal\] .* reached at (\d+) min/)
        if (reached) goal = Number(reached[1]) / 60
        const f = line.match(/^Total faints: (\d+)/)
        if (f) faints = Number(f[1])
      }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('close', () => {
      const zonesDone = Object.entries(unlocks).map(([z, v]) => `${z} ${v.toFixed(1)}h`).join(', ')
      console.log(`[${build.name} done] ${zonesDone || 'no zone unlocked'} · goal ${goal == null ? 'not reached' : goal.toFixed(1) + 'h'}`)
      resolve({ ...build, unlocks, goal, faints })
    })
  })
}

const started = Date.now()
const results = await Promise.all(BUILDS.map(run))
const zones = [...new Set(results.flatMap((r) => Object.keys(r.unlocks)))]
const h = (v) => (v == null ? '—' : `${v.toFixed(1)}h`)
console.log(`\nGoal ${until} (cap ${hours}h) — hours until each zone unlocked`)
console.log(['build', ...zones, 'goal', 'faints'].join('\t'))
for (const r of results) console.log([r.name, ...zones.map((z) => h(r.unlocks[z])), r.goal == null ? `not in ${hours}h` : h(r.goal), r.faints ?? '—'].join('\t'))
console.log(`\n(${Math.round((Date.now() - started) / 1000)}s)`)
