import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { recordPausePhases } from '../scripts/local-render/pause-phase-diagnostics.mjs'
import { reachPauseKeyboardFocus } from '../scripts/local-render/original-pause-checkpoint-style.mjs'

function fixture() {
  const controller = new AbortController(), receipt = {}, writes = []
  let clock = 100
  return { controller, receipt, writes, tick: ms => { clock += ms },
    run: action => recordPausePhases({ receipt, signal: controller.signal, output: '/unused', mode: 'fallback' },
      action, { now: () => clock, write: (path, data) => writes.push({ path, data }) }) }
}

test('phase evidence is present before the operation and records monotonic timing without a log', async () => {
  const f = fixture()
  const result = await f.run(async trace => {
    trace.setCase('fallback:load-1920x1080')
    return trace.wait('frame', () => {
      assert.deepEqual(f.receipt.pauseStylePhases.active, { sequence: 1,
        case: 'fallback:load-1920x1080', stage: 'frame', startedMs: 0, status: 'pending' })
      assert.equal(f.writes.length, 0)
      f.tick(12)
      return 'original result'
    })
  })
  assert.equal(result, 'original result')
  const state = f.receipt.pauseStylePhases
  assert.equal(state.status, 'completed')
  assert.equal(state.active, null)
  assert.equal(state.failure, null)
  assert.equal(state.lastSettled.elapsedMs, 12)
  assert.deepEqual(state.totals.frame, { count: 1, elapsedMs: 12 })
  assert.equal(f.writes.length, 1)
  assert.equal(f.writes[0].path, '/unused/pause-style-phases.json')
  assert.deepEqual(JSON.parse(f.writes[0].data), state)
  assert.equal(f.receipt.pauseStylePhaseWrite, 'succeeded')
})

test('abort freezes the pending phase; late fulfillment and cleanup cannot overwrite it', async () => {
  const f = fixture()
  let finish, beforeCleanup
  const run = f.run(async trace => {
    trace.setCase('fallback:load-1920x1080')
    const value = await trace.wait('focus-observation', () => new Promise(resolve => { finish = resolve }))
    beforeCleanup = f.receipt.pauseStylePhases.failure
    trace.setCase('context cleanup')
    await trace.wait('cleanup', () => {})
    return value
  })
  f.tick(90)
  f.controller.abort(new Error('Episode deadline exceeded'))
  const frozen = f.receipt.pauseStylePhases.failure
  assert.equal(frozen.kind, 'aborted')
  assert.equal(frozen.phase.stage, 'focus-observation')
  assert.equal(frozen.phase.status, 'pending')
  assert.equal(frozen.observedMs, 90)
  assert.ok(Object.isFrozen(frozen) && Object.isFrozen(frozen.phase))
  assert.throws(() => { frozen.phase.stage = 'cleanup' }, TypeError)
  finish('late value')
  assert.equal(await run, 'late value')
  assert.equal(beforeCleanup, frozen)
  assert.equal(f.receipt.pauseStylePhases.failure, frozen)
  assert.equal(f.receipt.pauseStylePhases.status, 'aborted')
  assert.equal(f.receipt.pauseStylePhases.lastSettled.stage, 'cleanup')
})

test('a rejected await keeps exact thrown identity and its first phase despite later failures', async () => {
  const f = fixture(), primary = Object.freeze({ exact: 'primary' })
  let caught
  try {
    await f.run(async trace => {
      try { await trace.wait('body-observation', () => { throw primary }) }
      finally {
        try { await trace.wait('cleanup', () => { throw new Error('secondary') }) }
        catch {}
      }
    })
  } catch (error) { caught = error }
  assert.equal(caught, primary)
  const state = f.receipt.pauseStylePhases
  assert.equal(state.failure.kind, 'rejected')
  assert.equal(state.failure.phase.stage, 'body-observation')
  assert.equal(state.failure.phase.status, 'rejected')
  assert.equal(state.status, 'failed')
  assert.equal(state.lastSettled.stage, 'cleanup')
})

test('synchronous assertion stages are released before cleanup without replacing first failure', async () => {
  for (const abortFirst of [false, true]) {
    const f = fixture(), primary = new Error('original assertion')
    let cleanup = 0
    await assert.rejects(f.run(async trace => {
      if (abortFirst) f.controller.abort()
      try { trace.begin('assertions'); throw primary }
      catch (error) { trace.fail('rejected'); throw error }
      finally { await trace.wait('cleanup', () => { cleanup++ }) }
    }), error => error === primary)
    assert.equal(cleanup, 1)
    assert.equal(f.receipt.pauseStylePhases.failure.kind, abortFirst ? 'aborted' : 'rejected')
    assert.equal(f.receipt.pauseStylePhases.lastSettled.stage, 'cleanup')
  }
})

test('first rejection remains first even when the signal later aborts', async () => {
  const f = fixture()
  await assert.rejects(f.run(async trace => {
    try { await trace.wait('screenshot', () => Promise.reject(new Error('capture failed'))) }
    finally { f.controller.abort() }
  }), /capture failed/)
  assert.equal(f.receipt.pauseStylePhases.failure.kind, 'rejected')
  assert.equal(f.receipt.pauseStylePhases.failure.phase.stage, 'screenshot')
})

test('already aborted signal records absence of an active await rather than inventing one', async () => {
  const f = fixture()
  f.controller.abort()
  await assert.rejects(f.run(() => { f.controller.signal.throwIfAborted() }), { name: 'AbortError' })
  assert.equal(f.receipt.pauseStylePhases.failure.kind, 'aborted')
  assert.equal(f.receipt.pauseStylePhases.failure.phase, null)
})

test('listener is removed after completion and later abort cannot invalidate old evidence', async () => {
  const f = fixture()
  await f.run(trace => trace.wait('frame', () => {}))
  const before = JSON.stringify(f.receipt.pauseStylePhases)
  f.controller.abort()
  assert.equal(JSON.stringify(f.receipt.pauseStylePhases), before)
})

test('bounded summaries keep no per-operation history and cap case labels', async () => {
  const f = fixture()
  await f.run(async trace => {
    trace.setCase('x'.repeat(500))
    for (let i = 0; i < 1000; i++) await trace.wait('focus-tab', () => {})
  })
  const state = f.receipt.pauseStylePhases
  assert.equal(state.case.length, 128)
  assert.equal(state.sequence, 1000)
  assert.equal(state.totals['focus-tab'].count, 1000)
  assert.equal(Object.keys(state.totals).length, 17)
  assert.ok(f.writes[0].data.length < 4096)
  assert.equal(f.writes.length, 1)
})

test('diagnostic write failure preserves every arbitrary primary throw without mutation', async () => {
  for (const primary of [null, false, 0, '', Object.freeze(new Error('frozen'))]) {
    const controller = new AbortController(), receipt = {}
    let caught = Symbol('not thrown')
    try {
      await recordPausePhases({ receipt, signal: controller.signal, output: '/unused', mode: 'native' },
        () => { throw primary }, { now: () => 0, write: () => { throw new Error('write failed') } })
    } catch (error) { caught = error }
    assert.equal(caught, primary)
    assert.equal(receipt.pauseStylePhaseWrite, 'failed')
    assert.equal(receipt.pauseStylePhases.status, 'failed')
  }
})

test('write failure after an otherwise successful action remains an error, not a false success', async () => {
  const controller = new AbortController(), receipt = {}, writeError = new Error('write failed')
  await assert.rejects(recordPausePhases({ receipt, signal: controller.signal, output: '/unused', mode: 'native' },
    () => {}, { now: () => 0, write: () => { throw writeError } }), error => error === writeError)
  assert.equal(receipt.pauseStylePhaseWrite, 'failed')
  assert.equal(receipt.pauseStylePhases.status, 'failed')
  assert.equal(receipt.pauseStylePhases.failure.kind, 'diagnostic-write')
})

test('write failure cannot replace the already-recorded deadline when work settles late', async () => {
  const controller = new AbortController(), receipt = {}
  assert.equal(await recordPausePhases({ receipt, signal: controller.signal, output: '/unused', mode: 'native' },
    () => { controller.abort(); return 7 },
    { now: () => 0, write: () => { throw new Error('write failed') } }), 7)
  assert.equal(receipt.pauseStylePhases.status, 'aborted')
  assert.equal(receipt.pauseStylePhaseWrite, 'failed')
})

test('invalid stage and overlapping stage are explicit errors, with original evidence retained', async () => {
  const f = fixture()
  await assert.rejects(f.run(trace => trace.wait('__proto__', () => {})), /Unknown pause/)
  assert.equal(f.receipt.pauseStylePhases.failure.phase, null)
  const g = fixture()
  await assert.rejects(g.run(trace => { trace.begin('frame'); trace.begin('cleanup') }), /Overlapping pause/)
  assert.equal(g.receipt.pauseStylePhases.failure.phase.stage, 'frame')
})

function focusFixture({ onObservation = () => {}, focusedAfter = 2 } = {}) {
  let presses = 0, reads = 0
  const page = { keyboard: { async press(key) { assert.equal(key, 'Tab'); presses++ } } }
  const target = {
    async evaluateAll(predicate) {
      reads++
      const node = { matches(selector) { assert.equal(selector, ':focus-visible'); return presses >= focusedAfter } }
      const observed = new Function('document', 'nodes', `return (${predicate})(nodes)`)(
        { activeElement: presses >= focusedAfter ? node : {} }, [node])
      await onObservation()
      return observed
    },
    focus() { assert.fail('No synthesized focus') },
  }
  return { page, target, presses: () => presses, reads: () => reads }
}

test('actual Tab traversal composed with diagnostics retains original observation and input sequence', async () => {
  const f = fixture(), focus = focusFixture()
  assert.equal(await f.run(trace => reachPauseKeyboardFocus(focus.page, focus.target,
    f.controller.signal, trace.wait)), 2)
  assert.equal(focus.presses(), 2)
  assert.equal(focus.reads(), 3)
  assert.equal(f.receipt.pauseStylePhases.totals['focus-observation'].count, 3)
  assert.equal(f.receipt.pauseStylePhases.totals['focus-tab'].count, 2)
})

test('actual pending focus observation composed with diagnostics cannot send a late Tab or claim focus', async () => {
  for (const focusedAfter of [0, 2]) {
    const f = fixture(), reason = new Error('original episode deadline')
    let release
    const focus = focusFixture({ focusedAfter, onObservation: () => new Promise(resolve => { release = resolve }) })
    const run = f.run(trace => reachPauseKeyboardFocus(focus.page, focus.target, f.controller.signal, trace.wait))
    f.controller.abort(reason)
    const snapshot = f.receipt.pauseStylePhases.failure
    assert.equal(snapshot.phase.stage, 'focus-observation')
    assert.equal(snapshot.phase.status, 'pending')
    release()
    await assert.rejects(run, error => error === reason)
    assert.equal(focus.presses(), 0)
    assert.equal(focus.reads(), 1)
    assert.equal(f.receipt.pauseStylePhases.failure, snapshot)
    assert.equal(f.receipt.pauseStylePhases.status, 'aborted')
  }
})

test('native UI checker registers diagnostic implementation, complete regression file and source trigger', () => {
  const { checks } = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url), 'utf8'))
  const check = checks.find(check => check.id === 'native-ui-evidence-tests')
  const helper = 'scripts/local-render/pause-phase-diagnostics.mjs', testPath = 'tests/pause-phase-diagnostics.test.mjs'
  for (const path of [helper, testPath, 'scripts/local-render/original-pause-checkpoint-style.mjs']) {
    assert.ok(check.inputs.includes(path), `${path} is a bound input`)
    assert.ok(check.triggerPaths.includes(path), `${path} triggers the checker`)
  }
  assert.equal(check.args.filter(arg => arg === testPath).length, 1)
})
