import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parseShardCosts, partitionTestFiles, WEIGHTED_SHARD_ALGORITHM } from '../scripts/orchestration/test-shard-policy.mjs'

const policy = () => ({ version: 1, algorithm: WEIGHTED_SHARD_ALGORITHM,
  source: { runId: '39362546368', headSha: 'a'.repeat(40), mergeSha: 'b'.repeat(40) },
  defaultMs: 1000, overheadMs: 400, costs: [] })
const files = Array.from({ length: 20 }, (_, i) => `tests/${String(i).padStart(2, '0')}.test.mjs`)
const partitions = (inventory, costs) => [0, 1, 2, 3].map(i => partitionTestFiles(inventory, i, 4, costs))

test('tracked scheduling manifest is small, explicit, bounded data', () => {
  const bytes = readFileSync(new URL('../engineering/test-shard-costs.json', import.meta.url))
  const parsed = parseShardCosts(bytes)
  assert.equal(parsed.algorithm, WEIGHTED_SHARD_ALGORITHM)
  assert(parsed.costs.length <= 256)
  assert(bytes.length < 65536)
})

test('weighted ties have stable path order then shard index, independent of input and cost order', () => {
  const p = policy()
  assert.deepEqual(partitions(files, p), partitions([...files].reverse(), p))
  assert.deepEqual(partitions(files, p), partitions(files, null))
  p.costs = [[files[0], 10000], [files[4], 10000], [files[8], 10000]]
  const expected = partitions(files, p)
  assert.deepEqual(expected, partitions([...files].reverse(), { ...p, costs: [...p.costs].reverse() }))
  assert.equal(expected[0][0], files[0])
  assert.equal(expected[1][0], files[4])
  assert.equal(expected[2][0], files[8])
  assert.deepEqual(expected.flat().sort(), files)
  for (const bin of expected) assert.deepEqual(bin, [...bin].sort())
})

test('new, renamed and removed files retain exact once-only coverage without changing policy', () => {
  const p = policy()
  p.costs = [[files[0], 30000], ['tests/removed.test.mjs', 60000]]
  const inventory = [...files.slice(1), 'tests/new.test.mjs', 'tests/renamed.test.mjs']
  const bins = partitions(inventory, p)
  assert.deepEqual(bins.flat().sort(), [...inventory].sort())
  assert.equal(new Set(bins.flat()).size, inventory.length)
  assert(bins.every(bin => bin.length > 0))
  assert.deepEqual(partitions(inventory, { ...p, costs: [] }), bins)
})

test('longest-first balancing reduces a deliberately skewed modeled critical path', () => {
  const p = policy()
  p.costs = [[files[0], 20000], [files[4], 19000], [files[8], 18000], [files[12], 17000]]
  const costs = new Map(p.costs)
  const load = bin => bin.reduce((sum, file) => sum + (costs.get(file) ?? p.defaultMs) + p.overheadMs, 0)
  const weighted = partitions(files, p), legacy = partitions(files, null)
  assert(Math.max(...weighted.map(load)) < Math.max(...legacy.map(load)))
  assert.equal(weighted.reduce((sum, bin) => sum + load(bin), 0), legacy.reduce((sum, bin) => sum + load(bin), 0))
})

test('positive fallback and overhead contribute to allocation, not only reported estimates', () => {
  const p = policy()
  p.costs = [[files[0], 3000]]
  const withoutSmallOverhead = partitions(files.slice(0, 8), { ...p, overheadMs: 1 })
  const largerOverhead = partitions(files.slice(0, 8), { ...p, overheadMs: 3000 })
  assert.notDeepEqual(withoutSmallOverhead, largerOverhead)
})

test('malformed policy never silently falls back to alphabetical sharding', () => {
  for (const mutate of [
    p => { p.version = 2 }, p => { p.algorithm = 'sorted-round-robin-v1' },
    p => { p.extra = true }, p => { delete p.costs },
    p => { p.source.extra = true }, p => { p.source.runId = 123 },
    p => { p.source.runId = '0' }, p => { p.source.headSha = 'HEAD' },
    p => { p.source.mergeSha = null },
    ...[0, -1, 1.5, null, '1000', Infinity, NaN, 3_600_001].flatMap(value => [
      p => { p.defaultMs = value }, p => { p.overheadMs = value }, p => { p.costs = [[files[0], value]] },
    ]),
    p => { p.costs = {} }, p => { p.costs = [[files[0]]] },
    p => { p.costs = [[files[0], 1, 2]] }, p => { p.costs = [[files[0], 1], [files[0], 2]] },
    p => { p.costs = [['tests/../escape.test.mjs', 1]] },
    p => { p.costs = [['tests/.hidden.test.mjs', 1]] },
    p => { p.costs = Array.from({ length: 257 }, (_, i) => [`tests/${i}.test.mjs`, 1]) },
  ]) {
    const p = policy(); mutate(p)
    assert.throws(() => parseShardCosts(JSON.stringify(p)))
    assert.throws(() => partitionTestFiles(files, 0, 4, p))
  }
  for (const value of [undefined, {}, 'null', '[]', '{', ' '.repeat(65537)])
    assert.throws(() => parseShardCosts(value))
})

test('invalid inventory and shard options fail rather than change coverage', () => {
  for (const inventory of [files.slice(0, 3), [...files, files[0]], [...files, 'tests/../bad.test.mjs']])
    assert.throws(() => partitionTestFiles(inventory, 0, 4, policy()))
  for (const index of [-1, 4, 0.5, '0', NaN]) assert.throws(() => partitionTestFiles(files, index, 4, policy()))
  for (const count of [1, 2, 3, 5, '4']) assert.throws(() => partitionTestFiles(files, 0, count, policy()))
})
