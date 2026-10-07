import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { buildReport, captureMeasurement, evaluateCheck, finishMeasurement, renderHTML, writeReport } from '../scripts/parity-measure.mjs'
import { runCommandReceipt } from '../scripts/orchestration/command-receipt.mjs'

const check = { id: 'opening-browser', kind: 'browser', executable: 'node', args: ['check.mjs'], inputs: ['check.mjs', 'app/game.ts'], expected: { exitCode: 0, artifacts: [] } }
const current = { version: 1, checkId: check.id, definitionHash: 'definition', inputPaths: ['app/game.ts'], inputFingerprint: 'source', runtime: { node: 'test' } }
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

test('real command receipt automatically gains binding, report and history; scope changes retain history', t => {
  const { repo, put } = repository(t)
  const result = runCommandReceipt(repo, { output: 'work/orchestration/run/pass.json', command: ['node', 'check.mjs'] })
  assert.equal(result.parityMeasurements[0].status, 'passed')
  const report = writeReport(repo)
  assert.equal(report.checks[0].status, 'verified')
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

test('receipt records source drift as invalidated and cannot credit changed behavior', t => {
  const { repo, put } = repository(t)
  put('check.mjs', "import{writeFileSync}from'node:fs';writeFileSync('app/game.ts','changed')")
  const result = runCommandReceipt(repo, { output: 'work/orchestration/run/drift.json', command: ['node', 'check.mjs'] })
  assert.equal(result.status, 'invalidated')
  assert.equal(result.parityMeasurements[0].status, 'invalidated')
  assert.equal(writeReport(repo).checks[0].status, 'stale')
})
