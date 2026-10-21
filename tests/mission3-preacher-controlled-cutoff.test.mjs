import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { command, setSelection, tick } from '../app/model.ts'
import { currentPersonOrder, hasFollowingPersonOrder } from '../app/person-orders.ts'
import { unitAnimationSource } from '../app/unit-animation-source.ts'
import { acquireNaturalPreacher } from '../scripts/mission3-natural-preacher-scenario.mjs'

// Genuine acquisition and automatic sermon, then ONE explicitly supplied timer
// boundary. This tests current live ownership/Save/Load composition, not 840
// naturally elapsed sermon turns, rendered or original-runtime acceptance.
// No listener, phase, RNG, HP, actor or queued order is supplied or frozen.
test('controlled sermon timer 839 preserves current cutoff, order identities and queued route', async () => {
  const store = await createCampaignFixtureStore([3])
  assert.equal(store.startMission(3), true)
  assert.equal(store.getWorld().capacityPolicy.mode, 'scalable')
  assert.ok(store.getWorld().objectCells.heads instanceof Float64Array)
  const journey = acquireNaturalPreacher(store.getWorld())
  const { world: w, preacher, shaman } = journey
  let restored
  const compareCheckpoint = () => {
    assert.deepEqual(restored.units, w.units)
    assert.deepEqual(restored.buildingOrders, w.buildingOrders)
    assert.deepEqual(restored.objectCells, w.objectCells)
    assert.equal(restored.randomState, w.randomState)
    assert.equal(restored.cosmeticRandom.randomState, w.cosmeticRandom.randomState)
    assert.deepEqual(restored, w)
    assert.equal(unitAnimationSource(preacher), person)
    assert.equal(w.objectCells.objects.get(preacher.id), person)
    assert.equal(preacher.hp, 55)
    assert.ok(!preacher.fight)
    const twin = restored.units.find(unit => unit.id === preacher.id)
    assert.equal(restored.objectCells.objects.get(preacher.id), unitAnimationSource(twin))
  }
  const step = () => {
    journey.step()
    if (restored) {
      tick(restored, 1 / 12)
      compareCheckpoint()
    }
  }
  const until = (label, predicate, limit) => {
    for (let i = 0; i < limit && !predicate(); i++) step()
    assert.ok(predicate(), label)
  }
  setSelection(w, [shaman.id])
  assert.ok(command(w, { x: -20, z: -105 }))
  setSelection(w, [preacher.id])
  assert.ok(command(w, { x: -43, z: -107 }, { ctrlKey: true }))
  assert.ok(command(w, { x: -25, z: -100 }))
  const person = unitAnimationSource(preacher)
  until('automatic sermon', () => currentPersonOrder(w.buildingOrders, person)?.model === 32, 1000)
  const first = person.immediateCommand
  assert.ok(first)
  assert.equal(w.buildingOrders.records[first].references, 1)
  const slots = person.commands.filter(Boolean)
  const records = slots.map(id => structuredClone(w.buildingOrders.records[id]))
  assert.equal(slots.length, 2)
  until('uninterrupted phase 3', () => person.substate === 3, 20)
  assert.equal(person.timer, 0)
  // Let the real phase-entry initializer clear its own entry flag first.
  step()
  assert.equal(person.timer, 1)
  assert.equal(person.substate, 3)
  assert.equal(person.immediateCommand, first)
  const listener = w.units.find(unit => unit.id === journey.authoredVictimId)
  assert.ok(listener && listener.hp > 0)
  assert.equal(listener.team, 'yellow')
  assert.equal(listener.native.state, 23)
  assert.equal(listener.native.workTarget, preacher.id)
  assert.equal(w.objectCells.objects.get(preacher.id), person)
  assert.equal(preacher.native, person)
  const expectedBoundary = structuredClone(w)
  expectedBoundary.objectCells.objects.get(preacher.id).timer = 839
  person.timer = 839 // The sole supplied live-state field in this controlled test.
  assert.deepEqual(w, expectedBoundary, 'only the approved sermon timer changes at setup')
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  restored = store.getWorld()
  assert.deepEqual(restored, w)
  compareCheckpoint()
  step()
  assert.equal(unitAnimationSource(preacher), person)
  assert.equal(preacher.hp, 55)
  assert.ok(!preacher.fight)
  assert.equal(person.immediateCommand, first)
  assert.equal(person.timer, 840)
  assert.equal(person.speed, 0)
  assert.equal(person.substate, 4)
  assert.equal(listener.native.state, 23)
  assert.equal(listener.native.workTarget, preacher.id)
  assert.equal(person.commandCursor, 0)
  assert.equal(hasFollowingPersonOrder(w.buildingOrders, person), true)
  step()
  assert.equal(w.buildingOrders.records[first].references, 0)
  assert.ok(!person.commands.includes(first))
  assert.notEqual(person.immediateCommand, first)
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
  assert.equal(w.buildingOrders.records[second].references, 1)
  const released = w.units.find(u => u.id === journey.authoredVictimId)
  assert.notEqual(released.native.state, 23)
  assert.equal(released.native.workTarget, 0)
  // Fixed-scenario observation bound, not a universal conversion guarantee:
  // one genuine phase entry, the source's840 active turns, then one retirement.
  // A third automatic sermon must not hide failure to complete this journey.
  until('second sermon phase3 entry', () => person.substate === 3, 20)
  assert.equal(person.immediateCommand, second)
  assert.equal(person.timer, 0)
  const secondRecord = w.buildingOrders.records[second], activeStart = w.turn
  for (let timer = 1; timer <= 840 && person.immediateCommand === second; timer++) {
    step()
    if (person.immediateCommand === second) {
      assert.equal(currentPersonOrder(w.buildingOrders, person), secondRecord)
      assert.equal(secondRecord.references, 1)
      assert.equal(person.timer, timer)
      assert.equal(person.speed, 0)
      assert.equal(person.substate, timer === 840 ? 4 : 3)
    } else assert.equal(secondRecord.references, 0)
  }
  if (person.immediateCommand === second) step()
  assert.ok(w.turn - activeStart <= 841)
  assert.equal(person.immediateCommand, 0, 'no stuck second order or masking third sermon')
  assert.equal(w.buildingOrders.records[second].references, 0)
  assert.equal(w.buildingOrders.records[first].references, 0)
  assert.ok(!person.commands.includes(first) && !person.commands.includes(second))
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
  assert.equal(w.buildingOrders.records[first].references, 0)
  assert.equal(w.buildingOrders.records[second].references, 0)
  assert.equal(w.objectCells.objects.get(preacher.id), person)
  assert.equal(unitAnimationSource(preacher), person)
  assert.equal(preacher.hp, 55)
  assert.ok(!preacher.fight)
  assert.ok(Math.hypot(preacher.x + 25, preacher.z + 100) < 2)
})
