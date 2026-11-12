import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createGameplayJournal } from '../scripts/native-ui-evidence/gameplay-journal.mjs'

const fixture = work => {
  const dir = mkdtempSync(join(tmpdir(), 'gameplay-journal-'))
  try { work(join(dir, 'phases.jsonl')) } finally { rmSync(dir, { recursive: true }) }
}
test('records immediately, refuses replacement and closes idempotently', () => fixture(file => {
  const j = createGameplayJournal(file)
  try {
    j.record('setup:start', { turn: 1 })
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), { sequence: 0, stage: 'setup:start', value: { turn: 1 } })
    assert.throws(() => createGameplayJournal(file))
  } finally { j.close() }
  j.close(); assert.throws(() => j.record('late', {}))
}))
test('rejects invalid JSON without consuming failure reserve', () => fixture(file => {
  const j = createGameplayJournal(file, { maxBytes: 2048, failureReserve: 1024 })
  const cycle = {}; cycle.self = cycle
  try {
    for (const value of [undefined, NaN, Infinity, 1n, cycle, new Date(), [, 1], { get bad() { throw Error('invoked') } }])
      assert.throws(() => j.record('invalid', value))
    assert.throws(() => j.record('large', 'x'.repeat(2048)))
    j.failure(new Error('primary failure'))
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).stage, 'failure')
  } finally { j.close() }
}))

for (const [label, error] of [
  ['ASCII', 'a'.repeat(10000)],
  ['escaped controls', '\u0000'.repeat(10000)],
  ['Unicode', '😀'.repeat(10000)],
  ['throwing coercion', { toString() { throw new Error('coercion failed') } }],
]) test(`failure reserve covers ${label} after normal capacity is exhausted`, () => fixture(file => {
  const maxBytes = 2048, failureReserve = 1024
  const j = createGameplayJournal(file, { maxBytes, failureReserve })
  try {
    const overhead = Buffer.byteLength(JSON.stringify({ sequence: 0, stage: 'fill', value: '' }) + '\n')
    j.record('fill', 'x'.repeat(maxBytes - failureReserve - overhead))
    assert.equal(j.bytes, maxBytes - failureReserve)
    assert.throws(() => j.record('extra', null))
    const before = j.bytes
    j.failure(error)
    assert.ok(j.bytes - before <= failureReserve)
    assert.ok(j.bytes <= maxBytes)
    const lines = readFileSync(file, 'utf8').trimEnd().split('\n').map(JSON.parse)
    assert.equal(lines.length, 2)
    assert.equal(lines[1].stage, 'failure')
    assert.equal(lines[1].sequence, 1)
    assert.equal(typeof lines[1].value.message, 'string')
    if (label === 'throwing coercion') assert.equal(lines[1].value.message, 'Failure (message unavailable)')
  } finally { j.close() }
}))
test('minimum total budget still admits a bounded terminal receipt', () => fixture(file => {
  const j = createGameplayJournal(file, { maxBytes: 1025, failureReserve: 1024 })
  try {
    assert.throws(() => j.record('normal', null))
    j.failure('\u0000'.repeat(10000))
    assert.ok(j.bytes <= 1024)
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).stage, 'failure')
  } finally { j.close() }
}))
