import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { selectUnit } from '../app/selection-runtime.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

test('an authored M2 Brave closes a raw point order on an in-range on-foot arrival visit', () => {
  const world = createWorld(2)
  for (let i = 0; i < 430; i++) tick(world, 1 / 12)
  const braves = world.units.filter(unit =>
    unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 &&
    unit.x === -107 && unit.z === -99
  )
  assert.equal(braves.length, 1, 'The authored starting pad owns one live Brave')
  const [brave] = braves, person = brave.native
  assert.ok(person)
  assert.equal(currentPersonOrder(world.buildingOrders, person), undefined)
  selectUnit(world, brave.id, false)
  assert.deepEqual(world.selected, [brave.id])
  assert.equal(command(world, { x: -103, z: -98 }), true)
  const current = () => currentPersonOrder(world.buildingOrders, person)
  const order = current()
  assert.deepEqual([order.model, order.a, order.b], [3, 41216, 23040])
  const threshold = rules.personArrivalRadius[person.model] + 56
  assert.equal(threshold, 440)
  const rows = []
  for (let i = 0; i < 24 && current() === order; i++) {
    tick(world, 1 / 12)
    assert.equal(brave.native, person)
    assert.equal(person.vehicle, 0)
    assert.equal(person.flags4 & 0x4000000, 0, 'Do not take the separate goal-radius branch')
    rows.push({
      visit: (person.counter & 3) === 0,
      inside: Math.abs(person.x - 41216) < threshold && Math.abs(person.y - 23040) < threshold,
      retained: current() === order,
    })
  }
  assert.ok(rows.some(row => row.visit && !row.inside && row.retained), 'Keep the order at an out-of-range visit')
  assert.ok(rows.some(row => !row.visit && row.inside && row.retained), 'Entering range is not itself a scheduled visit')
  assert.deepEqual(rows.at(-1), { visit: true, inside: true, retained: false }, 'Complete only when an eligible visit sees both axes in range')
  assert.equal(current(), undefined)
})
