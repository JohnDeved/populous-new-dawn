// Failure-first actual Scene/input/panel callers. Mission2 and construction run
// through the existing model/clock; projection, texture IO and DOM are supplied.
// These controlled visits do not claim an ordinary browser episode or pixels.
import assert from 'node:assert/strict'
import test from 'node:test'
import { tooltipCallerFixture } from './support/tooltip-scene.mjs'

const nop = () => {}
const records = scene => scene.objectPanels.buildingRecords ?? scene.objectPanels.hutRecords

async function buildEmptyCamp({ api, world, frame }) {
  const before = new Set(world.buildings.map(building => building.id))
  api.select(world, 'brave')
  assert.ok(world.selected.length)
  assert.ok(api.placeBuilding(world, 'camp', { x: -99, z: -105 }))
  const camp = world.buildings.find(building => !before.has(building.id) && building.kind === 'camp')
  assert.ok(camp, 'actual placement creates the model7 plan')
  const complete = () => camp.progress === 1 &&
    !(camp.builders ?? []).some(Boolean) &&
    !world.units.some(unit => unit.work === camp.id || unit.inside === camp.id)
  for (let visits = 0; visits < 20000 && !complete(); visits++) frame(1 / 12)
  assert.ok(complete(), `completed construction owners must depart at turn ${world.turn}`)
  assert.equal(camp.admission?.inside ?? 0, 0)
  assert.equal(camp.admission?.queueHead ?? 0, 0)
  assert.equal(camp.admission?.entering ?? 0, 0)
  assert.equal((camp.admission?.activity ?? 0) & 128, 0)
  return camp
}

function supplyPanelDom(t, scene) {
  const doc = document,
    oldCreate = doc.createElement,
    oldStyle = Object.getOwnPropertyDescriptor(globalThis, 'getComputedStyle')
  doc.createElement = tag => {
    const element = {
      tag, children: [], hidden: false, style: {}, dataset: {}, attributes: {},
      classList: { add: nop, toggle: nop },
      append(child) { this.children.push(child) },
      addEventListener: nop,
      setAttribute(name, value) { this.attributes[name] = value },
      matches: () => false,
      contains: () => false,
      remove() { this.removed = true },
      get firstElementChild() { return this.children[0] },
      get lastElementChild() { return this.children.at(-1) },
      getContext: () => ({ drawImage: nop, fillRect: nop }),
    }
    return element
  }
  scene.container.appendChild = nop
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true, value: () => ({ getPropertyValue: () => '1' }),
  })
  t.after(() => {
    if (oldCreate) doc.createElement = oldCreate
    else delete doc.createElement
    if (oldStyle) Object.defineProperty(globalThis, 'getComputedStyle', oldStyle)
    else delete globalThis.getComputedStyle
  })
}

async function campFixture(t) {
  const fixture = await tooltipCallerFixture(t, { level: 2, prepareTarget: buildEmptyCamp }),
    { renderBuildingPanels } = await import('../app/building-panels.ts')
  supplyPanelDom(t, fixture.scene)
  const paint = () => renderBuildingPanels(fixture.scene, { complete: true, naturalWidth: 2048 })
  return { ...fixture, camp: fixture.hut, paint }
}

test('completed camp panel waits for actual first-display inspection instead of zero-tick hover paint', async t => {
  const { scene, camp, frame, paint } = await campFixture(t)
  frame(0)
  paint()
  assert.equal(scene.buildingPanels.get(camp.id)?.hidden ?? true, true,
    'a zero-tick hover paint cannot expose the camp inspection panel')
  frame()
  assert.match(scene.tooltip.text, /^Warrior Training Hut:/, 'existing imported string912 is acquired')
  assert.equal(scene.tooltip.draw, 0)
  for (let visits = 0; visits < 120 && !records(scene).has(camp.id); visits++) frame()
  assert.ok(records(scene).has(camp.id), 'actual first-display callback creates the manual camp record')
  assert.equal(scene.tooltipController.lastVisit.firstDisplay, camp.id)
  assert.equal(records(scene).get(camp.id).automatic, false)
  paint()
  const panel = scene.buildingPanels.get(camp.id)
  assert.equal(panel.hidden, false)
  assert.match(panel.attributes['aria-label'], /^Warrior training: 0 of 5 occupants/)
  assert.equal(panel.lastElementChild.attributes['aria-label'], 'Dismantle warrior hut')
  assert.deepEqual(scene.world.secondaryEffects.reservations.filter(owner => owner === `building-panel:${camp.id}`),
    [`building-panel:${camp.id}`], 'retained record and visible DOM reserve once')
})

test('real camp right-button edges queue inspection before one composed visit and emit one feedback', async t => {
  const { scene, world, camp, point, frame } = await campFixture(t),
    { pointerDown, pointerUp } = await import('../app/scene-input-runtime.ts')
  const cues = []
  scene.onSound = cue => cues.push(cue)
  const event = {
    ...point, button: 2, buttons: 2, pointerId: 17,
    currentTarget: scene.renderer.domElement, preventDefault: nop,
    shiftKey: false, ctrlKey: false, altKey: false, metaKey: false,
  }
  const beforeMarkers = new Set(world.effects.map(effect => effect.id))
  pointerDown(scene, event)
  pointerUp(scene, { ...event, buttons: 0 })
  assert.equal(scene.tooltipInspectionInputs?.length ?? 0, 2,
    'actual camp down and release must both survive until the due controller visit')
  assert.equal(records(scene).size, 0, 'input itself does not allocate a presentation record')
  frame()
  assert.equal(records(scene).size, 1)
  assert.equal(records(scene).get(camp.id).automatic, false)
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, ['explicit:created', 'release'])
  assert.equal('buildingHeldPointer' in scene.objectPanels
    ? scene.objectPanels.buildingHeldPointer : scene.objectPanels.hutHeldPointer, null)
  assert.deepEqual(cues, [0x6a])
  assert.equal(world.effects.filter(effect => !beforeMarkers.has(effect.id) && effect.kind === 'orderMarker').length, 1)
})
