import assert from 'node:assert/strict'

export const ordinaryPointerSmokePolicy = Object.freeze({ browserMs: 90000,
  cleanupMs: 2000, artifactBytes: 8 * 1024 * 1024, hostedJobMinutes: 6,
  role: 'candidate-functional-smoke-not-comparison' })

export function ordinaryPointerSmokeSelection(event, eventName, head, scenario) {
  return eventName === 'pull_request' && event?.action === 'ready_for_review' &&
    event.pull_request?.draft === false && /^[a-f0-9]{40}$/.test(head ?? '') &&
    event.pull_request.head?.sha === head && scenario === 'ordinary-pointer-smoke' &&
    event.pull_request.labels?.some(label => label.name === `op-smoke:${head}`) === true
}

// Post-capture artifact only. No numeric coercion or typed-array JSON loss.
export function ordinaryPointerSmokeArtifact(value) {
  const text = JSON.stringify(value, (_, v) => {
    if (v === undefined) return { type: 'Undefined' }
    if (v instanceof Float64Array) return { type: 'Float64Array', length: v.length,
      littleEndian: new Uint8Array(new Uint16Array([1]).buffer)[0] === 1,
      base64: Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('base64') }
    if (typeof v === 'number' && (!Number.isFinite(v) || Object.is(v, -0)))
      return { type: 'Number', value: Object.is(v, -0) ? '-0' : String(v) }
    if (v instanceof Error) return { name: v.name, message: v.message.slice(0, 2000), stack: v.stack?.slice(0, 8000) }
    return v
  }) + '\n'
  assert.ok(Buffer.byteLength(text) <= ordinaryPointerSmokePolicy.artifactBytes, 'Smoke artifact exceeds fixed cap')
  return text
}

// Never suppress a falsey primary failure with a secondary cleanup rejection.
// A settled close promise is not proof of process-tree termination.
export async function closeOrdinaryPointerSmokeOwner(close, { schedule = setTimeout, cancel = clearTimeout,
  now = () => performance.now() } = {}) {
  let timer, outcome
  try {
    const started = now(); assert.ok(Number.isFinite(started) && started >= 0)
    await Promise.race([Promise.resolve().then(close), new Promise((_, reject) => {
      timer = schedule(() => reject(Error('Smoke owner cleanup deadline')), ordinaryPointerSmokePolicy.cleanupMs)
    })])
    const ended = now(); assert.ok(Number.isFinite(ended) && ended >= started)
    assert.ok(ended - started < ordinaryPointerSmokePolicy.cleanupMs, 'Smoke owner cleanup deadline')
    outcome = { confirmed: true }
  } catch (error) { outcome = { confirmed: false, error } }
  finally { try { cancel(timer) } catch (error) { outcome = { ...outcome, confirmed: false, timerCleanupError: error } } }
  return outcome
}
