import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, tick } from '../app/model.ts'
import { selectUnit } from '../app/selection-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { liveWorshippers } from '../app/live-worship.ts'

const fixture = () => {
  const world = createWorld(1)
  const advance = turn => { while (world.turn < turn) tick(world, 1 / 12) }
  advance(130)
  const head = world.shrines.find(s => s.id === 29)
  assert.equal(head.kind, 'bridge')
  const braves = world.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.x === 7 && u.z === 33)
  assert.equal(braves.length, 1)
  const [brave] = braves
  selectUnit(world, brave.id, false)
  assert.deepEqual(world.selected, [brave.id])
  assert.equal(command(world, head), true)
  const person = brave.native
  assert.ok(person)
  const order = currentPersonOrder(world.buildingOrders, person)
  assert.deepEqual([order.model, order.a], [27, head.id])
  return { world, head, brave, person, order, advance }
}

test('authored M1 bridge-head order arrives at the first standing slot on foot', () => {
  const { world, head, brave, person, order, advance } = fixture()
  assert.deepEqual(liveWorshippers(world, head), [])
  advance(175)
  assert.deepEqual(liveWorshippers(world, head), [])
  advance(176)
  assert.equal(brave.native, person)
  assert.equal(currentPersonOrder(world.buildingOrders, person), order)
  assert.equal(person.vehicle, 0)
  assert.equal(person.speed, 0)
  assert.deepEqual([person.x, person.y], [768, 56640])
  assert.deepEqual(liveWorshippers(world, head).map(p => p.id), [brave.id])
})

test('authored M1 bridge-head samples its worshipper then awards once and clears after departure', () => {
  const { world, head, brave, advance } = fixture()
  advance(176)
  assert.deepEqual(head.panelActivity, { turn: 176, count: 0 })
  advance(180)
  assert.deepEqual(head.panelActivity, { turn: 180, count: 1 })
  assert.equal(head.work, 1)
  advance(287)
  assert.equal(head.uses, 0)
  assert.equal(head.work, 27)
  assert.equal(world.gifts.filter(gift => gift.reward === 'bridge').length, 0)
  advance(288)
  assert.equal(head.uses, 1)
  assert.equal(head.work, 0)
  assert.equal(head.active, true)
  const rewards = world.gifts.filter(gift => gift.reward === 'bridge')
  assert.equal(rewards.length, 1)
  assert.deepEqual([rewards[0].x, rewards[0].z, rewards[0].recipient, rewards[0].ordinaryWorship?.completedTurn], [head.x, head.z, 0, 288])
  selectUnit(world, brave.id, false)
  assert.equal(command(world, { x: 3, z: 31 }), true)
  advance(300)
  assert.deepEqual(head.panelActivity, { turn: 300, count: 0 })
  assert.equal(head.uses, 1)
  assert.equal(head.work, 0)
})
