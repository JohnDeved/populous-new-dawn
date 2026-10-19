import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { readFileSync } from 'node:fs'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { createPointerFrameMetrics, resetPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { RenderView } from '../app/render-view.ts'
import { TerrainVisibilityPreparation, terrainTiles, visibleTerrainCells, visibleTerrainCopies } from '../app/terrain-visibility.ts'

function expected(view, vertices) {
  const cells = view.overview ? null : visibleTerrainCells(view.bounds, view.rawCenter)
  const indices = []
  for (let cell = 0; cell < vertices / 6; cell++) {
    if (cells && !cells[cell]) continue
    for (let vertex = cell * 6; vertex < cell * 6 + 6; vertex++) indices.push(vertex)
  }
  return indices
}
function fixture() {
  const view = new RenderView()
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(128 * 128 * 6 * 3), 3))
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial(), 9)
  mesh.userData.terrainGrid = true
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const check = () => {
    view.updateTerrainVisibility(mesh)
    assert.deepEqual(Array.from(mesh.geometry.index.array.slice(0, mesh.geometry.drawRange.count)), expected(view, mesh.geometry.getAttribute('position').count))
    assert.equal(mesh.geometry.drawRange.start, 0)
    const tiles = view.overview ? terrainTiles : visibleTerrainCopies(view.bounds, view.rawCenter)
    assert.equal(mesh.count, tiles.length)
    assert.deepEqual(tiles.map((_, i) => [mesh.instanceMatrix.array[i * 16 + 12], mesh.instanceMatrix.array[i * 16 + 14]]), tiles.map(([x, z]) => [x * 256, z * 256]))
  }
  return { view, mesh, check, close() { view.dispose(); mesh.geometry.dispose(); mesh.material.dispose() } }
}

test('selection certificate uses exact span values, coarse center, overview, vertex count and tile order', () => {
  const preparation = new TerrainVisibilityPreparation()
  const bounds = [[1, 3], [2, 4]], center = { x: 0, y: 0 }
  const prepare = (overview = false, vertices = 128 * 128 * 6) => preparation.prepare(bounds, center, overview, vertices)
  let previous = prepare()
  assert.equal(prepare(), previous)
  bounds[0] = [1, 3]
  center.x = 511
  assert.equal(prepare(), previous, 'array identities and subcell movement are not effective inputs')
  for (const change of [() => { bounds[0][1]++ }, () => { center.x++ }, () => { center.y = -1 }]) {
    change()
    const current = prepare()
    assert.notEqual(current, previous)
    previous = current
  }
  previous = prepare(true)
  bounds[0][1]++
  center.x += 512
  assert.equal(prepare(true), previous, 'overview ignores spans and center')
  assert.notEqual(prepare(true, 12), previous)
  const order = terrainTiles.slice()
  try {
    previous = prepare(true)
    terrainTiles.reverse()
    assert.notEqual(prepare(true), previous)
  } finally { terrainTiles.splice(0, terrainTiles.length, ...order) }
})

test('ordinary preparation and render reuse unchanged submission, including position-only water changes', () => {
  const f = fixture()
  try {
    f.check()
    const index = f.mesh.geometry.index
    const version = index.version, instanceVersion = f.mesh.instanceMatrix.version
    const scene = new THREE.Scene()
    scene.add(f.mesh)
    f.view.prepare(scene)
    f.view.painter.update = () => {}
    f.view.pickCandidates(new THREE.Vector2(), [f.mesh], new THREE.Camera())
    f.mesh.geometry.getAttribute('position').setY(0, 7)
    f.mesh.geometry.getAttribute('position').needsUpdate = true
    scene.onBeforeRender({})
    f.check()
    assert.equal(index.version, version)
    assert.equal(f.mesh.instanceMatrix.version, instanceVersion)
  } finally { f.close() }
})

test('camera, view dimensions, overview and same-identity row changes match the uncached producer', () => {
  const f = fixture()
  try {
    for (const [width, height, x, z, angle, zoom, overview] of [
      [800, 600, 0, 0, 0, 0, false], [3440, 1440, 0, 0, 0, 0, false],
      [3440, 1440, 0.25, -0.375, Math.PI / 2, 0, false],
      [800, 600, 128, -128, Math.PI, 50, false], [800, 600, 128, -128, 0, 0, true],
      [800, 600, -128, 128, 0, 0, false],
    ]) {
      f.view.update(width, height, { x, z }, angle, zoom, overview)
      f.check()
      const version = f.mesh.geometry.index.version
      f.check()
      assert.equal(f.mesh.geometry.index.version, version)
    }
    f.view.bounds[111] = [90, 130]
    f.check()
    f.view.bounds[111][1]++
    f.check()
  } finally { f.close() }
})

test('geometry, index, range and in-place unversioned index/instance changes are repaired exactly', () => {
  const f = fixture()
  try {
    f.check()
    for (const change of [
      () => { f.mesh.geometry = f.mesh.geometry.clone() },
      () => { f.mesh.geometry.setIndex(null) },
      () => { f.mesh.geometry.index = f.mesh.geometry.index.clone(); f.mesh.geometry.index.array.fill(0) },
      () => { f.mesh.geometry.setDrawRange(6, 6) },
      () => { f.mesh.geometry.index.array[0] = 123 },
      () => { f.mesh.instanceMatrix.array[12] = 123 },
      () => { f.mesh.count = 0 },
      () => { f.mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12 * 3), 3)) },
    ]) { change(); f.check() }
  } finally { f.close() }
})

test('custom index implementations retain the original mutable write fallback', () => {
  const f = fixture()
  try {
    f.check()
    const index = f.mesh.geometry.index
    let writes = 0
    index.setX = function (i, value) { writes++; return THREE.BufferAttribute.prototype.setX.call(this, i, value) }
    const version = index.version
    f.check()
    assert.equal(writes, f.mesh.geometry.drawRange.count)
    assert.equal(index.version, version + 1)
  } finally { f.close() }
})

test('native candidate queries do not refresh visibility before the render producer', () => {
  const f = fixture()
  try {
    f.check()
    f.mesh.geometry.setDrawRange(0, 0)
    const indexVersion = f.mesh.geometry.index.version
    f.view.bounds[111] = [1, 2]
    f.view.pickCandidates(new THREE.Vector2(), [f.mesh], new THREE.Camera(), true)
    assert.equal(f.mesh.geometry.drawRange.count, 0)
    assert.equal(f.mesh.geometry.index.version, indexVersion)
    f.check()
  } finally { f.close() }
})


test('shipped terrain rebuild and water update between ordinary picking and render preserve selection', async () => {
  const api = await loadSceneFixture()
  const { rebuildTerrain, updateWater, landIndex } = await import('../app/scene-terrain-runtime.ts')
  const f = fixture()
  try {
    const world = api.createWorld(2)
    const runtime = {
      world, terrain: f.mesh, view: f.view, decorations: new THREE.Group(), updateView() {},
      waves: new Uint8Array(readFileSync(new URL('../public/original/waves.bin', import.meta.url))),
    }
    runtime.landIndex = (x, z) => landIndex(runtime, x, z)
    // Force the shipped builder to initialize all water/light attributes.
    f.mesh.geometry.dispose()
    f.mesh.geometry = new THREE.BufferGeometry()
    rebuildTerrain(runtime)
    f.mesh.userData.nativeRelative = true
    f.mesh.userData.painterGround = true
    const scene = new THREE.Scene()
    scene.add(f.mesh)
    f.view.prepare(scene)
    f.view.painter.update = () => {}
    f.view.pickCandidates(new THREE.Vector2(), [f.mesh], new THREE.Camera())
    const metrics = createPointerFrameMetrics(true)
    const point = new THREE.Vector2(), camera = new THREE.Camera()
    const disabled = f.view.pickCandidates(point, [f.mesh], camera)
    const scratch = f.view.ordinaryPickScratch
    const enabled = f.view.pickCandidates(point, [f.mesh], camera, false, metrics.nativeOcclusion, metrics.ordinaryTerrain)
    assert.deepEqual(enabled, disabled)
    assert.ok(metrics.ordinaryTerrain.projectedVertices > 0)
    assert.equal(metrics.nativeOcclusion.projectedVertices, 0)
    assert.equal(f.view.ordinaryPickScratch, scratch)
    assert.equal(scratch.world.length, 0)
    assert.equal(scratch.screen.length, 0)
    f.view.pickCandidates(point, [f.mesh], camera, true, metrics.nativeOcclusion, metrics.ordinaryTerrain)
    resetPointerFrameMetrics(metrics)
    assert.equal(metrics.ordinaryTerrain.projectedVertices, 0)
    assert.deepEqual(f.view.pickCandidates(point, [f.mesh], camera), disabled)
    const indexVersion = f.mesh.geometry.index.version
    const positionVersion = f.mesh.geometry.getAttribute('position').version
    world.turn = 23
    updateWater(runtime)
    assert.ok(f.mesh.geometry.getAttribute('position').version > positionVersion)
    scene.onBeforeRender({})
    f.check()
    assert.equal(f.mesh.geometry.index.version, indexVersion)
    rebuildTerrain(runtime)
    f.check()
    assert.equal(f.mesh.geometry.index.version, indexVersion)
  } finally { f.close() }
})

test('pointer visibility counters distinguish actual writes, validated reuse and selection rebuilds', async t => {
  const { createTerrainVisibilityMetrics } = await import('../app/ordinary-terrain-metrics.ts')
  const f = fixture(), detail = createTerrainVisibilityMetrics()
  t.after(() => f.close())
  const now = performance.now
  Object.defineProperty(performance, 'now', { configurable: true, value: () => { throw new Error('visibility counters must not read timers') } })
  t.after(() => Object.defineProperty(performance, 'now', { configurable: true, value: now }))
  f.view.updateTerrainVisibility(f.mesh, detail)
  const count = f.mesh.geometry.drawRange.count
  assert.ok(count > 0)
  assert.deepEqual(detail, { indexEntriesWritten: count, indexReuseCalls: 0, selectionRebuilds: 1 })
  f.view.updateTerrainVisibility(f.mesh, detail)
  assert.deepEqual(detail, { indexEntriesWritten: count, indexReuseCalls: 1, selectionRebuilds: 1 })
  f.mesh.geometry.index.array[0]++
  f.view.updateTerrainVisibility(f.mesh, detail)
  assert.deepEqual(detail, { indexEntriesWritten: count * 2, indexReuseCalls: 1, selectionRebuilds: 1 })
  // The ordinary renderer call has no counter sink: its work must not be
  // attributed as pointer-side work, even if it primes selection/index reuse.
  f.view.bounds[0][1]++
  f.view.updateTerrainVisibility(f.mesh)
  assert.deepEqual(detail, { indexEntriesWritten: count * 2, indexReuseCalls: 1, selectionRebuilds: 1 })
  f.view.updateTerrainVisibility(f.mesh, detail)
  assert.equal(detail.indexReuseCalls, 2)
  assert.equal(detail.selectionRebuilds, 1, 'renderer rebuild is not pointer rebuild')
})
