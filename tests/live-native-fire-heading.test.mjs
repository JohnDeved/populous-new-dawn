import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('004eebc0 live fire facing uses camera-behind origin and signed map displacement', async () => {
  await loadSceneFixture()
  const { animateFx } = await import('../app/scene-effects.ts')
  const scene = { world: { turn: 0 }, view: { center: { x: 0, y: 0 } }, cameraBearing: 0 }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(1024, 2))
  const material = new THREE.MeshBasicMaterial()
  const mesh = new THREE.Mesh(geometry, material), group = new THREE.Group()
  group.add(mesh)
  const fx = { fire: { x: 0, y: 0, scale: 256, frame: 0, heading: -1 } }
  try {
    animateFx(scene, group, fx)
    assert.equal(group.userData.nativeHeading, 1024, 'cardinal camera-behind control')
    fx.fire.y = 32768
    scene.world.turn = 8 // Advance the browser adapter; its cadence is outside native scope.
    animateFx(scene, group, fx)
    assert.equal(group.userData.nativeHeading, 0, 'signed map Y wraps before facing')
  } finally {
    geometry.dispose()
    material.dispose()
  }
})
