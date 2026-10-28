import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync, symlinkSync, linkSync, truncateSync, renameSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { artifactInventory } from '../scripts/native-ui-evidence/browser-owner.mjs'
import { limits } from '../scripts/native-ui-evidence/policy.mjs'
import { finalizeArtifactReceipt, recordArtifactFailure, artifactFailureText } from '../scripts/native-ui-evidence/receipt-finalization.mjs'

const readSource = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
function fixture(t, report = { status: 'running' }) {
  const output = mkdtempSync(resolve(tmpdir(), 'native-receipt-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  const path = resolve(output, 'receipt.json')
  if (report !== null) writeFileSync(path, JSON.stringify(report) + '\n')
  return { output, path }
}
function actual(output, report) {
  const files = artifactInventory(output)
  files.files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  assert.deepEqual(files, report.artifacts)
  assert.equal(files.bytes, files.files.reduce((sum, file) => sum + file.bytes, 0))
  const receipt = files.files.find(file => file.path === 'receipt.json')
  assert.equal(receipt.bytes, statSync(resolve(output, 'receipt.json')).size)
  return files
}
function finalCaller() {
  const source = readSource('scripts/native-ui-evidence/run.mjs')
  const marker = '  report.finishedAt = new Date().toISOString()'
  assert.equal(source.split(marker).length, 2)
  const block = source.slice(source.indexOf(marker), source.lastIndexOf('\n}'))
  return new Function('output', 'report', 'finalizeArtifactReceipt', 'recordArtifactFailure', 'artifactFailureText', 'process', 'console', block)
}

test('final inventory includes the final receipt itself rather than its earlier snapshot', t => {
  const { output, path } = fixture(t), report = { status: 'passed' }
  writeFileSync(resolve(output, 'evidence.log'), 'inert evidence')
  report.artifacts = artifactInventory(output)
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n')
  assert.ok(artifactInventory(output).bytes > report.artifacts.bytes, 'Reproduces old inventory-then-save undercount')
  report.artifacts = finalizeArtifactReceipt(output, report)
  assert.deepEqual(JSON.parse(readFileSync(path)), report)
  actual(output, report)
})

test('first-stage failure can finalize when no receipt was previously written', t => {
  const { output, path } = fixture(t, null), report = { status: 'failed', failure: 'source capture failed' }
  report.artifacts = finalizeArtifactReceipt(output, report)
  assert.deepEqual(JSON.parse(readFileSync(path)), report); actual(output, report)
})

test('existing primary failure and stack survive successful inventory finalization', t => {
  const { output, path } = fixture(t), report = { status: 'failed', failure: 'original browser failure', stack: 'retained stack',
    inputFailures: ['candidate'], inputsAfter: { candidate: 'changed' } }
  report.artifacts = finalizeArtifactReceipt(output, report)
  assert.equal(JSON.parse(readFileSync(path)).failure, 'original browser failure')
  assert.equal(report.status, 'failed'); assert.equal(report.stack, 'retained stack')
  assert.deepEqual(JSON.parse(readFileSync(path)), report); actual(output, report)
})

test('self-size uses UTF-8 bytes for receipt text and artifact names', t => {
  const { output, path } = fixture(t), report = { status: 'passed', note: 'Ä ☀ 測試' }
  writeFileSync(resolve(output, 'évidence-測試.log'), 'ä')
  report.artifacts = finalizeArtifactReceipt(output, report)
  const text = readFileSync(path, 'utf8')
  assert.ok(Buffer.byteLength(text) > text.length); actual(output, report)
})

test('nested artifacts and decimal-size growth converge to exact final totals', t => {
  const { output, path } = fixture(t), report = { status: 'passed', note: 'x'.repeat(940) }
  mkdirSync(resolve(output, 'nested')); writeFileSync(resolve(output, 'nested/image.png'), 'inert image stand-in')
  report.artifacts = finalizeArtifactReceipt(output, report)
  assert.equal(report.artifacts.screenshots, 1); assert.ok(statSync(path).size > 1000); actual(output, report)
})

test('final receipt growth cannot cross the existing byte cap after an initially valid inventory', t => {
  const { output, path } = fixture(t), before = readFileSync(path), payload = resolve(output, 'sparse-data')
  writeFileSync(payload, '')
  truncateSync(payload, limits.artifactBytes - before.length) // Sparse fixture: no payload allocation/read.
  assert.equal(artifactInventory(output).bytes, limits.artifactBytes)
  assert.throws(() => finalizeArtifactReceipt(output, { status: 'passed' }), /Final receipt exceeds artifact byte budget/)
  assert.deepEqual(readFileSync(path), before)
})

test('the existing screenshot count limit still rejects before final write', t => {
  const { output, path } = fixture(t), before = readFileSync(path)
  for (let i = 0; i <= limits.screenshots; i++) writeFileSync(resolve(output, `${i}.png`), '')
  assert.throws(() => finalizeArtifactReceipt(output, { status: 'passed' }), /Screenshot budget/)
  assert.deepEqual(readFileSync(path), before)
})

test('receipt symlinks are rejected without changing their targets', t => {
  const { output, path } = fixture(t, null), target = resolve(output, 'retained.json')
  writeFileSync(target, 'retained'); symlinkSync(target, path)
  assert.throws(() => finalizeArtifactReceipt(output, { status: 'passed' }), /Private regular receipt/)
  assert.equal(readFileSync(target, 'utf8'), 'retained')
})

test('receipt hardlinks are rejected without changing the other owned fixture name', t => {
  const { output, path } = fixture(t), before = readFileSync(path), linked = resolve(output, 'retained.json')
  linkSync(path, linked)
  assert.throws(() => finalizeArtifactReceipt(output, { status: 'passed' }), /Private regular receipt/)
  assert.deepEqual(readFileSync(linked), before)
})

test('a directory cannot be adopted as the receipt', t => {
  const { output, path } = fixture(t, null); mkdirSync(path)
  assert.throws(() => finalizeArtifactReceipt(output, { status: 'passed' }), /Private regular receipt/)
})

test('bounded nonconvergence fails before overwriting an existing receipt', t => {
  const { output, path } = fixture(t), before = readFileSync(path)
  let calls = 0
  const report = { status: 'passed', changing: { toJSON() { return 'x'.repeat(++calls * 100) } } }
  assert.throws(() => finalizeArtifactReceipt(output, report), /fixed bound/)
  assert.equal(calls, 16); assert.deepEqual(readFileSync(path), before)
})

test('receipt replacement during serialization is rejected before truncation', t => {
  const { output, path } = fixture(t)
  let changed = false
  const report = { status: 'passed', changing: { toJSON() {
    if (!changed) { changed = true; writeFileSync(path, 'retained concurrent receipt') }
    return 'stable'
  } } }
  assert.throws(() => finalizeArtifactReceipt(output, report), /Receipt changed before final write/)
  assert.equal(readFileSync(path, 'utf8'), 'retained concurrent receipt')
})

test('actual caller writes one exact successful terminal receipt without a stale second save', t => {
  const { output, path } = fixture(t), report = { status: 'passed' }, processState = {}
  let saves = 0
  finalCaller()(output, report, finalizeArtifactReceipt, () => { saves++; throw Error('Unexpected failure marker') }, artifactFailureText, processState, { error() { throw Error('Unexpected failure stderr') } })
  assert.equal(saves, 0); assert.equal(processState.exitCode, undefined)
  assert.deepEqual(JSON.parse(readFileSync(path)), report); actual(output, report)
})

test('actual caller removes stale inventory while preserving primary failure on artifact failure', t => {
  const { output, path } = fixture(t), report = { status: 'failed', failure: 'original failure', artifacts: { stale: true } }
  const processState = {}; let saves = 0
  finalCaller()(output, report, () => { throw Error('inert inventory failure') }, (root, failed) => {
    saves++; recordArtifactFailure(root, failed)
  }, artifactFailureText, processState, { error() { throw Error('Unexpected failure stderr') } })
  assert.equal(saves, 1); assert.equal(processState.exitCode, 1)
  assert.equal(report.failure, 'original failure'); assert.equal(report.status, 'failed')
  assert.match(report.artifactFailure, /inert inventory failure/); assert.equal(Object.hasOwn(report, 'artifacts'), false)
})

test('late artifact creation becomes failed terminal evidence through the actual caller', t => {
  const { output, path } = fixture(t), processState = {}
  let added = false
  const report = { status: 'passed', changing: { toJSON() {
    if (!added) { added = true; writeFileSync(resolve(output, 'late.log'), 'late') }
    return 'stable'
  } } }
  finalCaller()(output, report, finalizeArtifactReceipt, recordArtifactFailure, artifactFailureText, processState, { error() { throw Error('Unexpected failure stderr') } })
  const saved = JSON.parse(readFileSync(resolve(output, 'receipt-finalization-failure.json')))
  assert.equal(saved.status, 'failed'); assert.match(saved.artifactFailure, /Artifacts changed/)
  assert.equal(processState.exitCode, 1); assert.equal(Object.hasOwn(saved, 'artifacts'), false)
  assert.equal(saved.receiptAccepted, false)
  assert.equal(JSON.parse(readFileSync(path)).status, 'passed', 'Rejected prior bytes are retained, not relabelled as accepted')
})

test('canonical native evidence import and registry include the complete receipt regression without command churn', () => {
  assert.match(readSource('tests/native-ui-evidence.test.mjs'), /import '\.\/native-ui-receipt\.test\.mjs'/)
  const check = JSON.parse(readSource('engineering/checks.json')).checks.find(item => item.id === 'native-ui-evidence-tests')
  assert.ok(check.args.includes('tests/native-ui-evidence.test.mjs'))
  assert.ok(check.inputs.includes('tests/native-ui-receipt.test.mjs'))
  assert.ok(check.triggerPaths.includes('tests/native-ui-receipt.test.mjs'))
  assert.ok(check.inputs.includes('scripts/native-ui-evidence'))
})


function failThroughCaller(output, report) {
  const processState = {}, stderr = []
  finalCaller()(output, report, finalizeArtifactReceipt, recordArtifactFailure, artifactFailureText,
    processState, { error: (...args) => stderr.push(args.join(' ')) })
  assert.equal(report.status, 'failed'); assert.equal(processState.exitCode, 1)
  assert.equal(Object.hasOwn(report, 'artifacts'), false)
  assert.ok(stderr.every(line => Buffer.byteLength(line) <= 32768))
  return stderr
}

for (const kind of ['symlink', 'hardlink', 'replacement']) test(`actual caller never overwrites a rejected ${kind} receipt`, t => {
  const { output, path } = fixture(t, kind === 'symlink' ? null : { status: 'running' })
  const retained = resolve(output, 'retained.json'), marker = 'retained target bytes'
  let changed = false
  if (kind === 'symlink') { writeFileSync(retained, marker); symlinkSync(retained, path) }
  if (kind === 'hardlink') linkSync(path, retained)
  const before = kind === 'symlink' ? Buffer.from(marker) : readFileSync(path)
  const report = { status: 'failed', failure: 'primary is retained', inputFailures: ['candidate'],
    inputsAfter: { candidate: 'changed' }, artifacts: { stale: true } }
  if (kind === 'replacement') report.changing = { toJSON() {
    if (!changed) { changed = true; renameSync(path, retained); writeFileSync(path, marker) }
    return 'stable'
  } }
  const stderr = failThroughCaller(output, report)
  assert.deepEqual(readFileSync(retained), before)
  if (kind === 'replacement') assert.equal(readFileSync(path, 'utf8'), marker)
  else assert.deepEqual(readFileSync(path), before)
  assert.equal(report.failure, 'primary is retained'); assert.deepEqual(report.inputFailures, ['candidate'])
  if (kind === 'symlink') { assert.equal(stderr.length, 1); assert.match(stderr[0], /NOT accepted/) }
  else {
    assert.equal(stderr.length, 0)
    const failure = JSON.parse(readFileSync(resolve(output, 'receipt-finalization-failure.json')))
    assert.equal(failure.status, 'failed'); assert.equal(failure.receiptAccepted, false)
    assert.equal(failure.failure, 'primary is retained'); assert.deepEqual(failure.inputFailures, ['candidate'])
    assert.deepEqual(failure.inputsAfter, { candidate: 'changed' }); assert.equal(Object.hasOwn(failure, 'artifacts'), false)
  }
})

test('failure marker collisions preserve prior evidence and use bounded terminal stderr', t => {
  const { output, path } = fixture(t)
  const marker = resolve(output, 'receipt-finalization-failure.json'); writeFileSync(marker, 'previous unique evidence')
  const before = readFileSync(path), report = { status: 'failed', failure: 'original primary', inputFailures: ['dependencies'] }
  const stderr = failThroughCaller(output, report)
  assert.equal(stderr.length, 1); assert.match(stderr[0], /EEXIST/)
  assert.match(stderr[0], /original primary/); assert.match(stderr[0], /dependencies/)
  assert.equal(readFileSync(marker, 'utf8'), 'previous unique evidence')
  assert.deepEqual(readFileSync(path), before)
  assert.match(report.artifactFailure, /Terminal failure marker already exists/)
})

test('a full artifact budget cannot grow by adding a failure marker', t => {
  const { output, path } = fixture(t), before = readFileSync(path), payload = resolve(output, 'sparse-data')
  writeFileSync(payload, ''); truncateSync(payload, limits.artifactBytes - before.length)
  const stderr = failThroughCaller(output, { status: 'passed' })
  assert.equal(stderr.length, 1); assert.match(stderr[0], /Failure receipt exceeds artifact budget/)
  assert.equal(artifactInventory(output).bytes, limits.artifactBytes)
  assert.deepEqual(readFileSync(path), before)
})

test('oversized failure metadata is not written and stderr remains bounded', t => {
  const { output, path } = fixture(t); linkSync(path, resolve(output, 'linked.json'))
  const report = { status: 'failed', failure: '測'.repeat(70000), inputFailures: ['candidate'] }
  const stderr = failThroughCaller(output, report)
  assert.equal(stderr.length, 1); assert.match(stderr[0], /Failure receipt bound/)
  assert.equal(report.failure.length, 70000)
})
