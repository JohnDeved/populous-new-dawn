import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import {
  ROOT,
  auditContract,
  buildIndex,
  changedPaths,
  contextPacket,
  fingerprintPaths,
  loadOrBuildIndex,
  parseMarkdown,
  planChanges,
  safeRepoPath,
  validateContract,
  validateRepository,
} from '../scripts/orchestration/cli.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
const put = (repo, path, value) => {
  mkdirSync(dirname(join(repo, path)), { recursive: true })
  writeFileSync(
    join(repo, path),
    typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`
  )
}
const run = (repo, ...args) => execFileSync(args.shift(), args, { cwd: repo, encoding: 'utf8' })

function fixtureRepo() {
  const repo = mkdtempSync(join(tmpdir(), 'pnd-orchestration-'))
  put(repo, '.gitignore', 'work/\n')
  put(repo, 'package.json', '{"type":"module"}\n')
  put(repo, 'AGENTS.md', '# Instructions\n\n## Safe work\nKeep evidence limits.\n')
  put(
    repo,
    'GOAL.md',
    '# Goal\n\n## Current execution order: group movement and native selection\nSelection remains incomplete.\n'
  )
  put(repo, 'engineering/README.md', '# Workflow\n')
  put(repo, 'engineering/contracts.md', '# Contract\n')
  put(
    repo,
    '.agents/skills/populous-engineering/SKILL.md',
    '---\nname: populous-engineering\ndescription: test\n---\n# Skill\n'
  )
  put(repo, 'docs.md', '# Evidence\n\nSuccess is bounded. Integration remains open.\n')
  put(
    repo,
    'app/a.ts',
    `export const a = 1\n${Array.from({ length: 39 }, (_, index) => `// line ${index + 2}`).join('\n')}\n`
  )
  put(repo, 'app/shared.ts', 'export const shared = 1\n')
  put(repo, 'app/u.ts', 'export const u = 1\n')
  put(repo, 'misc/old name.txt', 'old\n')
  put(repo, 'misc/delete.txt', 'delete\n')
  put(repo, 'tests/a.test.mjs', 'export {}\n')
  put(repo, 'generated.txt', 'generated\n')
  put(repo, 'parity.json', {
    revision: 1,
    discovery: { status: 'open', note: 'Open.', evidence: [] },
    groups: [
      {
        id: 'group',
        title: 'Group',
        items: [
          {
            id: 'group.item',
            title: 'Item',
            status: 'partial',
            note: 'A bounded part works. Full integration remains open.',
            evidence: ['docs.md'],
            requirements: [
              {
                id: 'group.item.part',
                title: 'Part',
                status: 'partial',
                note: 'Still incomplete.',
                evidence: ['docs.md'],
              },
            ],
          },
        ],
      },
    ],
  })
  put(repo, 'engineering/checks.json', {
    version: 1,
    checks: [
      {
        id: 'portable',
        kind: 'portable',
        purpose: 'Portable check',
        coveredBehavior: ['Rules'],
        knownLimits: ['Not integration'],
        executable: 'node',
        args: ['--test', 'tests/a.test.mjs'],
        cwd: '.',
        env: [],
        inputs: ['app/a.ts'],
        prerequisites: ['Node'],
        sideEffects: [],
        resources: [],
        expected: { exitCode: 0, artifacts: [] },
      },
      {
        id: 'native',
        kind: 'native',
        purpose: 'Native check',
        coveredBehavior: ['Native cases'],
        knownLimits: ['Supplied world'],
        executable: 'python3',
        args: ['native.py', '$NEED_EXE'],
        cwd: '.',
        env: ['NEED_EXE'],
        inputs: ['docs.md'],
        prerequisites: ['Executable'],
        sideEffects: [],
        resources: [],
        expected: { exitCode: 0, artifacts: [] },
      },
      {
        id: 'repository-check',
        kind: 'portable',
        purpose: 'General check',
        coveredBehavior: ['General'],
        knownLimits: ['Not native'],
        executable: 'node',
        args: ['--test'],
        cwd: '.',
        env: [],
        inputs: ['app'],
        prerequisites: ['Node'],
        sideEffects: [],
        resources: [],
        expected: { exitCode: 0, artifacts: [] },
      },
      {
        id: 'production-build',
        kind: 'build',
        purpose: 'Build',
        coveredBehavior: ['Build'],
        knownLimits: ['Not behavior'],
        executable: 'node',
        args: ['--check', 'app/a.ts'],
        cwd: '.',
        env: [],
        inputs: ['app'],
        prerequisites: ['Node'],
        sideEffects: [],
        resources: [],
        expected: { exitCode: 0, artifacts: [] },
      },
      {
        id: 'orchestration-tests',
        kind: 'metadata',
        purpose: 'Workflow tests',
        coveredBehavior: ['Workflow'],
        knownLimits: ['Synthetic'],
        executable: 'node',
        args: ['--test'],
        cwd: '.',
        env: [],
        inputs: ['engineering'],
        prerequisites: ['Node'],
        sideEffects: [],
        resources: [],
        expected: { exitCode: 0, artifacts: [] },
      },
      {
        id: 'orchestration-structural',
        kind: 'metadata',
        purpose: 'Workflow check',
        coveredBehavior: ['Manifests'],
        knownLimits: ['Structural'],
        executable: 'node',
        args: ['--check', 'app/a.ts'],
        cwd: '.',
        env: [],
        inputs: ['engineering'],
        prerequisites: ['Node'],
        sideEffects: [],
        resources: [],
        expected: { exitCode: 0, artifacts: [] },
      },
    ],
  })
  put(repo, 'engineering/generated-files.json', {
    version: 1,
    owners: [
      {
        id: 'generated',
        kind: 'fixture',
        generator: { executable: 'node', args: ['generator.mjs'] },
        callers: ['package.json'],
        inputs: ['app/a.ts'],
        outputs: [{ path: 'generated.txt', type: 'file', tracked: true, protected: true }],
        recording: 'Explicit only.',
      },
    ],
  })
  put(repo, 'engineering/project-map.json', {
    version: 1,
    subsystems: [
      {
        id: 'selection',
        title: 'Selection',
        mappingStatus: 'reviewed',
        implementationPaths: ['app/a.ts'],
        researchPaths: [],
        sharedPaths: ['app/shared.ts'],
        entrySymbols: [{ path: 'app/a.ts', symbol: 'a' }],
        parityIds: ['group.item.part'],
        evidence: [{ path: 'docs.md', heading: 'Evidence' }],
        nativeAddresses: ['0x1234'],
        checkIds: ['portable', 'native'],
        generatedInputIds: ['generated'],
        risks: ['Shared state'],
        unresolved: ['Integration remains open'],
      },
    ],
    crossCutting: [{ path: 'app/shared.ts', subsystemIds: ['selection'], checkIds: ['native'] }],
    unmappedAreas: [
      { id: 'unknown', mappingStatus: 'unmapped', paths: ['app/u.ts'], note: 'Not reviewed.' },
    ],
  })
  run(repo, 'git', 'init', '-q')
  run(repo, 'git', 'config', 'user.email', 'test@example.com')
  run(repo, 'git', 'config', 'user.name', 'Test')
  run(repo, 'git', 'add', '.')
  run(repo, 'git', 'commit', '-qm', 'fixture')
  return repo
}

function withRepo(fn) {
  const repo = fixtureRepo()
  try {
    return fn(repo)
  } finally {
    rmSync(repo, { recursive: true, force: true })
  }
}

test('Markdown sections retain ancestry, repetitions, CRLF boundaries, and ignore fenced headings', () => {
  const sections = parseMarkdown(
    '# Root\r\n```md\r\n## Fake\r\n```\r\n## Child\r\n### Repeat\r\none\r\n### Repeat\r\ntwo\r\n## Next\r\nend\r\n',
    'x.md'
  )
  assert.deepEqual(
    sections.map(section => section.headingTrail),
    [
      ['Root'],
      ['Root', 'Child'],
      ['Root', 'Child', 'Repeat'],
      ['Root', 'Child', 'Repeat'],
      ['Root', 'Next'],
    ]
  )
  assert.deepEqual(
    sections.map(section => section.occurrence),
    [1, 1, 1, 2, 1]
  )
  assert.deepEqual(
    sections.map(section => [section.lineStart, section.lineEnd]),
    [
      [1, 4],
      [5, 5],
      [6, 7],
      [8, 9],
      [10, 12],
    ]
  )
  assert.notEqual(sections[2].id, sections[3].id)
})

test('manifest validation accepts reviewed data and rejects duplicate IDs, missing paths, invalid parity references, and unsafe paths', () =>
  withRepo(repo => {
    assert.equal(validateRepository(repo).subsystemIds.has('selection'), true)
    assert.equal(run(repo, 'git', 'status', '--porcelain'), '')
    const checksPath = join(repo, 'engineering/checks.json')
    const checks = JSON.parse(readFileSync(checksPath))
    checks.checks.push({ ...checks.checks[0] })
    put(repo, 'engineering/checks.json', checks)
    assert.throws(() => validateRepository(repo), /Duplicate check id/)
    checks.checks.pop()
    put(repo, 'engineering/checks.json', checks)
    const mapPath = join(repo, 'engineering/project-map.json')
    const map = JSON.parse(readFileSync(mapPath))
    map.subsystems[0].implementationPaths.push('app/missing.ts')
    put(repo, 'engineering/project-map.json', map)
    assert.throws(() => validateRepository(repo), /Missing repository path/)
    map.subsystems[0].implementationPaths.pop()
    map.subsystems[0].entrySymbols[0].symbol = 'missingSymbol'
    put(repo, 'engineering/project-map.json', map)
    assert.throws(() => validateRepository(repo), /missing entry symbol/)
    map.subsystems[0].entrySymbols[0].symbol = 'a'
    map.subsystems[0].parityIds = ['group.nope']
    put(repo, 'engineering/project-map.json', map)
    assert.throws(() => validateRepository(repo), /unknown parity ID/)
    map.subsystems[0].parityIds = ['group.item.part']
    map.subsystems[0].checkIds = ['missing-check']
    put(repo, 'engineering/project-map.json', map)
    assert.throws(() => validateRepository(repo), /unknown check/)
    assert.throws(() => safeRepoPath(repo, '../escape'), /Non-canonical|escapes/)
    const outside = mkdtempSync(join(tmpdir(), 'pnd-orchestration-outside-'))
    try {
      put(outside, 'leak.ts', 'secret\n')
      symlinkSync(join(outside, 'leak.ts'), join(repo, 'app/leak.ts'))
      assert.throws(() => safeRepoPath(repo, 'app/leak.ts'), /resolves outside repository/)
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  }))

test('index is deterministic, clean without a cache, ignored when written, and regenerates after source changes', () =>
  withRepo(repo => {
    const first = buildIndex(repo)
    const second = buildIndex(repo)
    assert.deepEqual(second, first)
    assert.equal(JSON.stringify(first).includes('timestamp'), false)
    assert.equal(loadOrBuildIndex(repo).cache, 'generated-missing')
    assert.equal(run(repo, 'git', 'status', '--porcelain'), '')
    assert.equal(loadOrBuildIndex(repo).cache, 'valid')
    appendFileSync(join(repo, 'docs.md'), '\n## New\nChanged.\n')
    assert.equal(loadOrBuildIndex(repo).cache, 'regenerated-stale')
  }))

test('index and context reject an indexed source symlink that escapes the repository', () =>
  withRepo(repo => {
    const outside = mkdtempSync(join(tmpdir(), 'pnd-orchestration-outside-'))
    try {
      put(outside, 'instructions.md', '# External\nsecret\n')
      rmSync(join(repo, 'AGENTS.md'))
      symlinkSync(join(outside, 'instructions.md'), join(repo, 'AGENTS.md'))
      assert.throws(() => buildIndex(repo), /resolves outside repository/)
      assert.throws(
        () => contextPacket(repo, { subsystem: 'selection' }),
        /resolves outside repository/
      )
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  }))

test('repository validation requires one current top-level execution-order heading', () =>
  withRepo(repo => {
    put(repo, 'GOAL.md', '# Goal\n\n## Historical\nOld.\n')
    assert.throws(() => validateRepository(repo), /exactly one top-level Current execution order/)
    put(
      repo,
      'GOAL.md',
      '# Goal\n\n## Current execution order: one\nA.\n\n## Current execution order: two\nB.\n'
    )
    assert.throws(() => validateRepository(repo), /exactly one top-level Current execution order/)
  }))

test('context returns bounded provenance, limitations, checks, and visible source truncation', () =>
  withRepo(repo => {
    put(
      repo,
      'docs.md',
      `# Evidence\n\nCurrent evidence is bounded.\n${Array.from({ length: 100 }, (_, index) => `line ${index}`).join('\n')}\n## Second evidence\nStill partial.\n## Third evidence\nIntegration remains open.\n## Byte-bound evidence\n${'Success detail. '.repeat(50)}\nBrowser integration remains open.\n`
    )
    put(
      repo,
      'app/a.ts',
      `// unrelated request\n${Array.from({ length: 30 }, (_, index) => `// filler ${index}`).join('\n')}\nexport const targetEntry = 1\n`
    )
    put(repo, 'app/shared.ts', `export const longEntry = '${'x'.repeat(600)}'`)
    const map = JSON.parse(readFileSync(join(repo, 'engineering/project-map.json')))
    map.subsystems[0].evidence = [
      'Evidence',
      'Second evidence',
      'Third evidence',
      'Byte-bound evidence',
    ].map(heading => ({ path: 'docs.md', heading }))
    map.subsystems[0].entrySymbols[0].symbol = 'targetEntry'
    map.subsystems[0].entrySymbols.push({ path: 'app/shared.ts', symbol: 'longEntry' })
    put(repo, 'engineering/project-map.json', map)
    const packet = contextPacket(repo, {
      subsystem: 'selection',
      query: 'unrelated request',
      budget: 12_000,
    })
    assert.equal(packet.subsystem.mappingStatus, 'reviewed')
    assert.ok(packet.contextBytes <= packet.budgetBytes)
    assert.ok(packet.parityScope[0].scope.some(line => /incomplete|open/i.test(line)))
    assert.ok(
      packet.sourceExcerpts.every(
        item => item.sourceHash && item.contentHash && item.lineStart <= item.lineEnd
      )
    )
    assert.ok(packet.checks.some(check => check.knownLimits.length))
    assert.ok(
      packet.sourceExcerpts.some(
        item => item.path === 'docs.md' && item.headingTrail.at(-1) === 'Evidence' && item.truncated
      )
    )
    assert.deepEqual(
      packet.sourceExcerpts
        .filter(item => item.path === 'docs.md')
        .map(item => item.headingTrail.at(-1))
        .sort(),
      ['Byte-bound evidence', 'Evidence', 'Second evidence', 'Third evidence']
    )
    assert.match(
      packet.sourceExcerpts.find(item => item.headingTrail.at(-1) === 'Byte-bound evidence')
        .excerpt,
      /Browser integration remains open/
    )
    assert.ok(
      packet.sourceExcerpts.some(
        item =>
          item.path === 'GOAL.md' &&
          item.headingTrail.at(-1) ===
            'Current execution order: group movement and native selection'
      )
    )
    assert.match(
      packet.sourceExcerpts.find(item => item.path === 'app/a.ts').excerpt,
      /targetEntry/
    )
    assert.equal(packet.sourceExcerpts.find(item => item.path === 'app/shared.ts').truncated, true)
    assert.ok(packet.omissions.some(item => /bounded window/.test(item.reason)))
  }))

test('real mapped evidence excerpts retain their material performance boundaries', () => {
  const selection = contextPacket(ROOT, { subsystem: 'selection' })
  assert.match(
    selection.sourceExcerpts.find(item =>
      item.headingTrail.at(-1)?.includes('Mixed-object picking')
    ).excerpt,
    /not a GPU\/frame-rate\s+certification/
  )
  const terrain = contextPacket(ROOT, { subsystem: 'terrain-performance' })
  assert.match(
    terrain.sourceExcerpts.find(item =>
      item.headingTrail.at(-1)?.includes('Batch terrain notifications')
    ).excerpt,
    /not hardware frame time|excluding rendering/
  )
})

test('plan handles cross-cutting edits, renames, deletions, untracked and unsafe inputs without executing checks', () =>
  withRepo(repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim()
    appendFileSync(join(repo, 'app/shared.ts'), '// changed\n')
    renameSync(join(repo, 'misc/old name.txt'), join(repo, 'misc/new name.txt'))
    rmSync(join(repo, 'misc/delete.txt'))
    run(repo, 'git', 'add', '-A')
    put(repo, 'mystery/new.ts', 'export {}\n')
    const plan = planChanges(repo, { base })
    assert.equal(plan.executesChecks, false)
    assert.deepEqual(plan.affectedSubsystems, ['selection'])
    assert.ok(
      plan.changes.some(change => change.endpoint === 'from' && change.path === 'misc/old name.txt')
    )
    assert.ok(
      plan.changes.some(change => change.endpoint === 'to' && change.path === 'misc/new name.txt')
    )
    assert.ok(
      plan.changes.some(change => change.status === 'D' && change.path === 'misc/delete.txt')
    )
    assert.ok(
      plan.changes.some(change => change.source === 'untracked' && change.path === 'mystery/new.ts')
    )
    assert.ok(plan.unknownPaths.includes('mystery/new.ts'))
    assert.equal(plan.checks.find(check => check.id === 'native').status, 'blocked')
    assert.throws(() => planChanges(repo, { base: '--help' }), /Unsafe base ref/)
  }))

function contract(repo, base) {
  const appFingerprint = fingerprintPaths(repo, ['app/a.ts'])
  return {
    version: 1,
    identity: {
      taskId: 'task',
      baseCommit: base,
      baseline: [],
      inputFingerprints: { 'docs.md': sha(readFileSync(join(repo, 'docs.md'))) },
    },
    intent: {
      objective: 'Change selection',
      nonGoals: ['No ledger edit'],
      acceptance: ['Tested'],
      risk: 'medium',
    },
    scope: {
      subsystemIds: ['selection'],
      parityIds: ['group.item.part'],
      boundaries: ['Integration remains open'],
    },
    ownership: {
      implementationOwner: 'parent',
      allowedPaths: ['app/a.ts', 'app/shared.ts'],
      prohibitedPaths: ['generated.txt'],
      generatedPaths: [],
    },
    research: { nativeQuestions: [], evidence: ['docs.md#evidence'], assumptions: [] },
    modernization: { risks: [], measurementNeeds: [], corrections: [] },
    verification: {
      requiredCheckIds: ['portable'],
      rationale: ['Pure rule check'],
      artifacts: ['work/orchestration/task'],
      results: [
        {
          checkId: 'portable',
          status: 'passed',
          command: ['node', '--test', 'tests/a.test.mjs'],
          testedFingerprint: appFingerprint,
          inputPaths: ['app/a.ts'],
          exitCode: 0,
          artifacts: [],
          reason: '',
        },
      ],
    },
    completion: {
      requiredReview: 'fresh reviewer',
      permittedBookkeeping: [],
      stoppingConditions: ['Report gaps'],
    },
  }
}

test('audit distinguishes baseline edits and reports out-of-scope, generated, input, untracked, and stale verification changes', () =>
  withRepo(repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim()
    appendFileSync(join(repo, 'app/shared.ts'), '// user edit\n')
    const task = contract(repo, base)
    task.identity.baseline.push(
      changedPaths(repo, base).records.find(change => change.path === 'app/shared.ts')
    )
    validateContract(repo, task)
    appendFileSync(join(repo, 'app/a.ts'), '// task edit\n')
    appendFileSync(join(repo, 'generated.txt'), 'direct edit\n')
    appendFileSync(join(repo, 'docs.md'), 'input changed\n')
    renameSync(join(repo, 'misc/old name.txt'), join(repo, 'misc/audit name.txt'))
    put(repo, 'outside.txt', 'outside\n')
    run(repo, 'git', 'add', '--', 'misc/old name.txt', 'misc/audit name.txt')
    const audit = auditContract(repo, task)
    assert.equal(audit.status, 'failed')
    assert.ok(audit.preExisting.some(change => change.path === 'app/shared.ts'))
    assert.ok(
      audit.violations.some(
        item => item.type === 'outside-allowed-paths' && item.path === 'outside.txt'
      )
    )
    assert.ok(
      audit.violations.some(
        item => item.type === 'protected-generated-output' && item.path === 'generated.txt'
      )
    )
    assert.ok(
      audit.violations.some(
        item => item.type === 'prohibited-path' && item.path === 'generated.txt'
      )
    )
    assert.ok(
      audit.taskChanges.some(
        change => change.endpoint === 'from' && change.path === 'misc/old name.txt'
      )
    )
    assert.ok(
      audit.taskChanges.some(
        change => change.endpoint === 'to' && change.path === 'misc/audit name.txt'
      )
    )
    assert.deepEqual(
      audit.changedInputs.map(item => item.path),
      ['docs.md']
    )
    assert.deepEqual(
      audit.invalidatedResults.map(item => item.checkId),
      ['portable']
    )
  }))

test('audit reports a pre-existing baseline change that disappears', () =>
  withRepo(repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim()
    appendFileSync(join(repo, 'app/shared.ts'), '// user edit\n')
    const task = contract(repo, base)
    task.identity.baseline.push(
      changedPaths(repo, base).records.find(change => change.path === 'app/shared.ts')
    )
    run(repo, 'git', 'restore', '--', 'app/shared.ts')
    const audit = auditContract(repo, task)
    assert.equal(audit.status, 'failed')
    assert.deepEqual(
      audit.missingBaseline.map(entry => entry.path),
      ['app/shared.ts']
    )
    assert.ok(
      audit.violations.some(
        item => item.type === 'baseline-entry-missing' && item.path === 'app/shared.ts'
      )
    )
  }))

test('audit requires exactly one result for every required check', () =>
  withRepo(repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim()
    const task = contract(repo, base)
    const result = task.verification.results[0]
    task.verification.results = []
    assert.ok(
      auditContract(repo, task).violations.some(
        item => item.type === 'missing-check-result' && item.checkId === 'portable'
      )
    )
    task.verification.results = [result, { ...result }]
    assert.ok(
      auditContract(repo, task).violations.some(
        item => item.type === 'duplicate-check-result' && item.checkId === 'portable'
      )
    )
  }))

test('blocked verification cannot masquerade as passing and passed results require evidence', () =>
  withRepo(repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim()
    const task = contract(repo, base)
    task.verification.results[0] = {
      checkId: 'native',
      status: 'blocked',
      command: ['python3', 'native.py', '/external/game.exe'],
      inputPaths: ['docs.md'],
      testedFingerprint: fingerprintPaths(repo, ['docs.md']),
      artifacts: [],
      reason: 'Executable unavailable',
    }
    assert.doesNotThrow(() => validateContract(repo, task))
    task.verification.results[0] = {
      checkId: 'native',
      status: 'passed',
      command: ['python3', 'native.py', '/external/game.exe'],
      inputPaths: ['docs.md'],
      artifacts: [],
      exitCode: 1,
      testedFingerprint: '0'.repeat(64),
      reason: '',
    }
    assert.throws(() => validateContract(repo, task), /exitCode 0/)
    task.verification.results[0] = {
      checkId: 'portable',
      status: 'passed',
      command: ['node', '--test'],
      inputPaths: ['app/a.ts'],
      artifacts: [],
      exitCode: 0,
      testedFingerprint: fingerprintPaths(repo, ['app/a.ts']),
      reason: '',
    }
    assert.throws(() => validateContract(repo, task), /Command does not match check/)
    task.verification.results[0].command = ['node', '--test', 'tests/a.test.mjs']
    task.verification.results[0].inputPaths = ['docs.md']
    assert.throws(
      () => validateContract(repo, task),
      /Fingerprint inputs omit declared check input/
    )
    const missingFingerprint = contract(repo, base)
    delete missingFingerprint.verification.results[0].testedFingerprint
    assert.throws(() => validateContract(repo, missingFingerprint), /needs fingerprint/)
    const failed = contract(repo, base)
    failed.verification.results[0].status = 'failed'
    failed.verification.results[0].reason = 'Test failed'
    delete failed.verification.results[0].exitCode
    assert.throws(() => validateContract(repo, failed), /Failed result needs exitCode/)
    const checks = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
    checks.checks[0].expected.artifacts = ['generated.txt']
    put(repo, 'engineering/checks.json', checks)
    assert.throws(
      () => validateContract(repo, contract(repo, base)),
      /Passed result omits artifact/
    )
  }))
