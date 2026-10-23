import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import * as model from '../app/model.ts'
import * as format from '../app/checkpoint-format.ts'
import * as codec from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { nativeCampaignProfile } from './support/campaign-fixture.mjs'
import { withStorage } from './support/profile-storage.mjs'

const source = readFileSync(new URL('../scripts/check-browser-mission22.mjs', import.meta.url), 'utf8')
const helpers = source.slice(source.indexOf('async function restartMission22(page)'), source.indexOf('const browser = await chromium.launch'))
assert.ok(helpers.startsWith('async function restartMission22(page)'))

// Execute maintained browser callbacks with supplied page/IDB IO and the actual
// current production model/store. No Chromium, rendered UI, real IDB, natural
// campaign progression, historical migration or performance is certified here.
function consumer(bindGame = async () => {}) {
  const supplied = helpers
    .replaceAll("await import('/app/model.ts')", 'imports.model')
    .replaceAll("await import('/app/checkpoint-format.ts')", 'imports.format')
    .replaceAll("await import('/scripts/tutorial-browser/checkpoint-codec.mjs')", 'imports.codec')
  return new Function('assert', 'bindGame', 'imports', `${supplied}\nreturn { restartMission22, mission22StoredRecords, mission22CurrentCheckpoint }`)(assert, bindGame, { model, format, codec })
}
const page = { evaluate: async (callback, argument) => callback(argument) }

async function withMission22(run) {
  return withStorage({ profile: nativeCampaignProfile({ available: [22] }) }, async storage => {
    // The shared synthetic IDB deliberately has no browser connection lifecycle.
    // Supply close only at this consumer boundary and check every opened handle.
    const open = indexedDB.open
    let opens = 0, closes = 0
    indexedDB.open = (...args) => {
      const request = open(...args)
      request.addEventListener('success', () => {
        opens++
        request.result.close = () => { closes++ }
      })
      return request
    }
    const store = await storage.freshStore()
    assert.equal(await store.restoreCheckpoint(), false)
    assert.equal(store.startMission(22), true)
    store.getWorld().speed = 0
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'testStore')
    Object.defineProperty(globalThis, 'testStore', { configurable: true, value: store })
    try {
      return await run({ ...storage, store, handles: () => ({ opens, closes }) })
    } finally {
      if (previous) Object.defineProperty(globalThis, 'testStore', previous)
      else delete globalThis.testStore
    }
  })
}

test('Mission 22 declares singleton availability then invokes native public launch', async () => {
  const entry = source.match(/await prepareCampaignFixture\(page, 22\)\s+await launchCampaignMission\(page, 22\)/)
  assert.ok(entry)
  const owner = {}, events = []
  await vm.runInNewContext(`(async () => { ${entry[0]} })()`, {
    page: owner,
    prepareCampaignFixture: async (page, mission) => { assert.equal(page, owner); events.push(['seed', mission]) },
    launchCampaignMission: async (page, mission) => { assert.equal(page, owner); events.push(['native', mission]) },
  })
  assert.deepEqual(events, [['seed', 22], ['native', 22]])
  assert.match(source, /Declared mission availability only, not naturally earned campaign history/)
  assert.doesNotMatch(source, /showAllMissions|\.startMission\(|delete shrine\.mode|shrine\.model = 45|legacyCheckpoint/)
  assert.equal((source.match(/await restartMission22\(page\)/g) ?? []).length, 3)
})

test('Mission 22 restarts through Menu, Restart Level, Yes and rebinds before observing', async () => {
  await withMission22(async ({ store }) => {
    const events = [], old = store.getWorld()
    const ui = {
      ...page,
      getByRole(role, options) {
        assert.equal(role, 'button')
        assert.equal(options.exact, true)
        return { async click() {
          events.push(options.name)
          if (options.name === 'Yes') store.restart()
        } }
      },
      async evaluate(callback) {
        assert.equal(events.at(-1), 'bind')
        events.push('observe')
        return callback()
      },
    }
    await consumer(async owner => {
      assert.equal(owner, ui)
      assert.notEqual(store.getWorld(), old)
      events.push('bind')
    }).restartMission22(ui)
    assert.deepEqual(events, ['Menu', 'Restart Level', 'Yes', 'bind', 'observe'])
    assert.equal(store.getWorld().speed, 0)
    assert.deepEqual(store.getCompletedMissions(), [])
  })
})

test('current Mission 22 roundtrip retains authored fields, IDs, gifts and both RNG streams', async () => {
  await withMission22(async ({ store, records }) => {
    const result = await consumer().mission22CurrentCheckpoint(page)
    assert.equal(result.saved, true)
    assert.deepEqual(result.after, result.before)
    assert.deepEqual(result.rewardAliases, { before: [null, null, null], after: ['mana', null, 'mana'] })
    assert.deepEqual(result.appearances, [[3, 8], [3, 8], [3, 8]])
    assert.deepEqual(result.state, [17, 1, 2, 19, 2])
    assert.deepEqual(result.random, [0x3456789a, 0x456789ab])
    assert.deepEqual(result.brave, { submitted: true, command: 0, work: 0, followers: 0, mode: 3, model: 8 })
    assert.deepEqual(store.getWorld().units.filter(unit => unit.team === 'blue').map(unit => unit.kind), ['shaman'], 'supporting Brave diagnostic never mutates the live campaign')
    assert.equal(records.get('latest').version, format.CHECKPOINT_VERSION)
    const authored = shrines => shrines.map(({ reward, ...fields }) => fields)
    assert.deepEqual(authored(records.get('latest').world.shrines), authored(store.getWorld().shrines))
    assert.deepEqual(store.getCompletedMissions(), [])
  })
})

test('malformed current Mission 22 record is refused without rewriting encoded bytes or profile', async () => {
  await withMission22(async ({ store, freshStore, records, writes, drain, handles }) => {
    const check = consumer()
    await check.mission22CurrentCheckpoint(page)
    const valid = await check.mission22StoredRecords(page)
    await check.mission22StoredRecords(page, true)
    const corrupt = await check.mission22StoredRecords(page)
    assert.equal(valid.hasAcquisition, true)
    assert.equal(corrupt.hasAcquisition, false)
    assert.equal(corrupt.version, format.CHECKPOINT_VERSION)
    assert.notDeepEqual(corrupt.latest, valid.latest)
    assert.deepEqual(corrupt.profile, valid.profile)
    assert.deepEqual(corrupt.preserved, valid.preserved)
    const rawBefore = JSON.stringify(codec.checkpointCodec([...records])), writesBefore = [...writes]
    const fresh = await freshStore(), worldBefore = fresh.getWorld()
    assert.equal(await fresh.restoreCheckpoint(), false)
    assert.equal(fresh.getCheckpointReadStatus(), 'incompatible')
    assert.equal(fresh.hasCheckpoint(), false)
    assert.equal(fresh.loadCheckpoint(), false)
    assert.equal(fresh.getWorld(), worldBefore)
    await drain()
    assert.deepEqual(await check.mission22StoredRecords(page), corrupt)
    assert.equal(JSON.stringify(codec.checkpointCodec([...records])), rawBefore)
    assert.deepEqual(writes, writesBefore, 'restore/Load refusal performs no persistent write')
    assert.deepEqual(fresh.getCompletedMissions(), [])
    assert.ok(fresh.getCampaignSelection().available.includes(22), 'independent declared availability remains readable')
    assert.deepEqual(handles(), { opens: 6, closes: 4 }, 'four consumer handles close; two production handles remain owned by their stores')
    // Only a later explicit valid Save replaces the deliberate corruption. This
    // prevents the remaining gift/vehicle pairs from using stale memory as proof.
    assert.equal(await store.saveCheckpoint(), true)
    const replacement = await freshStore()
    assert.equal(await replacement.restoreCheckpoint(), true)
    assert.equal(replacement.loadCheckpoint(), true)
    assert.equal(replacement.getWorld().outcome.level, 22)
    const expected = structuredClone(valid.preserved), shrines = codec.checkpointCodec(expected.shrines, true)
    for (const shrine of shrines) if (shrine.kind === 'mana') shrine.reward = 'mana'
    expected.shrines = codec.checkpointCodec(shrines)
    assert.deepEqual((await check.mission22StoredRecords(page)).preserved, expected)
  })
})

test('negative browser witness uses a fresh page and retained gift/transport pairs fail closed', () => {
  assert.match(source, /const rejectedPage = await context\.newPage\(\)/)
  assert.match(source, /rejectedPage\.goto\(page\.url\(\), \{ waitUntil: 'networkidle' \}\)/)
  assert.match(source, /This checkpoint is incompatible with the current development version\. The stored save has not been changed\./)
  assert.match(source, /name: 'Load Game', exact: true \}\)\.getAttribute\('aria-disabled'\), 'true'/)
  assert.match(source, /assert\.deepEqual\(await mission22StoredRecords\(rejectedPage\), corruptRecord\)/)
  assert.match(source, /finally \{ await rejectedPage\.close\(\) \}/)
  const pairs = source.match(/assert\.equal\(await page\.evaluate\(\(\) => globalThis\.testStore\.saveCheckpoint\(\)\), true\)\s+assert\.equal\(await page\.evaluate\(\(\) => globalThis\.testStore\.loadCheckpoint\(\)\), true\)\s+await bindGame\(page\)/g)
  assert.equal(pairs?.length, 4, 'delayed 600k gift, occupied Boat, occupied Balloon, completed 1M gift all retain checked save/load and rebind')
  assert.match(source, /Northern mana gift replayed after checkpoint restore/)
  assert.match(source, /Northern mana gift replayed during the return flight/)
  assert.match(source, /world = createWorld\(22\)/)
  assert.match(source, /Supporting fixture only: Mission 22 authors no Blue Brave/)
})
