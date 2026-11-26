import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, nativePosition, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { selectUnit } from '../app/selection-runtime.ts'
import { guardPostClick } from '../app/live-command.ts'
import { guardPostCount } from '../app/guard-posts.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

function episode() {
  const world = createWorld(2)
  const advance = turn => { while (world.turn < turn) tick(world, 1 / 12) }
  advance(430)
  const matches = world.units.filter(unit =>
    unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 &&
    unit.x === -107 && unit.z === -99
  )
  assert.equal(matches.length, 1)
  const [actor] = matches, person = actor.native
  assert.ok(person && !person.vehicle)
  selectUnit(world, actor.id, false)
  assert.deepEqual(world.selected, [actor.id])
  return { world, actor, person, advance, current: () => currentPersonOrder(world.buildingOrders, person) }
}

function authoredWalkBits(world, point) {
  const p = nativePosition(world, point), x = (p.x >> 8) & 254, y = (p.y >> 8) & 254
  const i = (y >> 1) * 128 + (x >> 1)
  assert.equal(world.land.flags[i] & 516, 0)
  assert.ok(rules.terrainCategoryFlags[world.land.categories[i] & 15] & 1)
  const bitAt = (xx, yy) => {
    const bit = yy * 256 + xx
    return (world.land.walkMasks[0][bit >> 3] >>> (bit & 7)) & 1
  }
  return [bitAt(x, y), bitAt(x + 1, y), bitAt(x, y + 1), bitAt(x + 1, y + 1)]
}

test('authored coarse land points require walk bits for a real ground order', () => {
  const { world, current } = episode()
  const blocked = { x: -111, z: -113 }, permitted = { x: -121, z: -113 }
  assert.deepEqual(authoredWalkBits(world, blocked), [0, 1, 1, 0])
  assert.deepEqual(authoredWalkBits(world, permitted), [1, 1, 1, 1])
  const oldTurn = world.lastOrderTurn
  assert.equal(command(world, blocked), false)
  assert.equal(current(), undefined)
  assert.equal(world.lastOrderTurn, oldTurn)
  assert.equal(command(world, permitted), true)
  const order = current()
  assert.deepEqual([order.model, order.a, order.b], [3, 36608, 26880])
  assert.equal(world.lastOrderTurn, world.turn)
})

test('ordinary completed route resolves its raw destination before cell-centering the anchor', () => {
  const { world, actor, person, current, advance } = episode()
  const target = { x: -104, z: -102 }
  assert.deepEqual([person.anchorX, person.anchorY], [40192, 23296])
  assert.equal(command(world, target), true)
  const order = current()
  assert.deepEqual([order.model, order.a, order.b], [3, 40960, 24064])
  advance(435)
  assert.equal(current(), order)
  advance(436)
  assert.equal(actor.native, person)
  assert.equal(current(), undefined)
  assert.deepEqual([person.x, person.y], [40522, 23626])
  assert.notEqual((person.x & 0xfe00) + 256, 41216)
  assert.deepEqual([person.anchorX, person.anchorY, person.anchorFlags], [41216, 24320, 0])
})

test('a real replacement command releases every old patrol order but not its markers', () => {
  const { world, actor, person, current } = episode()
  assert.equal(world.unlockedGuardPost, true)
  const initialMarkers = guardPostCount(world.secondaryEffects)
  for (const point of [{ x: -121, z: -113 }, { x: -104, z: -102 }, { x: -103, z: -98 }])
    assert.equal(guardPostClick(world, point), 'placed')
  const ids = person.commands.filter(Boolean)
  assert.equal(new Set(ids).size, 3)
  const records = ids.map(id => world.buildingOrders.records[id])
  assert.deepEqual(records.map(r => [r.model, r.references]), [[25, 1], [25, 1], [25, 1]])
  assert.equal(current(), records[0])
  assert.equal(command(world, { x: -105, z: -100 }), true)
  assert.equal(actor.native, person)
  assert.deepEqual(records.map(r => r.references), [0, 0, 0])
  assert.equal(person.commands.filter(Boolean).length, 1)
  assert.deepEqual([current().model, current().a, current().b], [3, 40704, 23552])
  assert.equal(guardPostCount(world.secondaryEffects), initialMarkers + 3)
})
