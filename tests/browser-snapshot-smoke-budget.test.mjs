import assert from 'node:assert/strict'
import test from 'node:test'
import { createSnapshotEpisodeBudget } from '../scripts/browser-performance/snapshot-smoke-budget.mjs'
import { snapshotSmokeBudget } from '../scripts/tutorial-browser/scenario-policy.mjs'

function harness() {
  let time = 0, id = 0, expired = 0
  const timers = new Map(), ledger = {}
  const clock = { now: () => time, schedule: (fn, ms) => { timers.set(++id, { fn, ms }); return id }, cancel: key => timers.delete(key) }
  const run = createSnapshotEpisodeBudget({ ledger, expire: async () => { expired++ }, ...clock })
  return { run, ledger, timers, clock, elapsed: ms => { time += ms }, expired: () => expired,
    fire() { const timer = timers.values().next().value; time += timer.ms; timer.fn() } }
}

test('fixed two-episode policy explicitly expands allowance and enforces count, order and aggregate accounting', async () => {
  assert.deepEqual(snapshotSmokeBudget, { version: 1, maxEpisodes: 2, episodeMs: 90000, totalBrowserMs: 180000, hostedJobMs: 360000 })
  assert.equal(Object.isFrozen(snapshotSmokeBudget), true)
  const h = harness()
  await assert.rejects(h.run('recovery', async () => {}), /fixed order/)
  assert.equal(await h.run('world', async () => { h.elapsed(89000); return 1 }), 1)
  await h.run('recovery', async () => { h.elapsed(89000) })
  assert.equal(h.ledger.totalEpisodeElapsedMs, 178000); assert.equal(h.ledger.aggregateExceeded, false)
  assert.deepEqual(h.ledger.episodes.map(e => [e.name, e.capMs, e.elapsedMs, e.status]), [
    ['world', 90000, 89000, 'passed'], ['recovery', 90000, 89000, 'passed']])
  await assert.rejects(h.run('world', async () => {}), /count exhausted/)
  assert.equal(h.timers.size, 0); assert.equal(h.expired(), 0)
})

test('overlap and repeated episode cannot create another attempt', async () => {
  const h = harness(); let finish
  const pending = h.run('world', () => new Promise(resolve => { finish = resolve }))
  await Promise.resolve()
  await assert.rejects(h.run('recovery', async () => {}), /sequential/)
  finish(); await pending
  await assert.rejects(h.run('world', async () => {}), /fixed order/)
})

test('timeout closes owner once, records precise stage and is terminal even if work resolves late', async () => {
  const h = harness(); let finish
  const pending = h.run('world', () => new Promise(resolve => { finish = resolve }))
  await Promise.resolve(); h.fire()
  await assert.rejects(pending, error => error.code === 'SNAPSHOT_EPISODE_TIMEOUT' && /world/.test(error.message))
  assert.equal(h.expired(), 1); assert.equal(h.ledger.episodes[0].status, 'timed-out')
  assert.equal(h.ledger.totalEpisodeElapsedMs, 90000); assert.equal(h.timers.size, 0)
  finish('late pass'); await Promise.resolve()
  assert.equal(h.ledger.episodes[0].status, 'timed-out')
  await assert.rejects(h.run('recovery', async () => {}), /cannot continue/)
})

test('delayed timer dispatch does not admit over-budget synchronous work', async () => {
  const h = harness()
  await assert.rejects(h.run('world', async () => { h.elapsed(90001) }), /deadline exceeded/)
  assert.equal(h.expired(), 1); assert.equal(h.ledger.episodes[0].elapsedMs, 90001)
  assert.equal(h.ledger.episodes[0].timedOut, true)
})

test('remaining aggregate allowance limits timer rather than resetting the total budget', async () => {
  const h = harness(); await h.run('world', async () => { h.elapsed(100) })
  // Defensive accounting test: even if additional accounted browser work is
  // added before the second episode, it may not receive a fresh aggregate cap.
  h.ledger.totalEpisodeElapsedMs = 179000
  await assert.rejects(h.run('recovery', async () => { assert.equal([...h.timers.values()][0].ms, 1000); h.elapsed(1001) }), /deadline exceeded/)
  assert.equal(h.ledger.totalEpisodeElapsedMs, 180001); assert.equal(h.ledger.aggregateExceeded, true)
})

test('ordinary failure preserves its error and charges elapsed time without retry', async () => {
  const h = harness(), original = Error('attribution failed')
  await assert.rejects(h.run('world', async () => { h.elapsed(23); throw original }), error => error === original)
  await h.run('recovery', async () => { h.elapsed(27) })
  assert.equal(h.ledger.totalEpisodeElapsedMs, 50)
  assert.deepEqual(h.ledger.episodes.map(e => e.status), ['failed', 'passed'])
  assert.equal(h.expired(), 0); assert.equal(h.timers.size, 0)
})

test('expiration cleanup failure cannot hide the timeout or produce a pass', async () => {
  const ledger = {}, clock = { now: () => 0, schedule: fn => { queueMicrotask(fn); return 1 }, cancel() {} }
  const run = createSnapshotEpisodeBudget({ ledger, expire: async () => { throw Error('close failed') }, ...clock })
  await assert.rejects(run('world', () => new Promise(() => {})), /deadline exceeded/)
  assert.equal(ledger.episodes[0].status, 'timed-out')
  assert.match(ledger.episodes[0].expirationCleanupFailure, /close failed/)
})
