import assert from 'node:assert/strict'
import test from 'node:test'
import { openGame, openCampaignGame, openCampaignFixtureGame } from '../scripts/browser-game.mjs'

// Execute the actual shared helper with supplied browser IO. This proves mode
// routing, not rendered trusted input, IndexedDB behavior or earned progression.
function browserFixture() {
  const actions = [], fixtures = [], observations = [], contexts = []
  let screen = 'Main menu'
  const locator = name => ({
    getByRole: (_role, { name }) => locator(name),
    or() { return this }, filter() { return this }, first() { return this },
    async waitFor() {},
    async isVisible() { return typeof name === 'string' ? name === screen : name.test(screen) },
    async click() {
      actions.push(String(name))
      if (name === 'New Game') screen = 'Start game'
      else if (/Mission/.test(String(name)) && !/Panel/.test(String(name))) screen = 'Playing'
    },
  })
  const page = {
    on() {}, async goto() {}, async reload() { screen = 'Main menu' },
    getByRole: (_role, { name }) => locator(name), locator: name => locator(name),
    keyboard: { async press(key) { actions.push(key); if (key === 'F8') screen = 'Debug missions' } },
    async waitForSelector(selector) { observations.push(selector) },
    async waitForFunction(read) {
      observations.push(String(read))
      return { async jsonValue() { return 'ready' }, async dispose() {} }
    },
    async evaluate(read, fixture) {
      if (fixture !== undefined) fixtures.push(structuredClone(fixture))
      else observations.push(String(read))
    },
  }
  const context = { async newPage() { return page } }
  const browser = { async newContext(options) { contexts.push(options); return context } }
  return { browser, page, actions, fixtures, observations, contexts }
}

test('default browser setup remains an explicitly non-awarding diagnostic launch', async () => {
  const f = browserFixture(), opened = await openGame(f.browser, 3)
  assert.equal(opened.page, f.page)
  assert.deepEqual(opened.errors, [])
  assert.deepEqual(f.actions, ['F8', 'Mission 3'])
  assert.deepEqual(f.fixtures, [])
  assert.deepEqual(f.contexts, [{ viewport: { width: 1440, height: 1000 } }])
  assert.ok(f.observations.includes('.world-viewport canvas'))
})

test('native browser setup uses initial availability without writing a prerequisite profile', async () => {
  const f = browserFixture(), opened = await openCampaignGame(f.browser)
  assert.equal(opened.page, f.page)
  assert.deepEqual(f.actions, ['New Game', '/^Panel Mission 1(, completed)?$/', '/^(Start|Replay) Mission 1$/'])
  assert.deepEqual(f.fixtures, [], 'non-seeding native setup must work with storage disabled')
  assert.ok(f.observations.includes('.world-viewport canvas'))
  assert.ok(f.observations.some(read => read.includes('world.inputMask')))
})

test('declared fixture browser setup seeds only named availability then uses native public controls', async () => {
  const f = browserFixture()
  await openCampaignFixtureGame(f.browser, 15)
  assert.equal(f.fixtures.length, 1)
  assert.deepEqual(f.fixtures[0].completed, [])
  assert.deepEqual(f.fixtures[0].nativeCampaign.flags, Array.from({ length: 25 }, (_, index) => index === 14 ? 4 : 0))
  assert.deepEqual(f.actions, ['New Game', '/^Panel Mission 15(, completed)?$/', '/^(Start|Replay) Mission 15$/'])
})

test('conflicting browser setup modes fail before allocating a context or mutating storage', async () => {
  const f = browserFixture()
  await assert.rejects(openGame(f.browser, 1, { campaignFixture: true, nativeCampaign: true }), /not both/)
  assert.deepEqual(f.contexts, [])
  assert.deepEqual(f.fixtures, [])
  assert.deepEqual(f.actions, [])
})
