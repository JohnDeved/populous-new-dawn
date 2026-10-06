import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../', import.meta.url))
const observed = JSON.parse(execFileSync(process.execPath, [
  '--max-old-space-size=256', 'scripts/mission3-raid-allocation-pair.mjs',
  'tests/fixtures/mission3-raid-allocation.json',
], { cwd: root, encoding: 'utf8', timeout: 20000 }))

// Reviewed original observations, not expected values produced by the adapter.
// These fixtures isolate allocation and supplied population reads. The separate
// early-mission-ai test remains the unchanged ordinary gameplay/checkpoint gate.
const original = [2, 3].flatMap(attempt => {
  const path = new URL(
    `../references/verification/mission3-raid-allocation-2026-10-06/attempt${attempt}/stdout.log`,
    import.meta.url,
  )
  return JSON.parse(readFileSync(path, 'utf8')).cases.map(c => c.native)
})
assert.equal(original.length, 5)
assert.equal(observed.length, original.length)

for (const expected of original) {
  test(`Mission3 authored raid allocation matches original: ${expected.name}`, () => {
    const actual = observed.find(result => result.name === expected.name)
    assert.ok(actual)
    assert.equal(actual.occupiedUnchanged, true)
    assert.deepEqual(Object.fromEntries(Object.keys(expected).map(key => [key, actual[key]])), expected)
  })
}
