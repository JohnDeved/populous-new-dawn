import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const recovery = read('scripts/local-render/original-pause-checkpoint-recovery.mjs')
const helper = recovery.slice(recovery.indexOf('export async function waitForPauseStartup('),
  recovery.indexOf('// The introduction may finish'))
function fixture(paused, replace = false) {
  const world = { paused, outcome: { level: 1 }, status: 'playing' }
  const window = { testStore: { getWorld: () => world }, testSceneRef: { current: { world } } }
  const calls = [], disposed = []
  const evaluate = (callback, value) => runInNewContext(`(${callback.toString()})(value)`, { window, value })
  const owner = { evaluate: callback => evaluate(callback, world), dispose: () => disposed.push('world') }
  const element = { isConnected: true, getAttribute: () => 'Resume game' }
  const resume = { evaluate: callback => evaluate(callback, element),
    click: options => { calls.push(['resume', options]); world.paused = false
      if (replace) window.testSceneRef.current.world = {}
    }, dispose: () => disposed.push('resume') }
  const page = { evaluateHandle: () => owner,
    getByRole: (role, options) => {
      assert.equal(role, 'button'); assert.equal(options.name, 'Resume game'); assert.equal(options.exact, true)
      return { elementHandle: () => resume }
    },
    waitForFunction: (callback, argument, options) => {
      calls.push(['ready', options]); assert.equal(world.paused, false)
      return { jsonValue: () => 'ready', dispose: () => disposed.push('startup') }
    } }
  const invoke = runInNewContext(`(${helper.replace('export ', '')})`,
    { assert, Date, pauseStartupReady: () => 'ready' })
  return { run: () => invoke(page), calls, disposed }
}
test('paused startup resumes through the public control before readiness within 25 seconds', async () => {
  const f = fixture(true)
  assert.equal(await f.run(), 'ready')
  assert.deepEqual(f.calls.map(([name]) => name), ['resume', 'ready'])
  assert.ok(f.calls.every(([, options]) => options.timeout > 0 && options.timeout <= 25000))
  assert.deepEqual(f.disposed, ['startup', 'resume', 'world'])
})
test('running startup does not toggle pause', async () => {
  const f = fixture(false)
  assert.equal(await f.run(), 'ready')
  assert.deepEqual(f.calls.map(([name]) => name), ['ready'])
})
test('replacement scene fails before startup readiness and releases retained handles', async () => {
  const f = fixture(true, true)
  await assert.rejects(f.run(), /exact Mission 1 World/)
  assert.deepEqual(f.calls.map(([name]) => name), ['resume'])
  assert.deepEqual(f.disposed, ['resume', 'world'])
})
test('both pause callers use the shared bounded public startup path', () => {
  const style = read('scripts/local-render/original-pause-checkpoint-style.mjs')
  assert.match(style, /const action = await waitForPauseStartup\(page\)/)
  assert.match(recovery, /const action = await waitForPauseStartup\(page\)/)
  assert.match(recovery, /timeout: remaining\(\)/)
})
test('Escape fixtures retain assertions and establish exact public message ownership first', () => {
  const mission = read('scripts/local-render/mission10-boat-checkpoint.mjs')
  const corpse = read('scripts/tutorial-browser/follower-corpse.mjs')
  assert.ok(mission.indexOf('collapseObservedCampaignMessages(page') < mission.indexOf("page.keyboard.press('Escape')"))
  assert.ok(corpse.indexOf('collapseObservedCampaignMessages(page') < corpse.indexOf("page.keyboard.press('Escape')"))
  assert.match(mission, /assert.deepEqual\(cleared.selected, \[\], 'Escape must clear the existing crew first'\)/)
  assert.match(corpse, /assert.deepEqual\(await page.evaluate\(\(\) => window.testStore.getWorld\(\).selected\), \[\]\)/)
  const ownership = read('scripts/public-keyboard-owner.mjs')
  assert.match(ownership, /matches\[0\] === element && element.isConnected && element.open/)
  assert.match(ownership, /matches\[0\] === element && element.isConnected && !element.open/)
  assert.match(ownership, /await summary.click\(\{ timeout: remaining\(\) \}\)/)
  assert.doesNotMatch(ownership, /\.open\s*=|removeMessage\(|store.change\(|force:\s*true/)
})
