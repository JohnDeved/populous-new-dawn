// Run this SAME driver against an exact baseline and candidate checkout. It
// hashes every World field at each supplied frame, excluding only new Angel
// presentation state. No browser, original code, fixture overwrite or RNG shim.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { serialize } from 'node:v8'
import { execFileSync } from 'node:child_process'

const [checkout, output, comparison] = process.argv.slice(2)
assert.ok(checkout && output, 'Usage: node scripts/check-angel-gameplay.mjs <checkout> <output.json> [baseline.json]')
const root = resolve(checkout)
const hash = data => createHash('sha256').update(data).digest('hex')
function sourceFingerprint() {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter(path => path.startsWith('app/') || ['package.json', 'package-lock.json', 'tsconfig.json', 'tests/level-start-fixture.mjs'].includes(path)).sort()
  return hash(files.map(path => `${path}\0${hash(readFileSync(resolve(root, path)))}`).join('\n'))
}
const sourceBefore = sourceFingerprint()
const load = path => import(pathToFileURL(resolve(root, path)).href)
const { addUnit, cast, syncLandscapeObjects } = await load('app/model.ts')
const { createGameStore } = await load('app/game-store.ts')
const { advanceGame } = await load('app/game-clock.ts')
const { createLivePerson, syncLivePersonCells } = await load('app/live-people.ts')
const { queueTerrain, updateWalkMasks } = await load('app/native-terrain.ts')
const { retainFixtureUnits } = await load('tests/level-start-fixture.mjs')
const runs = []
for (const scenario of ['strike-and-death', 'interrupted-retarget', 'wrapped-chase']) {
  const store = createGameStore()
  let world = store.getWorld()
  world.manaWorld.loadFlags |= 0x200
  world.terrain.fill(3)
  world.land.heights.fill(135)
  world.terrainVersion++
  queueTerrain(world.land, 0, 64, 1, { surface() {}, globe() {} })
  updateWalkMasks(world.land, 0, 64)
  world.landVersion = world.terrainVersion
  retainFixtureUnits(world, () => false)
  world.buildings = []
  world.trees = []
  world.shrines = []
  syncLandscapeObjects(world)
  const home = { x: 0, z: 0 }
  addUnit(world, 'blue', 'shaman', { x: home.x, z: 8 })
  const victim = addUnit(world, 'red', 'brave', scenario === 'wrapped-chase' ? { x: -126, z: 0 } : home)
  victim.native = createLivePerson(world, victim)
  victim.native.damageAttacker = 255
  if (scenario === 'strike-and-death') {
    victim.shield = 600
    victim.bloodlust = 600
    victim.native.flags3 |= 0x88000
  }
  const backup = addUnit(world, 'yellow', 'brave', { x: home.x + 10, z: 0 })
  backup.native = createLivePerson(world, backup)
  syncLivePersonCells(world)
  world.shots.angel = 1
  assert.equal(cast(world, 'angel', home), true)
  const clock = { animationTime: 0, animationFrame: 0 }
  const frames = [], phases = new Set(), targets = new Set()
  let seen = false, checkpointed = false, interrupted = false, expired = false
  for (let frame = 0; frame < 280; frame++) {
    advanceGame(world, clock, 1 / 24)
    let angel = world.effects.find(effect => effect.angel)
    if (angel) {
      if (!seen) {
        angel.angel.lifetime = 100 // Supplied finite lifetime, identical in both runs.
        if (scenario === 'wrapped-chase') angel.x = 126 // Supplied wrap-edge origin after the normal projectile arrival.
        seen = true
      }
      phases.add(angel.angel.phase)
      targets.add(angel.angel.target)
      if (scenario === 'interrupted-retarget' && !interrupted && angel.angel.phase === 'striking') {
        const target = world.units.find(unit => unit.id === angel.angel.target)
        target.hp = 0
        if (target.native) target.native.life = 0
        interrupted = true
      }
    } else if (seen) expired = true
    if (frame === 70) {
      await store.saveCheckpoint(false)
      assert.equal(store.loadCheckpoint(), true)
      world = store.getWorld()
      checkpointed = true
    }
    const completeWorld = structuredClone(world)
    for (const effect of completeWorld.effects)
      if (effect.angel) delete effect.angel.presentation
    frames.push(hash(serialize(completeWorld)))
  }
  assert.ok(seen && expired && checkpointed, JSON.stringify({ scenario, seen, expired, checkpointed, turn: world.turn, phases: [...phases], angel: world.effects.find(effect => effect.angel)?.angel }))
  assert.ok(phases.has('seeking') && phases.has('striking') && phases.has('dying'), JSON.stringify({scenario, phases: [...phases], targets: [...targets], units: world.units.map(u => ({id:u.id,x:u.x,z:u.z,hp:u.hp,inside:u.inside}))}))
  if (scenario === 'interrupted-retarget') assert.ok(interrupted && targets.size >= 3)
  runs.push({ scenario, frames, phases: [...phases], targets: [...targets], finalTurn: world.turn,
    randomState: world.randomState, cosmeticRandom: world.cosmeticRandom, expired, checkpointed })
}
const result = {
  kind: 'complete-world-gameplay-identity',
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  trackedDiffSha256: hash(execFileSync('git', ['diff', 'HEAD'], { cwd: root })),
  sourceSha256: sourceBefore,
  driverSha256: hash(readFileSync(new URL(import.meta.url))),
  node: process.version,
  excludedFields: ['effects[*].angel.presentation'],
  scope: 'Supplied flat world, units, spell stock and finite lifetime; actual cast/projectile/clock/controller/damage/checkpoint paths. Not authored reward or browser evidence.',
  runs,
}
assert.equal(sourceFingerprint(), sourceBefore, 'Source changed during the gameplay trace')
if (comparison) {
  const baseline = JSON.parse(readFileSync(comparison, 'utf8'))
  assert.equal(result.driverSha256, baseline.driverSha256, 'Use the same driver for both traces')
  assert.deepEqual(result.runs, baseline.runs, 'Complete gameplay World differs outside Angel presentation')
  result.comparison = { status: 'passed', baselineHead: baseline.head, baselineSourceSha256: baseline.sourceSha256 }
}
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ output, scenarios: runs.length, completeWorldFrames: runs.reduce((n, r) => n + r.frames.length, 0) }))
