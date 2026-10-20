import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createGameStore, migrateCheckpoint } from '../../app/game-store.ts'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { addUnit, syncLandscapeObjects } from '../../app/model.ts'
import { createAngel } from '../../app/world-effects.ts'
import { createLivePerson, syncLivePersonCells } from '../../app/live-people.ts'
import { advanceGame } from '../../app/game-clock.ts'
import { queueTerrain, updateWalkMasks } from '../../app/native-terrain.ts'
import { retainFixtureUnits } from '../../tests/level-start-fixture.mjs'
import { checkpointCodec } from './checkpoint-codec.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
export function angelCheckpointState(world) {
  return { turn: world.turn, time: world.time, pendingTime: world.pendingTime,
    randomState: world.randomState, cosmeticRandom: structuredClone(world.cosmeticRandom),
    angels: world.effects.filter(f => f.angel).map(f => ({ id: f.id, team: f.team, x: f.x, z: f.z,
      height: f.height, angel: structuredClone(f.angel) })) }
}

// Supplied isolated renderer setup, not a campaign/earned-stock/native encounter.
export function createAngelVisualFixture(source) {
  const root = resolve(import.meta.dirname, '../..')
  assert.match(source?.commit ?? '', /^[a-f0-9]{40}$/)
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), source.commit)
  assert.equal(execFileSync('git', ['diff', 'HEAD', '--', 'app', 'tests/level-start-fixture.mjs'], { cwd: root, encoding: 'utf8' }), '', 'Fixture production inputs must match the exact commit')
  const store = createGameStore(), world = store.getWorld()
  world.manaWorld.loadFlags |= 0x200 // Declared isolated-controller gate, same as gameplay identity fixture.
  world.inputMask = 0; world.flyby.flags &= ~1; world.flyby.warmup = 0
  world.terrain.fill(3); world.land.heights.fill(135); world.terrainVersion++
  queueTerrain(world.land, 0, 64, 1, { surface() {}, globe() {} }); updateWalkMasks(world.land, 0, 64)
  world.landVersion = world.terrainVersion
  retainFixtureUnits(world, () => false)
  world.buildings = []; world.shrines = []; world.trees = []
  world.vehicles = []; world.effects = []; world.projectiles = []
  syncLandscapeObjects(world)
  const shaman = addUnit(world, 'blue', 'shaman', { x: 0, z: 0 })
  shaman.invisibility = 1000 // Declared target exclusion keeps the camera anchor alive.
  const owners = ['blue', 'red', 'yellow', 'green'], ids = []
  for (const [owner, team] of owners.entries()) {
    const point = { x: owner % 2 ? 5 : -5, z: owner < 2 ? -5 : 5 }
    const victim = addUnit(world, owners[(owner + 1) % 4], 'brave', { x: point.x + 0.5, z: point.z })
    victim.native = createLivePerson(world, victim); victim.native.state = 14
    const effect = createAngel(world, team, point)
    effect.angel.lifetime = 80
    ids.push(effect.id)
  }
  // Persistent original native model provides a shared-atlas cleanup neighbour.
  const neighbour = { id: world.nextId++, x: 9, z: -5, logs: 4, model: 0 }
  world.trees.push(neighbour); syncLandscapeObjects(world); syncLivePersonCells(world)
  const clock = { animationTime: 0, animationFrame: 0 }
  for (let frame = 0; frame < 4; frame++) advanceGame(world, clock, 1 / 24)
  world.paused = true; world.selected = []; world.mode = null
  assert.equal(world.inputMask, 0)
  assert.equal(world.effects.filter(f => f.angel).length, 4)
  assert.ok(world.effects.filter(f => f.angel).every(f => f.angel.presentation.renderFlags & 0x1000))
  const record = { version: CHECKPOINT_VERSION, world }, expectedWorld = migrateCheckpoint(migrateCheckpoint(structuredClone(world)))
  const transfer = checkpointCodec(record), expected = checkpointCodec(expectedWorld)
  assert.deepEqual(checkpointCodec(transfer, true), record)
  return { transfer, expected, receipt: { sourceCommit: source.commit, version: CHECKPOINT_VERSION,
    generatorSha256: sha(readFileSync(import.meta.filename)), codecSha256: sha(readFileSync(new URL('./checkpoint-codec.mjs', import.meta.url))),
    transferSha256: sha(JSON.stringify(transfer)), expectedSha256: sha(JSON.stringify(expected)),
    ids, owners, shamanId: shaman.id, neighbourId: neighbour.id, focus: { x: 0, z: 0 },
    state: angelCheckpointState(expectedWorld),
    supplied: 'Mission1 world; flat dry full-map terrain135; isolated-controller loadFlags0x200; input/flyby unlocked; four Angels/nearby reserved victims; invisible camera-anchor Shaman excluded from targets; finite lifetime80; native tree neighbour; four actual24Hz preparation visits; paused current-format checkpoint. No earned acquisition or original framebuffer claim.' } }
}
