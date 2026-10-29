import assert from 'node:assert/strict'
import test from 'node:test'
import { renderBuildingPanels } from '../app/building-panels.ts'
import { addBuilding, addUnit, command, tick } from '../app/model.ts'
import { damageTornadoBuilding } from '../app/building-runtime.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { createGameStore } from '../app/game-store.ts'

// Supplied allocation boundary and initial buildings/person. Actual handle
// allocation, damage/retirement, admission, DOM handlers and dismantling run.
// DOM/projection/canvas are supplied, not rendered-browser or native proof.
const nop = () => {}
const atlas = { complete: true, naturalWidth: 2048 }

function supplyDom(t) {
  const previous = new Map(
    ['document', 'getComputedStyle'].map(name => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ])
  )
  const element = () => ({
    children: [],
    hidden: false,
    style: {},
    dataset: {},
    attributes: {},
    held: false,
    classList: { toggle: nop },
    listeners: {},
    addEventListener(type, callback) {
      this.listeners[type] = callback
    },
    dispatch(type, event = {}) {
      this.listeners[type]?.({ preventDefault: nop, ...event })
    },
    appendChild(child) {
      this.children.push(child)
    },
    setAttribute(name, value) {
      this.attributes[name] = value
    },
    matches() {
      return false
    },
    contains() {
      return false
    },
    remove() {
      this.removed = true
    },
    get firstElementChild() {
      return this.children[0]
    },
    get lastElementChild() {
      return this.children.at(-1)
    },
    getContext: () => ({ drawImage: nop, fillRect: nop }),
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      activeElement: {},
      querySelector: () => null,
      createElement: element,
    },
  })
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: () => ({ getPropertyValue: () => '1' }),
  })
  t.after(() => {
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })
  return element
}

function fixture(t, { repaint = true } = {}) {
  supplyDom(t)
  const store = createGameStore()
  const world = finishLevelStart(store.getWorld())
  world.inputMask = 0
  world.manaWorld.gameFlags = 32
  world.nextId = 1024 // Exercise the live ten-bit building-handle allocator.
  const old = addBuilding(world, 'blue', 'tower', { x: -2, z: 32 }, true, { angle: Math.PI })
  const rect = () => ({ left: 0, top: 0, width: 800, height: 600 })
  const scene = {
    world,
    presentationBinding: store.bindPresentation(world),
    isCurrent() {
      return !this.disposed && this.presentationBinding.isCurrent()
    },
    hoveredObject: old.id,
    buildingPanels: new Map(),
    objectPanels: { buildingRecords: new Map(), panels: new Map(), open: nop },
    container: { appendChild: nop, getBoundingClientRect: rect },
    renderer: { domElement: { getBoundingClientRect: rect } },
    screen: () => ({ x: 0, y: 0 }),
    visible: () => true,
    onSound: nop,
    onChange: nop,
    focus: nop,
  }
  scene.renderBuildingPanels = () => renderBuildingPanels(scene, atlas)
  scene.renderBuildingPanels()
  const oldPanel = scene.buildingPanels.get(old.id)
  assert.ok(oldPanel && !oldPanel.hidden)
  while (old.hp > 0) damageTornadoBuilding(world, old, 1)
  tick(world, 1 / 12)
  assert.ok(
    !world.buildings.includes(old),
    'actual damage and turn cleanup retire the old building'
  )
  const building = addBuilding(world, 'blue', 'tower', { x: -2, z: 32 }, true, { angle: Math.PI })
  assert.equal(building.id, old.id, 'real allocator reuses the released handle')
  assert.notEqual(building, old)
  const unit = addUnit(world, 'blue', 'brave', { x: 7, z: 33 })
  world.selected = [unit.id]
  assert.equal(command(world, building), true)
  for (let turns = 0; turns < 300 && unit.inside !== building.id; turns++) tick(world, 1 / 12)
  assert.equal(unit.inside, building.id, 'real occupant admission reaches the replacement')
  world.selected = []
  if (repaint) scene.renderBuildingPanels()
  const panel = scene.buildingPanels.get(building.id)
  assert.ok(panel && !panel.hidden)
  const occupant = panel.children[1]
  if (repaint)
    assert.equal(
      occupant.dataset.person,
      String(unit.id),
      'visible row now describes the replacement occupant'
    )
  return { store, world, scene, old, oldPanel, building, unit, panel, occupant }
}

test('recycled building handles select the displayed live occupant, not a dead captured building', t => {
  const { world, building, unit, occupant } = fixture(t)
  occupant.dispatch('click', { shiftKey: false })
  assert.deepEqual(world.selected, [unit.id])
  assert.equal(unit.inside, building.id, 'selection alone preserves real occupancy')
})

test('recycled building handles dismantle the displayed replacement through real worker orders', t => {
  const { world, old, building, unit, panel } = fixture(t)
  panel.lastElementChild.dispatch('click')
  assert.ok(
    building.admission.activity & 0x8000,
    'the replacement receives the shipped dismantle action'
  )
  assert.equal(old.hp, 0, 'retired original remains dead')
  assert.equal(unit.inside, null, 'the real dismantle consumer releases its occupant')
  for (let turns = 0; turns < 500 && building.hp > 0; turns++) tick(world, 1 / 12)
  assert.equal(building.hp, 0)
  assert.ok(building.dismantled, 'completion is real worker dismantling, not deletion')
  assert.ok(unit.hp > 0)
})

function observeFeedback(scene) {
  const calls = []
  scene.onSound = cue => calls.push(['sound', cue])
  scene.onChange = () => calls.push(['change'])
  scene.focus = unit => calls.push(['focus', unit.id])
  scene.objectPanels.open = id => calls.push(['open', id])
  return calls
}

function clickEveryControl(panel) {
  panel.children[1].dispatch('click', { shiftKey: true })
  panel.children[1].dispatch('contextmenu')
  panel.lastElementChild.dispatch('click')
}

test('an unpainted recycled handle cannot retarget old controls or emit feedback', t => {
  const { world, scene, building, unit, panel } = fixture(t, { repaint: false })
  const calls = observeFeedback(scene)
  const before = structuredClone(world)
  clickEveryControl(panel)
  assert.deepEqual(world, before)
  assert.deepEqual(calls, [])
  scene.renderBuildingPanels()
  panel.children[1].dispatch('click', { shiftKey: false })
  assert.deepEqual(world.selected, [unit.id], 'legitimate repaint binds the replacement')
  assert.equal(unit.inside, building.id)
})

test('occupant right-focus resolves the displayed current person and rejects departed occupants', t => {
  const { world, scene, building, unit, occupant } = fixture(t)
  const calls = observeFeedback(scene)
  occupant.dispatch('contextmenu')
  assert.deepEqual(calls, [
    ['focus', unit.id],
    ['open', unit.id],
    ['sound', 0x6a],
  ])
  world.selected = [unit.id]
  assert.equal(command(world, { x: 9, z: 37 }), true)
  assert.equal(unit.inside, null)
  assert.ok(!building.admission.occupants.includes(unit.id))
  calls.length = 0
  const before = structuredClone(world)
  occupant.dispatch('contextmenu')
  occupant.dispatch('click', { shiftKey: true })
  assert.deepEqual(calls, [])
  assert.deepEqual(world, before, 'departure between paints cannot focus or select stale occupants')
})

test('current ownership, type and input guards reject controls without action or feedback', t => {
  const { world, scene, building, unit, panel } = fixture(t)
  const calls = observeFeedback(scene)
  for (const [target, field, value] of [
    [building, 'team', 'red'],
    [building, 'kind', 'prison'],
    [world, 'inputMask', 1],
    [scene, 'overviewActive', true],
    [scene, 'disposed', true],
    [panel, 'hidden', true],
  ]) {
    const old = target[field]
    target[field] = value
    const before = structuredClone(world)
    clickEveryControl(panel)
    assert.deepEqual(world, before, field)
    assert.deepEqual(calls, [], field)
    target[field] = old
  }
  unit.team = 'red' // Supplied negative ownership boundary, not an earned transfer.
  const before = structuredClone(world)
  panel.children[1].dispatch('click')
  panel.children[1].dispatch('contextmenu')
  assert.deepEqual(world, before)
  assert.deepEqual(calls, [])
})

test('retired building controls cannot act before the removal paint', t => {
  const { world, scene, building, panel } = fixture(t)
  while (building.hp > 0) damageTornadoBuilding(world, building, 1)
  const calls = observeFeedback(scene)
  const before = structuredClone(world)
  clickEveryControl(panel)
  assert.deepEqual(world, before)
  assert.deepEqual(calls, [])
  scene.renderBuildingPanels()
  assert.equal(scene.buildingPanels.has(building.id), false)
  assert.equal(panel.removed, true)
})

test('Save preserves controls; public Load revokes the old Scene before its next paint', async t => {
  const { store, world, scene, building, unit, panel } = fixture(t)
  await store.saveCheckpoint() // In-session store publication; no browser IndexedDB claim.
  assert.equal(store.hasCheckpoint(), true)
  panel.children[1].dispatch('click')
  assert.deepEqual(world.selected, [unit.id], 'Save alone does not invalidate the binding')
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.notEqual(restored, world)
  assert.equal(scene.presentationBinding.isCurrent(), false)
  const calls = observeFeedback(scene)
  const before = structuredClone({ world, restored })
  clickEveryControl(panel)
  assert.deepEqual({ world, restored }, before)
  assert.deepEqual(calls, [])
  // Controlled handoff retains the old DOM to stress identity independently of
  // the ordinary Load path, which creates a fresh Scene and disposes old panels.
  scene.world = restored
  scene.presentationBinding = store.bindPresentation(restored)
  clickEveryControl(panel)
  assert.deepEqual({ world, restored }, before, 'new World identity alone is not a repaint')
  assert.deepEqual(calls, [])
  scene.renderBuildingPanels()
  panel.children[1].dispatch('click')
  assert.deepEqual(restored.selected, [unit.id])
  assert.equal(restored.units.find(u => u.id === unit.id).inside, building.id)
})

// Supplied ownership/visibility boundaries; rendering must retire stale held UI.
for (const hold of ['pointer', 'keyboard']) {
  test(`${hold}-held building panels hide when ownership changes before their next paint`, t => {
    const { scene, building, panel } = fixture(t)
    panel.matches = () => hold === 'pointer'
    panel.contains = () => hold === 'keyboard'
    renderBuildingPanels(scene, null)
    assert.equal(panel.hidden, false, 'owned visible held panel remains available')
    building.team = 'red'
    scene.renderBuildingPanels()
    assert.equal(panel.hidden, true)
  })

  test(`${hold}-held building panels hide when their building leaves the visible scene`, t => {
    const { scene, panel } = fixture(t)
    panel.matches = () => hold === 'pointer'
    panel.contains = () => hold === 'keyboard'
    renderBuildingPanels(scene, null)
    assert.equal(panel.hidden, false, 'owned visible held panel remains available')
    scene.visible = () => false
    scene.renderBuildingPanels()
    assert.equal(panel.hidden, true)
  })
}
