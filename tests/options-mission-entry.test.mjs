import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { enterOptionsMission, observeOptionsMission, optionsStartupReady, skipOptionsIntroduction } from '../scripts/options-controls-evidence/mission-entry.mjs'

function fixture({ ready = false, deadlineAt = 10000 } = {}) {
  let time = 0, timer, clockCap, disposed = 0, clicks = 0, closed = 0
  const world = { inputMask: ready ? 0 : 64, paused: false, outcome: { level: 1 } }
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
  assert.equal(f.trace.contract, 'options-public-skip-v1')
})
test('one public Skip click and input-ready observation use a single decreasing budget', async () => {
  const f = fixture(), original = f.page.evaluate
  f.page.evaluate = async (...args) => { const result = await original(...args); f.advance(100); return result }
  await skipOptionsIntroduction(f.page, f.expected, f.options)
  assert.equal(f.clicks, 1); assert.equal(f.disposed, 1); assert.equal(f.closed, 0)
  assert.equal(f.clockCap, 2500); assert.equal(f.page.lastClick.timeout, 2400)
  assert.equal(f.page.lastWait.timeout, 2400); assert.equal(f.page.lastClick.noWaitAfter, true)
  assert.equal(f.trace.outcome, 'public-click-completed'); assert.equal(f.trace.elapsedMs, 200)
})
test('outer episode deadline clips the action and never grants a fresh 2500ms', async () => {
  const f = fixture({ deadlineAt: 1300 }), original = f.page.evaluate
  f.page.evaluate = async (...args) => { const result = await original(...args); f.advance(100); return result }
  await skipOptionsIntroduction(f.page, f.expected, f.options)
  assert.equal(f.clockCap, 300); assert.equal(f.page.lastClick.timeout, 200)
  assert.equal(f.page.lastWait.timeout, 200)
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
test('abort after a settled click stops later input-ready reads', async () => {
  const f = fixture(), getByRole = f.page.getByRole, reason = new Error('abort after click')
  f.page.getByRole = (...args) => {
    const control = getByRole(...args)
    return { click: async options => { await control.click(options); f.controller.abort(reason) } }
  }
  f.page.waitForFunction = async () => { throw new Error('unexpected later read') }
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), e => e === reason)
  assert.equal(f.trace.clickAttempts, 1); assert.equal(f.trace.status, 'failed')
})
test('expiry closes the owned page and settles pending input before returning failure', async () => {
  const f = fixture(); let rejectClick, closed = false
  f.page.getByRole = () => ({ click: () => new Promise((_, reject) => { rejectClick = reject; f.fire() }) })
  f.page.close = async () => { closed = true; rejectClick(new Error('page closed')) }
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), /deadline expired/)
  assert.equal(closed, true); assert.equal(f.trace.status, 'failed'); assert.equal(f.trace.clickAttempts, 1)
})
test('late input-ready handle is disposed and cannot be accepted', async () => {
  const f = fixture(), original = f.page.waitForFunction
  f.page.waitForFunction = async (...args) => { const handle = await original(...args); f.advance(2501); return handle }
  await assert.rejects(skipOptionsIntroduction(f.page, f.expected, f.options), /deadline expired/)
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
