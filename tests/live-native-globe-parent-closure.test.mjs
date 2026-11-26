import assert from 'node:assert/strict'
import test from 'node:test'
import { globeMesh } from '../app/globe.ts'

// Expected ordered vertices: native 00462ea0 parent closure applied to the
// CPU overview's existing viewport seeds, then read from the visible tiles.
const mesh = globeMesh({ x: 0, y: 0, width: 640, height: 480, blend: 128, flatScale: 18 })
const at = (x, y) =>
  mesh.filter(({ tile }) => tile.x === x && tile.y === y)
    .map(({ points }) => points.map(({ x, y }) => [x, y]))

test('00462ea0: a coarse CPU overview tile does not gain subdivisions', () => {
  assert.deepEqual(at(4, 4), [[[4, 4], [8, 4], [8, 8]], [[8, 8], [4, 8], [4, 4]]])
})

test('00462ea0: adaptive parent closure subdivides a positive-coordinate tile', () => {
  assert.deepEqual(at(28, 24), [
    [[30, 26], [28, 26], [28, 24]],
    [[28, 28], [28, 26], [30, 26]],
    [[30, 26], [30, 24], [32, 24]],
    [[28, 24], [30, 24], [30, 26]],
    [[30, 26], [32, 26], [32, 28]],
    [[32, 24], [32, 26], [30, 26]],
    [[28, 28], [30, 26], [32, 28]],
  ])
})

test('00462ea0: adaptive parent closure subdivides a visible tile in the wrapped view', () => {
  assert.deepEqual(at(0, 120), [
    [[4, 120], [2, 122], [0, 120]],
    [[2, 122], [4, 122], [4, 124]],
    [[4, 120], [4, 122], [2, 122]],
    [[0, 124], [2, 122], [4, 124]],
    [[0, 120], [2, 122], [0, 124]],
  ])
})
