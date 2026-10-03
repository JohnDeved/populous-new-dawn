import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { repositoryCheckCoverage } from '../scripts/orchestration/cli.mjs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('retired status and binding commands are not exposed or coupled to verification', () => {
  const { scripts } = JSON.parse(read('package.json'))
  for (const command of ['progress', 'closeout']) {
    assert.equal(Object.hasOwn(scripts, `orchestration:${command}`), false)
  }
  for (const file of ['progress', 'worker-closeout']) {
    assert.equal(existsSync(new URL(`../scripts/orchestration/${file}.mjs`, import.meta.url)), false)
  }
  for (const file of ['prepare', 'verify']) {
    assert.doesNotMatch(read(`scripts/orchestration/${file}.mjs`), /observeProgress|deliveryClock/)
  }
  assert.match(read('.codex/config.toml'), /^max_concurrent_threads_per_session = 6$/m)
})

test('live aggregate coverage includes every maintained workflow integrity suite', () => {
  const { checks } = JSON.parse(read('engineering/checks.json'))
  assert.deepEqual(checks.find(check => check.id === 'orchestration-tests').args, [
    '--test', 'tests/orchestration.test.mjs', 'tests/workflow-handoff.test.mjs',
    'tests/workflow-policy.test.mjs',
  ])
  for (const id of ['orchestration-tests', 'repository-check']) {
    assert.ok(checks.find(check => check.id === id).inputs.includes('.codex/config.toml'),
      `${id} must fingerprint the configuration read by this suite`)
  }
  assert.deepEqual(repositoryCheckCoverage(process.cwd()), [
    'orchestration-tests', 'orchestration-structural',
  ])
})
