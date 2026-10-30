import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const read = path => readFileSync(new URL('../scripts/' + path, import.meta.url), 'utf8')

test('M10 native availability is declared only in the created-profile acquisition branch', () => {
  const source = read('local-render/mission10-boat-checkpoint.mjs')
  const start = source.indexOf("if (receipt.profile.mode === 'created')")
  const entry = source.indexOf('await openMission(10, { campaignFixture: true })')
  const reused = source.indexOf('    const saved = receipt.profile.checkpointAtStart')
  assert.ok(start > 0 && entry > start && reused > entry)
  assert.match(source.slice(entry, reused), /return report/)
  assert.doesNotMatch(source.slice(reused), /openMission\(|prepareCampaignFixture\(/)
  assert.equal((source.match(/openMission\(/g) ?? []).length, 1)
  assert.match(source, /not earned prior campaign history; reused profiles are never reseeded/)
  assert.match(source, /stored\.checkpoint\.checkpointSha256, saved\.checkpointSha256/)
})

test('water sequences use independent empty later contexts without seeding initial M1', async () => {
  const source = read('local-render/water-shore-animation.mjs')
  const begin = source.indexOf('    const context = mission === 1')
  const end = source.indexOf('      await page.waitForFunction(() => window.testSceneRef.current.waves', begin)
  assert.ok(begin > 0 && end > begin)
  const setup = source.slice(begin, end).replace('    try {', '')
  const seeded = [], launched = [], closed = [], pages = []
  const makePage = id => ({ id, on() {}, async goto() {}, async waitForFunction() {} })
  const initialPage = makePage(1), initialContext = {}
  for (const mission of [1, 2, 3]) {
    const scope = { mission, initialContext, initialPage, page: null, url: 'http://example.test', receipt: { errors: [] },
      browser: { async newContext() { const next = makePage(mission); pages.push(next); return { async newPage() { return next }, async close() { closed.push(mission) } } } },
      prepareCampaignFixture: async (page, level) => { assert.equal(page.id, level); seeded.push(level) },
      launchCampaignMission: async (page, level) => { assert.equal(page.id, level); launched.push(level) },
      bindGame: async () => {}, skipIntroductionWithSpace: async () => {},
    }
    await vm.runInNewContext(`(async () => { ${setup} })()`, scope)
  }
  assert.deepEqual(seeded, [2, 3]); assert.deepEqual(launched, [1, 2, 3])
  assert.equal(pages.length, 2); assert.notEqual(pages[0], pages[1])
  assert.match(source, /finally \{ if \(mission !== 1\) await context.close\(\) \}/)
  assert.match(source, /declared availability, not earned prior campaign history/)
})

test('orientation and vehicle consumers keep fixture boundaries distinct from non-saving diagnostics', () => {
  const orientation = read('check-browser-stone-head-orientation.mjs')
  assert.match(orientation, /for \(const item of cases\) \{\s+const context = await browser.newContext/)
  assert.match(orientation, /if \(item.mission !== 1\) await prepareCampaignFixture\(page, item.mission\)/)
  assert.match(orientation, /await launchCampaignMission\(page, item.mission\)/)
  assert.match(orientation, /await context.close\(\)/)
  const vehicles = read('check-browser-vehicle-assets.mjs')
  assert.match(vehicles, /if \(number === 22\) \{[\s\S]*?prepareCampaignFixture\(page, number\)[\s\S]*?launchCampaignMission\(page, number\)/)
  assert.match(vehicles, /assert.equal\(number, 13\)\s+await launchDebugMission\(page, number\)/)
  const later = vehicles.indexOf('  await openMission(13)')
  assert.ok(later > 0)
  assert.doesNotMatch(vehicles.slice(later), /saveCheckpoint\(|Save checkpoint/)
  assert.match(vehicles, /later M13 rendering\/lifecycle case never saves or awards progress/)
})

test('Shaman appearance uses declared availability and connected native checkpoint panels', () => {
  const source = read('check-browser-shaman-appearance.mjs')
  assert.match(source, /await prepareCampaignFixture\(page, 23\)\s+await launchCampaignMission\(page, 23\)/)
  assert.match(source, /not naturally earned campaign history/)
  assert.doesNotMatch(source, /showAllMissions|Return to the world|name: 'Close menu'/)
  for (const [earlier, later] of [['Save Game', 'Save checkpoint'], ['Back', 'Continue Game'], ['Load Game', 'Load checkpoint']]) {
    const a = source.indexOf(`name: '${earlier}'`), b = source.indexOf(`name: '${later}'`)
    assert.ok(a > 0 && b > a)
  }
})
