import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import {
  beginCameraVisit, applyCameraShake, endCameraVisit, displayedTribeCamera,
  withSimulationCamera, initializeTribeCamera, requestCameraShake,
  requireCameraContinuation, flybyCamera,
} from '../app/tribe-camera.ts'
import { createGameStore } from '../app/game-store.ts'
import { stepFlyby, flybyCommand } from '../app/flyby.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const nop = () => {}

test('camera initialization is per tribe and cannot reseed a loaded Shaman-less owner', () => {
  const w = createWorld()
  assert.ok(w.cameras.tribes.every(p => p.initialized))
  assert.notDeepEqual(w.cameras.tribes[0], w.cameras.tribes[1])
  const p = w.cameras.tribes[1]
  p.x = 12345
  const before = structuredClone(p)
  initializeTribeCamera(p, undefined, 0)
  assert.deepEqual(p, before)
})

test('native shake brackets the same mutable pose; focus commits 197 and displays 200', () => {
  const w = createWorld(), c = w.cameras, seen = []
  Object.assign(c.tribes[0], { x: 100, y: 100, angle: 0 })
  Object.assign(c.shake, { active: true, amplitude: 8 })
  w.randomState = 75 // Retained 0047f510 formula gives signed X byte +3.
  w.pendingTime = 1 / 24
  const other = structuredClone(c.tribes[1])
  const clock = {
    animationTime: 0, animationFrame: 0,
    beforeTurn() { seen.push(c.tribes[0].x); c.tribes[0].x = 150 },
    afterTurn() { seen.push(c.tribes[0].x) },
    camera: {
      pre: nop, elapsed: nop, zoom: nop,
      post() { c.tribes[0].x = 200; seen.push(c.tribes[0].x) },
    },
  }
  advanceGame(w, clock, 1 / 24)
  assert.deepEqual(seen, [103, 150, 200])
  assert.equal(c.tribes[0].x, 197)
  assert.equal(displayedTribeCamera(c, 0).x, 200)
  assert.deepEqual(c.tribes[1], other)
  assert.equal(c.phase, 'idle')
})

test('off-grid direct simulation borrows held correction without consuming camera work', () => {
  const w = createWorld(), c = w.cameras
  Object.assign(c.tribes[0], { x: 197, y: 100, angle: 0 })
  c.held[0].x = 3
  Object.assign(c.shake, { active: true, pending: true, amplitude: 48 })
  const shake = structuredClone(c.shake), motion = structuredClone(c.motion)
  tick(w, 1 / 12, {
    beforeTurn() { assert.equal(c.tribes[0].x, 200); c.tribes[0].x = 225 },
    afterTurn() { assert.equal(c.tribes[0].x, 225) },
  })
  assert.equal(c.tribes[0].x, 222)
  assert.equal(displayedTribeCamera(c, 0).x, 225)
  assert.deepEqual(c.shake, shake)
  assert.deepEqual(c.motion, motion)
  assert.equal(c.time, 0)
  assert.throws(() => withSimulationCamera(c, () => { c.tribes[0].x = 300; throw Error('body') }), /body/)
  assert.equal(c.tribes[0].x, 297)
  assert.equal(c.phase, 'idle')
})

test('shake keeps byte offsets, pending flags and amplitude as distinct native owners', () => {
  const w = createWorld(), c = w.cameras, p = c.tribes[0]
  Object.assign(p, { x: 100, y: 200, angle: 400 })
  Object.assign(c.shake, { active: true, amplitude: 0 })
  Object.assign(c.shake.bytes, { x: 3, y: -2, angle: 5 })
  beginCameraVisit(c)
  applyCameraShake(c, 0, 0, 75)
  assert.equal(p.x, 100, 'zero amplitude does not apply an offset')
  endCameraVisit(c, 0)
  assert.equal(p.x, 97, 'active cleanup still subtracts retained bytes')
  assert.equal(p.angle, 395)
  requestCameraShake(c, 32)
  beginCameraVisit(c)
  endCameraVisit(c, 0)
  assert.equal(c.shake.active, true)
  beginCameraVisit(c)
  applyCameraShake(c, 0, 2, 75)
  endCameraVisit(c, 0)
  assert.equal(c.shake.amplitude, 32, 'globe early return retains pending amplitude')
  assert.equal(c.shake.active, false)
  assert.equal(c.held[0].x, 0)
  c.shake.active = true
  c.shake.amplitude = 8
  const gameSeed = w.randomState
  beginCameraVisit(c)
  applyCameraShake(c, 0, 0, w.randomState)
  assert.equal(c.shake.bytes.angle, 5, 'small amplitude retains the old angle byte')
  endCameraVisit(c, 0)
  assert.equal(w.randomState, gameSeed, 'shake uses local RNG only')
})

test('flyby and interruption adapters share tribe pose across clone and synchronous writes', () => {
  const w = createWorld(), c = w.cameras, p = c.tribes[0]
  const view = flybyCamera(c, 0)
  view.x = -1
  view.angle = 2050
  assert.equal(p.x, 65535)
  assert.equal(p.angle, 2)
  // Use the actual timeline owner; no second pose can overwrite a synchronous
  // writer during its warmup visit.
  flybyCommand(w.flyby, 1205, [])
  flybyCommand(w.flyby, 1206, [])
  p.x = 200
  stepFlyby(w.flyby, view, 24)
  assert.equal(p.x, 200)
  const loaded = structuredClone(w)
  flybyCamera(loaded.cameras, 0).x = 301
  assert.equal(loaded.cameras.tribes[0].x, 301)
  assert.equal(p.x, 200)
  assert.equal(loaded.flyby.warmup, 5)
})

test('current checkpoint retains camera continuation and rejects malformed owners before replacement', async () => {
  const store = createGameStore(), w = store.getWorld(), c = w.cameras
  c.tribes[0].x = 197
  c.held[0].x = 3
  c.time = 0.017
  c.navigationTime = 0.003
  c.elapsed = 0.5
  c.input = { time: 0.497, cursor: 8, buttons: 1 }
  c.keys.add('w')
  requestCameraShake(c, 48)
  const before = structuredClone(c)
  await store.saveCheckpoint()
  c.tribes[0].x = 900
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld().cameras, before)
  for (const damage of [
    x => { x.motion = {} }, x => { x.held[0] = {} },
    x => { x.motion.moves.pop() }, x => { x.result.phase = 9 },
    x => { x.tribes[0].x = NaN }, x => { x.navigationTime = -1 },
    x => { x.phase = 'simulation' }, x => { x.input = {} },
    x => { x.viewTransition = {} }, x => { x.viewPreset = 9 },
    x => { x.overviewReturn.preset = 9 }, x => { x.motion.frame = 4 },
    x => { x.globeMorph.duration = 0 }, x => { x.globeMorph.frame = 8 },
  ]) {
    const invalid = structuredClone(before)
    damage(invalid)
    assert.throws(() => requireCameraContinuation(invalid), RangeError)
  }
})

test('HUD changes drain old timing before mutation; saving and stale bindings cannot advance it', async () => {
  const store = createGameStore(), world = store.getWorld(), seen = []
  const old = store.bindPresentation(world)
  old.bindInputClock(() => seen.push(world.speed))
  store.change(w => { w.speed = 2 })
  assert.deepEqual(seen, [1])
  await store.saveCheckpoint()
  assert.deepEqual(seen, [1], 'save captures a quiescent boundary without advancing time')
  const next = store.bindPresentation(world)
  store.change(w => { w.speed = 1 })
  assert.deepEqual(seen, [1], 'replacement binding revokes the old clock immediately')
  next.bindInputClock(() => seen.push(world.speed))
  old.release()
  store.change(w => { w.speed = 2 })
  assert.deepEqual(seen, [1, 1])
  store.restart()
  store.change(w => { w.speed = 2 })
  assert.deepEqual(seen, [1, 1], 'replaced world cannot use the old Scene clock')
})

// Actual production camera functions, with DOM/projection/audio leaves supplied.
// This is caller coverage; the separate browser witness must inspect pixels.
async function cameraScene(world = createWorld()) {
  await loadSceneFixture()
  const runtime = await import('../app/scene-camera-runtime.ts')
  const scene = { world, tooltip: { draw: 0 }, previous: 0,
    skyRemainder: 0, cameraPreviewButtons: null, viewPoint: { x: 0, z: 0 }, cameraBearing: 0,
    updateView: nop, commitSky: nop, updateTooltipController: nop,
    advanceInputTime: nop, onSound: nop, onChange: nop,
    camera: { up: { set: nop } }, globe: { moveStars: nop },
    container: { clientHeight: 800 }, acquireForcedTooltip: nop,
  }
  const fields = { cameraTime: 'time', cameraMotion: 'motion', cameraVelocity: 'velocity',
    resultCamera: 'result', resultTurn: 'resultTurn', resultRequest: 'resultRequest',
    overviewActive: 'overviewActive', overviewStage: 'overviewStage', overviewReturn: 'overviewReturn',
    viewTransition: 'viewTransition', viewPreset: 'viewPreset', viewZoom: 'viewZoom',
    globeMotion: 'globeMotion', globeMorph: 'globeMorph', globePointer: 'globePointer',
    wasFlying: 'wasFlying', levelStartCameraSeeded: 'levelStartSeeded', cameraBookmarks: 'bookmarks',
    keys: 'keys',
  }
  for (const [field, owner] of Object.entries(fields))
    Object.defineProperty(scene, field, { get: () => world.cameras[owner], set: v => { world.cameras[owner] = v } })
  Object.defineProperty(scene, 'cameraPosition', { get: () => world.cameras.tribes[0] })
  Object.defineProperty(scene, 'flybyCamera', { get: () => flybyCamera(world.cameras, 0) })
  for (const method of ['captureCamera', 'cancelOverview', 'previewCamera', 'stepViewChange'])
    scene[method] = (...args) => runtime[method](scene, ...args)
  scene.advanceInputTime = () => runtime.previewGroundZoom(scene)
  const clock = {
    get animationTime() { return world.cameras.animationTime },
    set animationTime(n) { world.cameras.animationTime = n },
    get animationFrame() { return world.cameras.animationFrame },
    set animationFrame(n) { world.cameras.animationFrame = n },
    camera: {
    pre: () => runtime.preCameraVisit(scene), post: zoom => runtime.postCameraVisit(scene, zoom),
    zoom: () => scene.stepViewChange(), elapsed: nop,
    sampleZoom: () => runtime.previewGroundZoom(scene),
  } }
  return { scene, clock, runtime }
}

test('one millisecond key press consumes only its timestamped duration and appears before a camera tick', async () => {
  const { scene, clock, runtime } = await cameraScene(), w = scene.world, c = w.cameras
  w.speed = 0
  w.inputMask = 0
  w.flyby.flags = 0
  Object.assign(c.tribes[0], { x: 10000, y: 10000, angle: 0 })
  advanceGame(w, clock, 0.035)
  scene.captureCamera()
  c.input.buttons = 1
  advanceGame(w, clock, 0.001)
  runtime.updateCameraMotion(scene)
  assert.notDeepEqual(scene.viewPoint, { x: 10000 / 256 - 8, z: -10000 / 256 - 8 })
  scene.captureCamera()
  c.input.buttons = 0
  assert.ok(Math.abs(c.tribes[0].y - 10000) <= 8)
  assert.ok(Math.abs(c.tribes[0].y - 10000) >= 7)
  assert.ok(Math.abs(c.time - 0.036) < 1e-12, 'input cannot shift camera deadlines')
  const afterInput = { ...c.tribes[0] }
  advanceGame(w, clock, 1 / 24 - 0.036)
  assert.deepEqual(c.tribes[0], afterInput)
})

test('bookmark reads do not advance focus; cancelling overview restores authoritative heading and draw mode', async () => {
  const { scene, runtime } = await cameraScene(), c = scene.world.cameras
  scene.world.inputMask = 0
  scene.world.flyby.flags = 0
  const { requestCameraFocus } = await import('../app/camera-motion.ts')
  requestCameraFocus(c.motion, scene.cameraPosition, { x: 15000, y: 14000, angle: 1000 })
  c.time = 0.02
  const before = structuredClone(c)
  runtime.cameraBookmark(scene, 0, true)
  assert.deepEqual(c.motion, before.motion)
  assert.deepEqual(c.tribes, before.tribes)
  assert.equal(c.time, before.time)
  c.overviewActive = true
  c.overviewReturn.bearing = Math.PI / 2
  scene.world.drawMode = 2
  runtime.cancelOverview(scene)
  assert.equal(scene.cameraPosition.angle, 512)
  assert.equal(scene.world.drawMode, 0)
})

test('timestamped camera/simulation results survive refresh grouping, off-grid speeds, pause and fresh owner continuation', async () => {
  const events = [
    [0.035, 'buttons', 1], [0.036, 'buttons', 0],
    [0.123, 'buttons', 1], [0.243, 'buttons', 17], [0.421, 'buttons', 0],
    [0.522, 'focus'], [0.633, 'speed', 1.7], [0.723, 'pause', true],
    [0.812, 'shake', 48], [0.813, 'checkpoint'],
    [1.011, 'pause', false], [1.113, 'speed', 0.37],
    [1.223, 'buttons', 32], [1.447, 'buttons', 0],
  ]
  const schedules = [[1 / 30], [1 / 60], [1 / 120], [1 / 144], [0.107, 0.003, 0.237, 0.011]]
  const results = []
  for (const restore of [false, true]) for (const schedule of schedules) {
    let fixture = await cameraScene()
    let w = fixture.scene.world, now = 0, frame = 0, event = 0, nextFrame = schedule[0]
    const turns = []
    w.flyby.flags = 0
    w.inputMask = 0
    const observe = () => {
      fixture.clock.beforeTurn = () => turns.push([
        Number(w.cameras.elapsed.toFixed(9)), w.cameras.tribes[0].x,
        w.cameras.tribes[0].y, w.cameras.tribes[0].angle,
      ])
    }
    observe()
    while (now < 1.75 - 1e-10) {
      const untilEvent = events[event]?.[0] ?? Infinity,
        target = Math.min(1.75, nextFrame, untilEvent)
      advanceGame(w, fixture.clock, Math.max(0, target - now))
      now = target
      if (now === untilEvent) {
        const [, kind, value] = events[event++]
        const c = w.cameras
        if (kind === 'buttons') {
          fixture.scene.captureCamera(!!(value & 15))
          c.input.buttons = value
          c.input.time = c.elapsed
          c.input.cursor++
        } else if (kind === 'focus') fixture.runtime.focus(fixture.scene, { x: 12, z: 20 }, { animate: true })
        else if (kind === 'speed') w.speed = value
        else if (kind === 'pause') w.paused = value
        else if (kind === 'shake') requestCameraShake(c, value)
        else if (restore) {
          requireCameraContinuation(c)
          w = structuredClone(w)
          fixture = await cameraScene(w)
          observe()
        }
      }
      if (now === nextFrame) {
        const before = structuredClone(w.cameras)
        fixture.runtime.updateCameraMotion(fixture.scene)
        // Display prediction may retain zoom preview bookkeeping, but this
        // scenario has no zoom: authoritative state must be wholly unchanged.
        assert.deepEqual(w.cameras, before)
        nextFrame += schedule[++frame % schedule.length]
      }
    }
    const c = structuredClone(w.cameras)
    for (const key of ['elapsed', 'time', 'navigationTime', 'animationTime'])
      c[key] = Number(c[key].toFixed(9))
    c.input.time = Number(c.input.time.toFixed(9))
    results.push({ turns, c, turn: w.turn, seed: w.randomState })
  }
  for (const result of results) assert.deepEqual(result, results[0])
  assert.ok(results[0].turns.some(([time]) => Math.abs(time * 24 - Math.round(time * 24)) > 1e-6),
    'exercise actual off-grid simulation deadlines')
})


test('moving flyby precedes shaken simulation; same-visit focus survives cleanup', async () => {
  const { scene, clock } = await cameraScene(), w = scene.world, c = w.cameras
  const { requestCameraFocus } = await import('../app/camera-motion.ts')
  w.speed = 0
  w.inputMask = 0
  Object.assign(c.tribes[0], { x: 10000, y: 10000, angle: 0 })
  flybyCommand(w.flyby, 1205, [])
  flybyCommand(w.flyby, 1209, [60, 60, 0, 18])
  flybyCommand(w.flyby, 1206, [])
  advanceGame(w, clock, 8 / 24)
  const previous = c.tribes[0].x
  assert.equal(w.flyby.flags & 1, 1)
  const expected = { ...scene.flybyCamera }, timeline = structuredClone(w.flyby)
  stepFlyby(timeline, expected, 24)
  assert.notEqual(expected.x & 65535, previous, 'exercise a nonzero moving track')
  w.randomState = 75
  Object.assign(c.shake, { active: true, amplitude: 8 })
  w.pendingTime = 1 / 24
  w.speed = 1
  const seen = []
  clock.beforeTurn = () => {
    seen.push(c.tribes[0].x)
    c.tribes[0].x = 197
    requestCameraFocus(c.motion, c.tribes[0], { ...c.tribes[0], x: 200 })
  }
  clock.afterTurn = () => { seen.push(c.tribes[0].x) }
  advanceGame(w, clock, 1 / 24)
  assert.deepEqual(seen, [((expected.x & 65535) + 3) & 65535, 197])
  assert.equal(c.tribes[0].x, 197, 'post-phase focus200 minus retained shake3')
  assert.equal(displayedTribeCamera(c, 0).x, 200)
  assert.equal(c.motion.active, 0)
  assert.equal(w.flyby.frame, timeline.frame, 'exactly one flyby controller visit')
  const beforePause = structuredClone(w.flyby)
  w.paused = true
  advanceGame(w, clock, 1 / 24)
  assert.deepEqual(w.flyby, beforePause, 'ordinary pause retains flyby continuation')
})

test('zoom and overview continuation retain their deadlines across frame grouping and a fresh owner', async () => {
  const { cameraPreset } = await import('../app/projection.ts')
  const schedules = [[1 / 30], [1 / 144], [0.107, 0.003, 0.237, 0.011]], results = []
  for (const restore of [false, true]) for (const schedule of schedules) {
    const attach = async world => {
      const f = await cameraScene(world), { scene, runtime } = f
      scene.view = { config: cameraPreset(0) }
      scene.currentPreset = () => cameraPreset(0, scene.viewPreset)
      scene.updateView = () => {
        scene.view.config = scene.viewTransition?.preview ?? scene.viewTransition?.config ?? scene.currentPreset()
      }
      for (const method of ['startGroundView', 'overview', 'leaveOverview'])
        scene[method] = (...args) => runtime[method](scene, ...args)
      scene.updateView()
      return f
    }
    let f = await attach(createWorld()), w = f.scene.world
    w.flyby.flags = 0; w.inputMask = 0; w.speed = 0
    f.runtime.zoom(f.scene, false)
    const events = [[0.35, 'reverse'], [0.52, 'overview'], [1.8, 'leave'], [2.2, 'save']]
    let now = 0, event = 0, frame = 0, nextFrame = schedule[0]
    const visits = []
    while (now < 3.3 - 1e-10) {
      const nextEvent = events[event]?.[0] ?? Infinity, target = Math.min(3.3, nextFrame, nextEvent)
      advanceGame(w, f.clock, target - now); now = target
      if (now === nextEvent) {
        const kind = events[event++][1]
        if (kind === 'reverse') f.runtime.zoom(f.scene, true)
        if (kind === 'overview') {
          if (restore) { w = structuredClone(w); f = await attach(w) }
          // A replacement Scene and a delayed paint both start with a stale cache.
          f.scene.view.config = cameraPreset(0, 3)
          f.runtime.overview(f.scene)
        }
        if (kind === 'leave') {
          assert.equal(w.cameras.overviewActive, true)
          f.runtime.leaveOverview(f.scene, 0)
        }
        if (kind === 'save') {
          assert.equal(w.cameras.overviewStage, 'exit')
          assert.ok(w.cameras.viewTransition?.angle, 'restore mid return-heading transition')
          requireCameraContinuation(w.cameras)
          if (restore) { w = structuredClone(w); f = await attach(w) }
        }
        visits.push(structuredClone(w.cameras))
      }
      if (now === nextFrame) {
        f.runtime.updateCameraMotion(f.scene)
        nextFrame += schedule[++frame % schedule.length]
      }
    }
    assert.equal(w.cameras.viewTransition, null)
    assert.equal(w.cameras.overviewStage, null)
    assert.equal(w.cameras.overviewActive, false)
    const canonical = c => {
      c = structuredClone(c)
      for (const key of ['elapsed', 'time', 'navigationTime', 'animationTime']) c[key] = Number(c[key].toFixed(9))
      // A rendered prediction is not the transition's authoritative config.
      if (c.viewTransition) {
        c.viewTransition.time = Number(c.viewTransition.time.toFixed(9))
        c.viewTransition.previewStartTime = Number(c.viewTransition.previewStartTime.toFixed(9))
        delete c.viewTransition.preview
        delete c.viewTransition.previewFraction
      }
      return c
    }
    results.push({ visits: visits.map(canonical), final: canonical(w.cameras), drawMode: w.drawMode })
  }
  for (const result of results) assert.deepEqual(result, results[0])
})

test('view retargeting samples the old owner and result selection precedes a coincident zoom visit', async () => {
  const { cameraPreset } = await import('../app/projection.ts')
  const { scene, clock, runtime } = await cameraScene(), w = scene.world
  w.flyby.flags = 0; w.inputMask = 0; w.speed = 0
  scene.currentPreset = () => cameraPreset(0, scene.viewPreset)
  scene.view = { config: cameraPreset(0) }
  scene.updateView = () => {
    scene.view.config = scene.viewTransition?.preview ?? scene.viewTransition?.config ?? scene.currentPreset()
  }
  scene.viewPreset = 2
  runtime.startGroundView(scene, 0)
  assert.deepEqual(scene.viewTransition.config, cameraPreset(0, 2), 'old preset, not stale renderer config')
  const config = structuredClone(scene.viewTransition.config)
  w.outcome.cameraRequest++
  advanceGame(w, clock, 1 / 24)
  assert.ok(w.inputMask & 4)
  assert.equal(scene.viewTransition.remaining, 18, 'result lock precedes this deadline’s zoom')
  assert.deepEqual(scene.viewTransition.config, config)
})

test('input, off-grid simulation and paused-result locks freeze the same zoom across paints and restore', async () => {
  const { cameraPreset } = await import('../app/projection.ts')
  for (const mode of ['input', 'simulation', 'paused-result']) {
    const results = []
    for (const restore of [false, true]) for (const schedule of [[1 / 30], [1 / 144], [0.107, 0.003, 0.237, 0.011]]) {
      const attach = async world => {
        const f = await cameraScene(world), { scene, runtime } = f
        scene.currentPreset = () => cameraPreset(0, scene.viewPreset)
        scene.view = { config: cameraPreset(0, 3) }
        scene.updateView = () => {
          scene.view.config = scene.viewTransition?.preview ?? scene.viewTransition?.config ?? scene.currentPreset()
        }
        scene.startGroundView = (...args) => runtime.startGroundView(scene, ...args)
        if (mode === 'simulation') f.clock.beforeTurn = () => {
          if (world.cameras.elapsed >= 0.5 && world.cameras.elapsed < 0.6) world.inputMask |= 128
        }
        return f
      }
      let f = await attach(createWorld()), w = f.scene.world
      w.flyby.flags = 0; w.inputMask = 0; w.speed = mode === 'simulation' ? 1.3 : 0
      f.runtime.zoom(f.scene, false)
      const events = [[0.35, 'reverse'], [0.517, 'lock'], [0.6, 'save'], [0.689, 'retarget']]
      let now = 0, event = 0, frame = 0, nextFrame = schedule[0]
      const snapshots = []
      while (event < events.length) {
        const target = Math.min(nextFrame, events[event][0])
        advanceGame(w, f.clock, target - now); now = target
        if (now === events[event][0]) {
          const kind = events[event++][1]
          // The production input clock samples even when elapsed time is zero.
          f.scene.advanceInputTime()
          if (kind === 'reverse') f.runtime.zoom(f.scene, true)
          if (kind === 'lock') {
            if (mode === 'input') w.inputMask |= 128
            if (mode === 'paused-result') { w.paused = true; w.outcome.cameraRequest++ }
          }
          if (kind === 'save') {
            assert.ok(w.inputMask & (mode === 'paused-result' ? 4 : 128))
            requireCameraContinuation(w.cameras)
            if (restore) { w = structuredClone(w); f = await attach(w) }
          }
          if (kind === 'retarget') {
            w.inputMask = 0; w.paused = false; w.cameras.result.active = 0
            f.scene.view.config = cameraPreset(0, 3)
            f.runtime.zoom(f.scene, false)
          }
          const transition = structuredClone(w.cameras.viewTransition)
          for (const key of ['time', 'previewStartTime', 'previewFraction'])
            transition[key] = Number(transition[key].toFixed(9))
          snapshots.push(transition)
        }
        if (now === nextFrame) {
          f.runtime.updateCameraMotion(f.scene)
          nextFrame += schedule[++frame % schedule.length]
        }
      }
      results.push(snapshots)
    }
    for (const result of results) assert.deepEqual(result, results[0], mode)
  }
})
