import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createWorld, addUnit, tick, setSelection, disguiseSelectedSpies,
  command, HOME, nativePosition,
} from '../app/model.ts'
import { syncLandscapeObjects } from '../app/world-terrain-runtime.ts'
import { stepComputerSpells } from '../app/computer-runtime.ts'
import { unitAnimationSource } from '../app/unit-animation-source.ts'
import { createGameStore } from '../app/game-store.ts'
import { stepAngel } from '../app/angel.ts'

// Supplied field, roster, AI funding/entry/readiness and remembered target cell.
// Public command16 produces disguise bytes. The shipped AI dispatcher allocates
// the enemy spell; ordinary projectile arrival and Angel selection follow.
function scenario({ tribe = 1, turns = 64, kind = 'spy' } = {}) {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  syncLandscapeObjects(w)
  const shaman = addUnit(w, 'red', 'shaman', { x: HOME.x, z: HOME.z + 8 }),
    spy = addUnit(w, 'blue', kind, { x: HOME.x + 3, z: HOME.z })
  if (kind === 'spy') {
    setSelection(w, [spy.id])
    assert.equal(disguiseSelectedSpies(w, tribe), true)
  }
  for (let n = 0; n < turns; n++) tick(w, 1 / 12)
  if (kind === 'spy') {
    assert.equal(unitAnimationSource(spy).disguise >>> 6, tribe)
    assert.equal(!!(unitAnimationSource(spy).disguise & 63), turns < 64)
  }
  assert.equal(w.turn & 15, 0)
  w.ai.flags = 0
  w.ai.attributes[32] = 0
  w.ai.attributes[43] = 12
  w.ai.spellEntries = Array.from({ length: 8 }, (_, i) =>
    ({ model: i ? 0 : 13, mana: 0, people: 1, mode: 0, range: 0 }))
  w.manaTribes[1].mana = 1000000
  Object.assign(w.manaWorld.spells[1], { available: 1 << 13, disabled: 0 })
  w.manaWorld.spells[1].stocks.fill(0)
  w.manaWorld.spells[1].stocks[13] = 1
  w.castingTribes[1].cooldown = 0
  w.castingTribes[1].aiCooldown = 0
  const p = nativePosition(w, spy), cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  Object.assign(w.spellScan, { cursor: 0, paused: 1, targets: [cell, 0, 0, 0] })
  stepComputerSpells(w, 1)
  assert.equal(shaman.casting?.spell, 'angel')
  assert.equal(w.spellCasts[1][13], 1)
  assert.equal(w.manaWorld.spells[1].stocks[13], 0)
  assert.equal(w.projectiles.length, 1)
  for (let n = 0; n < 120 && !w.effects.some(e => e.angel); n++) tick(w, 1 / 12)
  const angel = w.effects.find(e => e.angel)
  assert.ok(angel)
  assert.equal(angel.team, 'red')
  assert.equal(angel.angel.target, null)
  return { w, shaman, spy, angel }
}

for (const [name, options, hidden] of [
  ['completed matching disguise', {}, true],
  ['pending disguise counter', { turns: 16 }, false],
  ['other apparent tribe', { tribe: 2 }, false],
  ['ordinary non-Spy', { kind: 'brave', turns: 16 }, false],
]) test(`Angel initial selection respects ${name}`, () => {
  const { w, spy, angel } = scenario(options)
  tick(w, 1 / 12)
  assert.equal(angel.angel.target, hidden ? null : spy.id)
})

test('Angel skips the nearer disguised Spy for a farther eligible person', () => {
  const { w, spy, angel } = scenario()
  const farther = addUnit(w, 'blue', 'brave', { x: HOME.x + 9, z: HOME.z })
  tick(w, 1 / 12)
  assert.equal(unitAnimationSource(spy).disguise, 0x40)
  assert.equal(angel.angel.target, farther.id)
})

test('ordinary combat reveals the Spy and makes it eligible for initial Angel selection', () => {
  const { w, spy, shaman, angel } = scenario()
  tick(w, 1 / 12)
  assert.equal(angel.angel.target, null)
  setSelection(w, [spy.id])
  assert.equal(command(w, shaman), true)
  for (let n = 0; n < 200 && angel.angel.target === null; n++) tick(w, 1 / 12)
  assert.equal(unitAnimationSource(spy).disguise, 0)
  assert.equal(angel.angel.target, spy.id)
})

test('an already-held Angel target stays held when its public disguise countdown completes', () => {
  const { w, spy, angel } = scenario({ turns: 48 })
  tick(w, 1 / 12)
  assert.ok(unitAnimationSource(spy).disguise & 63)
  assert.equal(angel.angel.target, spy.id)
  for (let n = 0; n < 16 && unitAnimationSource(spy).disguise & 63; n++) tick(w, 1 / 12)
  assert.equal(unitAnimationSource(spy).disguise, 0x40)
  tick(w, 1 / 12)
  assert.equal(angel.angel.target, spy.id)
})

test('missing legacy disguise field preserves prior eligibility instead of inventing apparent tribe', () => {
  const { w, spy, angel } = scenario()
  // Supplied legacy-consumer state: undefined coerces to apparent Blue if it is
  // passed unchecked to the native byte predicate. No natural tribe change claim.
  const person = unitAnimationSource(spy)
  angel.team = 'blue'
  spy.team = 'red'
  person.tribe = 1
  delete person.disguise
  tick(w, 1 / 12)
  assert.equal(angel.angel.target, spy.id)
})

test('missing legacy person owner preserves initial Angel eligibility', () => {
  const { w, spy, angel } = scenario()
  // Explicit terminal-consumer legacy boundary after the real spell producer.
  spy.native = undefined
  assert.equal(unitAnimationSource(spy), null)
  stepAngel(w, angel)
  assert.equal(spy.native, undefined)
  assert.equal(angel.angel.target, spy.id)
})

test('checkpoint preserves completed disguise and enemy Angel exclusion', async () => {
  const { w, spy, angel } = scenario()
  const store = createGameStore()
  Object.assign(store.getWorld(), w)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.deepEqual(restored, w)
  for (let n = 0; n < 12; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored, w)
  }
  assert.equal(unitAnimationSource(spy).disguise, 0x40)
  assert.equal(angel.angel.target, null)
})
