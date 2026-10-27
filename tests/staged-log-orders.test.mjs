import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addUnit, command, tick } from '../app/model.ts'
import { stepQueuedTreeOrder } from '../app/live-construction-runtime.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

function scenario(capacity = 'scalable') {
  const w = createStartedWorld(1, capacity)
  retainFixtureUnits(w, () => false)
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  // Keep the real campaign outcome controller active without winning this isolated fixture.
  addUnit(w, 'red', 'brave', { x: 40, z: 40 })
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
  const { w, u, log } = scenario('classic')
  for (const record of w.buildingOrders.records.slice(1)) record.references = 1
  const before = structuredClone(w.buildingOrders)
  command(w, log, { ctrlKey: true })
  assert.equal(u.tree, null)
  assert.equal(
    w.orderCursor,
    1,
    'existing staged input advances its cursor even on allocation failure'
  )
  assert.deepEqual(w.buildingOrders, before)
})

function continuationState(w) {
  return JSON.stringify({
    turn: w.turn,
    paused: w.paused,
    outcome: w.outcome,
    status: w.status,
    landFlags: w.land.landFlags,
    tribes: w.manaTribes.map(t => ({ population: t.population, defeatTimer: t.defeatTimer })),
    trees: w.trees,
    orders: w.buildingOrders.active,
    routes: w.motionRoutes.active,
    units: w.units.map(u => ({
      id: u.id,
      x: u.x,
      z: u.z,
      hp: u.hp,
      cargo: u.cargo,
      tree: u.tree,
      harvest: u.harvest,
      path: u.path,
      native: u.native,
    })),
  })
}

function until(w, condition, limit = 360) {
  for (let i = 0; i < limit && !condition(); i++) {
    tick(w, 1 / 12)
    if (w.status !== 'playing') assert.equal(w.status, 'playing', continuationState(w))
  }
  assert.ok(
    condition(),
    `bounded ordinary world turns reach the expected queue state: ${continuationState(w)}`
  )
}

test('staged log approach preserves command ownership, pickup advances the tail, and pools release', () => {
  const { w, u, log } = scenario()
  command(w, log, { ctrlKey: true })
  command(w, { x: 12, z: 0 })
  const owner = u.native,
    ids = owner.commands.filter(Boolean),
    head = w.buildingOrders.records[ids[0]],
    tail = w.buildingOrders.records[ids[1]]
  until(w, () => u.tree === log.id && u.path.length > 0)
  assert.equal(u.native, owner)
  assert.equal(w.pathfinding.people.get(u.id), owner)
  assert.equal(head.references, 1)
  assert.equal(tail.references, 1)
  until(w, () => u.cargo === 1)
  assert.equal(log.logs, 0)
  until(w, () => w.buildingOrders.active === 0 && w.motionRoutes.active === 0)
  assert.equal(head.references, 0)
  assert.equal(tail.references, 0)
  assert.ok(u.x > 10, continuationState(w))
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
    assert.equal(person.cargo, 1, continuationState(world))
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
  assert.equal(w.pathfinding.people.get(u.id), u.native)
  const selected = nativePosition(w, replacement)
  assert.equal(u.native.goalX, selected.x & 65535)
  assert.equal(u.native.goalY, selected.y & 65535)
  until(w, () => u.cargo === 1)
  assert.equal(replacement.logs, 0)
})

test('explicit raw resource route masks signed endpoints and leaves the current goal untouched', async () => {
  const { buildLiveResourceRoute, buildLiveRecoveryRoute } =
    await import('../app/live-pathfinding.ts')
  const { w, u } = scenario()
  const p = createLivePerson(w, u)
  p.goalX = 1234
  p.goalY = 5678
  u.native = p
  const coast = rules.terrainCategoryFlags.findIndex(flags => flags & 60)
  assert.ok(coast >= 0)
  w.land.categories[127 * 128 + 127] = coast
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
  for (const [center, offset, model, axis] of [
    [0, -8, 11, 'x'],
    [127, 8, 11, 'x'],
    [0, -8, 1, 'x'],
    [0, -8, 11, 'y'],
    [127, 8, 1, 'y'],
  ]) {
    const { w, u, log } = scenario()
    const point = delta => ({ x: 256, y: 256, [axis]: ((center + delta) & 127) * 512 + 256 })
    const target = point(offset)
    Object.assign(log, browserPosition(target), { model })
    // A newer outside-ring log must not displace the boundary candidate.
    w.trees.push({
      ...log,
      ...browserPosition(point(Math.sign(offset) * 9)),
      id: w.nextId++,
      model: 11,
    })
    u.native = createLivePerson(w, u)
    const origin = point(0)
    const result = stepQueuedTreeOrder(w, u, { a: origin.x, b: origin.y, flags: 8 })
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

test('raw route failure keeps selected resource and clears only acquisition failure bit', async () => {
  const { buildLiveResourceRoute } = await import('../app/live-pathfinding.ts')
  const { w, u, log } = scenario()
  log.x = u.x
  log.z = u.z
  u.native = createLivePerson(w, u)
  const p = u.native,
    target = nativePosition(w, log),
    cache = w.motionRoutes.failedSearches,
    view = new DataView(cache.buffer, cache.byteOffset, cache.byteLength)
  view.setInt16(0, 16, true)
  cache[2] = (p.x >>> 8) & 254
  cache[3] = (p.y >>> 8) & 254
  cache[6] = (target.x >>> 8) & 254
  cache[7] = (target.y >>> 8) & 254
  p.flags4 = (p.flags4 | 0x90000000) >>> 0
  const control = structuredClone(w),
    other = control.units.find(person => person.id === u.id)
  assert.equal(buildLiveResourceRoute(control, other, other.native, target), 0)
  assert.ok(other.native.flags4 & 0x10000000)
  assert.equal(stepQueuedTreeOrder(w, u, { a: target.x, b: target.y, flags: 8 }), 0)
  assert.equal(u.tree, log.id)
  assert.equal(p.flags4 & 0x10000000, 0)
  assert.equal(p.flags4 >>> 31, 1)
  assert.ok(p.flags4 >= 0)
})

test('live cell projection follows insertion chronology, skips retired stock, and ignores numeric ID order', () => {
  const { w, u, log } = scenario()
  w.nextId += 3
  log.id = w.nextId - 1
  const newestLive = { ...log, id: w.nextId - 2 },
    retired = { ...log, id: w.nextId - 3, logs: 0 }
  w.trees.push(newestLive, retired)
  u.native = createLivePerson(w, u)
  const point = nativePosition(w, log)
  assert.equal(stepQueuedTreeOrder(w, u, { a: point.x, b: point.y, flags: 8 }), 0)
  assert.equal(u.tree, newestLive.id)
})

test('exhausted resource search completes the staged head and releases the reachable tail without cargo', () => {
  const { w, u, log } = scenario()
  command(w, log, { ctrlKey: true })
  command(w, { x: 12, z: 0 })
  const head = orders(w, u)[0],
    tail = orders(w, u)[1]
  log.logs = 0
  until(w, () => w.buildingOrders.active === 0 && w.motionRoutes.active === 0)
  assert.equal(u.cargo, 0)
  assert.equal(u.tree, null)
  assert.equal(head.references, 0)
  assert.equal(tail.references, 0)
  assert.ok(u.x > 10, continuationState(w))
})
