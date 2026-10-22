import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createBrowserHelpPreviewOwner } from '../app/help-browser-preview.ts'
import { readBrowserHelpFrame, sameBrowserHelpFrame } from '../app/help-browser-frame.ts'
import { helpPanelLayout } from '../app/help-layout.ts'
import { environmentForHeader } from '../app/world-environment.ts'
import { getBrowserModelSunlightShades } from '../app/model-lighting.ts'
import { loadTexture, retryFailedTexture, peekLoadedSceneTexture } from '../app/scene-assets.ts'
import { createHelpVehicleCanvas } from '../app/help-preview-vehicle-canvas.ts'
import { prepareHelpVehicle } from '../app/help-preview-vehicle.ts'
import { helpPreview } from '../app/help-preview.ts'
import help from '../app/original-help.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }

const animation = { counter: 0, phase: { counter: 0, frame: 0 } }
const descriptor = kind => Object.values(help.topics).find(topic => topic.illustration.kind === kind).illustration
const boat = descriptor(2), follower = descriptor(0)

// Substitute only DOM/GPU/loader boundaries. Actual scene-assets entries, Three
// textures, environment selection, light table, geometry and preview code run.
function fixture(t, options = {}) {
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
  for (const [key, value] of Object.entries({ document,
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
      const result = createBrowserHelpPreviewOwner(scene, shell, hud)
      assert.equal(result.status, 'created', result.reason)
      return result.owner
    },
    ready() { load('atlas'); load(units.atlas) },
  }
}

test('one measured full-shell integer frame feeds original pane layout and uniform article placement', t => {
  const f = fixture(t)
  const plain = readBrowserHelpFrame(f.shell, f.hud).frame
  assert.deepEqual([plain.width, plain.height, plain.hudWidth], [640, 480, 100])
  assert.deepEqual(plain.preview, { x: 154, y: 262, width: 192, height: 160 })
  assert.equal(Object.isFrozen(plain), true)
  Object.assign(f.state, { width: 913, height: 701, scale: 1.3, x: 17.25, y: 4.5 })
  const scaled = readBrowserHelpFrame(f.shell, f.hud).frame
  assert.deepEqual([scaled.width, scaled.height, scaled.hudWidth], [702, 539, 100])
  assert.deepEqual(scaled.preview, helpPanelLayout(702, 539, 100).inner.preview)
  assert.deepEqual(scaled.articleStyle, { position: 'absolute', left: 0, top: 0, width: 702, height: 539,
    transformOrigin: 'top left', transform: 'scale(1.3)' })
  f.state.width += 0.1
  const smallResize = readBrowserHelpFrame(f.shell, f.hud).frame
  assert.equal(smallResize.width, scaled.width)
  assert.equal(sameBrowserHelpFrame(scaled, smallResize), false)
  Object.assign(f.state, { width: 1066.6666666667, height: 800, scale: 5 / 3,
    hudTransform: 'matrix(1.66667, 0, 0, 1.66667, 0, 0)' })
  const repeating = readBrowserHelpFrame(f.shell, f.hud)
  assert.equal(repeating.status, 'ready')
  assert.deepEqual([repeating.frame.width, repeating.frame.height, repeating.frame.hudWidth], [640, 480, 100])
})

test('zero, unsupported mapping and oversized full frames fail closed', t => {
  const f = fixture(t)
  for (const patch of [{ width: 0 }, { height: 0 }, { scale: 0 }, { scale: NaN }, { scale: 9 },
    { width: 100 }, { width: 4097 }, { width: 4096, height: 1025 }, { attached: false }, { transform: 'scale(2)' }]) {
    Object.assign(f.state, { width: 640, height: 480, scale: 1, attached: true, transform: 'none' }, patch)
    assert.equal(readBrowserHelpFrame(f.shell, f.hud).status, 'unavailable', JSON.stringify(patch))
  }
  assert.equal(f.loadingCalls, 0)
  Object.assign(f.state, { width: 640, height: 480, scale: 1, attached: true, transform: 'none' })
  for (const transform of ['matrix(1, 0, 0.01, 1, 0, 0)', 'matrix(1, 0, 0, 1, 1, 0)',
    'matrix(1, 0, 0, 2, 0, 0)', 'matrix(-1, 0, 0, -1, 0, 0)']) {
    f.state.hudTransform = transform
    assert.equal(readBrowserHelpFrame(f.shell, f.hud).reason, 'unsupported-help-hud-transform')
  }
})

test('cache-only reader neither loads missing/loading/failed images nor loses cache entry identity', t => {
  const f = fixture(t)
  assert.equal(peekLoadedSceneTexture('help-test-never-loaded'), null)
  const entry = f.load('atlas', false), loads = f.loadingCalls
  assert.equal(peekLoadedSceneTexture('atlas'), null)
  f.loads.get('atlas').ready()
  assert.equal(peekLoadedSceneTexture('atlas'), entry)
  assert.equal(peekLoadedSceneTexture('atlas').texture, f.loads.get('atlas').texture)
  entry.status = 'failed'
  assert.equal(peekLoadedSceneTexture('atlas'), null)
  assert.equal(f.loadingCalls, loads)
})

test('policy identity comes from successful owned GPU setup and binds sampled streams', t => {
  const f = fixture(t); f.ready()
  const owner = f.create(), snapshot = owner.sample().snapshot
  assert.equal(Object.isFrozen(owner.policy), true)
  assert.deepEqual(owner.policy, { kind: 'browser-help-full-frame-v1', coordinates: 'full-article-logical-origin',
    personSpriteMode: 0, profile: 'linear-argb4444-alpha2', vertexShiftX: 0, vertexShiftY: 0 })
  assert.equal(snapshot.policy, owner.policy)
  assert.equal(snapshot.person.context.spriteMode, 0)
  assert.equal(snapshot.vehicle.context.presentationPolicy, owner.policy)
  assert.equal(snapshot.vehicle.context.shadeTable, getBrowserModelSunlightShades())
  assert.equal(snapshot.lighting, 'browser-current-static')
  assert.equal(Object.isFrozen(snapshot.vehicle.context), true)
  const request = helpPreview(boat, { ...animation, pane: snapshot.frame.preview }).request
  assert.equal(prepareHelpVehicle(request, snapshot.vehicle.context).status, 'prepared')
  assert.equal(prepareHelpVehicle(request, { ...snapshot.vehicle.context, vertexShiftX: -0 }).reason, 'vehicle-policy-context-mismatch')
  const other = createHelpVehicleCanvas().renderer
  assert.notEqual(other.presentationPolicy, owner.policy)
  assert.equal(other.draw(request, snapshot.vehicle.context, f.loads.get('atlas').image).reason, 'vehicle-policy-owner-mismatch')
  other.dispose()
})

test('person and vehicle draw from exact cached images in full article coordinates without World or clock changes', t => {
  const f = fixture(t); f.ready()
  const owner = f.create(), snapshot = owner.sample().snapshot, before = structuredClone(f.scene.world), loads = f.loadingCalls
  assert.equal(owner.drawPerson(snapshot, follower, animation).status, 'drawn')
  assert.equal(owner.personCanvas.width, 640)
  assert.equal(owner.personCanvas.height, 480)
  assert.ok(f.calls.some(call => call[0] === '2d:drawImage' && call[1] === f.loads.get(units.atlas).image))
  assert.equal(owner.drawVehicle(snapshot, boat, animation).status, 'drawn')
  assert.ok(f.calls.some(call => call[0] === 'texImage2D' && call.at(-1) === f.loads.get('atlas').image))
  assert.equal(owner.vehicleCanvas.style.width, '640px')
  assert.equal(owner.vehicleCanvas.style.height, '480px')
  assert.deepEqual(f.scene.world, before)
  assert.equal(f.loadingCalls, loads)
})

test('current player is resampled while old samples, scene generations and foreign snapshots are rejected', t => {
  const f = fixture(t); f.ready()
  const owner = f.create(), first = owner.sample().snapshot
  f.scene.world.manaWorld.playerTribe = 3
  assert.equal(owner.drawPerson(first, follower, animation).reason, 'help-snapshot-stale')
  const next = owner.sample().snapshot
  assert.equal(next.player, 3); assert.equal(next.person.context.player, 3); assert.equal(next.vehicle.context.player, 3)
  assert.equal(owner.drawVehicle(next, boat, animation).status, 'drawn')
  assert.equal(owner.drawPerson({ ...next }, follower, animation).reason, 'help-snapshot-owner-mismatch')
  f.state.current = false
  assert.equal(owner.drawVehicle(next, boat, animation).reason, 'help-scene-owner-stale')
  f.state.current = true
  f.scene.world = { ...f.scene.world }
  assert.equal(owner.sample().reason, 'help-scene-owner-stale')
})

test('all supported landscape/object banks retain actual atlas/environment identity, unsupported selectors never fall back', t => {
  const f = fixture(t); f.ready(); f.load('atlas-s'); f.load('atlas-p')
  for (const landscapeBank of [12, 28, 25]) for (const objectBank of [0, 2, 6]) {
    f.scene.environment = environmentForHeader({ landscapeBank, objectBank })
    const owner = f.create(), snapshot = owner.sample().snapshot
    assert.equal(snapshot.environment, f.scene.environment)
    assert.equal(snapshot.vehicle.context.objectBank, objectBank === 6 ? 6 : 2)
    assert.equal(owner.drawVehicle(snapshot, boat, animation).status, 'drawn')
    assert.equal(f.calls.filter(call => call[0] === 'texImage2D').at(-1).at(-1), f.loads.get(f.scene.environment.landscape.modelAtlas).image)
    owner.dispose()
  }
  for (const header of [{ landscapeBank: 1, objectBank: 2 }, { landscapeBank: 12, objectBank: 7 }]) {
    f.scene.environment = environmentForHeader(header)
    const owner = f.create()
    assert.equal(owner.sample().reason, 'help-environment-unsupported')
    owner.dispose()
  }
})

test('missing or loading atlases are separate unavailable resources and sampling never starts a loader', t => {
  const f = fixture(t); f.load('atlas', false); f.load(units.atlas, false)
  const owner = f.create(), loads = f.loadingCalls
  const waiting = owner.sample().snapshot
  assert.equal(waiting.person.status, 'unavailable'); assert.equal(waiting.vehicle.status, 'unavailable')
  f.loads.get('atlas').ready()
  const vehicleOnly = owner.sample().snapshot
  assert.equal(vehicleOnly.person.status, 'unavailable'); assert.equal(vehicleOnly.vehicle.status, 'available')
  assert.equal(owner.drawVehicle(vehicleOnly, boat, animation).status, 'drawn')
  assert.equal(owner.drawPerson(vehicleOnly, follower, animation).status, 'unavailable')
  assert.equal(f.loadingCalls, loads)
})

test('cache entry, texture, image, source and decoded dimensions are all revalidated before drawing', t => {
  const f = fixture(t); f.ready()
  const owner = f.create()
  for (const mutate of [
    () => { f.loads.get('atlas').image.complete = false },
    () => { f.loads.get('atlas').image.naturalWidth = 255 },
    () => { f.loads.get('atlas').image.currentSrc = 'https://help.test/substituted.png' },
    () => { const entry = loadTexture('atlas'); entry.texture.image = { ...entry.texture.image } },
    () => { const entry = loadTexture('atlas'); entry.texture = entry.texture.clone() },
    () => { loadTexture('atlas').status = 'failed'; retryFailedTexture('atlas'); f.loads.get('atlas').ready() },
  ]) {
    f.load('atlas')
    const snapshot = owner.sample().snapshot, beforeDraws = f.calls.filter(call => call[0] === 'drawArrays').length
    mutate()
    assert.equal(owner.drawVehicle(snapshot, boat, animation).reason, 'help-vehicle-atlas-stale')
    assert.equal(f.calls.filter(call => call[0] === 'drawArrays').length, beforeDraws)
  }
})

test('changed or zero viewport clears old draws and requires a common fresh frame even when rounded dimensions match', t => {
  const f = fixture(t); f.ready()
  const owner = f.create(), old = owner.sample().snapshot
  assert.equal(owner.drawVehicle(old, boat, animation).status, 'drawn')
  f.state.width += 0.1
  assert.equal(owner.drawVehicle(old, boat, animation).reason, 'help-snapshot-stale')
  const next = owner.sample().snapshot
  assert.equal(next.frame.width, old.frame.width)
  assert.equal(owner.drawVehicle(next, boat, animation).status, 'drawn')
  f.state.width = 0
  assert.equal(owner.drawPerson(next, follower, animation).status, 'unavailable')
  assert.ok(f.calls.some(call => call[0] === 'clear'))
})

test('disposal is idempotent, unregisters safely and cannot revive on late cached readiness', t => {
  const f = fixture(t); f.ready()
  const owner = f.create(), snapshot = owner.sample().snapshot
  const images = [...f.loads.values()], priorDisposals = images.map(image => image.disposed)
  let after = 0
  f.scene.disposeListeners.push(() => after++)
  f.scene.disposeListeners.forEach(listener => listener())
  assert.equal(after, 1)
  const deletes = f.calls.filter(call => call[0].startsWith('delete')).length
  owner.dispose(); owner.clear()
  f.loads.get('atlas').ready()
  assert.equal(owner.sample().reason, 'help-scene-owner-stale')
  assert.equal(owner.drawVehicle(snapshot, boat, animation).reason, 'help-snapshot-owner-mismatch')
  assert.equal(f.calls.filter(call => call[0].startsWith('delete')).length, deletes)
  assert.deepEqual(images.map(image => image.disposed), priorDisposals)
  assert.equal(owner.personCanvas.width, 1); assert.equal(owner.vehicleCanvas.width, 1)
  assert.equal(owner.personCanvas.removed, 1); assert.equal(owner.vehicleCanvas.removed, 1)
})

test('injected clear, GPU disposal and DOM removal errors cannot interrupt scene cleanup or resurrect the owner', t => {
  const f = fixture(t); f.ready()
  const owner = f.create(), snapshot = owner.sample().snapshot
  owner.drawVehicle(snapshot, boat, animation)
  Object.assign(f.state, { throwGPU: ['clear', 'useProgram', 'deleteProgram'], throw2d: ['clearRect'], throwRemove: true })
  let laterListener = 0
  f.scene.disposeListeners.push(() => laterListener++)
  assert.doesNotThrow(() => f.scene.disposeListeners.forEach(listener => listener()))
  assert.equal(laterListener, 1)
  assert.ok(f.calls.some(call => call[0] === 'deleteBuffer'))
  assert.ok(f.calls.some(call => call[0] === 'deleteTexture'))
  assert.ok(f.calls.some(call => call[0] === 'deleteVertexArray'))
  assert.equal(owner.personCanvas.removed, 1); assert.equal(owner.vehicleCanvas.removed, 1)
  assert.equal(owner.personCanvas.width, 1); assert.equal(owner.vehicleCanvas.width, 1)
  assert.deepEqual(owner.disposalFailures.map(failure => failure.operation).sort(), [
    'help-clear-person', 'help-clear-vehicle', 'help-remove-person', 'help-remove-vehicle',
    'vehicle-unbind-program', 'vehicle-delete-program',
  ].sort())
  assert.equal(Object.isFrozen(owner.disposalFailures), true)
  const count = f.calls.length
  owner.dispose(); owner.clear()
  f.loads.get('atlas').ready()
  assert.equal(owner.sample().status, 'unavailable')
  assert.equal(owner.drawVehicle(snapshot, boat, animation).status, 'unavailable')
  assert.equal(f.calls.length, count)
})

test('missing GPU/scene owners fail closed and new context does not promote unsupported dispatch categories', t => {
  const f = fixture(t); f.ready()
  assert.equal(createBrowserHelpPreviewOwner(null, f.shell, f.hud).status, 'unavailable')
  f.state.context = false
  assert.equal(createBrowserHelpPreviewOwner(f.scene, f.shell, f.hud).status, 'unavailable')
  f.state.context = true
  const owner = f.create(), snapshot = owner.sample().snapshot
  const counts = { 'native-empty': 0, ready: 0, unsupported: 0 }
  for (const topic of Object.values(help.topics)) {
    const result = helpPreview(topic.illustration, { ...animation, pane: snapshot.frame.preview,
      person: snapshot.person.context, treeVariant: 0 })
    counts[result.status]++
    if (![0, 2].includes(topic.illustration.kind)) {
      assert.equal(owner.drawPerson(snapshot, topic.illustration, animation).status, 'unavailable')
      assert.equal(owner.drawVehicle(snapshot, topic.illustration, animation).status, 'unavailable')
    }
  }
  assert.deepEqual(counts, { 'native-empty': 34, ready: 8, unsupported: 46 })
  assert.equal(owner.drawPerson(snapshot, follower, { counter: 0, phase: { counter: 0, frame: -1 } }).reason,
    'help-animation-input-invalid')
})
