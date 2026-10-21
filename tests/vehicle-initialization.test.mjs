import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createIndexedSearch, startIndexedSearch } from '../app/indexed-search.ts'
import { prepareVehiclePosition, vehicleReady } from '../app/vehicle-routing.ts'
import { initializeAuthoredBoat } from '../app/vehicle-initialization.ts'
import { createNativeTerrain } from '../app/native-terrain.ts'
import { command, selectUnit, tick, browserPosition } from '../app/model.ts'
import { createWorld } from '../app/world-initialization.ts'

const index = p => ((p.y & 65535) >>> 9) * 128 + ((p.x & 65535) >>> 9)
const vehicle = () => ({
  id: 1,
  class: 4,
  model: 1,
  x: 9814,
  y: 6230,
  h: 0,
  navigationFlags: 0,
  active: true,
  team: 'blue',
})
const fixture = () => {
  const land = createNativeTerrain(new Int16Array(16384)),
    search = createIndexedSearch()
  return {
    land,
    search,
    context: { flags: land.flags, categories: land.categories, cellObjects: () => [] },
  }
}
const shore = (land, p, category = 8) => {
  land.flags[index(p)] = 0x1000000
  land.categories[index(p)] = category
}

test('constructor preparation adjusts a valid input without acquiring a search slot', () => {
  const { land, search, context } = fixture(),
    v = vehicle()
  shore(land, v)
  const before = search.slice(),
    result = prepareVehiclePosition(context, search, v, v)
  assert.deepEqual(result, { found: true, point: { x: 9928, y: 6344 } })
  assert.deepEqual(search, before)
})

test('constructor preparation uses exact ring order and preserves an unrelated held slot', () => {
  const { land, search, context } = fixture(),
    v = vehicle()
  const held = startIndexedSearch(search, 2, 0, 0, 16),
    record = search.slice(12, 24)
  shore(land, { x: 9472, y: 5888 })
  assert.deepEqual(prepareVehiclePosition(context, search, v, v), {
    found: true,
    point: { x: 9586, y: 6002 },
  })
  assert.deepEqual(search.slice(12, 24), record)
  assert.equal(search[24], 0)
  assert.equal(held, 1)
})

test('failed acquire and exhausted candidates preserve source XY', () => {
  const { search, context } = fixture(),
    v = vehicle()
  assert.deepEqual(prepareVehiclePosition(context, search, v, v), {
    found: false,
    point: { x: v.x, y: v.y },
  })
  assert.equal(search[12], 0)
  for (let i = 0; i < 15; i++) assert.ok(startIndexedSearch(search, 2, 0, 0, 16))
  const before = search.slice()
  assert.deepEqual(prepareVehiclePosition(context, search, v, v), {
    found: false,
    point: { x: v.x, y: v.y },
  })
  assert.deepEqual(search, before)
})

test('registration precedes sampling even after failure; inactive class4 occupants block', () => {
  const { land, search } = fixture(),
    v = vehicle(),
    w = { land, indexedSearch: search, vehicles: [] }
  const heights = land.heights
  Object.defineProperty(land, 'heights', {
    get() {
      assert.equal(w.vehicles[0], v)
      return heights
    },
  })
  initializeAuthoredBoat(w, v)
  assert.deepEqual([v.x, v.y, v.physics, v.speed, v.navigationFlags], [9814, 6230, 12, 0, 0x4080])
  assert.equal(w.vehicles[0], v)
  assert.equal(vehicleReady(land, v), false)
  const blocked = vehicle()
  blocked.id = 2
  blocked.active = false
  shore(land, v)
  const context = { flags: land.flags, categories: land.categories, cellObjects: () => [blocked] }
  assert.equal(prepareVehiclePosition(context, createIndexedSearch(), v, v).found, false)
})

test('caller navigation bypass still registers and initializes the Boat', () => {
  const { land, search } = fixture(),
    v = vehicle(),
    w = { land, indexedSearch: search, vehicles: [] }
  shore(land, v)
  v.navigationFlags = 0x200000
  initializeAuthoredBoat(w, v)
  assert.deepEqual([v.x, v.y, v.navigationFlags], [9814, 6230, 0x204080])
  assert.equal(w.vehicles.length, 1)
  assert.equal(v.life, 5000)
})

test('authored M10 Boat uses the accepted cold endpoint without terrain injection', () => {
  const w = createWorld(10),
    v = w.vehicles[0]
  assert.deepEqual([v.x, v.y, v.h], [9586, 6002, 0])
  assert.equal(Math.round((v.heading * 1024) / Math.PI), 1280)
  assert.deepEqual([v.physics, v.speed, v.navigationFlags, v.life], [12, 0, 0x4080, 5000])
  assert.equal(vehicleReady(w.land, v), true)
  assert.equal(index(v), 1426)
})

test('successful category adjustment wraps words and ignores self occupancy', () => {
  const { land, search, context } = fixture(),
    v = { ...vehicle(), x: 65520, y: 65520 }
  shore(land, v)
  context.cellObjects = () => [v]
  assert.deepEqual(prepareVehiclePosition(context, search, v, v), {
    found: true,
    point: { x: 98, y: 98 },
  })
})

test('later authored Boat sees a previously prepared inactive Boat at its new cell', () => {
  const { land, search } = fixture(),
    first = vehicle(),
    second = { ...vehicle(), id: 2 },
    w = { land, indexedSearch: search, vehicles: [] }
  shore(land, { x: 9472, y: 5888 })
  first.active = false
  initializeAuthoredBoat(w, first)
  initializeAuthoredBoat(w, second)
  assert.deepEqual([first.x, first.y], [9586, 6002])
  assert.deepEqual([second.x, second.y], [9814, 6230])
  assert.deepEqual(
    w.vehicles.map(v => v.id),
    [1, 2]
  )
})

test('ordinary authored Warriors board, retain seats through store load and depart', async () => {
  const store = await createCampaignFixtureStore([10])
  assert.equal(store.startMission(10), true)
  let w = store.getWorld(),
    boat = w.vehicles[0]
  const ids = w.units.filter(u => u.team === 'blue' && u.kind === 'warrior').map(u => u.id)
  assert.equal(ids.length, 4)
  for (const [i, id] of ids.entries()) selectUnit(w, id, i > 0)
  assert.deepEqual(
    [...w.selected].sort((a, b) => a - b),
    [...ids].sort((a, b) => a - b)
  )
  assert.equal(command(w, { ...browserPosition(boat), id: boat.id }), true)
  const aboard = () => ids.every(id => w.units.find(u => u.id === id).native?.vehicle === boat.id)
  for (let i = 0; i < 240 && !aboard(); i++) tick(w, 1 / 12)
  assert.ok(aboard(), 'all four authored Warriors board through the ordinary order')
  assert.equal(boat.passengerCount, 4)
  const prepared = {
    x: boat.x,
    y: boat.y,
    h: boat.h,
    heading: boat.heading,
    passengers: [...boat.passengers],
  }
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  w = store.getWorld()
  boat = w.vehicles.find(v => v.id === boat.id)
  assert.deepEqual(
    { x: boat.x, y: boat.y, h: boat.h, heading: boat.heading, passengers: boat.passengers },
    prepared
  )
  assert.ok(aboard())
  const from = { x: boat.x, y: boat.y }
  assert.equal(command(w, browserPosition({ x: (boat.x + 1536) & 65535, y: boat.y, h: 0 })), true)
  for (let i = 0; i < 120 && boat.x === from.x && boat.y === from.y; i++) tick(w, 1 / 12)
  assert.notDeepEqual({ x: boat.x, y: boat.y }, from)
  assert.ok(aboard())
  assert.equal(boat.passengerCount, 4)
})

test('M5 linked Boat is prepared while still inactive and attached to its reward head', () => {
  const w = createWorld(5),
    boat = w.vehicles[0],
    head = w.shrines.find(s => s.kind === 'boat')
  assert.equal(boat.active, false)
  assert.equal(head.rewardVehicle, boat.id)
  // Observed source-general browser initialization, not native M5 endpoint parity.
  assert.deepEqual([boat.x, boat.y, boat.heading], [58226, 12429, 7 * Math.PI / 4])
  assert.equal(boat.physics, 12)
  assert.equal(boat.speed, 0)
  assert.equal(vehicleReady(w.land, boat), true)
  // No reward is triggered here: fresh reward allocation/copy is a separate owner.
})
