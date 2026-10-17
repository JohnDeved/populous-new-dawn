import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'

// Exercise the live triangle scanner with controlled projection outputs. Native
// projection and shipped terrain are covered separately by the camera matrix.
function fixture(projected, indices = null) {
  const view = new RenderView(),
    camera = new THREE.Camera(),
    geometry = new THREE.BufferGeometry(),
    material = new THREE.MeshBasicMaterial(),
    mesh = new THREE.Mesh(geometry, material)
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(projected.flatMap((_, i) => [i, 0, i * 2]), 3)
  )
  if (indices) geometry.setIndex(indices)
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  view.screen = point => new THREE.Vector4(...projected[point.x])
  view.visible = () => true
  return {
    view,
    mesh,
    query: (x = 0, y = 0, nativeEdges = false) =>
      view.pickCandidates(new THREE.Vector2(x, y), [mesh], camera, nativeEdges),
    close() {
      view.dispose()
      geometry.dispose()
      material.dispose()
    },
  }
}

const triangle = [
  [-1, -1, 0, 1],
  [1, -1, 0, 2],
  [0, 1, 0, 4],
]

test('default triangle picking retains perspective weights and fresh result ownership', () => {
  const f = fixture(triangle)
  try {
    const first = f.query()
    assert.deepEqual(first, [
      { point: { x: 0.75, z: 1.5 }, object: f.mesh, depth: 0, triangle: 0, instance: 0 },
    ])
    const second = f.query()
    assert.deepEqual(second, first)
    assert.notStrictEqual(second[0].point, first[0].point)
    second[0].point.x = 99
    assert.equal(first[0].point.x, 0.75)
  } finally {
    f.close()
  }
})

test('indexed triangles keep original face identity, submission order and live painter resolution', () => {
  const f = fixture([...triangle, ...triangle], [3, 4, 5, 0, 1, 2])
  try {
    const candidates = f.query()
    assert.deepEqual(candidates.map(hit => hit.triangle), [1, 0])
    assert.deepEqual(candidates.map(hit => hit.point), [
      { x: 3.75, z: 7.5 },
      { x: 0.75, z: 1.5 },
    ])
    f.view.painter.depth = () => 0
    assert.equal(f.view.resolvePickCandidates(candidates).triangle, 1, 'first wins depth ties')
    f.view.painter.depth = (_mesh, face) => (face === 0 ? -0.5 : 0.5)
    assert.equal(f.view.resolvePickCandidates(candidates).triangle, 0, 'live painter reranks')
    f.mesh.geometry.setIndex([0, 1, 2, 3, 4, 5])
    assert.deepEqual(f.query().map(hit => hit.triangle), [0, 1])
    assert.deepEqual(candidates.map(hit => hit.triangle), [1, 0], 'retained hits stay owned')
  } finally {
    f.close()
  }
})

test('triangle clipping keeps strict depth boundaries and every nonpositive perspective case', () => {
  for (const depth of [-1, 1, -2, 2]) {
    const f = fixture(triangle.map(([x, y, _z, w]) => [x, y, depth, w]))
    try {
      assert.equal(f.query().length, Math.abs(depth) === 1 ? 1 : 0, `depth ${depth}`)
    } finally {
      f.close()
    }
  }
  for (let vertex = 0; vertex < 3; vertex++)
    for (const w of [0, -1]) {
      const points = triangle.map(point => [...point])
      points[vertex][3] = w
      const f = fixture(points)
      try {
        assert.deepEqual(f.query(), [], `nonpositive w at vertex ${vertex}`)
      } finally {
        f.close()
      }
    }
  const f = fixture([[-1, -1, -2, 1], [1, -1, 2, 1], [0, 1, 0, 1]])
  try {
    assert.equal(f.query().length, 1, 'a triangle spanning the clipping planes survives')
  } finally {
    f.close()
  }
})

test('default edges include exact vertices and edges without adding native pixel padding', () => {
  const f = fixture(triangle)
  try {
    for (const [x, y] of [[-1, -1], [1, -1], [0, 1], [0, -1], [-0.5, 0], [0.5, 0]])
      assert.equal(f.query(x, y).length, 1, `boundary ${x},${y}`)
    assert.deepEqual(f.query(0.5000000001, 0), [])
    assert.deepEqual(f.query(-0.5000000001, 0), [])
    assert.deepEqual(f.query(0, -1.0000000001), [])
  } finally {
    f.close()
  }
})

test('default picking preserves ill-conditioned and nonfinite arithmetic fallbacks', () => {
  // A finite near-collinear triangle can pass the original floating-point
  // barycentric arithmetic outside its bounds. An unconditional AABB changes it.
  const f = fixture([
    [-3027.8925857543945, -2110.5651664733887, 0, 1],
    [12234.520964050293, 719.1611480712891, 0, 1],
    [4436.991838874082, -726.5389885379715, 0, 1],
  ])
  try {
    const hits = f.query(-3267.833838825011, -2155.051451394389)
    assert.equal(hits.length, 1)
    assert.deepEqual(hits[0].point, { x: 2, z: 4 })
  } finally {
    f.close()
  }
  const n = fixture(triangle.map(([x, y, _z, w]) => [x, y, NaN, w]))
  try {
    const hits = n.query()
    assert.equal(hits.length, 1)
    assert.ok(Number.isNaN(hits[0].depth))
    assert.deepEqual(hits[0].point, { x: 0.75, z: 1.5 })
  } finally {
    n.close()
  }
})
