import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { createFlyby, interruptFlyby, stepFlyby } from '../app/flyby.ts'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createOptionsStartupBudget, enterOptionsMission, observeOptionsMission, optionsStartupReady, skipOptionsIntroduction, waitOptionsMissionReady } from '../scripts/options-controls-evidence/mission-entry.mjs'

function fixture({ ready = false, deadlineAt = 10000 } = {}) {
  let time = 0, timer, clockCap, disposed = 0, clicks = 0, closed = 0
  const world = { inputMask: ready ? 0 : 64, paused: false, outcome: { level: 1 }, flyby: Object.assign(createFlyby(), { flags: ready ? 16 : 0x11, frameRate: 24 }) }
  const canvas = { isConnected: true, matches: selector => selector === '.world-viewport canvas' }
  const scene = { world, renderer: { domElement: canvas } }, expected = { world, scene, canvas }
  const button = { disabled: false, getClientRects: () => [{}] }
  const window = { testStore: { getWorld: () => world }, testSceneRef: { current: scene } }
  const document = { querySelector: selector => selector === 'button.skip-introduction' ? button : null }
  const evaluate = (fn, argument) => vm.runInNewContext(`(${fn.toString()})(argument)`, {
    argument, window, document, getComputedStyle: () => ({ visibility: 'visible' }),
  })
  const handle = () => ({ dispose: async () => { disposed++ } })
  const page = {
    evaluate: async (fn, arg) => evaluate(fn, arg),
    getByRole: (role, options) => {
      assert.equal(role, 'button'); assert.equal(String(options.name), '/^Skip introduction/')
      return { click: async options => { clicks++; page.lastClick = options; world.inputMask = 0 } }
    },
    waitForFunction: async (fn, arg, options) => {
      page.lastWait = options
      assert.equal(evaluate(fn, arg), true)
      return handle()
    },
    close: async () => { closed++ },
  }
  const controller = new AbortController(), trace = {}
  const options = { signal: controller.signal, deadlineAt, trace, now: () => time, wallNow: () => 1000 + time,
    setTimer: (fn, ms) => { timer = fn; clockCap = ms; return 1 }, clearTimer: () => { timer = null } }
  return { world, scene, canvas, expected, button, window, document, evaluate, page, trace, controller, options,
    advance: ms => { time += ms }, fire: () => timer(),
    get clicks() { return clicks }, get closed() { return closed }, get disposed() { return disposed },
    get timer() { return timer }, get clockCap() { return clockCap } }
}

test('natural Mission 1 readiness sends no click and retains a distinct contract', async () => {
  const f = fixture({ ready: true })
  await skipOptionsIntroduction(f.page, f.expected, f.options)
  assert.equal(f.clicks, 0); assert.equal(f.closed, 0); assert.equal(f.timer, null)
  assert.equal(f.trace.status, 'passed'); assert.equal(f.trace.outcome, 'natural-completion')
  assert.equal(f.trace.contract, 'options-public-skip-response-v2')
})
test('one public Skip click and observed response use a single decreasing budget', async () => {
  const f = fixture(), original = f.page.evaluate
  f.page.evaluate = async (...args) => { const result = await original(...args); f.advance(100); return result }
  await skipOptionsIntroduction(f.page, f.expected, f.options)
  assert.equal(f.clicks, 1); assert.equal(f.disposed, 0); assert.equal(f.closed, 0)
  assert.equal(f.clockCap, 2500); assert.equal(f.page.lastClick.timeout, 2400)
  assert.equal(f.page.lastClick.noWaitAfter, true)
  assert.equal(f.trace.outcome, 'public-click-settled-with-valid-response'); assert.equal(f.trace.elapsedMs, 200)
})
test('outer episode deadline clips the action and never grants a fresh 2500ms', async () => {
  const f = fixture({ deadlineAt: 1300 }), original = f.page.evaluate
  f.page.evaluate = async (...args) => { const result = await original(...args); f.advance(100); return result }
  await skipOptionsIntroduction(f.page, f.expected, f.options)
  assert.equal(f.clockCap, 300); assert.equal(f.page.lastClick.timeout, 200)
  assert.equal(f.trace.after.action, 'ready')
})
test('missing or disabled public Skip fails without a click', async () => {
  for (const missing of [false, true]) {
    const f = fixture()
    if (missing) f.document.querySelector = () => null
    else f.button.disabled = true
    await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), /visible enabled public Skip/)
    assert.equal(f.clicks, 0); assert.equal(f.closed, 1); assert.equal(f.trace.status, 'failed')
  }
})
test('an obstructed click is fatal even when natural completion follows, with no retry', async () => {
  const f = fixture(), error = new Error('intercepted public click')
  f.page.getByRole = () => ({ click: async () => { f.world.inputMask = 0; throw error } })
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), e => e === error)
  assert.equal(f.trace.clickAttempts, 1); assert.equal(f.trace.status, 'failed'); assert.equal(f.closed, 1)
  assert.equal(f.trace.outcome, undefined)
})
test('actual observer rejects each identity, canvas, level and typed-state drift', () => {
  for (const mutate of [f => { f.window.testStore.getWorld = () => ({ ...f.world }) },
    f => { f.window.testSceneRef.current = { ...f.scene } },
    f => { f.scene.world = { ...f.world } }, f => { f.scene.renderer.domElement = { ...f.canvas } },
    f => { f.canvas.isConnected = false }, f => { f.canvas.matches = () => false },
    f => { f.world.outcome.level = 2 }, f => { f.world.inputMask = NaN }, f => { f.world.paused = 0 }]) {
    const f = fixture(); mutate(f)
    assert.throws(() => f.evaluate(observeOptionsMission, f.expected))
  }
})
test('post-click identity and pause drift cannot pass', async () => {
  for (const mutate of [f => { f.window.testSceneRef.current = { ...f.scene } }, f => { f.world.paused = true }]) {
    const f = fixture(), getByRole = f.page.getByRole
    f.page.getByRole = (...args) => {
      const control = getByRole(...args)
      return { click: async options => { await control.click(options); mutate(f) } }
    }
    await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options))
    assert.equal(f.trace.status, 'failed'); assert.equal(f.trace.clickAttempts, 1)
  }
})
test('pre-abort performs no browser read or input', async () => {
  const f = fixture(), reason = new Error('cancelled')
  f.controller.abort(reason)
  f.page.evaluate = async () => { throw new Error('unexpected browser read') }
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), e => e === reason)
  assert.equal(f.clicks, 0); assert.equal(f.trace.status, 'failed'); assert.equal(f.timer, null)
})
test('late before-read settlement cannot dispatch input or reset the budget', async () => {
  const f = fixture(), original = f.page.evaluate
  f.page.evaluate = async (...args) => { const result = await original(...args); f.advance(2501); return result }
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), /deadline expired/)
  assert.equal(f.clicks, 0); assert.equal(f.trace.status, 'failed')
})
test('abort after a settled click stops later response reads', async () => {
  const f = fixture(), getByRole = f.page.getByRole, reason = new Error('abort after click')
  f.page.getByRole = (...args) => {
    const control = getByRole(...args)
    return { click: async options => { await control.click(options); f.controller.abort(reason) } }
  }
  const evaluate = f.page.evaluate; let reads = 0
  f.page.evaluate = (...args) => { reads++; return evaluate(...args) }
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), e => e === reason)
  assert.equal(f.trace.clickAttempts, 1); assert.equal(f.trace.status, 'failed')
  assert.equal(reads, 1)
})
test('expiry closes the owned page and settles pending input before returning failure', async () => {
  const f = fixture(); let rejectClick, closed = false
  f.page.getByRole = () => ({ click: () => new Promise((_, reject) => { rejectClick = reject; f.fire() }) })
  f.page.close = async () => { closed = true; rejectClick(new Error('page closed')) }
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), /deadline expired/)
  assert.equal(closed, true); assert.equal(f.trace.status, 'failed'); assert.equal(f.trace.clickAttempts, 1)
})
test('late input-ready handle is disposed and cannot be accepted', async () => {
  const f = fixture({ ready: true }), original = f.page.waitForFunction
  f.page.waitForFunction = async (...args) => { const handle = await original(...args); f.advance(2501); return handle }
  await assert.rejects(waitOptionsMissionReady(f.page, f.expected, false, { ...f.options, deadlineAt: 3500 }), /deadline expired/)
  assert.equal(f.disposed, 1); assert.equal(f.trace.status, 'failed')
})
test('cleanup failure preserves the original action rejection including falsey values', async () => {
  const f = fixture()
  f.page.getByRole = () => ({ click: async () => { throw false } })
  f.page.close = async () => { throw new Error('cleanup failed') }
  let observed = 'not thrown'
  try { await skipOptionsIntroduction(f.page, f.expected, f.options) } catch (error) { observed = error }
  assert.equal(observed, false); assert.equal(f.trace.pageCloseError, 'Error: cleanup failed')
})
test('startup readiness follows only actual unlocked input or visible enabled Skip', () => {
  const f = fixture()
  assert.equal(f.evaluate(optionsStartupReady), 'skip')
  f.button.disabled = true; assert.equal(f.evaluate(optionsStartupReady), false)
  f.world.inputMask = 0; assert.equal(f.evaluate(optionsStartupReady), 'ready')
})
test('real entry sequence imports candidate public menu/binding helpers and disposes identities', async () => {
  const root = mkdtempSync(join(tmpdir(), 'options-entry-'))
  mkdirSync(join(root, 'scripts'))
  writeFileSync(join(root, 'scripts/browser-new-game.mjs'), 'export const openCampaignFromMainMenu = page => page.openCampaign()\n')
  writeFileSync(join(root, 'scripts/browser-game.mjs'), 'export const bindGame = page => page.bindGame()\n')
  const f = fixture({ ready: true }), steps = []; let identityDisposed = false, startupDisposed = false
  f.page.openCampaign = async () => { steps.push('campaign') }
  f.page.bindGame = async () => { steps.push('bind') }
  f.page.getByRole = (_, { name }) => ({ click: async () => { steps.push(name) }, isVisible: async () => false })
  f.page.evaluateHandle = async () => ({ ...f.expected, dispose: async () => { identityDisposed = true } })
  f.page.waitForFunction = async () => ({ jsonValue: async () => 'ready', dispose: async () => { startupDisposed = true } })
  const trace = {}
  await enterOptionsMission(f.page, root, { signal: f.controller.signal, deadlineAt: Date.now() + 2000, trace })
  assert.deepEqual(steps, ['campaign', 'Start Mission 1', 'bind'])
  assert.equal(identityDisposed && startupDisposed, true); assert.equal(trace.status, 'passed')
  assert.equal(trace.skip.outcome, 'natural-completion')
})
test('only the Options adapter uses the compatibility entry; shared native guards remain strict', () => {
  const adapter = readFileSync(new URL('../scripts/options-controls-evidence/adapter.mjs', import.meta.url), 'utf8')
  const native = readFileSync(new URL('../scripts/native-ui-evidence/ordinary-mission.mjs', import.meta.url), 'utf8')
  assert.match(adapter, /import \{ enterOptionsMission \} from '\.\/mission-entry\.mjs'/)
  assert.match(adapter, /await enterOptionsMission\(page, candidateRoot, \{ signal: episodeSignal, deadlineAt, trace: report.setup \}\)/)
  assert.doesNotMatch(adapter, /ordinaryMission|recoveryRetryInputContract/)
  assert.match(native, /assert.equal\(recoveryRetryInputContract, 'public-setup-cumulative-response-v2'/)
})

test('actual native interruption keeps its 49-tick tail outside the input-response allowance', async () => {
  const f = fixture({ deadlineAt: 26000 }), camera = { x: 1000, y: 1000, angle: 0, zoom: 0 }
  f.world.flyby.end = { x: 10, y: 20, angle: 0, zoom: 0 }
  f.page.getByRole = () => ({ click: async () => {
    f.advance(800)
    interruptFlyby(f.world.flyby, camera)
    // Supplied Scene host boundary; actual flyby functions own the blend.
    if (!(f.world.flyby.flags & 1)) f.world.inputMask &= ~64
  } })
  await skipOptionsIntroduction(f.page, f.expected, f.options)
  assert.equal(f.trace.capMs, 2500); assert.equal(f.trace.elapsedMs, 800)
  assert.equal(f.trace.clickAttempts, 1); assert.equal(f.trace.after.action, 'tail')
  assert.equal(f.trace.after.inputMask, 64)
  assert.deepEqual(f.world.flyby.tracks.filter(t => t.active).map(t => t.duration), [48, 48, 48])
  let ticks = 0
  const original = f.page.waitForFunction
  f.page.waitForFunction = async (...args) => {
    while (f.world.flyby.flags & 1) {
      assert.ok(++ticks < 60)
      stepFlyby(f.world.flyby, camera, 24); f.advance(1000 / 24)
      if (!(f.world.flyby.flags & 1)) f.world.inputMask &= ~64
    }
    return original(...args)
  }
  const completion = {}
  await waitOptionsMissionReady(f.page, f.expected, false, { ...f.options, trace: completion })
  assert.equal(ticks, 49); assert.equal(completion.capMs, 24200)
  assert.ok(completion.elapsedMs > 2000 && completion.elapsedMs < 2100)
  assert.ok(f.trace.elapsedMs + completion.elapsedMs > 2500)
  assert.equal(completion.after.action, 'ready'); assert.equal(f.disposed, 1)
})
test('an already-finalizing native tail sends no redundant public click', async () => {
  const f = fixture(), camera = { x: 0, y: 0, angle: 0, zoom: 0 }
  interruptFlyby(f.world.flyby, camera)
  assert.equal(f.evaluate(optionsStartupReady), 'tail')
  await skipOptionsIntroduction(f.page, f.expected, f.options)
  assert.equal(f.trace.outcome, 'existing-native-tail'); assert.equal(f.clicks, 0)
})
test('actual warmup interruption legitimately reaches ready immediately', async () => {
  const f = fixture(), camera = { x: 0, y: 0, angle: 0, zoom: 0 }
  f.world.flyby.warmup = 6
  f.page.getByRole = () => ({ click: async () => {
    interruptFlyby(f.world.flyby, camera)
    if (!(f.world.flyby.flags & 1)) f.world.inputMask &= ~64
  } })
  await skipOptionsIntroduction(f.page, f.expected, f.options)
  assert.equal(f.trace.after.action, 'ready'); assert.equal(f.trace.clickAttempts, 1)
})
test('both native finalization bits, active ownership and only mask 64 are required', async () => {
  for (const [flags, mask] of [[0x41, 64], [0x09, 64], [0x48, 64], [0x51, 64], [0x59, 65], [1, 64]]) {
    const f = fixture(); f.world.flyby.flags = flags; f.world.inputMask = mask
    assert.equal(f.evaluate(optionsStartupReady), false)
    assert.equal(f.evaluate(observeOptionsMission, f.expected).action, false)
    await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options))
    assert.equal(f.trace.clickAttempts, 0)
  }
})
test('a settled click without an observed ready/tail response is still fatal', async () => {
  const f = fixture()
  f.page.getByRole = () => ({ click: async () => {} })
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), /Skip response must be/)
  assert.equal(f.trace.clickAttempts, 1); assert.equal(f.trace.after.action, 'skip')
  assert.equal(f.trace.status, 'failed')
})
test('a late post-click response is retained as evidence but never accepted', async () => {
  const f = fixture(), original = f.page.evaluate; let reads = 0
  f.page.evaluate = async (...args) => {
    const value = await original(...args)
    if (++reads === 2) f.advance(2501)
    return value
  }
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), /deadline expired/)
  assert.equal(f.trace.after.action, 'ready'); assert.equal(f.trace.status, 'failed')
})
test('native phase diagnostics stay finite and bounded to seven known track summaries', () => {
  const f = fixture()
  f.world.flyby.tracks = Array.from({ length: 100 }, () => ({ frame: 2, duration: Infinity, active: true, unrelated: 'omit' }))
  f.world.flyby.warmup = NaN
  const value = f.evaluate(observeOptionsMission, f.expected)
  assert.equal(value.flyby.warmup, null); assert.equal(value.flyby.frameRate, 24)
  assert.equal(value.flyby.tracks.length, 7)
  assert.equal(JSON.stringify(value.flyby.tracks[0]), JSON.stringify({ frame: 2, duration: null, active: true }))
  assert.ok(JSON.stringify(value).length < 1024)
})
test('completion rejects identity/pause drift and still-masked state even after a fulfilled waiter', async () => {
  for (const mutate of [f => { f.window.testSceneRef.current = { ...f.scene } },
    f => { f.world.paused = true }, f => { f.world.inputMask = 64; f.world.flyby.flags = 0x59 }]) {
    const f = fixture({ ready: true }), original = f.page.waitForFunction
    f.page.waitForFunction = async (...args) => { const h = await original(...args); mutate(f); return h }
    await assert.rejects(waitOptionsMissionReady(f.page, f.expected, false, f.options))
    assert.equal(f.disposed, 1); assert.equal(f.trace.status, 'failed')
  }
})
test('completion cannot reset the shared startup deadline or exceed the existing 25s cap', async () => {
  const f = fixture({ ready: true, deadlineAt: 26000 }); f.advance(24000)
  await waitOptionsMissionReady(f.page, f.expected, false, f.options)
  assert.equal(f.trace.capMs, 1000); assert.equal(f.page.lastWait.timeout, 1000)
  const capped = fixture({ ready: true, deadlineAt: 100000 })
  await waitOptionsMissionReady(capped.page, capped.expected, false, capped.options)
  assert.equal(capped.trace.capMs, 25000)
})
test('completion abort and late handle-disposal failure preserve the failed result', async () => {
  const f = fixture({ ready: true }), reason = new Error('abort during completion')
  f.page.waitForFunction = async () => {
    f.controller.abort(reason)
    return { dispose: async () => { throw new Error('dispose failed') } }
  }
  await assert.rejects(waitOptionsMissionReady(f.page, f.expected, false, f.options), e => e === reason)
  assert.equal(f.trace.status, 'failed'); assert.equal(f.trace.observationDisposeError, 'Error: dispose failed')
})
test('actual entry shares one 25s startup deadline through response, completion and final cleanup', async () => {
  const realNow = Date.now
  try {
    for (const lateCleanup of [false, true]) {
      let wall = 1000000, waits = 0
      Date.now = () => wall
      const root = mkdtempSync(join(tmpdir(), 'options-entry-shared-'))
      mkdirSync(join(root, 'scripts'))
      writeFileSync(join(root, 'scripts/browser-new-game.mjs'), 'export const openCampaignFromMainMenu = async () => {}\n')
      writeFileSync(join(root, 'scripts/browser-game.mjs'), 'export const bindGame = async () => {}\n')
      const f = fixture({ ready: true }), timeouts = [], original = f.page.evaluate
      f.page.getByRole = () => ({ click: async () => {}, isVisible: async () => false })
      f.page.evaluateHandle = async () => {
        wall += 1000
        return { ...f.expected, dispose: async () => { if (lateCleanup) wall += 2000 } }
      }
      f.page.waitForFunction = async (_, argument, options) => {
        assert.equal(argument, null); timeouts.push(options.timeout); wall += 9000
        return { jsonValue: async () => { wall += 1000; return 'ready' }, dispose: async () => {}, ordinal: ++waits }
      }
      f.page.evaluate = async (...args) => { const value = await original(...args); wall += 2000; return value }
      const trace = {}, run = () => enterOptionsMission(f.page, root,
        { signal: f.controller.signal, deadlineAt: 1180000, trace })
      if (lateCleanup) await assert.rejects(run(), /startup action deadline expired/)
      else await run()
      assert.equal(trace.startupDeadlineAt, 1025000)
      assert.equal(timeouts.length, 2); assert.equal(timeouts[0], 24000)
      assert.ok(timeouts[1] > 0 && timeouts[1] <= 12000, 'Monotonic work can only reduce the remaining allowance')
      assert.equal(trace.skip.capMs, 2500); assert.equal(trace.completion.capMs, 12000)
      assert.equal(trace.status, lateCleanup ? 'failed' : 'passed')
    }
  } finally { Date.now = realNow }
})
test('shared startup budget cannot regain time after wall-clock reversal', () => {
  let mono = 0, wall = 1000
  const options = { deadlineAt: 181000, now: () => mono, wallNow: () => wall }
  const budget = createOptionsStartupBudget(options)
  assert.equal(budget.capMs, 25000); assert.equal(budget.deadlineAt, 26000)
  mono = 24000; wall = -23000
  assert.equal(budget.remaining(), 1000)
  mono = 25000
  assert.throws(() => budget.remaining(), /deadline expired/)
  mono = 0; wall = 1000
  const forward = createOptionsStartupBudget(options); wall = 26000
  assert.throws(() => forward.remaining(), /deadline expired/)
  assert.throws(() => createOptionsStartupBudget({ ...options, deadlineAt: Infinity }), /finite clocks/)
})
test('actual entry rejects 48s monotonic work despite a backward 24s wall adjustment', async () => {
  const realNow = Date.now, descriptor = Object.getOwnPropertyDescriptor(performance, 'now')
  let mono = 0, wall = 1000000, waits = 0, disposals = 0
  try {
    Date.now = () => wall
    Object.defineProperty(performance, 'now', { configurable: true, value: () => mono })
    const root = mkdtempSync(join(tmpdir(), 'options-entry-clock-'))
    mkdirSync(join(root, 'scripts'))
    writeFileSync(join(root, 'scripts/browser-new-game.mjs'), 'export const openCampaignFromMainMenu = async () => {}\n')
    writeFileSync(join(root, 'scripts/browser-game.mjs'), 'export const bindGame = async () => {}\n')
    const f = fixture({ ready: true }), trace = {}
    f.page.getByRole = () => ({ click: async () => {}, isVisible: async () => false })
    f.page.evaluateHandle = async () => ({ ...f.expected, dispose: async () => { disposals++ } })
    f.page.waitForFunction = async () => {
      mono += 24000; wall += 24000; waits++
      return { jsonValue: async () => { wall -= 24000; return 'ready' }, dispose: async () => { disposals++ } }
    }
    await assert.rejects(enterOptionsMission(f.page, root,
      { signal: f.controller.signal, deadlineAt: 1180000, trace }), /deadline expired/)
    assert.equal(waits, 2); assert.equal(mono, 48000); assert.equal(wall - 1000000, 24000)
    assert.equal(trace.status, 'failed'); assert.equal(trace.startupCapMs, 25000)
    assert.equal(trace.skip.capMs, 1000); assert.equal(trace.completion.capMs, 1000)
    assert.equal(disposals, 3)
  } finally {
    Date.now = realNow
    if (descriptor) Object.defineProperty(performance, 'now', descriptor)
    else delete performance.now
  }
})
