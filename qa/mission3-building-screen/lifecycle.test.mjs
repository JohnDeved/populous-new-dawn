// Supplied DOM/start callback, actual product store and UI controller. This is
// not an ordinary browser, committed profile or rendered acceptance result.
import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../../app/game-store.ts'
import { tick, setSelection, placeBuilding } from '../../app/model.ts'
import { selectFollowers } from '../../app/selection-runtime.ts'
import { nativeUnitModel } from '../../app/unit-kinds.ts'
import { currentPersonOrder } from '../../app/person-orders.ts'
import { buildingStage } from '../../app/world-terrain-runtime.ts'
import { campaignShamanReadiness } from '../../scripts/campaign-start-readiness.mjs'
import { finishLevelStart } from '../../tests/level-start-fixture.mjs'
import { installTempleRouteObservation } from '../../scripts/local-render/mission3-temple-witness.mjs'
import { createMission1VaultInput } from '../../scripts/local-render/mission1-vault-input.mjs'
import { startPendingWorshipAcquisitions } from '../../app/worship-acquisition-runtime.ts'
import {
  armBuildingSceneStart,
  armM3Save,
  installM3CheckpointState,
  prepareM3Replacement,
} from '../../scripts/local-render/mission3-building-lifecycle.mjs'
import {
  requireLoadBoundary,
  requireRestartBoundary,
} from '../../scripts/local-render/mission3-building-screen.mjs'
import { checkpointObservation } from '../../scripts/local-render/checkpoint-observer.mjs'

const installRoute = () =>
  Function(
    'imports',
    `return (${installTempleRouteObservation.toString().replaceAll('import(', 'imports(')})()`
  )(async path => {
    const modules = {
      '/app/person-orders.ts': { currentPersonOrder },
      '/app/world-terrain-runtime.ts': { buildingStage },
      '/scripts/campaign-start-readiness.mjs': { campaignShamanReadiness },
    }
    assert.ok(modules[path])
    return modules[path]
  })

function fixture(t) {
  const store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(),
    vault = world.shrines.find(head => head.kind === 'vault')
  vault.forced = true
  vault.reset = false
  tick(world, 1 / 12)
  for (let i = 0; i < 6; i++) tick(world, 1 / 12)
  startPendingWorshipAcquisitions(world, {
    cue() {},
    failed() {
      assert.fail('Supplied HUD geometry')
    },
    geometry: () => ({
      viewport: { x: 100, y: 0, width: 540, height: 480 },
      origin: { x: 420, y: 180 },
      target: { x: 25, y: 230 },
      targetRect: { x: 2, y: 204, width: 46, height: 52 },
      targetHud: { x: 25, y: 230 },
      hudScale: 1,
    }),
  })
  world.paused = true
  const events = [],
    buttons = ['Save checkpoint', 'Load checkpoint', 'Restart world'].map(name => {
      const listeners = new Set()
      return {
        textContent: name,
        isConnected: true,
        disabled: false,
        contains: () => false,
        addEventListener(type, callback) {
          assert.equal(type, 'click')
          listeners.add(callback)
        },
        removeEventListener(type, callback) {
          assert.equal(type, 'click')
          listeners.delete(callback)
        },
        listeners,
      }
    })
  globalThis.window = { testStore: store }
  globalThis.document = { querySelectorAll: () => buttons, querySelector: () => null }
  installM3CheckpointState()
  const click = async (name, action, trusted = true) => {
    const button = buttons.find(button => button.textContent === name)
    assert.ok(button)
    for (const listener of button.listeners) listener({ target: button, isTrusted: trusted })
    events.push(name)
    return action?.()
  }
  const fakeScreen = () => {
    window.m3BuildingScreen = {
      close() {
        delete window.m3BuildingScreen
        return { restored: true, errors: [], frames: {} }
      },
    }
  }
  fakeScreen()
  t.after(() => {
    window.m3Replacement?.close()
    window.finishM3Save?.()
    for (const name of ['window', 'document', 'testCheckpoint']) delete globalThis[name]
  })
  return { world, store, click, buttons, events, fakeScreen }
}

test('trusted Save → synchronous Load reset → early attachment → active Restart uses exact public labels and owners', async t => {
  const f = fixture(t),
    binding = f.store.bindPresentation(f.world)
  class Scene {
    constructor(world) {
      this.world = world
      this.started = true
      this.gameClock = { animationFrame: 1 }
      this.renderer = {
        domElement: { isConnected: true },
        getContext: () => ({ isContextLost: () => false }),
      }
    }
    start() {
      f.events.push('original Scene.start')
      return true
    }
  }
  const ref = { current: new Scene(f.world) }
  window.testSceneRef = ref
  await installRoute()
  const originalRoute = window.m3TempleRoute,
    originalActor = originalRoute.shaman
  const inputActors = []
  const input = createMission1VaultInput({
    originalShamanId: originalActor.id,
    signal: new AbortController().signal,
    report: { actions: [] },
    save() {},
    page: {
      async evaluate(fn, arg) {
        inputActors.push(
          window.testSceneRef.current.world.units.find(unit => unit.id === originalActor.id)
        )
        return fn(arg)
      },
      getByRole(role, options) {
        assert.equal(role, 'button')
        assert.equal(options.exact, true)
        assert.equal(options.name, 'Pause game')
        return {
          click: async () =>
            f.store.change(world => {
              world.paused = true
            }),
        }
      },
      async waitForFunction(predicate) {
        assert.equal(predicate(), true)
      },
    },
  })
  binding.advance()
  binding.advance()
  armM3Save()
  await f.click('Save checkpoint', () => f.store.saveCheckpoint())
  const saved = { boundary: window.finishM3Save() }
  assert.equal(saved.boundary.trusted, true)
  assert.deepEqual(saved.boundary.errors, [])
  assert.equal(saved.boundary.snapshot.acquisition.controllers.building.active, true)
  globalThis.testCheckpoint = { version: 1, world: structuredClone(f.world) }
  saved.digest = { checkpoint: await checkpointObservation({ observationName: 'testCheckpoint' }) }
  binding.advance()
  const attached = []
  const originalStart = Scene.prototype.start
  // Only resolve the browser's /app/scene.ts import and supplied Scene/DOM here;
  // execute the actual preparation function and unchanged early-start wrapper.
  const prepare = Function(
    'suppliedScene',
    'armBuildingSceneStart',
    'currentSceneRef',
    'installM3Screen',
    `return (${prepareM3Replacement.toString().replace("import('/app/scene.ts')", 'Promise.resolve({ GameScene: suppliedScene })')})`
  )(
    Scene,
    armBuildingSceneStart,
    () => ref,
    (id, birth) => {
      attached.push({
        id,
        birth,
        world: f.store.getWorld(),
        resource: f.store.getPresentationSnapshot(),
      })
      f.events.push('attach before scheduled RAF')
      f.fakeScreen()
    }
  )
  await prepare({ kind: 'load', shamanId: 46, birth: { turn: 1, gift: { id: 55 } } })
  await f.click('Load checkpoint', () => {
    assert.equal(f.store.loadCheckpoint(), true)
    f.store.change(world => {
      world.paused = false
    }) // Actual page.beginLoad's subsequent public behavior.
  })
  assert.equal(window.m3TempleRoute, undefined, 'Trusted Load detached the original route observer')
  const scene = new Scene(f.store.getWorld())
  ref.current = scene
  assert.equal(scene.start(), true)
  assert.equal(Scene.prototype.start, originalStart)
  const loaded = window.m3Replacement.close()
  globalThis.testCheckpoint = window.m3LoadedBoundary
  const digest = await checkpointObservation({ observationName: 'testCheckpoint' })
  requireLoadBoundary(loaded, saved, digest)
  await installRoute()
  const restoredRoute = window.m3TempleRoute
  assert.equal(restoredRoute.world, f.store.getWorld())
  assert.notEqual(restoredRoute.world, f.world)
  assert.notEqual(restoredRoute.shaman, originalActor)
  assert.equal(restoredRoute.read().sceneMatches, true)
  assert.equal(originalRoute.read().sceneMatches, false, 'Old identity guards remain strict')
  assert.equal(loaded.after.snapshot.paused, true)
  assert.equal(f.store.getWorld().paused, false)
  assert.equal(attached[0].resource.counter, 0)
  assert.deepEqual(f.events.slice(-2), ['original Scene.start', 'attach before scheduled RAF'])
  const wrong = structuredClone(loaded)
  wrong.after.resource.counter = 1
  assert.throws(() => requireLoadBoundary(wrong, saved, digest))
  await input.pause()
  assert.equal(
    inputActors.at(-1),
    restoredRoute.shaman,
    'The existing input helper reads the restored actor, not its predecessor'
  )
  const currentBinding = f.store.bindPresentation(f.store.getWorld())
  currentBinding.advance()
  await prepareM3Replacement({ kind: 'restart', shamanId: 46 })
  await f.click('Restart world', () => f.store.restart())
  const restarted = window.m3Replacement.close()
  requireRestartBoundary(restarted)
  assert.equal(
    window.m3TempleRoute,
    undefined,
    'Trusted Restart detached the restored route observer'
  )
  assert.equal(restoredRoute.read().sceneMatches, false)
  await prepare({ kind: 'load', shamanId: originalActor.id, birth: { turn: 1, gift: { id: 55 } } })
  await f.click('Load checkpoint', () => {
    f.store.loadCheckpoint()
    f.store.change(world => {
      world.paused = false
    })
  })
  ref.current = new Scene(f.store.getWorld())
  ref.current.start()
  window.m3Replacement.close()
  await installRoute()
  const finalRoute = window.m3TempleRoute,
    finalWorld = finalRoute.world
  assert.equal(finalWorld, f.store.getWorld())
  assert.notEqual(finalRoute.shaman, restoredRoute.shaman)
  assert.notEqual(finalRoute.shaman, originalActor)
  finishLevelStart(finalWorld)
  for (let turn = 0; !finalWorld.unlockedTemple && turn < 100; turn++) tick(finalWorld, 1 / 12)
  assert.equal(finalWorld.unlockedTemple, true)
  setSelection(finalWorld, [])
  selectFollowers(
    finalWorld,
    nativeUnitModel('brave'),
    { x: (35 + 8) * 256, y: (-81 - 8) * 256 },
    'five'
  )
  assert.equal(finalWorld.selected.length, 5)
  assert.equal(placeBuilding(finalWorld, 'temple', { x: 24, z: 70 }), true)
  const temple = finalWorld.buildings.find(
    building => building.team === 'blue' && building.kind === 'temple'
  )
  for (let turn = 0; temple.progress !== 1 && turn < 6000; turn++) tick(finalWorld, 1 / 12)
  assert.equal(temple.progress, 1)
  assert.equal(finalRoute.read().sceneMatches, true)
  assert.equal(finalRoute.read().actorMatches, true)
  assert.equal(f.world.unlockedTemple, false)
  assert.equal(
    f.world.buildings.some(building => building.kind === 'temple' && building.team === 'blue'),
    false
  )
  await f.click('Save checkpoint', () => f.store.saveCheckpoint())
  finalRoute.close()
  assert.equal(f.store.loadCheckpoint(), true, 'Read back the actual final in-session save')
  assert.equal(f.store.getWorld().buildings.find(building => building.id === temple.id).progress, 1)
  assert.deepEqual(
    f.events.filter(name => name.endsWith('checkpoint') || name === 'Restart world'),
    ['Save checkpoint', 'Load checkpoint', 'Restart world', 'Load checkpoint', 'Save checkpoint']
  )
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

test('foreign Scene.start cleanup keeps that owner and returns captured boundary and PNG evidence', async t => {
  const f = fixture(t)
  await f.store.saveCheckpoint()
  const png = 'data:image/png;base64,AAAA'
  window.m3BuildingScreen = {
    close() {
      delete window.m3BuildingScreen
      return { restored: true, errors: [], frames: { whole: { overlayPng: png } } }
    },
  }
  class Scene {
    start() {
      return true
    }
  }
  const prepare = Function(
    'suppliedScene',
    'armBuildingSceneStart',
    'currentSceneRef',
    'installM3Screen',
    `return (${prepareM3Replacement.toString().replace("import('/app/scene.ts')", 'Promise.resolve({ GameScene: suppliedScene })')})`
  )(
    Scene,
    armBuildingSceneStart,
    () => null,
    () => assert.fail('No Scene starts in this interrupted fixture')
  )
  await prepare({ kind: 'load', shamanId: 46 })
  await f.click('Load checkpoint', () => f.store.loadCheckpoint())
  const foreign = () => false
  Scene.prototype.start = foreign
  const evidence = window.m3Replacement.close()
  assert.equal(Scene.prototype.start, foreign)
  assert.equal(window.m3Replacement, undefined)
  assert.equal(evidence.trusted, true)
  assert.equal(evidence.before.snapshot.turn, f.world.turn)
  assert.equal(evidence.after.resource.counter, 0)
  assert.equal(evidence.screen.frames.whole.overlayPng, png)
  assert.equal(evidence.start.restored, false)
  assert.ok(
    evidence.errors.some(error => error.includes('Scene start observation ownership changed'))
  )
  assert.ok(f.buttons.every(button => button.listeners.size === 0))
})

test('startup Load discovers the actual store without a Scene and restores M3 from a null session bank', async t => {
  const f = fixture(t)
  f.store.saveCheckpoint()
  const saved = { boundary: { snapshot: window.m3CheckpointState(f.world) } }
  globalThis.testCheckpoint = { version: 1, world: structuredClone(f.world) }
  saved.digest = { checkpoint: await checkpointObservation({ observationName: 'testCheckpoint' }) }
  f.store.startMission(1)
  assert.equal(f.store.getPresentationSnapshot(), null)
  delete window.testStore
  delete window.m3BuildingScreen
  const load = f.buttons.find(button => button.textContent === 'Load checkpoint')
  load.textContent = 'Load Game'
  document.querySelector = selector =>
    selector === 'main'
      ? { __reactFiber_fixture: { memoizedState: { memoizedState: f.store } } }
      : null
  class Scene {
    constructor(world) {
      this.world = world
    }
    start() {
      return true
    }
  }
  const ref = { current: null },
    attached = []
  const prepare = Function(
    'suppliedScene',
    'armBuildingSceneStart',
    'currentSceneRef',
    'installM3Screen',
    `return (${prepareM3Replacement.toString().replace("import('/app/scene.ts')", 'Promise.resolve({ GameScene: suppliedScene })')})`
  )(
    Scene,
    armBuildingSceneStart,
    () => ref,
    (_id, _birth) => {
      attached.push(f.store.getWorld())
      f.fakeScreen()
    }
  )
  await prepare({ kind: 'load', startup: true, shamanId: 46 })
  await f.click('Load Game', () => {
    f.store.loadCheckpoint()
    f.store.change(world => {
      world.paused = false
    })
  })
  ref.current = new Scene(f.store.getWorld())
  ref.current.start()
  const transition = window.m3Replacement.close()
  globalThis.testCheckpoint = window.m3LoadedBoundary
  requireLoadBoundary(
    transition,
    saved,
    await checkpointObservation({ observationName: 'testCheckpoint' })
  )
  assert.equal(transition.before.snapshot.level, 1)
  assert.equal(transition.before.resource, null)
  assert.equal(window.testStore, f.store)
  assert.equal(attached[0], f.store.getWorld())
  assert.notEqual(attached[0], f.world)
  const invalid = structuredClone(transition)
  invalid.before.resource = { bank: 'p', epoch: 55 }
  assert.throws(() => requireLoadBoundary(invalid, saved, saved.digest.checkpoint))
})
