import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const cli = fileURLToPath(new URL('../scripts/orchestration/worker-closeout.mjs', import.meta.url))

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'pnd-release-truth-'))
  const source = join(root, 'source'),
    neutral = join(root, 'neutral'),
    bundle = join(root, 'evidence')
  for (const path of [source, neutral, bundle]) mkdirSync(path)
  writeFileSync(join(source, 'source.txt'), 'source-bound evidence\n')
  const git = (...args) => execFileSync('git', args, { cwd: source, encoding: 'utf8' }).trim()
  git('init', '-q')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Fixture')
  git('add', 'source.txt')
  git('commit', '-qm', 'fixture')
  return { root, source, neutral, bundle, head: git('rev-parse', 'HEAD') }
}

// These invoke the real shipped closeout executable against a real Git checkout.
// They do not simulate an independent Local Dev acquisition or certify release.
for (const option of ['--complete', '--review-ready']) {
  test('CLI cannot certify release from neutral paths and ' + option, () => {
    const f = fixture()
    try {
      const result = spawnSync(
        process.execPath,
        [
          cli,
          '--source-project',
          f.source,
          '--bundle-project',
          f.bundle,
          '--active-project',
          f.neutral,
          '--bundle-preflight',
          'open',
          '--expected-head',
          f.head,
          option,
          'true',
        ],
        { encoding: 'utf8' }
      )
      assert.equal(result.status, 2, result.stdout + result.stderr)
      const receipt = JSON.parse(result.stdout)
      assert.equal(receipt.status, 'unverified')
      assert.equal(receipt.pathStatus, 'passed')
      assert.equal(receipt.sourceUnbound, true)
      assert.equal(receipt.bundleUnbound, true)
      assert.equal(receipt.sourceReleased, null)
      assert.equal(receipt.bundleReleased, null)
      assert.equal(receipt.releaseVerification, 'not-performed')
      assert.ok(receipt.reasons.includes('INDEPENDENT_RELEASE_NOT_VERIFIED'))
      assert.equal(receipt.workerStatus, 'BLOCKED')
      assert.equal(receipt.sourceHead, f.head)
    } finally {
      rmSync(f.root, { recursive: true, force: true })
    }
  })
}

test('meaningful independent work can continue without a fabricated release claim', () => {
  const f = fixture()
  try {
    const result = spawnSync(
      process.execPath,
      [
        cli,
        '--source-project',
        f.source,
        '--active-project',
        f.neutral,
        '--expected-head',
        f.head,
        '--denied-operation',
        'optional',
        '--meaningful-work-remaining',
        'true',
        '--review-ready',
        'true',
      ],
      { encoding: 'utf8' }
    )
    assert.equal(result.status, 2)
    const receipt = JSON.parse(result.stdout)
    assert.equal(receipt.sourceReleased, null)
    assert.equal(receipt.workerStatus, 'IN_PROGRESS')
    assert.equal(receipt.deniedOperation.retry, false)
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})

test('optional denial cannot override the independent-acquisition dependency', () => {
  const f = fixture()
  try {
    const result = spawnSync(
      process.execPath,
      [
        cli,
        '--source-project',
        f.source,
        '--active-project',
        f.neutral,
        '--expected-head',
        f.head,
        '--denied-operation',
        'optional',
        '--review-ready',
        'true',
      ],
      { encoding: 'utf8' }
    )
    assert.equal(result.status, 2)
    const receipt = JSON.parse(result.stdout)
    assert.equal(receipt.workerStatus, 'BLOCKED')
    assert.equal(receipt.sourceReleased, null)
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})
