import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

await loadSceneFixture()
const { ObjectPanels } = await import('../app/object-panels.ts')
const { createGameStore } = await import('../app/game-store.ts')
const { worshipHeadPose, liveWorshippers } = await import('../app/live-worship.ts')
const { worshipPositions } = await import('../app/worship.ts')
const { createObjectCells, setCellObject, insertObjectIntoCell } = await import('../app/object-cells.ts')

// Actual ObjectPanels event registration and live selection/cell helpers.
// DOM and stationary friendly occupants at authored-head slots are supplied;
// this is not ordinary prayer acquisition or a rendered-browser witness.
function setup(t) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const element = () => ({ children: [], dataset: {}, classList: { add() {} },
    setAttribute() {}, insertBefore(child) { this.children.push(child) },
    addEventListener(type, fn) { this[type] = fn } })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: element } })
  t.after(() => previous ? Object.defineProperty(globalThis, 'document', previous) : delete globalThis.document)
  const store = createGameStore(), world = store.getWorld()
  const head = world.shrines.find(h => h.kind === 'bridge')
  assert.ok(head)
  world.inputMask = 0
  world.land.landFlags &= ~0x800
  world.objectCells = createObjectCells()
  const points = worshipPositions(worshipHeadPose(world, head)).slice(0, 2)
  const people = points.map((point, i) => ({ id: 90001 + i, class: 1, model: 2,
    tribe: world.manaWorld.playerTribe, speed: 0, ...point, h: 0,
    flags2: 0, flags3: 0, flags4: 0, selectionFlags: 0,
    cellNext: 0, cellPrevious: 0, displacement: { x: 0, y: 0, h: 0 } }))
  for (const p of people) { setCellObject(world.objectCells, p.id, p); insertObjectIntoCell(world.objectCells, p, p) }
  assert.deepEqual(liveWorshippers(world, head).map(p => p.id), people.map(p => p.id))
  world.selected = [88888]
  const binding = store.bindPresentation(world), events = []
  const scene = { world, isCurrent: () => !scene.disposed && binding.isCurrent(),
    disposed: false, overviewActive: false, unitMeshes: new Map(),
    gameClock: { animationFrame: 0 }, container: { insertBefore() {} },
    focus: (point, options) => events.push(['focus', point, options]),
    onSound: n => events.push(['sound', n]), onChange: () => events.push(['change']) }
  const panels = new ObjectPanels(scene)
  scene.objectPanels = panels
  panels.open(head.id, true)
  const button = panels.panels.get(head.id).element.children[1]
  button.dataset.person = String(people[0].id)
  return { store, world, head, people, scene, events, panels,
    focus: () => button.contextmenu({ preventDefault() {}, shiftKey: false }),
    click: group => button.click({ detail: 1, shiftKey: group }) }
}

for (const group of [false, true]) test(`current shrine ${group ? 'group' : 'single'} selection retains live behavior`, t => {
  const f = setup(t)
  f.click(group)
  assert.deepEqual(f.world.selected, [88888, ...f.people.slice(0, group ? 2 : 1).map(p => p.id)])
  assert.deepEqual(f.events, [['sound', 0x6a], ['change']])
})

for (const mode of ['disposed', 'store replacement', 'world membership', 'removed shrine', 'same-ID replacement', 'overview']) {
  test(`stale worship click after ${mode} has no selection or feedback`, t => {
    const f = setup(t)
    if (mode === 'disposed') f.scene.disposed = true
    if (mode === 'store replacement') f.store.startMission(2)
    if (mode === 'world membership') {
      f.scene.world = { ...f.world, shrines: [] }
      f.scene.isCurrent = () => true // Isolate exact head membership from binding.
    }
    if (mode === 'removed shrine') f.world.shrines = f.world.shrines.filter(h => h !== f.head)
    if (mode === 'same-ID replacement') f.world.shrines = f.world.shrines.map(h => h === f.head ? { ...h } : h)
    if (mode === 'overview') f.scene.overviewActive = true
    const before = [...f.scene.world.selected]
    f.click(false)
    assert.deepEqual(f.scene.world.selected, before)
    assert.deepEqual(f.people.map(p => p.selectionFlags), [0, 0])
    assert.deepEqual(f.events, [])
  })
}

// The actual focusWorshipper consumer resolves current live cell occupants.
// Camera and subsequent panel-open endpoints are supplied call recorders;
// these tests are not rendered input/camera verification.
test('current shrine right-click keeps focus and person inspection', t => {
  const f = setup(t)
  f.panels.open = (id, immediate) => f.events.push(['open', id, immediate])
  f.focus()
  const signed16 = n => (n << 16) >> 16
  assert.deepEqual(f.events[0], ['focus', {
    x: signed16(f.people[0].x - 2048) / 256,
    z: -signed16(f.people[0].y + 2048) / 256,
  }, { animate: true }])
  assert.deepEqual(f.events[0][2], { animate: true })
  assert.deepEqual(f.events.slice(1), [['sound', 0x6a], ['open', f.people[0].id, true]])
})

for (const mode of ['disposed', 'store replacement', 'world membership', 'removed shrine', 'same-ID replacement', 'overview', 'input mask']) {
  test(`stale worship right-click after ${mode} has no focus or feedback`, t => {
    const f = setup(t)
    f.panels.open = (id, immediate) => f.events.push(['open', id, immediate])
    if (mode === 'disposed') f.scene.disposed = true
    if (mode === 'store replacement') f.store.startMission(2)
    if (mode === 'world membership') {
      f.scene.world = { ...f.world, shrines: [] }
      f.scene.isCurrent = () => true
    }
    if (mode === 'removed shrine') f.world.shrines = f.world.shrines.filter(h => h !== f.head)
    if (mode === 'same-ID replacement') f.world.shrines = f.world.shrines.map(h => h === f.head ? { ...h } : h)
    if (mode === 'overview') f.scene.overviewActive = true
    if (mode === 'input mask') f.world.inputMask = 1
    f.focus()
    assert.deepEqual(f.events, [])
  })
}
