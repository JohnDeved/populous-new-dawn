import yaml from 'js-yaml'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { browserConfiguration } from '../scripts/tutorial-browser/browser-config.mjs'
import { runProfileEpisode } from '../scripts/tutorial-browser/profile-episodes.mjs'
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('IndexedDB acceptance has an independent hosted job without extending Tutorial', () => {
  const workflow = read('.github/workflows/tutorial-browser.yml')
  const job = yaml.load(workflow).jobs['tutorial-browser']
  for (const [scenario, name] of [['tutorial', 'Tutorial browser'], ['profile-recovery', 'Profile recovery browser'],
    ['mission10-profile', 'Mission 10 crew persistence browser'],
    ['pause-checkpoint-recovery', 'Pause checkpoint recovery browser']]) {
    const item = job.strategy.matrix.include.find(item => item.scenario === scenario)
    assert.equal(item.name, name); assert.equal(item.timeoutMinutes, 15)
  }
  assert.equal(job.strategy.matrix.include.find(item => item.scenario === 'profile-recovery').artifact, 'profile-recovery-browser')
  assert.equal(job.strategy.matrix.include.find(item => item.scenario === 'mission10-profile').artifact, 'mission10-crew-persistence-browser')
  assert.match(workflow, /POPULOUS_BROWSER_SCENARIO: \$\{\{ matrix.scenario \}\}/)
  assert.match(workflow, /timeout-minutes: \$\{\{ matrix.timeoutMinutes \}\}/)
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/)
  assert.match(workflow, /persist-credentials: false/)
  const config = browserConfiguration()
  assert.equal(config.launch.chromiumSandbox, true)
  assert.deepEqual(config.launch.args, ['--headless', '--remote-debugging-pipe'])
})

test('recovery and M10 retain independent bounded dispatch without M2 fixtures', async () => {
  const runner = read('scripts/tutorial-browser/run.mjs')
  assert.match(
    runner,
    /if \(selectedScenario === 'tutorial' \|\| selectedScenario === 'm2-pointer-f8' \|\| selectedScenario === 'compact-message-layout'\)/
  )
  assert.match(runner, /recoveryScenarioSha256: hash\(recoveryScenario\)/)
  assert.match(runner, /signal: abort.signal/)
  assert.equal(browserCapMs('profile-recovery'), 180000)
  assert.equal(browserCapMs('mission10-profile'), 180000)
  const branch = runner.slice(
    runner.indexOf("} else if (['profile-recovery', 'mission10-profile'].includes(selectedScenario))"),
    runner.indexOf("} else if (selectedScenario === 'compact-message-layout')")
  )
  assert.match(branch, /Object.assign\(receipt, await runProfileEpisode\(selectedScenario,/)
  assert.match(branch, /runRecovery: async \(\) => .*pathToFileURL\(recoveryScenario\)/)
  assert.match(branch, /runMission10: async \(\{ signal, deadlineAt \}\) => .*pathToFileURL\(mission10ProfileScenario\)/)
  assert.match(branch, /deadlineAt: browserDeadlineAt/)
  assert.match(branch, /signal: abort.signal/)
  assert.match(branch, /closeProbe: async \(\) => \{ await context.close\(\); context = undefined; page = undefined; await browser.close\(\) \}/)
  assert.doesNotMatch(branch, /selectorInspection|sceneryPlacement|m2PointerF8|m2Fixture|spellProjection|setTimeout/)
  const signal = new AbortController().signal
  const deadlineAt = 180000
  for (const selected of ['profile-recovery', 'mission10-profile']) {
    const calls = []
    const result = await runProfileEpisode(selected, {
      signal, deadlineAt,
      runRecovery: async () => { calls.push('recovery'); return { status: 'passed', cases: 9 } },
      closeRecoveryProbe: async () => { calls.push('close-recovery') },
      runTornado: async options => {
        calls.push('tornado')
        assert.equal(options.signal, signal)
        assert.equal(options.deadlineAt, deadlineAt)
        return { status: 'passed', episodes: 2 }
      },
      closeProbe: async () => { calls.push('close-probe') },
      runMission10: async options => {
        calls.push('mission10')
        assert.equal(options.signal, signal)
        assert.equal(options.deadlineAt, deadlineAt)
        return { status: 'passed', phases: 2 }
      },
    })
    assert.deepEqual(calls, selected === 'profile-recovery'
      ? ['recovery', 'close-recovery', 'tornado'] : ['close-probe', 'mission10'])
    assert.deepEqual(result, selected === 'profile-recovery'
      ? { profileRecovery: { status: 'passed', cases: 9 },
        tornadoAppearance: { status: 'passed', episodes: 2 } }
      : { mission10Profile: { status: 'passed', phases: 2 } })
  }
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
