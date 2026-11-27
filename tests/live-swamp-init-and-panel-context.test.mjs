import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const { createWorld, cast, nativePosition, addUnit, browserPosition } = await loadSceneFixture()
const { ObjectPanels } = await import('../app/object-panels.ts')
const { pointerDown } = await import('../app/scene-input-runtime.ts')
const { processProjectiles } = await import('../app/spell-effects-runtime.ts')
const { createLivePerson } = await import('../app/live-people.ts')
const { boardLiveVehicle } = await import('../app/live-vehicles.ts')
const { selectFollowerTransport } = await import('../app/follower-transports-runtime.ts')

function panelScene(world, unit = null) {
  const makeElement = () => ({
    classList: { add() {} },
    setAttribute() {},
    addEventListener() {},
    insertBefore() {},
  })
  const element = { setPointerCapture() {} }
  const scene = {
    world, overviewActive: false, down: null, pointerGesture: null,
    renderer: { domElement: element },
    dragActive: { value: false }, container: makeElement(), gameClock: { animationFrame: 0 },
    buildingPanels: new Map(), unitMeshes: new Map(),
    picking: { pickPerson: () => null }, pickWorldObject: () => null, pickUnit: () => unit,
  }
  scene.objectPanels = new ObjectPanels(scene)
  return { scene, element, document: { createElement: makeElement } }
}

test('ordinary right inspection reaches the live person panel only from neutral mode', () => {
  const world = createWorld(1)
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const { scene, element, document } = panelScene(world, shaman)
  const oldDocument = globalThis.document
  globalThis.document = document
  try {
    const pointer = { button: 2, buttons: 2, pointerId: 17, clientX: 10, clientY: 20, currentTarget: element }
    world.selected = []
    world.inputMask = 0 // Supplied ordinary-play context; opening flyby is out of scope.
    world.mode = 'blast'
    pointerDown(scene, pointer)
    assert.equal(scene.objectPanels.panels.size, 0)
    scene.pointerGesture = null
    world.mode = null
    pointerDown(scene, pointer)
    assert.equal(scene.objectPanels.inspected, shaman.id)
    assert.equal(scene.objectPanels.panels.get(shaman.id)?.kind, 'person')
  } finally {
    if (oldDocument === undefined) delete globalThis.document
    else globalThis.document = oldDocument
  }
})

test('authored Mission 22 Boat and Balloon panels use the original mesh anchor heights', () => {
  const world = createWorld(22)
  const { scene, document } = panelScene(world)
  const oldDocument = globalThis.document
  globalThis.document = document
  try {
    for (const [model, height] of [[1, 373], [3, 678]]) {
      const vehicle = world.vehicles.find(v => v.active && v.model === model)
      assert.ok(vehicle)
      scene.objectPanels.open(vehicle.id)
      const panel = scene.objectPanels.panels.get(vehicle.id)
      assert.equal(panel?.kind, 'vehicle')
      assert.equal(panel.offset, height)
    }
  } finally {
    if (oldDocument === undefined) delete globalThis.document
    else globalThis.document = oldDocument
  }
})

test('authored Swamp impact initializes its duration and one gameplay-random variant', () => {
  const world = createWorld(1)
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const target = { x: 0, z: 8 }
  Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
  world.shots.swamp = 1
  assert.ok(cast(world, 'swamp', target))
  const shot = world.projectiles.find(p => p.spell === 'swamp')
  assert.ok(shot)
  for (let visit = 0; visit < 8 && shot.phase === 'windup'; visit++) processProjectiles(world)
  assert.equal(shot.phase, 'flying')
  // Supply final approach only. The actual flying projectile visits its normal
  // impact branch, including the prior two draws for the flight trail.
  shot.position = { ...shot.destination }
  assert.ok(!world.effects.some(f => f.swamp))
  world.randomState = 0x12345678
  processProjectiles(world)
  const trap = world.effects.find(f => f.swamp)
  assert.ok(trap)
  const snapped = nativePosition(world, { x: 1, z: 7 })
  assert.deepEqual(trap.swamp.center, { x: snapped.x & 65535, y: snapped.y & 65535, h: snapped.h })
  assert.deepEqual([trap.swamp.tribe, trap.swamp.remaining, trap.swamp.kills, trap.swamp.variant], [0, 32000, 0, 1])
  assert.equal(world.randomState, 0x8ce90b59)
  assert.ok(!world.projectiles.includes(shot))
})


test('live follower transport selection prefers idle drivers then ranks eligible passenger position', () => {
  const world = createWorld(22)
  const authored = world.vehicles.find(v => v.active && v.model === 1)
  assert.ok(authored)
  const vehicles = [256, 3000].map(x => ({
    ...structuredClone(authored), id: world.nextId++, x, y: 256,
    passengers: [0, 0, 0, 0, 0], passengerCount: 0,
  }))
  world.vehicles = vehicles
  const people = vehicles.map((vehicle, index) => {
    const unit = addUnit(world, 'blue', 'brave', browserPosition(vehicle))
    const person = unit.native = createLivePerson(world, unit)
    world.pathfinding.people.set(person.id, person)
    assert.ok(boardLiveVehicle(world, person, vehicle))
    person.x = index === 0 ? 3000 : 256
    person.y = 256
    return person
  })
  world.selected = []
  people[0].commandStatus = 0
  people[1].commandStatus = 1
  selectFollowerTransport(world, 1, 2, {x: 256, y: 256}, 'one')
  assert.deepEqual(world.selected, [people[0].id], 'idle first-pass must outrank nearer busy driver')
  world.selected = []
  people[0].commandStatus = 1
  selectFollowerTransport(world, 1, 2, {x: 256, y: 256}, 'one')
  assert.deepEqual(world.selected, [people[1].id], 'fallback ranks the actual matching passenger, not vehicle')
})
