import assert from 'node:assert/strict'
import test from 'node:test'
import { renderBuildingPanels } from '../app/building-panels.ts'
import { addBuilding, addUnit, command, createWorld, tick } from '../app/model.ts'

class TestElement {
  constructor() {
    this.children = []
    this.hidden = false
    this.dataset = {}
    this.style = {}
    this.classList = { toggle() {} }
    this.events = new Map()
  }

  get firstElementChild() { return this.children[0] }
  get lastElementChild() { return this.children.at(-1) }
  setAttribute() {}
  appendChild(child) { this.children.push(child) }
  matches() { return false }
  contains() { return false }
  addEventListener(type, listener) { this.events.set(type, listener) }
  invoke(type) {
    assert.ok(this.events.has(type))
    this.events.get(type)({ shiftKey: false, preventDefault() {} })
  }
  getContext() { return { clearRect() {}, drawImage() {}, fillRect() {} } }
  getBoundingClientRect() { return { top: 0, left: 0, width: 800, height: 600 } }
}

function fixture(t) {
  const oldDocument = globalThis.document, oldStyle = globalThis.getComputedStyle
  globalThis.document = { createElement: () => new TestElement(), querySelector: () => null }
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '1' })
  t.after(() => {
    if (oldDocument === undefined) delete globalThis.document
    else globalThis.document = oldDocument
    if (oldStyle === undefined) delete globalThis.getComputedStyle
    else globalThis.getComputedStyle = oldStyle
  })
  const world = createWorld()
  const opening = () => world.levelStart.some(site =>
    site.phase !== 4 || site.wave || site.carriers.length ||
    site.stoneTurns.some(turn => turn !== null && world.turn - turn < 20))
  for (let i = 0; opening() && i < 256; i++) tick(world, 1 / 12)
  assert.equal(opening(), false, 'reach live gameplay through ordinary ticks')
  const b = addBuilding(world, 'blue', 'tower', { x: -2, z: 32 }, true, { angle: Math.PI }),
    u = addUnit(world, 'blue', 'firewarrior', { x: 7, z: 33 })
  world.selected = [u.id]
  command(world, b)
  for (let i = 0; u.inside !== b.id && i < 300; i++) tick(world, 1 / 12)
  assert.equal(u.inside, b.id, 'real tower admission required')
  assert.ok(b.admission.occupants.includes(u.id))
  world.selected = []
  world.inputMask = 0
  let changes = 0, sounds = 0, focus = 0, opens = 0
  const atlas = { complete: true, naturalWidth: 512 },
    scene = {
      world,
      overviewActive: false,
      hoveredObject: b.id,
      overviewStage: null,
      isCurrent: () => true,
      visible: bb => bb === b,
      screen: () => ({ x: 0, y: 0 }),
      container: new TestElement(),
      renderer: { domElement: new TestElement() },
      buildingPanels: new Map(),
      objectPanels: { buildingRecords: new Map(), panels: new Map(), open: () => { opens++ } },
      onSound: () => { sounds++ },
      onChange: () => { changes++ },
      focus: () => { focus++ },
      renderBuildingPanels: () => renderBuildingPanels(scene, atlas),
    }
  scene.renderBuildingPanels()
  const panel = scene.buildingPanels.get(b.id)
  assert.ok(panel && !panel.hidden, 'real occupied tower panel paints in ordinary view')
  const occupant = panel.children[1], dismantle = panel.lastElementChild
  assert.equal(occupant.dataset.person, String(u.id))
  return { world, b, u, scene, panel, occupant, dismantle, calls: () => [changes, sounds, focus, opens] }
}

for (const [name, invoke] of [
  ['select', ({ occupant }) => occupant.invoke('click')],
  ['focus', ({ occupant }) => occupant.invoke('contextmenu')],
  ['dismantle', ({ dismantle }) => dismantle.invoke('click')],
]) {
  test(`a stale building panel cannot ${name} after the overview transition starts`, t => {
    const live = fixture(t), { world, b, scene, panel, calls } = live
    assert.equal(b.admission.activity & 0x8000, 0)
    // The camera sets its transition stage before it flips the active view or paints again.
    scene.overviewStage = 'enter'
    assert.equal(panel.hidden, false)
    invoke(live)
    assert.deepEqual(world.selected, [])
    assert.equal(b.admission.activity & 0x8000, 0)
    assert.deepEqual(calls(), [0, 0, 0, 0])
  })
}

test('building panel hides for both camera transition stages and reopens on ground', t => {
  const { b, scene, panel, world } = fixture(t)
  assert.ok(world.secondaryEffects.reservations.includes(`building-panel:${b.id}`))
  for (const stage of ['enter', 'exit']) {
    scene.overviewStage = stage
    scene.renderBuildingPanels()
    assert.equal(panel.hidden, true, stage)
    assert.ok(!world.secondaryEffects.reservations.includes(`building-panel:${b.id}`), stage)
  }
  scene.overviewStage = null
  scene.renderBuildingPanels()
  assert.equal(scene.buildingPanels.get(b.id), panel)
  assert.equal(panel.hidden, false)
})

test('ground-view occupant select, focus and dismantle still invoke live controls', t => {
  const { world, b, u, occupant, dismantle, calls } = fixture(t)
  occupant.invoke('click')
  assert.deepEqual(world.selected, [u.id])
  occupant.invoke('contextmenu')
  dismantle.invoke('click')
  assert.equal(b.admission.activity & 0x8000, 0x8000)
  assert.deepEqual(calls(), [2, 3, 1, 1])
})
