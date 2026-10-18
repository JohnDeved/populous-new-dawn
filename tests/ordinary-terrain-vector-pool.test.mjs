import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { createNativeOcclusionMetrics } from '../app/native-occlusion-metrics.ts'
import { createOrdinaryTerrainMetrics } from '../app/ordinary-terrain-metrics.ts'
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

test('standard shipped geometry reuses projection vectors while water/camera and retained results stay exact', async t => {
  const f = await fixture()
  try {
    const first = f.query(), retained = retain(first)
    assert.deepEqual(first, f.expected())
    assert.ok(first.length > 0)
    const scratch = f.view.ordinaryPickScratch
    const world = [...scratch.worldPool], screen = [...scratch.screenPool]
    assert.ok(world.length > 0 && world.length <= 129 * 129)
    assert.equal(world.length, screen.length)
    t.diagnostic(`Warm pool: ${world.length} Vector3 and ${screen.length} Vector4 objects; repeated identical queries preserve every identity and do not grow either pool.`)
    for (let repeat = 0; repeat < 3; repeat++) {
      assert.deepEqual(f.query(), f.expected())
      assert.equal(scratch.worldPool.length, world.length)
      world.forEach((p, i) => assert.equal(scratch.worldPool[i], p))
      screen.forEach((p, i) => assert.equal(scratch.screenPool[i], p))
    }
    for (const [turn, heading, zoom, center] of [
      [23, 0.4, 0, { x: 4, z: 8 }], [256, 2, 1, { x: 124, z: -124 }],
      [511, -1, 0, { x: -126, z: 126 }], [0, 0, 0, { x: 0, z: 0 }],
    ]) {
      f.world.turn = turn
      f.water()
      f.update(heading, zoom, center)
      assert.deepEqual(f.query(), f.expected())
      assert.ok(scratch.worldPool.length <= 129 * 129)
    }
    assert.deepEqual(first, retained)
    assert.equal(scratch.world.length, 0)
    assert.equal(scratch.screen.length, 0)
    // Public calls still hand out independent vectors, never pooled results.
    const point = new THREE.Vector3(1, 0, 2)
    const a = f.view.screen(point, camera), saved = a.clone()
    assert.notEqual(a, f.view.screen(point, camera))
    f.query()
    assert.deepEqual(a, saved)
  } finally { f.close() }
})

test('custom screen/relative and vector methods retain fresh input ownership', async () => {
  const f = await fixture()
  const originalScreen = RenderView.prototype.screen
  const originalRelative = RenderView.prototype.relative
  const originalApply = THREE.Vector3.prototype.applyMatrix4
  try {
    for (const kind of ['screen', 'relative', 'relative-accessor', 'prototype-screen', 'vector-method']) {
      f.view.dispose()
      const held = [], snapshots = []
      const remember = p => { held.push(p); snapshots.push(p.clone()) }
      if (kind === 'screen') f.view.screen = function (p, ...args) { remember(p); return originalScreen.call(this, p, ...args) }
      if (kind === 'relative') f.view.relative = function (p, ...args) { remember(p); return originalRelative.call(this, p, ...args) }
      if (kind === 'relative-accessor') Object.defineProperty(f.view, 'relative', { configurable: true,
        get() { return function (p, ...args) { remember(p); return originalRelative.call(this, p, ...args) } } })
      if (kind === 'prototype-screen') RenderView.prototype.screen = function (p, ...args) { remember(p); return originalScreen.call(this, p, ...args) }
      if (kind === 'vector-method') THREE.Vector3.prototype.applyMatrix4 = function (...args) {
        const result = originalApply.apply(this, args)
        // This hook also sees temporary bounding-box vectors. Only preserve
        // references after the first query, rather than asserting their own lifecycle.
        held.push(this)
        return result
      }
      const first = f.query()
      assert.deepEqual(first, f.expected())
      assert.equal(f.view.ordinaryPickScratch.worldPool.length, 0)
      assert.ok(held.length > 0)
      // For the projection hooks, old input vectors must never be recycled.
      const old = kind === 'vector-method' ? [] : held.slice()
      const saved = kind === 'vector-method' ? [] : snapshots.map(p => p.clone())
      f.world.turn += 23
      f.water()
      f.query()
      old.forEach((p, i) => assert.deepEqual(p, saved[i]))
      delete f.view.screen
      delete f.view.relative
      RenderView.prototype.screen = originalScreen
      THREE.Vector3.prototype.applyMatrix4 = originalApply
    }
    f.query()
    assert.ok(f.view.ordinaryPickScratch.worldPool.length > 0)
  } finally {
    delete f.view.screen
    delete f.view.relative
    RenderView.prototype.screen = originalScreen
    THREE.Vector3.prototype.applyMatrix4 = originalApply
    f.close()
  }
})

test('nested candidates, callback failure and active disposal cannot corrupt a pooled query', async () => {
  const f = await fixture()
  const visible = f.view.visible
  try {
    const expected = f.expected()
    let entered = false, nesting = false
    f.view.visible = function (...args) {
      if (!entered && !nesting) {
        entered = true
        nesting = true
        const scratch = this.ordinaryPickScratch
        const before = scratch.worldPool.map(p => p.clone())
        assert.deepEqual(f.query(), expected)
        scratch.worldPool.forEach((p, i) => assert.deepEqual(p, before[i]))
        nesting = false
      }
      return visible.apply(this, args)
    }
    assert.deepEqual(f.query(), expected)
    assert.ok(entered)
    f.view.visible = () => { throw new Error('candidate interrupted') }
    assert.throws(f.query, /candidate interrupted/)
    assert.equal(f.view.ordinaryPickDepth, 0)
    assert.equal(f.view.ordinaryPickScratch.world.length, 0)
    f.view.visible = visible
    assert.deepEqual(f.query(), expected)
    const oldScratch = f.view.ordinaryPickScratch
    let disposed = false
    f.view.visible = function (...args) {
      if (!disposed) { disposed = true; this.dispose() }
      return visible.apply(this, args)
    }
    assert.deepEqual(f.query(), expected)
    assert.ok(disposed)
    assert.equal(f.view.ordinaryPickScratch, null, 'later instances cannot reacquire after disposal')
    f.view.visible = visible
    assert.deepEqual(f.query(), expected)
    assert.notEqual(f.view.ordinaryPickScratch, oldScratch)
    f.view.dispose()
    assert.equal(f.view.ordinaryPickScratch, null)
  } finally { f.close() }
})


test('split-height grids overflow the corner-sized pool without changing late triangle hits', async () => {
  const f = await fixture()
  try {
    const position = f.mesh.geometry.attributes.position
    const high = position.count - 6
    // Every early source disagrees with the first corner's height. Their
    // projected triangles are collinear; the real hit comes after pool capacity.
    for (let i = 0; i < high; i++) position.setXYZ(i, 0, i + 100, 0)
    const corners = [[0, 0, 0], [0, 0, 2], [2, 0, 0], [2, 0, 0], [0, 0, 2], [2, 0, 2]]
    corners.forEach((point, i) => position.setXYZ(high + i, ...point))
    f.mesh.geometry.setIndex(new THREE.BufferAttribute(Uint32Array.from(
      { length: position.count }, (_, i) => i
    ), 1))
    f.mesh.geometry.setDrawRange(0, position.count)
    f.mesh.count = 1
    f.mesh.setMatrixAt(0, new THREE.Matrix4())
    f.view.updateTerrainVisibility = () => {}
    f.reference.updateTerrainVisibility = () => {}
    const projected = f.view.screen(new THREE.Vector3(2 / 3, 0, 2 / 3), camera, true)
    const point = new THREE.Vector2(projected.x, projected.y)
    const actual = f.view.pickCandidates(point, [f.mesh], camera)
    position.normalized = true
    const expected = f.reference.pickCandidates(point, [f.mesh], camera)
    position.normalized = false
    assert.deepEqual(actual, expected)
    assert.ok(actual.some(hit => hit.triangle >= high / 3), 'overflow triangle remains pickable')
    const scratch = f.view.ordinaryPickScratch
    assert.equal(scratch.worldPool.length, 129 * 129)
    assert.equal(scratch.screenPool.length, 129 * 129)
    const worlds = [...scratch.worldPool], screens = [...scratch.screenPool]
    const saved = retain(actual)
    assert.deepEqual(f.view.pickCandidates(point, [f.mesh], camera), expected)
    worlds.forEach((p, i) => assert.equal(scratch.worldPool[i], p))
    screens.forEach((p, i) => assert.equal(scratch.screenPool[i], p))
    assert.deepEqual(actual, saved)
  } finally { f.close() }
})


test('overview candidates and winners match baseline without ordinary projection pooling', async () => {
  const f = await fixture()
  try {
    for (const blend of [0, 96, 256]) {
      f.view.overview = f.reference.overview = true
      f.view.globeBlend = f.reference.globeBlend = blend
      const actual = f.query(), expected = f.expected()
      assert.equal(actual.length, blend === 0 ? 1 : 0,
        'settled overview picks; native transition blend intentionally suppresses the inverse')
      assert.deepEqual(actual, expected)
      assert.deepEqual(f.view.resolvePickCandidates(actual), f.reference.resolvePickCandidates(expected))
      assert.equal(f.view.ordinaryPickScratch, null, 'direct overview exits before any grid storage')
    }
    // Existing overridable submission hooks can change mode after the early
    // overview inverse check. The later projection must still use globePoint.
    f.update()
    const submit = RenderView.prototype.updateTerrainVisibility
    f.view.updateTerrainVisibility = function (object) { submit.call(this, object); this.overview = true }
    f.reference.updateTerrainVisibility = function (object) { submit.call(this, object); this.overview = true }
    const actual = f.query(), expected = f.expected()
    assert.deepEqual(actual, expected)
    assert.deepEqual(f.view.resolvePickCandidates(actual), f.reference.resolvePickCandidates(expected))
    assert.ok(f.view.ordinaryPickScratch, 'query reached eligible grid storage after mode change')
    assert.equal(f.view.ordinaryPickScratch.worldPool.length, 0)
    assert.equal(f.view.ordinaryPickScratch.screenPool.length, 0)
  } finally { f.close() }
})

test('replaced BufferAttribute prototype methods cannot certify retained projection objects', async () => {
  const f = await fixture()
  const prototype = THREE.BufferAttribute.prototype
  const originals = Object.fromEntries(['getX', 'getY', 'getZ', 'setX'].map(name => [name, prototype[name]]))
  try {
    for (const name of Object.keys(originals)) {
      f.view.dispose()
      let calls = 0
      prototype[name] = function (...args) { calls++; return originals[name].apply(this, args) }
      if (name === 'setX') {
        // Force a real submitted-index repair instead of the combined base's
        // no-write visibility reuse path, so the replaced setter is exercised.
        originals.setX.call(f.mesh.geometry.index, 0, f.mesh.geometry.attributes.position.count - 1)
      }
      const actual = f.query(), saved = retain(actual), expected = f.expected()
      assert.deepEqual(actual, expected)
      assert.deepEqual(f.view.resolvePickCandidates(actual), f.reference.resolvePickCandidates(expected))
      assert.ok(calls > 0)
      assert.equal(f.view.ordinaryPickScratch.worldPool.length, 0, `${name} replacement cannot use pooled vectors`)
      assert.equal(f.view.ordinaryPickScratch.screenPool.length, 0)
      f.world.turn += 23
      f.water()
      assert.deepEqual(f.query(), f.expected())
      assert.deepEqual(actual, saved)
      prototype[name] = originals[name]
    }
    f.query()
    assert.ok(f.view.ordinaryPickScratch.worldPool.length > 0, 'restored original methods can pool')
  } finally {
    Object.assign(prototype, originals)
    f.close()
  }
})


function nativeSnapshot(view, object) {
  const entries = view.groundPickCache.get(object)
  assert.ok(entries?.size > 0)
  return [...entries].map(([instance, entry]) => ({
    instance, entry, world: [...entry.world], worldValues: entry.world.map(p => p.clone()),
    screen: [...entry.screen], screenValues: entry.screen.map(p => p.clone()),
    slots: entry.slots, slotValues: entry.slots?.slice(),
  }))
}
function unchangedNative(snapshot, view, object) {
  for (const saved of snapshot) {
    assert.equal(view.groundPickCache.get(object).get(saved.instance), saved.entry)
    assert.equal(saved.entry.slots, saved.slots)
    assert.deepEqual(saved.entry.slots, saved.slotValues)
    assert.equal(saved.entry.world.length, saved.world.length)
    assert.equal(saved.entry.screen.length, saved.screen.length)
    saved.entry.world.forEach((p, i) => {
      assert.equal(p, saved.world[i])
      assert.deepEqual(p, saved.worldValues[i])
    })
    saved.entry.screen.forEach((p, i) => {
      assert.equal(p, saved.screen[i])
      assert.deepEqual(p, saved.screenValues[i])
    })
  }
}

test('ordinary pools preserve native packed cache objects/results across interleaving, nesting and disposal', async () => {
  const f = await fixture()
  const visible = f.view.visible
  const native = metrics => f.view.pickCandidates(mouse, [f.mesh], camera, true, metrics)
  try {
    f.query() // Submit visibility and warm only ordinary pools.
    const nativeFirst = native(), retained = retain(nativeFirst)
    const expectedFirst = f.reference.pickCandidates(mouse, [f.mesh], camera, true)
    assert.deepEqual(nativeFirst, expectedFirst)
    assert.ok(nativeFirst.length > 0)
    const initial = nativeSnapshot(f.view, f.mesh)
    const pool = f.view.ordinaryPickScratch
    const pooledObjects = new Set([...pool.worldPool, ...pool.screenPool])
    for (const saved of initial) {
      assert.ok(saved.slots, 'native packed representation remains active')
      for (const p of [...saved.world, ...saved.screen]) assert.ok(!pooledObjects.has(p))
    }
    for (const turn of [23, 256, 0]) {
      f.world.turn = turn
      f.water()
      assert.deepEqual(f.query(), f.expected())
      unchangedNative(initial, f.view, f.mesh)
      assert.deepEqual(nativeFirst, retained)
    }
    const freshNative = native(), freshRetained = retain(freshNative)
    assert.deepEqual(freshNative, f.reference.pickCandidates(mouse, [f.mesh], camera, true))
    const cached = nativeSnapshot(f.view, f.mesh)
    const counters = createNativeOcclusionMetrics()
    assert.deepEqual(native(counters), freshNative)
    assert.ok(counters.cacheHits > 0)
    assert.equal(counters.projectedVertices, 0)

    let entered = false
    f.view.visible = function (...args) {
      if (!entered) {
        entered = true
        const before = this.ordinaryPickScratch.worldPool.map(p => p.clone())
        assert.deepEqual(native(), freshNative, 'nested native cache hit during pooled ordinary query')
        this.ordinaryPickScratch.worldPool.forEach((p, i) => assert.deepEqual(p, before[i]))
      }
      return visible.apply(this, args)
    }
    assert.deepEqual(f.query(), f.expected())
    assert.ok(entered)
    unchangedNative(cached, f.view, f.mesh)

    entered = false
    f.view.visible = function (...args) {
      if (!entered) {
        entered = true
        this.dispose()
        assert.deepEqual(f.query(), f.expected(), 'nested ordinary query after native-triggered disposal')
        assert.equal(this.ordinaryPickScratch, null)
      }
      return visible.apply(this, args)
    }
    assert.deepEqual(native(), freshNative)
    assert.ok(entered)
    assert.equal(f.view.ordinaryPickScratch, null)
    unchangedNative(cached, f.view, f.mesh)
    assert.deepEqual(freshNative, freshRetained)
    f.view.visible = visible
    f.query()
    assert.notEqual(f.view.ordinaryPickScratch, pool)
    unchangedNative(cached, f.view, f.mesh)

    entered = false
    f.view.visible = function (...args) {
      if (!entered) {
        entered = true
        this.dispose()
        assert.deepEqual(native(), freshNative, 'nested native query after ordinary-triggered disposal')
      }
      return visible.apply(this, args)
    }
    assert.deepEqual(f.query(), f.expected())
    assert.equal(f.view.ordinaryPickScratch, null)
    unchangedNative(cached, f.view, f.mesh)
    assert.deepEqual(freshNative, freshRetained)
  } finally { f.view.visible = visible; f.close() }
})

test('pooled ordinary queries preserve combined F8 work and visibility counters', async () => {
  const f = await fixture()
  // Submission mutates geometry. Independent but identical starting geometry
  // prevents the first query from warming the oracle's index before its turn.
  const referenceMesh = f.mesh.clone()
  referenceMesh.geometry = f.mesh.geometry.clone()
  try {
    for (let repeat = 0; repeat < 2; repeat++) {
      const actualMetrics = createOrdinaryTerrainMetrics(true)
      const expectedMetrics = createOrdinaryTerrainMetrics(true)
      const actual = f.view.pickCandidates(mouse, [f.mesh], camera, false, undefined, actualMetrics)
      const expected = f.reference.pickCandidates(mouse, [referenceMesh], camera, false, undefined, expectedMetrics)
      assert.deepEqual(actual, expected.map(hit => ({ ...hit, object: f.mesh })))
      if (repeat === 0) assert.ok(actualMetrics.visibility.indexEntriesWritten > 0)
      else assert.ok(actualMetrics.visibility.indexReuseCalls > 0)
      assert.deepEqual(
        { projectedVertices: actualMetrics.projectedVertices, visitedTriangles: actualMetrics.visitedTriangles,
          visibility: actualMetrics.visibility },
        { projectedVertices: expectedMetrics.projectedVertices, visitedTriangles: expectedMetrics.visitedTriangles,
          visibility: expectedMetrics.visibility }
      )
      assert.ok(f.view.ordinaryPickScratch.worldPool.length > 0)
    }
  } finally { referenceMesh.geometry.dispose(); f.close() }
})

test('custom interpolation retains fresh world inputs even after the ordinary pool is warm', async () => {
  const f = await fixture(), original = THREE.Vector3.prototype.addScaledVector
  try {
    assert.ok(f.query().length > 0)
    const pool = f.view.ordinaryPickScratch.worldPool
    assert.ok(pool.length > 0)
    const held = []
    THREE.Vector3.prototype.addScaledVector = function (vector, scale) {
      held.push(vector)
      return original.call(this, vector, scale)
    }
    const first = f.query()
    assert.ok(first.length > 0)
    const inputs = held.slice(), snapshots = inputs.map(p => p.clone())
    assert.ok(inputs.length > 0, 'accepted-hit interpolation exercised')
    f.world.turn = 23
    f.water()
    f.update(0.4, 0, { x: 4, z: 8 })
    const second = f.query()
    inputs.forEach((p, i) => assert.deepEqual(p, snapshots[i], 'retained interpolation input is immutable across queries'))
    assert.ok(inputs.every(p => !pool.includes(p)), 'overridden consumer receives no retained pool vectors')
    assert.deepEqual(second, f.expected())
    THREE.Vector3.prototype.addScaledVector = original
    assert.deepEqual(f.query(), f.expected())
    assert.equal(f.view.ordinaryPickScratch.worldPool, pool, 'canonical consumer can reuse the existing pool again')
  } finally { THREE.Vector3.prototype.addScaledVector = original; f.close() }
})

for (const [Vector, method] of [[THREE.Vector3, 'fromBufferAttribute'], [THREE.Vector3, 'applyMatrix4'], [THREE.Vector3, 'addScaledVector'], [THREE.Vector4, 'set']])
  test(`accessor-backed ${Vector.name}.${method} cannot certify pooled ownership`, async () => {
    const f = await fixture(), descriptor = Object.getOwnPropertyDescriptor(Vector.prototype, method)
    const held = []
    try {
      assert.ok(f.query().length > 0)
      const scratch = f.view.ordinaryPickScratch
      Object.defineProperty(Vector.prototype, method, { configurable: true, get() {
        if (method === 'addScaledVector' && this !== Vector.prototype)
          return function (vector, scale) { held.push(vector); return descriptor.value.call(this, vector, scale) }
        if (this !== Vector.prototype) held.push(this)
        return descriptor.value
      } })
      f.query()
      const pooled = held.filter(value => scratch.worldPool.includes(value) || scratch.screenPool.includes(value))
      assert.equal(pooled.length, 0, 'accessor must not observe any pool-owned vector')
      f.world.turn = 23; f.water(); f.update(0.4, 0, { x: 4, z: 8 }); f.query()
      assert.ok(held.every(value => !scratch.worldPool.includes(value) && !scratch.screenPool.includes(value)))
      Object.defineProperty(Vector.prototype, method, descriptor)
      assert.deepEqual(f.query(), f.expected())
    } finally { Object.defineProperty(Vector.prototype, method, descriptor); f.close() }
  })
