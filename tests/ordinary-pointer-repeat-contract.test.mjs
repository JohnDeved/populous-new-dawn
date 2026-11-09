import test from 'node:test'
import assert from 'node:assert/strict'
import { ordinaryPointerRepeatContract as C, createOrdinaryPointerRepeatRecorder as create,
  assertOrdinaryPointerRepeatWorkEqual as equal } from '../scripts/browser-performance/ordinary-pointer-repeat-contract.mjs'
const initial = () => ({ epoch: 'a'.repeat(64), geometrySha256: 'b'.repeat(64), serial: 2, timestampMs: 100, observedCompletedAtMs: 105,
  point: [900, 400], paused: true, turn: 70, buttons: 0, viewChanged: false, mode: 0 })
const resultWitness = () => ({ route: 'world', picked: null, cell: 100, inspectionTarget: null, hoveredObject: null })
function fixture() {
  const start = initial(), recorder = create(start)
  let serial = start.serial, timestamp = start.timestampMs, point = [...start.point]
  const idle = () => {
    recorder.frame({ ...start, serial: ++serial, timestampMs: timestamp += 10, observedCompletedAtMs: timestamp + 5, point: [...point], pointerMoved: false,
      terrainCalls: 0, objectCalls: 0, ordinaryTriangles: 0 })
  }
  const next = () => {
    const armed = recorder.arm()
    const event = { epoch: start.epoch, type: 'pointermove', isTrusted: true, buttons: 0, coalescedEvents: [],
      sequence: armed.sequence, point: [...armed.point], anchorSerial: serial, anchorTimestampMs: timestamp, timestampMs: timestamp + 7 }
    const frame = { ...start, serial: serial + 1, timestampMs: timestamp + 10, observedCompletedAtMs: timestamp + 15, point: [...armed.point],
      pointerMoved: true, terrainCalls: 1, objectCalls: 2, ordinaryTriangles: 30, resultWitness: resultWitness() }
    return { event, frame }
  }
  const commit = ({ event, frame }) => { recorder.input(event); recorder.frame(frame); serial = frame.serial; timestamp = frame.timestampMs; point = [...frame.point] }
  return { recorder, start, next, commit, idle }
}
function complete(gaps = false) {
  const f = fixture()
  for (let n = 0; n < C.totalEvents; n++) { if (gaps) f.idle(); f.commit(f.next()) }
  return f.recorder.finish()
}
test('fixed 6+48 public-input records retain gaps and remain explicitly unqualified', () => {
  const r = complete(true)
  assert.equal(r.warmup.length, 6); assert.equal(r.measured.length, 48)
  assert.equal(r.observedFrames, 108); assert.equal(r.comparisonEligible, false)
  assert.equal(r.status, 'records-consistent-unqualified')
  assert.deepEqual(r.missingPrerequisites, [...C.prerequisites])
  assert.equal(r.gaps[0].callbacksSincePriorSelected, 2)
  assert.equal(r.gaps[0].previousSelectedToInputMs, 12)
  assert.equal(r.gaps[0].inputToObservedCompletionMs, 8)
  assert.equal(r.gaps[0].inputSincePreviousObservedCompletionMs, 2)
  assert.deepEqual(r.warmup.at(-1).point, [900, 400])
  assert.deepEqual(r.measured[0].point, [903, 400])
  for (const event of [...r.warmup, ...r.measured]) assert.equal(event.serial, event.anchorSerial + 1)
})
test('unexpected input fails closed even before arming or between blocks', () => {
  for (const after of [false, true]) {
    const f = fixture(); if (after) f.commit(f.next())
    assert.throws(() => f.recorder.input({}), /disarmed/)
    assert.equal(f.recorder.evidence().status, 'failed')
    assert.throws(() => f.recorder.arm(), /already failed/)
  }
})
test('duplicate and coalesced input cannot silently replace the owned event', () => {
  for (const coalesced of [false, true]) {
    const f = fixture(), r = f.next()
    if (coalesced) r.event.coalescedEvents = [{}]
    else f.recorder.input(r.event)
    assert.throws(() => f.recorder.input(r.event), coalesced ? /Coalesced/ : /duplicate/)
  }
})
test('synthetic, wrong-coordinate, wrong-button and out-of-order input fail', () => {
  for (const delta of [{ isTrusted: false }, { point: [904, 400] }, { buttons: 2 }, { sequence: 2 }, { type: 'keydown' }]) {
    const f = fixture(), r = f.next(); assert.throws(() => f.recorder.input({ ...r.event, ...delta }))
  }
})
test('input must bind latest callback serial and timestamp, not a stale anchor', () => {
  for (const delta of [{ anchorSerial: 1 }, { anchorTimestampMs: 99 }, { timestampMs: 99 }]) {
    const f = fixture(), r = f.next(); assert.throws(() => f.recorder.input({ ...r.event, ...delta }))
  }
})
test('every selected callback is anchor+1, never a later replacement after loss', () => {
  const f = fixture(), r = f.next(); f.recorder.input(r.event)
  assert.throws(() => f.recorder.frame({ ...r.frame, serial: r.frame.serial + 1 }), /Missing/)
  assert.throws(() => f.recorder.frame(r.frame), /already failed/)
  assert.equal(f.recorder.evidence().selected.length, 0)
})
test('epoch reset and non-advancing callback timestamps are rejected', () => {
  for (const delta of [{ epoch: 'c'.repeat(64) }, { timestampMs: 100 }, { observedCompletedAtMs: 106 }]) {
    const f = fixture(), r = f.next(); f.recorder.input(r.event)
    assert.throws(() => f.recorder.frame({ ...r.frame, ...delta }))
  }
})
test('initial origin, capacity, mode and pause are fixed', () => {
  for (const delta of [{ point: [901, 400] }, { serial: 1146 }, { serial: -1 }, { paused: false }, { mode: 1 }, { turn: 71 }])
    assert.throws(() => create({ ...initial(), ...delta }))
})
test('late event and cumulative recorder overflow cannot become complete', () => {
  const f = fixture(), r = f.next()
  assert.throws(() => f.recorder.input({ ...r.event, timestampMs: f.start.observedCompletedAtMs + C.maximumElapsedMs + 1 }), /deadline/)
  const g = fixture()
  for (let n = 0; n < 1197; n++) g.idle()
  assert.throws(() => g.idle(), /ring bound/)
  assert.equal(g.recorder.evidence().status, 'failed')
})
test('paused geometry/view/state and public pointer must remain admitted', () => {
  for (const delta of [{ geometrySha256: 'c'.repeat(64) }, { viewChanged: true }, { paused: false },
    { turn: 71 }, { point: [905, 400] }, { pointerMoved: false }, { mode: 1 }]) {
    const f = fixture(), r = f.next(); f.recorder.input(r.event); assert.throws(() => f.recorder.frame({ ...r.frame, ...delta }))
  }
})
test('ordinary query work and actual tooltip-result witness are mandatory', () => {
  for (const delta of [{ terrainCalls: 0 }, { ordinaryTriangles: 0 }, { objectCalls: NaN },
    { resultWitness: null }, { resultWitness: { ...resultWitness(), route: 'hud' } },
    { resultWitness: { ...resultWitness(), inspectionTarget: -1 } }]) {
    const f = fixture(), r = f.next(); f.recorder.input(r.event); assert.throws(() => f.recorder.frame({ ...r.frame, ...delta }))
  }
})
test('partial sequence cannot finish; completed sequence cannot accept more events', () => {
  const f = fixture(); f.commit(f.next()); assert.throws(() => f.recorder.finish(), /Incomplete/)
  const g = fixture(); for (let n = 0; n < 54; n++) g.commit(g.next())
  g.recorder.finish(); assert.throws(() => g.recorder.arm(), /finished/)
})
test('input and witness mutation after ingestion cannot alter retained evidence', () => {
  const f = fixture(), r = f.next(); f.recorder.input(r.event); r.event.point[0] = -1
  f.recorder.frame(r.frame); r.frame.resultWitness.cell = -1
  const first = f.recorder.evidence(); assert.deepEqual(first.selected[0].point, [903, 400]); assert.equal(first.selected[0].resultWitness.cell, 100)
  first.selected[0].point[0] = -1; assert.deepEqual(f.recorder.evidence().selected[0].point, [903, 400])
})
test('per-event work equality does not require identical timings or grant admission', () => {
  const a = complete(), b = complete(true)
  assert.deepEqual(equal(a, b), { workEqual: true, comparisonEligible: false, missingPrerequisites: [...C.prerequisites] })
  for (const key of ['terrainCalls', 'objectCalls', 'ordinaryTriangles']) {
    const c = structuredClone(b); c.measured[0][key]++
    assert.throws(() => equal(a, c), /work or result witness mismatch/)
  }
  const c = structuredClone(b); c.measured[0].resultWitness.cell++
  assert.throws(() => equal(a, c), /work or result witness mismatch/)
})

test('RAF stamp may precede the input while the observed completion follows it', () => {
  const f = fixture(), r = f.next()
  assert.ok(r.event.timestampMs > 106)
  f.recorder.input(r.event); f.recorder.frame({ ...r.frame, timestampMs: 106 })
  assert.equal(f.recorder.evidence().selected[0].callbackRafTimestampMs, 106)
  assert.equal(f.recorder.evidence().selected[0].observedCompletedAtMs, 115)
  assert.equal(f.recorder.evidence().gaps[0].inputToObservedCompletionMs, 8)
})
test('explicit abort retains pending/armed ownership and cannot admit a result', () => {
  const f = fixture(), r = f.next(); f.recorder.input(r.event)
  const failed = f.recorder.abort('observer stopped before next callback')
  assert.equal(failed.status, 'failed'); assert.equal(failed.armed, true)
  assert.equal(failed.pending.anchorSerial, r.event.anchorSerial)
  assert.equal(failed.error.stage, 'adapter-abort'); assert.equal(failed.comparisonEligible, false)
  assert.throws(() => f.recorder.finish(), /already failed/)
  failed.pending.point[0] = -1; assert.deepEqual(f.recorder.evidence().pending.point, [903, 400])
})
test('failed callback retains bounded offending metadata and existing raw gap records', () => {
  const f = fixture(); f.idle(); const r = f.next(); f.recorder.input(r.event)
  assert.throws(() => f.recorder.frame({ ...r.frame, serial: r.frame.serial + 1 }), /Missing/)
  const evidence = f.recorder.evidence()
  assert.equal(evidence.error.stage, 'frame'); assert.equal(evidence.error.offending.serial, r.frame.serial + 1)
  assert.equal(evidence.rawFrames.length, 1); assert.equal(evidence.rawFrames[0].terrainCalls, 0)
  assert.equal(evidence.pending.sequence, 1)
})
test('finish returns detached records and retains every accepted gap callback', () => {
  const f = fixture(); for (let n = 0; n < 54; n++) { f.idle(); f.commit(f.next()) }
  const result = f.recorder.finish(); assert.equal(result.rawFrames.length, 108)
  result.warmup[0].point[0] = -1; result.measured[0].resultWitness.cell = -1
  result.gaps[0].inputToObservedCompletionMs = -1; result.rawFrames[0].point[0] = -1
  const evidence = f.recorder.evidence()
  assert.deepEqual(evidence.selected[0].point, [903, 400]); assert.equal(evidence.selected[6].resultWitness.cell, 100)
  assert.equal(evidence.gaps[0].inputToObservedCompletionMs, 8); assert.deepEqual(evidence.rawFrames[0].point, [900, 400])
})
