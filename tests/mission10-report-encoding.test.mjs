import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { resolve } from 'node:path'

const source = readFileSync(new URL('../scripts/local-render/mission10-boat-checkpoint.mjs', import.meta.url), 'utf8')
const saveExpression = source.match(/const save = \(\) => (writeFileSync\(resolve\(output, 'boat-checkpoint\.json'\)[^\n]+)/)?.[1]
assert.ok(saveExpression, 'Exercise the actual production report save expression')
function save(report, writeFileSync) {
  return runInNewContext(saveExpression, { report, output: '/evidence', resolve, writeFileSync })
}

test('actual M10 save preserves complete parsed reports at running, passed and failed save points', () => {
  const report = { status: 'running', source: { commit: 'a'.repeat(40) }, actions: [], observations: [],
    selection: [], labels: ['ümlaut', '\n\t', 'quoted " value'], optional: undefined }
  const writes = []
  for (const status of ['running', 'running', 'passed', 'failed']) {
    report.status = status
    report.actions.push({ label: status, phase: 'after', at: '2026-11-16T12:00:00.000Z' })
    report.observations.push({ orders: { records: [{ flags: 0, target: null, args: [1, 2] }] },
      aliases: { native: 'native', entry: 'native' }, selected: [63, 111], paused: true })
    const old = JSON.stringify(report, null, 2) + '\n'
    save(report, (path, bytes) => {
      assert.equal(path, '/evidence/boat-checkpoint.json')
      assert.equal(bytes, JSON.stringify(report) + '\n')
      assert.deepEqual(JSON.parse(bytes), JSON.parse(old))
      assert.ok(Buffer.byteLength(bytes) < Buffer.byteLength(old))
      writes.push(bytes)
    })
  }
  assert.equal(writes.length, 4, 'Each call writes synchronously, without buffering or deferred persistence')
  assert.equal(JSON.parse(writes[0]).actions.length, 1, 'Earlier saved bytes cannot change with later report mutation')
  assert.equal(JSON.parse(writes.at(-1)).status, 'failed')
})

test('actual M10 save preserves serialization and write failures', () => {
  const report = {}; report.self = report
  let called = false
  assert.throws(() => save(report, () => { called = true }), /circular/i)
  assert.equal(called, false)
  const failure = new Error('supplied write failure')
  assert.throws(() => save({ status: 'running' }, () => { throw failure }), error => error === failure)
})
