import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  linkSync,
  readdirSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { buildReviewBundle, verifyReviewBundle } from '../scripts/orchestration/review-bundle.mjs'
import { runCommandReceipt } from '../scripts/orchestration/command-receipt.mjs'
import { readReceiptStreams } from '../scripts/orchestration/receipt-streams.mjs'
import { discoverReceipts } from '../scripts/parity-measure.mjs'


const sha = value => createHash('sha256').update(value).digest('hex')
const DECODE_DEPTH_LIMIT = 8
const DECODE_BYTES_LIMIT = 256 * 1024
const jsonWrap = (value, layers) => {
  let wrapped = value
  for (let index = 0; index < layers; index++) wrapped = JSON.stringify(wrapped)
  return wrapped
}
const run = (cwd, command, ...args) => execFileSync(command, args, { cwd, encoding: 'utf8' }).trim()

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'pnd-handoff-')),
    repo = join(root, 'repo'),
    bundle = join(root, 'review-bundle')
  mkdirSync(repo)
  writeFileSync(join(repo, '.gitignore'), 'work/\n')
  writeFileSync(join(repo, 'source.txt'), 'before\n')
  run(repo, 'git', 'init', '-q')
  run(repo, 'git', 'config', 'user.email', 'fixture@example.com')
  run(repo, 'git', 'config', 'user.name', 'Fixture')
  run(repo, 'git', 'add', '.')
  run(repo, 'git', 'commit', '-qm', 'base')
  const base = run(repo, 'git', 'rev-parse', 'HEAD')
  writeFileSync(join(repo, 'source.txt'), 'after\n')
  run(repo, 'git', 'add', 'source.txt')
  run(repo, 'git', 'commit', '-qm', 'change')
  mkdirSync(join(repo, 'work/orchestration/task'), { recursive: true })
  writeFileSync(
    join(repo, 'work/orchestration/task/receipt.json'),
    JSON.stringify(
      {
        status: 'passed',
        source: repo,
        home: homedir(),
        evidence: 'fixture',
      },
      null,
      2
    ) + '\n'
  )
  return { root, repo, bundle, base }
}

function receiptCli(repo) {
  const helper = join(repo, 'scripts/orchestration/command-receipt.mjs')
  mkdirSync(join(repo, 'scripts/orchestration'), { recursive: true })
  writeFileSync(helper, readFileSync(new URL('../scripts/orchestration/command-receipt.mjs', import.meta.url)))
  for (const path of ['scripts/parity-measure.mjs', 'scripts/parity-discovery.mjs', 'scripts/parity-json-metadata.mjs', 'scripts/parity-owned-checkpoint.mjs', 'scripts/parity-owned-blast.mjs', 'scripts/orchestration/cli.mjs', 'scripts/orchestration/dependency-profile.mjs', 'scripts/orchestration/receipt-streams.mjs', 'scripts/orchestration/command-receipt-v1.mjs', 'scripts/orchestration/command-log.mjs', 'scripts/orchestration/research-evidence.mjs', 'scripts/orchestration/review-bundle.mjs'])
    writeFileSync(join(repo, path), readFileSync(new URL(`../${path}`, import.meta.url)))
  return helper
}

function deletionFixture() {
  const root = mkdtempSync(join(tmpdir(), 'pnd-handoff-delete-')),
    repo = join(root, 'repo'),
    bundle = join(root, 'review-bundle')
  mkdirSync(repo)
  writeFileSync(join(repo, '.gitignore'), 'work/\n')
  writeFileSync(join(repo, 'deleted.txt'), 'delete-me\n')
  run(repo, 'git', 'init', '-q')
  run(repo, 'git', 'config', 'user.email', 'fixture@example.com')
  run(repo, 'git', 'config', 'user.name', 'Fixture')
  run(repo, 'git', 'add', '.')
  run(repo, 'git', 'commit', '-qm', 'base')
  const base = run(repo, 'git', 'rev-parse', 'HEAD')
  run(repo, 'git', 'rm', '-q', 'deleted.txt')
  run(repo, 'git', 'commit', '-qm', 'delete source')
  return { root, repo, bundle, base }
}

function expectedIdentity(repo, base) {
  const head = run(repo, 'git', 'rev-parse', 'HEAD'),
    content = readFileSync(join(repo, 'source.txt')),
    diff = execFileSync('git', ['diff', '--binary', `${base}..${head}`, '--'], { cwd: repo }),
    receiptPath = 'work/orchestration/task/receipt.json',
    receipt = readFileSync(join(repo, receiptPath), 'utf8'),
    copiedReceipt = receipt.replaceAll(repo, '<SOURCE_ROOT>').replaceAll(homedir(), '<HOME>')
  return {
    expectedHead: head,
    expectedDiffSha256: sha(diff),
    expectedSources: [{ path: 'source.txt', sha256: sha(content) }],
    expectedReceipts: [{ path: receiptPath, sha256: sha(copiedReceipt) }],
  }
}

test('review bundle is independently readable from a non-overlapping local fixture', () => {
  const { root, repo, bundle, base } = fixture()
  try {
    const result = buildReviewBundle(repo, {
      taskId: 'fixture-review',
      base,
      output: bundle,
      receipts: ['work/orchestration/task/receipt.json'],
    })
    assert.equal(result.status, 'passed')
    const manifest = JSON.parse(readFileSync(join(bundle, 'manifest.json'), 'utf8')),
      head = run(repo, 'git', 'rev-parse', 'HEAD'),
      changed = readFileSync(join(repo, 'source.txt'))
    assert.equal(manifest.repository.headOid, head)
    assert.equal(Object.hasOwn(manifest.reviewerPreflight, 'localDev'), false)
    assert.match(manifest.reviewerPreflight.instructions, /trusted caller-supplied identities/)
    assert.doesNotMatch(readFileSync(join(bundle, 'README.md'), 'utf8'), /Local Dev|project_open|PROJECT_IN_USE/)
    assert.equal(manifest.sources.length, 1)
    assert.equal(manifest.sources[0].path, 'source.txt')
    assert.equal(manifest.sources[0].sha256, sha(changed))
    assert.equal(manifest.receipts.length, 1)
    const copied = readFileSync(join(bundle, manifest.receipts[0].bundlePath), 'utf8')
    assert.equal(copied.includes(repo), false)
    assert.equal(copied.includes(homedir()), false)
    assert.match(copied, /<SOURCE_ROOT>/)
    assert.match(copied, /<HOME>/)
    const identity = expectedIdentity(repo, base)
    assert.equal(verifyReviewBundle(bundle, identity).status, 'passed')
    const standalone = JSON.parse(
      execFileSync(
        process.execPath,
        [
          'verify.mjs',
          '--expected-head',
          identity.expectedHead,
          '--expected-diff-sha256',
          identity.expectedDiffSha256,
          '--expected-source',
          `source.txt=${identity.expectedSources[0].sha256}`,
          '--expected-receipt',
          `${identity.expectedReceipts[0].path}=${identity.expectedReceipts[0].sha256}`,
        ],
        { cwd: bundle, encoding: 'utf8' }
      )
    )
    assert.equal(standalone.status, 'passed')
    assert.equal(standalone.headOid, head)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('review bundle rejects quoted secret fields and environment-secret files atomically', () => {
  const { root, repo, bundle, base } = fixture()
  try {
    const receipt = join(repo, 'work/orchestration/task/receipt.json')
    writeFileSync(receipt, '{"password":"top-secret","credential":"value"}\n')
    assert.throws(
      () =>
        buildReviewBundle(repo, {
          taskId: 'secret-reject',
          base,
          output: bundle,
          receipts: ['work/orchestration/task/receipt.json'],
        }),
      /secret-like/i
    )
    assert.equal(existsSync(bundle), false)

    writeFileSync(receipt, '{"status":"passed"}\n')
    const envLocal = join(repo, 'work/orchestration/task/.env.local')
    writeFileSync(envLocal, 'TOKEN=secret\n')
    assert.throws(
      () =>
        buildReviewBundle(repo, {
          taskId: 'env-reject',
          base,
          output: bundle,
          receipts: ['work/orchestration/task/.env.local'],
        }),
      /sensitive receipt path/i
    )
    assert.equal(existsSync(bundle), false)

    const productionEnv = join(repo, 'work/orchestration/task/production.env')
    writeFileSync(productionEnv, 'TOKEN=secret\n')
    assert.throws(
      () =>
        buildReviewBundle(repo, {
          taskId: 'env-equivalent-reject',
          base,
          output: bundle,
          receipts: ['work/orchestration/task/production.env'],
        }),
      /sensitive receipt path/i
    )
    assert.equal(existsSync(bundle), false)

    const retry = buildReviewBundle(repo, {
      taskId: 'atomic-retry',
      base,
      output: bundle,
      receipts: ['work/orchestration/task/receipt.json'],
    })
    assert.equal(retry.status, 'passed')
    assert.equal(existsSync(join(bundle, 'changes.patch')), true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('decoded command-receipt stdout and stderr reject escaped secret JSON without exposing values', () => {
  const { root, repo, base } = fixture()
  try {
    const receiptPath = 'work/orchestration/task/receipt.json',
      receipt = join(repo, receiptPath),
      hidden = ['SYNTHETIC', 'DO', 'NOT', 'ECHO', '48319'].join('_')
    for (const stream of ['stdout', 'stderr']) {
      const envelope = {
        version: 1,
        kind: 'pnd-command-receipt',
        source: { headOid: run(repo, 'git', 'rev-parse', 'HEAD'), branch: 'fixture' },
        command: ['node', 'fixture'],
        cwd: repo,
        exitCode: 0,
        stdout: '',
        stderr: '',
      }
      envelope[stream] =
        stream === 'stdout'
          ? JSON.stringify({ password: hidden })
          : JSON.stringify({ credential: hidden })
      writeFileSync(receipt, JSON.stringify(envelope, null, 2) + '\n')
      const output = join(root, `secret-${stream}-bundle`)
      let failure
      try {
        buildReviewBundle(repo, {
          taskId: `decoded-${stream}-secret`,
          base,
          output,
          receipts: [receiptPath],
        })
      } catch (error) {
        failure = error
      }
      assert(failure, `decoded ${stream} secret must be rejected`)
      assert.match(failure.message, /decoded|secret-like/i)
      assert.equal(failure.message.includes(hidden), false)
      assert.equal(existsSync(output), false)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('double JSON-string wrappers in stdout and stderr reject secrets without echoing values', () => {
  const { root, repo, base } = fixture()
  try {
    const receiptPath = 'work/orchestration/task/receipt.json',
      receipt = join(repo, receiptPath),
      hidden = ['SYNTHETIC', 'DOUBLE', 'WRAP', 'DO', 'NOT', 'ECHO', '71263'].join('_')
    for (const stream of ['stdout', 'stderr']) {
      const envelope = {
        version: 1,
        kind: 'pnd-command-receipt',
        source: { headOid: run(repo, 'git', 'rev-parse', 'HEAD'), branch: 'fixture' },
        command: ['node', 'fixture'],
        cwd: repo,
        exitCode: 0,
        stdout: '',
        stderr: '',
      }
      envelope[stream] = JSON.stringify(
        JSON.stringify(stream === 'stdout' ? { password: hidden } : { credential: hidden })
      )
      writeFileSync(receipt, JSON.stringify(envelope, null, 2) + '\n')
      const output = join(root, `double-secret-${stream}-bundle`)
      let failure
      try {
        buildReviewBundle(repo, {
          taskId: `double-decoded-${stream}-secret`,
          base,
          output,
          receipts: [receiptPath],
        })
      } catch (error) {
        failure = error
      }
      assert(failure, `double-decoded ${stream} secret must be rejected`)
      assert.match(failure.message, /decoded|secret-like/i)
      assert.equal(failure.message.includes(hidden), false)
      assert.equal(existsSync(output), false)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('benign nested JSON strings pass within depth and decoded-byte bounds', () => {
  const { root, repo, bundle, base } = fixture()
  try {
    const receiptPath = 'work/orchestration/task/receipt.json',
      receipt = join(repo, receiptPath),
      envelope = {
        version: 1,
        kind: 'pnd-command-receipt',
        source: { headOid: run(repo, 'git', 'rev-parse', 'HEAD'), branch: 'fixture' },
        command: ['node', 'fixture'],
        cwd: repo,
        exitCode: 0,
        stdout: jsonWrap({ status: 'safe', nested: ['ok'] }, DECODE_DEPTH_LIMIT),
        stderr: '',
      }
    writeFileSync(receipt, JSON.stringify(envelope, null, 2) + '\n')
    assert.equal(
      buildReviewBundle(repo, {
        taskId: 'nested-benign-depth-boundary',
        base,
        output: bundle,
        receipts: [receiptPath],
      }).status,
      'passed'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('decoded JSON recursion fails closed beyond depth or total decoded-byte bounds', () => {
  for (const kind of ['depth', 'bytes']) {
    const { root, repo, base } = fixture()
    try {
      const receiptPath = 'work/orchestration/task/receipt.json',
        receipt = join(repo, receiptPath),
        envelope = {
          version: 1,
          kind: 'pnd-command-receipt',
          source: { headOid: run(repo, 'git', 'rev-parse', 'HEAD'), branch: 'fixture' },
          command: ['node', 'fixture'],
          cwd: repo,
          exitCode: 0,
          stdout:
            kind === 'depth'
              ? jsonWrap({ status: 'safe' }, DECODE_DEPTH_LIMIT + 1)
              : JSON.stringify('x'.repeat(DECODE_BYTES_LIMIT - 1)),
          stderr: '',
        },
        output = join(root, `decoded-${kind}-limit-bundle`)
      writeFileSync(receipt, JSON.stringify(envelope, null, 2) + '\n')
      let failure
      try {
        buildReviewBundle(repo, {
          taskId: `decoded-${kind}-limit`,
          base,
          output,
          receipts: [receiptPath],
        })
      } catch (error) {
        failure = error
      }
      assert(failure, `decoded ${kind} overflow must fail closed`)
      assert.match(failure.message, /decoded.*(?:depth|bytes|limit)/i)
      assert.equal(existsSync(output), false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }
})

test('decoded JSON byte boundary accepts exactly the configured budget', () => {
  const { root, repo, bundle, base } = fixture()
  try {
    const receiptPath = 'work/orchestration/task/receipt.json',
      receipt = join(repo, receiptPath),
      envelope = {
        version: 1,
        kind: 'pnd-command-receipt',
        source: { headOid: run(repo, 'git', 'rev-parse', 'HEAD'), branch: 'fixture' },
        command: ['node', 'fixture'],
        cwd: repo,
        exitCode: 0,
        stdout: JSON.stringify('x'.repeat(DECODE_BYTES_LIMIT - 2)),
        stderr: '',
      }
    writeFileSync(receipt, JSON.stringify(envelope, null, 2) + '\n')
    assert.equal(
      buildReviewBundle(repo, {
        taskId: 'decoded-byte-boundary',
        base,
        output: bundle,
        receipts: [receiptPath],
      }).status,
      'passed'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('tracked deletion has an explicit expected deletion identity and rejects tamper or omission', () => {
  const { root, repo, bundle, base } = deletionFixture()
  try {
    const result = buildReviewBundle(repo, {
      taskId: 'deletion-identity',
      base,
      output: bundle,
    })
    assert.equal(result.manifest.sources.length, 1)
    assert.deepEqual(result.manifest.sources[0], {
      status: 'D',
      path: 'deleted.txt',
      state: 'deleted',
    })
    const head = run(repo, 'git', 'rev-parse', 'HEAD'),
      diff = execFileSync('git', ['diff', '--binary', `${base}..${head}`, '--'], { cwd: repo }),
      expected = {
        expectedHead: head,
        expectedDiffSha256: sha(diff),
        expectedSources: [],
        expectedDeletions: ['deleted.txt'],
        expectedReceipts: [],
      },
      manifestPath = join(bundle, 'manifest.json'),
      original = JSON.parse(readFileSync(manifestPath, 'utf8'))

    assert.equal(verifyReviewBundle(bundle, expected).status, 'passed')
    const standalone = JSON.parse(
      execFileSync(
        process.execPath,
        [
          'verify.mjs',
          '--expected-head',
          head,
          '--expected-diff-sha256',
          expected.expectedDiffSha256,
          '--expected-deletion',
          'deleted.txt',
        ],
        { cwd: bundle, encoding: 'utf8' }
      )
    )
    assert.equal(standalone.status, 'passed')

    const tampered = structuredClone(original)
    tampered.sources[0] = {
      status: 'D',
      path: 'deleted.txt',
      state: 'present',
      sha256: 'a'.repeat(64),
    }
    writeFileSync(manifestPath, JSON.stringify(tampered, null, 2) + '\n')
    assert.throws(
      () => verifyReviewBundle(bundle, expected),
      /deletion|deleted status|source identity/i
    )
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            'verify.mjs',
            '--expected-head',
            head,
            '--expected-diff-sha256',
            expected.expectedDiffSha256,
            '--expected-deletion',
            'deleted.txt',
          ],
          { cwd: bundle, encoding: 'utf8', stdio: 'pipe' }
        ),
      /Command failed/
    )

    const missing = structuredClone(original)
    missing.sources = []
    writeFileSync(manifestPath, JSON.stringify(missing, null, 2) + '\n')
    assert.throws(() => verifyReviewBundle(bundle, expected), /count|deletion|source identity/i)
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            'verify.mjs',
            '--expected-head',
            head,
            '--expected-diff-sha256',
            expected.expectedDiffSha256,
            '--expected-deletion',
            'deleted.txt',
          ],
          { cwd: bundle, encoding: 'utf8', stdio: 'pipe' }
        ),
      /Command failed/
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('real-path canonicalization rejects source aliases and bundle outputs through source symlinks', () => {
  const { root, repo, bundle, base } = fixture()
  try {
    const alias = join(root, 'source-alias')
    symlinkSync(repo, alias)
    assert.throws(
      () => buildReviewBundle(alias, { taskId: 'alias-source', base, output: join(repo, 'bundle') }),
      /outside|overlap|source project/i
    )

    const outputAlias = join(root, 'output-alias')
    symlinkSync(repo, outputAlias)
    assert.throws(
      () =>
        buildReviewBundle(repo, {
          taskId: 'alias-output',
          base,
          output: join(outputAlias, 'bundle'),
          receipts: ['work/orchestration/task/receipt.json'],
        }),
      /outside|overlap|source project/i
    )
    assert.equal(existsSync(join(repo, 'bundle')), false)
    assert.equal(existsSync(bundle), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('bundle verification is bound to caller-supplied identities and rejects traversal', () => {
  const { root, repo, bundle, base } = fixture()
  try {
    buildReviewBundle(repo, {
      taskId: 'identity-bound',
      base,
      output: bundle,
      receipts: ['work/orchestration/task/receipt.json'],
    })
    const identity = expectedIdentity(repo, base),
      manifestPath = join(bundle, 'manifest.json'),
      original = JSON.parse(readFileSync(manifestPath, 'utf8'))

    assert.equal(verifyReviewBundle(bundle, identity).status, 'passed')

    const changedHead = structuredClone(original)
    changedHead.repository.headOid = '0'.repeat(40)
    writeFileSync(manifestPath, JSON.stringify(changedHead, null, 2) + '\n')
    assert.throws(() => verifyReviewBundle(bundle, identity), /expected head|head identity/i)

    const changedSource = structuredClone(original)
    changedSource.sources[0].sha256 = 'f'.repeat(64)
    writeFileSync(manifestPath, JSON.stringify(changedSource, null, 2) + '\n')
    assert.throws(() => verifyReviewBundle(bundle, identity), /source identity|source.*sha/i)

    const changedReceipt = structuredClone(original)
    changedReceipt.receipts[0].bundleSha256 = 'a'.repeat(64)
    writeFileSync(manifestPath, JSON.stringify(changedReceipt, null, 2) + '\n')
    assert.throws(() => verifyReviewBundle(bundle, identity), /receipt identity/i)

    const traversal = structuredClone(original)
    traversal.diff.path = '../outside.patch'
    writeFileSync(manifestPath, JSON.stringify(traversal, null, 2) + '\n')
    assert.throws(() => verifyReviewBundle(bundle, identity), /unsafe|traversal|bundle path/i)

    const absolute = structuredClone(original)
    absolute.receipts[0].bundlePath = join(root, 'outside-receipt.json')
    writeFileSync(manifestPath, JSON.stringify(absolute, null, 2) + '\n')
    assert.throws(() => verifyReviewBundle(bundle, identity), /unsafe|absolute|bundle path/i)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('raw command receipts retain source head and complete stdout/stderr', async () => {
  const { root, repo } = fixture()
  try {
    const output = 'work/orchestration/task/raw-command.json',
      receipt = await runCommandReceipt(repo, {
        output,
        command: [process.execPath, '-e', "console.log('raw-stdout'); console.error('raw-stderr')"],
      }),
      saved = JSON.parse(readFileSync(join(repo, output), 'utf8'))
    assert.equal(receipt.exitCode, 0)
    assert.equal(saved.version, 1)
    assert.equal(saved.status, 'passed')
    assert.equal(saved.phase, 'finished')
    assert.deepEqual(saved.sourceAfter, saved.source)
    assert.equal(saved.source.headOid, run(repo, 'git', 'rev-parse', 'HEAD'))
    assert.match(saved.stdout, /raw-stdout/)
    assert.match(saved.stderr, /raw-stderr/)
    assert.equal(saved.stdoutSha256, sha(saved.stdout))
    assert.equal(saved.stderrSha256, sha(saved.stderr))
    assert.equal(readFileSync(saved.artifacts.stdout, 'utf8'), saved.stdout)
    assert.equal(readFileSync(saved.artifacts.stderr, 'utf8'), saved.stderr)
    assert.throws(() => runCommandReceipt(repo, {
      output,
      command: [process.execPath, '-e', 'throw new Error("must not rerun")'],
    }), { code: 'EEXIST' })
    assert.equal(JSON.parse(readFileSync(join(repo, output), 'utf8')).runId, saved.runId)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('command receipts bind dirty source and explicit ignored inputs and invalidate drift', async () => {
  const { root, repo } = fixture()
  try {
    writeFileSync(join(repo, 'source.txt'), 'dirty input\n')
    writeFileSync(join(repo, 'work/helper.txt'), 'helper input\n')
    const receipt = await runCommandReceipt(repo, {
      output: 'work/orchestration/task/drift.json',
      inputs: ['work/helper.txt'],
      command: [process.execPath, '-e', "require('node:fs').writeFileSync('work/helper.txt','changed')"],
    })
    assert.equal(receipt.exitCode, 0)
    assert.equal(receipt.status, 'invalidated')
    assert.equal(receipt.source.inputs['work/helper.txt'], sha('helper input\n'))
    assert.notEqual(receipt.source.trackedDiffSha256, sha(''))
    assert.notDeepEqual(receipt.sourceAfter.inputs, receipt.source.inputs)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('receipt CLI preserves repeated input flags and rejects zero-exit input drift', () => {
  const { root, repo } = fixture()
  try {
    const helper = receiptCli(repo)
    writeFileSync(join(repo, 'work/helper.txt'), 'helper before\n')
    writeFileSync(join(repo, 'work/config.json'), '{"enabled":true}\n')
    for (const mutate of [false, true]) {
      const output = `work/orchestration/task/cli-${mutate ? 'drift' : 'stable'}.json`,
        result = spawnSync(process.execPath, [
          helper, '--output', output,
          '--input', 'work/helper.txt', '--input', 'work/config.json',
          '--', process.execPath, '-e', mutate
            ? "require('node:fs').writeFileSync('work/helper.txt','helper after\\n')"
            : "console.log('unchanged')",
        ], { cwd: repo, encoding: 'utf8' }),
        receipt = JSON.parse(readFileSync(join(repo, output), 'utf8'))
      assert.equal(result.status, mutate ? 1 : 0, result.stderr)
      assert.equal(receipt.status, mutate ? 'invalidated' : 'passed')
      assert.equal(receipt.exitCode, 0)
      assert.deepEqual(receipt.source.inputs, {
        'work/helper.txt': sha('helper before\n'),
        'work/config.json': sha('{"enabled":true}\n'),
      })
      assert.equal(receipt.sourceAfter.inputs['work/config.json'], sha('{"enabled":true}\n'))
      assert.equal(receipt.sourceAfter.inputs['work/helper.txt'], sha(mutate ? 'helper after\n' : 'helper before\n'))
      assert.equal(JSON.parse(result.stdout).status, receipt.status)
    }
    const missingOutput = 'work/orchestration/task/cli-missing.json',
      missing = spawnSync(process.execPath, [
        helper, '--output', missingOutput, '--input', 'work/missing-input.txt',
        '--', process.execPath, '-e', "require('node:fs').writeFileSync('work/must-not-launch','started')",
      ], { cwd: repo, encoding: 'utf8' })
    assert.notEqual(missing.status, 0)
    assert.match(missing.stderr, /ENOENT/)
    assert.equal(existsSync(join(repo, missingOutput)), false)
    assert.equal(existsSync(join(repo, 'work/must-not-launch')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a killed foreground wrapper retains unknown state and raw output, never a pass', async () => {
  const { root, repo } = fixture(),
    output = 'work/orchestration/task/interrupted.json',
    helper = new URL('../scripts/orchestration/command-receipt.mjs', import.meta.url).href,
    childSource = "console.log('started'); setTimeout(() => console.log('finished'), 350)",
    wrapper = spawn(process.execPath, ['--input-type=module', '-e',
      `import {runCommandReceipt} from ${JSON.stringify(helper)}; await runCommandReceipt(${JSON.stringify(repo)}, ${JSON.stringify({output, command: [process.execPath, '-e', childSource]})})`,
    ], { stdio: 'ignore' }),
    exited = new Promise(resolve => wrapper.once('exit', resolve))
  try {
    const log = join(repo, `${output}.artifacts/stdout.log`), deadline = Date.now() + 5000
    while (!existsSync(log) || !readFileSync(log, 'utf8').includes('started')) {
      assert(Date.now() < deadline, 'fixture command did not start')
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    // This is the exact child handle created by this test, not a saved PID lookup.
    wrapper.kill('SIGKILL')
    await exited
    await new Promise(resolve => setTimeout(resolve, 500))
    const receipt = JSON.parse(readFileSync(join(repo, output), 'utf8'))
    assert.equal(receipt.status, 'unknown')
    assert.equal(receipt.phase, 'prepared')
    assert.equal(receipt.exitCode, undefined)
    assert.equal(receipt.finishedAt, undefined)
    assert.match(readFileSync(log, 'utf8'), /started/)
  } finally {
    wrapper.kill('SIGKILL')
    await exited
    rmSync(root, { recursive: true, force: true })
  }
})


test('v2 producer retains complete large raw output without embedding it', async () => {
  const { root, repo } = fixture()
  try {
    const receipt = await runCommandReceipt(repo, { streamVersion: 2, output: 'work/orchestration/task/large.json',
      command: [process.execPath, '-e', "process.stdout.write(Buffer.alloc(65536,120)); process.stderr.write('small')"] })
    assert.equal(receipt.version, 2); assert.equal(receipt.status, 'passed')
    assert.equal(receipt.publication, 'guard-v1')
    assert.deepEqual(JSON.parse(readFileSync(join(repo, 'work/orchestration/task/large.json'))), JSON.parse(JSON.stringify(receipt)))
    assert(existsSync(join(repo, 'work/orchestration/task/large.json.artifacts/publication.complete')))
    assert.equal(Object.hasOwn(receipt, 'stdout'), false); assert.equal(receipt.stderr, 'small')
    const bytes = readFileSync(receipt.artifacts.stdout)
    assert.equal(bytes.length, 65536); assert.equal(receipt.stdoutSha256, sha(bytes))
    assert.deepEqual(receipt.streams.stdout, { bytes: 65536, sha256: sha(bytes), inline: 'omitted', reason: 'over-inline-budget' })
    assert(JSON.stringify(receipt).length < 16384)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('v2 producer hashes invalid UTF-8 as complete original raw bytes', async () => {
  const { root, repo } = fixture()
  try {
    const receipt = await runCommandReceipt(repo, { streamVersion: 2, output: 'work/orchestration/task/binary.json',
      command: [process.execPath, '-e', "process.stdout.write(Buffer.from([255,128,0]))"] })
    assert.equal(receipt.status, 'passed'); assert.equal(receipt.streams.stdout.reason, 'not-utf8')
    assert.equal(Object.hasOwn(receipt, 'stdout'), false)
    assert.equal(receipt.stdoutSha256, sha(Buffer.from([255,128,0])))
    assert.deepEqual(readFileSync(receipt.artifacts.stdout), Buffer.from([255,128,0]))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('receipt CLI explicitly selects v2 while v1 remains the default-compatible mode', () => {
  const { root, repo } = fixture()
  try {
    const helper = receiptCli(repo)
    for (const version of [1, 2]) {
      const output = `work/orchestration/task/version-${version}.json`
      const result = spawnSync(process.execPath, [helper, '--output', output, '--stream-version', String(version),
        '--', process.execPath, '-e', 'process.stdout.write(Buffer.alloc(65536,120))'], { encoding: 'utf8' })
      assert.equal(result.status, 0, result.stderr)
      const receipt = JSON.parse(readFileSync(join(repo, output), 'utf8'))
      assert.equal(receipt.version, version); assert.equal(receipt.status, 'passed')
      assert.equal(Object.hasOwn(receipt, 'stdout'), version === 1)
      assert.equal(readFileSync(receipt.artifacts.stdout).length, 65536)
    }
    const invalid = 'work/orchestration/task/invalid-version.json'
    const result = spawnSync(process.execPath, [helper, '--output', invalid, '--stream-version', '3',
      '--', process.execPath, '-e', 'throw new Error("must not launch")'], { encoding: 'utf8' })
    assert.notEqual(result.status, 0); assert.match(result.stderr, /version must be 1 or 2/)
    assert.equal(existsSync(join(repo, invalid)), false)
    assert.throws(() => runCommandReceipt(repo, { output: invalid, streamVersion: 3,
      command: [process.execPath, '-e', 'throw new Error("must not launch")'] }), /version must be 1 or 2/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('v1 bundle export stays available; unselected and nested v2 export fail closed without modifying originals', async () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const first = 'work/orchestration/task/default.json', second = 'work/orchestration/task/opt-in.json'
    const legacy = await runCommandReceipt(repo, { output: first, command: [process.execPath, '-e', "console.log('legacy')"] })
    assert.equal(legacy.version, 1)
    const exported = buildReviewBundle(repo, { taskId: 'default-v1', base, output: bundle, receipts: [first] })
    assert.equal(exported.manifest.receipts.length, 1)
    const receipt = await runCommandReceipt(repo, { output: second, streamVersion: 2,
      command: [process.execPath, '-e', 'process.stdout.write(Buffer.alloc(65536,120))'] })
    const paths = [join(repo, 'source.txt'), join(repo, second), receipt.artifacts.stdout, receipt.artifacts.stderr]
    const before = paths.map(path => readFileSync(path))
    const head = run(repo, 'git', 'rev-parse', 'HEAD'), status = run(repo, 'git', 'status', '--porcelain')
    for (const [suffix, value] of [['direct', receipt], ['encoded', JSON.stringify(receipt)], ['nested', { receipt }]]) {
      const input = `work/orchestration/task/export-${suffix}.json`, output = bundle + '-' + suffix
      writeFileSync(join(repo, input), JSON.stringify(value))
      assert.throws(() => buildReviewBundle(repo, { taskId: 'opt-in-v2', base, output, receipts: [input] }), /cannot export v2 command receipts/)
      assert.equal(existsSync(output), false)
    }
    paths.forEach((path, index) => assert.deepEqual(readFileSync(path), before[index]))
    assert.equal(run(repo, 'git', 'rev-parse', 'HEAD'), head)
    assert.equal(run(repo, 'git', 'status', '--porcelain'), status)
  } finally { rmSync(root, { recursive: true, force: true }) }
})


// Synthetic complete v2 evidence isolates the export boundary; producer behavior
// is covered separately above. Trusted identities are computed from source bytes,
// never read back from the bundle manifest.
function v2ExportFixture(repo, { stdout = Buffer.from('complete stdout\n'), stderr = Buffer.alloc(0), status = 'passed' } = {}) {
  const path = 'work/orchestration/task/receipt.json', target = join(repo, path)
  mkdirSync(`${target}.artifacts`, { recursive: true })
  const receipt = { kind: 'pnd-command-receipt', version: 2, streamFormat: 'raw-artifact-v1',
    status, exitCode: status === 'failed' ? 7 : 0, cwd: repo, home: homedir(), artifacts: {}, streams: {} }
  for (const [name, bytes] of [['stdout', stdout], ['stderr', stderr]]) {
    receipt.artifacts[name] = `${target}.artifacts/${name}.log`
    writeFileSync(receipt.artifacts[name], bytes)
    let text
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes) } catch { /* binary fixture */ }
    const complete = text !== undefined && bytes.length <= 32768
    receipt.streams[name] = { bytes: bytes.length, sha256: sha(bytes), inline: complete ? 'complete' : 'omitted' }
    if (complete) receipt[name] = text
    receipt[`${name}Sha256`] = sha(bytes)
  }
  writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n')
  return { path, target, receipt }
}

function originalV2Binding(repo, path = 'work/orchestration/task/receipt.json') {
  return { path, sha256: sha(readFileSync(join(repo, path))) }
}

function v2ExportIdentity(repo, base, path = 'work/orchestration/task/receipt.json') {
  const expected = expectedIdentity(repo, base)
  expected.expectedReceipts = [path, `${path}.artifacts/stdout.log`, `${path}.artifacts/stderr.log`].map(sourcePath => {
    const bytes = readFileSync(join(repo, sourcePath))
    const copied = sourcePath === path ? bytes.toString('utf8').replaceAll(repo, '<SOURCE_ROOT>').replaceAll(homedir(), '<HOME>') : bytes
    return { path: sourcePath, sha256: sha(copied) }
  })
  return expected
}

function standaloneVerification(bundle, expected) {
  const args = [join(bundle, 'verify.mjs'), '--expected-head', expected.expectedHead,
    '--expected-diff-sha256', expected.expectedDiffSha256]
  for (const [flag, entries] of [['--expected-source', expected.expectedSources], ['--expected-receipt', expected.expectedReceipts], ['--expected-review', expected.expectedReviews ?? []]])
    for (const { path, sha256 } of entries) args.push(flag, `${path}=${sha256}`)
  return spawnSync(process.execPath, args, { encoding: 'utf8' })
}

function assertV2OriginalsUnchanged(paths, before) {
  paths.forEach((path, index) => assert.deepEqual(readFileSync(path), before[index]))
}

function assertV2ExportRefused(repo, base, bundle, path, pattern = /./, binding = originalV2Binding(repo, path)) {
  const paths = [join(repo, path), `${join(repo, path)}.artifacts/stdout.log`, `${join(repo, path)}.artifacts/stderr.log`].filter(existsSync)
  const before = paths.map(path => readFileSync(path)), rootEntries = readdirSync(join(bundle, '..'))
  let error
  try { buildReviewBundle(repo, { taskId: 'v2-refusal', base, output: bundle, v2Receipt: binding }) } catch (caught) { error = caught }
  assert(error, 'export must fail closed')
  assert.match(error.message, pattern)
  assert.doesNotMatch(error.message, /fixture-sensitive-value/)
  assert.equal(existsSync(bundle), false)
  assert.deepEqual(readdirSync(join(bundle, '..')), rootEntries, 'no temporary output survives refusal')
  assertV2OriginalsUnchanged(paths, before)
}

test('explicit v2 export binds the portable metadata view and both complete byte-exact raw siblings', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const { path, target, receipt } = v2ExportFixture(repo)
    const paths = [target, receipt.artifacts.stdout, receipt.artifacts.stderr], before = paths.map(path => readFileSync(path))
    const expected = v2ExportIdentity(repo, base)
    const result = buildReviewBundle(repo, { taskId: 'v2-safe', base, output: bundle,
      v2Receipt: originalV2Binding(repo), receipts: [path, `${path}.artifacts/stdout.log`, `${path}.artifacts/stdout.log`] })
    assert.equal(result.manifest.version, 1)
    assert.deepEqual(result.manifest.receipts.map(entry => entry.sourcePath), expected.expectedReceipts.map(entry => entry.path))
    const [metadata, ...logs] = result.manifest.receipts
    assert.notEqual(metadata.sourceSha256, metadata.bundleSha256)
    assert.equal(metadata.sourceSha256, sha(before[0]))
    const copied = JSON.parse(readFileSync(join(bundle, metadata.bundlePath), 'utf8'))
    assert.equal(copied.cwd, '<SOURCE_ROOT>'); assert.equal(copied.home, '<HOME>')
    assert.deepEqual(copied.streams, receipt.streams)
    assert.throws(() => readReceiptStreams(repo, path, copied), /Raw artifact does not match this receipt/)
    for (const [index, entry] of logs.entries()) {
      assert.equal(entry.sourceSha256, entry.bundleSha256)
      assert.equal(entry.sourceBytes, entry.bundleBytes)
      assert.equal(entry.redactions, 0)
      assert.deepEqual(readFileSync(join(bundle, entry.bundlePath)), before[index + 1])
    }
    assert.equal(verifyReviewBundle(bundle, expected).receipts, 3)
    const standalone = standaloneVerification(bundle, expected)
    assert.equal(standalone.status, 0, standalone.stderr)
    assert.match(readFileSync(join(bundle, 'README.md'), 'utf8'), /portable metadata view/)
    assertV2OriginalsUnchanged(paths, before)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('explicit v2 exports complete omitted output and preserves failed-command outcomes', async () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const path = 'work/orchestration/task/omitted-failure.json'
    const receipt = await runCommandReceipt(repo, { output: path, streamVersion: 2,
      command: [process.execPath, '-e', 'process.stdout.write(Buffer.alloc(65536,120)); process.exitCode=7'] })
    assert.equal(receipt.status, 'failed'); assert.equal(Object.hasOwn(receipt, 'stdout'), false)
    const result = buildReviewBundle(repo, { taskId: 'v2-complete-failure', base, output: bundle, v2Receipt: originalV2Binding(repo, path) })
    const copied = JSON.parse(readFileSync(join(bundle, result.manifest.receipts[0].bundlePath), 'utf8'))
    assert.equal(copied.status, 'failed'); assert.equal(copied.exitCode, 7)
    assert.equal(Object.hasOwn(copied, 'stdout'), false)
    assert.deepEqual(readFileSync(join(bundle, `receipts/${path}.artifacts/stdout.log`)), Buffer.alloc(65536, 120))
    const expected = v2ExportIdentity(repo, base, path)
    assert.equal(verifyReviewBundle(bundle, expected).status, 'passed')
    const standalone = standaloneVerification(bundle, expected)
    assert.equal(standalone.status, 0, standalone.stderr)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('explicit v2 raw export preserves secret, nested receipt, path, and byte-decoding refusals', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const nestedV2 = { kind: 'pnd-command-receipt', version: 2, streamFormat: 'raw-artifact-v1' }
    const forbidden = [
      Buffer.from('password=fixture-sensitive-value'),
      Buffer.from(JSON.stringify({ payload: jsonWrap({ password: 'fixture-sensitive-value' }, 3) })),
      Buffer.from(`source: ${repo}\n`), Buffer.from(`home: ${homedir()}\n`),
      Buffer.from([255, 128]), Buffer.from([120, 0]),
      Buffer.from([239, 187, 191, 120]), // Sanitizer strips BOM, despite a zero redaction count.
      Buffer.from(JSON.stringify({ nested: nestedV2 })), Buffer.from(jsonWrap(nestedV2, 2)),
    ]
    for (const name of ['stdout', 'stderr']) {
      for (const bytes of forbidden) {
        const { path } = v2ExportFixture(repo, { [name]: bytes })
        assertV2ExportRefused(repo, base, bundle, path)
      }
    }
    for (const mutation of [
      receipt => { receipt.password = 'fixture-sensitive-value' },
      receipt => { receipt.nested = nestedV2 },
      receipt => { receipt.encoded = jsonWrap(nestedV2, 2) },
      receipt => { delete receipt.streams.stderr },
    ]) {
      const { path, target, receipt } = v2ExportFixture(repo)
      mutation(receipt); writeFileSync(target, JSON.stringify(receipt))
      assertV2ExportRefused(repo, base, bundle, path)
    }
    const { path, target, receipt } = v2ExportFixture(repo)
    writeFileSync(target, '{"password":"fixture-sensitive-value"')
    assertV2ExportRefused(repo, base, bundle, path, /valid UTF-8 JSON/)
    for (const value of [JSON.stringify(receipt), { receipt }]) {
      writeFileSync(target, JSON.stringify(value))
      assertV2ExportRefused(repo, base, bundle, path, /directly supplied/)
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('explicit v2 export rejects original hash, raw identity, and physical sibling mismatches', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    for (const mutation of [
      receipt => { receipt.artifacts.stdout = receipt.artifacts.stderr },
      receipt => { receipt.streams.stdout.sha256 = '0'.repeat(64) },
      receipt => { receipt.stdoutSha256 = '0'.repeat(64) },
      receipt => { receipt.stdout = 'different inline' },
      receipt => { receipt.streams.stdout.bytes++ },
    ]) {
      const { path, target, receipt } = v2ExportFixture(repo)
      mutation(receipt); writeFileSync(target, JSON.stringify(receipt))
      assertV2ExportRefused(repo, base, bundle, path)
    }
    let data = v2ExportFixture(repo)
    assertV2ExportRefused(repo, base, bundle, data.path, /Original v2 receipt hash mismatch/, { path: data.path, sha256: '0'.repeat(64) })
    rmSync(data.receipt.artifacts.stderr)
    assertV2ExportRefused(repo, base, bundle, data.path, /ENOENT/)
    data = v2ExportFixture(repo)
    writeFileSync(data.receipt.artifacts.stdout, 'changed raw bytes')
    assertV2ExportRefused(repo, base, bundle, data.path, /identity mismatch/)
    data = v2ExportFixture(repo)
    const held = join(root, 'held.log'); writeFileSync(held, 'complete stdout\n')
    rmSync(data.receipt.artifacts.stdout); symlinkSync(held, data.receipt.artifacts.stdout)
    assertV2ExportRefused(repo, base, bundle, data.path, /ELOOP/)
    rmSync(data.receipt.artifacts.stdout)
    data = v2ExportFixture(repo)
    linkSync(data.target, join(root, 'hard-linked-receipt.json'))
    assertV2ExportRefused(repo, base, bundle, data.path, /hard-linked/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('explicit v2 export keeps 2 MiB per-input and 8 MiB expanded source and copy limits', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const limit = 2 * 1024 * 1024
    for (const name of ['stdout', 'stderr']) {
      const { path } = v2ExportFixture(repo, { [name]: Buffer.alloc(limit + 1, 120) })
      assertV2ExportRefused(repo, base, bundle, path, /oversized/)
    }
    const { path, target } = v2ExportFixture(repo)
    writeFileSync(target, Buffer.alloc(limit + 1, 120))
    assertV2ExportRefused(repo, base, bundle, path, /receipt exceeds/)
    v2ExportFixture(repo, { stdout: Buffer.alloc(limit, 120), stderr: Buffer.alloc(limit, 121) })
    const receipts = ['work/orchestration/task/extra-1.log', 'work/orchestration/task/extra-2.log']
    for (const extra of receipts) writeFileSync(join(repo, extra), Buffer.alloc(limit, 122))
    const originals = [target, `${target}.artifacts/stdout.log`, `${target}.artifacts/stderr.log`, ...receipts.map(path => join(repo, path))]
    const before = originals.map(path => readFileSync(path)), rootEntries = readdirSync(root)
    assert.throws(() => buildReviewBundle(repo, { taskId: 'v2-over-budget', base, output: bundle,
      receipts, v2Receipt: originalV2Binding(repo) }), /receipt exceeds|total source bytes/)
    assert.equal(existsSync(bundle), false); assert.deepEqual(readdirSync(root), rootEntries)
    assertV2OriginalsUnchanged(originals, before)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('both v2 bundle verifiers reject incomplete identities, missing siblings, payload tampering, and associations', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const { path, target, receipt } = v2ExportFixture(repo)
    const originalPaths = [target, receipt.artifacts.stdout, receipt.artifacts.stderr], originalBytes = originalPaths.map(path => readFileSync(path))
    buildReviewBundle(repo, { taskId: 'v2-verifier', base, output: bundle, v2Receipt: originalV2Binding(repo) })
    const expected = v2ExportIdentity(repo, base), manifestPath = join(bundle, 'manifest.json')
    const manifestBytes = readFileSync(manifestPath), originalManifest = JSON.parse(manifestBytes)
    const copies = originalManifest.receipts.map(entry => join(bundle, entry.bundlePath)), bytes = copies.map(path => readFileSync(path))
    const rejected = (identity = expected) => {
      assert.throws(() => verifyReviewBundle(bundle, identity))
      assert.notEqual(standaloneVerification(bundle, identity).status, 0)
    }
    for (const index of [1, 2]) {
      rmSync(copies[index]); rejected(); writeFileSync(copies[index], bytes[index])
      rejected({ ...expected, expectedReceipts: expected.expectedReceipts.filter((_, candidate) => candidate !== index) })
    }
    writeFileSync(copies[1], 'tampered raw'); rejected(); writeFileSync(copies[1], bytes[1])
    const metadata = JSON.parse(bytes[0]); metadata.streams.stdout.bytes++
    writeFileSync(copies[0], JSON.stringify(metadata))
    const selfStamped = structuredClone(originalManifest)
    selfStamped.receipts[0].bundleSha256 = sha(readFileSync(copies[0]))
    selfStamped.receipts[0].bundleBytes = readFileSync(copies[0]).length
    writeFileSync(manifestPath, JSON.stringify(selfStamped)); rejected()
    writeFileSync(copies[0], bytes[0]); writeFileSync(manifestPath, manifestBytes)
    for (const mutation of [
      manifest => { manifest.receipts[1].bundleSha256 = '0'.repeat(64) },
      manifest => { manifest.receipts.push(manifest.receipts[1]) },
      manifest => { manifest.receipts.pop() },
      manifest => { manifest.receipts[2].bundlePath = manifest.receipts[1].bundlePath },
    ]) {
      const manifest = structuredClone(originalManifest); mutation(manifest)
      writeFileSync(manifestPath, JSON.stringify(manifest)); rejected()
    }
    writeFileSync(manifestPath, manifestBytes)
    assert.equal(verifyReviewBundle(bundle, expected).status, 'passed')
    assertV2OriginalsUnchanged(originalPaths, originalBytes)
    assert.equal(path, expected.expectedReceipts[0].path)
  } finally { rmSync(root, { recursive: true, force: true }) }
})


test('review-bundle CLI selects exactly one original-hash-bound v2 receipt', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const directory = join(repo, 'scripts/orchestration')
    mkdirSync(directory, { recursive: true })
    for (const name of ['review-bundle.mjs', 'receipt-streams.mjs'])
      writeFileSync(join(directory, name), readFileSync(new URL(`../scripts/orchestration/${name}`, import.meta.url)))
    run(repo, 'git', 'add', 'scripts'); run(repo, 'git', 'commit', '-qm', 'export CLI fixture')
    const { path } = v2ExportFixture(repo), binding = originalV2Binding(repo)
    const args = [join(directory, 'review-bundle.mjs'), 'create', '--task-id', 'v2-cli', '--base', base,
      '--output', bundle, '--v2-receipt', `${path}=${binding.sha256}`]
    const result = spawnSync(process.execPath, args, { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    assert.equal(JSON.parse(result.stdout).manifest.receipts.length, 3)
    const duplicate = spawnSync(process.execPath, [...args, '--v2-receipt', `${path}=${binding.sha256}`], { encoding: 'utf8' })
    assert.notEqual(duplicate.status, 0); assert.match(duplicate.stderr, /duplicate option/)
    const mismatchArgs = [...args]; mismatchArgs[mismatchArgs.length - 1] = `${path}=${'0'.repeat(64)}`
    const mismatch = spawnSync(process.execPath, mismatchArgs, { encoding: 'utf8' })
    assert.notEqual(mismatch.status, 0); assert.match(mismatch.stderr, /Original v2 receipt hash mismatch/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})


function reviewExpected(repo, base, result) {
  // The creation result is handed to the reviewer independently of the bundle.
  return { ...expectedIdentity(repo, base), expectedReceipts: [],
    expectedReviews: result.manifest.reviewDerivatives.map(entry =>
      ({ path: entry.sourcePath, sha256: entry.bundleSha256 })) }
}

function assertReviewExportRefused(repo, base, bundle, binding = originalV2Binding(repo), options = {}) {
  const target = join(repo, binding.path)
  const paths = [target, `${target}.artifacts/stdout.log`, `${target}.artifacts/stderr.log`].filter(existsSync)
  const before = paths.map(path => readFileSync(path)), entries = readdirSync(join(bundle, '..'))
  let error
  try { buildReviewBundle(repo, { taskId: 'review-refusal', base, output: bundle, v2ReviewReceipt: binding, ...options }) } catch (caught) { error = caught }
  assert(error, 'review export must fail closed')
  assert.doesNotMatch(error.message, /fixture-sensitive-value/)
  assert.equal(existsSync(bundle), false)
  assert.deepEqual(readdirSync(join(bundle, '..')), entries)
  assertV2OriginalsUnchanged(paths, before)
}

test('sanitized v2 review exports real complete path-bearing output without execution evidence', async () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const path = 'work/orchestration/task/actual-review.json'
    const receipt = await runCommandReceipt(repo, { output: path, streamVersion: 2,
      command: [process.execPath, '-e', `process.stdout.write(process.cwd()+'\\n'+'x'.repeat(40000)); process.stderr.write(require('node:os').homedir()); process.exitCode=7`] })
    assert.equal(receipt.status, 'failed')
    assert.equal(receipt.streams.stdout.inline, 'omitted')
    const paths = [join(repo, path), receipt.artifacts.stdout, receipt.artifacts.stderr]
    const originals = paths.map(file => readFileSync(file)), binding = originalV2Binding(repo, path)
    const result = buildReviewBundle(repo, { taskId: 'review-real', base, output: bundle, v2ReviewReceipt: binding })
    assert.deepEqual(result.manifest.receipts, [])
    const expected = reviewExpected(repo, base, result), entry = result.manifest.reviewDerivatives[0]
    const bytes = readFileSync(join(bundle, entry.bundlePath)), document = JSON.parse(bytes)
    assert.equal(sha(bytes), expected.expectedReviews[0].sha256)
    assert.equal(document.kind, 'pnd-command-review')
    assert.equal(document.reviewOnly, true)
    assert.deepEqual(document.original, { sha256: sha(originals[0]), bytes: originals[0].length })
    assert.equal(document.metadata.status, 'failed'); assert.equal(document.metadata.exitCode, 7)
    assert.equal(document.metadata.cwd, '<SOURCE_ROOT>')
    assert.equal(Object.hasOwn(document, 'status'), false)
    assert.equal(Object.hasOwn(document.metadata, 'artifacts'), false)
    for (const [index, name] of ['stdout', 'stderr'].entries()) {
      const stream = document.streams[name], data = readFileSync(join(bundle, stream.bundlePath))
      const wanted = originals[index + 1].toString('utf8').replaceAll(repo, '<SOURCE_ROOT>').replaceAll(homedir(), '<HOME>')
      assert.equal(data.toString('utf8'), wanted)
      assert.equal(stream.sha256, sha(data)); assert.equal(stream.bytes, data.length)
      assert.deepEqual(stream.original, { sha256: sha(originals[index + 1]), bytes: originals[index + 1].length })
      assert.notEqual(stream.sha256, stream.original.sha256)
    }
    assert.throws(() => readReceiptStreams(repo, path, document), /Unknown raw stream format/)
    writeFileSync(join(repo, 'work/orchestration/review-copy.json'), bytes)
    assert.equal(discoverReceipts(repo).receipts.some(item => item.path.endsWith('/review-copy.json')), false)
    assert.equal(verifyReviewBundle(bundle, expected).status, 'passed')
    const standalone = standaloneVerification(bundle, expected)
    assert.equal(standalone.status, 0, standalone.stderr)
    assertV2OriginalsUnchanged(paths, originals)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('review-only v2 preserves BOM and nonpassing context while sanitizing decoded metadata and streams', () => {
  const { root, repo, base } = fixture()
  try {
    for (const status of ['passed', 'failed', 'unknown', 'invalidated']) {
      const stdout = Buffer.from('\uFEFF' + JSON.stringify({ path: repo }).replaceAll('/', '\\u002f'))
      const { path, target, receipt } = v2ExportFixture(repo, { stdout, status })
      receipt.command = ['node', `${repo}/script.mjs`, jsonWrap({ path: homedir() }, 2)]
      receipt.phase = 'prepared'; receipt.signal = 'SIGTERM'; receipt.error = { message: `at ${repo}` }
      writeFileSync(target, JSON.stringify(receipt))
      const bundle = join(root, `review-${status}`)
      const result = buildReviewBundle(repo, { taskId: 'review-context', base, output: bundle, v2ReviewReceipt: originalV2Binding(repo) })
      const document = JSON.parse(readFileSync(join(bundle, result.manifest.reviewDerivatives[0].bundlePath)))
      const output = readFileSync(join(bundle, document.streams.stdout.bundlePath), 'utf8')
      assert(output.startsWith('\uFEFF')); assert.equal(JSON.parse(output.slice(1)).path, '<SOURCE_ROOT>')
      assert.equal(document.metadata.status, status); assert.equal(document.metadata.phase, 'prepared')
      assert.equal(document.metadata.signal, 'SIGTERM'); assert.equal(document.metadata.error.message, 'at <SOURCE_ROOT>')
      assert.equal(document.metadata.command[1], '<SOURCE_ROOT>/script.mjs')
      assert(!JSON.stringify(document).includes(repo)); assert(!JSON.stringify(document).includes(homedir()))
      assert.equal(document.streams.stderr.bytes, 0)
      assert.equal(verifyReviewBundle(bundle, reviewExpected(repo, base, result)).status, 'passed')
      assert.throws(() => readReceiptStreams(repo, path, document), /Unknown raw stream format/)
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('sanitized v2 export retains secret, binary, identity, publication, and alias refusals', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const nested = { kind: 'pnd-command-receipt', version: 2 }
    for (const bytes of [Buffer.from([255, 128]), Buffer.from([120, 0]),
      Buffer.from('password=fixture-sensitive-value'),
      Buffer.from('\uFEFF' + '{"\\u0070assword":"fixture-sensitive-value"}'),
      Buffer.from('\uFEFF\uFEFF' + '{"\\u0070assword":"fixture-sensitive-value"}'),
      Buffer.from(jsonWrap('\uFEFF' + '{"\\u0070assword":"fixture-sensitive-value"}', 2)),
      Buffer.from(jsonWrap({ password: 'fixture-sensitive-value' }, 3)),
      Buffer.from(jsonWrap(nested, 2)), Buffer.from(jsonWrap('bounded', DECODE_DEPTH_LIMIT + 2))]) {
      for (const name of ['stdout', 'stderr']) {
        v2ExportFixture(repo, { [name]: bytes }); assertReviewExportRefused(repo, base, bundle)
      }
    }
    for (const mutation of [
      receipt => { receipt.password = 'fixture-sensitive-value' },
      receipt => { receipt.nested = nested },
      receipt => { receipt.artifacts.stdout = receipt.artifacts.stderr },
      receipt => { receipt.streams.stdout.sha256 = '0'.repeat(64) },
      receipt => { receipt.stdout = 'forged inline' },
      receipt => { receipt.publication = 'unknown-format' },
      receipt => { receipt.publication = 'guard-v1' },
    ]) {
      const { target, receipt } = v2ExportFixture(repo)
      mutation(receipt); writeFileSync(target, JSON.stringify(receipt)); assertReviewExportRefused(repo, base, bundle)
    }
    let data = v2ExportFixture(repo)
    assertReviewExportRefused(repo, base, bundle, { path: data.path, sha256: '0'.repeat(64) })
    writeFileSync(`${data.target}.artifacts/publication.pending`, '')
    assertReviewExportRefused(repo, base, bundle)
    rmSync(`${data.target}.artifacts/publication.pending`)
    rmSync(data.receipt.artifacts.stderr); assertReviewExportRefused(repo, base, bundle)
    data = v2ExportFixture(repo)
    linkSync(data.receipt.artifacts.stdout, join(root, 'held-raw.log')); assertReviewExportRefused(repo, base, bundle)
    rmSync(join(root, 'held-raw.log'))
    linkSync(data.target, join(root, 'held-receipt.json')); assertReviewExportRefused(repo, base, bundle)
    rmSync(join(root, 'held-receipt.json'))
    rmSync(data.receipt.artifacts.stdout); symlinkSync(data.receipt.artifacts.stderr, data.receipt.artifacts.stdout)
    assertReviewExportRefused(repo, base, bundle)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('sanitized v2 export keeps per-input, total-source, and copy expansion limits', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const limit = 2 * 1024 * 1024
    for (const name of ['stdout', 'stderr']) {
      v2ExportFixture(repo, { [name]: Buffer.alloc(limit + 1, 120) })
      assertReviewExportRefused(repo, base, bundle)
    }
    const { target } = v2ExportFixture(repo)
    writeFileSync(target, Buffer.alloc(limit + 1, 120)); assertReviewExportRefused(repo, base, bundle)
    v2ExportFixture(repo, { stdout: Buffer.alloc(limit, 120), stderr: Buffer.alloc(limit, 121) })
    const receipts = ['work/orchestration/task/extra-a.log', 'work/orchestration/task/extra-b.log']
    for (const path of receipts) writeFileSync(join(repo, path), Buffer.alloc(limit, 122))
    assertReviewExportRefused(repo, base, bundle, originalV2Binding(repo), { receipts })
    // A short temporary HOME makes replacement growth deterministic; restore it.
    const priorHome = process.env.HOME
    try {
      process.env.HOME = '/x'
      v2ExportFixture(repo, { stdout: Buffer.from('/x'.repeat(limit / 2)) })
      assertReviewExportRefused(repo, base, bundle)
    } finally {
      if (priorHome === undefined) delete process.env.HOME
      else process.env.HOME = priorHome
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('both review verifiers reject missing, extra, altered, aliased and wrongly trusted derivatives', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const { path } = v2ExportFixture(repo, { stdout: Buffer.from(repo) })
    const result = buildReviewBundle(repo, { taskId: 'review-verification', base, output: bundle, v2ReviewReceipt: originalV2Binding(repo) })
    const expected = reviewExpected(repo, base, result), entry = result.manifest.reviewDerivatives[0]
    const manifestPath = join(bundle, 'manifest.json'), descriptorPath = join(bundle, entry.bundlePath)
    const manifestBytes = readFileSync(manifestPath), descriptorBytes = readFileSync(descriptorPath)
    const originalManifest = JSON.parse(manifestBytes), document = JSON.parse(descriptorBytes)
    const reject = (identity = expected, pattern) => {
      assert.throws(() => verifyReviewBundle(bundle, identity), pattern)
      const result = standaloneVerification(bundle, identity)
      assert.notEqual(result.status, 0)
      if (pattern) assert.match(result.stderr, pattern)
    }
    reject({ ...expected, expectedReviews: [] })
    reject({ ...expected, expectedReviews: [], expectedReceipts: expected.expectedReviews })
    reject({ ...expected, expectedReviews: [...expected.expectedReviews, ...expected.expectedReviews] })
    for (const mutation of [manifest => { delete manifest.reviewDerivatives },
      manifest => { manifest.reviewDerivatives.push(entry) },
      manifest => { manifest.reviewDerivatives[0].bundlePath = `receipts/${path}` },
      manifest => { manifest.reviewDerivatives[0].bundleSha256 = '0'.repeat(64) }]) {
      const manifest = structuredClone(originalManifest); mutation(manifest)
      writeFileSync(manifestPath, JSON.stringify(manifest)); reject()
    }
    writeFileSync(manifestPath, manifestBytes)
    for (const name of ['stdout', 'stderr']) {
      const file = join(bundle, document.streams[name].bundlePath), bytes = readFileSync(file)
      rmSync(file); reject(); writeFileSync(file, bytes)
      writeFileSync(file, 'forged stream'); reject(); writeFileSync(file, bytes)
      const held = join(root, `held-${name}.txt`); writeFileSync(held, bytes)
      rmSync(file); symlinkSync(held, file); reject(); rmSync(file); writeFileSync(file, bytes)
      linkSync(file, `${held}.alias`); reject(); rmSync(`${held}.alias`)
    }
    const extra = join(bundle, 'reviews/extra.json'); writeFileSync(extra, '{}'); reject(); rmSync(extra)
    for (const mutate of [value => { value.original.sha256 = '0'.repeat(64) },
      value => { value.streams.stdout.original.bytes++ }, value => { delete value.streams.stderr },
      value => { value.streams.stdout.bundlePath = '../../outside' },
      value => { value.kind = 'pnd-command-receipt' }, value => { value.status = 'passed' }]) {
      const changed = structuredClone(document); mutate(changed)
      const bytes = Buffer.from(JSON.stringify(changed)), forged = structuredClone(originalManifest)
      writeFileSync(descriptorPath, bytes)
      forged.reviewDerivatives[0].bundleSha256 = sha(bytes); forged.reviewDerivatives[0].bundleBytes = bytes.length
      writeFileSync(manifestPath, JSON.stringify(forged)); reject()
    }
    writeFileSync(descriptorPath, descriptorBytes); writeFileSync(manifestPath, manifestBytes)
    for (const fields of [{ status: 'passed' }, { parityMeasurements: [] },
      { identity: {}, verification: { results: [{ status: 'passed', parityMeasurements: [] }] } }]) {
      const forged = Buffer.from(JSON.stringify({ ...document, ...fields })), manifest = structuredClone(originalManifest)
      manifest.reviewDerivatives[0].bundleSha256 = sha(forged); manifest.reviewDerivatives[0].bundleBytes = forged.length
      writeFileSync(descriptorPath, forged); writeFileSync(manifestPath, JSON.stringify(manifest))
      // Even a newly trusted hash cannot make a promotion-shaped object valid.
      reject({ ...expected, expectedReviews: [{ path, sha256: sha(forged) }] })
    }
    writeFileSync(descriptorPath, descriptorBytes); writeFileSync(manifestPath, manifestBytes)
    for (const file of [descriptorPath, join(bundle, document.streams.stdout.bundlePath)]) {
      const bytes = readFileSync(file); truncateSync(file, 3 * 1024 * 1024); reject(expected, /Review file size differs from bounded descriptor/); writeFileSync(file, bytes)
    }
    const ladder = Array.from({ length: 130 }, (_, depth) =>
      join(bundle, 'reviews/empty', ...Array(depth).fill('d')))
    mkdirSync(ladder.at(-1), { recursive: true })
    try { reject(expected, /Review path is too deep/) } finally {
      // Remove only our known empty ladder, leaf first, without recursive FDs.
      for (const directory of ladder.reverse()) rmdirSync(directory)
    }
    for (let index = 0; index < 1025; index++) mkdirSync(join(bundle, `reviews/empty-${index}`))
    reject(expected, /Review namespace exceeds entry limit/)
    for (let index = 0; index < 1025; index++) rmSync(join(bundle, `reviews/empty-${index}`), { recursive: true })
    assert.equal(verifyReviewBundle(bundle, expected).status, 'passed')
    assert.equal(standaloneVerification(bundle, expected).status, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('review-bundle CLI requires separate explicit original and derivative trust selectors', () => {
  const { root, repo, base, bundle } = fixture()
  try {
    const directory = join(repo, 'scripts/orchestration')
    mkdirSync(directory, { recursive: true })
    for (const name of ['review-bundle.mjs', 'receipt-streams.mjs'])
      writeFileSync(join(directory, name), readFileSync(new URL(`../scripts/orchestration/${name}`, import.meta.url)))
    run(repo, 'git', 'add', 'scripts'); run(repo, 'git', 'commit', '-qm', 'review CLI fixture')
    const { path } = v2ExportFixture(repo, { stdout: Buffer.from(repo) }), binding = originalV2Binding(repo)
    const args = [join(directory, 'review-bundle.mjs'), 'create', '--task-id', 'review-cli', '--base', base,
      '--output', bundle, '--v2-review-receipt', `${path}=${binding.sha256}`]
    for (const extra of [['--v2-review-receipt', `${path}=${binding.sha256}`], ['--v2-receipt', `${path}=${binding.sha256}`]]) {
      const result = spawnSync(process.execPath, [...args, ...extra], { encoding: 'utf8' })
      assert.notEqual(result.status, 0); assert.equal(existsSync(bundle), false)
    }
    assertReviewExportRefused(repo, base, bundle, binding, { receipts: [path] })
    assertReviewExportRefused(repo, base, bundle, binding, { receipts: [`${path}.artifacts/stdout.log`] })
    const created = spawnSync(process.execPath, args, { encoding: 'utf8' })
    assert.equal(created.status, 0, created.stderr)
    const result = JSON.parse(created.stdout), expected = reviewExpected(repo, base, result)
    // This CLI fixture has an extra committed helper source, independently hashed.
    for (const name of ['review-bundle.mjs', 'receipt-streams.mjs'])
      expected.expectedSources.push({ path: `scripts/orchestration/${name}`, sha256: sha(readFileSync(join(directory, name))) })
    const verifyArgs = [join(directory, 'review-bundle.mjs'), 'verify', '--bundle', bundle,
      '--expected-head', expected.expectedHead, '--expected-diff-sha256', expected.expectedDiffSha256]
    for (const [flag, entries] of [['--expected-source', expected.expectedSources], ['--expected-review', expected.expectedReviews]])
      for (const value of entries) verifyArgs.push(flag, `${value.path}=${value.sha256}`)
    const verified = spawnSync(process.execPath, verifyArgs, { encoding: 'utf8' })
    assert.equal(verified.status, 0, verified.stderr)
    const standalone = standaloneVerification(bundle, expected)
    assert.equal(standalone.status, 0, standalone.stderr)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
