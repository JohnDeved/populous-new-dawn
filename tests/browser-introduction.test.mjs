import { withoutCampaignPopup } from './support/world-input-page.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { createFlyby, flybyCommand, interruptFlyby } from '../app/flyby.ts'
import {
  introductionInputState,
  pressIntroductionSpace,
  skipIntroductionWithSpace as skipIntroduction,
} from '../scripts/browser-introduction.mjs'
import { pageEffect } from './support/follower-nearby-page.mjs'

const skipIntroductionWithSpace = (page, options) => skipIntroduction(withoutCampaignPopup(page), options)

function stateFixture(overrides = {}) {
  const world = { paused: false, inputMask: 0, levelStart: [{ phase: 2 }],
    flyby: createFlyby(), ...overrides }
  let loading = false
  const context = {
    window: { testStore: { getWorld: () => world } },
    document: { querySelector(selector) {
      assert.equal(selector, '.loading-world', 'native input must not depend on a hidden Skip control')
      return loading ? {} : null
    } },
  }
  return { world, context, setLoading(value) { loading = value },
    read() {
      const before = structuredClone(world)
      const result = runInNewContext(`(${introductionInputState.toString()})()`, context)
      assert.deepEqual(world, before, 'readiness only observes the actual world')
      return result
    } }
}

test('shared introduction observer waits through late authored startup and fails closed on flyby flags', () => {
  const f = stateFixture()
  assert.equal(f.read(), false, 'inputMask zero before levelStart completion is not intro completion')
  f.world.levelStart.push({ phase: 4 })
  assert.equal(f.read(), false, 'one finished site cannot conceal another pending site')
  f.world.inputMask = 64
  for (const flags of [0, 1, 16, 64, 65, 80, 81, 85]) {
    f.world.flyby.flags = flags
    assert.equal(f.read(), false, `flags ${flags} must not dispatch Space`)
  }
  for (const flags of [17, 21]) {
    f.world.flyby.flags = flags
    assert.equal(f.read(), 'skip')
  }
  f.world.inputMask = 128
  assert.equal(f.read(), false, 'a different input owner cannot enable intro input')
  f.world.inputMask = 0
  f.world.levelStart.forEach(site => { site.phase = 4 })
  assert.equal(f.read(), 'ready')
  f.setLoading(true)
  assert.equal(f.read(), false, 'loading masks must finish before any input')
  f.setLoading(false)
  delete f.context.window.testStore
  assert.equal(f.read(), false, 'missing world cannot look ready')
  f.context.window.testSceneRef = { current: { world: f.world } }
  assert.equal(f.read(), 'ready', 'the existing bound-scene alias remains supported')
  delete f.context.window.testSceneRef
  f.context.window.testScene = { world: f.world }
  assert.equal(f.read(), 'ready', 'legacy scene alias remains read-only')
})

test('paused restored startup is returned unchanged for its caller to resume, never toggled by Space', async () => {
  const f = stateFixture({ paused: true }), calls = []
  const before = structuredClone(f.world)
  const result = await skipIntroductionWithSpace({
    waitForFunction: async predicate => {
      assert.equal(predicate, introductionInputState)
      const value = f.read()
      return { jsonValue: async () => value, dispose: async () => calls.push('dispose') }
    },
    keyboard: { press: () => assert.fail('paused restore is resumed by its caller, not the skip helper') },
  })
  assert.equal(result, 'ready')
  assert.deepEqual(f.world, before)
  assert.deepEqual(calls, ['dispose'])
})

test('one public Space follows late native readiness and rejects a swallowed skip without another toggle', async () => {
  const f = stateFixture(), calls = []
  await assert.rejects(skipIntroductionWithSpace({
    waitForFunction: async (predicate, arg, options) => {
      assert.equal(predicate, introductionInputState)
      assert.equal(arg, undefined)
      assert.ok(options.timeout > 0 && options.timeout <= 900)
      assert.equal(f.read(), false)
      flybyCommand(f.world.flyby, 1206, [])
      f.world.inputMask = 64
      assert.equal(f.read(), 'skip')
      return { jsonValue: async () => 'skip', dispose: async () => calls.push('dispose') }
    },
    evaluate: async () => ({ action: 'skip', paused: false }),
    keyboard: { press: async key => { assert.equal(key, 'Space'); calls.push('Space') } },
  }, { timeout: 900 }), /Introduction Space was not accepted/)
  assert.deepEqual(calls, ['dispose', 'Space'])
  assert.equal(f.world.paused, false)
  assert.equal(f.world.inputMask, 64, 'delivery alone cannot assert that the runtime accepted the key')
})

for (const phase of ['wait', 'read', 'dispose']) {
  test(`introduction ${phase} failure cannot dispatch keyboard input or hide its original error`, async () => {
    const failure = Error(`${phase} failed`), calls = []
    await assert.rejects(skipIntroductionWithSpace({
      waitForFunction: async () => {
        calls.push('wait')
        if (phase === 'wait') throw failure
        return {
          jsonValue: async () => { calls.push('read'); if (phase === 'read') throw failure; return 'skip' },
          dispose: async () => { calls.push('dispose'); if (phase === 'dispose') throw failure },
        }
      },
      keyboard: { press: () => assert.fail('readiness was not established') },
    }), error => error === failure)
    assert.deepEqual(calls, phase === 'wait' ? ['wait'] : ['wait', 'read', 'dispose'])
  })
}

test('failed handle extraction keeps its original error even when disposal also fails', async () => {
  const failure = Error('original handle read failure')
  let disposals = 0
  await assert.rejects(skipIntroductionWithSpace({
    waitForFunction: async () => ({
      jsonValue: async () => { throw failure },
      dispose: async () => { disposals++; throw Error('secondary cleanup failure') },
    }),
    keyboard: { press: () => assert.fail('failed observation cannot dispatch input') },
  }), error => error === failure)
  assert.equal(disposals, 1)
})

test('invalid introduction budgets fail before polling or native input', async () => {
  for (const timeout of [0, -1, NaN, Infinity, -Infinity])
    await assert.rejects(skipIntroductionWithSpace({
      waitForFunction: () => assert.fail('invalid budget must not start polling'),
      keyboard: { press: () => assert.fail('invalid budget must not dispatch input') },
    }, { timeout }), RangeError)
})

test('remaining deadline includes readiness, handle extraction and disposal before Space delivery', async t => {
  let now = 0, budget, reads = 0
  t.mock.method(performance, 'now', () => now)
  const setTimer = globalThis.setTimeout
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    budget = delay
    return setTimer(callback, delay)
  })
  await skipIntroductionWithSpace({
    waitForFunction: async () => {
      now = 200
      return { jsonValue: async () => { now = 350; return 'skip' },
        dispose: async () => { now = 450 } }
    },
    evaluate: async () => ({ action: ++reads === 1 ? 'skip' : 'ready', paused: false }),
    keyboard: { press: async key => assert.equal(key, 'Space') },
  }, { timeout: 500 })
  assert.equal(budget, 50, 'the keyboard does not start another full timeout')
})

for (const action of ['skip', 'ready']) {
  test(`late ${action} result cannot succeed after the original readiness deadline`, async t => {
    let now = 0, disposals = 0
    t.mock.method(performance, 'now', () => now)
    await assert.rejects(skipIntroductionWithSpace({
      waitForFunction: async () => ({
        jsonValue: async () => action,
        dispose: async () => { disposals++; now = 501 },
      }),
      keyboard: { press: () => assert.fail('no input after expiry') },
    }, { timeout: 500 }))
    assert.equal(disposals, 1)
  })
}

test('late keyboard resolution cannot turn an expired introduction deadline into success', async t => {
  let now = 0, presses = 0
  t.mock.method(performance, 'now', () => now)
  await assert.rejects(skipIntroductionWithSpace({
    waitForFunction: async () => ({ jsonValue: async () => 'skip', dispose: async () => {} }),
    evaluate: async () => ({ action: 'skip', paused: false }),
    keyboard: { press: async key => { assert.equal(key, 'Space'); presses++; now = 501 } },
  }, { timeout: 500 }), /Introduction readiness timed out/)
  assert.equal(presses, 1)
})

test('a changed uninterruptible gate repolls without a key or a fresh timeout budget', async t => {
  let now = 0, polls = 0, reads = 0
  t.mock.method(performance, 'now', () => now)
  const budgets = []
  const action = await skipIntroductionWithSpace({
    waitForFunction: async (_predicate, _arg, options) => {
      budgets.push(options.timeout)
      polls++
      now += 100
      return { jsonValue: async () => polls === 1 ? 'skip' : 'ready',
        dispose: async () => { now += 50 } }
    },
    evaluate: async () => { reads++; now += 100; return { action: false, paused: false } },
    keyboard: { press: () => assert.fail('a completing/uninterruptible gate cannot receive another Space') },
  }, { timeout: 500 })
  assert.equal(action, 'ready')
  assert.deepEqual(budgets, [500, 250])
  assert.equal(reads, 1)
})

for (const phase of ['before', 'after']) {
  test(`late ${phase}-input observation cannot outlive the original introduction deadline`, async t => {
    let now = 0, reads = 0, presses = 0
    t.mock.method(performance, 'now', () => now)
    await assert.rejects(skipIntroductionWithSpace({
      waitForFunction: async () => ({ jsonValue: async () => 'skip', dispose: async () => {} }),
      evaluate: async () => {
        reads++
        if (reads === (phase === 'before' ? 1 : 2)) now = 501
        return { action: 'skip', paused: false }
      },
      keyboard: { press: async () => { presses++ } },
    }, { timeout: 500 }), /Introduction readiness timed out/)
    assert.equal(presses, phase === 'before' ? 0 : 1)
  })
}

for (const phase of ['wait', 'read', 'dispose', 'before', 'after']) {
  test(`stalled ${phase} operation expires at the original deadline and consumes late cleanup`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    let release, reached, reads = 0, presses = 0, disposals = 0
    const blocked = new Promise(resolve => { release = resolve })
    const entered = new Promise(resolve => { reached = resolve })
    const stall = async value => { reached(); await blocked; return value }
    const handle = {
      jsonValue: async () => phase === 'read' ? stall('skip') : 'skip',
      dispose: async () => { disposals++; if (phase === 'dispose') await stall() },
    }
    const result = skipIntroductionWithSpace({
      waitForFunction: async () => phase === 'wait' ? stall(handle) : handle,
      evaluate: async () => {
        const value = { action: 'skip', paused: false }
        reads++
        return phase === (reads === 1 ? 'before' : 'after') ? stall(value) : value
      },
      keyboard: { press: async () => { presses++ } },
    }, { timeout: 500 })
    const rejected = assert.rejects(result, /Introduction readiness timed out/)
    await entered
    t.mock.timers.tick(500)
    await rejected
    release()
    for (let turn = 0; turn < 8; turn++) await Promise.resolve()
    assert.equal(disposals, 1, 'late handles are disposed once without extending the caller deadline')
    assert.equal(presses, phase === 'after' ? 1 : 0, 'expiry cannot dispatch or retry late keyboard input')
  })
}

test('deadline during stalled cleanup preserves an earlier handle-read failure', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const failure = Error('original read failure')
  let release, entered
  const blocked = new Promise(resolve => { release = resolve })
  const cleaning = new Promise(resolve => { entered = resolve })
  const run = skipIntroductionWithSpace({
    waitForFunction: async () => ({
      jsonValue: async () => { throw failure },
      dispose: async () => { entered(); await blocked },
    }),
    keyboard: { press: () => assert.fail('failed observation cannot dispatch input') },
  }, { timeout: 500 })
  const rejected = assert.rejects(run, error => error === failure)
  await cleaning
  t.mock.timers.tick(500)
  await rejected
  release()
})

test('Space delivery rejects invalid budgets without starting browser input', async () => {
  for (const timeout of [0, -1, NaN, Infinity, -Infinity])
    await assert.rejects(pressIntroductionSpace({ keyboard: {
      press: () => assert.fail('invalid input budget must fail before dispatch'),
    } }, { timeout }), RangeError)
})

test('Space delivery deadline consumes late rejection and never retries or toggles again', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let rejectDelivery, presses = 0
  const delivery = new Promise((_, reject) => { rejectDelivery = reject })
  const result = pressIntroductionSpace({ keyboard: {
    press: key => { assert.equal(key, 'Space'); presses++; return delivery },
  } }, { timeout: 500 })
  const rejected = assert.rejects(result, /Introduction Space input timed out/)
  t.mock.timers.tick(500)
  await rejected
  rejectDelivery(Error('late transport rejection'))
  await Promise.resolve()
  assert.equal(presses, 1)
})

test('a failed native Space delivery remains failed and a fresh caller can retry once', async () => {
  const failure = Error('keyboard transport failure')
  let presses = 0
  const page = { keyboard: { press: async key => {
    assert.equal(key, 'Space')
    if (++presses === 1) throw failure
  } } }
  await assert.rejects(pressIntroductionSpace(page), error => error === failure)
  assert.equal(presses, 1, 'the helper cannot silently retry player input')
  await pressIntroductionSpace(page)
  assert.equal(presses, 2)
})

function homeSpaceFixture() {
  const world = { inputMask: 64, flyby: createFlyby(), paused: false, mode: null, levelStart: [{ phase: 4 }] },
    camera = readFileSync(new URL('../app/scene-camera-runtime.ts', import.meta.url), 'utf8'),
    body = camera.slice(camera.indexOf('export function skipIntroduction('),
      camera.indexOf('export function updateCameraMotion('))
      .replace('export function skipIntroduction(scene: GameScene)', 'return function skipIntroduction(scene)'),
    skip = new Function('interruptFlyby', body)(interruptFlyby),
    scene = { world, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} }
  flybyCommand(world.flyby, 1206, [])
  let handler, changes = 0
  const cleanup = pageEffect('engine.current?.skipIntroduction()', {
    ready: true, menu: false, cheatsOpen: false, world, engine: { current: { skipIntroduction: () => skip(scene) } },
    messageDetails: { current: new Map() },
    SPELLS: [], rotateBuildingPlan: () => false, audio: { current: null }, update() {},
    store: { change(fn) { changes++; fn(world) } },
    globalThis: {
      addEventListener(name, fn) { assert.equal(name, 'keydown'); handler = fn },
      removeEventListener(name, fn) { assert.equal(name, 'keydown'); assert.equal(fn, handler) },
    },
  })()
  const keydown = repeat => handler({ key: ' ', code: 'Space', repeat,
    ctrlKey: false, metaKey: false, altKey: false,
    target: { closest: () => null }, preventDefault() {} })
  return { world, cleanup, keydown, get changes() { return changes } }
}

test('actual Home Space handler preserves pause across held intro key repeats and allows a fresh pause press', async () => {
  const f = homeSpaceFixture(), { world } = f
  try {
    await pressIntroductionSpace({ keyboard: { press: async key => {
      assert.equal(key, 'Space')
      f.keydown(false)
    } } })
    assert.equal(world.inputMask, 0)
    assert.equal(world.flyby.flags & 1, 0)
    assert.equal(world.paused, false)
    for (let count = 0; count < 4; count++) f.keydown(true)
    assert.equal(f.changes, 0, 'held repeats after flyby unlock must not become pause toggles')
    assert.equal(world.paused, false)
    f.keydown(false)
    assert.equal(world.paused, true, 'release followed by a fresh Space retains native pause')
    assert.equal(f.changes, 1)
  } finally { f.cleanup() }
})

for (const boundary of ['disposal', 'delivery']) {
  for (const paused of [false, true]) {
    test(`natural completion at ${boundary} cannot admit an extra pause toggle (paused=${paused})`, async () => {
      const f = homeSpaceFixture(), { world } = f
      world.paused = paused
      let presses = 0
      const finish = () => { world.inputMask = 0; world.flyby.flags &= ~1 }
      const context = { window: { testStore: { getWorld: () => world } }, document: { querySelector: () => null } }
      try {
        const run = skipIntroductionWithSpace({
          waitForFunction: async () => ({ jsonValue: async () => 'skip', dispose: async () => {
            if (boundary === 'disposal') finish()
          } }),
          evaluate: async (read, arg) => runInNewContext(`(${read.toString()})(${JSON.stringify(arg)})`, context),
          keyboard: { press: async key => {
            assert.equal(key, 'Space')
            if (boundary === 'delivery') finish()
            presses++
            f.keydown(false) // Actual Home input owner, through the keyboard unit boundary.
          } },
        })
        if (boundary === 'disposal') {
          assert.equal(await run, 'ready')
          assert.equal(world.paused, paused, 'fresh observation avoids touching a completed introduction')
          assert.equal(presses, 0)
          assert.equal(f.changes, 0)
        } else {
          await assert.rejects(run, /Introduction Space changed pause state/)
          assert.equal(presses, 1, 'the owner must close the failed episode; never compensate with another toggle')
          assert.equal(f.changes, 1)
          assert.equal(world.paused, !paused, 'the delivery TOCTOU cannot be atomically prevented by a prior read')
        }
      } finally { f.cleanup() }
    })
  }
}

for (const paused of [false, true]) {
  test(`non-racing native Space keeps existing pause ownership (paused=${paused})`, async () => {
    const f = homeSpaceFixture(), { world } = f
    world.paused = paused
    let presses = 0
    const context = { window: { testStore: { getWorld: () => world } }, document: { querySelector: () => null } }
    try {
      assert.equal(await skipIntroductionWithSpace({
        waitForFunction: async () => ({ jsonValue: async () => 'skip', dispose: async () => {} }),
        evaluate: async (read, arg) => runInNewContext(`(${read.toString()})(${JSON.stringify(arg)})`, context),
        keyboard: { press: async key => { assert.equal(key, 'Space'); presses++; f.keydown(false) } },
      }), 'skip')
      assert.equal(presses, 1)
      assert.equal(world.inputMask, 0)
      assert.equal(world.paused, paused)
      assert.equal(f.changes, 0)
    } finally { f.cleanup() }
  })
}
