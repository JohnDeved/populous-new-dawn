import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { processOwnedBattles } from '../app/combat-runtime.ts'
import { stepLiveBuildingAttack } from '../app/live-building-combat.ts'
import { allocatePersonOrder, attachPersonOrder, currentPersonOrder } from '../app/person-orders.ts'
import { orderEffects, startLiveOrders } from '../app/live-movement.ts'

test('ordinary live owned group delivers its terminal winner once and removes the group', () => {
  const world = createWorld(3)
  const winner = world.units.find(u => u.team === 'yellow' && u.kind === 'brave')
  const loser = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const id = world.nextId++
  const slotIds = [winner.id, loser.id, 0, 0, 0, 0]
  const group = {
    id, x: winner.x, z: winner.z, angle: 0, slots: slotIds, tribes: [2, 0],
    members: [winner.id, loser.id],
  }
  for (const unit of [winner, loser]) {
    const p = unit.native = createLivePerson(world, unit)
    p.state = 25
    p.workFlags = id
    unit.fight = { group: id, opponent: unit === winner ? loser.id : winner.id, action: 'approach', started: 0, motion: p }
  }
  loser.hp = 0
  world.fights.push(group)
  const before = world.stats.battlesWon.slice()
  processOwnedBattles(world)
  assert.equal(group.winner, 2)
  assert.ok(!world.fights.includes(group))
  assert.equal(winner.native.workFlags, 0)
  assert.deepEqual(world.stats.battlesWon, before.map((n, i) => n + Number(i === 2)))
  processOwnedBattles(world)
  assert.deepEqual(world.stats.battlesWon, before.map((n, i) => n + Number(i === 2)))
})

test('actual live area attack keeps substate 7 until its ordinary retry expires', () => {
  const world = createWorld(1)
  const person = world.units.find(u => u.team === 'blue' && u.kind === 'brave')
  const actor = person.native = createLivePerson(world, person)
  const id = allocatePersonOrder(world.buildingOrders)
  assert.ok(id)
  const cell = ((actor.x >>> 8) & 254) | (actor.y & 0xfe00)
  Object.assign(world.buildingOrders.records[id], { model: 19, a: cell, b: 0x0404 })
  attachPersonOrder(world.buildingOrders, actor, id, 0, orderEffects(world))
  actor.state = 10
  startLiveOrders(world, actor, world)
  assert.equal(actor.commandStatus, 19)
  const order = currentPersonOrder(world.buildingOrders, actor)
  assert.equal(order?.model, 19)
  actor.substate = 7
  actor.flags2 = (actor.flags2 & ~0x40000000) >>> 0
  actor.timer = 2
  stepLiveBuildingAttack(world, person)
  assert.deepEqual([actor.substate, actor.timer], [7, 1])
  assert.equal(currentPersonOrder(world.buildingOrders, actor), order)
  stepLiveBuildingAttack(world, person)
  assert.deepEqual([actor.substate, actor.timer], [0, 0])
  assert.equal(currentPersonOrder(world.buildingOrders, actor), order)
})
