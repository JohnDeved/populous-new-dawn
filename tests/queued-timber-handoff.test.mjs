import assert from 'node:assert/strict'
import test from 'node:test'
import { clearLivePath } from '../app/live-pathfinding.ts'
import { cancelInteraction, command, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { setSelection } from '../app/selection-runtime.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { createStartedWorld } from './level-start-fixture.mjs'

function stageTimberPair() {
  const world = createStartedWorld(10)
  const brave = world.units.find(unit => unit.id === 120)
  const first = world.trees.find(tree => tree.id === 108)
  const second = world.trees.find(tree => tree.id === 109)
  const existingTrees = new Set(world.trees.map(tree => tree.id))
  const newLogs = () => world.trees.filter(tree => tree.model === 11 && !existingTrees.has(tree.id))
  const current = () => currentPersonOrder(world.buildingOrders, brave.native)
  const step = () => tick(world, 1 / 12)
  assert.equal(brave.kind, 'brave')
  assert.equal(brave.cargo, 0)
  const firstStock = first.logs

  for (const tree of [first, second]) {
    setSelection(world, [brave.id])
    assert.equal(command(world, tree, { ctrlKey: true }), true)
  }
  cancelInteraction(world)
  const ids = brave.native.commands.filter(Boolean)
  assert.equal(ids.length, 2)
  assert.notEqual(ids[0], ids[1])
  const orders = ids.map(id => world.buildingOrders.records[id])
  const [firstOrder, secondOrder] = orders
  assert.deepEqual(orders.map(order => order.model), [7, 7])
  assert.equal(current(), firstOrder)

  for (let i = 0; i < 220 && current() !== secondOrder; i++) step()
  assert.equal(current(), secondOrder, 'first harvest hands off to the already queued order')
  assert.deepEqual(orders.map(order => order.references), [0, 1])
  assert.equal(first.logs, firstStock - 1)
  assert.equal(brave.native.cargo, 100)
  assert.equal(brave.cargo, 1)
  assert.equal(newLogs().length, 0)
  return { world, brave, second, secondOrder, current, newLogs, step }
}

for (const carried of [100, 40]) {
  test(`a pre-staged second timber order routes and works with ${carried} timber already carried`, () => {
    const { world, brave, second, secondOrder, current, newLogs, step } = stageTimberPair()
    if (carried !== 100) {
      // Supply a partial load only after the natural handoff, at the boundary
      // where both the compatibility and native owners carry the same amount.
      brave.cargo = carried / 100
      brave.native.cargo = carried
      Object.assign(second, { flags4: (second.flags4 ?? 0) | 0x100000, reservations: 4, reservationTimer: 64 })
    }
    const stock = second.logs
    let routeAt, workAt
    for (let i = 0; i < 170 && current() === secondOrder; i++) {
      step()
      if (brave.tree !== null) {
        assert.equal(brave.tree, second.id)
        if (brave.native.motionGroup) routeAt ??= world.turn
        if (brave.harvest) workAt ??= world.turn
      }
      assert.equal(newLogs().length, 0)
    }

    assert.ok(routeAt < workAt && workAt < world.turn, 'native route, work and release occur in order')
    assert.equal(current(), undefined)
    assert.equal(secondOrder.references, 0)
    assert.equal(brave.native.cargo, 100)
    assert.equal(brave.cargo, 1)
    assert.equal(Math.round((stock - second.logs) * 100), 100 - carried)
    if (carried !== 100) {
      assert.ok(second.reservationTimer > 1)
      assert.equal(second.reservations, 3)
      assert.equal(second.flags4 & 0x100000, 0)
    }
  })
}

test('a pre-staged timber order does not extract wood through a failed native route', () => {
  const { world, brave, second, secondOrder, current, newLogs, step } = stageTimberPair()
  brave.cargo = 0.4
  brave.native.cargo = 40
  // Retire the pre-existing coarse click route and admit a real cached route
  // failure for this pair. A compatibility path point is not a native route.
  clearLivePath(world, brave)
  const person = brave.native
  const target = nativePosition(world, second)
  const failures = world.motionRoutes.failedSearches
  // person-routes.ts / 0x4ea970: eight 10-byte entries. Use the last:
  // signed timer at +0, paired coarse coordinate bytes at +2 and +6.
  // The low bit is excluded from each cell key; a hit sets flags4 bit 28.
  const offset = 70
  new DataView(failures.buffer, failures.byteOffset, failures.byteLength).setInt16(offset, 60, true)
  failures.set([(person.x >>> 8) & 254, (person.y >>> 8) & 254], offset + 2)
  failures.set([(target.x >>> 8) & 254, (target.y >>> 8) & 254], offset + 6)
  const stock = second.logs

  for (let i = 0; i < 6; i++) {
    step()
    assert.equal(current(), secondOrder)
    assert.equal(secondOrder.references, 1)
    assert.equal(brave.tree, second.id)
    assert.equal(person.motionGroup, 0)
    assert.ok(person.flags4 & 0x10000000)
    assert.equal(brave.harvest, undefined)
    assert.equal(second.logs, stock)
    assert.equal(person.cargo, 40)
    assert.equal(brave.cargo, 0.4)
    assert.equal(newLogs().length, 0)
  }
})
