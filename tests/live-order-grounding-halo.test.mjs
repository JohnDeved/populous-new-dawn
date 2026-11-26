import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, browserPosition, createWorld, nativePosition } from '../app/model.ts'
import { buildingInsidePoint, buildingPose } from '../app/building-shapes.ts'
import { startLiveOrders } from '../app/live-movement.ts'
import { createLivePerson } from '../app/live-people.ts'
import { allocatePersonOrder, attachPersonOrder } from '../app/person-orders.ts'
import { spellHalo } from '../app/spell-halo.ts'
import { effect } from '../app/world-effects.ts'

test('starting a supplied entry order retains an inside follower only for the matching footprint', () => {
  for (const matched of [true, false]) {
    const world = createWorld(5)
    const temple = world.buildings.find(building => building.id === 61)
    assert.deepEqual([temple.kind, temple.team], ['temple', 'blue'])
    const loc = buildingInsidePoint(buildingPose(temple))
    const cell = (loc.y >> 9) * 128 + (loc.x >> 9)
    assert.deepEqual([world.land.buildingIds[cell] & 1023, world.land.flags[cell] & 512], [61, 512])
    const u = addUnit(world, 'blue', 'brave', browserPosition(loc))
    const p = u.native ?? createLivePerson(world, u)
    // Supply the in-building state and command; this is not an admission witness.
    u.native = p
    u.inside = p.building = temple.id
    p.flags2 |= 0x800010
    const order = allocatePersonOrder(world.buildingOrders)
    assert.ok(order)
    assert.ok(!world.buildings.some(building => building.id === 65534))
    Object.assign(world.buildingOrders.records[order], { model: 8, a: matched ? temple.id : 65534 })
    attachPersonOrder(world.buildingOrders, p, order, 0, {})
    startLiveOrders(world, p, world)
    assert.equal(p.commandStatus, 8)
    assert.deepEqual([u.inside, p.building, p.flags2 & 0x800010],
      matched ? [temple.id, temple.id, 0x800010] : [null, null, 0],
      'entry-order command must keep only the follower with a matching footprint')
    if (!matched) assert.equal(world.objectCells.objects.get(u.id), p)
  }
})

test('grounded visual allocation reads authored terrain at each supplied position', () => {
  const world = createWorld(5)
  // Two nearby points on the same authored terrain, where a constant or
  // nearest-cell substitution would not preserve the recorded ground heights.
  for (const [x, expected] of [[55504, 87], [55632, 100]]) {
    const pos = browserPosition({ x, y: 62000 })
    const ground = effect(world, 'blast', pos, true)
    const raised = effect(world, 'lightning', pos, true)
    assert.ok(world.effects.includes(ground) && world.effects.includes(raised))
    assert.equal(Math.round(ground.height * 45), expected, 'ground height must sample the supplied coordinates')
    assert.equal(Math.round(raised.height * 45), expected + 1024)
    assert.deepEqual([ground.animation.draw, ground.animation.object], [30, 1099])
  }
})

test('spell halo geometry steps phase and frame bands over the authored Shaman terrain', () => {
  const world = createWorld(5)
  const shaman = world.units.find(u => u.kind === 'shaman' && u.team === 'blue')
  const origin = nativePosition(world, shaman)
  assert.deepEqual(origin, { x: -256, y: 256, h: 67 })
  const state = { angle: 65528 }
  const before = spellHalo(world.land, origin, 512, state, 10)
  assert.equal(state.angle, 0, 'halo phase advances by eight and wraps')
  assert.equal(before.length, 85)
  assert.deepEqual([before[0], before[1], before[11], before[84]], [
    { x: 65280, y: 768, h: 52, frame: 1476 }, { x: 65317, y: 766, h: 52, frame: 1477 },
    { x: 114, y: 609, h: 58, frame: 1475 }, { x: 65229, y: 765, h: 53, frame: 1476 },
  ])
  const after = spellHalo(world.land, origin, 512, state, 11)
  assert.equal(state.angle, 8)
  assert.equal(after.length, 85)
  assert.deepEqual(after[0], { x: 65292, y: 767, h: 52, frame: 1477 })
  assert.deepEqual(after[1], { x: 65330, y: 765, h: 52, frame: 1466 })
})
