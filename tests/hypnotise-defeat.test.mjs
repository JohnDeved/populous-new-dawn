import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, applyHypnotise, stepUnitHypnotise, cast, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

function captured() {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.units = []
  const enemy = addUnit(w, 'red', 'brave', { x: 1, z: 13 })
  applyHypnotise(w, enemy, 'blue')
  const u = w.units.find(u => u.hypnotise)
  assert.ok(u)
  return { w, u }
}

for (const counter of [0, 1, 6, 7, 8, 254, 255]) {
  test(`original tribe defeat clears Hypnotise before expiry at counter ${counter}`, () => {
    const { w, u } = captured()
    u.hypnotise.counter = counter
    u.hypnotise.remaining = 55
    w.manaTribes[1].defeatTimer = 1
    const nextId = w.nextId, rng = w.randomState, p = u.native
    w.selected = [u.id]
    stepUnitHypnotise(w)
    assert.ok(w.units.includes(u))
    assert.equal(u.hypnotise, undefined)
    assert.equal(u.native, p)
    assert.equal(u.team, 'blue')
    assert.equal(p.tribe, 0)
    assert.equal(p.flags4 & 0x4000, 0)
    assert.equal(w.nextId, nextId)
    assert.equal(w.randomState, rng)
    assert.deepEqual(w.selected, [u.id])
  })
}

test('living original tribe keeps the established countdown and replacement boundary', () => {
  const { w, u } = captured()
  u.hypnotise.remaining = 2
  u.hypnotise.counter = 6
  stepUnitHypnotise(w)
  assert.equal(u.hypnotise.remaining, 2)
  stepUnitHypnotise(w)
  assert.equal(u.hypnotise.remaining, 1)
  for (let i = 0; i < 7; i++) stepUnitHypnotise(w)
  assert.ok(w.units.includes(u))
  stepUnitHypnotise(w)
  assert.ok(!w.units.includes(u))
  const restored = w.units.find(v => v.team === 'red')
  assert.ok(restored)
  assert.notEqual(restored.id, u.id)
  assert.equal(restored.hypnotise, undefined)
})

function ordinaryDefeat() {
  const w = createWorld(), s = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  w.units = [s]
  w.buildings = []
  w.trees = []
  w.shrines = []
  w.terrain.fill(3)
  w.terrainVersion++
  Object.assign(s, { x: 0, z: 20, path: [], casting: null })
  addUnit(w, 'red', 'brave', { x: 1, z: 13 })
  w.shots.hypnotise = 1
  assert.ok(cast(w, 'hypnotise', { x: 1, z: 13 }))
  for (let i = 0; i < 150 && !w.manaTribes[1].defeatTimer; i++) tick(w, 1 / 12)
  const u = w.units.find(u => u.hypnotise)
  assert.ok(u)
  assert.equal(w.manaTribes[1].defeatTimer, 1)
  assert.ok(u.hypnotise.remaining > 1)
  return { w, u }
}

test('ordinary last-Brave conversion makes ownership permanent on the next visit', () => {
  const { w, u } = ordinaryDefeat()
  const id = u.id
  tick(w, 1 / 12)
  assert.equal(u.hypnotise, undefined)
  assert.equal(u.native.flags4 & 0x4000, 0)
  assert.equal(u.id, id)
  assert.equal(u.team, 'blue')
  assert.ok(w.units.includes(u))
})

test('death after permanence belongs to the current tribe rather than the defeated original tribe', () => {
  const { w, u } = ordinaryDefeat()
  tick(w, 1 / 12)
  const before = structuredClone(w.killCredits)
  u.native.damageAttacker = 2
  u.hp = 0
  tick(w, 1 / 12)
  assert.equal(w.killCredits[2][0], before[2][0] + 1)
  assert.equal(w.killCredits[2][1], before[2][1])
  assert.ok(w.effects.some(f => f.kind === 'death' && f.unit?.kind === 'brave' && f.unit.team === 'blue'))
})

test('checkpoints on both sides of ordinary defeat retain exact permanent ownership', () => {
  const { w, u } = ordinaryDefeat()
  const before = migrateCheckpoint(structuredClone(w))
  tick(w, 1 / 12)
  tick(before, 1 / 12)
  assert.deepEqual(before, w)
  assert.equal(u.hypnotise, undefined)
  const after = migrateCheckpoint(structuredClone(w))
  tick(w, 1 / 12)
  tick(after, 1 / 12)
  assert.deepEqual(after, w)
})
