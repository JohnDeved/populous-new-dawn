import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { openAudioOptions, closeAudioOptions, setSoundThroughOptions, observeOptionsAudio } from '../scripts/browser-options-audio.mjs'

function fixture({ paused = false, enabled = false } = {}) {
  const f = { clicks: [], disposals: 0, waits: [], panel: null, initialPause: paused, replacedWorld: false,
    world: { paused }, sound: enabled, busy: false }
  f.scene = { world: f.world }
  f.audio = { buffers: new Map(), setMusicVolume() {}, enabled, paused, context: { state: 'suspended' },
    music: { element: { paused: true } }, backgroundTimer: null }
  f.sync = () => {
    f.audio.enabled = f.sound; f.audio.paused = f.world.paused
    const running = f.sound && !f.world.paused
    f.audio.context.state = running ? 'running' : 'suspended'
    f.audio.music.element.paused = !running; f.audio.backgroundTimer = running ? 42 : null
  }
  f.sync()
  const label = () => f.sound ? '♪ Sound on' : '♫ Enable sound'
  const node = { get disabled() { return f.busy }, getAttribute: key => key === 'aria-label' ? label() : String(f.busy) }
  const modal = { matches: selector => selector === ':modal' && !!f.panel }
  const main = { __reactFiberFixture: { memoizedState: { memoizedState: { current: f.audio } } } }
  const document = { querySelector: selector => selector === 'main' ? main : selector.includes('[data-option-key=') ? (f.panel === 'browser' ? node : null) : (f.panel ? modal : null),
    querySelectorAll: () => f.panel ? [modal] : [] }
  const window = { testStore: { getWorld: () => f.world }, testSceneRef: { current: f.scene } }
  const evaluate = (fn, arg) => vm.runInNewContext(`(${fn.toString()})(arg)`, { arg: arg?.value ?? arg, document, window, Map })
  const settled = { dispose: async () => {} }
  const click = async name => {
    f.clicks.push(name)
    if (f.failClick === name) throw f.primaryError
    if (name === 'Menu') { assert.equal(f.panel, null); f.initialPause = f.world.paused; f.panel = 'root'; f.world.paused = true }
    else if (name === 'Options') { assert.equal(f.panel, 'root'); f.panel = 'options' }
    else if (name === 'Browser compatibility and help') { assert.equal(f.panel, 'options'); f.panel = 'browser' }
    else if (name === 'audio') { assert.equal(f.panel, 'browser'); f.sound = !f.sound }
    else if (name === 'Back to Options') { assert.equal(f.panel, 'browser'); f.panel = 'options' }
    else if (name === 'Back') { assert.equal(f.panel, 'options'); f.panel = 'root' }
    else if (name === 'Continue Game') {
      assert.equal(f.panel, 'root'); f.panel = null; f.world.paused = f.initialPause
      if (f.replacedWorld) { f.world = { ...f.world }; f.scene.world = f.world }
    } else throw new Error(`Unexpected input ${name}`)
    f.sync()
  }
  f.page = {
    evaluate: async (fn, arg) => evaluate(fn, arg),
    evaluateHandle: async fn => ({ value: evaluate(fn), dispose: async () => { f.disposals++; if (f.disposeError) throw f.disposeError } }),
    locator: selector => ({
      count: async () => f.panel ? 1 : 0,
      getAttribute: async key => node.getAttribute(key),
      click: async options => { assert.ok(options.timeout > 0 && Number.isFinite(options.timeout)); await click('audio') },
      waitFor: async ({ state, timeout }) => { assert.ok(timeout > 0 && Number.isFinite(timeout)); assert.equal(state === 'hidden', !f.panel) },
    }),
    getByRole: (role, { name, exact }) => {
      assert.equal(role, 'button'); assert.equal(exact, true)
      return { click: async options => { assert.ok(options.timeout > 0 && Number.isFinite(options.timeout)); await click(name) } }
    },
    waitForFunction: async (fn, arg, { timeout }) => {
      assert.ok(timeout > 0 && Number.isFinite(timeout)); f.waits.push(arg)
      assert.equal(evaluate(fn, arg), true, 'The shipped predicate must match actual fixture ownership/audio state')
      return settled
    },
  }
  return f
}
const path = ['Menu', 'Options', 'Browser compatibility and help', 'audio', 'Back to Options', 'Back', 'Continue Game']
test('real Options path enables and mutes while restoring both original pause states', async () => {
  for (const paused of [false, true]) for (const enabled of [false, true]) {
    const f = fixture({ paused, enabled: !enabled }), world = f.world, scene = f.scene
    assert.deepEqual(await setSoundThroughOptions(f.page, enabled, { timeout: 2500 }), { wasPaused: paused, enabled })
    assert.deepEqual(f.clicks, path); assert.equal(f.disposals, 1)
    assert.equal(f.world, world); assert.equal(f.scene, scene); assert.equal(f.world.paused, paused)
    assert.deepEqual(f.waits.at(-1), { enabled, paused, context: enabled && !paused ? 'running' : 'suspended',
      mediaPaused: !(enabled && !paused), backgroundScheduled: enabled && !paused })
    assert.ok(f.waits.some(wait => wait?.enabled === enabled && wait.paused === true && wait.context === 'suspended'))
  }
})
test('Options helper never silently skips an enable/mute scenario or enters over another modal', async () => {
  const f = fixture({ enabled: true })
  await assert.rejects(setSoundThroughOptions(f.page, true), /opposite state/)
  assert.deepEqual(f.clicks, path.slice(0, 3)); assert.equal(f.disposals, 1)
  const g = fixture(); g.panel = 'unrelated'
  await assert.rejects(openAudioOptions(g.page), /not another modal/)
  assert.deepEqual(g.clicks, []); assert.equal(g.disposals, 0)
})
test('Options helper preserves primary failures, rejects cleanup-only failures and detects replaced owners', async () => {
  for (const name of ['Menu', 'audio', 'Back', 'Continue Game']) {
    const f = fixture(); f.failClick = name; f.primaryError = new Error(`failed ${name}`); f.disposeError = new Error('dispose failed')
    await assert.rejects(setSoundThroughOptions(f.page, true), error => error === f.primaryError)
    assert.equal(f.disposals, 1); assert.equal(f.primaryError.audioOptionsOwnerDisposeError, String(f.disposeError))
  }
  const g = fixture(), entry = await openAudioOptions(g.page)
  g.disposeError = new Error('cleanup alone failed')
  await assert.rejects(closeAudioOptions(g.page, entry), error => error === g.disposeError)
  const h = fixture(); h.replacedWorld = true
  await assert.rejects(setSoundThroughOptions(h.page, true), /actual scene and World/)
  assert.equal(h.disposals, 1)
})
test('Options helper rejects unbounded timeouts and observes the real React-owned audio instance', async () => {
  for (const timeout of [0, -1, NaN, Infinity]) {
    const f = fixture(); await assert.rejects(openAudioOptions(f.page, { timeout }), /bounded timeout/)
    assert.deepEqual(f.clicks, []); assert.equal(f.disposals, 0)
  }
  const f = fixture({ paused: true, enabled: true })
  assert.deepEqual(JSON.parse(JSON.stringify(await f.page.evaluate(observeOptionsAudio))), {
    enabled: true, paused: true, context: 'suspended', mediaPaused: true, backgroundScheduled: false,
  })
  f.audio.buffers = null
  await assert.rejects(f.page.evaluate(observeOptionsAudio), /React-owned Soundscape/)
})
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
  assert.doesNotMatch(observer.slice(observer.indexOf("await page.evaluate(holdAudioResume)")), /control\.focus\(/)
})
