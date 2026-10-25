import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const ReferenceView = process.env.PND_TERRAIN_BASELINE
  ? (await import(pathToFileURL(process.env.PND_TERRAIN_BASELINE).href)).RenderView
  : RenderView
const camera = new THREE.Camera()
const mouse = new THREE.Vector2(0.1, 0.1)
async function fixture() {
  const api = await loadSceneFixture()
  const { rebuildTerrain, updateWater, landIndex } = await import('../app/scene-terrain-runtime.ts')
  const world = api.createWorld(2), view = new RenderView(), reference = new ReferenceView()
  const mesh = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial(), 9)
  Object.assign(mesh.userData, { painterGround: true, terrainGrid: true, nativeRelative: true })
  const scene = { world, terrain: mesh, view, decorations: new THREE.Group(), updateView() {},
    waves: new Uint8Array(readFileSync(new URL('../public/original/waves.bin', import.meta.url))) }
  scene.landIndex = (x, z) => landIndex(scene, x, z)
  rebuildTerrain(scene)
  const update = (heading = 0, zoom = 0, center = { x: 0, z: 0 }) => {
    view.update(800, 600, center, heading, zoom, false)
    reference.update(800, 600, center, heading, zoom, false)
  }
  update()
  const expected = () => {
    const position = mesh.geometry.attributes.position
    const normalized = position.normalized
    position.normalized = true
    try { return reference.pickCandidates(mouse, [mesh], camera) }
    finally { position.normalized = normalized }
  }
  return { view, reference, mesh, world, update, expected, water: () => updateWater(scene),
    query: () => view.pickCandidates(mouse, [mesh], camera),
    close() { view.dispose(); reference.dispose(); mesh.geometry.dispose(); mesh.material.dispose() } }
}
const retain = hits => hits.map(hit => ({ ...hit, point: { ...hit.point } }))


test('scalar projection preserves candidates and winners across water, camera and seams', async () => {
  const f = await fixture()
  try {
    const held = f.query(), snapshot = retain(held)
    assert.ok(held.length)
    for (const [turn, heading, zoom, center] of [
      [0, 0, 0, { x: 0, z: 0 }], [23, 0.4, 0, { x: 4, z: 8 }],
      [256, 2, 1, { x: 124, z: -124 }], [511, -1, 0, { x: -126, z: 126 }],
      [0, 0, 0, { x: -0.0000001, z: 0.0000001 }],
    ]) {
      f.world.turn = turn; f.water(); f.update(heading, zoom, center)
      const actual = f.query(), expected = f.expected()
      assert.deepEqual(actual, expected)
      assert.deepEqual(f.view.resolvePickCandidates(actual), f.reference.resolvePickCandidates(expected))
      assert.deepEqual(f.query(), expected)
      const native = f.view.pickCandidates(mouse, [f.mesh], camera, true)
      const nativeExpected = f.reference.pickCandidates(mouse, [f.mesh], camera, true)
      assert.deepEqual(native, nativeExpected)
      assert.deepEqual(f.view.resolvePickCandidates(native), f.reference.resolvePickCandidates(nativeExpected))
    }
    assert.deepEqual(held, snapshot)
  } finally { f.close() }
})

test('custom projection hooks retain fresh values; nesting, exceptions and disposal remain isolated', async () => {
  const f = await fixture(), screen = f.view.screen, relative = f.view.relative, visible = f.view.visible
  try {
    for (const method of ['screen', 'relative']) {
      const held = [], saved = [], original = f.view[method]
      f.view[method] = function (...args) {
        const result = original.apply(this, args)
        held.push(result); saved.push({ ...result })
        return result
      }
      assert.deepEqual(f.query(), f.expected())
      const length = held.length
      f.world.turn += 23; f.water(); f.query()
      assert.ok(length > 0)
      for (let i = 0; i < length; i++) assert.deepEqual({ ...held[i] }, saved[i])
      delete f.view[method]
    }
    const expected = f.expected()
    let entered = false
    f.view.visible = function (...args) {
      if (!entered) { entered = true; assert.deepEqual(f.query(), expected); this.dispose() }
      return visible.apply(this, args)
    }
    assert.deepEqual(f.query(), expected)
    assert.ok(entered)
    f.view.visible = () => { throw new Error('interrupted') }
    assert.throws(f.query, /interrupted/)
    f.view.visible = visible
    assert.deepEqual(f.query(), expected)
  } finally { f.view.screen = screen; f.view.relative = relative; f.view.visible = visible; f.close() }
})
