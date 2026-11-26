import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, createWorld, nativePosition, spellTargetError, tick } from '../app/model.ts'
import { spellCursor } from '../app/spell-casting.ts'

function mission() {
  const w = createWorld(6, 'scalable')
  for (let i = 0; i < 100; ++i) {
    assert.equal(w.status, 'playing')
    tick(w, 1 / 12)
    assert.equal(w.turn, i + 1)
  }
  const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  assert.equal(w.objectCells.objects.get(shaman.id), shaman.native)
  assert.deepEqual([shaman.x, shaman.z], [51, -61.546875])
  assert.equal(w.manaWorld.gameFlags & 32, 0)
  w.shots.blast = 2 // Supply starting stock; subsequent spending and launch use the normal command.
  return [w, shaman]
}

test('live Blast target feedback shows an animated range warning only over out-of-reach map ground', () => {
  const [w] = mission()
  const invalid = { x: 90, z: -61 }
  const valid = { x: 56, z: -60 }
  const out = spellTargetError(w, 'blast', invalid)
  assert.equal(out?.code, -2)
  assert.equal(spellTargetError(w, 'blast', valid), null)
  const base = { id: 'point41', x: 0, y: -16 }
  const blocked = { id: 589, x: 11, y: -7 }
  assert.deepEqual(spellCursor(2, w.turn, out.code, 3, true), [
    base, blocked, { id: 'point80', x: 31, y: -16 },
  ])
  tick(w, 1 / 12)
  assert.equal(w.turn, 101)
  assert.deepEqual(spellCursor(2, w.turn, out.code, 3, true), [
    base, blocked, { id: 'point81', x: 31, y: -16 },
  ])
  assert.deepEqual(spellCursor(2, w.turn, -1, 3, false), [base, blocked])
  assert.deepEqual(spellCursor(2, w.turn, 1, 3, true), [base])
  assert.deepEqual(spellCursor(2, w.turn, 1, 0, true), [base, blocked])
})

test('live Blast command retains stock on rejected target and spends one while launching to a snapped cell', () => {
  const [w, shaman] = mission()
  const stock = w.manaWorld.spells[0].stocks
  const startingMana = w.manaTribes[0].available
  const before = w.spellCasts[0][2]
  const current = () => w.projectiles.find(p => p.caster === shaman.id && p.spell === 'blast')
  assert.equal(cast(w, 'blast', { x: 90, z: -61 }), false)
  assert.equal(w.shots.blast, 2)
  assert.equal(current(), undefined)
  assert.equal(w.spellCasts[0][2], before)
  assert.equal(cast(w, 'blast', { x: 56, z: -60 }), true)
  assert.equal(w.shots.blast, 1)
  assert.equal(stock[2] & 15, 1)
  assert.equal(w.manaTribes[0].available, startingMana)
  const shot = current()
  assert.ok(shot)
  assert.deepEqual(shot.target, { x: 57, z: -61 })
  assert.deepEqual(shot.destination, nativePosition(w, { x: 57, z: -61 }))
  assert.equal(shot.phase, 'windup')
  assert.equal(w.spellCasts[0][2], (before + 1) & 255)
})
