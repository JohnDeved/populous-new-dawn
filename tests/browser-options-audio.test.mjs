import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { openAudioOptions, closeAudioOptions, setSoundThroughOptions, observeOptionsAudio } from '../scripts/browser-options-audio.mjs'

function fixture({ paused = false, enabled = false } = {}) {
  const f = { clicks: [], disposals: 0, waits: [], panel: null, initialPause: paused, replacedWorld: false,
    world: { paused }, sound: enabled, busy: false, events: [], timeouts: [], evaluations: 0 }
  f.after = async (phase, result) => { f.events.push(phase); await f.afterAwait?.(phase); return result }
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
    await f.after(`click:${name}`)
  }
  f.page = {
    evaluate: async (fn, arg) => f.after(`evaluate:${++f.evaluations}`, evaluate(fn, arg)),
    evaluateHandle: async fn => f.after('owner', { value: evaluate(fn), dispose: async () => { f.disposals++; if (Object.hasOwn(f, 'disposeError')) throw f.disposeError; await f.after('owner-dispose') } }),
    locator: selector => ({
      count: async () => f.after('count', f.panel ? 1 : 0),
      getAttribute: async key => f.after(`attribute:${key}`, node.getAttribute(key)),
      click: async options => { assert.ok(options.timeout > 0 && Number.isFinite(options.timeout)); f.timeouts.push(options.timeout); await click('audio') },
      waitFor: async ({ state, timeout }) => { assert.ok(timeout > 0 && Number.isFinite(timeout)); assert.equal(state === 'hidden', !f.panel); await f.after(`wait:${state}`) },
    }),
    getByRole: (role, { name, exact }) => {
      assert.equal(role, 'button'); assert.equal(exact, true)
      return { click: async options => { assert.ok(options.timeout > 0 && Number.isFinite(options.timeout)); f.timeouts.push(options.timeout); await click(name) } }
    },
    waitForFunction: async (fn, arg, { timeout }) => {
      assert.ok(timeout > 0 && Number.isFinite(timeout)); f.waits.push(arg)
      assert.equal(evaluate(fn, arg), true, 'The shipped predicate must match actual fixture ownership/audio state')
      const index = f.waits.length
      return f.after(`poll:${index}`, { dispose: async () => f.after(`poll-dispose:${index}`) })
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

test('Options helper blocks every next input and success after late abort or deadline settlement', async () => {
  const baseline = fixture(); await setSoundThroughOptions(baseline.page, true)
  for (const boundary of baseline.events) for (const kind of ['abort', 'deadline']) {
    const f = fixture(), controller = new AbortController(), reason = new Error(`late ${kind}: ${boundary}`)
    let now = 1000, reached = false, beforeAbortClicks
    f.afterAwait = phase => {
      if (phase !== boundary || reached) return
      reached = true; beforeAbortClicks = [...f.clicks]
      if (kind === 'abort') controller.abort(reason)
      else now = 11000
    }
    await assert.rejects(setSoundThroughOptions(f.page, true, {
      signal: controller.signal, deadlineAt: 11000, now: () => now,
    }), error => kind === 'abort' ? error === reason : /deadline expired/.test(String(error)))
    assert.equal(reached, true, `${kind}: ${boundary} must be exercised`)
    assert.deepEqual(f.clicks, beforeAbortClicks, `${kind}: no later input after ${boundary}`)
    assert.equal(f.disposals, boundary === 'count' ? 0 : 1, `${kind}: independent owner cleanup after ${boundary}`)
  }
})
test('standalone Options navigation has one shrinking aggregate budget', async () => {
  const f = fixture(); let now = 1000
  f.afterAwait = () => { now += 10 }
  const entry = await openAudioOptions(f.page, { timeout: 2500, now: () => now })
  assert.ok(f.timeouts[0] < 2500)
  assert.ok(f.timeouts.every((value, i, values) => i === 0 || value < values[i - 1]))
  const clicks = [...f.clicks]; now = 3500
  await assert.rejects(closeAudioOptions(f.page, entry), /deadline expired/)
  assert.deepEqual(f.clicks, clicks); assert.equal(f.disposals, 1)
})
test('falsy primary and cleanup rejections are retained and never become a pass', async () => {
  for (const reason of [null, undefined, false, 0, '']) {
    for (const name of ['Menu', 'audio', 'Back']) {
      const f = fixture(), cleanupErrors = []
      f.failClick = name; f.primaryError = reason; f.disposeError = new Error('secondary cleanup')
      await assert.rejects(setSoundThroughOptions(f.page, true, { cleanupErrors }), error => error === reason)
      assert.equal(f.disposals, 1); assert.equal(cleanupErrors.length, 1)
      assert.equal(cleanupErrors[0].primaryFailure, true)
    }
    const f = fixture(), cleanupErrors = []; f.disposeError = reason
    await assert.rejects(setSoundThroughOptions(f.page, true, { cleanupErrors }), error => error === reason)
    assert.equal(f.disposals, 1); assert.deepEqual(cleanupErrors, [{ phase: 'audio-options-owner', error: String(reason), primaryFailure: false }])
    const g = fixture(), controller = new AbortController(), abortCleanup = []
    g.disposeError = new Error('abort cleanup')
    g.afterAwait = phase => { if (phase === 'click:Menu') controller.abort(reason) }
    await assert.rejects(setSoundThroughOptions(g.page, true, { signal: controller.signal, cleanupErrors: abortCleanup }),
      error => error === controller.signal.reason)
    assert.equal(g.disposals, 1); assert.equal(abortCleanup[0].primaryFailure, true)
  }
})
