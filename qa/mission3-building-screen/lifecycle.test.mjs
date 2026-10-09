// Supplied DOM/start callback, actual product store and UI controller. This is
// not an ordinary browser, committed profile or rendered acceptance result.
import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../../app/game-store.ts'
import { tick } from '../../app/model.ts'
import { startPendingWorshipAcquisitions } from '../../app/worship-acquisition-runtime.ts'
import { armBuildingSceneStart, armM3Save, installM3CheckpointState, prepareM3Replacement } from '../../scripts/local-render/mission3-building-lifecycle.mjs'
import { requireLoadBoundary, requireRestartBoundary } from '../../scripts/local-render/mission3-building-screen.mjs'
import { checkpointObservation } from '../../scripts/local-render/checkpoint-observer.mjs'

function fixture(t) {
  const store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(), vault = world.shrines.find(head => head.kind === 'vault')
  vault.forced = true; vault.reset = false
  tick(world, 1 / 12)
  for (let i = 0; i < 6; i++) tick(world, 1 / 12)
  startPendingWorshipAcquisitions(world, { cue() {}, failed() { assert.fail('Supplied HUD geometry') }, geometry: () => ({
    viewport: { x: 100, y: 0, width: 540, height: 480 }, origin: { x: 420, y: 180 }, target: { x: 25, y: 230 },
    targetRect: { x: 2, y: 204, width: 46, height: 52 }, targetHud: { x: 25, y: 230 }, hudScale: 1,
  }) })
  world.paused = true
  const events = [], buttons = ['Save checkpoint', 'Load checkpoint', 'Restart world'].map(name => {
    const listeners = new Set()
    return { textContent: name, isConnected: true, disabled: false, contains: () => false,
      addEventListener(type, callback) { assert.equal(type, 'click'); listeners.add(callback) },
      removeEventListener(type, callback) { assert.equal(type, 'click'); listeners.delete(callback) }, listeners }
  })
  globalThis.window = { testStore: store }
  globalThis.document = { querySelectorAll: () => buttons }
  installM3CheckpointState()
  const click = async (name, action, trusted = true) => {
    const button = buttons.find(button => button.textContent === name)
    assert.ok(button)
    for (const listener of button.listeners) listener({ target: button, isTrusted: trusted })
    events.push(name)
    return action?.()
  }
  const fakeScreen = () => { window.m3BuildingScreen = { close() {
    delete window.m3BuildingScreen
    return { restored: true, errors: [], frames: {} }
  } } }
  fakeScreen()
  t.after(() => {
    window.m3Replacement?.close(); window.finishM3Save?.()
    for (const name of ['window', 'document', 'testCheckpoint']) delete globalThis[name]
  })
  return { world, store, click, buttons, events, fakeScreen }
}

test('trusted Save → synchronous Load reset → early attachment → active Restart uses exact public labels and owners', async t => {
  const f = fixture(t), binding = f.store.bindPresentation(f.world)
  binding.advance(); binding.advance()
  armM3Save()
  await f.click('Save checkpoint', () => f.store.saveCheckpoint())
  const saved = { boundary: window.finishM3Save() }
  assert.equal(saved.boundary.trusted, true)
  assert.deepEqual(saved.boundary.errors, [])
  assert.equal(saved.boundary.snapshot.acquisition.controllers.building.active, true)
  globalThis.testCheckpoint = { version: 1, world: structuredClone(f.world) }
  saved.digest = { checkpoint: await checkpointObservation({ observationName: 'testCheckpoint' }) }
  binding.advance()
  const attached = [], ref = { current: null }
  class Scene {
    constructor(world) { this.world = world }
    start() { f.events.push('original Scene.start'); return true }
  }
  const originalStart = Scene.prototype.start
  // Only resolve the browser's /app/scene.ts import and supplied Scene/DOM here;
  // execute the actual preparation function and unchanged early-start wrapper.
  const prepare = Function('suppliedScene', 'armBuildingSceneStart', 'currentSceneRef', 'installM3Screen',
    `return (${prepareM3Replacement.toString().replace("import('/app/scene.ts')", 'Promise.resolve({ GameScene: suppliedScene })')})`)(
      Scene, armBuildingSceneStart, () => ref, (id, birth) => {
        attached.push({ id, birth, world: f.store.getWorld(), resource: f.store.getPresentationSnapshot() })
        f.events.push('attach before scheduled RAF'); f.fakeScreen()
      })
  await prepare({ kind: 'load', shamanId: 46, birth: { turn: 1, gift: { id: 55 } } })
  await f.click('Load checkpoint', () => {
    assert.equal(f.store.loadCheckpoint(), true)
    f.store.change(world => { world.paused = false }) // Actual page.beginLoad's subsequent public behavior.
  })
  const scene = new Scene(f.store.getWorld())
  ref.current = scene
  assert.equal(scene.start(), true)
  assert.equal(Scene.prototype.start, originalStart)
  const loaded = window.m3Replacement.close()
  globalThis.testCheckpoint = window.m3LoadedBoundary
  const digest = await checkpointObservation({ observationName: 'testCheckpoint' })
  requireLoadBoundary(loaded, saved, digest)
  assert.equal(loaded.after.snapshot.paused, true)
  assert.equal(f.store.getWorld().paused, false)
  assert.equal(attached[0].resource.counter, 0)
  assert.deepEqual(f.events.slice(-2), ['original Scene.start', 'attach before scheduled RAF'])
  const wrong = structuredClone(loaded)
  wrong.after.resource.counter = 1
  assert.throws(() => requireLoadBoundary(wrong, saved, digest))
  f.store.change(world => { world.paused = true })
  const currentBinding = f.store.bindPresentation(f.store.getWorld())
  currentBinding.advance()
  await prepareM3Replacement({ kind: 'restart', shamanId: 46 })
  await f.click('Restart world', () => f.store.restart())
  const restarted = window.m3Replacement.close()
  requireRestartBoundary(restarted)
  assert.deepEqual(f.events.filter(name => !name.includes(' ' ) || name.endsWith('checkpoint') || name === 'Restart world'),
    ['Save checkpoint', 'Load checkpoint', 'Restart world'])
  assert.ok(f.buttons.every(button => button.listeners.size === 0))
})

test('untrusted Save cannot establish a boundary and its listener is removed', async t => {
  const f = fixture(t)
  armM3Save()
  await f.click('Save checkpoint', null, false)
  const evidence = window.finishM3Save()
  assert.equal(evidence.snapshot, null)
  assert.equal(evidence.trusted, false)
  assert.ok(evidence.errors.some(error => error.includes('Trusted public Save')))
  assert.ok(f.buttons.every(button => button.listeners.size === 0))
})

test('missing public replacement control installs no Scene hook or subscription', async t => {
  const f = fixture(t)
  f.buttons.find(button => button.textContent === 'Restart world').disabled = true
  await assert.rejects(prepareM3Replacement({ kind: 'restart', shamanId: 46 }), /unavailable/)
  assert.equal(window.m3Replacement, undefined)
  assert.ok(f.buttons.every(button => button.listeners.size === 0))
})
