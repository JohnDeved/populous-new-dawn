import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const read = name => readFileSync(new URL('../scripts/check-browser-' + name + '.mjs', import.meta.url), 'utf8')
const clicks = source => [...source.matchAll(/await page\.getByRole\('button', \{ name: '(Menu|Save Game|Save checkpoint|Back|Continue Game|Load Game|Load checkpoint)', exact: true \}\)\.click\(\)/g)].map(match => match[0])

for (const name of ['follower-classes', 'follower-tasks', 'follower-transports', 'followers-tab', 'stone-head-149', 'worship-panel-live'])
  test(`${name} uses the final native Save and Load panels without replacing checkpoint observations`, async () => {
    const source = read(name), save = source.indexOf("name: 'Save checkpoint'"), load = source.indexOf("name: 'Load checkpoint'", save)
    assert.ok(save > 0 && load > save)
    const begin = source.lastIndexOf("await page.getByRole('button', { name: 'Menu'", save)
    assert.ok(begin >= 0)
    const flow = clicks(source.slice(begin, source.indexOf('.click()', load) + 8))
    let panel = 'closed'
    const seen = []
    const page = { getByRole(_role, { name }) { return { async click() {
      seen.push(name)
      if (name === 'Menu') { assert.equal(panel, 'closed'); panel = 'root' }
      else if (name === 'Save Game') { assert.equal(panel, 'root'); panel = 'save' }
      else if (name === 'Save checkpoint') assert.equal(panel, 'save')
      else if (name === 'Back') { assert.equal(panel, 'save'); panel = 'root' }
      else if (name === 'Continue Game') { assert.equal(panel, 'root'); panel = 'closed' }
      else if (name === 'Load Game') { assert.equal(panel, 'root'); panel = 'load' }
      else { assert.equal(name, 'Load checkpoint'); assert.equal(panel, 'load'); panel = 'closed' }
    } } } }
    await vm.runInNewContext(`(async () => { ${flow.join('\n')} })()`, { page })
    assert.equal(panel, 'closed')
    assert.equal(seen.filter(name => name === 'Save checkpoint').length, 1)
    assert.equal(seen.filter(name => name === 'Load checkpoint').length, 1)
    assert.doesNotMatch(source, /name: 'Close menu'/)
  })

test('mixed consumers retain separate diagnostic-only branches rather than granting every launch a profile', () => {
  const audio = read('audio-preferences')
  assert.match(audio, /button === 'Mission 1'\) await launchCampaignMission\(page, 1\)/)
  assert.match(audio, /await launchDebugMission\(page, 2\)/)
  assert.match(audio, /later audio-only branch never saves or awards/)
  assert.doesNotMatch(audio, /prepareCampaignFixture|openCampaignFixtureGame/)
  assert.match(read('follower-classes'), /openMission\(mission, mission === 3 \? \{ campaignFixture: true \} : \{\}\)/)
  assert.match(read('follower-tasks'), /openMission\(1, \{ nativeCampaign: true \}\)/)
  assert.match(read('follower-transports'), /openMission\(22, \{ campaignFixture: true \}\)/)
  assert.match(read('follower-transports'), /await showAllMissions\(dp\)/)
  assert.match(read('followers-tab'), /openCampaignFixtureGame\(browser, 12\)/)
  assert.match(read('followers-tab'), /await showAllMissions\(page\)/)
  assert.match(read('stone-head-149'), /openCampaignFixtureGame\(browser, 10\)/)
  assert.match(read('worship-panel-live'), /openCampaignGame\(browser, 1\)/)
})
