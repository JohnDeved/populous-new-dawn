import assert from 'node:assert/strict'
import test from 'node:test'
import { observeGameplayResources, captureRetiredGameplayScene, summarizeResourceRestart } from '../scripts/tutorial-browser/gameplay-resource-observer.mjs'

const live = (turn, timestampMs) => ({ level: 2, turn, timestampMs, timeOriginUnixMs: 100, sceneUuid: timestampMs < 2000 ? 'old-scene' : 'replacement-scene',
  paused: false, inputMask: 0, speed: 1, visibility: 'visible', disposed: false,
  aborted: false, canvasConnected: true, connectedBattlefieldCanvases: 1, contextLost: false,
  rendererGeometries: 4, rendererTextures: 3, rendererPrograms: 2,
  reachableGeometryIds: ['shared-geometry', `owned-${timestampMs}`],
  reachableTextureIds: ['shared-texture'], reachableMaterialIds: [`material-${timestampMs}`] })
const retired = () => ({ disposed: true, aborted: true, canvasConnected: false,
  contextLost: true, ownedSoundCount: 0, buildingPanelCount: 0, fpsGraphReleased: true })

test('one live same-document restart reports identity reuse, not cache totals or bytes', () => {
  const result = summarizeResourceRestart(live(40, 1000), retired(), live(1, 2000), live(25, 4000))
  assert.equal(result.reusedReachableGeometryIdentities, 1)
  assert.equal(result.reusedReachableTextureIdentities, 1)
  assert.equal(result.memoryBytes, 'not-measured')
  assert.equal(result.cacheAccounting, 'not-measured-private-module-caches')
})

test('zero reuse remains zero observation, not an invented cache acceptance', () => {
  const before = live(40, 1000), after = live(1, 2000)
  after.reachableGeometryIds = ['other-geometry']; after.reachableTextureIds = ['other-texture']
  const result = summarizeResourceRestart(before, retired(), after, live(25, 4000))
  assert.equal(result.reusedReachableGeometryIdentities, 0)
  assert.equal(result.reusedReachableTextureIdentities, 0)
  assert.equal(result.cacheAccounting, 'not-measured-private-module-caches')
})

test('reject inactive/reloaded/nonadvancing/undisposed/duplicate-canvas evidence', () => {
  for (const mutate of [
    data => { data[1].disposed = false }, data => { data[1].canvasConnected = true },
    data => { data[1].contextLost = false }, data => { data[1].ownedSoundCount = 1 },
    data => { data[2].timeOriginUnixMs++ }, data => { data[3].turn = data[2].turn },
    data => { data[3].paused = true }, data => { data[2].connectedBattlefieldCanvases = 2 },
    data => { delete data[2].timeOriginUnixMs }, data => { data[2].timestampMs = NaN },
    data => { data[2].rendererTextures = null }, data => { data[2].rendererTextures = 0 },
    data => { data[2].sceneUuid = data[0].sceneUuid }, data => { data[3].sceneUuid = 'unexpected-scene' }, data => { data[2].reachableTextureIds = [{}] },
  ]) {
    const data = [live(40, 1000), retired(), live(1, 2000), live(25, 4000)]
    mutate(data); assert.throws(() => summarizeResourceRestart(...data))
  }
})

test('retirement sampling removes aliases on success and thrown resource read', () => {
  const original = globalThis.window
  try {
    for (const fail of [false, true]) {
      globalThis.window = { testSceneRef: {}, testStore: {}, testScene: {
        disposed: true, terrainLoad: { signal: { aborted: true } },
        renderer: { domElement: { isConnected: false }, getContext() {
          if (fail) throw Error('unavailable context'); return { isContextLost: () => true }
        } }, ownedSounds: new Map(), buildingPanels: new Map(), fpsGraph: null,
      } }
      if (fail) assert.throws(captureRetiredGameplayScene, /unavailable context/)
      else assert.deepEqual(captureRetiredGameplayScene(), retired())
      assert.deepEqual(globalThis.window, {})
    }
  } finally {
    if (original === undefined) delete globalThis.window
    else globalThis.window = original
  }
})

test('scene observer returns only serializable primitives, deduplicates shared identities', () => {
  const oldWindow = globalThis.window, oldDocument = globalThis.document
  const texture = { isTexture: true, uuid: 'shared-texture' }
  const object = { geometry: { uuid: 'geometry' }, material: { uuid: 'material', map: texture } }
  const world = { outcome: { level: 2 }, turn: 2, paused: false, inputMask: 0, speed: 1 }
  const scene = { world, disposed: false, terrainLoad: { signal: { aborted: false } },
    scene: { uuid: 'scene', traverse(fn) { fn(object); fn(object) } },
    renderer: { domElement: { isConnected: true }, getContext: () => ({ isContextLost: () => false }),
      info: { memory: { geometries: 1, textures: 1 }, programs: [] } } }
  try {
    globalThis.window = { testScene: scene, testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
    globalThis.document = { visibilityState: 'visible', querySelectorAll: () => [1] }
    const result = observeGameplayResources()
    assert.deepEqual(result, JSON.parse(JSON.stringify(result)))
    assert.deepEqual(result.reachableTextureIds, ['shared-texture'])
    assert.deepEqual(result.reachableGeometryIds, ['geometry'])
    assert.deepEqual(Object.keys(window).sort(), ['testScene', 'testSceneRef', 'testStore'])
  } finally {
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument
  }
})
