// Supplied callback/DOM/GL fixtures, not a browser or naturally played episode.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installMission1BuildingScreenWitness } from '../../scripts/local-render/mission1-building-screen-witness.mjs'
import { installMission1VaultCheckpointState, installMission1VaultSaveWitness,
  installMission1VaultLoadWitness } from '../../scripts/local-render/mission1-vault-checkpoint.mjs'
import scenario, { saveMission1BuildingCheckpoint } from '../../scripts/local-render/mission1-building-screen.mjs'
import componentSmoke, { drawMission1Component } from '../../scripts/local-render/mission1-building-drawer-smoke.mjs'
import continuation, { assertMission1BuildingRestart, runMission1BuildingRestart,
  finishMission1BuildingContinuation, assertMission1SerializedCheckpoint,
  readMission1FinalHud, selectMission1CompletedCamp } from '../../scripts/local-render/mission1-building-screen-continuation.mjs'
import completion from '../../scripts/local-render/mission1-building-screen-completion.mjs'
import { armMission1BuildingSceneStart, installMission1BuildingRestartWitness } from '../../scripts/local-render/mission1-building-screen-load.mjs'
import { parseOptions } from '../../scripts/local-render/harness.mjs'

function fixture(t, { pixels = true, mutateDraw = false, initialBirth = null, skipGpu = false, skipHandoff = false, lazySurface = false, missedResume = false, mapDraw = null } = {}) {
  const rect = { x: 3, y: 260, width: 46, height: 52 }, geometry = {
    viewport: { x: 200, y: 0, width: 440, height: 480 }, origin: { x: 350, y: 180 },
    target: { x: 26, y: 286 }, targetRect: rect, targetHud: { x: 26, y: 286 }, hudScale: 1,
  }
  const world = { turn: 10, speed: 1, paused: false, mode: 'blast', unlockedCamp: false, outcome: { level: 1 },
    units: [{ id: 30, hp: 100, kind: 'shaman', team: 'blue' }], manaWorld: { playerTribe: 0 },
    shrines: [{ id: 2, kind: 'vault', mode: 4, reward: 'camp', x: -5, z: -3, active: true }], gifts: [],
    cosmeticRandom: { randomState: 1 }, worshipAcquisition: {
      controllers: { building: null, spell: null, companion: null, pulse: null, drawCommands: [] },
      previousDrawCommands: [], requests: [], clock: { elapsed: 0, nextVisit: 0, lastVisit: 0, limiter: 0, normalRate: 40 },
    } }
  let buildingsSelected = false, uiWhole = true, uiFlight = 0
  const card = { get disabled() { return !world.unlockedCamp }, getBoundingClientRect: () => rect }
  const root = { getBoundingClientRect: () => ({ x: 0, y: 0 }), querySelector(selector) {
    if (selector.includes('buildings B')) return { getAttribute: () => String(buildingsSelected) }
    if (selector.includes('Warrior Training Hut')) return buildingsSelected ? card : null
    if (selector === '.native-hud') return { offsetWidth: 200, getBoundingClientRect: () => ({ width: 200 }) }
    throw Error(selector)
  } }
  const canvas = { width: 8, height: 8, hidden: false, toDataURL: () => 'data:image/png;base64,AAAA' }
  const gl = { RGBA: 1, UNSIGNED_BYTE: 2, readPixels(_x, _y, _w, _h, _format, _type, bytes) {
    if (pixels) for (let i = 3; i < bytes.length; i += 4) bytes[i] = 255
  } }
  const token = {}, calls = []
  const mainCanvas = {}
  const scene = { world, renderer: { domElement: mainCanvas }, container: { parentElement: root, getBoundingClientRect: () => geometry.viewport },
    fxMeshes: new Map(), gameClock: { animationFrame: 1 }, worshipPresentation: null }
  const start = () => {
    buildingsSelected = true
    world.worshipAcquisition.controllers.building = { active: true, phase: 1, visits: 0, pending: false,
      model: 103, family: 'building', giftId: 54, geometry, x: 350, y: 180, scale: 8, yaw: 0, tilt: 1536,
      faces: [{ flags: 0, threshold: 0, angles: [0, 0, 0], heading: 0, countdown: 0 }], allStarted: false }
  }
  const originalBefore = function (value) { assert.equal(this, scene.gameClock); assert.equal(value, token); calls.push('before'); return 11 }
  const originalAfter = function (value) {
    assert.equal(this, scene.gameClock); assert.equal(value, token); calls.push('after')
    if (!skipHandoff && world.gifts[0]?.phase === 0 && !world.worshipAcquisition.controllers.building) start()
    return 12
  }
  scene.gameClock.beforeTurn = originalBefore; scene.gameClock.afterTurn = originalAfter
  const surface = { geometry: { drawRange: { count: 3 } },
    renderer: { domElement: canvas, getContext: () => gl, info: { render: { frame: 0 } } } }
  const presentation = scene.worshipPresentation = { canvas, anchors: new Map([[54, { point: geometry.origin, viewport: geometry.viewport, valid: true }]]),
    buildingSurface: lazySurface ? undefined : surface,
    visit(value) {
      assert.equal(this, presentation); assert.equal(value, token); calls.push('ui')
      const b = world.worshipAcquisition.controllers.building
      if (b) {
        b.visits++; b.phase = uiWhole ? 3 : 4
        world.worshipAcquisition.controllers.drawCommands = [{ kind: 'building', family: 'building', giftId: 54,
          model: 7, geometry, whole: uiWhole, anchor: { x: b.x, y: b.y }, selected: [],
          submissions: [{ face: 0, transformed: [[0, 0, 0]], projected: [[0, 0]], flight: uiFlight }] }]
      }
      return 13
    },
    draw(value) {
      assert.equal(this, presentation); assert.equal(value, token); calls.push('draw')
      if (scene.fxMeshes.has(54)) scene.fxMeshes.get(54).visible = !!world.gifts[0]?.phase
      if (!skipGpu && world.worshipAcquisition.controllers.drawCommands.some(command => command.kind === 'building')) {
        this.buildingSurface ??= surface
        this.buildingSurface.renderer.info.render.frame++
      }
      if (mutateDraw) world.cosmeticRandom.randomState++
      return 14
    },
  }
  const originalClock = scene.gameClock, originalUi = presentation.visit, originalDraw = presentation.draw
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  const birth = () => {
    world.shrines[0].active = false
    world.gifts.push({ id: 54, reward: 'camp', recipient: 0, phase: 6, remaining: 82,
      buildingAcquisition: { mission: 1, head: 1, reward: 2, slot: 0, rewardClass: 2, model: 7 } })
    scene.fxMeshes.set(54, { visible: true })
  }
  const turn = action => {
    assert.equal(scene.gameClock.beforeTurn(token), 11)
    world.turn++; action()
    assert.equal(scene.gameClock.afterTurn(token), 12)
  }
  const giftVisit = () => turn(() => {
    const gift = world.gifts[0]
    if (gift.phase) gift.phase--
    if (!--gift.remaining) { world.gifts = []; world.unlockedCamp = true }
  })
  if (initialBirth) {
    birth(); world.turn = initialBirth.turn + 6; world.gifts[0].phase = 0; world.gifts[0].remaining = 76; start()
  }
  if (missedResume) { world.gifts = []; world.unlockedCamp = true; world.worshipAcquisition.controllers.building.active = false }
  installMission1BuildingScreenWitness({ shamanId: 30, birth: initialBirth, mapDraw })
  const api = window.m1BuildingScreen
  t.after(() => { if (globalThis.window?.m1BuildingScreen === api) api.close(); delete globalThis.window })
  const close = () => {
    const result = api.close()
    assert.equal(originalClock.beforeTurn, originalBefore); assert.equal(originalClock.afterTurn, originalAfter)
    assert.equal(presentation.visit, originalUi); assert.equal(presentation.draw, originalDraw)
    return result
  }
  return { world, scene, api, turn, birth, giftVisit, close, calls,
    ui(whole, flight = 0) { uiWhole = whole; uiFlight = flight; assert.equal(presentation.visit(token), 13) },
    draw() { assert.equal(presentation.draw(token), 14) } }
}

test('passive screen hooks retain exact6/82 events with many world visits per actual draw', t => {
  const f = fixture(t)
  f.turn(f.birth)
  for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(true); f.draw(); f.draw()
  f.ui(false, 0.2); f.draw()
  for (let i = 6; i < 82; i++) f.giftVisit()
  f.world.worshipAcquisition.controllers.building.active = false
  f.draw()
  const evidence = f.close()
  assert.equal(evidence.restored, true); assert.deepEqual(evidence.errors, [])
  assert.equal(evidence.stages.hide.turn - evidence.birth.turn, 6)
  assert.equal(evidence.stages.beforeGrant.gift.remaining, 1)
  assert.equal(evidence.stages.grant.after.turn - evidence.birth.turn, 82)
  assert.equal(evidence.handoffs, 1); assert.equal(evidence.grants, 1)
  assert.equal(evidence.draws, 4); assert.equal(evidence.uiVisits, 2)
  assert.equal(evidence.frames.whole.opaquePixels, 64); assert.equal(evidence.frames.flight.opaquePixels, 64)
  assert.equal(evidence.frames.handoff.worldGiftVisible, false)
  assert.ok(evidence.frames.terminal); assert.equal(f.world.mode, 'blast')
  assert.equal(f.calls.filter(call => call === 'after').length, 83)
})

test('first actual PNG is retained before empty-GPU validation fails', t => {
  const f = fixture(t, { pixels: false })
  f.turn(f.birth); for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(true); f.draw()
  const evidence = f.close()
  assert.equal(evidence.frames.whole.buildingPng, 'data:image/png;base64,AAAA')
  assert.ok(evidence.errors.some(error => error.includes('GPU frame is empty')))
  assert.equal(evidence.restored, true)
})

test('an empty first handoff remains diagnostic without a first-frame visibility requirement', t => {
  const f = fixture(t, { pixels: false })
  f.turn(f.birth); for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(false); f.draw()
  const evidence = f.close()
  assert.equal(evidence.frames.handoff.opaquePixels, 0)
  assert.deepEqual(evidence.errors, [])
  assert.equal(evidence.frames.whole, undefined); assert.equal(evidence.frames.flight, undefined)
})

test('skipped layout cannot label the previous nonempty surface as current whole/flight pixels', t => {
  const f = fixture(t, { skipGpu: true })
  f.scene.worshipPresentation.buildingSurface.renderer.info.render.frame = 10
  f.turn(f.birth); for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(true); f.draw(); f.ui(false, 0.2); f.draw()
  const evidence = f.close()
  assert.equal(evidence.frames.whole, undefined); assert.equal(evidence.frames.flight, undefined)
  assert.equal(evidence.frames.handoff.buildingPng, undefined)
  assert.equal(evidence.skippedGpuDraws, 2)
  assert.equal(evidence.skippedGpuSamples[0].gpu.beforeFrame, 10)
  assert.equal(evidence.skippedGpuSamples[0].gpu.afterFrame, 10)
  assert.equal(evidence.skippedGpuSamples[0].gpu.fresh, false)
})

test('the first lazily created surface requires a positive actual render counter', t => {
  const f = fixture(t, { lazySurface: true })
  f.turn(f.birth); for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(true); f.draw()
  const evidence = f.close()
  assert.equal(evidence.frames.whole.gpu.created, true)
  assert.equal(evidence.frames.whole.gpu.beforeFrame, null)
  assert.equal(evidence.frames.whole.gpu.afterFrame, 1)
  assert.equal(evidence.frames.whole.gpu.fresh, true)
})

test('the sixth object visit fails immediately when synchronous handoff did not create a controller', t => {
  const f = fixture(t, { skipHandoff: true })
  f.turn(f.birth); for (let i = 0; i < 6; i++) f.giftVisit()
  const evidence = f.close()
  assert.ok(evidence.errors.some(error => error.includes('Sixth visit did not create')))
  assert.equal(evidence.handoffs, 0)
})

test('equal World data cannot conceal changed Scene, clock, presenter or main canvas ownership', t => {
  for (const change of [
    f => { window.testSceneRef.current = { ...f.scene } },
    f => { f.scene.gameClock = { ...f.scene.gameClock } },
    f => { f.scene.worshipPresentation = { ...f.scene.worshipPresentation } },
    f => { f.scene.renderer.domElement = {} },
  ]) {
    const f = fixture(t); change(f)
    // Invoke the retained real presenter; source ownership checks must still reject.
    f.draw()
    const evidence = f.close()
    assert.ok(evidence.errors.some(error => /identity changed|ownership changed/.test(error)))
  }
})

test('draw mutation is reported without masking the original result or preventing restoration', t => {
  const f = fixture(t, { mutateDraw: true }); f.draw()
  const evidence = f.close()
  assert.ok(evidence.errors.some(error => error.includes('RAF draw mutated')))
  assert.equal(evidence.restored, true)
})

test('a failed GPU diagnostic pre-read cannot suppress the original draw', t => {
  const f = fixture(t)
  Object.defineProperty(f.scene.worshipPresentation.buildingSurface.renderer, 'info', {
    get() { throw Error('supplied GPU diagnostic failed') },
  })
  f.draw()
  const evidence = f.close()
  assert.equal(f.calls.filter(call => call === 'draw').length, 1)
  assert.ok(evidence.errors.some(error => error.includes('GPU diagnostic failed')))
  assert.equal(evidence.restored, true)
})

test('resumed observation uses retained actual birth evidence without reinitializing controller ownership', t => {
  const f = fixture(t, { initialBirth: { turn: 11, gift: { id: 54 } } }), original = f.world.worshipAcquisition.controllers.building
  for (let i = 6; i < 82; i++) f.giftVisit()
  original.active = false; f.draw()
  const evidence = f.close()
  assert.equal(f.world.worshipAcquisition.controllers.building, original)
  assert.equal(evidence.handoffs, 0); assert.equal(evidence.grants, 1); assert.deepEqual(evidence.errors, [])
})

test('a missed resumed boundary retains actual state and fails before installing callbacks', t => {
  t.after(() => delete globalThis.window)
  assert.throws(() => fixture(t, { initialBirth: { turn: 11, gift: { id: 54 } }, missedResume: true }), /Missed resumed/)
  assert.equal(window.m1BuildingScreen, undefined)
  assert.equal(window.m1BuildingScreenInstallation.state.camp, true)
  assert.equal(window.m1BuildingScreenInstallation.state.gift, undefined)
  assert.equal(window.m1BuildingScreenInstallation.state.acquisition.controllers.building.active, false)
})

test('failed Save prerequisites persist their actual boundary and latest committed read', async () => {
  const saved = { acquisition: { controllers: { building: { active: false } } }, camp: false, buildingGifts: [] }
  for (const kind of ['capture', 'inactive', 'unequal']) {
    const report = {}, persisted = [], boundary = { saved, error: kind === 'capture' ? 'capture failed' : null }
    let reads = 0
    const page = { async evaluate(fn) {
      if (fn === installMission1VaultSaveWitness) return
      if (fn.name === 'readMission1VaultCheckpoint') { reads++; return kind === 'unequal' ? { actual: 'older checkpoint' } : saved }
      return boundary
    } }
    const signal = { throwIfAborted() { if (reads) throw Error('stop after the retained mismatch') } }
    await assert.rejects(saveMission1BuildingCheckpoint({ page, button: async () => {}, signal, report,
      save: () => persisted.push(structuredClone(report)), observeCheckpoint: async () => assert.fail('must not accept') }, 'active', true))
    assert.deepEqual(persisted[0].checkpoints[0].boundary, boundary)
    if (kind === 'capture') assert.equal(reads, 0)
    else assert.deepEqual(persisted.at(-1).checkpoints[0].saved, kind === 'unequal' ? { actual: 'older checkpoint' } : saved)
  }
})

test('Save/Load snapshot includes actual shared UI state at synchronous public boundaries', t => {
  const world = { outcome: { level: 1 }, turn: 30, time: 2.5, paused: true, mode: 'blast', selected: [30], unlockedCamp: false,
    shrines: [{ kind: 'vault', mode: 4, reward: 'camp', x: -5, z: -3, active: false, knowledgeGlow: { f1: 12 } }],
    gifts: [{ id: 54, remaining: 60, buildingAcquisition: { model: 7 } }], stats: { bridges: 1 }, landVersion: 1,
    land: { heights: [1, 2] }, units: [{ id: 30, kind: 'shaman', team: 'blue', hp: 100 }], cosmeticRandom: { randomState: 77 },
    worshipAcquisition: { controllers: { building: { active: true, phase: 3, faces: [{ flags: 6 }] },
      companion: { trails: [1], giftId: 54 }, pulse: { remaining: 4 } }, requests: [], clock: { elapsed: 20 }, previousDrawCommands: [1] } }
  let current = world, click, subscriber, unsubscribed = false
  const store = { getWorld: () => current, subscribe(fn) { subscriber = fn; return () => { unsubscribed = true } } }
  const button = { textContent: 'Save checkpoint', isConnected: true, disabled: false,
    addEventListener(_name, fn) { click = fn }, removeEventListener(_name, fn) { assert.equal(click, fn); click = null } }
  const main = { __reactFiberTest: { memoizedState: { memoizedState: store } } }
  globalThis.window = { testStore: store }
  globalThis.document = { querySelectorAll: () => [button], querySelector: () => main }
  t.after(() => { delete globalThis.window; delete globalThis.document })
  installMission1VaultCheckpointState(); installMission1VaultSaveWitness()
  world.worshipAcquisition.clock.elapsed = 25 // Source may advance while paused before the public click.
  click({ isTrusted: true, target: button })
  const saved = window.restoreVaultSaveWitness().saved
  assert.equal(saved.acquisition.clock.elapsed, 25); assert.deepEqual(saved.cosmeticRandom, { randomState: 77 })
  let loadedObject, loadedStore
  const loadOwner = installMission1VaultLoadWitness((world, owner) => { loadedObject = world; loadedStore = owner })
  assert.equal(loadOwner.store, store); assert.equal(loadOwner.before, world)
  current = structuredClone(world); subscriber()
  assert.equal(unsubscribed, true); assert.deepEqual(window.vaultLoadedBoundary, saved)
  assert.equal(loadedObject, current); assert.equal(loadedStore, store)
  current.worshipAcquisition.clock.elapsed++
  assert.equal(window.vaultLoadedBoundary.acquisition.clock.elapsed, 25)
  assert.equal(window.restoreVaultLoadWitness, undefined)
})

test('named scenario, maintained argv and explicit imports resolve without launching a runtime', () => {
  assert.equal(typeof scenario, 'function')
  assert.equal(typeof componentSmoke, 'function')
  assert.equal(typeof continuation, 'function')
  assert.equal(typeof completion, 'function')
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const scenarioPath = resolve(root, 'scripts/local-render/mission1-building-screen.mjs')
  const options = parseOptions(['--game-root', root, '--scenario', scenarioPath, '--mission', '1', '--timeout', '1200000',
    '--profile', resolve(root, 'work/local-render-profiles/m1-building-screen-review-only'),
    '--output', resolve(root, 'work/orchestration/m1-building-screen-review-only'), '--port', '4188', '--browser', '/unassigned-review-only'])
  assert.equal(options.scenario, scenarioPath); assert.equal(options.mission, 1)
  const tail = parseOptions(['--game-root', root, '--scenario', resolve(root, 'scripts/local-render/mission1-building-screen-completion.mjs'),
    '--mission', '1', '--timeout', '180000', '--profile', resolve(root, 'work/local-render-profiles/m1-building-screen-review-only'),
    '--profile-correspondence', resolve(root, 'work/orchestration/review-only.json')])
  assert.ok(tail.profileCorrespondence.endsWith('review-only.json'))
  for (const file of ['mission1-building-screen.mjs', 'mission1-building-screen-witness.mjs', 'mission1-vault-checkpoint.mjs', 'mission1-building-drawer-smoke.mjs', 'mission1-building-screen-load.mjs', 'mission1-building-screen-continuation.mjs', 'mission1-building-screen-completion.mjs']) {
    const source = readFileSync(resolve(root, 'scripts/local-render', file), 'utf8')
    for (const [, relative] of source.matchAll(/from '([^']+)'/g)) {
      if (relative.startsWith('node:')) continue
      assert.ok(existsSync(resolve(root, 'scripts/local-render', relative)), relative)
    }
    assert.doesNotMatch(source, /cancelAnimationFrame|requestAnimationFrame\s*=|\.tick\(|\.animate\(|\.render\(|indexedDB.*readwrite/)
  }
})

test('successful natural start attaches the existing observer before its first scheduled callback', async t => {
  const birth = { turn: 1250, gift: { id: 54 } }, f = fixture(t, { initialBirth: birth })
  f.close()
  f.world.turn = 1300; f.world.gifts[0].remaining = 32
  f.world.worshipAcquisition.controllers.building.phase = 4
  f.world.worshipAcquisition.controllers.building.visits = 1
  const ref = window.testSceneRef, store = window.testStore, args = [{ tag: 'original argument' }], order = []
  const prototype = { start(...actual) {
    assert.equal(this, f.scene); assert.deepEqual(actual, args); order.push('original')
    queueMicrotask(() => {
      order.push('first callback'); assert.ok(window.m1BuildingScreen)
      for (let i = 0; i < 32; i++) f.giftVisit()
      f.world.worshipAcquisition.controllers.building.active = false
      f.draw()
    })
    return true
  } }
  const original = prototype.start
  const owner = armMission1BuildingSceneStart({ prototype, store, expectedWorld: () => f.world, sceneRef: () => ref,
    attach(scene, actualRef, actualStore) {
      order.push('attach'); assert.equal(scene, f.scene); assert.equal(actualRef, ref); assert.equal(actualStore, store)
      installMission1BuildingScreenWitness({ shamanId: 30, birth })
    } })
  assert.equal(prototype.start.apply(f.scene, args), true)
  assert.equal(prototype.start, original); assert.deepEqual(order, ['original', 'attach'])
  await Promise.resolve()
  const evidence = window.m1BuildingScreen.close()
  assert.deepEqual(order, ['original', 'attach', 'first callback'])
  assert.deepEqual(owner.evidence, { calls: 1, result: true, originalThrew: false, attached: true, restored: true, errors: [] })
  assert.equal(evidence.grants, 1); assert.equal(evidence.handoffs, 0); assert.deepEqual(evidence.errors, [])
  assert.equal(evidence.stages.grant.after.turn, 1332); assert.equal(evidence.stages.grant.before.gift.remaining, 1)
})

test('start preserves primitive throws, false return and observer exceptions without suppressing the original', () => {
  for (const mode of ['throw-null', 'false', 'attach-fails', 'wrong-world']) {
    const world = {}, scene = { world }, ref = { current: scene }, args = [{}]
    let calls = 0, attachments = 0
    const prototype = { start(...actual) {
      calls++; assert.equal(this, scene); assert.deepEqual(actual, args)
      if (mode === 'throw-null') throw null
      return mode !== 'false'
    } }
    const original = prototype.start, descriptor = Object.getOwnPropertyDescriptor(prototype, 'start')
    const owner = armMission1BuildingSceneStart({ prototype, store: { getWorld: () => world },
      expectedWorld: () => mode === 'wrong-world' ? {} : world, sceneRef: () => ref,
      attach() { attachments++; throw Error('supplied attach failure') } })
    if (mode === 'throw-null') {
      let caught = false
      try { prototype.start.apply(scene, args) } catch (error) { caught = true; assert.equal(error, null) }
      assert.equal(caught, true)
    } else assert.equal(prototype.start.apply(scene, args), mode !== 'false')
    assert.equal(calls, 1); assert.equal(attachments, mode === 'attach-fails' ? 1 : 0)
    assert.equal(owner.evidence.attached, false); assert.equal(owner.evidence.restored, true)
    assert.equal(owner.evidence.errors.length, 1); assert.equal(prototype.start, original)
    assert.deepEqual(Object.getOwnPropertyDescriptor(prototype, 'start'), descriptor)
  }
})

test('one-shot start cleanup preserves a foreign replacement and original primitive exception', () => {
  const foreign = () => false, world = {}, scene = { world }
  const prototype = { start() { prototype.start = foreign; throw undefined } }
  const owner = armMission1BuildingSceneStart({ prototype, store: { getWorld: () => world },
    expectedWorld: () => world, sceneRef: () => ({ current: scene }), attach() { assert.fail('must not attach') } })
  let caught = false
  try { prototype.start.call(scene) } catch (error) { caught = true; assert.equal(error, undefined) }
  assert.equal(caught, true); assert.equal(prototype.start, foreign)
  assert.equal(owner.evidence.calls, 1); assert.equal(owner.evidence.restored, false)
  assert.match(owner.evidence.errors.at(-1), /ownership changed/)
  assert.throws(owner.close, /ownership changed/); assert.equal(prototype.start, foreign)
})

test('trusted Restart captures actual active pre-state and synchronous reset; retired pre-state cannot earn active reset', t => {
  const world = { outcome: { level: 1 }, turn: 1300, time: 1, paused: true, mode: null, selected: [30], unlockedCamp: false,
    shrines: [{ kind: 'vault', mode: 4, reward: 'camp', x: -5, z: -3, active: false }],
    gifts: [{ id: 54, remaining: 32, buildingAcquisition: { model: 7 } }], stats: { bridges: 1 }, landVersion: 1,
    land: { heights: [1, 2] }, units: [{ id: 30, kind: 'shaman', team: 'blue', hp: 100 }], cosmeticRandom: { randomState: 77 },
    worshipAcquisition: { controllers: { building: { active: true }, companion: {}, pulse: {} }, requests: [] } }
  let current = world, subscriber, click, closed = 0, unsubscribed = 0
  const store = { getWorld: () => current, subscribe(fn) { subscriber = fn; return () => { unsubscribed++ } } }
  const button = { textContent: 'Restart world', isConnected: true, disabled: false,
    addEventListener(_name, fn) { click = fn }, removeEventListener(_name, fn) { assert.equal(click, fn); click = null } }
  const main = { __reactFiberTest: { memoizedState: { memoizedState: store } } }
  globalThis.window = { m1BuildingScreen: { close() { closed++; delete window.m1BuildingScreen; return { restored: true, errors: [] } } } }
  globalThis.document = { querySelectorAll: () => [button], querySelector: () => main }
  t.after(() => { delete globalThis.window; delete globalThis.document })
  installMission1VaultCheckpointState(); installMission1BuildingRestartWitness()
  click({ isTrusted: true, target: button })
  current = structuredClone(world); current.turn = 0; current.shrines[0].active = true; current.gifts = []
  current.worshipAcquisition.controllers = { building: null, companion: null, pulse: null }; subscriber()
  const evidence = window.restoreM1BuildingRestart()
  assert.equal(closed, 1); assert.equal(unsubscribed, 1)
  assertMission1BuildingRestart(evidence, evidence.screen, 54)
  evidence.before.acquisition.controllers.building.active = false
  assert.throws(() => assertMission1BuildingRestart(evidence, evidence.screen, 54), /missed active ownership/)
  assert.equal(world.worshipAcquisition.controllers.building.active, true)
})

test('Restart caller and final report preserve a primitive input throw through cleanup and save failures', async t => {
  const report = { status: 'running' }, calls = [], cleanup = Error('supplied cleanup failure'), saveError = Error('supplied save failure')
  globalThis.window = { restoreM1BuildingRestart() { calls.push('cleanup'); throw cleanup } }
  t.after(() => delete globalThis.window)
  const page = { evaluate: async fn => fn() }, button = name => ({ async click() {
    calls.push(name); if (name === 'Pause game') throw null
  } })
  const save = () => { calls.push('save'); throw saveError }
  let caught = false, primary
  try { await runMission1BuildingRestart({ page, button, report, save, persistScreen() { assert.fail('no collected screen') } }) }
  catch (error) { caught = true; primary = error }
  assert.equal(caught, true); assert.equal(primary, null)
  assert.deepEqual(calls, ['Restart world', 'Pause game', 'cleanup', 'save'])
  assert.match(report.restartCleanupErrors[0], /supplied cleanup failure/)
  assert.match(report.restartCleanupErrors[1], /supplied save failure/)
  let finished = false
  try { finishMission1BuildingContinuation(report, save, caught, primary) }
  catch (error) { finished = true; assert.equal(error, null) }
  assert.equal(finished, true); assert.match(report.reportSaveFailure, /supplied save failure/)
  assert.throws(() => finishMission1BuildingContinuation(report, save, false), error => error === saveError)
})

test('actual serialized saved1300 accepts only the identified positive-Infinity duration projection', () => {
  const serialized = JSON.parse(readFileSync(new URL('./fixtures/saved1300.json', import.meta.url), 'utf8'))
  const live = structuredClone(serialized)
  live.buildingGifts[0].duration = Infinity
  assert.deepEqual(JSON.parse(JSON.stringify(live)), serialized)
  assert.deepEqual(assertMission1SerializedCheckpoint(live, serialized), {
    giftId: 3541, field: 'buildingGifts[0].duration', actual: '+Infinity', recorded: null,
  })
  const loaded = structuredClone(live)
  assert.deepEqual(loaded, live); assert.equal(loaded.buildingGifts[0].duration, Infinity)
  for (const duration of [NaN, -Infinity, null, 82]) {
    const bad = structuredClone(live); bad.buildingGifts[0].duration = duration
    assert.throws(() => assertMission1SerializedCheckpoint(bad, serialized))
    assert.throws(() => assert.deepEqual(bad, live))
  }
  for (const change of [x => x.buildingGifts[0].id++, x => x.buildingGifts[0].buildingAcquisition.model++,
    x => { x.buildingGifts[0].kind = 'blast' }, x => x.turn++,
    x => { x.time = Infinity }, x => { x.time = NaN }, x => { x.time = -Infinity },
    x => { x.acquisition.controllers.building.active = false }]) {
    const bad = structuredClone(live); change(bad)
    assert.throws(() => assertMission1SerializedCheckpoint(bad, serialized))
  }
  assert.equal(live.buildingGifts[0].duration, Infinity)
  assert.equal(serialized.buildingGifts[0].duration, null)
})

function resizeFixture(t) {
  const f = fixture(t, { initialBirth: { turn: 10, gift: { id: 54 } },
    mapDraw(_command, current) {
      const r = current.targetRect, scale = current.hudScale
      return { target: { x: r.x + Math.trunc(r.width / scale / 2) * scale, y: r.y + Math.trunc(r.height / scale / 2) * scale },
        triangles: [{ points: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }] }] }
    } })
  f.ui(false, 0.2); f.world.paused = true
  const surface = f.scene.worshipPresentation.buildingSurface, root = f.scene.container.parentElement,
    canvas = f.scene.worshipPresentation.canvas
  surface.atlas = {}; surface.camera = {}; surface.material = { uniforms: { atlas: { value: surface.atlas } } }
  surface.scene = { children: [{ geometry: surface.geometry, material: surface.material }] }
  surface.geometry.attributes = {}
  for (const [field, name, size] of [['position', 'position', 3], ['uv', 'uv', 2], ['light', 'faceLight', 1], ['cutout', 'alphaCutout', 1]])
    surface[field] = surface.geometry.attributes[name] = { itemSize: size, array: new Float32Array(525 * size) }
  surface.position.array.set([1, 2, 0, 3, 4, 0, 5, 6, 0])
  globalThis.devicePixelRatio = 1; globalThis.innerWidth = root.clientWidth = canvas.width = 1440
  globalThis.innerHeight = root.clientHeight = canvas.height = 1000
  t.after(() => { delete globalThis.devicePixelRatio; delete globalThis.innerWidth; delete globalThis.innerHeight })
  return { ...f, surface, root, canvas }
}

test('one existing draw observer samples16+16 actual-sized callbacks and fixed resource capacities', t => {
  const f = resizeFixture(t), geometry = structuredClone(f.world.worshipAcquisition.controllers.building.geometry)
  f.api.armDrawSample({ label: 'before', width: 1440, height: 1000 })
  for (let i = 0; i < 16; i++) f.draw()
  assert.equal(f.api.status().samples.before, 16)
  f.api.armDrawSample({ label: 'after', width: 1280, height: 960 })
  globalThis.innerWidth = f.root.clientWidth = 1280; globalThis.innerHeight = f.root.clientHeight = 960
  f.draw() // Existing canvas is still at the prior size: no new sample credit.
  assert.equal(f.api.status().samples.after, 0)
  f.canvas.width = 1280; f.canvas.height = 960
  for (let i = 0; i < 16; i++) f.draw()
  const e = f.close()
  assert.deepEqual(e.errors, []); assert.equal(e.samples.after.count, 16)
  assert.equal(e.samples.before.first.attributeBytes, 14700)
  assert.equal(e.samples.after.first.vertexCapacity, 525)
  assert.equal(e.samples.after.first.triangleCapacity, 175)
  assert.equal(e.samples.after.resourcesStable, true); assert.equal(e.samples.after.submittedMappingMatches, true)
  assert.ok(e.frames['resize-before'].opaquePixels > 0 && e.frames['resize-after'].opaquePixels > 0)
  assert.deepEqual(f.world.worshipAcquisition.controllers.building.geometry, geometry)
  assert.equal(f.calls.filter(call => call === 'draw').length, 33)
})

test('resize observation rejects replaced fixed buffers, wrong submitted corners and mutated reference geometry', t => {
  const f = resizeFixture(t)
  f.api.armDrawSample({ label: 'before', width: 1440, height: 1000 })
  const array = f.surface.position.array
  f.surface.position.array = array.slice(); f.draw()
  assert.match(f.api.status().errors.at(-1), /resources were replaced/)
  assert.match(f.api.read().frames['resize-before'].buildingPng, /^data:image\/png;base64,/)
  f.surface.position.array = array; array[0] = 999; f.draw()
  assert.match(f.api.status().errors.at(-1), /submitted corner differs/)
  array[0] = 1; f.world.worshipAcquisition.controllers.building.geometry.target.x++; f.draw()
  assert.match(f.api.status().errors.at(-1), /frozen acquisition geometry/)
  assert.equal(f.api.status().samples.before, 0)
  assert.equal(f.calls.filter(call => call === 'draw').length, 3)
  f.close()
})

test('final public HUD selection retains actual masked-click diagnostics and never retries a suppressed tab', async t => {
  let buildings = false
  const world = { inputMask: 0, turn: 1332, paused: true, unlockedCamp: true, mode: null }, calls = []
  const scene = { world, started: true, renderer: { domElement: { isConnected: true } } }
  const tab = { getAttribute: name => name === 'aria-label' ? 'buildings B' : String(buildings) }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  globalThis.document = {
    querySelector(selector) {
      if (selector.includes('buildings B')) return tab
      if (selector.includes('Warrior Training Hut')) return buildings ? { disabled: false } : null
      if (selector === '.loading-world') return null
      assert.fail(selector)
    }, querySelectorAll: () => [buildings ? tab : { getAttribute: () => 'spells 1–3' }],
  }
  t.after(() => { delete globalThis.window; delete globalThis.document })
  const page = { evaluate: async fn => fn() }, button = name => ({ async click() {
    calls.push(name)
    if (world.inputMask) return
    if (name === 'buildings B') buildings = true
    else if (name === 'Warrior Training Hut, 8 wood') world.mode = 'camp'
    else assert.fail(name)
  } })
  const passed = {}
  await selectMission1CompletedCamp({ page, button, report: passed, save() {} })
  assert.deepEqual(calls, ['buildings B', 'Warrior Training Hut, 8 wood'])
  assert.equal(passed.finalHud.before.cardPresent, false); assert.equal(passed.finalHud.after.cardPresent, true)
  assert.equal(passed.finalHud.selected.mode, 'camp')
  calls.length = 0; buildings = false; world.inputMask = 128; world.mode = null
  const blocked = {}
  await assert.rejects(selectMission1CompletedCamp({ page, button, report: blocked, save() {} }), /input-masked/)
  assert.deepEqual(calls, ['buildings B']); assert.equal(blocked.finalHud.after.inputMask, 128)
  assert.deepEqual(blocked.finalHud.after.selectedTabs, ['spells 1–3']); assert.equal(blocked.finalHud.after.cardPresent, false)
  assert.equal(readMission1FinalHud().worldMatches, true)
})

test('final HUD diagnostic cleanup preserves a primitive input error over read and report failures', async () => {
  let reads = 0, caught = false
  const report = {}, page = { async evaluate() { if (++reads === 1) return { inputMask: 0 }; throw Error('after diagnostic failed') } },
    button = () => ({ async click() { throw null } })
  try { await selectMission1CompletedCamp({ page, button, report, save() { throw Error('report failed') } }) }
  catch (error) { caught = true; assert.equal(error, null) }
  assert.equal(caught, true)
  assert.match(report.finalHud.cleanupErrors[0], /after diagnostic failed/)
  assert.match(report.finalHud.cleanupErrors[1], /report failed/)
})

test('component smoke uses one production-interface draw and disposes its detached owner even after failure', async t => {
  t.after(() => delete globalThis.window)
  for (const fails of [false, true]) {
    const calls = [], atlas = { image: { complete: true, naturalWidth: 2048 }, version: 1, minFilter: 2, magFilter: 3 }
    const canvas = { toDataURL: () => 'data:image/png;base64,AAAA' }
    const gl = { RGBA: 1, UNSIGNED_BYTE: 2, NO_ERROR: 0, VERSION: 3, getError: () => 0,
      getParameter: () => 'WebGL 2.0 supplied fixture',
      readPixels(_x, _y, width, _height, _format, _type, bytes) {
        for (const pixel of [0, width - 1]) { bytes[pixel * 4] = 255; bytes[pixel * 4 + 3] = 255 }
      } }
    class Surface {
      constructor(source) { assert.equal(source, atlas); calls.push('create'); this.renderer = { info: { render: { frame: 0 } }, getContext: () => gl } }
      draw(triangles, width, height, ratio) {
        calls.push('draw'); assert.equal(triangles.length, 2); assert.deepEqual([width, height, ratio], [640, 480, 1])
        if (fails) throw Error('supplied draw failure')
        this.renderer.info.render.frame++; return canvas
      }
      dispose() { calls.push('dispose') }
    }
    const modules = {
      '/app/building-acquisition-drawer.ts': { BuildingAcquisitionTriangleSurface: Surface },
      '/app/building-acquisition-triangles.ts': { collectBuildingAcquisitionTriangles(command) {
        assert.deepEqual(command.submissions.map(face => face.face), [0, 2]); return [{ mode: 6 }, { mode: 7 }]
      } },
      '/app/scene-assets.ts': { texture(name) { assert.equal(name, 'atlas'); return atlas } },
    }
    globalThis.window = { testSceneRef: { current: { world: { outcome: { level: 1 }, paused: true,
      turn: 1, mode: null, shots: { blast: 4 }, unlockedCamp: false, randomState: 1, cosmeticRandom: { randomState: 2 } } } } }
    const invoke = Function('imports', `return (${drawMission1Component.toString().replaceAll('import(', 'imports(')})`)(async path => modules[path])
    const result = await invoke()
    assert.deepEqual(calls, ['create', 'draw', 'dispose']); assert.equal(result.disposed, true)
    assert.equal(result.sharedAtlasUnchanged, true); assert.equal(result.failed, fails)
    if (fails) assert.match(result.failure, /supplied draw failure/)
    else {
      assert.equal(result.afterFrame, 1); assert.equal(result.png, 'data:image/png;base64,AAAA')
      assert.deepEqual(result.opaque, [1, 1]); assert.deepEqual(result.colored, [1, 1])
      assert.equal(result.worldUnchanged, true)
    }
  }
})
