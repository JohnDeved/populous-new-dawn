import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
    'tests/workflow-policy.test.mjs', 'tests/research-evidence.test.mjs', 'tests/theme-reference-evidence.test.mjs', 'tests/test-runner.test.mjs',
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

function whitespaceFixture(t) {
  const repo = mkdtempSync(join(tmpdir(), 'pnd-preflight-'))
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout.trim()
  }
  git('init', '-q')
  git('config', 'user.name', 'Preflight test')
  git('config', 'user.email', 'preflight@example.invalid')
  git('config', 'core.whitespace', 'blank-at-eol,blank-at-eof,space-before-tab')
  writeFileSync(join(repo, 'history.txt'), 'old trailing   \nkeep\n')
  writeFileSync(join(repo, 'changed.txt'), 'clean\n')
  git('add', '.')
  git('commit', '-qm', 'base')
  return { repo, git, base: git('rev-parse', 'HEAD') }
}

async function inspectWhitespace(repo, base) {
  const { runPreflight } = await import('../scripts/orchestration/preflight.mjs')
  const attempts = []
  const result = runPreflight(repo, base, (command, args, options) => {
    attempts.push([command, ...args])
    // Exercise real Git; unrelated repository validators need the actual checkout.
    return command === 'git'
      ? spawnSync(command, args, { ...options, stdio: 'pipe', encoding: 'utf8' })
      : { status: 0 }
  })
  return { ...result, attempts }
}

for (const source of ['branch', 'staged', 'unstaged', 'untracked']) {
  test(`preflight catches ${source} whitespace before lint/tests without changing files`, async t => {
    const { repo, git, base } = whitespaceFixture(t)
    const path = source === 'untracked' ? '-new file.txt' : 'changed.txt'
    writeFileSync(join(repo, path), 'clean\n    \n')
    if (source === 'branch' || source === 'staged') git('add', '--', path)
    if (source === 'branch') git('commit', '-qm', 'whitespace')
    // An unstaged repair does not conceal index/branch defects.
    if (source === 'branch' || source === 'staged') writeFileSync(join(repo, path), 'clean\n')
    const before = readFileSync(join(repo, path))
    const statusBefore = git('status', '--porcelain=v1')
    const result = await inspectWhitespace(repo, base)
    assert.equal(result.status, 'failed')
    assert.equal(result.finalGate, false)
    assert.ok(result.attempts.every(command => command[0] === 'git'))
    const expected = { branch: 1, staged: 2, unstaged: 3, untracked: 4 }[source]
    assert.equal(result.attempts.length, expected)
    assert.deepEqual(readFileSync(join(repo, path)), before)
    assert.equal(git('status', '--porcelain=v1'), statusBefore)
  })
}

test('preflight allows clean changes, historical whitespace, deletions, binaries and local symlinks', async t => {
  const { repo, git, base } = whitespaceFixture(t)
  writeFileSync(join(repo, 'history.txt'), 'old trailing   \nkeep\nnew clean line\n')
  rmSync(join(repo, 'changed.txt'))
  writeFileSync(join(repo, 'binary.dat'), Buffer.from([0, 32, 32, 10]))
  git('add', '.')
  git('commit', '-qm', 'clean branch and deletion')
  symlinkSync('history.txt', join(repo, 'tracked-link'))
  git('add', 'tracked-link')
  symlinkSync('history.txt', join(repo, 'untracked-link'))
  writeFileSync(join(repo, 'untracked-binary.dat'), Buffer.from([0, 32, 32, 10]))
  writeFileSync(join(repo, '-clean file.txt'), 'clean\n')
  writeFileSync(join(repo, 'empty.txt'), '')
  const result = await inspectWhitespace(repo, base)
  assert.equal(result.status, 'passed')
  assert.ok(!result.paths.includes('changed.txt'))
  assert.equal(result.attempts.filter(command => command[0] === 'git').length, 6)
  assert.ok(!result.attempts.some(command => command.includes('untracked-link')))
  assert.deepEqual(result.attempts.at(-1),
    ['node', '--test', '--test-name-pattern=context', 'tests/orchestration.test.mjs'])
})

test('preflight retains path safety and rejects an invalid base before executing commands', async t => {
  const { repo, base } = whitespaceFixture(t)
  const { runPreflight } = await import('../scripts/orchestration/preflight.mjs')
  let calls = 0
  const execute = () => { calls++; return { status: 0 } }
  assert.throws(() => runPreflight(repo, 'missing-base', execute), /Base ref is not a commit/)
  symlinkSync(tmpdir(), join(repo, 'outside-link'))
  assert.throws(() => runPreflight(repo, base, execute), /outside repository/)
  assert.equal(calls, 0)
})

test('preflight whitespace checks work in an isolated linked worktree', async t => {
  const { repo, git, base } = whitespaceFixture(t)
  const worktree = join(repo, 'linked')
  git('worktree', 'add', '--detach', worktree, base)
  writeFileSync(join(worktree, 'changed.txt'), 'new trailing   \n')
  const result = await inspectWhitespace(worktree, base)
  assert.equal(result.status, 'failed')
  assert.equal(result.attempts.length, 3)
  assert.equal(readFileSync(join(repo, 'changed.txt'), 'utf8'), 'clean\n')
})


test('preflight does not mistake a no-index access error for a clean difference', async t => {
  const { repo, base } = whitespaceFixture(t)
  const { runPreflight } = await import('../scripts/orchestration/preflight.mjs')
  writeFileSync(join(repo, 'vanishing.txt'), 'clean\n')
  const attempts = []
  const result = runPreflight(repo, base, (command, args, options) => {
    attempts.push([command, ...args])
    if (args.includes('--no-index')) rmSync(join(repo, 'vanishing.txt'))
    return spawnSync(command, args, { ...options, stdio: 'pipe', encoding: 'utf8' })
  })
  assert.equal(result.results.at(-1).exitCode, 1)
  assert.equal(result.status, 'failed')
  assert.equal(attempts.length, 4)
  assert.ok(attempts.every(command => command[0] === 'git'))
})

// The aggregate gate and the intentionally partial editing loop are distinct.
test('bounded test entrypoints preserve aggregate coverage and keep focus explicit', () => {
  const { scripts } = JSON.parse(read('package.json'))
  assert.equal(scripts.test, 'node scripts/orchestration/test-runner.mjs all')
  assert.equal(scripts['test:focus'], 'node scripts/orchestration/test-runner.mjs focus')
  assert.equal(scripts['test:serial'], 'node scripts/orchestration/test-runner.mjs serial')
  assert.equal(scripts.check, 'npm run typecheck && npm test && npm run parity:check && npm run orchestration:check')
})

test('focused suggestions are advisory and broad or unknown changes fall back to the full suite', async () => {
  const { focusedTestFeedback } = await import('../scripts/orchestration/cli.mjs')
  const make = (path, status = 'M', unknown = false) => focusedTestFeedback({
    changes: [{ path, status, endpoint: 'path' }], unknownPaths: unknown ? [path] : [],
    checks: [{ command: ['node', '--test', 'tests/a.test.mjs'] }],
  })
  const focused = make('app/narrow.ts')
  assert.deepEqual(focused.command, ['npm', 'run', 'test:focus', '--', 'tests/a.test.mjs'])
  assert.equal(focused.finalGate, false)
  assert.equal(focused.fullVerificationRequired, true)
  assert.deepEqual(make('tests/new.test.mjs', 'A', true).command, ['npm', 'run', 'test:focus', '--', 'tests/a.test.mjs', 'tests/new.test.mjs'])
  for (const path of ['app/model.ts', 'app/scene.ts', 'package-lock.json', 'tests/support/helper.mjs', 'scripts/new.mjs'])
    assert.deepEqual(make(path).command, ['npm', 'test'])
  assert.deepEqual(make('app/unmapped.ts', 'M', true).command, ['npm', 'test'])
  assert.deepEqual(make('tests/deleted.test.mjs', 'D').command, ['npm', 'test'])
  assert.equal(focusedTestFeedback({ changes: [], unknownPaths: [], checks: [] }).command, null)
})
