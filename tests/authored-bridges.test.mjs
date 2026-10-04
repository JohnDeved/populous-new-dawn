import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, select, command, tick } from '../app/model.ts'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { createLandBridge, stepLandBridge } from '../app/land-bridge.ts'

const stepUntil = (world, ready, limit = 1000) => {
  for (let turns = 0; !ready() && turns < limit; turns++) tick(world, 1 / 12)
  assert.ok(ready(), `Condition not reached by turn ${world.turn}`)
}
const bridgeHead = world => world.shrines.find(head => head.kind === 'bridgeEffect')
const expectedStart = { x: 47872, y: 24832 }
const expectedTarget = { x: 51968, y: 24832 }

function worshipBridge(world) {
  stepUntil(world, () => world.turn >= 122)
  select(world, 'shaman')
  assert.ok(command(world, bridgeHead(world)))
  stepUntil(world, () => bridgeHead(world).uses === 1)
  return world.effects.find(effect => effect.bridge)
}

test('authored origins survive initialization for all five currently live campaign bridge heads', () => {
  const expected = [
    [2, -113, 113, -77, -105],
    [5, -89, 15, -89, 15],
    [5, -53, -5, -51, -5],
    [6, 113, -127, -93, 63],
    [9, 113, 111, 103, 95],
  ]
  for (const [mission, x, z, sx, sz] of expected) {
    const shrine = createWorld(mission).shrines.find(h => h.x === x && h.z === z)
    assert.deepEqual(shrine.bridgeStart, { x: sx, z: sz })
    const legacy = createWorld(mission)
    for (const head of legacy.shrines) delete head.bridgeStart
    migrateCheckpoint(legacy)
    assert.deepEqual(legacy.shrines.find(h => h.x === x && h.z === z).bridgeStart, { x: sx, z: sz })
  }
  for (const mission of [1, 3]) assert.equal(createWorld(mission).shrines.some(h => h.kind === 'bridgeEffect'), false)
})

test('ordinary Mission 2 worship creates the authored crossing and every live terrain turn matches it', () => {
  const world = createWorld(2), effect = worshipBridge(world)
  assert.deepEqual(effect.bridge.start, expectedStart)
  assert.deepEqual(effect.bridge.target, expectedTarget)
  assert.deepEqual({ x: effect.x, z: effect.z }, { x: -77, z: -105 })
  assert.equal(effect.bridge.turn, 0)
  const reference = createLandBridge(expectedStart, expectedTarget)
  const land = { heights: world.land.heights.slice(), flags: world.land.flags.slice() }
  let alive = true
  while (alive) {
    alive = stepLandBridge(land, reference, () => {}, () => {})
    tick(world, 1 / 12)
    assert.deepEqual(world.land.heights, land.heights)
    assert.deepEqual(effect.bridge, reference)
    assert.equal(world.effects.includes(effect), alive)
  }
  assert.equal(reference.turn, 63)
  assert.equal(world.stats.bridges, 1)
  for (let turn = 0; turn < 100; turn++) tick(world, 1 / 12)
  assert.equal(world.stats.bridges, 1, 'A consumed head must not replay')
})

test('legacy migration recovers only missing immutable origins without replaying active terrain', () => {
  const world = createWorld(2), effect = worshipBridge(world), head = bridgeHead(world)
  for (let turn = 0; turn < 12; turn++) tick(world, 1 / 12)
  delete head.bridgeStart
  const before = structuredClone(world)
  migrateCheckpoint(world)
  assert.deepEqual(head.bridgeStart, { x: -77, z: -105 })
  delete head.bridgeStart
  assert.deepEqual(world, before, 'Migration changes no running effect, terrain, RNG or worship work')
  head.bridgeStart = { x: 3, z: 4 }
  migrateCheckpoint(world)
  assert.deepEqual(head.bridgeStart, { x: 3, z: 4 }, 'Existing checkpoint origin remains authoritative')
  delete head.bridgeStart
  head.bridgeTarget = { x: 99, z: 98 }
  migrateCheckpoint(world)
  assert.equal(head.bridgeStart, undefined, 'Unrecognized target is not guessed')
  assert.equal(effect.bridge.turn, 12)
})

test('pre-activation legacy save and mid-bridge checkpoint continue once at the authored origin', async () => {
  const store = createGameStore()
  store.startMission(2)
  const legacy = store.getWorld()
  delete bridgeHead(legacy).bridgeStart
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  let world = store.getWorld()
  assert.deepEqual(bridgeHead(world).bridgeStart, { x: -77, z: -105 })
  worshipBridge(world)
  for (let turn = 0; turn < 20; turn++) tick(world, 1 / 12)
  const state = structuredClone(world.effects.find(effect => effect.bridge).bridge)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  world = store.getWorld()
  assert.deepEqual(world.effects.find(effect => effect.bridge).bridge, state)
  stepUntil(world, () => !world.effects.some(effect => effect.bridge), 64)
  assert.equal(world.stats.bridges, 1)
  assert.equal(bridgeHead(world).uses, 1)
  const completedHeights = world.land.heights.slice()
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  world = store.getWorld()
  assert.deepEqual(world.land.heights, completedHeights)
  assert.equal(world.effects.some(effect => effect.bridge), false)
  for (let turn = 0; turn < 100; turn++) tick(world, 1 / 12)
  assert.equal(world.stats.bridges, 1)
  assert.equal(bridgeHead(world).uses, 1)
})
