// Failure-first production-caller regression for issue19's accepted compatibility
// clock. Uses authored Mission1, real opening/clock/flyby, actual building geometry,
// ScenePicking, pointerMove, updatePointerFrame and the production animate body.
// Texture IO, terrain occlusion, DOM/projection/glyph submissions and unrelated
// frame stages are supplied. The real tooltip paint decision remains in scope.
// This is controlled caller coverage, not the ordinary browser witness.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeHutSmokeScene } from './support/hut-smoke-scene.mjs'

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
const inputSource = ts.createSourceFile(
  'scene-input-runtime.ts',
  readFileSync(new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true
)
const tooltipPaint = inputSource.statements.find(
  node => ts.isFunctionDeclaration(node) && node.name?.text === 'renderTooltip'
)
function bindAnimate(scene, bindings) {
  const javascript = ts.transpileModule(
    `(function(){return ${animate.initializer.getText(source)}})`,
    {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }
  ).outputText
  return new Function(...Object.keys(bindings), `return ${javascript}`)(
    ...Object.values(bindings)
  ).call(scene)
}
function bindTooltipPaint(scene, bindings) {
  const javascript = ts.transpileModule(
    `(function(){${tooltipPaint.getText(inputSource).replace(/^export /, '')};return () => renderTooltip(this)})`,
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }
  ).outputText
  return new Function(...Object.keys(bindings), `return ${javascript}`)(
    ...Object.values(bindings)
  ).call(scene)
}

async function callerFixture(t) {
  const api = await loadSceneFixture(),
    { GameScene } = await import('../app/scene.ts'),
    { ScenePicking } = await import('../app/scene-picking.ts'),
    { RenderView } = await import('../app/render-view.ts'),
    { ObjectPanels } = await import('../app/object-panels.ts'),
    tooltipApi = await import('../app/tooltips.ts'),
    { pointerMove } = await import('../app/scene-input-runtime.ts'),
    { syncSecondaryReservations } = await import('../app/scene-secondary-effects.ts'),
    world = api.createWorld(1),
    fixture = await makeHutSmokeScene(world),
    { scene } = fixture,
    globals = new Map()
  let frameSerial = 0,
    cameraOwnsFrame = false
  Object.setPrototypeOf(scene, GameScene.prototype)
  for (const [name, value] of Object.entries({
    devicePixelRatio: 1,
    requestAnimationFrame: () => ++frameSerial,
  })) {
    globals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  Object.assign(scene, {
    scene: new THREE.Group(),
    view: new RenderView(),
    viewPoint: { x: 0, z: 0 },
    overviewActive: false,
    overviewStage: 0,
    flybyTime: 0,
    flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    tooltip: tooltipApi.createTooltip(),
    renderer: {
      getPixelRatio: () => 1,
      domElement: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      },
    },
    container: {
      clientWidth: 800,
      clientHeight: 600,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    },
    selectionOverlay: {},
    dragActive: { value: false },
    pointerButtons: 0,
    pointerScreen: null,
    hoveredObject: null,
    frame: 1,
    previous: 0,
    worshipPresentation: { rememberBodies: nop },
    buildingPanels: new Map(),
    updateCameraMotion: () => cameraOwnsFrame,
    pick: () => null,
    screen: () => ({ x: 0, y: 0, z: 0 }),
    visible: () => true,
    tooltipCanvas: { submissions: [] },
    tooltipElement: {
      hidden: true,
      style: {},
      offsetWidth: 200,
      offsetHeight: 40,
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value
      },
    },
  })
  scene.objectPanels = new ObjectPanels(scene)
  scene.renderTooltip = bindTooltipPaint(scene, {
    ...tooltipApi,
    texture: () => ({ image: {} }),
    window: { innerWidth: 800 },
    drawTooltip: (canvas, _atlas, text) => {
      canvas.submissions.push(text)
    },
  })
  for (const name of [
    'playWorldSounds',
    'updateTerrainFrame',
    'updateDecorationsFrame',
    'updateView',
    'updateUnitsFrame',
    'updateBuildingsFrame',
    'updateEffectsFrame',
    'updateShrinesFrame',
    'updatePlacement',
    'updateSpellPointerFrame',
    'updateEnvironmentFrame',
    'updateHudFrame',
    'updateSpellHalo',
    'updateDrag',
    'renderSceneFrame',
    'commitSky',
    'cancelOverview',
  ])
    scene[name] = nop
  scene.view.pickCandidates = () => []
  scene.view.pickSubmissionKey = () => 'supplied-empty-terrain'
  scene.view.resolvePickCandidates = () => null
  scene.picking = new ScenePicking(scene)
  scene.scene.add(scene.objects, scene.decorations)
  scene.animate = bindAnimate(scene, {
    syncSecondaryReservations,
    advanceGame: api.advanceGame,
    updateVehiclesFrame: nop,
    SPELLS: api.SPELLS,
    worldTooltipObject: tooltipApi.worldTooltipObject,
  })
  t.after(() => {
    scene.view.dispose()
    fixture.close()
    for (const [name, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })

  // Retain actual campaign and forced history. No stamping inputMask, deleting
  // the intro, or initializing a cache at the first Hut hover.
  let now = 0,
    sawInputLock = world.inputMask !== 0,
    sawFlyby = !!(world.flyby.flags & 1)
  for (let frames = 0; frames < 24 * 60; frames++) {
    now += 1000 / 24
    scene.animate(now)
    sawInputLock ||= world.inputMask !== 0
    sawFlyby ||= !!(world.flyby.flags & 1)
    if (
      sawInputLock &&
      sawFlyby &&
      !world.inputMask &&
      !(world.flyby.flags & 1) &&
      !scene.tooltip.remaining
    )
      break
  }
  assert.equal(sawInputLock, true, 'fixture observes actual opening input ownership')
  assert.equal(sawFlyby, true, 'fixture observes the authored flyby before claiming completion')
  assert.equal(world.flyby.flags & 1, 0, 'authored flyby has finished')
  assert.equal(world.inputMask, 0, 'authored opening releases ordinary input')
  assert.equal(scene.tooltip.remaining, 0, 'opening forced lifetime has completed')
  api.cancelInteraction(world)
  assert.equal(world.mode, null)
  assert.deepEqual(world.selected, [])
  // Isolate subsequent presentation visits from new simulation commands; this
  // controlled fixture is explicitly not normal-speed browser acceptance.
  world.speed = 0
  fixture.render()
  const hut = world.buildings.find(building => {
    const pose = api.buildingPose(building)
    return (
      building.team === 'blue' &&
      building.kind === 'hut' &&
      pose.anchorX === 64512 &&
      pose.anchorY === 54784
    )
  })
  assert.ok(hut, 'resolve authored Blue Hut DAT42 by its native anchor')
  const group = scene.buildingMeshes.get(hut.id),
    mesh = group?.children.find(object => object.userData.nativeModel !== undefined)
  assert.ok(mesh, 'actual building-frame caller created the Hut model')
  scene.view.painter.source = object =>
    object === mesh
      ? { slot: 0, alpha: false, bucket: 0, cell: 0, object: 0, face: 0, phase: 0, order: 0 }
      : null
  scene.view.update(800, 600, hut, 0, 0, false)
  scene.viewPoint = { x: hut.x, z: hut.z }
  const faces = scene.picking.model(mesh, '').filter(command => command.kind === 'model')
  let point
  for (const face of faces) {
    const candidate = {
      clientX: Math.floor(face.points.reduce((sum, vertex) => sum + vertex.x, 0) / 3),
      clientY: Math.floor(face.points.reduce((sum, vertex) => sum + vertex.y, 0) / 3),
    }
    if (scene.picking.pick(candidate) === hut.id) {
      point = candidate
      break
    }
  }
  assert.ok(point, 'actual native Hut geometry supplies a picked face')
  pointerMove(scene, { ...point, buttons: 0 })
  scene.animate(now)
  assert.equal(scene.hoveredObject, hut.id, 'actual pointer-frame caller publishes the Hut')
  const frame = (seconds = 1 / 24) => {
    now += seconds * 1000
    scene.animate(now)
  }
  return {
    scene,
    world,
    hut,
    frame,
    tooltipApi,
    cameraOwns: value => {
      cameraOwnsFrame = value
    },
  }
}

test('actual Hut paint waits for admitted controller visits before its first display', async t => {
  const { scene, hut, frame } = await callerFixture(t)
  frame(0)
  assert.equal(
    scene.tooltipElement.hidden,
    true,
    'a zero-tick repaint must not show an immediate ordinary Hut tooltip'
  )
  frame()
  assert.equal(scene.tooltip.draw, 0, 'named acquisition does not immediately draw')
  assert.equal(scene.tooltipElement.hidden, true)
  assert.match(
    scene.tooltip.text,
    /^Small Hut:/,
    'actual controller acquires the imported ID908 name'
  )
  const acquired = { ...scene.tooltip }
  frame(0)
  assert.deepEqual(
    scene.tooltip,
    acquired,
    'another render with no due visit cannot advance the controller'
  )
  let displayed = false
  for (let visits = 0; visits < 30 && !displayed; visits++) {
    frame()
    assert.equal(scene.hoveredObject, hut.id, 'real picker retains the same authored target')
    displayed = scene.tooltip.draw === 1
  }
  assert.equal(displayed, true, 'ordinary same-Hut visits reach first display through updateFlyby')
  assert.match(scene.tooltip.text, /^Small Hut:/)
  assert.equal(
    scene.tooltipElement.hidden,
    false,
    'real renderer presents the resolved controller output'
  )
  assert.match(scene.tooltipElement.attributes['aria-label'], /^Small Hut:/)
})

test('actual animate caller preserves forced tick lifetime, zero-tick frames, pause and camera skips', async t => {
  const { scene, world, hut, frame, tooltipApi, cameraOwns } = await callerFixture(t),
    object = tooltipApi.worldTooltipObject(world, hut.id)
  tooltipApi.showObjectTooltip(scene.tooltip, object, 3)
  frame(0)
  assert.equal(scene.tooltip.remaining, 3)
  cameraOwns(true)
  frame(1 / 24)
  assert.equal(scene.tooltip.remaining, 3, 'existing camera ownership skips the flyby accumulator')
  cameraOwns(false)
  world.paused = true
  frame(1 / 24)
  assert.equal(scene.tooltip.remaining, 3, 'existing pause does not consume forced lifetime')
  world.paused = false
  frame()
  assert.equal(scene.tooltip.remaining, 2)
  assert.equal(scene.tooltip.draw, 1)
  frame()
  assert.equal(scene.tooltip.remaining, 1)
  frame()
  assert.equal(scene.tooltip.remaining, 0)
  assert.equal(scene.tooltip.text, '', 'expiry clears shared text')
  assert.equal(scene.tooltip.draw, 0, 'handled expiry cannot fall through into ordinary drawing')
  tooltipApi.showObjectTooltip(scene.tooltip, object, 3)
  frame(3 / 24)
  assert.equal(
    scene.tooltip.remaining,
    0,
    'three existing catch-up ticks consume exactly three decrements'
  )
  assert.equal(scene.tooltip.text, '')
  assert.equal(scene.tooltip.draw, 0)
})

test('real tooltip renderer does not replace a handled forced expiry with immediate Hut hover', async t => {
  const { scene, world, hut, frame, tooltipApi } = await callerFixture(t)
  tooltipApi.showObjectTooltip(scene.tooltip, tooltipApi.worldTooltipObject(world, hut.id), 1)
  frame()
  assert.equal(scene.tooltip.remaining, 0)
  assert.equal(scene.tooltip.text, '')
  assert.equal(scene.tooltip.draw, 0)
  assert.equal(
    scene.tooltipElement.hidden,
    true,
    'forced expiry owns this tick through the real paint caller'
  )
})

test('existing forced helper retains its public state shape and expiry result', async () => {
  const { createTooltip, showObjectTooltip, stepTooltip } = await import('../app/tooltips.ts'),
    state = createTooltip()
  assert.deepEqual(Object.keys(state), [
    'target',
    'flags',
    'remaining',
    'text',
    'fixed',
    'draw',
    'hold',
    'scroll',
  ])
  showObjectTooltip(
    state,
    {
      id: 7,
      x: 0,
      z: 0,
      type: 2,
      model: 1,
      owner: 0,
      tutorial: 0,
      head: null,
    },
    1
  )
  assert.equal(stepTooltip(state, true, 24), true, 'native expiry is a handled visit')
  assert.equal(state.remaining, 0)
  assert.equal(state.text, '')
  assert.equal(stepTooltip(state, true, 24), false)
})
