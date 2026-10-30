import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')
const harness = read('scripts/local-render/harness.mjs')
const start = harness.indexOf('    const openMission = ')
const end = harness.indexOf('    return scenario({', start)
assert.ok(start >= 0 && end > start, 'Exercise the actual harness entry adapter')
const adapter = harness.slice(start, end)

function entryFixture() {
  const events = [], current = {}
  const page = {
    getByRole(role, { name }) {
      assert.ok(['dialog', 'button'].includes(role))
      return {
        async isVisible() { return name === 'Main menu' },
        async focus() { events.push('focus-diagnostic') },
      }
    },
    keyboard: { async press(key) { assert.equal(key, 'Enter'); events.push('trusted-enter') } },
    async waitForFunction(predicate) {
      assert.notEqual(predicate.constructor.name, 'AsyncFunction')
      events.push('readiness')
    },
    async evaluate(callback) { callback(); events.push('bind-alias') },
  }
  const context = {
    page,
    window: { testSceneRef: { current } },
    prepareCampaignFixture: async (owner, mission) => {
      assert.equal(owner, page); events.push(`seed-${mission}-and-reload`)
    },
    launchCampaignMission: async (owner, mission) => {
      assert.equal(owner, page); events.push(`native-${mission}`)
    },
    openCampaignFromMainMenu: async owner => {
      assert.equal(owner, page); events.push('main-to-selector')
    },
    showAllMissions: async owner => { assert.equal(owner, page); events.push('diagnostic-picker') },
    bindGame: async owner => { assert.equal(owner, page); events.push('bind-game') },
    skipIntroductionWithSpace: async (owner, options) => {
      assert.equal(owner, page); assert.equal(options.timeout, 45000); events.push('public-skip')
    },
  }
  return { run: vm.runInNewContext(adapter + '\nopenMission', context), events, context, current }
}

for (const [options, expected] of [
  [undefined, ['main-to-selector', 'diagnostic-picker', 'focus-diagnostic', 'trusted-enter']],
  [{ nativeCampaign: true }, ['native-1']],
  [{ campaignFixture: true }, ['seed-1-and-reload', 'native-1']],
]) test(`harness entry preserves explicit mode ${JSON.stringify(options)}`, async () => {
  const f = entryFixture()
  await f.run(1, options)
  assert.deepEqual(f.events, [...expected, 'bind-game', 'public-skip', 'readiness', 'bind-alias'])
  assert.equal(f.context.window.testScene, f.current)
})

test('conflicting harness modes fail before profile or browser actions', async () => {
  const f = entryFixture()
  await assert.rejects(f.run(3, { nativeCampaign: true, campaignFixture: true }), /one campaign entry mode/)
  assert.deepEqual(f.events, [])
})

test('early-mission entries seed only isolated later missions, before their native public launch', async () => {
  const source = read('scripts/local-render/early-missions.mjs')
  const begin = source.indexOf('        entry.setup = ')
  const finish = source.indexOf('        await bindGame(page)', begin)
  assert.ok(begin >= 0 && finish > begin)
  const flow = source.slice(begin, finish)
  for (const level of [1, 2, 3]) {
    const events = [], entry = {}, page = {}
    await vm.runInNewContext(`(async () => { ${flow} })()`, {
      entry, page, level,
      prepareCampaignFixture: async (owner, mission) => {
        assert.equal(owner, page); assert.equal(mission, level); events.push('fixture-then-restore')
      },
      launchCampaignMission: async (owner, mission) => {
        assert.equal(owner, page); assert.equal(mission, level); events.push('native-panel-and-start')
      },
    })
    assert.deepEqual(events, level === 1 ? ['native-panel-and-start'] : ['fixture-then-restore', 'native-panel-and-start'])
    assert.equal(entry.setup.kind, level === 1 ? 'fresh-native-campaign' : 'declared-availability-fixture')
  }
  assert.match(source, /level === 1\s*\? initialContext\s*: await browser\.newContext/)
  assert.doesNotMatch(source, /showAllMissions|launchDebugMission|\.startMission\(/)
  assert.match(source, /No earned-prerequisite claim/)
})

test('restart and Temple consumers explicitly opt in without reseeding continuation', () => {
  const restart = read('scripts/local-render/checkpoint-restart.mjs')
  const temple = read('scripts/local-render/mission3-temple-checkpoint.mjs')
  assert.match(restart, /if \(receipt\.profile\.mode === 'created'\) \{[\s\S]*?openMission\(1, \{ nativeCampaign: true \}\)/)
  assert.doesNotMatch(restart, /prepareCampaignFixture|campaignFixture: true/)
  assert.match(temple, /if \(continuing\) \{[\s\S]*?acquisitionSteps\.restore[\s\S]*?\} else \{\s*await openMission\(3, \{ campaignFixture: true \}\)/)
  assert.match(temple, /not earned campaign prerequisites/)
  for (const source of [adapter, restart, temple])
    assert.doesNotMatch(source, /\.startMission\(|\.startDebugMission\(/)
})

test('checkpoint gate uses native progression and keeps its debug interruption non-saving', () => {
  const source = read('scripts/check-browser-checkpoint.mjs')
  assert.match(source, /await openCampaignGame\(browser\)/)
  assert.match(source, /await openCampaignGame\(\{ newContext: async \(\) => context \}\)/)
  assert.match(source, /await continueThroughNativeSelector\(page, 2\)/)
  assert.match(source, /await launchCampaignMission\(page, 1\)/)
  assert.doesNotMatch(source, /await openGame\(|Continue to Mission|Select Mission|newPage:|\.startMission\(/)
  assert.match(source, /name: 'Panel Mission 1, completed'/)
  const begin = source.indexOf('  await showDebugMissions(page)')
  const end = source.indexOf('  await page.reload(', begin)
  assert.ok(begin > 0 && end > begin)
  const interruption = source.slice(begin, end)
  assert.match(interruption, /debug: true, savable: false, completed: \[1\]/)
  assert.doesNotMatch(interruption, /Save checkpoint|saveCheckpoint\(/)
  assert.match(source, /not naturally earned campaign completion/)
})

test('checkpoint gate enters the final Save panel and returns before testing root Load availability', async () => {
  const source = read('scripts/check-browser-checkpoint.mjs')
  const begin = source.indexOf("  await menu.getByRole('button', { name: 'Save Game'")
  const end = source.indexOf('  const saved = ', begin)
  assert.ok(begin > 0 && end > begin)
  let panel = 'root', committed = false
  const events = [], menu = { getByRole(role, { name, exact }) {
    assert.equal(role, 'button'); assert.equal(exact, true)
    return { async click() {
      events.push(name)
      if (name === 'Save Game') { assert.equal(panel, 'root'); panel = 'save' }
      else if (name === 'Save checkpoint') { assert.equal(panel, 'save'); committed = true }
      else { assert.equal(name, 'Back'); assert.equal(panel, 'save'); panel = 'root' }
    } }
  } }
  await vm.runInNewContext(`(async () => { ${source.slice(begin, end)} })()`, {
    assert, menu, load: { async isEnabled() { assert.equal(panel, 'root'); return committed } },
  })
  assert.deepEqual(events, ['Save Game', 'Save checkpoint', 'Back'])
})
