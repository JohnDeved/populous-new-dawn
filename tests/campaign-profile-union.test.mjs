import assert from 'node:assert/strict'
import test from 'node:test'

import { withStorage } from './support/profile-storage.mjs'
import { nativeCampaignProfile } from './support/campaign-fixture.mjs'

// Declare a stale tab's prerequisite profile before installing the record under
// test. Only real restore/startMission admit the world; completion must match it.
async function runningStore(fixture, mission, available = [mission], existing) {
  const hadProfile = fixture.records.has('profile'), original = fixture.records.get('profile')
  fixture.records.set('profile', nativeCampaignProfile({ available }))
  const store = existing ?? await fixture.freshStore()
  await store.restoreCheckpoint()
  assert.equal(store.startMission(mission), true)
  if (hadProfile) fixture.records.set('profile', original)
  else fixture.records.delete('profile')
  return store
}
const complete = (store, mission) => {
  assert.equal(store.getWorld().outcome.level, mission, 'matching live mission is required')
  store.change(world => { world.outcome.completedLevel = mission - 1 })
}
const native = (flags, history = 'native-model') => ({ version: 1, flags: [...flags, ...Array(25 - flags.length).fill(0)], history })

test('completion after failed startup read preserves earlier persisted progress', async () => {
  await withStorage({ profile: { version: 1, completed: [1, 2], retained: 'metadata' } }, async fixture => {
    const { freshStore, records, drain } = fixture, store = await freshStore()
    assert.equal(await store.restoreCheckpoint(), false)
    assert.equal(store.getCheckpointReadStatus(), 'failed')
    // Recover the read through an explicit prerequisite fixture before Mission 3.
    await runningStore(fixture, 3, [3], store)
    complete(store, 3)
    await drain()
    assert.deepEqual(records.get('profile'), { version: 1, completed: [1, 2, 3], retained: 'metadata', nativeCampaign: native([5, 1, 5], 'legacy-completed-only') })
    const fresh = await freshStore()
    await fresh.restoreCheckpoint()
    assert.deepEqual(fresh.getCompletedMissions(), [1, 2, 3])
  }, { failFirstRestore: true })
})

test('stale independent stores atomically union completions instead of last-writer loss', async () => {
  await withStorage({ profile: { version: 1, completed: [1] } }, async fixture => {
    const { records, drain } = fixture
    const first = await runningStore(fixture, 3, [3, 4]), second = await runningStore(fixture, 2, [2, 5])
    complete(first, 3)
    complete(second, 2)
    await drain()
    assert.deepEqual(records.get('profile').completed, [1, 2, 3])
    assert.equal(first.startMission(4), true)
    assert.equal(second.startMission(5), true)
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
  await withStorage({ profile }, async fixture => {
    const { records, writes, drain } = fixture
    const store = await runningStore(fixture, 3), before = structuredClone(profile)
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
  await withStorage({}, async fixture => {
    const { records, drain } = fixture, store = await runningStore(fixture, 3)
    complete(store, 3)
    assert.equal(store.startMission(1), true)
    complete(store, 1)
    assert.equal(store.startMission(3), true)
    complete(store, 3)
    await drain()
    assert.deepEqual(records.get('profile'), { version: 1, completed: [1, 3], nativeCampaign: native([5, 0, 5]) })
  })
})

test('failed atomic profile read cannot overwrite data and later completion retries the union', async () => {
  await withStorage({ profile: { version: 1, completed: [1, 2] } }, async fixture => {
    const { records, drain, failNextProfileRead } = fixture
    const store = await runningStore(fixture, 3, [3, 4])
    failNextProfileRead()
    complete(store, 3)
    await drain()
    assert.deepEqual(records.get('profile').completed, [1, 2])
    assert.deepEqual(store.getCompletedMissions(), [3])
    assert.equal(store.startMission(4), true)
    complete(store, 4)
    await drain()
    assert.deepEqual(records.get('profile').completed, [1, 2, 3, 4])
  })
})


test('transaction abort after profile put leaves stored progress unchanged', async () => {
  await withStorage({ profile: { version: 1, completed: [1, 2] } }, async fixture => {
    const { records, writes, drain, failNextProfileCommit } = fixture
    const store = await runningStore(fixture, 3, [3, 4])
    failNextProfileCommit()
    complete(store, 3)
    await drain()
    assert.ok(writes.includes('profile'), 'the transaction reached put before aborting')
    assert.deepEqual(records.get('profile').completed, [1, 2])
    assert.deepEqual(store.getCompletedMissions(), [3])
    assert.equal(store.startMission(4), true)
    complete(store, 4)
    await drain()
    assert.deepEqual(records.get('profile').completed, [1, 2, 3, 4])
  })
})


test('fresh Mission 1 completion after the first startup read fails still merges prior persisted progress', async () => {
  await withStorage({ profile: { version: 1, completed: [2, 3], retained: 'startup metadata' } }, async ({ freshStore, records, drain }) => {
    const store = await freshStore()
    assert.equal(await store.restoreCheckpoint(), false)
    assert.equal(store.getCheckpointReadStatus(), 'failed')
    assert.equal(store.getWorld().outcome.level, 1)
    complete(store, 1)
    await drain()
    assert.deepEqual(records.get('profile'), {
      version: 1, completed: [1, 2, 3], retained: 'startup metadata',
      nativeCampaign: native([5, 1, 1], 'legacy-completed-only'),
    })
  }, { failFirstRestore: true })
})
