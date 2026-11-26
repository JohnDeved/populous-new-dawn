import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, setSelection, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

test('hidden admission to the authored M2 Hut clears both live queued orders', () => {
  const w = createWorld(2)
  const to = turn => {
    while (w.turn < turn) tick(w, 1 / 12)
    assert.equal(w.turn, turn)
  }
  to(430)
  const brave = w.units.find(u => u.id === 278)
  const hut = w.buildings.find(b => b.id === 72)
  assert.deepEqual([brave.team, brave.kind, brave.x, brave.z], ['blue', 'brave', -107, -99])
  assert.deepEqual([hut.team, hut.kind, hut.progress, hut.admission.inside], ['blue', 'hut', 1, 1])
  const priorOccupant = hut.admission.occupants[0]
  assert.equal(priorOccupant, 1249)
  setSelection(w, [brave.id])
  assert.ok(command(w, { x: -103, z: -107 }, { ctrlKey: true }))
  assert.ok(command(w, hut, { ctrlKey: true }))
  assert.ok(command(w, { x: -104, z: -105 }))
  const person = brave.native
  const [first, entry, tail] = person.commands
  const slots = () => person.commands.slice()
  const live = () => [first, entry, tail].map(id => w.buildingOrders.records[id])
  const refs = () => live().map(order => order.references)
  const current = () => currentPersonOrder(w.buildingOrders, person)
  assert.deepEqual(live().map(order => order.model), [3, 8, 3])
  assert.equal(live()[1].a, hut.id)
  assert.deepEqual(refs(), [1, 1, 1])
  assert.equal(person.immediateCommand, 0)

  to(452)
  assert.equal(brave.inside, null)
  assert.equal(person.commandCursor, 1)
  assert.equal(current(), live()[1])
  assert.deepEqual(slots(), [0, entry, tail, 0, 0, 0, 0, 0])
  assert.deepEqual(refs(), [0, 1, 1], 'normal route completion only consumes its own slot')

  to(481)
  assert.equal(brave.inside, null)
  assert.equal(current(), live()[1])
  assert.deepEqual(refs(), [0, 1, 1])
  assert.equal(person.flags2 & 0x800000, 0)
  assert.equal(person.renderFlags & 16, 0)

  to(482)
  assert.equal(brave.inside, hut.id)
  assert.equal(person.building, hut.id)
  assert.ok(person.flags2 & 0x800000)
  assert.equal(hut.admission.inside, 2)
  assert.deepEqual(hut.admission.occupants.slice(0, 2), [priorOccupant, brave.id])
  assert.equal(person.commandCursor, 0)
  assert.deepEqual(slots(), Array(8).fill(0))
  assert.deepEqual(refs(), [0, 0, 0])
  assert.equal(current(), undefined)
  assert.ok(person.renderFlags & 16)
})
