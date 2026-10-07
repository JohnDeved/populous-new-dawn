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

// Cheap screening must select actual changed files and retain the existing budget tests.
test('preflight reuses format, lint, and the unchanged context contracts', async () => {
  const { preflightCommands } = await import('../scripts/orchestration/preflight.mjs')
  assert.deepEqual(preflightCommands(['app/a.ts', 'tests/a.test.mjs', 'app/a.ts', 'docs.md']), [
    ['node_modules/.bin/oxfmt', '--check', '--', 'app/a.ts'],
    ['node_modules/.bin/oxlint', '--deny-warnings', '--', 'app/a.ts'],
    ['node_modules/.bin/eslint', '--max-warnings', '0', '--', 'app/a.ts', 'tests/a.test.mjs'],
    ['node', 'scripts/orchestration/cli.mjs', 'check'],
    ['node', '--test', '--test-name-pattern=context', 'tests/orchestration.test.mjs'],
  ])
  assert.equal(preflightCommands(['docs.md']).length, 2)
  assert.equal(preflightCommands(['-odd file.mjs'])[0].at(-2), '--')
})

test('preflight stops on findings or unavailable tools rather than claiming a pass', async () => {
  const { runPreflight } = await import('../scripts/orchestration/preflight.mjs')
  const attempts = []
  const findings = runPreflight(process.cwd(), 'HEAD', (command, args) => {
    attempts.push([command, ...args])
    return { status: 1, signal: null }
  })
  assert.equal(attempts.length, 1)
  assert.equal(findings.status, 'failed')
  assert.equal(findings.finalGate, false)
  const unavailable = runPreflight(process.cwd(), 'HEAD', () => ({
    status: null, error: new Error('ENOENT: missing lane installation'),
  }))
  assert.equal(unavailable.status, 'blocked')
  assert.match(unavailable.results[0].error, /missing lane/)
  assert.throws(() => runPreflight(process.cwd(), ''), /Requires --base/)
})
