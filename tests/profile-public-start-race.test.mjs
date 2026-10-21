import { withoutCampaignPopup } from './support/world-input-page.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { readFileSync } from 'node:fs'
import { createFlyby, flybyCommand, interruptFlyby } from '../app/flyby.ts'
import {
  pauseStartupReady,
  recoverVisibleIntroduction as recoverIntroduction,
} from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'
import { waitRecoveryReadiness } from '../scripts/tutorial-browser/profile-readiness.mjs'

const recoverVisibleIntroduction = page => recoverIntroduction(withoutCampaignPopup(page))

function fixture() {
  const world = {
    status: 'playing',
    paused: false,
    inputMask: 0,
    turn: 0,
    selected: [30],
    outcome: { level: 1 },
    levelStart: [{ shaman: 30, phase: 2 }],
    flyby: createFlyby(),
    units: [
      {
        id: 30,
        kind: 'shaman',
        team: 'blue',
        hp: 100,
        native: { state: 19, flags2: 131072, flags4: 536871296 },
      },
    ],
  }
  const scene = {
    world,
    renderer: { domElement: { isConnected: true } },
    flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    onChange() {},
  }
  let presses = 0,
    waits = 0
  const context = {
    window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
    document: {
      querySelector: () => null,
    },
  }
  const camera = readFileSync(new URL('../app/scene-camera-runtime.ts', import.meta.url), 'utf8'),
    body = camera
      .slice(
        camera.indexOf('export function skipIntroduction('),
        camera.indexOf('export function updateCameraMotion(')
      )
      .replace(
        'export function skipIntroduction(scene: GameScene)',
        'return function skipIntroduction(scene)'
      )
  const publicSkip = new Function('interruptFlyby', body)(interruptFlyby)
  const page = {
    async evaluate(fn, arg) {
      const before = structuredClone(world),
        value = runInNewContext(`(${fn.toString()})(arg)`, { ...context, arg })
      assert.deepEqual(world, before, 'readiness observations cannot modify runtime state')
      return value
    },
    keyboard: {
      async press(key) {
        assert.equal(key, 'Space')
        assert.equal(world.inputMask & 64, 64)
        assert.equal(world.flyby.flags & 0x51, 0x11)
        presses++
        // Unit keyboard boundary; rendered scenarios dispatch the actual key.
        publicSkip(scene)
      },
    },
    async waitForTimeout() {
      waits++
      if (waits === 1) {
        flybyCommand(world.flyby, 1206, [])
        world.inputMask |= 64
        world.turn = 1
      }
      if (waits === 2) {
        world.levelStart[0].phase = 4
        world.units[0].native.flags4 &= ~128
        world.turn = 166
      }
    },
  }
  return {
    page,
    world,
    context,
    get presses() {
      return presses
    },
  }
}

test('initial public ready can precede authored flyby; late native Space resolves real eligibility', async () => {
  const f = fixture()
  assert.equal(runInNewContext(`(${pauseStartupReady.toString()})()`, f.context), 'ready')
  const result = await waitRecoveryReadiness(f.page, {
    onBlocked: recoverVisibleIntroduction(f.page),
  })
  assert.equal(result.before.inputMask, 0)
  assert.equal(result.before.shaman.selectable, false)
  assert.equal(result.after.ready, true)
  assert.equal(result.after.levelStartPhase, 4)
  assert.equal(result.after.inputMask, 0)
  assert.equal(f.presses, 1)
  assert.deepEqual(result.publicActions, [{ sample: 2, action: 'public-skip-introduction' }])
  assert.equal(
    result.samples,
    3,
    'early Space cannot pause the unlocked world; readiness is re-observed after native input'
  )
})

test('introduction callback never bypasses unrelated or uninterruptible blockers and presses once', async t => {
  let presses = 0, now = 0
  const timeouts = []
  t.mock.method(performance, 'now', () => now)
  const setTimer = globalThis.setTimeout
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    timeouts.push(delay)
    return setTimer(callback, delay)
  })
  const action = recoverVisibleIntroduction({
    evaluate: async () => { now += 10; return { action: presses ? 'ready' : 'skip', paused: false } },
    keyboard: { press: async key => { assert.equal(key, 'Space'); presses++ } },
  })
  for (const after of [
    { inputMask: 0, introductionSkipAvailable: true },
    { inputMask: 128, introductionSkipAvailable: true },
    { inputMask: 64, introductionSkipAvailable: false },
    { inputMask: 64 },
  ]) assert.equal(await action({ after, remainingMs: 500 }), null)
  const blocked = { after: { inputMask: 64, introductionSkipAvailable: true }, remainingMs: 500 }
  assert.equal(await action({ ...blocked, remainingMs: 0 }), null)
  assert.equal(presses, 0)
  assert.deepEqual(await action(blocked), { action: 'public-skip-introduction' })
  assert.ok(timeouts.length >= 2)
  assert.ok(timeouts.every(timeout => timeout > 0 && timeout <= 500),
    'Preparation, native pre-read, delivery and outer expiry share the original 500ms budget')
  assert.ok(timeouts.at(-1) <= 490, 'Space delivery still consumes the native pre-read budget')
  assert.equal(await action(blocked), null)
  assert.equal(presses, 1)
})

test('blocked callback cannot turn an expired original 30-second deadline into success', async t => {
  let now = 0
  t.mock.method(performance, 'now', () => now)
  const f = fixture()
  await assert.rejects(
    waitRecoveryReadiness(f.page, {
      onBlocked: async ({ remainingMs }) => {
        assert.equal(remainingMs, 30000)
        now = 30001
      },
    }),
    /Profile recovery readiness timed out/
  )
  assert.equal(f.presses, 0)
})

test('a completed Space input cannot admit a still-blocked world or repeat input', async t => {
  let now = 0, presses = 0
  t.mock.method(performance, 'now', () => now)
  const f = fixture(), wait = f.page.waitForTimeout
  f.page.waitForTimeout = async () => { await wait(); now += 100 }
  f.page.keyboard.press = async key => {
    assert.equal(key, 'Space')
    presses++ // Deliberately unaccepted input: the input mask stays set.
  }
  await assert.rejects(waitRecoveryReadiness(f.page, {
    timeout: 500, onBlocked: recoverVisibleIntroduction(f.page),
  }), /Recovery Space was not accepted/)
  assert.equal(presses, 1)
  assert.equal(f.world.inputMask & 64, 64)
})

test('profile and Tornado callers recheck public introduction while preserving eligibility and caps', () => {
  const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'),
    profile = read('scripts/local-render/campaign-profile-recovery.mjs'),
    tornado = read('scripts/check-browser-tornado-appearance.mjs')
  assert.match(
    profile,
    /entry.readiness = await waitRecoveryReadiness\(page, \{ signal, onBlocked: recoverVisibleIntroduction\(page\) \}\)/
  )
  assert.equal((tornado.match(/onBlocked: recoverIntroduction\('(initial|restart)'\)/g) ?? []).length, 2)
  assert.doesNotMatch(tornado, /querySelector\('\.skip-introduction'\)\?\.click/)
  const readiness = read('scripts/tutorial-browser/profile-readiness.mjs')
  assert.match(readiness, /timeout = 30000/)
  assert.match(tornado, /timeout: 12000/)
  assert.doesNotMatch(readiness, /\.inputMask\s*=|\.flags4\s*=|\.paused\s*=/)
})
