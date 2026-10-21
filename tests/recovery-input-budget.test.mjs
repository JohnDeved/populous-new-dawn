import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { skipPauseIntroduction, pauseStartupReady, recoverVisibleIntroduction } from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'
import { campaignPopupSnapshot } from '../scripts/browser-world-input.mjs'
import { beginSpaceOwnership, endSpaceOwnership } from '../scripts/browser-space-ownership.mjs'

function fixture(t, { setupMs = 60, readMs = 0, keyMs = 0, reject = false, natural = false, deliveryError, pauseRace = false } = {}) {
  let now = 0, open = true, presses = 0, reads = 0, records = []
  const calls = [], state = { action: 'skip', paused: false, inputMask: 64, flybyFlags: 17 }
  t.mock.method(performance, 'now', () => now)
  t.mock.method(Date, 'now', () => now)
  const page = {
    evaluate: async fn => {
      if (fn === campaignPopupSnapshot) return [{ serial: '0', open }]
      if (fn === beginSpaceOwnership) { calls.push('install-witness'); return }
      if (fn === endSpaceOwnership) { calls.push('cleanup-witness'); return records }
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
      if (reject) {
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
  assert.deepEqual(f.calls, ['summary-click', 'hidden-body', 'focus', 'read-native', 'install-witness', 'Space', 'cleanup-witness', 'read-native'])
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
  assert.ok(f.calls.includes('cleanup-witness'), 'The passive witness is still cleaned')
})
