import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, addUnit, browserPosition, selectUnit, command } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import {
  boardLiveVehicle,
  selectLiveBalloonDrivers,
  beginLiveVehiclePass,
  stepLiveVehicle,
  stepLiveVehicles,
} from '../app/live-vehicles.ts'
import { departVehiclePerson } from '../app/vehicle-unload.ts'
import { randomPersonSpeed } from '../app/person-state.ts'
import { allocatePersonOrder, attachPersonOrder } from '../app/person-orders.ts'

const unused = () => assert.fail('selector must not invoke an order consumer')
const effects = {
  prepare: unused,
  stopWork: unused,
  releaseSpell: unused,
  deleteObject: unused,
  releaseFight: unused,
}
function fixture(model = 3) {
  const w = createWorld(22),
    v = w.vehicles.find(v => v.model === model),
    people = []
  for (let n = 0; n < 2; n++) {
    const u = addUnit(w, 'blue', n === 1 ? 'shaman' : 'brave', browserPosition(v))
    const p = (u.native = createLivePerson(w, u))
    registerLivePerson(w, p)
    w.pathfinding.people.set(p.id, p)
    p.counter = 11 + n * 71
    assert.ok(boardLiveVehicle(w, p, v))
    people.push(p)
  }
  return { w, v, people }
}
function queue(w, p, model = 3) {
  const id = allocatePersonOrder(w.buildingOrders)
  Object.assign(w.buildingOrders.records[id], { model, flags: 128 })
  attachPersonOrder(w.buildingOrders, p, id, 0, effects)
  p.commandStatus = model
  return id
}

test('supplied Balloon selector promotes queued owner without changing phases or references', () => {
  const {
    w,
    v,
    people: [a, b],
  } = fixture()
  queue(w, b)
  const pool = structuredClone(w.buildingOrders),
    counters = [a.counter, b.counter]
  selectLiveBalloonDrivers(w)
  assert.deepEqual(v.passengers, [b.id, a.id])
  assert.ok(b.flags2 & 0x80000000)
  assert.deepEqual(w.buildingOrders, pool)
  assert.deepEqual([a.counter, b.counter], counters)
  for (const p of [a, b]) assert.equal(w.objectCells.objects.get(p.id), p)
  selectLiveBalloonDrivers(w)
  assert.deepEqual(v.passengers, [b.id, a.id])
})

test('matching current22 yields to queued passenger; different target retains first-seat priority', () => {
  for (const matching of [false, true]) {
    const {
      w,
      v,
      people: [a, b],
    } = fixture()
    queue(w, a, 22)
    a.target = v.id + (matching ? 0 : 1)
    queue(w, b)
    b.motionGroup = 1
    selectLiveBalloonDrivers(w)
    assert.equal(v.passengers[0], matching ? b.id : a.id)
    assert.equal(b.flags2 & 0x80000000, 0)
  }
})

test('immediate-only commands are ignored, while Shaman38 qualifies without a queued command', () => {
  for (const casting of [false, true]) {
    const {
      w,
      v,
      people: [a, b],
    } = fixture()
    b.immediateCommand = queue(w, b)
    b.commands.fill(0)
    b.state = casting ? 38 : 10
    selectLiveBalloonDrivers(w)
    assert.equal(v.passengers[0], casting ? b.id : a.id)
  }
})

test('invalid first slot is removed and later owner fills it without queued-promotion flag', () => {
  const {
    w,
    v,
    people: [a, b],
  } = fixture()
  a.flags2 |= 1
  b.slowTurn = 2
  selectLiveBalloonDrivers(w)
  assert.deepEqual(v.passengers, [b.id, 0])
  assert.equal(v.passengerCount, 1)
  assert.ok(v.navigationFlags & 2)
  assert.equal(b.flags2 & 0x80000000, 0)
})

test('live adapter rejects stale registry aliases and leaves Boat selection unchanged', () => {
  const {
    w,
    v,
    people: [a, b],
  } = fixture()
  w.objectCells.objects.set(a.id, { ...a })
  queue(w, b)
  selectLiveBalloonDrivers(w)
  assert.equal(v.passengerCount, 1)
  assert.equal(v.passengers[0], b.id)
  assert.equal(w.units.find(u => u.id === a.id).native, a)
  const boat = fixture(1),
    before = structuredClone(boat.v)
  queue(boat.w, boat.people[1])
  selectLiveBalloonDrivers(boat.w)
  assert.deepEqual(boat.v, before)
})

test('voluntary per-person departure preserves seat position and exact pending ownership', () => {
  for (const slot of [0, 1]) {
    const { w, v, people } = fixture(),
      p = people[slot]
    queue(w, p)
    p.savedVehicle = 73
    const before = { x: p.x, y: p.y, h: p.h, state: p.state, counter: p.counter },
      pool = structuredClone(w.buildingOrders)
    const rng = { randomState: w.randomState },
      speed = randomPersonSpeed(rng, p)
    assert.ok(departVehiclePerson(w, v, p, { x: (p.x + 1024) & 65535, y: p.y & 65535 }))
    assert.deepEqual({ x: p.x, y: p.y, h: p.h, state: p.state, counter: p.counter }, before)
    assert.deepEqual(p.velocity, { x: 160, y: 60, z: 0 })
    assert.equal(p.vehicle, 0)
    assert.equal(p.savedVehicle, 73)
    assert.equal(p.flags2 & 0x80000, 0)
    assert.equal(p.flags2 & 0x4000, 0)
    assert.equal(p.flags4 & 0x1000400, 0x1000400)
    assert.equal(p.speed, speed)
    assert.equal(w.randomState, rng.randomState)
    assert.deepEqual(w.buildingOrders, pool)
    assert.equal(v.passengerCount, 1)
    assert.deepEqual(v.passengers, [people[1 - slot].id, 0])
  }
})

test('one world pass moves Balloon once even when its driver leaves before the next person', () => {
  const {
    w,
    v,
    people: [a, b],
  } = fixture()
  for (const p of [a, b])
    Object.assign(p, { destinationX: (v.x + 2048) & 65535, destinationY: v.y & 65535 })
  const counters = [a.counter, b.counter]
  beginLiveVehiclePass(w)
  assert.ok(stepLiveVehicle(w, a))
  const moved = { x: v.x, y: v.y, h: v.h }
  assert.ok(departVehiclePerson(w, v, a, { x: (a.x + 1024) & 65535, y: a.y & 65535 }))
  assert.ok(stepLiveVehicle(w, b))
  assert.deepEqual({ x: v.x, y: v.y, h: v.h }, moved)
  assert.deepEqual([a.counter, b.counter], counters)
  stepLiveVehicles(w)
  // End-of-pass cleanup permits the next pass, and direct helper use outside a pass.
  beginLiveVehiclePass(w)
  assert.ok(stepLiveVehicle(w, b))
  stepLiveVehicles(w)
  assert.notEqual(v.x, moved.x)
  const next = v.x
  assert.ok(stepLiveVehicle(w, b))
  assert.notEqual(v.x, next)
})

test('all-airborne public movement input preserves plain, Shift, Ctrl and combined flags', () => {
  for (const [modifiers, flags] of [
    [{}, 0],
    [{ shiftKey: true }, 64],
    [{ ctrlKey: true }, 128],
    [{ ctrlKey: true, shiftKey: true }, 192],
    [{ altKey: true }, 0],
  ]) {
    const {
      w,
      v,
      people: [a, b],
    } = fixture()
    selectUnit(w, a.id, false)
    selectUnit(w, b.id, true)
    const counters = [a.counter, b.counter]
    assert.ok(command(w, { x: 55, z: 121 }, modifiers))
    const ids = a.commands.filter(Boolean)
    assert.equal(ids.length, 1)
    assert.deepEqual(b.commands.filter(Boolean), ids)
    assert.deepEqual(
      [
        w.buildingOrders.records[ids[0]].model,
        w.buildingOrders.records[ids[0]].flags,
        w.buildingOrders.records[ids[0]].references,
      ],
      [3, flags, 2]
    )
    assert.deepEqual([a.counter, b.counter], counters)
    assert.equal(a.vehicle, v.id)
    assert.equal(b.vehicle, v.id)
    assert.equal(w.units.find(u => u.id === a.id).native, a)
    assert.equal(w.objectCells.objects.get(b.id), b)
  }
})

test('eight public airborne waypoints retain shared records and the source cursor boundary', () => {
  const {
    w,
    v,
    people: [a, b],
  } = fixture()
  selectUnit(w, a.id, false)
  selectUnit(w, b.id, true)
  for (let i = 0; i < 8; i++) assert.ok(command(w, { x: 55, z: 121 }, { ctrlKey: true }))
  const ids = a.commands.filter(Boolean)
  assert.equal(ids.length, 8)
  assert.deepEqual(b.commands.filter(Boolean), ids)
  assert.deepEqual(
    ids.map(id => w.buildingOrders.records[id].flags),
    [128, 128, 128, 128, 128, 128, 128, 0]
  )
  assert.ok(ids.every(id => w.buildingOrders.records[id].references === 2))
  assert.equal(w.orderCursor, 0)
  assert.equal(w.selected.length, 0)
  assert.equal(a.vehicle, v.id)
  assert.equal(b.vehicle, v.id)
})

test('unvisited airborne craft decelerates on cardinal headings without another person visit', () => {
  for (const [heading, dx, dy] of [
    [0, 0, -22],
    [Math.PI / 2, 22, 0],
    [Math.PI, 0, 22],
    [-Math.PI / 2, -22, 0],
  ]) {
    const { w, v, people } = fixture()
    Object.assign(v, { x: 20000, y: 20000, heading, speed: 32 })
    for (const p of people) p.speed = 0
    const pool = structuredClone(w.buildingOrders),
      counters = people.map(p => p.counter)
    beginLiveVehiclePass(w)
    stepLiveVehicles(w)
    assert.equal(v.speed, 22)
    assert.deepEqual([v.x, v.y], [20000 + dx, 20000 + dy])
    assert.deepEqual(
      people.map(p => p.counter),
      counters
    )
    assert.deepEqual(w.buildingOrders, pool)
    for (const speed of [15, 10, 6, 1]) {
      beginLiveVehiclePass(w)
      stepLiveVehicles(w)
      assert.equal(v.speed, speed)
    }
  }
})

test('terminal stop projection retains initial, Boat and nonzero-desired-speed adapters', () => {
  for (const mode of ['initial', 'boat', 'moving']) {
    const { w, v, people } = fixture(mode === 'boat' ? 1 : 3)
    v.speed = mode === 'initial' ? -1 : 32
    people[0].speed = mode === 'moving' ? 12 : 0
    const before = [v.x, v.y, v.h, v.speed]
    beginLiveVehiclePass(w)
    stepLiveVehicles(w)
    assert.deepEqual([v.x, v.y, v.h, v.speed], before)
  }
})

test('low-speed craft centers before valid rest and preserves occupied owners', () => {
  const { w, v, people } = fixture()
  Object.assign(v, { x: 20000, y: 20000, speed: 1, navigationFlags: 0x18001 })
  for (const p of people) p.speed = 0
  const cell = (20000 >> 9) * 128 + (20000 >> 9)
  w.land.flags[cell] = 0
  w.land.categories[cell] = 0
  const height = v.h
  for (let n = 0; n < 50 && v.speed; n++) {
    beginLiveVehiclePass(w)
    stepLiveVehicles(w)
    if (v.speed) assert.equal(v.h, height)
  }
  assert.equal(v.speed, 0)
  assert.deepEqual([v.x, v.y], [20224, 20224])
  assert.equal(v.navigationFlags & 0x10000, 0)
  assert.equal(v.navigationFlags & 0x8001, 0x8001)
  assert.deepEqual(
    v.passengers,
    people.map(p => p.id)
  )
  for (const p of people) assert.equal(w.objectCells.objects.get(p.id), p)
})

test('invalid centered landing and failed search cannot fabricate a resting craft', () => {
  const { w, v, people } = fixture()
  Object.assign(v, { x: 20224, y: 20224, speed: 1 })
  for (const p of people) p.speed = 0
  w.land.flags.fill(0x204)
  const before = { x: v.x, y: v.y, h: v.h, speed: v.speed },
    rng = w.randomState
  beginLiveVehiclePass(w)
  stepLiveVehicles(w)
  assert.deepEqual({ x: v.x, y: v.y, h: v.h, speed: v.speed }, before)
  assert.equal(w.randomState, rng)
})

test('ownerless craft retain the existing moving-state adapter', () => {
  const { w, v } = fixture()
  v.passengers = []
  v.passengerCount = 0
  Object.assign(v, { x: 20000, y: 20000, speed: 32, heading: Math.PI / 2 })
  w.land.flags.fill(0x204)
  beginLiveVehiclePass(w)
  stepLiveVehicles(w)
  assert.deepEqual([v.x, v.y, v.speed], [20000, 20000, 32])
})
