import assert from 'node:assert/strict'

// Synthetic IndexedDB model: serial transactions, request success before commit,
// and rollback on read failure. This is not actual-browser persistence evidence.
let session = 0
export async function withStorage(initial, run, { failFirstRestore = false } = {}) {
  const records = new Map(Object.entries(structuredClone(initial))),
    writes = [],
    queue = [],
    previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  let active = false,
    failProfileRead = false,
    failProfileCommit = false
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
      if (
        operation.kind === 'get' &&
        operation.key === 'profile' &&
        mode === 'readwrite' &&
        failProfileRead
      ) {
        failProfileRead = false
        return finish(new Error('Synthetic atomic profile read failure'))
      }
      if (operation.kind === 'get')
        operation.request.result = structuredClone(working.get(operation.key))
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
      const transaction = new EventTarget(),
        operations = []
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
    value: {
      open() {
        const request = new EventTarget()
        request.result = database
        queueMicrotask(() => request.dispatchEvent(new Event('success')))
        return request
      },
    },
  })
  const drain = async () => {
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setImmediate(resolve))
      if (!active && !queue.length) return
    }
    assert.fail('synthetic transactions failed to settle')
  }
  const freshStore = async () => {
    const { createGameStore } = await import(`../../app/game-store.ts?profile-union=${++session}`)
    return createGameStore()
  }
  try {
    return await run({
      freshStore,
      records,
      writes,
      drain,
      failNextProfileRead: () => {
        failProfileRead = true
      },
      failNextProfileCommit: () => {
        failProfileCommit = true
      },
    })
  } finally {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous)
    else delete globalThis.indexedDB
  }
}
