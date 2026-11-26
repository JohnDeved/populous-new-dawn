import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { computerSelectionWorld } from '../app/computer-runtime.ts'
import { availableTrainingPeople, selectComputerPeople } from '../app/computer-selection.ts'

function warriorProjection() {
  const w = createWorld(10, 'scalable')
  for (let n = 0; n < 100; n++) {
    assert.equal(w.status, 'playing')
    tick(w, 1 / 12)
    assert.equal(w.turn, n + 1)
  }
  const u = w.units.find(u => u.id === 111)
  assert.deepEqual([u.team, u.kind], ['blue', 'warrior'])
  assert.equal(w.objectCells.objects.get(u.id), u.native)
  const nativeView = computerSelectionWorld(w, 0, true).world
  const person = nativeView.people.find(p => p.id === u.id)
  assert.equal(person.model, 3)
  assert.equal(nativeView.units.get(person.id), person)
  // Restrict candidate list and provide deliberate boundary values to the real
  // selection functions. This does not assert a native AI task produced them.
  Object.assign(person, { flags2: 0, flags3: 0, flags4: 0, vehicle: 0,
    assignment: 0, busy: 0, immediateCommand: 0, commandCursor: 0, commands: Array(8).fill(0) })
  nativeView.people = [person]
  return { person, nativeView }
}

test('AI training availability requires the state bit and no busy flag', () => {
  const { person, nativeView } = warriorProjection()
  // Model and authored registration remain the same in all three cases.
  person.state = 17
  assert.equal(availableTrainingPeople(nativeView), 1, 'idle warrior should be counted')
  person.busy = 1
  assert.equal(availableTrainingPeople(nativeView), 0, 'busy idle-state warrior must not count')
  person.busy = 0
  person.state = 10
  assert.equal(availableTrainingPeople(nativeView), 0, 'nonidle state must not count without housing')
})

test('AI defensive redirection includes the wrapped radius, honors busy/command and base fallback', () => {
  const { person, nativeView } = warriorProjection()
  const t = nativeView.tribes[0]
  Object.assign(t, { hasBase: true, base: 0x0202, shaman: 0x0240, radius: 2 })
  Object.assign(person, { state: 10, x: 0xfe00, y: 0x0200, immediateCommand: 1 })
  nativeView.orders = new Map([[1, { model: 17, flags: 0 }]])
  const choose = () => selectComputerPeople(nativeView, 3, 3, -1, 0, 0, 2, 1)
  assert.deepEqual(choose(), [person.id], 'wrapped distance equal to radius must redirect')
  person.x = 0xfc00
  assert.deepEqual(choose(), [], 'one even cell farther must not redirect')
  person.x = 0xfe00
  person.busy = 1
  assert.deepEqual(choose(), [], 'busy owner is not eligible')
  person.busy = 0
  nativeView.orders.get(1).model = 3
  assert.deepEqual(choose(), [], 'irrelevant order is not defending')
  nativeView.orders.get(1).model = 17
  t.hasBase = false
  assert.deepEqual(choose(), [], 'without a base, the distant fallback must be used')
  t.shaman = 0x0202
  assert.deepEqual(choose(), [person.id], 'near Shaman fallback is eligible')
})
