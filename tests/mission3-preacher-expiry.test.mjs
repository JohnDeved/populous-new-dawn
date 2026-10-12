import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, command, setSelection } from '../app/model.ts'
import { currentPersonOrder, hasFollowingPersonOrder } from '../app/person-orders.ts'
import { unitAnimationSource } from '../app/unit-animation-source.ts'
import { acquireNaturalPreacher } from '../scripts/mission3-natural-preacher-scenario.mjs'

// Authored acquisition and ordinary commands only. Waiting changes the genuine
// conversion retry history; no timer, listener, phase, RNG or actor is supplied.
// This CPU witness does not establish rendered or original-executable parity.
test('ordinary automatic sermon reaches 840, retires its identity and resumes the retained route', () => {
  const journey = acquireNaturalPreacher(createWorld(3))
  const { world: w, preacher, shaman, step, until } = journey
  assert.equal(w.turn, 2012)
  for (let i = 0; i < 56; i++) step()
  setSelection(w, [shaman.id])
  assert.ok(command(w, { x: -20, z: -105 }))
  setSelection(w, [preacher.id])
  assert.ok(command(w, { x: -43, z: -107 }, { ctrlKey: true }))
  assert.ok(command(w, { x: -25, z: -100 }))
  const person = unitAnimationSource(preacher)
  until('automatic sermon', () => currentPersonOrder(w.buildingOrders, person)?.model === 32, 1000)
  assert.equal(w.turn, 2540)
  const first = person.immediateCommand
  const slots = person.commands.filter(Boolean)
  const records = slots.map(id => structuredClone(w.buildingOrders.records[id]))
  assert.equal(slots.length, 2)
  until('uninterrupted phase 3', () => person.substate === 3, 20)
  assert.equal(w.turn, 2549)
  assert.equal(person.timer, 0)
  for (let timer = 1; timer <= 840; timer++) {
    step()
    assert.equal(unitAnimationSource(preacher), person)
    assert.equal(preacher.hp, 55)
    assert.ok(!preacher.fight)
    assert.equal(person.immediateCommand, first)
    assert.equal(person.timer, timer)
    assert.equal(person.speed, 0)
    assert.equal(person.substate, timer === 840 ? 4 : 3)
    const listener = w.units.find(u => u.id === journey.authoredVictimId)
    assert.equal(listener.native.state, 23)
    assert.equal(listener.native.workTarget, preacher.id)
  }
  assert.equal(w.turn, 3389)
  assert.equal(person.commandCursor, 0)
  assert.equal(hasFollowingPersonOrder(w.buildingOrders, person), true)
  step()
  assert.equal(w.turn, 3390)
  assert.equal(w.buildingOrders.records[first].references, 0)
  assert.equal(person.commandCursor, 1)
  assert.deepEqual(person.commands.filter(Boolean), slots)
  assert.deepEqual(
    slots.map(id => w.buildingOrders.records[id]),
    records
  )
  // The still-hostile listener triggers a NEW automatic sermon in the same turn.
  // A model-only observation would incorrectly call this an 840-turn restart.
  const second = person.immediateCommand
  assert.ok(second && second !== first)
  assert.equal(currentPersonOrder(w.buildingOrders, person).model, 32)
  assert.equal(person.substate, 0)
  const released = w.units.find(u => u.id === journey.authoredVictimId)
  assert.notEqual(released.native.state, 23)
  assert.equal(released.native.workTarget, 0)
  until('second sermon ends', () => person.immediateCommand === 0, 150)
  assert.equal(w.turn, 3493)
  assert.equal(w.buildingOrders.records[second].references, 0)
  assert.ok(
    journey
      .observation()
      .events.some(event => event.victims.some(victim => victim.id === journey.authoredVictimId))
  )
  until(
    'retained movement completes',
    () => slots.every(id => w.buildingOrders.records[id].references === 0),
    200
  )
  assert.equal(w.turn, 3565)
  assert.equal(unitAnimationSource(preacher), person)
  assert.equal(preacher.hp, 55)
  assert.ok(!preacher.fight)
  assert.ok(Math.hypot(preacher.x + 25, preacher.z + 100) < 2)
})
