import test from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { readFileSync } from 'node:fs'
import { createFlyby, flybyCommand, interruptFlyby } from '../app/flyby.ts'
import {
  pauseStartupReady,
  recoverVisibleIntroduction,
} from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'
import { waitRecoveryReadiness } from '../scripts/tutorial-browser/profile-readiness.mjs'

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
  let skip = null,
    clicks = 0,
    waits = 0
  const context = {
    window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
    document: {
      querySelector: selector => (selector === 'button.skip-introduction' ? skip : null),
    },
    getComputedStyle: button => ({ visibility: button.visibility }),
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
    async evaluate(fn) {
      const before = structuredClone(world),
        value = runInNewContext(`(${fn.toString()})()`, context)
      assert.deepEqual(world, before, 'readiness observations cannot modify runtime state')
      return value
    },
    getByRole(role, options) {
      assert.equal(role, 'button')
      assert.ok(options.name.test('Skip introduction ESC'))
      return {
        click: async ({ timeout }) => {
          assert.ok(timeout > 0 && timeout <= 2500)
          assert.ok(skip && skip.getClientRects().length && !skip.disabled)
          clicks++
          publicSkip(scene)
        },
      }
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
        skip = { disabled: false, visibility: 'visible', getClientRects: () => [{}] }
      }
    },
  }
  return {
    page,
    world,
    context,
    get clicks() {
      return clicks
    },
  }
}

test('initial public ready can precede authored flyby; late visible Skip resolves real eligibility', async () => {
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
  assert.equal(f.clicks, 1)
  assert.deepEqual(result.publicActions, [{ sample: 3, action: 'public-skip-introduction' }])
  assert.equal(
    result.samples,
    4,
    'hidden control is not guessed or clicked; readiness re-observed after public action'
  )
})

test('visible-introduction callback never bypasses non-flyby or hidden-control blockers and clicks once', async () => {
  let clicks = 0,
    timeout
  const action = recoverVisibleIntroduction({
    evaluate: async () => false,
    getByRole: () => ({
      click: async options => {
        clicks++
        timeout = options.timeout
      },
    }),
  })
  for (const after of [
    { inputMask: 0, introductionSkipVisible: true },
    { inputMask: 128, introductionSkipVisible: true },
    { inputMask: 64, introductionSkipVisible: false },
  ])
    assert.equal(await action({ after, remainingMs: 500 }), null)
  assert.equal(clicks, 0)
  const blocked = { after: { inputMask: 64, introductionSkipVisible: true }, remainingMs: 500 }
  assert.deepEqual(await action(blocked), { action: 'public-skip-introduction' })
  assert.equal(timeout, 500, 'click shares the remaining existing wait budget')
  assert.equal(await action(blocked), null)
  assert.equal(clicks, 1)
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
  assert.equal(f.clicks, 0)
})

test('profile and Tornado callers recheck public introduction while preserving eligibility and caps', () => {
  const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'),
    profile = read('scripts/local-render/campaign-profile-recovery.mjs'),
    tornado = read('scripts/check-browser-tornado-appearance.mjs')
  assert.match(
    profile,
    /entry.readiness = await waitRecoveryReadiness\(page, \{ signal, onBlocked: recoverVisibleIntroduction\(page\) \}\)/
  )
  assert.equal((tornado.match(/onBlocked: recoverVisibleIntroduction\(page\)/g) ?? []).length, 2)
  assert.doesNotMatch(tornado, /querySelector\('\.skip-introduction'\)\?\.click/)
  const readiness = read('scripts/tutorial-browser/profile-readiness.mjs')
  assert.match(readiness, /timeout = 30000/)
  assert.match(tornado, /timeout: 12000/)
  assert.doesNotMatch(readiness, /\.inputMask\s*=|\.flags4\s*=|\.paused\s*=/)
})
