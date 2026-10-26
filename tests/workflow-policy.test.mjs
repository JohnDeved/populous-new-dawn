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
    '--test', 'tests/orchestration.test.mjs', 'tests/workflow-handoff.test.mjs', 'tests/receipt-streams.test.mjs',
    'tests/receipt-raw-budget.test.mjs', 'tests/receipt-budget-failures.test.mjs', 'tests/command-log.test.mjs',
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
  assert.equal(scripts.check, 'pnpm run typecheck && pnpm test && pnpm run parity:check && pnpm run orchestration:check')
})

test('focused suggestions are advisory and broad or unknown changes fall back to the full suite', async () => {
  const { focusedTestFeedback } = await import('../scripts/orchestration/cli.mjs')
  const make = (path, status = 'M', unknown = false) => focusedTestFeedback({
    changes: [{ path, status, endpoint: 'path' }], unknownPaths: unknown ? [path] : [],
    checks: [{ command: ['node', '--test', 'tests/a.test.mjs'] }],
  }, [
    ...JSON.parse(read('engineering/project-map.json')).crossCutting.map(entry => entry.path),
    ...JSON.parse(read('engineering/project-map.json')).subsystems.flatMap(subsystem => subsystem.sharedPaths),
  ])
  const focused = make('app/narrow.ts')
  assert.deepEqual(focused.command, ['npm', 'run', 'test:focus', '--', 'tests/a.test.mjs'])
  assert.equal(focused.finalGate, false)
  assert.equal(focused.fullVerificationRequired, true)
  assert.deepEqual(make('tests/new.test.mjs', 'A', true).command, ['npm', 'run', 'test:focus', '--', 'tests/a.test.mjs', 'tests/new.test.mjs'])
  for (const path of ['app/model.ts', 'app/scene.ts', 'app/world-state.ts', 'app/world-types.ts', 'package-lock.json', 'tests/support/helper.mjs', 'scripts/new.mjs'])
    assert.deepEqual(make(path).command, ['npm', 'test'])
  assert.deepEqual(make('app/unmapped.ts', 'M', true).command, ['npm', 'test'])
  assert.deepEqual(make('tests/deleted.test.mjs', 'D').command, ['npm', 'test'])
  assert.equal(focusedTestFeedback({ changes: [], unknownPaths: [], checks: [] }).command, null)
})

// Structural contracts complement, but never replace, hosted lifecycle evidence.
test('ready-PR sharded gate is exhaustive, fail-closed and least privilege', () => {
  const workflow = read('.github/workflows/ready-pr-check.yml')
  assert.match(workflow, /^name: Ready PR checks$/m)
  assert.equal(workflow.match(/^on:\n([\s\S]*?)\n\n/m)?.[1],
    '  pull_request:\n    branches: [main]\n    types: [ready_for_review]')
  assert.match(workflow, /^permissions:\n {2}contents: read\n/m)
  assert.match(workflow, /^concurrency:\n {2}group: .+\n {2}cancel-in-progress: true$/m)
  assert.deepEqual([...workflow.matchAll(/^ {2}([a-z-]+):$/gm)].map(match => match[1]).filter(name => ['quality', 'test-shards', 'full-check'].includes(name)), ['quality', 'test-shards', 'full-check'])
  assert.match(workflow, /needs: \[quality, test-shards\]\n {4}if: \$\{\{ always\(\) \}\}/)
  assert.equal((workflow.match(/^\s*if:/gm) ?? []).length, 3)
  assert.match(workflow, /fail-fast: false\n {6}max-parallel: 4/)
  assert.deepEqual([...workflow.matchAll(/- \{ index: (\d), label: (\d) \}/g)].map(match => [Number(match[1]), Number(match[2])]), [[0, 1], [1, 2], [2, 3], [3, 4]])
  assert.doesNotMatch(workflow, /^\s*(?:paths|paths-ignore|push|pull_request_target|workflow_run|environment|secrets|run-id|github-token):/m)
  assert.doesNotMatch(workflow, /\$\{\{\s*secrets\.|actions\/cache@|--if-present|(?:npm|pnpm|\$PND_PACKAGE_MANAGER) run (?:deploy|parity:record)|run: npm run check/)
  const pins = new Map([
    ['actions/checkout', '3d3c42e5aac5ba805825da76410c181273ba90b1'],
    ['actions/setup-node', '949feb2413d6458794dcd2491c4babbbce0c15c1'],
    ['actions/setup-python', '5fda3b95a4ea91299a34e894583c3862153e4b97'],
    ['actions/upload-artifact', 'ea165f8d65b6e75b540449e92b4886f43607fa02'],
    ['actions/download-artifact', 'd3f86a106a0bac45b974a628896c90dbdf5c8093'],
  ])
  const actions = [...workflow.matchAll(/uses: ([\w/-]+)@([^ ]+)/g)]
  // One separate generated-only CMS artifact; full-check stays receipt-only.
  assert.equal(actions.length, 17)
  for (const [, action, sha] of actions) assert.equal(sha, pins.get(action))
  for (const value of ['ref: ${{ github.sha }}', 'persist-credentials: false', "node-version: '24.19.0'", "python-version: '3.12.14'", 'npm ci --no-audit --no-fund', 'pnpm install --frozen-lockfile --ignore-scripts', '--require-hashes -r engineering/ci-python-requirements.txt'])
    assert.equal(workflow.split(value).length - 1, 4, value)
  for (const command of ['typecheck', 'parity:check', 'orchestration:check', 'build'])
    assert.equal(workflow.split(`run: $PND_PACKAGE_MANAGER run ${command}\n`).length - 1, 1, command)
  assert.match(workflow, /shard --shard-index=\$\{\{ matrix.index \}\} --shard-count=4 --receipt=work\/ci\/shard.json/)
  assert.match(workflow, /pattern: full-check-\$\{\{ github.run_id \}\}-\$\{\{ github.run_attempt \}\}-\*/)
  assert.match(workflow, /merge-multiple: false/)
  assert.equal((workflow.match(/if-no-files-found: error/g) ?? []).length, 3)
  assert.match(workflow, /run: test "\$QUALITY_RESULT" = success && test "\$SHARDS_RESULT" = success/)
  assert.match(workflow, /run: node scripts\/orchestration\/ci-gate.mjs aggregate work\/ci\/receipts work\/ci\/full-check.json/)
  assert.match(read('engineering/ci-python-requirements.txt'), /^Pillow==12\.3\.0 --hash=sha256:[a-f0-9]{64}$/m)
  const { checks } = JSON.parse(read('engineering/checks.json'))
  for (const id of ['orchestration-tests', 'repository-check'])
    assert.ok(checks.find(check => check.id === id).inputs.includes('.github/workflows/ready-pr-check.yml'))
})

test('draft readiness guard fails closed before checkout, installation or full tests', () => {
  const workflow = read('.github/workflows/ready-pr-check.yml')
  const guard = workflow.match(/ {4}steps:\n(?: {6}#.*\n)* {6}- name: Require a ready pull request\n {8}env:\n {10}IS_DRAFT: \$\{\{ toJSON\(github.event.pull_request.draft\) \}\}\n {8}run: \|\n((?: {10}[^\n]*\n)+)/)?.[1]
  assert.ok(guard, 'readiness guard must be the first step')
  const script = guard.replace(/^ {10}/gm, '')
  for (const value of [false, true, undefined, null, '', 'false', 'False', 'true', 0, [], {}]) {
    const status = value === false ? 0 : 1
    const result = spawnSync('bash', ['-e', '-c', script], {
      env: { ...process.env, IS_DRAFT: JSON.stringify(value) ?? '' }, encoding: 'utf8',
    })
    assert.equal(result.error, undefined)
    assert.equal(result.status, status, result.stderr)
    if (status) assert.match(result.stdout, /Draft PR: full checks have not run/)
  }
})

// Evaluate only this workflow's small expression subset against event fixtures.
// These contracts cannot establish GitHub scheduling or required-check selection.
function admission(draft, overrides = {}) {
  const workflow = read('.github/workflows/ready-pr-check.yml')
  const context = {
    'github.workflow': 'Ready PR checks', 'github.event.pull_request.number': 123,
    'github.event.pull_request.head.sha': '1'.repeat(40),
    'github.event.pull_request.base.sha': '2'.repeat(40), 'github.sha': '3'.repeat(40),
    ...overrides,
  }
  const render = template => template.replace(/\$\{\{ (.*?) \}\}/g, (_, expression) => {
    const choice = expression.match(/^toJSON\(github.event.pull_request.draft\) == 'false' && '([^']+)' \|\| '([^']+)'$/)
    if (choice) return JSON.stringify(draft) === 'false' ? choice[1] : choice[2]
    assert.ok(Object.hasOwn(context, expression), `unreviewed expression: ${expression}`)
    return context[expression]
  })
  return {
    name: render(workflow.match(/^ {4}name: (\$\{\{ toJSON.+)$/m)[1]),
    group: render(workflow.match(/^ {2}group: (.+)$/m)[1]),
  }
}

test('only boolean-ready events publish Full check; stale or malformed draft admission is separate', () => {
  const ready = admission(false)
  assert.equal(ready.name, 'Full check')
  assert.equal(ready.group, `Ready PR checks-123-${'1'.repeat(40)}-${'2'.repeat(40)}-${'3'.repeat(40)}-ready`)
  for (const value of [true, undefined, null, '', 'false', 'False', 0, [], {}]) {
    const draft = admission(value)
    assert.equal(draft.name, 'Draft PR (not validated)')
    assert.notEqual(draft.group, ready.group)
    assert.ok(draft.group.endsWith('-draft'))
  }
})

test('old heads, bases and merge SHAs cannot share current-candidate cancellation or pending replacement', () => {
  for (const draft of [false, true]) {
    const current = admission(draft)
    for (const key of ['github.event.pull_request.head.sha', 'github.event.pull_request.base.sha', 'github.sha']) {
      assert.notEqual(admission(draft, { [key]: '4'.repeat(40) }).group, current.group, key)
    }
    assert.notEqual(admission(draft, { 'github.event.pull_request.number': 124 }).group, current.group)
    assert.notEqual(admission(draft, { 'github.workflow': 'Another workflow' }).group, current.group)
  }
})

test('repeated transitions and three overlapping admissions retain separate candidate and draft groups', () => {
  const ready = admission(false), staleDraft = admission(true)
  const oldReady = admission(false, { 'github.event.pull_request.base.sha': '4'.repeat(40) })
  assert.equal(new Set([ready.group, staleDraft.group, oldReady.group]).size, 3)
  for (const sequence of [[false, true, false], [true, false, true], [false, false, true, false]]) {
    for (const draft of sequence) assert.deepEqual(admission(draft), draft ? staleDraft : ready)
  }
  // Same-candidate ready duplicates may supersede each other; each still runs the full gate.
  assert.equal(admission(false).group, ready.group)
})

test('aggregate dependency guard rejects missing, failed, skipped and cancelled jobs', () => {
  const workflow = read('.github/workflows/ready-pr-check.yml')
  const script = workflow.match(/run: (test "\$QUALITY_RESULT"[^\n]+)/)[1]
  for (const quality of ['success', 'failure', 'cancelled', 'skipped', '']) {
    for (const shards of ['success', 'failure', 'cancelled', 'skipped', '']) {
      const result = spawnSync('bash', ['-e', '-c', script], {
        env: { ...process.env, QUALITY_RESULT: quality, SHARDS_RESULT: shards }, encoding: 'utf8',
      })
      assert.equal(result.status, quality === 'success' && shards === 'success' ? 0 : 1)
    }
  }
})

test('one activation diagnostic compares the unchanged legacy test suite without replacing coverage', () => {
  const workflow = read('.github/workflows/ready-pr-check.yml')
  const baseline = workflow.split('  benchmark-baseline:\n')[1]
  assert.ok(baseline)
  assert.match(baseline, /^ {4}name: Legacy test baseline \(diagnostic\)$/m)
  assert.match(baseline, /^ {4}needs: full-check$/m)
  assert.match(baseline, /^ {4}if: \$\{\{ github.event.pull_request.number == 516 && needs.full-check.result == 'success' \}\}$/m)
  assert.match(baseline, /PYTHONDONTWRITEBYTECODE: '1'/)
  assert.match(baseline, /- name: Legacy full test suite\n {8}run: \$PND_PACKAGE_MANAGER test/)
  assert.equal((workflow.match(/run: \$PND_PACKAGE_MANAGER test$/gm) ?? []).length, 1)
  assert.doesNotMatch(baseline, /(?:npm|pnpm|\$PND_PACKAGE_MANAGER) run (?:check|build|typecheck|parity:check|orchestration:check)|upload-artifact/)
  assert.match(baseline, /ci-gate.mjs baseline work\/ci\/before.json work\/ci\/baseline.json/)
  assert.match(workflow.split('  full-check:\n')[1].split('  benchmark-baseline:')[0], /needs: \[quality, test-shards\]/)
})


test('timing upload is optional and isolated from mandatory acceptance artifacts', () => {
  const workflow = read('.github/workflows/ready-pr-check.yml')
  const block = workflow.match(/ {6}- name: Upload optional per-file timing diagnostics\n([\s\S]*?)\n {2}full-check:/)?.[1]
  assert.ok(block)
  assert.match(block, /if: \$\{\{ always\(\) && \(steps.shard.outcome == 'success' \|\| steps.shard.outcome == 'failure'\) \}\}/)
  assert.match(block, /continue-on-error: true/)
  assert.equal((workflow.match(/continue-on-error:/g) ?? []).length, 1)
  assert.match(block, /name: test-timings-\$\{\{ github.run_id \}\}-\$\{\{ github.run_attempt \}\}-shard-\$\{\{ matrix.label \}\}/)
  assert.deepEqual([...block.matchAll(/^ {12}(work\/ci\/[^\n]+)$/gm)].map(match => match[1]),
    ['work/ci/before.json', 'work/ci/shard.json', 'work/ci/receipt.json', 'work/ci/timings/*.jsonl'])
  assert.match(block, /if-no-files-found: warn/)
  assert.match(block, /retention-days: 7/)
  assert.doesNotMatch(block, /full-check-|run:/)
  assert.match(workflow, /name: Run test shard\n {8}id: shard\n {8}run: node scripts\/orchestration\/test-runner.mjs shard --shard-index=\$\{\{ matrix.index \}\} --shard-count=4 --receipt=work\/ci\/shard.json --timings=summary-v1\n/)
  for (const name of ['quality', 'shard']) {
    const required = workflow.match(new RegExp(`      - name: Upload ${name} receipt\\n([\\s\\S]*?)(?=\\n {6}- |\\n {2}[a-z])`))?.[1]
    assert.ok(required)
    assert.match(required, /path: work\/ci\/receipt.json/)
    assert.doesNotMatch(required, /continue-on-error|timings/)
  }
})
