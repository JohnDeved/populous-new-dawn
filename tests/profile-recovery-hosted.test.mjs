import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { browserConfiguration } from '../scripts/tutorial-browser/browser-config.mjs'
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('IndexedDB acceptance has an independent hosted job without extending Tutorial', () => {
  const workflow = read('.github/workflows/tutorial-browser.yml')
  const job = workflow.slice(workflow.indexOf('  profile-recovery-browser:'))
  assert.ok(workflow.includes('  profile-recovery-browser:'))
  assert.match(job, /POPULOUS_BROWSER_SCENARIO: profile-recovery/)
  assert.match(job, /timeout-minutes: 15/)
  assert.match(job, /ref: \$\{\{ github.sha \}\}/)
  assert.match(job, /name: profile-recovery-browser-\$\{\{ github.sha \}\}/)
  assert.match(job, /persist-credentials: false/)
  const config = browserConfiguration()
  assert.equal(config.launch.chromiumSandbox, true)
  assert.deepEqual(config.launch.args, ['--headless', '--remote-debugging-pipe'])
})

test('recovery selects only the existing nine-case matrix and skips M2 fixture generation', () => {
  const runner = read('scripts/tutorial-browser/run.mjs')
  assert.match(runner, /if \(selectedScenario !== 'profile-recovery'\)/)
  assert.match(runner, /recoveryScenarioSha256: hash\(recoveryScenario\)/)
  assert.match(runner, /signal: AbortSignal.timeout\(180000\)/)
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
