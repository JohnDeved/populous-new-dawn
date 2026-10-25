import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { plan } from '../scripts/check-mission6-earned-victory.mjs'
import { runCommandReceipt } from '../scripts/orchestration/command-receipt.mjs'
import { RECEIPT_INLINE_BYTES, readReceiptStreams } from '../scripts/orchestration/receipt-streams.mjs'
import { buildReviewBundle, verifyReviewBundle } from '../scripts/orchestration/review-bundle.mjs'
import { discoverReceipts } from '../scripts/parity-measure.mjs'

// These are transport fixtures, not Mission 6 gameplay evidence. The real runner,
// plan, writers and readers execute; only the 19 game stages are synthetic scripts.
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const output = 'work/orchestration/m6-earned-victory/fixture'
const firstPath = `${output}/fresh-release.json`
const helpers = ['scripts/orchestration/command-log.mjs', 'scripts/orchestration/receipt-streams.mjs', 'scripts/orchestration/command-receipt-v1.mjs']
const runner = 'scripts/check-mission6-earned-victory.mjs'
const closure = [runner, 'scripts/acceptance/m6/plan.json', 'scripts/acceptance/m6/output-path.mjs',
  ...helpers, 'scripts/orchestration/command-receipt.mjs', 'scripts/orchestration/dependency-profile.mjs',
  'scripts/orchestration/cli.mjs', 'scripts/orchestration/research-evidence.mjs', 'scripts/orchestration/review-bundle.mjs',
  'scripts/parity-measure.mjs', 'scripts/parity-discovery.mjs', 'scripts/parity-json-metadata.mjs',
  'scripts/parity-owned-checkpoint.mjs', 'scripts/parity-owned-blast.mjs']
const summary = { fixtureOnly: true, naturalWinTurn: 29504, profile: { completed: [6] },
  continueMission: 7, continueStatus: 'playing' }
const checkpoint = name => name.endsWith('.json') ? JSON.stringify(summary) : `synthetic checkpoint: ${name}\n`
const stdout = repo => `synthetic stage, no simulation\n${repo}\n${'x'.repeat(40000)}\n`
const stderr = () => `synthetic home: ${homedir()}\n`

function fixture(t, { firstAction = '', earlyAction = '', preload = '', boundedEarlyCamp = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'pnd-m6-receipt-')), repo = join(root, 'repo')
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const put = (path, bytes) => {
    mkdirSync(dirname(join(repo, path)), { recursive: true })
    writeFileSync(join(repo, path), bytes)
  }
  for (const path of closure) put(path, readFileSync(new URL(`../${path}`, import.meta.url)))
  put('.gitignore', 'work/\nnode_modules/\n')
  // Minimal fixture metadata selects the historical dependency-profile branch;
  // it is not a real install, and no package manager or application code runs.
  put('package.json', JSON.stringify({ name: 'synthetic-m6-receipt-fixture', private: true }))
  put('package-lock.json', '{"fixtureOnly":true}\n')
  put('node_modules/.package-lock.json', '{"fixtureOnly":true}\n')
  for (const name of ['profile-storage', 'bloodlust-scene']) put(`tests/support/${name}.mjs`, '// Unexecuted synthetic shared input.\n')
  for (const [index, stage] of plan.stages.entries()) {
    put(`scripts/acceptance/m6/${stage.name}.mjs`, `
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
const stage = ${JSON.stringify(stage)}
const output = process.env.PND_M6_OUTPUT
// Consume each real producer file, without running a simulation or replay.
for (const name of stage.inputs) readFileSync(join(output, name))
${index <= 1 ? `process.stdout.write(${JSON.stringify(stdout(repo))}); process.stderr.write('synthetic home: '+homedir()+'\\n')\n${index === 0 ? firstAction : earlyAction}` : "process.stdout.write('synthetic stage: '+stage.name+'\\n')"}
for (const name of stage.outputs) writeFileSync(join(output, name),
  name.endsWith('.json') ? ${JSON.stringify(JSON.stringify(summary))} : 'synthetic checkpoint: '+name+'\\n')
`)
  }
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim()
  git('init', '-q'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Fixture')
  git('add', '.'); git('commit', '-qm', 'synthetic runner fixture')
  const base = git('rev-parse', 'HEAD')
  put('fixture-change.txt', 'bounded receipt pilot transport fixture\n')
  git('add', 'fixture-change.txt'); git('commit', '-qm', 'fixture review change')
  if (preload) put('work/fixture-preload.mjs', preload)
  const run = () => spawnSync(process.execPath,
    [...(preload ? ['--import', join(repo, 'work/fixture-preload.mjs')] : []), runner, output, ...(boundedEarlyCamp ? ['--bounded-early-camp'] : [])],
    { cwd: repo, encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 30000 })
  const json = path => JSON.parse(readFileSync(join(repo, path), 'utf8'))
  return { root, repo, base, git, put, run, json }
}

function assertNoOverwrite(f) {
  const snapshot = path => Object.fromEntries(readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    const child = join(path, entry.name)
    return entry.isDirectory() ? Object.entries(snapshot(child)) : [[child, sha(readFileSync(child))]]
  }))
  const before = snapshot(join(f.repo, output)), result = f.run()
  assert.notEqual(result.status, 0); assert.match(result.stderr, /EEXIST/)
  assert.deepEqual(snapshot(join(f.repo, output)), before)
}

function assertStopped(f, status, count = 1) {
  const manifest = f.json(`${output}/manifest.json`)
  assert.equal(manifest.status, status); assert.equal(manifest.stages.length, count)
  assert.equal(Object.hasOwn(manifest, 'result'), false)
  assert.equal(existsSync(join(f.repo, output, `${plan.stages[count].name}.json`)), false)
  return manifest
}

for (const boundedEarlyCamp of [false, true])
test(`actual M6 runner preserves ${boundedEarlyCamp ? '2 v2 / 17 v1 opt-in' : '1 v2 / 18 v1 default'} transport and review-only evidence`, async t => {
  const f = fixture(t, { boundedEarlyCamp }), result = f.run()
  assert.equal(result.status, 0, result.stderr)
  const manifest = f.json(`${output}/manifest.json`)
  assert.equal(manifest.status, 'passed'); assert.deepEqual(manifest.result, summary)
  assert.deepEqual(manifest.stages.map(stage => stage.name), plan.stages.map(stage => stage.name))
  assert.deepEqual(manifest.boundedReceiptStages, ['fresh-release', ...(boundedEarlyCamp ? ['early-camp'] : [])])
  const produced = new Map()
  for (const [index, stage] of plan.stages.entries()) {
    const row = manifest.stages[index], path = `${output}/${stage.name}.json`
    const bytes = readFileSync(join(f.repo, path)), receipt = JSON.parse(bytes)
    assert.equal(receipt.version, index === 0 || (boundedEarlyCamp && index === 1) ? 2 : 1)
    assert.equal(row.status, 'passed'); assert.equal(row.receipt, path); assert.equal(row.receiptSha256, sha(bytes))
    assert.deepEqual(row.source, receipt.source); assert.deepEqual(receipt.sourceAfter, receipt.source)
    assert.deepEqual(receipt.command, [process.execPath, `scripts/acceptance/m6/${stage.name}.mjs`])
    for (const helper of helpers) {
      const hash = sha(readFileSync(join(f.repo, helper)))
      assert.equal(receipt.source.inputs[helper], hash)
      assert.equal(manifest.sourceBinding.sharedInputs[helper], hash)
    }
    for (const name of stage.inputs) assert.equal(receipt.source.inputs[`${output}/checkpoints/${name}`], produced.get(name))
    for (const name of stage.outputs) {
      const bytes = readFileSync(join(f.repo, output, 'checkpoints', name))
      assert.equal(bytes.toString(), checkpoint(name)); assert.equal(row.outputs[name], sha(bytes)); produced.set(name, sha(bytes))
    }
  }
  assertNoOverwrite(f)
  const fallback = await runCommandReceipt(f.repo, { output: 'work/orchestration/default.json',
    command: [process.execPath, '-e', "process.stdout.write('default remains v1')"] })
  assert.equal(fallback.version, 1); assert.equal(fallback.stdout, 'default remains v1')

  const reviewPath = boundedEarlyCamp ? `${output}/early-camp.json` : firstPath
  const receipt = f.json(reviewPath), rawPaths = [join(f.repo, reviewPath), receipt.artifacts.stdout, receipt.artifacts.stderr]
  const originals = rawPaths.map(path => readFileSync(path))
  assert(originals[1].length > RECEIPT_INLINE_BYTES)
  assert.equal(Object.hasOwn(receipt, 'stdout'), false); assert.equal(receipt.streams.stdout.inline, 'omitted')
  for (const [index, name] of ['stdout', 'stderr'].entries()) {
    assert.equal(receipt.streams[name].sha256, sha(originals[index + 1]))
    assert.equal(receipt.streams[name].bytes, originals[index + 1].length)
  }
  const streams = readReceiptStreams(f.repo, reviewPath, receipt)
  assert.equal(streams.stdout, stdout(f.repo)); assert.equal(streams.stderr, stderr())
  const binding = { path: reviewPath, sha256: sha(originals[0]) }, bundle = join(f.root, 'review-bundle')
  assert.throws(() => buildReviewBundle(f.repo, { taskId: 'm6-raw-refusal', base: f.base,
    output: bundle, v2Receipt: binding }), /requires sanitization/)
  assert.equal(existsSync(bundle), false)
  const exported = buildReviewBundle(f.repo, { taskId: 'm6-pilot-review', base: f.base,
    output: bundle, v2ReviewReceipt: binding })
  assert.deepEqual(exported.manifest.receipts, []); assert.equal(exported.manifest.reviewDerivatives.length, 1)
  const entry = exported.manifest.reviewDerivatives[0], bytes = readFileSync(join(bundle, entry.bundlePath))
  const review = JSON.parse(bytes)
  assert.equal(entry.sourcePath, reviewPath); assert.equal(entry.bundleSha256, sha(bytes))
  assert.equal(review.kind, 'pnd-command-review'); assert.equal(review.reviewOnly, true)
  assert.deepEqual(review.original, { sha256: binding.sha256, bytes: originals[0].length })
  assert.equal(review.metadata.status, 'passed'); assert.equal(Object.hasOwn(review, 'status'), false)
  for (const [index, name] of ['stdout', 'stderr'].entries()) {
    const descriptor = review.streams[name], data = readFileSync(join(bundle, descriptor.bundlePath))
    assert.equal(data.toString(), originals[index + 1].toString().replaceAll(f.repo, '<SOURCE_ROOT>').replaceAll(homedir(), '<HOME>'))
    assert.equal(descriptor.sha256, sha(data)); assert.equal(descriptor.bytes, data.length)
    assert.deepEqual(descriptor.original, { sha256: sha(originals[index + 1]), bytes: originals[index + 1].length })
  }
  const head = f.git('rev-parse', 'HEAD'), expected = {
    expectedHead: head, expectedDiffSha256: sha(execFileSync('git', ['diff', '--binary', `${f.base}..${head}`, '--'], { cwd: f.repo })),
    expectedSources: [{ path: 'fixture-change.txt', sha256: sha(readFileSync(join(f.repo, 'fixture-change.txt'))) }],
    expectedReceipts: [], expectedReviews: [{ path: reviewPath, sha256: entry.bundleSha256 }],
  }
  assert.equal(verifyReviewBundle(bundle, expected).status, 'passed')
  const verified = spawnSync(process.execPath, [join(bundle, 'verify.mjs'), '--expected-head', head,
    '--expected-diff-sha256', expected.expectedDiffSha256, '--expected-source', `fixture-change.txt=${expected.expectedSources[0].sha256}`,
    '--expected-review', `${reviewPath}=${entry.bundleSha256}`], { encoding: 'utf8' })
  assert.equal(verified.status, 0, verified.stderr)
  assert.equal(JSON.parse(verified.stdout).status, 'passed')
  assert.throws(() => readReceiptStreams(f.repo, reviewPath, review), /Unknown raw stream format/)
  f.put('work/orchestration/review-copy.json', bytes)
  assert.equal(discoverReceipts(f.repo).receipts.some(item => item.path.endsWith('/review-copy.json')), false)
  rawPaths.forEach((path, index) => assert.deepEqual(readFileSync(path), originals[index]))
})

test('actual M6 runner keeps failed first-child receipts and cannot overwrite the attempt', t => {
  const f = fixture(t, { firstAction: 'process.exit(7)' }), result = f.run()
  assert.notEqual(result.status, 0); assert.match(result.stderr, /fresh-release: failed/)
  const manifest = assertStopped(f, 'failed'), receipt = f.json(firstPath)
  assert.equal(manifest.stages[0].status, 'failed'); assert.deepEqual(manifest.stages[0].outputs, {})
  assert.equal(receipt.version, 2); assert.equal(receipt.exitCode, 7); assert.equal(receipt.status, 'failed')
  assert.equal(readReceiptStreams(f.repo, firstPath, receipt).stdout, stdout(f.repo))
  assertNoOverwrite(f)
})

test('actual M6 runner invalidates intra-stage changes to either concrete receipt implementation', t => {
  for (const helper of helpers) {
    const f = fixture(t, { firstAction: `appendFileSync(${JSON.stringify(helper)}, '\\n// fixture source drift\\n')` })
    const result = f.run()
    assert.notEqual(result.status, 0); assert.match(result.stderr, /fresh-release: invalidated/)
    const manifest = assertStopped(f, 'failed'), receipt = f.json(firstPath)
    assert.equal(manifest.stages[0].status, 'invalidated'); assert.equal(receipt.status, 'invalidated')
    assert.notEqual(receipt.source.inputs[helper], receipt.sourceAfter.inputs[helper])
    assert.equal(readReceiptStreams(f.repo, firstPath, receipt).stdout, stdout(f.repo))
  }
})

test('actual M6 runner rejects inter-stage source drift across the v2 to v1 boundary', t => {
  const helper = helpers[0], f = fixture(t, { preload: `
import fs from 'node:fs'
const rename = fs.renameSync
fs.renameSync = (from, to) => {
  const result = rename(from, to)
  if (String(to).endsWith('/fresh-release.json.artifacts/publication.complete'))
    fs.appendFileSync(${JSON.stringify(helper)}, '\\n// inter-stage fixture source drift\\n')
  return result
}
` })
  const result = f.run()
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Source changed between acceptance stages/)
  const manifest = assertStopped(f, 'invalidated', 2), first = f.json(firstPath), second = f.json(`${output}/early-camp.json`)
  assert.equal(first.version, 2); assert.equal(second.version, 1)
  assert.equal(first.status, 'passed'); assert.equal(second.status, 'passed')
  assert.equal(manifest.stages[1].status, 'invalidated')
  assert.notEqual(first.source.inputs[helper], second.source.inputs[helper])
})

test('actual M6 runner rejects changed producer checkpoint bytes before v1 consumption', t => {
  const name = plan.stages[0].outputs[0], f = fixture(t, { preload: `
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
const read = fs.readFileSync
let changed = false
fs.readFileSync = (path, ...args) => {
  const bytes = read(path, ...args)
  if (!changed && String(path).endsWith('/checkpoints/${name}')) {
    changed = true
    fs.appendFileSync(path, 'fixture changed producer bytes\\n')
  }
  return bytes
}
syncBuiltinESMExports()
` })
  const result = f.run()
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Checkpoint changed since its producer/)
  const manifest = assertStopped(f, 'invalidated', 2), receipt = f.json(`${output}/early-camp.json`)
  assert.equal(receipt.status, 'passed'); assert.equal(receipt.version, 1)
  assert.equal(manifest.stages[0].outputs[name], sha(checkpoint(name)))
  assert.notEqual(receipt.source.inputs[`${output}/checkpoints/${name}`], manifest.stages[0].outputs[name])
})

test('actual M6 runner cannot promote a receipt after v2 finalization failure', t => {
  const f = fixture(t, { preload: `
import fs from 'node:fs'
const open = fs.openSync, close = fs.closeSync, paths = new Map()
fs.openSync = (path, ...args) => { const fd = open(path, ...args); paths.set(fd, String(path)); return fd }
let failed = false
fs.closeSync = fd => {
  const path = paths.get(fd); paths.delete(fd)
  const result = close(fd)
  if (!failed && path?.endsWith('/fresh-release.json.artifacts/stdout.log')) {
    failed = true
    throw new Error('fixture finalization close failure')
  }
  return result
}
` }), result = f.run()
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Receipt descriptor cleanup failed/)
  const manifest = f.json(`${output}/manifest.json`), receipt = f.json(firstPath)
  assert.equal(manifest.status, 'running'); assert.deepEqual(manifest.stages, [])
  assert.equal(Object.hasOwn(manifest, 'result'), false)
  assert.equal(existsSync(join(f.repo, output, 'early-camp.json')), false)
  assert.equal(receipt.status, 'passed') // Unpublished JSON is not eligible evidence.
  assert.equal(existsSync(join(f.repo, `${firstPath}.artifacts/publication.pending`)), true)
  assert.equal(existsSync(join(f.repo, `${firstPath}.artifacts/publication.complete`)), false)
  assert.equal(readFileSync(receipt.artifacts.stdout, 'utf8'), stdout(f.repo))
  assert.throws(() => readReceiptStreams(f.repo, firstPath, receipt), /publication is pending or failed/)
  assert.throws(() => buildReviewBundle(f.repo, { taskId: 'failed-finalization', base: f.base,
    output: join(f.root, 'review-bundle'), v2ReviewReceipt: { path: firstPath, sha256: sha(readFileSync(join(f.repo, firstPath))) } }),
  /publication is pending or failed/)
  assertNoOverwrite(f)
})

// This expands only transport coverage. No original game inputs or simulation run.
test('opted-in early-camp preserves failed-child diagnostics without downstream promotion', t => {
  const f = fixture(t, { boundedEarlyCamp: true, earlyAction: 'process.exit(7)' }), result = f.run()
  assert.notEqual(result.status, 0); assert.match(result.stderr, /early-camp: failed/)
  const manifest = assertStopped(f, 'failed', 2), path = `${output}/early-camp.json`, receipt = f.json(path)
  assert.equal(receipt.version, 2); assert.equal(receipt.exitCode, 7)
  assert.deepEqual(manifest.stages[1].outputs, {})
  assert.equal(readReceiptStreams(f.repo, path, receipt).stdout, stdout(f.repo))
  assert.equal(readReceiptStreams(f.repo, path, receipt).stderr, stderr())
  assertNoOverwrite(f)
})

test('opted-in early-camp rejects intra-stage source changes', t => {
  for (const helper of helpers) {
    const f = fixture(t, { boundedEarlyCamp: true,
      earlyAction: `appendFileSync(${JSON.stringify(helper)}, '\\n// fixture source drift\\n')` })
    const result = f.run()
    assert.notEqual(result.status, 0); assert.match(result.stderr, /early-camp: invalidated/)
    const manifest = assertStopped(f, 'failed', 2), path = `${output}/early-camp.json`, receipt = f.json(path)
    assert.equal(manifest.stages[1].status, 'invalidated'); assert.equal(receipt.version, 2)
    assert.notEqual(receipt.source.inputs[helper], receipt.sourceAfter.inputs[helper])
    assert.equal(readReceiptStreams(f.repo, path, receipt).stdout, stdout(f.repo))
  }
})

for (const producerIndex of [0, 1]) {
  const producer = plan.stages[producerIndex], consumer = plan.stages[producerIndex + 1]
  test(`opt-in rejects source drift from ${producer.name} to ${consumer.name}`, t => {
    const helper = helpers[0], f = fixture(t, { boundedEarlyCamp: true, preload: `
import fs from 'node:fs'
const rename = fs.renameSync
fs.renameSync = (from, to) => {
  const result = rename(from, to)
  if (String(to).endsWith('/${producer.name}.json.artifacts/publication.complete'))
    fs.appendFileSync(${JSON.stringify(helper)}, '\\n// inter-stage fixture source drift\\n')
  return result
}
` })
    const result = f.run()
    assert.notEqual(result.status, 0); assert.match(result.stderr, /Source changed between acceptance stages/)
    const manifest = assertStopped(f, 'invalidated', producerIndex + 2)
    const first = f.json(`${output}/${producer.name}.json`), second = f.json(`${output}/${consumer.name}.json`)
    assert.equal(first.version, 2); assert.equal(second.version, producerIndex === 0 ? 2 : 1)
    assert.equal(first.status, 'passed'); assert.equal(second.status, 'passed')
    assert.equal(manifest.stages[producerIndex + 1].status, 'invalidated')
    assert.notEqual(first.source.inputs[helper], second.source.inputs[helper])
  })

  test(`opt-in rejects changed ${producer.name} checkpoint before ${consumer.name} promotion`, t => {
    const name = consumer.inputs[0], f = fixture(t, { boundedEarlyCamp: true, preload: `
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
const read = fs.readFileSync
let changed = false
fs.readFileSync = (path, ...args) => {
  const bytes = read(path, ...args)
  if (!changed && String(path).endsWith('/checkpoints/${name}')) {
    changed = true
    fs.appendFileSync(path, 'fixture changed producer bytes\\n')
  }
  return bytes
}
syncBuiltinESMExports()
` })
    const result = f.run()
    assert.notEqual(result.status, 0); assert.match(result.stderr, /Checkpoint changed since its producer/)
    const manifest = assertStopped(f, 'invalidated', producerIndex + 2), receipt = f.json(`${output}/${consumer.name}.json`)
    assert.equal(receipt.status, 'passed'); assert.equal(receipt.version, producerIndex === 0 ? 2 : 1)
    assert.equal(manifest.stages[producerIndex].outputs[name], sha(checkpoint(name)))
    assert.notEqual(receipt.source.inputs[`${output}/checkpoints/${name}`], manifest.stages[producerIndex].outputs[name])
  })
}

test('opted-in early-camp finalization failure retains raw diagnostics but cannot promote', t => {
  const path = `${output}/early-camp.json`, f = fixture(t, { boundedEarlyCamp: true, preload: `
import fs from 'node:fs'
const open = fs.openSync, close = fs.closeSync, paths = new Map()
fs.openSync = (path, ...args) => { const fd = open(path, ...args); paths.set(fd, String(path)); return fd }
let failed = false
fs.closeSync = fd => {
  const path = paths.get(fd); paths.delete(fd)
  const result = close(fd)
  if (!failed && path?.endsWith('/early-camp.json.artifacts/stdout.log')) {
    failed = true
    throw new Error('fixture finalization close failure')
  }
  return result
}
` }), result = f.run()
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Receipt descriptor cleanup failed/)
  const manifest = f.json(`${output}/manifest.json`), receipt = f.json(path)
  assert.equal(manifest.status, 'running'); assert.equal(manifest.stages.length, 1)
  assert.equal(Object.hasOwn(manifest, 'result'), false)
  assert.equal(existsSync(join(f.repo, output, 'army-approach.json')), false)
  assert.equal(receipt.status, 'passed'); assert.equal(receipt.version, 2) // Unpublished JSON is ineligible.
  assert.equal(existsSync(join(f.repo, `${path}.artifacts/publication.pending`)), true)
  assert.equal(existsSync(join(f.repo, `${path}.artifacts/publication.complete`)), false)
  assert.equal(readFileSync(receipt.artifacts.stdout, 'utf8'), stdout(f.repo))
  assert.equal(readFileSync(receipt.artifacts.stderr, 'utf8'), stderr())
  assert.throws(() => readReceiptStreams(f.repo, path, receipt), /publication is pending or failed/)
  assert.throws(() => buildReviewBundle(f.repo, { taskId: 'early-failed-finalization', base: f.base,
    output: join(f.root, 'review-bundle'), v2ReviewReceipt: { path, sha256: sha(readFileSync(join(f.repo, path))) } }),
  /publication is pending or failed/)
  assertNoOverwrite(f)
})

test('M6 CLI rejects unknown or duplicate opt-ins before creating output', t => {
  const f = fixture(t)
  for (const args of [['--bounded-all'], ['--bounded-early-camp', '--bounded-early-camp'], ['extra-output']]) {
    const result = spawnSync(process.execPath, [runner, output, ...args], { cwd: f.repo, encoding: 'utf8' })
    assert.notEqual(result.status, 0); assert.match(result.stderr, /Usage:/)
    assert.equal(existsSync(join(f.repo, output)), false)
  }
})

test('actual M6 runner stops after a bounded standalone receipt exhausts its raw allowance', t => {
  const f = fixture(t)
  {
    const result = spawnSync(process.execPath, [runner, output], { cwd: f.repo,
      env: { ...process.env, POPULOUS_RECEIPT_MAX_RAW_BYTES: '32' },
      encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 30000 })
    assert.notEqual(result.status, 0)
    const manifest = assertStopped(f, 'failed'), receipt = f.json(firstPath)
    assert.equal(manifest.stages[0].status, 'failed')
    assert.equal(receipt.status, 'failed'); assert.equal(receipt.rawCapture.complete, false)
    assert.equal(receipt.rawBudget.usedBytes, 32)
    assert.equal(existsSync(join(f.repo, `${firstPath}.artifacts/publication.pending`)), true)
    assert.equal(existsSync(join(f.repo, `${firstPath}.artifacts/publication.complete`)), false)
  }
})
