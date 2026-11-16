import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { snapshotWorshipAudio } from '../scripts/tutorial-browser/worship-acquisition-audio.mjs'
const snapshot = window => JSON.parse(JSON.stringify(vm.runInNewContext(`(${snapshotWorshipAudio.toString()})()`, { window })))
test('missing probe is explicit', () => {
  assert.deepEqual(snapshot({}), { present: false })
})
test('snapshot preserves owner state and discloses incomplete decode/play', () => {
  const sound = { enabled: false, context: { state: 'running' }, buffers: new Map([['sound-169', {}]]), active: new Set(), music: { element: { readyState: 2, paused: true, error: { code: 3 } } }, disposed: false }
  const result = { trusted: true, error: 'x'.repeat(900) }
  const before = structuredClone({ sound, result })
  const row = snapshot({ __pndWorshipAudioProbe: { sound, result } })
  assert.equal(row.done, false); assert.equal(row.enabled, false)
  assert.equal(row.decodedSamples, 1); assert.equal(row.acquisitionDecoded, true)
  assert.equal(row.musicReadyState, 2); assert.equal(row.musicPaused, true)
  assert.equal(row.musicErrorCode, 3); assert.equal(row.error.length, 512)
  assert.deepEqual({ sound, result }, before)
})
test('disposed owner snapshot supports absent music and closed context', () => {
  const row = snapshot({ __pndWorshipAudioProbe: { sound: { buffers: new Map(), active: new Set(), music: null, context: { state: 'closed' }, disposed: true }, result: { done: true } } })
  assert.equal(row.done, true); assert.equal(row.contextState, 'closed')
  assert.equal(row.musicReadyState, null); assert.equal(row.acquisitionDecoded, false)
})
test('diagnostics retain cap, terminal assertions and no retry', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/worship-panel-lifecycle.mjs', import.meta.url), 'utf8')
  assert.match(source, /worshipPanelLifecycleLimitMs = 35000/)
  assert.match(source, /audioDiagnosticPending \|\| audioDiagnosticAttempts >= 140/)
  assert.match(source, /clearInterval\(audioDiagnosticTimer\)/)
  assert.match(source, /assertWorshipAudio\(report.acquisitionAudio\)/)
  assert.match(source, /assert.equal\(report.status, 'passed'/)
})
