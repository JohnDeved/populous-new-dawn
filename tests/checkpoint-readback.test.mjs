import assert from 'node:assert/strict'
import test from 'node:test'
import { waitForCheckpointReadback } from '../scripts/checkpoint-readback.mjs'

test('checkpoint readback awaits false reads before the actual true result', async () => {
  let reads = 0, pauses = 0, pending = false
  const result = await waitForCheckpointReadback(async () => {
    assert.equal(pending, false, 'Reads must not overlap')
    pending = true
    const value = await new Promise(resolve => setImmediate(() => resolve(++reads === 3)))
    pending = false
    return value
  }, { attempts: 5, pause: async () => { pauses++; assert.equal(pending, false) } })
  assert.equal(result, true)
  assert.equal(reads, 3)
  assert.equal(pauses, 2)
})

test('checkpoint readback fails closed after bounded asynchronous false results', async () => {
  let reads = 0, pauses = 0
  const result = await waitForCheckpointReadback(async () => { reads++; return false },
    { attempts: 3, pause: async () => { pauses++ } })
  assert.equal(result, false)
  assert.equal(reads, 3)
  assert.equal(pauses, 2)
  await assert.rejects(waitForCheckpointReadback(async () => { throw Error('IDB read failed') }), /IDB read failed/)
})
