import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { checkpointCodec } from './checkpoint-codec.mjs'

// Node-only supplied setup, never imported by the production Home bundle.
// Training uses the real entry/queue/departure controller. Disguise and command15
// are deliberately NOT issued here: the browser must issue both through its UI.
export async function createSpySourceFixture(sourceCommit) {
  const { loadSceneFixture } = await import('../../tests/support/bloodlust-scene.mjs')
  const api = await loadSceneFixture()
  const { createStartedWorld, retainFixtureUnits } = await import('../../tests/level-start-fixture.mjs')
  const world = createStartedWorld(1, 'scalable')
  retainFixtureUnits(world, unit => unit.kind === 'shaman')
  world.terrain.fill(3)
  world.terrainVersion++
  world.manaWorld.gameFlags = 32
  const school = api.addBuilding(world, 'blue', 'spyHut', { x: -2, z: 32 }, true,
    { angle: 3 * Math.PI / 2 })
  const brave = api.addUnit(world, 'blue', 'brave', { x: 7, z: 33 })
  const stages = []
  const until = (stage, ready, limit = 2000) => {
    let visits = 0
    while (!ready() && visits++ < limit) api.tick(world, 1 / 12)
    assert.ok(ready(), `Spy fixture did not reach ${stage}`)
    stages.push({ stage, visits, turn: world.turn })
  }
  world.selected = [brave.id]
  assert.equal(api.command(world, school), true)
  until('admitted', () => brave.inside === school.id && !brave.entry?.person.speed)
  world.manaWorld.gameFlags = 0
  school.timer = 65535
  until('trained', () => world.units.some(unit => unit.team === 'blue' && unit.kind === 'spy'))
  const spy = world.units.find(unit => unit.team === 'blue' && unit.kind === 'spy')
  until('departed', () => spy.inside === null && !spy.entry && !spy.path.length)
  const target = api.addBuilding(world, 'red', 'hut', { x: spy.x + 5, z: spy.z }, true)
  world.selected = []
  world.paused = true
  assert.notEqual(spy.native?.object, 136, 'Never seed the animation under test')
  assert.equal(spy.native?.disguise ?? 0, 0)
  const checkpoint = { version: CHECKPOINT_VERSION, world }, transfer = checkpointCodec(checkpoint)
  assert.deepEqual(checkpointCodec(transfer, true), checkpoint)
  const encoded = JSON.stringify(transfer)
  assert.ok(Buffer.byteLength(encoded) < 16 * 1024 * 1024)
  const expected = checkpointCodec(api.migrateCheckpoint(api.migrateCheckpoint(structuredClone(world))))
  return { transfer, expected, spyId: spy.id, targetId: target.id, receipt: {
    sourceCommit, version: CHECKPOINT_VERSION, level: 1, turn: world.turn, stages,
    spyId: spy.id, targetId: target.id, schoolId: school.id,
    transferSha256: createHash('sha256').update(encoded).digest('hex'),
    setup: 'Supplied flat terrain, school, Brave, training funding and nearby hostile hut. Real public command trains and releases the Spy. Browser must issue disguise and sabotage through shipped controls.',
    limits: 'Current-format test checkpoint, not natural Mission 12 acquisition, campaign unlock, original-game runtime or original raster evidence.',
  } }
}
