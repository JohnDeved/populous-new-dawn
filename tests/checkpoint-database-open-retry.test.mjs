import assert from 'node:assert/strict'
import test from 'node:test'

// Synthetic IndexedDB boundary: this checks store ownership and retry policy,
// not browser persistence or a particular browser's storage error behavior.
let session = 0
async function withDatabase(run, { synchronousFailures = 0 } = {}) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB'),
    records = new Map(), requests = []
  let attempts = 0
  const database = {
    transaction(name, mode = 'readonly') {
      assert.equal(name, 'checkpoints')
      const transaction = new EventTarget()
      transaction.objectStore = () => ({
        get: key => {
          const request = new EventTarget()
          request.result = structuredClone(records.get(key))
          queueMicrotask(() => request.dispatchEvent(new Event('success')))
          return request
        },
        put: (value, key) => {
          assert.equal(mode, 'readwrite')
          records.set(key, structuredClone(value))
        },
      })
      setImmediate(() => transaction.dispatchEvent(new Event('complete')))
      return transaction
    },
  }
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: {
      open(name, version) {
        assert.equal(name, 'populous-new-dawn')
        assert.equal(version, 1)
        attempts++
        if (attempts <= synchronousFailures) throw new Error('Synthetic synchronous open failure')
        const request = new EventTarget()
        requests.push(request)
        return request
      },
    },
  })
  const finish = error => {
    const request = requests.shift()
    assert.ok(request, 'an actual pending open attempt must exist')
    if (error) {
      request.error = error
      request.dispatchEvent(new Event('error'))
    } else {
      request.result = database
      request.dispatchEvent(new Event('success'))
    }
  }
  try {
    const { createGameStore } = await import(`../app/game-store.ts?open-retry=${++session}`)
    await run({ createGameStore, records, requests, finish, attempts: () => attempts })
  } finally {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous)
    else delete globalThis.indexedDB
  }
}

test('a failed database open can retry restore, then persist the next Save', async () => {
  await withDatabase(async ({ createGameStore, records, finish, attempts }) => {
    records.set('profile', { version: 1, completed: [1, 2] })
    const store = createGameStore(), active = store.getWorld(), first = store.restoreCheckpoint()
    finish(new Error('Synthetic transient open failure'))
    assert.equal(await first, false)
    assert.equal(store.getWorld(), active)
    const retry = store.restoreCheckpoint()
    assert.equal(attempts(), 2)
    finish()
    assert.equal(await retry, false)
    assert.deepEqual(store.getCompletedMissions(), [1, 2])
    store.change(world => { world.turn = 217 })
    assert.equal(await store.saveCheckpoint(), true)
    assert.equal(records.get('latest').world.turn, 217)
    assert.equal(attempts(), 2, 'successful handle stays cached')
  })
})

test('concurrent callers share one failed open and one successful retry', async () => {
  await withDatabase(async ({ createGameStore, finish, attempts, records }) => {
    const store = createGameStore(), first = [store.restoreCheckpoint(), store.restoreCheckpoint()]
    assert.equal(attempts(), 1)
    finish(new Error('Shared open failure'))
    assert.deepEqual(await Promise.all(first), [false, false])
    store.change(world => { world.turn = 91 })
    const retry = [store.restoreCheckpoint(), store.saveCheckpoint()]
    assert.equal(attempts(), 2)
    finish()
    assert.deepEqual(await Promise.all(retry), [true, true])
    assert.equal(records.get('latest').world.turn, 91)
    assert.equal(await store.saveCheckpoint(), true)
    assert.equal(attempts(), 2)
  })
})

test('repeated and synchronous open failures preserve memory checkpoint and completion', async () => {
  await withDatabase(async ({ createGameStore, finish, attempts, records }) => {
    const store = createGameStore()
    assert.equal(await store.restoreCheckpoint(), false)
    store.change(world => { world.outcome.completedLevel = 2; world.turn = 217 })
    const failedSave = store.saveCheckpoint()
    assert.equal(attempts(), 2)
    finish(new Error('Second open failure'))
    assert.equal(await failedSave, false)
    assert.equal(store.hasCheckpoint(), true)
    assert.deepEqual(store.getCompletedMissions(), [3])
    store.change(world => { world.turn = 218 })
    assert.equal(store.loadCheckpoint(), true)
    assert.equal(store.getWorld().turn, 217)
    assert.equal(records.has('latest'), false)
    const retry = store.saveCheckpoint()
    assert.equal(attempts(), 3)
    finish()
    assert.equal(await retry, true)
    assert.equal(records.get('latest').world.turn, 217)
    assert.deepEqual(store.getCompletedMissions(), [3])
  }, { synchronousFailures: 1 })
})
