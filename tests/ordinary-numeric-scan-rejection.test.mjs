import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { OrdinaryNumericProjection } from '../app/ordinary-numeric-projection.ts'

// The untouched scalar scan is an independent arithmetic/access-order oracle.
// These directed tests supply working storage and visibility/Painter leaves;
// they do not construct GameScene or establish rendered/runtime performance.
function originalScan(numeric, slots, index, count, mouse, object, instance, candidates, metrics) {
  const values = numeric.values
  for (let i = 0; i < count; i += 3) {
    if (metrics) metrics.visitedTriangles++
    const ia = index.getX(i), ib = index.getX(i + 1), ic = index.getX(i + 2)
    const a = (slots[ia] - 1) * 6, b = (slots[ib] - 1) * 6, c = (slots[ic] - 1) * 6
    const ax = values[a + 3], ay = values[a + 4], az = values[a + 5],
      bx = values[b + 3], by = values[b + 4], bz = values[b + 5],
      cx = values[c + 3], cy = values[c + 4], cz = values[c + 5]
    if ((az < -1 && bz < -1 && cz < -1) || (az > 1 && bz > 1 && cz > 1)) continue
    const determinant = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    if (Math.abs(determinant) < 1e-12) continue
    const u = ((by - cy) * (mouse.x - cx) + (cx - bx) * (mouse.y - cy)) / determinant,
      v = ((cy - ay) * (mouse.x - cx) + (ax - cx) * (mouse.y - cy)) / determinant,
      t = 1 - u - v
    if (u < 0 || v < 0 || t < 0) continue
    const ids = [ia, ib, ic], weights = [u / 1, v / 1, t / 1],
      sum = weights.reduce((total, weight) => total + weight),
      p = new THREE.Vector3(), source = new THREE.Vector3()
    ids.forEach((id, j) => {
      const offset = (slots[id] - 1) * 6
      source.set(values[offset], values[offset + 1], values[offset + 2])
      p.addScaledVector(source, weights[j] / sum)
    })
    if (!this.visible(p, true)) continue
    const wrap = n => ((((n + 128) % 256) + 256) % 256) - 128
    candidates.push({
      point: { x: wrap(p.x), z: wrap(p.z) }, object,
      depth: u * az + v * bz + t * cz, triangle: ids[0] / 3, instance,
    })
  }
}

const triangle = (height = 1, depth = 0) => [
  [-0, 3, 254, 0, 0, depth],
  [257, -0, -258, 1, 0, depth],
  [-259, 5, -0, 0, height, depth],
]
const ordinaryMouse = (x, y) => () => new THREE.Vector2(x, y)
const normalize = hit => hit && ({ ...hit, point: { ...hit.point }, object: 'terrain' })

function run(scan, { rows = triangle(), ids = [0, 1, 2], mouse = ordinaryMouse(0.25, 0.25),
  visible = () => true, painterDepth = () => null } = {}) {
  const numeric = new OrdinaryNumericProjection()
  numeric.values = new Float64Array(rows.flat())
  const slots = Uint32Array.from(rows, (_, i) => i + 1),
    index = new THREE.BufferAttribute(Uint32Array.from(ids), 1),
    object = new THREE.Object3D(), candidates = [], calls = [], trace = [],
    metrics = { visitedTriangles: 0 }
  let error = null
  const receiver = {
    visible(p, unwrapped) {
      calls.push([p.x, p.y, p.z, unwrapped])
      return visible(p, calls.length)
    },
  }
  try {
    scan.call(receiver, numeric, slots, index, ids.length, mouse(trace), object, 2, candidates, metrics)
  } catch (caught) {
    error = caught
  }
  const winner = RenderView.prototype.resolveCandidates.call({
    overview: false, painter: { depth: painterDepth },
  }, candidates)
  return { candidates: candidates.map(normalize), winner: normalize(winner), calls, trace, metrics, error }
}

function compare(options) {
  const expected = run(originalScan, options)
  const actual = run(RenderView.prototype.scanOrdinaryNumeric, options)
  assert.deepEqual(actual, expected)
  return actual
}

test('numeric rejection preserves both windings, every boundary and each outside half-plane', () => {
  for (const ids of [[0, 1, 2], [0, 2, 1]]) {
    for (const [x, y] of [[0.25, 0.25], [0, 0], [1, 0], [0, 1], [0.5, 0], [0, 0.5], [0.5, 0.5]]) {
      const actual = compare({ ids, mouse: ordinaryMouse(x, y) })
      assert.equal(actual.candidates.length, 1)
      assert.equal(actual.calls.length, 1)
    }
    for (const [x, y] of [[2, 0], [-0.25, 0.25], [0.25, -0.25]]) {
      const actual = compare({ ids, mouse: ordinaryMouse(x, y) })
      assert.equal(actual.candidates.length, 0)
      assert.equal(actual.calls.length, 0)
      assert.equal(actual.metrics.visitedTriangles, 1)
    }
  }
})

test('numeric rejection retains signed zero, NaN, infinity, depth and determinant boundaries', () => {
  for (const ids of [[0, 1, 2], [0, 2, 1]]) {
    for (const x of [-Infinity, -1, -0, 0, 0.25, 1, Infinity, NaN])
      for (const y of [-Infinity, -0, 0, 0.25, Infinity, NaN])
        compare({ ids, mouse: ordinaryMouse(x, y) })
    for (const height of [-Infinity, -2e-12, -1e-12, -0.5e-12, -0, 0, 0.5e-12, 1e-12, 2e-12, Infinity, NaN]) {
      const actual = compare({ rows: triangle(height), ids, mouse: ordinaryMouse(0.25, height * 0.25) })
      if (Number.isFinite(height))
        assert.equal(actual.candidates.length, Math.abs(height) < 1e-12 ? 0 : 1)
    }
    for (const depth of [-Infinity, -2, -1, -0, 0, 1, 2, Infinity, NaN]) {
      const actual = compare({ rows: triangle(1, depth), ids })
      assert.equal(actual.candidates.length, depth < -1 || depth > 1 ? 0 : 1)
    }
  }
  // Reversed winding at the opposite edge produces a negative-zero u.
  assert.ok(Object.is((0 * (1 - 1) + 1 * (0 - 0)) / -1, -0))
  assert.equal(compare({ ids: [0, 2, 1], mouse: ordinaryMouse(1, 0) }).candidates.length, 1)
  assert.equal(compare({ mouse: ordinaryMouse(NaN, 0) }).calls.length, 1)
})

function tracedMouse(firstX, firstY, secondX, secondY, { coerce = false, throwAt = null,
  sentinel = new Error('mouse access sentinel') } = {}) {
  return trace => {
    let nx = 0, ny = 0
    const read = (axis, count, value) => {
      const name = `${axis}${count}`
      trace.push(`get-${name}`)
      if (throwAt === `get-${name}`) throw sentinel
      if (!coerce) return value
      return { [Symbol.toPrimitive]() {
        trace.push(`coerce-${name}`)
        if (throwAt === `coerce-${name}`) throw sentinel
        return value
      } }
    }
    return {
      get x() { return read('x', ++nx, nx === 1 ? firstX : secondX) },
      get y() { return read('y', ++ny, ny === 1 ? firstY : secondY) },
    }
  }
}

test('u-negative misses retain the second mouse reads, coercions and changing values', () => {
  for (const coerce of [false, true])
    for (const second of [[0.25, 0.25], [Infinity, NaN], [-Infinity, -0]]) {
      const actual = compare({ mouse: tracedMouse(2, 0, ...second, { coerce }) })
      assert.deepEqual(actual.trace, coerce
        ? ['get-x1', 'coerce-x1', 'get-y1', 'coerce-y1', 'get-x2', 'coerce-x2', 'get-y2', 'coerce-y2']
        : ['get-x1', 'get-y1', 'get-x2', 'get-y2'])
      assert.equal(actual.error, null)
      assert.equal(actual.candidates.length, 0)
      assert.equal(actual.calls.length, 0)
    }
  // For survivors, v must use the second pair, not a hoisted first pair.
  assert.equal(compare({ mouse: tracedMouse(0.25, 0.25, 2, 0) }).candidates.length, 0)
  assert.equal(compare({ mouse: tracedMouse(0.25, 0.25, 0.25, 0.25) }).candidates.length, 1)
})

test('u-negative misses do not suppress second-read or coercion exceptions', () => {
  for (const throwAt of ['get-x2', 'get-y2', 'coerce-x2', 'coerce-y2']) {
    const sentinel = new Error(throwAt)
    const actual = compare({ mouse: tracedMouse(2, 0, 0.25, 0.25, { coerce: true, throwAt, sentinel }) })
    assert.equal(actual.error, sentinel)
    assert.equal(actual.trace.at(-1), throwAt)
    assert.equal(actual.candidates.length, 0)
    assert.equal(actual.calls.length, 0)
  }
  for (const value of [Symbol('mouse'), 1n]) {
    const actual = compare({ mouse: tracedMouse(2, 0, value, 0) })
    assert.ok(actual.error instanceof TypeError)
    assert.deepEqual(actual.trace, ['get-x1', 'get-y1', 'get-x2'])
  }
})

test('accepted ordering, visibility, Painter ties and independent candidate snapshots remain stable', () => {
  const rows = [...triangle(), ...triangle(1, 0.5)], ids = [0, 1, 2, 3, 4, 5]
  const both = compare({ rows, ids })
  assert.deepEqual(both.candidates.map(hit => hit.triangle), [0, 1])
  assert.equal(both.winner.triangle, 0)
  const hidden = compare({ rows, ids, visible: (_p, call) => call === 2 })
  assert.deepEqual(hidden.candidates.map(hit => hit.triangle), [1])
  assert.equal(hidden.calls.length, 2)
  const painter = compare({ rows, ids, painterDepth: (_object, triangle) => triangle ? -0.5 : 0.5 })
  assert.equal(painter.winner.triangle, 1)
  assert.equal(compare({ rows, ids, painterDepth: () => 0 }).winner.triangle, 0)
  // Snapshot-only check: run() normalizes/copies results and uses fresh storage.
  // Reused-projection output ownership remains covered by the integration tests.
  const retained = structuredClone(both.candidates)
  compare({ rows, ids, mouse: ordinaryMouse(0.1, 0.2) })
  assert.deepEqual(both.candidates, retained)
})
