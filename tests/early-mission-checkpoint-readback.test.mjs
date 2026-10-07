import assert from 'node:assert/strict'
import test from 'node:test'
import { waitForSavedCheckpoint } from '../scripts/local-render/early-missions.mjs'

test('early-mission save guard waits for the committed turn before returning', async () => {
  let reads = 0, pending = false, pauses = 0
  const page = {
    async evaluate(_read, expected) {
      assert.equal(expected, 707)
      assert.equal(pending, false, 'Storage reads must remain sequential')
      pending = true
      await new Promise(resolve => setImmediate(resolve))
      pending = false
      return ++reads === 3
    },
    async waitForTimeout(ms) {
      assert.equal(ms, 100)
      assert.equal(pending, false)
      pauses++
    },
  }
  await waitForSavedCheckpoint(page, 707, new AbortController().signal)
  assert.equal(reads, 3)
  assert.equal(pauses, 2)
})

test('early-mission save guard rejects uncommitted storage, read errors and cancellation', async () => {
  let reads = 0
  const page = { async evaluate() { reads++; return false }, async waitForTimeout() {} }
  const controller = new AbortController()
  await assert.rejects(waitForSavedCheckpoint(page, 707, controller.signal), /must commit/)
  assert.equal(reads, 300)
  page.evaluate = async () => { throw Error('IDB read failed') }
  await assert.rejects(waitForSavedCheckpoint(page, 707, controller.signal), /IDB read failed/)
  controller.abort(Error('Scenario cancelled'))
  await assert.rejects(waitForSavedCheckpoint(page, 707, controller.signal), /Scenario cancelled/)
})
