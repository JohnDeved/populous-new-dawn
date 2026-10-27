import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const api = await loadSceneFixture()
const { pointerDown, pointerUp, pickWorldObject, pickUnit, updateDrag } =
  await import('../app/scene-input-runtime.ts')
const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
const { finishLevelStart } = await import('./level-start-fixture.mjs')
const { liveCommandContext } = await import('../app/live-command.ts')

// Authored world and actual pointer/command callers; DOM and the final painter
// hit are supplied. Real rendered picker ownership is a separate browser gate.
function fixture(t, options = {}) {
  const world = finishLevelStart(api.createWorld(10))
  const brave = world.units.find(u => u.id === 120)
  const tree = world.trees.find(t => t.id === 108)
  assert.equal(brave.kind, 'brave')
  assert.ok(tree.logs > 0)
  const descriptors = new Map(
    ['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  )
  globalThis.window = {}
  globalThis.document = { hidden: false, querySelector: () => null }
  t.after(() => {
    for (const [key, descriptor] of descriptors)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
  })
  const rect = { left: 0, top: 0, width: 800, height: 600 }
  const scene = {
    world,
    overviewActive: false,
    renderer: { domElement: { setPointerCapture() {}, getBoundingClientRect: () => rect } },
    globeMotion: { dragging: false, velocity: { x: 0, y: 0 } },
    dragActive: { value: false },
    selectionOverlay: { visible: false, update() {} },
    view: { angle: 0, screen: () => ({ x: -10, y: -10 }) },
    vehicleMeshes: new Map(),
    flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    pick: () => ({ x: tree.x, z: tree.z }),
    picking: { pickPerson: () => null, pick: () => (options.hit === null ? null : tree.id) },
    onChange() {},
    onSound() {},
    acknowledgePointer() {},
    orderSound() {},
    objectPanels: { releaseBuildingInspection() {} },
  }
  scene.pickUnit = event => pickUnit(scene, event)
  scene.pickWorldObject = event => pickWorldObject(scene, event)
  scene.updateDrag = event => updateDrag(scene, event)
  skipIntroduction(scene)
  assert.equal(world.inputMask, 0)
  world.paused = false
  api.selectUnit(world, brave.id, false)
  assert.deepEqual(world.selected, [brave.id])
  const event = {
    pointerId: 1,
    button: 0,
    buttons: 1,
    clientX: 400,
    clientY: 300,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
  }
  const click = (modifiers = {}) => {
    pointerDown(scene, { ...event, ...modifiers })
    pointerUp(scene, { ...event, ...modifiers, buttons: 0 })
  }
  return { world, brave, tree, scene, event, click }
}

test('ordinary authored tree model hit reaches existing harvest command through pointer down/up', t => {
  const { world, brave, tree, scene, click } = fixture(t)
  assert.equal(
    scene.pickWorldObject({ clientX: 400, clientY: 300 }),
    null,
    'shared inspection picker remains unchanged'
  )
  assert.equal(liveCommandContext(world, tree).model, 7)
  assert.equal(brave.tree, null)
  click()
  assert.equal(brave.tree, tree.id)
  assert.equal(world.lastOrderTurn, world.turn)
})

for (const invalid of ['woodless', 'stump', 'occluded'])
  test(`ordinary tree command rejects ${invalid} hit`, t => {
    const { brave, tree, click } = fixture(t, { hit: invalid === 'occluded' ? null : undefined })
    if (invalid === 'woodless') tree.logs = 0
    if (invalid === 'stump') tree.model = 7
    click()
    assert.equal(brave.tree, null)
  })

test('canceled tree pointer ownership cannot issue an order', t => {
  const { brave, scene, event } = fixture(t)
  pointerDown(scene, event)
  pointerUp(scene, { ...event, pointerId: 2, buttons: 0 })
  assert.equal(brave.tree, null)
})

for (const route of ['overview', 'direct Blast', 'right click'])
  test(`${route} does not gain ordinary tree model routing`, t => {
    const { brave, scene, world, event } = fixture(t)
    let modelQueries = 0
    scene.picking.pick = () => {
      modelQueries++
      return 108
    }
    if (route === 'overview') {
      scene.overviewActive = true
      scene.screen = () => ({ x: -10, y: -10 })
      scene.visible = () => false
    }
    if (route === 'direct Blast') world.mode = 'blast'
    if (route === 'right click') {
      event.button = 2
      event.buttons = 2
    }
    pointerDown(scene, event)
    pointerUp(scene, { ...event, buttons: 0 })
    assert.equal(brave.tree, null)
    assert.equal(modelQueries, 0)
  })

test('authored model geometry resolves through ScenePicking into pointer command, but hidden geometry does not', async t => {
  const { scene, world, brave, tree, event } = fixture(t)
  const THREE = await import('three')
  const { makeSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const { GameScene } = await import('../app/scene.ts')
  const { ScenePicking } = await import('../app/scene-picking.ts')
  const { RenderView } = await import('../app/render-view.ts')
  const rendering = await makeSceneFixture(world)
  Object.setPrototypeOf(scene, GameScene.prototype)
  Object.assign(scene, {
    environment: rendering.scene.environment,
    objects: new THREE.Group(),
    decorations: new THREE.Group(),
    unitMeshes: new Map(),
    camera: new THREE.PerspectiveCamera(),
    view: new RenderView(),
    viewPoint: tree,
    frame: 1,
  })
  scene.view.pickCandidates = () => []
  scene.view.pickSubmissionKey = () => 'supplied-empty-terrain'
  scene.view.resolvePickCandidates = () => null
  scene.makeDecorations()
  rendering.close()
  const group = scene.decorations.children.find(g => g.userData.point?.id === tree.id)
  const mesh = group.children[0]
  scene.view.painter.source = object =>
    object === mesh
      ? { slot: 0, alpha: false, bucket: 0, cell: 0, object: 0, face: 0, phase: 0, order: 0 }
      : null
  scene.view.update(800, 600, tree, 0, 0, false)
  scene.picking = new ScenePicking(scene)
  t.after(() => {
    scene.decorations.traverse(object => {
      object.geometry?.dispose()
      object.material?.dispose()
    })
    scene.view.dispose()
  })
  let hit
  for (const face of scene.picking.model(mesh, '').filter(c => c.kind === 'model')) {
    const point = {
      clientX: Math.floor(face.points.reduce((s, p) => s + p.x, 0) / 3),
      clientY: Math.floor(face.points.reduce((s, p) => s + p.y, 0) / 3),
    }
    if (scene.picking.pick(point) === tree.id) {
      hit = point
      break
    }
  }
  assert.ok(hit, 'authored model must have a genuine winning model face')
  Object.assign(event, hit)
  assert.equal(scene.picking.lastKind, 'model')
  assert.equal(scene.picking.pickPerson(event), null)
  pointerDown(scene, event)
  pointerUp(scene, { ...event, buttons: 0 })
  assert.equal(brave.tree, tree.id)
  group.visible = false
  scene.frame++
  assert.equal(scene.picking.pick(event), null)
  pointerDown(scene, event)
  pointerUp(scene, { ...event, buttons: 0 })
  assert.equal(
    brave.tree,
    null,
    'hidden model must use existing terrain command, not retain tree identity'
  )
})

test('actual submitted loose-log Sprite reaches existing command through public pointer down/up', async t => {
  const THREE = await import('three')
  const { ScenePicking } = await import('../app/scene-picking.ts')
  const { world, brave, tree, scene, click } = fixture(t)
  tree.model = 11
  tree.logs = 1
  const group = new THREE.Group(),
    sprite = new THREE.Sprite(new THREE.SpriteMaterial())
  t.after(() => sprite.material.dispose())
  sprite.scale.set(17, 11, 1)
  sprite.center.set(0.5, 0)
  group.add(sprite)
  group.userData = { point: tree, sprite }
  scene.decorations = new THREE.Group()
  scene.decorations.add(group)
  scene.objects = new THREE.Group()
  scene.unitMeshes = new Map()
  scene.frame = 1
  scene.camera = new THREE.Camera()
  Object.assign(scene.view, {
    center: { x: 0, y: 0 },
    rawCenter: { x: 0, y: 0 },
    projection: { width: 800, height: 600 },
    screen: () => ({ x: 0, y: 0 }),
    painter: { source: () => ({ bucket: 10, cell: 0, phase: 0, object: -tree.id, face: 0 }) },
    pickSubmissionKey: () => '',
    pickCandidates: () => [],
    resolvePickCandidates: () => null,
  })
  scene.picking = new ScenePicking(scene)
  assert.equal(scene.picking.pickPerson({ clientX: 400, clientY: 300 }), null)
  assert.equal(liveCommandContext(world, tree).model, 7)
  click()
  assert.equal(scene.picking.lastKind, 'resource')
  assert.equal(brave.tree, tree.id)
})

// Picker identity is supplied here; actual rendered resource admission has its own witness.
test('actual pointer Ctrl-click on loose resource stages command 7 subtype 2', t => {
  const { world, brave, tree, click } = fixture(t)
  tree.model = 11
  tree.logs = 1
  click({ ctrlKey: true })
  assert.equal(world.orderCursor, 1)
  const order = world.buildingOrders.records[brave.native.commands[0]]
  assert.equal(order.model, 7)
  assert.equal(order.flags & 12, 8)
  assert.equal(brave.tree, null, 'input stages the shared command, not immediate legacy collection')
})
