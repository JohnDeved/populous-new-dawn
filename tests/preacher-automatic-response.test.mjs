import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { startLiveCombatResponse } from '../app/live-building-combat.ts'
import { registerLivePerson } from '../app/live-people.ts'
import { moveObjectInCells } from '../app/object-cells.ts'
import { currentPersonOrder, emptyPersonOrder, prepareMovementOrder } from '../app/person-orders.ts'

// Supplied response-only fixtures. The accepted native positive remains immutable;
// these tests neither advance a world turn nor claim ordinary acquisition.
const accepted = JSON.parse(readFileSync(new URL('../decomp/research/preacher-response-trigger/fixture.json', import.meta.url)))

function setup() {
  const w = createWorldState(3)
  w.nextId = 1
  w.turn = 0
  w.levelFlags2 = 0
  w.units = []
  w.buildings = []
  w.fights = []
  w.selected = []
  w.manaWorld.gameFlags = 0
  w.outcome.alliances.fill(0)
  w.land.categories.fill(0)
  w.land.flags.fill(0)
  w.land.buildingIds.fill(0)
  w.land.owners.fill(0)
  w.objectCells.heads.fill(0)
  w.objectCells.objects.clear()
  w.pathfinding.people.clear()
  w.buildingOrders.records = Array.from({ length: 800 }, emptyPersonOrder)
  Object.assign(w.buildingOrders.records[1], { model: 3, references: 1, a: 0x2300, b: 0x2100 })
  w.buildingOrders.cursor = 2
  w.buildingOrders.active = 1
  for (const row of accepted.people) {
    const u = addUnit(w, row.unit.team, row.unit.kind, row.unit)
    u.hp = 50
    u.native = structuredClone({ ...row.native, ...row.portExtras })
    w.objectCells.objects.set(u.id, u.native)
  }
  w.objectCells.heads[2064] = 1
  w.randomState = accepted.world.simulationRandom
  w.cosmeticRandom.randomState = accepted.world.cosmeticRandom
  return { w, source: w.units[0], enemy: w.units[1] }
}

const snapshot = w => structuredClone({
  units: w.units, pool: w.buildingOrders, heads: [...w.objectCells.heads],
  simulation: w.randomState, cosmetic: w.cosmeticRandom.randomState,
  registry: [...w.objectCells.objects], paths: [...w.pathfinding.people],
})
const call = s => startLiveCombatResponse(s.w, s.source)
function fullPool(w) {
  for (const order of w.buildingOrders.records.slice(1)) order.references = 1
  w.buildingOrders.active = 799
}

test('automatic32 matches the accepted retained-person native ownership delta', () => {
  const s = setup(), { w, source, enemy } = s
  const p = source.native, oldEnemy = structuredClone(enemy), queued = structuredClone(w.buildingOrders.records[1])
  const seeds = [w.randomState, w.cosmeticRandom.randomState]
  assert.equal(call(s), true)
  assert.equal(source.native, p)
  assert.equal(w.objectCells.objects.get(source.id), p)
  assert.deepEqual([p.flags2, p.immediateCommand, p.orderLocation], [0x20010, 2, 0x2021])
  assert.deepEqual(p.commands, [1, 0, 0, 0, 0, 0, 0, 0])
  assert.deepEqual(w.buildingOrders.records[2], { model: 32, flags: 32, references: 1, object: 0, a: 0x2100, b: 0x2100 })
  assert.deepEqual([w.buildingOrders.cursor, w.buildingOrders.active], [3, 2])
  assert.deepEqual(w.buildingOrders.records[1], queued)
  assert.deepEqual(enemy, oldEnemy)
  assert.deepEqual([w.randomState, w.cosmeticRandom.randomState], seeds)
})

test('secondary scan includes an adjacent diagonal cell outside movement3 primary range', () => {
  const s = setup()
  Object.assign(s.enemy, { x: 27, z: -43 })
  Object.assign(s.enemy.native, { x: 0x2300, y: 0x2300, cellPrevious: 0 })
  s.source.native.cellNext = 0
  s.w.objectCells.heads[2193] = s.enemy.id
  assert.equal(call(s), true)
  assert.equal(currentPersonOrder(s.w.buildingOrders, s.source.native)?.model, 32)
})

for (const [name, change] of [
  ['no enemy', s => { s.w.units = [s.source]; s.source.native.cellNext = 0; s.w.objectCells.objects.delete(s.enemy.id) }],
  ['outside secondary square', s => { s.enemy.x = 29; moveObjectInCells(s.w.objectCells, s.enemy.native, { x: 0x2500, y: 0x2100, h: 0 }) }],
  ['enemy already listening', s => { s.enemy.native.state = 23 }],
  ['enemy workFlags occupied', s => { s.enemy.native.workFlags = 9 }],
  ['enemy workFlags absent', s => { delete s.enemy.native.workFlags }],
  ['enemy ownership absent', s => { s.w.objectCells.objects.delete(s.enemy.id) }],
  ['same tribe', s => { s.enemy.team = 'blue'; s.enemy.native.tribe = 0 }],
  ['reverse alliance', s => { s.w.outcome.alliances[1] = 1 }],
  ['allocation exhaustion', s => { fullPool(s.w) }],
  ['unknown source speed', s => { delete s.source.native.speed }],
]) test(`automatic32 rejects ${name} without an adoption or persistent write`, () => {
  const s = setup()
  change(s)
  const before = snapshot(s.w)
  assert.equal(call(s), false)
  assert.deepEqual(snapshot(s.w), before)
})

test('source-only alliance does not replace the native reverse direction', () => {
  const s = setup()
  s.w.outcome.alliances[0] = 2
  assert.equal(call(s), true)
  assert.equal(s.source.native.immediateCommand, 2)
})

for (const model of [17, 31, 32]) test(`stationary active${model} blocks a replacement sermon`, () => {
  const s = setup()
  Object.assign(s.w.buildingOrders.records[1], { model })
  Object.assign(s.source.native, { commandStatus: model, substate: 3, speed: 0 })
  const before = snapshot(s.w)
  assert.equal(call(s), false)
  assert.deepEqual(snapshot(s.w), before)
})

test('a moving sermon remains eligible for automatic32', () => {
  const s = setup()
  s.w.buildingOrders.records[1].model = 17
  Object.assign(s.source.native, { commandStatus: 17, substate: 3, speed: 40 })
  assert.equal(call(s), true)
})

test('cancelled immediate order does not fall back to queued stationary sermon', () => {
  const s = setup()
  s.w.buildingOrders.records[1].model = 17
  Object.assign(s.w.buildingOrders.records[2], { model: 3, flags: 1, references: 1 })
  Object.assign(s.source.native, { commandStatus: 3, substate: 3, speed: 0, immediateCommand: 2 })
  s.w.buildingOrders.cursor = 3
  s.w.buildingOrders.active = 2
  assert.equal(call(s), true)
  assert.equal(currentPersonOrder(s.w.buildingOrders, s.source.native)?.model, 32)
  assert.equal(s.source.native.commands[0], 1)
})

function addPreacher(s, { tribe = 1, state = 17, x = 0x2180, y = 0x2100 } = {}) {
  const u = addUnit(s.w, tribe ? 'red' : 'blue', 'preacher', { x: x / 256 - 8, z: -y / 256 - 8 })
  u.hp = 50
  u.native = structuredClone({ ...s.enemy.native, id: u.id, model: 4, tribe, state, x, y, cellPrevious: 0, cellNext: 0 })
  registerLivePerson(s.w, u.native)
  return u
}

for (const kind of ['water', 'state23', 'unknownWorkFlags']) test(`native primary veto protects a generic miss: ${kind}`, () => {
  const s = setup()
  s.source.native.state = 17 // idle range3, including the adjacent water cell
  const p = addPreacher(s, kind === 'water' ? { x: 0x2300 } : { state: 23 })
  if (kind === 'water') s.w.land.categories[2065] = 1
  if (kind === 'unknownWorkFlags') delete p.native.workFlags
  const before = snapshot(s.w)
  assert.equal(call(s), false)
  assert.deepEqual(snapshot(s.w), before)
})

test('primary21 still shares with the eligible same-tribe peer', () => {
  const s = setup()
  s.enemy.kind = 'preacher'
  s.enemy.native.model = 4
  const peer = addPreacher(s, { tribe: 0, state: 10, x: 0x2140 })
  Object.assign(peer.native, { commandStatus: 3, substate: 1, speed: 40, commands: [1, 0, 0, 0, 0, 0, 0, 0] })
  s.w.buildingOrders.records[1].references = 2
  assert.equal(call(s), true)
  assert.equal(currentPersonOrder(s.w.buildingOrders, s.source.native)?.model, 21)
  assert.equal(peer.native.immediateCommand, s.source.native.immediateCommand)
  assert.equal(s.w.buildingOrders.records[s.source.native.immediateCommand].references, 2)
})

for (const full of [false, true]) test(`fresh initiator ${full ? 'preserves ownership on exhaustion' : 'is adopted and registered once'}`, () => {
  const s = setup(), { w, source, enemy } = s
  source.native = null
  source.path = [{ x: 27, z: -41 }]
  w.objectCells.objects.delete(source.id)
  w.objectCells.heads[2064] = enemy.id
  enemy.native.cellPrevious = 0
  if (full) fullPool(w)
  const before = snapshot(w)
  assert.equal(call(s), !full)
  if (full) assert.deepEqual(snapshot(w), before)
  else {
    assert.equal(source.native.id, source.id)
    assert.equal(currentPersonOrder(w.buildingOrders, source.native)?.model, 32)
    assert.equal(w.objectCells.objects.get(source.id), source.native)
    assert.equal(source.native.flags2 & 0x20010, 0x20010)
    assert.deepEqual(source.path, [])
    assert.equal(w.objectCells.heads[2064], source.id)
    assert.equal(source.native.cellNext, enemy.id)
    assert.equal(enemy.native.cellPrevious, source.id)
    assert.equal(w.objectCells.objects.size, 2)
  }
})

test('model32 reuses point preparation without altering default model3 or unchanged flags', () => {
  const land = { categories: new Uint8Array(16384), flags: new Uint16Array(16384), buildingIds: new Uint16Array(16384) }
  const to = { x: 0x2100, y: 0x2100 }, movement = emptyPersonOrder(), sermon = emptyPersonOrder()
  const outside = () => ({ x: 0x2200, y: 0x2200 })
  prepareMovementOrder(movement, to, 32, land, outside)
  prepareMovementOrder(sermon, to, 32, land, outside, 32)
  assert.equal(movement.model, 3)
  assert.deepEqual(sermon, { ...movement, model: 32 })
  sermon.flags = 64
  prepareMovementOrder(sermon, to, 32, land, outside, 32)
  assert.equal(sermon.flags, 64)
})
