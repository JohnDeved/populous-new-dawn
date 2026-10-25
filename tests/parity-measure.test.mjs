import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createReceiptArtifacts } from '../scripts/orchestration/receipt-streams.mjs'
import { MetadataParser, createMetadataBudget } from '../scripts/parity-json-metadata.mjs'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { buildReport, browserSourceFingerprint, captureMeasurement, discoverReceipts, evaluateCheck, finishMeasurement, refreshMeasurement, renderHTML, writeReport } from '../scripts/parity-measure.mjs'
import { runCommandReceipt } from '../scripts/orchestration/command-receipt.mjs'

const check = { id: 'opening-browser', kind: 'browser', executable: 'node', args: ['check.mjs'], inputs: ['check.mjs', 'app/game.ts'], expected: { exitCode: 0, artifacts: [] } }
const current = { browserInputFingerprint: 'browser-source', ownedServerFingerprint: 'browser-source', version: 1, checkId: check.id, definitionHash: 'definition', inputPaths: ['app/game.ts'], inputFingerprint: 'source', runtime: { node: 'test' } }
const evidence = (status = 'passed', overrides = {}) => ({ ...current, status, exitCode: status === 'passed' ? 0 : 1, finishedAt: '2026-10-07T00:00:00.000Z', ...overrides })
const receipt = (value, path = 'receipt.json') => ({ path, measurements: [value] })
const model = {
  checks: [check], inventory: [{ id: 'campaign.mission-one', title: 'Complete mission', group: 'campaign' }],
  definitions: { capabilities: [{ id: 'm1', scope: 'scenario', title: 'Opening', mission: 1, parityId: 'campaign.mission-one', browserCheckIds: [check.id], originalCheckIds: [], limits: 'No complete original comparison' }] },
}

test('missing receipt and missing original comparison are unknown, never inferred from old status', () => {
  assert.equal(evaluateCheck(check, [], current).status, 'unknown')
  const report = buildReport(model, [receipt(evidence())], [current], { head: 'abc' })
  assert.equal(report.missionCases.capabilities[0].browserStatus, 'verified')
  assert.equal(report.missionCases.capabilities[0].status, 'unknown')
  assert.equal(report.knownScope.total, 1)
  assert.equal(report.knownScope.percent, 0)
})

test('fresh passed receipt qualifies; input, definition, runtime and field-list changes invalidate', () => {
  assert.equal(evaluateCheck(check, [receipt(evidence())], current).status, 'verified')
  for (const change of [{ inputFingerprint: 'old' }, { definitionHash: 'old' }, { runtime: {} }, { inputPaths: [] }, { status: 'invalidated' }])
    assert.equal(evaluateCheck(check, [receipt(evidence('passed', change))], current).status, 'stale')
})

test('failure wins over old pass and timestamp ties; new completed pass can recover', () => {
  const pass = receipt(evidence(), 'a.json'), fail = receipt(evidence('failed'), 'b.json')
  assert.equal(evaluateCheck(check, [pass, fail], current).status, 'failed')
  assert.equal(evaluateCheck(check, [pass, fail], current).regression, true)
  const later = receipt(evidence('passed', { finishedAt: '2026-10-07T00:01:00.000Z' }), 'c.json')
  assert.equal(evaluateCheck(check, [later, fail, pass], current).status, 'verified')
})

test('blocked, skipped, not-run, incomplete, mismatched exit and aggregate produce no pass', () => {
  for (const status of ['not-run', 'not-applicable', 'unknown']) assert.equal(evaluateCheck(check, [receipt(evidence(status))], current).status, 'unknown')
  assert.equal(evaluateCheck(check, [receipt(evidence('blocked'))], current).status, 'blocked')
  assert.equal(evaluateCheck(check, [receipt(evidence('passed', { exitCode: 1 }))], current).status, 'failed')
  assert.equal(evaluateCheck(check, [receipt(evidence('passed', { finishedAt: undefined }))], current).status, 'unknown')
  assert.equal(evaluateCheck(check, [{ path: 'aggregate', measurements: [{ ...evidence(), checkId: 'all' }] }], current).status, 'unknown')
})

test('extra receipts never add credit; deleting bindings retains known requirements; output deterministic and escaped', () => {
  const one = buildReport(model, [receipt(evidence())], [current], { head: '<script>' })
  const many = buildReport(model, [receipt(evidence()), receipt(evidence())], [current], { head: '<script>' })
  assert.deepEqual(many, one)
  const removed = buildReport({ ...model, definitions: { capabilities: [] } }, [], [], {})
  assert.equal(removed.knownScope.total, 1)
  assert.notEqual(removed.scopeHash, one.scopeHash)
  assert.ok(renderHTML(one).includes('&lt;script&gt;'))
  assert.ok(!renderHTML(one).includes('<script>'))
})

function repository(t) {
  const repo = mkdtempSync(join(tmpdir(), 'parity-measure-'))
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  const put = (path, value) => { mkdirSync(join(repo, path, '..'), { recursive: true }); writeFileSync(join(repo, path), typeof value === 'string' ? value : JSON.stringify(value)) }
  put('engineering/checks.json', { checks: [check] })
  put('engineering/parity-capabilities.json', { version: 1, ...model.definitions })
  put('parity.json', { revision: 1, groups: [{ id: 'campaign', items: [{ id: 'campaign.mission-one', title: 'Complete mission', status: 'verified' }] }] })
  put('parity-history.json', [{ date: '2026-09-11', revision: 1, verified: 1, total: 1 }])
  put('app/game.ts', 'original')
  put('public/original/source.txt', 'data')
  put('package.json', '{}')
  put('package-lock.json', '{}')
  put('check.mjs', "console.log('pass')")
  put('.gitignore', '/work/\n')
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
  git('init', '-q'); git('add', '.'); git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'fixture')
  return { repo, put }
}

test('actual input capture invalidates fixtures/dependencies/source, ignores unrelated file, never captures aggregate', t => {
  const { repo, put } = repository(t), command = ['node', 'check.mjs']
  const original = captureMeasurement(repo, command)
  put('unrelated.md', 'changed')
  assert.deepEqual(captureMeasurement(repo, command), original)
  assert.deepEqual(captureMeasurement(repo, ['npm', 'test']), [])
  for (const [path, value] of [['app/game.ts', 'changed'], ['public/original/source.txt', 'changed'], ['package-lock.json', '{"new":true}']]) {
    const before = captureMeasurement(repo, command)
    put(path, value)
    const after = captureMeasurement(repo, command)
    assert.notDeepEqual(after, before)
    assert.equal(finishMeasurement(before, after, { status: 'passed', exitCode: 0 }).at(0).status, 'invalidated')
  }
})

test('real command receipt automatically gains binding, report and history; scope changes retain history', async t => {
  const { repo, put } = repository(t)
  const result = await runCommandReceipt(repo, { output: 'work/orchestration/run/pass.json', command: ['node', 'check.mjs'] })
  assert.equal(result.parityMeasurements[0].status, 'passed')
  const report = writeReport(repo)
  assert.equal(report.checks[0].status, 'unknown')
  assert.equal(report.checks[0].diagnosticStatus, 'passed')
  assert.equal(report.missionCases.capabilities[0].status, 'unknown')
  const history = () => JSON.parse(readFileSync(join(repo, 'work/orchestration/parity-measure/history.json')))
  assert.equal(history().length, 1)
  writeReport(repo)
  assert.equal(history().length, 1)
  put('engineering/parity-capabilities.json', { version: 1, capabilities: [] })
  writeReport(repo)
  assert.equal(history().length, 2)
  assert.equal(history()[1].change, 'scope revision')
  assert.equal(history()[0].reportHash.length, 64)
})

test('receipt records source drift as invalidated and cannot credit changed behavior', async t => {
  const { repo, put } = repository(t)
  put('check.mjs', "import{writeFileSync}from'node:fs';writeFileSync('app/game.ts','changed')")
  const result = await runCommandReceipt(repo, { output: 'work/orchestration/run/drift.json', command: ['node', 'check.mjs'] })
  assert.equal(result.status, 'invalidated')
  assert.equal(result.parityMeasurements[0].status, 'invalidated')
  assert.equal(writeReport(repo).checks[0].status, 'stale')
})


test('browser outcome needs independently owned source provenance, not just local hashes', t => {
  const { repo } = repository(t), command = ['node', 'check.mjs']
  const unbound = captureMeasurement(repo, command)[0]
  const outcome = { ...unbound, status: 'passed', exitCode: 0, finishedAt: '2026-10-07T01:00:00Z' }
  assert.equal(evaluateCheck(check, [receipt(outcome)], unbound).status, 'unknown')
  const bound = captureMeasurement(repo, command, { ownedServerFingerprint: browserSourceFingerprint(repo) })[0]
  assert.equal(evaluateCheck(check, [receipt({ ...outcome, ...bound })], unbound).status, 'verified')
  assert.equal(evaluateCheck(check, [receipt({ ...outcome, ownedServerFingerprint: 'different-server' })], unbound).status, 'unknown')
  assert.equal(evaluateCheck(check, [receipt({ ...outcome, status: 'failed', exitCode: 1 })], unbound).status, 'unknown')
  assert.deepEqual(captureMeasurement(repo, command, { cwd: join(repo, 'app') }), [])
})


test('refresh failure invalidates an existing current pass without rewriting history', t => {
  const { repo, put } = repository(t)
  writeReport(repo)
  const historyPath = join(repo, 'work/orchestration/parity-measure/history.json')
  const history = readFileSync(historyPath, 'utf8')
  put('work/orchestration/parity-measure/report.json', { status: 'verified', percent: 100 })
  put('work/orchestration/parity-measure/index.html', '<h1>100% verified</h1>')
  put('engineering/parity-capabilities.json', { version: 999, capabilities: [] })
  refreshMeasurement(repo)
  const report = JSON.parse(readFileSync(join(repo, 'work/orchestration/parity-measure/report.json')))
  assert.equal(report.status, 'unavailable')
  assert.ok(!('percent' in report))
  assert.ok(!readFileSync(join(repo, 'work/orchestration/parity-measure/index.html'), 'utf8').includes('100%'))
  assert.equal(readFileSync(historyPath, 'utf8'), history)
})


test('real v2 command finalization failure cannot earn measurement credit', async t => {
  const { repo, put } = repository(t), nativeCheck = { ...check, kind: 'native' }
  put('engineering/checks.json', { checks: [nativeCheck] })
  put('engineering/parity-capabilities.json', { version: 1, capabilities: [{ ...model.definitions.capabilities[0],
    browserCheckIds: [], originalCheckIds: [nativeCheck.id] }] })
  const command = ['node', 'check.mjs'], current = captureMeasurement(repo, command)[0]
  const path = 'work/orchestration/final.json', target = join(repo, path)
  const renameSync = fs.renameSync, writeSync = fs.writeSync
  let published = false
  const rename = t.mock.method(fs, 'renameSync', (from, to) => {
    renameSync(from, to); published = true
    const fd = fs.openSync(target + '.artifacts/stdout.log', 'r+')
    try { writeSync(fd, 'fail\n', 0) } finally { fs.closeSync(fd) }
  })
  // Corrective I/O is unavailable after publication. The preexisting guard, not
  // a best-effort status rewrite, must prevent downstream success.
  const writes = t.mock.method(fs, 'writeSync', (...args) => {
    if (published) throw new Error('corrective I/O unavailable')
    return writeSync(...args)
  })
  await assert.rejects(runCommandReceipt(repo, { output: path, command, streamVersion: 2 }), /Captured raw stream changed/)
  rename.mock.restore(); writes.mock.restore()
  const persisted = JSON.parse(readFileSync(target))
  assert.equal(persisted.status, 'passed'); assert.equal(persisted.publication, 'guard-v1')
  assert.equal(persisted.parityMeasurements[0].status, 'passed')
  writeFileSync(persisted.artifacts.stdout, 'pass\n')
  const discovered = discoverReceipts(repo)
  assert.match(discovered.warnings.join(' '), /publication is pending/)
  assert.equal(evaluateCheck(nativeCheck, discovered.receipts, current).status, 'stale')
})


test('generic v2 discovery verifies complete raw identity and preserves newer invalid attempts', t => {
  const root = mkdtempSync(join(tmpdir(), 'measurement-raw-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const path = 'work/orchestration/v2.json', target = join(root, path), artifacts = createReceiptArtifacts(target)
  try {
    fs.writeSync(artifacts.fd('stdout'), 'complete result')
    const terminal = { kind: 'pnd-command-receipt', version: 2, streamFormat: 'raw-artifact-v1', status: 'passed',
      artifacts: { stdout: target + '.artifacts/stdout.log', stderr: target + '.artifacts/stderr.log' },
      ...artifacts.capture(), parityMeasurements: [evidence()] }
    artifacts.write(terminal, true)
  } finally { artifacts.close() }
  assert.equal(evaluateCheck(check, discoverReceipts(root).receipts, current).status, 'verified')
  writeFileSync(join(root, 'work/orchestration/older.json'), JSON.stringify({ kind: 'pnd-command-receipt', version: 1,
    status: 'passed', parityMeasurements: [evidence('passed', { finishedAt: '2026-10-06T00:00:00Z' })] }))
  writeFileSync(target + '.artifacts/stdout.log', 'tampered result')
  const discovered = discoverReceipts(root)
  assert.match(discovered.warnings.join(' '), /identity mismatch/)
  assert.equal(evaluateCheck(check, discovered.receipts, current).status, 'stale')
})

test('streaming metadata retains receipt version instead of downgrading v2 to legacy', () => {
  const parser = new MetadataParser(createMetadataBudget())
  parser.write(JSON.stringify({ kind: 'pnd-command-receipt', version: 2, status: 'passed',
    stdout: 'not retained', parityMeasurements: [evidence()] }))
  const value = parser.finish()
  assert.equal(value.version, 2)
  assert.equal(Object.hasOwn(value, 'stdout'), false)
})


test('projected v2 measurements remain invalidated and cannot regain legacy credit', t => {
  const root = mkdtempSync(join(tmpdir(), 'measurement-projected-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'work/orchestration'), { recursive: true })
  writeFileSync(join(root, 'work/orchestration/projected.json'), JSON.stringify({ kind: 'pnd-command-receipt', version: 2,
    status: 'passed', parityMeasurements: [evidence()] }))
  // Reduce the normal budget to exercise streaming on a tiny fixture.
  const discovered = discoverReceipts(root, { fileLimit: 64 })
  assert.match(discovered.warnings.join(' '), /Projected receipt cannot verify/)
  assert.equal(evaluateCheck(check, discovered.receipts, current).status, 'stale')
})
