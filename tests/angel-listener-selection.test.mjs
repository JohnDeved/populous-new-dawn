import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, cast, tick, command, setSelection, HOME } from '../app/model.ts'
import { syncLandscapeObjects } from '../app/world-terrain-runtime.ts'
import { unitAnimationSource } from '../app/unit-animation-source.ts'
import { createGameStore } from '../app/game-store.ts'

// Supplied field, people and stock. Sermon acquisition, casting, projectile
// arrival and Angel visits are ordinary live producers; no state23 is assigned.
function field() {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  syncLandscapeObjects(w)
  addUnit(w, 'blue', 'shaman', { x: HOME.x, z: HOME.z + 8 })
  return w
}

function listen(w, victim) {
  const preacher = addUnit(w, 'blue', 'preacher', { x: HOME.x + 2, z: HOME.z })
  for (let n = 0; n < 50 && unitAnimationSource(victim)?.state !== 23; n++) tick(w, 1 / 12)
  assert.equal(unitAnimationSource(victim)?.state, 23)
  assert.equal(unitAnimationSource(victim)?.workTarget, preacher.id)
  return preacher
}

function launch(w, point) {
  w.shots.angel = 1
  assert.equal(cast(w, 'angel', point), true)
  assert.equal(w.shots.angel, 0)
  for (let n = 0; n < 120 && !w.effects.some(e => e.angel); n++) tick(w, 1 / 12)
  const angel = w.effects.find(e => e.angel)
  assert.ok(angel)
  assert.equal(angel.angel.target, null)
  return angel
}

function listeningField() {
  const w = field(), victim = addUnit(w, 'red', 'brave', { x: HOME.x + 3, z: HOME.z })
  const preacher = listen(w, victim)
  const angel = launch(w, { x: HOME.x + 3, z: HOME.z })
  assert.equal(unitAnimationSource(victim)?.state, 23)
  return { w, victim, preacher, angel }
}

test('Angel initial selection skips a real sermon listener for a farther eligible enemy', () => {
  const { w, victim, angel } = listeningField()
  const farther = addUnit(w, 'red', 'brave', { x: HOME.x + 9, z: HOME.z })
  tick(w, 1 / 12)
  assert.equal(unitAnimationSource(victim)?.state, 23)
  assert.equal(angel.angel.target, farther.id)
  assert.equal(victim.hp, 50)
})

test('Angel acquires nobody while its only enemy is listening, then acquires after sermon release', () => {
  const { w, victim, preacher, angel } = listeningField()
  tick(w, 1 / 12)
  assert.equal(angel.angel.target, null)
  assert.equal(angel.angel.phase, 'seeking')
  setSelection(w, [preacher.id])
  assert.equal(command(w, { x: HOME.x - 20, z: HOME.z }), true)
  for (let n = 0; n < 16 && angel.angel.target === null; n++) tick(w, 1 / 12)
  assert.notEqual(unitAnimationSource(victim)?.state, 23)
  assert.equal(angel.angel.target, victim.id)
})

test('an already-held Angel target remains held when ordinary preaching puts it into state23', () => {
  const w = field(), victim = addUnit(w, 'red', 'brave', { x: HOME.x + 3, z: HOME.z })
  const angel = launch(w, { x: HOME.x - 6, z: HOME.z })
  tick(w, 1 / 12)
  assert.equal(angel.angel.target, victim.id)
  assert.equal(angel.angel.phase, 'seeking', 'target is held while still chasing')
  // The late supplied Preacher makes a real sermon after target acquisition.
  listen(w, victim)
  tick(w, 1 / 12)
  assert.equal(unitAnimationSource(victim)?.state, 23)
  assert.equal(angel.angel.target, victim.id, 'initial-selection filter is not a retained-target veto')
})

test('checkpoint preserves listener exclusion and subsequent ordinary release/selection', async () => {
  const { w, victim, preacher, angel } = listeningField()
  const store = createGameStore()
  Object.assign(store.getWorld(), w)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.deepEqual(restored, w)
  tick(w, 1 / 12)
  tick(restored, 1 / 12)
  assert.deepEqual(restored, w)
  assert.equal(angel.angel.target, null)
  for (const world of [w, restored]) {
    setSelection(world, [preacher.id])
    assert.equal(command(world, { x: HOME.x - 20, z: HOME.z }), true)
  }
  for (let n = 0; n < 16 && angel.angel.target === null; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, w)
  }
  assert.equal(angel.angel.target, victim.id)
})
