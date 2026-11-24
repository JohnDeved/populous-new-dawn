import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { selectUnit } from '../app/selection-runtime.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// 00432590's completed-order path invokes 00402e70 to center both axes
// and clear the anchor byte. Use two ordinary routes from the same M2 start.
for (const route of [
  { z: -98, goalY: 23040, finalY: 23296, earlyInside: true },
  { z: -96, goalY: 22528, finalY: 22784, earlyInside: false },
]) {
  test(`authored M2 ground completion centers the rest anchor for z=${route.z}`, () => {
    const world = createWorld(2)
    while (world.turn < 430) tick(world, 1 / 12)
    const braves = world.units.filter(
      unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 &&
        unit.x === -107 && unit.z === -99,
    )
    assert.equal(braves.length, 1)
    const [brave] = braves
    const person = brave.native
    assert.ok(person)
    const current = () => currentPersonOrder(world.buildingOrders, person)
    const anchor = () => [person.anchorX, person.anchorY, person.anchorFlags]
    const initial = [40192, 23296, 17]
    assert.equal(current(), undefined)
    assert.deepEqual(anchor(), initial)

    selectUnit(world, brave.id, false)
    assert.ok(command(world, { x: -103, z: route.z }))
    const order = current()
    assert.deepEqual([order.model, order.a, order.b], [3, 41216, route.goalY])
    assert.equal(order.references, 1)
    // Descriptor selects the raw target, does not skip the anchor, and the
    // destination has no enclosing building to substitute an entrance.
    assert.equal(rules.personCommands[3].flags & 0x120, 0x20)
    const cell = (order.b >> 9) * 128 + (order.a >> 9)
    assert.equal(world.land.flags[cell] & 512, 0)

    let outsideVisit = false
    let insideNonVisit = false
    const threshold = rules.personArrivalRadius[person.model] + 56
    for (let i = 0; i < 24 && current() === order; i++) {
      tick(world, 1 / 12)
      assert.equal(brave.native, person)
      assert.equal(person.vehicle, 0)
      assert.equal(person.flags4 & 0x4000000, 0)
      const visit = (person.counter & 3) === 0
      const inside =
        Math.abs(person.x - order.a) < threshold && Math.abs(person.y - order.b) < threshold
      if (current() === order) {
        assert.deepEqual(anchor(), initial)
        assert.equal(order.references, 1)
        outsideVisit ||= visit && !inside
        insideNonVisit ||= !visit && inside
      } else {
        assert.equal(visit && inside, true)
      }
    }
    assert.ok(outsideVisit)
    assert.equal(insideNonVisit, route.earlyInside)
    assert.equal(world.turn, 440)
    assert.equal(current(), undefined)
    assert.equal(order.references, 0)
    assert.deepEqual(anchor(), [41216, route.finalY, 0])
  })
}
