import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./coming-soon.mjs', import.meta.url), 'utf8')
const start = source.indexOf('    } catch (error) {\n      failures.push(error)')
assert.ok(start > 0)
const end = source.indexOf('\n  }\n  checks.push', start)
assert.ok(end > start)
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
const run = new AsyncFunction('page', 'context', 'pendingRequest', 'keyHeld', 'failure', 'hasFailure', `
  const failures = [], key = 'Enter', failWhileHeld = () => {}
  try { if (hasFailure) throw failure
  ${source.slice(start, end)}
`)

for (const original of [null, undefined, false, 0, '', new Error('body')]) {
  for (let mask = 0; mask < 8; mask++) {
    test(`original ${String(original)} cleanup mask ${mask}`, async () => {
      const calls = [], errors = [new Error('up'), undefined, false]
      const step = n => async () => { calls.push(n); if (mask & (1 << n)) throw errors[n] }
      let rejected = false, actual
      try { await run({ keyboard: { up: step(0) } }, { unroute: step(2) }, { abort: step(1) }, true, original, true) }
      catch (error) { rejected = true; actual = error }
      assert.equal(rejected, true)
      assert.deepEqual(calls, [0, 1, 2])
      const expected = [original, ...errors.filter((_, n) => mask & (1 << n))]
      if (expected.length === 1) assert.equal(actual, original)
      else { assert.ok(actual instanceof AggregateError); assert.deepEqual(actual.errors, expected) }
    })
  }
}
test('successful body and cleanup; absent held key/request are skipped', async () => {
  const calls = []
  await run({ keyboard: { up: () => assert.fail('no key') } }, { unroute: () => calls.push('unroute') }, null, false, null, false)
  assert.deepEqual(calls, ['unroute'])
})
test('cleanup-only falsey rejection remains fatal', async () => {
  let rejected = false, actual
  try { await run({}, { unroute: () => { throw undefined } }, null, false, null, false) }
  catch (error) { rejected = true; actual = error }
  assert.equal(rejected, true)
  assert.equal(actual, undefined)
})
