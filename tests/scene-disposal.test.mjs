import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as THREE from 'three'

// Execute the production constructor's renderer assignment and complete dispose
// body without allocating a world, loading assets, or supplying a real GPU.
// These are caller/ownership tests, not browser context-loss or rendering proof.
const source = ts.createSourceFile('scene.ts', readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
const sceneClass = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'GameScene')
const disposeBody = sceneClass.members.find(node => ts.isMethodDeclaration(node) && node.name.getText(source) === 'dispose').body
const constructor = sceneClass.members.find(ts.isConstructorDeclaration)
const rendererAssignment = constructor.body.statements.find(node => ts.isExpressionStatement(node) && node.expression.left?.getText(source) === 'this.renderer')
function evaluate(expression, bindings = {}) {
  const javascript = ts.transpileModule(`(${expression})`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  return new Function(...Object.keys(bindings), `return ${javascript}`)(...Object.values(bindings))
}
const expected = [
  'cursor', 'nearby-cancel', 'nearby-reset', 'training', 'presentation', 'frame',
  'sound', 'terrain-abort', 'resize', 'listener', 'globe-remove', 'globe', 'group',
  'water', 'terrain', 'view', 'fps', 'renderer', 'canvas', 'tooltip-cancel',
  'tooltip', 'pointer', 'building-panel', 'object-panels', 'spell-pointer',
  'worship', 'context-loss',
]
function fixture(failAt) {
  const calls = [], failure = new Error(`cleanup failed: ${failAt}`)
  const record = name => () => {
    assert.equal(scene.disposed, true, 'disposal guard is set before cleanup')
    calls.push(name)
    if (name === failAt) throw failure
  }
  const owned = name => ({ dispose: record(name) })
  const scene = {
    disposed: false,
    neutralCursor: owned('cursor'),
    cancelNearbyFollowers: record('nearby-cancel'),
    nearbyFollowers: { reset: record('nearby-reset') },
    onNearbyFollowersCancel: () => {},
    releaseTrainingPanelRequests: record('training'),
    presentationBinding: { release: record('presentation') },
    frame: 42,
    ownedSounds: new Map([['sound', record('sound')]]),
    terrainLoad: { abort: record('terrain-abort') },
    resize: { disconnect: record('resize') },
    disposeListeners: [record('listener')],
    scene: { remove: record('globe-remove') },
    globe: owned('globe'),
    releaseGroup: record('group'),
    waterMap: owned('water'),
    terrainMap: owned('terrain'),
    terrainUpload: new THREE.DataTexture(),
    minimap: { revision: undefined },
    view: owned('view'),
    fpsGraph: owned('fps'),
    renderer: { dispose: record('renderer'), domElement: { remove: record('canvas') }, forceContextLoss: record('context-loss') },
    cancelTooltipInspection: record('tooltip-cancel'),
    tooltipInput: {},
    tooltipElement: { remove: record('tooltip') },
    pointerOutline: { remove: record('pointer') },
    buildingPanels: new Map([['panel', { remove: record('building-panel') }]]),
    objectPanels: owned('object-panels'),
    spellPointer: { remove: record('spell-pointer') },
    worshipPresentation: owned('worship'),
  }
  const dispose = evaluate(`function () ${disposeBody.getText(source)}`, {
    cancelAnimationFrame: frame => { assert.equal(frame, 42); record('frame')() },
  }).bind(scene)
  return { scene, dispose, calls, failure }
}

function ownedCpuImages(f) {
  const pixels = Uint8Array.of(11, 22, 33, 255),
    water = Uint8Array.of(44, 55, 66, 255),
    image = { data: pixels, width: 1, height: 1 },
    waterImage = { data: water, width: 1, height: 1 },
    atlas = { pixels, cells: Uint32Array.of(123), updated: 1, updatedBounds: [0, 0, 1, 1] },
    previousAtlas = { ...atlas, cells: Uint32Array.of(122) },
    textures = { palette: Uint8Array.of(1, 2, 3, 255) },
    waves = Uint8Array.of(7, 8),
    world = { footprints: { pixels: new Map([[0, Uint16Array.of(1)]]) }, landVersion: 3 }
  // Use real Texture.source/image aliasing, but retain the fixture's GPU leaves.
  for (const [name, value] of [['terrainMap', image], ['waterMap', waterImage]]) {
    const dispose = f.scene[name].dispose
    f.scene[name] = new THREE.DataTexture()
    f.scene[name].image = value
    f.scene[name].addEventListener('dispose', dispose)
  }
  f.scene.terrainUpload.image = image
  Object.assign(f.scene, { terrainAtlasState: atlas, terrainTextures: textures, waves, world })
  f.scene.minimap.revision = previousAtlas
  return { image, waterImage, atlas, previousAtlas, textures, waves, world }
}

function assertCpuReferencesReleased(scene) {
  for (const map of [scene.terrainMap, scene.terrainUpload, scene.waterMap]) {
    assert.equal(map.image.data.byteLength, 0)
    assert.equal(map.source.data, map.image)
    assert.equal(map.image.width, 0)
    assert.equal(map.image.height, 0)
  }
  assert.equal(scene.terrainAtlasState, undefined)
  assert.equal(scene.minimap.revision, undefined)
  assert.equal(scene.terrainTextures, null)
  assert.equal(scene.waves, null)
}

test('retained disposed scene releases all owned CPU aliases without changing old buffers or World', () => {
  const f = fixture(), held = ownedCpuImages(f), before = structuredClone(held),
    next = fixture(), successor = ownedCpuImages(next), successorBefore = structuredClone(successor)
  f.dispose()
  assertCpuReferencesReleased(f.scene)
  assert.deepEqual(held, before, 'externally held arrays/images and World remain intact')
  assert.equal(f.scene.world, held.world)
  assert.deepEqual(successor, successorBefore)
  assert.equal(next.scene.terrainMap.image, successor.image)
  assert.equal(next.scene.terrainAtlasState, successor.atlas)
  assert.equal(next.scene.minimap.revision, successor.previousAtlas)
  assert.notEqual(f.scene.terrainMap.image, held.image)
  assert.notEqual(f.scene.waterMap.image, held.waterImage)
  const released = f.scene.terrainMap.image
  f.dispose()
  assert.equal(f.scene.terrainMap.image, released, 'repeat dispose does not allocate or release again')
  assert.deepEqual(held, before)
})

test('pre-readiness disposal releases the constructor image without requiring a terrain atlas', () => {
  const f = fixture(), held = ownedCpuImages(f)
  f.scene.terrainAtlasState = undefined
  f.scene.minimap.revision = undefined
  f.scene.terrainTextures = null
  f.scene.waves = null
  f.scene.terrainUpload.image = { data: null, width: 1, height: 1 }
  f.dispose()
  assertCpuReferencesReleased(f.scene)
  assert.deepEqual([...held.image.data], [11, 22, 33, 255])
})

test('CPU release follows existing successful cleanup and precedes terminal context loss', () => {
  const f = fixture('context-loss'), held = ownedCpuImages(f)
  assert.throws(f.dispose, error => error === f.failure)
  assertCpuReferencesReleased(f.scene)
  assert.deepEqual([...held.atlas.pixels], [11, 22, 33, 255])
  const early = fixture('worship'), earlyHeld = ownedCpuImages(early)
  assert.throws(early.dispose, error => error === early.failure)
  assert.equal(early.scene.terrainMap.image, earlyHeld.image, 'earlier cleanup failures still stop immediately')
  assert.equal(early.scene.terrainAtlasState, earlyHeld.atlas)
})

function sceneMethod(name) {
  return sceneClass.members.find(node => ts.isMethodDeclaration(node) && node.name.getText(source) === name)
}

test('disposed start, resize and minimap entries cannot reacquire resources', () => {
  const f = fixture()
  ownedCpuImages(f)
  f.dispose()
  f.scene.started = true
  f.scene.terrainLoad = { signal: { aborted: true } }
  for (const name of ['start', 'setSize', 'drawMinimap']) {
    const method = evaluate(`function () ${sceneMethod(name).body.getText(source)}`)
    assert.equal(method.call(f.scene), name === 'start' ? false : undefined)
  }
  assertCpuReferencesReleased(f.scene)
})

const terrainSource = ts.createSourceFile('scene-terrain-runtime.ts', readFileSync(new URL('../app/scene-terrain-runtime.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
function terrainFunction(name, bindings = {}) {
  const declaration = terrainSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name)
  return evaluate(declaration.getText(terrainSource).replace(/^export\s+/, ''), bindings)
}

test('disposed terrain and water entries return before touching retained or released payloads', () => {
  const stale = { disposed: true,
    get terrainTextures() { assert.fail('disposed terrain must not read textures') },
    get waves() { assert.fail('disposed water must not read waves') } }
  terrainFunction('updateTerrainTexture')(stale)
  terrainFunction('updateWater')(stale)
})

test('late terrain body completion cannot repopulate a disposed owner, even if fetch ignores abort', async () => {
  const f = fixture(), held = ownedCpuImages(f), pending = []
  f.scene.terrainLoad = new AbortController()
  f.scene.environment = { landscape: { terrain: 'terrain.bin' } }
  const initialize = terrainFunction('initializeTerrain', {
    THREE,
    fetch: () => Promise.resolve({ ok: true, arrayBuffer: () => new Promise(resolve => pending.push(resolve)) }),
    terrainTiles: [], registerTerrainSubmissionOwner: () => {},
    readTerrainTextures: () => assert.fail('aborted completion must not decode or publish'),
    waterTexture: () => assert.fail('aborted completion must not rebuild water'),
  })
  const terrain = initialize(f.scene)
  // Let both response callbacks reach their deliberately pending body reads.
  await Promise.resolve()
  assert.equal(pending.length, 2)
  f.dispose()
  pending[0](new ArrayBuffer(386048))
  pending[1](new ArrayBuffer(65536))
  await terrain.ready
  assertCpuReferencesReleased(f.scene)
  assert.deepEqual([...held.image.data], [11, 22, 33, 255])
  terrain.terrain.geometry.dispose()
  terrain.terrain.material.dispose()
})

const animateField = sceneClass.members.find(node => ts.isPropertyDeclaration(node) && node.name.getText(source) === 'animate')
for (const stopAt of ['nearby', 'simulation', 'sound', 'flyby', 'hud', null]) {
  test(`animation stops after retiring callback phase ${stopAt ?? '(live control)'}`, () => {
    const f = fixture(), phases = [], phase = name => {
      phases.push(name)
      if (name === stopAt) f.dispose()
    }
    ownedCpuImages(f)
    f.scene.fpsGraph = null
    f.scene.presentationBinding.snapshot = () => null
    f.scene.neutralCursor.update = () => {}
    Object.assign(f.scene, {
      previous: 0, isCurrent() { return !this.disposed },
      world: { paused: false, selected: [], buildings: [], manaWorld: { gameFlags: 0 } },
      hoveredObject: null,
      dispatchNearbyFollowers: () => phase('nearby'),
      playWorldSounds: () => phase('sound'),
      updateTerrainFrame: () => phase('terrain'),
      updateDecorationsFrame: () => {}, updateCameraMotion: () => false,
      updateFlyby: () => { phase('flyby'); return false },
      updateView: () => {}, updateUnitsFrame: () => {}, renderTooltip: () => {},
      updateBuildingsFrame: () => {}, updateEffectsFrame: () => {}, updateShrinesFrame: () => {},
      updatePointerFrame: () => {}, updatePlacement: () => {}, updateSpellPointerFrame: () => {},
      updateEnvironmentFrame: () => phase('water'), renderSceneFrame: () => phase('render'),
      updateHudFrame: () => phase('hud'),
    })
    Object.assign(f.scene.renderer, { getPixelRatio: () => 1, info: { render: { calls: 0 } } })
    const makeAnimate = evaluate(`function () { return ${animateField.initializer.getText(source)} }`, {
      document: { hidden: false, querySelector: () => null }, devicePixelRatio: 1,
      syncSecondaryReservations: () => {}, advanceGame: () => phase('simulation'),
      updateVehiclesFrame: () => {}, SPELLS: [],
      requestAnimationFrame: () => { phase('schedule'); return 77 },
    })
    const animate = makeAnimate.call(f.scene)
    animate(16)
    const all = ['nearby', 'simulation', 'sound', 'terrain', 'flyby', 'water', 'render', 'hud', 'schedule']
    assert.deepEqual(phases, stopAt ? all.slice(0, all.indexOf(stopAt) + 1) : all)
    if (stopAt) {
      assertCpuReferencesReleased(f.scene)
      animate(32)
      assert.deepEqual(phases, all.slice(0, all.indexOf(stopAt) + 1), 'queued stale RAF cannot reschedule')
    }
    else assert.equal(f.scene.terrainMap.image.data.byteLength, 4)
  })
}

test('HUD publication that retires the scene does not draw minimap or worship afterward', () => {
  const hudSource = ts.createSourceFile('scene-hud-runtime.ts', readFileSync(new URL('../app/scene-hud-runtime.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true),
    declaration = hudSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'updateHudFrame'),
    f = fixture()
  ownedCpuImages(f)
  Object.assign(f.scene, {
    uiTimer: 1, drawPointer() {}, renderBuildingPanels() {},
    container: { parentElement: { style: { setProperty() {} } } },
    world: { units: [] }, gameClock: { animationFrame: 0 }, portrait: { parentElement: null },
    drawMinimap: () => assert.fail('no post-retirement minimap'), onChange: f.dispose,
  })
  f.scene.objectPanels.update = () => {}
  f.scene.worshipPresentation.draw = () => assert.fail('no post-retirement worship draw')
  const updateHud = evaluate(declaration.getText(hudSource).replace(/^export\s+/, ''), {
    publishTooltipStatus() {}, texture: () => ({ image: {} }),
    nativeHud: { colors: ['black'] }, populationMeter: () => ({ color: 0 }),
    drawPortrait() {}, portraitBackground() {}, nativeUnits: { atlas: 'unused' },
    syncCampaignMessagePresentation() {},
  })
  updateHud(f.scene, 16, 0.016)
  assertCpuReferencesReleased(f.scene)
})

test('GameScene creates an independently owned renderer without a supplied canvas or context', () => {
  const options = []
  class WebGLRenderer {
    constructor(value) { options.push(value); this.domElement = {} }
  }
  const create = evaluate(`function () { ${rendererAssignment.getText(source)} }`, { THREE: { WebGLRenderer } })
  const first = {}, replacement = {}
  create.call(first); create.call(replacement)
  assert.notEqual(first.renderer, replacement.renderer)
  assert.notEqual(first.renderer.domElement, replacement.renderer.domElement)
  for (const value of options) {
    assert.equal(Object.hasOwn(value, 'canvas'), false)
    assert.equal(Object.hasOwn(value, 'context'), false)
  }
})

test('GameScene retires its context after every existing cleanup and repeated disposal is a no-op', () => {
  const f = fixture()
  f.dispose()
  assert.deepEqual(f.calls, expected)
  assert.equal(f.scene.neutralCursor, null)
  assert.equal(f.scene.onNearbyFollowersCancel, undefined)
  assert.equal(f.scene.releaseTrainingPanelRequests, null)
  assert.equal(f.scene.ownedSounds.size, 0)
  assert.equal(f.scene.fpsGraph, null)
  assert.equal(f.scene.tooltipInput, null)
  assert.equal(f.scene.buildingPanels.size, 0)
  f.dispose()
  assert.deepEqual(f.calls, expected)
})

test('absent optional owners and an inactive frame do not prevent terminal retirement', () => {
  const f = fixture()
  Object.assign(f.scene, { neutralCursor: null, nearbyFollowers: undefined,
    releaseTrainingPanelRequests: null, presentationBinding: undefined, frame: 0, fpsGraph: null })
  f.scene.ownedSounds.clear(); f.scene.buildingPanels.clear(); f.scene.disposeListeners.length = 0
  f.dispose()
  const omitted = new Set(['cursor', 'nearby-reset', 'training', 'presentation', 'frame', 'fps', 'sound', 'building-panel', 'listener'])
  assert.deepEqual(f.calls, expected.filter(name => !omitted.has(name)))
})

for (const failAt of ['cursor', 'group', 'renderer', 'canvas', 'worship']) {
  test(`existing ${failAt} cleanup error retains fail-fast order and the disposal guard`, () => {
    const f = fixture(failAt)
    assert.throws(f.dispose, error => error === f.failure)
    const prefix = expected.slice(0, expected.indexOf(failAt) + 1)
    assert.deepEqual(f.calls, prefix)
    f.dispose()
    assert.deepEqual(f.calls, prefix)
    assert.equal(f.calls.includes('context-loss'), false)
  })
}

test('a terminal context-loss error propagates only after existing cleanup and is not retried', () => {
  const f = fixture('context-loss')
  assert.throws(f.dispose, error => error === f.failure)
  assert.deepEqual(f.calls, expected)
  assert.equal(f.scene.buildingPanels.size, 0)
  assert.equal(f.scene.tooltipInput, null)
  f.dispose()
  assert.deepEqual(f.calls, expected)
})

test('Scene cleanup keeps cached texture, image and geometry identities for later consumers', () => {
  const assetSource = ts.createSourceFile('scene-assets.ts', readFileSync(new URL('../app/scene-assets.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
  const release = assetSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'releaseGroup')
  const image = { width: 2, height: 2, data: new Uint8Array(16) }, texture = new THREE.Texture(image)
  const geometry = new THREE.BufferGeometry(), material = new THREE.SpriteMaterial({ map: texture })
  const meshMaterial = new THREE.MeshBasicMaterial({ map: texture })
  const asset = { texture }, textures = new Map([['shared', asset]])
  const releases = []
  texture.addEventListener('dispose', () => releases.push('texture'))
  geometry.addEventListener('dispose', () => releases.push('geometry'))
  material.addEventListener('dispose', () => releases.push('sprite-material'))
  meshMaterial.addEventListener('dispose', () => releases.push('mesh-material'))
  const releaseGroup = evaluate(`function () { let sharedGeometryMembership; return function ${release.name.text}(g) ${release.body.getText(assetSource)} }`, {
    THREE, textures, meshes: new Map([['shared', geometry]]),
  })()
  const f = fixture(), group = new THREE.Group()
  group.add(new THREE.Sprite(material), new THREE.Mesh(geometry, meshMaterial))
  f.scene.scene = group
  f.scene.releaseGroup = releaseGroup
  f.dispose()
  assert.deepEqual(releases.sort(), ['mesh-material', 'sprite-material'])
  assert.equal(textures.get('shared'), asset)
  assert.equal(asset.texture, texture)
  assert.equal(texture.image, image)
  assert.equal(group.children[1].geometry, geometry)
  assert.equal(f.calls.at(-1), 'context-loss')
  const laterConsumer = new THREE.SpriteMaterial({ map: textures.get('shared').texture })
  assert.equal(laterConsumer.map, texture)
  assert.equal(laterConsumer.map.image, image)
  laterConsumer.dispose()
})
