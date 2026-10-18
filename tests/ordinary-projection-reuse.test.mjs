import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { createOrdinaryTerrainMetrics } from '../app/ordinary-terrain-metrics.ts'
import { createNativeOcclusionMetrics } from '../app/native-occlusion-metrics.ts'
import { OrdinaryProjectionCache, ORDINARY_PROJECTION_CAPACITY, ORDINARY_PROJECTION_CORNERS } from '../app/ordinary-projection-cache.ts'

const camera = new THREE.Camera()
const corners = [[0, 0, 0], [0, 0, 2], [2, 0, 0], [2, 0, 0], [0, 0, 2], [2, 0, 2]]
function fixture(t) {
  const view = new RenderView(), position = new THREE.Float32BufferAttribute(new Float32Array(128 * 128 * 6 * 3), 3)
  corners.forEach((point, i) => position.setXYZ(i, ...point))
  const geometry = new THREE.BufferGeometry().setAttribute('position', position)
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array([0, 1, 2, 3, 4, 5]), 1))
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial(), 2)
  Object.assign(mesh.userData, { terrainGrid: true, painterGround: true, nativeRelative: true })
  mesh.count = 1
  mesh.setMatrixAt(0, new THREE.Matrix4())
  mesh.setMatrixAt(1, new THREE.Matrix4().makeTranslation(0, 1, 0))
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  view.updateTerrainVisibility = () => {}
  view.visible = () => true
  const points = corners.slice(0, 3).map(p => view.screen(new THREE.Vector3(...p), camera, true))
  const mouse = new THREE.Vector2(points.reduce((sum, p) => sum + p.x, 0) / 3, points.reduce((sum, p) => sum + p.y, 0) / 3)
  t.after(() => { view.dispose(); geometry.dispose(); mesh.material.dispose() })
  const query = () => {
    const metrics = createOrdinaryTerrainMetrics()
    const candidates = view.pickCandidates(mouse, [mesh], camera, false, undefined, metrics)
    return { candidates, metrics }
  }
  const oracle = () => {
    const descriptor = Object.getOwnPropertyDescriptor(view, 'screen')
    // Same canonical math with an own method forces uncached fallback.
    Object.defineProperty(view, 'screen', { configurable: true, writable: true, value: descriptor?.value ?? RenderView.prototype.screen })
    try { return view.pickCandidates(mouse, [mesh], camera) }
    finally {
      if (descriptor) Object.defineProperty(view, 'screen', descriptor)
      else delete view.screen
    }
  }
  return { view, mesh, position, mouse, query, oracle }
}

test('canonical ordinary cache skips exact repeated projections but not triangle visits or result ownership', t => {
  const f = fixture(t), cold = f.query()
  assert.equal(cold.metrics.projectedVertices, 4)
  assert.ok(cold.candidates.length)
  assert.deepEqual(cold.candidates, f.oracle())
  const warm = f.query()
  assert.equal(warm.metrics.projectedVertices, 0)
  assert.equal(warm.metrics.visitedTriangles, 2)
  assert.deepEqual(warm.candidates, cold.candidates)
  cold.candidates[0].point.x = 12345
  assert.deepEqual(f.query().candidates, warm.candidates, 'caller-owned candidate mutation cannot poison numeric entries')
  const cache = f.view.ordinaryProjectionCache
  assert.equal(cache.entries.length, 1)
  assert.equal(cache.entries[0].values.length, ORDINARY_PROJECTION_CORNERS * 7)
  assert.equal(cache.entries[0].valid.length, ORDINARY_PROJECTION_CORNERS)
  const native = createNativeOcclusionMetrics()
  f.view.pickCandidates(f.mouse, [f.mesh], camera, true, native)
  const nativeEntry = f.view.groundPickCache.get(f.mesh).get(0)
  assert.equal(f.query().metrics.projectedVertices, 0)
  assert.equal(f.view.groundPickCache.get(f.mesh).get(0), nativeEntry)
  assert.equal(f.view.ordinaryProjectionCache, cache)
})

test('unversioned water/position/transform changes are validated as vertices are visited', t => {
  const f = fixture(t)
  f.query()
  const version = f.position.version
  for (let i = 0; i < 6; i++) f.position.setY(i, 1)
  assert.equal(f.position.version, version)
  assert.equal(f.query().metrics.projectedVertices, 4)
  assert.deepEqual(f.query().candidates, f.oracle())
  f.position.setY(f.position.count - 1, 99)
  assert.equal(f.query().metrics.projectedVertices, 0, 'unsubmitted positions need no full-array scan or invalidation')
  f.mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 2, 0))
  assert.equal(f.query().metrics.projectedVertices, 4)
  assert.deepEqual(f.query().candidates, f.oracle())
  f.mesh.position.y += 0.5
  assert.equal(f.query().metrics.projectedVertices, 4)
  assert.deepEqual(f.query().candidates, f.oracle())
  f.mesh.geometry.setAttribute('position', f.position.clone())
  assert.equal(f.query().metrics.projectedVertices, 0, 'same actual coordinates may reuse across attribute replacement')
  assert.deepEqual(f.query().candidates, f.oracle())
})

test('actual view/projection fields invalidate without relying on identity or versions', t => {
  const f = fixture(t)
  f.query()
  const changes = [
    () => { f.view.rawCenter.x++ },
    () => { f.view.rawCenter.y++ },
    () => { f.view.config.depth++ },
    ...['curvature', 'depth', 'perspective', 'scale', 'width', 'height', 'centerX', 'centerY', 'fractionX', 'fractionY', 'pixelScaleX', 'pixelScaleY']
      .map(key => () => { f.view.projection[key]++ }),
    ...Array.from({ length: 9 }, (_, i) => () => { f.view.projection.matrix[i]++ }),
  ]
  for (const change of changes) {
    change()
    const result = f.query()
    assert.equal(result.metrics.projectedVertices, 4)
    assert.deepEqual(result.candidates, f.oracle())
    assert.equal(f.query().metrics.projectedVertices, 0)
  }
})

test('discordant duplicate corners, non-grid and nonfinite positions preserve fallback math', t => {
  const f = fixture(t)
  f.query()
  f.position.setY(3, 1)
  assert.deepEqual(f.query().candidates, f.oracle())
  assert.equal(f.query().metrics.projectedVertices, 2, 'two height variants safely evict the same corner slot')
  for (const value of [0.5, NaN, Infinity, -0]) {
    f.position.setX(0, value)
    assert.deepEqual(f.query().candidates, f.oracle())
  }
})

test('custom projection helpers and accessors do not use canonical cache', t => {
  const f = fixture(t)
  f.query()
  f.view.screen = RenderView.prototype.screen
  assert.equal(f.query().metrics.projectedVertices, 4)
  delete f.view.screen
  f.view.relative = RenderView.prototype.relative
  assert.equal(f.query().metrics.projectedVertices, 4)
  delete f.view.relative
  const curvature = f.view.projection.curvature
  Object.defineProperty(f.view.projection, 'curvature', { configurable: true, get: () => curvature })
  assert.equal(f.query().metrics.projectedVertices, 4)
  assert.deepEqual(f.query().candidates, f.oracle())
  Object.defineProperty(f.view.projection, 'curvature', { configurable: true, writable: true, value: curvature })
  Object.defineProperty(f.position, 'normalized', { configurable: true, get: () => false })
  assert.equal(f.query().metrics.projectedVertices, 4)
  assert.deepEqual(f.query().candidates, f.oracle())
})

test('reentrant queries bypass cache and disposal prevents reacquisition during outer query', t => {
  const f = fixture(t)
  f.query()
  let nested, entered = false
  f.view.visible = () => {
    if (!entered) {
      entered = true
      nested = f.query()
    }
    return true
  }
  const warm = f.query()
  assert.equal(warm.metrics.projectedVertices, 0)
  assert.equal(nested.metrics.projectedVertices, 4)
  assert.deepEqual(nested.candidates, warm.candidates)
  f.mesh.count = 2
  let disposed = false
  f.view.visible = () => {
    if (!disposed) { disposed = true; f.view.dispose() }
    return true
  }
  const result = f.query()
  assert.equal(f.view.ordinaryProjectionCache, null)
  assert.equal(f.view.ordinaryPickScratch, null)
  assert.equal(result.metrics.projectedVertices, 4, 'remaining instance recomputes after disposal')
  f.view.visible = () => true
  const resumed = f.query()
  assert.equal(resumed.metrics.projectedVertices, 8)
  assert.deepEqual(resumed.candidates, f.oracle())
})

test('hot instance table has a fixed per-view ceiling', t => {
  const f = fixture(t)
  const clones = Array.from({ length: ORDINARY_PROJECTION_CAPACITY + 2 }, () => {
    const clone = f.mesh.clone(); clone.count = 1; return clone
  })
  for (const object of clones) f.view.pickCandidates(f.mouse, [object], camera)
  assert.equal(f.view.ordinaryProjectionCache.entries.length, ORDINARY_PROJECTION_CAPACITY)
  f.view.dispose()
  assert.equal(f.view.ordinaryProjectionCache, null)
})

 test('replaced arithmetic helper falls back without stale reuse', t => {
  const f = fixture(t)
  f.query()
  const round = Math.round
  try {
    Math.round = n => round(n) + 1
    assert.equal(f.query().metrics.projectedVertices, 4)
    assert.deepEqual(f.query().candidates, f.oracle())
  } finally { Math.round = round }
  assert.equal(f.query().metrics.projectedVertices, 0)
})

test('rebuilt terrain and actual water updates match uncached candidates', async t => {
  const { readFileSync } = await import('node:fs')
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const api = await loadSceneFixture(), f = fixture(t), world = api.createWorld(2)
  const { rebuildTerrain, updateWater, landIndex } = await import('../app/scene-terrain-runtime.ts')
  const scene = { world, terrain: f.mesh, view: f.view, decorations: new THREE.Group(), updateView() {},
    waves: new Uint8Array(readFileSync(new URL('../public/original/waves.bin', import.meta.url))) }
  scene.landIndex = (x, z) => landIndex(scene, x, z)
  f.mesh.geometry = new THREE.BufferGeometry()
  rebuildTerrain(scene)
  f.mesh.geometry.setIndex(new THREE.BufferAttribute(Uint32Array.from({ length: 128 * 128 * 6 }, (_, i) => i), 1))
  t.after(() => f.mesh.geometry.dispose())
  f.mesh.count = 1
  f.mesh.setMatrixAt(0, new THREE.Matrix4())
  let cold, changed
  for (const turn of [0, 23, 256]) {
    world.turn = turn
    updateWater(scene)
    const current = f.query()
    assert.deepEqual(current.candidates, f.oracle())
    assert.equal(f.query().metrics.projectedVertices, 0)
    if (turn === 0) cold = current.metrics.projectedVertices
    else changed = (changed ?? 0) + current.metrics.projectedVertices
  }
  assert.ok(cold > 0)
  assert.ok(changed > 0, 'real animated water must invalidate actual changed heights')
})


test('slots retain only weak mesh identity and do not alias new or evicted meshes', () => {
  const cache = new OrdinaryProjectionCache(), mesh = {}, replacement = {}, state = [1]
  const first = cache.prepare(mesh, 0, state)
  first.store(0, 1, 2, 3, 4, 5, 6, 1)
  assert.ok(first.meshRef instanceof WeakRef)
  assert.equal(first.meshRef.deref(), mesh)
  assert.equal(Object.values(first).includes(mesh), false)
  assert.equal(cache.prepare(mesh, 0, state), first)
  assert.equal(first.lookup(0, 1, 2, 3), 0)
  assert.equal(cache.prepare(replacement, 0, state).lookup(0, 1, 2, 3), -1)
  cache.prepare({}, 0, state)
  cache.prepare({}, 0, state)
  const reused = cache.prepare({}, 0, state)
  assert.equal(reused, first, 'FIFO reuses storage, not old identity/results')
  assert.equal(reused.lookup(0, 1, 2, 3), -1)
  assert.equal(cache.prepare(mesh, 0, state).lookup(0, 1, 2, 3), -1)
  assert.equal(cache.entries.length, ORDINARY_PROJECTION_CAPACITY)
  // Reachability is structurally verified; collection timing is intentionally not asserted.
})

test('retaining and mutating addScaledVector arguments cannot poison cached projections', t => {
  const f = fixture(t), expected = f.query().candidates, retained = []
  const addScaledVector = THREE.Vector3.prototype.addScaledVector
  try {
    THREE.Vector3.prototype.addScaledVector = function (value, scale) {
      retained.push(value)
      return addScaledVector.call(this, value, scale)
    }
    assert.deepEqual(f.query().candidates, expected)
  } finally { THREE.Vector3.prototype.addScaledVector = addScaledVector }
  assert.ok(retained.length > 0)
  for (const point of retained) point.set(12345, 54321, -12345)
  const next = f.query()
  assert.equal(next.metrics.projectedVertices, 0)
  assert.deepEqual(next.candidates, expected)
  assert.deepEqual(next.candidates, f.oracle())
})
