import assert from 'node:assert/strict'
const modes = Object.freeze({ combined: Object.freeze([false, true]), native: Object.freeze([false]), fallback: Object.freeze([true]) })
function select(mode) {
  assert.ok(Object.hasOwn(modes, mode), 'Unknown pause-style execution mode')
  return modes[mode]
}
// Each callback includes awaited context cleanup. Failure or cancellation stops
// the sequence; split cases do not change the legacy combined execution bound.
export async function runPauseStyleModes(mode, signal, runVariant) {
  for (const fallback of select(mode)) {
    signal.throwIfAborted()
    await runVariant(fallback)
  }
}
export async function closePauseStyleContext(context, primaryFailed, receipt) {
  try { await context.close() }
  catch (error) {
    receipt.errors.push(`Pause context cleanup failed: ${String(error)}`)
    if (!primaryFailed) throw error
  }
}
// Exact independent keys reject duplicates, omissions and unexpected cases.
// A split group requires BOTH fixed modes, not whichever mode completes first.
export function assertPauseStyleCoverage(mode, records, fullscreen) {
  const body = [], focus = []
  for (const fallback of select(mode)) {
    const prefix = fallback ? 'fallback' : 'native'
    for (const size of ['320x240', '640x480', '800x450', '1920x1080']) {
      focus.push(`${prefix}:root-${size}`)
      for (const category of ['Game', 'Sound', 'Graphics']) focus.push(`${prefix}:options-${category}-${size}`)
      for (const panel of ['save', 'load']) {
        body.push(`${prefix}:${panel}-${size}`)
        if (size !== '320x240') focus.push(`${prefix}:${panel}-${size}`)
      }
    }
  }
  const prefix = entry => {
    assert.equal(typeof entry.fallback, 'boolean', 'Font variant must remain explicit')
    return entry.fallback ? 'fallback' : 'native'
  }
  assert.deepEqual(records.map(entry => `${prefix(entry)}:${entry.panel}-${entry.viewport.width}x${entry.viewport.height}`).sort(), body.sort(),
    'Every checkpoint body/World case must be retained exactly once')
  assert.deepEqual(fullscreen.map(entry => `${prefix(entry)}:${entry.label}`).sort(), focus.sort(),
    'Every fullscreen focus case must be retained exactly once')
}
