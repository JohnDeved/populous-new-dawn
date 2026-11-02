// Passive data-only proposal. No browser input, observer installation, workflow or
// comparator registration. Valid records alone never qualify performance evidence.
import assert from 'node:assert/strict'

const offsets = [[3, 0], [3, 3], [0, 3], [-3, 0], [0, -3], [0, 0]]
export const ordinaryPointerRepeatContract = Object.freeze({
  id: 'ordinary-pointer-repeat-v1', status: 'passive-unqualified',
  origin: Object.freeze([900, 400]), offsets: Object.freeze(offsets.map(Object.freeze)),
  warmupEvents: 6, measuredEvents: 48, totalEvents: 54,
  maximumRecorderFrames: 1200, maximumElapsedMs: 90000, authoredTurn: 70,
  scheduling: 'event-paced; not continuous-per-RAF',
  prerequisites: Object.freeze(['reviewed-scheduling-gap-calibration', 'production-pick-output-witness',
    'supported-functional-smoke', 'trusted-base-same-source-control', 'separate-reviewed-activation']),
})
const C = ordinaryPointerRepeatContract
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const expectedPoint = index => C.offsets[index % C.offsets.length].map((v, i) => C.origin[i] + v)

// Caller must supply every observed input and recorder callback, including gaps.
// This reducer checks record consistency, not the truth of a browser attestation.
export function createOrdinaryPointerRepeatRecorder(initial) {
  assert.ok(initial && integer(initial.serial, 0, C.maximumRecorderFrames - C.totalEvents - 1), 'Initial recorder lacks bounded capacity')
  assert.ok(finite(initial.timestampMs) && finite(initial.observedCompletedAtMs) &&
    initial.observedCompletedAtMs >= initial.timestampMs, 'Invalid initial RAF/completion timestamps')
  assert.ok(digest(initial.epoch) && digest(initial.geometrySha256), 'Missing initial epoch/geometry identity')
  assert.deepEqual(initial.point, C.origin, 'Initial pointer must be reset to the fixed origin before recording')
  assert.equal(initial.paused, true); assert.equal(initial.turn, C.authoredTurn)
  assert.equal(initial.buttons, 0); assert.equal(initial.viewChanged, false); assert.equal(initial.mode, 0)
  const epoch = initial.epoch, geometry = initial.geometrySha256, started = initial.observedCompletedAtMs
  let serial = initial.serial, timestamp = initial.timestampMs, completedAt = initial.observedCompletedAtMs, point = [...C.origin]
  let armed = false, pending = null, failed = null, finished = false, observedFrames = 0
  const selected = [], gaps = [], rawFrames = []
  let previousSelectedSerial = initial.serial, previousSelectedTimestamp = initial.observedCompletedAtMs
  const diagnostic = record => record && Object.fromEntries(['type', 'sequence', 'serial', 'timestampMs', 'observedCompletedAtMs',
    'anchorSerial', 'anchorTimestampMs', 'epoch', 'buttons', 'isTrusted', 'pointerMoved', 'viewChanged'].map(key => {
      const value = record[key]
      return [key, typeof value === 'string' ? value.slice(0, 256) : ['number', 'boolean'].includes(typeof value) ? value : null]
    }))
  const guard = (action, stage, record) => {
    assert.equal(failed, null, 'Recorder already failed')
    assert.equal(finished, false, 'Recorder already finished')
    try { return action() } catch (error) { failed = { message: String(error).slice(0, 1024), stage, offending: diagnostic(record) }; throw error }
  }
  const epochTime = (record, observedTime) => {
    assert.equal(record.epoch, epoch, 'Recorder reset/replacement')
    assert.ok(finite(observedTime) && observedTime >= started &&
      observedTime - started <= C.maximumElapsedMs, 'Recording deadline exceeded or invalid timestamp')
  }
  return Object.freeze({
    evidence() { return structuredClone({ status: failed ? 'failed' : finished ? 'records-consistent-unqualified' : 'collecting',
      error: failed, armed, pending, comparisonEligible: false, selected, gaps, rawFrames, observedFrames, lastSerial: serial }) },
    abort(reason) {
      assert.equal(finished, false, 'Recorder already finished')
      assert.ok(typeof reason === 'string' && reason.length > 0 && reason.length <= 512, 'Abort requires a bounded reason')
      failed ??= { message: reason, stage: 'adapter-abort', offending: null }
      return structuredClone({ status: 'failed', error: failed, armed, pending, selected, gaps, rawFrames, comparisonEligible: false })
    },
    arm() { return guard(() => {
      assert.ok(!armed && pending === null && selected.length < C.totalEvents, 'Invalid arm sequence')
      armed = true
      return Object.freeze({ sequence: selected.length + 1, point: Object.freeze(expectedPoint(selected.length)) })
    }, 'arm') },
    input(event) { return guard(() => {
      // Deliberately fail even while disarmed: ignored input could contaminate the
      // next first-callback attribution. A live adapter must keep listening.
      assert.ok(armed && pending === null, 'Unexpected or duplicate input, including disarmed intervals')
      epochTime(event, event.timestampMs)
      assert.equal(event.type, 'pointermove'); assert.equal(event.isTrusted, true)
      // Adapter-normalized declaration of no extra input, not a claim about
      // the browser's raw getCoalescedEvents() return shape.
      assert.deepEqual(event.coalescedEvents, [], 'Coalesced input is not admitted')
      assert.equal(event.buttons, 0); assert.equal(event.sequence, selected.length + 1)
      assert.deepEqual(event.point, expectedPoint(selected.length), 'Wrong fixed pointer trajectory')
      assert.notDeepEqual(event.point, point, 'Every event must change pointer position')
      assert.equal(event.anchorSerial, serial, 'Input anchor must be the latest observed recorder callback')
      assert.equal(event.anchorTimestampMs, timestamp, 'Input anchor timestamp mismatch')
      assert.ok(event.timestampMs >= completedAt, 'Input predates its observed callback completion')
      pending = { sequence: event.sequence, point: [...event.point], anchorSerial: serial,
        anchorTimestampMs: timestamp, timestampMs: event.timestampMs }
    }, 'input', event) },
    frame(frame) { return guard(() => {
      epochTime(frame, frame.observedCompletedAtMs)
      assert.equal(frame.serial, serial + 1, 'Missing, duplicate or reordered recorder callback')
      assert.ok(frame.serial < C.maximumRecorderFrames, 'Recorder ring bound reached')
      assert.ok(finite(frame.timestampMs) && frame.timestampMs > timestamp, 'RAF timestamps must advance')
      assert.ok(frame.observedCompletedAtMs >= frame.timestampMs && frame.observedCompletedAtMs > completedAt, 'Observed callback completion must advance')
      assert.equal(frame.paused, true); assert.equal(frame.turn, C.authoredTurn)
      assert.equal(frame.buttons, 0); assert.equal(frame.viewChanged, false); assert.equal(frame.mode, 0)
      assert.equal(frame.geometrySha256, geometry, 'Geometry inputs changed')
      for (const key of ['terrainCalls', 'objectCalls', 'ordinaryTriangles'])
        assert.ok(integer(frame[key], 0, Number.MAX_SAFE_INTEGER), `Invalid ${key}`)
      const wanted = pending?.point ?? point
      assert.deepEqual(frame.point, wanted, 'Pointer changed without its observed event')
      if (pending) {
        assert.equal(frame.serial, pending.anchorSerial + 1, 'Must attest exact first callback, never a later query')
        assert.ok(frame.observedCompletedAtMs >= pending.timestampMs, 'Observed callback completion predates input')
        assert.equal(frame.pointerMoved, true)
        assert.ok(frame.terrainCalls > 0 && frame.ordinaryTriangles > 0, 'Missing ordinary terrain query work')
        const witness = frame.resultWitness
        assert.ok(witness && ['world', 'unmapped-cell', 'unmapped-object'].includes(witness.route), 'Missing admitted tooltip result route')
        for (const key of ['picked', 'cell', 'inspectionTarget', 'hoveredObject'])
          assert.ok(witness[key] === null || integer(witness[key], 0, Number.MAX_SAFE_INTEGER), `Invalid result witness ${key}`)
        gaps.push({ sequence: pending.sequence, callbacksSincePriorSelected: frame.serial - previousSelectedSerial,
          inputToObservedCompletionMs: frame.observedCompletedAtMs - pending.timestampMs,
          previousSelectedToInputMs: pending.timestampMs - previousSelectedTimestamp,
          inputSincePreviousObservedCompletionMs: pending.timestampMs - completedAt })
        selected.push({ ...pending, point: [...pending.point], serial: frame.serial, callbackRafTimestampMs: frame.timestampMs, observedCompletedAtMs: frame.observedCompletedAtMs,
          phase: pending.sequence <= C.warmupEvents ? 'warmup' : 'measured',
          terrainCalls: frame.terrainCalls, objectCalls: frame.objectCalls, ordinaryTriangles: frame.ordinaryTriangles,
          resultWitness: Object.fromEntries(['route', 'picked', 'cell', 'inspectionTarget', 'hoveredObject'].map(key => [key, witness[key]])) })
        point = [...pending.point]; pending = null; armed = false; previousSelectedSerial = frame.serial; previousSelectedTimestamp = frame.observedCompletedAtMs
      } else assert.equal(frame.pointerMoved, false, 'Unobserved pointer movement')
      rawFrames.push({ serial: frame.serial, rafTimestampMs: frame.timestampMs, observedCompletedAtMs: frame.observedCompletedAtMs,
        point: [...frame.point], pointerMoved: frame.pointerMoved, viewChanged: frame.viewChanged, paused: frame.paused,
        turn: frame.turn, mode: frame.mode, buttons: frame.buttons, geometrySha256: geometry,
        terrainCalls: frame.terrainCalls, objectCalls: frame.objectCalls, ordinaryTriangles: frame.ordinaryTriangles })
      serial = frame.serial; timestamp = frame.timestampMs; completedAt = frame.observedCompletedAtMs; observedFrames++
    }, 'frame', frame) },
    finish() { return guard(() => {
      assert.ok(!armed && pending === null && selected.length === C.totalEvents, 'Incomplete fixed event sequence')
      finished = true
      return structuredClone({ contract: C.id, status: 'records-consistent-unqualified', comparisonEligible: false,
        missingPrerequisites: [...C.prerequisites], epoch, geometrySha256: geometry,
        observedFrames, elapsedMs: completedAt - started, rawFrames,
        warmup: selected.slice(0, C.warmupEvents), measured: selected.slice(C.warmupEvents), gaps })
    }, 'finish') },
  })
}

// Work equivalence only; scheduling calibration and supported source/runtime
// witnesses still require independent qualification. Never returns admission.
export function assertOrdinaryPointerRepeatWorkEqual(base, candidate) {
  for (const value of [base, candidate]) {
    assert.equal(value.contract, C.id)
    assert.equal(value.status, 'records-consistent-unqualified')
    assert.equal(value.comparisonEligible, false)
    assert.equal(value.warmup.length, C.warmupEvents)
    assert.equal(value.measured.length, C.measuredEvents)
  }
  assert.equal(base.geometrySha256, candidate.geometrySha256)
  const work = value => [...value.warmup, ...value.measured].map(event =>
    [event.sequence, event.phase, event.point, event.terrainCalls, event.objectCalls, event.ordinaryTriangles, event.resultWitness])
  assert.deepEqual(work(base), work(candidate), 'Per-event work or result witness mismatch')
  return { workEqual: true, comparisonEligible: false, missingPrerequisites: [...C.prerequisites] }
}
