// Composed production caller coverage. Mission data, decoration creation, model
// picking, pointer gates, animate and highlight assignment run unchanged. Texture
// IO, painter submission and unrelated frame stages are supplied; no browser/GPU.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as THREE from 'three'
import { loadSceneFixture, makeSceneFixture } from './support/bloodlust-scene.mjs'

const nop = () => {}
const source = ts.createSourceFile(
  'scene.ts',
  readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true
)
const sceneClass = source.statements.find(
  node => ts.isClassDeclaration(node) && node.name?.text === 'GameScene'
)
const animate = sceneClass.members.find(node => node.name?.getText(source) === 'animate')
function bindAnimate(scene, bindings) {
  const javascript = ts.transpileModule(`(function(){return ${animate.initializer.getText(source)}})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  return new Function(...Object.keys(bindings), `return ${javascript}`)(
    ...Object.values(bindings)
  ).call(scene)
}

test('authored tree picking reaches the native hover override through the actual frame caller', async t => {
  const api = await loadSceneFixture(),
    { GameScene } = await import('../app/scene.ts'),
    { ScenePicking } = await import('../app/scene-picking.ts'),
    { RenderView } = await import('../app/render-view.ts'),
    { createTooltip, worldTooltipObject } = await import('../app/tooltips.ts'),
    { syncSecondaryReservations } = await import('../app/scene-secondary-effects.ts'),
    { nativeModel } = await import('../app/scene-assets.ts'),
    world = api.createWorld(1),
    fixture = await makeSceneFixture(world),
    { scene } = fixture,
    globals = new Map()
  Object.setPrototypeOf(scene, GameScene.prototype)
  for (const [name, value] of Object.entries({
    devicePixelRatio: 1,
    requestAnimationFrame: () => 1,
  })) {
    globals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  Object.assign(scene, {
    scene: new THREE.Group(),
    decorations: new THREE.Group(),
    camera: new THREE.PerspectiveCamera(),
    view: new RenderView(),
    viewPoint: { x: 0, z: 0 },
    overviewActive: false,
    flybyTime: 0,
    flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    tooltip: createTooltip(),
    renderer: {
      getPixelRatio: () => 1,
      domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) },
      render: nop,
    },
    container: { clientWidth: 800, clientHeight: 600 },
    selectionOverlay: {},
    dragActive: { value: false },
    pointerButtons: 0,
    pointerScreen: null,
    hoveredObject: null,
    frame: 1,
    worshipPresentation: { rememberBodies: nop },
    updateCameraMotion: () => true,
    pick: () => null,
  })
  // Keep actual updatePointerFrame and renderSceneFrame methods. Do not replace
  // the picked object, hover descriptor, identity match or lighting decision.
  for (const name of [
    'playWorldSounds', 'updateTerrainFrame', 'updateDecorationsFrame', 'updateView',
    'updateUnitsFrame', 'renderTooltip', 'updateBuildingsFrame', 'updateEffectsFrame',
    'updateShrinesFrame', 'updatePlacement', 'updateSpellPointerFrame',
    'updateEnvironmentFrame', 'updateHudFrame', 'updateSpellHalo', 'updateDrag',
    'commitSky', 'cancelOverview',
  ]) scene[name] = nop
  scene.view.prepare = nop
  scene.view.pickCandidates = () => []
  scene.view.pickSubmissionKey = () => 'supplied-empty-terrain'
  scene.view.resolvePickCandidates = () => null
  let submitted
  scene.view.painter.source = mesh => mesh === submitted
    ? { slot: 0, alpha: false, bucket: 0, cell: 0, object: 0, face: 0, phase: 0, order: 0 }
    : null
  scene.picking = new ScenePicking(scene)
  scene.scene.add(scene.objects, scene.decorations)
  // The authored intro starts with inputMask 128 and later its flyby owns 64.
  // Reach ordinary input through the existing campaign/clock/flyby callers;
  // the controlled phase samples below do not claim startup or clock parity.
  for (let frames = 0; frames < 24 * 60 && world.inputMask; frames++) {
    api.advanceGame(world, scene.gameClock, 1 / 24)
    scene.updateFlyby(1 / 24)
  }
  assert.equal(world.inputMask, 0, 'the authored opening must release ordinary hover input')
  scene.makeDecorations()
  scene.animate = bindAnimate(scene, {
    syncSecondaryReservations,
    advanceGame: api.advanceGame,
    updateVehiclesFrame: nop,
    SPELLS: api.SPELLS,
    worldTooltipObject,
  })
  t.after(() => {
    scene.scene.traverse(object => {
      object.geometry?.dispose()
      object.material?.dispose()
    })
    scene.view.dispose()
    fixture.close()
    for (const [name, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })
  const trees = world.trees.filter(tree => tree.model >= 1 && tree.model <= 6 && tree.logs >= 1),
    [tree, otherTree] = trees,
    treeMesh = id => scene.decorations.children.find(group => group.userData.point?.id === id).children[0],
    mesh = treeMesh(tree.id),
    otherMesh = treeMesh(otherTree.id),
    highlight = object => object.userData.highlight.value
  assert.ok(trees.length > 1)
  assert.ok(world.selected.some(id => world.units.some(unit => unit.id === id && unit.kind === 'shaman')))
  assert.equal(worldTooltipObject(world, tree.id), null, 'trees still have no tooltip descriptor')
  function pointAt(object, record) {
    submitted = object
    scene.view.update(800, 600, record, 0, 0, false)
    scene.viewPoint = { x: record.x, z: record.z }
    scene.pointerState = ''
    scene.picking.lastKey = ''
    const faces = scene.picking.model(object, '').filter(command => command.kind === 'model')
    for (const face of faces) {
      const event = {
        clientX: Math.floor(face.points.reduce((sum, point) => sum + point.x, 0) / 3),
        clientY: Math.floor(face.points.reduce((sum, point) => sum + point.y, 0) / 3),
      }
      if (scene.picking.pick(event) === record.id) {
        scene.pointerScreen = event
        return
      }
    }
    assert.fail(`authored model ${record.id} has no pickable face`)
  }
  const frame = () => {
    scene.pointerState = ''
    scene.animate(0)
  }
  pointAt(mesh, tree)
  for (const [turn, expected] of [[0, 200], [1, 200], [2, 255], [3, 255], [4, 200]]) {
    world.turn = turn
    frame()
    assert.equal(scene.hoveredObject, tree.id, 'the actual picker resolves the authored tree')
    assert.equal(highlight(mesh), expected, `picked tree must receive the turn ${turn} override`)
    assert.equal(highlight(otherMesh), 0, 'another tree cannot inherit the picked identity')
  }
  pointAt(otherMesh, otherTree)
  frame()
  assert.equal(highlight(otherMesh), 200)
  assert.equal(highlight(mesh), 0)
  pointAt(mesh, tree)
  for (const gate of ['press', 'input-mask', 'spell', 'leave']) {
    scene.pointerButtons = gate === 'press' ? 1 : 0
    world.inputMask = gate === 'input-mask' ? 1 : 0
    world.mode = gate === 'spell' ? 'convertWild' : null
    const pointer = scene.pointerScreen
    if (gate === 'leave') scene.pointerScreen = null
    frame()
    assert.equal(scene.hoveredObject, null, gate)
    assert.equal(highlight(mesh), 0, gate)
    scene.pointerScreen = pointer
  }
  scene.pointerButtons = 0
  world.inputMask = 0
  world.mode = null
  frame()
  assert.equal(highlight(mesh), 200, 'ordinary hover returns after the guards clear')
  for (const state of [{ logs: 0, model: tree.model }, { logs: 1, model: 11 }]) {
    const original = { logs: tree.logs, model: tree.model }
    Object.assign(tree, state)
    frame()
    assert.equal(scene.hoveredObject, tree.id, 'a stale submitted mesh cannot bypass activity/type checks')
    assert.equal(highlight(mesh), 0)
    Object.assign(tree, original)
  }
  // Existing owned/enemy-building and shrine consumers retain their descriptors
  // and modelHighlight eligibility. These are controlled render attachments.
  for (const record of [world.buildings[0], world.shrines[0]]) {
    assert.ok(record)
    const group = new THREE.Group(), control = nativeModel(13)
    group.userData[world.buildings.includes(record) ? 'building' : 'shrine'] = record.id
    group.add(control)
    scene.locate(group, record)
    scene.objects.add(group)
    pointAt(control, record)
    if (world.buildings.includes(record)) {
      const team = record.team
      for (const [owner, expected] of [['blue', 200], ['red', 0]]) {
        record.team = owner
        frame()
        assert.equal(scene.hoveredObject, record.id)
        assert.equal(highlight(control), expected)
        assert.equal(highlight(mesh), 0)
      }
      record.team = team
    } else {
      frame()
      assert.equal(highlight(control), 200)
    }
  }
})
