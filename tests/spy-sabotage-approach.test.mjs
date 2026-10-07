import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, browserPosition } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { stepLiveBuildingAttack } from '../app/live-building-combat.ts'
import { clearLivePath } from '../app/live-pathfinding.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { buildingSabotagePoint, buildingOutsidePoint, buildingPose } from '../app/building-shapes.ts'
import { randomPersonSpeed } from '../app/person-state.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

// Supplied unobstructed mechanics setup. Every order uses the production command
// caller; the unchanged training-to-Spy test remains the integration witness.
function scenario() {
  const w = createStartedWorld()
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.manaWorld.gameFlags = 96
  w.terrain.fill(3)
  w.terrainVersion++
  w.randomState = 0
  const target = addBuilding(w, 'red', 'hut', { x: 20, z: 40 }, true),
    spy = addUnit(w, 'blue', 'spy', { x: 10, z: 30 }),
    person = (spy.native = createLivePerson(w, spy))
  registerLivePerson(w, person)
  w.selected = [spy.id]
  return { w, target, spy, person }
}

test('Spy input attaches command15 without eagerly planning the outside-point route', () => {
  const { w, target, spy, person } = scenario(),
    before = [person.goalX, person.goalY, person.counter, person.x, person.y]
  assert.equal(command(w, target), true)
  assert.equal(spy.native, person)
  assert.equal(w.objectCells.objects.get(spy.id), person)
  assert.equal(currentPersonOrder(w.buildingOrders, person).model, 15)
  assert.equal(spy.target, target.id)
  assert.equal(w.pathfinding.people.has(spy.id), false)
  assert.deepEqual([person.goalX, person.goalY, person.counter, person.x, person.y], before)
})

test('the first Spy controller visit plans the original non-occupancy mask target once', () => {
  const { w, target, spy, person } = scenario()
  assert.equal(target.object, 134)
  command(w, target)
  const order = currentPersonOrder(w.buildingOrders, person)
  stepLiveBuildingAttack(w, spy)
  // Raw object134/rotation0 has mask0x26 at cell13582. The reviewed producer
  // chooses its north edge toward the inside point: (7424, 54304).
  assert.deepEqual([person.goalX, person.goalY], [7424, 54304])
  assert.equal(person.flags2 & 0x40000000, 0)
  assert.equal(person.substate, 0)
  assert.equal(spy.native, person)
  assert.equal(currentPersonOrder(w.buildingOrders, person), order)
  const random = w.randomState
  stepLiveBuildingAttack(w, spy)
  assert.equal(w.randomState, random, 'the next approach visit must not repeat recovery RNG')
  assert.equal(currentPersonOrder(w.buildingOrders, person), order)
})

test('Spy arrival reads signed goal fields and starts the wait only on the next controller visit', () => {
  const { w, target, spy, person } = scenario()
  command(w, target)
  clearLivePath(w, spy)
  person.flags2 &= ~0x40000000
  person.speed = 0
  person.goalX = person.x + 11
  person.goalY = person.y + 11
  person.timer = 37
  spy.path = [{ x: target.x, z: target.z }]
  stepLiveBuildingAttack(w, spy)
  assert.equal(person.substate, 1, 'a browser path-cache tail cannot veto native arrival')
  assert.equal(person.timer, 37, 'arrival only arms phase1')
  assert.ok(person.flags2 & 0x40000000)
  stepLiveBuildingAttack(w, spy)
  assert.equal(person.speed, 0)
  assert.equal(person.timer, 9, 'phase1 initializes ten and decrements on its first visit')
  assert.equal(person.flags2 & 0x40000000, 0)
})

test('Spy goal arrival does not wrap across the signed coordinate seam', () => {
  const { w, target, spy, person } = scenario()
  command(w, target)
  clearLivePath(w, spy)
  person.flags2 &= ~0x40000000
  person.speed = 0
  person.x = 32767
  person.y = 2000
  person.goalX = 32768
  person.goalY = 2000
  Object.assign(spy, browserPosition(person))
  const order = currentPersonOrder(w.buildingOrders, person)
  stepLiveBuildingAttack(w, spy)
  assert.equal(person.substate, 0)
  assert.equal(currentPersonOrder(w.buildingOrders, person), order)
})

test('Spy shape targets use all mask cells, rotated edges, wrapping and the outside fallback', () => {
  // Source-derived coordinates from raw shapes15–18, marker masks0x24/0x26
  // and the reviewed quadrant table. These are not executable-native captures.
  const expected = [[8448, 9248], [9248, 8448], [8448, 7648], [7648, 8448]]
  for (let direction = 0; direction < 4; direction++) {
    const point = buildingSabotagePoint({ object: 134, angle: direction * 512, anchorX: 8192, anchorY: 8192 })
    assert.deepEqual([point.x, point.y], expected[direction])
  }
  assert.deepEqual(buildingSabotagePoint({ object: 134, angle: 0, anchorX: 65024, anchorY: 65024 }),
    { x: 65280, y: 544 })
  // Shape35 has no bit0x20: its outside point (8640,7040) supplies the
  // coarse cell, then the producer chooses its inside-facing edge.
  assert.deepEqual(buildingSabotagePoint({ object: 100, angle: 0, anchorX: 8192, anchorY: 8192 }),
    { x: 8448, y: 7136 })
})

test('Spy planning failure falls back outside within the same entry-gated visit', () => {
  const { w, target, spy, person } = scenario()
  command(w, target)
  person.speed = 0
  const goal = buildingSabotagePoint(buildingPose(target)),
    cache = w.motionRoutes.failedSearches,
    view = new DataView(cache.buffer, cache.byteOffset, cache.byteLength)
  // Supply an existing native failed-route cache entry. The real planner owns
  // its failure flag and the actual command15 consumer must choose the fallback.
  view.setInt16(0, 16, true)
  cache[2] = (person.x >> 8) & 254
  cache[3] = (person.y >> 8) & 254
  cache[6] = (goal.x >> 8) & 254
  cache[7] = (goal.y >> 8) & 254
  const expectedRng = { randomState: w.randomState },
    expectedSpeed = randomPersonSpeed(expectedRng, person)
  stepLiveBuildingAttack(w, spy)
  assert.deepEqual({ x: person.goalX, y: person.goalY }, buildingOutsidePoint(buildingPose(target)))
  assert.equal(person.flags4 & 0x10000000, 0, 'the successful outside retry clears the planning failure')
  assert.equal(person.flags2 & 0x40000000, 0)
  assert.equal(person.speed, expectedSpeed)
  assert.equal(w.randomState, expectedRng.randomState, 'recovery consumes one native speed draw')
  stepLiveBuildingAttack(w, spy)
  assert.equal(w.randomState, expectedRng.randomState, 'ordinary approach does not repeat recovery')
})

test('Spy approach and armed wait checkpoints retain the registered owner, order and next-visit timing', () => {
  for (const waiting of [false, true]) {
    const { w, target, spy, person } = scenario()
    command(w, target)
    stepLiveBuildingAttack(w, spy)
    if (waiting) {
      person.x = person.goalX
      person.y = person.goalY
      person.speed = 0
      Object.assign(spy, browserPosition(person))
      stepLiveBuildingAttack(w, spy)
      assert.equal(person.substate, 1)
      assert.ok(person.flags2 & 0x40000000)
    }
    const restored = migrateCheckpoint(structuredClone(w)),
      copy = restored.units.find(u => u.id === spy.id)
    assert.equal(restored.objectCells.objects.get(spy.id), copy.native)
    for (let visit = 0; visit < 8; visit++) {
      stepLiveBuildingAttack(w, spy)
      stepLiveBuildingAttack(restored, copy)
      assert.deepEqual(copy.native, person)
      assert.deepEqual(restored.buildingOrders, w.buildingOrders)
      assert.equal(restored.randomState, w.randomState)
      if (waiting && visit === 0) assert.equal(copy.native.timer, 9)
    }
  }
})
