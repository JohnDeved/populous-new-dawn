import assert from 'node:assert/strict'
import test from 'node:test'
import { runShieldEpisode, shieldEpisodeLimitMs, shieldOuterReserveMs } from '../scripts/tutorial-browser/shield-budget.mjs'

const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }
function clock() {
  let time = 0, serial = 0
  const timers = new Map()
  return { now: () => time, wallNow: () => 100000,
    schedule(fn, ms) { const id = ++serial; timers.set(id, { fn, at: time + ms }); return id },
    cancel: id => timers.delete(id),
    advance(ms) {
      time += ms
      for (const [id, timer] of timers) if (timer.at <= time) { timers.delete(id); timer.fn() }
    } }
}
function options(extra = {}) {
  const timer = clock(), reports = [], report = { errors: [] }
  let created = 0, closed = 0
  const context = { close: async () => { closed++ } }
  return { timer, reports, report, context, counts: () => ({ created, closed }),
    args: { ...timer, browser: { newContext: async () => { created++; return context } },
      deadlineAt: 155000, report, save: () => reports.push(structuredClone(report)), perform: async () => {}, ...extra } }
}

test('Shield admission requires all 45 seconds plus outer reserve before any context', async () => {
  assert.equal(shieldEpisodeLimitMs, 45000); assert.equal(shieldOuterReserveMs, 10000)
  for (const deadlineAt of [154999, NaN, Infinity]) {
    const f = options({ deadlineAt })
    await assert.rejects(runShieldEpisode(f.args), /55,000/)
    assert.deepEqual(f.counts(), { created: 0, closed: 0 })
    assert.equal(f.report.status, 'failed')
    assert.equal(f.report.admission, 'failed')
    assert.equal(f.report.cleanup.notCreated, true)
    assert.ok(f.reports.length > 0, 'Explicit failed admission receipt, never skip/pass')
  }
})

test('one monotonic Shield deadline includes normal operation and final closure', async () => {
  const f = options()
  f.args.perform = async ({ step }) => step('work', async () => f.timer.advance(300))
  f.context.close = async () => f.timer.advance(200)
  const result = await runShieldEpisode(f.args)
  assert.equal(result.status, 'passed')
  assert.equal(result.budget.elapsedMs, 500)
  assert.equal(result.cleanup.closedElapsedMs, 500)
  assert.equal(result.cleanup.closedWithinBudget, true)
  assert.equal(result.budget.deadlineMonotonicMs, 45000)
})

test('hanging creation fails on time and a late-created context is closed exactly once', async () => {
  const f = options(), creation = deferred()
  f.args.browser.newContext = () => creation.promise
  const promise = runShieldEpisode(f.args)
  await flush()
  f.timer.advance(45000)
  await assert.rejects(promise, /failed/)
  assert.equal(f.report.status, 'failed')
  assert.equal(f.report.cleanup.contextCreated, false)
  creation.resolve(f.context)
  await flush()
  assert.equal(f.report.cleanup.lateCreation, true)
  assert.equal(f.report.cleanup.contextClosed, true)
  assert.equal(f.counts().closed, 1)
  assert.equal(f.report.status, 'failed', 'Late cleanup cannot upgrade the result')
})

test('hanging operation is interrupted by the same deadline and releases its context', async () => {
  const f = options(), operation = deferred()
  f.args.perform = () => operation.promise
  const promise = runShieldEpisode(f.args)
  await flush()
  f.timer.advance(45000)
  await assert.rejects(promise, /failed/)
  await flush()
  assert.equal(f.counts().closed, 1)
  assert.equal(f.report.timedOut, true)
  operation.resolve()
  await flush()
  assert.equal(f.report.status, 'failed')
})

test('hanging cleanup counts against 45 seconds and retains late closure as failed', async () => {
  const f = options(), closure = deferred()
  f.context.close = () => closure.promise
  const promise = runShieldEpisode(f.args)
  await flush()
  assert.equal(f.report.cleanup.closeRequested, true)
  f.timer.advance(45001)
  await assert.rejects(promise, /failed/)
  assert.equal(f.report.cleanup.contextClosed, false)
  closure.resolve()
  await flush()
  assert.equal(f.report.cleanup.contextClosed, true)
  assert.equal(f.report.cleanup.closedWithinBudget, false)
  assert.equal(f.report.status, 'failed')
})

test('explicit cleanup rejection and browser errors cannot pass', async () => {
  const f = options()
  f.context.close = async () => { throw Error('close rejected') }
  await assert.rejects(runShieldEpisode(f.args), /failed/)
  assert.match(f.report.cleanup.error, /close rejected/)
  const errors = options()
  errors.args.perform = async () => { errors.report.errors.push('GPU failure') }
  await assert.rejects(runShieldEpisode(errors.args), /failed/)
  assert.equal(errors.report.cleanup.contextClosed, true)
})

test('delayed event-loop delivery cannot hide over-budget cleanup or final receipt retention', async () => {
  for (const retention of ['cleanup', 'final']) {
    const f = options()
    let time = 0, delayed = false
    f.args.now = () => time
    f.args.schedule = () => 1 // Event loop remains busy; timeout callback is not delivered.
    f.args.cancel = () => {}
    f.args.save = () => {
      const target = retention === 'cleanup' ? f.report.cleanup.contextClosed : f.report.status === 'passed'
      if (target && !delayed) { delayed = true; time = 45001 }
      f.reports.push(structuredClone(f.report))
    }
    await assert.rejects(runShieldEpisode(f.args), /failed/)
    assert.equal(f.report.status, 'failed')
    assert.equal(f.reports.at(-1).status, 'failed')
    assert.ok(f.report.budget.elapsedMs >= 45001)
  }
})
