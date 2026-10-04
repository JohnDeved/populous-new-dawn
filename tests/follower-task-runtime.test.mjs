import test from 'node:test'
import assert from 'node:assert/strict'
import { addUnit, addBuilding, createWorld, nativePosition, tick, command, guardShaman } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { BuilderTask } from '../app/building-workers.ts'
import { hudTaskPeople, selectFollowerTask } from '../app/follower-tasks-runtime.ts'
import { followerTaskCounts } from '../app/hud-tasks.ts'

function setup() {
  const world = createWorld(1)
  world.units = []; world.buildings = []; world.shrines = []; world.trees = []
  world.terrain.fill(3); world.terrainVersion++; world.manaWorld.gameFlags = 32
  const unit = addUnit(world, 'blue', 'brave', { x: 0, z: 8 })
  unit.native = createLivePerson(world, unit)
  unit.native.state = 19
  return { world, unit }
}
const category = (world, unit) => hudTaskPeople(world).find(p => p.id === unit.id).category

test('shipped G has the recovered guard task without mutating native ownership in HUD reads', () => {
  const { world, unit } = setup()
  addUnit(world, 'blue', 'shaman', { x: 2, z: 8 })
  world.selected = [unit.id]
  guardShaman(world)
  assert.equal(unit.guard, true)
  const before = structuredClone(world)
  assert.equal(category(world, unit), 4)
  assert.deepEqual(world, before)
  guardShaman(world)
  assert.equal(unit.guard, false)
  assert.equal(category(world, unit), 0, 'dormant native state10/status0 is not falsely relabelled Idle')
})

test('specific legacy work overrides dormant idle while real native disruption remains authoritative', () => {
  const { world, unit } = setup()
  unit.tree = 123
  assert.equal(category(world, unit), 4)
  unit.tree = null; unit.delivery = { target: 321 }
  assert.equal(category(world, unit), 4)
  unit.native.state = 22
  assert.equal(category(world, unit), 0, 'native casting is not overwritten by retained delivery')
  unit.native.state = 19; unit.delivery = undefined; unit.cargo = 1
  assert.equal(category(world, unit), 2, 'carrying wood alone is not a task')
  const before = structuredClone(world)
  hudTaskPeople(world)
  assert.deepEqual(world, before)
})

test('construction, pre-entry, actual entry and native idle routes use their own categories', () => {
  const { world, unit } = setup()
  const hut = addBuilding(world, 'blue', 'hut', { x: 12, z: 8 }, true)
  unit.work = hut.id
  assert.equal(category(world, unit), 4, 'the command8 pre-entry journey is Busy')
  unit.builder = { task: BuilderTask.Work, busy: 0, phase: 0, restart: false, person: unit.native }
  unit.native = null; unit.builder.person.state = 10
  assert.equal(category(world, unit), 4, 'legacy builder status0 projects command6')
  unit.native = unit.builder.person; unit.builder = undefined; unit.work = null
  unit.native.state = 17; unit.path = [{ x: 1, z: 8 }]
  world.pathfinding.people.set(unit.id, unit.native)
  assert.equal(category(world, unit), 2, 'native idle approach paths remain Idle')
  const separate = createLivePerson(world, unit)
  world.pathfinding.people.set(unit.id, separate)
  assert.equal(category(world, unit), 4, 'independent movement owns the legacy path')
  unit.path = []; world.pathfinding.people.clear(); unit.inside = hut.id
  assert.equal(category(world, unit), 3, 'legacy checkpoint occupant uses its actual hut descriptor')
  hut.kind = 'tower'
  assert.equal(category(world, unit), 4, 'tower occupancy is Busy, not Housed')
})

test('task selection preserves orders and RNG during a real movement command and propagates occupied groups', () => {
  const { world, unit } = setup()
  const second = addUnit(world, 'blue', 'warrior', { x: 1, z: 8 })
  world.selected = [unit.id, second.id]
  command(world, { x: 30, z: 8 })
  for (let i = 0; i < 10; i++) tick(world, 1 / 12)
  const people = hudTaskPeople(world)
  assert.ok(people.every(p => p.category === 4))
  const orders = structuredClone(world.buildingOrders), rng = world.randomState, point = nativePosition(world, unit)
  selectFollowerTask(world, 2, 1, point, 'single')
  assert.deepEqual(world.selected, [second.id])
  assert.deepEqual(world.buildingOrders, orders); assert.equal(world.randomState, rng)
  // Supporting occupancy fixture verifies the task command's propagation, not boat gameplay.
  unit.native.vehicle = second.native.vehicle = 999
  world.vehicles = [{ id: 999, active: true, model: 1, passengerCount: 2, passengers: [unit.id, second.id] }]
  world.selected = [unit.id, second.id]
  selectFollowerTask(world, 2, 1, point, 'single')
  assert.deepEqual(world.selected, [], 'Selected Braves also deselect their fellow vehicle passengers')
})

test('live task count reads nearby camera coordinates without creating or registering people', () => {
  const { world, unit } = setup()
  const point = nativePosition(world, unit)
  unit.native.x = point.x + 6144; unit.native.y = point.y
  const before = structuredClone(world)
  const counts = followerTaskCounts(hudTaskPeople(world), point, true)
  assert.equal(counts.totals[2], 1)
  assert.equal(counts.tasks[2][2], 0)
  assert.deepEqual(world, before)
})
