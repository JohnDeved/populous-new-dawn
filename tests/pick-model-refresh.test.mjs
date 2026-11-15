// Caller regression for issue #1057 (the building case is
// tests/building-model-pick-refresh.test.mjs). ScenePicking resolves models and people
// through the painter submission of the last render. A pickable shrine, tree, vehicle or
// person model that the actual frame updaters add, replace or newly show is therefore
// unpickable at that frame's pointer update, and an unchanged pointer/view/turn (turns
// held: paused or speed 0) previously never re-picked it. The actual renderSceneFrame must
// invalidate the pointer state after that render, and only after an actual change.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture, makeSceneFixture } from './support/bloodlust-scene.mjs'

const nop = () => {}

async function pickScene(t, mission) {
  const api = await loadSceneFixture(),
    { GameScene } = await import('../app/scene.ts'),
    world = api.createWorld(mission),
    fixture = await makeSceneFixture(world),
    { scene } = fixture,
    order = []
  // Actual GameScene facades (makeDecorations, locate, orientModel, frame updaters).
  Object.setPrototypeOf(scene, GameScene.prototype)
  Object.assign(scene, {
    scene: new THREE.Group(),
    renderer: {},
    decorations: new THREE.Group(),
    shrineMeshes: new Map(),
    vehicleMeshes: new Map(),
    waveFrames: new WeakMap(),
    treeSignature: '',
    pickModelsChanged: false,
    pointerState: 'stationary',
    worshipPresentation: { rememberBodies: nop },
  })
  Object.assign(scene.view, {
    prepare: () => order.push('prepare'),
    painter: { render: () => order.push(['render', scene.pointerState]) },
  })
  scene.scene.add(scene.objects, scene.decorations)
  t.after(() => {
    scene.scene.traverse(object => object.material?.dispose?.())
    fixture.close()
  })
  // One frame of the actual updater followed by the actual painter render, with the
  // pointer, view and turn held (the stationary pointer state is never recomputed).
  const frame = update => {
    scene.pointerState = 'stationary'
    update()
    const before = scene.pointerState
    api.renderSceneFrame(scene, null, undefined)
    return { before, after: scene.pointerState }
  }
  return { api, world, scene, order, frame }
}

const repicked = { before: 'stationary', after: '' }
const held = { before: 'stationary', after: 'stationary' }

test('shrine and stone-head model changes re-pick the stationary pointer', async t => {
  const { world, scene, order, frame } = await pickScene(t, 1)
  const update = () => scene.updateShrinesFrame()
  scene.makeShrines()
  assert.deepEqual(frame(update), repicked, 'initial shrine models')
  assert.deepEqual(order.at(-1), ['render', 'stationary'], 'invalidated only after the render')
  assert.deepEqual(frame(update), held, 'no shrine change')

  const head = world.shrines.find(shrine => shrine.kind !== 'vault' && shrine.model === 45)
  assert.ok(head, 'authored Mission 1 stone head')
  const entry = scene.shrineMeshes.get(head.id),
    mesh = entry.g.children[0]
  head.model = 8
  assert.deepEqual(frame(update), repicked, 'stone-head mesh swapped')
  assert.notEqual(entry.g.children[0], mesh)
  assert.equal(entry.g.children[0].userData.nativeModel, 8)
  assert.deepEqual(frame(update), held, 'swapped mesh kept')

  const angel = { ...head, id: 9000, kind: 'angel', active: false, angelTarget: null }
  world.shrines.push(angel)
  assert.deepEqual(frame(update), repicked, 'shrine group created')
  assert.equal(scene.shrineMeshes.get(angel.id).g.visible, false)
  assert.deepEqual(frame(update), held, 'hidden shrine kept hidden')
  angel.active = true
  assert.deepEqual(frame(update), repicked, 'hidden shrine shown')
  assert.deepEqual(frame(update), held, 'shown shrine kept')

  world.shrines.splice(world.shrines.indexOf(head), 1)
  assert.deepEqual(frame(update), repicked, 'shrine group removed')
  assert.equal(scene.shrineMeshes.has(head.id), false)
})

test('tree and scenery decoration rebuilds re-pick the stationary pointer', async t => {
  const { world, scene, frame } = await pickScene(t, 1)
  const update = () => scene.updateDecorationsFrame()
  assert.deepEqual(frame(update), repicked, 'initial decorations')
  assert.deepEqual(frame(update), held, 'no tree change')
  const tree = world.trees.find(tree => tree.model >= 1 && tree.model <= 6 && tree.logs >= 1),
    treeGroup = () => scene.decorations.children.find(group => group.userData.point === tree)
  assert.ok(tree && treeGroup(), 'authored Mission 1 tree model')
  const logs = tree.logs
  tree.logs = 0
  assert.deepEqual(frame(update), repicked, 'tree removed by the decoration rebuild')
  assert.equal(treeGroup(), undefined)
  assert.deepEqual(frame(update), held, 'rebuilt decorations kept')
  tree.logs = logs
  const before = scene.decorations.children.length
  assert.deepEqual(frame(update), repicked, 'tree recreated by the decoration rebuild')
  assert.ok(treeGroup() && scene.decorations.children.length === before + 1)
  assert.deepEqual(frame(update), held, 'recreated tree kept')
})

test('vehicle model changes re-pick the stationary pointer', async t => {
  const { api, world, scene, frame } = await pickScene(t, 10)
  const update = () => api.updateVehiclesFrame(scene)
  const vehicle = world.vehicles.find(vehicle => vehicle.active)
  assert.ok(vehicle, 'authored Mission 10 vehicle')
  assert.deepEqual(frame(update), repicked, 'initial vehicle model')
  assert.deepEqual(frame(update), held, 'no vehicle change')
  vehicle.active = false
  assert.deepEqual(frame(update), repicked, 'vehicle model removed')
  assert.equal(scene.vehicleMeshes.has(vehicle.id), false)
  vehicle.active = true
  assert.deepEqual(frame(update), repicked, 'vehicle model created')
  assert.deepEqual(frame(update), held, 'vehicle model kept')
})

test('person model, appearance and visibility changes re-pick the stationary pointer', async t => {
  const { api, world, scene, frame } = await pickScene(t, 1)
  const update = () => scene.updateUnitsFrame()
  assert.deepEqual(frame(update), repicked, 'initial person models')
  assert.deepEqual(frame(update), held, 'no person change')

  const brave = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
  assert.ok(brave, 'authored Mission 1 Brave')
  const added = api.addUnit(world, 'blue', 'brave', { x: brave.x + 1, z: brave.z })
  assert.deepEqual(frame(update), repicked, 'person model created')
  assert.ok(scene.unitMeshes.has(added.id))
  assert.deepEqual(frame(update), held, 'created person kept')

  const old = scene.unitMeshes.get(added.id)
  added.team = 'red'
  assert.deepEqual(frame(update), repicked, 'person appearance (signature) swapped')
  assert.notEqual(scene.unitMeshes.get(added.id), old)
  assert.deepEqual(frame(update), held, 'swapped person kept')

  const hut = world.buildings.find(building => building.team === 'blue')
  added.inside = hut.id
  assert.deepEqual(frame(update), held, 'hiding a person needs no re-pick')
  assert.equal(scene.unitMeshes.get(added.id).visible, false)
  added.inside = null
  assert.deepEqual(frame(update), repicked, 'hidden person shown again')
  assert.deepEqual(frame(update), held, 'shown person kept')

  world.units.splice(world.units.indexOf(added), 1)
  assert.deepEqual(frame(update), repicked, 'person model removed')
  assert.equal(scene.unitMeshes.has(added.id), false)
})

test('a person top layer the last render did not submit re-picks the stationary pointer', async t => {
  // ScenePicking resolves a person through its top visible sprite layer. Authored
  // Mission 5 Preachers alternate between three and four layers; a fourth layer shown
  // on an advancing frame has no current painter command at that frame's (turn-driven) pick.
  const { api, world, scene, frame } = await pickScene(t, 5)
  const update = () => scene.updateUnitsFrame()
  assert.deepEqual(frame(update), repicked, 'initial person models')
  const layers = unit => scene.unitMeshes.get(unit.id).userData.layers
  let shownTop = 0,
    keptTop = 0
  for (let turn = 1; turn <= 6; turn++) {
    const before = new Map(world.units.map(unit => [unit.id, layers(unit).map(l => l.visible)]))
    const result = frame(() => {
      api.advanceGame(world, scene.gameClock, 1 / 12)
      update()
    })
    let newTop = false,
      swapped = false
    for (const unit of world.units) {
      const was = before.get(unit.id),
        top = layers(unit).findLastIndex(layer => layer.visible)
      assert.ok(was && scene.unitMeshes.get(unit.id).visible, 'no person created or shown')
      if (top !== was.findLastIndex(Boolean)) swapped = true
      if (top >= 0 && !was[top]) newTop = true
    }
    assert.deepEqual(result, newTop ? repicked : held, `turn ${world.turn}`)
    shownTop += newTop
    keptTop += swapped && !newTop
    assert.deepEqual(frame(update), held, `turn ${world.turn} held`)
  }
  assert.ok(shownTop > 0, 'an authored person shows a previously hidden top layer')
  assert.ok(keptTop > 0, 'a top layer that was already submitted needs no re-pick')
})
