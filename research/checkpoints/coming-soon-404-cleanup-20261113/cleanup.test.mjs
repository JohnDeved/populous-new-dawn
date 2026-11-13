import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const source = readFileSync(new URL('./coming-soon.mjs', import.meta.url), 'utf8')
const a = source.indexOf('  const failMedia ='), b = source.indexOf('  const expectedFailureErrors', a)
assert.ok(a > 0 && b > a)
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
const run = new AsyncFunction('context', 'row', 'trailer', 'screenshot', 'returned', source.slice(a, b))
for (const failAt of [-1, 0, 1, 2, 3, 4]) for (const value of [undefined, false, new Error('body')]) for (const cleanupFails of [false, true]) {
  test(`body ${failAt}/${String(value)} cleanup ${cleanupFails}`, async () => {
    let handler; const calls = []; const cleanupError = new Error('cleanup')
    const step = n => async () => { calls.push(n); if (n === failAt) throw value }
    const context = {
      route: async (pattern, fn) => { handler = fn },
      unroute: async (pattern, fn) => { assert.equal(fn, handler); calls.push('cleanup'); if (cleanupFails) throw cleanupError },
    }
    let rejected = false, result
    try { await run(context, { click: step(0) }, { getByText: () => ({ waitFor: step(1) }), getByRole: () => ({ click: step(3) }) }, step(2), step(4)) }
    catch (error) { rejected = true; result = error }
    assert.deepEqual(calls, [...Array(failAt < 0 ? 5 : failAt + 1).keys(), 'cleanup'])
    const errors = [...(failAt < 0 ? [] : [value]), ...(cleanupFails ? [cleanupError] : [])]
    assert.equal(rejected, errors.length > 0)
    if (errors.length === 1) assert.equal(result, errors[0])
    if (errors.length === 2) { assert.ok(result instanceof AggregateError); assert.deepEqual(result.errors, errors) }
  })
}
