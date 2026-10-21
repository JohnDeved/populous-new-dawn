// Actual new GameScene initialization, first unrendered pick, render and disposal.
// Endpoint leaves adapted from the independently reviewed runtime-model constructor fixture.
// Only DOM/canvas, GPU renderer and texture/file IO leaves are supplied. No
// GameScene/RenderView/ScenePicking/model method or ownership helper is replaced.
import assert from 'node:assert/strict'
import test from 'node:test'
import { getEventListeners } from 'node:events'
import { readFileSync, existsSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import * as THREE from 'three'
import ts from 'typescript'
import { pageNode, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'
const app = new URL('../app/', import.meta.url),
  threeURL = import.meta.resolve('three')
const gpuURL = new URL('__constructor_gpu.mjs', app).href
const parentURL = new URL('__numeric_baseline_scene.ts', app).href
const baseViewURL = new URL('__numeric_baseline_view.ts', app).href
registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier === 'three' &&
      (context.parentURL === new URL('scene.ts', app).href || context.parentURL === parentURL)
    )
      return { url: gpuURL, shortCircuit: true }
    if (specifier === parentURL || specifier === baseViewURL)
      return { url: specifier, shortCircuit: true }
    if (context.parentURL === parentURL && specifier === './render-view.ts')
      return { url: baseViewURL, shortCircuit: true }
    if (specifier.startsWith('.') && context.parentURL?.startsWith(app.href)) {
      const url = new URL(specifier, context.parentURL)
      if (!/\.[a-z]+$/i.test(url.pathname) && existsSync(new URL(url.href + '.ts')))
        return next(url.href + '.ts', context)
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url === gpuURL)
      return {
        format: 'module',
        shortCircuit: true,
        source: `export * from ${JSON.stringify(threeURL)}; export const WebGLRenderer = globalThis.__runtimeConstructorRenderer;`,
      }
    if (
      url === parentURL ||
      url === baseViewURL ||
      (url.startsWith(app.href) && url.endsWith('.ts'))
    )
      return {
        format: 'module',
        shortCircuit: true,
        source: stripTypeScriptTypes(
          readFileSync(
            url === parentURL
              ? process.env.PND_NUMERIC_BASELINE_SCENE
              : url === baseViewURL
                ? process.env.PND_TERRAIN_BASELINE
                : new URL(url),
            'utf8'
          ),
          { mode: 'transform' }
        ),
      }
    if (url.startsWith(app.href) && url.endsWith('.json'))
      return {
        format: 'module',
        shortCircuit: true,
        source: 'export default ' + readFileSync(new URL(url), 'utf8'),
      }
    return next(url, context)
  },
})
const noop = () => {}
// Node24 EventTarget does not remove boolean-capture registrations as browser
// DOM EventTarget does. Normalize the DOM boolean shorthand at this leaf.
class DomEventTarget extends EventTarget {
  addEventListener(name, listener, options) {
    super.addEventListener(name, listener, typeof options === 'boolean' ? { capture: options } : options)
  }
  removeEventListener(name, listener, options) {
    super.removeEventListener(name, listener, typeof options === 'boolean' ? { capture: options } : options)
  }
}
class Element extends DomEventTarget {
  constructor(ownerDocument = globalThis.document) {
    super()
    this.ownerDocument = ownerDocument
  }
  style = {
    getPropertyValue(name) { return this[name] ?? '' },
    getPropertyPriority() { return '' },
    setProperty(name, value) { this[name] = value },
    removeProperty(name) { delete this[name] },
  }
  dataset = {}
  children = []
  classList = { add: noop, remove: noop, toggle: noop }
  width = 800
  height = 600
  clientWidth = 800
  clientHeight = 600
  hidden = false
  appendChild(child) {
    this.children.push(child)
    child.parentNode = this
    child.parentElement = this
    return child
  }
  append(...children) {
    for (const child of children) this.appendChild(child)
  }
  remove() {
    if (this.parentNode)
      this.parentNode.children = this.parentNode.children.filter(child => child !== this)
  }
  setAttribute() {}
  getBoundingClientRect() {
    return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }
  }
  getContext(kind) {
    assert.equal(kind, '2d')
    return new Proxy(
      {
        canvas: this,
        measureText: text => ({ width: String(text).length * 8 }),
        getImageData: (_x, _y, width, height) => ({
          data: new Uint8ClampedArray(width * height * 4),
        }),
      },
      { get: (target, key) => (key in target ? target[key] : noop) }
    )
  }
  querySelector() {
    return null
  }
  querySelectorAll() {
    return []
  }
  hasPointerCapture() {
    return false
  }
}
class Renderer {
  domElement = new Element()
  shadowMap = {}
  ratio = 1
  initTexture() {}
  setClearColor() {}
  setPixelRatio(value) {
    this.ratio = value
  }
  getPixelRatio() {
    return this.ratio
  }
  setSize(width, height) {
    this.domElement.clientWidth = width
    this.domElement.clientHeight = height
  }
  getContext() {
    return { isContextLost: () => false }
  }
  copyTextureToTexture() {}
  setTransparentSort() {}
  render(scene, camera) {
    scene.onBeforeRender(this, scene, camera)
    scene.onAfterRender(this, scene, camera)
  }
  dispose() {}
}

async function constructorFixture(t) {
  const saved = new Map(),
    set = (name, value) => {
      saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
    }
  const requests = [],
    oldLoad = THREE.TextureLoader.prototype.load
  set('__runtimeConstructorRenderer', Renderer)
  // Canvas ownership and listener leaves match the browser DOM. The real
  // NeutralCanvasCursor prepares/cleans itself; no production cursor bypass.
  const doc = new DomEventTarget()
  doc.defaultView = new DomEventTarget()
  set('document', doc)
  Object.assign(doc, {
    createElement: () => new Element(doc),
    createElementNS: () => new Element(doc),
    documentElement: new Element(doc),
    body: new Element(doc),
    querySelector: () => null,
    hasFocus: () => true,
    elementFromPoint: () => null,
    hidden: false,
  })
  const decodedCursors = []
  set(
    'Image',
    class extends EventTarget {
      complete = false
      width = 256
      height = 256
      src = ''
      get naturalWidth() { return this.src === '/original/cursor-point14.png' ? 17 : 256 }
      get naturalHeight() { return this.src === '/original/cursor-point14.png' ? 17 : 256 }
      async decode() {
        assert.equal(this.src, '/original/cursor-point14.png')
        decodedCursors.push(this)
        this.complete = true
      }
      removeAttribute(name) { if (name === 'src') this.src = '' }
    }
  )
  set(
    'ImageData',
    class {
      constructor(data, width, height) {
        Object.assign(this, { data, width, height })
      }
    }
  )
  set(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
  set('location', { search: '' })
  set('devicePixelRatio', 1)
  set('cancelAnimationFrame', noop)
  set('fetch', async url => {
    assert.match(url, /^\/original\/[a-z-]+\.bin$/)
    requests.push(url)
    const bytes = readFileSync(new URL('../public' + url, import.meta.url))
    return {
      ok: true,
      arrayBuffer: async () =>
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    }
  })
  THREE.TextureLoader.prototype.load = (url, loaded) => {
    const texture = new THREE.Texture({ src: url, width: 256, height: 256 })
    queueMicrotask(() => loaded?.(texture))
    return texture
  }
  const scenes = []
  t.after(() => {
    for (const scene of scenes) scene.dispose()
    assert.ok(decodedCursors.every(image => image.src === ''), 'Disposed scenes release prepared cursor images')
    for (const name of ['pointerover', 'pointermove', 'pointerdown', 'pointerup', 'focusin', 'visibilitychange', 'keydown'])
      assert.equal(getEventListeners(doc, name).length, 0, `Disposed document listener: ${name}`)
    assert.equal(getEventListeners(doc.defaultView, 'blur').length, 0)
    THREE.TextureLoader.prototype.load = oldLoad
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })

  const { GameScene } = await import('../app/scene.ts')
  return { GameScene, set, doc, scenes, requests, decodedCursors }
}

test('real constructor owns first null-index query, production render and permanent disposal', async t => {
  const { GameScene, doc, scenes, requests, decodedCursors } = await constructorFixture(t)
  const BaselineScene = process.env.PND_NUMERIC_BASELINE_SCENE
    ? (await import(parentURL)).GameScene
    : GameScene
  const { createGameStore } = await import('../app/game-store.ts')
  const { runtimeTerrainPicking, releaseRuntimeTerrainPicking } =
    await import('../app/runtime-terrain-picking.ts')
  const { createOrdinaryTerrainMetrics } = await import('../app/ordinary-terrain-metrics.ts')
  const make = async Type => {
    const store = createGameStore()
    store.startMission(2)
    const world = store.getWorld(),
      binding = store.bindPresentation(world)
    const scene = new Type(
      document.body.appendChild(new Element()),
      new Element(),
      new Element(),
      world,
      noop,
      noop,
      undefined,
      binding
    )
    scenes.push(scene)
    await scene.ready
    return scene
  }
  const base = await make(BaselineScene),
    scene = await make(GameScene)
  assert.equal(decodedCursors.length, BaselineScene === GameScene ? 2 : 1)
  assert.equal(getEventListeners(doc, 'pointermove').length, decodedCursors.length)
  if (BaselineScene === GameScene) releaseRuntimeTerrainPicking(base.view)
  assert.equal(Object.getPrototypeOf(scene), GameScene.prototype)
  assert.equal(runtimeTerrainPicking(scene.view, scene.terrain), true)
  assert.equal(scene.terrain.geometry.getAttribute('position').count, 128 * 128 * 6)
  assert.equal(base.terrain.geometry.index, null)
  assert.equal(scene.terrain.geometry.index, null)
  assert.equal(scene.view.ordinaryNumericProjection, null)
  assert.deepEqual(requests.sort(), [
    '/original/landscape-s.bin',
    '/original/landscape-s.bin',
    '/original/waves.bin',
    '/original/waves.bin',
  ])
  const normal = c => (c ? { ...c, object: 'terrain' } : null)
  const state = s => ({
    index: s.terrain.geometry.index ? Array.from(s.terrain.geometry.index.array) : null,
    count: s.terrain.count,
    draw: { ...s.terrain.geometry.drawRange },
    matrices: Array.from(s.terrain.instanceMatrix.array),
  })
  const event = { clientX: 352, clientY: 276 },
    before = structuredClone(scene.world)
  // Nothing has rendered. Both inputs must prepare their own absent index.
  const bm = createOrdinaryTerrainMetrics(true),
    cm = createOrdinaryTerrainMetrics(true)
  assert.deepEqual(
    scene.pick(event, { ordinaryTerrain: cm }),
    base.pick(event, { ordinaryTerrain: bm })
  )
  assert.ok(scene.terrain.geometry.index)
  assert.ok(scene.view.ordinaryNumericProjection)
  assert.ok(cm.visibility.indexEntriesWritten > 0)
  assert.deepEqual(
    [cm.projectedVertices, cm.visitedTriangles, cm.visibility],
    [bm.projectedVertices, bm.visitedTriangles, bm.visibility]
  )
  assert.deepEqual(state(scene), state(base))
  const ordered = () => {
    const expected = base.view.pickCandidates(base.mouse, [base.terrain], base.camera)
    const actual = scene.view.pickCandidateQuery(
      scene.mouse,
      [scene.terrain],
      scene.camera,
      false,
      undefined,
      undefined,
      true
    )
    assert.deepEqual(actual.map(normal), expected.map(normal))
    assert.deepEqual(
      normal(scene.view.resolvePickCandidates(actual)),
      normal(base.view.resolvePickCandidates(expected))
    )
    return [actual, structuredClone(actual.map(normal))]
  }
  const held = ordered()
  for (const s of [base, scene]) {
    s.view.prepare(s.scene)
    s.view.painter.render(s.renderer, s.scene, s.camera)
  }
  assert.ok(scene.view.painter.commandsBySlot.some(Boolean))
  for (const s of [base, scene]) s.view.update(800, 600, { x: 124, z: -124 }, 2, 1, false)
  // New view, still previous-rendered Painter, no intervening water/render.
  assert.deepEqual(scene.pick(event), base.pick(event))
  ordered()
  assert.deepEqual(state(scene), state(base))
  assert.deepEqual(held[0].map(normal), held[1])
  assert.deepEqual(scene.world, before)
  scene.dispose()
  assert.equal(runtimeTerrainPicking(scene.view, scene.terrain), false)
  assert.equal(scene.view.ordinaryNumericProjection, null)
  assert.equal(scene.view.ordinaryPickScratch, null)
  scenes.splice(scenes.indexOf(scene), 1)
})

// Execute the actual Home creation effect with only its async module-import leaf
// supplied. GameScene construction, readiness, start, store and camera methods
// are unchanged; DOM/GPU/file leaves use the constructor fixture above.
async function homeConstructorFixture(t) {
  const f = await constructorFixture(t)
  const { createGameStore } = await import('../app/game-store.ts')
  const { advanceGame } = await import('../app/game-clock.ts')
  const { browserPosition } = await import('../app/model.ts')
  f.set('window', f.doc.defaultView)
  window.innerWidth = 1200
  f.doc.documentElement.clientWidth = 1200
  f.set('addEventListener', window.addEventListener.bind(window))
  f.set('removeEventListener', window.removeEventListener.bind(window))
  f.set('requestAnimationFrame', () => 1)
  // The supplied 2D canvas ignores transforms; no minimap pixels are asserted.
  f.set('DOMMatrix', class { inverse() { return this } })
  const effect = pageNode(node => ts.isCallExpression(node) &&
    node.expression.getText(pageSource) === 'useEffect' &&
    node.arguments[0]?.getText(pageSource).includes('const created = new GameScene'))
  const source = effect.arguments[0].getText(pageSource)
  assert.equal(source.split("import('./scene')").length, 2, 'one real module-import leaf')
  const store = createGameStore(), cleanups = []
  t.after(() => { for (const cleanup of cleanups) cleanup() })
  const mount = async () => {
    const world = store.getWorld(), engine = { current: null }, errors = []
    let ready = false
    const cleanup = evaluatePage(source.replace("import('./scene')", 'loadScene()'), {
      startup: 'playing', world, store, engine, loadScene: async () => ({ GameScene: f.GameScene }),
      viewport: { current: document.body.appendChild(new Element()) },
      minimap: { current: new Element() }, portrait: { current: new Element() },
      gamePreferencesRef: { current: { rotation: 'cursor', flipRotation: false } },
      tooltipSession: { current: undefined }, audio: { current: null },
      measureWorshipHud: noop, update: noop, flushSync: callback => callback(),
      setTab: noop, setHover: noop, setHudCamera: noop,
      setReady: value => { ready = value }, setError: error => errors.push(error),
    })()
    cleanups.push(cleanup)
    for (let attempts = 0; !ready && !errors.length && attempts < 20; attempts++)
      await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(errors, [])
    assert.equal(ready, true, 'Home readiness callback starts the replacement Scene')
    const scene = engine.current
    assert.equal(Object.getPrototypeOf(scene), f.GameScene.prototype)
    assert.equal(scene.started, true)
    f.scenes.push(scene)
    return { scene, cleanup }
  }
  const pointer = (type, values = {}) => {
    const event = new Event(type)
    Object.defineProperties(event, Object.fromEntries(Object.entries({
      pointerType: 'mouse', clientX: 0, clientY: 300, buttons: 0, relatedTarget: null, ...values,
    }).map(([key, value]) => [key, { value }])))
    window.dispatchEvent(event)
  }
  return { ...f, store, mount, pointer, advanceGame, browserPosition }
}

for (const mode of ['ground', 'stable-overview', 'overview-exit']) {
  test(`Home fresh Scene retains ${mode} checkpoint at its first sub-tick preview and controller visit`, async t => {
    const f = await homeConstructorFixture(t), world = f.store.getWorld()
    world.speed = 0; world.inputMask = 0; world.flyby.flags = 0
    const original = await f.mount(), scene = original.scene
    if (mode !== 'ground') {
      scene.overview()
      for (let visits = 0; scene.overviewStage && visits < 80; visits++)
        f.advanceGame(world, scene.gameClock, 1 / 24)
      assert.equal(scene.overviewActive, true)
      assert.equal(scene.overviewStage, null)
      assert.equal(world.drawMode, 2)
      if (mode === 'overview-exit') scene.leaveOverview(0)
    }
    f.pointer('pointermove')
    assert.equal(world.cameras.input.buttons, mode === 'overview-exit' ? 0 : 4)
    f.advanceGame(world, scene.gameClock, 1 / 96)
    assert.ok(world.cameras.navigationTime > 0 && world.cameras.time < 1 / 24)
    await f.store.saveCheckpoint()
    const saved = structuredClone(world.cameras)
    const preview = s => {
      const before = structuredClone(s.world.cameras)
      s.updateCameraMotion()
      assert.deepEqual(s.world.cameras, before, 'render prediction cannot change pose, phase, cursor or time')
      return { point: { ...s.viewPoint }, bearing: s.cameraBearing,
        globe: s.view.globeBlend, flat: s.view.globeFlatScale }
    }
    const first = preview(scene)
    if (mode === 'ground') assert.notDeepEqual(first.point,
      f.browserPosition(scene.cameraPosition),
      'saved stationary edge input must produce a fractional first preview')
    f.advanceGame(world, scene.gameClock, 1 / 32)
    const afterVisit = { preview: preview(scene), cameras: structuredClone(world.cameras) }
    f.pointer('pointerout')
    assert.equal(world.cameras.input.pointer, null)
    assert.equal(world.cameras.input.buttons, 0)
    const released = { preview: preview(scene), cameras: structuredClone(world.cameras) }
    original.cleanup()
    assert.equal(f.store.loadCheckpoint(), true)
    const fresh = await f.mount(), loaded = fresh.scene.world
    assert.deepEqual(loaded.cameras, saved, 'Home creation/start must retain the loaded camera phase')
    assert.deepEqual(preview(fresh.scene), first, 'first fresh-Scene preview before any new input/controller visit')
    f.advanceGame(loaded, fresh.scene.gameClock, 1 / 32)
    assert.deepEqual({ preview: preview(fresh.scene), cameras: loaded.cameras }, afterVisit)
    f.pointer('pointerout')
    assert.deepEqual({ preview: preview(fresh.scene), cameras: loaded.cameras }, released)
    fresh.cleanup()
  })
}

test('Home still starts the fresh tutorial overview request', async t => {
  const f = await homeConstructorFixture(t)
  f.store.startMission(79)
  const world = f.store.getWorld()
  assert.equal(world.drawMode, 2)
  assert.equal(world.cameras.overviewActive, false)
  const { scene } = await f.mount()
  assert.equal(scene.overviewStage, 'enter')
})
