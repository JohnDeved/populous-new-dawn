import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import spellConversion, { conversionLimitMs, conversionObservationMs, validateConversionObservation,
  installConversionObserver, closeConversionContext, readConversionStartup,
  waitForConversionIntroduction, setupConversionCamera, resumeArmedConversion } from '../scripts/tutorial-browser/spell-conversion.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { spellTestLimitMs } from '../scripts/tutorial-browser/spell-test-menu.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { createWorld, effect, tick } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { stepFlyby } from '../app/flyby.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import atlas from '../app/original-effects.json' with { type: 'json' }

await loadSceneFixture()
const { skipIntroduction, preCameraVisit, postCameraVisit, previewGroundZoom } =
  await import('../app/scene-camera-runtime.ts')
const { GameScene } = await import('../app/scene.ts')

function startupScene() {
  return { world: createWorld(3, 'scalable'), tooltipFrame: { elapsed: 0, lastElapsed: 0, remainder: 0, cueGroups: [] }, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    renderer: { domElement: { isConnected: true } }, onChange() {} }
}

function advanceStartup(scene) {
  tick(scene.world, 1 / 12)
  for (let draw = 0; draw < 2; draw++) stepFlyby(scene.world.flyby, scene.flybyCamera, 24)
  if (!(scene.world.flyby.flags & 1)) scene.world.inputMask &= ~64
}

function browserGlobals(t, values) {
  for (const [key, value] of Object.entries(values)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous)
      else delete globalThis[key]
    })
  }
}

test('Mission 3 pre-introduction unlock and unpublished flyby flags are not startup readiness', () => {
  const scene = startupScene(), world = scene.world
  assert.equal(world.inputMask, 0, 'old unlocked-input alternative accepts turn zero')
  for (let turn = 0; turn < 15; turn++) advanceStartup(scene)
  assert.equal(world.flyby.flags & 1, 0)
  advanceStartup(scene)
  assert.equal(world.turn, 16)
  assert.equal(world.flyby.flags & 1, 1)
  assert.equal(world.inputMask, 64)
  let firstFlash
  for (let turn = world.turn; turn < 190; turn++) {
    advanceStartup(scene)
    if (!firstFlash && world.effects.some(effect => effect.startConversionLink !== undefined &&
      world.units.some(unit => unit.id === effect.startConversionLink && unit.team === 'yellow')))
      firstFlash = { turn: world.turn, inputMask: world.inputMask, flybyFlags: world.flyby.flags }
  }
  assert.ok(firstFlash, 'ordinary first conversion occurs before the unskipped introduction ends')
  assert.equal(firstFlash.inputMask, 64)
  assert.equal(firstFlash.flybyFlags & 1, 1)
  assert.equal(world.inputMask, 64, 'a longer input-clear wait would miss the first conversion')
})

test('conversion startup waits for the public Skip control before testing input readiness', async t => {
  for (const initialTurn of [0, 16, 20]) {
    await t.test(`bind at turn ${initialTurn}`, async t => {
      const scene = startupScene(), world = scene.world, calls = [], report = {}
      for (let turn = 0; turn < initialTurn; turn++) advanceStartup(scene)
      let mounted = false, publish, entered
      const reachedWait = new Promise(resolve => { entered = resolve }),
        button = { getClientRects: () => mounted ? [{}] : [] }
      browserGlobals(t, {
        window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
        document: { visibilityState: 'visible',
          querySelector: selector => selector === '.skip-introduction' && mounted ? button : null },
        getComputedStyle: () => ({ visibility: 'visible' }),
      })
      const page = {
        evaluate: async read => read(),
        locator(selector) {
          assert.equal(selector, '.skip-introduction')
          return {
            async waitFor(options) {
              assert.deepEqual(options, { state: 'visible' })
              calls.push('wait-visible')
              entered()
              await new Promise(resolve => { publish = resolve })
            },
            async click() {
              assert.equal(mounted, true)
              calls.push('click')
              skipIntroduction(scene)
            },
          }
        },
        async waitForFunction(predicate) {
          calls.push('wait-input')
          for (let turn = 0; turn < 60 && !predicate(); turn++) advanceStartup(scene)
          assert.equal(predicate(), true, 'ordinary presentation completes the public Skip')
        },
      }
      const pending = waitForConversionIntroduction(page, report)
      await reachedWait
      assert.deepEqual(calls, ['wait-visible'], 'neither unlocked input nor raw flags bypass DOM readiness')
      assert.equal(report.startup.bound.skipMounted, false)
      while (world.turn < 16) advanceStartup(scene)
      mounted = true
      publish()
      await pending
      assert.deepEqual(calls, ['wait-visible', 'click', 'wait-input'])
      assert.equal(report.startup.beforeSkip.flybyFlags & 1, 1)
      assert.equal(report.startup.beforeSkip.skipVisible, true)
      assert.equal(report.startup.afterSkip.inputMask, 0)
      assert.equal(report.startup.afterSkip.casts, 0)
      assert.equal(report.startup.afterSkip.stock, 1)
    })
  }
})

test('conversion startup diagnostics tolerate missing bind aliases and do not mutate the world', t => {
  browserGlobals(t, {
    window: {},
    document: { visibilityState: 'visible', querySelector: () => null },
  })
  assert.equal(readConversionStartup().sameWorld, false)
  const scene = startupScene(), before = JSON.stringify(scene.world)
  window.testSceneRef = { current: scene }
  window.testStore = { getWorld: () => scene.world }
  const snapshot = readConversionStartup()
  assert.equal(snapshot.level, 3)
  assert.equal(snapshot.turn, 0)
  assert.equal(snapshot.inputMask, 0)
  assert.equal(snapshot.sameWorld, true)
  assert.equal(snapshot.skipVisible, false)
  assert.equal(JSON.stringify(scene.world), before)
})

// Actual GameScene camera accessors and methods, without constructing WebGL.
// DOM/projection, raw navigation input and sky presentation are supplied leaves.
function cameraScene(world) {
  const context = { RENDERER: 1, getParameter: () => 'CPU camera-owner fixture, no GPU',
      isContextLost: () => false }, skyCalls = [],
    scene = Object.assign(Object.create(GameScene.prototype), { world,
      started: true, inputDepth: 0, modalSuspended: false, previous: 1000,
      cameraPreviewButtons: null, tooltipCameraActive: false, skyRemainder: 0,
      viewPoint: { x: 34, z: 82 }, cameraBearing: 1144 * Math.PI / 1024,
      tooltip: { draw: 5 }, tooltipFrame: { elapsed: 0, lastElapsed: 0, remainder: 0, cueGroups: [] }, container: { clientWidth: 960, clientHeight: 720 },
      view: { update() {} }, fxMeshes: new Map(),
      renderer: { domElement: { isConnected: true }, info: { render: { frame: 0 } },
        getContext: () => context },
      navigationButtons: () => 0,
      commitSky: (camera, remainder) => skyCalls.push({ camera: { ...camera }, remainder }),
    })
  scene.gameClock = { animationTime: 0, animationFrame: 0, afterTurn() {}, camera: {
    pre: () => preCameraVisit(scene), post: zoom => postCameraVisit(scene, zoom),
    zoom: () => scene.stepViewChange(), sampleZoom: () => previewGroundZoom(scene),
    // This fixture has no rendered tooltip/sky elapsed work. The actual shared
    // camera scheduler, pre/post controllers, shake and tick remain in use.
    elapsed: seconds => { scene.skyRemainder += seconds },
  } }
  return { scene, skyCalls }
}

function pausedStartupWorld() {
  const scene = startupScene()
  for (let turn = 0; turn < 71; turn++) {
    advanceStartup(scene)
    if (scene.world.turn === 22) skipIntroduction(scene)
  }
  scene.world.paused = true
  return scene.world
}

function cameraFixture(t, { elapsedMs = 0, held = true, playerTribe } = {}) {
  const world = pausedStartupWorld()
  if (playerTribe !== undefined) world.manaWorld.playerTribe = playerTribe
  const { scene, skyCalls } = cameraScene(world),
    pending = new Map(), globals = {}, player = world.manaWorld.playerTribe
  // Supplied fixture readiness, never writes performed by the browser checker.
  world.paused = false
  world.lightView = { x: 123, y: 456, h: 789 }
  Object.assign(world.cameras.tribes[player], { x: 10752, y: 42496, angle: 1144 })
  if (held) {
    Object.assign(world.cameras.held[player], { x: 3, y: -2, angle: 1 })
    Object.assign(world.cameras.held[(player + 1) % 4], { x: -1, y: 2, angle: -1 })
  }
  world.cameras.navigationTime = 1 / 48
  effect(world, 'blast', { x: 34, z: 82 }) // Real owner for light-mutation controls.
  scene.previous = 1000 - elapsedMs
  let serial = 0, observer
  const values = {
    window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
    document: { visibilityState: 'visible', documentElement: { clientWidth: 960 } },
    performance: { now: () => 1000 },
    requestAnimationFrame: fn => { pending.set(++serial, fn); return serial },
    cancelAnimationFrame: id => pending.delete(id),
  }
  for (const [key, value] of Object.entries(values)) {
    globals[key] = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  }
  t.after(() => {
    try { observer?.retain() }
    finally {
      for (const [key, descriptor] of Object.entries(globals)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
      }
    }
  })
  installConversionObserver({ observationMs: 30000 })
  observer = window.__pndConversionObservation
  return { world, scene, skyCalls, observer, pending }
}

test('actual focus retains lightView and writes only exact logical-camera ownership at Mission 3 turn71', t => {
  const { world, scene, skyCalls } = cameraFixture(t), player = world.manaWorld.playerTribe
  world.mode = 'blast'
  const before = structuredClone(world), expected = structuredClone(world)
  expected.mode = null
  expected.cameras.navigationTime = 0
  for (let i = 0; i < 4; i++) Object.assign(expected.cameras.borrowed[i], expected.cameras.held[i])
  Object.assign(expected.cameras.tribes[player], { x: (56064 - 3) & 65535, y: 21248 + 2 })
  scene.focus({ x: -45, z: -91 })
  assert.deepEqual(world, expected, 'all gameplay, terrain, lighting and other cameras remain exact')
  assert.deepEqual(Object.keys(world).filter(key => !isDeepStrictEqual(before[key], world[key])).sort(),
    ['cameras', 'mode'])
  assert.deepEqual(world.lightView, before.lightView)
  assert.deepEqual(scene.viewPoint, { x: -45, z: -91 })
  assert.equal(scene.cameraBearing, 1145 * Math.PI / 1024)
  assert.equal(world.turn, 71)
  assert.equal(world.spellCasts[2][17], 0)
  assert.equal(skyCalls.length, 1)
  assert.equal(skyCalls[0].remainder, 0)
})

test('conversion checker observes one real timestamp drain and restores the exact method descriptor', t => {
  const { world, scene, observer } = cameraFixture(t, { elapsedMs: 1000 / 12, held: false }),
    actual = scene.advanceInputTime, calls = []
  scene.advanceInputTime = function (...args) {
    calls.push({ receiver: this, args })
    return actual.apply(this, args)
  }
  const descriptor = Object.getOwnPropertyDescriptor(scene, 'advanceInputTime'),
    callback = scene.gameClock.afterTurn, report = setupConversionCamera(checkpointCodec)
  assert.equal(report.status, 'passed')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].receiver, scene)
  assert.deepEqual(calls[0].args, [])
  assert.equal(report.drain.before.turn, 71)
  assert.equal(report.drain.after.turn, 72)
  assert.equal(world.turn, 72)
  assert.equal(observer.result.observedTurns, 1, 'actual ordinary-turn observer was not suppressed')
  assert.equal(scene.gameClock.afterTurn, callback)
  assert.deepEqual(Object.getOwnPropertyDescriptor(scene, 'advanceInputTime'), descriptor)
  assert.deepEqual(report.restoration, { attempted: true, restored: true, error: null })
  assert.deepEqual(report.cameraWorldChanges.lightView, {
    before: { x: 123, y: 456, h: 789 }, after: { x: 123, y: 456, h: 789 },
  })
  assert.equal(report.casts, 0)
  assert.equal(report.stock, 1)
  assert.equal(report.paused, false)
  assert.throws(() => setupConversionCamera(checkpointCodec), /already attempted/)
  assert.equal(window.__pndConversionCameraSetup, report, 'first receipt must not be overwritten')
})

test('conversion checker restores inherited drain and preserves selected-mode cancellation', t => {
  const { world, scene } = cameraFixture(t)
  world.mode = 'blast'
  const inherited = scene.advanceInputTime, report = setupConversionCamera(checkpointCodec)
  assert.equal(Object.hasOwn(scene, 'advanceInputTime'), false)
  assert.equal(scene.advanceInputTime, inherited)
  assert.deepEqual(report.cameraWorldChanges.mode, { before: 'blast', after: null })
  assert.equal(report.cameraWorldChanges.tribe.after.x, 56061)
  assert.equal(report.cameraWorldChanges.tribe.after.y, 21250)
})

test('conversion camera rejects every old gameplay/light mutation plus wrong logical-camera deltas', async t => {
  const mutations = [
    ['turn', w => { w.turn++ }],
    ['gameplay RNG', w => { w.randomState++ }],
    ['cosmetic RNG', w => { w.cosmeticRandom.randomState++ }],
    ['unit HP', w => { w.units[0].hp-- }],
    ['terrain', w => { w.land.heights[0]++ }],
    ['stock', w => { w.manaWorld.spells[2].stocks[17]++ }],
    ['Map/Set', w => { w.buildingFootprints.set(-1, { cells: new Set([123]) }) }],
    ['undefined property', w => { w.addedUndefined = undefined }],
    ['mode', w => { w.mode = 'blast' }],
    ['lightView x', w => { w.lightView.x++ }],
    ['lightView h', w => { w.lightView.h++ }],
    ['lightView extra key', w => { w.lightView.unexpected = undefined }],
    ['light contribution', w => { w.lights.find(Boolean).contributions[0]++ }],
    ['terrain light cells', w => { w.land.buildingIds[0] += 1024 }],
    ['light revision', w => { w.lightRevision++ }],
    ['player pose', w => { w.cameras.tribes[w.manaWorld.playerTribe].x++ }],
    ['missing correction', w => { w.cameras.tribes[w.manaWorld.playerTribe].x += 3 }],
    ['doubled correction', w => { w.cameras.tribes[w.manaWorld.playerTribe].x -= 3 }],
    ['wrong player', w => { w.manaWorld.playerTribe = (w.manaWorld.playerTribe + 1) % 4 }],
    ['other tribe', w => { w.cameras.tribes[(w.manaWorld.playerTribe + 1) % 4].x++ }],
    ['angle', w => { w.cameras.tribes[w.manaWorld.playerTribe].angle++ }],
    ['camera height', w => { w.cameras.tribes[w.manaWorld.playerTribe].h++ }],
    ['camera clock', w => { w.cameras.elapsed++ }],
    ['input queue owner', w => { w.cameras.input.cursor++ }],
    ['zoom', w => { w.cameras.viewZoom++ }],
    ['result owner', w => { w.cameras.result.counter++ }],
    ['held correction', w => { w.cameras.held[w.manaWorld.playerTribe].x++ }],
  ]
  for (const [name, mutate] of mutations) await t.test(name, t => {
    const { world, scene } = cameraFixture(t), actual = scene.focus
    scene.focus = function (...args) { actual.apply(this, args); mutate(world) }
    assert.throws(() => setupConversionCamera(checkpointCodec), /exact post-drain focus ownership/)
    assert.equal(window.__pndConversionCameraSetup.status, 'failed')
    assert.equal(window.__pndConversionCameraSetup.restoration.restored, true)
  })
  assert.doesNotMatch(setupConversionCamera.toString(), /w\.(?:mode|lightView|paused|speed)\s*=(?!=)/,
    'the checker cannot repair gameplay/light state to satisfy itself')
})

test('conversion camera refuses unsupported post-drain owners before focus changes', async t => {
  for (const [name, mutate] of [
    ['animated focus', w => { w.cameras.motion.active = 1 }],
    ['result', w => { w.cameras.result.active = 1 }],
    ['pending result', w => { w.cameras.resultRequest++ }],
    ['overview', w => { w.cameras.overviewActive = true }],
    ['heading transition', w => { w.cameras.viewTransition = { angle: { target: 0, increment: 0 } } }],
    ['flyby', w => { w.flyby.flags |= 1 }],
    ['navigation', w => { w.cameras.input.buttons = 1 }],
    ['stale terrain', w => { w.landVersion = -1 }],
    ['held alias', w => { w.cameras.borrowed[0] = w.cameras.held[0] }],
  ]) await t.test(name, t => {
    const { world } = cameraFixture(t)
    mutate(world)
    const before = checkpointCodec(world)
    assert.throws(() => setupConversionCamera(checkpointCodec), /unsupported/)
    assert.deepEqual(checkpointCodec(world), before, 'no checker repair or focus after refusal')
    assert.equal(window.__pndConversionCameraSetup.restoration.restored, true)
  })
})

test('conversion camera drain errors and callback loss fail closed with retained receipts', async t => {
  for (const thrown of ['', undefined]) await t.test(`drain throws ${String(thrown)}`, t => {
    const { world, scene } = cameraFixture(t), before = checkpointCodec(world)
    scene.advanceInputTime = () => { throw thrown }
    const descriptor = Object.getOwnPropertyDescriptor(scene, 'advanceInputTime')
    let caught = false
    try { setupConversionCamera(checkpointCodec) }
    catch (error) { caught = true; assert.equal(error, thrown) }
    assert.equal(caught, true)
    assert.deepEqual(checkpointCodec(world), before)
    assert.equal(window.__pndConversionCameraSetup.status, 'failed')
    assert.equal(window.__pndConversionCameraSetup.drain.error, String(thrown))
    assert.deepEqual(Object.getOwnPropertyDescriptor(scene, 'advanceInputTime'), descriptor)
  })
  await t.test('ordinary observer ownership loss', t => {
    const { scene } = cameraFixture(t), actual = scene.advanceInputTime, foreign = () => {}
    scene.advanceInputTime = function (...args) {
      actual.apply(this, args)
      this.gameClock.afterTurn = foreign
    }
    assert.throws(() => setupConversionCamera(checkpointCodec), /ordinary-turn observer/)
    assert.equal(scene.gameClock.afterTurn, foreign, 'checker must not overwrite another callback')
  })
  await t.test('drain wrapper ownership loss', t => {
    const { scene } = cameraFixture(t), actual = scene.advanceInputTime, foreign = () => {}
    scene.advanceInputTime = function (...args) {
      actual.apply(this, args)
      this.advanceInputTime = foreign
    }
    assert.throws(() => setupConversionCamera(checkpointCodec), /wrapper ownership changed/)
    assert.equal(scene.advanceInputTime, foreign)
    assert.equal(window.__pndConversionCameraSetup.restoration.restored, false)
  })
  for (const count of [0, 2]) await t.test(`focus invokes drain ${count} times`, t => {
    const { scene } = cameraFixture(t), actual = scene.focus
    scene.focus = count === 0 ? () => {} : function (...args) {
      actual.apply(this, args); this.advanceInputTime()
    }
    assert.throws(() => setupConversionCamera(checkpointCodec), /single drain|exactly once/)
    assert.equal(window.__pndConversionCameraSetup.status, 'failed')
    assert.equal(window.__pndConversionCameraSetup.drain.calls, count)
    assert.equal(window.__pndConversionCameraSetup.restoration.restored, true)
  })
  await t.test('conversion becomes ineligible during the drain', t => {
    const { world, scene } = cameraFixture(t), actual = scene.advanceInputTime
    scene.advanceInputTime = function (...args) {
      actual.apply(this, args)
      world.spellCasts[2][17] = 1 // Supplied negative control, not natural conversion evidence.
    }
    const pose = structuredClone(world.cameras.tribes)
    assert.throws(() => setupConversionCamera(checkpointCodec), /post-drain gameplay is not ready/)
    assert.deepEqual(world.cameras.tribes, pose)
    assert.equal(world.spellCasts[2][17], 1, 'checker must not rewind the failed drain')
    assert.equal(window.__pndConversionCameraSetup.drain.after.casts, 1)
  })
})

test('empty restoration failure cannot turn a successful focus into a passing setup', t => {
  const { scene } = cameraFixture(t), original = scene.advanceInputTime
  Object.defineProperty(scene, 'advanceInputTime', { configurable: true, writable: true,
    enumerable: false, value: original })
  const descriptor = Object.getOwnPropertyDescriptor(scene, 'advanceInputTime')
  let definitions = 0, rejectRestore = true
  const proxy = new Proxy(scene, { defineProperty(target, key, next) {
    if (key === 'advanceInputTime' && ++definitions === 2 && rejectRestore) throw ''
    return Reflect.defineProperty(target, key, next)
  } })
  window.testSceneRef.current = proxy
  let caught = false
  try { setupConversionCamera(checkpointCodec) }
  catch (error) { caught = true; assert.equal(error, '') }
  assert.equal(caught, true)
  assert.equal(window.__pndConversionCameraSetup.status, 'failed')
  assert.equal(window.__pndConversionCameraSetup.restoration.error, '')
  assert.equal(window.__pndConversionCameraSetup.restoration.restored, false)
  rejectRestore = false
  Object.defineProperty(proxy, 'advanceInputTime', descriptor) // Fixture cleanup only.
})

test('conversion checker uses the actual nonzero player owner', t => {
  const { world } = cameraFixture(t, { playerTribe: 2 }),
    other = structuredClone(world.cameras.tribes[0]), report = setupConversionCamera(checkpointCodec)
  assert.equal(report.cameraWorldChanges.player, 2)
  assert.equal(world.cameras.tribes[2].x, 56061)
  assert.deepEqual(world.cameras.tribes[0], other)
})

test('conversion checker inspects a partially completed descriptor installation before cleanup', t => {
  const { scene } = cameraFixture(t), descriptor = Object.getOwnPropertyDescriptor(scene, 'advanceInputTime')
  let first = true
  const proxy = new Proxy(scene, { defineProperty(target, key, next) {
    const result = Reflect.defineProperty(target, key, next)
    if (key === 'advanceInputTime' && first) { first = false; throw 'installed-then-threw' }
    return result
  } })
  window.testSceneRef.current = proxy
  let caught = false
  try { setupConversionCamera(checkpointCodec) }
  catch (error) { caught = true; assert.equal(error, 'installed-then-threw') }
  assert.equal(caught, true)
  assert.equal(window.__pndConversionCameraSetup.drain.calls, 0)
  assert.equal(window.__pndConversionCameraSetup.status, 'failed')
  assert.equal(window.__pndConversionCameraSetup.restoration.restored, true)
  assert.deepEqual(Object.getOwnPropertyDescriptor(scene, 'advanceInputTime'), descriptor)
})

test('conversion checker catches World replacement and late restoration mutations', async t => {
  await t.test('World replaced by the drain', t => {
    const { world, scene } = cameraFixture(t), actual = scene.advanceInputTime,
      replacement = structuredClone(world)
    scene.advanceInputTime = function (...args) {
      actual.apply(this, args); this.world = replacement
    }
    assert.throws(() => setupConversionCamera(checkpointCodec), /original Scene\/world\/clock/)
    assert.equal(scene.world, replacement, 'checker must not repair a retired binding')
    assert.equal(window.__pndConversionCameraSetup.restoration.restored, true)
  })
  await t.test('restoration mutates gameplay', t => {
    const { world, scene } = cameraFixture(t)
    const proxy = new Proxy(scene, { deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)
      if (key === 'advanceInputTime') world.randomState++
      return result
    } })
    window.testSceneRef.current = proxy
    assert.throws(() => setupConversionCamera(checkpointCodec), /exact post-drain focus ownership/)
    assert.equal(window.__pndConversionCameraSetup.status, 'failed')
    assert.equal(window.__pndConversionCameraSetup.restoration.restored, true)
  })
})

// Fake page transport only: never launches a browser, imports an asset launcher
// or certifies a real episode. Exercises the scenario's terminal failure writer.
test('conversion scenario preserves empty and undefined errors as failed terminal reports', async t => {
  for (const thrown of ['', undefined]) await t.test(`navigation rejects ${String(thrown)}`, async t => {
    const output = mkdtempSync(join(tmpdir(), 'conversion-failure-control-')),
      cameraSetupAttempt = { status: 'failed', error: String(thrown), drain: { error: String(thrown) } }
    t.after(() => rmSync(output, { recursive: true, force: true }))
    let closes = 0
    const page = { setDefaultTimeout() {}, on() {}, isClosed: () => false,
      goto: async () => { throw thrown },
      evaluate: async fn => fn.toString().includes('__pndConversionCameraSetup') ? cameraSetupAttempt : null,
    }, context = { newPage: async () => page, close: async () => { closes++ } },
      browser = { newContext: async () => context }
    let caught = false
    try { await spellConversion({ browser, url: 'https://example.invalid/not-visited', output }) }
    catch (error) { caught = true; assert.equal(error, thrown) }
    assert.equal(caught, true)
    assert.equal(closes, 1)
    const report = JSON.parse(readFileSync(join(output, 'spell-conversion.json'), 'utf8'))
    assert.equal(report.status, 'failed')
    assert.equal(report.error, String(thrown))
    assert.deepEqual(report.cameraSetupAttempt, cameraSetupAttempt)
    assert.equal(report.capMs, conversionLimitMs)
    assert.equal(report.observationCapMs, conversionObservationMs)
  })
})

test('conversion camera pins its store reader and forwards that reader receiver', t => {
  const { world } = cameraFixture(t), store = window.testStore, receivers = []
  store.getWorld = function () { receivers.push(this); return world }
  const reader = store.getWorld, report = setupConversionCamera(checkpointCodec)
  assert.equal(report.status, 'passed')
  assert.equal(window.testStore, store)
  assert.equal(store.getWorld, reader)
  assert.ok(receivers.length > 1)
  assert.ok(receivers.every(receiver => receiver === store))
})

test('conversion camera rejects same-World store or reader replacement', async t => {
  for (const replaceStore of [true, false]) await t.test(replaceStore ? 'store' : 'reader', t => {
    const { world, scene } = cameraFixture(t), store = window.testStore, actual = scene.focus
    let foreignCalls = 0
    const foreign = () => { foreignCalls++; return world }
    scene.focus = function (...args) {
      actual.apply(this, args)
      if (replaceStore) window.testStore = { getWorld: foreign }
      else store.getWorld = foreign
    }
    assert.throws(() => setupConversionCamera(checkpointCodec), /store reader/)
    assert.equal(foreignCalls, 0, 'do not invoke a replacement reader merely to compare its World')
    assert.equal(window.__pndConversionCameraSetup.status, 'failed')
    assert.equal(window.__pndConversionCameraSetup.restoration.restored, true)
  })
})

test('conversion camera validates every admitted logical alias after focus and again after restoration', async t => {
  const aliases = [
    ['cameraPosition', s => ({ ...s.cameraPosition })],
    ['cameraMotion', s => ({ ...s.cameraMotion })],
    ['resultCamera', s => ({ ...s.resultCamera })],
    ['cameraVelocity', s => ({ ...s.cameraVelocity })],
    ['keys', s => new Set(s.keys)],
    ['overviewActive', () => true],
    ['overviewStage', () => 'enter'],
    ['viewTransition', () => ({})],
    ['viewZoom', s => s.viewZoom + 1],
    ['viewPreset', s => s.viewPreset + 1],
  ]
  for (const when of ['after-focus', 'during-restoration'])
    for (const [key, value] of aliases) await t.test(`${when}: ${key}`, t => {
      const { world, scene } = cameraFixture(t), actual = scene.focus
      let focusedWorld
      const detach = target => Object.defineProperty(target, key, {
        configurable: true, value: value(target),
      })
      scene.focus = function (...args) {
        actual.apply(this, args)
        focusedWorld = checkpointCodec(world)
        if (when === 'after-focus') detach(this)
      }
      if (when === 'during-restoration') {
        const proxy = new Proxy(scene, { deleteProperty(target, name) {
          const result = Reflect.deleteProperty(target, name)
          if (name === 'advanceInputTime') detach(target)
          return result
        } })
        window.testSceneRef.current = proxy
      }
      assert.throws(() => setupConversionCamera(checkpointCodec), /aliases do not share the logical owners/)
      assert.deepEqual(checkpointCodec(world), focusedWorld, 'the fault detaches only Scene aliases, not World')
      assert.equal(window.__pndConversionCameraSetup.status, 'failed')
      assert.equal(window.__pndConversionCameraSetup.restoration.restored, true)
    })
})

test('conversion camera rechecks display coordinates and bearing after exact method restoration', async t => {
  for (const field of ['point', 'bearing']) await t.test(field, t => {
    const { world, scene } = cameraFixture(t), actual = scene.focus
    let focusedWorld
    scene.focus = function (...args) {
      actual.apply(this, args); focusedWorld = checkpointCodec(world)
    }
    const proxy = new Proxy(scene, { deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)
      if (key === 'advanceInputTime') {
        if (field === 'point') target.viewPoint.x++
        else target.cameraBearing += 0.25
      }
      return result
    } })
    window.testSceneRef.current = proxy
    assert.throws(() => setupConversionCamera(checkpointCodec), /exact logical focus target/)
    assert.deepEqual(checkpointCodec(world), focusedWorld, 'late display-only faults preserve World bytes')
    assert.equal(window.__pndConversionCameraSetup.status, 'failed')
    assert.equal(window.__pndConversionCameraSetup.restoration.restored, true)
  })
})

function observation() {
  const sample = (turn, frame, x, targetX) => {
    const entry = atlas.animations.startConversion[frame - 1240]
    return { turn, stamp: turn, id: 9, targetId: 10, remaining: 165 - turn,
      x, z: -91, targetX, targetZ: -91, object: 1240, draw: 45, f1: (frame - 1240) * 4,
      flags: 0x104, palette: 0, frame, sequence: 'startConversion', visible: true,
      submitted: true, opacity: 1, texture: 'http://localhost/original/effects.png',
      size: [100, 100, 1], center: [0.5, 0], uv: [100 / atlas.width, 100 / atlas.height,
        entry.index % 8 * 256 / atlas.width, 1 - (Math.floor(entry.index / 8) * 256 + 100) / atlas.height] }
  }
  const first = sample(157, 1240, -45, -44.75), second = sample(158, 1242, -44.75, -44.75)
  first.cropFile = 'spell-conversion-frame-0.png'
  second.cropFile = 'spell-conversion-frame-1.png'
  const logical = Array.from({ length: 9 }, (_, i) => ({ turn: 157 + i, present: i < 8,
    remaining: 8 - i, id: 9, targetId: 10, x: i ? -44.75 : -45, z: -91, targetX: -44.75, targetZ: -91 }))
  return { error: null, restored: true, bornTurn: 157, logical, removal: { ...logical.at(-1) },
    birth: { turn: 157, id: 9, targetId: 10, casts: 1, stock: 0, team: 'yellow', kind: 'brave',
      remaining: 8, linkedCount: 1, birthSubstitute: false, cue5: true, x: -45, z: -91 },
    terminal: { reason: 'rendered-expiry', turn: 166, present: false, meshPresent: false, remaining: 0 },
    samples: [first, second, { ...second, turn: 161, object: 0x650, visible: false }],
    crops: [first, second].map(s => ({ filename: s.cropFile, frame: s.frame, turn: s.turn, stamp: s.stamp, colors: 10 })) }
}

test('bounded conversion validator rejects wrong art, stale crops, missed motion and late expiry', () => {
  validateConversionObservation(observation(), atlas)
  for (const corrupt of [
    o => { o.samples[0].object = 1441 },
    o => { o.samples[0].uv[2] = 0 },
    o => { o.crops[0].stamp++ },
    o => { for (const s of o.logical) s.x = -45 },
    o => { o.removal.turn++ },
    o => { o.logical.splice(3, 1) },
    o => { o.restored = false },
    o => { o.terminal.turn = 164 },
    o => { o.terminal.meshPresent = true },
    o => { o.samples[0].submitted = false },
    o => { o.samples[0].texture = '/original/unit-layers.png' },
    o => { o.birth.birthSubstitute = true },
    o => { o.birth.linkedCount = 2 },
    o => { o.crops[0].colors = 1 },
    o => { o.samples[2].visible = true },
  ]) {
    const wrong = observation(); corrupt(wrong)
    assert.throws(() => validateConversionObservation(wrong, atlas))
  }
})

test('conversion observation and existing F9/global deadlines stay finite and independent', () => {
  assert.equal(conversionLimitMs, 75000)
  assert.equal(conversionObservationMs, 30000)
  assert.equal(browserCapMs('frontend-held-escape'), 180000)
  assert.equal(spellTestLimitMs, 75000)
  const source = installConversionObserver.toString()
  assert.match(source, /keys\.size < 8/)
  assert.match(source, /world\.turn > result\.bornTurn \+ 8/)
  assert.doesNotMatch(source, /\.render\(|\.animate\(|\btick\(|\.focus\(/)
  assert.doesNotMatch(source, /world\.(?:paused|speed|units|effects|shots)\s*=/)
})

test('conversion final cleanup cannot certify a late or watchdog-expired episode', async () => {
  let now = 74000, release
  const context = { close: () => new Promise(resolve => { release = resolve }) }
  const pending = closeConversionContext(context, {}, 0, () => now)
  now = 75001
  release()
  await assert.rejects(pending, /deadline/)
  await assert.rejects(closeConversionContext({ close: async () => {} },
    { timedOut: true }, 0, () => 74000), /deadline/)
  const report = {}
  await closeConversionContext({ close: async () => {} }, report, 0, () => 74000)
  assert.equal(report.elapsedMs, 74000)
})

// Controlled callback/RAF fixture exercises the installed observer itself. It is
// not gameplay or GPU evidence; the browser episode supplies those observations.
function observerFixture(t, { expiry = 165, callback, armed = false } = {}) {
  const target = { id: 10, team: 'yellow', kind: 'brave', x: -45, z: -91 },
    flash = { id: 9, startConversionLink: 10, turnsRemaining: 8, x: -45, z: -91,
      animation: { object: 0x650, f1: 0 } },
    world = { turn: armed ? 0 : 156, paused: armed, speed: 1, effects: [], units: [target],
      spellCasts: [[], [], { 17: 0 }], manaWorld: { spells: [null, null, { stocks: { 17: 1 } }] }, sounds: [] },
    calls = [], original = function (...args) {
      calls.push({ receiver: this, args, turn: world.turn })
      if (callback) return callback.apply(this, args)
      if (world.turn === 157) {
        world.effects.push(flash); world.spellCasts[2][17] = 1
        world.manaWorld.spells[2].stocks[17] = 0; world.sounds.push({ cue: 5, turn: 157 })
      }
      if (world.turn > 157 && world.turn < expiry) flash.turnsRemaining = Math.max(1, 165 - world.turn)
      if (world.turn === expiry) { flash.turnsRemaining = 0; world.effects.length = 0 }
      return 'original-result'
    }, clock = { afterTurn: original },
    scene = { world, gameClock: clock, fxMeshes: new Map(),
      renderer: { domElement: { isConnected: true }, info: { render: { frame: 0 } },
        getContext: () => ({ isContextLost: () => false }) } }, pending = new Map()
  let serial = 0
  browserGlobals(t, {
    window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
    document: { visibilityState: 'visible' },
    requestAnimationFrame: fn => { pending.set(++serial, fn); return serial },
    cancelAnimationFrame: id => pending.delete(id),
  })
  const descriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn')
  installConversionObserver({ observationMs: 30000, armed })
  const observer = window.__pndConversionObservation
  t.after(() => observer.retain())
  return { world, scene, clock, original, descriptor, calls, observer, flash, pending,
    turn(turn) { world.turn = turn; return clock.afterTurn.call(clock, 'argument') },
    frame() {
      scene.renderer.info.render.frame++
      const callbacks = [...pending.values()]; pending.clear()
      for (const fn of callbacks) fn()
    } }
}

test('actual Convert observer separates catch-up expiry165 from rendered absence166', t => {
  const f = observerFixture(t)
  for (let turn = 157; turn <= 164; turn++) {
    assert.equal(f.turn(turn), 'original-result')
    if ([157, 158, 159, 161, 162, 164].includes(turn)) f.frame()
  }
  // Keep the stale mesh until display synchronization, as Scene does after the
  // fixed-turn loop. No RAF runs between these two actual callback invocations.
  f.scene.fxMeshes.set(9, { visible: false, userData: {} })
  f.turn(165)
  assert.equal(f.observer.result.removal.turn, 165)
  assert.equal(f.observer.result.done, false, 'logical removal does not require mesh removal')
  f.turn(166)
  f.scene.fxMeshes.delete(9)
  f.frame()
  const result = f.observer.retain()
  assert.equal(result.error, null)
  assert.equal(result.birth.turn, 157)
  assert.equal(result.removal.turn - result.birth.turn, 8)
  assert.deepEqual(result.logical.map(s => [s.turn, s.remaining, s.present]),
    Array.from({ length: 9 }, (_, i) => [157 + i, 8 - i, i < 8]))
  assert.equal(result.terminal.turn, 166)
  assert.equal(result.terminal.reason, 'rendered-expiry')
  assert.equal(result.terminal.meshPresent, false)
  assert.deepEqual(result.samples.map(s => s.turn), [157, 158, 159, 161, 162, 164])
  assert.equal(result.restored, true)
  assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock, 'afterTurn'), f.descriptor)
  assert.equal(f.calls.length, 10)
  assert.ok(f.calls.every(c => c.receiver === f.clock && c.args[0] === 'argument'))
  assert.equal(f.pending.size, 0)
})

test('actual Convert observer still rejects genuine logical expiry166', t => {
  const f = observerFixture(t, { expiry: 166 })
  for (let turn = 157; turn <= 164; turn++) { f.turn(turn); f.frame() }
  f.turn(165); f.turn(166); f.frame()
  const result = f.observer.retain()
  assert.equal(result.birth.turn, 157)
  assert.equal(result.removal.turn, 166)
  assert.match(result.error, /exceeded eight logical visits/)
  assert.equal(result.restored, true)
  assert.throws(() => validateConversionObservation(result, atlas))
})

test('Convert observer preserves original thrown identity and restores its descriptor', t => {
  const failure = new Error('existing callback failed'),
    f = observerFixture(t, { callback() { throw failure } })
  assert.throws(() => f.turn(157), error => error === failure)
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0].receiver, f.clock)
  assert.deepEqual(f.calls[0].args, ['argument'])
  assert.equal(f.observer.result.terminal.reason, 'callback-error')
  assert.equal(f.observer.result.restored, true)
  assert.deepEqual(Object.getOwnPropertyDescriptor(f.clock, 'afterTurn'), f.descriptor)
  assert.equal(f.pending.size, 0)
})

test('Convert retention restores early and refuses to overwrite a foreign callback', async t => {
  await t.test('early retention', t => {
    const f = observerFixture(t), result = f.observer.retain()
    assert.equal(result.terminal.reason, 'retained-before-completion')
    assert.equal(result.restored, true)
    assert.equal(f.clock.afterTurn, f.original)
    assert.equal(f.pending.size, 0)
  })
  await t.test('foreign callback', t => {
    const f = observerFixture(t), foreign = () => {}
    f.clock.afterTurn = foreign; f.frame()
    assert.match(f.observer.result.error, /callback ownership changed/)
    assert.equal(f.observer.result.restored, false)
    assert.equal(f.clock.afterTurn, foreign)
    assert.equal(f.pending.size, 0)
  })
})


test('real Mission 3 catch-up observes expiry at165 while RAF next sees166 without world changes', t => {
  const world = createWorld(3, 'scalable'), control = structuredClone(world), pending = new Map(),
    original = () => {}, clock = { animationTime: 0, animationFrame: 0, afterTurn: original },
    controlClock = { animationTime: 0, animationFrame: 0 },
    scene = { world, gameClock: clock, fxMeshes: new Map(), renderer: {
      domElement: { isConnected: true }, info: { render: { frame: 0 } },
      getContext: () => ({ isContextLost: () => false }) } }
  let serial = 0
  browserGlobals(t, {
    window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
    document: { visibilityState: 'visible' },
    requestAnimationFrame: fn => { pending.set(++serial, fn); return serial },
    cancelAnimationFrame: id => pending.delete(id),
  })
  installConversionObserver({ observationMs: 30000 })
  const observer = window.__pndConversionObservation
  t.after(() => observer.retain())
  const display = () => {
    scene.renderer.info.render.frame++
    const callbacks = [...pending.values()]; pending.clear()
    for (const fn of callbacks) fn()
  }
  for (let i = 0; i < 164; i++) {
    advanceGame(world, clock, 1 / 12)
    advanceGame(control, controlClock, 1 / 12)
    display()
  }
  assert.equal(world.turn, 164)
  assert.equal(observer.result.birth.turn, 157)
  scene.fxMeshes.set(observer.result.birth.id, { visible: false, userData: {} })
  advanceGame(world, clock, 2 / 12)
  advanceGame(control, controlClock, 2 / 12)
  assert.equal(world.turn, 166)
  assert.equal(observer.result.removal.turn, 165)
  assert.equal(observer.result.done, false)
  scene.fxMeshes.clear()
  display()
  const result = observer.retain()
  assert.equal(result.error, null)
  assert.equal(result.terminal.turn, 166)
  assert.equal(result.terminal.reason, 'rendered-expiry')
  assert.equal(result.removal.turn - result.birth.turn, 8)
  assert.deepEqual(result.logical.map(s => s.turn), [157, 158, 159, 160, 161, 162, 163, 164, 165])
  assert.equal(result.restored, true)
  assert.equal(clock.afterTurn, original)
  assert.equal(clock.animationFrame, controlClock.animationFrame)
  assert.deepEqual(world, control, 'observation must preserve the complete production world')
})


test('armed Convert observer stays read-only at paused turn zero and covers the first running turn', t => {
  const f = observerFixture(t, { armed: true }), before = structuredClone(f.world)
  f.frame(); f.frame()
  assert.equal(f.observer.result.error, null)
  assert.equal(f.observer.result.phase, 'armed')
  assert.equal(f.observer.result.firstRunningTurn, null)
  assert.deepEqual(f.world, before)
  // Supplied test input models the public Resume action, not observer mutation.
  f.world.paused = false
  f.frame()
  assert.equal(f.observer.result.phase, 'armed', 'RAF cannot invent a fixed-turn transition')
  for (let turn = 1; turn <= 164; turn++) { f.turn(turn); f.frame() }
  f.turn(165); f.turn(166); f.frame()
  const result = f.observer.retain()
  assert.equal(result.error, null)
  assert.deepEqual(result.armedAt, { turn: 0, paused: true })
  assert.equal(result.firstRunningTurn, 1)
  assert.equal(result.observedTurns, 166)
  assert.equal(result.lastObservedTurn, 166)
  assert.equal(result.removal.turn, 165)
  assert.equal(result.terminal.turn, 166)
  assert.equal(result.restored, true)
})

test('armed observer rejects an unobserved first turn and later pause without overwriting callbacks', async t => {
  await t.test('skipped first callback', t => {
    const f = observerFixture(t, { armed: true })
    f.world.paused = false; f.turn(2)
    assert.match(f.observer.result.error, /missed an ordinary turn/)
    assert.equal(f.clock.afterTurn, f.original)
  })
  await t.test('pause after running begins', t => {
    const f = observerFixture(t, { armed: true })
    f.world.paused = false; f.turn(1)
    f.world.paused = true; f.frame()
    assert.match(f.observer.result.error, /must remain running/)
    assert.equal(f.clock.afterTurn, f.original)
  })
  await t.test('arming must start actually paused at zero', t => {
    const f = observerFixture(t)
    f.observer.retain()
    assert.throws(() => installConversionObserver({ observationMs: 30000, armed: true }), /paused turn-zero/)
    assert.equal(f.clock.afterTurn, f.original)
  })
})

test('public armed resume observes advisory behavior instead of assuming dismissal resumes', async t => {
  for (const [visible, dismissResumes] of [[true, true], [true, false], [false, false]]) {
    await t.test(`visible=${visible}, dismissal resumes=${dismissResumes}`, async t => {
      const scene = startupScene(), world = scene.world, actions = [], report = {}
      world.paused = true
      browserGlobals(t, { window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
        document: { visibilityState: 'visible', querySelector: () => null } })
      const page = {
        evaluate: async fn => fn(),
        locator(selector) {
          assert.equal(selector, '.desktop-recommendation')
          return { isVisible: async () => visible,
            getByRole(role, options) {
              assert.equal(role, 'button'); assert.match('Continue anyway ↗', options.name)
              return { click: async () => { actions.push('advisory'); if (dismissResumes) world.paused = false } }
            } }
        },
        getByRole(role, options) {
          assert.equal(role, 'button'); assert.deepEqual(options, { name: 'Resume game', exact: true })
          return { click: async () => { assert.equal(world.paused, true); actions.push('resume'); world.paused = false } }
        },
        waitForFunction: async fn => { assert.equal(fn(), true) },
      }
      await resumeArmedConversion(page, report)
      assert.deepEqual(actions, visible ? dismissResumes ? ['advisory'] : ['advisory', 'resume'] : ['resume'])
      assert.equal(report.resume.after.paused, false)
      assert.equal(world.turn, 0, 'helper does not drive simulation')
    })
  }
})

test('narrow-start witness arms before public resume and retains post-flyby camera focus', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/spell-conversion.mjs', import.meta.url), 'utf8')
  const flow = source.slice(source.indexOf('export default async function'))
  assert.match(flow, /width: 899, height: 720/)
  assert.match(flow, /setViewportSize\(\{ width: 960, height: 720 \}\)/)
  assert.ok(flow.indexOf('await page.evaluate(installConversionObserver') < flow.indexOf('await resumeArmedConversion'))
  assert.ok(flow.indexOf('await resumeArmedConversion') < flow.indexOf('await waitForConversionIntroduction'))
  assert.ok(flow.indexOf('await waitForConversionIntroduction') < flow.indexOf('report.setup ='))
  assert.doesNotMatch(flow, /name: 'Pause game'/)
  assert.match(flow, /assert.equal\(report.setup.casts, 0\)/)
})
