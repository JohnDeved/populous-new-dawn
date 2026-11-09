import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { createPointerFrameMetrics, measurePointerQuery, resetPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'

function terrain(t) {
  const geometry = new THREE.BufferGeometry().setAttribute('position',
    new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 0, 1, 0, 3, 3, 0], 3))
  geometry.setIndex([0, 1, 2, 1, 3, 2])
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
  t.after(() => { geometry.dispose(); mesh.material.dispose() })
  return mesh
}
function clock(t) {
  const original = performance.now
  let reads = 0
  Object.defineProperty(performance, 'now', { configurable: true, value: () => ++reads })
  t.after(() => Object.defineProperty(performance, 'now', { configurable: true, value: original }))
  return () => reads
}

test('ordinary phases count actual projections and triangle visits, nest within inclusive time, and reset', t => {
  const view = new RenderView(), mesh = terrain(t), camera = new THREE.Camera()
  view.screen = p => new THREE.Vector4(p.x, p.y, 0, 1)
  view.visible = () => true
  const reads = clock(t), metrics = createPointerFrameMetrics(true), mouse = new THREE.Vector2()
  const disabled = view.pick(mouse, [mesh], camera)
  assert.equal(reads(), 0)
  const enabled = measurePointerQuery(metrics, 'terrain', () => view.pick(mouse, [mesh], camera, false, metrics.ordinaryTerrain))
  assert.deepEqual(enabled, disabled)
  const detail = metrics.ordinaryTerrain
  assert.equal(detail.projectedVertices, 4, 'shared indexed vertices project once')
  assert.equal(detail.visitedTriangles, 2, 'includes the missed triangle')
  for (const field of ['visibilityMs', 'projectionMs', 'triangleScanMs', 'resolutionMs']) assert.equal(detail[field], 1)
  assert.equal(metrics.terrainPickMs, 8)
  assert.equal(reads(), 9, 'timers are per phase, not per vertex/triangle')
  assert.deepEqual(detail.paths, { version: 1, numeric: 0, packedVector: 0, sparseVector: 1 })
  resetPointerFrameMetrics(metrics)
  assert.equal(metrics.ordinaryTerrain, detail)
  assert.equal(detail.version, 1)
  assert.ok(Object.entries(detail).every(([key, value]) => key === 'version' || (key === 'visibility' ? Object.values(value).every(n => n === 0) : key === 'paths' ? Object.entries(value).every(([name, n]) => name === 'version' ? n === 1 : n === 0) : value === 0)))
})

test('actual GameScene pointer caller forwards ordinary diagnostics to real RenderView picking', async t => {
  const { tooltipCallerFixture } = await import('./support/tooltip-scene.mjs')
  const { scene, point } = await tooltipCallerFixture(t)
  const { GameScene } = await import('../app/scene.ts')
  const { updatePointerFrame } = await import('../app/scene-input-runtime.ts')
  scene.pick = GameScene.prototype.pick.bind(scene)
  scene.view.pickCandidates = RenderView.prototype.pickCandidates
  scene.view.resolvePickCandidates = RenderView.prototype.resolvePickCandidates
  scene.terrain = terrain(t)
  scene.mouse = new THREE.Vector2()
  scene.camera = new THREE.Camera()
  scene.view.screen = p => new THREE.Vector4(p.x, p.y, 0, 1)
  scene.view.visible = () => true
  scene.picking.pick = () => null
  scene.pointerScreen = point
  scene.pointerState = ''
  const reads = clock(t), metrics = createPointerFrameMetrics(true)
  const updateVisibility = scene.view.updateTerrainVisibility
  let suppliedVisibility
  scene.view.updateTerrainVisibility = function (object, detail) {
    suppliedVisibility = detail
    return updateVisibility.call(this, object, detail)
  }
  updatePointerFrame(scene, 100, metrics)
  assert.equal(suppliedVisibility, metrics.ordinaryTerrain.visibility)
  assert.equal(metrics.terrainPickCalls, 1)
  assert.equal(metrics.ordinaryTerrain.projectedVertices, 4)
  assert.equal(metrics.ordinaryTerrain.visitedTriangles, 2)
  assert.ok(metrics.terrainPickMs > metrics.ordinaryTerrain.projectionMs)
  const enabledReads = reads(), sample = structuredClone(scene.tooltipInput)
  scene.pointerState = ''
  updatePointerFrame(scene, 100)
  assert.deepEqual(scene.tooltipInput, sample)
  assert.equal(reads(), enabledReads, 'disabled real caller reads no timers')
  assert.equal(suppliedVisibility, undefined, 'disabled caller supplies no counter sink')
})

test('culled instances do not count submitted geometry as visited triangles', t => {
  const source = terrain(t), mesh = new THREE.InstancedMesh(source.geometry, source.material, 2)
  mesh.setMatrixAt(0, new THREE.Matrix4())
  mesh.setMatrixAt(1, new THREE.Matrix4().makeTranslation(10000, 0, 10000))
  const view = new RenderView(), metrics = createPointerFrameMetrics(true)
  view.screen = p => new THREE.Vector4(p.x, p.y, 0, 1)
  view.visible = () => true
  view.pick(new THREE.Vector2(), [mesh], new THREE.Camera(), false, metrics.ordinaryTerrain)
  assert.equal(metrics.ordinaryTerrain.visitedTriangles, 2, 'only one of two submitted copies was scanned')
  assert.equal(metrics.ordinaryTerrain.projectedVertices, 4)
})
