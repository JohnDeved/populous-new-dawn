import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as THREE from 'three'
import { PainterVertices } from '../app/painter-vertices.ts'

test('shared painter vertices follow attribute edits, splits and replacement', () => {
  for (const interleaved of [false, true]) {
    const values = new Float32Array([1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3])
    const position = interleaved
      ? new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(values, 3), 3, 0)
      : new THREE.BufferAttribute(values, 3)
    const cache = new PainterVertices(),
      first = cache.get(position)
    assert.deepEqual([...first.source], [0, 1, 0, 1, 4, 0])
    assert.equal(cache.get(position), first)
    for (const i of [0, 2, 5]) position.setY(i, 99)
    position.needsUpdate = true
    assert.equal(cache.get(position), first)
    position.setZ(2, 100)
    position.needsUpdate = true
    const split = cache.get(position)
    assert.notEqual(split, first)
    assert.deepEqual([...split.source], [0, 1, 2, 1, 4, 0])
    for (let i = 0; i < position.count; i++) {
      const source = split.source[i]
      assert.deepEqual(
        [position.getX(i), position.getY(i), position.getZ(i)],
        [position.getX(source), position.getY(source), position.getZ(source)]
      )
    }
    assert.notEqual(cache.get(position.clone()), split)
  }
})

test('native grid mapping matches exact XYZ mapping and rejects split heights or irregular coordinates', () => {
  for (const values of [
    [-128, 1, -128, -126, 2, -128, -128, 1, -128, 128, 3, 128],
    [-128, 1, -128, -126, 2, -128, -128, 4, -128, 128, 3, 128],
    [-128.5, 1, -128, -126, 2, -128, -128.5, 1, -128, 128, 3, 128],
  ]) {
    const position = new THREE.Float32BufferAttribute(values, 3)
    const general = new PainterVertices().get(position)
    const grid = new PainterVertices().get(position, true)
    assert.deepEqual(grid.source, general.source)
  }
})
