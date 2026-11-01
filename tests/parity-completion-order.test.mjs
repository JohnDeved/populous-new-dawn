import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const source = readFileSync(new URL('../scripts/parity-measure.mjs', import.meta.url), 'utf8')
const start = 'export function evaluateCheck('
assert.equal(source.split(start).length, 2)
const text = source.slice(source.indexOf(start), source.indexOf('\nexport function buildReport(')).replace(/^export /, '')
const evaluateCheck = new Function(`${text}; return evaluateCheck`)()
const check = { id: 'owned-native', kind: 'native', expected: { exitCode: 0 } }
const current = { version: 1, definitionHash: 'd', inputFingerprint: 'i', inputPaths: ['a'], runtime: { node: 'test' } }
const receipt = (status, finishedAt, path) => ({ path, measurements: [{ ...current, checkId: check.id, status, exitCode: status === 'passed' ? 0 : 1, finishedAt }] })
const pass = receipt('passed', '2026-10-07T00:00:00.000Z', 'pass.json')
for (const [label, timestamp] of [['missing', undefined], ['invalid', 'bad'], ['empty', ''], ['non-string', 123]]) {
  test(`${label} completion cannot hide behind a valid pass`, () => {
    const bad = receipt('failed', timestamp, 'bad.json')
    for (const inputs of [[pass,bad],[bad,pass]]) assert.equal(evaluateCheck(check, inputs, current).status, 'unknown')
  })
}
test('equal instant with different precision retains failure precedence', () => {
  const fail = receipt('failed', '2026-10-07T00:00:00.000Z', 'fail.json')
  const passed = receipt('passed', '2026-10-07T00:00:00Z', 'pass.json')
  assert.equal(evaluateCheck(check, [passed,fail], current).status, 'failed')
})
test('offset timestamps sort by instant rather than written local time', () => {
  const old = receipt('passed', '2026-10-07T02:00:00+02:00', 'pass.json')
  const newer = receipt('failed', '2026-10-07T00:30:00Z', 'fail.json')
  assert.equal(evaluateCheck(check, [old,newer], current).status, 'failed')
})
test('a genuinely later completed pass can recover from a dated failure', () => {
  const old = receipt('failed', '2026-10-06T23:59:00Z', 'fail.json')
  assert.equal(evaluateCheck(check, [old,pass], current).status, 'verified')
})
test('missing evidence, current pass and stale source preserve prior behavior', () => {
  assert.equal(evaluateCheck(check, [], current).status, 'unknown')
  assert.equal(evaluateCheck(check, [pass], current).status, 'verified')
  assert.equal(evaluateCheck(check, [pass], {...current,inputFingerprint:'changed'}).status, 'stale')
})
