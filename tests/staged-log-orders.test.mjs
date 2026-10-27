import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addUnit, command, tick } from '../app/model.ts'
import { stepQueuedTreeOrder } from '../app/live-construction-runtime.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

function scenario() {
  const w = createStartedWorld()
  retainFixtureUnits(w, () => false)
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  const u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  w.selected = [u.id]
  const log = { id: w.nextId++, x: 6, z: 0, model: 11, logs: 1 }
  w.trees.push(log)
  return { w, u, log }
}

const orders = (w, u) => u.native.commands.filter(Boolean).map(id => w.buildingOrders.records[id])

test('Ctrl loose-log input stages subtype 2 and preserves a following ordinary waypoint', () => {
  const { w, u, log } = scenario()
  command(w, log, { ctrlKey: true })
  assert.equal(w.orderCursor, 1)
  assert.equal(orders(w, u)[0].model, 7)
  assert.equal(orders(w, u)[0].flags & 12, 8)
  const owner = u.native
  command(w, { x: 12, z: 0 })
  assert.equal(u.native, owner)
  assert.deepEqual(
    orders(w, u).map(order => order.model),
    [7, 3]
  )
  assert.equal(w.orderCursor, 0)
  assert.equal(w.buildingOrders.active, 2)
})

test('standing-tree staged subtype and plain loose-log legacy assignment stay distinct', () => {
  for (const model of [1, 11]) {
    const { w, u, log } = scenario()
    log.model = model
    command(w, log, { ctrlKey: true })
    assert.equal(orders(w, u)[0].model, 7)
    assert.equal(orders(w, u)[0].flags & 12, model === 1 ? 4 : 8)
  }
  const { w, u, log } = scenario()
  command(w, log)
  assert.equal(w.orderCursor, 0)
  assert.equal(u.tree, log.id)
  assert.equal(orders(w, u)[0].model, 3)
})

test('queued loose-resource acquisition finds the adjacent cell, retaining positive fractional stock', () => {
  const { w, u, log } = scenario()
  log.logs = 0.5
  u.native = createLivePerson(w, u)
  const target = nativePosition(w, log)
  const result = stepQueuedTreeOrder(w, u, { a: (target.x - 512) & 65535, b: target.y, flags: 8 })
  assert.equal(result, 0)
  assert.equal(u.tree, log.id)
  assert.equal(log.logs, 0.5)
})

test('retired queued owner is invalidated without harvesting a replacement during that visit', () => {
  const { w, u, log } = scenario()
  u.native = createLivePerson(w, u)
  u.tree = log.id
  u.harvest = { remaining: 1 }
  log.logs = 0
  const replacement = { ...log, id: w.nextId++, logs: 1 }
  w.trees.push(replacement)
  const target = nativePosition(w, log)
  assert.equal(stepQueuedTreeOrder(w, u, { a: target.x, b: target.y, flags: 8 }), 0)
  assert.equal(u.tree, null)
  assert.equal(u.harvest, undefined)
  assert.equal(replacement.logs, 1)
  assert.equal(u.cargo, 0)
})

test('queued command allocation exhaustion does not assign an immediate legacy log owner', () => {
  const { w, u, log } = scenario()
  for (const record of w.buildingOrders.records.slice(1)) record.references = 1
  const before = structuredClone(w.buildingOrders)
  command(w, log, { ctrlKey: true })
  assert.equal(u.tree, null)
  assert.equal(w.orderCursor, 0)
  assert.deepEqual(w.buildingOrders, before)
})

function until(w, condition, limit = 360) {
  for (let i = 0; i < limit && !condition(); i++) tick(w, 1 / 12)
  assert.ok(condition(), 'bounded ordinary world turns reach the expected queue state')
}

test('staged log approach preserves command ownership, pickup advances the tail, and pools release', () => {
  const { w, u, log } = scenario()
  command(w, log, { ctrlKey: true })
  command(w, { x: 12, z: 0 })
  const owner = u.native,
    ids = owner.commands.filter(Boolean),
    head = w.buildingOrders.records[ids[0]],
    tail = w.buildingOrders.records[ids[1]]
  tick(w, 1 / 12)
  assert.equal(u.native, owner)
  assert.equal(head.references, 1)
  assert.equal(tail.references, 1)
  until(w, () => u.cargo === 1)
  assert.equal(log.logs, 0)
  until(w, () => w.buildingOrders.active === 0 && w.motionRoutes.active === 0)
  assert.equal(head.references, 0)
  assert.equal(tail.references, 0)
  assert.ok(u.x > 10)
})

test('checkpoint clone and canonical migration preserve staged resource owner and queue continuation', () => {
  const { w, u, log } = scenario()
  command(w, log, { ctrlKey: true })
  command(w, { x: 12, z: 0 })
  until(w, () => u.tree === log.id && u.path.length > 0)
  const restored = migrateCheckpoint(structuredClone(w)),
    other = restored.units.find(person => person.id === u.id)
  assert.deepEqual(restored.trees, w.trees)
  assert.deepEqual(other.native.commands, u.native.commands)
  for (const [world, person] of [
    [w, u],
    [restored, other],
  ]) {
    until(world, () => world.buildingOrders.active === 0 && world.motionRoutes.active === 0)
    assert.equal(person.cargo, 1)
    assert.ok(person.x > 10)
  }
  assert.deepEqual(restored.trees, w.trees)
})

test('retirement defers approach replacement until next-visit resource reacquisition', () => {
  const { w, u, log } = scenario()
  command(w, log, { ctrlKey: true })
  command(w, { x: 12, z: 0 })
  until(w, () => u.tree === log.id && u.path.length > 0)
  const replacement = { ...log, id: w.nextId++, x: -6, logs: 1 }
  w.trees.push(replacement)
  log.logs = 0
  const order = orders(w, u)[0],
    oldPath = u.path
  assert.equal(stepQueuedTreeOrder(w, u, order), 0)
  assert.equal(u.tree, null)
  assert.equal(u.path, oldPath, 'invalidation does not advance the next acquisition')
  assert.equal(stepQueuedTreeOrder(w, u, order), 0)
  assert.equal(u.tree, replacement.id)
  assert.notEqual(u.path, oldPath)
  assert.equal(orders(w, u)[0], order)
  assert.ok(u.path.length > 0)
})

test('explicit raw resource route masks signed endpoints and leaves the current goal untouched', async () => {
  const { buildLiveResourceRoute, buildLiveRecoveryRoute } =
    await import('../app/live-pathfinding.ts')
  const { w, u } = scenario()
  const p = createLivePerson(w, u)
  p.goalX = 1234
  p.goalY = 5678
  u.native = p
  const other = structuredClone(w),
    v = other.units.find(person => person.id === u.id),
    q = v.native,
    target = { x: -256, y: -512 }
  q.goalX = target.x & 65535
  q.goalY = target.y & 65535
  const actual = buildLiveResourceRoute(w, u, p, target),
    expected = buildLiveRecoveryRoute(other, v, q, 0)
  assert.equal(actual, expected)
  assert.deepEqual(w.motionRoutes, other.motionRoutes)
  assert.equal(p.flags4, q.flags4)
  assert.equal(p.goalX, 1234)
  assert.equal(p.goalY, 5678)
})

test('vehicle collision acquisition branch retains the resource without a raw route build', () => {
  const { w, u, log } = scenario()
  log.x = u.x
  log.z = u.z
  u.native = createLivePerson(w, u)
  u.native.vehicle = 123
  u.native.flags4 |= 0x02000000
  const before = structuredClone(w.motionRoutes),
    target = nativePosition(w, log)
  assert.equal(stepQueuedTreeOrder(w, u, { a: target.x, b: target.y, flags: 8 }), 0)
  assert.equal(u.tree, log.id)
  assert.deepEqual(w.motionRoutes, before)
})

test('live acquisition projection preserves ring-eight candidates across both wrapped boundaries', async () => {
  const { browserPosition } = await import('../app/world-coordinates.ts')
  for (const [center, offset, model] of [
    [0, -8, 11],
    [127, 8, 11],
    [0, -8, 1],
  ]) {
    const { w, u, log } = scenario()
    const target = { x: ((center + offset) & 127) * 512 + 256, y: 256 }
    Object.assign(log, browserPosition(target), { model })
    // A newer outside-ring log must not displace the boundary candidate.
    w.trees.push({
      ...log,
      ...browserPosition({ x: ((center + Math.sign(offset) * 9) & 127) * 512 + 256, y: 256 }),
      id: w.nextId++,
      model: 11,
    })
    u.native = createLivePerson(w, u)
    const result = stepQueuedTreeOrder(w, u, { a: center * 512 + 256, b: 256, flags: 8 })
    assert.equal(result, 0)
    assert.equal(
      u.tree,
      log.id,
      model === 1
        ? 'preferred logs miss, fallback keeps wrapped tree'
        : 'wrapped ring-eight loose log remains admitted'
    )
  }
})
