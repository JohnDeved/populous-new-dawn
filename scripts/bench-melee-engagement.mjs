// Isolate equivalent area-membership calculations, not full target selection.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import os from 'node:os'
import { inEngagementArea } from '../app/melee-engagement.ts'

const cases = Array.from({ length: 32768 }, (_, i) => {
  const source = { x: i * 1237 & 65535, y: i * 5399 & 65535 }
  return { source, target: { x: source.x + i * 59 % 7001 - 3500 & 65535, y: source.y + i * 97 % 7001 - 3500 & 65535 }, range: [1, 3, 5, 7, 11][i % 5] }
})
function enumerated(source, target, range) {
  const radius = Math.trunc(range / 2) * 2, x = source.x >> 8 & 254, y = source.y >> 8 & 254
  for (let dy = -radius; dy <= radius; dy += 2)
    for (let dx = -radius; dx <= radius; dx += 2)
      if ((x + dx & 255) === (target.x >> 8 & 254) && (y + dy & 255) === (target.y >> 8 & 254)) return true
  return false
}
const run = fn => {
  const start = performance.now(), results = cases.map(c => fn(c.source, c.target, c.range))
  return { ms: performance.now() - start, results }
}
for (let i = 0; i < 5; i++) { run(enumerated); run(inEngagementArea) }
const loops = [], bounds = []
for (let i = 0; i < 9; i++) {
  const pair = i & 1 ? [run(inEngagementArea), run(enumerated)].reverse() : [run(enumerated), run(inEngagementArea)]
  assert.deepEqual(pair[0].results, pair[1].results)
  loops.push(pair[0].ms); bounds.push(pair[1].ms)
}
const summarize = samples => ({ medianMs: samples.toSorted((a,b) => a-b)[4], samples })
const report = { cpu: os.cpus()[0].model, node: process.version, queries: cases.length, workload: 'Equivalent membership predicates: enumerate the native square cell area versus constant-time wrapped cell bounds. Nine alternating warmed samples, setup excluded. This is not original executable performance, a whole target-query comparison, a previous-release speedup or display FPS.', enumerated: summarize(loops), bounds: summarize(bounds) }
writeFileSync('/private/tmp/populous-melee-engagement-bench.json', JSON.stringify(report, null, 2) + '\n')
console.log(report)
