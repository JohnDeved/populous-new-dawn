// Passive numeric capture only: no event listeners, RAF, picker or driver.
// The caller must deliver ALL input (including disarmed gaps) and completed
// callbacks. Normalized event kind/extra-count truth needs browser qualification.
const FRAMES = 1200, EVENTS = 54, INPUT_WIDTH = 10, FRAME_WIDTH = 4
const offsets = [[3, 0], [3, 3], [0, 3], [-3, 0], [0, -3], [0, 0]]
const finite = n => typeof n === 'number' && Number.isFinite(n) && n >= 0
const integer = n => Number.isSafeInteger(n) && n >= 0

// Kind 1 is pointermove; all other kinds are terminal unexpected input. The
// adapter must map every other input type explicitly, never ignore it. Extra
// count is adapter-normalized additional coalesced samples, not raw list length.
export function createOrdinaryPointerCaptureBuffer(initialSerial, initialRaf, initialObserved) {
  if (!integer(initialSerial) || initialSerial > FRAMES - EVENTS - 1 ||
      !finite(initialRaf) || !finite(initialObserved) || initialObserved < initialRaf)
    throw new Error('Invalid initial callback identity')
  const inputs = new Float64Array((EVENTS + 1) * INPUT_WIDTH)
  const frames = new Float64Array(FRAMES * FRAME_WIDTH)
  let serial = initialSerial, raf = initialRaf, observed = initialObserved
  let inputCount = 0, frameCount = 0, completed = 0, armed = false, pending = false
  let inputAt = 0, inputAnchor = 0, terminal = null, finished = false
  const fail = reason => { terminal ??= reason; return false }
  return Object.freeze({
    arm() {
      if (terminal || finished) return false
      if (armed || pending || completed >= EVENTS) return fail('invalid-arm')
      armed = true
      return true
    },
    input(kind, x, y, buttons, trusted, extraCount, at, anchorSerial, anchorRaf) {
      if (terminal || finished) return false
      if (inputCount >= EVENTS + 1) return fail('input-capacity')
      // Retain the first offending input too; malformed scalars use NaN rather
      // than coercing strings/null into valid numeric evidence.
      let i = inputCount++ * INPUT_WIDTH
      inputs[i++] = typeof kind === 'number' ? kind : NaN
      inputs[i++] = typeof x === 'number' ? x : NaN
      inputs[i++] = typeof y === 'number' ? y : NaN
      inputs[i++] = typeof buttons === 'number' ? buttons : NaN
      inputs[i++] = trusted === true ? 1 : trusted === false ? 0 : NaN
      inputs[i++] = typeof extraCount === 'number' ? extraCount : NaN
      inputs[i++] = typeof at === 'number' ? at : NaN
      inputs[i++] = typeof anchorSerial === 'number' ? anchorSerial : NaN
      inputs[i++] = typeof anchorRaf === 'number' ? anchorRaf : NaN
      inputs[i++] = completed + 1
      if (!armed || pending) return fail('unexpected-input')
      if (kind !== 1 || buttons !== 0 || trusted !== true || extraCount !== 0) return fail('unadmitted-input')
      const offset = offsets[completed % offsets.length]
      if (x !== 900 + offset[0] || y !== 400 + offset[1]) return fail('wrong-point')
      if (!finite(at) || at < observed || at - initialObserved > 90000) return fail('input-time')
      if (anchorSerial !== serial || anchorRaf !== raf) return fail('input-anchor')
      pending = true; inputAt = at; inputAnchor = anchorSerial
      return true
    },
    frame(nextSerial, nextRaf, completedAt) {
      if (terminal || finished) return false
      if (frameCount >= FRAMES) return fail('frame-capacity')
      let i = frameCount++ * FRAME_WIDTH
      frames[i++] = typeof nextSerial === 'number' ? nextSerial : NaN
      frames[i++] = typeof nextRaf === 'number' ? nextRaf : NaN
      frames[i++] = typeof completedAt === 'number' ? completedAt : NaN
      frames[i++] = pending ? completed + 1 : 0
      if (!integer(nextSerial) || nextSerial !== serial + 1 || nextSerial >= FRAMES) return fail('callback-serial')
      if (!finite(nextRaf) || nextRaf <= raf || !finite(completedAt) ||
          completedAt < nextRaf || completedAt <= observed ||
          completedAt - initialObserved > 90000) return fail('callback-time')
      if (pending) {
        if (nextSerial !== inputAnchor + 1 || completedAt < inputAt) return fail('first-callback')
        completed++; pending = false; armed = false
      }
      serial = nextSerial; raf = nextRaf; observed = completedAt
      return true
    },
    abort() { if (!finished) fail('adapter-abort') },
    finish() {
      if (terminal || finished) return false
      if (armed || pending || completed !== EVENTS) return fail('incomplete')
      finished = true
      return true
    },
    // Materialization is post-capture only. No growing arrays/objects, hashing
    // or per-callback record allocation occurs in input()/frame().
    export() {
      return { contract: 'ordinary-pointer-repeat-v1', initialSerial, initialRaf, initialObserved,
        comparisonEligible: false, status: terminal ? 'failed' : finished ? 'captured-unqualified' : 'collecting',
        terminal, armed, pending, completed, inputCount, frameCount,
        inputWidth: INPUT_WIDTH, frameWidth: FRAME_WIDTH,
        inputs: inputs.slice(0, inputCount * INPUT_WIDTH), frames: frames.slice(0, frameCount * FRAME_WIDTH) }
    },
  })
}
