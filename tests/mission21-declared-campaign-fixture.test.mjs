import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { mission21BranchProfile, validateMission21BranchProfile, prepareMission21BranchFixture } from '../scripts/mission21-declared-campaign-fixture.mjs'
import { readCampaignProfile, applyCampaignEvent, campaignSelectable } from '../app/campaign-profile.ts'

const source = readFileSync(new URL('../scripts/check-browser-mission21.mjs', import.meta.url), 'utf8')

for (const [completed, recommendation] of [
  [[16, 17, 18, 19], 21], [[16, 17, 19], 18], [[16, 17, 18], 19], [[16, 17], 18],
]) test(`declared ${completed} follows the native fork instead of assuming linear M20→21`, () => {
  const fixture = mission21BranchProfile(completed)
  assert.equal(validateMission21BranchProfile(fixture), fixture)
  const restored = readCampaignProfile(fixture)
  assert.equal(restored.valid, true)
  assert.equal(restored.progress.history, 'legacy-completed-only')
  const suppliedCompletion = applyCampaignEvent(restored.progress, { kind: 'completion', mission: 20 })
  const result = applyCampaignEvent(suppliedCompletion.progress, { kind: 'victory', mission: 20 })
  assert.equal(result.recommendation, recommendation)
  assert.equal(campaignSelectable(result.progress).includes(21), recommendation === 21)
  assert.deepEqual(fixture.completed, completed, 'native transition cannot mutate the declared input')
})

test('declared branch fixture rejects versions, sparse/non-byte flags, unsupported or inconsistent completions', () => {
  const mutations = [
    p => { p.version = 2 }, p => { p.nativeCampaign.version = 2 },
    p => { p.nativeCampaign.history = 'native-model' },
    p => { p.nativeCampaign.flags.pop() }, p => { delete p.nativeCampaign.flags[0] },
    p => { p.nativeCampaign.flags[0] = 256 }, p => { p.nativeCampaign.flags[0] = -1 },
    p => { p.nativeCampaign.flags[0] = 0.5 }, p => { p.nativeCampaign.flags[19] = 0 },
    p => { p.completed.push(24) }, p => { p.completed.push(16) },
    p => { p.completed.reverse() }, p => { p.completed.pop() },
    p => { p.nativeCampaign.flags[20] = 4 },
  ]
  for (const mutate of mutations) {
    const fixture = mission21BranchProfile(); mutate(fixture)
    assert.throws(() => validateMission21BranchProfile(fixture))
  }
  assert.throws(() => mission21BranchProfile([16, 16]), /Duplicate/)
  assert.throws(() => mission21BranchProfile([15]), /16–19/)
})

// Supplied transactional IO executes the actual page.evaluate callback. This
// tests refusal/commit ordering, not actual browser IndexedDB persistence.
function fixturePage(initial = {}, failCommit = false) {
  const records = new Map(Object.entries(structuredClone(initial))), events = []
  const database = {
    close() { events.push('close') },
    transaction(name, mode) {
      assert.equal(name, 'checkpoints'); assert.equal(mode, 'readwrite')
      const working = new Map(records)
      let aborted = false
      const transaction = {
        abort() { aborted = true; events.push('abort'); queueMicrotask(() => transaction.onabort()) },
        objectStore(name) {
          assert.equal(name, 'checkpoints')
          return {
            count() {
              const request = {}
              queueMicrotask(() => {
                events.push('count'); request.result = records.size; request.onsuccess()
                queueMicrotask(() => {
                  if (aborted) return
                  if (failCommit) return transaction.abort()
                  records.clear(); for (const entry of working) records.set(...entry)
                  events.push('commit'); transaction.oncomplete()
                })
              })
              return request
            },
            put(value, key) { events.push('put-' + key); working.set(key, structuredClone(value)) },
          }
        },
      }
      return transaction
    },
  }
  const indexedDB = { open(name, version) {
    assert.equal(name, 'populous-new-dawn'); assert.equal(version, 1)
    const request = { result: database }
    queueMicrotask(() => request.onsuccess())
    return request
  } }
  const locator = name => ({
    or() { return this }, filter() { return this }, first() { return this },
    async waitFor() {}, async isVisible() { return name === 'Main menu' },
  })
  const page = {
    getByRole: (_role, { name }) => locator(name),
    async evaluate(callback, fixture) {
      events.push('evaluate')
      return vm.runInNewContext(`(${callback.toString()})(fixture)`, { indexedDB, fixture })
    },
    async reload(options) { assert.deepEqual(options, { waitUntil: 'networkidle' }); events.push('reload') },
  }
  return { page, records, events }
}

test('empty branch profile commits atomically before reload and preserves declared history', async () => {
  const f = fixturePage(), profile = mission21BranchProfile()
  await prepareMission21BranchFixture(f.page, profile)
  assert.deepEqual([...f.records], [['profile', profile]])
  assert.deepEqual(f.events, ['evaluate', 'count', 'put-profile', 'commit', 'close', 'reload'])
})

for (const existing of [{ profile: mission21BranchProfile() }, { profile: '{corrupt' }, { latest: { version: 3, world: { marker: 'owned' } } }])
  test(`nonempty profile/checkpoint is refused without overwriting ${Object.keys(existing)}`, async () => {
    const f = fixturePage(existing), before = structuredClone([...f.records])
    await assert.rejects(prepareMission21BranchFixture(f.page, mission21BranchProfile()), /empty checkpoint database/)
    assert.deepEqual([...f.records], before)
    assert.deepEqual(f.events, ['evaluate', 'count', 'abort', 'close'])
  })

test('aborted fixture commit does not reload or publish a partial profile', async () => {
  const f = fixturePage({}, true)
  await assert.rejects(prepareMission21BranchFixture(f.page, mission21BranchProfile()), /empty checkpoint database/)
  assert.deepEqual([...f.records], [])
  assert.deepEqual(f.events, ['evaluate', 'count', 'put-profile', 'abort', 'close'])
})

test('invalid branch fixture fails before any browser IO', async () => {
  const f = fixturePage(), profile = mission21BranchProfile(); profile.version = 2
  await assert.rejects(prepareMission21BranchFixture(f.page, profile), /Unsupported/)
  assert.deepEqual(f.events, [])
})

test('browser consumer keeps checkpoint episode separate and discloses supplied outcome', () => {
  assert.doesNotMatch(source, /showAllMissions|\.startMission\(/)
  assert.match(source, /await prepareCampaignFixture\(page, 21\)\s+await launchCampaignMission\(page, 21\)/)
  assert.match(source, /const branchContext = await browser.newContext/)
  assert.match(source, /prepareMission21BranchFixture\(branchPage, mission21BranchProfile\(completed\)\)/)
  assert.match(source, /world\.outcome\.completedLevel = 19/)
  assert.match(source, /await launchCampaignMission\(branchPage, 20\)/)
  assert.match(source, /await enterResultSelector\(branchPage\)/)
  assert.match(source, /await continueThroughNativeSelector\(branchPage, 21\)/)
  assert.match(source, /Missing M18\/M19 prerequisites must not force M21 availability/)
  assert.match(source, /supplied M20 terminal state, not naturally earned campaign completion/)
  assert.match(source, /finally \{ await branchContext.close\(\) \}/)
  assert.equal((source.match(/testStore\.saveCheckpoint\(\)/g) ?? []).length, 5)
  assert.equal((source.match(/testStore\.loadCheckpoint\(\)/g) ?? []).length, 5)
})
