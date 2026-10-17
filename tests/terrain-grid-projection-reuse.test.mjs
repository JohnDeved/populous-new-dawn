// Real shipped terrain construction and wave updates, with CPU-only picking.
import assert from 'node:assert/strict'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

let ReferenceView
if (process.env.PND_TERRAIN_BASELINE) {
  const threeURL = import.meta.resolve('three')
  const hook = registerHooks({
    resolve(specifier, context, next) {
      return specifier === 'three'
        ? { url: threeURL, shortCircuit: true }
        : next(specifier, context)
    },
  })
  try {
    ReferenceView = (await import(pathToFileURL(process.env.PND_TERRAIN_BASELINE).href)).RenderView
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
  const reference = ReferenceView ? new ReferenceView() : null
  reference?.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
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
  return {
    view,
    reference,
    mesh,
    world,
    scene,
    sample,
    water: () => updateWater(scene),
    close() {
      reference?.dispose()
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
