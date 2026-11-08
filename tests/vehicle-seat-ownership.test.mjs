import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import * as seats from '../app/vehicle-seats.ts'
import { departVehiclePerson, launchVehiclePerson, unloadVehiclePeople } from '../app/vehicle-unload.ts'
import { clearPersonOrders, createPersonOrderPool } from '../app/person-orders.ts'
import { deferVehicleOrdinaryVisit, vehicleOrdinaryVisitDeferred } from '../app/vehicle-allocation.ts'
import { teamForTribe, tribeForTeam } from '../app/world-types.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Complete authored slot consumers with supplied terrain/cell publication leaves.
// Actual unload, order cleanup, launch/RNG and seat geometry modules are imported.
const source = stripTypeScriptTypes(readFileSync(new URL('../app/live-vehicles.ts', import.meta.url), 'utf8'))
const names = ['boardLiveVehicle', 'leaveLiveVehicle', 'syncLiveVehiclePassengers',
  'removeMissingVehiclePassengers', 'selectLiveVehicleDrivers']
const declarations = names.map(name => {
  const matches = [...source.matchAll(new RegExp(`export function ${name}\\(`, 'g'))]
  assert.equal(matches.length, 1)
  const rest = source.slice(matches[0].index), end = rest.search(/\n}(?:\n|$)/)
  assert.notEqual(end, -1)
  return rest.slice(0, end + 2).replace(/^export /, '')
}).join('\n')
const unused = () => assert.fail('this fixture must not invoke route or combat effects')
const ports = {
  rules, teamForTribe, tribeForTeam, vehicleOrdinaryVisitDeferred,
  fillVehicleDriverSeat: seats.fillVehicleDriverSeat,
  seatVehiclePassenger: seats.seatVehiclePassenger, vehicleSeat: seats.vehicleSeat,
  short: n => (n << 16) >> 16,
  terrainPointHeight: () => 7,
  relocateLivePerson: (_, p, to) => Object.assign(p, to),
  browserPosition: p => ({ x: p.x / 256, z: -p.y / 256 }),
  releasePersonRoute: unused, attachPersonRoute: unused,
}
const live = new Function(...Object.keys(ports), `${declarations}\nreturn { ${names.join(', ')} }`)(...Object.values(ports))

function fixture(model = 1) {
  const capacity = rules.vehicleCapacity[model]
  const v = { id: 70, model, active: true, team: 'blue', passengerCount: capacity,
    passengers: Array.from({ length: capacity }, (_, i) => 11 + i), navigationFlags: 0,
    speed: 0, x: 20000, y: 20000, h: 0, heading: 0 }
  const people = new Map(v.passengers.map((id, i) => [id, {
    id, class: 1, vehicle: v.id, tribe: 0, model: 2, physics: 0,
    flags2: 0x4000, flags3: 0, flags4: 0x2000000, savedVehicle: 9,
    state: 10, substate: 0, counter: id, assignment: 0, motionGroup: 0,
    commandStatus: 3, commandCursor: 0, commands: [1, 0, 0, 0, 0, 0, 0, 0],
    immediateCommand: 0, slowTurn: 0, ...seats.vehicleSeat(v, i),
  }]))
  const pool = createPersonOrderPool()
  Object.assign(pool.records[1], { model: 3, references: capacity })
  pool.active = 1
  const w = { randomState: 0x12345678, units: [...people.values()].map(p => ({ id: p.id, native: p, hp: 50 })),
    vehicles: [v], pathfinding: { people }, objectCells: { objects: new Map(people) }, buildingOrders: pool }
  return { w, v, people, capacity }
}
const point = { x: 21000, y: 20000 }
const orderEffects = { stopWork: unused, releaseSpell: unused, deleteObject: unused, releaseFight: unused }
function effects(w, events, valid = () => true) {
  return {
    exit: () => { const found = valid(); events.push(['exit', found]); return { point, found } },
    clearOrders: p => { events.push(['clear', p.id]); clearPersonOrders(w.buildingOrders, p, orderEffects) },
    launched: p => events.push(['launch', p.id]),
  }
}
function fillFirst(ids) {
  const result = [...ids]
  if (!result[0]) {
    const first = result.findIndex(Boolean)
    if (first > 0) { result[0] = result[first]; result[first] = 0 }
  }
  return result
}

for (const model of [1, 3]) {
  test(`model${model} cleanup preserves the physical result of every departure slot`, () => {
    for (let slot = 0; slot < rules.vehicleCapacity[model]; slot++) {
      const { w, v, people } = fixture(model), p = people.get(v.passengers[slot])
      const orders = structuredClone(w.buildingOrders)
      assert.equal(departVehiclePerson(w, v, p, point), true)
      const expected = [...v.passengers], positions = new Map(expected.filter(Boolean).map(id => [id, seats.vehicleSeat(v, expected.indexOf(id))]))
      live.removeMissingVehiclePassengers(w)
      assert.deepEqual(v.passengers, expected)
      live.syncLiveVehiclePassengers(w, v)
      for (const [id, position] of positions) {
        const q = people.get(id)
        assert.deepEqual({ x: q.x, y: q.y, h: q.h }, position)
      }
      assert.deepEqual(w.buildingOrders, orders, 'departure and cleanup preserve queued references')
      assert.equal(v.passengerCount, expected.filter(Boolean).length)
    }
  })

  test(`model${model} missing-person cleanup fills only driver vacancy and keeps empty slots`, () => {
    const { w, v, capacity } = fixture(model), original = [...v.passengers], rng = w.randomState
    w.units = w.units.filter(u => u.id !== 11 && u.id !== 13)
    const expected = fillFirst(original.map(id => w.units.some(u => u.id === id) ? id : 0))
    live.removeMissingVehiclePassengers(w)
    assert.deepEqual(v.passengers, expected)
    assert.equal(v.passengerCount, expected.filter(Boolean).length)
    assert.equal(v.speed, 0)
    assert.equal(w.randomState, rng)
    w.units = []
    live.removeMissingVehiclePassengers(w)
    assert.deepEqual(v.passengers, Array(capacity).fill(0))
    assert.equal(v.passengerCount, 0)
    assert.equal(v.speed, -1)
  })

  test(`model${model} immediate landing preserves all other slots and its existing position effects`, () => {
    for (let slot = 0; slot < rules.vehicleCapacity[model]; slot++) {
      const { w, v, people } = fixture(model), id = v.passengers[slot], p = people.get(id)
      const expected = [...v.passengers], rng = w.randomState, orders = structuredClone(w.buildingOrders)
      expected[slot] = 0
      live.leaveLiveVehicle(w, v, p, point)
      assert.deepEqual(v.passengers, fillFirst(expected))
      assert.equal(v.passengerCount, expected.filter(Boolean).length)
      assert.deepEqual([p.x, p.y, p.h, p.anchorX, p.anchorY, p.vehicle], [point.x, point.y, 7, point.x, point.y, 0])
      assert.equal(p.flags2 & 0x4000, 0)
      assert.equal(p.flags4 & 0x2000000, 0)
      assert.equal(w.randomState, rng)
      assert.deepEqual(w.buildingOrders, orders)
    }
  })

  test(`model${model} boarding reuses a departed seat without moving untouched passengers`, () => {
    const { w, v, people } = fixture(model), p = people.get(12)
    departVehiclePerson(w, v, p, point)
    live.removeMissingVehiclePassengers(w)
    assert.equal(live.boardLiveVehicle(w, p, v), true)
    assert.deepEqual(v.passengers, [...people.keys()])
    assert.equal(v.passengerCount, people.size)
    assert.equal(live.boardLiveVehicle(w, p, v), false, 'already aboard/full rejection stays intact')
  })

  test(`model${model} selector retains its existing invalid-owner cleanup and command priority`, () => {
    const { w, v, people } = fixture(model)
    people.get(11).flags2 |= 1
    for (const p of people.values()) p.commands.fill(0)
    const last = [...people.values()].at(-1)
    last.commands[0] = 1
    live.selectLiveVehicleDrivers(w)
    assert.equal(v.passengerCount, people.size - 1)
    assert.equal(v.passengers[0], last.id)
    assert.equal(v.passengers.includes(11), false)
    assert.equal(w.objectCells.objects.get(last.id), last)
    assert.equal(w.buildingOrders.records[1].references, people.size)
  })
}

for (const model of [1, 2, 3, 4]) {
  const capacity = rules.vehicleCapacity[model]
  for (let mask = 1; mask < 1 << capacity; mask++) {
    test(`model${model} unload visits every occupied slot for mask${mask}`, () => {
      const { w, v, people } = fixture(model), events = []
      v.passengers = fillFirst(v.passengers.map((id, slot) => mask & (1 << slot) ? id : 0))
      const occupied = v.passengers.filter(Boolean), expectedPeople = structuredClone(people), expectedRng = { randomState: w.randomState }
      v.passengerCount = occupied.length
      w.buildingOrders.records[1].references = occupied.length
      for (const id of occupied) launchVehiclePerson(expectedRng, expectedPeople.get(id), point)
      assert.equal(unloadVehiclePeople(w, v, people, effects(w, events)), occupied.length)
      assert.deepEqual(events.filter(e => e[0] === 'launch').map(e => e[1]), occupied)
      assert.equal(v.passengerCount, 0)
      assert.ok(v.passengers.every(id => id === 0))
      assert.equal(w.buildingOrders.records[1].references, 0)
      assert.equal(w.buildingOrders.active, 0)
      assert.equal(w.randomState, expectedRng.randomState)
      for (const id of occupied) {
        const p = people.get(id), expected = expectedPeople.get(id)
        assert.equal(p.savedVehicle, 0)
        assert.deepEqual(p.commands, Array(8).fill(0))
        for (const key of ['x', 'y', 'h', 'state', 'counter', 'vehicle', 'speed', 'flags2', 'flags4', 'velocity'])
          assert.deepEqual(p[key], expected[key], `${id}: ${key}`)
      }
      assert.equal(unloadVehiclePeople(w, v, people, effects(w, events)), 0, 'no launch replay')
    })
  }

  test(`model${model} single unload promotes only the next driver and preserves later slots`, () => {
    const { w, v, people } = fixture(model), events = [], expected = [...v.passengers]
    expected[0] = 0
    assert.equal(unloadVehiclePeople(w, v, people, effects(w, events), false), 1)
    assert.deepEqual(v.passengers, fillFirst(expected))
    assert.equal(v.passengerCount, capacity - 1)
    assert.equal(w.buildingOrders.records[1].references, capacity - 1)
  })

  test(`model${model} a stale exit still clears only the current driver on every remaining attempt`, () => {
    const { w, v, people } = fixture(model), events = [], rng = w.randomState
    assert.equal(unloadVehiclePeople(w, v, people, effects(w, events, () => false)), 0)
    assert.deepEqual(events, Array.from({ length: capacity }, () => [['clear', 11], ['exit', false]]).flat())
    assert.deepEqual(v.passengers, [...people.keys()])
    assert.equal(v.passengerCount, capacity)
    assert.equal(w.randomState, rng)
    assert.equal(w.buildingOrders.records[1].references, capacity - 1)
  })
}

test('detached and deferred vehicle cleanup is unchanged', () => {
  for (const deferred of [false, true]) {
    const { w, v } = fixture()
    w.units = []
    if (deferred) deferVehicleOrdinaryVisit(w, v)
    else v.active = false
    const before = structuredClone(v)
    live.removeMissingVehiclePassengers(w)
    assert.deepEqual(v, before)
  }
})

test('structured-clone continuation retains sparse ownership and the same subsequent cleanup/unload', () => {
  const { w, v, people } = fixture()
  departVehiclePerson(w, v, people.get(12), point)
  live.removeMissingVehiclePassengers(w)
  assert.deepEqual(v.passengers, [11, 0, 13, 14, 15])
  const twin = structuredClone(w)
  for (const world of [w, twin]) {
    live.removeMissingVehiclePassengers(world)
    unloadVehiclePeople(world, world.vehicles[0], world.pathfinding.people, effects(world, []))
  }
  assert.deepEqual(twin, w)
})

const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
for (const [label, expected] of [
  ['Board followers onto the Boat', [false, true, true]],
  ['Send a Brave inside to launch and board a Boat', [false, true, true]],
  ['Board two followers onto the provided Boat', [false, false, true]],
]) {
  test(`task predicate counts actual occupied seats: ${label}`, () => {
    const start = page.indexOf(`text: '${label}'`)
    assert.notEqual(start, -1)
    const expression = page.slice(start).match(/done: (world\.vehicles\.some\([\s\S]*?\)),/)
    assert.ok(expression)
    const done = new Function('world', `return !!(${expression[1]})`)
    assert.deepEqual([0, 1, 2].map(passengerCount => done({ vehicles: [
      { active: true, passengerCount, passengers: [11, 0, 0, 0, 15].map((id, i) => i === 0 && passengerCount || i === 4 && passengerCount === 2 ? id : 0) },
    ] })), expected)
  })
}
