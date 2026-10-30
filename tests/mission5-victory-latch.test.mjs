import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../app/model.ts'
import { campaignCommand, campaignRules } from '../app/campaign-command-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { createAngel } from '../app/world-effects.ts'
import script from '../app/original-script-five.json' with { type: 'json' }

const runAt = (world, turn) => {
  world.turn = turn // Supplied script-clock control; earned route is separate.
  withCampaignTribe(world, 1, () => campaignRules(world))
}
const query = (world, tribe = 1, destination = 65, input = script) =>
  withCampaignTribe(world, 1, () => campaignCommand(world, 1192, [tribe, destination], input))
const redShaman = world => world.units.find(unit => unit.team === 'red' && unit.kind === 'shaman')
const removeRedShaman = world => {
  const shaman = redShaman(world)
  world.units = world.units.filter(unit => unit !== shaman)
  return shaman
}

test('Mission5 retains the complete authored delayed victory block and field provenance', () => {
  assert.equal(script.sha256, 'd36d30538f7a7c391b3e9b69e7b43464b0d2996f0cd25ec7ec8355958d4998a7')
  assert.deepEqual(
    script.codes.slice(546, 599),
    [
      1000, 1014, 72, 1, 1003, 1006, 1192, 1, 65, 1000, 1020, 1012, 65, 1, 1013, 122, 14, 1003,
      1007, 72, 14, 1004, 1002, 1004, 1001, 1003, 1000, 1013, 72, 28, 1003, 1008, 72, 14, 1004,
      1001, 1003, 1000, 1014, 72, 28, 1003, 1006, 1170, 1007, 72, 57, 1004, 1002, 1004, 1002, 1004,
      1002,
    ]
  )
  assert.deepEqual(
    [120, 72, 65, 122, 1, 14, 28, 57].map(i => script.fields[i]),
    [
      [0, 31],
      [1, 13],
      [1, 6],
      [2, 1151],
      [0, 0],
      [0, 1],
      [0, 4],
      [0, 9],
    ]
  )
})

test('1192 counts only owned initialized Angel payloads, including dying until removal', () => {
  const world = createWorld(5)
  world.shots.angel = 20 // Supplied stock and presentation are not initialized payloads.
  world.effects.push({
    id: world.nextId++,
    kind: 'angel',
    team: 'blue',
    age: 0,
    duration: 100,
    x: 0,
    z: 0,
  })
  query(world)
  assert.equal(world.campaignAIs[1].variables[6], 0)
  const blue = createAngel(world, 'blue', { x: 0, z: 0 }),
    dying = createAngel(world, 'blue', { x: 1, z: 1 })
  createAngel(world, 'red', { x: 2, z: 2 })
  dying.angel.phase = 'dying'
  dying.angel.lifetime = 0
  dying.angel.timer = 1
  query(world)
  assert.equal(world.campaignAIs[1].variables[6], 2)
  query(world, 1119)
  assert.equal(world.campaignAIs[1].variables[6], 1)
  world.effects = world.effects.filter(effect => effect !== dying)
  query(world, 1118)
  assert.equal(world.campaignAIs[1].variables[6], 1)
  assert.ok(world.effects.includes(blue))
})

test('1192 returns a signed short and keeps malformed-input safety checks', () => {
  const world = createWorld(5),
    payload = createAngel(world, 'blue', { x: 0, z: 0 })
  world.effects = Array.from({ length: 32768 }, (_, id) => ({ ...payload, id }))
  query(world)
  assert.equal(world.campaignAIs[1].variables[6], -32768)
  const invalidTribe = { ...script, fields: [...script.fields, [0, 4]] },
    invalidDestination = { ...script, fields: [...script.fields, [1, 64]] }
  assert.throws(() => query(world, script.fields.length, 65, invalidTribe), RangeError)
  assert.throws(() => query(world, 1, script.fields.length, invalidDestination), RangeError)
})

for (const [angelTeam, shamanPresent] of [
  [null, false],
  ['red', false],
  ['blue', true],
])
  test(`supplied initial gate rejects Angel=${angelTeam} RedShaman=${shamanPresent}`, () => {
    const world = createWorld(5)
    if (angelTeam) createAngel(world, angelTeam, { x: 0, z: 0 })
    if (!shamanPresent) removeRedShaman(world)
    runAt(world, 31)
    assert.equal(world.campaignAIs[1].variables[13], 0)
    assert.equal(world.castingTribes[0].flags & 0x40000, 0)
  })

test('supplied winning latch preserves cadence, original ELSE ordering and public checkpoints', async () => {
  const store = await createCampaignFixtureStore([5])
  assert.equal(store.startMission(5), true)
  const world = store.getWorld(),
    shaman = removeRedShaman(world)
  createAngel(world, 'blue', { x: 0, z: 0 }).angel.phase = 'dying'
  runAt(world, 30)
  assert.equal(world.campaignAIs[1].variables[13], 0)
  runAt(world, 31)
  assert.equal(world.campaignAIs[1].variables[13], 1, 'first IF must not also execute its ELSE')
  // Once latched, the original script does not recheck either initial condition.
  world.effects = []
  world.units.push(shaman)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assert.deepEqual(restored, world)
  for (const [turn, expected] of [
    [62, 1],
    [63, 2],
    [95, 3],
    [127, 4],
    [158, 4],
    [159, 9],
    [191, 9],
  ]) {
    runAt(world, turn)
    runAt(restored, turn)
    assert.deepEqual(restored, world)
    assert.equal(world.campaignAIs[1].variables[13], expected)
    assert.equal(!!(world.castingTribes[0].flags & 0x40000), expected === 9)
  }
})
