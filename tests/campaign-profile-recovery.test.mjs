import assert from 'node:assert/strict'
import test from 'node:test'
import { nativeCampaignProfile } from './support/campaign-fixture.mjs'

import { createWorld } from '../app/world-initialization.ts'
import { createLivePerson } from '../app/live-people.ts'
import { attachPersonRoute } from '../app/person-routes.ts'
import { restoreCapacityPolicy } from '../app/capacity-policy.ts'

// Synthetic IndexedDB boundary only: actual browser transaction behavior is a
// separate integration gate. Clone reads like IndexedDB and record every write.
let session = 0
async function withStorage(initial, run, { failRead = false } = {}) {
  const records = new Map(Object.entries(structuredClone(initial))),
    writes = [],
    previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB'),
    database = {
      transaction(name, mode = 'readonly') {
        assert.equal(name, 'checkpoints')
        const transaction = new EventTarget()
        transaction.objectStore = storeName => {
          assert.equal(storeName, 'checkpoints')
          return {
            get: key => {
              const request = new EventTarget()
              request.result = structuredClone(records.get(key))
              queueMicrotask(() => request.dispatchEvent(new Event('success')))
              return request
            },
            put: (value, key) => {
              assert.equal(mode, 'readwrite')
              writes.push(key)
              records.set(key, structuredClone(value))
            },
          }
        }
        setImmediate(() => {
          if (failRead && mode === 'readonly') {
            transaction.error = new Error('Synthetic storage read failure')
            transaction.dispatchEvent(new Event('abort'))
          } else transaction.dispatchEvent(new Event('complete'))
        })
        return transaction
      },
    }
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: {
      open(name, version) {
        assert.equal(name, 'populous-new-dawn')
        assert.equal(version, 1)
        const request = new EventTarget()
        request.result = database
        queueMicrotask(() => request.dispatchEvent(new Event('success')))
        return request
      },
    },
  })
  try {
    // Each module instance has a fresh database handle, like a fresh session.
    const { createGameStore } = await import(`../app/game-store.ts?profile-test=${++session}`)
    await run({ createGameStore, records, writes, failSubsequentReads: () => { failRead = true } })
  } finally {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous)
    else delete globalThis.indexedDB
  }
}

const profile = { version: 1, completed: [1, 2] }

for (const [name, latest] of [
  ['missing', undefined],
  ['malformed', { version: 1, world: {} }],
  ['partially migratable', { version: 1, world: { outcome: {} } }],
  ['incompatible', { version: 999, world: {} }],
]) {
  test(`${name} checkpoint does not suppress independent campaign progress`, async () => {
    await withStorage({ latest, profile }, async ({ createGameStore, records, writes }) => {
      const store = createGameStore(), world = store.getWorld(), before = structuredClone(records)
      let updates = 0
      store.subscribe(() => updates++)
      for (let attempt = 0; attempt < 2; attempt++) {
        assert.equal(await store.restoreCheckpoint(), false)
        assert.equal(store.hasCheckpoint(), false)
        assert.equal(store.loadCheckpoint(), false)
        assert.equal(store.getWorld(), world, 'restore keeps the active world')
        assert.deepEqual(store.getCompletedMissions(), [1, 2])
        assert.deepEqual(records, before, 'stored records remain recoverable and unchanged')
      }
      assert.equal(updates, 4, 'publish pending status and restored progress to subscribers')
      assert.deepEqual(writes, [])
    })
  })
}

for (const [version, mode, missingPolicy] of [[1, 'classic', false], [1, 'classic', true], [2, 'classic', false], [2, 'scalable', false], [3, 'classic', false], [3, 'scalable', false]])
  test(`v${version}/${mode}/missing=${missingPolicy} accepts only the current scalable contract`, async () => {
    const world = createWorld(1, mode), accepted = version === 3 && mode === 'scalable'
    world.turn = 217
    world.randomState = 0x12345678
    if (missingPolicy) delete world.capacityPolicy
    await withStorage({ latest: { version, world }, profile }, async ({ createGameStore, records, writes }) => {
      const store = createGameStore(), active = store.getWorld(), before = structuredClone(records)
      assert.equal(await store.restoreCheckpoint(), accepted)
      assert.equal(store.getCheckpointReadStatus(), accepted ? 'read' : 'incompatible')
      assert.equal(store.getWorld(), active)
      assert.deepEqual(store.getCompletedMissions(), [1, 2])
      assert.equal(store.loadCheckpoint(), accepted)
      if (accepted) assert.deepEqual(store.getWorld(), world)
      else assert.equal(store.getWorld(), active)
      store.restart()
      assert.equal(store.getWorld().capacityPolicy.mode, 'scalable')
      assert.deepEqual(records, before)
      assert.deepEqual(writes, [])
    })
  })

for (const invalid of ['detached resident route owner', 'missing policy', 'missing route sidecar', 'invalid route sidecar', 'missing current secondary state', 'hidden stale shrine ID', 'unknown mode', 'stale reservation', 'negative references', 'undercounted owners', 'overcounted owners'])
  test(`v3 ${invalid} rejects without suppressing campaign progress or rewriting storage`, async () => {
    const world = createWorld(1, 'scalable')
    if (invalid === 'detached resident route owner') {
      const unit = world.units.find(u => u.native), person = createLivePerson(world, unit)
      attachPersonRoute(world.motionRoutes, person, 1)
      unit.resident = { building: -1, slot: 0, person }
    }
    if (invalid === 'missing policy') delete world.capacityPolicy
    if (invalid === 'missing route sidecar') delete world.motionRoutes.references
    if (invalid === 'invalid route sidecar') world.motionRoutes.references[1] = 1
    if (invalid === 'missing current secondary state') delete world.secondaryEffects
    if (invalid === 'hidden stale shrine ID') world.shrines[0].linkedShrine = { ...world.shrines[1], id: world.nextId }
    if (invalid === 'unknown mode') world.capacityPolicy.mode = 'unknown'
    if (invalid === 'stale reservation') world.nextId = 20
    if (invalid === 'negative references') world.buildingOrders.records[1].references = -1
    if (invalid === 'undercounted owners')
      world.units.find(u => u.native?.commands[0] === 2).native.commands[1] = 1
    if (invalid === 'overcounted owners') world.buildingOrders.records[1].references = 2
    await withStorage({ latest: { version: 3, world }, profile }, async ({ createGameStore, records, writes }) => {
      const store = createGameStore(), active = store.getWorld(), before = structuredClone(records)
      assert.equal(await store.restoreCheckpoint(), false)
      assert.equal(store.getCheckpointReadStatus(), 'incompatible')
      assert.equal(store.loadCheckpoint(), false)
      assert.equal(store.getWorld(), active)
      assert.deepEqual(store.getCompletedMissions(), [1, 2])
      assert.deepEqual(records, before)
      assert.deepEqual(writes, [])
    })
  })

test('new checkpoints write v3 while database/profile stay v1; invalid saves do not replace a good record', async () => {
  await withStorage({ profile }, async ({ createGameStore, records, writes }) => {
    const store = createGameStore()
    assert.equal(await store.saveCheckpoint(), true)
    assert.equal(records.get('latest').version, 3)
    assert.equal(records.get('latest').world.capacityPolicy.mode, 'scalable')
    assert.equal(records.get('profile').version, 1)
    const before = structuredClone(records), writeCount = writes.length
    store.getWorld().buildingOrders.records[1].references = -1
    await assert.rejects(store.saveCheckpoint(), RangeError)
    assert.deepEqual(records, before)
    assert.equal(writes.length, writeCount)
    assert.equal(store.loadCheckpoint(), true, 'previous good in-session checkpoint is still usable')
  })
})

test('malformed stored checkpoint preserves usable session checkpoint and merges completion', async () => {
  await withStorage({ profile: nativeCampaignProfile({ available: [3] }) }, async ({ createGameStore, records, writes }) => {
    const store = createGameStore()
    await store.restoreCheckpoint()
    assert.equal(store.startMission(3), true)
    store.change(world => { world.outcome.completedLevel = 2; world.turn = 217 })
    assert.equal(await store.saveCheckpoint(), true)
    store.change(world => { world.turn = 218 })
    records.set('latest', { version: 1, world: {} })
    records.set('profile', structuredClone(profile))
    const before = structuredClone(records), active = store.getWorld(), writeCount = writes.length
    assert.equal(await store.restoreCheckpoint(), true)
    assert.equal(store.getWorld(), active)
    assert.equal(store.getWorld().turn, 218)
    assert.deepEqual(store.getCompletedMissions(), [1, 2, 3])
    assert.equal(store.loadCheckpoint(), true)
    assert.equal(store.getWorld().turn, 217)
    assert.deepEqual(records, before)
    assert.equal(writes.length, writeCount, 'restore and load do not write storage')
  })
})

test('storage read failure retains in-session progress and checkpoint', async () => {
  await withStorage({ profile: nativeCampaignProfile({ available: [2] }) }, async ({ createGameStore, records, writes, failSubsequentReads }) => {
    const store = createGameStore()
    await store.restoreCheckpoint()
    assert.equal(store.startMission(2), true)
    failSubsequentReads()
    store.change(world => { world.outcome.completedLevel = 1; world.turn = 217 })
    assert.equal(await store.saveCheckpoint(), true)
    const before = structuredClone(records), writeCount = writes.length
    assert.equal(await store.restoreCheckpoint(), true)
    assert.deepEqual(store.getCompletedMissions(), [2])
    assert.equal(store.loadCheckpoint(), true)
    assert.equal(store.getWorld().turn, 217)
    assert.deepEqual(records, before)
    assert.equal(writes.length, writeCount)
  })
})


test('Save rejects detached invalid resident ownership before mutation; a live same-object alias remains valid', async () => {
  await withStorage({ profile }, async ({ createGameStore, records, writes }) => {
    const store = createGameStore()
    assert.equal(await store.saveCheckpoint(), true)
    const world = store.getWorld(), unit = world.units.find(u => u.native), person = createLivePerson(world, unit)
    attachPersonRoute(world.motionRoutes, person, 1)
    unit.resident = { building: -1, slot: 0, person }
    const beforeWorld = structuredClone(world), beforeRecords = structuredClone(records), writeCount = writes.length
    await assert.rejects(store.saveCheckpoint(), /motion-route ownership/)
    assert.deepEqual(world, beforeWorld, 'reject before normalization, release or count reconstruction')
    assert.deepEqual(records, beforeRecords)
    assert.equal(writes.length, writeCount)
    assert.equal(store.loadCheckpoint(), true, 'prior committed checkpoint remains usable')

    const restored = store.getWorld(), liveUnit = restored.units.find(u => u.native), live = liveUnit.native
    attachPersonRoute(restored.motionRoutes, live, 1)
    liveUnit.resident = { building: -1, slot: 0, person: live }
    assert.doesNotThrow(() => restoreCapacityPolicy(restored), 'native/registry aliases still own the route')
    assert.equal(await store.saveCheckpoint(), true)
    assert.equal(store.loadCheckpoint(), true)
    const loaded = store.getWorld()
    assert.equal(loaded.units.find(u => u.id === liveUnit.id).resident, undefined)
    assert.equal(loaded.motionRoutes.references[1], 1)
    assert.doesNotThrow(() => restoreCapacityPolicy(loaded))
  })
})
