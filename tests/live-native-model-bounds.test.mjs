import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('00475550 scene picking appends rounded model extrema and highest-depth bucket', async () => {
  await loadSceneFixture()
  const { ScenePicking } = await import('../app/scene-picking.ts')
  const group = new THREE.Group()
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, -0.0625, 0.0625, 0, -0.125, 0, -0.0625, -0.0625,
  ], 3))
  const material = new THREE.MeshBasicMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  group.add(mesh)
  group.userData.building = 73
  mesh.userData.stage = 4
  mesh.userData.nativeResource = {
    bank: 1, data: { tiles: [0], modes: [1], faces: [3, 16], scale: 256, biases: [0] },
  }
  const picking = new ScenePicking({
    view: {
      relative: () => ({ x: 0, y: 0, z: 0 }),
      projection: {
        matrix: [16384, 0, 0, 0, 16384, 0, 0, 0, 16384],
        curvature: 0, depth: 32768, perspective: 14, scale: 65536,
        width: 100, height: 100, centerX: 10.5, centerY: 20.5,
        fractionX: 0, fractionY: 0, pixelScaleX: 1, pixelScaleY: 1,
      },
    },
  })
  try {
    const commands = picking.model(mesh, 'first')
    assert.equal(commands.length, 2)
    assert.equal(commands[0].kind, 'model')
    assert.deepEqual(commands[1], {
      kind: 'bounds', id: 73, face: 1,
      bounds: { x: 10, y: 20, width: 24, height: 24 },
      bucket: 1798,
    })
  } finally {
    geometry.dispose()
    material.dispose()
  }
})
