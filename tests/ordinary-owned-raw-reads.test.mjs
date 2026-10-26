import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { createOrdinaryTerrainMetrics } from '../app/ordinary-terrain-metrics.ts'
import {
  createRuntimeTerrainPicking,
  releaseRuntimeTerrainPicking,
  pickRuntimeTerrain,
} from '../app/runtime-terrain-picking.ts'

// Qualification may bind an untouched source module. Ordinary repository runs
// retain the unchanged generic path as the independent arithmetic oracle.
let BaselineView = RenderView
if (process.env.PND_TERRAIN_BASELINE) {
  const baselineURL = pathToFileURL(process.env.PND_TERRAIN_BASELINE).href
  const appURL = new URL('../app/render-view.ts', import.meta.url)
  const hook = registerHooks({
    resolve(specifier, context, next) {
      if (context.parentURL === baselineURL && specifier.startsWith('.'))
        return next(new URL(specifier, appURL).href, context)
      if (context.parentURL === baselineURL && specifier === 'three')
        return next(specifier, { ...context, parentURL: appURL.href })
      return next(specifier, context)
    },
  })
  try {
    BaselineView = (await import(baselineURL)).RenderView
  } finally {
    hook.deregister()
  }
}

function fixture(View = RenderView) {
  const values = new Float32Array(128 * 128 * 6 * 3)
  let next = 0
  for (let row = 0; row < 128; row++)
    for (let column = 0; column < 128; column++) {
      const x = column * 2 - 128, z = row * 2 - 128
      for (const [dx, dz] of [[0, 0], [0, 2], [2, 0], [2, 0], [0, 2], [2, 2]]) {
        values[next++] = x + dx
        values[next++] = 0
        values[next++] = z + dz
      }
    }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(values, 3))
  geometry.computeBoundingBox()
  const terrain = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial(), 9)
  Object.assign(terrain.userData, {
    terrainGrid: true, painterGround: true, nativeRelative: true,
  })
  const scene = {
    view: new View(), terrain,
    camera: new THREE.Camera(), mouse: new THREE.Vector2(0, 0),
    initialPositions: values,
  }
  scene.view.update(640, 480, { x: 0, z: 0 }, 0, 0, false)
  createRuntimeTerrainPicking(scene)
  return scene
}

function close(scene) {
  scene.view.dispose()
  scene.terrain.geometry.dispose()
  scene.terrain.material.dispose()
}

const normal = hit => hit && { ...hit, object: 'terrain', point: { ...hit.point } }
const ordered = hits => hits.map(normal)

function numeric(scene, metrics) {
  return scene.view.pickCandidateQuery(
    scene.mouse, [scene.terrain], scene.camera, false, undefined, metrics, true
  )
}

function mutate(scene, kind) {
  const position = scene.terrain.geometry.getAttribute('position')
  position.array.set(scene.initialPositions)
  for (let i = 0; i < position.count; i++) {
    // Leave version unchanged: each query must still read current raw geometry.
    if (kind === 'off-grid') position.setX(i, position.getX(i) + 0.25)
    else if (kind === 'unequal-duplicates') position.setY(i, i % 6 === 3 ? 0.375 : 0)
    else if (kind === 'signed-zero') {
      position.setY(i, i % 2 ? -0 : 0)
      if (position.getX(i) === 0) position.setX(i, i % 2 ? -0 : 0)
      if (position.getZ(i) === 0) position.setZ(i, i % 2 ? -0 : 0)
    } else position.setY(i, 0)
  }
  if (kind === 'nonfinite') {
    const index = scene.terrain.geometry.getIndex()
    position.setY(index.getX(0), NaN)
    position.setY(index.getX(6), Infinity)
    position.setY(index.getX(12), -Infinity)
  }
}

test('owned raw-read reuse keeps exact current corners, ordered candidates and generic/native isolation', () => {
  const base = fixture(BaselineView), candidate = fixture()
  const retained = []
  let nonempty = 0
  try {
    // Produce the real visibility index first; no custom view or attribute hooks.
    numeric(base); numeric(candidate)
    for (const kind of ['plain', 'off-grid', 'unequal-duplicates', 'signed-zero', 'nonfinite']) {
      for (const scene of [base, candidate]) mutate(scene, kind)
      let initialSubmission
      for (const [x, z, bearing] of [[0, 0, 0], [124, -124, 0.91]]) {
        for (const scene of [base, candidate])
          scene.view.update(640, 480, { x, z }, bearing, 0, false)
        const before = candidate.terrain.geometry.getAttribute('position').version
        const bm = createOrdinaryTerrainMetrics(false, true)
        const cm = createOrdinaryTerrainMetrics(false, true)
        const expected = numeric(base, bm)
        const actual = numeric(candidate, cm)
        assert.ok(cm.paths.numeric > 0)
        assert.ok(cm.projectedVertices > 0)
        assert.ok(cm.visitedTriangles > 0)
        assert.deepEqual(cm.paths, bm.paths)
        assert.deepEqual(
          [cm.projectedVertices, cm.visitedTriangles],
          [bm.projectedVertices, bm.visitedTriangles]
        )
        assert.deepEqual(ordered(actual), ordered(expected))
        assert.deepEqual(
          ordered(actual),
          ordered(candidate.view.pickCandidates(
            candidate.mouse, [candidate.terrain], candidate.camera
          ))
        )
        assert.deepEqual(normal(pickRuntimeTerrain(candidate)), normal(pickRuntimeTerrain(base)))
        assert.equal(candidate.terrain.geometry.getAttribute('position').version, before)
        const geometry = candidate.terrain.geometry
        const submission = {
          instances: candidate.terrain.count,
          count: geometry.drawRange.count,
          first: Array.from(geometry.getIndex().array.subarray(0, 72)),
        }
        if (initialSubmission) assert.notDeepEqual(submission, initialSubmission,
          'the edge view exercises a changed submitted terrain footprint')
        else initialSubmission = submission
        nonempty += Number(actual.length > 0)
        retained.push([actual, structuredClone(ordered(actual))])
        assert.deepEqual(
          ordered(candidate.view.pickCandidates(
            candidate.mouse, [candidate.terrain], candidate.camera, true
          )),
          ordered(base.view.pickCandidates(base.mouse, [base.terrain], base.camera, true))
        )
      }
    }
    assert.ok(nonempty > 0, 'includes real accepted hits, not only matching misses')
    for (const [hits, copy] of retained) assert.deepEqual(ordered(hits), copy)
  } finally {
    close(base); close(candidate)
  }
})

test('released custom attributes preserve read order, changing reads and exceptions', () => {
  const base = fixture(BaselineView), candidate = fixture()
  try {
    numeric(base); numeric(candidate)
    for (const scene of [base, candidate]) releaseRuntimeTerrainPicking(scene.view)
    for (const throws of [false, true]) {
      const records = []
      for (const scene of [base, candidate]) {
        const position = scene.terrain.geometry.getAttribute('position')
        const getY = THREE.BufferAttribute.prototype.getY
        const trace = []
        position.getY = function (index) {
          trace.push(index)
          if (throws && trace.length === 9) throw Error('custom raw read')
          // Pure deterministic varying reads are observable generic behavior.
          return getY.call(this, index) + (trace.length % 3) / 8
        }
        const metrics = createOrdinaryTerrainMetrics(false, true)
        try {
          if (throws) assert.throws(
            () => pickRuntimeTerrain(scene, { ordinaryTerrain: metrics }),
            /custom raw read/
          )
          else records.push(normal(pickRuntimeTerrain(scene, { ordinaryTerrain: metrics })))
          assert.equal(metrics.paths.numeric, 0)
          assert.equal(metrics.paths.packedVector, 0)
          assert.ok(metrics.paths.sparseVector > 0)
          assert.equal(scene.view.ordinaryNumericProjection, null)
          records.push(trace)
        } finally {
          delete position.getY
        }
      }
      if (throws) assert.deepEqual(records[0], records[1])
      else {
        assert.deepEqual(records[0], records[2])
        assert.deepEqual(records[1], records[3])
      }
    }
  } finally {
    close(base); close(candidate)
  }
})
