import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { retainMission10FailureScreenshot } from '../scripts/local-render/mission10-boat-checkpoint.mjs'

const args = (page, deadlineAt = Date.now() + 5000, signal = new AbortController().signal) =>
  ({ page, output: '/tmp/m10-owned-fixture', deadlineAt, signal })

test('M10 failure capture uses the retained filename and only the remaining original budget', async t => {
  t.mock.method(Date, 'now', () => 1000)
  for (const [deadlineAt, timeout] of [[1500, 500], [6000, 1000]]) {
    const result = await retainMission10FailureScreenshot(args({ screenshot: async options => {
      assert.equal(options.path, '/tmp/m10-owned-fixture/failure.png')
      assert.equal(options.timeout, timeout)
    } }, deadlineAt))
    assert.deepEqual(result, { status: 'captured', file: 'failure.png' })
  }
})

test('M10 capture does not start with an expired, absent, or aborted episode budget', async t => {
  t.mock.method(Date, 'now', () => 1000)
  const page = { screenshot: () => assert.fail('No diagnostic input after expiry') }, aborted = new AbortController()
  aborted.abort()
  for (const options of [args(page, 1000), args(page, null), args(page, 6000, aborted.signal)])
    assert.equal((await retainMission10FailureScreenshot(options)).status, 'not-attempted')
})

test('M10 screenshot rejection is diagnostic data, not a replacement exception', async () => {
  const result = await retainMission10FailureScreenshot(args({ screenshot: async () => { throw Error('Closed page') } }))
  assert.deepEqual(result, { status: 'failed', error: 'Error: Closed page' })
  const source = readFileSync(new URL('../scripts/local-render/mission10-boat-checkpoint.mjs', import.meta.url), 'utf8')
  assert.match(source, /catch \(error\) \{\s*report.status='failed'; report.error=String\(error\); save\(\)\s*report.failureScreenshot = await retainMission10FailureScreenshot\([\s\S]*?save\(\); throw error/)
})

for (const finish of ['deadline', 'abort']) test(`M10 stalled screenshot stops at ${finish} and consumes late rejection`, async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const controller = new AbortController()
  let reject, calls = 0
  const run = retainMission10FailureScreenshot(args({ screenshot: () => {
    calls++; return new Promise((_, fail) => { reject = fail })
  } }, Date.now() + 5000, controller.signal))
  if (finish === 'deadline') t.mock.timers.tick(1000)
  else controller.abort()
  assert.equal((await run).status, 'failed')
  reject(Error('Late transport failure'))
  await Promise.resolve()
  assert.equal(calls, 1)
})

test('late successful capture cannot turn an expired original deadline into evidence', async t => {
  let now = 1000
  t.mock.method(Date, 'now', () => now)
  const result = await retainMission10FailureScreenshot(args({ screenshot: async () => { now = 1500 } }, 1500))
  assert.equal(result.status, 'failed')
  assert.match(result.reason, /after the episode deadline/)
})
