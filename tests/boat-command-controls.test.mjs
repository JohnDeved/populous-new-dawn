import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, addUnit, browserPosition, selectUnit, command } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { stepLiveMovement } from '../app/live-movement.ts'
import {
  boardLiveVehicle,
  beginLiveVehiclePass,
  selectLiveVehicleDrivers,
  stepLiveVehicle,
  stepLiveVehicles,
} from '../app/live-vehicles.ts'
import { allocatePersonOrder, attachPersonOrder } from '../app/person-orders.ts'
import { departVehiclePerson } from '../app/vehicle-unload.ts'

// Supplied occupants isolate the Boat control contract. Public clicks below use
// the shipped command entry point, but do not establish ordinary acquisition,
// boarding, route reachability, campaign completion, or native craft steering.
function fixture() {
  const w = createWorld(22),
    v = w.vehicles.find(vehicle => vehicle.model === 1),
    units = [],
    people = []
  for (let n = 0; n < 2; n++) {
    const u = addUnit(w, 'blue', n ? 'shaman' : 'brave', browserPosition(v)),
      p = (u.native = createLivePerson(w, u))
    registerLivePerson(w, p)
    w.pathfinding.people.set(p.id, p)
    p.counter = 11 + n * 71
    assert.ok(boardLiveVehicle(w, p, v))
    units.push(u)
    people.push(p)
  }
  return { w, v, units, people }
}

const inputs = [
  ['plain', {}, 0],
  ['Ctrl', { ctrlKey: true }, 128],
  ['Shift', { shiftKey: true }, 64],
  ['Ctrl+Shift', { ctrlKey: true, shiftKey: true }, 192],
]
const queued = p => p.commands.filter(Boolean)
const position = v => ({ x: v.x, y: v.y, h: v.h })

function select(w, people) {
  for (const [index, p] of people.entries()) selectUnit(w, p.id, index > 0)
}

function assertOwners(w, units, people) {
  for (const [index, p] of people.entries()) {
    assert.equal(units[index].native, p)
    assert.equal(w.objectCells.objects.get(p.id), p)
  }
}

for (const [name, modifiers, flags] of inputs) {
  test(`supplied Boat public ${name} click retains shared flags and seated owners`, () => {
    const { w, v, units, people } = fixture(),
      counters = people.map(p => p.counter)
    select(w, people)
    assert.ok(command(w, { x: 55, z: 121 }, modifiers))
    const ids = queued(people[0])
    assert.equal(ids.length, 1)
    assert.deepEqual(queued(people[1]), ids)
    const order = w.buildingOrders.records[ids[0]]
    assert.deepEqual([order.model, order.flags, order.references], [3, flags, 2])
    assert.equal(w.orderCursor, modifiers.ctrlKey ? 1 : 0)
    assert.deepEqual(
      people.map(p => p.counter),
      counters
    )
    assert.deepEqual(
      people.map(p => p.vehicle),
      [v.id, v.id]
    )
    assert.equal(v.passengerCount, 2)
    assert.deepEqual(
      v.passengers,
      people.map(p => p.id)
    )
    assertOwners(w, units, people)
  })

  test(`supplied mixed Boat and ground ${name} click has one shared order owner record`, () => {
    const { w, v, units, people } = fixture(),
      ground = addUnit(
        w,
        'blue',
        'brave',
        w.units.find(u => u.team === 'blue')
      ),
      p = (ground.native = createLivePerson(w, ground))
    registerLivePerson(w, p)
    p.counter = 149
    units.push(ground)
    people.push(p)
    const counters = people.map(person => person.counter)
    select(w, people)
    assert.ok(command(w, { x: 55, z: 121 }, modifiers))
    const ids = queued(people[0])
    assert.equal(ids.length, 1)
    for (const person of people) assert.deepEqual(queued(person), ids)
    const order = w.buildingOrders.records[ids[0]]
    assert.deepEqual([order.model, order.flags, order.references], [3, flags, 3])
    assert.deepEqual(
      people.map(person => person.counter),
      counters
    )
    assert.deepEqual(
      people.map(person => person.vehicle),
      [v.id, v.id, 0]
    )
    assert.deepEqual(
      v.passengers,
      people.slice(0, 2).map(person => person.id)
    )
    assertOwners(w, units, people)
  })
}

test('supplied Boat public eight-waypoint queue retains shared references and terminal flags', () => {
  const { w, v, units, people } = fixture()
  select(w, people)
  for (let n = 0; n < 8; n++)
    assert.ok(command(w, { x: 55, z: 121 }, { ctrlKey: true, shiftKey: true }))
  const ids = queued(people[0])
  assert.equal(ids.length, 8)
  assert.equal(new Set(ids).size, 8)
  assert.deepEqual(queued(people[1]), ids)
  assert.deepEqual(
    ids.map(id => w.buildingOrders.records[id].flags),
    [192, 192, 192, 192, 192, 192, 192, 64]
  )
  assert.ok(ids.every(id => w.buildingOrders.records[id].references === 2))
  assert.equal(w.orderCursor, 0)
  assert.deepEqual(w.selected, [])
  assert.deepEqual(
    people.map(p => p.vehicle),
    [v.id, v.id]
  )
  assertOwners(w, units, people)
})

test('supplied Boat public queued driver promotion moves once per pass across departure', () => {
  const {
    w,
    v,
    units,
    people: [a, b],
  } = fixture()
  select(w, [b])
  assert.ok(command(w, { x: 55, z: 121 }, { ctrlKey: true }))
  const pool = structuredClone(w.buildingOrders),
    counters = [a.counter, b.counter],
    before = position(v)
  // Fixed destinations bound this test to movement visit ownership, not routing.
  for (const p of [a, b])
    Object.assign(p, { destinationX: (v.x + 2048) & 65535, destinationY: v.y & 65535 })
  beginLiveVehiclePass(w)
  assert.deepEqual(v.passengers, [b.id, a.id])
  assert.ok(stepLiveVehicle(w, b))
  const moved = position(v)
  assert.notDeepEqual(moved, before)
  assert.ok(departVehiclePerson(w, v, b, { x: (b.x + 1024) & 65535, y: b.y & 65535 }))
  assert.deepEqual(v.passengers, [a.id, 0])
  assert.ok(stepLiveVehicle(w, a))
  assert.deepEqual(position(v), moved)
  assert.deepEqual([a.counter, b.counter], counters)
  assert.deepEqual(w.buildingOrders, pool)
  assertOwners(w, units, [a, b])
  stepLiveVehicles(w)
  assert.deepEqual(position(v), moved)
  beginLiveVehiclePass(w)
  assert.ok(stepLiveVehicle(w, a))
  stepLiveVehicles(w)
  assert.notDeepEqual(position(v), moved)
})

const unused = () => assert.fail('supplied movement attachment must not invoke order effects')
const effects = {
  prepare: unused,
  stopWork: unused,
  releaseSpell: unused,
  deleteObject: unused,
  releaseFight: unused,
}

for (const [name, , flags] of inputs) {
  for (const firstSeat of [0, 1]) {
    test(`supplied Boat ${name} ${firstSeat ? 'passenger' : 'driver'} completes only its own order`, () => {
      const { w, v, units: originalUnits, people } = fixture(),
        units = [originalUnits[firstSeat], originalUnits[1 - firstSeat]],
        [a, b] = [people[firstSeat], people[1 - firstSeat]],
        id = allocatePersonOrder(w.buildingOrders)
      // Supplied arrived positions, safe exit terrain and person phases exercise
      // real stepMovementOrder + stepPersonOrders, without a success callback.
      w.land.flags.fill(0)
      w.land.categories.fill(0)
      w.land.walkMasks[w.pathfinding.state.walkMask].fill(255)
      Object.assign(w.buildingOrders.records[id], {
        model: 3,
        flags,
        a: v.x & 65535,
        b: v.y & 65535,
      })
      for (const [index, p] of [a, b].entries()) {
        attachPersonOrder(w.buildingOrders, p, id, 0, effects)
        Object.assign(p, {
          state: 10,
          commandStatus: 3,
          counter: index ? 0 : 3,
          destinationX: v.x & 65535,
          destinationY: v.y & 65535,
          goalX: v.x & 65535,
          goalY: v.y & 65535,
          savedVehicle: 73 + index,
        })
      }
      const order = w.buildingOrders.records[id],
        leaves = flags === 64,
        bCommands = [...b.commands]
      assert.equal(order.references, 2)
      beginLiveVehiclePass(w)
      stepLiveMovement(w, units[1])
      assert.equal(b.counter, 1)
      assert.equal(order.references, 2, 'each person must wait for its own fourth-turn phase')
      assert.deepEqual(b.commands, bCommands)
      stepLiveMovement(w, units[0])
      assert.equal(a.counter, 4)
      assert.deepEqual(queued(a), [])
      assert.equal(order.references, 1, 'only the completed person releases the shared record')
      assert.deepEqual(b.commands, bCommands)
      assert.equal(b.vehicle, v.id)
      assert.equal(a.vehicle, leaves ? 0 : v.id)
      assert.equal(v.passengerCount, leaves ? 1 : 2)
      assert.equal(a.savedVehicle, 73)
      if (leaves) {
        assert.equal(units[0].flight, a)
        assert.equal(a.flags2 & 0x80000, 0, 'voluntary launch does not force destruction airborne')
        assert.equal(a.flags4 & 0x1000400, 0x1000400)
        assert.equal(a.velocity.y, 60)
      }
      stepLiveVehicles(w)
      for (let phase = 2; phase <= 4; phase++) {
        beginLiveVehiclePass(w)
        assert.equal(v.passengers[0], b.id, 'remaining queued person becomes the driver')
        stepLiveMovement(w, units[1])
        assert.equal(b.counter, phase)
        assert.equal(order.references, phase < 4 ? 1 : 0)
        stepLiveVehicles(w)
      }
      assert.deepEqual(queued(b), [])
      assert.equal(order.flags, flags)
      assert.equal(b.vehicle, leaves ? 0 : v.id)
      assert.equal(b.savedVehicle, 74)
      assert.equal(v.passengerCount, leaves ? 0 : 2)
      assert.equal(w.buildingOrders.active, 0)
      assertOwners(w, units, [a, b])
    })
  }
}

test('supplied Boat selector preserves queue ownership and phase counters', () => {
  const {
    w,
    v,
    units,
    people: [a, b],
  } = fixture()
  select(w, [b])
  assert.ok(command(w, { x: 55, z: 121 }, { ctrlKey: true }))
  const pool = structuredClone(w.buildingOrders),
    counters = [a.counter, b.counter],
    queues = [structuredClone(a.commands), structuredClone(b.commands)]
  selectLiveVehicleDrivers(w)
  assert.deepEqual(v.passengers, [b.id, a.id])
  selectLiveVehicleDrivers(w)
  assert.deepEqual(v.passengers, [b.id, a.id])
  assert.deepEqual(w.buildingOrders, pool)
  assert.deepEqual([a.counter, b.counter], counters)
  assert.deepEqual([a.commands, b.commands], queues)
  assertOwners(w, units, [a, b])
})
