import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../app/world-initialization.ts'
import { missionData } from '../app/mission-data.ts'
import { liveCommandContext } from '../app/live-command.ts'
import { worshipHeadPose } from '../app/live-worship.ts'
import { worshipApproach } from '../app/worship.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { canOrder } from '../app/selection-runtime.ts'
import { acceptsPersonOrder, currentPersonOrder } from '../app/person-orders.ts'
import { planLivePath } from '../app/live-pathfinding.ts'
import { personRoutePosition } from '../app/person-routes.ts'
import { supportsFollower } from '../app/world-terrain-runtime.ts'

// Source fixture only: no ticks, commands, actor edits or route attachment.
// This checks pre-opening admission and geometry, not ordinary arrival or worship.
test('original Mission 3 Shaman can plan to the unused Erosion head on a clone', () => {
  const original = createWorld(3)
  const before = structuredClone(original)
  const world = structuredClone(original)
  const objects = missionData(3).level.objects
  const sourceShaman = objects.find(object => object.index === 45)
  const sourceHead = objects.find(object => object.index === 101)
  const sourceScenery = objects.find(object => object.index === 102)
  const sourceEffect = objects.find(object => object.index === 103)
  assert.ok(sourceShaman && sourceHead && sourceScenery && sourceEffect)
  assert.deepEqual(
    [sourceShaman.type, sourceShaman.model, sourceShaman.owner, sourceShaman.x, sourceShaman.z],
    [1, 7, 0, 35, 81]
  )
  assert.deepEqual([sourceHead.type, sourceHead.model, sourceHead.x, sourceHead.z], [6, 6, -7, 115])
  assert.equal(sourceHead.settings[6] | (sourceHead.settings[7] << 8), sourceEffect.index + 1)
  assert.deepEqual([sourceEffect.type, sourceEffect.model], [7, 23])

  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const head = world.shrines.find(shrine =>
    shrine.kind === 'erosionEffect' && shrine.x === sourceHead.x && shrine.z === sourceHead.z
  )
  assert.ok(shaman && head)
  assert.deepEqual({ x: shaman.x, z: shaman.z }, { x: sourceShaman.x, z: sourceShaman.z })
  assert.ok(shaman.hp > 0)
  assert.equal(shaman.inside, null)
  assert.equal(shaman.native.model, 7)
  assert.equal(shaman.native.flags4 & 0x800, 0, 'the original Shaman is not a ghost')
  assert.deepEqual(world.selected, [shaman.id], 'initial selection retains the original Shaman')
  assert.equal(canOrder(shaman), true)
  assert.equal(acceptsPersonOrder(shaman.native, 27), true)
  assert.equal(currentPersonOrder(world.buildingOrders, shaman.native).model, 18)
  assert.ok(shaman.native.flags4 & 128, 'opening still owns fresh selection; do not bypass it')
  assert.deepEqual(
    [head.mode, head.required, head.target, head.remaining, head.uses, head.work, head.forced],
    [0, 1, 40, 1, 0, 0, false]
  )
  assert.equal(head.active, true)
  assert.equal(head.enabled, true)
  assert.deepEqual(head.effectTargets, [{ x: sourceEffect.x, z: sourceEffect.z }])
  assert.equal(world.effects.some(effect => effect.erosion), false)

  const context = liveCommandContext(world, head)
  assert.equal(context.model, 27)
  assert.equal(context.enabled, true)
  assert.equal(context.shrine, head)
  assert.deepEqual(
    [sourceScenery.type, sourceScenery.model, sourceScenery.heading, sourceScenery.x, sourceScenery.z],
    [5, 9, 1536, sourceHead.x, sourceHead.z]
  )
  const pose = worshipHeadPose(world, head)
  assert.deepEqual(pose, { x: 256, y: 34048, angle: 1536 })
  const approach = worshipApproach(pose)
  assert.deepEqual(approach, { x: 768, y: 34048 })
  assert.deepEqual(browserPosition(approach), { x: -5, z: 115 })
  assert.equal(supportsFollower(world, browserPosition(approach)), true)

  // Use the same fresh candidate as direct command admission, on disposable state.
  const route = planLivePath(world, shaman, browserPosition(approach))
  assert.ok(route, 'the authored start has a land route to the canonical approach')
  assert.notEqual(route, shaman.native, 'the query must not take the live actor as its candidate')
  assert.ok(route.motionGroup > 0, 'require a constructed route, not direct fallback')
  assert.deepEqual({ x: route.goalX, y: route.goalY }, approach)
  assert.equal(route.flags4 & 0x10000000, 0, 'the route is not marked failed')
  assert.equal(world.motionRoutes.records[route.motionGroup * 109 + 2] & 3, 0, 'no transport route')
  const count = world.motionRoutes.records[route.motionGroup * 109 + 108]
  assert.ok(count > 0)
  for (let index = 0; index < count; index++)
    assert.equal(
      supportsFollower(world, browserPosition(personRoutePosition(world.motionRoutes, route.motionGroup, index))),
      true,
      'every planned waypoint supports an ordinary follower'
    )
  assert.equal(world.pathfinding.state.truncated, 0)
  assert.equal(world.pathfinding.solver.limited, 0)

  assert.deepEqual(original, before, 'the original world is never changed by preflight')
  assert.deepEqual(world.units, before.units, 'no cloned actor state or position is changed')
  assert.deepEqual(world.shrines, before.shrines, 'the unused head is neither forced nor consumed')
  assert.deepEqual(world.buildingOrders, before.buildingOrders, 'no order is issued or replaced')
  assert.deepEqual(world.levelStart, before.levelStart, 'the real opening remains unadvanced')
  assert.deepEqual(world.effects, before.effects, 'no effect is created')
  assert.deepEqual(world.land, before.land, 'terrain is not supplied or altered for the route')
  assert.deepEqual(world.selected, before.selected)
  assert.deepEqual(
    [world.turn, world.time, world.randomState, world.cosmeticRandom],
    [before.turn, before.time, before.randomState, before.cosmeticRandom],
    'no clocks or RNG advance'
  )
})
