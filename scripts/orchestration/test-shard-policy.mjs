// Pure scheduling data/algorithm. Import only from the reviewed local validator
// closure, never from an unreviewed candidate during external receipt validation.
import assert from 'node:assert/strict'

export const SHARD_COST_PATH = 'engineering/test-shard-costs.json'
export const WEIGHTED_SHARD_ALGORITHM = 'duration-lpt-v1'
export const LEGACY_SHARD_ALGORITHM = 'sorted-round-robin-v1'
const testPath = path => typeof path === 'string' && /^tests\/[^./\0\r\n][^/\0\r\n]*\.test\.mjs$/.test(path)
const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value) &&
  JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort())
const milliseconds = value => Number.isSafeInteger(value) && value > 0 && value <= 3_600_000
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0

export function parseShardCosts(bytes) {
  assert(typeof bytes === 'string' || Buffer.isBuffer(bytes), 'Shard costs must be independently supplied JSON bytes')
  assert(Buffer.byteLength(bytes) <= 65_536, 'Shard costs exceed size limit')
  const data = JSON.parse(bytes.toString())
  assert(keys(data, ['version', 'algorithm', 'source', 'defaultMs', 'overheadMs', 'costs']) &&
    data.version === 1 && data.algorithm === WEIGHTED_SHARD_ALGORITHM, 'Invalid shard cost schema/algorithm')
  assert(keys(data.source, ['runId', 'headSha', 'mergeSha']) && typeof data.source.runId === 'string' && /^[1-9][0-9]*$/.test(data.source.runId) &&
    [data.source.headSha, data.source.mergeSha].every(value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)),
  'Invalid shard cost provenance')
  assert(milliseconds(data.defaultMs) && milliseconds(data.overheadMs), 'Shard default and overhead must be positive bounded integer milliseconds')
  assert(Array.isArray(data.costs) && data.costs.length <= 256, 'Invalid shard cost list')
  const seen = new Set()
  for (const row of data.costs) {
    assert(Array.isArray(row) && row.length === 2 && testPath(row[0]) && milliseconds(row[1]), 'Invalid shard cost entry')
    assert(!seen.has(row[0]), 'Duplicate shard cost entry')
    seen.add(row[0])
  }
  return data
}

export function partitionTestFiles(files, index, count = 4, policy = null) {
  assert(count === 4, 'Shard count must be exactly 4')
  assert(Number.isInteger(index) && index >= 0 && index < count, 'Shard index must be an integer from 0 to 3')
  assert(Array.isArray(files) && files.length >= count && files.every(testPath), 'Sharding needs at least four valid test files')
  assert(new Set(files).size === files.length, 'Duplicate discovered test file')
  const sorted = [...files].sort(compare)
  // Legacy is an explicit caller choice, not a fallback after malformed weights.
  if (policy === null) return sorted.filter((_, offset) => offset % count === index)
  policy = parseShardCosts(JSON.stringify(policy))
  const costs = new Map(policy.costs)
  const weight = file => (costs.get(file) ?? policy.defaultMs) + policy.overheadMs
  sorted.sort((a, b) => weight(b) - weight(a) || compare(a, b))
  const bins = Array.from({ length: count }, () => []), loads = Array(count).fill(0)
  for (const file of sorted) {
    let lightest = 0
    for (let i = 1; i < count; i++) if (loads[i] < loads[lightest]) lightest = i
    bins[lightest].push(file)
    loads[lightest] += weight(file)
    assert(Number.isSafeInteger(loads[lightest]), 'Shard load exceeds integer limit')
  }
  return bins[index].sort(compare)
}
