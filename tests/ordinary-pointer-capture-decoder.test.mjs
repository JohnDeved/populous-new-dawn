import test from 'node:test'
import assert from 'node:assert/strict'
import { createOrdinaryPointerCaptureBuffer } from '../scripts/browser-performance/ordinary-pointer-capture-buffer.mjs'
import { decodeOrdinaryPointerCapture as decode } from '../scripts/browser-performance/ordinary-pointer-capture-decoder.mjs'

const epoch = 'a'.repeat(64), geometrySha256 = 'b'.repeat(64)
const offsets = [[3, 0], [3, 3], [0, 3], [-3, 0], [0, -3], [0, 0]]
function fixture() {
  let serial = 7, raf = 100, observed = 105, point = [900, 400]
  const state = () => ({ epoch, geometrySha256, point: [...point], paused: true,
    turn: 70, buttons: 0, viewChanged: false, mode: 0 })
  const initial = { ...state(), serial, timestampMs: raf, observedCompletedAtMs: observed }
  const capture = createOrdinaryPointerCaptureBuffer(serial, raf, observed)
  const frames = [], inputs = []
  const frame = moved => {
    serial++; raf++; observed += 10
    assert.equal(capture.frame(serial, raf, observed), true)
    frames.push({ ...state(), rowIndex: frames.length, serial, timestampMs: raf,
      observedCompletedAtMs: observed, pointerMoved: moved,
      terrainCalls: moved ? 1 : 0, objectCalls: 0, ordinaryTriangles: moved ? 9 : 0,
      resultWitness: { route: 'world', picked: 0, cell: 17, inspectionTarget: null, hoveredObject: null } })
  }
  for (let index = 0; index < 54; index++) {
    frame(false); capture.arm(); frame(false) // armed idle callback is retained
    point = offsets[index % 6].map((n, i) => n + [900, 400][i])
    const at = observed + 1
    assert.equal(capture.input(1, ...point, 0, true, 0, at, serial, raf), true)
    inputs.push({ rowIndex: index, sequence: index + 1, epoch,
      timestampMs: at, anchorSerial: serial, anchorTimestampMs: raf })
    frame(true)
  }
  assert.equal(capture.finish(), true)
  return { capture: capture.export(), supplemental: { initial, inputs, frames } }
}
const failed = ({ capture, supplemental }) => {
  const result = decode(capture, supplemental)
  assert.equal(result.status, 'failed'); assert.equal(result.comparisonEligible, false)
  assert.equal('evidence' in result, false)
  return result
}

test('actual capture and reducer compose all54 inputs/162 callbacks without timestamp sorting', () => {
  const f = fixture(), result = decode(f.capture, f.supplemental)
  assert.equal(result.status, 'decoded-consistent-unqualified')
  assert.equal(result.comparisonEligible, false)
  assert.equal(result.armChronology, 'synthetic-replay-only')
  assert.equal(result.evidence.warmup.length, 6); assert.equal(result.evidence.measured.length, 48)
  assert.equal(result.evidence.rawFrames.length, 162)
  assert.equal(result.evidence.gaps[0].callbacksSincePriorSelected, 3)
  assert.ok(result.evidence.warmup[0].callbackRafTimestampMs < result.evidence.warmup[0].timestampMs)
  assert.equal(result.evidence.warmup[0].resultWitness.picked, 0)
  assert.equal(result.evidence.warmup[0].resultWitness.inspectionTarget, null)
})
test('failed or collecting capture retains invalid numeric diagnostics without replay', () => {
  const c = createOrdinaryPointerCaptureBuffer(0, 100, 105)
  c.arm(); c.input(1, -0, NaN, Infinity, true, 0, 106, 0, 100)
  const raw = c.export(), result = failed({ capture: raw })
  assert.equal(result.raw.terminal, raw.terminal)
  assert.ok(Object.is(result.raw.inputs[1], -0)); assert.ok(Number.isNaN(result.raw.inputs[2]))
  assert.equal(result.raw.inputs[3], Infinity)
  raw.inputs[1] = 999; assert.ok(Object.is(result.raw.inputs[1], -0))
  const collecting = createOrdinaryPointerCaptureBuffer(0, 100, 105).export()
  assert.equal(failed({ capture: collecting }).raw.status, 'collecting')
})
test('envelope rejects malformed typed shape and unbounded counts before copying', () => {
  for (const change of [c => { c.inputCount = 56 }, c => { c.frameCount = 1201 },
    c => { c.inputs = [...c.inputs] }, c => { c.frameWidth = 5 },
    c => { c.frames = c.frames.subarray(1) }, c => { c.comparisonEligible = true }]) {
    const f = fixture(); change(f.capture); assert.equal(failed(f).raw, null)
  }
})
test('successful status is not trusted without complete state/counts', () => {
  for (const change of [c => { c.completed = 53 }, c => { c.armed = true },
    c => { c.pending = true }, c => { c.terminal = 'adapter-abort' },
    c => { c.inputCount = 53; c.inputs = c.inputs.slice(0, 530) }]) {
    const f = fixture(); change(f.capture); failed(f)
  }
})
test('missing or cross-bound initial/input/frame supplemental evidence fails closed', () => {
  for (const change of [s => { delete s.initial.epoch }, s => { s.initial.serial++ },
    s => { delete s.inputs }, s => { s.inputs[0].epoch = 'c'.repeat(64) },
    s => { s.inputs[0].timestampMs++ }, s => { s.inputs[0].anchorTimestampMs++ },
    s => { s.inputs[0].rowIndex = 1 }, s => { s.frames[0].rowIndex = 1 },
    s => { s.frames[0].timestampMs++ }, s => { s.frames[0].observedCompletedAtMs++ },
    s => { s.frames.pop() }, s => { delete s.frames[2].geometrySha256 }]) {
    const f = fixture(); change(f.supplemental); failed(f)
  }
})
test('numeric invalid/reordered/duplicate rows are never filtered or repaired', () => {
  for (const change of [c => { c.inputs[0] = 2 }, c => { c.inputs[4] = NaN },
    c => { c.inputs[5] = 1 }, c => { c.inputs[7]++ }, c => { c.inputs[9] = 2 },
    c => { c.frames[11] = 2 }, c => { c.frames[11] = 0 },
    c => { c.frames[0]++ }, c => { c.frames[1] = NaN },
    c => { c.inputs[6] = Infinity }]) {
    const f = fixture(); change(f.capture); failed(f)
  }
})
test('contract rejects omitted/invalid work, result, state and geometry fields', () => {
  for (const change of [r => { delete r.terrainCalls }, r => { r.ordinaryTriangles = 0 },
    r => { r.resultWitness = null }, r => { r.resultWitness.picked = undefined },
    r => { r.paused = false }, r => { r.turn++ }, r => { r.pointerMoved = false },
    r => { r.point = [900, 400] }, r => { r.geometrySha256 = 'c'.repeat(64) }]) {
    const f = fixture(); change(f.supplemental.frames[2]); failed(f)
  }
})
test('raw and replay evidence are detached from later supplied mutations', () => {
  const f = fixture(), result = decode(f.capture, f.supplemental)
  f.capture.inputs[1] = 999; f.supplemental.frames[2].resultWitness.picked = 999
  f.supplemental.frames[2].point[0] = 999
  assert.equal(result.raw.inputs[1], 903)
  assert.equal(result.evidence.warmup[0].point[0], 903)
  assert.equal(result.evidence.warmup[0].resultWitness.picked, 0)
})
test('malformed envelope metadata fails before raw materialization', () => {
  for (const [key, value] of [['initialSerial', {}], ['initialSerial', 1146],
    ['initialRaf', []], ['initialObserved', Infinity], ['status', {}],
    ['status', 'unknown'], ['terminal', { nested: [] }], ['terminal', 'x'.repeat(513)],
    ['armed', {}], ['pending', 0], ['completed', []], ['completed', 55]]) {
    const f = fixture(); f.capture[key] = value
    assert.equal(failed(f).raw, null, key)
  }
})
test('failed metadata and invalid typed rows are detached primitive diagnostics', () => {
  const c = createOrdinaryPointerCaptureBuffer(0, 100, 105)
  c.arm(); c.input(1, NaN, -0, 0, true, 0, 106, 0, 100)
  const source = c.export(), result = failed({ capture: source })
  const terminal = source.terminal
  source.terminal = 'changed'; source.initialSerial = 22; source.armed = false
  source.inputs[1] = 0; source.inputs[2] = 1
  assert.equal(result.raw.terminal, terminal); assert.equal(result.raw.initialSerial, 0)
  assert.equal(result.raw.armed, true); assert.ok(Number.isNaN(result.raw.inputs[1]))
  assert.ok(Object.is(result.raw.inputs[2], -0))
})
