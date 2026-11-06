import test from 'node:test'
import assert from 'node:assert/strict'
import {
  nativeEscapeContract, nativeEscapeCapMs, escapeKey,
  assertEscapeRuntime, observeNativeEscape, assertEscapeObservation, browserNativeEscape,
} from '../scripts/local-render/options-native-escape.mjs'

// These fixtures do not emulate Chrome. They exercise the real read-only
// observer and orchestration only; browser-native Escape remains unproved.
const URL = 'http://127.0.0.1:5198/'
const VERSION = '156.0.8078.79'
const KEY = Object.freeze({ key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  nativeVirtualKeyCode: 9, modifiers: 0, autoRepeat: false, isKeypad: false,
  isSystemKey: false, location: 0 })

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function fixture({ dialogs = 1, hosts = 1 } = {}) {
  const element = (tagName, isConnected = true, control = false) => Object.freeze({ tagName,
    isConnected, closest(selector) {
      assert.equal(selector, '[data-fullscreen-control]')
      return control ? state.control : null
    } })
  const state = { paused: true, inputMask: 0, level: 1, hasFocus: true, dialogs, hosts }
  state.html = element('HTML')
  state.canvas = element('CANVAS')
  state.menu = element('BUTTON')
  state.control = element('BUTTON', true, true)
  state.other = element('INPUT')
  state.disconnected = element('BUTTON', false)
  state.fullscreen = state.html
  state.focused = hosts ? state.control : state.canvas
  const world = Object.freeze({ get paused() { return state.paused },
    get inputMask() { return state.inputMask },
    outcome: Object.freeze({ get level() { return state.level } }) })
  state.sceneWorld = world
  state.rendererCanvas = state.canvas
  const scene = Object.freeze({ get world() { return state.sceneWorld },
    renderer: Object.freeze({ get domElement() { return state.rendererCanvas } }) })
  state.currentWorld = world
  state.currentScene = scene
  state.currentCanvas = state.canvas
  const owner = Object.freeze({ world, scene, menu: state.menu })
  const document = Object.freeze({ documentElement: state.html,
    get fullscreenElement() { return state.fullscreen },
    get activeElement() { return state.focused },
    hasFocus() { return state.hasFocus },
    querySelector(selector) {
      assert.equal(selector, '.world-viewport canvas.battlefield')
      return state.currentCanvas
    },
    querySelectorAll(selector) {
      assert.ok(['dialog[open]', '[data-fullscreen-control]'].includes(selector))
      return Object.freeze(Array.from({ length: selector === 'dialog[open]' ? state.dialogs : state.hosts }, () => Object.freeze({})))
    },
  })
  const window = Object.freeze({ testStore: Object.freeze({ getWorld: () => state.currentWorld }),
    testSceneRef: Object.freeze({ get current() { return state.currentScene } }) })
  const inDOM = callback => {
    const previous = ['document', 'window'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
    try {
      for (const [name, value] of Object.entries({ document, window }))
        Object.defineProperty(globalThis, name, { configurable: true, value })
      return callback()
    } finally {
      for (const [name, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor)
        else delete globalThis[name]
      }
    }
  }
  return { state, owner, document, window, inDOM, observe: () => inDOM(() => observeNativeEscape(owner)) }
}

function harness(options = {}) {
  const dom = fixture(options), events = [], controller = new AbortController()
  const h = { dom, events, controller, trace: {}, platform: 'linux', version: VERSION,
    url: URL, owned: true, target: { type: 'page', url: URL, targetId: 'owned-page-1' },
    clock: { mono: 100, wall: 1000000, budget: 5000 }, evaluateCount: 0, timers: [], cleared: [],
    inputs: [], waitTimeouts: [], predicateResults: [], deadlineAt: 1020000 }
  const event = (name, data) => { events.push({ name, ...data }); h.onAction?.(name) }
  h.advance = ms => { h.clock.mono += ms; h.clock.wall += ms }
  h.ready = Object.freeze({ async dispose() { event('dispose'); return h.onDispose?.() } })
  h.session = Object.freeze({ async send(method, params) {
    event(method === 'Target.getTargetInfo' ? 'target' : params.type, { method, params })
    if (method === 'Target.getTargetInfo') return h.onTarget ? h.onTarget() : { targetInfo: h.target }
    assert.equal(method, 'Input.dispatchKeyEvent')
    h.inputs.push({ method, params })
    if (h.onInput) return h.onInput(params)
    if (params.type === 'keyUp') dom.state.fullscreen = null
  }, async detach() { event('detach'); return h.onDetach?.() } })
  h.context = Object.freeze({ browser: () => ({ version: () => h.version }),
    pages: () => h.owned ? [h.page] : [], async newCDPSession(page) {
      assert.equal(page, h.page); event('attach')
      return h.onAttach ? h.onAttach() : h.session
    } })
  h.page = Object.freeze({ context: () => h.context, url: () => h.url,
    async evaluate(fn, owner) {
      assert.equal(fn, observeNativeEscape, 'Only the real read-only observer is admitted')
      assert.equal(owner, dom.owner)
      event('evaluate', { ordinal: ++h.evaluateCount })
      await h.onEvaluate?.(h.evaluateCount)
      return dom.inDOM(() => fn(owner))
    }, async waitForFunction(predicate, argument, settings) {
      event('wait'); assert.equal(argument, null)
      assert.deepEqual(Object.keys(settings), ['timeout'])
      h.waitTimeouts.push(settings.timeout)
      // Check actual predicate semantics. A fulfilled wait is not our oracle.
      const saved = dom.state.fullscreen
      for (const value of [null, undefined, dom.state.html, dom.state.other]) {
        dom.state.fullscreen = value
        const actual = dom.inDOM(predicate)
        assert.equal(actual, value === null)
        h.predicateResults.push(actual)
      }
      dom.state.fullscreen = saved
      if (h.onWait) return h.onWait(predicate)
      assert.equal(dom.inDOM(predicate), true, 'The actual fullscreen element must be null')
      return h.ready
    }, async close() { event('close'); return h.onClose?.() } })
  h.run = overrides => browserNativeEscape({ page: h.page, owner: dom.owner,
    budget: { check: () => h.clock.budget }, signal: controller.signal,
    deadlineAt: h.deadlineAt, trace: h.trace, dialogs: options.dialogs ?? 1, hosts: options.hosts ?? 1,
    platform: h.platform, now: () => h.clock.mono, wallNow: () => h.clock.wall,
    setTimer(callback, ms) { const timer = { callback, ms }; h.timers.push(timer); return timer },
    clearTimer(timer) { h.cleared.push(timer) }, ...overrides })
  h.expire = () => {
    assert.equal(h.timers.length, 1)
    h.advance(h.timers[0].ms)
    h.timers[0].callback()
  }
  h.names = () => events.map(({ name }) => name)
  return h
}

async function failure(h, expected) {
  let rejected = false, reason
  try { await h.run() } catch (error) { rejected = true; reason = error }
  assert.equal(rejected, true, 'The boundary must reject rather than pass')
  if (arguments.length > 1) assert.equal(reason, expected)
  assert.equal(h.trace.status, 'failed')
  assert.equal(h.trace.pageClosed, true)
  assert.equal(h.names().filter(name => name === 'close').length, 1)
  assert.equal(h.cleared.length, 1)
  return reason
}

test('contract pins the exact reviewed native key fields and runtime', () => {
  assert.equal(nativeEscapeContract, 'chrome-156-linux-browser-escape-v1')
  assert.equal(nativeEscapeCapMs, 30000)
  assert.deepEqual(escapeKey, KEY)
  assert.equal(Object.isFrozen(escapeKey), true)
  assertEscapeRuntime('linux', VERSION, URL)
  for (const args of [['darwin', VERSION, URL], ['win32', VERSION, URL], ['linux', '156.0.8078.80', URL],
    ['linux', VERSION, 'http://localhost:5198/'], ['linux', VERSION, `${URL}other`]])
    assert.throws(() => assertEscapeRuntime(...args))
})

test('real observer reads frozen document/window/owner identities and classifies focus', () => {
  const f = fixture(), s = f.state
  for (const value of [f.document, f.window, f.owner, f.owner.world, f.owner.scene,
    f.owner.scene.renderer, s.canvas, s.menu]) assert.equal(Object.isFrozen(value), true)
  assert.deepEqual(f.observe(), { fullscreen: 'document', fullscreenTag: 'HTML', documentHasFocus: true,
    connectedFocus: true, focusedTag: 'BUTTON', focusOwner: 'fullscreen-control', openDialogs: 1,
    visibleHosts: 1, sameWorldScene: true, ownedCanvas: true, paused: true, inputMask: 0, level: 1 })
  for (const [focused, expected] of [[s.canvas, 'canvas'], [s.menu, 'menu'], [s.other, 'other'], [null, 'other']]) {
    s.focused = focused; assert.equal(f.observe().focusOwner, expected)
  }
  s.focused = s.disconnected; assert.equal(f.observe().connectedFocus, false)
  s.fullscreen = null; assert.equal(f.observe().fullscreen, 'none')
  s.fullscreen = s.canvas; assert.equal(f.observe().fullscreen, 'other')
  s.currentWorld = Object.freeze({ paused: true, inputMask: 0, outcome: Object.freeze({ level: 1 }) })
  assert.equal(f.observe().sameWorldScene, false)
  s.currentWorld = f.owner.world; s.currentScene = Object.freeze({ world: f.owner.world, renderer: Object.freeze({ domElement: s.canvas }) })
  assert.equal(f.observe().sameWorldScene, false)
  s.currentScene = f.owner.scene; s.sceneWorld = Object.freeze({})
  assert.equal(f.observe().sameWorldScene, false)
  s.sceneWorld = f.owner.world; s.rendererCanvas = s.other
  assert.equal(f.observe().ownedCanvas, false)
  s.rendererCanvas = s.canvas; s.currentCanvas = null
  assert.equal(f.observe().ownedCanvas, false)
})

for (const [label, dialogs, hosts, focus] of [['menu', 1, 1, 'control'], ['detached canvas', 0, 0, 'canvas'], ['detached menu', 0, 0, 'menu']]) {
  test(`${label}: one exact ordered pair, actual null exit and complete cleanup`, async () => {
    const h = harness({ dialogs, hosts }); h.dom.state.focused = h.dom.state[focus]
    await h.run()
    assert.equal(h.trace.status, 'passed')
    assert.deepEqual(h.inputs, ['rawKeyDown', 'keyUp'].map(type => ({ method: 'Input.dispatchKeyEvent', params: { type, ...KEY } })))
    assert.deepEqual(h.names(), ['attach', 'target', 'evaluate', 'rawKeyDown', 'keyUp', 'evaluate', 'wait', 'evaluate', 'dispose', 'detach'])
    assert.deepEqual(h.predicateResults, [true, false, false, false])
    assert.deepEqual(h.trace.phases.map(p => [p.name, p.status]), ['attach-page-session', 'read-page-target', 'read-before', 'rawKeyDown',
      'keyUp', 'read-after-input', 'wait-fullscreen-exit', 'read-exit'].map(name => [name, 'settled']))
    assert.deepEqual(h.trace.commands.map(c => c.status), ['settled', 'settled'])
    assert.deepEqual(h.trace.cleanup.map(c => [c.name, c.status]), [['ready-handle', 'settled'], ['page-session', 'settled']])
    assert.equal(h.trace.afterExit.fullscreen, 'none')
    assert.equal(h.timers.length, 1); assert.deepEqual(h.cleared, h.timers)
  })
}

for (const [label, change] of [
  ['platform', h => { h.platform = 'darwin' }], ['version', h => { h.version = '156.0.8078.80' }],
  ['URL', h => { h.url = 'http://localhost:5198/' }], ['context owner', h => { h.owned = false }],
  ['target type', h => { h.target.type = 'browser' }], ['target URL', h => { h.target.url = `${URL}other` }],
  ['missing target ID', h => { delete h.target.targetId }], ['empty target ID', h => { h.target.targetId = '' }],
  ['overlong target ID', h => { h.target.targetId = 'x'.repeat(129) }], ['non-string target ID', h => { h.target.targetId = 1 }],
]) test(`rejects wrong ${label} before input`, async () => {
  const h = harness(); change(h); await failure(h); assert.equal(h.inputs.length, 0)
})

const invalidState = [
  ['world owner', s => { s.currentWorld = Object.freeze({ paused: true, inputMask: 0, outcome: Object.freeze({ level: 1 }) }) }],
  ['scene owner', (s, h) => { s.currentScene = Object.freeze({ world: h.dom.owner.world, renderer: Object.freeze({ domElement: s.canvas }) }) }],
  ['scene/world identity', s => { s.sceneWorld = Object.freeze({}) }],
  ['renderer canvas', s => { s.rendererCanvas = s.other }], ['missing canvas', s => { s.currentCanvas = null }],
  ['disconnected canvas', s => { s.currentCanvas = s.disconnected; s.rendererCanvas = s.disconnected }],
  ['pause state', s => { s.paused = false }], ['input mask', s => { s.inputMask = 1 }],
  ['level', s => { s.level = 2 }], ['fullscreen-other', s => { s.fullscreen = s.other }],
  ['dialog count', s => { s.dialogs++ }], ['host count', s => { s.hosts++ }],
]
for (const [label, mutate] of invalidState) {
  test(`rejects stale ${label} before input`, async () => {
    const h = harness(); mutate(h.dom.state, h); await failure(h); assert.equal(h.inputs.length, 0)
  })
  test(`rejects ${label} drift after input`, async () => {
    const h = harness(); h.onEvaluate = ordinal => { if (ordinal === 2) mutate(h.dom.state, h) }
    await failure(h); assert.equal(h.inputs.length, 2)
    assert.equal(h.waitTimeouts.length, 0)
  })
}

for (const [label, mutate] of [
  ['document focus', s => { s.hasFocus = false }],
  ['connected focus', s => { s.focused = s.disconnected }],
  ['missing focus', s => { s.focused = null }],
]) test(`rejects lost ${label} before input`, async () => {
  const h = harness(); mutate(h.dom.state); await failure(h); assert.equal(h.inputs.length, 0)
})

for (const [label, options] of [['menu', { dialogs: 1, hosts: 1 }], ['detached', { dialogs: 0, hosts: 0 }]]) {
  test(`${label}: connected other focus is diagnostic, not an extra owner restriction`, async () => {
    const h = harness(options); h.dom.state.focused = h.dom.state.other
    await h.run()
    assert.equal(h.trace.before.focusOwner, 'other'); assert.equal(h.trace.status, 'passed')
    assert.equal(h.inputs.length, 2)
  })
}

test('rejects a preexisting null fullscreen state without sending Escape', async () => {
  const h = harness(); h.dom.state.fullscreen = null
  await failure(h); assert.equal(h.inputs.length, 0)
})

test('a successful supplied wait cannot replace actual null exit observation', async () => {
  const h = harness(); h.onInput = () => {}; h.onWait = () => h.ready
  await failure(h)
  assert.equal(h.trace.afterExit.fullscreen, 'document')
  assert.equal(h.inputs.length, 2)
  assert.ok(h.names().includes('dispose'))
})

test('after-input document fullscreen is allowed only if actual null arrives during wait', async () => {
  const h = harness(); h.onInput = () => {}
  h.onWait = predicate => { h.dom.state.fullscreen = null; assert.equal(h.dom.inDOM(predicate), true); return h.ready }
  await h.run(); assert.equal(h.trace.afterInput.fullscreen, 'document'); assert.equal(h.trace.afterExit.fullscreen, 'none')
})

for (const [label, thrown] of [['Error', new Error('send rejected')], ['null', null], ['undefined', undefined], ['false', false], ['zero', 0], ['empty string', '']]) {
  test(`keydown rejection preserves ${label}, emits no keyup or retry, and closes`, async () => {
    const h = harness(); h.onInput = () => { throw thrown }
    await failure(h, thrown)
    assert.equal(h.inputs.length, 1); assert.equal(h.trace.commands[0].status, 'uncertain')
    assert.ok(h.trace.terminalObservation)
    assert.equal(h.names().filter(name => name === 'detach').length, 1)
  })
}

test('keyup rejection stops after the sole pair without a retry', async () => {
  const h = harness(), thrown = new Error('keyup rejected')
  h.onInput = params => { if (params.type === 'keyUp') throw thrown }
  await failure(h, thrown)
  assert.deepEqual(h.trace.commands.map(c => c.status), ['settled', 'uncertain'])
  assert.equal(h.inputs.length, 2); assert.equal(h.evaluateCount, 1)
})

test('abort before setup sends nothing and retains the exact reason', async () => {
  const h = harness(), reason = new Error('already aborted'); h.controller.abort(reason)
  await failure(h, reason); assert.equal(h.inputs.length, 0); assert.equal(h.names().includes('attach'), false)
})

test('abort after keydown settles prevents keyup and retries', async () => {
  const h = harness(), reason = new Error('abort between pair')
  h.onInput = params => { assert.equal(params.type, 'rawKeyDown'); h.controller.abort(reason) }
  await failure(h, reason)
  assert.equal(h.inputs.length, 1); assert.equal(h.trace.status, 'failed')
})

for (const outcome of ['resolve', 'reject']) test(`timeout closes owned page before late keydown ${outcome}, with no keyup`, async () => {
  const h = harness(), input = deferred(), entered = deferred(), closed = deferred()
  h.onInput = () => { entered.resolve(); return input.promise }
  h.onClose = () => { closed.resolve() }
  let completed = false
  const running = h.run().then(() => { completed = true; return { passed: true } }, error => { completed = true; return { error } })
  await entered.promise; h.expire(); await closed.promise
  assert.equal(completed, false)
  assert.equal(h.trace.status, 'failed')
  assert.equal(h.trace.commands[0].status, 'issued')
  h.events.push({ name: 'settle-late-keydown' })
  if (outcome === 'resolve') input.resolve(); else input.reject(new Error('late rejection'))
  const result = await running
  assert.match(String(result.error), /boundary expired/)
  assert.equal(h.inputs.length, 1)
  assert.ok(h.names().indexOf('close') < h.names().indexOf('settle-late-keydown'))
  assert.equal(h.trace.commands[0].status, outcome === 'resolve' ? 'settled' : 'uncertain')
  assert.equal(h.names().filter(name => name === 'detach').length, 1)
  assert.equal(h.trace.pageClosed, true)
})

test('late ready handle is disposed after timeout and cannot turn failure into success', async () => {
  const h = harness(), wait = deferred(), entered = deferred(), closed = deferred()
  h.onWait = () => { entered.resolve(); return wait.promise }
  h.onClose = () => { closed.resolve() }
  const running = h.run().then(() => ({ passed: true }), error => ({ error }))
  await entered.promise; h.expire(); await closed.promise
  assert.equal(h.names().includes('dispose'), false)
  h.events.push({ name: 'settle-late-ready' }); wait.resolve(h.ready)
  const result = await running
  assert.match(String(result.error), /boundary expired/)
  assert.equal(h.trace.status, 'failed'); assert.equal(h.trace.afterExit, undefined)
  assert.equal(h.names().filter(name => name === 'dispose').length, 1)
  assert.ok(h.names().indexOf('close') < h.names().indexOf('settle-late-ready'))
  assert.ok(h.names().indexOf('settle-late-ready') < h.names().indexOf('dispose'))
  assert.ok(h.names().indexOf('dispose') < h.names().indexOf('detach'))
})

test('timeout during session attachment closes before disposing the late session', async () => {
  const h = harness(), attachment = deferred(), entered = deferred(), closed = deferred()
  h.onAttach = () => { entered.resolve(); return attachment.promise }
  h.onClose = () => { closed.resolve() }
  const running = h.run().then(() => ({ passed: true }), error => ({ error }))
  await entered.promise; h.expire(); await closed.promise
  attachment.resolve(h.session)
  const result = await running
  assert.match(String(result.error), /boundary expired/)
  assert.equal(h.inputs.length, 0)
  assert.ok(h.names().indexOf('close') < h.names().indexOf('detach'))
})

for (const thrown of [new Error('detach rejected'), null, false, undefined]) test(`detach cleanup failure (${String(thrown)}) is never success`, async () => {
  const h = harness(); h.onDetach = () => { throw thrown }
  await failure(h, thrown)
  assert.equal(h.trace.cleanup.find(c => c.name === 'page-session').status, 'failed')
  assert.equal(h.inputs.length, 2)
})

test('ready cleanup failure still detaches and preserves primary failure', async () => {
  const h = harness(), primary = new Error('ready dispose rejected'), secondary = new Error('detach rejected')
  h.onDispose = () => { throw primary }; h.onDetach = () => { throw secondary }
  await failure(h, primary)
  assert.deepEqual(h.trace.cleanup.map(c => c.status), ['failed', 'failed'])
})

test('input failure is preserved despite detach and page-close failures', async () => {
  const h = harness(), primary = new Error('input failure')
  h.onInput = () => { throw primary }; h.onDetach = () => { throw new Error('detach failure') }
  h.onClose = () => { throw new Error('close failure') }
  let caught; try { await h.run() } catch (error) { caught = error }
  assert.equal(caught, primary); assert.equal(h.trace.status, 'failed')
  assert.match(h.trace.pageCloseError, /close failure/)
  assert.equal(h.trace.pageClosed, undefined); assert.equal(h.inputs.length, 1)
})

for (const [label, budget, delta, expected] of [['native cap', 40000, 60000, 30000], ['shared budget', 1200, 60000, 1200],
  ['absolute wall deadline', 40000, 750, 750]]) test(`${label} clips a single nonresetting timer and wait`, async () => {
  const h = harness(); h.clock.budget = budget; h.deadlineAt = h.clock.wall + delta
  h.onAction = name => { if (!['close'].includes(name)) h.advance(10) }
  await h.run()
  assert.equal(h.trace.capMs, expected)
  assert.equal(h.timers.length, 1); assert.equal(h.timers[0].ms, expected)
  assert.deepEqual(h.waitTimeouts, [expected - 60])
  assert.equal(h.trace.elapsedMs, 100)
})

test('backward wall clock does not extend monotonic allowance', async () => {
  const h = harness(); h.clock.budget = 1000
  h.onAction = () => { h.clock.mono += 10; h.clock.wall -= 10000 }
  await h.run()
  assert.deepEqual(h.waitTimeouts, [940]); assert.equal(h.timers.length, 1)
  assert.equal(h.trace.capMs, 1000); assert.equal(h.trace.elapsedMs, 100)
})

test('monotonic cap expiry blocks keyup even if wall time moves backward and budget stays high', async () => {
  const h = harness(); h.clock.budget = 1000
  h.onInput = () => { h.clock.mono += 1001; h.clock.wall -= 100000 }
  await failure(h); assert.equal(h.inputs.length, 1)
})

test('forward wall deadline expiry blocks keyup despite unused monotonic allowance', async () => {
  const h = harness(); h.deadlineAt = h.clock.wall + 1000
  h.onInput = () => { h.clock.wall += 1001 }
  await failure(h); assert.equal(h.inputs.length, 1)
})

test('remaining shared budget is checked again before keyup', async () => {
  const h = harness(); h.onInput = () => { h.clock.budget = 0 }
  await failure(h); assert.equal(h.inputs.length, 1)
})

test('regressing monotonic clock is invalid rather than extra allowance', async () => {
  const h = harness(); h.onInput = () => { h.clock.mono = 99 }
  const reason = await failure(h)
  assert.match(String(reason), /monotonic clock is invalid/); assert.equal(h.inputs.length, 1)
})

test('cleanup remains in the original allowance and late detach cannot pass', async () => {
  const h = harness(); h.clock.budget = 1000
  h.onDetach = () => { h.advance(1001) }
  await failure(h)
  assert.equal(h.trace.afterExit.fullscreen, 'none')
  assert.equal(h.inputs.length, 2); assert.equal(h.timers.length, 1)
})

test('timer remains live while detach is pending and closes the page before settlement', async () => {
  const h = harness(), detach = deferred(), entered = deferred(), closed = deferred()
  h.onDetach = () => { entered.resolve(); return detach.promise }
  h.onClose = () => { closed.resolve() }
  const running = h.run().then(() => ({ passed: true }), error => ({ error }))
  await entered.promise
  assert.equal(h.cleared.length, 0); h.expire(); await closed.promise
  detach.resolve()
  const result = await running
  assert.match(String(result.error), /boundary expired/)
  assert.equal(h.trace.status, 'failed'); assert.equal(h.inputs.length, 2)
})

test('invalid initial boundaries fail before setup or input', async () => {
  for (const options of [{ deadlineAt: NaN }, { deadlineAt: 1000000 }, { deadlineAt: Infinity },
    { now: () => NaN }, { wallNow: () => Infinity }, { budget: { check: () => 0 } }, { budget: { check: () => NaN } }]) {
    const h = harness(); await assert.rejects(h.run(options)); assert.equal(h.events.length, 0)
  }
})

test('observation assertion cannot accept undefined or other fullscreen as null', () => {
  const f = fixture(); f.state.fullscreen = null
  assertEscapeObservation(f.observe(), 'none', 1, 1)
  for (const value of [undefined, f.state.html, f.state.other]) {
    f.state.fullscreen = value
    assert.throws(() => assertEscapeObservation(f.observe(), 'none', 1, 1))
  }
})
