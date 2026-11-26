import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('0040cde0 construction model writes CPU cap UVs with the two fixed-point units removed', async t => {
  await loadSceneFixture()
  const { nativeModel, nativeModels } = await import('../app/scene-assets.ts')
  const materialTexture = new THREE.Texture()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => materialTexture)
  const data = nativeModels[79]
  assert.deepEqual([data.faces[0], data.faces[1], data.tiles[0], data.modes[0]], [4, 31, 154, 7])
  const staged = nativeModel(79, 2, 0), finished = nativeModel(79, 2, 4)
  const read = model => Array.from(model.geometry.getAttribute('uv').array.slice(0, 12))
  // 32 * 65536 - 2 is the native raw endpoint. Apply the admitted
  // bilinear half-texel mapping within browser atlas tile (2,31).
  const endpoint = (32 * 65536 - 2) / (32 * 65536)
  const u = n => (64 + 0.5 + n * 31) / 256
  const v = n => (32 - 0.5 - n * 31) / 1024
  const corners = [[u(0), v(0)], [u(endpoint), v(0)], [u(endpoint), v(endpoint)], [u(0), v(endpoint)]]
  try {
    assert.deepEqual(read(staged), [0, 1, 2, 0, 2, 3].flatMap(i => corners[i]).map(Math.fround))
    // The completed face belongs to authored column 2/row 19, not the cap.
    for (const [i, value] of read(finished).entries()) {
      assert.ok(i % 2 ? value > 12 / 32 && value < 13 / 32 : value > 2 / 8 && value < 3 / 8)
    }
  } finally {
    for (const mesh of [staged, finished]) {
      mesh.geometry.dispose()
      mesh.material.dispose()
    }
    materialTexture.dispose()
  }
})
