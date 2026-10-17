import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { browserConfiguration } from '../scripts/tutorial-browser/browser-config.mjs'
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('IndexedDB acceptance has an independent hosted job without extending Tutorial', () => {
  const workflow = read('.github/workflows/tutorial-browser.yml')
  assert.match(
    workflow,
    /scenario: profile-recovery\n\s+name: Profile recovery browser\n\s+artifact: profile-recovery-browser/
  )
  assert.match(workflow, /scenario: tutorial\n\s+name: Tutorial browser/)
  assert.match(
    workflow,
    /scenario: pause-checkpoint-recovery\n\s+name: Pause checkpoint recovery browser/
  )
  assert.match(workflow, /POPULOUS_BROWSER_SCENARIO: \$\{\{ matrix.scenario \}\}/)
  assert.match(workflow, /timeout-minutes: 15/)
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/)
  assert.match(workflow, /persist-credentials: false/)
  const config = browserConfiguration()
  assert.equal(config.launch.chromiumSandbox, true)
  assert.deepEqual(config.launch.args, ['--headless', '--remote-debugging-pipe'])
})

test('recovery selects only the existing nine-case matrix and skips M2 fixture generation', () => {
  const runner = read('scripts/tutorial-browser/run.mjs')
  assert.match(
    runner,
    /if \(selectedScenario === 'tutorial' \|\| selectedScenario === 'm2-pointer-f8'\)/
  )
  assert.match(runner, /recoveryScenarioSha256: hash\(recoveryScenario\)/)
  assert.match(runner, /signal: abort.signal/)
  assert.match(runner, /receipt.browserCapMs = 180000/)
  const branch = runner.slice(
    runner.indexOf("if (selectedScenario === 'profile-recovery')"),
    runner.indexOf("} else if (selectedScenario === 'm2-pointer-f8')")
  )
  assert.match(branch, /receipt.profileRecovery/)
  assert.doesNotMatch(branch, /selectorInspection|sceneryPlacement|m2PointerF8|spellProjection/)
  assert.match(runner, /if \(selectedScenario === 'tutorial'\) receipt\.spellProjection =/)
  const scenario = read('scripts/local-render/campaign-profile-recovery.mjs')
  for (const name of [
    'empty',
    'missing',
    'malformed',
    'partially-migratable',
    'incompatible',
    'current',
    'legacy',
    'ordinary-save-fresh-load',
    'usable-session-checkpoint',
  ])
    assert.ok(scenario.includes(`'${name}'`), name)
  assert.match(scenario, /receipt.browserPath \?\? receipt.launch.executablePath/)
  assert.match(scenario, /await context.close\(\)/)
  assert.match(scenario, /reflect.apply|Reflect.apply/)
  assert.match(scenario, /Startup\/restore\/load must preserve every stored record/)
})

test('hosted readiness uses exact production eligibility without a served source module', async () => {
  const { recoveryReadiness, waitRecoveryReadiness } =
    await import('../scripts/tutorial-browser/profile-readiness.mjs')
  const snapshot = {
    status: 'playing',
    paused: false,
    inputMask: 0,
    turn: 42,
    selected: [],
    outcome: { level: 1 },
    units: [
      { id: 1, kind: 'shaman', team: 'blue', hp: 100, native: { state: 1, flags2: 0, flags4: 0 } },
    ],
  }
  assert.equal(recoveryReadiness(null).ready, false)
  assert.equal(recoveryReadiness(snapshot).ready, true)
  for (const bit of ['flags2', 'flags4']) {
    const blocked = structuredClone(snapshot)
    blocked.units[0].native[bit] = bit === 'flags2' ? 0x100000 : 128
    assert.equal(recoveryReadiness(blocked).ready, false)
  }
  const samples = [null, snapshot]
  const result = await waitRecoveryReadiness({
    evaluate: async () => samples.shift(),
    waitForTimeout: async () => {},
  })
  assert.equal(result.samples, 2)
  assert.equal(result.after.level, 1)
  assert.equal(result.after.ready, true)
  const signal = AbortSignal.abort(Error('cancelled'))
  await assert.rejects(
    waitRecoveryReadiness(
      { evaluate: () => assert.fail('No observation after abort') },
      { signal }
    ),
    /cancelled/
  )
  assert.doesNotMatch(
    read('scripts/local-render/campaign-profile-recovery.mjs'),
    /waitForShamanReadiness/
  )
})

test('profile load and new mission reuse reviewed public introduction readiness', () => {
  const scenario = read('scripts/local-render/campaign-profile-recovery.mjs')
  assert.match(
    scenario,
    /import \{ pauseStartupReady, skipPauseIntroduction \} from '.\/original-pause-checkpoint-recovery.mjs'/
  )
  assert.equal((scenario.match(/waitForFunction\(pauseStartupReady\)/g) || []).length, 2)
  assert.equal((scenario.match(/await skipPauseIntroduction\(page\)/g) || []).length, 2)
  assert.doesNotMatch(scenario, /skip.isVisible|skip.click/)
})
