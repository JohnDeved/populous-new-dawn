import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { command, setSelection, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { unitAnimationSource } from '../app/unit-animation-source.ts'
import { acquireNaturalPreacher } from '../scripts/mission3-natural-preacher-scenario.mjs'

// Authored Mission 3, unchanged ordinary Vault/build/training journey, then only
// player movement orders. No entities, terrain, funds, flags, phases or timers
// are supplied. This is a CPU campaign witness, not rendered/native acceptance.
test('authored Mission 3 automatic sermon ends and completes its retained next waypoint', async () => {
  const store = await createCampaignFixtureStore([3])
  assert.equal(store.startMission(3), true)
  assert.equal(store.getWorld().capacityPolicy.mode, 'scalable')
  assert.ok(store.getWorld().objectCells.heads instanceof Float64Array)
  const journey = acquireNaturalPreacher(store.getWorld())
  const { world: w, preacher, shaman, step, until } = journey
  // Ordinary 16-turn wait retains a natural no-listener conversion witness after
  // source-correct Vault movement changed the prior journey's RNG history.
  for (let turn = 0; turn < 16; turn++) step()
  setSelection(w, [shaman.id])
  assert.ok(command(w, { x: -20, z: -105 }), 'ordinary offset escort')
  setSelection(w, [preacher.id])
  assert.ok(command(w, { x: -43, z: -107 }, { ctrlKey: true }))
  assert.ok(command(w, { x: -25, z: -100 }))
  const person = unitAnimationSource(preacher)
  const queue = person.commands.slice()
  const records = queue.filter(Boolean).map(id => ({ id, record: structuredClone(w.buildingOrders.records[id]) }))
  assert.equal(records.length, 2)
  assert.ok(records.every(({ record }) => record.model === 3))
  until('automatic32', () => currentPersonOrder(w.buildingOrders, person)?.model === 32, 1000)
  const immediate = person.immediateCommand
  assert.ok(immediate && !queue.includes(immediate))
  assert.deepEqual(person.commands, queue)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assert.deepEqual(restored, w)
  const restoredPreacher = restored.units.find(u => u.id === preacher.id)
  const transition = []
  const advance = () => {
    step()
    tick(restored, 1 / 12)
    assert.equal(restored.randomState, w.randomState)
    assert.deepEqual(restored.units, w.units)
    assert.deepEqual(restored.buildingOrders, w.buildingOrders)
    assert.equal(preacher.team, 'blue')
    assert.equal(preacher.hp, 55)
    assert.equal(unitAnimationSource(preacher), person)
    assert.ok(!preacher.fight)
  }
  let listenerSeen = false
  for (let i = 0; i < 300 && person.immediateCommand === immediate; i++) {
    advance()
    listenerSeen ||= w.units.some(u => u.native?.state === 23 && u.native.workTarget === preacher.id)
  }
  assert.ok(listenerSeen, 'an actual authored enemy listens during automatic32')
  assert.equal(person.immediateCommand, 0)
  assert.equal(w.buildingOrders.records[immediate].references, 0)
  assert.equal(person.timer, 94, 'natural no-listener termination, not the 840-turn cutoff')
  assert.ok(!w.units.some(u => u.native?.state === 23 && u.native.workTarget === preacher.id))
  assert.ok(journey.observation().events.length > 0, 'ordinary conversion preceded termination')
  assert.deepEqual(person.commands, queue)
  assert.equal(person.commandCursor, 1)
  for (const { id, record } of records) assert.deepEqual(w.buildingOrders.records[id], record)
  assert.equal(currentPersonOrder(w.buildingOrders, person), w.buildingOrders.records[queue[1]])
  transition.push({ turn: w.turn, x: preacher.x, z: preacher.z })
  for (let i = 0; i < 200 && w.buildingOrders.records[queue[1]].references; i++) advance()
  assert.equal(w.buildingOrders.records[queue[1]].references, 0, 'next waypoint completes normally')
  assert.equal(person.commands[1], 0)
  assert.equal(person.commands[0], queue[0], 'Ctrl-staged first slot retains its existing ownership')
  assert.ok(preacher.x > -27 && preacher.z > -103, 'ordinary movement reached the queued destination area')
  assert.ok(Math.hypot(preacher.x - transition[0].x, preacher.z - transition[0].z) > 10)
  assert.equal(restoredPreacher.hp, preacher.hp)
})
