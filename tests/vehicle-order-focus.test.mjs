import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const api = await loadSceneFixture()
const { ObjectPanels } = await import('../app/object-panels.ts')
const { personOrderIcons, personOrderFocus } = await import('../app/person-panel.ts')
const { stepLiveVehicles } = await import('../app/live-vehicles.ts')

function boarding(model = 1) {
  const world = api.createWorld(22)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const vehicle = world.vehicles.find(vehicle => vehicle.model === model)
  if (model === 3) {
    // Controlled Balloon location, not natural acquisition. Use the authored
    // Boat's reachable landing; the selection and order producer remain real.
    const boat = world.vehicles.find(vehicle => vehicle.model === 1)
    Object.assign(vehicle, { x: boat.x, y: boat.y, h: boat.h })
  }
  api.select(world, 'shaman')
  assert.ok(api.command(world, { ...api.browserPosition(vehicle), id: vehicle.id }))
  const icon = personOrderIcons(world.buildingOrders, shaman.native, world.objectCells.objects)[0]
  assert.equal(icon.model, 22)
  assert.equal(world.buildingOrders.records[icon.id].a, vehicle.id)
  return { world, shaman, vehicle, icon }
}

function focus({ world, shaman, icon }) {
  const events = []
  // Production resolver; only camera and panel submissions are recorded.
  // This is caller coverage without a browser, projection or GPU.
  const panels = new ObjectPanels({
    world,
    overviewActive: false,
    focus: (...args) => events.push(['focus', ...args]),
    onSound: sound => events.push(['sound', sound]),
  })
  panels.open = (...args) => events.push(['open', ...args])
  panels.focusOrder(shaman.id, icon.id)
  return events
}

function assertTarget(fixture) {
  const before = structuredClone(fixture.world)
  assert.deepEqual(focus(fixture), [
    ['focus', api.browserPosition(fixture.vehicle), { animate: true }],
    ['sound', 0x6a],
    ['open', fixture.vehicle.id, true],
  ])
  assert.deepEqual(fixture.world, before, 'inspection must not alter orders or gameplay')
}

for (const model of [1, 3]) {
  test(`${model === 1 ? 'authored Boat' : 'controlled Balloon'} boarding icon focuses its native-coordinate target`, () => {
    assertTarget(boarding(model))
  })
  test(`model${model} focus follows current wrapped coordinates and survives checkpoint migration`, () => {
    const fixture = boarding(model)
    // Supplied motion boundary: stale order coordinates must not replace the
    // current vehicle location. Negative/native wrapped axes need no world conversion.
    Object.assign(fixture.vehicle, { x: -19200, y: 65530 })
    assertTarget(fixture)
    fixture.world = api.migrateCheckpoint(structuredClone(fixture.world))
    fixture.shaman = fixture.world.units.find(unit => unit.id === fixture.shaman.id)
    fixture.vehicle = fixture.world.vehicles.find(vehicle => vehicle.id === fixture.vehicle.id)
    assertTarget(fixture)
  })
}

for (const removal of ['destroyed', 'deleted']) {
  test(`${removal} vehicle retains the existing packed-cell fallback without opening another object`, () => {
    const fixture = boarding()
    const { world, vehicle, icon } = fixture
    if (removal === 'destroyed') {
      vehicle.life = 1 // Supplied final-life boundary, real destruction controller.
      stepLiveVehicles(world)
      assert.equal(vehicle.active, false)
      assert.ok(vehicle.destructionState)
    } else world.vehicles = world.vehicles.filter(candidate => candidate.id !== vehicle.id)
    const order = structuredClone(world.buildingOrders.records[icon.id])
    const fallback = personOrderFocus(order)
    const effects = world.effects.length
    assert.deepEqual(focus(fixture), [
      ['focus', api.browserPosition(fallback), { animate: true }],
      ['sound', 0x6a],
      ['sound', 0x6a],
    ])
    assert.equal(world.effects.length, effects + 1)
    assert.equal(world.effects.at(-1).kind, 'orderMarker')
    assert.deepEqual(world.buildingOrders.records[icon.id], order)
    assert.ok(world.vehicles.some(candidate => candidate.id !== vehicle.id && candidate.active))
  })
}

test('an active exact-zero-life vehicle remains focusable until the existing controller removes it', () => {
  const fixture = boarding()
  fixture.vehicle.life = 0
  stepLiveVehicles(fixture.world)
  assert.equal(fixture.vehicle.active, true)
  assertTarget(fixture)
})

test('removed order icons and enemy person panels cannot focus a vehicle', () => {
  const fixture = boarding()
  fixture.world.buildingOrders.records[fixture.icon.id].flags |= 1
  assert.deepEqual(focus(fixture), [])
  fixture.world.buildingOrders.records[fixture.icon.id].flags &= ~1
  fixture.shaman.team = 'red'
  assert.deepEqual(focus(fixture), [])
})

test('ordinary building-target orders keep their existing browser-coordinate focus path', () => {
  const world = api.createWorld(22)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const building = world.buildings.find(building => building.team === 'red')
  api.select(world, 'shaman')
  assert.ok(api.command(world, building))
  const icon = personOrderIcons(world.buildingOrders, shaman.native, world.objectCells.objects)[0]
  assert.equal(icon.model, 19)
  const before = structuredClone(world)
  assert.deepEqual(focus({ world, shaman, icon }), [
    ['focus', { x: building.x, z: building.z }, { animate: true }],
    ['sound', 0x6a],
    ['open', building.id, true],
  ])
  assert.deepEqual(world, before)
})
