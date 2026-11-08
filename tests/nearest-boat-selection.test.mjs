import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

// Execute the complete maintained selector and readiness predicate without the
// unrelated rendering/world import closure. These are supplied-state controls,
// not a full route, campaign, native-executable or browser acceptance run.
const vehicles = readFileSync(new URL('../app/live-vehicles.ts', import.meta.url), 'utf8'),
  routing = readFileSync(new URL('../app/vehicle-routing.ts', import.meta.url), 'utf8'),
  rules = JSON.parse(readFileSync(new URL('../app/original-rules.json', import.meta.url), 'utf8'))

function between(source, start, end) {
  const first = source.indexOf(start),
    last = source.indexOf(end, first + start.length)
  assert.ok(first >= 0 && last > first, `Missing authored boundary: ${start}`)
  assert.equal(source.indexOf(start, first + start.length), -1)
  return source.slice(first, last)
}

const source = stripTypeScriptTypes(
  [
    between(vehicles, 'const short =', '\nconst packedCell ='),
    between(routing, 'const cell =', '\nconst signedByte ='),
    between(routing, 'export function vehicleReady(', '\n// Complete 0x4663c0'),
    between(vehicles, 'export function nearestLiveBoat(', '\nexport function boardLiveVehicle('),
  ].join('\n').replaceAll('export function ', 'function ')
)

function implementation() {
  let distances = 0
  const math = Object.create(Math)
  math.hypot = (...args) => {
    distances++
    return Math.hypot(...args)
  }
  const api = runInNewContext(`${source}\n;({ nearestLiveBoat, vehicleReady })`, { rules, Math: math })
  return { ...api, distances: () => distances }
}

const short = value => (value << 16) >> 16,
  cellIndex = point => ((point.y >>> 9) & 127) * 128 + ((point.x >>> 9) & 127)

function boat(id, x = 1024, y = 1024, fields = {}) {
  return {
    id, x, y, active: true, model: 1, passengerCount: 0, passengers: [],
    physics: 2, speed: 0, navigationFlags: 0, reservation: 0, ...fields,
  }
}

function world(boats, playerType = 2) {
  return {
    vehicles: boats,
    manaTribes: Array.from({ length: 4 }, () => ({ playerType })),
    pathfinding: { people: new Map() },
    land: { flags: new Uint32Array(16384), categories: new Uint8Array(16384).fill(2) },
  }
}

// Preserve the previous filter/stable-sort policy as a differential oracle.
// The readiness leaf is actual, unchanged production code, not a stub.
function reference(w, p, center, minimum, maximum, ready) {
  return w.vehicles.filter(v => {
    if (!v.active || v.model !== 1 || v.passengerCount >= rules.vehicleCapacity[v.model] ||
      !ready(w.land, v) || (w.manaTribes[p.tribe].playerType === 1 && v.reservation)) return false
    const driver = v.passengerCount && w.pathfinding.people.get(v.passengers[0])
    if (driver && driver.tribe !== p.tribe) return false
    const distance = Math.hypot(short(v.x - center.x), short(v.y - center.y))
    return distance >= minimum && distance < maximum
  }).sort((a, b) =>
    Math.hypot(short(a.x - center.x), short(a.y - center.y)) -
    Math.hypot(short(b.x - center.x), short(b.y - center.y))
  )[0]
}

test('empty and rejected rosters return undefined', () => {
  const { nearestLiveBoat } = implementation(), p = { tribe: 0 }, center = { x: 0, y: 0 }
  assert.equal(nearestLiveBoat(world([]), p, center, 0, Infinity), undefined)
  assert.equal(nearestLiveBoat(world([boat(1, 0, 0, { active: false })]), p, center, 0, Infinity), undefined)
})

test('select the nearest eligible object without changing roster order or world state', () => {
  const { nearestLiveBoat } = implementation(),
    boats = [boat(1, 3000, 4000), boat(2, 300, 400), boat(3, 600, 800)],
    w = world(boats), before = structuredClone(w)
  assert.equal(nearestLiveBoat(w, { tribe: 0 }, { x: 0, y: 0 }, 0, Infinity), boats[1])
  assert.deepEqual(w, before)
  assert.deepEqual(w.vehicles, boats)
})

test('equal distances and duplicate handles preserve the first roster object', () => {
  const { nearestLiveBoat } = implementation(),
    first = boat(2 ** 32 + 17, 300, 400), second = boat(first.id, -300, -400)
  assert.equal(nearestLiveBoat(world([first, second]), { tribe: 0 }, { x: 0, y: 0 }, 0, 501), first)
  assert.equal(nearestLiveBoat(world([second, first]), { tribe: 0 }, { x: 0, y: 0 }, 0, 501), second)
})

test('minimum is inclusive and maximum is exclusive, including zero and empty ranges', () => {
  const { nearestLiveBoat } = implementation(), p = { tribe: 0 }, center = { x: 0, y: 0 },
    zero = boat(1, 0, 0), edge = boat(2, 300, 400), w = world([zero, edge])
  for (const [minimum, maximum, expected] of [
    [0, 1, zero], [500, 501, edge], [1, 500, undefined], [500, 500, undefined],
    [501, 500, undefined], [-1, Infinity, zero], [0, 0, undefined],
    [NaN, Infinity, undefined], [0, NaN, undefined], [Infinity, Infinity, undefined],
  ]) assert.equal(nearestLiveBoat(w, p, center, minimum, maximum), expected)
})

test('wrapped distances select across both world seams and the signed half-world boundary', () => {
  const { nearestLiveBoat } = implementation(), p = { tribe: 0 }
  for (const [center, near, far] of [
    [{ x: 65530, y: 1000 }, { x: 3, y: 1000 }, { x: 65500, y: 1000 }],
    [{ x: 1000, y: 65530 }, { x: 1000, y: 3 }, { x: 1000, y: 65500 }],
    [{ x: -5, y: -5 }, { x: 2, y: 2 }, { x: 30, y: 30 }],
    [{ x: 0, y: 0 }, { x: 32767, y: 0 }, { x: 32768, y: 0 }],
  ]) {
    const expected = boat(2, near.x, near.y), other = boat(1, far.x, far.y)
    assert.equal(nearestLiveBoat(world([other, expected]), p, center, 0, Infinity), expected)
  }
})

for (const [label, change] of [
  ['inactive', (v, w) => { v.active = false }],
  ['Balloon', (v, w) => { v.model = 3 }],
  ['full', (v, w) => { v.passengerCount = 5 }],
  ['navigation-locked', (v, w) => { v.navigationFlags = 0x10000 }],
  ['open-water', (v, w) => { w.land.categories[cellIndex(v)] = 1 }],
  ['terrain-flagged', (v, w) => { w.land.flags[cellIndex(v)] = 4 }],
  ['at-speed-limit', (v, w) => { v.speed = rules.personSpeeds[v.physics] }],
  ['human-reserved', (v, w) => { v.reservation = 1; w.manaTribes[0].playerType = 1 }],
  ['enemy-driver', (v, w) => {
    v.passengerCount = 1; v.passengers = [33]; w.pathfinding.people.set(33, { tribe: 1 })
  }],
]) test(`${label} nearer craft does not hide the eligible Boat`, () => {
  const { nearestLiveBoat } = implementation(), first = boat(1, 1024, 1024),
    expected = boat(2, 4096, 4096), w = world([first, expected])
  change(first, w)
  assert.equal(nearestLiveBoat(w, { tribe: 0 }, first, 0, Infinity), expected)
})

test('missing driver, own driver, AI reservation and signed negative speed keep existing eligibility', () => {
  const { nearestLiveBoat } = implementation(), p = { tribe: 0 }
  for (const mode of ['missing', 'own', 'AI-reserved', 'negative-speed']) {
    const v = boat(1), w = world([v])
    if (mode === 'missing' || mode === 'own') {
      v.passengerCount = 1; v.passengers = [99]
      if (mode === 'own') w.pathfinding.people.set(99, { tribe: 0 })
    } else if (mode === 'AI-reserved') v.reservation = 1
    else v.speed = 65535
    assert.equal(nearestLiveBoat(w, p, v, 0, 1), v, mode)
  }
})

test('all terrain categories and relevant readiness flag combinations match the prior selector', () => {
  const api = implementation(), p = { tribe: 0 }
  for (let category = 0; category < 16; category++)
    for (const flags of [0, 2, 4, 0x200, 0x100000, 0x100004, 0x1000204])
      for (const speed of [-1, 0, 69, 70, 65535]) {
        const v = boat(1, 1024, 1024, { speed }), w = world([v])
        w.land.categories[cellIndex(v)] = category; w.land.flags[cellIndex(v)] = flags
        assert.equal(api.nearestLiveBoat(w, p, v, 0, 1), reference(w, p, v, 0, 1, api.vehicleReady))
      }
})

test('deterministic mixed rosters preserve exact selection across mutations and cloned continuation', () => {
  const api = implementation()
  let seed = 0x46820
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed >>> 8 }
  for (let sample = 0; sample < 256; sample++) {
    const count = next() % 129, p = { tribe: next() % 4 }, center = { x: next() % 65536, y: next() % 65536 },
      minimum = next() % 40000, maximum = minimum + next() % 50000,
      boats = Array.from({ length: count }, (_, i) => boat(2 ** 32 + i + 1, next() % 65536, next() % 65536, {
        active: next() % 5 !== 0, model: next() % 4 + 1, passengerCount: next() % 6,
        passengers: [i + 1], speed: next() % 72 - 1, reservation: next() % 2,
        navigationFlags: next() % 5 === 0 ? 0x10000 : 0,
      })), w = world(boats, next() % 2 + 1)
    for (const v of boats) {
      if (next() % 3) w.pathfinding.people.set(v.passengers[0], { tribe: next() % 4 })
      w.land.categories[cellIndex(v)] = next() % 16
      w.land.flags[cellIndex(v)] = next() % 5 === 0 ? 4 : 0
    }
    for (const current of [w, structuredClone(w)]) {
      assert.equal(api.nearestLiveBoat(current, p, center, minimum, maximum),
        reference(current, p, center, minimum, maximum, api.vehicleReady), `sample ${sample}`)
      current.vehicles.reverse()
      for (const v of current.vehicles) { v.active = !v.active; v.reservation ^= 1 }
      assert.equal(api.nearestLiveBoat(current, p, center, 0, Infinity),
        reference(current, p, center, 0, Infinity, api.vehicleReady), `mutated sample ${sample}`)
    }
  }
})

for (const count of [1, 256, 1000]) test(`measure distance once for each of ${count} eligible Boats`, () => {
  const api = implementation(), boats = Array.from({ length: count }, (_, i) => boat(i + 1, count - i, 0)),
    w = world(boats)
  assert.equal(api.nearestLiveBoat(w, { tribe: 0 }, { x: 0, y: 0 }, 0, Infinity), boats[count - 1])
  assert.equal(api.distances(), count)
})

test('eligibility-rejected Boats do not compute distance', () => {
  const api = implementation(), w = world([boat(1, 0, 0, { active: false }), boat(2, 0, 0, { model: 3 })])
  assert.equal(api.nearestLiveBoat(w, { tribe: 0 }, { x: 0, y: 0 }, 0, Infinity), undefined)
  assert.equal(api.distances(), 0)
})

test('out-of-range Boats compute distance once, without hiding an in-range tie', () => {
  const api = implementation(), boats = [boat(1, 0, 0), boat(2, 3, 4), boat(3, -3, -4), boat(4, 6, 8)]
  assert.equal(api.nearestLiveBoat(world(boats), { tribe: 0 }, { x: 0, y: 0 }, 5, 10), boats[1])
  assert.equal(api.distances(), boats.length)
})
