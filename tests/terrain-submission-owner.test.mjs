import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { bindSceneEnvironment } from './support/world-environment-scene.mjs'

async function fixture(t) {
  const api = await loadSceneFixture()
  const { GameScene } = await import('../app/scene.ts')
  const { initializeTerrain } = await import('../app/scene-terrain-runtime.ts')
  const { RenderView } = await import('../app/render-view.ts')
  const previousFetch = globalThis.fetch
  globalThis.fetch = async url => {
    const bytes = readFileSync(new URL(`../public${url}`, import.meta.url))
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }
  }
  t.after(() => { globalThis.fetch = previousFetch })
  const view = new RenderView()
  const runtime = Object.assign(Object.create(GameScene.prototype), {
    world: api.createWorld(2), terrainLoad: new AbortController(),
    terrainMap: new THREE.DataTexture(),
    waterMap: new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256),
    view, decorations: new THREE.Group(), updateTerrainTexture() {}, updateView() {},
  })
  await bindSceneEnvironment(runtime)
  const initialized = initializeTerrain(runtime)
  runtime.terrain = initialized.terrain
  await initialized.ready
  runtime.rebuildTerrain()
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const scene = new THREE.Scene()
  scene.add(runtime.terrain)
  view.prepare(scene)
  view.painter.update = () => {}
  let validationCalls = 0
  const validate = view.terrainSubmissionMatches
  view.terrainSubmissionMatches = function (...args) {
    validationCalls++
    return validate.apply(this, args)
  }
  const prepare = () => view.updateTerrainVisibility(runtime.terrain)
  t.after(() => { runtime.terrain.geometry.dispose(); runtime.terrain.material.dispose(); view.dispose() })
  return { view, runtime, scene, prepare, validations: () => validationCalls }
}

function prefix(mesh) {
  return Array.from(mesh.geometry.index.array.slice(0, mesh.geometry.drawRange.count))
}

test('actual initialized terrain avoids index validation after ordinary picks, water and in-place rebuild', async t => {
  const f = await fixture(t)
  f.view.pickCandidates(new THREE.Vector2(), [f.runtime.terrain], new THREE.Camera())
  const calls = f.validations(), indices = prefix(f.runtime.terrain)
  assert.equal(calls, 1)
  const version = f.runtime.terrain.geometry.index.version
  f.runtime.world.turn = 23
  f.runtime.updateWater()
  f.scene.onBeforeRender({})
  f.prepare()
  assert.equal(f.validations(), calls, 'water/render do zero prefix validation work')
  assert.equal(f.runtime.terrain.geometry.index.version, version)
  assert.deepEqual(prefix(f.runtime.terrain), indices)
  f.runtime.rebuildTerrain()
  f.prepare()
  assert.equal(f.validations(), calls, 'position-only rebuild preserves submission ownership')
  f.view.update(3440, 1440, { x: 128, z: -128 }, Math.PI / 2, 50, false)
  f.prepare()
  assert.equal(f.validations(), calls + 1, 'changed selection validates once')
  f.prepare()
  assert.equal(f.validations(), calls + 1)
  f.view.overview = true
  f.prepare()
  assert.equal(f.validations(), calls + 2)
})

test('marked index edits and draw range changes validate once, then regain certificate', async t => {
  const f = await fixture(t)
  f.prepare()
  const mesh = f.runtime.terrain, expected = prefix(mesh)
  for (const mutate of [
    () => { mesh.geometry.index.array[0] = 123; mesh.geometry.index.needsUpdate = true },
    () => { mesh.geometry.setDrawRange(6, 6) },
  ]) {
    const calls = f.validations()
    mutate(); f.prepare()
    assert.equal(f.validations(), calls + 1)
    assert.deepEqual(prefix(mesh), expected)
    f.prepare()
    assert.equal(f.validations(), calls + 1)
  }
})

test('debug revocation repairs unversioned raw edits and remains on validating fallback', async t => {
  const f = await fixture(t)
  f.prepare()
  const mesh = f.runtime.terrain, expected = prefix(mesh), calls = f.validations()
  f.view.revokeTerrainSubmission(mesh)
  mesh.geometry.index.array[0] = 123
  f.prepare(); f.prepare()
  assert.equal(f.validations(), calls + 2)
  assert.deepEqual(prefix(mesh), expected)
  f.runtime.rebuildTerrain()
  f.prepare()
  assert.equal(f.validations(), calls + 3, 'rebuild does not silently regrant revoked ownership')
})

for (const [name, mutate] of [
  ['geometry identity', mesh => { mesh.geometry = mesh.geometry.clone() }],
  ['index identity', mesh => { mesh.geometry.index = mesh.geometry.index.clone() }],
  ['array identity', mesh => { mesh.geometry.index.array = mesh.geometry.index.array.slice() }],
  ['geometry method', mesh => { const set = mesh.geometry.setDrawRange; mesh.geometry.setDrawRange = (...args) => set.apply(mesh.geometry, args) }],
]) test(`${name} changes revoke production certificate`, async t => {
  const f = await fixture(t)
  f.prepare()
  const calls = f.validations(), expected = prefix(f.runtime.terrain)
  mutate(f.runtime.terrain)
  f.runtime.terrain.geometry.index.array[0] = 123
  f.prepare(); f.prepare()
  assert.equal(f.validations(), calls + 2)
  assert.deepEqual(prefix(f.runtime.terrain), expected)
})

test('custom index methods permanently revoke certification and retain original writes', async t => {
  const f = await fixture(t)
  f.prepare()
  const index = f.runtime.terrain.geometry.index, setX = index.setX
  let writes = 0
  index.setX = function (...args) { writes++; return setX.apply(this, args) }
  f.prepare()
  assert.equal(writes, f.runtime.terrain.geometry.drawRange.count)
  index.setX = setX
  const calls = f.validations()
  f.prepare(); f.prepare()
  assert.equal(f.validations(), calls + 2)
})

test('matching userData flags never certify a custom mesh', async t => {
  const f = await fixture(t)
  f.prepare()
  const mesh = f.runtime.terrain.clone()
  mesh.geometry = mesh.geometry.clone()
  const calls = f.validations()
  f.view.updateTerrainVisibility(mesh)
  mesh.geometry.index.array[0] = 123
  f.view.updateTerrainVisibility(mesh)
  assert.equal(f.validations(), calls + 2)
  assert.deepEqual(prefix(mesh), prefix(f.runtime.terrain))
  mesh.geometry.dispose()
})

test('native queries preserve existing submission and do not run certificate preparation', async t => {
  const f = await fixture(t)
  f.prepare()
  f.runtime.terrain.geometry.setDrawRange(0, 0)
  const calls = f.validations()
  f.view.pickCandidates(new THREE.Vector2(), [f.runtime.terrain], new THREE.Camera(), true)
  assert.equal(f.validations(), calls)
  assert.equal(f.runtime.terrain.geometry.drawRange.count, 0)
  f.prepare()
  assert.equal(f.validations(), calls + 1)
})

test('shipped rebuild replacement clears the old certificate and preserves explicit ownership', async t => {
  const f = await fixture(t)
  f.prepare()
  const mesh = f.runtime.terrain, oldGeometry = mesh.geometry, expected = prefix(mesh)
  // The production rebuild replaces an incompatible vertex layout. This is a
  // position/layout edit, not an unversioned write to the owned index.
  mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(18), 3))
  f.runtime.rebuildTerrain()
  assert.notEqual(mesh.geometry, oldGeometry)
  const calls = f.validations()
  f.prepare()
  assert.equal(f.validations(), calls + 1)
  assert.deepEqual(prefix(mesh), expected)
  f.prepare()
  assert.equal(f.validations(), calls + 1, 'replacement obtains its own certificate')
})

for (const name of ['getAttribute', 'getIndex', 'setIndex', 'setDrawRange'])
  test(`prototype-level geometry ${name} replacement revokes an existing certificate`, async t => {
    const f = await fixture(t)
    f.prepare()
    const original = THREE.BufferGeometry.prototype[name]
    try {
      THREE.BufferGeometry.prototype[name] = function (...args) { return original.apply(this, args) }
      const calls = f.validations()
      f.prepare(); f.prepare()
      assert.equal(f.validations(), calls + 2, 'live prototype equality cannot authorize reuse')
    } finally { THREE.BufferGeometry.prototype[name] = original }
    const calls = f.validations()
    f.prepare()
    assert.equal(f.validations(), calls + 1, 'restoring prototype does not regrant ownership')
  })

for (const name of ['getX', 'setX'])
  test(`prototype-level index ${name} replacement revokes an existing certificate`, async t => {
    const f = await fixture(t)
    f.prepare()
    const original = THREE.BufferAttribute.prototype[name]
    const index = f.runtime.terrain.geometry.index
    try {
      THREE.BufferAttribute.prototype[name] = function (...args) { return original.apply(this, args) }
      const version = index.version
      f.prepare(); f.prepare()
      assert.equal(index.version, version + 2, 'custom methods keep unconditional write fallback')
    } finally { THREE.BufferAttribute.prototype[name] = original }
    const calls = f.validations()
    f.prepare(); f.prepare()
    assert.equal(f.validations(), calls + 2)
  })

test('prototype setX override before first index creation cannot certify altered writes', async t => {
  const f = await fixture(t)
  const original = THREE.BufferAttribute.prototype.setX
  try {
    THREE.BufferAttribute.prototype.setX = function (i, value) { return original.call(this, i, value + 1) }
    f.prepare()
    const index = f.runtime.terrain.geometry.index, version = index.version
    assert.equal(index.array[0] % 6, 1, 'probe actually alters the submitted vertex IDs')
    f.prepare()
    assert.equal(index.version, version + 1, 'altered first writes were not certified')
  } finally { THREE.BufferAttribute.prototype.setX = original }
  const calls = f.validations()
  f.prepare(); f.prepare()
  assert.equal(f.validations(), calls + 2, 'custom initialization permanently revokes ownership')
  assert.equal(f.runtime.terrain.geometry.index.array[0] % 6, 0, 'ordinary fallback repairs altered IDs')
})
