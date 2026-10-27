import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  appendFileSync,
  chmodSync,
  copyFileSync,
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
  main as orchestrationMain,
  parseMarkdown,
  planChanges,
  safeRepoPath,
  validateContract,
  validateRepository,
} from '../scripts/orchestration/cli.mjs'
import { checkAutomation, startGameServer, verifyContract } from '../scripts/orchestration/verify.mjs'
import { main as prepareMain, prepareContract } from '../scripts/orchestration/prepare.mjs'
import { dragSourceProfiles } from '../scripts/browser-performance/snapshot-drag-contract.mjs'

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

test('context output saves current JSON and rejects silent option mistakes', () =>
  withRepo(repo => {
    const output = 'work/orchestration/task/packet.json'
    const args = ['context', '--subsystem', 'selection', '--query', 'native evidence', '--output', output]
    const packet = orchestrationMain(args, repo)
    assert.deepEqual(JSON.parse(readFileSync(join(repo, output))), packet)
    assert.equal(readFileSync(join(repo, output), 'utf8'), `${JSON.stringify(packet, null, 2)}\n`)
    const replacement = orchestrationMain([...args.slice(0, 4), 'different question', '--output', output], repo)
    assert.equal(JSON.parse(readFileSync(join(repo, output))).query, replacement.query)
    const saved = readFileSync(join(repo, output), 'utf8')
    assert.throws(() => orchestrationMain([...args, '--outpt', 'typo.json'], repo), /Unknown context option/)
    assert.equal(readFileSync(join(repo, output), 'utf8'), saved)
    assert.throws(() => orchestrationMain(['plan', '--base', 'HEAD', '--bogus', 'yes'], repo), /Unknown plan option/)
    assert.throws(() => orchestrationMain([...args.slice(0, -1), 'app/packet.json'], repo), /ignored JSON/)
    const task = contract(repo, run(repo, 'git', 'rev-parse', 'HEAD').trim())
    put(repo, 'work/orchestration/task.json', task)
    assert.throws(() => orchestrationMain([...args.slice(0, -1), 'work/orchestration/task.json'], repo), /non-packet file/)
    assert.deepEqual(JSON.parse(readFileSync(join(repo, 'work/orchestration/task.json'))), task)
    const incomplete = orchestrationMain(['context', '--subsystem', 'selection', '--query', 'x'.repeat(1001),
      '--role', 'native', '--contract', 'work/orchestration/task.json', '--output', output], repo)
    assert.equal(incomplete.status, 'incomplete')
    assert.equal(JSON.parse(readFileSync(join(repo, output))).status, 'incomplete', 'Overflow cannot leave a stale complete packet')
  }))

test('preparation is independent of retired local status state', () =>
  withRepo(repo => {
    put(repo, 'work/orchestration/delivery-clock.json', '{broken')
    put(repo, 'work/orchestration/spec.json', taskSpec(repo))
    const result = prepareMain(['--spec', 'work/orchestration/spec.json', '--task-id', 'clock-fault',
      '--contract', 'work/orchestration/clock-fault.json'], repo)
    assert.equal(Object.hasOwn(result, 'deliveryClock'), false)
    assert.equal(JSON.parse(readFileSync(join(repo, result.contract))).identity.taskId, 'clock-fault')
    assert.equal(readFileSync(join(repo, 'work/orchestration/delivery-clock.json'), 'utf8'), '{broken')
  }))

test('native research packets grant only a contract-allowed ignored scratch directory', () =>
  withRepo(repo => {
    const task = contract(repo, run(repo, 'git', 'rev-parse', 'HEAD').trim())
    const contractPath = 'work/orchestration/research-contract.json'
    const options = { subsystem: 'selection', role: 'native', contract: contractPath,
      query: 'Resolve one native boundary', researchOutput: 'work/orchestration/task/native' }
    put(repo, contractPath, task)
    assert.throws(() => contextPacket(repo, options), /allowed by the contract/)
    task.ownership.allowedPaths.push('work/orchestration/task')
    put(repo, contractPath, task)
    const packet = contextPacket(repo, options)
    assert.equal(packet.status, 'complete')
    assert.deepEqual(packet.assignment.allowedWrites, [options.researchOutput])
    assert.match(packet.assignment.researchHandoff.deliverable, /findings.md/)
    assert.throws(() => contextPacket(repo, { ...options, role: 'reviewer' }), /native role/)
    assert.throws(() => contextPacket(repo, { ...options, researchOutput: 'app' }), /task directory/)
    assert.throws(() => contextPacket(repo, { ...options, researchOutput: 'work/orchestration/task/../other' }), /traversal/)
    mkdirSync(join(repo, 'work/orchestration/task'), { recursive: true })
    symlinkSync(join(repo, 'app'), join(repo, 'work/orchestration/task/alias'))
    assert.throws(() => contextPacket(repo, { ...options, researchOutput: 'work/orchestration/task/alias' }), /symlinks/)
    task.ownership.prohibitedPaths.push(options.researchOutput)
    put(repo, contractPath, task)
    assert.throws(() => contextPacket(repo, options), /prohibited path/)
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
    assert.equal(native.assignment.responseBudgetWords, 500)
    assert.match(native.assignment.responseFormat, /PROVES.*LIVE GAP.*STOP/)
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
    assert.equal(review.assignment.responseBudgetWords, 400)
    assert.match(review.assignment.responseFormat, /Findings only.*ACCEPT.*REJECT/)
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
  // A subsystem overview may omit a mapped section as check/parity metadata grows.
  // Ask for the named evidence under test; never raise the budget or drop its limits.
  const selection = contextPacket(ROOT, { subsystem: 'selection', query: 'Mixed-object picking' })
  assert.match(
    selection.sourceExcerpts.find(item =>
      item.headingTrail.at(-1)?.includes('Mixed-object picking')
    ).excerpt,
    /not a GPU\/frame-rate\s+certification/
  )
  const terrain = contextPacket(ROOT, {
    subsystem: 'terrain-performance', query: 'Batch terrain notifications',
  })
  assert.match(
    terrain.sourceExcerpts.find(item =>
      item.headingTrail.at(-1)?.includes('Batch terrain notifications')
    ).excerpt,
    /not hardware frame time|excluding rendering/
  )
  const { project, checks } = validateRepository(ROOT)
  const mapping = project.subsystems.find(item => item.id === 'terrain-performance')
  assert.equal(terrain.budgetBytes, 24_000)
  assert.equal(terrain.contextBytes, Buffer.byteLength(`${JSON.stringify(terrain, null, 2)}\n`))
  assert.ok(terrain.contextBytes <= terrain.budgetBytes)
  assert.deepEqual(terrain.checks.map(check => check.id), mapping.checkIds)
  for (const projected of terrain.checks) {
    const original = checks.checks.find(check => check.id === projected.id)
    for (const key of ['purpose', 'knownLimits', 'prerequisites', 'sideEffects', 'resources'])
      assert.deepEqual(projected[key], original[key])
    assert.deepEqual(projected.command, [original.executable, ...original.args])
  }
  assert.ok(terrain.omissions.some(item => item.reason === 'context budget' && item.count > 0))
  const excerpt = terrain.sourceExcerpts.find(item =>
    item.headingTrail.at(-1)?.includes('Batch terrain notifications'))
  assert.equal(excerpt.truncated, true)
  assert.ok(terrain.omissions.some(item => item.path === excerpt.path &&
    item.reason === 'source section returned as a bounded window' &&
    item.retainedLines[0] === excerpt.lineStart && item.retainedLines[1] === excerpt.lineEnd))
})

// Keep Shaman-specific routing out of the terrain packet's mandatory metadata.
// Do not solve growth by increasing the default budget or trimming evidence/check limits.
test('Shaman appearance context keeps its complete checks and evidence within the default budget', () => {
  const { project, checks } = validateRepository(ROOT)
  const terrainMapping = project.subsystems.find(item => item.id === 'terrain-performance')
  const shamanMapping = project.subsystems.find(item => item.id === 'shaman-appearance')
  const expectedChecks = [
    'shaman-appearance-portable', 'shaman-assets-static',
    'shaman-appearance-browser', 'shaman-appearance-native',
    'level-start-portable', 'level-start-native', 'level-start-static', 'level-start-browser',
    'reincarnation-wave-portable', 'reincarnation-wave-native', 'reincarnation-wave-browser',
    'shaman-death-ground-portable', 'shaman-death-ground-native', 'shaman-death-ground-browser',
  ]
  assert.deepEqual(shamanMapping.checkIds, expectedChecks)
  assert.ok(expectedChecks.every(id => !terrainMapping.checkIds.includes(id)))
  assert.equal(terrainMapping.implementationPaths[0], 'app/native-terrain.ts')
  const packet = contextPacket(ROOT, { subsystem: 'shaman-appearance' })
  assert.equal(packet.budgetBytes, 24_000)
  assert.ok(packet.contextBytes <= packet.budgetBytes)
  assert.deepEqual(packet.checks.map(check => check.id), expectedChecks)
  for (const projected of packet.checks) {
    const original = checks.checks.find(check => check.id === projected.id)
    assert.equal(projected.purpose, original.purpose)
    assert.deepEqual(projected.knownLimits, original.knownLimits)
    assert.deepEqual(projected.command, [original.executable, ...original.args])
    assert.deepEqual(projected.prerequisites, original.prerequisites)
    assert.deepEqual(projected.sideEffects, original.sideEffects)
    assert.deepEqual(projected.resources, original.resources)
  }
  for (const reference of shamanMapping.evidence)
    assert.ok(packet.sourceExcerpts.some(item =>
      item.path === reference.path && item.headingTrail.at(-1) === reference.heading
    ), 'Required original Shaman evidence must remain visible: ' + reference.heading)
  assert.equal(packet.executesChecks, false)
})

// Task-table evidence has its own bounded packet; world picking must retain its limits.
test('Followers task context retains complete checks without bloating selection context', () => {
  const { project, checks } = validateRepository(ROOT)
  const mapping = project.subsystems.find(item => item.id === 'follower-task-controls')
  const selection = project.subsystems.find(item => item.id === 'selection')
  const expected = ['follower-tasks-portable', 'follower-tasks-native', 'follower-task-art-native',
    'follower-task-adapters-native', 'follower-tasks-browser']
  assert.deepEqual(mapping.checkIds, expected)
  assert.ok(expected.every(id => !selection.checkIds.includes(id)))
  const packet = contextPacket(ROOT, { subsystem: 'follower-task-controls' })
  assert.equal(packet.budgetBytes, 24_000)
  assert.ok(packet.contextBytes <= packet.budgetBytes)
  assert.deepEqual(packet.checks.map(check => check.id), expected)
  for (const projected of packet.checks) {
    const original = checks.checks.find(check => check.id === projected.id)
    for (const key of ['purpose', 'knownLimits', 'prerequisites', 'sideEffects', 'resources'])
      assert.deepEqual(projected[key], original[key])
    assert.deepEqual(projected.command, [original.executable, ...original.args])
  }
  for (const reference of mapping.evidence)
    assert.ok(packet.sourceExcerpts.some(item => item.path === reference.path && item.headingTrail.at(-1) === reference.heading))
  assert.equal(packet.executesChecks, false)
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

// Exercise the real source-owner trigger list against both narrow and conservative
// fixture routing. Adding a cheap check must not remove gates or broaden feedback.
test('protected held-drag owners add the cheap regression without changing existing routing', () =>
  withRepo(repo => {
    const { checks } = validateRepository(ROOT)
    const check = checks.checks.find(item => item.id === 'snapshot-drag-portable')
    assert.ok(check)
    assert.equal(check.automation, 'safe')
    assert.deepEqual([check.executable, ...check.args], ['node', '--test', 'tests/browser-snapshot-drag.test.mjs'])
    const owners = [...new Set(dragSourceProfiles.flatMap(profile => profile.slices.map(slice => slice.path)))]
    const paths = [...owners, 'scripts/browser-performance/snapshot-drag-contract.mjs',
      'scripts/browser-performance/snapshot-drag-observer.mjs', 'tests/browser-snapshot-drag.test.mjs']
    assert.deepEqual([...check.triggerPaths].sort(), [...paths].sort())
    for (const path of [...paths, 'tests/support/tooltip-scene.mjs', 'tests/support/bloodlust-scene.mjs',
      'tests/support/hut-smoke-scene.mjs', 'scripts/browser-performance/snapshot-capture.mjs', 'scripts/browser-game.mjs'])
      assert.ok(check.inputs.some(input => path === input || path.startsWith(`${input}/`)), `Missing check input: ${path}`)
    for (const path of ['scripts', 'tests/support']) mkdirSync(join(repo, path), { recursive: true })
    put(repo, 'package-lock.json', '{}\n')
    for (const path of paths) put(repo, path, '// fixture\n')
    // One explicit narrow owner and one shared owner; all other owners stay
    // unknown here so their conservative fallback is checked independently too.
    const mapping = JSON.parse(readFileSync(join(repo, 'engineering/project-map.json')))
    mapping.subsystems[0].implementationPaths.push('app/neutral-cursor.ts')
    mapping.subsystems[0].sharedPaths.push('app/scene-input-runtime.ts')
    put(repo, 'engineering/project-map.json', mapping)
    run(repo, 'git', 'add', '.')
    run(repo, 'git', 'commit', '-qm', 'source owner fixtures')
    const baseline = new Map()
    for (const path of paths) {
      appendFileSync(join(repo, path), '// changed\n')
      baseline.set(path, planChanges(repo))
      put(repo, path, '// fixture\n')
    }
    const manifest = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
    manifest.checks.push(check)
    put(repo, 'engineering/checks.json', manifest)
    run(repo, 'git', 'add', '.')
    run(repo, 'git', 'commit', '-qm', 'add portable triggers')
    for (const path of paths) {
      appendFileSync(join(repo, path), '// changed\n')
      const plan = planChanges(repo), previous = baseline.get(path)
      assert.deepEqual(plan.checks.find(item => item.id === check.id)?.command, [check.executable, ...check.args], path)
      assert.deepEqual(plan.checks.filter(item => item.id !== check.id), previous.checks, path)
      assert.deepEqual(plan.unknownPaths, previous.unknownPaths, path)
      assert.deepEqual(plan.affectedSubsystems, previous.affectedSubsystems, path)
      assert.equal(plan.feedback.scope, previous.feedback.scope, path)
      assert.equal(plan.feedback.finalGate, false)
      assert.equal(plan.feedback.fullVerificationRequired, true)
      assert.equal(plan.executesChecks, false)
      if (plan.feedback.scope === 'focused') assert.ok(plan.feedback.command.includes('tests/browser-snapshot-drag.test.mjs'))
      put(repo, path, '// fixture\n')
    }
    put(repo, 'app/unmapped.ts', '// unrelated\n')
    const unrelated = planChanges(repo)
    assert.ok(!unrelated.checks.some(item => item.id === check.id))
    assert.ok(unrelated.unknownPaths.includes('app/unmapped.ts'))
    assert.deepEqual(unrelated.feedback.command, ['npm', 'test'])
  }))

// The Tornado regression must be selected explicitly: input fingerprints are not
// dependency discovery, and the construction bundle does not execute this test.
test('Tornado building wood owners select their standalone portable regression without broadening routing', () =>
  withRepo(repo => {
    const { checks } = validateRepository(ROOT)
    const check = checks.checks.find(item => item.id === 'tornado-building-wood-portable')
    assert.ok(check)
    assert.equal(check.kind, 'portable')
    assert.equal(check.automation, 'safe')
    assert.deepEqual([check.executable, ...check.args], ['node', '--test', 'tests/tornado-building-wood.test.mjs'])
    const paths = ['tests/tornado-building-wood.test.mjs', 'app/building-runtime.ts',
      'app/tornado-runtime.ts', 'app/world-initialization.ts', 'app/scenery-provenance.ts']
    assert.deepEqual(check.triggerPaths, paths)
    assert.deepEqual(check.inputs, ['tests/tornado-building-wood.test.mjs', 'app',
      'package.json', 'pnpm-lock.yaml', 'package-lock.json'])
    assert.deepEqual(check.sideEffects, [])
    for (const path of ['pnpm-lock.yaml', 'package-lock.json', ...paths]) put(repo, path, '// fixture\n')
    // Exercise a narrow owner, a shared owner and conservative unknown owners.
    const mapping = JSON.parse(readFileSync(join(repo, 'engineering/project-map.json')))
    mapping.subsystems[0].implementationPaths.push('app/building-runtime.ts')
    mapping.subsystems[0].sharedPaths.push('app/world-initialization.ts')
    put(repo, 'engineering/project-map.json', mapping)
    run(repo, 'git', 'add', '.')
    run(repo, 'git', 'commit', '-qm', 'Tornado source owner fixtures')
    const baseline = new Map()
    for (const path of paths) {
      appendFileSync(join(repo, path), '// changed\n')
      baseline.set(path, planChanges(repo))
      put(repo, path, '// fixture\n')
    }
    const manifest = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
    manifest.checks.push(check)
    put(repo, 'engineering/checks.json', manifest)
    run(repo, 'git', 'add', '.')
    run(repo, 'git', 'commit', '-qm', 'add Tornado portable triggers')
    for (const path of paths) {
      appendFileSync(join(repo, path), '// changed\n')
      const plan = planChanges(repo), previous = baseline.get(path)
      const selected = plan.checks.find(item => item.id === check.id)
      assert.deepEqual(selected?.command, [check.executable, ...check.args], path)
      assert.ok(selected.reasons.includes(`explicit check trigger changed: ${path}`), path)
      assert.deepEqual(plan.checks.filter(item => item.id !== check.id), previous.checks, path)
      assert.deepEqual(plan.unknownPaths, previous.unknownPaths, path)
      assert.deepEqual(plan.affectedSubsystems, previous.affectedSubsystems, path)
      assert.equal(plan.feedback.scope, previous.feedback.scope, path)
      assert.equal(plan.feedback.finalGate, false)
      assert.equal(plan.feedback.fullVerificationRequired, true)
      assert.equal(plan.executesChecks, false)
      if (plan.feedback.scope === 'focused') assert.ok(plan.feedback.command.includes('tests/tornado-building-wood.test.mjs'))
      put(repo, path, '// fixture\n')
    }
    // Even files within the broad fingerprint directory must not become triggers.
    appendFileSync(join(repo, 'app/a.ts'), '// unrelated mapped owner\n')
    const mapped = planChanges(repo)
    assert.ok(!mapped.checks.some(item => item.id === check.id))
    put(repo, 'app/unmapped.ts', '// unrelated unknown owner\n')
    const unknown = planChanges(repo)
    assert.ok(!unknown.checks.some(item => item.id === check.id))
    assert.ok(unknown.unknownPaths.includes('app/unmapped.ts'))
    assert.deepEqual(unknown.feedback.command, ['npm', 'test'])
  }))

test('native UI checker changes select focused regressions without losing workflow gates', () =>
  withRepo(repo => {
    const check = JSON.parse(readFileSync(join(ROOT, 'engineering/checks.json'))).checks
      .find(item => item.id === 'native-ui-evidence-tests')
    assert.ok(check)
    assert.equal(check.automation, 'safe')
    assert.deepEqual([check.executable, ...check.args], [
      'node', '--test',
      'tests/native-ui-evidence.test.mjs',
      'tests/browser-options-audio.test.mjs',
      'tests/campaign-popup-fullscreen-fixture.test.mjs',
      'tests/pause-world-snapshot.test.mjs',
      'tests/pause-clearance-batch.test.mjs',
      'tests/pause-checker-registration.test.mjs',
      'tests/pause-focus-observation.test.mjs',
      'tests/pause-keyboard-traversal.test.mjs',
      'tests/checkpoint-scrollbar.test.mjs',
      'tests/checkpoint-body-clearance.test.mjs',
      'tests/fullscreen-clearance.test.mjs',
      'tests/options-copy-clearance.test.mjs',
      'tests/recovery-input-budget.test.mjs',
      'tests/original-loading-screen.test.mjs',
      'tests/checkpoint-scroll-area.test.mjs',
    ])
    const workflowPaths = ['scripts/native-ui-evidence/options-audio-control-style.mjs',
      'scripts/browser-options-audio.mjs', 'tests/browser-options-audio.test.mjs',
      'scripts/native-ui-evidence/policy.mjs', 'tests/native-ui-evidence.test.mjs',
      '.github/workflows/native-ui-evidence.yml', 'engineering/native-ui-evidence.md']
    const popupPaths = [
      'scripts/campaign-popup-fixture/home-source.mjs', 'scripts/campaign-popup-fixture/fullscreen-menu.mjs',
      'scripts/campaign-popup-fixture/finalize.mjs', 'scripts/campaign-popup-fixture/run.mjs',
      'tests/campaign-popup-fullscreen-fixture.test.mjs',
      'app/scene-input-runtime.ts', 'app/fullscreen-session.ts']
    const paths = [...workflowPaths, ...popupPaths]
    for (const input of check.inputs) {
      // Keep the real fixture routing manifest: it is itself a declared input.
      if (input === 'engineering/checks.json') continue
      if (input === 'scripts/native-ui-evidence') mkdirSync(join(repo, input), { recursive: true })
      else put(repo, input, input === 'package.json' ? '{"type":"module"}\n' : '// fixture\n')
    }
    for (const path of paths) put(repo, path, '// fixture\n')
    run(repo, 'git', 'add', '.'); run(repo, 'git', 'commit', '-qm', 'native UI checker source fixtures')
    const baseline = new Map()
    for (const path of paths) {
      appendFileSync(join(repo, path), '// changed\n')
      baseline.set(path, planChanges(repo))
      put(repo, path, '// fixture\n')
    }
    const manifest = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
    manifest.checks.push(check); put(repo, 'engineering/checks.json', manifest)
    run(repo, 'git', 'add', '.'); run(repo, 'git', 'commit', '-qm', 'native UI checker routing')
    for (const path of paths) {
      appendFileSync(join(repo, path), '// changed\n')
      const plan = planChanges(repo), previous = baseline.get(path)
      assert.deepEqual(plan.checks.find(item => item.id === check.id)?.command, [check.executable, ...check.args], path)
      // Explicit triggers add a cheap check, not workflow ownership. Preserve
      // unknown-path fallback and every pre-existing gate for fixture/app paths.
      assert.deepEqual(plan.checks.filter(item => item.id !== check.id), previous.checks, path)
      assert.deepEqual(plan.unknownPaths, previous.unknownPaths, path)
      assert.deepEqual(plan.affectedSubsystems, previous.affectedSubsystems, path)
      if (path === '.github/workflows/native-ui-evidence.yml') {
        // A known workflow with no exact test command can gain focused editing
        // advice. Its existing final gates remain identical above and required below.
        assert.equal(previous.feedback.scope, 'full', path)
        assert.equal(plan.feedback.scope, 'focused', path)
        assert.deepEqual(plan.feedback.command, ['npm', 'run', 'test:focus', '--', ...check.args.slice(1).sort()], path)
      } else assert.equal(plan.feedback.scope, previous.feedback.scope, path)
      if (workflowPaths.includes(path)) {
        assert.deepEqual(plan.unknownPaths, [], path)
        for (const id of ['orchestration-tests', 'orchestration-structural', 'repository-check'])
          assert.ok(plan.checks.some(item => item.id === id), `${path}: missing ${id}`)
      } else {
        assert.deepEqual(plan.unknownPaths, [path], path)
        assert.ok(plan.checks.some(item => item.id === 'repository-check'), path)
        if (path.startsWith('app/')) assert.ok(plan.checks.some(item => item.id === 'production-build'), path)
      }
      assert.equal(plan.executesChecks, false)
      assert.equal(plan.feedback.fullVerificationRequired, true)
      assert.equal(plan.feedback.finalGate, false)
      put(repo, path, '// fixture\n')
    }
    put(repo, 'scripts/browser-unregistered.mjs', '// unrelated\n')
    const unknown = planChanges(repo)
    assert.deepEqual(unknown.unknownPaths, ['scripts/browser-unregistered.mjs'])
    assert.ok(!unknown.checks.some(item => item.id === check.id))
    assert.ok(unknown.checks.some(item => item.id === 'repository-check'))
  }))

test('explicit check triggers reject unsafe, malformed and empty routes', () =>
  withRepo(repo => {
    const checks = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
    for (const triggerPaths of [[], 'app/a.ts', ['../escape'], ['/absolute']]) {
      checks.checks[0].triggerPaths = triggerPaths
      put(repo, 'engineering/checks.json', checks)
      assert.throws(() => validateRepository(repo), /triggerPaths|Non-canonical|Unsafe repository path/)
    }
  }))

test('context-index mapping changes already require behavioral orchestration tests as well as structure', () =>
  withRepo(repo => {
    const { checks } = validateRepository(ROOT)
    const original = checks.checks.find(check => check.id === 'orchestration-tests')
    assert.ok(original.args.includes('tests/orchestration.test.mjs'))
    const manifest = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
    Object.assign(manifest.checks.find(check => check.id === original.id), {
      executable: original.executable, args: original.args,
    })
    put(repo, 'engineering/checks.json', manifest)
    run(repo, 'git', 'add', '.')
    run(repo, 'git', 'commit', '-qm', 'real orchestration command')
    const base = run(repo, 'git', 'rev-parse', 'HEAD').trim()
    for (const path of ['engineering/project-map.json', 'engineering/README.md']) {
      const previous = readFileSync(join(repo, path), 'utf8')
      appendFileSync(join(repo, path), '\n')
      const plan = planChanges(repo, { base })
      assert.ok(plan.checks.find(check => check.id === 'orchestration-tests').command.includes('tests/orchestration.test.mjs'))
      assert.ok(plan.checks.some(check => check.id === 'orchestration-structural'))
      assert.ok(plan.checks.some(check => check.id === 'repository-check'))
      assert.deepEqual(plan.feedback.command, ['npm', 'test'])
      assert.equal(plan.executesChecks, false)
      put(repo, path, previous)
    }
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
  const spec = contract(repo, 'HEAD')
  delete spec.identity
  delete spec.version
  spec.verification.results = []
  return spec
}

function configureAggregate(repo) {
  const checks = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
  const configure = (id, executable, args) => Object.assign(checks.checks.find(check => check.id === id),
    { automation: 'safe', executable, args })
  configure('repository-check', 'npm', ['run', 'check'])
  configure('orchestration-tests', 'node', ['--test', 'tests/orchestration.test.mjs', 'tests/workflow-handoff.test.mjs', 'tests/receipt-streams.test.mjs', 'tests/workflow-policy.test.mjs', 'tests/research-evidence.test.mjs', 'tests/theme-reference-evidence.test.mjs', 'tests/test-runner.test.mjs'])
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

for (const checkId of ['orchestration-tests', 'repository-check']) {
  test(`${checkId} receipts become stale when worker configuration changes`, async () =>
    withAsyncRepo(async repo => {
      configureAggregate(repo)
      const config = '.codex/config.toml'
      put(repo, config, '[agents]\nmax_concurrent_threads_per_session = 6\n')
      const checks = JSON.parse(readFileSync(join(repo, 'engineering/checks.json')))
      for (const id of ['orchestration-tests', 'repository-check']) {
        checks.checks.find(check => check.id === id).inputs.push(config)
      }
      put(repo, 'engineering/checks.json', checks)
      const spec = taskSpec(repo)
      spec.verification.requiredCheckIds = [checkId]
      const task = prepareContract(repo, spec, { taskId: 'config-fingerprint' })
      const path = 'work/orchestration/config-fingerprint.json'
      put(repo, path, task)
      const outcome = await verifyContract(repo, path, {
        env: {},
        execute: async () => ({ exitCode: 0, stdout: 'passed\n', stderr: '', timedOut: false }),
      })
      assert.equal(outcome.status, 'passed')
      assert.ok(outcome.results[0].inputPaths.includes(config))
      const saved = JSON.parse(readFileSync(join(repo, path)))
      assert.equal(auditContract(repo, saved).invalidatedResults.length, 0)
      put(repo, config, '[agents]\nmax_concurrent_threads_per_session = 5\n')
      assert.ok(auditContract(repo, saved).invalidatedResults.some(result => result.checkId === checkId))
    }))
}

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


// Copy the real CLI and its import closure into the existing small repository.
// Only the context child is synthetic: never recursively execute this test suite.
function preflightCliFixture(t) {
  const repo = fixtureRepo()
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  mkdirSync(join(repo, 'scripts/orchestration'), { recursive: true })
  for (const name of ['preflight', 'cli', 'dependency-profile', 'research-evidence', 'review-bundle', 'receipt-streams']) {
    copyFileSync(new URL(`../scripts/orchestration/${name}.mjs`, import.meta.url),
      join(repo, `scripts/orchestration/${name}.mjs`))
  }
  put(repo, 'tests/orchestration.test.mjs', [
    "import assert from 'node:assert/strict'",
    "import { existsSync } from 'node:fs'",
    "import test from 'node:test'",
    "test('context fixture', () => assert.ok(existsSync('GOAL.md')))",
    "test('unselected fixture', () => assert.fail('must remain filtered'))",
    '',
  ].join('\n'))
  run(repo, 'git', 'config', 'core.whitespace', 'blank-at-eol,blank-at-eof,space-before-tab')
  run(repo, 'git', 'add', '.')
  run(repo, 'git', 'commit', '-qm', 'CLI fixture')
  return { repo, base: run(repo, 'git', 'rev-parse', 'HEAD').trim() }
}

function runPreflightCli(repo, args, cwd = repo) {
  const snapshot = () => ({
    head: run(repo, 'git', 'rev-parse', 'HEAD'),
    index: run(repo, 'git', 'ls-files', '--stage'),
    status: run(repo, 'git', 'status', '--porcelain=v1', '--untracked-files=all'),
    diff: run(repo, 'git', 'diff', '--binary'),
  })
  const before = snapshot()
  const env = { ...process.env }
  // This CLI launches its own bounded node:test child, outside the parent runner.
  delete env.NODE_TEST_CONTEXT
  const result = spawnSync(process.execPath,
    [join(repo, 'scripts/orchestration/preflight.mjs'), ...args],
    { cwd, env, encoding: 'utf8', timeout: 20_000 })
  assert.ifError(result.error)
  assert.equal(result.signal, null)
  assert.deepEqual(snapshot(), before, 'preflight must not change HEAD, index or worktree')
  return result
}

function preflightCliReport(stdout) {
  // stdout intentionally includes inherited validator/TAP or Git diagnostics.
  // The final pretty-printed JSON object is the preflight receipt, not all stdout.
  const start = stdout.lastIndexOf('{\n  "base":')
  assert.ok(start >= 0, stdout)
  const report = JSON.parse(stdout.slice(start))
  assert.deepEqual(Object.keys(report), ['base', 'paths', 'results', 'status', 'finalGate'])
  assert.equal(report.finalGate, false)
  for (const result of report.results) {
    assert.deepEqual(Object.keys(result),
      ['command', 'startedAt', 'finishedAt', 'status', 'exitCode', 'signal', 'error'])
    assert.ok(Number.isFinite(Date.parse(result.startedAt)))
    assert.ok(Date.parse(result.finishedAt) >= Date.parse(result.startedAt))
    assert.equal(result.signal, null)
  }
  return report
}

test('preflight CLI passes clean untracked changes from its script root with inherited output', t => {
  const { repo, base } = preflightCliFixture(t)
  put(repo, '-clean file.txt', 'clean\n')
  // Launch outside the repository: children must still run in the CLI's root.
  const result = runPreflightCli(repo, ['--base', base], tmpdir())
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.equal(result.stderr, '')
  assert.match(result.stdout, /context fixture/)
  assert.doesNotMatch(result.stdout, /must remain filtered/)
  const report = preflightCliReport(result.stdout)
  assert.equal(report.base, base)
  assert.deepEqual(report.paths, ['-clean file.txt'])
  assert.equal(report.status, 'passed')
  assert.equal(report.results.length, 6)
  assert.ok(report.results.every(item => item.status === 'passed' && item.error === null))
  assert.deepEqual(report.results.map(item => item.exitCode), [0, 0, 0, 1, 0, 0])
  assert.deepEqual(report.results[3].command.slice(-4), ['--no-index', '--', '/dev/null', '-clean file.txt'])
  assert.deepEqual(report.results.at(-1).command,
    ['node', '--test', '--test-name-pattern=context', 'tests/orchestration.test.mjs'])
  assert.equal(readFileSync(join(repo, '-clean file.txt'), 'utf8'), 'clean\n')
})

test('preflight CLI exits one on real whitespace findings and stops before other checks', t => {
  const { repo, base } = preflightCliFixture(t)
  put(repo, '-finding file.txt', 'trailing   \n')
  const result = runPreflightCli(repo, ['--base', base])
  assert.equal(result.status, 1)
  assert.equal(result.stderr, '')
  assert.match(result.stdout, /-finding file\.txt:1: trailing whitespace/)
  const report = preflightCliReport(result.stdout)
  assert.equal(report.status, 'failed')
  assert.equal(report.results.length, 4)
  assert.equal(report.results.at(-1).exitCode, 3)
  assert.equal(report.results.at(-1).status, 'failed')
  assert.ok(report.results.every(item => item.command[0] === 'git'))
  assert.equal(readFileSync(join(repo, '-finding file.txt'), 'utf8'), 'trailing   \n')
})

for (const unavailable of ['missing', 'nonexecutable']) {
  test(`preflight CLI reports a ${unavailable} tool as blocked JSON with exit one`, t => {
    const { repo, base } = preflightCliFixture(t)
    if (unavailable === 'nonexecutable') {
      put(repo, 'node_modules/.bin/eslint', '#!/bin/sh\nexit 0\n')
      chmodSync(join(repo, 'node_modules/.bin/eslint'), 0o644)
      run(repo, 'git', 'add', '.')
      run(repo, 'git', 'commit', '-qm', 'unavailable tool')
    }
    put(repo, 'tests/new.test.mjs', 'export {}\n')
    const result = runPreflightCli(repo, ['--base', base])
    assert.equal(result.status, 1)
    assert.equal(result.stderr, '')
    const report = preflightCliReport(result.stdout)
    assert.equal(report.status, 'blocked')
    assert.equal(report.results.length, 5)
    assert.deepEqual(report.results.at(-1).command,
      ['node_modules/.bin/eslint', '--max-warnings', '0', '--', 'tests/new.test.mjs'])
    assert.equal(report.results.at(-1).status, 'blocked')
    assert.equal(report.results.at(-1).exitCode, null)
    assert.match(report.results.at(-1).error, unavailable === 'missing' ? /ENOENT/ : /EACCES/)
  })
}

test('preflight CLI rejects invalid arguments on stderr without creating an output file', t => {
  const { repo, base } = preflightCliFixture(t)
  for (const [args, message] of [
    [[], 'Requires --base <accepted-base>'],
    [['--base', 'missing-base'], 'Base ref is not a commit'],
    [['--base', base, '--output', 'unexpected.json'], 'Only --base is supported'],
  ]) {
    const result = runPreflightCli(repo, args)
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /^orchestration preflight: /m)
    assert.ok(result.stderr.includes(message), result.stderr)
  }
})

test('preflight CLI fails closed on a real unreadable changed file', {
  skip: process.platform === 'win32' || process.getuid?.() === 0
    ? 'requires ordinary Unix file permissions' : false,
}, t => {
  const { repo, base } = preflightCliFixture(t)
  const path = join(repo, 'unreadable.txt')
  writeFileSync(path, 'private fixture\n')
  chmodSync(path, 0)
  try {
    const result = runPreflightCli(repo, ['--base', base])
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /^orchestration preflight: .*EACCES/)
    assert.match(result.stderr, /unreadable\.txt/)
  } finally {
    chmodSync(path, 0o600)
  }
  assert.equal(readFileSync(path, 'utf8'), 'private fixture\n')
})


test('preflight CLI preserves failed child stdout and stderr before the final report', t => {
  const { repo, base } = preflightCliFixture(t)
  put(repo, 'node_modules/.bin/eslint', [
    '#!/usr/bin/env node',
    "process.stdout.write('fixture lint finding\\n')",
    "process.stderr.write('fixture lint diagnostic\\n')",
    'process.exitCode = 2',
    '',
  ].join('\n'))
  chmodSync(join(repo, 'node_modules/.bin/eslint'), 0o755)
  run(repo, 'git', 'add', '.')
  run(repo, 'git', 'commit', '-qm', 'failing child fixture')
  put(repo, 'tests/new.test.mjs', 'export {}\n')
  const result = runPreflightCli(repo, ['--base', base])
  assert.equal(result.status, 1)
  assert.equal(result.stderr, 'fixture lint diagnostic\n')
  assert.ok(result.stdout.startsWith('fixture lint finding\n'))
  const report = preflightCliReport(result.stdout)
  assert.equal(report.status, 'failed')
  assert.equal(report.results.length, 5)
  assert.equal(report.results.at(-1).exitCode, 2)
  assert.equal(report.results.at(-1).error, null)
})
