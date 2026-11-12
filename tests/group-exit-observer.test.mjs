import test from 'node:test'
import assert from 'node:assert/strict'
import { processGroupPresent, observeGroupExit } from '../scripts/native-ui-evidence/setup-v2-proposal/group-exit-observer.mjs'
const missing = () => { const error = Error('missing'); error.code = 'ESRCH'; throw error }
function boundary(probe) {
  let clock = 0
  return { capMs: 100, intervalMs: 25, now: () => clock, pause: async ms => { clock += ms }, probe }
}
test('probe uses only negative owned group and signal zero', () => {
  let observed
  assert.equal(processGroupPresent(42, (...args) => { observed = args }), true)
  assert.deepEqual(observed, [-42, 0])
})
test('only ESRCH is evidence of absence', () => {
  assert.equal(processGroupPresent(42, missing), false)
  const denied = Object.assign(Error('permission'), { code: 'EPERM' })
  assert.throws(() => processGroupPresent(42, () => { throw denied }), error => error === denied)
})
test('invalid group IDs never invoke the probe', () => {
  for (const pgid of [0, 1, -42, 1.5, NaN, Infinity])
    assert.throws(() => processGroupPresent(pgid, () => assert.fail('unexpected probe')))
})
test('immediate absence yields affirmative bounded observation', async () => {
  const result = await observeGroupExit(42, boundary(missing))
  assert.equal(result.status, 'absent'); assert.equal(result.polls, 1); assert.equal(result.elapsedMs, 0)
})
test('present then absent is distinct from mere signal delivery', async () => {
  let calls = 0
  const result = await observeGroupExit(42, boundary(() => { if (++calls === 3) missing() }))
  assert.equal(result.status, 'absent'); assert.equal(result.elapsedMs, 50); assert.equal(result.polls, 3)
})
test('still-present group remains unverified at deadline', async () => {
  const result = await observeGroupExit(42, boundary(() => {}))
  assert.equal(result.status, 'unverified'); assert.match(result.error.message, /deadline/)
})
test('permission rejection remains unverified and preserves original error', async () => {
  const error = Object.freeze(Object.assign(Error('permission'), { code: 'EPERM' }))
  const result = await observeGroupExit(42, boundary(() => { throw error }))
  assert.equal(result.status, 'unverified'); assert.equal(result.error, error)
})
test('absence returned after observation deadline is not accepted', async () => {
  let clock = 0
  const result = await observeGroupExit(42, { ...boundary(() => { clock = 100; missing() }), now: () => clock })
  assert.equal(result.status, 'unverified'); assert.match(result.error.message, /after deadline/)
})
test('backward clock fails closed', async () => {
  let clock = 10
  const result = await observeGroupExit(42, { ...boundary(() => { clock = 9 }), now: () => clock })
  assert.equal(result.status, 'unverified'); assert.match(result.error.message, /backward/)
})
test('nonadvancing clock cannot poll indefinitely', async () => {
  const result = await observeGroupExit(42, { ...boundary(() => {}), pause: async () => {} })
  assert.equal(result.status, 'unverified'); assert.match(result.error.message, /quota/)
})
test('hung pause cannot prevent terminal receipt or restart probing', async () => {
  let resolve, polls = 0
  const pending = new Promise(done => { resolve = done })
  const result = await observeGroupExit(42, { capMs: 5, intervalMs: 1, now: () => 0,
    probe: () => { polls++ }, pause: () => pending })
  assert.equal(result.status, 'unverified'); assert.match(result.error.message, /pause exceeded deadline/)
  resolve(); await new Promise(done => setImmediate(done)); assert.equal(polls, 1)
})
