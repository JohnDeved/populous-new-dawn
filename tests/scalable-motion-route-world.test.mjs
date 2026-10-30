import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore, migrateCheckpoint, CHECKPOINT_VERSION } from '../app/game-store.ts'
import { createWorld, addUnit, HOME } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { buildPersonRoute, attachPersonRoute, releasePersonRoute, motionRouteReferences } from '../app/person-routes.ts'

function build(world, p) {
  const routes = world.motionRoutes
  return buildPersonRoute(routes, p, { x: 10, y: 20 }, { x: 60, y: 80 }, 0, { flags: 0 }, {
    findVehicle() { assert.fail('No vehicle search requested') },
    search() { routes.pathResult.set([10, 20, 0, 0, 60, 80, 0, 0]); return 0 },
  })
}

test('500 distinct current route owners retain full graph aliases and deterministic release/reuse across Save/Load', async () => {
  const store = createGameStore(), world = store.getWorld(), people = []
  // Supplied ownership stress, not ordinary 500-person movement acceptance.
  for (let i = 0; i < 500; i++) {
    const unit = addUnit(world, 'blue', 'warrior', HOME), p = createLivePerson(world, unit)
    unit.native = p
    registerLivePerson(world, p)
    world.pathfinding.people.set(p.id, p)
    attachPersonRoute(world.motionRoutes, p, build(world, p), i % 7 === 0)
    people.push(p)
  }
  assert.equal(world.motionRoutes.active, 500)
  const transported = checkpointCodec(JSON.parse(JSON.stringify(checkpointCodec({ version: CHECKPOINT_VERSION, world }))), true)
  assert.equal(transported.version, 3)
  assert.ok(transported.world.motionRoutes.references instanceof Float64Array)
  assert.deepEqual(transported.world, world, 'JSON transport preserves full bytes, counts and aliases')
  const expected = migrateCheckpoint(transported.world)
  await store.saveCheckpoint()
  store.restart()
  assert.equal(store.getWorld().motionRoutes.references.length, 401)
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.deepEqual(restored, expected)
  for (const p of people) {
    const twin = restored.pathfinding.people.get(p.id)
    assert.equal(twin, restored.units.find(u => u.id === p.id).native)
    assert.equal(twin, restored.objectCells.objects.get(p.id))
    assert.equal(motionRouteReferences(restored.motionRoutes, twin.motionGroup), 1)
  }
  for (let i = 0; i < people.length; i += 7) {
    const p = people[i], twin = restored.pathfinding.people.get(p.id), id = p.motionGroup
    releasePersonRoute(world.motionRoutes, p)
    releasePersonRoute(restored.motionRoutes, twin)
    world.motionRoutes.cursor = restored.motionRoutes.cursor = id - 1
    assert.equal(build(world, p), id)
    assert.equal(build(restored, twin), id)
    attachPersonRoute(world.motionRoutes, p, id)
    attachPersonRoute(restored.motionRoutes, twin, id)
  }
  assert.deepEqual(migrateCheckpoint(structuredClone(world)), restored)
  await store.saveCheckpoint()
})

test('real scalable Boat boarding shares wide route handles and releases passenger ownership', () => {
  const world = createWorld(5, 'scalable'), boat = world.vehicles[0],
    [a, b] = world.units.filter(u => u.team === 'blue' && u.kind === 'warrior'),
    driver = createLivePerson(world, a), passenger = createLivePerson(world, b), routes = world.motionRoutes
  // Supplied capacity isolates the live consumer without adding unrelated owners.
  routes.records = new Uint8Array(802 * 109)
  routes.references = new Float64Array(802)
  routes.cursor = 499
  for (const [u, p] of [[a, driver], [b, passenger]]) {
    u.native = p
    world.pathfinding.people.set(p.id, p)
    Object.assign(p, { goalX: 10_000, goalY: 12_000 })
    attachPersonRoute(routes, p, build(world, p))
  }
  assert.equal(driver.motionGroup, 500)
  assert.equal(passenger.motionGroup, 501)
  driver.motionIndex = 3
  boat.active = true
  boat.passengers = []
  boat.passengerCount = 0
  assert.ok(boardLiveVehicle(world, driver, boat))
  assert.ok(boardLiveVehicle(world, passenger, boat))
  assert.equal(passenger.motionGroup, 500)
  assert.equal(passenger.motionIndex, 3)
  assert.equal(motionRouteReferences(routes, 500), 2)
  assert.equal(motionRouteReferences(routes, 501), 0)
  assert.equal(routes.active, 1)
  releasePersonRoute(routes, driver)
  assert.equal(motionRouteReferences(routes, 500), 1)
  releasePersonRoute(routes, passenger)
  assert.equal(routes.active, 0)
})

test('JSON route transport preserves safe-integer counts exactly and never repairs malformed ownership', () => {
  const world = createWorld(1, 'scalable')
  for (const count of [32_768, 65_536, Number.MAX_SAFE_INTEGER]) {
    world.motionRoutes.references[1] = count
    const record = checkpointCodec(JSON.parse(JSON.stringify(checkpointCodec({ version: CHECKPOINT_VERSION, world }))), true)
    assert.ok(record.world.motionRoutes.references instanceof Float64Array)
    assert.equal(record.world.motionRoutes.references[1], count)
    assert.throws(() => migrateCheckpoint(record.world), /motion-route ownership/)
    assert.equal(record.world.motionRoutes.references[1], count, 'validation never narrows or reconstructs')
  }
  delete world.motionRoutes.references
  const missing = checkpointCodec(JSON.parse(JSON.stringify(checkpointCodec(world))), true)
  assert.throws(() => migrateCheckpoint(missing), /motion-route pool/)
  assert.equal(missing.motionRoutes.references, undefined)
})

test('actual scalable boarding can adopt a driver without a route and remains saveable', async () => {
  const store = await createCampaignFixtureStore([5])
  assert.equal(store.startMission(5), true)
  const world = store.getWorld(), boat = world.vehicles[0],
    units = [0, 1].map(i => addUnit(world, 'blue', 'warrior', { x: i, z: 0 })),
    [driver, passenger] = units.map(u => createLivePerson(world, u))
  for (const [i, p] of [driver, passenger].entries()) {
    units[i].native = p
    registerLivePerson(world, p)
    world.pathfinding.people.set(p.id, p)
    Object.assign(p, { goalX: 10_000, goalY: 12_000 })
  }
  driver.motionIndex = 3
  attachPersonRoute(world.motionRoutes, passenger, build(world, passenger))
  boat.active = true
  boat.passengers = []
  boat.passengerCount = 0
  assert.ok(boardLiveVehicle(world, driver, boat))
  assert.ok(boardLiveVehicle(world, passenger, boat))
  assert.equal(passenger.motionGroup, 0)
  assert.equal(passenger.motionIndex, 3, 'copy driver index after release and sentinel adoption')
  assert.equal(world.motionRoutes.active, 0)
  assert.equal(world.motionRoutes.references[0], 0)
  assert.ok(world.motionRoutes.references.every(count => count === 0))
  const expected = migrateCheckpoint(structuredClone(world))
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld(), expected)
})
