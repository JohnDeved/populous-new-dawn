import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { Painter } from '../app/painter.ts'

test('ordinary opaque model commands receive one successively nearer depth per painter rank', () => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 8, 0, 0, 0, 8, 0], 3))
  const material = new THREE.MeshBasicMaterial()
  const scene = new THREE.Scene()
  const meshes = [.05, .06, .07].map(x => {
    const mesh = new THREE.Mesh(geometry, material), holder = new THREE.Group()
    mesh.userData.nativeScale = 65536
    holder.position.set(x, -.05, -.15)
    holder.add(mesh)
    scene.add(holder)
    return mesh
  })
  scene.updateMatrixWorld(true)
  const matrix = [16384, 0, 0, 0, 16384, 0, 0, 0, 16384]
  const painter = new Painter({
    center: { x: 0, y: 0 }, materials: new Set([material]),
    uniforms: { nativeBasis: { value: matrix } },
    projection: {
      matrix, curvature: 0, depth: 32768, perspective: 14, scale: 65536,
      width: 100, height: 100, centerX: 50, centerY: 50,
      fractionX: 0, fractionY: 0, pixelScaleX: 1, pixelScaleY: 1,
    },
    visible: () => true,
    relative: world => ({ x: world.x * 150, y: world.y * 150, z: world.x > .065 ? -9800 : -10000 }),
  })
  const renderer = { setTransparentSort() {} }
  const command = mesh => painter.command(mesh, 0)
  const depth = mesh => painter.depth(mesh, 0, 0)
  // Painter.depth converts its float32 texture value from normalized to clip depth.
  const start = 2 * Math.fround(.999) - 1
  try {
    painter.update(scene, renderer)
    assert.deepEqual(meshes.map(mesh => command(mesh)?.bucket), [1162, 1162, 1174])
    assert.deepEqual(meshes.map(mesh => command(mesh)?.order), [0, 1, 2])
    assert.deepEqual(meshes.map(depth), [start - 2 / 8192, start - 1 / 8192, start])
    meshes[2].visible = false
    painter.update(scene, renderer)
    assert.equal(command(meshes[2]), undefined)
    assert.deepEqual(meshes.slice(0, 2).map(depth), [start - 1 / 8192, start])
  } finally {
    painter.dispose()
    geometry.dispose()
    material.dispose()
  }
})
