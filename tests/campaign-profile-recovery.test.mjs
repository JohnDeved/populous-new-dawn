import assert from 'node:assert/strict'
import test from 'node:test'

import { createWorld } from '../app/world-initialization.ts'

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
            get: key => ({ result: structuredClone(records.get(key)) }),
            put: (value, key) => {
              assert.equal(mode, 'readwrite')
              writes.push(key)
              records.set(key, structuredClone(value))
            },
          }
        }
        queueMicrotask(() => {
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
    await run({ createGameStore, records, writes })
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
      assert.equal(updates, 2, 'publish restored progress to subscribers')
      assert.deepEqual(writes, [])
    })
  })
}

for (const legacy of [false, true]) {
  test(`${legacy ? 'legacy' : 'current'} valid checkpoint still restores and loads`, async () => {
    const world = createWorld()
    world.turn = 217
    world.randomState = 0x12345678
    if (legacy) delete world.drawMode
    await withStorage({ latest: { version: 1, world }, profile }, async ({ createGameStore, records, writes }) => {
      const store = createGameStore(), active = store.getWorld(), before = structuredClone(records)
      assert.equal(await store.restoreCheckpoint(), true)
      assert.equal(store.getWorld(), active)
      assert.deepEqual(store.getCompletedMissions(), [1, 2])
      assert.equal(store.loadCheckpoint(), true)
      assert.equal(store.getWorld().turn, 217)
      assert.equal(store.getWorld().randomState, 0x12345678)
      assert.equal(store.getWorld().drawMode, world.drawMode ?? 0)
      assert.deepEqual(records, before)
      assert.deepEqual(writes, [])
    })
  })
}

test('malformed stored checkpoint preserves usable session checkpoint and merges completion', async () => {
  await withStorage({}, async ({ createGameStore, records, writes }) => {
    const store = createGameStore()
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
  await withStorage({}, async ({ createGameStore, records, writes }) => {
    const store = createGameStore()
    store.change(world => { world.outcome.completedLevel = 1; world.turn = 217 })
    assert.equal(await store.saveCheckpoint(), true)
    const before = structuredClone(records), writeCount = writes.length
    assert.equal(await store.restoreCheckpoint(), true)
    assert.deepEqual(store.getCompletedMissions(), [2])
    assert.equal(store.loadCheckpoint(), true)
    assert.equal(store.getWorld().turn, 217)
    assert.deepEqual(records, before)
    assert.equal(writes.length, writeCount)
  }, { failRead: true })
})
