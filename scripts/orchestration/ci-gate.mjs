#!/usr/bin/env node
// Source-bound receipts for the ready-only sharded gate. Not a cache/reuse path.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { discoverTests, planTestShard, testGroupCommand, TIMING_REPORTER } from './test-runner.mjs'

import { dependencyReceipt, portablePnpmRuntime, sourcePackageManager, validPnpmInstallation, PNPM_MANAGER } from './dependency-profile.mjs'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const write = (path, value) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value)}\n`) }
const run = (repo, command, args) => execFileSync(command, args, { cwd: repo, encoding: 'utf8' }).trim()
export const QUALITY_STAGES = ['typecheck', 'parity', 'orchestration', 'build']

export function candidateSnapshot(repo, env = process.env) {
  const git = (...args) => run(repo, 'git', args)
  git('diff', '--no-ext-diff', '--exit-code', 'HEAD', '--')
  const fields = { repository: 'GITHUB_REPOSITORY', runId: 'GITHUB_RUN_ID', runAttempt: 'GITHUB_RUN_ATTEMPT',
    workflowRef: 'GITHUB_WORKFLOW_REF', workflowSha: 'GITHUB_WORKFLOW_SHA', mergeSha: 'GITHUB_SHA',
    headSha: 'PR_HEAD_SHA', baseSha: 'PR_BASE_SHA' }
  const identity = Object.fromEntries(Object.entries(fields).map(([key, name]) => {
    assert(typeof env[name] === 'string' && env[name].length > 0, `Missing identity ${name}`)
    return [key, env[name]]
  }))
  for (const key of ['workflowSha', 'mergeSha', 'headSha', 'baseSha']) assert.match(identity[key], /^[a-f0-9]{40}$/)
  assert.match(identity.runId, /^[1-9][0-9]*$/); assert.match(identity.runAttempt, /^[1-9][0-9]*$/)
  assert.equal(identity.mergeSha, git('rev-parse', 'HEAD'), 'Checkout differs from event merge')
  assert.deepEqual(git('show', '-s', '--format=%P', 'HEAD').split(' '), [identity.baseSha, identity.headSha], 'Synthetic merge parents differ from event')
  identity.treeSha = git('rev-parse', 'HEAD^{tree}')
  identity.workflowSha256 = hash(readFileSync(join(repo, '.github/workflows/ready-pr-check.yml')))
  const files = discoverTests(repo)
  const tracked = git('ls-tree', '-r', '--name-only', 'HEAD', '--', 'tests').split('\n').filter(file => /^tests\/[^/]+\.test\.mjs$/.test(file)).sort()
  assert.deepEqual(files, tracked, 'Discovered test inventory differs from committed source')
  const inventory = files.map(file => ({ file, sha256: hash(readFileSync(join(repo, file))) }))
  const dependencies = dependencyReceipt(repo), pnpm = dependencies.dependencyFormat === 'pnpm-isolated-v1'
  const installed = pnpm ? portablePnpmRuntime(dependencies) : null
  assert.equal(pnpm, sourcePackageManager(repo) === PNPM_MANAGER, 'Hosted install must follow exact source policy')
  const runtime = { node: process.versions.node, ...(pnpm ? installed.runtime : { npm: run(repo, 'npm', ['--version']) }),
    python: run(repo, 'python', ['-c', 'import platform; print(platform.python_version())']),
    pillow: run(repo, 'python', ['-c', 'import PIL; print(PIL.__version__)']),
    platform: process.platform, arch: process.arch,
    lockSha256: hash(readFileSync(join(repo, 'package-lock.json'))),
    ...(pnpm ? {} : dependencies),
    timingReporterSha256: hash(readFileSync(join(repo, TIMING_REPORTER))) }
  assert.equal(runtime.node, '24.19.0')
  if (pnpm) assert.equal(run(repo, 'pnpm', ['--version']), '11.25.0')
  else assert.equal(runtime.npm, '11.9.0')
  assert.equal(runtime.python, '3.12.14'); assert.equal(runtime.pillow, '12.3.0')
  assert.equal(runtime.platform, 'linux'); assert.equal(runtime.arch, 'x64')
  return { identity, runtime, inventory, ...(pnpm ? { installation: installed.installation } : {}) }
}

export function validateShard(receipt, plan, installation) {
  const pnpm = plan.dependencyFormat === 'pnpm-isolated-v1'
  assert.equal(receipt?.version, pnpm ? 2 : 1);
  if (pnpm) {
    assert(validPnpmInstallation(receipt.installationBefore), 'Missing shard local dependency metadata')
    assert.deepEqual(receipt.installationBefore, receipt.installationAfter, 'Shard local dependency metadata mutated')
    assert.deepEqual(receipt.installationBefore, installation, 'Shard and worker dependency metadata differ')
  }
  assert.equal(receipt.kind, 'pnd-test-shard-receipt')
  assert.deepEqual(receipt.plan, plan, 'Shard plan differs from exact candidate')
  assert.equal(receipt.inputsBefore, plan.inputFingerprint, 'Shard starting inputs differ')
  assert.equal(receipt.inputsAfter, plan.inputFingerprint, 'Shard inputs mutated')
  assert.equal(receipt.inputError, null)
  const result = receipt.result
  assert.equal(result?.mode, 'shard'); assert.equal(result.fullSuite, false)
  assert.equal(result.shardComplete, true); assert.equal(result.complete, true); assert.equal(result.interrupted, null); assert.equal(result.status, 'passed')
  assert.equal(result.results?.length, plan.groups.length)
  result.results.forEach((group, index) => {
    const expected = plan.groups[index]
    assert.deepEqual(group.files, expected.files); assert.equal(group.concurrency, expected.concurrency)
    const timings = group.command?.includes(`--test-reporter=${TIMING_REPORTER}`) ? 'summary-v1' : undefined
    assert.deepEqual(group.command, testGroupCommand(expected, timings))
    assert.equal(group.exitCode, 0); assert.equal(group.signal, null); assert.equal(group.error, null); assert.equal(group.status, 'passed')
  })
}

export function validateGate(snapshot, envelopes, plans, needs) {
  assert.deepEqual(needs, { quality: 'success', 'test-shards': 'success' }, 'Every required job must succeed')
  assert.equal(plans.length, 4); assert.equal(envelopes.length, 5, 'Exactly five receipts required')
  const quality = envelopes.filter(item => item.kind === 'quality')
  const shards = envelopes.filter(item => item.kind === 'shard').sort((a, b) => a.shard.plan.shard.index - b.shard.plan.shard.index)
  assert.equal(quality.length, 1); assert.equal(shards.length, 4)
  for (const envelope of envelopes) {
    assert.equal(envelope.version, snapshot.runtime.dependencyFormat === 'pnpm-isolated-v1' ? 2 : 1); assert.equal(envelope.status, 'passed')
    if (envelope.version === 2) assert(validPnpmInstallation(envelope.installation), 'Missing genuine per-install metadata')
    for (const key of ['identity', 'runtime', 'inventory']) assert.deepEqual(envelope[key], snapshot[key], `Receipt ${key} drift`)
  }
  assert.deepEqual(quality[0].stages, QUALITY_STAGES)
  shards.forEach((envelope, index) => {
    assert.equal(envelope.shard.plan.shard.index, index, 'Missing or duplicate shard')
    assert.equal(envelope.shard.plan.dependencyFormat === 'pnpm-isolated-v1', snapshot.runtime.dependencyFormat === 'pnpm-isolated-v1', 'Shard dependency format differs')
    validateShard(envelope.shard, plans[index], envelope.installation)
  })
  assert.deepEqual(shards.flatMap(item => item.shard.plan.files).sort(), snapshot.inventory.map(item => item.file), 'Shard coverage must include every test exactly once')
  if (snapshot.runtime.dependencyFormat === 'pnpm-isolated-v1') assert(validPnpmInstallation(snapshot.installation))
  return { version: snapshot.runtime.dependencyFormat === 'pnpm-isolated-v1' ? 2 : 1, kind: 'full-check', ...snapshot, quality: quality[0], shards, status: 'passed' }
}

// Bound log lines without weakening the independently verifiable raw receipt.
export function reportLines(report) {
  const json = JSON.stringify(report), bytes = Buffer.from(json)
  assert(bytes.length < 8 * 1024 * 1024, 'Aggregate receipt exceeds decoded byte limit')
  const compressed = gzipSync(bytes, { level: 6 })
  // Fixed no-option gzip header, independent of host OS metadata.
  Buffer.from('1f8b0800000000000003', 'hex').copy(compressed, 0)
  assert(compressed.length <= 8 * 1024 * 1024, 'Aggregate receipt exceeds encoded byte limit')
  const encoded = compressed.toString('base64'), count = Math.ceil(encoded.length / 16000)
  return ['PND_FULL_CHECK_RECEIPT_TRANSPORT=2:gzip-base64',
    ...Array.from({ length: count }, (_, index) =>
      `PND_FULL_CHECK_RECEIPT_CHUNK=${index}/${count}:${encoded.slice(index * 16000, (index + 1) * 16000)}`),
    `PND_FULL_CHECK_RECEIPT_SHA256=${hash(json)}`]
}

export function readEnvelopes(directory, env = process.env) {
  const prefix = `full-check-${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT}-`
  const expected = [`${prefix}quality`, ...[1, 2, 3, 4].map(index => `${prefix}shard-${index}`)].sort()
  const entries = readdirSync(directory, { withFileTypes: true })
  assert.deepEqual(entries.map(entry => entry.name).sort(), expected, 'Missing, extra or wrong-attempt artifact')
  return entries.map(entry => {
    assert(entry.isDirectory(), 'Artifact must be a directory')
    const files = readdirSync(join(directory, entry.name), { withFileTypes: true })
    assert.equal(files.length, 1); assert.equal(files[0].name, 'receipt.json'); assert(files[0].isFile())
    const receipt = read(join(directory, entry.name, 'receipt.json'))
    const suffix = receipt.kind === 'quality' ? 'quality' : `shard-${receipt.shard?.plan?.shard?.index + 1}`
    assert.equal(entry.name, `${prefix}${suffix}`, 'Artifact name and payload differ')
    return receipt
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const [mode, path, output, payload] = process.argv.slice(2)
    const snapshot = candidateSnapshot(ROOT)
    if (mode === 'snapshot') {
      write(path, snapshot)
      console.log(`PR head: ${snapshot.identity.headSha}\nBase: ${snapshot.identity.baseSha}\nTested merge: ${snapshot.identity.mergeSha}`)
      console.log(JSON.stringify(snapshot))
    } else if (mode === 'quality' || mode === 'shard' || mode === 'baseline') {
      assert.deepEqual(snapshot, read(path), 'Inputs changed after validation')
      const receipt = { version: snapshot.runtime.dependencyFormat === 'pnpm-isolated-v1' ? 2 : 1, kind: mode, ...snapshot, status: 'passed' }
      if (mode === 'quality') receipt.stages = QUALITY_STAGES
      else if (mode === 'baseline') receipt.stages = ['tests']
      else {
        receipt.shard = read(payload)
        validateShard(receipt.shard, planTestShard(ROOT, receipt.shard.plan.shard.index, 4), snapshot.installation)
      }
      write(output, receipt)
    } else if (mode === 'aggregate') {
      const report = validateGate(snapshot, readEnvelopes(path), [0, 1, 2, 3].map(index => planTestShard(ROOT, index, 4)), JSON.parse(process.env.CI_NEEDS))
      for (const line of reportLines(report)) console.log(line)
      if (output) write(output, report)
    } else throw new Error('Use snapshot, quality, shard, baseline or aggregate')
  } catch (error) { console.error(`ci gate: ${error.message}`); process.exitCode = 1 }
}
