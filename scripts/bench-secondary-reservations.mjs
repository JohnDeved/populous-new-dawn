// Bounded, matched CPU-only comparison of the complete reservation synchronizer.
// No browser, rendering, FPS, GC, or hardware-capacity claim follows from this.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const baseline = process.argv[2] ?? '55770f1a03478883e8d0b00a1fd518e222782c3b'
assert.match(baseline, /^[0-9a-f]{40}$/, 'Pass the complete baseline commit SHA')
const path = 'app/scene-secondary-effects.ts'
const hash = value => createHash('sha256').update(value).digest('hex')
const oldSource = execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' })
const newSource = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const inputPaths = [path, 'app/training-panel-requests.ts', 'scripts/bench-secondary-reservations.mjs',
  'package-lock.json', 'node_modules/.package-lock.json']
const fingerprint = () => Object.fromEntries(inputPaths.map(name => [name, hash(readFileSync(`${root}/${name}`))]))
const before = fingerprint()
async function load(source, label) {
  const javascript = stripTypeScriptTypes(source).replace(
    "'./training-panel-requests.ts'",
    JSON.stringify(new URL('../app/training-panel-requests.ts', import.meta.url).href)
  )
  return (await import(`data:text/javascript;base64,${Buffer.from(`${javascript}\n// ${label}`).toString('base64')}`)).syncSecondaryReservations
}
const functions = { baseline: await load(oldSource, 'baseline'), candidate: await load(newSource, 'candidate') }

function fixture(kind) {
  const scene = {
    world: { buildings: [], secondaryEffects: { reservations: [] }, turn: 18, randomState: 1234 },
    objectPanels: { panels: new Map(), buildingRecords: new Map() },
    buildingPanels: new Map(), cursor: { visible: false },
  }
  for (let id = 1; id <= 64; id++) scene.world.buildings.push({ id, kind: 'hut', progress: 1 })
  if (kind === 'held-hut') scene.buildingPanels.set(1, { hidden: false })
  if (kind === 'ordinary') {
    scene.objectPanels.panels.set(100, {})
    scene.objectPanels.buildingRecords.set(2, {})
    scene.cursor.visible = true
  }
  if (kind === 'mixed') {
    for (let id = 1; id <= 16; id++) {
      scene.objectPanels.panels.set(id + 100, {})
      scene.objectPanels.buildingRecords.set(id, {})
      scene.buildingPanels.set(id, { hidden: id % 2 === 0 })
    }
    // Missing/non-Hut legacy owners retain the full live building scan.
    for (let id = 65; id < 73; id++) scene.buildingPanels.set(id, { hidden: false })
  }
  if (kind === 'capacity') {
    for (let id = 1; id <= 80; id++) scene.objectPanels.panels.set(id, {})
    for (let id = 1; id <= 80; id++) scene.objectPanels.buildingRecords.set(id, {})
  }
  return scene
}
const cases = [
  { name: 'empty', iterations: 60000 },
  { name: 'held-hut', iterations: 60000 },
  { name: 'ordinary', iterations: 60000 },
  { name: 'mixed', iterations: 10000 },
  { name: 'capacity', iterations: 10000 },
]
const order = ['baseline', 'candidate', 'candidate', 'baseline']
const rows = []
let checksum = 0
const median = values => {
  const sorted = [...values].sort((a, b) => a - b), middle = sorted.length / 2
  return (sorted[Math.floor(middle)] + sorted[Math.ceil(middle) - 1]) / 2
}
for (const spec of cases) {
  const scenes = { baseline: fixture(spec.name), candidate: fixture(spec.name) }
  for (const variant of Object.keys(functions)) functions[variant](scenes[variant])
  assert.deepEqual(scenes.candidate, scenes.baseline, `${spec.name}: pre-timing output parity`)
  const expected = structuredClone(scenes.baseline)
  assert.ok(expected.world.secondaryEffects.reservations.length <= 160)
  // Fixed warm-up, then four ABBA blocks. No adaptive repeats or outlier removal.
  for (let i = 0; i < 1024; i++) for (const variant of order) functions[variant](scenes[variant])
  const samples = []
  for (let block = 0; block < 4; block++) for (const variant of order) {
    const scene = scenes[variant], run = functions[variant]
    const cpu = process.cpuUsage(), start = performance.now()
    for (let i = 0; i < spec.iterations; i++) {
      run(scene)
      checksum += scene.world.secondaryEffects.reservations.length
    }
    const wallMs = performance.now() - start, used = process.cpuUsage(cpu)
    samples.push({ block, variant, iterations: spec.iterations, wallMs, cpuMs: (used.user + used.system) / 1000 })
    assert.deepEqual(scene, expected, `${spec.name}/${variant}: complete state parity after sample`)
  }
  const medians = Object.fromEntries(Object.keys(functions).map(variant => [variant, {
    wallUsPerCall: median(samples.filter(row => row.variant === variant).map(row => row.wallMs * 1000 / row.iterations)),
    cpuUsPerCall: median(samples.filter(row => row.variant === variant).map(row => row.cpuMs * 1000 / row.iterations)),
  }]))
  rows.push({ ...spec, reservations: expected.world.secondaryEffects.reservations.length, samples, medians,
    wallRatio: medians.candidate.wallUsPerCall / medians.baseline.wallUsPerCall })
}
const after = fingerprint()
assert.deepEqual(after, before, 'inputs changed during comparison')
console.log(JSON.stringify({ version: 1, kind: 'matched-reservation-cpu', baseline,
  candidate: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  baselineSourceSha256: hash(oldSource), candidateSourceSha256: hash(newSource), inputs: before,
  sourceStable: true, node: process.version, platform: process.platform, arch: process.arch,
  protocol: { order, blocks: 4, warmupPerSide: 2048, adaptive: false, outliersRemoved: false },
  scope: 'Whole syncSecondaryReservations only; supplied bounded owners, not browser/gameplay/hardware capacity. Shared-host contention and JIT/GC remain uncontrolled.',
  checksum, rows }, null, 2))
