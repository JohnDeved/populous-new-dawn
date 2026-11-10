import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const names = ['audio-pause', 'background-audio', 'building-clearing', 'building-fire',
  'hut-birth', 'hut-upgrade', 'person-panic', 'route-recovery', 'scenery-fire', 'selection-audio']
for (const name of names) test(`${name} uses the real Options audio owner rather than a removed footer button`, () => {
  const source = read(`scripts/check-browser-${name}.mjs`)
  assert.match(source, /from '\.\/browser-options-audio\.mjs'/)
  assert.doesNotMatch(source, /getByRole\('button', \{ name: '(?:Enable sound|Mute sound)'/)
  assert.match(source, /setSoundThroughOptions\(page, true\)/)
})
test('in-game Options episode keeps its existing entry, keyboard, HUD and pause assertions', () => {
  const source = read('scripts/local-render/original-options-ingame.mjs')
  assert.match(source, /from '\.\.\/browser-options-audio\.mjs'/)
  assert.match(source, /await setSoundThroughOptions\(page, true\)/)
  assert.doesNotMatch(source, /button\('(?:Enable sound|Mute sound)'\)/)
  assert.match(source, /button\('Pause game'\)\.click\(\);await button\('Game settings'\)\.click\(\)/)
  assert.match(source, /getByRole\('combobox',\{name:'HUD size'\}\)/)
  assert.match(source, /button\('Zoom in'\)\.click\(\);assert\.deepEqual\(await frozen\(\),before\)/)
})
test('pending-play probe retains genuine menu pause, held request, cancellation and output checks', () => {
  const source = read('scripts/check-browser-audio-pause.mjs')
  assert.ok(source.indexOf("state('enabled-under-real-menu-pause')") < source.indexOf('await closeAudioOptions(page, audioOptions)'))
  for (const marker of ['menuEnabled.events.length, 0', 'AbortError', 'signalPeaks', 'musicVolume',
    'pending.mediaReadyState, 0', 'still.mediaTime, stopped.mediaTime', 'still.contextTime, stopped.contextTime',
    'audioOptionsFailed = true', 'if (!audioOptionsFailed) throw error', 'audioOptionsCleanupErrors']) assert.ok(source.includes(marker), marker)
  assert.equal((source.match(/name: 'Pause game'/g) ?? []).length, 3)
  assert.equal((source.match(/name: 'Resume game'/g) ?? []).length, 3)
})
test('background probe retains Pause/Resume while volume checks use the actual Options sound page', () => {
  const source = read('scripts/check-browser-background-audio.mjs')
  for (const name of ['Pause game', 'Resume game', 'Game settings', 'Options', 'Sound', 'Back', 'Continue Game'])
    assert.ok(source.includes(`name: '${name}'`), name)
  assert.match(source, /dialog\[data-original-pause-menu\]\[open\]/)
  assert.match(source, /\[data-original-options\] input\[type=range\]/)
  assert.match(source, /assert\.deepEqual\(controls, \{ music: 0\.5, fits: true, overflow: false \}\)/)
})
