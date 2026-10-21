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
