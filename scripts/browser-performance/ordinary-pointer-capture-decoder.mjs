// Passive post-capture consistency replay, never a browser adapter or admission.
import assert from 'node:assert/strict'
import { createOrdinaryPointerRepeatRecorder } from './ordinary-pointer-repeat-contract.mjs'

const count = (n, max) => Number.isSafeInteger(n) && n >= 0 && n <= max
const fields = ['epoch', 'geometrySha256', 'point', 'paused', 'turn', 'buttons',
  'viewChanged', 'mode', 'pointerMoved', 'terrainCalls', 'objectCalls',
  'ordinaryTriangles', 'resultWitness']
const project = value => Object.fromEntries(fields.map(key => [key, value[key]]))

// Inputs must be inert, supplied data, not executable getters/proxies. Transport
// must preserve typed numeric values: JSON null is not NaN/Infinity/signed zero.
// Supplemental records attest omitted fields; this function cannot verify their
// production origin. rowIndex and callback identity bind their supplied ordering.
export function decodeOrdinaryPointerCapture(capture, supplemental) {
  let raw = null
  try {
    assert.equal(capture.contract, 'ordinary-pointer-repeat-v1')
    assert.equal(capture.comparisonEligible, false)
    assert.equal(capture.inputWidth, 10); assert.equal(capture.frameWidth, 4)
    assert.ok(count(capture.inputCount, 55) && count(capture.frameCount, 1200), 'Invalid bounded counts')
    assert.ok(capture.inputs instanceof Float64Array && capture.frames instanceof Float64Array, 'Typed capture required')
    assert.equal(capture.inputs.length, capture.inputCount * 10)
    assert.equal(capture.frames.length, capture.frameCount * 4)
    // Metadata is copied as primitive diagnostics, never retained by reference.
    assert.ok(count(capture.initialSerial, 1145), 'Invalid initial serial')
    assert.ok(Number.isFinite(capture.initialRaf) && capture.initialRaf >= 0 &&
      Number.isFinite(capture.initialObserved) && capture.initialObserved >= capture.initialRaf,
    'Invalid initial timestamps')
    assert.ok(['failed', 'collecting', 'captured-unqualified'].includes(capture.status), 'Invalid capture status')
    assert.ok(capture.terminal === null || (typeof capture.terminal === 'string' &&
      capture.terminal.length > 0 && capture.terminal.length <= 512), 'Invalid terminal diagnostic')
    assert.equal(typeof capture.armed, 'boolean'); assert.equal(typeof capture.pending, 'boolean')
    assert.ok(count(capture.completed, 54), 'Invalid completed count')
    raw = { initialSerial: capture.initialSerial, initialRaf: capture.initialRaf,
      initialObserved: capture.initialObserved, status: capture.status, terminal: capture.terminal,
      armed: capture.armed, pending: capture.pending, completed: capture.completed,
      inputCount: capture.inputCount, frameCount: capture.frameCount,
      inputWidth: 10, frameWidth: 4, inputs: capture.inputs.slice(), frames: capture.frames.slice() }
    assert.equal(capture.status, 'captured-unqualified', 'Incomplete/failed capture cannot be replayed')
    assert.equal(capture.terminal, null); assert.equal(capture.armed, false); assert.equal(capture.pending, false)
    assert.equal(capture.completed, 54); assert.equal(capture.inputCount, 54)
    assert.ok(supplemental && Array.isArray(supplemental.frames), 'Supplemental frame evidence required')
    assert.equal(supplemental.frames.length, capture.frameCount)
    assert.ok(Array.isArray(supplemental.inputs), 'Supplemental input evidence required')
    assert.equal(supplemental.inputs.length, 54, 'Extra/missing input evidence')
    const initial = supplemental.initial
    assert.equal(initial.serial, capture.initialSerial)
    assert.equal(initial.timestampMs, capture.initialRaf)
    assert.equal(initial.observedCompletedAtMs, capture.initialObserved)
    const recorder = createOrdinaryPointerRepeatRecorder({ ...project(initial),
      serial: capture.initialSerial, timestampMs: capture.initialRaf, observedCompletedAtMs: capture.initialObserved })
    let inputIndex = 0
    for (let index = 0; index < capture.frameCount; index++) {
      const [serial, timestampMs, observedCompletedAtMs, sequence] = raw.frames.subarray(index * 4, index * 4 + 4)
      const supplied = supplemental.frames[index]
      assert.equal(supplied.rowIndex, index, 'Supplemental row order mismatch')
      assert.equal(supplied.serial, serial); assert.equal(supplied.timestampMs, timestampMs)
      assert.equal(supplied.observedCompletedAtMs, observedCompletedAtMs)
      assert.ok(count(sequence, 54), 'Invalid selected sequence')
      if (sequence !== 0) {
        assert.equal(sequence, inputIndex + 1, 'Missing/duplicate/reordered selected input')
        const [kind, x, y, buttons, trusted, extras, at, anchorSerial, anchorTimestampMs, inputSequence] =
          raw.inputs.subarray(inputIndex * 10, inputIndex * 10 + 10)
        assert.equal(inputSequence, sequence); assert.equal(kind, 1)
        assert.equal(trusted, 1); assert.equal(extras, 0)
        const inputEvidence = supplemental.inputs[inputIndex]
        assert.equal(inputEvidence.rowIndex, inputIndex, 'Supplemental input order mismatch')
        assert.equal(inputEvidence.sequence, sequence)
        assert.equal(inputEvidence.timestampMs, at)
        assert.equal(inputEvidence.anchorSerial, anchorSerial)
        assert.equal(inputEvidence.anchorTimestampMs, anchorTimestampMs)
        // Synthetic replay arm only. Actual arm chronology is not captured.
        recorder.arm()
        recorder.input({ type: 'pointermove', point: [x, y], buttons, isTrusted: true,
          coalescedEvents: [], timestampMs: at, anchorSerial, anchorTimestampMs,
          sequence, epoch: inputEvidence.epoch })
        inputIndex++
      }
      recorder.frame({ ...project(supplied), serial, timestampMs, observedCompletedAtMs })
    }
    assert.equal(inputIndex, 54, 'Unconsumed input records')
    return { status: 'decoded-consistent-unqualified', comparisonEligible: false,
      armChronology: 'synthetic-replay-only', raw, evidence: recorder.finish() }
  } catch (error) {
    return { status: 'failed', comparisonEligible: false, raw,
      error: String(error).slice(0, 1024) }
  }
}
