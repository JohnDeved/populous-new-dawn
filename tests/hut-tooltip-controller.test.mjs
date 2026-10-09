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
        setPointerCapture: nop,
      },
    },
    container: {
      clientWidth: 800,
      clientHeight: 600,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    },
    selectionOverlay: {},
    globeMotion: { dragging: false },
    onChange: nop,
    onSound: nop,
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
    point,
    api,
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

test('composed HUD history, forced overlap and catch-up retain real visit order', async t => {
  const { scene, world, hut, frame, tooltipApi } = await callerFixture(t)
  const hud = {
    getAttribute: () => 'blast',
    closest: selector => (selector === '[data-tooltip-hud]' ? hud : null),
  }
  document.elementFromPoint = () => hud
  scene.navigationPointer = { x: 40, y: 100, buttons: 0 }
  frame(0)
  frame()
  frame()
  const owner = scene.tooltipController,
    key = owner.key
  assert.equal(owner.category, 'hud')
  assert.match(key, /^hud:/, 'use live control lifetime identity, never action14 as dwell key')
  const threshold = owner.session.threshold
  for (let i = 0; i < threshold + 3; i++) frame()
  assert.equal(owner.key, key)
  assert.equal(scene.tooltip.text, 'Blast: {}select. |}toggle on/off.')
  assert.equal(
    scene.tooltipElement.hidden,
    true,
    'ordinary HUD keeps its existing DOM presentation'
  )
  scene.acquireForcedTooltip(tooltipApi.worldTooltipObject(world, hut.id), threshold + 8)
  for (let i = 0; i < threshold + 3; i++) frame()
  assert.equal(scene.tooltip.remaining, 5)
  assert.equal(
    scene.tooltip.text,
    'Blast: {}select. |}toggle on/off.',
    'mature HUD writes the same forced text owner'
  )
  assert.equal(owner.output.kind, 'forced')
  assert.equal(owner.output.draw, 1)
  const visits = [],
    original = scene.updateTooltipController.bind(scene),
    before = owner.session.visits
  scene.updateTooltipController = now => {
    original(now)
    visits.push(structuredClone(owner.lastVisit))
  }
  frame(3 / 24)
  assert.equal(visits.length, 3)
  assert.deepEqual(
    visits.map(visit => visit.forced.remaining),
    [4, 3, 2]
  )
  assert.equal(
    new Set(visits.map(visit => visit.now)).size,
    1,
    'catch-up observes the actual RAF timestamp'
  )
  assert.equal(owner.session.visits - before, 3)
  frame(2 / 24)
  assert.equal(scene.tooltip.remaining, 0)
  assert.equal(owner.lastVisit.forced.handled, true)
  assert.equal(scene.tooltipElement.hidden, true)
  assert.equal(owner.category, 'none')
})

test('actual right-button callers retain down/up order and cancel skipped-frame input', async t => {
  const { scene, hut, frame, point, cameraOwns } = await callerFixture(t),
    { pointerDown, pointerUp } = await import('../app/scene-input-runtime.ts')
  const event = buttons => ({
    ...point,
    button: 2,
    buttons,
    pointerId: 3,
    currentTarget: scene.renderer.domElement,
  })
  const before = scene.objectPanels.hutRecords.get(hut.id),
    panelFrame = scene.objectPanels.frame,
    randomState = scene.world.randomState,
    markers = scene.world.effects.filter(effect => effect.kind === 'orderMarker').length,
    sounds = []
  scene.onSound = cue => sounds.push(cue)
  pointerDown(scene, event(2))
  pointerUp(scene, event(0))
  frame(0)
  assert.deepEqual(
    scene.tooltipInspectionInputs.map(input => input.kind),
    ['down', 'up']
  )
  frame()
  assert.deepEqual(scene.tooltipController.lastVisit.inspection.slice(-2), [
    before ? 'explicit:reused' : 'explicit:created',
    'release',
  ])
  const record = scene.objectPanels.hutRecords.get(hut.id)
  assert.ok(record)
  if (before) assert.equal(record, before)
  else assert.deepEqual(record, { phase: 0, remaining: 2, hold: 16, automatic: false })
  assert.equal(scene.objectPanels.hutHeldPointer, null)
  assert.equal(
    scene.world.effects.filter(effect => effect.kind === 'orderMarker').length,
    markers + 1
  )
  assert.deepEqual(sounds, [0x6a], 'one admitted press emits feedback; release does not')
  assert.equal(scene.world.randomState, randomState, 'inspection feedback consumes no gameplay RNG')
  assert.equal(
    scene.objectPanels.frame,
    panelFrame,
    'Hut allocation never resets unrelated panel clock'
  )
  const owner = scene.tooltipController
  assert.equal(
    owner.dwell,
    owner.session.threshold + 1,
    'fresh creation accelerates shared dwell after ordinary acquisition'
  )
  const reservations = scene.world.secondaryEffects.reservations.filter(
    value => value === `building-panel:${hut.id}`
  )
  assert.equal(reservations.length, 1, 'retained record reserves once before DOM creation')
  pointerDown(scene, event(2))
  cameraOwns(true)
  frame()
  assert.deepEqual(scene.tooltipInspectionInputs, [])
  assert.equal(scene.objectPanels.hutHeldPointer, null)
  cameraOwns(false)
  frame()
  assert.ok(
    !owner.lastVisit.inspection.some(result => result.startsWith('explicit:')),
    'old click cannot replay after skipped processing'
  )
})

test('retained pick geometry rechecks live object data before a due controller tick', async t => {
  const { scene, hut, frame } = await callerFixture(t)
  assert.equal(scene.tooltipInput.object.id, hut.id)
  const cell = scene.tooltipInput.cell
  hut.hp = 0 // Controlled invalidation between actual pointer publication and consumption.
  frame()
  assert.notEqual(scene.tooltipController.lastVisit.route, 'object')
  assert.equal(scene.tooltipController.lastVisit.firstDisplay, null)
  assert.equal(scene.tooltipElement.hidden, true)
  assert.ok(cell !== null, 'the valid cell survives loss of the sampled object')
  assert.equal(scene.objectPanels.hutRecords.has(hut.id), false)
  scene.picking.pick = () => null
  const { browserPosition } = await import('../app/model.ts')
  scene.pick = () => browserPosition({ x: (cell & 255) << 8, y: cell & 0xff00 })
  scene.pointerState = '' // A new supplied terrain geometry publication.
  frame(0)
  assert.equal(scene.tooltipInput.cell, cell)
  const index = (cell >> 9) * 128 + ((cell & 255) >> 1)
  scene.world.land.flags[index] |= 0x400
  frame()
  assert.equal(scene.tooltipController.lastVisit.route, 'unmapped-cell')
  assert.ok(
    scene.tooltipController.unsupportedHistory.includes('unmapped-cell'),
    'current cell-name eligibility must qualify the consumed route'
  )
})

test('Hut record adapter preserves reuse, failure retirement, secondary capacity and transient restore', async t => {
  const { scene, world, hut, api } = await callerFixture(t),
    { allocateSecondaryEffect } = await import('../app/secondary-effects.ts'),
    { syncSecondaryReservations } = await import('../app/scene-secondary-effects.ts'),
    { ObjectPanels } = await import('../app/object-panels.ts'),
    { createTooltipController } = await import('../app/tooltip-controller.ts')
  const second = world.buildings.find(
    b => b.id !== hut.id && b.kind === 'hut' && b.team === 'blue' && b.progress >= 1
  )
  assert.ok(second)
  assert.equal(scene.objectPanels.inspectHut(hut.id, 'explicit', 5), 'explicit:created')
  const record = scene.objectPanels.hutRecords.get(hut.id),
    owner = scene.tooltipController
  scene.objectPanels.stepHutInspections(false)
  assert.deepEqual(record, { phase: 0, remaining: 2, hold: 16, automatic: false })
  const snapshot = structuredClone(record),
    dwell = owner.dwell
  assert.equal(scene.objectPanels.inspectHut(hut.id, 'explicit', 5), 'explicit:reused')
  assert.equal(scene.objectPanels.hutRecords.get(hut.id), record)
  assert.deepEqual(record, snapshot)
  assert.equal(owner.dwell, dwell)
  // Controlled occupancy of the same supported inventory: no invented World entities.
  for (let i = 0; i < 31; i++) scene.objectPanels.panels.set(100000 + i, {})
  assert.equal(scene.objectPanels.inspectHut(second.id, 'hover'), 'hover:rejected-capacity')
  assert.equal(record.hold, 0, 'same-class retirement precedes failed allocation')
  assert.equal(record.remaining, 0)
  assert.equal(owner.dwell, dwell, 'failure does not accelerate')
  scene.objectPanels.panels.clear()
  syncSecondaryReservations(scene)
  while (
    allocateSecondaryEffect(world.secondaryEffects, {
      kind: 'orderMarker',
      effect: 0,
      counter: 0,
    }) !== null
  ) {
    // Fill through the actual capacity adapter until it rejects allocation.
  }
  assert.equal(scene.objectPanels.inspectHut(second.id, 'hover'), 'hover:rejected-capacity')
  assert.equal(
    scene.objectPanels.inspectHut(hut.id, 'explicit', 5),
    'explicit:reused',
    'reuse succeeds at capacity'
  )
  const session = owner.session,
    checkpoint = structuredClone(world),
    restored = api.migrateCheckpoint(checkpoint)
  assert.deepEqual(
    restored.secondaryEffects.reservations,
    [],
    'load clears transient reservation adapter'
  )
  const next = {
    world: restored,
    tooltip: (await import('../app/tooltips.ts')).createTooltip(),
    tooltipSession: session,
    buildingPanels: new Map(),
    cursor: { visible: false },
  }
  next.tooltipController = createTooltipController(next.tooltip, session)
  next.objectPanels = new ObjectPanels(next)
  syncSecondaryReservations(next)
  assert.equal(next.tooltipController.session, session)
  assert.equal(next.tooltipController.session.threshold, owner.session.threshold)
  assert.equal(next.tooltipController.category, 'none')
  assert.equal(next.objectPanels.hutRecords.size, 0)
  assert.deepEqual(next.world.secondaryEffects.reservations, [])
})

test('retained Hut controls remain usable while hovered or keyboard-focused', async t => {
  const { scene, hut, frame } = await callerFixture(t)
  scene.objectPanels.inspectHut(hut.id, 'hover')
  scene.objectPanels.releaseHutInspection()
  const record = scene.objectPanels.hutRecords.get(hut.id)
  for (let i = 0; i < 4; i++) scene.objectPanels.stepHutInspections(false)
  assert.equal(record.phase, 1)
  let hovered = true,
    focused = false
  const panel = { hidden: false, matches: () => hovered, contains: () => focused, remove: nop }
  scene.buildingPanels.set(hut.id, panel)
  const before = structuredClone(record)
  scene.pointerScreen = null
  frame(0)
  for (let i = 0; i < 30; i++) frame()
  assert.equal(scene.objectPanels.hutRecords.get(hut.id), record)
  assert.deepEqual(record, before)
  hovered = false
  focused = true
  for (let i = 0; i < 30; i++) frame()
  assert.equal(scene.objectPanels.hutRecords.get(hut.id), record)
  focused = false
  for (let i = 0; i < 30; i++) frame()
  assert.equal(scene.objectPanels.hutRecords.has(hut.id), false)
  assert.ok(!scene.world.secondaryEffects.reservations.includes(`building-panel:${hut.id}`))
})

test('shared object/cell helpers preserve flags and every existing named-class dispatch', async () => {
  await loadSceneFixture()
  const api = await import('../app/tooltip-controller.ts'),
    old = await import('../app/tooltips.ts')
  const state = old.createTooltip(),
    owner = api.createTooltipController(state, api.createTooltipSession())
  for (const [type, model, head] of [
    [2, 4, null],
    [2, 5, null],
    [5, 9, { type: 3, flags: 0 }],
    [4, 1, null],
  ]) {
    const object = { id: type * 100 + model, x: 0, z: 0, type, model, owner: 0, tutorial: 0, head },
      previous = old.createTooltip()
    old.showObjectTooltip(previous, object, 1)
    state.flags = 0x41
    api.visitObjectTooltip(owner, state, object)
    assert.equal(state.text, previous.text)
    assert.ok(state.text, `existing type${type}/model${model} keeps its name`)
    assert.equal(state.flags, 0x41, 'object acquisition preserves shared flags')
    for (let i = 0; i < owner.session.threshold + 15 && !state.draw; i++)
      api.visitObjectTooltip(owner, state, object)
    assert.equal(state.draw, 1)
    state.draw = 0
  }
  api.visitBlankCellTooltip(owner, state, 2)
  assert.equal(state.flags, 0x40, 'blank-cell acquisition clears only pending bit1')
})

test('a named non-Hut winner cannot allocate the Hut beneath its retained cell', async t => {
  const { scene, world, hut, frame } = await callerFixture(t)
  const shrine = world.shrines.find(head => head.kind !== 'vault')
  assert.ok(shrine)
  // Supply only the pick/terrain boundary; production publication, live naming,
  // shared visits and first-display dispatch still run through actual animate.
  scene.picking.pick = () => shrine.id
  scene.pointerState = '' // Publish the supplied new pick geometry.
  scene.pick = () => hut
  scene.acquireForcedTooltip(null, 0)
  frame(0)
  assert.equal(scene.tooltipInput.picked, shrine.id)
  assert.equal(scene.tooltipInput.inspectionTarget, null)
  const oldRecord = scene.objectPanels.hutRecords.get(hut.id)
  frame()
  assert.match(scene.tooltip.text, /^Stone Head:/, 'the selected real head has a named acquisition')
  frame()
  const threshold = scene.tooltipController.session.threshold
  assert.ok(threshold >= 12, 'read T only after its actual lazy initializer ran')
  for (let i = 0; i < threshold + 15 && !scene.tooltip.draw; i++) frame()
  assert.equal(scene.tooltip.draw, 1)
  assert.match(scene.tooltip.text, /^Stone Head:/)
  assert.equal(scene.objectPanels.hutRecords.get(hut.id), oldRecord)
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, ['hover:rejected'])
})

test('pause, dialog, hidden and input-lock guards cancel pending and held browser inspection', async t => {
  const { scene, world, hut, frame, point } = await callerFixture(t),
    { pointerDown } = await import('../app/scene-input-runtime.ts')
  const event = {
    ...point,
    button: 2,
    buttons: 2,
    pointerId: 7,
    currentTarget: scene.renderer.domElement,
  }
  const query = document.querySelector
  for (const guard of ['pause', 'dialog', 'hidden', 'input']) {
    pointerDown(scene, event)
    assert.equal(scene.tooltipInspectionInputs.length, 1)
    if (guard === 'pause') world.paused = true
    if (guard === 'dialog') document.querySelector = () => ({})
    if (guard === 'hidden') document.hidden = true
    if (guard === 'input') world.inputMask = 64
    const before = {
      category: scene.tooltipController.category,
      dwell: scene.tooltipController.dwell,
    }
    frame(0)
    assert.deepEqual(scene.tooltipInspectionInputs, [], guard)
    assert.equal(scene.objectPanels.hutHeldPointer, null, guard)
    assert.deepEqual(
      { category: scene.tooltipController.category, dwell: scene.tooltipController.dwell },
      before
    )
    world.paused = false
    world.inputMask = 0
    document.hidden = false
    document.querySelector = query
    frame()
    assert.ok(
      !scene.tooltipController.lastVisit.inspection.some(result => result.startsWith('explicit:')),
      guard
    )
  }
  pointerDown(scene, event)
  frame()
  assert.equal(scene.objectPanels.hutHeldPointer, 7)
  const record = scene.objectPanels.hutRecords.get(hut.id)
  world.paused = true
  frame(0)
  assert.equal(scene.objectPanels.hutHeldPointer, null)
  assert.equal(
    scene.objectPanels.hutRecords.get(hut.id),
    record,
    'guard cancellation retains the record'
  )
})

test('actual pointer publication retains the existing world geometry cache and refreshes DOM ownership', async t => {
  const { scene, frame, point } = await callerFixture(t),
    { pointerMove } = await import('../app/scene-input-runtime.ts')
  let picks = 0
  const original = scene.picking.pick.bind(scene.picking)
  scene.picking.pick = event => {
    picks++
    return original(event)
  }
  frame(0)
  frame(0)
  assert.equal(picks, 0, 'stable world frames reuse the existing pointer/view geometry key')
  pointerMove(scene, { ...point, clientX: point.clientX + 1, buttons: 0 })
  frame(0)
  assert.ok(picks > 0, 'a changed pointer key publishes actual geometry again')
  const count = picks,
    hud = {
      getAttribute: () => 'blast',
      closest: selector => (selector === '[data-tooltip-hud]' ? hud : null),
    }
  document.elementFromPoint = () => hud
  frame(0)
  assert.equal(scene.tooltipInput.route, 'hud')
  assert.equal(picks, count, 'DOM ownership refreshes without a world re-pick')
  document.elementFromPoint = () => null
  frame(0)
  assert.ok(picks > count, 'HUD-to-world entry republishes geometry even with the same key')
})
