// Failure-first composed callers using actual authored mission data. Supplies
// network/GPU boundaries, not terrain/resource/model/picking/shadow decisions.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { loadSceneFixture, makeSceneFixture } from './support/bloodlust-scene.mjs'
import { bindSceneEnvironment, preloadScene } from './support/world-environment-scene.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const terrainHashes = {
  c: '8b23328932f2aeac33a0ce65e64cc0ab9bc110fe35a812b1d53ab81f9e68f68f',
  s: 'e4bbc3509b7eae22ed24648e0a7161ba940a723de1720a9ff479e842075aaaac',
  p: 'a07fc142b38441dd65bc99e55e2eb8f33a6423b4d02b3662f3be78e4eb4880f9',
}
const asset = name => readFileSync(new URL(`../public/original/${name}`, import.meta.url))
const arrayBuffer = bytes => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
const nop = () => {}

test('authored scene callers select independent terrain and full ordinary model resources', async t => {
  const api = await loadSceneFixture(),
    { initializeTerrain } = await import('../app/scene-terrain-runtime.ts'),
    { GameScene } = await import('../app/scene.ts'),
    { missionData } = await import('../app/mission-data.ts')
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  for (const [mission, bank, objectBank, override] of [[3, 'p', 6], [1, 'c', 2], [2, 's', 2], [10, 'p', 2], [5, 'c', 6], [3, 'c', 6, 255]]) {
    await t.test(`mission ${mission}, landscape ${bank}, objects ${objectBank}${override ? ' (controlled unsupported header)' : ''}`, async () => {
      const level = missionData(mission).level, previous = level.landscapeBank
      if (override) level.landscapeBank = override
      const world = api.createWorld(mission), fixture = await makeSceneFixture(world), { scene } = fixture
      Object.setPrototypeOf(scene, GameScene.prototype)
      Object.assign(scene, {
        terrainLoad: new AbortController(), terrainMap: new THREE.DataTexture(),
        waterMap: new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256),
        updateTerrainTexture: nop, terrainTextures: null,
        renderer: { initTexture: nop }, decorations: new THREE.Group(),
      })
      try {
        await bindSceneEnvironment(scene)
        const requested = []
        globalThis.fetch = async (url, options) => {
          requested.push(url)
          assert.equal(options.signal, scene.terrainLoad.signal)
          return { ok: true, arrayBuffer: async () => arrayBuffer(asset(url.slice('/original/'.length))) }
        }
        const terrain = initializeTerrain(scene)
        await preloadScene(scene, terrain)
        const expected = bank === 'c' ? 'landscape.bin' : `landscape-${bank}.bin`
        assert.deepEqual(requested, [`/original/${expected}`, '/original/waves.bin'])
        assert.equal(sha(new Uint8Array(scene.terrainTextures.palette.buffer)), terrainHashes[bank])
        scene.makeDecorations()
        const tree = world.trees.find(tree => tree.model === 3),
          mesh = scene.decorations.children.find(group => group.userData.point?.id === tree.id).children[0]
        assert.equal(mesh.material.map.image.src, `/original/${bank === 'c' ? 'atlas' : `atlas-${bank}`}.png`)
        assert.equal(mesh.geometry.getAttribute('position').count / 3, objectBank === 6 ? 29 : 81)
        assert.equal(mesh.userData.nativeResource.bank, objectBank)
        assert.equal(scene.environment.landscape.requested, override ?? previous)
        assert.equal(scene.environment.landscape.supported, !override && [12, 25, 28].includes(previous))
        assert.ok(Object.isFrozen(scene.environment) && Object.isFrozen(scene.environment.landscape))
        terrain.terrain.geometry.dispose()
        terrain.terrain.material.dispose()
      } finally {
        level.landscapeBank = previous
        fixture.close()
        scene.decorations.traverse(object => { object.geometry?.dispose(); object.material?.dispose() })
      }
    })
  }
})

test('authored bank6 tree reaches lighting, waves, picking bounds and shadow repair coherently', async t => {
  const api = await loadSceneFixture(),
    { GameScene } = await import('../app/scene.ts'),
    { ScenePicking } = await import('../app/scene-picking.ts'),
    { RenderView } = await import('../app/render-view.ts'),
    { updateModelLighting } = await import('../app/scene-assets.ts'),
    { updateDecorationsFrame } = await import('../app/scene-terrain-runtime.ts'),
    { syncLandscapeObjects } = await import('../app/world-terrain-runtime.ts'),
    { refreshSceneryShadow } = await import('../app/building-shapes.ts'),
    world = api.createWorld(3), fixture = await makeSceneFixture(world), { scene } = fixture
  Object.setPrototypeOf(scene, GameScene.prototype)
  Object.assign(scene, { decorations: new THREE.Group(), view: new RenderView(), waveFrames: new WeakMap() })
  await bindSceneEnvironment(scene)
  scene.makeDecorations()
  scene.treeSignature = world.trees.map(tree => tree.logs >= 1 ? '1' : '0').join('')
  const tree = world.trees.find(tree => tree.model === 3),
    group = scene.decorations.children.find(group => group.userData.point?.id === tree.id),
    mesh = group.children[0]
  t.after(() => { fixture.close(); scene.view.dispose(); scene.decorations.traverse(object => { object.geometry?.dispose(); object.material?.dispose() }) })
  await t.test('mesh is the source-pinned 29-triangle record and wave/light attributes match it', () => {
    assert.equal(mesh.geometry.getAttribute('position').count / 3, 29)
    assert.equal(mesh.userData.nativeResource.id, 15)
    assert.equal(mesh.userData.nativeResource.bank, 6)
    assert.ok(Object.isFrozen(mesh.userData.nativeResource))
    tree.shake = 1
    const point = api.nativePosition(world, tree)
    tree.shakeOrigin = ((point.x >>> 8) & 254) | (point.y & 0xfe00)
    updateDecorationsFrame(scene)
    updateModelLighting(mesh)
    for (const name of ['faceShade', 'faceAnchor', 'nativeWaveOffset']) {
      const attribute = mesh.geometry.getAttribute(name)
      assert.equal(attribute.count, 87)
      assert.ok(attribute.array.every(Number.isFinite), name)
    }
    // Hash-pinned bank6 model15 starts at raw PNTS (-3,602,0),
    // (-13,518,25), (16,513,8). The authored tree is cell-centered,
    // scale160, heading0, phase1: original integer wave offsets are these.
    assert.deepEqual(Array.from(mesh.geometry.getAttribute('nativeWaveOffset').array.slice(0, 6)), [-9, 0, -5, 7, 8, 4])
    assert.ok(mesh.geometry.getAttribute('nativeWaveOffset').array.some(value => value !== 0))
    assert.equal(mesh.userData.nativeSize, 160, 'existing wood/growth scale remains source scale')
    tree.burn = { scale: 73 }
    updateDecorationsFrame(scene)
    assert.equal(mesh.userData.nativeSize, 73, 'burn scale still overrides growth')
    delete tree.burn
  })
  await t.test('actual picking reads the selected record including bounds', () => {
    scene.view.update(800, 600, tree, 0, 0, false)
    const commands = new ScenePicking(scene).model(mesh, 'bank6')
    assert.ok(commands.some(command => command.kind === 'model'))
    const bounds = commands.find(command => command.kind === 'bounds')
    assert.equal(bounds.face, 29)
    assert.ok(commands.filter(command => command.kind === 'model').every(command => command.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))))
  })
  await t.test('actual landscape sync carries bank6 shape1 into repair and clears removal', () => {
    syncLandscapeObjects(world)
    const pose = world.sceneryShadows.get(tree.id), land = { flags: new Uint32Array(16384), shadows: new Uint8Array(16384) }, refresh = []
    refreshSceneryShadow(land, pose, () => 7, (...args) => refresh.push(args))
    assert.equal(land.flags.filter(value => value & 16).length, 1)
    assert.equal(pose.shapeIndex, 1)
    assert.equal(refresh[0][1], 1)
    tree.logs = 0
    syncLandscapeObjects(world)
    assert.equal(world.sceneryShadows.has(tree.id), false)
  })
})

test('supported terrain failure rejects scene readiness and disposed IO cannot attach pixels', async t => {
  const api = await loadSceneFixture(), { initializeTerrain } = await import('../app/scene-terrain-runtime.ts')
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  const make = async () => {
    const scene = { world: api.createWorld(2), terrainLoad: new AbortController(), terrainMap: new THREE.DataTexture(), waterMap: new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256), renderer: { initTexture: nop }, updateTerrainTexture: nop, terrainTextures: null }
    await bindSceneEnvironment(scene)
    return scene
  }
  const fixture = await makeSceneFixture(api.createWorld(2))
  t.after(fixture.close)
  const failed = await make(), requested = []
  globalThis.fetch = async url => {
    requested.push(url)
    return { ok: !url.endsWith('landscape-s.bin'), status: 503, arrayBuffer: async () => arrayBuffer(asset(url.slice('/original/'.length))) }
  }
  await assert.rejects(preloadScene(failed, initializeTerrain(failed)), /Terrain texture load failed: 503/)
  assert.ok(!requested.includes('/original/landscape.bin'), 'no silent fallback on supported load failure')
  const stale = await make(), pending = []
  globalThis.fetch = url => new Promise(resolve => pending.push(() => resolve({ ok: true, arrayBuffer: async () => arrayBuffer(asset(url.slice('/original/'.length))) })))
  const loading = preloadScene(stale, initializeTerrain(stale))
  stale.terrainLoad.abort()
  pending.forEach(resolve => resolve())
  await loading
  assert.equal(stale.terrainTextures, null)
})
