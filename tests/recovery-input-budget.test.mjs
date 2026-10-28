import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import vm from 'node:vm'
import { writePauseInputBudgets } from '../scripts/local-render/original-pause-checkpoint-style.mjs'
import { skipPauseIntroduction, recoveryInputContract, recoveryRetryInputContract, pauseStartupReady, recoverVisibleIntroduction, recoveryStateFromSpaceSnapshot } from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'
import { campaignPopupSnapshot } from '../scripts/browser-world-input.mjs'
import { beginSpaceOwnership, endSpaceOwnership, endSpaceOwnershipSnapshot } from '../scripts/browser-space-ownership.mjs'

function fixture(t, { setupMs = 60, readMs = 0, keyMs = 0, installMs = 0, finalizeMs = 0, rejectCount = 0, reject = false, natural = false, deliveryError, pauseRace = false, snapshotChange } = {}) {
  let now = 0, open = true, presses = 0, reads = 0, records = []
  const calls = [], state = { action: 'skip', paused: false, inputMask: 64, flybyFlags: 17 }
  t.mock.method(performance, 'now', () => now)
  t.mock.method(Date, 'now', () => now)
  const page = {
    evaluate: async (fn, id) => {
      if (fn === campaignPopupSnapshot) return [{ serial: '0', open }]
      if (fn === beginSpaceOwnership) { now += installMs; calls.push('install-witness'); return }
      if (fn === endSpaceOwnership) { calls.push('cleanup-witness'); return records }
      if (fn === endSpaceOwnershipSnapshot) {
        now += finalizeMs; calls.push('cleanup-witness-and-native')
        const snapshot = { observationId: id, witnessPresent: true, records,
          state: { paused: state.paused, inputMask: state.inputMask, flybyFlags: state.flybyFlags } }
        snapshotChange?.(snapshot)
        return snapshot
      }
      assert.equal(fn, pauseStartupReady)
      reads++; now += readMs; calls.push('read-native')
      return { ...state }
    },
    locator(selector) {
      if (selector === '.world-viewport') return { focus: async () => calls.push('focus') }
      assert.equal(selector, '.campaign-messages details[data-message-serial="0"]')
      return { locator(child) {
        if (child === 'summary') return { click: async () => {
          calls.push('summary-click'); now += setupMs; open = false
          if (natural) Object.assign(state, { action: 'ready', inputMask: 0, flybyFlags: 16 })
        } }
        assert.equal(child, '[data-native-campaign-panel]')
        return { waitFor: async ({ state: wanted }) => { calls.push('hidden-body'); assert.equal(wanted, 'hidden'); assert.equal(open, false) } }
      } }
    },
    keyboard: { press: async key => {
      assert.equal(key, 'Space'); presses++; calls.push('Space'); now += keyMs
      if (reject || presses <= rejectCount) {
        open = true
        records = [{ trusted: true, repeat: false, prevented: true, sameWorld: true,
          owners: ['0'], before: { ...state }, after: { ...state } }]
      } else Object.assign(state, { action: 'ready', inputMask: 0, flybyFlags: 16 })
      if (pauseRace) state.paused = true
      if (deliveryError) throw deliveryError
    } },
  }
  return { page, state, calls, advance: ms => { now += ms }, get now() { return now }, get presses() { return presses }, get reads() { return reads } }
}

const migrated = (trace, extra = {}) => ({ setupTimeout: 100, timeout: 20, deadlineAt: 1000, trace, ...extra })

test('opt-in separates initial public preparation from response without adding allowance', async t => {
  const f = fixture(t), trace = {}
  await skipPauseIntroduction(f.page, migrated(trace))
  assert.equal(f.presses, 1)
  assert.equal(trace.setupFinishedMs, 60)
  assert.equal(trace.responseStartedMs, 60)
  assert.equal(trace.responseDeadlineMs, 80)
  assert.equal(trace.actionCapMs, 100)
  assert.equal(trace.elapsedMs, 60)
  assert.deepEqual(f.calls, ['summary-click', 'hidden-body', 'focus', 'read-native', 'install-witness', 'Space', 'cleanup-witness-and-native'])
})

test('unconverted default retains its original shared preparation/response timeout', async t => {
  const f = fixture(t)
  await assert.rejects(skipPauseIntroduction(f.page, { timeout: 20 }), /timed out/)
  assert.equal(f.presses, 0)
})

test('setup expiry cannot enter the response phase or dispatch Space', async t => {
  const f = fixture(t, { setupMs: 101 }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, migrated(trace)), /timed out/)
  assert.equal(f.presses, 0)
  assert.equal(trace.responseStartedMs, undefined)
})

test('response deadline starts before fresh observation and cannot be spent on late Space', async t => {
  const f = fixture(t, { readMs: 21 }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, migrated(trace)), /Recovery introduction input timed out/)
  assert.equal(f.presses, 0)
  assert.equal(trace.responseStartedMs, 60)
  assert.equal(trace.responseDeadlineMs, 80)
})

test('response is clipped to the existing action allowance instead of setup plus response', async t => {
  const f = fixture(t, { setupMs: 95, readMs: 6 }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, migrated(trace)), /timed out/)
  assert.equal(trace.responseDeadlineMs, 100)
  assert.equal(f.presses, 0)
})

test('the original outer deadline clips setup and response', async t => {
  const f = fixture(t, { setupMs: 60 }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, migrated(trace, { deadlineAt: 50 })), /timed out/)
  assert.equal(trace.actionCapMs, 50)
  assert.equal(f.presses, 0)
})

test('positively witnessed popup retries never reset response or action deadlines', async t => {
  const f = fixture(t, { setupMs: 5, keyMs: 6, reject: true }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, migrated(trace)), /timed out/)
  assert.equal(trace.responseStartedMs, 5)
  assert.equal(trace.responseDeadlineMs, 25)
  assert.equal(f.presses, 2)
  assert.equal(f.now, 27)
  assert.equal(f.state.paused, false)
})

test('native completion after setup sends no Space and preserves pause', async t => {
  const f = fixture(t, { natural: true }), trace = {}
  await skipPauseIntroduction(f.page, migrated(trace))
  assert.equal(f.presses, 0)
  assert.equal(f.state.paused, false)
})

test('actual accepted Space may not change pause even under migrated setup', async t => {
  const f = fixture(t, { pauseRace: true })
  await assert.rejects(skipPauseIntroduction(f.page, migrated({})), /Space changed pause state/)
  assert.equal(f.presses, 1, 'No compensating input is allowed')
})

test('original delivery error remains primary unless native completion is independently verified', async t => {
  const original = Error('actual keyboard delivery failure')
  const f = fixture(t, { deliveryError: original, reject: true })
  await assert.rejects(skipPauseIntroduction(f.page, migrated({})), error => error === original)
  assert.equal(f.presses, 1)
})

for (const phase of ['setup', 'response', 'witness']) test(`outer abort during ${phase} prevents late input after pending read settles`, async t => {
  const f = fixture(t), controller = new AbortController(), original = Error('outer episode aborted')
  let release, pendingRead
  const pending = new Promise(resolve => { release = resolve }), evaluate = f.page.evaluate
  f.page.evaluate = async fn => {
    if ((phase === 'setup' && fn === campaignPopupSnapshot) || (phase === 'response' && fn === pauseStartupReady) || (phase === 'witness' && fn === beginSpaceOwnership)) {
      pendingRead = true
      return pending
    }
    return evaluate(fn)
  }
  const run = skipPauseIntroduction(f.page, migrated({}, { signal: controller.signal }))
  for (let i = 0; i < 50 && !pendingRead; i++) await Promise.resolve()
  assert.equal(pendingRead, true)
  controller.abort(original)
  await assert.rejects(run, error => error === original)
  release(phase === 'setup' ? [{ serial: '0', open: false }] : { ...f.state })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.presses, 0)
  if (phase === 'setup') assert.equal(f.calls.includes('focus'), false, 'Abort also stops pending preparation actions')
})

test('pending setup timeout retains no late Space after it settles', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = fixture(t)
  let release
  const pending = new Promise(resolve => { release = resolve })
  f.page.evaluate = () => pending
  const run = skipPauseIntroduction(f.page, migrated({}))
  t.mock.timers.tick(100)
  await assert.rejects(run, /timed out/)
  release([])
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.presses, 0)
})

test('only explicit hosted setup callers receive original UI allowances and the unchanged outer deadline', () => {
  const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
  const profile = read('../scripts/local-render/campaign-profile-recovery.mjs')
  const pause = read('../scripts/local-render/original-pause-checkpoint-recovery.mjs')
  const runner = read('../scripts/tutorial-browser/run.mjs')
  assert.match(profile, /page.setDefaultTimeout\(15000\)/)
  assert.match(profile, /setupTimeout: 15000, deadlineAt, signal, trace/)
  assert.match(pause, /setupTimeout: 25000, deadlineAt, signal, trace/)
  assert.match(runner, /page.setDefaultTimeout\(25000\)/)
  for (const scenario of ['recoveryScenario', 'pauseRecoveryScenario'])
    assert.match(runner, new RegExp(`pathToFileURL\\(${scenario}\\)[^\\n]+deadlineAt: browserDeadlineAt`))
  const late = pause.slice(pause.indexOf('export function recoverVisibleIntroduction'), pause.indexOf('export default'))
  assert.match(late, /timeout: Math.min\(2500, remainingMs\)/)
  assert.match(late, /setupTimeout === undefined/)
  assert.match(late, /deadlineAt: Math.min\(deadlineAt, Date.now\(\) \+ remainingMs\)/)
  assert.match(profile, /onBlocked: recoverVisibleIntroduction\(page\)/, 'Unreviewed late profile callbacks keep the shared default')
})

const blockedIntroduction = { inputMask: 64, introductionSkipAvailable: true }

test('Tornado-style late recovery spends one existing action allowance and remains once-only', async t => {
  const f = fixture(t, { setupMs: 3000, readMs: 20 }), trace = {}
  const recover = recoverVisibleIntroduction(f.page, { setupTimeout: 8000, deadlineAt: 90000, trace })
  assert.deepEqual(await recover({ after: blockedIntroduction, remainingMs: 12000 }), { action: 'public-skip-introduction' })
  assert.equal(trace.actionCapMs, 8000)
  assert.equal(trace.responseCapMs, 2500)
  assert.equal(trace.responseStartedMs, 3000)
  assert.equal(trace.responseDeadlineMs, 5500)
  assert.equal(await recover({ after: blockedIntroduction, remainingMs: 12000 }), null)
  assert.equal(f.presses, 1)
})

for (const boundary of ['readiness', 'episode-or-host']) test(`late recovery clips preparation to the existing ${boundary} remainder`, async t => {
  const f = fixture(t, { setupMs: 2001 }), trace = {}
  const recover = recoverVisibleIntroduction(f.page, {
    setupTimeout: 8000, deadlineAt: boundary === 'episode-or-host' ? 2000 : 90000, trace,
  })
  await assert.rejects(recover({ after: blockedIntroduction, remainingMs: boundary === 'readiness' ? 2000 : 12000 }), /timed out/)
  assert.equal(trace.actionCapMs, 2000)
  assert.equal(trace.responseStartedMs, undefined)
  assert.equal(f.presses, 0)
})

test('late recovery keeps the2500ms fresh-observation response cap after longer preparation', async t => {
  const f = fixture(t, { setupMs: 3000, readMs: 2501 }), trace = {}
  const recover = recoverVisibleIntroduction(f.page, { setupTimeout: 8000, deadlineAt: 90000, trace })
  await assert.rejects(recover({ after: blockedIntroduction, remainingMs: 12000 }), /timed out/)
  assert.equal(trace.responseDeadlineMs, 5500)
  assert.equal(f.presses, 0)
})

test('late recovery popup rejection does not reset its response deadline', async t => {
  const f = fixture(t, { setupMs: 1000, keyMs: 800, reject: true }), trace = {}
  const recover = recoverVisibleIntroduction(f.page, { setupTimeout: 8000, deadlineAt: 90000, trace })
  await assert.rejects(recover({ after: blockedIntroduction, remainingMs: 12000 }), /timed out/)
  assert.equal(trace.responseStartedMs, 1000)
  assert.equal(trace.responseDeadlineMs, 3500)
  assert.equal(f.presses, 2)
})

test('unconverted late recovery retains shared2500 and never acts on an ineligible or exhausted sample', async t => {
  const f = fixture(t, { setupMs: 3000 }), recover = recoverVisibleIntroduction(f.page)
  assert.equal(await recover({ after: { ...blockedIntroduction, inputMask: 0 }, remainingMs: 12000 }), null)
  assert.equal(await recover({ after: blockedIntroduction, remainingMs: 0 }), null)
  assert.deepEqual(f.calls, [])
  await assert.rejects(recover({ after: blockedIntroduction, remainingMs: 12000 }), /timed out/)
  assert.equal(f.presses, 0)
})

test('late recovery forwards outer abort and rejects incomplete opt-in metadata before input', async t => {
  const f = fixture(t), controller = new AbortController(), original = Error('host aborted')
  const recover = recoverVisibleIntroduction(f.page, { setupTimeout: 8000, deadlineAt: 90000, signal: controller.signal })
  controller.abort(original)
  await assert.rejects(recover({ after: blockedIntroduction, remainingMs: 12000 }), error => error === original)
  assert.deepEqual(f.calls, [])
  assert.throws(() => recoverVisibleIntroduction(f.page, { setupTimeout: 8000 }), /outer deadline/)
})

test('opted-in response cannot exceed2500ms while the unconverted API remains configurable', async t => {
  const f = fixture(t)
  await assert.rejects(skipPauseIntroduction(f.page, migrated({}, { timeout: 2501 })), /cannot exceed 2500ms/)
  assert.equal(f.presses, 0)
  await skipPauseIntroduction(f.page, { timeout: 3000 })
  assert.equal(f.presses, 1)
})

test('local response expiry aborts a pending witness before its independent timer fires', async t => {
  const f = fixture(t), timers = new Map()
  let serial = 0, release, pendingWitness = false
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    const id = ++serial; timers.set(id, { callback, delay }); return id
  })
  t.mock.method(globalThis, 'clearTimeout', id => timers.delete(id))
  const pending = new Promise(resolve => { release = resolve }), evaluate = f.page.evaluate
  f.page.evaluate = async fn => {
    if (fn === beginSpaceOwnership) { pendingWitness = true; return pending }
    return evaluate(fn)
  }
  const run = skipPauseIntroduction(f.page, migrated({}))
  for (let i = 0; i < 80 && !pendingWitness; i++) await Promise.resolve()
  assert.equal(pendingWitness, true)
  const responseTimers = [...timers.values()].filter(timer => timer.delay === 20)
  assert.equal(responseTimers.length, 2, 'Parent response and child ownership timers are separately scheduled')
  responseTimers[0].callback() // Parent expires; deliberately do not fire the child's timer.
  await assert.rejects(run, /Recovery introduction input timed out/)
  release()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.presses, 0, 'A late-installed witness must not release trusted Space')
  assert.ok(f.calls.includes('cleanup-witness-and-native'), 'The passive witness is still cleaned')
})


test('atomic recovery after-state rejects absent, stale and expired witness payloads without fallback', () => {
  const good = { observationId: 'owned', witnessId: 'owned', witnessPresent: true, records: [],
    state: { paused: false, inputMask: 0, flybyFlags: 16 } }
  assert.deepEqual(recoveryStateFromSpaceSnapshot(good), { action: 'ready', paused: false, inputMask: 0, flybyFlags: 16 })
  for (const change of [v => { v.observationId = 'previous' }, v => { delete v.witnessId },
    v => { v.witnessPresent = false }, v => { delete v.records }, v => { delete v.state },
    v => { v.state.paused = undefined }, v => { v.state.inputMask = null }, v => { v.state.flybyFlags = NaN }]) {
    const value = structuredClone(good); change(value)
    assert.throws(() => recoveryStateFromSpaceSnapshot(value))
  }
})

test('each actual recovery attempt retains the original observations and unchanged retry deadline', async t => {
  const f = fixture(t, { setupMs: 5, keyMs: 6, reject: true }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, migrated(trace)), /timed out/)
  assert.equal(trace.attempts.length, 2)
  assert.equal(trace.responseDeadlineMs, 25)
  for (const attempt of trace.attempts) {
    assert.equal(attempt.before.inputMask, 64)
    assert.equal(attempt.after.inputMask, 64)
    assert.equal(attempt.afterSource, 'atomic-post-dispatch-witness')
    assert.equal(attempt.ownership.length, 1)
    assert.deepEqual(attempt.ownership[0].owners, ['0'])
    assert.equal(attempt.ownership[0].trusted, true)
    assert.equal(attempt.ownership[0].prevented, true)
    assert.equal(attempt.outcome, 'popup-owned-unchanged-retry')
  }
  assert.equal(f.reads, 2, 'Only the two required fresh pre-dispatch RPCs; post-state is captured with cleanup')
})


test('opted-in recovery never falls back from a stale or missing atomic after-state', async t => {
  for (const [name, snapshotChange] of [
    ['stale identity', value => { value.observationId = 'previous-attempt' }],
    ['expired witness', value => { value.witnessPresent = false }],
    ['missing native state', value => { delete value.state }],
    ['missing ownership records', value => { delete value.records }],
  ]) await t.test(name, async t => {
    const f = fixture(t, { setupMs: 5, snapshotChange }), trace = {}
    await assert.rejects(skipPauseIntroduction(f.page, migrated(trace)))
    assert.equal(f.presses, 1, 'Malformed evidence must never produce another Space')
    assert.equal(f.reads, 1, 'A missing atomic observation cannot fall back to a later read')
    assert.equal(trace.attempts.length, 1)
    assert.equal(trace.attempts[0].outcome, undefined)
    assert.equal(trace.responseDeadlineMs, 25)
  })
})

test('unchanged native state without actual popup ownership cannot retry', async t => {
  const f = fixture(t, { setupMs: 5, reject: true,
    snapshotChange: value => { value.records[0].owners = [] } }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, migrated(trace)), /Space was not accepted/)
  assert.equal(f.presses, 1)
  assert.equal(f.reads, 1)
  assert.equal(f.calls.filter(value => value === 'summary-click').length, 1)
  assert.deepEqual(trace.attempts[0].ownership[0].owners, [])
  assert.equal(trace.responseDeadlineMs, 25)
})


test('atomic finalizer RPC rejection cannot become success through a later ready-state read', async t => {
  const f = fixture(t, { setupMs: 5 }), original = Error('atomic observer RPC failed'), trace = {}
  const evaluate = f.page.evaluate
  f.page.evaluate = async (fn, arg) => {
    if (fn === endSpaceOwnershipSnapshot) throw original
    return evaluate(fn, arg)
  }
  await assert.rejects(skipPauseIntroduction(f.page, migrated(trace)), error => error === original)
  assert.equal(f.state.inputMask, 0, 'The actual key completed, but required atomic evidence is missing')
  assert.equal(f.presses, 1)
  assert.equal(f.reads, 1, 'No later-ready fallback observation')
  assert.equal(trace.attempts[0].delivery.keyDeliveryFailed, false)
  assert.equal(trace.attempts[0].outcome, undefined)
  assert.equal(trace.responseDeadlineMs, 25)
})

test('observer installation rejection cannot be mistaken for a key-delivery error', async t => {
  const f = fixture(t, { setupMs: 5 }), original = Error('observer installation RPC failed'), trace = {}
  const evaluate = f.page.evaluate
  f.page.evaluate = async (fn, arg) => {
    if (fn === beginSpaceOwnership) { f.state.inputMask = 0; throw original }
    return evaluate(fn, arg)
  }
  await assert.rejects(skipPauseIntroduction(f.page, migrated(trace)), error => error === original)
  assert.equal(f.presses, 0)
  assert.equal(f.reads, 1)
  assert.equal(trace.attempts[0].delivery.keyDeliveryFailed, false)
  assert.equal(trace.attempts[0].outcome, undefined)
})


test('actual key-delivery rejection retains fresh native-completion reconciliation', async t => {
  const original = Error('keyboard transport rejected after accepted native input')
  const f = fixture(t, { setupMs: 5, deliveryError: original }), trace = {}
  await skipPauseIntroduction(f.page, migrated(trace))
  assert.equal(f.presses, 1)
  assert.equal(f.reads, 2, 'Only an actual rejected key operation admits the original fresh native read')
  assert.equal(trace.attempts[0].delivery.keyDeliveryFailed, true)
  assert.equal(trace.attempts[0].afterSource, 'fresh-native-read')
  assert.equal(trace.attempts[0].outcome, 'completed')
  assert.equal(trace.responseDeadlineMs, 25)
})


test('native-UI setup contract is explicit and keeps the existing25000ms action and2500ms response', async t => {
  const f = fixture(t, { setupMs: 3000, readMs: 100 }), trace = {}
  assert.equal(recoveryInputContract, 'public-setup-then-response-v1')
  await skipPauseIntroduction(f.page, { setupTimeout: 25000, deadlineAt: 90000, signal: new AbortController().signal, trace })
  assert.equal(trace.contract, recoveryInputContract); assert.equal(trace.actionCapMs, 25000)
  assert.equal(trace.responseCapMs, 2500); assert.equal(trace.responseStartedMs, 3000)
  assert.equal(trace.responseDeadlineMs, 5500); assert.equal(f.presses, 1)
})

test('native-UI existing action allowance stays clipped to the original episode and response caps', async t => {
  const f = fixture(t, { setupMs: 3000, readMs: 2501 }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, { setupTimeout: 25000, deadlineAt: 5000, trace }), /timed out/)
  assert.equal(trace.actionCapMs, 5000); assert.equal(trace.responseDeadlineMs, 5000)
  assert.equal(f.presses, 0)
})

test('pause-style caller explicitly opts in only with an outer deadline and persists failure traces', () => {
  const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-style.mjs', import.meta.url), 'utf8')
  assert.match(source, /receipt\.pauseStyleInputBudgets = inputBudgets/)
  assert.match(source, /Number\.isFinite\(deadlineAt\)\s*\? \{ setupTimeout: 25000, deadlineAt, signal, trace, popupRetryPreparation: true \} : \{ signal, trace \}/)
  assert.match(source, /finally \{ writePauseInputBudgets\(output, inputBudgets, \.\.\.\(inputFailed \? \[inputError\] : \[\]\)\) \}/)
  assert.doesNotMatch(source, /deadlineAt:\s*Date\.now/)
})


test('actual pause-style input persistence keeps original error identity and rejects write-only failure', async t => {
  const root = mkdtempSync(join(tmpdir(), 'pnd-pause-input-budget-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-style.mjs', import.meta.url), 'utf8')
  const match = source.match(/let inputError, inputFailed = false\s+try \{\s+await skipPauseIntroduction\(page, Number\.isFinite\(deadlineAt\)[\s\S]+?finally \{ writePauseInputBudgets\(output, inputBudgets, \.\.\.\(inputFailed \? \[inputError\] : \[\]\)\) \}/)
  assert.ok(match)
  for (const inputFails of [false, true]) for (const writeFails of [false, true]) {
    const inputError = Error('original Space uncertainty'), trace = {}, inputBudgets = [trace]
    const output = writeFails ? join(root, 'missing') : root
    let inputs = 0
    const run = vm.runInNewContext(`(async () => { ${match[0]} })`, {
      page: {}, trace, inputBudgets, output, deadlineAt: 90000, signal: {}, writePauseInputBudgets,
      skipPauseIntroduction: async (_page, options) => {
        inputs++; assert.equal(options.trace, trace); assert.equal(options.setupTimeout, 25000)
        trace.phase = 'observed-space-dispatch'
        if (inputFails) throw inputError
      },
    })
    if (inputFails) await assert.rejects(run(), error => error === inputError)
    else if (writeFails) await assert.rejects(run(), /ENOENT/)
    else await run()
    assert.equal(inputs, 1)
    if (inputFails && writeFails) assert.match(inputError.traceWriteError, /ENOENT/)
    else assert.equal(inputError.traceWriteError, undefined)
    if (!writeFails) assert.deepEqual(JSON.parse(readFileSync(join(output, 'pause-style-input-budgets.json'), 'utf8')), inputBudgets)
  }
})


const retryBudget = (trace, extra = {}) => ({ setupTimeout: 200, timeout: 40, deadlineAt: 1000,
  popupRetryPreparation: true, trace, ...extra })
test('explicit v2 excludes only the proven retry setup from one cumulative response budget', async t => {
  const f = fixture(t, { rejectCount: 1, readMs: 5, installMs: 3, keyMs: 6, finalizeMs: 4 }), trace = {}
  await skipPauseIntroduction(f.page, retryBudget(trace))
  assert.equal(trace.contract, recoveryRetryInputContract)
  assert.equal(f.presses, 2)
  assert.equal(trace.retryCount, 1)
  assert.equal(trace.retryPreparationMs, 60)
  assert.equal(trace.responseSpentMs, 36)
  assert.equal(trace.elapsedMs, 156)
  assert.equal(trace.wallElapsedMs, 156)
  assert.deepEqual(trace.responseWindows, [
    { startedMs: 60, finishedMs: 78, deadlineMs: 100 },
    { startedMs: 138, finishedMs: 156, deadlineMs: 160 },
  ])
  assert.equal(trace.retryPreparations[0].afterAttempt, 1)
  assert.equal(trace.retryPreparations[0].status, 'passed')
  assert.equal(trace.retryPreparations[0].trace.observedOpen, false)
  assert.equal(trace.attempts[1].afterSource, 'atomic-post-dispatch-witness')
})

test('v2 never resets response time after the authorized retry preparation', async t => {
  const f = fixture(t, { rejectCount: 1, keyMs: 15 }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, retryBudget(trace, { timeout: 25 })), /timed out/)
  assert.equal(f.presses, 2)
  assert.equal(trace.responseDeadlineMs, 145, '60 initial + 25 cumulative + 60 retry setup, not a fresh 25')
  assert.equal(trace.retryPreparationMs, 60)
  assert.ok(trace.responseSpentMs >= 25)
})

test('v2 permits only one positively witnessed retry even with unused absolute allowance', async t => {
  const f = fixture(t, { setupMs: 5, reject: true }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, retryBudget(trace)), /only one proven popup-owned retry/)
  assert.equal(f.presses, 2); assert.equal(trace.retryCount, 1)
  assert.equal(trace.retryPreparations.length, 1)
})

test('v2 absolute action deadline still terminates retry preparation before another key', async t => {
  const f = fixture(t, { rejectCount: 1, keyMs: 5 }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, retryBudget(trace, { setupTimeout: 100 })), /timed out/)
  assert.equal(f.presses, 1)
  assert.equal(trace.actionCapMs, 100)
  assert.equal(trace.retryPreparations[0].status, 'failed')
})

test('v2 outer episode remainder overrides the nominal action allowance', async t => {
  const f = fixture(t, { rejectCount: 1, keyMs: 5 }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, retryBudget(trace, { deadlineAt: 100 })), /timed out/)
  assert.equal(f.presses, 1); assert.equal(trace.actionCapMs, 100)
})

for (const phase of ['readMs', 'installMs', 'keyMs', 'finalizeMs']) test(`v2 charges ${phase} to response, including cleanup`, async t => {
  const f = fixture(t, { [phase]: 41 }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, retryBudget(trace)), /timed out/)
  assert.equal(trace.retryPreparations.length, 0)
  assert.ok(trace.responseSpentMs >= 40)
  assert.ok(f.presses <= 1)
})

test('v2 missing atomic finalization never authorizes another preparation or key', async t => {
  const primary = Error('atomic finalizer rejected after a fulfilled key')
  const f = fixture(t, { rejectCount: 1, snapshotChange: () => { throw primary } }), trace = {}
  await assert.rejects(skipPauseIntroduction(f.page, retryBudget(trace)), error => error === primary)
  assert.equal(f.presses, 1)
  assert.equal(trace.retryPreparations.length, 0)
  assert.equal(trace.attempts[0].atomicAfter, undefined)
  assert.equal(trace.attempts[0].delivery.keyDeliveryFailed, false)
  assert.ok(f.calls.includes('cleanup-witness-and-native'))
})

test('v2 natural completion after setup sends no key and has no excluded retry time', async t => {
  const f = fixture(t, { natural: true }), trace = {}
  await skipPauseIntroduction(f.page, retryBudget(trace))
  assert.equal(f.presses, 0); assert.equal(trace.retryCount, 0)
  assert.equal(trace.retryPreparationMs, 0); assert.equal(trace.responseSpentMs, 0)
})

test('retry preparation accounting cannot silently migrate shared/default callers', async t => {
  const f = fixture(t)
  for (const options of [{ popupRetryPreparation: true }, { setupTimeout: 100, deadlineAt: 1000, popupRetryPreparation: 'yes' }])
    await assert.rejects(skipPauseIntroduction(f.page, options), /explicit public setup/)
  assert.equal(f.presses, 0)
})


for (const mutate of [record => { record.trusted = false }, record => { record.repeat = true },
  record => { record.prevented = false }, record => { record.sameWorld = false },
  record => { record.owners = [] }, record => { record.after.inputMask = 0 }])
  test('v2 refuses unproven popup ownership before excluding time or retrying', async t => {
    const f = fixture(t, { rejectCount: 1, snapshotChange: snapshot => mutate(snapshot.records[0]) }), trace = {}
    await assert.rejects(skipPauseIntroduction(f.page, retryBudget(trace)), /not accepted/)
    assert.equal(f.presses, 1); assert.equal(trace.retryCount, 0)
    assert.equal(trace.retryPreparationMs, 0)
  })

for (const phase of ['retry-preparation', 'second-finalizer']) test(`v2 abort during ${phase} preserves the primary error and forbids late input`, async t => {
  const f = fixture(t, { setupMs: 5, rejectCount: 1 }), trace = {}, controller = new AbortController()
  const primary = Error(`aborted ${phase}`), evaluate = f.page.evaluate
  let release, waiting = false
  const pending = new Promise(resolve => { release = resolve })
  f.page.evaluate = async (fn, arg) => {
    if ((phase === 'retry-preparation' && f.presses === 1 && fn === campaignPopupSnapshot) ||
      (phase === 'second-finalizer' && f.presses === 2 && fn === endSpaceOwnershipSnapshot)) {
      waiting = true; return pending
    }
    return evaluate(fn, arg)
  }
  const run = skipPauseIntroduction(f.page, retryBudget(trace, { signal: controller.signal }))
  for (let i = 0; i < 200 && !waiting; i++) await Promise.resolve()
  assert.equal(waiting, true)
  controller.abort(primary)
  await assert.rejects(run, error => error === primary)
  const presses = f.presses
  release(phase === 'retry-preparation' ? [{ serial: '0', open: true }] : undefined)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.presses, presses)
  assert.ok(presses <= 2)
  assert.equal(trace.attempts.at(-1).atomicAfter, phase === 'second-finalizer' ? undefined : trace.attempts[0].atomicAfter)
})


for (const contract of ['v2', 'v1', 'shared-input-v1']) test(`${contract} does not publish a valid late witness after abort`, async t => {
  const f = fixture(t, { setupMs: 5, rejectCount: contract === 'v2' ? 1 : 0 })
  const trace = {}, controller = new AbortController(), primary = Error(`late ${contract} finalizer aborted`)
  const evaluate = f.page.evaluate, finalizer = contract === 'shared-input-v1' ? endSpaceOwnership : endSpaceOwnershipSnapshot
  const expectedPresses = contract === 'v2' ? 2 : 1
  let release, waiting = false, lateValue
  const pending = new Promise(resolve => { release = resolve })
  f.page.evaluate = async (fn, arg) => {
    if (fn !== finalizer || f.presses !== expectedPresses) return evaluate(fn, arg)
    const actual = await evaluate(fn, arg)
    const record = { trusted: true, repeat: false, prevented: false, sameWorld: true, owners: [],
      before: { paused: false, inputMask: 64, flybyFlags: 17 },
      after: { paused: f.state.paused, inputMask: f.state.inputMask, flybyFlags: f.state.flybyFlags } }
    assert.deepEqual(record.after, { paused: false, inputMask: 0, flybyFlags: 16 })
    lateValue = contract === 'shared-input-v1' ? [record] : { ...actual, records: [record] }
    if (contract !== 'shared-input-v1') {
      assert.equal(lateValue.observationId, arg)
      assert.equal(lateValue.witnessPresent, true)
      assert.deepEqual(recoveryStateFromSpaceSnapshot({ ...lateValue, witnessId: arg }),
        { action: 'ready', paused: false, inputMask: 0, flybyFlags: 16 })
    }
    waiting = true
    return pending
  }
  const options = contract === 'v2' ? retryBudget(trace) : contract === 'v1'
    ? migrated(trace, { timeout: 40 }) : { timeout: 40, trace }
  const run = skipPauseIntroduction(f.page, { ...options, signal: controller.signal })
  for (let i = 0; i < 200 && !waiting; i++) await Promise.resolve()
  assert.equal(waiting, true)
  controller.abort(primary)
  await assert.rejects(run, error => error === primary)
  const attempt = trace.attempts.at(-1)
  assert.equal(attempt.ownership, undefined)
  assert.equal(attempt.atomicAfter, undefined)
  release(lateValue)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.presses, expectedPresses, 'No input is sent after the owning abort')
  assert.equal(attempt.ownership, undefined, 'Valid late records cannot become accepted ownership')
  assert.equal(attempt.atomicAfter, undefined, 'Valid late state cannot become an accepted atomic outcome')
  assert.equal(attempt.outcome, undefined)
  assert.equal(attempt.delivery.keyDeliveryFailed, false, 'A finalizer abort is not a failed key')
  assert.equal(attempt.delivery.pending, false)
  assert.equal(attempt.delivery.completed.findLast(item => item.phase === 'finalize-space-witness').status, 'fulfilled',
    'The real late RPC settlement remains in the raw delivery trace')
  assert.ok(f.calls.includes(contract === 'shared-input-v1' ? 'cleanup-witness' : 'cleanup-witness-and-native'))
})


test('actual input-budget finally preserves arbitrary thrown values across write failure and both deadline modes', async t => {
  const root = mkdtempSync(join(tmpdir(), 'pnd-pause-primary-values-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-style.mjs', import.meta.url), 'utf8')
  const match = source.match(/let inputError, inputFailed = false\s+try \{\s+await skipPauseIntroduction\(page, Number\.isFinite\(deadlineAt\)[\s\S]+?finally \{ writePauseInputBudgets\(output, inputBudgets, \.\.\.\(inputFailed \? \[inputError\] : \[\]\)\) \}/)
  assert.ok(match)
  // Execute only the actual input try/catch/finally, inside the unchanged diagnostic phase.
  const block = match[0]
  assert.match(block, /finally \{ writePauseInputBudgets/)
  for (const primary of [undefined, null, false, 0, -0, NaN, '', 'primary', 0n, Symbol('primary'),
    Object.freeze(Error('frozen')), Object.preventExtensions(Error('nonextensible'))])
    for (const writeFails of [false, true]) for (const deadlineAt of [90000, undefined]) {
      const trace = {}, inputBudgets = [trace], output = writeFails ? join(root, 'missing') : root
      let inputs = 0
      const signal = {}, run = vm.runInNewContext(`(async () => { ${block} })`, {
        page: {}, trace, inputBudgets, output, deadlineAt, signal, writePauseInputBudgets,
        skipPauseIntroduction: async (_page, options) => {
          inputs++; assert.equal(options.trace, trace); assert.equal(options.signal, signal)
          assert.equal(options.setupTimeout, Number.isFinite(deadlineAt) ? 25000 : undefined)
          assert.equal(options.deadlineAt, deadlineAt)
          trace.phase = 'original-failure'; throw primary
        },
      })
      const outcome = await run().then(() => ({ failed: false }), error => ({ failed: true, error }))
      assert.equal(inputs, 1); assert.equal(outcome.failed, true); assert.ok(Object.is(outcome.error, primary))
      if (!writeFails) assert.deepEqual(JSON.parse(readFileSync(join(output, 'pause-style-input-budgets.json'), 'utf8')), inputBudgets)
    }
})

test('input-budget diagnostic coercion and annotation cannot mask an existing primary', () => {
  const unprintable = { toString() { throw Error('diagnostic coercion failed') } }
  const hostile = Object.defineProperty({}, 'traceWriteError', { set() { throw Error('annotation rejected') } })
  // JSON serialization fails before the filesystem call; this is a diagnostic-boundary fixture.
  for (const secondary of [Error('serialization failed'), unprintable]) {
    const budgets = { toJSON() { throw secondary } }
    for (const primary of [undefined, null, false, 0, '', Symbol('primary'), Object.freeze(Error('frozen')), hostile])
      assert.doesNotThrow(() => writePauseInputBudgets('unused-output', budgets, primary))
    assert.throws(() => writePauseInputBudgets('unused-output', budgets), error => error === secondary)
  }
})
