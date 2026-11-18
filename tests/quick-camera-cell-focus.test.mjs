import assert from 'node:assert/strict'
import test from 'node:test'
import { quickCameraTarget, SHAMAN_CAMERA_ACTION } from '../app/quick-camera-shortcuts.ts'
import { browserPosition } from '../app/world-coordinates.ts'

// Original action 0x5d packs the Shaman's cell; consumer 0043e041 centers it.
// Inputs include both signed-coordinate seams and both sides of a cell edge.
for (const [x, y, cx, cy] of [
  [0, 0, 256, 256], [511, 512, 256, 768],
  [512, 511, 768, 256], [32767, 32768, 32512, 33024],
  [65535, 65535, 65280, 65280], [12345, 54321, 12544, 54528],
]) {
  test(`Period targets the native cell center for ${x},${y}`, () => {
    const shaman = { id: 7, kind: 'shaman', team: 'blue', hp: 100, ...browserPosition({ x, y }) }
    const world = { units: [shaman], selected: [99], mode: 'blast' }
    const before = structuredClone(world)
    assert.deepEqual(quickCameraTarget(world, SHAMAN_CAMERA_ACTION), browserPosition({ x: cx, y: cy }))
    assert.deepEqual(world, before, 'resolving the camera target must not mutate gameplay')
  })
}
