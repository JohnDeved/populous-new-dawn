import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { missionData } from '../app/mission-data.ts'
const advanceTo = (world, turn) => {
  while (world.turn < turn) tick(world, 1 / 12)
}

for (const delta of [-1, 1])
  test(`Mission 21 third fault seals on sampled height difference ${delta}`, () => {
    let world = createWorld(21)
    const packed = missionData(21).level.markers[94],
      cell = ((packed & 0xfe00) >> 9) * 128 + ((packed & 254) >> 1),
      baseline = world.campaignAIs[1].variables[17]
    assert.equal(baseline, 238)
    assert.equal(world.land.heights[cell], baseline)
    world.land.heights[cell] += delta
    world.turn = 7487
    campaignRules(world)
    assert.equal(world.campaignAIs[1].variables[24], 0)
    world.turn = 7519
    campaignRules(world)
    assert.equal(world.campaignAIs[1].variables[24], 2)
    world.land.heights[cell] = baseline
    world = migrateCheckpoint(structuredClone(world))
    world.turn = 8127
    campaignRules(world)
    assert.equal(world.campaignAIs[1].variables[24], 2)
    assert.equal(
      world.messages.slots.some(message => message?.view?.cell === 49754),
      false
    )
  })

test('Mission 21 third fault preserves the strict deadline and one eruption through checkpoints', async () => {
  const store = createGameStore()
  store.startMission(21)
  let world = store.getWorld()
  advanceTo(world, 7519)
  assert.equal(world.campaignAIs[1].variables[21], 0)
  advanceTo(world, 7520)
  assert.equal(world.campaignAIs[1].variables[21], 1)
  assert.equal(world.campaignAIs[1].variables[24], 0)
  assert.equal(await store.saveCheckpoint(false), false, 'Node has no IndexedDB; session Save only')
  assert.ok(store.loadCheckpoint())
  const openingReplay = store.getWorld()
  assert.deepEqual(openingReplay, world)
  while (world.turn < 8127) {
    tick(world, 1 / 12)
    tick(openingReplay, 1 / 12)
    if (world.turn % 32 === 0) assert.deepEqual(openingReplay, world)
  }
  assert.deepEqual(openingReplay, world)
  world = openingReplay
  assert.equal(world.campaignAIs[1].variables[24], 0)
  advanceTo(world, 8128)
  assert.equal(world.campaignAIs[1].variables[24], 1)
  const message = world.messages.slots.find(message => message?.view?.cell === 49754)
  assert.deepEqual(message.view, { cell: 49754, payload: 16668 })
  assert.equal(message.lifetime, 256)
  assert.ok(world.effects.some(effect => effect.volcano && effect.x === 85 && effect.z === 53))
  const eruptionId = world.effects.find(
    effect => effect.volcano && effect.x === 85 && effect.z === 53
  ).id
  assert.equal(await store.saveCheckpoint(false), false)
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, world)
  while (world.turn < 8288) {
    tick(world, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, world)
    assert.deepEqual(
      world.effects.filter(e => e.volcano && e.x === 85 && e.z === 53).map(e => e.id),
      world.turn < 8288 ? [eruptionId] : []
    )
  }
  assert.equal(world.campaignAIs[1].variables[24], 2)
  assert.equal(world.messages.slots.filter(message => message?.view?.cell === 49754).length, 1)
})

test('Mission 21 ignores a third-fault height change restored before opening', () => {
  const world = createWorld(21),
    packed = missionData(21).level.markers[94],
    cell = ((packed & 0xfe00) >> 9) * 128 + ((packed & 254) >> 1),
    baseline = world.land.heights[cell]
  world.land.heights[cell]--
  world.turn = 7487
  campaignRules(world)
  world.land.heights[cell] = baseline
  world.turn = 7519
  campaignRules(world)
  assert.equal(world.campaignAIs[1].variables[24], 0)
  assert.equal(world.campaignAIs[1].variables[21], 1)
  world.turn = 8127
  campaignRules(world)
  assert.equal(world.campaignAIs[1].variables[24], 1)
  assert.equal(world.messages.slots.filter(message => message?.view?.cell === 49754).length, 1)
})
