import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import { browserCapMs, followerCorpseSplitBudget } from '../scripts/tutorial-browser/scenario-policy.mjs'
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const expected = { scenario: 'follower-corpse', timeoutMinutes: 15,
  name: 'Follower corpse checkpoint browser', artifact: 'follower-corpse-checkpoint-browser',
  buildStep: 'Validate ordinary follower death artwork and genuine checkpoint continuation' }
function assertCoverage(workflow) {
  assert.deepEqual(workflow.on.pull_request.types, ['ready_for_review'])
  const job = workflow.jobs['tutorial-browser']
  assert.equal(job['continue-on-error'], undefined)
  assert.equal(job.if, undefined)
  assert.equal(job.strategy['fail-fast'], false)
  const cases = job.strategy.matrix.include
  assert.deepEqual(cases.filter(item => item.scenario === 'follower-corpse'), [expected])
  assert.equal(cases.filter(item => item.scenario === 'gameplay-frames').length, 1)
  const run = job.steps.find(step => step.name?.endsWith('|| matrix.buildStep }}'))
  assert.ok(run)
  assert.equal(run.if, undefined)
  assert.equal(run['continue-on-error'], undefined)
  assert.equal(job.env.POPULOUS_BROWSER_SCENARIO, '${{ matrix.scenario }}')
  assert.match(run.run, /node scripts\/tutorial-browser\/run.mjs/)
}
test('both independent browser stories are mandatory in the same Ready workflow', () => {
  const workflow = yaml.load(read('.github/workflows/tutorial-browser.yml'))
  assertCoverage(workflow)
  for (const mutate of [
    w => { w.jobs['tutorial-browser'].strategy.matrix.include = w.jobs['tutorial-browser'].strategy.matrix.include.filter(i => i.scenario !== 'follower-corpse') },
    w => { w.jobs['tutorial-browser']['continue-on-error'] = true },
    w => { w.jobs['tutorial-browser'].if = 'false' },
    w => { w.jobs['tutorial-browser'].steps.find(s => s.name?.endsWith('|| matrix.buildStep }}')).if = 'false' },
    w => { w.jobs['tutorial-browser'].strategy.matrix.include.push(expected) },
  ]) {
    const changed = structuredClone(workflow); mutate(changed)
    assert.throws(() => assertCoverage(changed))
  }
})
test('scheduling explicitly reserves another browser/build without relaxing episode caps', () => {
  assert.deepEqual(followerCorpseSplitBudget, { version: 1,
    framesAndMeleeMs: 180000, corpseBrowserMs: 180000, totalBrowserMs: 360000,
    corpseDeathAndSaveMs: 75000, corpseLoadAndVerifyMs: 25000,
    buildMsPerJob: 120000, hostedJobMs: 900000 })
  assert.equal(browserCapMs('follower-corpse'), 180000)
  assert.equal(browserCapMs('gameplay-frames'), 180000)
  const runner = read('scripts/tutorial-browser/run.mjs')
  const branch = runner.split("} else if (selectedScenario === 'follower-corpse') {")[1].split("} else if (['profile-recovery'")[0]
  assert.match(branch, /receipt.followerCorpse = await \(await import\(pathToFileURL\(followerCorpseScenario\).href\)\).default\(\{ browser, url, output: out, expectedRevision: receipt.buildRevision \}\)/)
  assert.doesNotMatch(branch, /catch|Promise.race|setTimeout|\.then|skip/)
  assert.match(runner, /receipt.followerCorpseSplitBudget = followerCorpseSplitBudget/)
  assert.match(runner, /abort.abort\(new Error\('Browser deadline exceeded'\)\); void browser.close\(\)/)
  assert.match(runner, /assert.equal\(receipt.browserTimedOut, undefined\)/)
})

import { GATES, validatePassedGate } from '../scripts/integration-queue/policy.mjs'
test('successful Tutorial cannot admit a failed, skipped or incomplete overall browser run', () => {
  const gate = GATES[1], head = 'a'.repeat(40)
  const observation = { head, currentChecks: [{ id: 2, name: gate.job, appId: 15368,
    head, startedAt: '2026-11-18T00:00:00Z', status: 'completed', conclusion: 'success' }] }
  const latest = { id: 1, attempt: 1, conclusion: 'success', event: 'pull_request',
    validationVerified: true, job: gate.job, jobConclusion: 'success', app: 'github-actions',
    appId: 15368, checkId: 2, steps: gate.steps.map(name => ({ name, conclusion: 'success' })) }
  validatePassedGate(observation, gate, latest)
  for (const conclusion of ['failure', 'cancelled', 'skipped', null, undefined])
    assert.throws(() => validatePassedGate(observation, gate, { ...latest, conclusion }),
      /Failed, canceled, skipped or unverified/)
})
