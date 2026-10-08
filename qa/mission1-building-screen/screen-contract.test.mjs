// Supplied callback/DOM/GL fixtures, not a browser or naturally played episode.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installMission1BuildingScreenWitness } from '../../scripts/local-render/mission1-building-screen-witness.mjs'
import { installMission1VaultCheckpointState, installMission1VaultSaveWitness,
  installMission1VaultLoadWitness } from '../../scripts/local-render/mission1-vault-checkpoint.mjs'
import scenario from '../../scripts/local-render/mission1-building-screen.mjs'
import { parseOptions } from '../../scripts/local-render/harness.mjs'

function fixture(t, { pixels = true, mutateDraw = false, initialBirth = null } = {}) {
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
  const scene = { world, container: { parentElement: root, getBoundingClientRect: () => geometry.viewport },
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
    if (world.gifts[0]?.phase === 0 && !world.worshipAcquisition.controllers.building) start()
    return 12
  }
  scene.gameClock.beforeTurn = originalBefore; scene.gameClock.afterTurn = originalAfter
  const presentation = scene.worshipPresentation = { canvas, anchors: new Map([[54, { point: geometry.origin, viewport: geometry.viewport, valid: true }]]),
    buildingSurface: { geometry: { drawRange: { count: 3 } }, renderer: { domElement: canvas, getContext: () => gl } },
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
      if (mutateDraw) world.cosmeticRandom.randomState++
      return 14
    },
  }
  const originalUi = presentation.visit, originalDraw = presentation.draw
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
  installMission1BuildingScreenWitness({ shamanId: 30, birth: initialBirth })
  const api = window.m1BuildingScreen
  t.after(() => { if (window.m1BuildingScreen) api.close(); delete globalThis.window })
  const close = () => {
    const result = api.close()
    assert.equal(scene.gameClock.beforeTurn, originalBefore); assert.equal(scene.gameClock.afterTurn, originalAfter)
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
  assert.equal(evidence.frames.handoff.buildingPng, 'data:image/png;base64,AAAA')
  assert.ok(evidence.errors.some(error => error.includes('GPU frame is empty')))
  assert.equal(evidence.restored, true)
})

test('draw mutation is reported without masking the original result or preventing restoration', t => {
  const f = fixture(t, { mutateDraw: true }); f.draw()
  const evidence = f.close()
  assert.ok(evidence.errors.some(error => error.includes('RAF draw mutated')))
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
  installMission1VaultLoadWitness()
  current = structuredClone(world); subscriber()
  assert.equal(unsubscribed, true); assert.deepEqual(window.vaultLoadedBoundary, saved)
  current.worshipAcquisition.clock.elapsed++
  assert.equal(window.vaultLoadedBoundary.acquisition.clock.elapsed, 25)
  assert.equal(window.restoreVaultLoadWitness, undefined)
})

test('named scenario, maintained argv and explicit imports resolve without launching a runtime', () => {
  assert.equal(typeof scenario, 'function')
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const scenarioPath = resolve(root, 'scripts/local-render/mission1-building-screen.mjs')
  const options = parseOptions(['--game-root', root, '--scenario', scenarioPath, '--mission', '1', '--timeout', '1200000',
    '--profile', resolve(root, 'work/local-render-profiles/m1-building-screen-review-only'),
    '--output', resolve(root, 'work/orchestration/m1-building-screen-review-only'), '--port', '4188', '--browser', '/unassigned-review-only'])
  assert.equal(options.scenario, scenarioPath); assert.equal(options.mission, 1)
  for (const file of ['mission1-building-screen.mjs', 'mission1-building-screen-witness.mjs', 'mission1-vault-checkpoint.mjs']) {
    const source = readFileSync(resolve(root, 'scripts/local-render', file), 'utf8')
    for (const [, relative] of source.matchAll(/from '([^']+)'/g)) {
      if (relative.startsWith('node:')) continue
      assert.ok(existsSync(resolve(root, 'scripts/local-render', relative)), relative)
    }
    assert.doesNotMatch(source, /cancelAnimationFrame|requestAnimationFrame\s*=|\.tick\(|\.animate\(|\.render\(|indexedDB.*readwrite/)
  }
})
