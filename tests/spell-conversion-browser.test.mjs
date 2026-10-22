import { withoutCampaignPopup } from './support/world-input-page.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { conversionLimitMs, conversionObservationMs, validateConversionObservation,
  installConversionObserver, closeConversionContext, readConversionStartup,
  waitForConversionIntroduction, setupConversionCamera, resumeArmedConversion } from '../scripts/tutorial-browser/spell-conversion.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { spellTestLimitMs } from '../scripts/tutorial-browser/spell-test-menu.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { createWorld, tick, nativePosition } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
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

test('conversion startup waits for the native flyby gate before Space and input readiness', async t => {
  for (const initialTurn of [0, 16, 20]) {
    await t.test(`bind at turn ${initialTurn}`, async t => {
      const scene = startupScene(), world = scene.world, calls = [], report = {}
      for (let turn = 0; turn < initialTurn; turn++) advanceStartup(scene)
      browserGlobals(t, {
        window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
        document: { visibilityState: 'visible', querySelector: selector => {
          assert.equal(selector, '.loading-world', 'there is no invented Skip DOM control')
          return null
        } },
      })
      const page = {
        evaluate: async (read,arg) => read(arg),
        keyboard: { press: async key => {
          assert.equal(key, 'Space')
          assert.equal(world.inputMask & 64, 64, 'early Space must not pause turn-zero startup')
          assert.equal(world.flyby.flags & 0x51, 0x11)
          calls.push('press')
          skipIntroduction(scene) // Unit keyboard boundary, not browser-controller injection.
        } },
        async waitForFunction(predicate) {
          const phase = calls.length ? 'wait-input' : 'wait-flyby'
          calls.push(phase)
          if (initialTurn === 0 && phase === 'wait-flyby')
            assert.equal(predicate(), false, 'initial unlocked input cannot bypass authored startup')
          for (let turn = 0; turn < 60 && !predicate(); turn++) advanceStartup(scene)
          assert.equal(Boolean(predicate()), true, 'ordinary presentation owns introduction completion')
          return { jsonValue: async () => predicate(), dispose: async () => {} }
        },
      }
      await waitForConversionIntroduction(withoutCampaignPopup(page), report)
      assert.deepEqual(calls, ['wait-flyby', 'wait-input', 'press', 'wait-input'])
      assert.equal(report.startup.bound.skipAvailable, initialTurn >= 16)
      assert.equal(report.startup.beforeSkip.flybyFlags & 0x51, 0x11)
      assert.equal(report.startup.beforeSkip.skipAvailable, true)
      assert.equal(report.startup.afterSkip.inputMask, 0)
      assert.equal(report.startup.afterSkip.casts, 0)
      assert.equal(report.startup.afterSkip.stock, 1)
      assert.equal(world.paused, false, 'the single introductory Space never toggles pause')
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
  assert.equal(snapshot.skipAvailable, false)
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
      y: point => nativePosition(world, point).h / 45 }
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
function observerFixture(t, { expiry = 165, callback, armed = false, baselineTurn = 0 } = {}) {
  const target = { id: 10, team: 'yellow', kind: 'brave', x: -45, z: -91 },
    flash = { id: 9, startConversionLink: 10, turnsRemaining: 8, x: -45, z: -91,
      animation: { object: 0x650, f1: 0 } },
    world = { turn: armed ? baselineTurn : 156, paused: armed, speed: 1, effects: [], units: [target],
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
  installConversionObserver({ observationMs: 30000, armed, baselineTurn })
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
  await t.test('arming must start at the actual frozen baseline', t => {
    const f = observerFixture(t)
    f.observer.retain()
    assert.throws(() => installConversionObserver({ observationMs: 30000, armed: true }), /measured paused baseline/)
    assert.equal(f.clock.afterTurn, f.original)
  })
})

test('nonzero measured baseline retains every first/subsequent fixed turn and the exact eight-turn conversion lifetime', t => {
  const f=observerFixture(t,{armed:true,baselineTurn:37}), before=structuredClone(f.world)
  f.frame();assert.deepEqual(f.world,before)
  f.world.paused=false
  for(let turn=38;turn<=164;turn++){f.turn(turn);f.frame()}
  f.turn(165);f.turn(166);f.frame()
  const result=f.observer.retain()
  assert.equal(result.error,null);assert.deepEqual(result.armedAt,{turn:37,paused:true})
  assert.equal(result.firstRunningTurn,38);assert.equal(result.observedTurns,129)
  assert.equal(result.lastObservedTurn,166);assert.equal(result.removal.turn-result.birth.turn,8)
  assert.equal(result.restored,true)
})

test('nonzero armed baseline still rejects skipped first and subsequent turns', async t => {
  for(const skipFirst of [true,false])await t.test(`skipFirst=${skipFirst}`,t=>{
    const f=observerFixture(t,{armed:true,baselineTurn:37})
    f.world.paused=false
    if(!skipFirst)f.turn(38)
    f.turn(skipFirst?39:40)
    assert.match(f.observer.result.error,/missed (?:an ordinary|a fixed) turn/)
    assert.equal(f.clock.afterTurn,f.original)
  })
})

test('public armed resume uses only native Space and never toggles an already running world', async t => {
  for (const paused of [true, false]) {
    await t.test(`paused=${paused}`, async t => {
      const scene = startupScene(), world = scene.world, actions = [], report = {}
      world.paused = paused
      browserGlobals(t, { window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
        document: { visibilityState: 'visible', querySelector: selector => {
          assert.equal(selector, '.loading-world')
          return null
        } } })
      const page = {
        evaluate: async fn => fn(),
        keyboard: { press: async key => { assert.equal(key, 'Space'); assert.equal(world.paused, true); actions.push('resume'); world.paused = false } },
        waitForFunction: async fn => { assert.equal(fn(), true); actions.push('running') },
      }
      await resumeArmedConversion(withoutCampaignPopup(page), report)
      assert.deepEqual(actions, paused ? ['resume', 'running'] : ['running'])
      assert.deepEqual(report.resume.actions, paused ? ['native-space-resume'] : [])
      assert.equal(report.resume.before.paused, paused)
      assert.equal(report.resume.after.paused, false)
      assert.equal(world.turn, 0, 'helper does not drive simulation')
    })
  }
})

test('public armed resume cannot treat rejected or ineffective input as a running observation', async t => {
  for (const mode of ['rejected', 'ineffective']) {
    await t.test(mode, async t => {
      const scene = startupScene(), world = scene.world, report = {}, calls = []
      world.paused = true
      browserGlobals(t, { window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
        document: { visibilityState: 'visible', querySelector: () => null } })
      const failure = Error('Resume rejected')
      await assert.rejects(resumeArmedConversion(withoutCampaignPopup({
        evaluate: async fn => fn(),
        keyboard: { press: async key => { assert.equal(key, 'Space'); calls.push('resume'); if (mode === 'rejected') throw failure } },
        waitForFunction: async fn => { calls.push('wait'); assert.equal(fn(), false); throw Error('Still paused') },
      }), report), mode === 'rejected' ? error => error === failure : /requested pause state/)
      assert.deepEqual(calls, ['resume'])
      assert.equal(world.paused, true)
      assert.equal(report.resume.after, undefined)
    })
  }
})

test('public measured baseline arms before resume and retains frozen post-flyby camera focus', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/spell-conversion.mjs', import.meta.url), 'utf8')
  const flow = source.slice(source.indexOf('export default async function'))
  assert.match(flow, /width: 960, height: 720/)
  assert.doesNotMatch(flow, /899|narrowStart|setViewportSize/)
  assert.ok(flow.indexOf('await page.evaluate(installConversionObserver') < flow.indexOf('await resumeArmedConversion'))
  assert.ok(flow.indexOf('await waitForConversionIntroduction') < flow.indexOf('await pauseConversionBaseline'))
  assert.ok(flow.indexOf('await pauseConversionBaseline') < flow.indexOf('await page.evaluate(installConversionObserver'))
  assert.ok(flow.indexOf('report.setup =') < flow.indexOf('await resumeArmedConversion'))
  assert.match(flow, /assert.equal\(report.setup.turn, report.pausedBaseline.turn/)
  assert.ok(flow.indexOf('await waitForConversionIntroduction') < flow.indexOf('report.setup ='))
  assert.doesNotMatch(flow, /name: 'Pause game'/)
  assert.match(flow, /assert.equal\(report.setup.casts, 0\)/)
})
