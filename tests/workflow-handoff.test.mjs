import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { buildReviewBundle, verifyReviewBundle } from '../scripts/orchestration/review-bundle.mjs'
import { runCommandReceipt } from '../scripts/orchestration/command-receipt.mjs'


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

test('raw command receipts retain source head and complete stdout/stderr', () => {
  const { root, repo } = fixture()
  try {
    const output = 'work/orchestration/task/raw-command.json',
      receipt = runCommandReceipt(repo, {
        output,
        command: [process.execPath, '-e', "console.log('raw-stdout'); console.error('raw-stderr')"],
      }),
      saved = JSON.parse(readFileSync(join(repo, output), 'utf8'))
    assert.equal(receipt.exitCode, 0)
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

test('command receipts bind dirty source and explicit ignored inputs and invalidate drift', () => {
  const { root, repo } = fixture()
  try {
    writeFileSync(join(repo, 'source.txt'), 'dirty input\n')
    writeFileSync(join(repo, 'work/helper.txt'), 'helper input\n')
    const receipt = runCommandReceipt(repo, {
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
    const helper = join(repo, 'scripts/orchestration/command-receipt.mjs')
    mkdirSync(join(repo, 'scripts/orchestration'), { recursive: true })
    writeFileSync(helper, readFileSync(new URL('../scripts/orchestration/command-receipt.mjs', import.meta.url)))
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
      `import {runCommandReceipt} from ${JSON.stringify(helper)}; runCommandReceipt(${JSON.stringify(repo)}, ${JSON.stringify({output, command: [process.execPath, '-e', childSource]})})`,
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
