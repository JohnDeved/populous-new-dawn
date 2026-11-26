import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('0046c340 actual water/land updater writes numeric diffuse and bounded warm highlight', async () => {
  await loadSceneFixture()
  const { updateWater } = await import('../app/scene-terrain-runtime.ts')
  const geometry = new THREE.BufferGeometry(), count = 5
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(
    Array.from({ length: count }, (_, i) => [i, 0, 0]).flat(), 3))
  geometry.setAttribute('surface', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1], 1))
  const light = new THREE.Float32BufferAttribute(count * 3, 3)
  const highlight = new THREE.Float32BufferAttribute(count * 3, 3)
  geometry.setAttribute('light', light).setAttribute('highlight', highlight)
  const scene = {
    terrain: { geometry }, waves: new Uint8Array(65536), landIndex: x => x,
    world: {
      turn: 0, landVersion: 0, lightRevision: 0,
      land: {
        heights: new Uint16Array(count), categories: new Uint8Array([1, 0, 0, 0, 0]),
        flags: new Uint32Array(count),
        buildingIds: new Uint16Array([0, 0, 1 << 10, 52 << 10, 52 << 10]),
      },
    },
  }
  const rgb = attribute => Array.from(attribute.array, n => Math.round(n * 255))
  try {
    updateWater(scene)
    assert.deepEqual(rgb(light), [128,128,128, 255,255,255, 255,255,255, 255,255,255, 255,255,255])
    assert.deepEqual(rgb(highlight), [0,0,0, 0,0,0, 4,3,1, 253,185,53, 0,0,0])
    assert.equal(light.version, 1)
    assert.equal(highlight.version, 1)
  } finally {
    geometry.dispose()
  }
})
