import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as THREE from 'three'
import { Painter } from '../app/painter.ts'

test('painter centers retain precision and follow position replacement and updates', () => {
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
      const first = check()
      position.setXYZ(1, 200.1, -70, 10.7)
      position.needsUpdate = true
      assert.notEqual(check(), first)
      assert.notEqual(painter.triangleCenters(position.clone()), painter.triangleCenters(position))
    }
  } finally {
    painter.texture.dispose()
  }
})
