import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, tick } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Supplied unobstructed mechanics fixture; orders always enter through the
// public player command. The ordinary Mission 3 route is a separate witness.
function scenario(kind = 'camp', count = 8) {
  const w = createStartedWorld()
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.manaWorld.gameFlags = 32
  w.terrain.fill(3)
  w.terrainVersion++
  const b = addBuilding(w, 'blue', kind, { x: -2, z: 32 }, true)
  const units = Array.from({ length: count }, (_, i) =>
    addUnit(w, 'blue', 'brave', { x: 7 + i * 0.4, z: 33 })
  )
  const people = units.map(u => {
    u.native = createLivePerson(w, u)
    registerLivePerson(w, u.native)
    return u.native
  })
  w.selected = units.map(u => u.id)
  return { w, b, units, people }
}

function assertShared(w, b, units, people) {
  const id = people[0].commands[people[0].commandCursor]
  assert.ok(id, 'the player click attaches the training order immediately')
  assert.ok(people.every(p => p.commands[p.commandCursor] === id))
  assert.equal(w.buildingOrders.records[id].model, 8)
  assert.equal(w.buildingOrders.records[id].a, b.id)
  assert.equal(w.buildingOrders.records[id].references, units.length)
  for (const [index, u] of units.entries()) {
    assert.equal(u.entry?.person, people[index])
    assert.equal(w.objectCells.objects.get(u.id), people[index])
    assert.equal(u.entry.orders, w.buildingOrders)
    assert.equal(u.work, b.id)
  }
  return id
}

test('one ordinary group training click shares one immediately attached registered owner record', () => {
  for (const kind of ['camp', 'temple', 'spyHut', 'firewarriorHut']) {
    const { w, b, units, people } = scenario(kind)
    const cursor = w.buildingOrders.cursor
    assert.equal(command(w, b), true)
    const id = assertShared(w, b, units, people)
    assert.equal(id, cursor)
    assert.equal(w.buildingOrders.cursor, cursor + 1)
    assert.equal(w.buildingOrders.active, 1)
    tick(w, 1 / 12)
    assertShared(w, b, units, people)
    assert.equal(w.buildingOrders.active, 1, 'entry must not allocate per follower')
  }
})

test('one remaining command slot accepts the complete ordinary training group', () => {
  const { w, b, units, people } = scenario()
  for (let id = 1; id < 799; id++) w.buildingOrders.records[id].references = 1
  w.buildingOrders.active = 798
  assert.equal(command(w, b), true)
  assert.equal(assertShared(w, b, units, people), 799)
  assert.equal(w.buildingOrders.active, 799)
})

test('an exhausted ordinary training click has no deferred allocation retry', () => {
  const { w, b, units, people } = scenario()
  for (let id = 1; id < 800; id++) w.buildingOrders.records[id].references = 1
  w.buildingOrders.active = 799
  assert.equal(command(w, b), true)
  assert.equal(w.message, 'No command slots available.')
  assert.ok(units.every(u => u.work === null && !u.entry))
  assert.ok(people.every(p => !currentPersonOrder(w.buildingOrders, p)))
  w.buildingOrders.records[799].references = 0
  w.buildingOrders.active--
  for (let i = 0; i < 8; i++) tick(w, 1 / 12)
  assert.ok(units.every(u => u.work === null && !u.entry))
  assert.equal(w.buildingOrders.records[799].references, 0)
  assert.equal(w.buildingOrders.active, 798)
})
