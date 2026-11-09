import test from 'node:test'
import assert from 'node:assert/strict'
import { addUnit, browserPosition, createWorld } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { appendLiveOrders, appendLivePlayerOrders } from '../app/live-movement.ts'
import { currentPersonOrder, emptyPersonOrder, writePersonOrder } from '../app/person-orders.ts'

// Supplied controller boundaries; ordinary acquired/rested input is tested separately.
function fixture(state = 30) {
  const world = createWorld(22),
    vehicle = world.vehicles.find(vehicle => vehicle.model === 3),
    unit = addUnit(world, 'blue', 'brave', browserPosition(vehicle)),
    person = (unit.native = createLivePerson(world, unit)),
    order = emptyPersonOrder()
  registerLivePerson(world, person)
  assert.ok(boardLiveVehicle(world, person, vehicle))
  Object.assign(person, {
    state,
    previousState: 14,
    counter: 71,
    speed: state === 30 ? 0 : 63,
    motionTimer: 19,
    motionMode: 3,
  })
  writePersonOrder(order, 28, 17, 0, 128)
  return { world, vehicle, unit, person, order }
}
function ownership({ world, vehicle, unit, person }) {
  assert.equal(unit.native, person)
  assert.equal(world.objectCells.objects.get(unit.id), person)
  assert.deepEqual(vehicle.passengers, [unit.id])
  assert.equal(vehicle.passengerCount, 1)
  assert.equal(person.vehicle, vehicle.id)
  assert.equal(person.counter, 71)
}

for (const state of [30, 10, 14])
  test(`generic player28 restarts supplied state${state} without replacing its seated owner`, () => {
    const f = fixture(state)
    const result = appendLivePlayerOrders(f.world, [f.unit], f.order, true)
    assert.equal(result.accepted, true)
    assert.deepEqual([f.person.state, f.person.commandStatus, f.person.previousState], [10, 28, 0])
    assert.equal(currentPersonOrder(f.world.buildingOrders, f.person).references, 1)
    assert.equal(f.person.motionTimer, 0)
    assert.equal(f.person.motionMode, 0)
    ownership(f)
  })

for (const state of [25, 29])
  test(`generic player28 retains native state${state} restart exclusion`, () => {
    const f = fixture(state),
      rng = f.world.randomState
    assert.equal(appendLivePlayerOrders(f.world, [f.unit], f.order, true).accepted, true)
    assert.equal(f.person.state, state)
    assert.equal(f.person.previousState, 14)
    assert.equal(f.person.motionTimer, 19)
    assert.equal(f.person.motionMode, 3)
    assert.equal(f.world.randomState, rng)
    assert.equal(currentPersonOrder(f.world.buildingOrders, f.person).references, 1)
    ownership(f)
  })

test('protected player28 resets motion before skipping state initialization', () => {
  const f = fixture(),
    rng = f.world.randomState
  f.person.flags2 |= 0x100000
  assert.equal(appendLivePlayerOrders(f.world, [f.unit], f.order, true).accepted, true)
  assert.equal(f.person.state, 30)
  assert.equal(f.person.previousState, 14)
  assert.equal(f.person.motionTimer, 0)
  assert.equal(f.person.motionMode, 0)
  assert.equal(f.world.randomState, rng)
  assert.equal(currentPersonOrder(f.world.buildingOrders, f.person).references, 1)
  ownership(f)
})

test('direct-target and computer append keep their existing attach-only contract', () => {
  const f = fixture(),
    rng = f.world.randomState
  assert.equal(appendLiveOrders(f.world, [f.unit], f.order, true).accepted, true)
  assert.deepEqual(
    [f.person.state, f.person.previousState, f.person.motionTimer, f.person.motionMode],
    [30, 14, 19, 3]
  )
  assert.equal(f.world.randomState, rng)
  assert.equal(currentPersonOrder(f.world.buildingOrders, f.person).references, 1)
  ownership(f)
})

test('generic player28 performs its restart tail even when the shared pool is exhausted', () => {
  const f = fixture()
  for (const record of f.world.buildingOrders.records) record.references = 1
  f.world.buildingOrders.active = 799
  assert.equal(appendLivePlayerOrders(f.world, [f.unit], f.order, true).accepted, false)
  assert.equal(currentPersonOrder(f.world.buildingOrders, f.person), undefined)
  assert.equal(f.person.previousState, 0)
  assert.equal(f.person.motionTimer, 0)
  assert.equal(f.person.motionMode, 0)
  ownership(f)
})

// Existing allocation-before-clear adapter retains the sermon; only startup is restored.
test('exhausted generic target replacement still restarts the retained sermon', () => {
  const world = createWorld(22),
    unit = addUnit(world, 'blue', 'preacher', { x: 0, z: -45 }),
    person = (unit.native = createLivePerson(world, unit)),
    sermon = emptyPersonOrder(),
    attack = emptyPersonOrder()
  registerLivePerson(world, person)
  writePersonOrder(sermon, 17, person.x, person.y, 0)
  assert.equal(appendLiveOrders(world, [unit], sermon, true).accepted, true)
  const retained = currentPersonOrder(world.buildingOrders, person)
  Object.assign(person, { previousState: 14, counter: 71, motionTimer: 19, motionMode: 3 })
  for (const record of world.buildingOrders.records) record.references ||= 1
  world.buildingOrders.active = 799
  writePersonOrder(attack, 28, 17, 0, 128)
  assert.equal(appendLivePlayerOrders(world, [unit], attack, true).accepted, false)
  assert.equal(currentPersonOrder(world.buildingOrders, person), retained)
  assert.equal(retained.references, 1)
  assert.equal(person.previousState, 0)
  assert.equal(person.motionTimer, 0)
  assert.equal(person.motionMode, 0)
  assert.equal(person.counter, 71)
  assert.equal(unit.native, person)
  assert.equal(world.objectCells.objects.get(unit.id), person)
})
