import assert from 'node:assert/strict'
import test from 'node:test'

// Synthetic IndexedDB model: serial transactions, request success before commit,
// and rollback on read failure. This is not actual-browser persistence evidence.
let session = 0
async function withStorage(initial, run, { failFirstRestore = false } = {}) {
  const records = new Map(Object.entries(structuredClone(initial))),
    writes = [], queue = [], previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  let active = false, failProfileRead = false, failProfileCommit = false
  function next() {
    if (active || !queue.length) return
    active = true
    const { transaction, mode, operations } = queue.shift(),
      working = new Map(structuredClone([...records]))
    function finish(error) {
      if (error) {
        transaction.error = error
        transaction.dispatchEvent(new Event('abort'))
      } else {
        if (mode === 'readwrite') {
          records.clear()
          for (const entry of working) records.set(...entry)
        }
        transaction.dispatchEvent(new Event('complete'))
      }
      active = false
      queueMicrotask(next)
    }
    if (mode === 'readonly' && failFirstRestore) {
      failFirstRestore = false
      finish(new Error('Synthetic startup read failure'))
      return
    }
    let wroteProfile = false
    function step() {
      const operation = operations.shift()
      if (!operation) {
        if (wroteProfile && failProfileCommit) {
          failProfileCommit = false
          return finish(new Error('Synthetic profile commit abort'))
        }
        return finish()
      }
      if (operation.kind === 'get' && operation.key === 'profile' && mode === 'readwrite' && failProfileRead) {
        failProfileRead = false
        return finish(new Error('Synthetic atomic profile read failure'))
      }
      if (operation.kind === 'get') operation.request.result = structuredClone(working.get(operation.key))
      else {
        working.set(operation.key, structuredClone(operation.value))
        writes.push(operation.key)
        if (operation.key === 'profile') wroteProfile = true
      }
      operation.request.dispatchEvent(new Event('success'))
      queueMicrotask(step)
    }
    queueMicrotask(step)
  }
  const database = {
    transaction(name, mode = 'readonly') {
      assert.equal(name, 'checkpoints')
      const transaction = new EventTarget(), operations = []
      transaction.objectStore = () => ({
        get: key => {
          const request = new EventTarget()
          operations.push({ kind: 'get', key, request })
          return request
        },
        put: (value, key) => {
          assert.equal(mode, 'readwrite')
          const request = new EventTarget()
          operations.push({ kind: 'put', key, value, request })
          return request
        },
      })
      queue.push({ transaction, mode, operations })
      queueMicrotask(next)
      return transaction
    },
  }
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: { open() {
      const request = new EventTarget()
      request.result = database
      queueMicrotask(() => request.dispatchEvent(new Event('success')))
      return request
    } },
  })
  const drain = async () => {
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setImmediate(resolve))
      if (!active && !queue.length) return
    }
    assert.fail('synthetic transactions failed to settle')
  }
  const freshStore = async () => {
    const { createGameStore } = await import(`../app/game-store.ts?profile-union=${++session}`)
    return createGameStore()
  }
  try { await run({ freshStore, records, writes, drain, failNextProfileRead: () => { failProfileRead = true }, failNextProfileCommit: () => { failProfileCommit = true } }) }
  finally {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous)
    else delete globalThis.indexedDB
  }
}

const complete = (store, mission) => store.change(world => { world.outcome.completedLevel = mission - 1 })

test('completion after failed startup read preserves earlier persisted progress', async () => {
  await withStorage({ profile: { version: 1, completed: [1, 2], retained: 'metadata' } }, async ({ freshStore, records, drain }) => {
    const store = await freshStore()
    assert.equal(await store.restoreCheckpoint(), false)
    complete(store, 3)
    await drain()
    assert.deepEqual(records.get('profile'), { version: 1, completed: [1, 2, 3], retained: 'metadata' })
    const fresh = await freshStore()
    await fresh.restoreCheckpoint()
    assert.deepEqual(fresh.getCompletedMissions(), [1, 2, 3])
  }, { failFirstRestore: true })
})

test('stale independent stores atomically union completions instead of last-writer loss', async () => {
  await withStorage({ profile: { version: 1, completed: [1] } }, async ({ freshStore, records, drain }) => {
    const first = await freshStore(), second = await freshStore()
    await Promise.all([first.restoreCheckpoint(), second.restoreCheckpoint()])
    complete(first, 3)
    complete(second, 2)
    await drain()
    assert.deepEqual(records.get('profile').completed, [1, 2, 3])
    complete(first, 4)
    complete(second, 5)
    await drain()
    assert.deepEqual(records.get('profile').completed, [1, 2, 3, 4, 5])
  })
})

for (const [label, profile] of [
  ['incompatible', { version: 999, completed: [1, 2], retained: true }],
  ['missing version', { completed: [1, 2] }],
  ['malformed list', { version: 1, completed: '1,2' }],
  ['invalid mission', { version: 1, completed: [1, 999] }],
  ['null record', null],
  ['sparse list', { version: 1, completed: [1, , 2] }],
]) test(`${label} profile remains recoverable while session and checkpoint still work`, async () => {
  await withStorage({ profile }, async ({ freshStore, records, writes, drain }) => {
    const store = await freshStore(), before = structuredClone(profile)
    await store.restoreCheckpoint()
    complete(store, 3)
    await drain()
    assert.deepEqual(records.get('profile'), before)
    assert.equal(writes.includes('profile'), false)
    assert.ok(store.getCompletedMissions().includes(3))
    store.change(world => { world.turn = 217 })
    assert.equal(await store.saveCheckpoint(), true)
    assert.equal(records.get('latest').world.turn, 217)
    assert.deepEqual(records.get('profile'), before)
  })
})

test('new profile is created and duplicate completions remain unique and sorted', async () => {
  await withStorage({}, async ({ freshStore, records, drain }) => {
    const store = await freshStore()
    complete(store, 3)
    complete(store, 1)
    complete(store, 3)
    await drain()
    assert.deepEqual(records.get('profile'), { version: 1, completed: [1, 3] })
  })
})

test('failed atomic profile read cannot overwrite data and later completion retries the union', async () => {
  await withStorage({ profile: { version: 1, completed: [1, 2] } }, async ({ freshStore, records, drain, failNextProfileRead }) => {
    const store = await freshStore()
    failNextProfileRead()
    complete(store, 3)
    await drain()
    assert.deepEqual(records.get('profile').completed, [1, 2])
    assert.deepEqual(store.getCompletedMissions(), [3])
    complete(store, 4)
    await drain()
    assert.deepEqual(records.get('profile').completed, [1, 2, 3, 4])
  })
})


test('transaction abort after profile put leaves stored progress unchanged', async () => {
  await withStorage({ profile: { version: 1, completed: [1, 2] } }, async ({ freshStore, records, writes, drain, failNextProfileCommit }) => {
    const store = await freshStore()
    failNextProfileCommit()
    complete(store, 3)
    await drain()
    assert.ok(writes.includes('profile'), 'the transaction reached put before aborting')
    assert.deepEqual(records.get('profile').completed, [1, 2])
    assert.deepEqual(store.getCompletedMissions(), [3])
    complete(store, 4)
    await drain()
    assert.deepEqual(records.get('profile').completed, [1, 2, 3, 4])
  })
})
