import assert from 'node:assert/strict'
import test from 'node:test'
import { awaitSpySourceReadiness } from '../scripts/tutorial-browser/spy-source-readiness.mjs'

// Isolated file, no browser or app imports. Advancing wall time without firing
// callbacks also models a busy event loop delivering an overdue promise first.
function fakeClock(t) {
  const original = { now: Date.now, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout },
    timers = new Map()
  let now = 1000, serial = 0
  Date.now = () => now
  globalThis.setTimeout = (run, delay) => {
    const id = ++serial
    timers.set(id, { at: now + delay, run })
    return id
  }
  globalThis.clearTimeout = id => timers.delete(id)
  t.after(() => {
    Date.now = original.now
    globalThis.setTimeout = original.setTimeout
    globalThis.clearTimeout = original.clearTimeout
  })
  return {
    timers,
    advance(ms, fire = true) {
      now += ms
      if (fire)
        for (const [id, timer] of timers)
          if (timer.at <= now) { timers.delete(id); timer.run() }
    },
  }
}

const flush = async () => { for (let n = 0; n < 60; n++) await Promise.resolve() }
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function harness(operation = (_name, value) => Promise.resolve(value)) {
  const report = {}, calls = [], snapshot = { action: 'ready', inputMask: 0 },
    counters = { evaluate: 0, wait: 0 },
    call = (name, value) => { calls.push(name); return operation(name, value) },
    handle = index => ({
      jsonValue: () => call(`json${index}`, snapshot),
      dispose: () => call(`dispose${index}`, undefined),
    }),
    page = {
      evaluate: () => call(`evaluate${++counters.evaluate}`, snapshot),
      waitForFunction: (_fn, _mode, options) => {
        assert.ok(options.timeout > 0 && options.timeout <= 8000)
        const index = ++counters.wait
        return call(`wait${index}`, handle(index))
      },
      getByRole: () => assert.fail('No public Skip in a ready-state deadline diagnostic'),
    }
  let outcome
  const run = awaitSpySourceReadiness({
    page, report, action: () => assert.fail('No action for an already-ready world'),
    save: () => calls.push('save'), deadlineAt: Date.now() + 45000,
  }).then(
    () => { outcome = { status: 'passed' } },
    error => { outcome = { status: 'failed', error } }
  )
  return { report, calls, run, handle, outcome: () => outcome }
}

for (const stage of ['evaluate1', 'wait1', 'json1', 'dispose1'])
  for (const late of ['unresolved', 'resolve', 'reject'])
    test(`one Spy deadline bounds pending ${stage}; late outcome ${late} cannot continue`, async t => {
      const clock = fakeClock(t), pending = deferred()
      let delayedValue
      const h = harness((name, value) => {
        if (name !== stage) return Promise.resolve(value)
        delayedValue = value
        return pending.promise
      })
      await flush()
      assert.ok(h.calls.includes(stage))
      assert.equal(h.outcome(), undefined)
      clock.advance(8000)
      await flush()
      assert.equal(h.outcome()?.status, 'failed')
      assert.match(h.outcome().error.message, /original 8000ms budget/)
      assert.equal(h.report.readiness.endedAt - h.report.readiness.startedAt, 8000)
      assert.equal(h.report.readiness.after, undefined)
      assert.equal(h.calls.includes('evaluate2'), false, 'never start diagnostics after expiry')
      assert.equal(h.calls.includes('wait2'), false)
      assert.equal(clock.timers.size, 0)
      const finished = structuredClone(h.report), outcome = h.outcome()
      clock.advance(20000)
      if (late === 'resolve') pending.resolve(delayedValue)
      if (late === 'reject') pending.reject(Error('late operation failure'))
      await flush()
      assert.equal(h.outcome(), outcome, 'late promises cannot replace the terminal failure')
      assert.deepEqual(h.report, finished, 'late completion cannot publish orphan success')
      assert.equal(h.calls.includes('wait2'), false)
      if (stage === 'wait1' && late === 'resolve') {
        assert.equal(h.calls.includes('json1'), false, 'late handle is never consumed')
        assert.equal(h.calls.filter(name => name === 'dispose1').length, 1)
      }
      if (stage === 'json1' || stage === 'dispose1')
        assert.equal(h.calls.filter(name => name === 'dispose1').length, 1,
          'acquired handles are released once without waiting past the deadline')
      await h.run
    })

for (const stage of ['evaluate1', 'json2', 'dispose2'])
  for (const elapsed of [7999, 8000, 9000])
    test(`Spy ${stage} completion at ${elapsed}ms respects the exact deadline without timer delivery`, async t => {
      const clock = fakeClock(t), pending = deferred()
      let delayedValue
      const h = harness((name, value) => {
        if (name !== stage) return Promise.resolve(value)
        delayedValue = value
        return pending.promise
      })
      await flush()
      assert.ok(h.calls.includes(stage))
      clock.advance(elapsed, false)
      pending.resolve(delayedValue)
      await flush()
      assert.equal(h.outcome()?.status, elapsed < 8000 ? 'passed' : 'failed')
      if (elapsed >= 8000) {
        assert.match(h.outcome().error.message, /original 8000ms budget/)
        assert.equal(h.report.readiness.after, undefined)
        assert.equal(h.calls.includes('evaluate2'), false)
      } else assert.equal(h.report.readiness.after.action, 'ready')
      assert.equal(clock.timers.size, 0)
      await h.run
    })

test('Spy diagnostics share the original deadline and preserve the initial wait error', async t => {
  const clock = fakeClock(t), diagnostic = deferred(), original = Error('original wait failure')
  const h = harness((name, value) => {
    if (name === 'wait1') return Promise.reject(original)
    if (name === 'evaluate2') return diagnostic.promise
    return Promise.resolve(value)
  })
  await flush()
  assert.equal(h.outcome(), undefined)
  assert.ok(h.calls.includes('evaluate2'))
  clock.advance(8000)
  await flush()
  assert.equal(h.outcome().error, original)
  assert.match(h.report.readiness.diagnosticFailure, /original 8000ms budget/)
  assert.equal(h.report.readiness.endedAt - h.report.readiness.startedAt, 8000)
  const finished = structuredClone(h.report)
  clock.advance(20000)
  diagnostic.reject(Error('late diagnostic rejection'))
  await flush()
  assert.deepEqual(h.report, finished)
  assert.equal(clock.timers.size, 0)
  await h.run
})

test('Spy jsonValue failure survives both disposal and diagnostic failures', async t => {
  fakeClock(t)
  const original = Error('original value failure')
  const h = harness((name, value) => {
    if (name === 'json1') return Promise.reject(original)
    if (name === 'dispose1') return Promise.reject(Error('disposal failure'))
    if (name === 'evaluate2') return Promise.reject(Error('diagnostic failure'))
    return Promise.resolve(value)
  })
  await h.run
  assert.equal(h.outcome().error, original)
  assert.match(h.report.readiness.disposalFailure, /disposal failure/)
  assert.match(h.report.readiness.diagnosticFailure, /diagnostic failure/)
})

test('Spy operation budgets are cumulative rather than reset per await', async t => {
  const clock = fakeClock(t)
  const h = harness((name, value) => {
    if (name === 'evaluate1' || name === 'json1') clock.advance(3000, false)
    if (name === 'dispose2') clock.advance(2000, false)
    return Promise.resolve(value)
  })
  await h.run
  assert.equal(h.outcome().status, 'failed')
  assert.match(h.outcome().error.message, /original 8000ms budget/)
  assert.equal(h.report.readiness.after, undefined)
  assert.equal(h.report.readiness.endedAt - h.report.readiness.startedAt, 8000)
})
