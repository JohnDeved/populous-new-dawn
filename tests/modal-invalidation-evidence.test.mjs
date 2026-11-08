import test from 'node:test'
import assert from 'node:assert/strict'
import { validateModalInvalidationEvidence as check } from '../scripts/modal-invalidation/evidence.mjs'
// Fabricated controls exercise rejection only; these are NOT browser evidence.
function control() {
  const episode = kind => ({ kind, triggerCompleted: true, triggerWasSynthetic: false, triggerAt: 400,
    samples: [0, 350, 500, 850].map((at, i) => ({at, observedDrawCount: i < 2 ? 20 : 21, modalSuspended: true, ownerUnchanged: true, frozenState: {turn: 42, shot: [1, 2], person: [3, 4]}})),
    pixelReadback: {nonempty: true, afterTrigger: true, changedFromBefore: kind === 'late-texture'},
    texture: {statusBefore: 'loading', statusAfter: 'ready', readyResult: true, completionRevisionBefore: 3, completionRevisionAfter: 4, realImageDecode: true, usedByVisibleMaterial: true},
    context: {extension: 'WEBGL_lose_context', lostEventTrusted: true, restoredEventTrusted: true, observedLost: true, observedRestored: true, lostAt: 390, restoredAt: 400}})
  return {kind: 'modal-invalidation-browser-v1', head: 'a'.repeat(40), browserErrors: [], cleanupVerified: true, sceneOwnerUnchanged: true, episodes: ['late-texture', 'webgl-restoration'].map(episode)}
}
test('accepts complete synthetic control, not a browser result', () => assert.equal(check(control()).status, 'passed'))
for (const [name, mutate] of [
  ['empty freeze witness', e => e.episodes[0].samples.forEach(s => s.frozenState = {})],
  ['nonfinite timestamp', e => e.episodes[0].samples[0].at = -Infinity],
  ['fractional draw count', e => e.episodes[0].samples.forEach(s => s.observedDrawCount += .5)],
  ['nonfinite person witness', e => e.episodes[0].samples.forEach(s => s.frozenState.person = [NaN])],
  ['fake restore event', e => e.episodes[1].context.restoredEventTrusted = false],
  ['render not invalidated', e => e.episodes[0].samples.forEach(s => s.observedDrawCount = 20)],
  ['continuous redraw', e => e.episodes[1].samples[3].observedDrawCount++],
  ['advanced game state', e => e.episodes[0].samples[2].frozenState.turn++],
  ['too short hold', e => e.episodes[0].samples[1].at = 100],
  ['unused late texture', e => e.episodes[0].texture.usedByVisibleMaterial = false],
  ['missing cleanup', e => e.cleanupVerified = false],
  ['changed restored pixels', e => e.episodes[1].pixelReadback.changedFromBefore = true],
  ['empty restored pixels', e => e.episodes[1].pixelReadback.nonempty = false],
]) test(`rejects ${name}`, () => {const e = control(); mutate(e); assert.throws(() => check(e))})
