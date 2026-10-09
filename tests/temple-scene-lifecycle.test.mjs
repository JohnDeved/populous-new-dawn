// Actual Scene methods/field initializers and Page Load/retry bodies, with the
// existing Node TS loader. Texture IO, DOM, GPU and unrelated drawing are supplied.
// This is composed caller coverage, not a full constructor or browser witness.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeHutSmokeScene } from './support/hut-smoke-scene.mjs'

const sceneSource = ts.createSourceFile(
  'scene.ts',
  readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true
)
const pageSource = ts.createSourceFile(
  'page.tsx',
  readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
)
function find(source, predicate) {
  const found = []
  const visit = node => {
    if (predicate(node)) found.push(node)
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(found.length, 1, 'bind one exact production source node')
  return found[0]
}
const sceneClass = find(
  sceneSource,
  node => ts.isClassDeclaration(node) && node.name?.text === 'GameScene'
)
const constructor = sceneClass.members.find(ts.isConstructorDeclaration)
const field = name =>
  sceneClass.members
    .find(node => node.name?.getText(sceneSource) === name)
    .initializer.getText(sceneSource)
function execute(body, bindings, receiver) {
  const source = ts.transpileModule(`(function(){${body}})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  return new Function(...Object.keys(bindings), `return ${source}`)(
    ...Object.values(bindings)
  ).call(receiver)
}
const preload = constructor.body.statements.find(
  statement =>
    ts.isVariableStatement(statement) &&
    statement.declarationList.declarations.some(
      declaration => declaration.name.getText(sceneSource) === 'preload'
    )
)
const ready = constructor.body.statements.find(
  statement =>
    ts.isExpressionStatement(statement) &&
    statement.expression.left?.getText(sceneSource) === 'this.ready'
)

test('actual Scene preload/start/animate/dispose and Page retry respect the current store binding', async t => {
  const api = await loadSceneFixture(),
    { GameScene } = await import('../app/scene.ts'),
    { createGameStore } = await import('../app/game-store.ts'),
    { loadTexture, retryFailedTexture } = await import('../app/scene-assets.ts'),
    { vaultKnowledgeAtlas } = await import('../app/vault-appearance.ts'),
    { templeArt } = await import('../app/temple-art.ts'),
    { default: nativeUnits } = await import('../app/original-units.json'),
    { syncSecondaryReservations } = await import('../app/scene-secondary-effects.ts')
  const originalLoad = THREE.TextureLoader.prototype.load,
    globals = new Map(),
    requested = [],
    frames = []
  let failures = new Set(['temple-model-p', 'temple-sparkles-p'])
  for (const [name, value] of Object.entries({
    window: {},
    document: { hidden: false },
    devicePixelRatio: 1,
    requestAnimationFrame: callback => {
      frames.push(callback)
      return frames.length
    },
    cancelAnimationFrame: () => {},
  })) {
    globals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  THREE.TextureLoader.prototype.load = function load(url, onLoad, _progress, onError) {
    requested.push(url)
    const texture = new THREE.Texture({
      src: url,
      complete: true,
      naturalWidth: 256,
      width: 256,
      height: 1024,
    })
    queueMicrotask(() =>
      failures.has(url.slice('/original/'.length, -4))
        ? onError(new Error('supplied texture failure'))
        : onLoad(texture)
    )
    return texture
  }
  t.after(() => {
    THREE.TextureLoader.prototype.load = originalLoad
    for (const [name, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })
  const store = createGameStore()
  store.startMission(3)
  const nop = () => {},
    disposable = () => ({ dispose: nop, remove: nop })
  function makeScene() {
    const world = store.getWorld(),
      presentationBinding = store.bindPresentation(world),
      calls = [],
      scene = Object.assign(Object.create(GameScene.prototype), {
        world,
        started: false,
        disposed: false,
        previous: null,
        fpsGraph: null,
        frame: 0,
        terrainLoad: new AbortController(),
        renderer: {
          ...disposable(),
          domElement: disposable(),
          initTexture: texture => calls.push(['texture', texture.image.src]),
          getPixelRatio: () => 1,
        },
        unitMotion: { beforeTurn: nop, afterTurn: nop },
        projectileMotion: { beforeTurn: nop, afterTurn: nop },
        worshipPresentation: {
          handoffs: nop,
          visit: () => calls.push(['visit', store.getPresentationSnapshot().counter]),
          dispose: nop,
        },
        mini: {},
        listen: nop,
        drawMinimap: nop,
        keys: new Set(),
        ownedSounds: new Map(),
        buildingPanels: new Map(),
        objectPanels: { panels: new Map(), dispose: nop },
        cursor: { visible: false },
        scene: { remove: nop },
        globe: disposable(),
        waterMap: disposable(),
        terrainMap: disposable(),
        view: disposable(),
        tooltipElement: disposable(),
        pointerOutline: disposable(),
        spellPointer: disposable(),
        resize: { disconnect: nop },
        disposeListeners: [],
        releaseGroup: nop,
        hoveredObject: null,
        hoveredBuilding: null,
      })
    // Execute the actual constructor's binding/qualification statements.
    execute(
      constructor.body.statements
        .slice(0, 3)
        .map(node => node.getText(sceneSource))
        .join('\n'),
      { world, presentationBinding },
      scene
    )
    scene.gameClock = execute(`return ${field('gameClock')}`, {}, scene)
    scene.animate = execute(
      `return ${field('animate')}`,
      {
        syncSecondaryReservations,
        advanceGame: api.advanceGame,
        updateVehiclesFrame: nop,
        SPELLS: api.SPELLS,
        worldTooltipObject: nop,
      },
      scene
    )
    for (const name of [
      'playWorldSounds',
      'updateTerrainFrame',
      'updateDecorationsFrame',
      'updateView',
      'updateUnitsFrame',
      'renderTooltip',
      'updateEffectsFrame',
      'updateShrinesFrame',
      'updatePointerFrame',
      'updatePlacement',
      'updateSpellPointerFrame',
      'updateEnvironmentFrame',
    ])
      scene[name] = nop
    scene.updateCameraMotion = () => true
    scene.updateBuildingsFrame = () => calls.push(['world', scene.templeResourceSnapshot])
    scene.renderSceneFrame = () => calls.push(['screen', scene.templeResourceSnapshot])
    scene.updateHudFrame = nop
    execute(
      `${preload.getText(sceneSource)}\n${ready.getText(sceneSource)}`,
      {
        world,
        nativeUnits,
        vaultKnowledgeAtlas,
        templeArt,
        loadTexture,
        retryFailedTexture,
        terrain: { ready: Promise.resolve() },
      },
      scene
    )
    return { scene, calls, binding: presentationBinding }
  }
  const first = makeScene()
  await assert.rejects(first.scene.ready, /Required scene texture failed to load: temple-model-p/)
  assert.equal(first.scene.started, false)
  assert.equal(store.getPresentationSnapshot().counter, 0)
  assert.ok(requested.includes('/original/temple-sparkles-p.png'))
  first.scene.dispose()

  // The real Page retry body repeats beginLoad; texture failure follows store
  // commit and never rolls back the already published World/resource transition.
  await store.saveCheckpoint()
  const loadRequest = { current: null },
    pageEvents = []
  const bodies = ['beginLoad', 'retryLoad']
    .map(name =>
      find(pageSource, node => ts.isFunctionDeclaration(node) && node.name?.text === name).getText(
        pageSource
      )
    )
    .join('\n')
  const page = execute(
    `${bodies}\nreturn {beginLoad,retryLoad}`,
    {
      store,
      loadRequest,
      audio: { current: { reset: nop } },
      setSelectorOpen: nop,
      setMenu: nop,
      setReady: value => pageEvents.push(['ready', value]),
      setError: nop,
      setTab: nop,
      setStartup: nop,
    },
    {}
  )
  page.beginLoad({ kind: 'checkpoint' })
  const firstLoad = store.getWorld(),
    epoch = store.getPresentationSnapshot().epoch
  failures = new Set(['temple-sparkles-p'])
  const rejected = makeScene()
  await assert.rejects(
    rejected.scene.ready,
    /Required scene texture failed to load: temple-sparkles-p/
  )
  assert.equal(store.getWorld(), firstLoad)
  assert.equal(store.getPresentationSnapshot().epoch, epoch)
  rejected.scene.dispose()
  page.retryLoad()
  assert.notEqual(store.getWorld(), firstLoad)
  assert.equal(store.getPresentationSnapshot().epoch, epoch + 1)
  assert.deepEqual(pageEvents, [
    ['ready', false],
    ['ready', false],
  ])

  failures = new Set()
  const stale = makeScene()
  store.restart() // Same resource epoch, different World and binding generation.
  await stale.scene.ready
  assert.equal(stale.scene.start(), false, 'late ready cannot start the superseded Scene')
  const next = makeScene()
  await next.scene.ready
  store.getWorld().paused = true
  assert.equal(next.scene.start(), true)
  next.scene.animate(100)
  next.scene.animate(150)
  assert.ok(next.calls.some(([kind]) => kind === 'visit'))
  const snapshot = store.getPresentationSnapshot()
  assert.equal(next.calls.findLast(([kind]) => kind === 'world')[1], snapshot)
  assert.equal(next.calls.findLast(([kind]) => kind === 'screen')[1], snapshot)
  const scheduled = frames.length
  stale.scene.animate(200)
  stale.scene.dispose()
  assert.equal(store.getPresentationSnapshot(), snapshot)
  assert.equal(frames.length, scheduled, 'stale animate neither advances nor reschedules')
  assert.equal(next.binding.isCurrent(), true, 'old dispose cannot revoke the new Scene')
  next.scene.dispose()
  assert.equal(next.binding.isCurrent(), false)
  assert.equal(
    store.getPresentationSnapshot(),
    snapshot,
    'Scene disposal does not reset shared phase'
  )
})

test('actual world building caller binds the Temple shader across nine selections without changing source UVs', async () => {
  const api = await loadSceneFixture(),
    { createGameStore } = await import('../app/game-store.ts'),
    { nativeModel } = await import('../app/scene-assets.ts'),
    { templeTileOffset } = await import('../app/temple-art.ts'),
    store = createGameStore()
  store.startMission(3)
  // Supporting renderer fixture only; ordinary QA must earn and build its Temple.
  const world = store.getWorld(),
    temple = api.addBuilding(world, 'blue', 'temple', { x: 24, z: 70 }, true),
    binding = store.bindPresentation(world),
    fixture = await makeHutSmokeScene(world)
  let legacy
  try {
    fixture.scene.templeResourceSnapshot = binding.snapshot()
    fixture.render()
    const mesh = fixture.scene.buildingMeshes.get(temple.id).children[0],
      originalUV = Array.from(mesh.geometry.getAttribute('uv').array),
      shader = {
        uniforms: {},
        vertexShader: '#include <uv_vertex>\n#include <begin_vertex>',
        fragmentShader: '#include <colorspace_fragment>',
      }
    assert.equal(mesh.userData.nativeModel, 95)
    assert.equal(mesh.material.map.image.src, '/original/temple-model-p.png')
    mesh.material.onBeforeCompile(shader)
    assert.equal(shader.uniforms.templeTileOffset, mesh.userData.templeTileOffset)
    assert.match(shader.vertexShader, /if\(textureMode==32\.\) vMapUv \+= templeTileOffset/)
    const geometry = mesh.geometry
    for (let visit = 0; visit < 9; visit++) {
      const snapshot = binding.snapshot()
      fixture.scene.templeResourceSnapshot = snapshot
      fixture.render()
      assert.equal(fixture.scene.buildingMeshes.get(temple.id).children[0], mesh)
      assert.equal(mesh.geometry, geometry)
      assert.deepEqual(Array.from(mesh.geometry.getAttribute('uv').array), originalUV)
      assert.deepEqual(
        shader.uniforms.templeTileOffset.value.toArray(),
        templeTileOffset(snapshot.tile)
      )
      assert.equal(mesh.userData.templeResourceEpoch, snapshot.epoch)
      assert.equal(binding.snapshot(), snapshot, 'world render only consumes the shared selection')
      binding.advance()
    }
    legacy = nativeModel(95)
    const unchanged = {
      uniforms: {},
      vertexShader: '#include <uv_vertex>\n#include <begin_vertex>',
      fragmentShader: '#include <colorspace_fragment>',
    }
    legacy.material.onBeforeCompile(unchanged)
    assert.equal(legacy.material.map.image.src, '/original/atlas.png')
    assert.equal(unchanged.uniforms.templeTileOffset, undefined)
    assert.doesNotMatch(unchanged.vertexShader, /templeTileOffset/)
    assert.deepEqual(Array.from(legacy.geometry.getAttribute('uv').array), originalUV)
    assert.equal(legacy.material.customProgramCacheKey(), 'native-model-light')
    assert.equal(mesh.material.customProgramCacheKey(), 'native-model-light-temple')
  } finally {
    legacy?.geometry.dispose()
    legacy?.material.dispose()
    fixture.close()
    binding.release()
  }
})

test('actual Page async import and rejection callbacks cannot publish from a replaced World before cleanup', async () => {
  await loadSceneFixture()
  const { createGameStore } = await import('../app/game-store.ts'),
    store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(),
    errors = [],
    events = [],
    scene = { terrainLoad: new AbortController(), dispose: () => events.push('dispose') }
  const importCall = find(
    pageSource,
    node =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'then' &&
      node.arguments[0]?.getText(pageSource).includes('const created = new GameScene')
  )
  const catchCall = find(
    pageSource,
    node =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'catch' &&
      node.arguments[0]?.getText(pageSource).includes('scene?.dispose()')
  )
  const context = {
    disposed: false,
    world,
    store,
    scene,
    engine: { current: scene },
    viewport: { current: {} },
    minimap: { current: {} },
    portrait: { current: {} },
    selectAcquisitionPanel() {},
    measureWorshipHud() {},
    setError: message => errors.push(message),
  }
  const imported = execute(`return ${importCall.arguments[0].getText(pageSource)}`, context, {}),
    rejected = execute(`return ${catchCall.arguments[0].getText(pageSource)}`, context, {})
  store.restart()
  assert.doesNotThrow(() =>
    imported({
      GameScene: class {
        constructor() {
          events.push('construct')
          throw new Error('obsolete constructor')
        }
      },
    })
  )
  rejected(new Error('obsolete required texture rejection'))
  assert.deepEqual(events, [])
  assert.deepEqual(errors, [])
})
