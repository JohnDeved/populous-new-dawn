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
