import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/timber-search.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { timberSearchCase, timberPoolCase } from '../scripts/compare-timber-search.mjs'
import { createTimberSearches, expandTimberSearch, refreshTimberSearch } from '../app/timber-search.ts'
import { createIndexedSearch, startIndexedSearch } from '../app/indexed-search.ts'

test('timber search matches native cell order, fog, protected stock and two-pass queries', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  fixture.cases.forEach((c, i) => assert.deepEqual(timberSearchCase(c), fixture.expected[i], `native timber query ${i}`))
  for (const mode of ['ordered', 'loose', 'block', 'protect', 'pick', 'availability', 'query'])
    assert.ok(fixture.cases.some(c => c.mode === mode), `${mode} covered`)
  for (const status of [0, 1, 2, 3])
    assert.ok(fixture.expected.some(e => e.result?.status === status), `query status ${status} covered`)
  assert.ok(fixture.cases.some(c => (c.block & 255) === 254), 'cell scan crosses world seam')
  assert.ok(fixture.expected.some((e, i) => e.search.candidates.length < fixture.cases[i].search.candidates.length), 'stale blocks pruned')
})

test('shared timber caches match native allocation, expansion, routing, ownership and expiry', () => {
  fixture.poolCases.forEach((c, i) => assert.deepEqual(timberPoolCase(c), fixture.poolExpected[i], `native timber lifecycle ${i}`))
  const snapshots = fixture.poolExpected.flat()
  for (const action of ['expand', 'routes', 'step', 'keep', 'query', 'invalidate', 'refresh'])
    assert.ok(fixture.poolCases.some(c => c.ops.some(op => op.action === action)), `${action} covered`)
  assert.ok(snapshots.some(s => s.result === -1), '120-slot cache exhaustion')
  assert.ok(snapshots.some(s => s.globals.candidates === 7680), 'candidate allocation limit')
  for (const budget of [1, 2, 3])
    assert.ok(snapshots.some(s => s.globals.routeBudget === budget), `adaptive route budget ${budget}`)
  assert.ok(snapshots.some(s => s.records.some(r => r.idle < 0)), 'signed idle clock wraps')
  assert.ok(snapshots.some(s => s.records.some(r => r.idle === 321 && !(r.flags & 1))), 'unused searches expire at turn 321')
  assert.ok(snapshots.some(s => s.events.length), 'route cost consumer exercised')
})

test('an exhausted indexed-search pool postpones expansion without corrupting the cache', () => {
  const pool = createTimberSearches(), indexed = createIndexedSearch(), owner = { searchIndex: -1 }
  refreshTimberSearch(pool, owner, 0, 0, { id: 1, tribe: 0 })
  for (let i = 1; i < 16; i++) assert.equal(startIndexedSearch(indexed, 2, 0, 0, 1), i)
  const before = structuredClone(pool), bytes = indexed.slice()
  expandTimberSearch(pool, {}, indexed, pool.records[0])
  assert.deepEqual(pool, before)
  assert.deepEqual(indexed, bytes)
})
