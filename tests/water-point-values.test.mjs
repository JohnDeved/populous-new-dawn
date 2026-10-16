import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as THREE from 'three'
import { createNativeTerrain } from '../app/native-terrain.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { waterPoint } from '../app/water.ts'
import { waterPointValues } from '../app/water-point-values.ts'
import { vertexLighting } from '../app/projection.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

function fixture() {
  const land = createNativeTerrain(Int16Array.from({ length: 16384 }, (_, i) => i * 7 - 32768))
  for (let i = 0; i < 16384; i++) {
    land.categories[i] = i & 15
    land.buildingIds[i] = (i * 17) & 65535
    land.flags[i] = i & 1 ? 0x200 : 0x100200
  }
  const waves = Uint8Array.from({ length: 65536 }, (_, i) => (i * 37 + (i >>> 8)) & 255)
  return { land, waves }
}

function checkValues(values, land, turn, waves) {
  for (let i = 0; i < 16384; i++) {
    const expected = waterPoint(land, i, turn, waves)
    assert.equal(values.heights[i], expected.height)
    assert.equal(values.colors[i], expected.color)
  }
}

test('reused numeric storage preserves all points, phases and untouched inputs', () => {
  const { land, waves } = fixture(), owner = {}
  const original = structuredClone({ land, waves })
  let storage
  for (const turn of [0, 23, 255, 256]) {
    const values = waterPointValues(owner, land, turn, waves)
    if (storage) assert.strictEqual(values, storage)
    storage = values
    assert.equal(values.heights.byteLength + values.colors.byteLength, 262144)
    checkValues(values, land, turn, waves)
  }
  assert.deepEqual({ land, waves }, original)
  const other = waterPointValues({}, land, 0, waves)
  assert.notStrictEqual(other.heights, storage.heights)
  assert.notStrictEqual(other.colors, storage.colors)
})

test('every invocation refreshes values even with an unchanged turn', () => {
  const { land, waves } = fixture(), owner = {}, turn = 23
  const first = waterPointValues(owner, land, turn, waves)
  land.heights.fill(-123)
  land.buildingIds.fill(65535)
  land.categories.reverse()
  waves.fill(255)
  const next = waterPointValues(owner, land, turn, waves)
  assert.strictEqual(next, first)
  checkValues(next, land, turn, waves)
})

function geometry(points, surfaces) {
  const result = new THREE.BufferGeometry()
  result.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3))
  result.setAttribute('surface', new THREE.Float32BufferAttribute(surfaces, 1))
  result.setAttribute('light', new THREE.Float32BufferAttribute(new Float32Array(points.length * 3), 3))
  result.setAttribute('highlight', new THREE.Float32BufferAttribute(new Float32Array(points.length * 3), 3))
  return result
}

function expectedArrays(scene) {
  const { position, surface } = scene.terrain.geometry.attributes
  const pos = Float32Array.from(position.array), light = new Float32Array(pos.length), highlight = new Float32Array(pos.length)
  for (let j = 0; j < position.count; j++) {
    const point = waterPoint(scene.world.land, scene.landIndex(position.getX(j), position.getZ(j)), scene.world.turn, scene.waves)
    const colors = vertexLighting(point.color, surface.getX(j) ? 0 : 0xfdb935)
    pos[j * 3 + 1] = point.height / 128
    for (const [array, color] of [[light, colors.diffuse], [highlight, colors.specular]]) {
      array[j * 3] = ((color >>> 16) & 255) / 255
      array[j * 3 + 1] = ((color >>> 8) & 255) / 255
      array[j * 3 + 2] = (color & 255) / 255
    }
  }
  return { position: pos, light, highlight }
}

test('production update preserves tint, geometry replacement and all existing invalidation gates', async () => {
  await loadSceneFixture()
  const { updateWater, landIndex } = await import('../app/scene-terrain-runtime.ts')
  const { land, waves } = fixture()
  const dry = rules.terrainCategoryFlags.findIndex((bits, category) => !!(bits & 1) || !!(bits & 60 && rules.terrainCategoryMasks[category][7] & 128))
  assert.ok(dry >= 0)
  land.categories.fill(dry); land.buildingIds.fill(8192)
  const scene = { world: { land, turn: 23, landVersion: 0, lightRevision: 0 }, waves,
    terrain: { geometry: geometry([[0, 0, 0], [0, 0, 0], [258, 0, -258]], [0, 1, 0]) }, waterState: '' }
  scene.landIndex = (x, z) => landIndex(scene, x, z)
  const compare = () => {
    const expected = expectedArrays(scene)
    const versions = Object.fromEntries(Object.keys(expected).map(name => [name, scene.terrain.geometry.attributes[name].version]))
    updateWater(scene)
    for (const [name, values] of Object.entries(expected)) {
      assert.deepEqual(scene.terrain.geometry.attributes[name].array, values)
      assert.equal(scene.terrain.geometry.attributes[name].version, versions[name] + 1)
    }
  }
  compare()
  assert.notDeepEqual(scene.terrain.geometry.attributes.highlight.array.slice(0, 3), scene.terrain.geometry.attributes.highlight.array.slice(3, 6))
  const versions = ['position', 'light', 'highlight'].map(name => scene.terrain.geometry.attributes[name].version)
  updateWater(scene); assert.deepEqual(['position', 'light', 'highlight'].map(name => scene.terrain.geometry.attributes[name].version), versions)
  scene.world.turn++; compare()
  land.heights.fill(-200); scene.world.landVersion++; compare()
  land.buildingIds.fill(65535); scene.world.lightRevision++; compare()
  scene.terrain.geometry.dispose()
  scene.terrain.geometry = geometry([[1.5, 0, -8], [-257, 0, 260]], [1, 0]); compare()
  scene.terrain.geometry.attributes.position.setXYZ(0, 4, scene.terrain.geometry.attributes.position.getY(0), 10)
  // A rebuilt geometry can retain identity. Production rebuildTerrain resets this gate.
  scene.waterState = ''; compare()
  const last = scene.terrain.geometry.attributes.position.version
  scene.waves = null; updateWater(scene)
  assert.equal(scene.terrain.geometry.attributes.position.version, last)
  scene.terrain.geometry.dispose()
})
