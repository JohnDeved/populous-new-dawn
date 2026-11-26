import assert from 'node:assert/strict'
import test from 'node:test'
import { CHECKPOINT_VERSION, createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { createWorld } from '../app/model.ts'

test('a current checkpoint cannot contain two building records with one native ID', async () => {
  const store = createGameStore()
  const world = store.getWorld()
  const authoredBuilding = world.buildings.find(building => building.team === 'blue')
  assert.ok(authoredBuilding && world.buildingFootprints.has(authoredBuilding.id))
  const duplicate = { ...structuredClone(authoredBuilding), team: 'red' }
  store.change(current => { current.buildings.push(duplicate) })
  const before = structuredClone(world)
  assert.equal(store.getWorld(), world)
  await assert.rejects(store.saveCheckpoint(), /Duplicate scalable checkpoint building ID/)
  assert.deepEqual(world, before, 'Reject before normalizing any active footprint')
  assert.equal(store.hasCheckpoint(), false)
  assert.equal(store.loadCheckpoint(), false)
  assert.equal(store.getWorld(), world)
})

test('an unmodified authored checkpoint retains its building footprint on round trip', async () => {
  const store = createGameStore()
  const world = store.getWorld()
  const footprint = structuredClone(world.buildingFootprints)
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  assert.ok(vault && footprint.has(vault.id))
  assert.ok(!world.buildings.some(building => building.id === vault.id))
  await store.saveCheckpoint()
  assert.equal(store.hasCheckpoint(), true)
  assert.equal(store.loadCheckpoint(), true)
  assert.notEqual(store.getWorld(), world)
  assert.deepEqual(store.getWorld().buildingFootprints, footprint)
})

test('invalid stored identity still recovers the independent profile without a partial load', async t => {
  const source = createGameStore().getWorld()
  const building = source.buildings[0]
  const world = structuredClone(source)
  world.buildings.push({ ...structuredClone(building), team: 'red' })
  const records = { latest: { version: CHECKPOINT_VERSION, world }, profile: { version: 1, completed: [1] } }
  const before = structuredClone(records)
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous)
    else delete globalThis.indexedDB
  })
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: {
      open() {
        const open = new EventTarget()
        open.result = new EventTarget()
        open.result.transaction = (name, mode) => {
          assert.equal(name, 'checkpoints')
          assert.notEqual(mode, 'readwrite')
          const transaction = new EventTarget()
          transaction.objectStore = () => ({
            get(key) { return { result: structuredClone(records[key]) } },
          })
          queueMicrotask(() => transaction.dispatchEvent(new Event('complete')))
          return transaction
        }
        queueMicrotask(() => open.dispatchEvent(new Event('success')))
        return open
      },
    },
  })
  const { createGameStore: makeFreshStore } = await import('../app/game-store.ts?bad-building-id')
  const store = makeFreshStore(), active = store.getWorld()
  assert.equal(await store.restoreCheckpoint(), false)
  assert.equal(store.getCheckpointReadStatus(), 'incompatible')
  assert.equal(store.loadCheckpoint(), false)
  assert.equal(store.getWorld(), active)
  assert.deepEqual(store.getCompletedMissions(), [1])
  assert.deepEqual(records, before)
})

test('classic model snapshots remain separate from the current scalable save policy', async () => {
  const store = createGameStore()
  assert.equal(migrateCheckpoint(createWorld(1, 'classic')).capacityPolicy.mode, 'classic')
  store.change(current => { current.capacityPolicy.mode = 'classic' })
  await assert.rejects(store.saveCheckpoint(), /incompatible with this development version/)
  assert.equal(store.hasCheckpoint(), false)
})
