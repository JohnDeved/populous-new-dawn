import assert from 'node:assert/strict'
import test from 'node:test'
import { readCampaignProfile, mergeCampaignProfile, applyCampaignEvent, campaignSelectable } from '../app/campaign-profile.ts'
import { withStorage } from './support/profile-storage.mjs'

const fresh = () => readCampaignProfile(undefined).progress
const legacy = completed => ({ version: 1, completed })
const complete = store => store.change(world => { world.status = 'won'; world.outcome.completedLevel = world.outcome.level - 1 })
const profile = (completed, available = []) => {
  const flags = Array(25).fill(0)
  for (const mission of completed) flags[mission - 1] |= 1
  for (const mission of available) flags[mission - 1] |= 4
  return {version: 1, completed, nativeCampaign: {version: 1, flags, history: 'native-model'}}
}

test('preservation migration is conservative, sparse replay survives and natural win15 differs', () => {
  assert.deepEqual(campaignSelectable(fresh()), [1])
  const fifteen = Array.from({length: 15}, (_, i) => i + 1)
  const migrated = readCampaignProfile(legacy(fifteen)).progress
  assert.equal(migrated.history, 'legacy-completed-only')
  assert.deepEqual(campaignSelectable(migrated), [...fifteen, 16])
  const natural = applyCampaignEvent(migrated, {kind: 'victory', mission: 15})
  assert.deepEqual(campaignSelectable(natural.progress), [...fifteen, 16, 17, 18, 19])
  assert.deepEqual(campaignSelectable(readCampaignProfile(legacy([8, 23])).progress), [1, 8, 23])
})

test('merge re-evaluates victory on joined flags, retains metadata and old-tab completions', () => {
  const local = readCampaignProfile(profile([16], [17])).progress
  const result = mergeCampaignProfile({...profile([17], [16]), retained: {x: 1}}, local, [{kind: 'victory', mission: 17}])
  assert.ok(result.progress.flags[19] & 4, 'concurrent pair unlock20')
  assert.equal(result.recommendation, 18)
  assert.deepEqual(result.profile.completed, [16, 17])
  assert.deepEqual(result.profile.retained, {x: 1})
  const mixed = {...result.profile, completed: [16, 17, 23]}
  const merged = mergeCampaignProfile(mixed, local, [{kind: 'return'}])
  assert.equal(merged.progress.history, 'legacy-completed-only')
  assert.ok(merged.progress.flags[22] & 1)
  assert.ok(merged.progress.flags[19] & 4)
})

for (const damaged of [null, {version: 9, completed: []}, legacy([1, 99]), legacy([, 1]),
  {...legacy([1]), nativeCampaign: null}, {...legacy([1]), nativeCampaign: {version: 1, history: 'native-model', flags: Array(25)}},
  {...legacy([1]), nativeCampaign: {version: 2, history: 'native-model', flags: Array(25).fill(0)}}]) {
  test(`malformed profile cannot be overwritten: ${JSON.stringify(damaged)}`, () => {
    assert.equal(readCampaignProfile(damaged).valid, false)
    assert.equal(mergeCampaignProfile(damaged, fresh(), [{kind: 'return'}]), null)
  })
}

test('store gates campaign launch, prevents debug/restart laundering, restores clean checkpoint eligibility', async () => {
  await withStorage({}, async ({freshStore, records, drain}) => {
    const store = await freshStore()
    const original = store.getWorld()
    assert.equal(store.startMission(2), false)
    for (const mission of [24, 25, 79]) {
      assert.equal(store.startMission(mission), false)
      assert.equal(store.startDebugMission(mission), false)
    }
    assert.equal(store.getWorld(), original)
    assert.equal(await store.saveCheckpoint(), true)
    assert.equal(store.startDebugMission(23), true)
    complete(store)
    store.enterCampaignSelector(store.getWorld())
    await drain()
    assert.deepEqual(store.getCompletedMissions(), [])
    await assert.rejects(store.saveCheckpoint())
    store.restart()
    assert.equal(store.isDebugLaunch(), true)
    complete(store)
    await assert.rejects(store.saveCheckpoint())
    assert.deepEqual(store.getCompletedMissions(), [])
    assert.equal(store.loadCheckpoint(), true)
    assert.equal(store.canSave(), true)
    complete(store)
    store.enterCampaignSelector(store.getWorld())
    await drain()
    assert.deepEqual(records.get('profile').completed, [1])
    assert.equal(store.startMission(2), true)
    store.startTutorial()
    complete(store)
    await drain()
    assert.deepEqual(store.getCompletedMissions(), [1])
  })
})

test('store restores without writing and stale tabs commit fork pairs atomically', async () => {
  await withStorage({profile: profile(Array.from({length:15}, (_,i) => i+1), [16,17,18,19])}, async ({freshStore, records, drain, writes}) => {
    const first = await freshStore(), second = await freshStore()
    await Promise.all([first.restoreCheckpoint(), second.restoreCheckpoint()])
    assert.deepEqual(writes, [])
    assert.equal(first.startMission(16), true)
    assert.equal(second.startMission(17), true)
    complete(first); complete(second)
    first.enterCampaignSelector(first.getWorld()); second.enterCampaignSelector(second.getWorld())
    await drain()
    assert.ok(records.get('profile').nativeCampaign.flags[19] & 4)
    assert.deepEqual(records.get('profile').completed.slice(-2), [16,17])
  })
})

for (const failure of ['failNextProfileRead', 'failNextProfileCommit']) test(`earned progress retries after ${failure} without selection clobber`, async () => {
  await withStorage({}, async fixture => {
    const store = await fixture.freshStore()
    fixture[failure]()
    complete(store)
    await fixture.drain()
    assert.deepEqual(store.getCompletedMissions(), [1])
    assert.equal(fixture.records.has('profile'), false)
    store.enterCampaignSelector(store.getWorld())
    store.selectCampaignMission(1)
    await fixture.drain()
    assert.deepEqual(fixture.records.get('profile').completed, [1])
    assert.equal(store.getCampaignSelection().selected, 1)
    assert.equal(store.getCampaignSelection().progressionMission, 2)
  })
})

test('completion must match the live supported mission; replay victory advances and win23 keeps24 unsupported', async () => {
  await withStorage({profile: profile([1, 23], [1, 23])}, async ({freshStore, drain}) => {
    const store = await freshStore(); await store.restoreCheckpoint()
    store.change(world => { world.outcome.completedLevel = 21 })
    assert.deepEqual(store.getCompletedMissions(), [1,23])
    store.startMission(23); complete(store); store.enterCampaignSelector(store.getWorld())
    await drain()
    assert.equal(store.getCampaignSelection().selected, 24)
    assert.equal(store.startMission(24), false)
  })
})

test('clean won checkpoint saved before result exit recovers only matching earned progression on exit', async () => {
  const completed=Array.from({length:14},(_,i)=>i+1)
  for (const kind of ['won','lost','mismatch','failed-profile']) {
    await withStorage({profile:profile(completed,[15])},async({freshStore,drain,records,writes,failNextProfileRead})=>{
      const first=await freshStore();await first.restoreCheckpoint();first.startMission(15)
      if(kind==='failed-profile')failNextProfileRead()
      if(kind==='won'||kind==='failed-profile')complete(first)
      else first.change(w=>{w.status=kind==='lost'?'lost':'won';w.outcome.completedLevel=kind==='lost'?null:12})
      await drain();await first.saveCheckpoint(false)
      const second=await freshStore(),before=structuredClone(records),count=writes.length
      await second.restoreCheckpoint();second.loadCheckpoint();await drain()
      assert.deepEqual(records,before,'restore/load never writes progress')
      assert.equal(writes.length,count)
      second.enterCampaignSelector(second.getWorld());await drain()
      const eligible=kind==='won'||kind==='failed-profile'
      assert.equal(second.getCampaignSelection().available.includes(17),eligible,kind)
      assert.equal(records.get('profile').completed.includes(15),eligible,kind)
    })
  }
})
