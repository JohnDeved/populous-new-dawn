import assert from 'node:assert/strict'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'

// Frozen ordinary scan predicate from public parent 664aa216d. Deliberately
// retain arrays, every/some, operand grouping and access order as the oracle.
function originalPredicate(mouse, points) {
  const [a, b, c] = [0, 1, 2].map(id => points[id])
  if ([a, b, c].every(p => p.z < -1) || [a, b, c].every(p => p.z > 1) || [a, b, c].some(p => p.w <= 0)) return null
  const determinant = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
  if (Math.abs(determinant) < 1e-12) return null
  const u = ((b.y - c.y) * (mouse.x - c.x) + (c.x - b.x) * (mouse.y - c.y)) / determinant,
    v = ((c.y - a.y) * (mouse.x - c.x) + (a.x - c.x) * (mouse.y - c.y)) / determinant,
    t = 1 - u - v
  if (u < 0 || v < 0 || t < 0) return null
  const weights = [u / a.w, v / b.w, t / c.w], sum = weights.reduce((total, weight) => total + weight)
  const point = new THREE.Vector3()
  const world = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)]
  world.forEach((value, j) => point.addScaledVector(value, weights[j] / sum))
  const wrap = n => ((((n + 128) % 256) + 256) % 256) - 128
  return { point: { x: wrap(point.x), z: wrap(point.z) }, depth: u * a.z + v * b.z + t * c.z }
}
function accessorPoints(values, log) {
  return values.map((values, id) => Object.defineProperties({}, Object.fromEntries(Object.keys(values).map(key => [key, {
      get() { log.push(`${id}.${key}`); return values[key] },
    }]))))
}
function geometry() {
  const result = new THREE.BufferGeometry()
  result.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 0, 1], 3))
  return result
}
const normal = [{ x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 0, z: 0, w: 1 }, { x: 0, y: 1, z: 0, w: 1 }]

test('scalar ordinary scan matches frozen predicate and accessor reads, including nonfinite and determinant boundary', () => {
  const view = new RenderView(), mesh = new THREE.Mesh(geometry(), new THREE.MeshBasicMaterial()), camera = new THREE.Camera()
  view.visible = () => true
  const cases = [
    normal, normal.map(p => ({ ...p, z: -2 })), normal.map(p => ({ ...p, z: 2 })),
    normal.map((p, i) => ({ ...p, w: i === 1 ? 0 : 1 })),
    normal.map((p, i) => ({ ...p, z: i === 0 ? NaN : 0 })),
    normal.map((p, i) => ({ ...p, x: i === 1 ? Infinity : p.x })),
    ...[0, 1e-13, 1e-12, 1.000000000001e-12, -1e-12].map(y => [normal[0], normal[1], { ...normal[2], y }]),
  ]
  try {
    for (const values of cases) for (const mouse of [new THREE.Vector2(0, 0), new THREE.Vector2(0.2, 0.2), new THREE.Vector2(-1, 0)]) {
      const actualReads = [], expectedReads = [], points = accessorPoints(values, actualReads)
      let corner = 0
      view.screen = () => points[corner++]
      const actual = view.pickCandidates(mouse, [mesh], camera)
      const expected = originalPredicate(mouse, accessorPoints(values, expectedReads))
      assert.deepEqual(actualReads, expectedReads)
      assert.equal(actual.length, expected === null ? 0 : 1)
      if (expected) assert.deepEqual({ point: actual[0].point, depth: actual[0].depth }, expected)
    }
  } finally { view.dispose(); mesh.geometry.dispose(); mesh.material.dispose() }
})

test('native and ordinary custom scans preserve exact parent candidates, getter order and winner', { skip: !process.env.PND_TERRAIN_BASELINE }, async () => {
  const ParentView = (await import(pathToFileURL(process.env.PND_TERRAIN_BASELINE).href)).RenderView
  const view = new RenderView(), parent = new ParentView(), mesh = new THREE.Mesh(geometry(), new THREE.MeshBasicMaterial()), camera = new THREE.Camera()
  mesh.geometry.setIndex([0, 1, 2, 0, 1, 2])
  const index = mesh.geometry.index, getX = index.getX
  try {
    for (const native of [false, true]) for (const mouse of [new THREE.Vector2(0.2, 0.2), new THREE.Vector2(-0.01, 0), new THREE.Vector2(0, 0)]) {
      const logs = [], candidates = []
      for (const target of [view, parent]) {
        const log = [], points = accessorPoints(normal, log); let corner = 0
        target.screen = () => points[corner++]; target.visible = () => true
        index.getX = function (i) { log.push(`index.${i}`); return getX.call(this, i) }
        candidates.push(target.pickCandidates(mouse, [mesh], camera, native)); logs.push(log)
        target.groundPickCache = new WeakMap()
      }
      assert.deepEqual(logs[0], logs[1]); assert.deepEqual(candidates[0], candidates[1])
      assert.deepEqual(view.resolvePickCandidates(candidates[0]), parent.resolvePickCandidates(candidates[1]))
    }
  } finally { index.getX = getX; view.dispose(); parent.dispose(); mesh.geometry.dispose(); mesh.material.dispose() }
})

test('scalar scan diagnostics coexist with interaction ring snapshots and disabled queries', async () => {
  const { createPointerFrameMetrics, resetPointerFrameMetrics } = await import('../app/pointer-frame-metrics.ts')
  const { FramePerformance } = await import('../app/frame-performance.ts')
  const view = new RenderView(), mesh = new THREE.Mesh(geometry(), new THREE.MeshBasicMaterial()), camera = new THREE.Camera()
  const metrics = createPointerFrameMetrics(true), frames = new FramePerformance(), mouse = new THREE.Vector2(0.2, 0.2)
  view.visible = () => true
  let corner = 0
  view.screen = () => normal[corner++ % 3]
  try {
    const plain = view.pickCandidates(mouse, [mesh], camera)
    metrics.interaction.route = 'world'; metrics.interaction.sharedTerrain = true
    const measured = view.pickCandidates(mouse, [mesh], camera, false, undefined, metrics.ordinaryTerrain)
    assert.deepEqual(measured, plain)
    assert.equal(metrics.ordinaryTerrain.visitedTriangles, 1)
    frames.sample(10, 0, 0, 0, 1, 1, 10, 'live', metrics)
    resetPointerFrameMetrics(metrics)
    const frame = frames.recentFrames()[0].pointerBreakdown
    assert.equal(frame.ordinaryTerrain.visitedTriangles, 1)
    assert.equal(frame.interaction.sharedTerrain, true)
    assert.equal(metrics.ordinaryTerrain.visitedTriangles, 0)
    assert.equal(metrics.interaction.sharedTerrain, false)
    assert.deepEqual(view.pickCandidates(mouse, [mesh], camera), plain)
    assert.deepEqual(view.resolvePickCandidates(measured), view.resolvePickCandidates(plain))
  } finally { view.dispose(); mesh.geometry.dispose(); mesh.material.dispose() }
})
