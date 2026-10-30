import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Explicit exact-candidate source contract. cwd must be the reviewed candidate,
// not the default-branch infrastructure. The assertion block is preserved verbatim.
test('active audio probes use Options and retain their original pending, failure and transport scenarios', () => {
  const read = name => readFileSync(resolve(name), 'utf8')
  const scripts = readdirSync('scripts').filter(name => /^check-browser-.*\.mjs$/.test(name))
  for (const name of scripts) assert.doesNotMatch(read(`scripts/${name}`), /getByRole\('button', \{ name: '(Enable sound|Mute)'/)
  const helper = read('scripts/browser-options-audio.mjs')
  const forbiddenMutation = /\bsetWorld\s*\(|\bsetPaused\s*\(|\.paused\s*=(?!=)|\.focus\s*\(/
  for (const mutation of ['store.setWorld(next)', 'audio.setPaused(true)', 'world.paused = true', 'node.focus()']) assert.match(mutation, forbiddenMutation)
  assert.doesNotMatch('world.paused === wasPaused', forbiddenMutation)
  assert.doesNotMatch(helper, forbiddenMutation)
  const pause = read('scripts/check-browser-audio-pause.mjs')
  for (const marker of ['enabled-under-real-menu-pause', 'AbortError', 'audioPauseEvents', 'signalPeaks', 'musicVolume']) assert.ok(pause.includes(marker), marker)
  const observer = read('scripts/native-ui-evidence/options-audio-control-style.mjs')
  for (const marker of ['pending-pointer', 'pending-${key}', 'rejected-held-release', 'retry-keyboard-reachability',
    'real-playback-after-Continue', 'native-Space-mute', 'on-compact', 'pause-font.png']) assert.ok(observer.includes(marker), marker)
  const heldBoundary = observer.indexOf("await step(() => page.evaluate(holdAudioResume))")
  assert.ok(heldBoundary >= 0, 'The real held-resume boundary must remain present')
  assert.doesNotMatch(observer.slice(heldBoundary), /control\.focus\(/)
})
