import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = name => readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8')
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
  assert.match(source, /run: node scripts\/tutorial-browser\/run\.mjs/)
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
    /scenario: tutorial\n +name: Tutorial browser\n +artifact: tutorial-browser/
  )
  assert.match(
    workflow,
    /scenario: pause-checkpoint-recovery\n +name: Pause checkpoint recovery browser\n +artifact: pause-checkpoint-recovery-browser/
  )
  assert.match(workflow, /POPULOUS_BROWSER_SCENARIO: \$\{\{ matrix\.scenario \}\}/)
  assert.match(workflow, /name: \$\{\{ matrix\.artifact \}\}-\$\{\{ github\.sha \}\}/)
  assert.match(workflow, /timeout-minutes: 15/)
  assert.match(workflow, /fail-fast: false/)
  assert.match(workflow, /scripts\/local-render\/original-pause-checkpoint-recovery\.mjs/)
  const runner = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  assert.match(runner, /pauseRecoveryScenarioSha256: hash\(pauseRecoveryScenario\)/)
  assert.match(
    runner,
    /if \(selectedScenario !== 'pause-checkpoint-recovery'\) \{\s+const \{ createM2Checkpoint \}/
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
    /abort\.abort\(new Error\('Browser deadline exceeded'\)\); void browser\.close\(\) \}, 180000\)/
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
