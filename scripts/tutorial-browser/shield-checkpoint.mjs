import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { checkpointCodec } from './checkpoint-codec.mjs'

export const shieldFixtureRemainingTurns = 180
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

// Declared test setup, not an earned stock route or an ordinary campaign save.
// No fixture mutator is shipped or imported by the browser.
export async function makeShieldCheckpoint() {
  const { loadSceneFixture } = await import('../../tests/support/bloodlust-scene.mjs')
  const api = await loadSceneFixture()
  const { createStartedWorld, retainFixtureUnits } = await import('../../tests/level-start-fixture.mjs')
  const { createLivePerson, syncLivePersonCells } = await import('../../app/live-people.ts')
  const { interruptFlyby, stepFlyby } = await import('../../app/flyby.ts')
  const world = createStartedWorld(2, 'scalable')
  const camera = { x: 0, y: 0, angle: 0, zoom: 0 }
  interruptFlyby(world.flyby, camera)
  for (let visit = 0; world.flyby.flags & 1 && visit < 4096; visit++)
    stepFlyby(world.flyby, camera, 24)
  assert.equal(world.flyby.flags & 1, 0)
  if (!(world.flyby.flags & 1)) world.inputMask &= ~64
  retainFixtureUnits(world, () => false)
  world.buildings = []
  world.trees = []
  world.shrines = []
  world.effects = []
  world.terrain.fill(3)
  world.terrainVersion++
  api.syncLandscapeObjects(world)
  world.manaWorld.gameFlags |= 2 // Declared fixture: no campaign AI turns.
  world.manaWorld.loadFlags |= 0x200 // Declared fixture: no victory/defeat transition.
  world.outcome.alliances.fill(15)
  const shaman = api.addUnit(world, 'blue', 'shaman', { x: 0, z: 0 })
  const blue = Array.from({ length: 6 }, (_, index) =>
    api.addUnit(world, 'blue', 'brave', { x: 4 + index % 3 * 2, z: -4 - Math.floor(index / 3) * 2 }))
  const foreign = [
    api.addUnit(world, 'red', 'brave', { x: -6, z: -5 }),
    api.addUnit(world, 'yellow', 'brave', { x: 0, z: -9 }),
    api.addUnit(world, 'green', 'brave', { x: 6, z: -11 }),
  ]
  world.selected = [shaman.id]
  world.mode = null
  world.speed = 1
  world.paused = false
  for (const unit of world.units) unit.native = createLivePerson(world, unit)
  syncLivePersonCells(world)
  // Initialize live people through real object turns, not assigned draw phases.
  for (let turn = 0; turn < 8; turn++) api.tick(world, 1 / 12)
  for (const unit of foreign) {
    assert.deepEqual(api.shieldFollowers(world, unit, unit.team), [unit])
    // Only the offline supplied checkpoint has a declared remaining timer.
    // Browser execution must never rewrite this or manufacture expiry.
    unit.shield = shieldFixtureRemainingTurns
    assert.ok(unit.native.flags3 & 0x8000)
  }
  world.shots.shield = 1
  world.castingTribes[0].cooldown = 0
  world.paused = true
  assert.equal(world.inputMask, 0)
  assert.equal(world.status, 'playing')
  assert.equal(blue.some(unit => unit.shield), false)
  const checkpoint = { version: CHECKPOINT_VERSION, world }
  return {
    checkpoint,
    ids: { shaman: shaman.id, blue: blue.map(unit => unit.id), foreign: foreign.map(unit => unit.id) },
    target: { x: 6, z: -5 },
  }
}

export async function createShieldCheckpoint(output, source) {
  const fixture = await makeShieldCheckpoint()
  const { checkpoint } = fixture
  const transfer = checkpointCodec(checkpoint)
  assert.deepEqual(checkpointCodec(transfer, true), checkpoint)
  const { loadSceneFixture } = await import('../../tests/support/bloodlust-scene.mjs')
  const { migrateCheckpoint } = await loadSceneFixture()
  // This is the current normalizer, never historical version migration.
  const expected = checkpointCodec(migrateCheckpoint(migrateCheckpoint(structuredClone(checkpoint.world))))
  const json = JSON.stringify(transfer)
  assert.ok(Buffer.byteLength(json) < 16 * 1024 * 1024, 'Bound Shield checkpoint transfer')
  const receipt = {
    method: 'TEST SETUP: supplied current-format M2 field checkpoint, not earned stock or campaign progression',
    version: checkpoint.version, sourceCommit: source.commit, sourceFiles: source.files,
    transferSha256: sha(json), expectedLoadedSha256: sha(JSON.stringify(expected)),
    turn: checkpoint.world.turn, randomState: checkpoint.world.randomState,
    cosmeticRandom: checkpoint.world.cosmeticRandom, ids: fixture.ids, target: fixture.target,
    supplied: { shieldShots: 1, foreignRemainingTurns: shieldFixtureRemainingTurns,
      foreignStatusVia: 'shieldFollowers, then offline declared remaining timer',
      terrain: 'flat height 3', population: 'one Blue Shaman, six Blue braves, one brave per other owner',
      alliances: [15, 15, 15, 15], suppressCampaignAI: true, suppressOutcome: true,
      introduction: 'offline interruptFlyby after real opening turns' },
    limits: ['Public input will spend supplied stock. Stock acquisition is not covered.',
      'Foreign status is a declared near-expiry checkpoint, not a cast or a full native lifetime claim.',
      'No original executable is run. No browser-side gameplay/status/clock assignment is permitted.'],
  }
  writeFileSync(resolve(output, 'shield-checkpoint-transfer.json'), json, { flag: 'wx' })
  writeFileSync(resolve(output, 'shield-checkpoint-expected.json'), JSON.stringify(expected), { flag: 'wx' })
  writeFileSync(resolve(output, 'shield-checkpoint-source.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' })
  return { transfer, expected, receipt, ids: fixture.ids, target: fixture.target }
}
