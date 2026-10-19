import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as THREE from 'three'
import { loadSceneFixture, makeSceneFixture } from './support/bloodlust-scene.mjs'

const api = await loadSceneFixture()
const { RenderView } = await import('../app/render-view.ts')
let BaselineView = RenderView
if (process.env.PND_TERRAIN_BASELINE) {
  const baselineURL = pathToFileURL(process.env.PND_TERRAIN_BASELINE).href,
    appURL = new URL('../app/render-view.ts', import.meta.url)
  const hook = registerHooks({
    resolve(specifier, context, next) {
      if (context.parentURL === baselineURL && specifier.startsWith('.'))
        return next(new URL(specifier, appURL).href, context)
      return next(specifier, context)
    },
  })
  try {
    BaselineView = (await import(baselineURL)).RenderView
  } finally {
    hook.deregister()
  }
}
const { OrdinaryProjectionCache } = await import('../app/ordinary-projection-cache.ts')
const { OrdinaryNumericProjection } = await import('../app/ordinary-numeric-projection.ts')
const {
  createRuntimeTerrainPicking,
  releaseRuntimeTerrainPicking,
  runtimeTerrainPicking,
  pickRuntimeTerrain,
} = await import('../app/runtime-terrain-picking.ts')
const { initializeTerrain, rebuildTerrain, updateWater, landIndex } =
  await import('../app/scene-terrain-runtime.ts')
const { pick: inputPick } = await import('../app/scene-input-runtime.ts')
const { GameScene } = await import('../app/scene.ts')
const { createOrdinaryTerrainMetrics } = await import('../app/ordinary-terrain-metrics.ts')
const configs = [
  [0, 0, 0, 0],
  [-16, 20, 0.91, 0],
  [124, -124, 2, 1],
]
const normal = hit => (hit ? { ...hit, object: 'terrain' } : null)
const query = owner =>
  owner.view.pickCandidateQuery(
    owner.mouse,
    [owner.terrain],
    owner.camera,
    false,
    undefined,
    undefined,
    true
  )
const hash = value => createHash('sha256').update(value).digest('hex')
const bytes = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength)
function state(o) {
  const mesh = o.terrain,
    g = mesh.geometry
  return {
    draw: { ...g.drawRange },
    index: hash(bytes(g.index.array)),
    position: hash(bytes(g.getAttribute('position').array)),
    count: mesh.count,
    matrix: hash(bytes(mesh.instanceMatrix.array)),
    world: mesh.matrixWorld.elements.slice(),
    painter: hash(
      JSON.stringify(
        o.view.painter.commandsBySlot.map(c =>
          c ? { ...c, object: c.object === mesh.id ? 'terrain' : c.object } : c
        )
      )
    ),
    depth: hash(bytes(o.view.painter.texture.image.data)),
  }
}

async function fixture(owned = true, restored = false) {
  const initial = api.createWorld(2),
    world = restored ? api.migrateCheckpoint(structuredClone(initial)) : initial,
    { scene: o } = await makeSceneFixture(world)
  Object.setPrototypeOf(o, GameScene.prototype)
  Object.assign(o, {
    world,
    view: owned ? new RenderView() : new BaselineView(),
    scene: new THREE.Scene(),
    camera: new THREE.Camera(),
    mouse: new THREE.Vector2(-0.12, 0.08),
    renderer: {
      setTransparentSort() {},
      domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 2310, height: 1267 }) },
    },
    viewPoint: { x: 0, z: 0 },
    cameraBearing: 0,
    viewZoom: 0,
    overviewActive: false,
    globeMorph: { value: 0 },
    container: { clientWidth: 2310, clientHeight: 1267 },
    terrainAtlasState: null,
    terrainTextureVersion: -1,
    terrainTextureDirty: true,
    terrainAtlas: null,
    waterState: null,
    terrainVersion: -1,
    decorations: new THREE.Group(),
    terrainLoad: new AbortController(),
    terrainMap: new THREE.DataTexture(),
    waterMap: new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256),
    updateTerrainTexture() {},
    updateView() {},
  })
  o.landIndex = (x, z) => landIndex(o, x, z)
  const fetch = globalThis.fetch
  try {
    globalThis.fetch = async name => {
      const b = readFileSync(new URL('../public' + name, import.meta.url))
      return {
        ok: true,
        arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      }
    }
    const initialized = initializeTerrain(o)
    o.terrain = initialized.terrain
    o.scene.add(o.terrain)
    await initialized.ready
  } finally {
    globalThis.fetch = fetch
  }
  rebuildTerrain(o)
  if (owned) createRuntimeTerrainPicking(o)
  o.view.update(2310, 1267, { x: 0, z: 0 }, 0, 0, false)
  prepare(o)
  return o
}
function prepare(o) {
  o.view.prepare(o.scene)
  o.view.painter.update(o.scene, o.renderer)
  o.view.painter.afterRender()
}
function event(o) {
  return { clientX: ((o.mouse.x + 1) * 2310) / 2, clientY: ((1 - o.mouse.y) * 1267) / 2 }
}

test('pointer-only authored queries reuse projections but preserve ordered hits and current Painter', async () => {
  const base = await fixture(false),
    owned = await fixture(true)
  const first = createOrdinaryTerrainMetrics(true)
  inputPick(owned, event(owned), { ordinaryTerrain: first })
  assert.ok(first.projectedVertices > 0)
  for (const [x, y] of [
    [-0.1, 0.07],
    [0.2, -0.3],
    [-0.12, 0.08],
  ]) {
    base.mouse.set(x, y)
    owned.mouse.set(x, y)
    const metrics = createOrdinaryTerrainMetrics(true)
    assert.deepEqual(
      inputPick(owned, event(owned), { ordinaryTerrain: metrics }),
      inputPick(base, event(base))
    )
    assert.deepEqual(
      query(owned).map(normal),
      base.view.pickCandidates(base.mouse, [base.terrain], base.camera).map(normal)
    )
    assert.equal(
      metrics.projectedVertices,
      0,
      'unchanged geometry must avoid repeated projection arithmetic'
    )
    assert.ok(metrics.visitedTriangles > 0, 'pointer-dependent ordered scan still runs')
  }
})

test('loaded snapshot scene also reuses ordinary projections independently of object-cell ownership', async () => {
  const base = await fixture(false, true),
    owned = await fixture(true, true)
  assert.equal(runtimeTerrainPicking(owned.view, owned.terrain), true)
  inputPick(owned, event(owned))
  owned.mouse.set(0.1, -0.2)
  base.mouse.copy(owned.mouse)
  const metrics = createOrdinaryTerrainMetrics(true)
  assert.deepEqual(
    inputPick(owned, event(owned), { ordinaryTerrain: metrics }),
    inputPick(base, event(base))
  )
  assert.equal(metrics.projectedVertices, 0)
  assert.deepEqual(
    query(owned).map(normal),
    base.view.pickCandidates(base.mouse, [base.terrain], base.camera).map(normal)
  )
})

test('warm authored cache validates raw XYZ, submission, water, view and live Painter', async () => {
  const base = await fixture(false),
    owned = await fixture(true),
    pair = [base, owned]
  const compare = () => {
    const metrics = createOrdinaryTerrainMetrics(true)
    assert.deepEqual(
      inputPick(owned, event(owned), { ordinaryTerrain: metrics }),
      inputPick(base, event(base))
    )
    const actual = query(owned),
      expected = base.view.pickCandidates(base.mouse, [base.terrain], base.camera)
    assert.deepEqual(actual.map(normal), expected.map(normal))
    assert.deepEqual(
      normal(owned.view.resolvePickCandidates(actual)),
      normal(base.view.resolvePickCandidates(expected))
    )
    return metrics.projectedVertices
  }
  compare()
  assert.equal(compare(), 0)
  for (const axis of ['X', 'Y', 'Z']) {
    const saved = pair.map(o => o.terrain.geometry.getAttribute('position').array.slice())
    for (const value of [-0, 0, 0.03125, NaN, Infinity, -Infinity]) {
      for (const o of pair) {
        const p = o.terrain.geometry.getAttribute('position'),
          index = o.terrain.geometry.index
        // Diverge a currently submitted duplicate without setting needsUpdate.
        p['set' + axis](index.getX(1), value)
      }
      compare()
      assert.equal(compare(), 0)
    }
    pair.forEach((o, i) => o.terrain.geometry.getAttribute('position').array.set(saved[i]))
    compare()
    assert.equal(compare(), 0)
  }
  for (const turn of [1, 23, 256]) {
    for (const o of pair) {
      o.world.turn = turn
      updateWater(o)
    }
    compare()
    assert.equal(compare(), 0)
    for (const o of pair) {
      o.world.lightRevision++
      updateWater(o)
    }
    assert.equal(compare(), 0, 'lighting-only position rewrites preserve exact height reuse')
  }
  for (const [x, z, angle, zoom] of configs) {
    for (const o of pair) o.view.update(2310, 1267, { x, z }, angle, zoom, false)
    compare() // changed view/submission BEFORE the next rendered Painter
    assert.equal(compare(), 0)
    pair.forEach(prepare)
    compare()
  }
  for (const o of pair) o.view.update(2310, 1267, { x: 0, z: 0 }, 0, 0, false)
  pair.forEach(prepare)
  // Controlled presentation-depth witness: admit current geometric candidates,
  // then reject them through the actual Painter texture without changing XYZ.
  for (const o of pair) o.view.painter.texture.image.data.fill(0.5)
  let found = false
  search: for (const y of [-0.8, -0.4, 0, 0.4, 0.8])
    for (const x of [-0.8, -0.4, 0, 0.4, 0.8]) {
      for (const o of pair) o.mouse.set(x, y)
      if (inputPick(owned, event(owned))) {
        found = true
        break search
      }
    }
  assert.ok(found, 'Painter mutation witness starts with a real winning terrain hit')
  compare()
  // Painter depth is not in the arithmetic cache: keep current geometric hits,
  // but reject every candidate through the real depth texture on the next visit.
  for (const o of pair) o.view.painter.texture.image.data.fill(2)
  assert.equal(inputPick(owned, event(owned)), null)
  assert.equal(inputPick(base, event(base)), null)
  assert.equal(compare(), 0)
})

test('numeric-disabled and invisible authored queries cannot misalign retained projections', async () => {
  const base = await fixture(false),
    owned = await fixture(true)
  const compare = () => {
    assert.deepEqual(inputPick(owned, event(owned)), inputPick(base, event(base)))
    assert.deepEqual(
      query(owned).map(normal),
      base.view.pickCandidates(base.mouse, [base.terrain], base.camera).map(normal)
    )
  }
  compare()
  const cache = owned.view.ordinaryProjectionCache
  for (const o of [base, owned]) o.terrain.userData.terrainGrid = false
  compare() // same bound terrain, but no packed/numeric eligibility
  for (const o of [base, owned]) {
    const p = o.terrain.geometry.getAttribute('position')
    p.setY(o.terrain.geometry.index.getX(1), 12.5)
    o.terrain.visible = false
  }
  compare() // traversal skips the instance entirely
  for (const o of [base, owned]) {
    o.terrain.visible = true
    o.terrain.userData.terrainGrid = true
  }
  compare()
  assert.equal(owned.view.ordinaryProjectionCache, cache)
})

test('actual instance reorder/count shifts and culled copies preserve ordered candidates', async () => {
  const { terrainTiles } = await import('../app/terrain-visibility.ts')
  const saved = terrainTiles.slice(),
    base = await fixture(false),
    owned = await fixture(true)
  const compare = () => {
    assert.deepEqual(inputPick(owned, event(owned)), inputPick(base, event(base)))
    assert.deepEqual(
      query(owned).map(normal),
      base.view.pickCandidates(base.mouse, [base.terrain], base.camera).map(normal)
    )
  }
  try {
    for (const o of [base, owned]) o.view.update(2310, 1267, { x: 124, z: -124 }, 2, 1, false)
    compare()
    const count = owned.terrain.count
    assert.ok(count > 1, 'witness requires multiple submitted instances')
    terrainTiles.reverse()
    compare()
    assert.equal(owned.terrain.count, count)
    terrainTiles.splice(0, terrainTiles.length, [0, 0])
    compare()
    assert.ok(owned.terrain.count < count)
    terrainTiles.length = 0
    compare()
    assert.equal(owned.terrain.count, 0)
    terrainTiles.push(...saved)
    compare()
    assert.equal(owned.terrain.count, count)
    for (const o of [base, owned]) o.terrain.position.x = 1000000
    compare() // selected copies all skipped by transformed bounding boxes
    for (const o of [base, owned]) o.terrain.position.x = 0
    compare()
  } finally {
    terrainTiles.splice(0, terrainTiles.length, ...saved)
  }
})

test('aggregate projection cache bounds, exact contexts and uncached overflow', () => {
  const cache = new OrdinaryProjectionCache(),
    numeric = new OrdinaryNumericProjection(),
    fresh = new OrdinaryNumericProjection(),
    view = new RenderView(),
    matrix = new THREE.Matrix4().elements
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const context = () =>
    cache.beginInstance(
      matrix,
      view.rawCenter.x,
      view.rawCenter.y,
      view.projection,
      view.config.depth
    )
  const append = (x, y, z) => {
    const args = [
      x,
      y,
      z,
      matrix,
      view.rawCenter.x,
      view.rawCenter.y,
      view.projection,
      view.config.depth,
    ]
    numeric.reset()
    fresh.reset()
    numeric.append(...args, cache)
    fresh.append(...args)
    assert.deepEqual(numeric.values.subarray(0, 6), fresh.values.subarray(0, 6))
    return numeric.projected
  }
  const pass = () => {
    cache.beginQuery()
    let projected = 0
    for (let instance = 0; instance < 9; instance++) {
      matrix[12] = instance * 256
      context()
      for (let i = 0; i < 4096; i++) projected += append(i % 128, i % 73, Math.floor(i / 128))
    }
    return projected
  }
  assert.equal(pass(), 36864)
  assert.equal(pass(), 4096, 'one aggregate 32768-entry bound, not nine independent caches')
  assert.equal(
    cache.values.byteLength +
      cache.tags.byteLength +
      cache.contexts.reduce((n, c) => n + c.values.byteLength, 0),
    2493248
  )
  cache.beginQuery()
  for (let i = 0; i < 10; i++) context()
  assert.equal(append(0, 0, 0), true, 'tenth context stays uncached')
  assert.equal(cache.contexts.length, 9)
  // Exact key changes include in-place matrix/config edits and signed zeros.
  for (const change of [
    () => (matrix[3] = 0.001),
    () => view.rawCenter.x++,
    () => view.rawCenter.y++,
    () => view.projection.matrix[0]++,
    () => view.projection.width++,
    () => view.projection.height++,
    () => (view.projection.pixelScaleX = -0),
    () => (view.projection.pixelScaleX = 0),
    () => (view.config = { ...view.config, depth: view.config.depth + 1 }),
  ]) {
    change()
    cache.beginQuery()
    context()
    assert.equal(append(0, NaN, -0), true)
    cache.beginQuery()
    context()
    assert.equal(append(0, NaN, -0), false)
    cache.beginQuery()
    context()
    assert.equal(append(-0, NaN, -0), true)
  }
  for (const field of [
    'curvature',
    'depth',
    'perspective',
    'scale',
    'width',
    'height',
    'centerX',
    'centerY',
    'fractionX',
    'fractionY',
    'pixelScaleX',
    'pixelScaleY',
  ]) {
    view.projection[field]++
    cache.beginQuery()
    context()
    assert.equal(append(1, 2, 3), true, field)
    cache.beginQuery()
    context()
    assert.equal(append(1, 2, 3), false, field)
  }
  for (const array of [matrix, view.projection.matrix])
    for (let i = 0; i < array.length; i++) {
      array[i]++
      cache.beginQuery()
      context()
      assert.equal(append(1, 2, 3), true, `matrix lane ${i}`)
      cache.beginQuery()
      context()
      assert.equal(append(1, 2, 3), false)
    }
  // Reorder, remove, re-add and skip contexts. The same ordinal can now name a
  // different instance or coordinate, but no mismatching result may be reused.
  for (const order of [[0, 1, 2], [2, 0, 1], [1], [], [1, 2], [0, 1, 2]]) {
    cache.beginQuery()
    for (const instance of order) {
      matrix[12] = instance * 256
      context()
      for (let i = 0; i < 5 + instance; i++) append(i, instance, -i)
    }
  }
  cache.serial = 0xffffffff
  matrix[0]++
  cache.beginQuery()
  context()
  assert.equal(append(0, 0, 0), true)
  cache.beginQuery()
  context()
  assert.equal(append(0, 0, 0), false)
})

test('numeric kernel preserves full matrix, relative, fixed-point and NDC operation order', () => {
  const v = new RenderView(),
    n = new OrdinaryNumericProjection(),
    camera = new THREE.Camera()
  const matrices = [
    new THREE.Matrix4(),
    new THREE.Matrix4().makeTranslation(256, -0.125, -256),
    new THREE.Matrix4().set(1, 0.25, 0, 4, 0, 2, 0.5, -8, 0.125, 0, 1, 16, 0, 0, 0.0001, 1),
  ]
  for (const [cx, cz, heading, zoom] of configs) {
    v.update(2310, 1267, { x: cx, z: cz }, heading, zoom, false)
    for (const m of matrices)
      for (const x of [-128, -0, 0, 127.5, 1e10])
        for (const y of [-Infinity, -0.125, -0, 0, 0.1, 20, Infinity, NaN]) {
          const raw = new THREE.Vector3(x, y, -x),
            world = raw.clone().applyMatrix4(m),
            screen = v.screen(world, camera, true)
          const slot =
            n.append(
              raw.x,
              raw.y,
              raw.z,
              m.elements,
              v.rawCenter.x,
              v.rawCenter.y,
              v.projection,
              v.config.depth
            ) * 6
          assert.deepEqual(Array.from(n.values.subarray(slot, slot + 6)), [
            world.x,
            world.y,
            world.z,
            screen.x,
            screen.y,
            screen.z,
          ])
        }
  }
})

test('authored input entry preserves prior Painter, current raw duplicates/water, ordered hits and native cache', async () => {
  const base = await fixture(false),
    owned = await fixture(true),
    held = []
  let comparisons = 0,
    nonempty = 0
  for (const [cx, cz, heading, zoom] of configs)
    for (const turn of [0, 23, 256])
      for (const mutation of ['fresh', 'duplicate', 'unversioned', 'nonfinite']) {
        const saved = []
        for (const o of [base, owned]) {
          o.view.update(2310, 1267, { x: cx, z: cz }, heading, zoom, false)
          const p = o.terrain.geometry.getAttribute('position')
          saved.push(p.array.slice())
          if (mutation === 'duplicate')
            for (let i = 1; i < p.count; i += 97) p.setY(i, p.getY(i) + 0.375)
          if (mutation === 'unversioned')
            for (let i = 0; i < p.count; i += 3) p.setY(i, p.getY(i) + 0.03125)
          if (mutation === 'nonfinite') p.setY(25000, NaN)
        }
        // Actual shipped input entry BEFORE subsequent water update/render.
        const bm = createOrdinaryTerrainMetrics(true),
          cm = createOrdinaryTerrainMetrics(true)
        assert.deepEqual(
          inputPick(owned, event(owned), { ordinaryTerrain: cm }),
          inputPick(base, event(base), { ordinaryTerrain: bm })
        )
        assert.deepEqual([cm.visitedTriangles, cm.visibility], [bm.visitedTriangles, bm.visibility])
        // Arithmetic work may be reused; ordered geometry/candidate assertions below stay exact.
        assert.ok(cm.projectedVertices <= bm.projectedVertices)
        const expected = base.view.pickCandidates(base.mouse, [base.terrain], base.camera)
        const actual = query(owned)
        assert.deepEqual(actual.map(normal), expected.map(normal))
        nonempty += Number(actual.length > 0)
        assert.deepEqual(
          normal(owned.view.resolvePickCandidates(actual)),
          normal(base.view.resolvePickCandidates(expected))
        )
        assert.deepEqual(state(owned), state(base))
        held.push([actual, actual.map(normal).map(c => structuredClone(c))])
        comparisons++
        // Native queries never acquire/use numeric storage and keep retained results.
        const nbase = base.view.pickCandidates(base.mouse, [base.terrain], base.camera, true)
        const nowned = owned.view.pickCandidates(owned.mouse, [owned.terrain], owned.camera, true)
        assert.deepEqual(nowned.map(normal), nbase.map(normal))
        for (let j = 0; j < 2; j++) {
          const o = [base, owned][j]
          o.terrain.geometry.getAttribute('position').array.set(saved[j])
          o.world.turn = turn
          o.waterState = null
          updateWater(o)
          prepare(o)
        }
      }
  assert.equal(comparisons, 36)
  assert.ok(nonempty > 0)
  for (const [hits, snapshot] of held) assert.deepEqual(hits.map(normal), snapshot)
  assert.ok(owned.view.ordinaryNumericProjection.length > 0)
  assert.equal(owned.view.ordinaryPickScratch.world.length, 0)
  assert.equal(owned.view.ordinaryPickScratch.screen.length, 0)
})

test('factory ownership, replacement, nested fallback, release and disposal do not resurrect buffers', async () => {
  const o = await fixture(),
    other = await fixture()
  assert.equal(runtimeTerrainPicking(o.view, o.terrain), true)
  pickRuntimeTerrain(o)
  const storage = o.view.ordinaryNumericProjection
  const cache = o.view.ordinaryProjectionCache
  assert.ok(cache)
  assert.ok(storage)
  pickRuntimeTerrain(other)
  assert.notEqual(storage, other.view.ordinaryNumericProjection)
  o.view.ordinaryPickDepth = 1
  try {
    const before = o.view.ordinaryNumericProjection
    pickRuntimeTerrain(o)
    assert.equal(o.view.ordinaryNumericProjection, before)
    assert.equal(o.view.ordinaryProjectionCache, cache)
  } finally {
    o.view.ordinaryPickDepth = 0
  }
  // Supported rebuild replacement explicitly rebinds after creating positions.
  o.terrain.geometry = new THREE.BufferGeometry()
  rebuildTerrain(o)
  assert.equal(runtimeTerrainPicking(o.view, o.terrain), true)
  pickRuntimeTerrain(o)
  const oldView = o.view
  o.view = new RenderView()
  o.view.update(2310, 1267, { x: 0, z: 0 }, 0, 0, false)
  assert.equal(runtimeTerrainPicking(oldView, o.terrain), false)
  pickRuntimeTerrain(o)
  assert.equal(o.view.ordinaryNumericProjection, null)
  o.view = oldView
  releaseRuntimeTerrainPicking(o.view)
  assert.equal(o.view.ordinaryNumericProjection, null)
  assert.equal(o.view.ordinaryProjectionCache, null)
  let calls = 0
  const screen = o.view.screen
  o.view.screen = function (...args) {
    calls++
    return screen.apply(this, args)
  }
  pickRuntimeTerrain(o)
  assert.ok(calls > 0)
  assert.equal(o.view.ordinaryNumericProjection, null)
  rebuildTerrain(o)
  createRuntimeTerrainPicking(o)
  assert.equal(runtimeTerrainPicking(o.view, o.terrain), false)
  other.view.dispose()
  assert.equal(runtimeTerrainPicking(other.view, other.terrain), false)
  pickRuntimeTerrain(other)
  assert.equal(other.view.ordinaryNumericProjection, null)
  assert.equal(other.view.ordinaryProjectionCache, null)
})

test('numeric storage grows lazily within exact grid cap and rejects overflow', () => {
  const n = new OrdinaryNumericProjection(),
    v = new RenderView()
  v.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const m = new THREE.Matrix4().elements
  assert.equal(n.values.byteLength, 0)
  for (let i = 0; i < 128 * 128 * 6; i++) n.append(0, 0, 0, m, 0, 0, v.projection, v.config.depth)
  assert.equal(n.values.byteLength, 4718592)
  assert.throws(() => n.append(0, 0, 0, m, 0, 0, v.projection, v.config.depth), RangeError)
  const a = n.values
  n.reset()
  n.append(-0, 0, 0, m, 0, 0, v.projection, v.config.depth)
  assert.equal(n.values, a)
})

// Test-only interception injects lifecycle/reentry at an otherwise synchronous
// owned batch boundary; custom append hooks are not part of the runtime contract.
test('active release/disposal and exceptions detach leases; nested calls fall back exactly', async () => {
  const o = await fixture(),
    base = await fixture(false)
  for (const v of [o.view, base.view]) v.update(2310, 1267, { x: 124, z: -124 }, 2, 1, false)
  const expected = base.view.pickCandidates(base.mouse, [base.terrain], base.camera).map(normal)
  const append = OrdinaryNumericProjection.prototype.append
  let nested = 0,
    entered = false
  try {
    OrdinaryNumericProjection.prototype.append = function (...args) {
      if (!entered) {
        entered = true
        const lease = o.view.ordinaryProjectionCache,
          cursor = lease.cursor
        const hits = o.view.pickCandidates(o.mouse, [o.terrain], o.camera)
        assert.equal(o.view.ordinaryProjectionCache, lease)
        assert.equal(
          lease.cursor,
          cursor,
          'nested generic call cannot reset the active cache lease'
        )
        assert.deepEqual(hits.map(normal), expected)
        nested++
      }
      return append.apply(this, args)
    }
    assert.deepEqual(query(o).map(normal), expected)
    assert.equal(nested, 1)
    let once = false
    OrdinaryNumericProjection.prototype.append = function (...args) {
      const slot = append.apply(this, args)
      if (!once) {
        once = true
        o.view.dispose()
      }
      return slot
    }
    assert.deepEqual(query(o).map(normal), expected)
    assert.equal(o.view.ordinaryNumericProjection, null)
    assert.equal(o.view.ordinaryPickScratch, null)
    assert.equal(o.view.ordinaryProjectionCache, null)
    assert.equal(runtimeTerrainPicking(o.view, o.terrain), false)
    pickRuntimeTerrain(o)
    assert.equal(o.view.ordinaryNumericProjection, null)
  } finally {
    OrdinaryNumericProjection.prototype.append = append
  }
  const recover = await fixture()
  let once = false
  try {
    OrdinaryNumericProjection.prototype.append = function (...args) {
      if (!once) {
        once = true
        throw new Error('injected batch failure')
      }
      return append.apply(this, args)
    }
    assert.throws(() => pickRuntimeTerrain(recover), /injected batch failure/)
    assert.equal(recover.view.ordinaryPickDepth, 0)
    assert.deepEqual(
      normal(pickRuntimeTerrain(recover)),
      normal(recover.view.pick(recover.mouse, [recover.terrain], recover.camera))
    )
  } finally {
    OrdinaryNumericProjection.prototype.append = append
  }
})

test('unowned entry preserves custom getters and argument access order', () => {
  const log = []
  const scene = {
    get view() {
      log.push('view')
      return {
        get pick() {
          log.push('pick')
          return (...args) => {
            log.push('call')
            return args
          }
        },
      }
    },
    get mouse() {
      log.push('mouse')
      return 1
    },
    get terrain() {
      log.push('terrain')
      return 2
    },
    get camera() {
      log.push('camera')
      return 3
    },
  }
  const expected = scene.view.pick(scene.mouse, [scene.terrain], scene.camera, false, undefined),
    order = log.slice()
  log.length = 0
  assert.deepEqual(pickRuntimeTerrain(scene), expected)
  assert.deepEqual(log, order)
})

test('constructor wiring follows first rebuild and generic overview remains independent', async () => {
  const source = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
  assert.match(source, /this\.rebuildTerrain\(\)\s+createRuntimeTerrainPicking\(this\)/)
  const o = await fixture(),
    terrain = o.terrain
  pickRuntimeTerrain(o)
  const storage = o.view.ordinaryNumericProjection
  o.view.update(800, 600, { x: 124, z: -124 }, 2, 1, true)
  assert.deepEqual(normal(pickRuntimeTerrain(o)), normal(o.view.pick(o.mouse, [terrain], o.camera)))
  assert.equal(o.view.ordinaryNumericProjection, storage)
  o.view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const replacement = new THREE.InstancedMesh(terrain.geometry, terrain.material, 9)
  replacement.userData = { ...terrain.userData }
  o.terrain = replacement
  assert.equal(runtimeTerrainPicking(o.view, replacement), false)
  assert.deepEqual(
    normal(pickRuntimeTerrain(o)),
    normal(o.view.pick(o.mouse, [replacement], o.camera))
  )
  assert.equal(o.view.ordinaryNumericProjection, storage)
})

test('owned loop avoids per-corner vector construction path while keeping exact work counts', async t => {
  const base = await fixture(false),
    owned = await fixture(true)
  const from = THREE.Vector3.prototype.fromBufferAttribute
  let calls = 0
  try {
    // Observation only: retain the exact canonical return value and all effects.
    // No optimized eligibility check depends on this method identity.
    THREE.Vector3.prototype.fromBufferAttribute = function (...args) {
      calls++
      return from.apply(this, args)
    }
    const bm = createOrdinaryTerrainMetrics(),
      cm = createOrdinaryTerrainMetrics()
    const b = base.view.pick(base.mouse, [base.terrain], base.camera, false, bm),
      baselineCalls = calls
    calls = 0
    const c = pickRuntimeTerrain(owned, { ordinaryTerrain: cm }),
      ownedCalls = calls
    assert.deepEqual(normal(c), normal(b))
    // Both first queries also compute the unchanged full geometry bounding box.
    assert.equal(ownedCalls, owned.terrain.geometry.getAttribute('position').count)
    assert.equal(baselineCalls - ownedCalls, bm.projectedVertices)
    assert.equal(cm.projectedVertices, bm.projectedVertices)
    assert.equal(cm.visitedTriangles, bm.visitedTriangles)
    t.diagnostic(
      JSON.stringify({
        projectedVertices: cm.projectedVertices,
        visitedTriangles: cm.visitedTriangles,
        baselineFromBufferCalls: baselineCalls,
        ownedFromBufferCalls: ownedCalls,
        retainedNumericBytes: owned.view.ordinaryNumericProjection.values.byteLength,
      })
    )
  } finally {
    THREE.Vector3.prototype.fromBufferAttribute = from
  }
})

test('unowned input keeps metrics getter last, even when it replaces the view', () => {
  const run = pick => {
    const log = [],
      first = {
        pick() {
          log.push('first')
          return { point: { x: 1, z: 1 } }
        },
      },
      second = {
        pick() {
          log.push('second')
          return { point: { x: 2, z: 2 } }
        },
      }
    const scene = {
      view: first,
      mouse: new THREE.Vector2(),
      terrain: {},
      camera: {},
      renderer: {
        domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) },
      },
    }
    const metrics = {
      get ordinaryTerrain() {
        log.push('metrics')
        scene.view = second
        return undefined
      },
    }
    return { point: pick(scene, { clientX: 400, clientY: 300 }, metrics), log }
  }
  const original = (scene, event, metrics) => {
    const rect = scene.renderer.domElement.getBoundingClientRect()
    scene.mouse.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2
    )
    return (
      scene.view.pick(scene.mouse, [scene.terrain], scene.camera, false, metrics?.ordinaryTerrain)
        ?.point ?? null
    )
  }
  assert.deepEqual(run(inputPick), run(original))
})

test('generic public picker and disposal preserve untouched receiver lookup trace', () => {
  function trace(Type, method) {
    const log = [],
      view = new Type(),
      proxy = new Proxy(view, {
        get(target, key, receiver) {
          log.push(String(key))
          return Reflect.get(target, key, receiver)
        },
      })
    if (method === 'pick') proxy.pickCandidates(new THREE.Vector2(), [], new THREE.Camera())
    else proxy.dispose()
    return log
  }
  for (const method of ['pick', 'dispose'])
    assert.deepEqual(trace(RenderView, method), trace(BaselineView, method))
})
