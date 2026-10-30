import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

// These execute the actual consumer entry expressions with supplied IO. The
// shared adapter suite separately proves mode routing; neither is browser QA.
for (const [file, helper, mission] of [
  ['check-browser-hut-occupancy-smoke.mjs', 'openCampaignGame', 1],
  ['check-browser-hut-smoke-events.mjs', 'openCampaignGame', 1],
  ['check-browser-swarm-spell.mjs', 'openCampaignGame', undefined],
  ['check-browser-bloodlust-appearance.mjs', 'openCampaignFixtureGame', 16],
  ['check-browser-shaman-death-cadence.mjs', 'openCampaignFixtureGame', 2],
  ['check-browser-shaman-death-vfx.mjs', 'openCampaignFixtureGame', 2],
]) test(`${file} explicitly enters a savable native session`, async () => {
  const source = read('scripts/' + file)
  assert.match(source, new RegExp(`import \\{[^}]*\\b${helper}\\b[^}]*\\} from './browser-game.mjs'`))
  assert.doesNotMatch(source, /\bopenGame\(|showAllMissions\(|\.startMission\(/)
  const calls = [...source.matchAll(new RegExp(`await ${helper}\\(browser(?:, (\\d+))?\\)`, 'g'))]
  assert.equal(calls.length, 1)
  const browser = {}, events = [], opened = {}
  const result = await vm.runInNewContext(`(async () => ${calls[0][0]})()`, {
    browser,
    [helper]: async (owner, level) => {
      assert.equal(owner, browser); events.push(level); return opened
    },
  })
  assert.equal(result, opened)
  assert.deepEqual(events, [mission])
  if (helper === 'openCampaignFixtureGame')
    assert.match(source, /Declared mission availability only, not naturally earned campaign history/)
  else assert.doesNotMatch(source, /prepareCampaignFixture|campaignFixture: true|openCampaignFixtureGame/)
})

for (const file of ['minimap-frame.mjs', 'mission1-hut-dismantle.mjs'])
  test(`${file} keeps M1 non-seeding while retaining checkpoint observations`, async () => {
    const source = read('scripts/local-render/' + file)
    const entry = source.match(/await openMission\(1, \{ nativeCampaign: true \}\)/)
    assert.ok(entry)
    const events = []
    await vm.runInNewContext(`(async () => { ${entry[0]} })()`, {
      openMission: async (mission, options) => events.push([mission, options.nativeCampaign]),
    })
    assert.deepEqual(events, [[1, true]])
    assert.doesNotMatch(source, /prepareCampaignFixture|campaignFixture: true|\.startMission\(/)
    assert.match(source, /Save checkpoint/)
    assert.match(source, /Load checkpoint|Load Game/)
  })

for (const [file, mission] of [
  ['mission14-rewards', 14], ['mission15-prison', 15],
  ['mission16-bloodlust', 16], ['mission17-armageddon', 17],
]) test(`${file} seeds fresh declared availability before native public launch`, async () => {
  const source = read(`scripts/check-browser-${file}.mjs`)
  const expression = source.match(/await prepareCampaignFixture\(page, \d+\)\s+await launchCampaignMission\(page, \d+\)/)
  assert.ok(expression)
  const page = {}, events = []
  await vm.runInNewContext(`(async () => { ${expression[0]} })()`, {
    page,
    prepareCampaignFixture: async (owner, level) => { assert.equal(owner, page); events.push(['seed', level]) },
    launchCampaignMission: async (owner, level) => { assert.equal(owner, page); events.push(['native', level]) },
  })
  assert.deepEqual(events, [['seed', mission], ['native', mission]])
  assert.match(source, /Declared mission availability only, not naturally earned campaign history/)
  assert.doesNotMatch(source, /showAllMissions|\.startMission\(/)
  assert.match(source, /saveCheckpoint\(/)
  assert.match(source, /loadCheckpoint\(/)
})

test('single-mission Angel and Preacher consumers declare native availability without reseeding reloads', () => {
  const angel = read('scripts/check-browser-mission5-angel.mjs')
  assert.match(angel, /await openCampaignFixtureGame\(browser, 5\)/)
  assert.match(angel, /not naturally earned campaign history/)
  const preacher = read('scripts/check-browser-mission3-natural-preacher.mjs')
  assert.match(preacher, /await openMission\(3, \{ campaignFixture: true \}\)/)
  assert.match(preacher, /not naturally earned campaign history/)
  assert.match(preacher, /checkpoint storage writes come only from the shipped save control/)
  const reload = preacher.indexOf('  await page.reload(')
  assert.ok(reload > 0)
  assert.doesNotMatch(preacher.slice(reload), /openMission\(|prepareCampaignFixture\(/)
  assert.match(preacher, /victim\?\.native\?\.state === 23 && victim\.native\.workTarget === ids\.preacher/)
  assert.match(preacher, /converted\.firstEvent\.elapsedMs > 5000/)
  for (const source of [angel, preacher]) assert.doesNotMatch(source, /\bopenGame\(|\.startMission\(/)
})

test('Preacher checkpoint resumes only after returning from the final Save panel', async () => {
  const source = read('scripts/check-browser-mission3-natural-preacher.mjs')
  const begin = source.indexOf("  await page.getByRole('button', { name: 'Back', exact: true }).click()")
  const end = source.indexOf('  await page.waitForFunction', begin)
  assert.ok(begin > 0 && end > begin)
  let panel = 'save'
  const calls = []
  await vm.runInNewContext(`(async () => { ${source.slice(begin, end)} })()`, {
    page: { getByRole(role, { name }) {
      assert.equal(role, 'button')
      return { async click() {
        calls.push(name)
        if (name === 'Back') { assert.equal(panel, 'save'); panel = 'root' }
        else { assert.equal(name, 'Continue Game'); assert.equal(panel, 'root'); panel = 'closed' }
      } }
    } },
  })
  assert.deepEqual(calls, ['Back', 'Continue Game'])
  assert.equal(panel, 'closed')
})

for (const [file, mission] of [
  ['building-menu', 1], ['stone-head-animation', 1],
  ['training-hut-colors', 17], ['vehicle-destruction', 10], ['reincarnation-wave', 2],
]) test(`${file} retains custom context/readiness with explicit native checkpoint entry`, async () => {
  const source = read(`scripts/check-browser-${file}.mjs`)
  const expression = source.match(/(?:await prepareCampaignFixture\(page, \d+\)\s+)?await launchCampaignMission\(page, \d+\)/)
  assert.ok(expression)
  const page = {}, events = []
  await vm.runInNewContext(`(async () => { ${expression[0]} })()`, {
    page,
    prepareCampaignFixture: async (owner, level) => { assert.equal(owner, page); events.push(['seed', level]) },
    launchCampaignMission: async (owner, level) => { assert.equal(owner, page); events.push(['native', level]) },
  })
  assert.deepEqual(events, mission === 1 ? [['native', 1]] : [['seed', mission], ['native', mission]])
  assert.doesNotMatch(source, /showAllMissions|\.startMission\(/)
  if (mission === 1) assert.doesNotMatch(source, /prepareCampaignFixture/)
  else assert.match(source, /not naturally earned campaign history/)
  assert.match(source, /saveCheckpoint\(/)
})
