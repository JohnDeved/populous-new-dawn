import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { Painter } from '../app/painter.ts'

const basis = [16384, 0, 0, 0, 16384, 0, 0, 0, 16384]

function groundCommand({ x = 0, y = 0, z = -10000, reverse = false, landFlags = 0 } = {}) {
  const geometry = new THREE.BufferGeometry()
  const points = [[x, y, 0], [x + 10, y, 0], [x, y - 10, 0]]
  if (!reverse) points.reverse()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3))
  const material = new THREE.MeshBasicMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData.painterGround = true
  mesh.userData.terrainGrid = true
  const scene = new THREE.Scene()
  scene.add(mesh)
  scene.updateMatrixWorld(true)
  const painter = new Painter({
    center: { x: 0, y: 0 },
    materials: new Set([material]),
    uniforms: { nativeBasis: { value: basis } },
    projection: {
      matrix: basis, curvature: 0, depth: 32768, perspective: 14, scale: 65536,
      width: 100, height: 100, centerX: 50, centerY: 50,
      fractionX: 0, fractionY: 0, pixelScaleX: 1, pixelScaleY: 1,
    },
    visible: () => true,
    relative: world => ({ x: world.x, y: world.y, z }),
  })
  // At x=0,z=0 the first vertex maps to land cell (124,4).
  painter.landFlags[(124 << 7) | 4] = landFlags
  try {
    painter.update(scene, { setTransparentSort() {} })
    return painter.command(mesh, 0)
  } finally {
    painter.dispose()
    geometry.dispose()
    material.dispose()
  }
}

test('0046d970 ground painter queues front-facing top, but rejects common bottom and side outcodes', () => {
  assert.ok(groundCommand(), 'normal front-facing triangle is admitted')
  assert.ok(groundCommand({ y: 100 }), 'no common top discard')
  assert.equal(groundCommand({ y: -100 }), undefined, 'common bottom discard')
  assert.equal(groundCommand({ x: -100 }), undefined, 'common left discard')
  assert.equal(groundCommand({ x: 100 }), undefined, 'common right discard')
  assert.equal(groundCommand({ reverse: true }), undefined, 'reversed winding discarded')
})

test('0046e930 admitted ground painter commands expose cutoff, raised adjustment and cap', () => {
  assert.equal(groundCommand({ z: -28609 }).bucket, 0)
  assert.equal(groundCommand({ z: -28607 }).bucket, 4)
  assert.equal(groundCommand().bucket, 1162)
  assert.equal(groundCommand({ landFlags: 0x200 }).bucket, 1178)
  assert.equal(groundCommand({ landFlags: 0x100200 }).bucket, 1162)
  assert.equal(groundCommand({ z: 30000 }).bucket, 3584)
})
