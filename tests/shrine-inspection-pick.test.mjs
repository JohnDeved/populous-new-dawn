import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const { createWorld } = await loadSceneFixture()
const { pickWorldObject, pointerDown } = await import('../app/scene-input-runtime.ts')
const { setSelection } = await import('../app/selection-runtime.ts')

function makeFixture(hitKind, boatScreenX = 0.2) {
  const world = createWorld(10)
  const boat = world.vehicles.find(v => v.id === 62 && v.active)
  const shrine = world.shrines.find(s => s.id === 71)
  assert.ok(boat && shrine)
  assert.equal(world.inputMask, 0)
  setSelection(world, [])
  assert.equal(world.selected.length, 0)
  assert.equal(world.mode, null)
  const opened = [], captures = []
  const dom = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    setPointerCapture: id => captures.push(id),
  }
  const scene = {
    world,
    renderer: { domElement: dom },
    picking: {
      pick: () => hitKind === 'shrine' ? shrine.id : hitKind === 'boat' ? boat.id : null,
      pickPerson: () => null,
    },
    pickUnit: () => null,
    pickWorldObject: (event, inspection) => pickWorldObject(scene, event, inspection),
    vehicleMeshes: new Map([[boat.id, { visible: true, position: {} }]]),
    view: { screen: () => ({ x: boatScreenX, y: 0 }) },
    objectPanels: { open: id => opened.push(id) },
    dragActive: { value: false },
  }
  const event = {
    button: 2, buttons: 2, pointerId: 41, currentTarget: dom, clientX: 50, clientY: 50,
    shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
  }
  return { scene, event, boat, shrine, opened, captures }
}

test('ordinary right click inspects the precise shrine hit, not a nearby boat', () => {
  const { scene, event, shrine, opened, captures } = makeFixture('shrine')
  pointerDown(scene, event)
  assert.deepEqual(captures, [41])
  assert.deepEqual(opened, [shrine.id])
})

test('ordinary right click still picks a boat when only the proximity fallback hits', () => {
  const { scene, event, boat, opened } = makeFixture('ground')
  pointerDown(scene, event)
  assert.deepEqual(opened, [boat.id])
})

test('ordinary right click still picks the exact boat even beyond the fallback radius', () => {
  const { scene, event, boat, opened } = makeFixture('boat', 0.8)
  pointerDown(scene, event)
  assert.deepEqual(opened, [boat.id])
})

test('the default shared pick keeps boat-assist precedence for non-inspection consumers', () => {
  const { scene, event, boat } = makeFixture('shrine')
  assert.equal(scene.pickWorldObject(event)?.id, boat.id)
})
