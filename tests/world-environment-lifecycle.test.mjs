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
  await t.test('actual checkpoint Load and Restart reconstruct c and s resources too', async () => {
    for (const [mission, bank] of [[1, 'c'], [2, 's']]) {
      page.beginLoad({ kind: 'mission', mission })
      await store.saveCheckpoint()
      page.beginLoad({ kind: 'mission', mission: 3 })
      page.beginLoad({ kind: 'checkpoint' })
      const loaded = await sceneForWorld()
      await loaded.ready
      assert.equal(loaded.scene.world.outcome.level, mission)
      assert.equal(loaded.scene.environment.landscape.bank, bank)
      page.beginLoad({ kind: 'restart' })
      const restarted = await sceneForWorld()
      await restarted.ready
      assert.notEqual(restarted.scene.world, loaded.scene.world)
      assert.equal(restarted.scene.environment.landscape.bank, bank)
      assert.equal(restarted.scene.environment.objects.bank, 2)
    }
  })
  await t.test('legacy M3 checkpoint retires its stored bank2 footprint before scene readiness', async () => {
    const { missionData } = await import('../app/mission-data.ts'),
      { syncLandscapeObjects } = await import('../app/world-terrain-runtime.ts'),
      { refreshSceneryShadow } = await import('../app/building-shapes.ts')
    page.beginLoad({ kind: 'mission', mission: 3 })
    const world = store.getWorld(), header = missionData(3).level, previous = header.objectBank
    // Reconstruct the legacy stored poses with the actual old bank2 caller,
    // then remove only metadata that old checkpoints did not contain.
    try {
      header.objectBank = 2
      syncLandscapeObjects(world)
      for (const pose of world.sceneryShadows.values()) delete pose.shapeIndex
    } finally { header.objectBank = previous }
    const tree = world.trees.find(tree => tree.model === 3), old = world.sceneryShadows.get(tree.id),
      visited = new Set(), blank = { flags: new Uint32Array(16384), shadows: new Uint8Array(16384) }
    refreshSceneryShadow(blank, old, index => { visited.add(index); return 0 }, noop)
    assert.equal(visited.size, 4, 'legacy mesh15 owns bank2 shape5')
    for (const index of visited) { world.land.flags[index] &= ~16; world.land.shadows[index] |= 0xa0 }
    const highBits = new Map([...visited].map(index => [index, world.land.shadows[index] & 0xf0]))
    const outside = Array.from({ length: 16384 }, (_, index) => index).find(index => !visited.has(index)), outsideValue = world.land.shadows[outside]
    await store.saveCheckpoint()
    page.beginLoad({ kind: 'checkpoint' })
    const restored = store.getWorld()
    assert.equal(restored.sceneryShadows.get(tree.id).shapeIndex, 1, 'migration reconciles before constructing a scene')
    for (const index of visited) {
      assert.ok(restored.land.flags[index] & 16, 'retirement visits the stored old footprint')
      assert.equal(restored.land.shadows[index] & 0xf0, highBits.get(index), 'preserve high shadow bits')
    }
    assert.equal(restored.land.shadows[outside], outsideValue)
    const loaded = await sceneForWorld()
    await loaded.ready
    assert.equal(loaded.scene.environment.objects.bank, 6)
    assert.equal(loaded.scene.world.sceneryShadows.get(tree.id).shapeIndex, 1)
  })
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
