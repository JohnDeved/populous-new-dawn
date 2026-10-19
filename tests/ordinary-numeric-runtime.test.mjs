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

async function fixture(owned = true) {
  const world = api.createWorld(2),
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
        assert.deepEqual(
          [cm.projectedVertices, cm.visitedTriangles, cm.visibility],
          [bm.projectedVertices, bm.visitedTriangles, bm.visibility]
        )
        assert.ok(cm.projectedVertices > 0)
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
  assert.ok(storage)
  pickRuntimeTerrain(other)
  assert.notEqual(storage, other.view.ordinaryNumericProjection)
  o.view.ordinaryPickDepth = 1
  try {
    const before = o.view.ordinaryNumericProjection
    pickRuntimeTerrain(o)
    assert.equal(o.view.ordinaryNumericProjection, before)
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
        const hits = o.view.pickCandidates(o.mouse, [o.terrain], o.camera)
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

test('optional actual paths distinguish numeric, packed vector and sparse vector without changing hits', async () => {
  const o = await fixture(), detail = createOrdinaryTerrainMetrics(false, true)
  const plain = normal(pickRuntimeTerrain(o))
  assert.deepEqual(normal(pickRuntimeTerrain(o, { ordinaryTerrain: detail })), plain)
  assert.ok(detail.paths.numeric > 0)
  assert.equal(detail.paths.packedVector, 0)
  assert.equal(detail.paths.sparseVector, 0)
  const instances = detail.paths.numeric
  const generic = createOrdinaryTerrainMetrics(false, true)
  assert.deepEqual(normal(o.view.pick(o.mouse, [o.terrain], o.camera, false, generic)), plain)
  assert.deepEqual(generic.paths, { version: 1, numeric: 0, packedVector: instances, sparseVector: 0 })
  const nested = createOrdinaryTerrainMetrics(false, true)
  o.view.ordinaryPickDepth = 1
  try {
    assert.deepEqual(normal(pickRuntimeTerrain(o, { ordinaryTerrain: nested })), plain)
    assert.deepEqual(nested.paths, { version: 1, numeric: 0, packedVector: instances, sparseVector: 0 })
  } finally {
    o.view.ordinaryPickDepth = 0
  }
  // Removing this producer flag selects sparse storage without changing geometry.
  o.terrain.userData.terrainGrid = false
  const sparse = createOrdinaryTerrainMetrics(false, true)
  assert.deepEqual(normal(pickRuntimeTerrain(o, { ordinaryTerrain: sparse })), plain)
  assert.deepEqual(sparse.paths, { version: 1, numeric: 0, packedVector: 0, sparseVector: instances })
  assert.equal(detail.projectedVertices, generic.projectedVertices)
  assert.equal(detail.visitedTriangles, sparse.visitedTriangles)
  assert.equal(createOrdinaryTerrainMetrics().paths, undefined)
})

test('native representation-only invalidation is optional, exclusive and counts actual cache misses', async () => {
  const { createNativeOcclusionMetrics, resetNativeOcclusionMetrics } = await import('../app/native-occlusion-metrics.ts')
  const o = await fixture(), detail = createNativeOcclusionMetrics(true)
  pickRuntimeTerrain(o) // Establish the ordinary submitted index before native cache admission.
  const pick = () => o.view.pickCandidates(o.mouse, [o.terrain], o.camera, true, detail)
  const first = pick()
  const instances = detail.cacheCold
  assert.ok(instances > 0)
  assert.equal(detail.cacheRepresentationChanged, 0)
  resetNativeOcclusionMetrics(detail)
  assert.deepEqual(pick(), first)
  assert.equal(detail.cacheHits, instances)
  assert.equal(detail.cacheRepresentationChanged, 0)
  resetNativeOcclusionMetrics(detail)
  o.terrain.userData.terrainGrid = false
  assert.deepEqual(pick(), first)
  assert.equal(detail.cacheRepresentationChanged, instances)
  for (const key of ['cacheHits', 'cacheCold', 'cachePositionChanged', 'cacheKeyChanged'])
    assert.equal(detail[key], 0, key)
  resetNativeOcclusionMetrics(detail)
  assert.equal(detail.cacheRepresentationChanged, 0)
  assert.deepEqual(pick(), first)
  assert.equal(detail.cacheHits, instances)
  assert.equal(detail.cacheRepresentationChanged, 0)
  assert.equal(createNativeOcclusionMetrics().cacheRepresentationChanged, undefined)
})
