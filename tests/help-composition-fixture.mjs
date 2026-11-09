import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createBrowserHelpArticleOwner } from '../app/help-browser-article.ts'
import { environmentForHeader } from '../app/world-environment.ts'
import { loadTexture, retryFailedTexture } from '../app/scene-assets.ts'
import { prepareHelpDocument, helpArticleAssets } from '../app/help-document.ts'
import { helpNavigationAssets, helpScrollbarAssets } from '../app/help-controls.ts'
import help from '../app/original-help.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }
const articleAssets = new Map([...Object.keys(help.topics).flatMap(topic =>
  helpArticleAssets(prepareHelpDocument(Number(topic), 640, 480, 100))),
  ...helpNavigationAssets(), ...helpScrollbarAssets()].map(asset => [asset.url, asset]))

// Substitute only DOM/GPU/loader boundaries. Actual scene-assets entries, Three
// textures, environment selection, light table, geometry and preview code run.
export function fixture(t, options = {}) {
  const state = { scale: 1, width: 640, height: 480, x: 0, y: 0, current: true,
    attached: true, lost: false, context: true, ...options }
  const calls = [], canvases = [], loads = new Map(), constants = new Map([['NO_ERROR', 0]])
  let constant = 1, object = 1, loadingCalls = 0, forbiddenCalls = 0
  const gl = new Proxy({}, { get(_, key) {
    if (/^[A-Z_0-9]+$/.test(key)) {
      if (!constants.has(key)) constants.set(key, constant++)
      return constants.get(key)
    }
    return (...args) => {
      calls.push([key, ...args])
      if (state.throwGPU?.includes(key)) throw Error(`Injected ${key} failure`)
      if (key === 'getShaderParameter' || key === 'getProgramParameter') return true
      if (key === 'getUniformLocation' || key.startsWith('create')) return { id: object++ }
      if (key === 'getParameter') return 4096
      if (key === 'getError') return 0
      if (key === 'isContextLost') return state.lost
    }
  } })
  const context2d = new Proxy({}, { get(_, key) { return (...args) => {
    calls.push([`2d:${key}`, ...args])
    if (state.throw2d?.includes(key)) throw Error(`Injected ${key} failure`)
  } } })
  class Image {
    constructor(key, width, height) {
      Object.assign(this, { src: `https://help.test/original/${key}.png`, currentSrc: '',
        naturalWidth: width, naturalHeight: height, complete: false })
    }
  }
  const document = {
    baseURI: 'https://help.test/game',
    createElement(tag) {
      assert.equal(tag, 'canvas')
      const canvas = { style: {}, width: 300, height: 150, removed: 0,
        remove() { this.removed++; if (state.throwRemove) throw Error('Injected remove failure') },
        getContext(kind) { return !state.context ? null : kind === '2d' ? context2d : gl } }
      canvases.push(canvas)
      return canvas
    },
    defaultView: {
      HTMLImageElement: Image,
      getComputedStyle(element) {
        return { transform: element === hud ? state.hudTransform ?? `matrix(${state.scale}, 0, 0, ${state.scale}, 0, 0)` : state.transform ?? 'none',
          transformOrigin: '0px 0px', borderLeftWidth: '0px', borderRightWidth: '0px',
          borderTopWidth: '0px', borderBottomWidth: '0px', paddingLeft: '0px', paddingRight: '0px',
          paddingTop: '0px', paddingBottom: '0px', getPropertyValue: () => String(state.scale) }
      },
    },
  }
  const shell = { ownerDocument: document, get isConnected() { return state.attached },
    contains: value => value === hud, getBoundingClientRect: () => ({ x: state.x, y: state.y, width: state.width, height: state.height }) }
  const hud = { ownerDocument: document, get isConnected() { return state.attached },
    getBoundingClientRect: () => ({ x: state.x, y: state.y, width: 100 * state.scale, height: state.height }) }
  const globals = new Map()
  for (const [key, value] of Object.entries({ document, Image: class {
    src = ''; naturalWidth = 0; naturalHeight = 0;
    async decode() {
      if (state.pendingDecode) await state.pendingDecode
      if (state.decodeFailure) throw state.decodeFailure
      const asset = articleAssets.get(this.src)
      assert.ok(asset, `Unexpected article asset ${this.src}`)
      this.naturalWidth = state.wrongDimensions ? 1 : asset.width
      this.naturalHeight = state.wrongDimensions ? 1 : asset.height
    }
  },
    fetch: () => { forbiddenCalls++; throw Error('No fetch allowed') },
    setInterval: () => { forbiddenCalls++; throw Error('No clock allowed') },
    requestAnimationFrame: () => { forbiddenCalls++; throw Error('No clock allowed') } })) {
    globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  }
  const loader = t.mock.method(THREE.TextureLoader.prototype, 'load', function (url, success, _, failure) {
    loadingCalls++
    const key = url.slice('/original/'.length, -4), isUnits = key === units.atlas
    const image = new Image(key, isUnits ? units.width : 256, isUnits ? units.height : 1024)
    const texture = new THREE.Texture(image)
    let disposed = 0
    texture.addEventListener('dispose', () => disposed++)
    loads.set(key, { texture, image,
      ready() { image.complete = true; success(texture) }, failure,
      get disposed() { return disposed } })
    return texture
  })
  function load(key, ready = true) {
    let entry = loadTexture(key)
    if (!loads.has(key) || entry.status !== 'loading') {
      entry.status = 'failed'
      entry = retryFailedTexture(key)
    }
    if (ready) loads.get(key).ready()
    return entry
  }
  const world = { manaWorld: { playerTribe: 0 }, turn: 77, inputMask: 123, camera: { x: 10, y: 20 } }
  const scene = { world, environment: environmentForHeader({ landscapeBank: 12, objectBank: 2 }),
    isCurrent: () => state.current, disposeListeners: [] }
  t.after(() => {
    scene.disposeListeners.forEach(listener => listener())
    loader.mock.restore()
    for (const [key, previous] of globals) {
      if (previous) Object.defineProperty(globalThis, key, previous)
      else delete globalThis[key]
    }
    assert.equal(forbiddenCalls, 0)
  })
  return { state, scene, shell, hud, calls, canvases, loads, load,
    get loadingCalls() { return loadingCalls },
    create() {
      const result = createBrowserHelpArticleOwner(scene, shell, hud)
      assert.equal(result.status, 'created', result.reason)
      return result.owner
    },
    ready() { load('atlas'); load(units.atlas) },
  }
}
