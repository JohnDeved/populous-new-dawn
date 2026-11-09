import assert from 'node:assert/strict'
import test from 'node:test'

import { withStorage } from './support/profile-storage.mjs'

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
  ['sparse list', { version: 1, completed: Object.assign([], { 0: 1, 2: 2 }) }],
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
