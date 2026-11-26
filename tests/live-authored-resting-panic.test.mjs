import assert from 'node:assert/strict'
import test from 'node:test'
import { initializeLivePanic } from '../app/live-people.ts'
import { createWorld, command, tick, unitAnimationSource } from '../app/model.ts'
import { objectsInCell } from '../app/object-cells.ts'

test('panic entry releases an authored M1 Brave’s resting slot and compacts its survivor', () => {
  const w = createWorld(1, 'scalable')
  const a = w.units.find(u => u.id === 13)
  const b = w.units.find(u => u.id === 14)
  for (const u of [a, b]) assert.deepEqual([u.team, u.kind, u.hp], ['blue', 'brave', 50])
  w.selected = [a.id, b.id]
  assert.equal(command(w, { x: 9, z: 25 }), true)
  for (let i = 0; i < 35; i++) tick(w, 1 / 12)

  const departing = a.native
  const staying = b.native
  const cell = departing.formationCell
  assert.deepEqual([departing.state, staying.state], [19, 19])
  assert.deepEqual([departing.assignment & 1, staying.assignment & 1], [1, 1])
  assert.deepEqual([cell, staying.formationCell], [56848, 56848])
  assert.deepEqual([departing.anchorFlags, staying.anchorFlags], [33, 34])
  assert.deepEqual([...objectsInCell(w.objectCells, cell)].map(p => p.id).sort(), [a.id, b.id])

  // The panic trigger is supplied. Neither person, the two-person ring nor
  // its assignment is seeded; the normal M1 command and World visits own them.
  initializeLivePanic(w, a)

  assert.equal(w.turn, 35)
  assert.equal(a.native, departing)
  assert.equal(b.native, staying)
  assert.equal(unitAnimationSource(b), staying)
  assert.deepEqual([departing.previousState, departing.state, departing.assignment & 1], [19, 26, 0])
  assert.deepEqual([staying.state, staying.assignment & 1, staying.formationCell], [19, 1, cell])
  assert.equal(staying.anchorFlags, 17, 'the live survivor compacts from slot 2 of 2 to slot 1 of 1')
  assert.equal(w.objectCells.objects.get(b.id), staying)
})
