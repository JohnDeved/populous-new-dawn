import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const api = await loadSceneFixture()
const { createStartedWorld, finishLevelStart } = await import('./level-start-fixture.mjs')
const { pointerDown, pointerUp, updateDrag, cancelPointerGesture } =
  await import('../app/scene-input-runtime.ts')
const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
const { createPersonOrderPool } = await import('../app/person-orders.ts')

// Actual World, placement validator, allocator, workers and pointer callers.
// DOM capture and terrain picking are supplied; this is not rendered input evidence.
function fixture(world = createStartedWorld(), initialPoint = { x: -2, z: 32 }) {
  const sounds = []
  let point = initialPoint
  const scene = {
    world,
    renderer: { domElement: { setPointerCapture() {} } },
    globeMotion: { dragging: false, velocity: { x: 0, y: 0 } },
    dragActive: { value: false },
    selectionOverlay: { visible: false, update() {} },
    view: { angle: 0 },
    flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    pickUnit: () => undefined,
    pick: () => point,
    pickWorldObject: () => null,
    picking: { pickPerson: () => undefined },
    onChange() {},
    onSound: sound => sounds.push(sound),
    acknowledgePointer() {},
    orderSound() {},
    objectPanels: { releaseBuildingInspection() {} },
  }
  scene.updateDrag = event => updateDrag(scene, event)
  skipIntroduction(scene)
  assert.equal(world.inputMask, 0)
  world.mode = 'hut'
  assert.equal(api.placementError(world, 'hut', point), null)
  const event = (extra = {}) => ({
    pointerId: 1, button: 0, buttons: 1, clientX: 10, clientY: 10,
    ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...extra,
  })
  const click = (up = {}, down = up) => {
    pointerDown(scene, event(down))
    pointerUp(scene, event({ ...up, buttons: 0 }))
  }
  return {
    world, scene, sounds, event, click,
    target: value => { point = value },
    nextSite: () => {
      for (let z = 20; z <= 48; z += 4)
        for (let x = -20; x <= 20; x += 4)
          if (!api.placementError(world, 'hut', { x, z })) return { x, z }
      assert.fail('authored terrain must provide the next placement site')
    },
  }
}

test('Ctrl places consecutive plans, retains invalid clicks and rotation, then plain release finishes', () => {
  const f = fixture(), initial = f.world.buildings.length
  api.select(f.world, 'brave')
  f.world.mode = 'hut'
  const selected = [...f.world.selected]
  f.click({ ctrlKey: true })
  assert.equal(f.world.buildings.length, initial + 1)
  assert.equal(f.world.mode, 'hut')
  const first = f.world.buildings.at(-1)
  f.click({ ctrlKey: true })
  assert.equal(f.world.buildings.length, initial + 1, 'overlapping plan is rejected')
  assert.equal(f.world.mode, 'hut')
  assert.deepEqual(f.sounds, [0x24, 0x25])
  assert.equal(api.rotateBuildingPlan(f.world), true)
  f.target(f.nextSite())
  f.click({ ctrlKey: true })
  assert.equal(f.world.buildings.length, initial + 2)
  assert.equal(api.buildingPose(f.world.buildings.at(-1)).angle, 512)
  assert.equal(f.world.mode, 'hut')
  f.target(f.nextSite())
  f.click()
  assert.equal(f.world.buildings.length, initial + 3)
  assert.equal(f.world.mode, null)
  assert.ok(f.world.buildings.includes(first))
  assert.deepEqual(f.world.selected, selected)
  assert.deepEqual(f.sounds, [0x24, 0x25, 0x24, 0x24])
})

test('dry-land rejection between valid Ctrl plans preserves the selected building', () => {
  const f = fixture(), initial = f.world.buildings.length
  f.click({ ctrlKey: true })
  let water
  for (let z = -128; z < 128 && !water; z += 16)
    for (let x = -128; x < 128 && !water; x += 16)
      if (api.placementError(f.world, 'hut', { x, z })?.includes('dry land')) water = { x, z }
  assert.ok(water, 'authored level must provide a site rejected for missing dry land')
  const orders = structuredClone(f.world.buildingOrders)
  f.target(water)
  f.click({ ctrlKey: true })
  assert.equal(f.world.buildings.length, initial + 1)
  assert.equal(f.world.mode, 'hut')
  assert.deepEqual(f.world.buildingOrders, orders)
  f.target(f.nextSite())
  f.click({ ctrlKey: true })
  assert.equal(f.world.buildings.length, initial + 2)
  assert.equal(f.world.mode, 'hut')
  assert.deepEqual(f.sounds, [0x24, 0x25, 0x24])
})

for (const [downCtrl, upCtrl] of [[true, false], [false, true]])
  test(`placement samples Ctrl on release: press=${downCtrl}, release=${upCtrl}`, () => {
    const f = fixture(), initial = f.world.buildings.length
    f.click({ ctrlKey: upCtrl }, { ctrlKey: downCtrl })
    assert.equal(f.world.buildings.length, initial + 1)
    assert.equal(f.world.mode, upCtrl ? 'hut' : null)
  })

for (let bits = 0; bits < 8; bits++) {
  const modifiers = { shiftKey: !!(bits & 1), ctrlKey: !!(bits & 2), altKey: !!(bits & 4) }
  test(`placement honors original exact modifier combination ${bits}`, () => {
    const f = fixture(), initial = f.world.buildings.length
    f.click(modifiers)
    const accepted = [0, 2, 4].includes(bits)
    assert.equal(f.world.buildings.length, initial + Number(accepted))
    assert.equal(f.world.mode, bits === 0 ? null : 'hut')
    assert.deepEqual(f.sounds, accepted ? [0x24] : [])
  })
  test(`right release cancels retained placement with modifier combination ${bits}`, () => {
    const f = fixture()
    f.click({ ctrlKey: true })
    const initial = f.world.buildings.length
    api.select(f.world, 'brave')
    f.world.mode = 'hut'
    const selected = [...f.world.selected]
    f.click({ button: 2, buttons: 0, ...modifiers }, { button: 2, buttons: 2, ...modifiers })
    assert.equal(f.world.mode, null)
    assert.equal(f.world.buildings.length, initial)
    assert.deepEqual(f.world.selected, selected)
  })
}

for (const condition of ['ordinary', 'no selection', 'no workers', 'full orders'])
  test(`retention preserves existing placement and worker policy: ${condition}`, () => {
    const f = fixture()
    if (condition === 'no selection') api.setSelection(f.world, [])
    else api.select(f.world, 'brave')
    f.world.mode = 'hut'
    if (condition === 'no workers')
      for (const unit of f.world.units) if (unit.team === 'blue' && unit.kind === 'brave') unit.hp = 0
    if (condition === 'full orders') {
      f.world.buildingOrders = createPersonOrderPool()
      for (const order of f.world.buildingOrders.records) Object.assign(order, { model: 3, references: 1 })
      f.world.buildingOrders.active = f.world.buildingOrders.records.length - 1
    }
    const ordinary = structuredClone(f.world), repeated = structuredClone(f.world)
    assert.equal(api.placeBuilding(ordinary, 'hut', { x: -2, z: 32 }), true)
    assert.equal(api.placeBuilding(repeated, 'hut', { x: -2, z: 32 }, true), true)
    assert.equal(ordinary.mode, null)
    assert.equal(repeated.mode, 'hut')
    ordinary.mode = 'hut'
    assert.deepEqual(repeated, ordinary, 'mode is the only difference')
  })

test('unavailable building rejection preserves mode without placing or assigning workers', () => {
  const f = fixture(), initial = f.world.buildings.length
  f.world.mode = 'camp'
  assert.equal(f.world.unlockedCamp, false)
  const orders = structuredClone(f.world.buildingOrders)
  f.click({ ctrlKey: true })
  assert.equal(f.world.mode, 'camp')
  assert.equal(f.world.buildings.length, initial)
  assert.deepEqual(f.world.buildingOrders, orders)
  assert.deepEqual(f.sounds, [0x25])
})

for (const condition of ['inputMask', 'modalSuspended', 'overviewStage', 'paused', 'cancelled'])
  test(`${condition} prevents a held-Ctrl release from placing`, () => {
    const f = fixture(), initial = f.world.buildings.length
    pointerDown(f.scene, f.event({ ctrlKey: true }))
    if (condition === 'inputMask') f.world.inputMask = 64
    else if (condition === 'paused') f.world.paused = true
    else if (condition === 'cancelled') cancelPointerGesture(f.scene)
    else f.scene[condition] = true
    pointerUp(f.scene, f.event({ ctrlKey: true, buttons: 0 }))
    assert.equal(f.world.buildings.length, initial)
    assert.equal(f.world.mode, 'hut')
  })

test('replacement scene cannot inherit a retained mode or old pointer release', () => {
  const before = fixture(), after = fixture()
  before.click({ ctrlKey: true })
  pointerDown(before.scene, before.event({ ctrlKey: true }))
  cancelPointerGesture(before.scene)
  after.world.mode = null
  const oldCount = before.world.buildings.length, newCount = after.world.buildings.length
  pointerUp(after.scene, after.event({ ctrlKey: true, buttons: 0 }))
  pointerUp(before.scene, before.event({ ctrlKey: true, buttons: 0 }))
  assert.equal(before.world.buildings.length, oldCount)
  assert.equal(after.world.buildings.length, newCount)
  assert.equal(after.world.mode, null)
})

// Real store lifecycle with supplied Scene/capture/picking, not React disposal,
// rendered pointer delivery, IndexedDB persistence or original-game parity.
const { createGameStore } = await import('../app/game-store.ts')
for (const transition of ['restart', 'startMission']) {
  test(`retained placement session save survives independent loads and ${transition}`, async () => {
    assert.equal(typeof indexedDB, 'undefined', 'this test must not access persistent user saves')
    const store = createGameStore()
    const original = finishLevelStart(store.getWorld()), f = fixture(original)
    const initialIds = new Set(original.buildings.map(building => building.id))
    api.select(original, 'brave')
    original.mode = 'hut'
    f.click({ ctrlKey: true })
    f.target(f.nextSite())
    f.click({ altKey: true })
    const plans = original.buildings.filter(building => !initialIds.has(building.id))
    assert.equal(plans.length, 2)
    assert.equal(original.mode, 'hut')
    const savedPlans = structuredClone(plans)
    assert.equal(await store.saveCheckpoint(false), false, 'in-session snapshot only')
    const originalSnapshot = structuredClone(original), previous = []
    for (let iteration = 0; iteration < 2; iteration++) {
      assert.equal(store.loadCheckpoint(), true)
      const loaded = store.getWorld()
      assert.notEqual(loaded, original)
      for (const prior of previous) assert.notEqual(loaded, prior.world)
      assert.equal(loaded.mode, 'hut', 'store preserves the saved placement selection')
      assert.deepEqual(loaded.buildings.filter(building => !initialIds.has(building.id)), savedPlans)
      const next = fixture(loaded, f.nextSite())
      next.target(next.nextSite())
      next.click()
      assert.equal(loaded.mode, null)
      assert.equal(loaded.buildings.length, original.buildings.length + 1)
      assert.deepEqual(next.sounds, [0x24])
      assert.deepEqual(original.buildings.filter(building => !initialIds.has(building.id)), savedPlans)
      for (const prior of previous) assert.deepEqual(prior.world, prior.snapshot)
      previous.push({ world: loaded, snapshot: structuredClone(loaded) })
    }
    if (transition === 'restart') store.restart()
    else store.startMission(2)
    const replacement = store.getWorld()
    assert.equal(replacement.outcome.level, transition === 'restart' ? 1 : 2)
    assert.equal(replacement.mode, null)
    assert.notEqual(replacement, original)
    const fresh = api.createWorld(replacement.outcome.level, 'scalable')
    assert.deepEqual(replacement.buildings, fresh.buildings, 'new mission has no inherited player plans')
    for (const prior of previous) assert.deepEqual(prior.world, prior.snapshot)
    assert.equal(store.loadCheckpoint(), true, 'mission replacement preserves the separate session save')
    const restored = store.getWorld()
    assert.equal(restored.outcome.level, 1)
    assert.equal(restored.mode, 'hut')
    assert.deepEqual(restored.buildings.filter(building => !initialIds.has(building.id)), savedPlans)
    assert.deepEqual(original, originalSnapshot, 'store replacement and later placement cannot mutate the abandoned World')
  })
}
