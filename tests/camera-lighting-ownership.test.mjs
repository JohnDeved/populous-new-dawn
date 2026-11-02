import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, effect, tick } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { refreshTerrainLights } from '../app/world-effects.ts'
import { syncNativeTerrain } from '../app/world-terrain-runtime.ts'
import { addTerrainLight, updateTerrainLights } from '../app/terrain-light.ts'
import {
  beginCameraVisit, applyCameraShake, endCameraVisit, withSimulationCamera,
} from '../app/tribe-camera.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

// Supplied flat land and two real Blast allocations isolate the view-admission
// boundary. This is not an ordinary campaign, browser or native-render witness.
function lightingWorld(w = createWorld()) {
  w.effects.length = 0
  w.lights = Array(50).fill(null)
  w.terrain.fill(0)
  w.land.heights.fill(0)
  w.land.flags.fill(0)
  w.land.buildingIds.fill(0)
  w.land.landFlags &= ~2
  w.landVersion = w.terrainVersion
  w.randomState = 75
  w.paused = false
  w.speed = 1
  w.pendingTime = 0
  w.lightView = { x: 0, y: 0 } // Deliberately disagrees with the logical camera.
  const c = w.cameras, player = w.manaWorld.playerTribe
  Object.assign(c.tribes[player], { x: 8, y: 0, angle: 0 })
  return w
}

function addBlastPair(w) {
  // At view8 both lights are inside. View5 excludes the first; view11 excludes
  // the second. The latter also consumes a different private draw at view5.
  return [10501, 55051].map(x => {
    const f = effect(w, 'blast', browserPosition({ x, y: 0 }))
    return { id: f.id, position: { x, y: 0, h: 0 } }
  })
}

function lightSnapshot(w) {
  return structuredClone({
    cameras: w.cameras, lightView: w.lightView, lights: w.lights,
    cells: w.land.buildingIds, heights: w.land.heights,
    revision: w.lightRevision, seed: w.randomState,
  })
}

function expectedLighting(w, sources, view) {
  const land = structuredClone(w.land), lights = Array(50).fill(null)
  land.buildingIds.fill(0)
  const owners = new Map(sources.map(s => [s.id, s.position]))
  for (const source of sources)
    assert.equal(addTerrainLight(lights, {
      owner: source.id, position: source.position, strength: 4, flicker: 4, flags: 0,
    }), true)
  // Explicit expected view, not the proposed camera-reader implementation.
  // The unchanged helper already has separate native-fixture tests.
  updateTerrainLights(land, lights, id => owners.get(id), view, 75, true)
  return { land, lights }
}

function assertLogicalLighting(w, sources, view) {
  const { land, lights } = expectedLighting(w, sources, view)
  assert.deepEqual(w.lights, lights)
  assert.deepEqual(w.land.buildingIds, land.buildingIds)
  assert.equal(w.randomState, 75, 'private flicker must not consume gameplay RNG')
  return lights
}

test('actual display publication leaves lighting/camera owners unchanged across in-session Save/Load', async t => {
  await loadSceneFixture()
  const { updateView } = await import('../app/scene-camera-runtime.ts')
  const { GameScene } = await import('../app/scene.ts')
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    documentElement: { clientWidth: 1280 },
  } })
  t.after(() => {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument)
    else delete globalThis.document
  })
  // Keep the initialized terrain, occupants, footprints, shadows and capacity
  // owners coherent across the actual store boundary. Flat arithmetic fixtures
  // below are not used for this Save/Load or tick continuation.
  const store = createGameStore(), w = store.getWorld(), rendered = []
  w.paused = false
  w.pendingTime = 0
  w.lightView = { x: 0, y: 0 }
  Object.assign(w.cameras.tribes[w.manaWorld.playerTribe], { x: 8, y: 0, angle: 0 })
  syncNativeTerrain(w)
  addBlastPair(w)
  assert.ok(w.lights.filter(Boolean).length >= 2)
  w.cameras.viewZoom = 37
  const scene = {
    world: w, viewPoint: browserPosition({ x: 8, y: 0 }), cameraBearing: 0,
    overviewActive: false, overviewStage: null, globeMorph: { value: 0 },
    viewTransition: null, viewPreset: 0,
    container: { clientWidth: 1280, clientHeight: 720 },
    view: { update: (_width, _height, point, bearing, zoom) => {
      rendered.push({ point: { ...point }, bearing, zoom })
    } },
  }
  const zoom = Object.getOwnPropertyDescriptor(GameScene.prototype, 'viewZoom')
  assert.ok(zoom?.get && zoom?.set)
  Object.defineProperty(scene, 'viewZoom', zoom)
  const before = lightSnapshot(w)
  for (const x of [0, 8, 0, 8]) {
    scene.viewPoint = browserPosition({ x, y: 0 })
    updateView(scene) // Real publisher; only DOM and projection leaves supplied.
    assert.deepEqual(lightSnapshot(w), before)
  }
  assert.deepEqual(rendered.map(r => r.point.x), [-8, -7.96875, -8, -7.96875])
  assert.ok(rendered.every(r => r.bearing === 0 && r.zoom === 37))
  // Preserve nativePosition's former terrain-sync side effect on a separate
  // supplied flat fixture. It never enters Save/Load or the simulation tick.
  {
    const stale = lightingWorld(), expected = structuredClone(stale)
    stale.landVersion = expected.landVersion = -1
    syncNativeTerrain(expected)
    scene.world = stale
    try {
      updateView(scene)
      assert.equal(stale.landVersion, stale.terrainVersion)
      assert.deepEqual(stale, expected)
    } finally {
      scene.world = w
    }
  }
  // Fork before saving: this branch never crosses checkpoint normalization.
  const uninterrupted = structuredClone(w), startTurn = w.turn
  await store.saveCheckpoint()
  // Only the in-session checkpoint is asserted. The return value/storage write
  // is not a durable IndexedDB or fresh-page acceptance claim.
  w.cameras.tribes[w.manaWorld.playerTribe].x = 321
  assert.equal(store.loadCheckpoint(), true)
  const loaded = store.getWorld()
  assert.deepEqual(lightSnapshot(loaded), before)
  assert.deepEqual(lightSnapshot(loaded), lightSnapshot(uninterrupted))
  assert.deepEqual(loaded.cameras, before.cameras)
  assert.deepEqual(loaded.lightView, before.lightView)
  // A real off-grid tick includes its own withSimulationCamera scope and
  // end-turn lighting refresh. This is not a canonical full Scene/clock proof.
  const revision = loaded.lightRevision
  scene.world = loaded
  for (const x of [0, 8, 0, 8]) {
    scene.viewPoint = browserPosition({ x, y: 0 })
    updateView(scene)
  }
  tick(uninterrupted, 1 / 12)
  tick(loaded, 1 / 12)
  assert.equal(uninterrupted.turn, startTurn + 1)
  assert.equal(loaded.turn, startTurn + 1)
  assert.ok(loaded.lightRevision > revision, 'actual end-turn consumer was reached')
  assert.deepEqual(lightSnapshot(loaded), lightSnapshot(uninterrupted))
})

test('immediate Blast registration and later refresh read the logical view in each camera phase', async t => {
  const cases = [
    { name: 'idle without held correction', phase: 'idle', x: 0, held: 0, view: 0, movedView: 65500 },
    { name: 'idle with held correction', phase: 'idle', x: 5, held: 3, view: 8, movedView: 65503 },
    { name: 'off-grid simulation borrowing', phase: 'simulation', x: 5, held: 3, view: 8, movedView: 65500 },
    { name: 'camera visit with applied shake', phase: 'camera', x: 5, held: 3, view: 8, movedView: 65500 },
    { name: 'nonzero player tribe', phase: 'idle', player: 2, x: 5, held: 3, view: 8, movedView: 65503 },
  ]
  for (const entry of cases) await t.test(entry.name, () => {
    const w = lightingWorld(), c = w.cameras
    if (entry.player !== undefined) {
      w.manaWorld.playerTribe = entry.player
      c.tribes[0].x = 0 // Hard-coding tribe0 must disagree with the expected view.
    }
    const player = w.manaWorld.playerTribe
    Object.assign(c.tribes[player], { x: entry.x, y: 0, angle: 0 })
    c.held[player].x = entry.held
    const visit = () => {
      const ownersBefore = structuredClone(c)
      const sources = addBlastPair(w) // Calls the real immediate registration path.
      const expected = assertLogicalLighting(w, sources, { x: entry.view, y: 0 })
      if (entry.view === 8) {
        const unshifted = expectedLighting(w, sources, { x: 5, y: 0 })
        const doubled = expectedLighting(w, sources, { x: 11, y: 0 })
        assert.ok(expected[0].contributions.some(n => n !== 0))
        assert.ok(expected[1].contributions.some(n => n !== 0))
        assert.ok(unshifted.lights[0].contributions.every(n => n === 0))
        assert.notDeepEqual(expected[1].contributions, unshifted.lights[1].contributions,
          'later light must discriminate skipped first-light private RNG draw')
        assert.ok(doubled.lights[1].contributions.every(n => n === 0))
      }
      assert.deepEqual(c, ownersBefore, 'lighting must not write any camera owner')
      assert.equal(w.lights[0].contributions.some(n => n !== 0), entry.view === 8)
      assert.deepEqual(w.lightView, { x: 0, y: 0 })
      // A synchronous logical pose change must be read afresh, not cached at
      // a frame or camera-visit boundary. This is a supplied write, not focus UI.
      c.tribes[player].x = 65500
      const changedOwners = structuredClone(c)
      refreshTerrainLights(w)
      assertLogicalLighting(w, sources, { x: entry.movedView, y: 0 })
      assert.equal(w.lights[0].contributions.some(n => n !== 0), false)
      assert.deepEqual(c, changedOwners)
    }
    if (entry.phase === 'simulation') withSimulationCamera(c, visit)
    else if (entry.phase === 'camera') {
      Object.assign(c.shake, { active: true, amplitude: 8 })
      beginCameraVisit(c)
      try {
        applyCameraShake(c, player, 0, 75)
        assert.equal(c.tribes[player].x, 8, 'retained seed75 X correction is +3')
        assert.equal(c.tribes[player].y, 0, 'retained seed75 Y correction is zero')
        visit()
      } finally {
        endCameraVisit(c, player)
      }
    } else visit()
    assert.equal(c.phase, 'idle')
  })
})
