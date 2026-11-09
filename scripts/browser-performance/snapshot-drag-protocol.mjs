// Additional admission for the separately declared held-drag cohort. Stable
// hover keeps its original geometry, pose and first-callback checks unchanged.
import assert from 'node:assert/strict'
import { dragContract } from './snapshot-drag-contract.mjs'

const digest = value => assert.match(value, /^[a-f0-9]{64}$/)
export function assertDragGeometry(block) {
  const { geometryBefore: before, geometryAfter: after, event, frames } = block
  for (const boundary of [before, after]) {
    for (const name of ['fingerprintSha256', 'positionSha256', 'indexSha256', 'instancesSha256', 'consumerMethodsSha256']) digest(boundary[name])
    assert.ok(Array.isArray(boundary.witness) && boundary.witness.length === 113 && boundary.witness.every(Number.isFinite))
    assert.deepEqual(boundary.witness.slice(0, 6), [1, 1, 1, 1, 1, 0])
    assert.equal(boundary.metadata.drawRange.start, 0)
    assert.equal(boundary.metadata.drawRange.count, boundary.metadata.index.submittedCount)
    assert.equal(boundary.metadata.drawRange.count, boundary.witness[19])
    assert.equal(boundary.metadata.instanceCount, boundary.witness[20])
    assert.ok(Number.isSafeInteger(boundary.witness[19]) && boundary.witness[19] > 0 && boundary.witness[19] <= 98304 && boundary.witness[19] % 3 === 0)
    assert.ok(Number.isSafeInteger(boundary.witness[20]) && boundary.witness[20] > 0 && boundary.witness[20] <= 9)
  }
  // Only the submitted index prefix/count/version can change. Positions, active
  // instances, transforms, bounds, flags, methods and bindings cannot change.
  for (const name of ['positionSha256', 'instancesSha256', 'consumerMethodsSha256']) assert.equal(before[name], after[name])
  const metadata = value => ({ ...value.metadata, index: { ...value.metadata.index, submittedCount: 0 }, drawRange: { start: 0, count: 0 } })
  assert.deepEqual(metadata(before), metadata(after))
  for (let i = 0; i < 113; i++) if (i !== 10 && i !== 19) assert.equal(before.witness[i], after.witness[i])
  assert.ok(Number.isSafeInteger(before.witness[10]) && before.witness[10] >= 0 && Number.isSafeInteger(after.witness[10]))
  assert.equal(after.witness[10], before.witness[10] + 1, 'Exactly one reviewed index rebuild may occur')
  assert.notEqual(before.indexSha256, after.indexSha256, 'Old and new index inputs must be distinct')
  assert.notEqual(before.witness[19], after.witness[19], 'Declared two-pose submission counts must be distinct')
  assert.deepEqual(event.geometryWitness, before.witness, 'Synchronous pre-input witness must bind the old prefix')
  for (const observed of frames) assert.deepEqual(observed.geometryWitness, after.witness, 'First and settled endpoints must bind the new prefix')
}

export function assertDragPose(p, recording, step, preInput = false) {
  assert.ok(Array.isArray(p) && p.length === dragContract.poseWidth && p.every(Number.isFinite))
  const c = recording.before.camera, angle = preInput ? step % 2 : (step + 1) % 2
  assert.equal(c.position.angle, 0)
  assert.deepEqual(p.slice(0, 8), [c.position.x, c.position.y, angle, c.viewPoint.x, c.viewPoint.z, angle * Math.PI / 1024, c.zoom, c.preset])
  assert.deepEqual(p.slice(8, 10), [recording.point.x + angle, recording.point.y])
  assert.equal(p[10], 2); assert.equal(p[11], 1); assert.equal(p[12], recording.before.turn)
  assert.deepEqual(p.slice(13, 25), Array(12).fill(0)); assert.equal(p[25], 1)
  assert.equal(p[26], -1, 'Held right input suppresses ordinary hover ownership')
  assert.equal(p[27], 54, 'Actual production tooltip native pick must own target 54')
  assert.equal(p[32], angle); assert.equal(p[33], 0)
  assert.deepEqual(p.slice(28, 32), [c.position.x, c.position.y, Math.round((c.viewPoint.x + 8) * 256), Math.round((-c.viewPoint.z - 8) * 256)])
}

export function assertDragFrame(frame, block, index) {
  const p = frame.pointerBreakdown, native = p?.nativeOcclusion, interaction = p?.interaction
  assert.ok(native && interaction && p.ordinaryTerrain, 'Required query instrumentation is unknown')
  assert.equal(interaction.route, 'world')
  for (const key of ['dragQuery', 'placementQuery', 'sharedTerrain']) assert.equal(interaction[key], false)
  assert.equal(frame.simulationSteps, 0, 'Paused snapshot must not advance simulation')
  assert.equal(p.objectCacheHits, 0)
  const first = index === 0
  assert.equal(p.terrainPickCalls, first ? 1 : 0); assert.equal(p.objectPickCalls, first ? 1 : 0)
  assert.equal(interaction.pointerMoved, first); assert.equal(interaction.viewChanged, first)
  assert.equal(native.pixelCacheHits, 0); assert.equal(native.pixelCacheMisses, first ? 1 : 0)
  if (first) {
    const copies = block.geometryBefore.metadata.instanceCount
    assert.equal(native.submittedTriangles, block.geometryBefore.metadata.index.submittedCount * copies / 3,
      'First native query must consume the pre-input submission, not the rebuilt post-input prefix')
    assert.ok(native.projectedVertices > 0 && native.cacheKeyChanged > 0, 'First callback must perform real view-invalidated native projection')
    assert.equal(native.cacheHits, 0); assert.equal(native.cacheCold, 0); assert.equal(native.cachePositionChanged, 0)
  } else {
    for (const key of ['submittedTriangles', 'projectedVertices', 'cacheKeyChanged', 'cacheHits', 'cacheCold', 'cachePositionChanged']) assert.equal(native[key], 0)
  }
}
