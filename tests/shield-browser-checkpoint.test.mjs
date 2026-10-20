import assert from 'node:assert/strict'
import test from 'node:test'
import { CHECKPOINT_VERSION } from '../app/checkpoint-format.ts'
import { makeShieldCheckpoint, shieldFixtureRemainingTurns } from '../scripts/tutorial-browser/shield-checkpoint.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('supplied current checkpoint preserves typed ownership and admits real cast and natural foreign expiry', async () => {
  const api = await loadSceneFixture()
  const fixture = await makeShieldCheckpoint()
  assert.equal(fixture.checkpoint.version, CHECKPOINT_VERSION)
  const restored = checkpointCodec(checkpointCodec(fixture.checkpoint), true)
  assert.deepEqual(restored, fixture.checkpoint)
  const world = api.migrateCheckpoint(api.migrateCheckpoint(restored.world))
  assert.ok(world.objectCells.heads instanceof Float64Array)
  assert.equal(world.capacityPolicy.mode, 'scalable')
  assert.equal(world.shots.shield, 1)
  assert.equal(world.paused, true)
  assert.equal(world.inputMask, 0)
  assert.equal(world.speed, 1)
  const blue = fixture.ids.blue.map(id => world.units.find(unit => unit.id === id))
  const foreign = fixture.ids.foreign.map(id => world.units.find(unit => unit.id === id))
  assert.ok(blue.every(unit => !unit.shield && !(unit.native.flags3 & 0x8000)))
  assert.ok(foreign.every(unit => unit.shield === shieldFixtureRemainingTurns && unit.native.flags3 & 0x8000))
  world.paused = false
  assert.equal(api.cast(world, 'shield', fixture.target), true)
  const start = world.turn
  for (let elapsed = 1; elapsed <= shieldFixtureRemainingTurns; elapsed++) {
    api.tick(world, 1 / 12)
    assert.equal(world.turn, start + elapsed)
    assert.ok(foreign.every(unit => unit.shield === shieldFixtureRemainingTurns - elapsed))
    assert.ok(world.units.every(unit => !unit.fight))
  }
  assert.equal(world.shots.shield, 0)
  assert.equal(blue.length, 6)
  assert.ok(blue.every(unit => unit.shield > 0 && unit.native.flags3 & 0x8000))
  assert.ok(foreign.every(unit => unit.shield === 0 && !(unit.native.flags3 & 0x8000)))
  assert.ok(world.units.every(unit => !unit.bloodlust), 'Fixture must not manufacture a Bloodlust route')
})
