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
import { checkAutomation, startGameServer, verifyContract } from '../scripts/orchestration/verify.mjs'
import { main as prepareMain, prepareContract } from '../scripts/orchestration/prepare.mjs'

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
  put(repo, 'references/modern-performance.md', '# Measurement rules\nKeep renderer identity.\n\n# Representative workload\nCompare the same populated view.\n\n# Limitations\nSoftware rendering is not hardware proof.\n')
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

async function withAsyncRepo(fn) {
  const repo = fixtureRepo()
  try {
    return await fn(repo)
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
    assert.equal(packet.contextBytes, Buffer.byteLength(`${JSON.stringify(packet, null, 2)}\n`))
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

test('role context carries a validated bounded assignment and explicit overflow', () =>
  withRepo(repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim()
    const task = contract(repo, base)
    task.modernization.corrections.push('Keep the corrected renderer classification.')
    const contractPath = 'work/orchestration/task-contract.json'
    put(repo, contractPath, task)
    const native = contextPacket(repo, {
      subsystem: 'selection',
      query: 'what native selection evidence proves',
      budget: 12_000,
      role: 'native',
      contract: contractPath,
    })
    assert.equal(native.status, 'complete')
    assert.equal(native.role, 'native')
    assert.equal(native.assignment.allowedWrites.length, 0)
    assert.equal(native.assignment.identity.baseCommit, base)
    assert.deepEqual(native.parityScope.map(entry => entry.id), ['group.item.part'])
    assert.match(native.sourceExcerpts.find(item => item.path === 'docs.md').excerpt, /bounded|open/i)
    assert.ok(
      native.omissions
        .filter(item => item.path)
        .every(item => Array.isArray(item.headingTrail))
    )

    task.research.evidence.push('references/modern-performance.md#measurement-rules')
    task.modernization.measurementNeeds.push('Compare one corrected renderer workload.')
    put(repo, contractPath, task)
    assert.throws(
      () =>
        contextPacket(repo, {
          subsystem: 'selection',
          query: 'uncited renderer workload',
          role: 'performance',
          contract: contractPath,
        }),
      /explicit workload evidence/
    )
    task.research.evidence.push('references/modern-performance.md#limitations')
    task.modernization.workloadEvidence = 'references/modern-performance.md#limitations'
    put(repo, contractPath, task)
    assert.throws(
      () =>
        contextPacket(repo, {
          subsystem: 'selection',
          query: 'limitations are not a workload',
          role: 'performance',
          contract: contractPath,
        }),
      /distinct workload or measurement heading/
    )
    task.research.evidence.push('references/modern-performance.md#representative-workload')
    task.modernization.workloadEvidence =
      'references/modern-performance.md#representative-workload'
    put(repo, contractPath, task)
    const performance = contextPacket(repo, {
      subsystem: 'selection',
      query: 'corrected renderer workload',
      budget: 12_000,
      role: 'performance',
      contract: contractPath,
    })
    assert.deepEqual(performance.assignment.corrections, task.modernization.corrections)
    assert.ok(
      performance.sourceExcerpts.some(
        item =>
          item.path === 'references/modern-performance.md' &&
          item.headingTrail.at(-1) === 'Measurement rules'
      )
    )
    assert.ok(performance.omissions.every(item => item.path && item.headingTrail))
    assert.equal(performance.retrievalBoundary.headingIndex.path, 'work/orchestration/index.json')
    assert.match(performance.retrievalBoundary.headingIndex.contentHash, /^[0-9a-f]{64}$/)

    const performancePath = join(repo, 'references/modern-performance.md')
    const performanceSource = readFileSync(performancePath, 'utf8')
    writeFileSync(
      performancePath,
      performanceSource.replace('# Measurement rules', '# Old measurement rules appendix')
    )
    task.research.evidence = task.research.evidence.filter(
      reference => !reference.endsWith('#measurement-rules')
    )
    put(repo, contractPath, task)
    const nearMissPolicy = contextPacket(repo, {
      subsystem: 'selection',
      query: 'exact measurement policy',
      role: 'performance',
      contract: contractPath,
    })
    assert.equal(nearMissPolicy.status, 'incomplete')
    assert.ok(nearMissPolicy.omissions.some(item => item.reason.includes('mandatory source')))
    writeFileSync(performancePath, performanceSource)
    task.research.evidence.push('references/modern-performance.md#measurement-rules')

    task.modernization.measurementNeeds = ['']
    put(repo, contractPath, task)
    assert.throws(
      () =>
        contextPacket(repo, {
          subsystem: 'selection',
          query: 'missing workload',
          role: 'performance',
          contract: contractPath,
        }),
      /nonblank measurement need/
    )
    task.modernization.measurementNeeds = ['Compare one corrected renderer workload.']
    delete task.modernization.workloadEvidence

    put(repo, 'work/orchestration/native-notes.md', '# Supplied consumer\nNative leaf matches. World integration remains open.\n')
    task.research.evidence = ['work/orchestration/native-notes.md#Supplied consumer']
    put(repo, contractPath, task)
    const explicitSource = contextPacket(repo, { subsystem: 'selection', query: 'consumer',
      role: 'native', contract: contractPath })
    assert.equal(explicitSource.budgetBytes, 12_000)
    assert.ok(explicitSource.sourceExcerpts.some(item => item.path === 'work/orchestration/native-notes.md' &&
      /integration remains open/.test(item.excerpt)))
    assert.ok(Object.hasOwn(explicitSource.parityScope[0], 'omittedScopeSentences'))

    put(repo, 'work/orchestration/native-data.json', '{"boundary":"integration remains open"}\n')
    task.research.evidence = ['work/orchestration/native-data.json']
    put(repo, contractPath, task)
    const explicitData = contextPacket(repo, {
      subsystem: 'selection',
      query: 'native data boundary',
      role: 'native',
      contract: contractPath,
    })
    assert.equal(explicitData.status, 'complete')
    assert.ok(
      explicitData.sourceExcerpts.some(item => item.path === 'work/orchestration/native-data.json')
    )

    task.research.evidence = ['docs.md#missing-heading']
    put(repo, contractPath, task)
    assert.throws(
      () =>
        contextPacket(repo, {
          subsystem: 'selection',
          query: 'invalid evidence',
          role: 'native',
          contract: contractPath,
        }),
      /Unknown evidence heading/
    )
    task.research.evidence = ['missing.md#Evidence']
    put(repo, contractPath, task)
    assert.throws(
      () =>
        contextPacket(repo, {
          subsystem: 'selection',
          query: 'missing evidence',
          role: 'native',
          contract: contractPath,
        }),
      /Missing repository path/
    )
    task.research.evidence = ['docs.md#Evid']
    put(repo, contractPath, task)
    assert.throws(
      () =>
        contextPacket(repo, {
          subsystem: 'selection',
          query: 'partial evidence heading',
          role: 'native',
          contract: contractPath,
        }),
      /Unknown evidence heading/
    )
    task.research.evidence = ['../docs.md#Evidence']
    put(repo, contractPath, task)
    assert.throws(
      () =>
        contextPacket(repo, {
          subsystem: 'selection',
          query: 'unsafe evidence path',
          role: 'native',
          contract: contractPath,
        }),
      /Non-canonical|escapes/
    )

    task.research.evidence = ['docs.md#Evidence']
    task.intent.acceptance.push('x'.repeat(8_000))
    put(repo, contractPath, task)
    const overflow = contextPacket(repo, {
      subsystem: 'selection',
      query: 'too much mandatory context',
      budget: 4_000,
      role: 'scout',
      contract: contractPath,
    })
    assert.equal(overflow.status, 'incomplete')
    assert.equal(overflow.contextBytes, Buffer.byteLength(`${JSON.stringify(overflow, null, 2)}\n`))
    assert.match(overflow.omissions[0].reason, /mandatory assignment context/)
    assert.ok(JSON.stringify(overflow).length < overflow.budgetBytes)
    const oversizedQuery = contextPacket(repo, {
      subsystem: 'selection',
      query: 'q'.repeat(5_000),
      budget: 4_000,
      role: 'scout',
      contract: contractPath,
    })
    assert.equal(oversizedQuery.status, 'incomplete')
    assert.match(oversizedQuery.omissions[0].reason, /question exceeds/)
    assert.ok(oversizedQuery.contextBytes <= oversizedQuery.budgetBytes)
    assert.throws(
      () => contextPacket(repo, { subsystem: 'selection', role: 'scout' }),
      /--role and --contract/
    )
  }))

test('reviewer context fingerprints the actual dirty, renamed, deleted, and untracked inputs', () =>
  withRepo(repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim()
    const task = contract(repo, base)
    const contractPath = 'work/orchestration/review-contract.json'
    put(repo, contractPath, task)
    appendFileSync(join(repo, 'app/a.ts'), '// dirty\n')
    renameSync(join(repo, 'misc/old name.txt'), join(repo, 'misc/new name.txt'))
    rmSync(join(repo, 'misc/delete.txt'))
    run(repo, 'git', 'add', '-A')
    put(repo, 'untracked.txt', 'new\n')
    const review = contextPacket(repo, {
      subsystem: 'selection',
      query: 'review final changes',
      budget: 12_000,
      role: 'reviewer',
      contract: contractPath,
    })
    assert.equal(review.status, 'complete')
    assert.deepEqual(review.assignment.review.trackedDiffCommand, [
      'git',
      'diff',
      '--no-ext-diff',
      base,
      '--',
    ])
    assert.ok(review.assignment.review.untrackedPaths.includes('untracked.txt'))
    assert.ok(
      review.assignment.review.changes.some(
        change => change.endpoint === 'from' && change.path === 'misc/old name.txt'
      )
    )
    assert.ok(
      review.assignment.review.changes.some(
        change => change.endpoint === 'to' && change.path === 'misc/new name.txt'
      )
    )
    assert.ok(
      review.assignment.review.changes.some(
        change => change.status === 'D' && change.path === 'misc/delete.txt'
      )
    )
    assert.ok(review.assignment.review.changes.every(change => !Object.hasOwn(change, 'hash')))
    assert.ok(review.assignment.review.receipts.every(result => result.command && result.inputPaths))
    assert.match(review.assignment.review.changedFingerprint, /^[0-9a-f]{64}$/)
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

test('game server rejects an invalid isolated port', async () => {
  await assert.rejects(
    startGameServer('.', { POPULOUS_PORT: '0' }, '/private/tmp/unused-game-server.log'),
    /POPULOUS_PORT must be a valid port/
  )
})

function taskSpec(repo) {
  const { identity: _identity, version: _version, ...spec } = contract(repo, 'HEAD')
  spec.verification.results = []
  return spec
}

function configureAggregate(repo) {
  const checks = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
  const configure = (id, executable, args) => Object.assign(checks.checks.find(check => check.id === id),
    { automation: 'safe', executable, args })
  configure('repository-check', 'npm', ['run', 'check'])
  configure('orchestration-tests', 'node', ['--test', 'tests/orchestration.test.mjs', 'tests/delivery-clock.test.mjs'])
  configure('orchestration-structural', 'node', ['scripts/orchestration/cli.mjs', 'check'])
  checks.checks.find(check => check.id === 'orchestration-tests').inputs = ['docs.md']
  put(repo, 'engineering/checks.json', checks)
  put(repo, 'package.json', { type: 'module', scripts: {
    check: 'npm run typecheck && npm test && npm run parity:check && npm run orchestration:check',
    test: 'node --test tests/*.test.mjs',
    'orchestration:check': 'node scripts/orchestration/cli.mjs check',
  } })
}

test('preparation captures real baseline and hashes, validates intent, and refuses overwrite', () =>
  withRepo(repo => {
    appendFileSync(join(repo, 'app/a.ts'), '// existing user work\n')
    renameSync(join(repo, 'misc/old name.txt'), join(repo, 'misc/renamed.txt'))
    rmSync(join(repo, 'misc/delete.txt'))
    run(repo, 'git', 'add', '-A')
    put(repo, 'untracked.txt', 'preserve me\n')
    const spec = taskSpec(repo)
    spec.inputPaths = ['docs.md']
    put(repo, 'work/orchestration/spec.json', spec)
    const args = ['--spec', 'work/orchestration/spec.json', '--contract',
      'work/orchestration/prepared.json', '--task-id', 'prepared']
    const before = run(repo, 'git', 'status', '--porcelain')
    const summary = prepareMain(args, repo)
    const saved = JSON.parse(readFileSync(join(repo, summary.contract)))
    assert.deepEqual(saved.identity.baseline, changedPaths(repo, 'HEAD').records)
    assert.equal(saved.identity.baseCommit, run(repo, 'git', 'rev-parse', 'HEAD').trim())
    assert.equal(saved.identity.inputFingerprints['docs.md'], sha(readFileSync(join(repo, 'docs.md'))))
    assert.deepEqual(saved.intent, spec.intent)
    assert.equal(summary.executesChecks, false)
    assert.equal(run(repo, 'git', 'status', '--porcelain'), before)
    assert.throws(() => prepareMain(args, repo), /EEXIST/)
    assert.throws(() => prepareContract(repo, { ...spec, intent: { ...spec.intent, acceptance: [] } },
      { taskId: 'invalid' }), /must not be empty/)
  }))

test('verification persists completed checks across interruption and replaces old passes at startup', async () =>
  withAsyncRepo(async repo => {
    const checks = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
    for (const check of checks.checks) check.automation = 'safe'
    put(repo, 'engineering/checks.json', checks)
    const task = contract(repo, 'HEAD')
    task.verification.requiredCheckIds = ['portable', 'production-build', 'native']
    const path = 'work/orchestration/interrupted.json'
    put(repo, path, task)
    let calls = 0
    await assert.rejects(verifyContract(repo, path, { env: {}, execute: async () => {
      calls++
      const saved = JSON.parse(readFileSync(join(repo, path))).verification.results
      assert.equal(saved.find(item => item.checkId === 'native').status, 'not-run')
      if (calls === 1) {
        assert.equal(saved.find(item => item.checkId === 'portable').status, 'blocked')
        return { exitCode: 0, stdout: 'pass\n', stderr: '', timedOut: false }
      }
      assert.equal(saved.find(item => item.checkId === 'portable').status, 'passed')
      throw new Error('simulated interruption')
    } }), /simulated interruption/)
    const saved = JSON.parse(readFileSync(join(repo, path)))
    assert.deepEqual(saved.verification.results.map(result => result.status), ['passed', 'blocked', 'not-run'])
    assert.equal(readFileSync(join(repo, saved.verification.results[0].log), 'utf8'), 'pass\n')
    validateContract(repo, saved)
  }))

test('verification replaces a required receipt invalidated by a changed check definition', async () =>
  withAsyncRepo(async repo => {
    const task = contract(repo, 'HEAD')
    const path = 'work/orchestration/reverify.json'
    put(repo, path, task)
    const checks = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
    checks.checks.find(check => check.id === 'portable').automation = 'safe'
    checks.checks.find(check => check.id === 'portable').expected.artifacts = ['app/a.ts']
    put(repo, 'engineering/checks.json', checks)
    const outcome = await verifyContract(repo, path, {
      execute: async () => ({ exitCode: 0, stdout: '', stderr: '', timedOut: false }),
    })
    assert.equal(outcome.status, 'passed')
    assert.deepEqual(outcome.results[0].artifacts, ['app/a.ts'])
  }))

test('reviewed aggregate coverage executes once, fingerprints covered inputs, and fails closed on script drift', async () =>
  withAsyncRepo(async repo => {
    configureAggregate(repo)
    const spec = taskSpec(repo)
    spec.verification.requiredCheckIds = ['orchestration-tests', 'repository-check', 'orchestration-structural']
    const task = prepareContract(repo, spec, { taskId: 'aggregate' })
    assert.deepEqual(task.verification.requiredCheckIds, ['repository-check'])
    assert.equal(task.verification.coverage.length, 2)
    const path = 'work/orchestration/aggregate.json'
    put(repo, path, task)
    const calls = []
    const outcome = await verifyContract(repo, path, { env: {}, execute: async command => {
      calls.push(command)
      return { exitCode: 0, stdout: 'aggregate passed\n', stderr: '', timedOut: false }
    } })
    assert.deepEqual(calls, [['npm', 'run', 'check']])
    assert.deepEqual(outcome.results[0].coveredCheckIds, ['orchestration-tests', 'orchestration-structural'])
    assert.ok(outcome.results[0].inputPaths.includes('docs.md'))
    const saved = JSON.parse(readFileSync(join(repo, path)))
    validateContract(repo, saved)
    appendFileSync(join(repo, 'docs.md'), '\nchanged covered input\n')
    assert.ok(auditContract(repo, saved).invalidatedResults.some(result => result.checkId === 'repository-check'))
    const pkg = JSON.parse(readFileSync(join(repo, 'package.json')))
    pkg.scripts.test = 'node --test tests/a.test.mjs'
    put(repo, 'package.json', pkg)
    assert.throws(() => validateContract(repo, saved), /Unsupported check coverage/)
    const fallback = prepareContract(repo, spec, { taskId: 'fallback' })
    assert.ok(fallback.verification.requiredCheckIds.includes('orchestration-tests'))
    assert.equal(fallback.verification.coverage.length, 1)
  }))

test('verification runs only safe contract checks, records blocking, and detects mutations', async () => {
  await withAsyncRepo(async repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim(),
      checksPath = join(repo, 'engineering/checks.json'),
      checks = JSON.parse(readFileSync(checksPath))
    checks.checks.find(check => check.id === 'portable').automation = 'safe'
    put(repo, 'engineering/checks.json', checks)
    const task = contract(repo, base)
    task.verification.results = []
    put(repo, 'work/orchestration/task.json', task)
    const result = await verifyContract(repo, 'work/orchestration/task.json', {
      env: {},
      execute: async command => {
        assert.deepEqual(command, ['node', '--test', 'tests/a.test.mjs'])
        return { exitCode: 0, stdout: 'pass\n', stderr: '', timedOut: false }
      },
    })
    assert.equal(result.status, 'passed')
    const saved = JSON.parse(readFileSync(join(repo, 'work/orchestration/task.json')))
    assert.equal(saved.verification.results[0].status, 'passed')
    assert.equal(saved.verification.results[0].testedFingerprint, fingerprintPaths(repo, ['app/a.ts']))
    assert.equal(saved.verification.results[0].log, 'work/orchestration/task/checks/portable.log')
  })
  await withAsyncRepo(async repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim(),
      checksPath = join(repo, 'engineering/checks.json'),
      checks = JSON.parse(readFileSync(checksPath))
    checks.checks.find(check => check.id === 'native').automation = 'safe'
    put(repo, 'engineering/checks.json', checks)
    const task = contract(repo, base)
    task.verification.requiredCheckIds = ['native']
    task.verification.results = []
    put(repo, 'work/orchestration/task.json', task)
    const result = await verifyContract(repo, 'work/orchestration/task.json', { env: {} })
    assert.equal(result.status, 'blocked')
    assert.match(result.results[0].reason, /NEED_EXE/)
  })
  await withAsyncRepo(async repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim(),
      checksPath = join(repo, 'engineering/checks.json'),
      checks = JSON.parse(readFileSync(checksPath))
    checks.checks.find(check => check.id === 'portable').automation = 'safe'
    put(repo, 'engineering/checks.json', checks)
    const task = contract(repo, base)
    task.verification.results = []
    put(repo, 'work/orchestration/task.json', task)
    const result = await verifyContract(repo, 'work/orchestration/task.json', {
      env: {},
      execute: async () => {
        appendFileSync(join(repo, 'app/a.ts'), '// bad check write\n')
        return { exitCode: 0, stdout: '', stderr: '', timedOut: false }
      },
    })
    assert.equal(result.status, 'failed')
    assert.match(result.results[0].reason, /changed the tracked/)
  })
  await withAsyncRepo(async repo => {
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim(),
      checksPath = join(repo, 'engineering/checks.json'),
      checks = JSON.parse(readFileSync(checksPath)),
      events = []
    checks.checks.push({
      id: 'browser',
      kind: 'browser',
      purpose: 'Browser check',
      coveredBehavior: ['Browser'],
      knownLimits: ['Synthetic'],
      executable: 'node',
      args: ['--test', 'tests/a.test.mjs'],
      cwd: '.',
      env: [],
      inputs: ['app/a.ts'],
      prerequisites: ['Browser'],
      sideEffects: [],
      resources: [],
      expected: { exitCode: 0, artifacts: [] },
      automation: 'safe',
    })
    checks.checks.find(check => check.id === 'production-build').automation = 'safe'
    put(repo, 'engineering/checks.json', checks)
    const task = contract(repo, base)
    task.verification.requiredCheckIds = ['browser', 'production-build']
    task.verification.results = []
    put(repo, 'work/orchestration/task.json', task)
    const result = await verifyContract(repo, 'work/orchestration/task.json', {
      env: {},
      startServer: async () => {
        events.push('start')
        return { url: 'http://127.0.0.1:3000', stop: async () => events.push('stop') }
      },
      execute: async command => {
        events.push(command.includes('--check') ? 'check' : 'browser')
        return { exitCode: 0, stdout: '', stderr: '', timedOut: false }
      },
    })
    assert.equal(result.status, 'passed')
    assert.deepEqual(events, ['start', 'browser', 'stop', 'check'])
  })
  assert.match(checkAutomation({ automation: 'manual', executable: 'node', args: [] }), /allowlisted/)
  assert.match(
    checkAutomation({
      automation: 'safe',
      executable: 'python3',
      args: ['native.py', '--record'],
    }),
    /recording/
  )
  withRepo(repo => {
    const invalid = contract(repo, run(repo, 'git', 'rev-parse', 'HEAD').trim())
    invalid.identity.taskId = '../escape'
    assert.throws(() => validateContract(repo, invalid), /Invalid task id/)
  })
})
