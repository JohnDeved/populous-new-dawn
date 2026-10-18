// Real shipped terrain construction and wave updates, with CPU-only picking.
import assert from 'node:assert/strict'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { createNativeOcclusionMetrics, resetNativeOcclusionMetrics } from '../app/native-occlusion-metrics.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

let ReferenceView
if (process.env.PND_TERRAIN_BASELINE) {
  const threeURL = import.meta.resolve('three'),
    baselineURL = pathToFileURL(process.env.PND_TERRAIN_BASELINE).href,
    appURL = new URL('../app/render-view.ts', import.meta.url)
  const hook = registerHooks({
    resolve(specifier, context, next) {
      if (context.parentURL === baselineURL && specifier.startsWith('.'))
        return next(new URL(specifier, appURL).href, context)
      return specifier === 'three'
        ? { url: threeURL, shortCircuit: true }
        : next(specifier, context)
    },
  })
  try {
    ReferenceView = (await import(baselineURL)).RenderView
  } finally {
    hook.deregister()
  }
}

async function fixture(diagonal) {
  const api = await loadSceneFixture()
  const { rebuildTerrain, updateWater, landIndex } = await import('../app/scene-terrain-runtime.ts')
  const world = api.createWorld(2)
  for (let i = 0; i < world.land.flags.length; i++)
    world.land.flags[i] = (world.land.flags[i] & ~1) | diagonal
  const view = new RenderView(),
    mesh = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial(), 9)
  mesh.userData.painterGround = true
  mesh.userData.terrainGrid = true
  mesh.userData.nativeRelative = true
  const scene = {
    world,
    terrain: mesh,
    view,
    decorations: new THREE.Group(),
    updateView() {},
    waves: new Uint8Array(readFileSync(new URL('../public/original/waves.bin', import.meta.url))),
  }
  scene.landIndex = (x, z) => landIndex(scene, x, z)
  rebuildTerrain(scene)
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const reference = ReferenceView ? new ReferenceView() : null,
    nativeFallback = new RenderView()
  for (const oracle of [reference, nativeFallback])
    oracle?.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const camera = new THREE.Camera()
  const original = view.screen
  let projections = 0
  view.screen = function (...args) {
    projections++
    return original.apply(this, args)
  }
  // Disabling only the reuse eligibility uses the original projection loop,
  // while preserving shipped terrain submission and every arithmetic branch.
  const sample = (nativeEdges = false, mouse = new THREE.Vector2(0.1, 0.1)) => {
    const position = mesh.geometry.getAttribute('position')
    projections = 0
    const actual = view.pickCandidates(mouse, [mesh], camera, nativeEdges)
    const actualCalls = projections
    if (reference) {
      const originalCandidates = reference.pickCandidates(mouse, [mesh], camera, nativeEdges)
      assert.deepEqual(actual, originalCandidates, 'untouched main ordered candidate oracle')
      assert.deepEqual(
        view.resolvePickCandidates(actual),
        reference.resolvePickCandidates(originalCandidates)
      )
    }
    const normalized = position.normalized
    position.normalized = true // Float32 data remains numerically identical.
    projections = 0
    const expected = view.pickCandidates(mouse, [mesh], camera, nativeEdges)
    position.normalized = normalized
    assert.deepEqual(actual, expected)
    assert.deepEqual(view.resolvePickCandidates(actual), view.resolvePickCandidates(expected))
    return { actualCalls, expectedCalls: projections, candidates: actual }
  }
  // Keep the measured View's native cache warm. sample() above deliberately
  // changes eligibility on that same View and cannot prove consecutive reuse.
  const nativeSample = mouse => {
    projections = 0
    const actual = view.pickCandidates(mouse, [mesh], camera, true),
      actualCalls = projections,
      position = mesh.geometry.getAttribute('position')
    for (const oracle of [reference, nativeFallback]) {
      if (!oracle) continue
      const normalized = position.normalized
      try {
        if (oracle === nativeFallback) position.normalized = true
        const expected = oracle.pickCandidates(mouse, [mesh], camera, true)
        assert.deepEqual(actual, expected, 'native ordered candidate oracle')
        assert.deepEqual(view.resolvePickCandidates(actual), oracle.resolvePickCandidates(expected))
      } finally {
        position.normalized = normalized
      }
    }
    return { actualCalls, candidates: actual }
  }
  return {
    view,
    reference,
    mesh,
    world,
    scene,
    sample,
    projectionCount: () => projections,
    nativeSample,
    update(...args) {
      for (const target of [view, reference, nativeFallback]) target?.update(...args)
    },
    water: () => updateWater(scene),
    close() {
      reference?.dispose()
      nativeFallback.dispose()
      view.dispose()
      mesh.geometry.dispose()
      mesh.material.dispose()
    },
  }
}

for (const diagonal of [0, 1])
  test(`shipped diagonal ${diagonal} shares corners across cells, including live water`, async () => {
    const f = await fixture(diagonal)
    try {
      for (const turn of [0, 23, 256]) {
        f.world.turn = turn
        f.water()
        const { actualCalls, expectedCalls } = f.sample()
        assert.ok(expectedCalls > 0)
        assert.ok(
          actualCalls < expectedCalls / 3,
          'cross-cell reuse exceeds the rejected per-cell 4/6 ceiling'
        )
      }
    } finally {
      f.close()
    }
  })

// Exact camera differential coverage. Missing untouched-main input is an explicit
// skip, never a claimed oracle pass. Existing fallback/ownership tests remain below.
const cameraCases = [
  ['origin', 0, 0, 0, 0, false],
  ['fractional-quarter', 0.25, -0.375, Math.PI / 2, 0, false],
  ['fractional-half-near', 0.25, -0.375, Math.PI, -8192, false],
  ['fractional-three-quarter-far', 0.25, -0.375, (3 * Math.PI) / 2, 8192, false],
  ['x-seam-before-near', -8 - 1 / 256, -8, 0, -16384, false],
  ['x-seam-after-far', -8 + 1 / 256, -8, 0, 16384, false],
  ['z-seam-before-near', -8, -8 - 1 / 256, Math.PI / 2, -16384, false],
  ['z-seam-after-far', -8, -8 + 1 / 256, Math.PI / 2, 16384, false],
  ['wrapped-seam-before', 248 - 1 / 256, -8, 2 * Math.PI - Math.PI / 2048, 0, false],
  ['wrapped-seam-after', 248 + 1 / 256, -8, 2 * Math.PI + Math.PI / 2048, 0, false],
  ['fractional-overview', 0.25, -0.375, Math.PI / 4, 0, true],
  ['seam-overview', -8 + 1 / 256, -8 - 1 / 256, (3 * Math.PI) / 4, 0, true],
]

for (const diagonal of [0, 1])
  test(
    `camera matrix diagonal ${diagonal} matches untouched main ordered candidates and winner`,
    { skip: !ReferenceView && 'Set PND_TERRAIN_BASELINE to the untouched baseline module' },
    async t => {
      const f = await fixture(diagonal)
      let queries = 0,
        hits = 0
      try {
        for (const [name, x, z, heading, zoom, overview] of cameraCases) {
          f.view.update(800, 600, { x, z }, heading, zoom, overview)
          f.reference.update(800, 600, { x, z }, heading, zoom, overview)
          let caseHits = 0
          for (const turn of [0, 23, 256]) {
            f.world.turn = turn
            f.water()
            for (const mouseX of [-0.9, 0, 0.9])
              for (const mouseY of [-0.9, 0, 0.9])
                for (const nativeEdges of [false, true]) {
                  // Same scene objects deliberately preserve identity comparisons;
                  // independent RenderViews do not share projection cache state.
                  const result = f.sample(nativeEdges, new THREE.Vector2(mouseX, mouseY))
                  queries++
                  caseHits += Number(result.candidates.length > 0)
                }
          }
          assert.ok(caseHits > 0, `${name}: camera case must witness real terrain hits`)
          hits += caseHits
          t.diagnostic(`${name}: ${caseHits}/54 queries with ordered hits`)
        }
        assert.equal(queries, 648)
        assert.ok(
          hits > 0,
          'camera differential must witness real terrain hits, not empty equality'
        )
        t.diagnostic(`${queries} queries; ${hits} nonempty; untouched-main plus fallback oracle`)
      } finally {
        f.close()
      }
    }
  )

test('interleaved and normalized layouts retain the original projection route', async () => {
  const f = await fixture(0)
  try {
    const p = f.mesh.geometry.attributes.position
    p.normalized = true
    let calls = f.sample()
    assert.equal(calls.actualCalls, calls.expectedCalls)
    const data = new Float32Array(p.count * 4)
    for (let i = 0; i < p.count; i++) data.set([p.getX(i), p.getY(i), p.getZ(i)], i * 4)
    f.mesh.geometry.setAttribute(
      'position',
      new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(data, 4), 3, 0)
    )
    calls = f.sample()
    assert.equal(calls.actualCalls, calls.expectedCalls)
  } finally {
    f.close()
  }
})

test('unsupported terrain metadata, custom attributes and shared backing fall back', async () => {
  const f = await fixture(0)
  try {
    for (const key of ['painterGround', 'nativeRelative']) {
      f.mesh.userData[key] = false
      const calls = f.sample()
      assert.equal(calls.actualCalls, calls.expectedCalls)
      f.mesh.userData[key] = true
    }
    f.sample() // Populate the shipped index via visibility submission.
    const index = f.mesh.geometry.index,
      originalGetX = index.getX
    index.getX = function (i) {
      return originalGetX.call(this, i)
    }
    const indexCalls = f.sample()
    assert.equal(indexCalls.actualCalls, indexCalls.expectedCalls)
    delete index.getX
    const p = f.mesh.geometry.attributes.position
    const getter = p.getX
    p.getX = function (i) {
      return getter.call(this, i)
    }
    let calls = f.sample()
    assert.equal(calls.actualCalls, calls.expectedCalls)
    delete p.getX
    class CustomPosition extends THREE.Float32BufferAttribute {}
    Object.setPrototypeOf(p, CustomPosition.prototype)
    calls = f.sample()
    assert.equal(calls.actualCalls, calls.expectedCalls)
    Object.setPrototypeOf(p, THREE.Float32BufferAttribute.prototype)
    const shared = new Float32Array(new SharedArrayBuffer(p.array.byteLength))
    shared.set(p.array)
    p.array = shared
    calls = f.sample()
    assert.equal(calls.actualCalls, calls.expectedCalls)
  } finally {
    f.close()
  }
})

// Deliberately small submitted subset of the exact shipped position allocation.
// Both original-main and candidate execute identical custom visibility submission.
test('cross-cell exact equality, boundary IDs, fallback corners and instance isolation', async () => {
  const f = await fixture(0)
  try {
    const p = f.mesh.geometry.attributes.position
    const corners = [
      [0, 0, 0],
      [0, 0, 2],
      [2, 0, 0],
      [2, 0, 0],
      [0, 0, 2],
      [2, 0, 2],
      [2, 0, 0],
      [2, 0, 2],
      [4, 0, 0],
      [4, 0, 0],
      [2, 0, 2],
      [4, 0, 2],
    ]
    const reset = () => corners.forEach((v, i) => p.setXYZ(i, ...v))
    let ids = Array.from({ length: 12 }, (_, i) => i)
    const submit = () => {
      f.mesh.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(ids), 1))
      f.mesh.geometry.setDrawRange(0, ids.length)
    }
    f.view.updateTerrainVisibility = submit
    if (f.reference) f.reference.updateTerrainVisibility = submit
    f.mesh.count = 1
    f.mesh.setMatrixAt(0, new THREE.Matrix4())
    reset()
    assert.equal(
      f.sample().actualCalls,
      6,
      'adjacent cells share six unique corners, including source ID zero'
    )
    const projected = f.view.screen(new THREE.Vector3(2 / 3, 0, 2 / 3), new THREE.Camera(), true)
    const hit = f.sample(false, new THREE.Vector2(projected.x, projected.y))
    assert.ok(hit.candidates.length > 0, 'controlled subset must produce a real ordered hit')
    p.setY(6, 1) // Neighboring cell disagrees with the first cell's source ID2.
    p.setXYZ(9, 2, 0, 0) // Later corner must still reuse that first source, not ID6.
    assert.equal(f.sample().actualCalls, 7, 'cross-cell split height does not replace first source')
    reset()
    ids = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5]
    assert.equal(f.sample().actualCalls, 6, 'reordered cell submission remains exact')
    ids = [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    assert.equal(f.sample().actualCalls, 6, 'irregular index order still validates each source')
    ids = Array.from({ length: 12 }, (_, i) => i)
    for (const [axis, value] of [
      ['Y', 1],
      ['X', -0],
      ['Y', -0],
      ['Z', -0],
    ]) {
      reset()
      // IDs 0 and 4 deliberately share all coordinates, including zero X/Z.
      p.setXYZ(4, 0, 0, 0)
      const before = f.sample().actualCalls
      p[`set${axis}`](4, value)
      assert.equal(
        f.sample().actualCalls,
        before + 1,
        `${axis} ${Object.is(value, -0) ? '-0' : value} cannot reuse`
      )
    }
    for (const axis of ['X', 'Y', 'Z'])
      for (const value of [NaN, Infinity, -Infinity]) {
        reset()
        p[`set${axis}`](6, value)
        assert.equal(f.sample().actualCalls, 7, `nonfinite ${axis} projects independently`)
      }
    for (const [x, z] of [
      [0.25, 0],
      [130, 0],
      [0, -130],
    ]) {
      reset()
      p.setXYZ(6, x, 0, z)
      assert.equal(
        f.sample().actualCalls,
        7,
        'irregular or outside-grid vertex uses original projection'
      )
    }
    reset()
    for (let i = 0; i < 12; i++) p.setXYZ(i, 128, 0, 128)
    assert.equal(f.sample().actualCalls, 1, 'last grid slot supports +128 endpoints')
    // Different instances may share source coordinates but not projected objects.
    reset()
    f.mesh.count = 2
    f.mesh.setMatrixAt(1, new THREE.Matrix4().makeTranslation(4, 0, 0))
    assert.equal(f.sample().actualCalls, 12)
    assert.equal(f.sample().actualCalls, 12, 'second query recomputes every unique corner')
  } finally {
    f.close()
  }
})

test('packed terrain slots preserve sparse original triangle IDs and retained query results', async () => {
  const f = await fixture(0)
  try {
    const p = f.mesh.geometry.attributes.position,
      high = p.count - 6,
      corners = [
        [0, 0, 0],
        [0, 0, 2],
        [2, 0, 0],
        [2, 0, 0],
        [0, 0, 2],
        [2, 0, 2],
      ]
    for (const base of [high, 0]) corners.forEach((point, i) => p.setXYZ(base + i, ...point))
    let ids = [...Array.from({ length: 6 }, (_, i) => high + i), 0, 1, 2, 3, 4, 5]
    const submit = () => {
      f.mesh.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(ids), 1))
      f.mesh.geometry.setDrawRange(0, ids.length)
    }
    f.view.updateTerrainVisibility = submit
    if (f.reference) f.reference.updateTerrainVisibility = submit
    f.mesh.count = 1
    f.mesh.setMatrixAt(0, new THREE.Matrix4())
    const projected = f.view.screen(new THREE.Vector3(2 / 3, 0, 2 / 3), new THREE.Camera(), true),
      mouse = new THREE.Vector2(projected.x, projected.y),
      first = f.sample(false, mouse)
    assert.equal(first.actualCalls, 4, 'high first source and low aliases project four corners')
    assert.deepEqual(
      first.candidates.map(hit => hit.triangle),
      [high / 3, 0]
    )
    const retained = first.candidates.map(({ point, depth, triangle, instance }) => ({
      point: { ...point },
      depth,
      triangle,
      instance,
    }))
    ids = [...ids.slice(6), ...ids.slice(0, 6)]
    const second = f.sample(false, mouse)
    assert.deepEqual(
      second.candidates.map(hit => hit.triangle),
      [0, high / 3]
    )
    for (const base of [high, 0]) for (let i = 0; i < 6; i++) p.setY(base + i, 1)
    f.sample(false, mouse)
    assert.deepEqual(
      first.candidates.map(({ point, depth, triangle, instance }) => ({
        point,
        depth,
        triangle,
        instance,
      })),
      retained
    )
    assert.notStrictEqual(first.candidates[0].point, second.candidates[1].point)
    // Malformed Uint32 indices remain on the original sparse storage route.
    // The default-edge projection leaf accepts them; a bounded slot table must
    // not turn that existing behavior into an undefined-screen access.
    ids[0] = p.count + 3
    f.sample(false, mouse)
  } finally {
    f.close()
  }
})

// Native picking consumes an existing submission; it must not rebuild visibility.
// Use the real allocation with overlapping low/high cells for ordered hit witnesses.
function nativeSubset(f) {
  const p = f.mesh.geometry.attributes.position,
    high = p.count - 6,
    lowIDs = [0, 1, 2, 3, 4, 5],
    highIDs = lowIDs.map(i => high + i),
    corners = [[0, 0, 0], [0, 0, 2], [2, 0, 0], [2, 0, 0], [0, 0, 2], [2, 0, 2]]
  for (const base of [0, high]) corners.forEach((point, i) => p.setXYZ(base + i, ...point))
  const submit = ids => {
    f.mesh.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(ids), 1))
    f.mesh.geometry.setDrawRange(0, ids.length)
  }
  submit(lowIDs)
  f.mesh.count = 1
  f.mesh.setMatrixAt(0, new THREE.Matrix4())
  f.view.updateTerrainVisibility = () => assert.fail('native picking changed terrain submission')
  const mouse = (height = 0) => {
    const p = f.view.screen(new THREE.Vector3(2 / 3, height, 2 / 3), new THREE.Camera(), true)
    return new THREE.Vector2(p.x, p.y)
  }
  return { p, high, lowIDs, highIDs, submit, mouse }
}

test('native packed cache retains slots across pixels, submissions and versioned invalidation', async () => {
  const f = await fixture(0)
  try {
    const { p, high, lowIDs, highIDs, submit, mouse } = nativeSubset(f),
      pixel = mouse(),
      nextPixel = pixel.clone().add(new THREE.Vector2(2 / 800, 0)),
      first = f.nativeSample(pixel)
    assert.equal(first.actualCalls, 4, 'cold native query projects four exact corners')
    assert.deepEqual(first.candidates.map(hit => hit.triangle), [0])
    const retained = structuredClone(first.candidates.map(({ object, ...hit }) => hit))
    assert.equal(f.nativeSample(nextPixel).actualCalls, 0, 'new pixel keeps projected slots')
    submit([...lowIDs, ...highIDs])
    const added = f.nativeSample(pixel)
    assert.equal(added.actualCalls, 4, 'only new IDs project and share within this query')
    assert.deepEqual(added.candidates.map(hit => hit.triangle), [0, high / 3])
    assert.notStrictEqual(first.candidates[0].point, added.candidates[0].point)
    submit([...highIDs, ...lowIDs])
    const reordered = f.nativeSample(pixel)
    assert.equal(reordered.actualCalls, 0)
    assert.deepEqual(reordered.candidates.map(hit => hit.triangle), [high / 3, 0])
    submit(highIDs)
    assert.equal(f.nativeSample(nextPixel).actualCalls, 0, 'subset retains source-ID mapping')
    submit([...lowIDs, ...highIDs])
    for (const [label, change] of [
      ['position version', () => {
        for (const id of [...lowIDs, ...highIDs]) p.setY(id, 1)
        p.needsUpdate = true
      }],
      ['live water version', () => {
        const version = p.version
        f.world.turn = 23
        f.water()
        assert.ok(p.version > version)
      }],
      ['camera', () => f.update(800, 600, { x: 0.25, z: -0.375 }, Math.PI / 2, 0, false)],
      ['instance transform', () => {
        f.mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(1, 0, 0))
        f.mesh.instanceMatrix.needsUpdate = true
      }],
    ]) {
      change()
      assert.ok(f.nativeSample(pixel).actualCalls > 0, `${label} invalidates native projections`)
      assert.equal(f.nativeSample(nextPixel).actualCalls, 0, `${label} warms the replacement cache`)
    }
    assert.deepEqual(first.candidates.map(({ object, ...hit }) => hit), retained)
    f.view.painter.depth = (_object, triangle) => triangle === high / 3 ? -0.5 : 0.5
    assert.equal(f.view.resolvePickCandidates(added.candidates).triangle, high / 3)
    f.view.painter.depth = (_object, triangle) => triangle === 0 ? -0.5 : 0.5
    assert.equal(f.view.resolvePickCandidates(added.candidates).triangle, 0)
  } finally {
    f.close()
  }
})

test('native newly submitted aliases read current data without reusing old-query corners', async () => {
  const f = await fixture(0)
  try {
    const { p, high, lowIDs, highIDs, submit, mouse } = nativeSubset(f)
    assert.equal(f.nativeSample(mouse()).actualCalls, 4)
    const version = p.version
    for (const id of [...lowIDs, ...highIDs]) p.setY(id, 4)
    assert.equal(p.version, version, 'deliberately preserve the original native cache lifetime')
    submit([...lowIDs, ...highIDs])
    const added = f.nativeSample(mouse(4))
    assert.equal(added.actualCalls, 4, 'old IDs stay cached; new duplicates project current height')
    assert.ok(added.candidates.some(hit => hit.triangle === high / 3), 'new-height native hit')
    assert.equal(f.nativeSample(mouse(4)).actualCalls, 0)
    // Once versioned, signed-zero and nonfinite sources still obey exact equality.
    for (const [axis, value] of [['X', -0], ['Y', NaN], ['Y', Infinity]]) {
      p.setX(high + 4, 0)
      p.setY(high + 4, 4)
      p[`set${axis}`](high + 4, value)
      p.needsUpdate = true
      assert.equal(f.nativeSample(mouse(4)).actualCalls, 5, `${axis} ${value} projects independently`)
    }
  } finally {
    f.close()
  }
})

test('native dense and sparse cache transitions preserve valid and malformed submissions', async () => {
  const f = await fixture(0)
  try {
    const { p, lowIDs, highIDs, submit, mouse } = nativeSubset(f),
      ids = [...highIDs, ...lowIDs],
      pixel = mouse()
    submit(ids)
    assert.equal(f.nativeSample(pixel).actualCalls, 4)
    for (const [label, enter, leave] of [
      ['normalized position', () => { p.normalized = true }, () => { p.normalized = false }],
      ['custom index getter', () => {
        const index = f.mesh.geometry.index
        index.getX = function (i) { return this.array[i] }
      }, () => { delete f.mesh.geometry.index.getX }],
      ['partial cell', () => f.mesh.geometry.setDrawRange(0, 9),
        () => f.mesh.geometry.setDrawRange(0, ids.length)],
      ['out-of-range index', () => submit([p.count + 3, ...ids.slice(1)]), () => submit(ids)],
    ]) {
      enter()
      assert.ok(f.nativeSample(pixel).actualCalls > 0, `${label}: dense to sparse rebuild`)
      assert.equal(f.nativeSample(pixel).actualCalls, 0, `${label}: sparse cache remains warm`)
      leave()
      assert.equal(f.nativeSample(pixel).actualCalls, 4, `${label}: sparse to dense rebuild`)
      assert.equal(f.nativeSample(pixel).actualCalls, 0)
    }
  } finally {
    f.close()
  }
})

test('native instrumentation preserves exact picks, cache lifecycle and diagnostic-off clocks', async () => {
  const f = await fixture(0)
  const originalNow = Object.getOwnPropertyDescriptor(performance, 'now')
  try {
    f.view.updateTerrainVisibility(f.mesh)
    const mouse = new THREE.Vector2(0.1, 0.1), camera = new THREE.Camera()
    Object.defineProperty(performance, 'now', { configurable: true, value: () => { throw Error('disabled clock') } })
    const plain = f.view.pickCandidates(mouse, [f.mesh], camera, true)
    assert.ok(plain.length > 0)
    f.view.groundPickCache.delete(f.mesh)
    const metrics = createNativeOcclusionMetrics()
    let clock = 0
    Object.defineProperty(performance, 'now', { configurable: true, value: () => ++clock })
    const query = () => {
      const before = f.projectionCount()
      const result = f.view.pickCandidates(mouse, [f.mesh], camera, true, metrics)
      assert.equal(metrics.projectedVertices, f.projectionCount() - before)
      return result
    }
    assert.deepEqual(query(), plain)
    assert.ok(metrics.cacheCold > 0)
    assert.equal(metrics.cacheHits + metrics.cachePositionChanged + metrics.cacheKeyChanged, 0)
    assert.ok(metrics.projectedVertices > 0 && metrics.submittedTriangles > 0)
    assert.ok(metrics.projectionMs > 0 && metrics.triangleScanMs > 0)
    resetNativeOcclusionMetrics(metrics)
    assert.deepEqual(query(), plain)
    assert.ok(metrics.cacheHits > 0)
    assert.equal(metrics.projectedVertices, 0)
    assert.equal(metrics.cacheCold + metrics.cachePositionChanged + metrics.cacheKeyChanged, 0)
    const pos = f.mesh.geometry.getAttribute('position')
    for (const normalized of [true, false]) {
      pos.normalized = normalized
      resetNativeOcclusionMetrics(metrics)
      assert.deepEqual(query(), plain)
      assert.ok(metrics.projectedVertices > 0)
      assert.equal(metrics.cacheHits, 0, 'representation-only rebuild is not a retained hit')
      assert.equal(metrics.cacheKeyChanged + metrics.cacheCold + metrics.cachePositionChanged, 0)
    }
    pos.needsUpdate = true
    resetNativeOcclusionMetrics(metrics)
    assert.deepEqual(query(), plain)
    assert.ok(metrics.cacheKeyChanged > 0)
    assert.equal(metrics.cacheCold + metrics.cachePositionChanged, 0)
    f.mesh.geometry.setAttribute('position', pos.clone())
    resetNativeOcclusionMetrics(metrics)
    assert.deepEqual(query(), plain)
    assert.ok(metrics.cachePositionChanged > 0)
    assert.equal(metrics.cacheCold + metrics.cacheKeyChanged, 0)
    const entry = f.view.groundPickCache.get(f.mesh).get(0)
    let extra = -1
    for (let i = 0; i < pos.count; i += 6)
      if (entry.slots ? !entry.slots[i] : !entry.screen[i]) { extra = i; break }
    assert.ok(extra >= 0)
    f.mesh.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(
      Array.from({ length: 6 }, (_, i) => extra + i)), 1))
    f.mesh.geometry.setDrawRange(0, 6)
    resetNativeOcclusionMetrics(metrics)
    const added = query()
    assert.ok(metrics.cacheHits > 0 && metrics.projectedVertices > 0,
      'retained caches can fill previously unsubmitted original IDs')
    assert.deepEqual(added, f.view.pickCandidates(mouse, [f.mesh], camera, true))
    // A direct default-edge call ignores this native-only extension entirely.
    resetNativeOcclusionMetrics(metrics)
    Object.defineProperty(performance, 'now', { configurable: true, value: () => { throw Error('default clock') } })
    f.view.pickCandidates(mouse, [f.mesh], camera, false, metrics)
    assert.deepEqual(metrics, createNativeOcclusionMetrics())
    assert.deepEqual(f.view.pickCandidates(mouse, [], camera, true, metrics), [])
    f.view.overview = true
    assert.deepEqual(f.view.pickCandidates(mouse, [], camera, true, metrics), [])
    assert.deepEqual(metrics, createNativeOcclusionMetrics(), 'no native instance work means zero detail')
  } finally {
    if (originalNow) Object.defineProperty(performance, 'now', originalNow)
    else delete performance.now
    f.close()
  }
})
