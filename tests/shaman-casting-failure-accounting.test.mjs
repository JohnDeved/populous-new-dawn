import assert from 'node:assert/strict'
import test from 'node:test'
import { prepareCastingF9 } from '../scripts/tutorial-browser/shaman-casting.mjs'

// Real imported host helper; the page/protocol ports below are supplied. These
// controls do not execute Playwright, the page observer or a rendered game.
const reasons = [
  ['undefined', undefined], ['null', null], ['false', false], ['zero', 0], ['NaN', NaN], ['empty', ''],
  ['Error', Error('first failure')], ['object', { message: 'first failure' }],
  ['symbol', Symbol('first failure')], ['bigint', 0n],
]
async function outcome(promise) {
  try { return { rejected: false, value: await promise } }
  catch (reason) { return { rejected: true, reason } }
}
function failed(result, reason) {
  assert.equal(result.rejected, true, 'a failure must not resolve successfully')
  assert.ok(Object.is(result.reason, reason), 'the first failure identity must be retained')
}
function suppliedPage(faults = {}) {
  const frame = {}, listeners = new Map(), calls = []
  let receive, subscription, disposed = 0, disarmed = 0
  const rejectAt = name => { if (Object.hasOwn(faults, name)) throw faults[name] }
  const page = {
    mainFrame: () => frame, isClosed: () => false,
    on(name, callback) { listeners.set(name, callback) },
    off(name, callback) { assert.equal(listeners.get(name), callback); listeners.delete(name) },
    async exposeBinding(name, callback) {
      rejectAt('expose')
      receive = callback
      return { async dispose() { disposed++; rejectAt('dispose') } }
    },
    async evaluate(callback, value) {
      if (String(callback).includes('subscribeFirstRunningCast')) {
        subscription = value
        rejectAt('subscribe')
        return { personId: 7 }
      }
      assert.match(String(callback), /disarmFirstRunningCast/)
      assert.equal(value, subscription.token)
      disarmed++
      rejectAt('disarm')
    },
    mouse: { async click(x, y) {
      calls.push(['click', x, y])
      rejectAt('mouse')
      ready()
    } },
    keyboard: { async press(key) { calls.push(['key', key]); rejectAt('keyboard') } },
  }
  function ready() {
    receive({ page, frame }, { kind: 'ready', label: 'subsequent', token: subscription.token,
      personId: 7, before: subscription.before, after: subscription.before + 1,
      shot: 1, stamp: 1, copiedAt: 1, pageAt: 2 })
  }
  return { page, calls, listeners, ready, disposed: () => disposed, disarmed: () => disarmed }
}
async function prepared(faults = {}) {
  const supplied = suppliedPage(faults), report = {},
    dispatch = await prepareCastingF9(supplied.page, report, 0, performance.now() + 12000)
  return { supplied, report, dispatch }
}
async function closeOnce(dispatch, supplied) {
  const first = dispatch.close(), second = dispatch.close()
  assert.equal(first, second, 'cleanup is single-flight')
  const result = await outcome(first)
  assert.equal(supplied.disarmed(), 1)
  assert.equal(supplied.disposed(), 1)
  assert.equal(supplied.listeners.size, 0)
  return result
}

for (const [name, reason] of reasons) {
  for (const boundary of ['disarm', 'dispose']) {
    test(`casting close rejects ${name} from ${boundary} after successful input`, async () => {
      const { supplied, report, dispatch } = await prepared({ [boundary]: reason })
      await dispatch.click({ x: 1, y: 2 })
      failed(await closeOnce(dispatch, supplied), reason)
      assert.deepEqual(supplied.calls, [['click', 1, 2], ['key', 'F9']])
      assert.equal(report.castingNotification.failure, String(reason))
      assert.notEqual(report.castingNotification.closedAt, null)
    })
  }
  for (const boundary of ['mouse', 'keyboard']) {
    test(`casting ${boundary} rejects ${name} through click and close`, async () => {
      const { supplied, report, dispatch } = await prepared({ [boundary]: reason })
      failed(await outcome(dispatch.click({ x: 1, y: 2 })), reason)
      failed(await outcome(dispatch.done), reason)
      failed(await closeOnce(dispatch, supplied), reason)
      assert.equal(report.castingNotification.failure, String(reason))
      assert.equal(report.castingHostTiming.operations.at(-1).completed, false)
      assert.deepEqual(supplied.calls, boundary === 'mouse' ? [['click', 1, 2]] : [['click', 1, 2], ['key', 'F9']])
    })
  }
  test(`casting cancellation retains ${name} through later guard and cleanup errors`, async () => {
    const { supplied, report, dispatch } = await prepared({ disarm: Error('later disarm'), dispose: Error('later dispose') })
    dispatch.cancel(reason)
    failed(await outcome(dispatch.done), reason)
    failed(await outcome(dispatch.click({ x: 1, y: 2 })), reason)
    failed(await closeOnce(dispatch, supplied), reason)
    assert.equal(report.castingNotification.failure, String(reason))
    assert.deepEqual(supplied.calls, [], 'cancelled work cannot send pointer or keyboard input')
  })
  for (const boundary of ['expose', 'subscribe']) {
    test(`casting ${boundary} setup retains ${name} and cleans partial ownership`, async () => {
      const supplied = suppliedPage({ [boundary]: reason, disarm: Error('later disarm'), dispose: Error('later dispose') }), report = {}
      failed(await outcome(prepareCastingF9(supplied.page, report, 0, performance.now() + 12000)), reason)
      assert.equal(supplied.listeners.size, 0)
      assert.equal(supplied.disarmed(), boundary === 'subscribe' ? 1 : 0)
      assert.equal(supplied.disposed(), boundary === 'subscribe' ? 1 : 0)
      assert.equal(report.castingNotification.failure, String(reason))
      assert.deepEqual(supplied.calls, [])
    })
  }
}

test('casting success keeps one F9 dispatch and idempotent cleanup', async () => {
  const { supplied, report, dispatch } = await prepared()
  await dispatch.click({ x: 3, y: 4 })
  assert.equal((await outcome(dispatch.done)).rejected, false)
  assert.equal((await closeOnce(dispatch, supplied)).rejected, false)
  assert.deepEqual(supplied.calls, [['click', 3, 4], ['key', 'F9']])
  assert.deepEqual(report.castingHostTiming.operations.map(row => [row.operation, row.completed]),
    [['pointer-click', true], ['keyboard-press', true]])
  assert.equal(Object.hasOwn(report.castingNotification, 'failure'), false)
  const terminal = structuredClone(report)
  dispatch.cancel(Error('late cancellation'))
  assert.throws(supplied.ready, /cancelled|closed|deadline/)
  assert.deepEqual(report, terminal, 'late callbacks cannot rewrite closed evidence')
  assert.equal((await outcome(dispatch.close())).rejected, false)
  assert.equal(supplied.disposed(), 1)
})

test('casting disarm owns the first nullish failure when dispose also rejects', async () => {
  for (const reason of [null, undefined]) {
    const { supplied, report, dispatch } = await prepared({ disarm: reason, dispose: Error('later dispose') })
    await dispatch.click({ x: 1, y: 2 })
    failed(await closeOnce(dispatch, supplied), reason)
    assert.equal(report.castingNotification.failure, String(reason))
  }
})

test('casting clean early close still disarms without input and rejects pending done', async () => {
  const { supplied, report, dispatch } = await prepared()
  assert.equal((await closeOnce(dispatch, supplied)).rejected, false)
  const done = await outcome(dispatch.done)
  assert.equal(done.rejected, true)
  assert.match(done.reason.message, /notification disarmed/)
  assert.deepEqual(supplied.calls, [])
  assert.equal(Object.hasOwn(report.castingNotification, 'failure'), false)
})
