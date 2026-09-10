import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { cpus } from 'node:os'

// 0x51c4c0 swaps adjacent records until a pass makes no changes.
const bubble = input => {
  const rows = input.slice()
  let changed
  do {
    changed = false
    for (let i = 1; i < rows.length; i++) if (rows[i].distance < rows[i - 1].distance) {
      const previous = rows[i - 1]; rows[i - 1] = rows[i]; rows[i] = previous; changed = true
    }
  } while (changed)
  return rows
}
const modern = input => input.toSorted((a,b) => a.distance - b.distance)
let seed = 12345
const cases = Array.from({length: 2048}, () => Array.from({length: 64}, (_,id) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return { id, distance: (seed >>> 16) & 2047 }
}))
for (const input of cases) assert.deepEqual(modern(input), bubble(input))
const measure = fn => { const start = performance.now(); let checksum = 0; for (const c of cases) for (const row of fn(c)) checksum += row.id; return { ms: performance.now() - start, checksum } }
for (let i = 0; i < 3; i++) { measure(bubble); measure(modern) }
const samples = []
for (let i = 0; i < 9; i++) {
  const result = {}
  for (const key of i & 1 ? ['modern','bubble'] : ['bubble','modern']) result[key] = measure(key === 'modern' ? modern : bubble)
  assert.equal(result.bubble.checksum, result.modern.checksum); samples.push(result)
}
const median = key => samples.map(s => s[key].ms).sort((a,b)=>a-b)[4]
const result = { runtime: process.version, cpu: cpus()[0].model, workload: '2048 full 64-candidate distance rankings; native adjacent-swap algorithm reconstructed in JS versus stable standard-library toSorted. Exact stable order checked. Isolated algorithm benchmark, not original binary speed or whole query/rendering performance.', samples, medianMs: { bubble: median('bubble'), modern: median('modern') } }
writeFileSync('/private/tmp/populous-combat-sort-bench.json', JSON.stringify(result,null,2)+'\n')
console.log(result)
