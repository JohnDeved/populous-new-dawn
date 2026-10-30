import yaml from 'js-yaml'
import { browserScenarios, browserCapMs, snapshotSmokeBudget } from '../scripts/tutorial-browser/scenario-policy.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = name => readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8')
// Parse the actual workflow step rather than assuming the historical one-line YAML form.
// Keep the fixed resource opt-in and every other scenario's original command/name exact.
const assertBrowserDispatch = workflow => {
  const job = yaml.load(workflow).jobs['tutorial-browser']
  const steps = job.steps.filter(step => step.run?.includes('scripts/tutorial-browser/run.mjs'))
  assert.equal(steps.length, 1, 'Exactly one browser dispatch step')
  const [step] = steps
  assert.equal(step.name, "${{ matrix.scenario == 'gameplay-resources' && 'Observe three full live Mission 2 workloads and two same-document resource restarts' || matrix.buildStep }}")
  assert.deepEqual(step.env, { POPULOUS_GAMEPLAY_OWNERSHIP: "${{ matrix.scenario == 'gameplay-resources' && contains(github.event.pull_request.labels.*.name, format('weak-v1:{0}', github.event.pull_request.head.sha)) && 'weak-v1' || '' }}" })
  assert.equal(step.run, [
    'if [ "$POPULOUS_BROWSER_SCENARIO" = gameplay-resources ]; then',
    '  if [ "$POPULOUS_GAMEPLAY_OWNERSHIP" = weak-v1 ]; then',
    '    node scripts/tutorial-browser/run.mjs outputs/tutorial-browser --gameplay-resource-profile=three-cycle-v1 --gameplay-ownership-probe=weak-v1',
    '  else',
    '    node scripts/tutorial-browser/run.mjs outputs/tutorial-browser --gameplay-resource-profile=three-cycle-v1',
    '  fi',
    'else',
    '  node scripts/tutorial-browser/run.mjs',
    'fi',
    '',
  ].join('\n'))
  const items = job.strategy.matrix.include
  assert.equal(items.filter(item => item.scenario === 'gameplay-resources').length, 1)
  for (const item of items) assert.equal(typeof item.buildStep, 'string')
  return step
}

const activityTypes = source => {
  const admission = source.slice(source.indexOf('\non:\n'), source.indexOf('\npermissions:\n'))
  assert.match(admission, /\n {2}pull_request:\n/)
  assert.match(admission, /branches: \[main\]/)
  assert.doesNotMatch(admission, /pull_request_target|workflow_dispatch|workflow_run|\n {2}push:/)
  const types = admission.match(/types: \[([^\]]+)\]/)
  assert.ok(types, 'Explicit activity types prevent implicit opened/synchronize admission')
  return types[1].split(',').map(value => value.trim())
}

test('Tutorial and Full launch only on reviewed ready transition, not ordinary draft activity', () => {
  for (const name of ['tutorial-browser.yml', 'ready-pr-check.yml']) {
    const types = activityTypes(read(name))
    assert.deepEqual(types, ['ready_for_review'])
    for (const draftEvent of ['opened', 'reopened', 'synchronize', 'converted_to_draft', 'edited'])
      assert.equal(types.includes(draftEvent), false)
  }
})

test('Tutorial preserves exact merge, runtime readiness defense and validation, not skipped Full shadow', () => {
  const source = read('tutorial-browser.yml')
  assert.match(source, /paths:\n/)
  assert.match(source, /contents: read/)
  assert.match(source, /ref: \$\{\{ github\.sha \}\}/)
  assert.match(source, /persist-credentials: false/)
  assert.match(source, /Require a ready pull request/)
  assert.match(source, /if \[ "\$IS_DRAFT" != false \]; then/)
  assert.match(source, /exit 1/)
  assertBrowserDispatch(source)
  assert.match(source, /test "\$\(git rev-parse HEAD\)" = "\$GITHUB_SHA"/)
  assert.match(source, /git diff --exit-code HEAD --/)
  assert.doesNotMatch(source, /Full check|continue-on-error|exit 0/)
  const jobs = source.slice(source.indexOf('\njobs:\n'))
  // No job-level draft skip: non-ready events are excluded before creating a run.
  for (const header of jobs.split(/\n {2}[a-z][a-z0-9-]*:\n/).slice(1))
    assert.doesNotMatch(header.slice(0, header.indexOf('    steps:')), /^ {4}if:/m)
})

test('required Full gate remains unconditional after dependencies and rejects skipped workers', () => {
  const source = read('ready-pr-check.yml')
  const gate = source.slice(
    source.indexOf('\n  full-check:'),
    source.indexOf('\n  benchmark-baseline:')
  )
  assert.match(gate, /needs: \[quality, test-shards\]/)
  assert.match(gate, /if: \$\{\{ always\(\) \}\}/)
  assert.match(gate, /toJSON\(github\.event\.pull_request\.draft\) == 'false' && 'Full check'/)
  assert.match(gate, /Require successful dependencies/)
  assert.match(gate, /ci-gate\.mjs aggregate/)
})

test('pause recovery has an isolated bounded hosted episode without replacing Tutorial coverage', () => {
  const workflow = read('tutorial-browser.yml')
  assert.match(
    workflow,
    /scenario: tutorial\n +timeoutMinutes: 15\n +name: Tutorial browser\n +artifact: tutorial-browser/
  )
  assert.match(
    workflow,
    /scenario: pause-checkpoint-recovery\n +timeoutMinutes: 15\n +name: Pause checkpoint recovery browser\n +artifact: pause-checkpoint-recovery-browser/
  )
  assert.match(workflow, /POPULOUS_BROWSER_SCENARIO: \$\{\{ matrix\.scenario \}\}/)
  assert.match(workflow, /name: \$\{\{ matrix\.artifact \}\}-\$\{\{ github\.sha \}\}/)
  assert.match(
    workflow,
    /buildStep: Build plain production Home and validate Tutorial interactions/
  )
  assert.match(
    workflow,
    /buildStep: Build plain production Home and validate pause checkpoint recovery/
  )
  assertBrowserDispatch(workflow)
  assert.match(workflow, /timeout-minutes: \$\{\{ matrix\.timeoutMinutes \}\}/)
  assert.equal((workflow.match(/timeoutMinutes: 15/g) ?? []).length, 8)
  assert.match(workflow, /fail-fast: false/)
  assert.match(workflow, /scripts\/local-render\/original-pause-checkpoint-recovery\.mjs/)
  const runner = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  assert.match(runner, /pauseRecoveryScenarioSha256: hash\(pauseRecoveryScenario\)/)
  assert.match(
    runner,
    /if \(selectedScenario === 'tutorial' \|\| selectedScenario === 'm2-pointer-f8' \|\| selectedScenario === 'compact-message-layout'\) \{\s+const \{ createM2Checkpoint \}/
  )
  assert.match(
    runner,
    /else if \(selectedScenario === 'pause-checkpoint-recovery'\) \{\s+await page\.goto\(url/
  )
  assert.match(
    runner,
    /receipt\.pauseCheckpointRecovery = await .*pauseRecoveryScenario.*signal: abort\.signal/
  )
  assert.match(runner, /const abort = new AbortController\(\)/)
  assert.match(
    runner,
    /abort\.abort\(new Error\('Browser deadline exceeded'\)\); void browser\.close\(\) \}, receipt\.browserCapMs\)/
  )
  assert.match(runner, /capMs: 120000/)
  for (const result of [
    'result',
    'selectorInspection',
    'sceneryPlacement',
    'm2PointerF8',
    'spellProjection',
  ])
    assert.match(runner, new RegExp(`receipt\\.${result} = await`))
})

test('candidate snapshot smoke is one read-only bounded functional case, never a trusted comparison', () => {
  const workflow = read('tutorial-browser.yml')
  assert.match(workflow, /scenario: snapshot-protocol\n +timeoutMinutes: 6\n +name: Controlled snapshot functional smoke\n +artifact: candidate-snapshot-functional-smoke/)
  assert.equal((workflow.match(/- scenario:/g) ?? []).length, 9)
  assert.match(workflow, /scripts\/browser-performance\/\*\*/)
  assert.match(workflow, /outputs\/tutorial-browser\/snapshot-\*\/\*\.json/)
  assert.doesNotMatch(workflow, /: write|secrets\.|pull_request_target|workflow_dispatch|continue-on-error/)
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(runner, /receipt\.browserCapMs = browserCapMs\(selectedScenario\)/)
  assert.match(runner, /assert.ok\(browserScenarios.includes\(selectedScenario\)/)
  assert.match(runner, /snapshotScenarioSha256: hash\(snapshotScenario\)/)
  assert.match(runner, /receipt\.snapshotSmoke = await/)
  const timers = runner.slice(runner.indexOf("if (selectedScenario === 'snapshot-protocol') receipt.browserBudget"), runner.indexOf("if (selectedScenario !== 'snapshot-protocol')"))
  assert.match(timers, /if \(selectedScenario === 'snapshot-protocol'\) receipt\.browserBudget = snapshotSmokeBudget\s+else if \(selectedScenario === 'gameplay-frames'\)/)
  assert.match(timers, /gameplayAdmission = createGameplayAdmission\(/)
  assert.match(timers, /} else\s+timer = setTimeout/)
  assert.equal((timers.match(/timer = setTimeout/g) ?? []).length, 1)
  assert.match(runner, /if \(error.code === 'SNAPSHOT_EPISODE_TIMEOUT'\) receipt.browserTimedOut = true/)
  assert.match(runner, /if \(page\) \{/)
  assert.match(runner, /receipt.failureEvidence = 'candidate-snapshot-smoke.json'/)
  assert.equal(snapshotSmokeBudget.maxEpisodes * snapshotSmokeBudget.episodeMs, snapshotSmokeBudget.totalBrowserMs)
  assert.equal(snapshotSmokeBudget.hostedJobMs, 6 * 60 * 1000)
})


test('parsed hosted matrix grants explicit Tutorial, gameplay and two-phase compact admission and preserves other caps', () => {
  const workflow = readFileSync(new URL('../.github/workflows/tutorial-browser.yml', import.meta.url), 'utf8')
  const job = yaml.load(workflow).jobs['tutorial-browser'], items = job.strategy.matrix.include
  assert.equal(job['timeout-minutes'], '${{ matrix.timeoutMinutes }}')
  assert.deepEqual(items.map(item => item.scenario).sort(), browserScenarios.filter(name => name !== 'm2-pointer-f8').sort())
  assert.deepEqual(Object.fromEntries(browserScenarios.map(name => [name, browserCapMs(name)])), {
    tutorial: 240000, 'm2-pointer-f8': 180000, 'pause-checkpoint-recovery': 180000,
    'profile-recovery': 180000, 'mission10-profile': 180000, 'gameplay-frames': 355000, 'gameplay-resources': 180000,
    'snapshot-protocol': 90000, 'compact-message-layout': 225000, 'frontend-held-escape': 180000,
  })
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.equal((runner.match(/browserDeadlineAt = Date\.now\(\) \+ receipt\.browserCapMs/g) ?? []).length, 1)
  assert.equal((runner.match(/timer = setTimeout\(/g) ?? []).length, 1)
  assert.match(runner, /assert\.equal\(receipt\.browserTimedOut, undefined\)/)
  assert.match(runner, /abort\.abort\(new Error\('Browser deadline exceeded'\)\); void browser\.close\(\)/)

  for (const item of items) assert.equal(item.timeoutMinutes, item.scenario === 'snapshot-protocol' ? 6 : 15)
  for (const invalid of ['', 'unknown', null, 900000]) assert.throws(() => browserCapMs(invalid), /Unknown browser scenario/)
})


test('frontend held Escape is one separate hosted job, not added work inside Tutorial', async () => {
  const workflow = yaml.load(read('tutorial-browser.yml'))
  const items = workflow.jobs['tutorial-browser'].strategy.matrix.include
  const selected = items.filter(item => item.scenario === 'frontend-held-escape')
  assert.deepEqual(selected, [{ scenario: 'frontend-held-escape', timeoutMinutes: 15,
    name: 'Frontend held Escape browser', artifact: 'frontend-held-escape-browser',
    buildStep: 'Build plain production Home and validate bounded frontend Escape navigation' }])
  assert.equal(browserCapMs('frontend-held-escape'), 180000)
  const { frontendHeldEscapeLimitMs } = await import('../scripts/local-render/frontend-held-escape.mjs')
  assert.equal(frontendHeldEscapeLimitMs, 60000)
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(runner, /frontendEscapeScenarioSha256: hash\(frontendEscapeScenario\)/)
  assert.match(runner, /else if \(selectedScenario === 'frontend-held-escape'\) \{\s+receipt\.frontendHeldEscape = await .*frontendEscapeScenario.*page, url, output: out/)
  assert.equal((runner.match(/receipt\.frontendHeldEscape =/g) ?? []).length, 1)
  assert.match(runner, /capMs: 120000/)
  assert.ok(workflow.on.pull_request.paths.includes('scripts/local-render/frontend-held-escape.mjs'))
})

test('selector keyboard regression is reached by the existing hosted Tutorial path', () => {
  const workflow = yaml.load(read('tutorial-browser.yml'))
  assert.ok(workflow.jobs['tutorial-browser'].strategy.matrix.include.some(item => item.scenario === 'tutorial'))
  assert.ok(workflow.on.pull_request.paths.includes('app/**'))
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(runner, /const scenario = resolve\(root, 'scripts\/local-render\/tutorial-recommendation.mjs'\)/)
  assert.match(runner, /receipt\.result = await .*import\(pathToFileURL\(scenario\)\.href\)/)
  const tutorial = readFileSync(new URL('../scripts/local-render/tutorial-recommendation.mjs', import.meta.url), 'utf8')
  assert.match(tutorial, /import \{ checkSelectorKeyboardFocus \} from '\.\.\/check-browser-world-selector.mjs'/)
  assert.match(tutorial, /await checkSelectorKeyboardFocus\(\{ page, output \}\)/)
  assert.match(tutorial, /selector-keyboard\.json/)
})


test('resource-only dispatch rejects widened selection, changed defaults, labels and duplicate execution', () => {
  const original = yaml.load(read('tutorial-browser.yml'))
  const selected = original.jobs['tutorial-browser'].steps.findIndex(step => step.run?.includes('scripts/tutorial-browser/run.mjs'))
  const changes = [
    step => { step.env.POPULOUS_GAMEPLAY_OWNERSHIP = 'weak-v1' },
    step => { step.env.POPULOUS_GAMEPLAY_OWNERSHIP = step.env.POPULOUS_GAMEPLAY_OWNERSHIP.replace("format('weak-v1:{0}', github.event.pull_request.head.sha)", "'weak-v1'") },
    step => { step.run = step.run.replace('--gameplay-ownership-probe=weak-v1', '--gameplay-ownership-probe=other') },
    step => { step.run = step.run.replace('= gameplay-resources', '!= tutorial') },
    step => { step.run = step.run.replace('three-cycle-v1', 'two-cycle-v1') },
    step => { step.run = step.run.replace('else\n  node scripts/tutorial-browser/run.mjs\n', 'else\n  node scripts/tutorial-browser/run.mjs --gameplay-resource-profile=three-cycle-v1\n') },
    step => { step.run = step.run.replace('outputs/tutorial-browser', 'outputs/other') },
    step => { step.name = '${{ matrix.buildStep }}' },
    step => { step.name = step.name.replace("|| matrix.buildStep", "|| 'Changed default label'") },
  ]
  for (const change of changes) {
    const workflow = structuredClone(original)
    change(workflow.jobs['tutorial-browser'].steps[selected])
    assert.throws(() => assertBrowserDispatch(yaml.dump(workflow)), assert.AssertionError)
  }
  const duplicate = structuredClone(original)
  duplicate.jobs['tutorial-browser'].steps.push(duplicate.jobs['tutorial-browser'].steps[selected])
  assert.throws(() => assertBrowserDispatch(yaml.dump(duplicate)), assert.AssertionError)
})
