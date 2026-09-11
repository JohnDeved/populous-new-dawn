// Cache-only workload: 200 workers share 20 entrances. Candidate route costs are
// supplied; this measures neither the path solver nor browser frame performance.
import assert from 'node:assert/strict'
import os from 'node:os'
import { writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { createIndexedSearch } from '../app/indexed-search.ts'
import { createTimberSearches, refreshTimberSearch, findTimber, stepTimberSearches } from '../app/timber-search.ts'

const pool = createTimberSearches(), indexed = createIndexedSearch()
const cells = new Map(), flags = new Uint32Array(16384), buildingIds = new Uint16Array(16384)
for (let y = 0; y < 128; y += 4)
  for (let x = 0; x < 128; x += 4) {
    const id = y * 128 + x + 1
    cells.set(id - 1, [{ id, class: 5, model: 6, flags4: 0, wood: 200 }])
  }
const w = { landFlags: 8, levelFlags: 0, playerTribe: 0, land: { flags, buildingIds }, objects: cell => cells.get(cell) ?? [], building: () => undefined }
const workers = Array.from({ length: 200 }, (_, i) => {
  const entrance = i % 20, center = (entrance % 5 * 48) | (Math.floor(entrance / 5) * 56 << 8), owner = { searchIndex: -1 }
  refreshTimberSearch(pool, owner, center, entrance * 512, { id: i + 1, tribe: 0 })
  return { ...owner, id: i + 1 }
})
assert.equal(pool.active, 20)
let checks = 0, found = 0
const route = (_, candidate) => { checks++; return { result: 0, cost: candidate.cost } }
const samples = []
for (let turn = 0; turn < 1200; turn++) {
  const start = performance.now(), before = checks
  stepTimberSearches(pool, w, indexed, route, () => true)
  for (const person of workers) {
    const result = findTimber(pool, w, person.searchIndex, person.id, false, false)
    if (result.status === 0) found++
  }
  const elapsed = performance.now() - start
  assert.ok(checks - before <= 3, 'native route budget remains bounded')
  if (turn >= 200) samples.push(elapsed)
}
assert.equal(pool.active, 20)
assert.equal(pool.expanding, 0)
assert.ok(found > 200_000)
assert.ok(pool.candidates > 0 && pool.candidates <= 7680)
samples.sort((a, b) => a - b)
const report = {
  date: new Date().toISOString(), node: process.version, cpu: os.cpus()[0].model,
  scope: 'Timber cache only; route costs supplied, no path solver or renderer; 200 warmup and 1000 measured simulation turns.',
  workers: workers.length, entrances: pool.active, candidates: pool.candidates,
  queries: 1200 * workers.length, found, routeChecks: checks,
  millisecondsPerTurn: { median: samples[500], p95: samples[950], max: samples.at(-1) },
}
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
