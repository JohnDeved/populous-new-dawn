import test from 'node:test'
import assert from 'node:assert/strict'
import { createDeadline } from '../scripts/owned-swamp-evidence/deadline.mjs'

for (const phase of ['newContext', 'evaluate', 'context close']) {
  test(`a stalled ${phase} operation rejects without needing its settlement`, async () => {
    const d = createDeadline(Date.now() + 20)
    try { await assert.rejects(d.run(() => new Promise(() => {})), { code: 'OWNED_SWAMP_DEADLINE' }) }
    finally { d.dispose() }
  })
}
test('expired absolute deadline does not initiate another operation', async () => {
  const d = createDeadline(Date.now() - 1)
  let calls = 0
  try {
    await assert.rejects(d.run(() => { calls++ }), { code: 'OWNED_SWAMP_DEADLINE' })
    assert.equal(calls, 0)
  } finally { d.dispose() }
})
test('early rejection remains an error, not a successful timeout fallback', async () => {
  const d = createDeadline(Date.now() + 1000), failure = Error('browser rejected')
  try { await assert.rejects(d.run(() => Promise.reject(failure)), error => error === failure) }
  finally { d.dispose() }
})
test('late fulfillment cannot make a timed-out owner resume', async () => {
  const d = createDeadline(Date.now() + 20)
  let resolve, resumed = false
  const operation = d.run(() => new Promise(done => { resolve = done })).then(() => { resumed = true })
  try {
    await assert.rejects(operation, { code: 'OWNED_SWAMP_DEADLINE' })
    resolve('late')
    await Promise.resolve()
    assert.equal(resumed, false)
    await assert.rejects(d.run(() => assert.fail('must not start')), { code: 'OWNED_SWAMP_DEADLINE' })
  } finally { d.dispose() }
})
