import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { Painter } from '../app/painter.ts'
import { soundListener } from '../app/ambient-sound.ts'

const basis = [16384, 0, 0, 0, 16384, 0, 0, 0, 16384]

test('painter numbers visible object submissions before the two admitted terrain faces in their common land cell', () => {
  const landGeometry = new THREE.BufferGeometry()
  const a = [0.02, -0.02, -0.1], b = [0.2, -0.02, -0.1], c = [0.02, -0.2, -0.2], d = [0.2, -0.2, -0.2]
  landGeometry.setAttribute('position', new THREE.Float32BufferAttribute([...c, ...b, ...a, ...d, ...b, ...c], 3))
  const terrainMaterial = new THREE.MeshBasicMaterial()
  const land = new THREE.Mesh(landGeometry, terrainMaterial)
  land.userData.painterGround = true
  land.userData.terrainGrid = true
  const modelGeometry = new THREE.BufferGeometry()
  modelGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 8, 0, 0, 0, 8, 0], 3))
  const modelMaterial = new THREE.MeshBasicMaterial()
  const model = new THREE.Mesh(modelGeometry, modelMaterial)
  model.userData.nativeScale = 65536
  const holder = new THREE.Group()
  holder.position.set(0.05, -0.05, -0.15)
  holder.add(model)
  const other = model.clone()
  const otherHolder = new THREE.Group()
  otherHolder.position.set(-2, -0.05, -0.15)
  otherHolder.add(other)
  const scene = new THREE.Scene()
  scene.add(land, holder, otherHolder) // Geometry insertion is intentionally opposite.
  scene.updateMatrixWorld(true)
  const painter = new Painter({
    center: { x: 0, y: 0 },
    materials: new Set([terrainMaterial, modelMaterial]),
    uniforms: { nativeBasis: { value: basis } },
    projection: {
      matrix: basis, curvature: 0, depth: 32768, perspective: 14, scale: 65536,
      width: 100, height: 100, centerX: 50, centerY: 50,
      fractionX: 0, fractionY: 0, pixelScaleX: 1, pixelScaleY: 1,
    },
    visible: () => true,
    relative: world => ({ x: world.x * 150, y: world.y * 150, z: -10000 }),
  })
  const renderer = { setTransparentSort() {} }
  try {
    painter.update(scene, renderer)
    const land0 = painter.command(land, 0), land1 = painter.command(land, 1)
    const object = painter.command(model, 0), adjacent = painter.command(other, 0)
    assert.ok(land0 && land1 && object && adjacent)
    assert.equal(land0.cell, object.cell)
    assert.equal(land1.cell, object.cell)
    assert.equal(adjacent.cell, object.cell - 1)
    assert.deepEqual([adjacent.order, object.order, land0.order, land1.order], [0, 1, 2, 3])
    model.visible = false
    painter.update(scene, renderer)
    assert.ok(!painter.commandsBySlot.some(command => command?.cell === object.cell && command?.phase === 1))
    assert.deepEqual([painter.command(other, 0).order, painter.command(land, 0).order, painter.command(land, 1).order], [0, 1, 2])
  } finally {
    painter.dispose()
    landGeometry.dispose()
    modelGeometry.dispose()
    terrainMaterial.dispose()
    modelMaterial.dispose()
  }
})

const center = { x: 12000, y: 12000 }
const angle = 0

function frame(model, delta, { visible = true, range = true, nativeScale = 65536 } = {}) {
  const listener = soundListener(center, angle)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 16, 0, 0, 0, 16, 0], 3))
  const material = new THREE.MeshBasicMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.visible = visible
  if (nativeScale) mesh.userData.nativeScale = nativeScale
  const holder = new THREE.Group()
  holder.userData.point = { id: 52, model }
  holder.position.set((listener.x + delta - 2048) / 256, 0, -listener.y / 256 - 8)
  holder.add(mesh)
  const scene = new THREE.Scene()
  scene.add(holder)
  scene.updateMatrixWorld(true)
  const painter = new Painter({
    center, angle, materials: new Set([material]), uniforms: { nativeBasis: { value: basis } },
    visible: () => range, relative: point => ({ x: point.x, y: point.y, z: -10000 }),
  })
  painter.land = { heights: new Uint16Array(16384), categories: new Uint8Array(16384) }
  const env = { total: 0, low: 0, water: 0, high: 0, trees: true, overview: false, activity: 0 }
  painter.pendingSoundEnvironment = env
  try {
    painter.update(scene, { setTransparentSort() {} })
    assert.equal(painter.pendingSoundEnvironment, undefined)
    const command = painter.command(mesh, 0)
    return { trees: env.trees, submitted: !!command, phase: command?.phase ?? null }
  } finally {
    painter.dispose()
    geometry.dispose()
    material.dispose()
  }
}
const measure = (trees, submitted = true) => ({ trees, submitted, phase: submitted ? 1 : null })

test('ordinary painter submissions enable trees only for visible native tree models at the admitted distances', () => {
  for (const model of [1, 6]) {
    assert.deepEqual(frame(model, 2), measure(true), 'qualifying model at lowest positive aligned range')
    assert.deepEqual(frame(model, 12288), measure(true), 'qualifying model at inclusive outer range')
    assert.deepEqual(frame(model, 1), measure(false), 'low two bits of distance are excluded')
    assert.deepEqual(frame(model, 12289), measure(false), 'range exclusion does not hide the mesh')
  }
  for (const model of [0, 7, 11]) assert.deepEqual(frame(model, 2), measure(false), 'nearby non-tree model')
  assert.deepEqual(frame(3, 2, { visible: false }), measure(false, false), 'explicitly hidden object is not submitted')
  assert.deepEqual(frame(3, 2, { range: false }), measure(false, false), 'object outside admitted cells is not submitted')
  assert.deepEqual(frame(3, 2, { nativeScale: 0 }), measure(false), 'ordinary unscaled mesh is not a tree')
})
