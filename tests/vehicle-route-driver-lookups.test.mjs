import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { liveVehicles } from '../app/live-vehicles.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Complete private context constructor with an observation-only readiness port.
// Route solving, terrain collision and actual boarding are not executed here.
const source = stripTypeScriptTypes(readFileSync(new URL('../app/live-pathfinding.ts', import.meta.url), 'utf8'))
const starts = [...source.matchAll(/function routeContext\(/g)]
assert.equal(starts.length, 1)
const rest = source.slice(starts[0].index), end = rest.search(/\n}(?:\n|$)/)
assert.notEqual(end, -1)
const declaration = rest.slice(0, end + 2)
const ports = {
  rules, liveVehicles, collisionWorld: () => ({}),
  vehicleReady: (world, vehicle) => ({ people: world.people, vehicles: world.vehicles, vehicle }),
}
const context = new Function(...Object.keys(ports), `${declaration}\nreturn routeContext`)(...Object.values(ports))

const owner = (id, vehicle = 70, fields = {}) => ({ id, class: 1, flags2: 0, vehicle, ...fields })
const unit = (id, p = owner(id), fields = {}) => ({ id, hp: 10, native: p, ...fields })
const vehicle = (id = 70, driver = 1, fields = {}) => ({ id, active: true, model: 1,
  passengers: [driver], passengerCount: 1, ...fields })
function world(units = [], vehicles = []) {
  return { units, vehicles,
    objectCells: { objects: new Map(units.filter(u => u.native).map(u => [u.id, u.native])) },
    pathfinding: { people: new Map(), state: {}, path: {}, geometry: {}, solver: { tribeRequests: [0, 0, 0, 0] } },
    manaTribes: Array.from({ length: 4 }, () => ({ playerType: 1, active: true, defeatTimer: 0 })),
    castingTribes: Array.from({ length: 4 }, () => ({ flags: 0 })), land: {}, motionRoutes: {},
  }
}
function observe(w) {
  return context(w, {}, { tribe: 0 }).routeEffects.vehicleReady(w.vehicles[0]?.id)
}

test('empty active vehicle view preserves route owners without reading the roster', () => {
  const p = owner(9), w = world([{ get id() { assert.fail('unused roster read') }, hp: 1 }], [vehicle(70, 1, { active: false })])
  w.pathfinding.people.set(9, p)
  const result = observe(w)
  assert.equal(result.people.get(9), p)
  assert.notEqual(result.people, w.pathfinding.people)
  assert.equal(result.vehicles.size, 0)
})

test('many empty vehicles resolve their absent drivers with one roster scan', t => {
  let reads = 0
  const units = Array.from({ length: 96 }, (_, i) => ({ id: i + 1, hp: 10, native: null })),
    vehicles = Array.from({ length: 32 }, (_, i) => vehicle(700 + i, undefined, { passengers: [], passengerCount: 0 })),
    w = world(units, vehicles), descriptors = units.map(u => Object.getOwnPropertyDescriptor(u, 'id'))
  for (const [i, u] of units.entries()) Object.defineProperty(u, 'id', { configurable: true,
    enumerable: true, get() { reads++; return descriptors[i].value } })
  let result
  try { result = observe(w) } finally {
    for (const [i, u] of units.entries()) Object.defineProperty(u, 'id', descriptors[i])
  }
  assert.equal(result.people.size, 0)
  t.diagnostic(`${reads} unit-ID reads for 96 units and 32 empty vehicles`)
  assert.equal(reads, units.length)
})

test('persistent native entry and builder owners do not need an active route', () => {
  for (const role of ['native', 'entry', 'builder']) {
    const p = owner(1), u = unit(1, null)
    if (role === 'native') u.native = p
    else u[role] = { person: p }
    const w = world([u], [vehicle()])
    w.objectCells.objects.set(1, p)
    assert.equal(observe(w).people.get(1), p, role)
    assert.equal(w.pathfinding.people.has(1), false)
  }
})

test('first living duplicate and owner-priority rules remain exact', () => {
  const dead = unit(1, owner(1), { hp: 0 }), first = unit(1), later = unit(1),
    w = world([dead, first, later], [vehicle()])
  w.objectCells.objects.set(1, first.native)
  assert.equal(observe(w).people.get(1), first.native)
  w.objectCells.objects.set(1, later.native)
  assert.equal(observe(w).people.has(1), false, 'a later registered duplicate must not replace the first living unit')
  first.entry = { person: later.native }
  assert.equal(observe(w).people.has(1), false, 'an invalid native owner does not fall through to entry')
})

test('every driver ownership rejection evicts a stale route-map alias', () => {
  for (const [name, change] of [
    ['dead', (w, u, p) => { u.hp = 0 }],
    ['missing', (w, u, p) => { w.units = [] }],
    ['ID', (w, u, p) => { p.id = 2 }],
    ['class', (w, u, p) => { p.class = 2 }],
    ['retired', (w, u, p) => { p.flags2 = 1 }],
    ['vehicle', (w, u, p) => { p.vehicle = 71 }],
    ['registration', (w, u, p) => { w.objectCells.objects.set(1, { ...p }) }],
  ]) {
    const u = unit(1), p = u.native, stale = owner(1), w = world([u], [vehicle()])
    w.pathfinding.people.set(1, stale)
    change(w, u, p)
    assert.equal(observe(w).people.has(1), false, name)
    assert.equal(w.pathfinding.people.get(1), stale, 'query does not mutate the authoritative route map')
  }
})

test('vehicle iteration order and last duplicate vehicle identity preserve the original admission view', () => {
  const u = unit(1), a = vehicle(), b = vehicle(71), w = world([u], [a, b])
  assert.equal(observe(w).people.has(1), false, 'later incompatible craft evicts earlier admission')
  w.vehicles.reverse()
  assert.equal(observe(w).people.get(1), u.native)
  const replacement = vehicle(70, 2), other = unit(2, owner(2, 70))
  w.units.push(other); w.objectCells.objects.set(2, other.native)
  w.vehicles = [a, replacement]
  const result = observe(w)
  assert.equal(result.vehicle, replacement)
  assert.equal(result.people.get(2), other.native)
  assert.equal(result.people.has(1), false)
})

test('strict NaN rejection and zero/undefined driver lookups retain existing behavior', () => {
  for (const id of [NaN, 0, -0, undefined]) {
    const p = owner(id), u = unit(id, p), v = vehicle(70, id, { passengers: [id] }), w = world([u], [v])
    const stale = owner(id)
    w.pathfinding.people.set(id, stale)
    const result = observe(w)
    assert.equal(result.people.has(id), !Number.isNaN(id))
    if (!Number.isNaN(id)) assert.equal(result.people.get(id), p)
    assert.equal(w.pathfinding.people.get(id), stale)
  }
})

test('separate contexts observe current roster and owner fields without mutating the World', () => {
  const u = unit(1), w = world([u], [vehicle()]), untouched = owner(9)
  w.pathfinding.people.set(9, untouched)
  let before = structuredClone(w)
  const first = observe(w)
  assert.deepEqual(w, before)
  assert.equal(first.people.get(1), u.native)
  const replacement = unit(1)
  w.units = [replacement]; w.objectCells.objects.set(1, replacement.native)
  before = structuredClone(w)
  const second = observe(w)
  assert.deepEqual(w, before)
  assert.equal(second.people.get(1), replacement.native)
  assert.equal(first.people.get(1), u.native)
  replacement.hp = 0
  assert.equal(observe(w).people.has(1), false)
  assert.equal(second.people.get(9), untouched)
})
