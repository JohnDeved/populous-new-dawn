import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick, addBuilding, addUnit } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
import { collisionWorld, createLivePerson, stepLiveBuilderPhysics } from '../app/live-people.ts'
import { buildingBlocksPerson } from '../app/person-collision.ts'
import { adoptLiveBuilderMotion, processBuilderWork } from '../app/live-construction-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { attachPersonRoute } from '../app/person-routes.ts'
import { removeObjectFromCell } from '../app/object-cells.ts'

// Supplied collision boundaries exercise the live combined plan/building adapter.
test('construction collision permits its own unfinished building, not another plan or enemy completed building', () => {
  const w = createWorld(7),
    own = addBuilding(w, 'yellow', 'temple', { x: 0, z: 0 }, false),
    other = addBuilding(w, 'yellow', 'hut', { x: 8, z: 0 }, false),
    enemy = addBuilding(w, 'red', 'hut', { x: 16, z: 0 }, true),
    friend = addBuilding(w, 'yellow', 'hut', { x: 24, z: 0 }, true),
    u = addUnit(w, 'yellow', 'brave', { x: 0, z: 4 }),
    p = createLivePerson(w, u)
  p.flags4 |= 1
  p.workTarget = own.id
  const before = { flags2: p.flags2, flags4: p.flags4 }, c = collisionWorld(w)
  assert.equal(c.objects.get(own.id).related, own.id)
  for (const [b, blocked] of [[own, 0], [other, 1], [enemy, 1], [friend, 0]])
    assert.equal(buildingBlocksPerson(c, p, { flags: 512, category: 0, building: b.id }), blocked)
  assert.deepEqual({ flags2: p.flags2, flags4: p.flags4 }, before)
})

test('natural M7 builders share physical/route ownership; preparation preserves command6 and dispatches once', () => {
  const w = createWorld(7)
  let u
  while (w.turn < 1000 && !u) {
    tick(w, 1 / 12)
    u = w.units.find(u => u.builder?.person && currentPersonOrder(w.buildingOrders, u.builder.person)?.model === 6)
  }
  assert.ok(u)
  const p = u.builder.person, task = u.builder, order = currentPersonOrder(w.buildingOrders, p),
    b = w.buildings.find(b => b.id === u.work), counter = p.counter
  assert.equal(u.native, p)
  p.flags2 |= 16 // supplied interruption boundary on an ordinarily acquired builder
  processBuilderWork(w, u, b)
  assert.equal(p.counter, (counter + 1) & 255)
  assert.equal(p.flags2 & 16, 0)
  assert.equal(u.builder, task)
  assert.equal(currentPersonOrder(w.buildingOrders, p), order)
  assert.equal(u.native, p)
  const route = w.pathfinding.people.get(u.id)
  if (route) assert.equal(route, p)
  // Supplied resting-state boundary: no accidental forced state10 or builder visit.
  p.state = 17
  let visits = 0
  stepLiveBuilderPhysics(w, u, p, () => visits++)
  assert.equal(visits, 0)
})

for (const sharedPrior of [false, true]) test(`split legacy builder route adoption preserves pool, queue, RNG and pose (prior shared ref=${sharedPrior})`, () => {
  const w = createWorld(7)
  let u
  while (w.turn < 1200 && !u) {
    tick(w, 1 / 12)
    u = w.units.find(u => u.builder?.person?.motionGroup)
  }
  assert.ok(u)
  const p = u.builder.person, route = structuredClone(p), original = structuredClone(p)
  // Supplied legacy representation: the separate route record owns the one ref;
  // the construction person owns task/animation/commands and trails browser XY.
  const pool = structuredClone(w.motionRoutes)
  if (sharedPrior) {
    route.motionGroup = 0
    attachPersonRoute(w.motionRoutes, route, p.motionGroup)
    route.motionIndex = original.motionIndex
  } else p.motionGroup = p.motionIndex = 0
  removeObjectFromCell(w.objectCells, p)
  const heads = w.objectCells.heads.slice()
  p.flags4 |= 0x08000000
  route.flags4 = (route.flags4 & ~0x08000000) | 0x04000000
  p.flags2 |= 128
  route.flags2 &= ~128
  p.x = (p.x - 64) & 65535
  u.native = null
  w.pathfinding.people.set(u.id, route)
  const rng = w.randomState,
    commands = structuredClone(w.buildingOrders), task = u.builder
  assert.equal(adoptLiveBuilderMotion(w, u), p)
  assert.equal(u.native, p)
  assert.equal(p.flags4 & 0x08000000, 0x08000000)
  assert.equal(p.flags4 & 0x04000000, 0x04000000)
  assert.equal(p.flags2 & 128, 0)
  assert.deepEqual(w.objectCells.heads, heads)
  assert.equal(w.pathfinding.people.get(u.id), p)
  assert.equal(u.builder, task)
  assert.equal(route.motionGroup, 0)
  assert.equal(p.motionGroup, original.motionGroup)
  assert.equal(p.motionIndex, original.motionIndex)
  assert.equal(p.x, original.x)
  assert.equal(p.y, original.y)
  assert.equal(p.counter, original.counter)
  assert.equal(p.cargo, original.cargo)
  assert.deepEqual(p.commands, original.commands)
  assert.deepEqual(w.motionRoutes, pool)
  assert.deepEqual(w.buildingOrders, commands)
  assert.equal(w.randomState, rng)
  assert.equal(adoptLiveBuilderMotion(w, u), p)
  assert.deepEqual(w.motionRoutes, pool)
  tick(w, 1 / 12)
})

test('authored M7 completes Temple and trains Preachers by8000 with current checkpoint continuation', async () => {
  const store = createGameStore()
  store.startMission(7)
  const w = store.getWorld(), initial = new Set(w.units.map(u => u.id))
  while (w.turn < 7800) tick(w, 1 / 12)
  await store.saveCheckpoint()
  assert.equal(store.hasCheckpoint(), true)
  while (w.turn < 8000) tick(w, 1 / 12)
  const yellow = w.units.filter(u => u.team === 'yellow')
  assert.ok(yellow.length > 30)
  for (const kind of ['warrior', 'preacher'])
    assert.ok(yellow.some(u => u.kind === kind && !initial.has(u.id)), `naturally trained ${kind}`)
  for (const kind of ['tower', 'hut', 'camp', 'temple'])
    assert.ok(w.buildings.some(b => b.team === 'yellow' && b.kind === kind && b.progress === 1), `completed ${kind}`)
  assert.ok(w.buildings.some(b => b.team === 'yellow' && b.kind === 'hut' && b.level > 1))
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  while (restored.turn < 8000) tick(restored, 1 / 12)
  assert.deepEqual(restored, w)
})
