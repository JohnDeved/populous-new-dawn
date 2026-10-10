// Actual Page beginLoad/retry and GameStore World replacement, plus production
// Scene resource/preload statements. DOM/network/GPU only are supplied.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { bindSceneEnvironment, preloadScene } from './support/world-environment-scene.mjs'

test('Page switches, checkpoint Load, Restart and failed-resource retry bind each new scene independently', async t => {
  await loadSceneFixture()
  const { createGameStore } = await import('../app/game-store.ts'),
    { initializeTerrain, makeDecorations } = await import('../app/scene-terrain-runtime.ts'),
    { GameScene } = await import('../app/scene.ts'),
    store = createGameStore(), requested = [], uploaded = [], attempts = new Map(),
    originalLoad = THREE.TextureLoader.prototype.load, originalFetch = globalThis.fetch
  let failS = true
  THREE.TextureLoader.prototype.load = function (url, onLoad, _progress, onError) {
    requested.push(url)
    attempts.set(url, (attempts.get(url) ?? 0) + 1)
    const texture = new THREE.Texture({ src: url, width: 256, height: 1024 })
    queueMicrotask(() => url === '/original/atlas-s.png' && failS ? onError(new Error('controlled selected atlas failure')) : onLoad(texture))
    return texture
  }
  globalThis.fetch = async url => {
    requested.push(url)
    const bytes = readFileSync(new URL(`../public${url}`, import.meta.url))
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }
  }
  t.after(() => { THREE.TextureLoader.prototype.load = originalLoad; globalThis.fetch = originalFetch })
  const source = ts.createSourceFile('page.tsx', readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const functions = []
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && ['beginLoad', 'retryLoad'].includes(node.name?.text)) functions.push(node.getText(source))
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(functions.length, 2)
  const noop = () => {}, engine = { current: null }, loadRequest = { current: null },
    bindings = { store, engine, loadRequest, audio: { current: { reset: noop } }, cancelNearbyInput: noop, setSelectorOpen: noop, setMenu: noop, setReady: noop, setError: noop, setTab: noop, setStartup: noop },
    js = ts.transpileModule(`(function(){${functions.join('\n')}\nreturn {beginLoad,retryLoad}})`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText,
    page = new Function(...Object.keys(bindings), `return ${js}`)(...Object.values(bindings))()
  async function sceneForWorld() {
    const scene = Object.assign(Object.create(GameScene.prototype), {
      world: store.getWorld(), terrainLoad: new AbortController(), terrainTextures: null,
      terrainMap: new THREE.DataTexture(), waterMap: new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256), waterScroll: { value: 0 },
      updateTerrainTexture: noop, decorations: new THREE.Group(), renderer: { initTexture: texture => uploaded.push(texture.image.src) },
    })
    await bindSceneEnvironment(scene)
    const terrain = initializeTerrain(scene)
    // Keep the actual promise on the Scene, including its required-failure rule.
    const ready = preloadScene(scene, terrain)
    ready.catch(noop)
    return { scene, ready }
  }
  await t.test('selected atlas failure blocks readiness; real Page retry loads that resource again', async () => {
    page.beginLoad({ kind: 'mission', mission: 2 })
    const first = await sceneForWorld()
    await assert.rejects(first.ready, /Required scene texture failed to load: atlas-s/)
    first.scene.terrainLoad.abort()
    failS = false
    page.retryLoad()
    assert.notEqual(store.getWorld(), first.scene.world)
    const second = await sceneForWorld()
    await second.ready
    assert.equal(attempts.get('/original/atlas-s.png'), 2)
    assert.ok(uploaded.includes('/original/atlas-s.png'))
    assert.equal(second.scene.environment.landscape.bank, 's')
  })
  failS = false
  await t.test('M3 → M1 → M2 → checkpoint M3 → Restart retains independent frozen scene identities', async () => {
    const scenes = []
    for (const request of [{ kind: 'mission', mission: 3 }, { kind: 'mission', mission: 1 }, { kind: 'mission', mission: 2 }, { kind: 'checkpoint' }, { kind: 'restart' }]) {
      page.beginLoad(request)
      const loaded = await sceneForWorld()
      await loaded.ready
      makeDecorations(loaded.scene)
      scenes.push(loaded.scene)
      if (scenes.length === 1) await store.saveCheckpoint()
    }
    assert.deepEqual(scenes.map(scene => scene.world.outcome.level), [3, 1, 2, 3, 3])
    assert.deepEqual(scenes.map(scene => scene.environment?.landscape.bank), ['p', 'c', 's', 'p', 'p'])
    assert.deepEqual(scenes.map(scene => scene.environment.objects.bank), [6, 2, 2, 6, 6])
    for (const scene of scenes) {
      const tree = scene.world.trees.find(tree => tree.model === 3), mesh = scene.decorations.children.find(group => group.userData.point?.id === tree.id).children[0]
      assert.equal(mesh.geometry.getAttribute('position').count / 3, scene.world.outcome.level === 3 ? 29 : 81)
      assert.equal(mesh.material.map.image.src, `/original/${scene.environment.landscape.modelAtlas}.png`)
      assert.ok(!Object.hasOwn(scene.world, 'environment'), 'authored resource selection adds no mutable World/checkpoint field')
      scene.terrainLoad.abort()
    }
    assert.notEqual(scenes[3].world, scenes[4].world)
    assert.equal(scenes[0].environment.landscape.bank, 'p', 'later loading cannot mutate an earlier scene snapshot')
  })
})
