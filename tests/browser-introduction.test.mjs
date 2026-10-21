import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { createFlyby, flybyCommand, interruptFlyby } from '../app/flyby.ts'
import {
  introductionInputState,
  pressIntroductionSpace,
  skipIntroductionWithSpace,
} from '../scripts/browser-introduction.mjs'
import { pageEffect } from './support/follower-nearby-page.mjs'

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

test('one public Space follows late native readiness, never an initial unlocked sample or another toggle', async () => {
  const f = stateFixture(), calls = []
  const result = await skipIntroductionWithSpace({
    waitForFunction: async (predicate, arg, options) => {
      assert.equal(predicate, introductionInputState)
      assert.equal(arg, undefined)
      assert.equal(options.timeout, 900)
      assert.equal(f.read(), false)
      flybyCommand(f.world.flyby, 1206, [])
      f.world.inputMask = 64
      assert.equal(f.read(), 'skip')
      return { jsonValue: async () => 'skip', dispose: async () => calls.push('dispose') }
    },
    keyboard: { press: async key => { assert.equal(key, 'Space'); calls.push('Space') } },
  }, { timeout: 900 })
  assert.equal(result, 'skip')
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
  let now = 0, budget
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
    keyboard: { press: async key => { assert.equal(key, 'Space'); presses++; now = 501 } },
  }, { timeout: 500 }), /Introduction readiness timed out/)
  assert.equal(presses, 1)
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

test('actual Home Space handler preserves pause across held intro key repeats and allows a fresh pause press', async () => {
  const world = { inputMask: 64, flyby: createFlyby(), paused: false, mode: null },
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
    SPELLS: [], rotateBuildingPlan: () => false, audio: { current: null }, update() {},
    store: { change(fn) { changes++; fn(world) } },
    window: {
      addEventListener(name, fn) { assert.equal(name, 'keydown'); handler = fn },
      removeEventListener(name, fn) { assert.equal(name, 'keydown'); assert.equal(fn, handler) },
    },
  })()
  const keydown = repeat => handler({ key: ' ', code: 'Space', repeat,
    ctrlKey: false, metaKey: false, altKey: false,
    target: { closest: () => null }, preventDefault() {} })
  try {
    await pressIntroductionSpace({ keyboard: { press: async key => {
      assert.equal(key, 'Space')
      keydown(false)
    } } })
    assert.equal(world.inputMask, 0)
    assert.equal(world.flyby.flags & 1, 0)
    assert.equal(world.paused, false)
    for (let count = 0; count < 4; count++) keydown(true)
    assert.equal(changes, 0, 'held repeats after flyby unlock must not become pause toggles')
    assert.equal(world.paused, false)
    keydown(false)
    assert.equal(world.paused, true, 'release followed by a fresh Space retains native pause')
    assert.equal(changes, 1)
  } finally { cleanup() }
})
