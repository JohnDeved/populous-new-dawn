import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { buildReviewBundle, verifyReviewBundle } from '../scripts/orchestration/review-bundle.mjs'
import {
  assessProjectRelease,
  deniedOperationDisposition,
  pathsOverlap,
} from '../scripts/orchestration/worker-closeout.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
const run = (cwd, command, ...args) => execFileSync(command, args, { cwd, encoding: 'utf8' }).trim()

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'pnd-handoff-')),
    repo = join(root, 'repo'),
    bundle = join(root, 'review-bundle'),
    neutral = join(root, 'closeout-neutral')
  mkdirSync(repo)
  mkdirSync(neutral)
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
  return { root, repo, bundle, neutral, base }
}

test('project closeout detects stale source/bundle ownership and accepts a released neutral binding', () => {
  const { root, repo, bundle, neutral } = fixture()
  try {
    assert.equal(pathsOverlap(repo, join(repo, 'child')), true)
    assert.deepEqual(
      assessProjectRelease({
        sourceProject: repo,
        bundleProject: bundle,
        activeProject: repo,
        bundlePreflight: 'open',
      }).reasons,
      ['PROJECT_STILL_BOUND']
    )
    assert.deepEqual(
      assessProjectRelease({
        sourceProject: repo,
        bundleProject: bundle,
        activeProject: bundle,
        bundlePreflight: 'open',
      }).reasons,
      ['REVIEW_BUNDLE_STILL_BOUND']
    )
    assert.deepEqual(
      assessProjectRelease({
        sourceProject: repo,
        bundleProject: bundle,
        activeProject: neutral,
        bundlePreflight: 'project-in-use',
      }).reasons,
      ['REVIEW_BUNDLE_PROJECT_IN_USE']
    )
    assert.equal(
      assessProjectRelease({
        sourceProject: repo,
        bundleProject: bundle,
        activeProject: neutral,
        bundlePreflight: 'open',
      }).status,
      'passed'
    )
    assert.deepEqual(assessProjectRelease({ sourceProject: repo, activeProject: neutral }), {
      status: 'passed',
      reasons: [],
      sourceReleased: true,
      bundleReleased: null,
      reviewerOpenPreflight: 'not-applicable',
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

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
    assert.equal(pathsOverlap(repo, bundle), false)
    const manifest = JSON.parse(readFileSync(join(bundle, 'manifest.json'), 'utf8')),
      head = run(repo, 'git', 'rev-parse', 'HEAD'),
      changed = readFileSync(join(repo, 'source.txt'))
    assert.equal(manifest.repository.headOid, head)
    assert.equal(manifest.sources.length, 1)
    assert.equal(manifest.sources[0].path, 'source.txt')
    assert.equal(manifest.sources[0].sha256, sha(changed))
    assert.equal(manifest.receipts.length, 1)
    const copied = readFileSync(join(bundle, manifest.receipts[0].bundlePath), 'utf8')
    assert.equal(copied.includes(repo), false)
    assert.equal(copied.includes(homedir()), false)
    assert.match(copied, /<SOURCE_ROOT>/)
    assert.match(copied, /<HOME>/)
    assert.equal(verifyReviewBundle(bundle).status, 'passed')
    const standalone = JSON.parse(
      execFileSync(process.execPath, ['verify.mjs'], {
        cwd: bundle,
        encoding: 'utf8',
      })
    )
    assert.equal(standalone.status, 'passed')
    assert.equal(standalone.headOid, head)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a denied operation blocks only itself until no meaningful or review-ready work remains', () => {
  assert.deepEqual(
    deniedOperationDisposition({
      required: false,
      meaningfulWorkRemaining: true,
      reviewReady: false,
    }),
    { operation: 'denied', retry: false, workerStatus: 'IN_PROGRESS' }
  )
  assert.equal(
    deniedOperationDisposition({
      required: true,
      meaningfulWorkRemaining: true,
      reviewReady: false,
    }).workerStatus,
    'IN_PROGRESS'
  )
  assert.equal(
    deniedOperationDisposition({
      required: true,
      meaningfulWorkRemaining: false,
      reviewReady: true,
    }).workerStatus,
    'NEEDS_REVIEW'
  )
  assert.equal(
    deniedOperationDisposition({
      required: true,
      meaningfulWorkRemaining: false,
      reviewReady: false,
    }).workerStatus,
    'BLOCKED'
  )
})
