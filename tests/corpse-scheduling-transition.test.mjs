import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { historicalCaptureRunnerDigest, priorMatrixWithoutCorpse } from './support/corpse-scheduling-transition.mjs'
import { qualifyCaptureInputs } from '../scripts/tutorial-browser/qualify-capture-inputs.mjs'
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const source = read('scripts/tutorial-browser/run.mjs')
const pin = JSON.parse(read('scripts/tutorial-browser/capture-qualified-inputs.json'))['scripts/tutorial-browser/run.mjs']
test('exact inverse preserves the complete frozen historical runner, not current capture qualification', () => {
  assert.equal(historicalCaptureRunnerDigest(source), pin)
  assert.notEqual(createHash('sha256').update(source).digest('hex'), pin)
  const cwd = fileURLToPath(new URL('..', import.meta.url))
  assert.throws(() => qualifyCaptureInputs({ cwd, runner: fileURLToPath(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url)), node: process.execPath },
    createHash('sha256').update(readFileSync(process.execPath)).digest('hex')), /Capture input identity mismatch: scripts\/tutorial-browser\/run.mjs/)
})
test('inverse refuses missing, duplicated and modified transitions and detects unrelated edits', () => {
  const budget = "  if (['gameplay-frames', 'follower-corpse'].includes(selectedScenario)) receipt.followerCorpseSplitBudget = followerCorpseSplitBudget\n"
  for (const changed of [source.replace(budget, ''), source.replace(budget, budget + budget),
    source.replace('Release the unused probe', 'Ignore the unused probe')])
    assert.throws(() => historicalCaptureRunnerDigest(changed), /Exact approved transition/)
  assert.notEqual(historicalCaptureRunnerDigest(source.replace("Browser deadline exceeded", "Ignore browser deadline")), pin)
})
test('current matrix removes only one exact mandatory corpse row when checking legacy eleven', () => {
  const text = read('.github/workflows/tutorial-browser.yml')
  assert.equal(priorMatrixWithoutCorpse(text).length, 11)
  for (const mutate of [
    job => { job.strategy.matrix.include = job.strategy.matrix.include.filter(row => row.scenario !== 'follower-corpse') },
    job => { job.strategy.matrix.include.push(job.strategy.matrix.include.find(row => row.scenario === 'follower-corpse')) },
    job => { job.strategy.matrix.include.find(row => row.scenario === 'follower-corpse').timeoutMinutes = 20 },
    job => { job.if = 'false' }, job => { job['continue-on-error'] = true },
  ]) {
    const workflow = yaml.load(text); mutate(workflow.jobs['tutorial-browser'])
    assert.throws(() => priorMatrixWithoutCorpse(yaml.dump(workflow)))
  }
})
