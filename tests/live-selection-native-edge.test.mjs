import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { SelectionOverlay } from '../app/drag-overlay.ts'
import { createNativeTerrain } from '../app/native-terrain.ts'
import { browserPosition } from '../app/model.ts'

test('selection overlay emits the two original lower-half tile-23 edge triangles', () => {
  const a = { x: 512, y: 512, flags: 0x100 }
  const b = { x: 1024, y: 1024, flags: 0x100 }
  const c = { x: 768, y: 1536, flags: 0 }
  const corners = [a, b, c]
  const screen = [[100, 120], [230, 200], [200, 300]]
  const points = new Map(corners.map((p, i) => [JSON.stringify(browserPosition(p)), screen[i]]))
  const basis = [16384, 0, 0, 0, 16384, 0, 0, 0, 16384]
  const view = {
    painter: { texture: null },
    projection: {
      matrix: basis, curvature: 0, depth: 16384, perspective: 14, scale: 65536,
      width: 600, height: 600, centerX: 300, centerY: 300,
      fractionX: 0, fractionY: 0, pixelScaleX: 1, pixelScaleY: 1,
    },
    relative(point) {
      const [x, y] = points.get(JSON.stringify(point))
      return { x: x - 300, y: 300 - y, z: 0 }
    },
  }
  const atlas = new THREE.Texture()
  const overlay = new SelectionOverlay(atlas, view)
  try {
    // Supply the clipped source triangle, as the original capture supplies its
    // polygon, while running the actual projection/admission/geometry adapter.
    overlay.meshKey = JSON.stringify([corners, 0, 0])
    overlay.triangles = [[a, b, c]]
    overlay.update(corners, 0, 0, createNativeTerrain(new Uint16Array(16384)), view)
    const position = overlay.geometry.getAttribute('position')
    const uv = overlay.geometry.getAttribute('uv')
    assert.equal(overlay.geometry.drawRange.count, 9)
    assert.equal(overlay.userData.selectionCommands.length, 3)
    // Case 0 in tests/fixtures/drag-border.json (native executable-bound output).
    const lo = 0.015625, hi = 0.9843745231628418, mid = 0.4999995231628418
    const native = [
      [100, 120, lo, mid], [230, 200, hi, mid], [230, 208, hi, hi],
      [100, 120, lo, mid], [230, 208, hi, hi], [100, 128, lo, hi],
    ]
    for (const [i, [x, y, u, v]] of native.entries()) {
      assert.equal(position.getX(i + 3), Math.fround(x / 300 - 1))
      assert.equal(position.getY(i + 3), Math.fround(1 - y / 300))
      assert.equal(uv.getX(i + 3), Math.fround((7 + u) / 8))
      assert.equal(uv.getY(i + 3), Math.fround(1 - (2 + v) / 32))
    }
  } finally {
    overlay.geometry.dispose()
    overlay.material.dispose()
    atlas.dispose()
  }
})
