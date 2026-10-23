import assert from 'node:assert/strict'
import test from 'node:test'
import { createCampaignFixtureStore, nativeCampaignProfile } from './support/campaign-fixture.mjs'

// These tests validate the declared synthetic prerequisite helper, not browser IDB.
test('campaign fixture admits only declared missions and keeps real save/provenance boundaries', async () => {
  const store = await createCampaignFixtureStore([16, 18])
  assert.equal(store.startMission(17), false)
  assert.equal(store.startMission(16), true)
  assert.equal(store.isDebugLaunch(), false)
  assert.equal(store.canSave(), true)
  assert.equal(await store.saveCheckpoint(), false, 'outside synthetic storage, the ordinary in-memory save remains usable')
  assert.equal(store.startDebugMission(22), true)
  await assert.rejects(store.saveCheckpoint())
  store.restart()
  await assert.rejects(store.saveCheckpoint())
  assert.equal(store.loadCheckpoint(), true)
  assert.equal(store.getWorld().outcome.level, 16)
  assert.equal(store.canSave(), true)
  assert.deepEqual(store.getCompletedMissions(), [])
})

test('campaign fixture databases and completion histories remain independent', async () => {
  const first = await createCampaignFixtureStore([3]), second = await createCampaignFixtureStore([5])
  assert.equal(first.startMission(3), true)
  assert.equal(second.startMission(3), false)
  first.change(world => { world.outcome.completedLevel = 2 })
  assert.deepEqual(first.getCompletedMissions(), [3])
  assert.deepEqual(second.getCompletedMissions(), [])
  assert.equal(second.startMission(5), true)
})

test('declared native fixture sorts completion and rejects unsupported prerequisites', () => {
  const profile = nativeCampaignProfile({ available: [16], completed: [3, 1, 3] })
  assert.deepEqual(profile.completed, [1, 3])
  assert.equal(profile.nativeCampaign.flags.length, 25)
  assert.equal(profile.nativeCampaign.flags[15], 4)
  assert.equal(profile.nativeCampaign.flags[2], 1)
  for (const mission of [0, 24, 25, 79, NaN])
    assert.throws(() => nativeCampaignProfile({ available: [mission] }))
})
