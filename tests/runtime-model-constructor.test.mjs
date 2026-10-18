// Actual new GameScene constructor, field initializers and production factories.
// Only DOM/canvas, GPU renderer and texture/file IO leaves are supplied. No
// GameScene/RenderView/ScenePicking/model method or ownership helper is replaced.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import * as THREE from 'three'
const app = new URL('../app/', import.meta.url), threeURL = import.meta.resolve('three')
const gpuURL = new URL('__constructor_gpu.mjs', app).href
const parentURL = new URL('__constructor_parent.ts', app).href
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'three' && context.parentURL === new URL('scene.ts', app).href) return { url: gpuURL, shortCircuit: true }
    if (specifier === parentURL) return { url: parentURL, shortCircuit: true }
    if (specifier.startsWith('.') && context.parentURL?.startsWith(app.href)) {
      const url = new URL(specifier, context.parentURL)
      if (!/\.[a-z]+$/i.test(url.pathname) && existsSync(new URL(url.href + '.ts'))) return next(url.href + '.ts', context)
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url === gpuURL) return { format: 'module', shortCircuit: true, source: `export * from ${JSON.stringify(threeURL)}; export const WebGLRenderer = globalThis.__runtimeConstructorRenderer;` }
    if (url === parentURL || url.startsWith(app.href) && url.endsWith('.ts')) return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(url === parentURL ? new URL('./fixtures/runtime-model-pick-parent.ts.txt', import.meta.url) : new URL(url), 'utf8'), { mode: 'transform' }) }
    if (url.startsWith(app.href) && url.endsWith('.json')) return { format: 'module', shortCircuit: true, source: 'export default ' + readFileSync(new URL(url), 'utf8') }
    return next(url, context)
  },
})
const noop = () => {}
class Element extends EventTarget {
  style = {}; dataset = {}; children = []; classList = { add: noop, remove: noop, toggle: noop }
  width = 800; height = 600; clientWidth = 800; clientHeight = 600; hidden = false
  appendChild(child) { this.children.push(child); child.parentNode = this; child.parentElement = this; return child }
  append(...children) { for (const child of children) this.appendChild(child) }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this) }
  setAttribute() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight } }
  getContext(kind) {
    assert.equal(kind, '2d')
    return new Proxy({ canvas: this, measureText: text => ({ width: String(text).length * 8 }), getImageData: (_x, _y, width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }) }, { get: (target, key) => key in target ? target[key] : noop })
  }
  querySelector() { return null }
  querySelectorAll() { return [] }
  hasPointerCapture() { return false }
}
class Renderer {
  domElement = new Element(); shadowMap = {}; ratio = 1
  initTexture() {}
  setClearColor() {}
  setPixelRatio(value) { this.ratio = value }
  getPixelRatio() { return this.ratio }
  setSize(width, height) { this.domElement.clientWidth = width; this.domElement.clientHeight = height }
  getContext() { return { isContextLost: () => false } }
  copyTextureToTexture() {}
  dispose() {}
}

test('actual GameScene constructor establishes only its internal owned-model picker', async t => {
  const saved = new Map(), set = (name, value) => { saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { configurable: true, writable: true, value }) }
  const requests = [], oldLoad = THREE.TextureLoader.prototype.load
  set('__runtimeConstructorRenderer', Renderer)
  set('document', { createElement: () => new Element(), createElementNS: () => new Element(), documentElement: new Element(), body: new Element(), querySelector: () => null, hidden: false })
  set('Image', class extends EventTarget { complete = false; width = 256; height = 256 })
  set('ImageData', class { constructor(data, width, height) { Object.assign(this, { data, width, height }) } })
  set('ResizeObserver', class { observe() {} disconnect() {} })
  set('location', { search: '' }); set('devicePixelRatio', 1); set('cancelAnimationFrame', noop)
  set('fetch', async url => {
    assert.match(url, /^\/original\/[a-z-]+\.bin$/)
    requests.push(url)
    const bytes = readFileSync(new URL('../public' + url, import.meta.url))
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }
  })
  THREE.TextureLoader.prototype.load = (url, loaded) => { const texture = new THREE.Texture({ src: url, width: 256, height: 256 }); queueMicrotask(() => loaded?.(texture)); return texture }
  let scene
  t.after(() => {
    scene?.dispose(); THREE.TextureLoader.prototype.load = oldLoad
    for (const [name, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name] }
  })
  const { GameScene } = await import('../app/scene.ts')
  const { ScenePicking } = await import('../app/scene-picking.ts')
  const { ScenePicking: Parent } = await import(parentURL)
  const { createGameStore } = await import('../app/game-store.ts')
  const { updateVehiclesFrame } = await import('../app/scene-entities.ts')
  const { runtimeModelAsset } = await import('../app/owned-static-model.ts')
  const store = createGameStore(); store.startMission(2)
  const world = store.getWorld(), binding = store.bindPresentation(world)
  scene = new GameScene(document.body.appendChild(new Element()), new Element(), new Element(), world, noop, noop, undefined, binding)
  assert.equal(Object.getPrototypeOf(scene), GameScene.prototype)
  assert.equal(scene.picking.constructor, ScenePicking)
  await scene.ready
  assert.deepEqual(requests.sort(), ['/original/landscape-s.bin', '/original/waves.bin'])
  scene.updateBuildingsFrame(); updateVehiclesFrame(scene); scene.updateShrinesFrame()
  const buildings = [...scene.buildingMeshes.values()].map(group => group.children[0])
  const trees = scene.decorations.children.filter(group => group.userData.point && group.userData.point.model !== 11).map(group => group.children[0])
  const shrines = [...scene.shrineMeshes.values()].map(entry => entry.g.children[0])
  assert.ok(buildings.length && trees.length)
  assert.equal(world.vehicles.length, 0); assert.equal(scene.vehicleMeshes.size, 0)
  for (const mesh of [...buildings, ...trees]) assert.ok(runtimeModelAsset(mesh))
  for (const mesh of shrines) assert.equal(runtimeModelAsset(mesh), undefined)
  // Supply only the previous GPU submission result, through real Painter state.
  // The ownership context is the untouched constructor field initializer.
  const meshes = [...buildings, ...trees, ...shrines]
  scene.view.painter.commandsBySlot = meshes.map((mesh, i) => { scene.view.painter.ranges.set(mesh, [i, 1]); return { slot: i, alpha: false, bucket: 10, cell: i, phase: 0, object: i, face: 0, order: i } })
  const parent = new Parent(scene), generic = new ScenePicking(scene), event = { clientX: -1000000, clientY: -1000000 }
  const before = structuredClone(world)
  assert.equal(parent.pick(event), null); assert.deepEqual(world, before)
  assert.equal(scene.picking.pick(event), null); assert.deepEqual(world, before)
  assert.equal(generic.pick(event), null); assert.deepEqual(world, before)
  const owned = [...buildings, ...trees].filter(mesh => mesh.parent.visible)
  assert.ok(owned.some(mesh => !scene.picking.models.has(mesh)), 'actual constructor capability must reject at least one authored static model before full materialization')
  for (const mesh of owned) {
    assert.ok(generic.models.has(mesh), 'generic picker with the same real scene must remain eager')
    assert.deepEqual(scene.picking.model(mesh, 'complete'), parent.model(mesh, 'complete'))
  }
  for (const mesh of shrines.filter(mesh => mesh.parent.visible)) assert.ok(scene.picking.models.has(mesh), 'actual shrine remains eager in the actual owned GameScene')
  assert.deepEqual(world, before)
})
