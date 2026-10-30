import assert from 'node:assert/strict'
import { withStorage } from './profile-storage.mjs'

// Declared launch prerequisites, not victories earned by these tests. This is a
// synthetic profile fixture; ordinary restore and campaign admission stay intact.
export function nativeCampaignProfile({ available, completed = [] }) {
  assert.ok(Array.isArray(available) && Array.isArray(completed))
  const flags = Array(25).fill(0)
  for (const [missions, bit] of [[available, 4], [completed, 1]])
    for (const mission of missions) {
      assert.ok(Number.isInteger(mission) && mission >= 1 && mission <= 23)
      flags[mission - 1] |= bit
    }
  return {
    version: 1,
    completed: [...new Set(completed)].sort((a, b) => a - b),
    nativeCampaign: { version: 1, flags, history: 'native-model' },
  }
}

// Each store gets its own synthetic database/module handle. The returned store
// is unmodified, starts in Mission 1, and can save in memory through its public API.
// Supply only the later missions this test needs. This proves continuation of
// those missions, never a naturally earned route through their prerequisites.
export async function createCampaignFixtureStore(available) {
  return withStorage({ profile: nativeCampaignProfile({ available }) }, async fixture => {
    const store = await fixture.freshStore(), initialWorld = store.getWorld()
    assert.equal(await store.restoreCheckpoint(), false)
    await fixture.drain()
    assert.equal(store.getWorld(), initialWorld)
    assert.deepEqual(store.getCompletedMissions(), [])
    assert.deepEqual(store.getCampaignSelection().available, [...new Set([1, ...available])].sort((a, b) => a - b))
    assert.deepEqual(fixture.writes, [], 'fixture admission is read-only')
    return store
  })
}
