import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'

const camera = new THREE.Camera()
const mouse = new THREE.Vector2(1 / 12, 1 / 12)
const corners = [[0, 0, 0], [0, 0, 2], [2, 0, 0], [2, 0, 0], [0, 0, 2], [2, 0, 2]]
const project = p => new THREE.Vector4(p.x / 8, (p.z + p.y) / 8, 0, 1)

function mesh() {
  const geometry = new THREE.BufferGeometry()
  const position = new THREE.Float32BufferAttribute(new Float32Array(128 * 128 * 6 * 3), 3)
  for (const start of [0, position.count - 6])
    corners.forEach((point, i) => position.setXYZ(start + i, ...point))
  geometry.setAttribute('position', position)
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array([0, 1, 2, 3, 4, 5]), 1))
  const result = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial(), 2)
  Object.assign(result.userData, { terrainGrid: true, painterGround: true, nativeRelative: true })
  result.count = 1
  result.setMatrixAt(0, new THREE.Matrix4())
  result.setMatrixAt(1, new THREE.Matrix4().makeTranslation(0, 1, 0))
  return result
}

function view() {
  const result = new RenderView()
  result.updateTerrainVisibility = () => {}
  result.visible = () => true
  result.screen = project
  return result
}

// Float32 normalization has no numeric effect. It disables only the fast-path
// eligibility, leaving the same triangle math and submitted geometry as oracle.
function oracle(objects, point = mouse) {
  const reference = view()
  const positions = objects.map(object => object.geometry.attributes.position)
  const normalized = positions.map(position => position.normalized)
  positions.forEach(position => { position.normalized = true })
  try {
    return reference.pickCandidates(point, objects, camera)
  } finally {
    positions.forEach((position, i) => { position.normalized = normalized[i] })
    reference.dispose()
  }
}

function close(v, ...objects) {
  v.dispose()
  for (const object of objects) {
    object.geometry.dispose()
    object.material.dispose()
  }
}

test('bounded maps and packed containers are reused, but current geometry is recomputed', () => {
  const v = view(), object = mesh()
  try {
    let calls = 0
    v.screen = p => { calls++; return project(p) }
    const first = v.pickCandidates(mouse, [object], camera)
    assert.deepEqual(first, oracle([object]))
    assert.ok(first.length > 0)
    assert.equal(calls, 4)
    const retained = first.map(hit => ({ ...hit, point: { ...hit.point } }))
    const scratch = v.ordinaryPickScratch
    assert.equal(scratch.corners.byteLength + scratch.slots.byteLength, 459780)
    const storage = [scratch.corners, scratch.slots, scratch.world, scratch.screen]
    assert.equal(scratch.world.length, 0, 'no projected objects retained between calls')
    assert.equal(scratch.screen.length, 0)
    for (let run = 0; run < 4; run++) {
      const position = object.geometry.attributes.position
      // No needsUpdate/version change: scratch is not a geometry cache.
      for (let i = 0; i < 6; i++) position.setY(i, run / 4)
      calls = 0
      const hits = v.pickCandidates(mouse, [object], camera)
      assert.equal(calls, 4, 'all distinct current corners are recomputed')
      assert.deepEqual(hits, oracle([object]))
      assert.equal(v.ordinaryPickScratch, scratch)
      storage.forEach((buffer, i) => assert.equal(buffer,
        [scratch.corners, scratch.slots, scratch.world, scratch.screen][i]))
      if (hits.length) assert.notEqual(hits[0].point, first[0].point)
    }
    assert.deepEqual(first, retained, 'returned points are independently owned')
    object.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(
      Array.from({ length: 6 }, (_, i) => object.geometry.attributes.position.count - 6 + i)
    ), 1))
    assert.deepEqual(v.pickCandidates(mouse, [object], camera), oracle([object]))
    object.count = 2
    assert.deepEqual(v.pickCandidates(mouse, [object], camera), oracle([object]))
    assert.equal(v.ordinaryPickScratch, scratch, 'instances reuse bounded storage sequentially')
  } finally { close(v, object) }
})

test('empty, miss, replacement and custom geometry cannot leak stale scratch entries', () => {
  const v = view(), object = mesh(), other = mesh()
  try {
    const compare = () => assert.deepEqual(v.pickCandidates(mouse, [object], camera), oracle([object]))
    compare()
    assert.deepEqual(v.pickCandidates(mouse, [], camera), [])
    assert.equal(v.pick(new THREE.Vector2(10, 10), [object], camera), null)
    object.geometry.setDrawRange(0, 0)
    compare()
    object.geometry.setDrawRange(0, Infinity)
    compare()
    const old = object.geometry
    object.geometry = other.geometry.clone()
    old.dispose()
    object.geometry.attributes.position.setY(0, 2)
    compare()
    const replacement = object.geometry
    object.geometry = new THREE.BufferGeometry()
    object.geometry.setAttribute('position', new THREE.Float32BufferAttribute(corners.flat(), 3))
    replacement.dispose()
    compare() // Small, non-indexed custom geometry uses independent arrays.
    object.geometry.setIndex([0, 1, 2])
    compare()
    object.geometry.setDrawRange(0, 0)
    compare()
    object.geometry.dispose()
    object.geometry = other.geometry.clone()
    compare()
  } finally { close(v, object, other) }
})

test('views and reentrant queries have independent storage, including thrown callbacks', () => {
  const v = view(), second = view(), object = mesh(), nested = mesh()
  try {
    const high = nested.geometry.attributes.position.count - 6
    nested.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(
      [high, high + 1, high + 2, high + 3, high + 4, high + 5]
    ), 1))
    for (let i = high; i < high + 6; i++) nested.geometry.attributes.position.setY(i, 0.25)
    const expected = oracle([object]), nestedExpected = oracle([nested])
    assert.deepEqual(v.pickCandidates(mouse, [object], camera), expected)
    second.pickCandidates(mouse, [nested], camera)
    assert.notEqual(v.ordinaryPickScratch, second.ordinaryPickScratch)
    assert.notEqual(v.ordinaryPickScratch.slots.buffer, second.ordinaryPickScratch.slots.buffer)
    const scratch = v.ordinaryPickScratch
    let entered = false, nesting = false, projections = 0
    v.screen = p => {
      projections++
      if (!entered && !nesting && projections === 3) {
        entered = true
        nesting = true
        const slots = scratch.slots.slice(), corners = scratch.corners.slice()
        assert.deepEqual(v.pickCandidates(mouse, [nested], camera), nestedExpected)
        assert.deepEqual(scratch.slots, slots)
        assert.deepEqual(scratch.corners, corners)
        nesting = false
      }
      return project(p)
    }
    assert.deepEqual(v.pickCandidates(mouse, [object], camera), expected)
    assert.ok(entered)
    assert.equal(v.ordinaryPickScratch, scratch)
    v.screen = () => { throw new Error('projection interrupted') }
    assert.throws(() => v.pickCandidates(mouse, [object], camera), /projection interrupted/)
    assert.equal(v.ordinaryPickDepth, 0)
    assert.equal(scratch.world.length, 0)
    assert.equal(scratch.screen.length, 0)
    v.screen = project
    assert.deepEqual(v.pickCandidates(mouse, [object], camera), expected)
  } finally { second.dispose(); close(v, object, nested) }
})

test('dispose releases retained storage; subsequent and active queries remain safe', () => {
  const v = view(), object = mesh()
  try {
    const expected = oracle([object])
    v.pickCandidates(mouse, [object], camera)
    const scratch = v.ordinaryPickScratch
    v.dispose()
    assert.equal(v.ordinaryPickScratch, null)
    assert.deepEqual(v.pickCandidates(mouse, [object], camera), expected)
    assert.notEqual(v.ordinaryPickScratch, scratch)
    let disposed = false
    v.screen = p => {
      if (!disposed) { disposed = true; v.dispose() }
      return project(p)
    }
    assert.deepEqual(v.pickCandidates(mouse, [object], camera), expected)
    assert.equal(v.ordinaryPickScratch, null)
    v.screen = project
    assert.deepEqual(v.pickCandidates(mouse, [object], camera), expected)
  } finally { close(v, object) }
})
