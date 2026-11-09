import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { createWorld } from '../app/world-initialization.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { restoreCapacityPolicy } from '../app/capacity-policy.ts'

for (const shape of ['self', 'linked-child']) {
  test(`building allocation terminates after current in-session Save/Load of a ${shape} shrine cycle`, async () => {
    assert.equal(typeof globalThis.indexedDB, 'undefined', 'this is not durable browser storage')
    const store = createGameStore(), world = store.getWorld(), root = world.shrines[0]
    assert.ok(root)
    assert.equal(world.capacityPolicy.mode, 'scalable')
    if (shape === 'self') root.linkedShrine = root
    else root.linkedShrine = { ...root, id: 1023, active: false, linkedShrine: root }
    assert.doesNotThrow(() => restoreCapacityPolicy(world))
    assert.equal(await store.saveCheckpoint(), false)
    assert.equal(store.hasCheckpoint(), true)
    assert.equal(store.loadCheckpoint(), true)
    const loaded = store.getWorld(), loadedRoot = loaded.shrines[0]
    assert.notEqual(loaded, world)
    if (shape === 'self') assert.equal(loadedRoot.linkedShrine, loadedRoot)
    else assert.equal(loadedRoot.linkedShrine.linkedShrine, loadedRoot)
    const nextId = loaded.nextId
    const building = addBuilding(loaded, 'blue', 'hut', { x: 8, z: 32 })
    assert.equal(building.id, shape === 'self' ? 1023 : 1022)
    assert.equal(loaded.nextId, nextId)
    assert.equal(loaded.buildings.at(-1), building)
    assert.doesNotThrow(() => restoreCapacityPolicy(loaded))
    if (shape === 'self') assert.equal(loadedRoot.linkedShrine, loadedRoot)
    else assert.equal(loadedRoot.linkedShrine.linkedShrine, loadedRoot)
  })
}

test('shared inactive descendants reserve every hidden handle across consecutive allocations', () => {
  const world = createWorld(1, 'scalable'), [first, second] = world.shrines
  assert.ok(first && second)
  const tail = { ...first, id: 1022, active: false, linkedShrine: undefined }
  const shared = { ...first, id: 1023, active: false, linkedShrine: tail }
  first.linkedShrine = shared
  second.linkedShrine = shared
  const snapshot = structuredClone(world.shrines), nextId = world.nextId
  assert.doesNotThrow(() => restoreCapacityPolicy(world))
  assert.equal(addBuilding(world, 'blue', 'hut', { x: 8, z: 32 }).id, 1021)
  assert.equal(addBuilding(world, 'blue', 'hut', { x: -8, z: 32 }).id, 1020)
  assert.equal(world.nextId, nextId)
  assert.deepEqual(world.shrines, snapshot)
  assert.equal(first.linkedShrine, second.linkedShrine)
  assert.equal(shared.linkedShrine, tail)
})

test('cyclic hidden ownership still reports exact terrain-handle exhaustion without mutating the World', () => {
  const world = createWorld(1, 'scalable'), root = world.shrines[0]
  root.linkedShrine = { ...root, id: 1023, linkedShrine: root }
  // Allocation-only supplied occupancy, matching the existing exhaustion fixture.
  world.vehicles = Array.from({ length: 1022 }, (_, i) => ({ id: i + 1 }))
  const before = structuredClone(world)
  assert.throws(() => addBuilding(world, 'blue', 'hut', { x: 8, z: 32 }),
    { name: 'Error', message: 'No free terrain building handles' })
  assert.deepEqual(world, before)
})
