import assert from 'node:assert/strict'
import test from 'node:test'
import { captureGameplayHeapSample, assertGameplayHeapSample, gameplayHeapPolicy } from '../scripts/tutorial-browser/gameplay-heap-observer.mjs'

const live = () => ({ timestampMs: 100, timeOriginUnixMs: 10000, sceneUuid: 'scene', level: 2, turn: 5,
  paused: false, inputMask: 0, speed: 1, visibility: 'visible', disposed: false, aborted: false,
  canvasConnected: true, connectedBattlefieldCanvases: 1, contextLost: false,
  rendererGeometries: 2, rendererTextures: 3, reachableGeometryIds: ['g'], reachableTextureIds: ['t'], reachableMaterialIds: ['m'] })
function fixture() {
  const calls = [], records = [], bytes = { usedSize: 100, totalSize: 200, embedderHeapUsedSize: 50, backingStorageSize: 300 }
  let time = 0
  const options = { boundary: 'after-workload', now: () => ++time, onSample: sample => records.push(sample),
    observe: async () => { calls.push('observe'); return live() },
    assertF8Hidden: async () => { calls.push('hidden') },
    session: { send: async method => { calls.push(method); return method === 'Runtime.getIsolateId' ? { id: 'isolate' } : method === 'Runtime.getHeapUsage' ? bytes : {} } } }
  return { options, calls, records, bytes }
}
test('capability sample requests exactly one GC immediately before byte read; no summed memory', async () => {
  const f = fixture(), sample = await captureGameplayHeapSample(f.options)
  assert.deepEqual(f.calls, ['hidden', 'observe', 'Runtime.getIsolateId', 'HeapProfiler.collectGarbage',
    'Runtime.getHeapUsage', 'Runtime.getIsolateId', 'observe', 'hidden'])
  assert.deepEqual(sample.bytes, f.bytes); assert.equal(f.records[0], sample)
  assert.equal(sample.gc.calls, 1); assert.equal(sample.status, 'passed')
  assert.deepEqual(Object.keys(sample.bytes), gameplayHeapPolicy.fields)
  assertGameplayHeapSample(sample)
})
test('unsupported or failed protocol commands retain failed evidence and never substitute zero', async () => {
  for (const method of ['Runtime.getIsolateId', 'HeapProfiler.collectGarbage', 'Runtime.getHeapUsage']) {
    const f = fixture(), send = f.options.session.send
    f.options.session.send = async name => { if (name === method) throw Error(`Unsupported ${name}`); return send(name) }
    await assert.rejects(captureGameplayHeapSample(f.options), /Unsupported/)
    assert.equal(f.records[0].status, 'failed'); assert.match(f.records[0].failure, /Unsupported/)
    if (method === 'HeapProfiler.collectGarbage') assert.equal(f.calls.includes('Runtime.getHeapUsage'), false)
  }
})
test('missing, negative, nonfinite and inconsistent byte fields fail', async () => {
  for (const field of gameplayHeapPolicy.fields) {
    for (const value of [undefined, -1, NaN, Infinity]) {
      const f = fixture(); f.bytes[field] = value
      await assert.rejects(captureGameplayHeapSample(f.options))
      assert.equal(f.records[0].status, 'failed')
    }
  }
  const f = fixture(); f.bytes.totalSize = 99
  await assert.rejects(captureGameplayHeapSample(f.options))
})
test('changed isolate, changed scene, paused state and visible F8 fail', async () => {
  for (const mutate of [
    f => { let i = 0; const send = f.options.session.send; f.options.session.send = async method => method === 'Runtime.getIsolateId' ? { id: String(i++) } : send(method) },
    f => { let i = 0; f.options.observe = async () => ({ ...live(), sceneUuid: String(i++) }) },
    f => { f.options.observe = async () => ({ ...live(), paused: true }) },
    f => { f.options.assertF8Hidden = async () => { throw Error('F8 visible') } },
  ]) { const f = fixture(); mutate(f); await assert.rejects(captureGameplayHeapSample(f.options)); assert.equal(f.records[0].status, 'failed') }
})

import { captureGameplayMatchedHeapSample, gameplayMatchedHeapPolicy } from '../scripts/tutorial-browser/gameplay-heap-observer.mjs'
test('matched protocol uses exactly one GC at each explicit post-workload boundary without changing historical labels', async () => {
  for (const boundary of gameplayMatchedHeapPolicy.boundaries) {
    const f = fixture(); f.options.boundary = boundary
    const sample = await captureGameplayMatchedHeapSample(f.options)
    assert.equal(sample.boundary, boundary); assert.equal(sample.gc.calls, 1)
    assert.equal(f.calls.filter(method => method === 'HeapProfiler.collectGarbage').length, 1)
    assert.throws(() => assertGameplayHeapSample(sample))
    await assert.rejects(captureGameplayHeapSample(f.options))
  }
  const historical = fixture()
  await assert.rejects(captureGameplayMatchedHeapSample(historical.options))
  assert.equal(historical.calls.length, 0)
})

import { captureGameplayThreeCycleHeapSample, gameplayThreeCycleHeapPolicy } from '../scripts/tutorial-browser/gameplay-heap-observer.mjs'
test('three-cycle profile has exactly three fixed boundaries and the same one-GC primitive protocol', async () => {
  assert.deepEqual(gameplayThreeCycleHeapPolicy.boundaries, ['after-cycle-1-workload', 'after-cycle-2-workload', 'after-cycle-3-workload'])
  for (const boundary of gameplayThreeCycleHeapPolicy.boundaries) {
    const f = fixture(); f.options.boundary = boundary
    const sample = await captureGameplayThreeCycleHeapSample(f.options)
    assert.equal(sample.boundary, boundary); assert.equal(sample.gc.calls, 1)
    assert.deepEqual(f.calls, ['hidden', 'observe', 'Runtime.getIsolateId', 'HeapProfiler.collectGarbage',
      'Runtime.getHeapUsage', 'Runtime.getIsolateId', 'observe', 'hidden'])
    assert.deepEqual(Object.keys(sample.bytes), gameplayHeapPolicy.fields)
  }
  for (const boundary of ['after-cycle-4-workload', 'after-workload', 'after-restart-settled']) {
    const f = fixture(); f.options.boundary = boundary
    await assert.rejects(captureGameplayThreeCycleHeapSample(f.options)); assert.equal(f.calls.length, 0)
  }
  const old = fixture(); old.options.boundary = 'after-cycle-3-workload'
  await assert.rejects(captureGameplayMatchedHeapSample(old.options)); assert.equal(old.calls.length, 0)
})
