import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { conversionLimitMs, conversionObservationMs, validateConversionObservation,
  installConversionObserver, closeConversionContext, readConversionStartup,
  waitForConversionIntroduction, setupConversionCamera } from '../scripts/tutorial-browser/spell-conversion.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { createWorld, tick, nativePosition } from '../app/model.ts'
import { createCameraMotion } from '../app/camera-motion.ts'
import { stepFlyby } from '../app/flyby.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import atlas from '../app/original-effects.json' with { type: 'json' }

await loadSceneFixture()
const { skipIntroduction, focus, captureCamera, cancelOverview, updateView } =
  await import('../app/scene-camera-runtime.ts')

function startupScene() {
  return { world: createWorld(3, 'scalable'), flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
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

function cameraScene(world) {
  const context = { RENDERER: 1, getParameter: () => 'CPU camera-owner fixture, no GPU' },
    scene = { world, cameraMotion: createCameraMotion(), cameraPreviewButtons: null,
      viewPoint: { x: 34, z: 82 }, cameraBearing: 1144 * Math.PI / 1024, viewZoom: 0,
      overviewActive: false, overviewStage: null, tooltip: { draw: 5 },
      container: { clientWidth: 960, clientHeight: 720 }, view: { update() {} },
      renderer: { getContext: () => context },
      cancelOverview: () => cancelOverview(scene), captureCamera: () => captureCamera(scene),
      updateView: () => updateView(scene), focus: point => focus(scene, point),
      height: point => nativePosition(world, point).h / 45 }
  return scene
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

test('actual focus changes only camera lightView at the failed Mission 3 startup boundary', t => {
  browserGlobals(t, { document: { documentElement: { clientWidth: 960 } } })
  const world = pausedStartupWorld(), scene = cameraScene(world)
  scene.updateView()
  const before = structuredClone(world)
  scene.focus({ x: -45, z: -91 })
  assert.equal(before.mode, null, 'world creation already initializes mode; undefined is not the defect')
  assert.equal(world.mode, null)
  assert.deepEqual(Object.keys(world).filter(key => !isDeepStrictEqual(before[key], world[key])), ['lightView'])
  assert.deepEqual(before.lightView, { x: 10752, y: -23040, h: 128 })
  assert.deepEqual(world.lightView, { x: -9472, y: 21248, h: 116 })
  assert.deepEqual(scene.viewPoint, { x: -45, z: -91 })
  assert.equal(world.turn, 71)
  assert.equal(world.spellCasts[2][17], 0)
})

test('conversion camera permits exact focus-owned changes and rejects every other World mutation', t => {
  browserGlobals(t, { window: {}, document: { documentElement: { clientWidth: 960 } } })
  const baseline = pausedStartupWorld()
  const run = (afterFocus = () => {}, mode = null) => {
    const world = structuredClone(baseline), scene = cameraScene(world)
    world.mode = mode
    scene.updateView()
    scene.focus = point => { focus(scene, point); afterFocus(world) }
    window.testSceneRef = { current: scene }
    window.testStore = { getWorld: () => world }
    return setupConversionCamera(checkpointCodec)
  }
  const report = run()
  assert.equal(report.turn, 71)
  assert.equal(report.casts, 0)
  assert.equal(report.stock, 1)
  assert.deepEqual(report.cameraWorldChanges.mode, { before: null, after: null })
  assert.deepEqual(report.cameraWorldChanges.lightView.after, { x: -9472, y: 21248, h: 116 })
  assert.deepEqual(run(undefined, 'blast').cameraWorldChanges.mode, { before: 'blast', after: null },
    'ordinary focus may cancel a selected UI mode, never restore or inject it afterward')
  for (const mutate of [
    w => { w.turn++ },
    w => { w.randomState++ },
    w => { w.cosmeticRandom.randomState++ },
    w => { w.units[0].hp-- },
    w => { w.land.heights[0]++ },
    w => { w.manaWorld.spells[2].stocks[17]++ },
    w => { w.buildingFootprints.set(-1, { cells: new Set([123]) }) },
    w => { w.addedUndefined = undefined },
  ]) assert.throws(() => run(mutate), /non-camera world state/)
  for (const mutate of [
    w => { w.mode = 'blast' },
    w => { w.lightView.x++ },
    w => { w.lightView.h++ },
    w => { w.lightView.unexpected = undefined },
  ]) assert.throws(() => run(mutate), /expected mode\/light-view changes/)
  assert.doesNotMatch(setupConversionCamera.toString(), /w\.(?:mode|lightView)\s*=(?!=)/,
    'the checker cannot repair or hide a production camera mutation')
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
  return { error: null, bornTurn: 157,
    birth: { id: 9, targetId: 10, casts: 1, stock: 0, team: 'yellow', kind: 'brave',
      remaining: 8, linkedCount: 1, birthSubstitute: false, cue5: true, x: -45, z: -91 },
    terminal: { reason: 'logical-expiry', turn: 165, present: false, meshPresent: false, remaining: 0 },
    samples: [first, second, { ...second, turn: 161, object: 0x650, visible: false }],
    crops: [first, second].map(s => ({ filename: s.cropFile, frame: s.frame, turn: s.turn, stamp: s.stamp, colors: 10 })) }
}

test('bounded conversion validator rejects wrong art, stale crops, missed motion and late expiry', () => {
  validateConversionObservation(observation(), atlas)
  for (const corrupt of [
    o => { o.samples[0].object = 1441 },
    o => { o.samples[0].uv[2] = 0 },
    o => { o.crops[0].stamp++ },
    o => { o.samples[1].x = -45 },
    o => { o.terminal.turn++ },
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
  const f9 = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
  assert.match(f9, /55000/)
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
