import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as THREE from 'three'
import { Painter } from '../app/painter.ts'

test('painter centers are precise mutable caches isolated by source attribute', () => {
  const painter = new Painter(null)
  try {
    for (const interleaved of [false, true]) {
      const values = new Float32Array([1.999, 8, -3, 2, -4, 9, 2.001, 2, 17])
      const position = interleaved
        ? new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(values, 3), 3, 0)
        : new THREE.BufferAttribute(values, 3)
      const check = () => {
        const expected = new THREE.Vector3(), vertex = new THREE.Vector3()
        for (let i = 0; i < 3; i++) expected.add(vertex.fromBufferAttribute(position, i))
        expected.multiplyScalar(1 / 3)
        const centers = painter.triangleCenters(position)
        assert.deepEqual([...centers.array], expected.toArray())
        assert.equal(painter.triangleCenters(position), centers)
        return centers
      }
      const first = check(), backing = first.array, previous = Float64Array.from(first.array)
      position.setXYZ(1, 200.1, -70, 10.7)
      position.needsUpdate = true
      assert.equal(check(), first)
      assert.equal(first.array, backing)
      assert.notDeepEqual(first.array, previous, 'version changes recompute the reused storage')
      assert.notEqual(painter.triangleCenters(position.clone()), painter.triangleCenters(position))
    }
  } finally {
    painter.texture.dispose()
  }
})


test('painter centers resize for source count changes and preserve ordered arithmetic', () => {
  const painter = new Painter(null)
  try {
    const position = new THREE.BufferAttribute(new Float64Array([
      1e16, -0, -1e16, 1, 2, 3, -1e16, 4, 1e16,
    ]), 3)
    const first = painter.triangleCenters(position)
    const ordered = () => {
      const result = new Float64Array(position.count), center = new THREE.Vector3(), vertex = new THREE.Vector3()
      for (let i = 0; i < position.count; i += 3) {
        center.set(0, 0, 0)
        for (let j = 0; j < 3; j++) center.add(vertex.fromBufferAttribute(position, i + j))
        center.multiplyScalar(1 / 3)
        result.set(center.toArray(), i)
      }
      return result
    }
    assert.deepEqual(first.array, ordered())
    position.array = new Float64Array([1,2,3,4,5,6,7,8,9, 1e16,0,1,-1e16,0,2,1,0,3])
    position.count = 6
    position.needsUpdate = true
    const resized = painter.triangleCenters(position)
    assert.notEqual(resized, first)
    assert.notEqual(resized.array, first.array)
    assert.deepEqual(resized.array, ordered())
    position.setXYZ(0, -0, 1 / 3, -1 / 7)
    position.needsUpdate = true
    assert.equal(painter.triangleCenters(position), resized)
    assert.deepEqual(resized.array, ordered())
    const replacement = position.clone()
    assert.notEqual(painter.triangleCenters(replacement), resized)
    assert.deepEqual(painter.triangleCenters(replacement).array, resized.array)
    assert.notEqual(painter.triangleCenters(replacement).array, resized.array)
    position.array = new Float64Array([3,2,1,6,5,4,9,8,7])
    position.count = 3
    position.needsUpdate = true
    const smaller = painter.triangleCenters(position)
    assert.notEqual(smaller, resized)
    assert.deepEqual(smaller.array, ordered())
  } finally { painter.texture.dispose() }
})

test('interleaved views sharing a data version retain separate center storage', () => {
  const painter = new Painter(null)
  try {
    const data = new THREE.InterleavedBuffer(new Float64Array([
      1,2,3, 10,20,30, 4,5,6, 40,50,60, 7,8,9, 70,80,90,
    ]), 6)
    const a = new THREE.InterleavedBufferAttribute(data,3,0)
    const b = new THREE.InterleavedBufferAttribute(data,3,3)
    const ca = painter.triangleCenters(a), cb = painter.triangleCenters(b)
    assert.notEqual(ca, cb)
    assert.notEqual(ca.array, cb.array)
    assert.deepEqual([...ca.array],[4,5,6])
    assert.deepEqual([...cb.array],[40,50,60])
    a.setXYZ(0,10,11,12)
    data.needsUpdate = true
    assert.equal(painter.triangleCenters(a),ca)
    assert.equal(painter.triangleCenters(b),cb)
    assert.deepEqual([...ca.array],[7,8,9])
    assert.deepEqual([...cb.array],[40,50,60])
    const independentView = new THREE.InterleavedBufferAttribute(data,3,0)
    assert.notEqual(painter.triangleCenters(independentView),ca)
    assert.deepEqual(painter.triangleCenters(independentView).array,ca.array)
  } finally { painter.texture.dispose() }
})
