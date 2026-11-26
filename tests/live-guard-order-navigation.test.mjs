import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { appendLiveGuardOrders, startLiveOrder, stepLiveMovement } from '../app/live-movement.ts'
import { allocatePersonOrder, createPersonOrderPool, currentPersonOrder } from '../app/person-orders.ts'
import { boardingTargetLeftOrigin } from '../app/vehicle-boarding-orders.ts'

test('the guard adapter commits both queued slots in order and shares their ownership', () => {
  const world = createWorld(10)
  for (let n = 0; n < 100; n++) tick(world, 1 / 12)
  assert.deepEqual([world.turn, world.inputMask], [100, 0])
  const units = [111, 112].map(id => world.units.find(u => u.id === id))
  assert.deepEqual(units.map(u => [u.team, u.kind]), [['blue', 'warrior'], ['blue', 'warrior']])
  const unrelated = world.units.find(u => u.id === 113)
  assert.ok(unrelated.native.commands.every(id => id === 0))
  for (const u of units) assert.ok(u.native.commands.every(id => id === 0))

  assert.equal(appendLiveGuardOrders(world, units, 0xfa9b), true)
  const first = units[0].native.commands.slice(0, 2)
  assert.ok(first.every(Boolean) && first[0] !== first[1])
  for (const u of units)
    assert.deepEqual(u.native.commands, [...first, 0, 0, 0, 0, 0, 0])
  const fields = ({ model, flags, references, a, b }) => [model, flags, references, a, b]
  assert.deepEqual(first.map(id => fields(world.buildingOrders.records[id])), [
    [3, 0, 2, 39808, 64128], [11, 0, 2, 64155, 1542],
  ])
  assert.equal(appendLiveGuardOrders(world, units, 0xfa9b, 0xfaa3), true)
  const second = units[0].native.commands.slice(0, 2)
  for (const u of units)
    assert.deepEqual(u.native.commands, [...second, 0, 0, 0, 0, 0, 0])
  assert.deepEqual(second.map(id => fields(world.buildingOrders.records[id])), [
    [25, 0, 2, 39424, 64000], [25, 0, 2, 41472, 64000],
  ])
  assert.ok(first.every(id => world.buildingOrders.records[id].references === 0))
  assert.ok(unrelated.native.commands.every(id => id === 0))
})

test('fixed order allocation wraps past a referenced record and clears only identity', () => {
  const pool = createPersonOrderPool()
  pool.cursor = 799
  const occupied = pool.records[799]
  Object.assign(occupied, { references: 2, model: 11, flags: 32, object: 4321, a: 12, b: 33 })
  Object.assign(pool.records[1], { references: 0, model: 22, flags: 64, object: 1234, a: 56, b: 70 })
  assert.equal(allocatePersonOrder(pool), 1)
  assert.equal(pool.cursor, 2)
  assert.deepEqual(pool.records[1], { references: 0, model: 0, flags: 0, object: 0, a: 56, b: 70 })
  assert.deepEqual(occupied, { references: 2, model: 11, flags: 32, object: 4321, a: 12, b: 33 })
  for (let id = 1; id < 800; id++) pool.records[id].references = 1
  assert.equal(allocatePersonOrder(pool), 0)
  assert.equal(pool.cursor, 2)
})

test('boarding compares wrapped packed-cell deltas, even-masking only the live boat', () => {
  const vehicle = { x: 0xffa7, y: 0x0181 } // current origin bytes become 254 and 0
  const left = (model, x, y) => boardingTargetLeftOrigin({ model, b: x | (y << 8) }, vehicle)
  assert.equal(left(22, 7, 0), false) // wrapped dx=9, not 247
  assert.equal(left(22, 8, 0), true) // exactly 100
  assert.equal(left(22, 4, 8), true) // 6² + 8² = 100; both components count
  assert.equal(left(22, 4, 7), false)
  assert.equal(left(22, 253, 247), false) // signed wrap in Y
  assert.equal(left(21, 4, 8), false) // another command is not a boarding-origin query
})

test('the Mission 5 movement dispatcher retires a boarding request at ten bytes but not nine', () => {
  for (const [offset, expected] of [[9, 'pursuing'], [10, 'retired']]) {
    const world = createWorld(5)
    for (let n = 0; n < 12; n++) tick(world, 1 / 12)
    const boat = world.vehicles.find(v => v.model === 1)
    const walker = world.units.find(u => u.id === 111)
    assert.deepEqual([boat.id, boat.x, boat.y, boat.active, boat.passengerCount], [97, 58226, 12429, false, 0])
    // Supply the live availability and requested origin; this is not UI-earned boarding.
    boat.active = true
    const id = allocatePersonOrder(world.buildingOrders)
    const originX = ((boat.x >>> 8) & 254) + offset
    const originY = (boat.y >>> 8) & 254
    const record = world.buildingOrders.records[id]
    Object.assign(record, { model: 22, a: boat.id, b: originX | (originY << 8) })
    startLiveOrder(world, walker, id)
    assert.equal(world.objectCells.objects.get(walker.id), walker.native)
    assert.equal(currentPersonOrder(world.buildingOrders, walker.native), record)
    stepLiveMovement(world, walker)
    assert.deepEqual([walker.native.vehicle, boat.passengerCount], [0, 0])
    if (expected === 'pursuing') {
      assert.equal(currentPersonOrder(world.buildingOrders, walker.native), record)
      assert.deepEqual([walker.native.state, record.references], [10, 1])
    } else {
      assert.equal(currentPersonOrder(world.buildingOrders, walker.native), undefined)
      assert.deepEqual([walker.native.state, record.references], [19, 0])
    }
  }
})
