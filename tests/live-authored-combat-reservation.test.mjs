import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorld, nativePosition, tick } from '../app/model.ts'
import { selectLiveCombatTarget } from '../app/live-combat.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

function suppliedEncounter(team = 'green') {
  const world = createWorld(10)
  for (let i = 0; i < 100; i++) tick(world, 1 / 12)
  assert.deepEqual([world.turn, world.inputMask], [100, 0])
  const attacker = world.units.find(u => u.id === 112)
  assert.deepEqual([attacker.team, attacker.kind, attacker.x, attacker.z], ['blue', 'warrior', 27, -5])
  // Separate test arrangement: make rival people available on this authored map.
  // Does not claim that these actors occur here naturally or always stand on land.
  const far = addUnit(world, team, 'brave', { x: 20, z: -5 })
  const near = addUnit(world, team, 'brave', { x: 25, z: -5 })
  const pos = nativePosition(world, attacker)
  const order = { model: 11, flags: 0, a: ((pos.x >>> 8) & 254) | (pos.y & 0xfe00), b: 0x0808 }
  assert.deepEqual([far.id, near.id], [138, 139])
  return { world, attacker, far, near, order }
}

test('live area adapter rolls over to the next rival after three ordinary reservations', () => {
  const { world, attacker, far, near, order } = suppliedEncounter()
  const ally = addUnit(world, 'blue', 'brave', { x: 26, z: -5 })
  const select = () => selectLiveCombatTarget(world, attacker, order)
  for (let i = 1; i <= 3; i++) {
    const selection = select()
    assert.equal(selection?.owner, near, 'distance precedes registry order while the rival can be reserved')
    assert.equal(selection.type, 2)
    assert.deepEqual(near.attackReservation, {
      flags4: i === 3 ? 0x100000 : 0,
      reactionTimer: i,
      reactionDuration: 48,
    }, 'ordinary reserve increments exactly once and saturates at three')
    assert.equal(far.attackReservation, undefined)
    assert.equal(ally.attackReservation, undefined)
  }
  assert.equal(select()?.owner, far, 'the saturated nearer rival does not block the open farther rival')
  assert.deepEqual(far.attackReservation, { flags4: 0, reactionTimer: 1, reactionDuration: 48 })
  assert.deepEqual(near.attackReservation, { flags4: 0x100000, reactionTimer: 3, reactionDuration: 48 })
})

test('unaided Mission 10 turn scan publishes an order and reservation at the supplied encounter', () => {
  const { world, far, near } = suppliedEncounter()
  const owned = world.units.find(u => u.id === 113)
  for (let i = 0; i < 3; i++) tick(world, 1 / 12)
  assert.equal(far.attackReservation, undefined)
  assert.equal(currentPersonOrder(world.buildingOrders, owned.native), undefined)
  tick(world, 1 / 12)
  assert.equal(world.turn, 104)
  assert.equal(world.objectCells.objects.get(owned.id), owned.native)
  const order = currentPersonOrder(world.buildingOrders, owned.native)
  assert.ok(order, "hostile person threat must publish a response order")
  assert.deepEqual([order.model, order.flags, order.a, order.b], [21, 48, 64024, 1028])
  assert.deepEqual([owned.native.substate, owned.native.workTarget], [6, far.id])
  assert.deepEqual(far.attackReservation, { flags4: 0, reactionTimer: 1, reactionDuration: 48 })
  assert.equal(near.attackReservation, undefined)
})


test('identically supplied friendly people do not trigger the authored warrior threat order', () => {
  const { world, far, near } = suppliedEncounter('blue')
  const owned = world.units.find(u => u.id === 113)
  for (let i = 0; i < 4; i++) tick(world, 1 / 12)
  assert.equal(world.turn, 104)
  assert.equal(currentPersonOrder(world.buildingOrders, owned.native), undefined)
  assert.equal(far.attackReservation, undefined)
  assert.equal(near.attackReservation, undefined)
})
