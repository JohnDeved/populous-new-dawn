import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { observeGameplayProducerPreflight, recordGameplayProducerCleanup,
  validateGameplayProducerPreflight } from '../scripts/tutorial-browser/gameplay-heap-observer.mjs'

const pin = { product: 'Chrome/155.0.8059.39', revision: '@3ff7ac5a9224be9156d7f8703a06e22890aafd34',
  jsVersion: '15.5.35.20', protocolVersion: '1.3' }
const executableSha256 = '9bfb381296dffe75f3419d07b6cc64525105ed117d1453a4ef3b291cb97d2b58'
function metricReport() {
  return { status: 'passed', cycles: [{}, {}, {}], resources: { heap: {
    status: 'passed-three-cycle-descriptive-observations', sessionDetached: true,
    samples: [0, 1, 2].map(i => ({ status: 'passed', boundary: `after-cycle-${i+1}-workload`,
      isolateBefore: 'isolate-fixture', isolateAfter: 'isolate-fixture',
      after: { timeOriginUnixMs: 10000 }, timing: { endedMs: 900 + i } })) } } }
}
class Clock {
  time = 1000; next = 0; timers = new Map()
  now = () => this.time
  schedule = (fn, ms) => { const id = ++this.next; this.timers.set(id, { fn, at: this.time + ms }); return id }
  cancel = id => this.timers.delete(id)
  advance = at => {
    this.time = at
    for (const [id, event] of [...this.timers].sort((a,b) => a[1].at-b[1].at)) {
      if (event.at <= at && this.timers.delete(id)) event.fn()
    }
  }
  later = (ms, value, reject = false) => new Promise((resolve, fail) => this.schedule(
    () => reject ? fail(new Error('PRIVATE_PROTOCOL_EXCEPTION')) : resolve(value), ms))
}
function fixture(changes = {}) {
  const clock = new Clock(), calls = [], counts = new Map(), controller = new AbortController()
  const report = changes.report ?? metricReport()
  const results = { 'Browser.getVersion': { ...pin, userAgent: 'PRIVATE-USER-AGENT' },
    'Target.getTargetInfo': { targetInfo: { targetId: 'target-fixture', type: 'page',
      title: 'PRIVATE-TITLE', url: 'https://private.invalid/', browserContextId: 'PRIVATE-CONTEXT' } },
    'Runtime.getIsolateId': { id: report.resources.heap.samples[2].isolateAfter },
    'page-task': { timeOriginUnixMs: report.resources.heap.samples[2].after.timeOriginUnixMs, aliasesAbsent: true } }
  function invoke(name, value) {
    calls.push({ name, time: clock.time }); counts.set(name, (counts.get(name) ?? 0) + 1)
    return changes.invoke ? changes.invoke({ name, value, count: counts.get(name), clock, controller }) : Promise.resolve(value)
  }
  const root = { send: method => { assert.equal(method, 'Browser.getVersion'); return invoke(method, results[method]) },
    detach: () => invoke('root-detach') }
  const target = { send: method => { assert.ok(['Target.getTargetInfo', 'Runtime.getIsolateId'].includes(method)); return invoke(method, results[method]) },
    detach: () => invoke('page-detach') }
  const page = { context: () => ({ newCDPSession: same => {
    assert.equal(same, page); return invoke('page-create', target)
  } }), evaluate: fn => {
    const source = String(fn)
    assert.match(source, /setTimeout/); assert.match(source, /Object.hasOwn\(window, key\)/)
    assert.doesNotMatch(source, /\.deref|window\.testScene|evaluateHandle|collectGarbage/)
    return invoke('page-task', results['page-task'])
  } }
  const browser = { newBrowserCDPSession: () => invoke('root-create', root) }
  const args = { browser, page, report, budget: { startedMs: 0, deadlineMs: 180000, deadlineUnixMs: 1800000 },
    executableSha256, signal: controller.signal, now: clock.now, schedule: clock.schedule, cancel: clock.cancel }
  Object.assign(args, changes.args)
  return { clock, calls, args, controller }
}
async function run(f) {
  let done = false, value, error
  observeGameplayProducerPreflight(f.args).then(result => { value = result; done = true }, failure => { error = failure; done = true })
  for (let steps = 0; !done && steps < 30; steps++) {
    for (let microtask = 0; microtask < 200 && !done; microtask++) await Promise.resolve()
    if (!done) {
      assert.ok(f.clock.timers.size, 'Unaccounted generated promise')
      f.clock.advance(Math.min(...[...f.clock.timers.values()].map(timer => timer.at)))
    }
  }
  assert.equal(done, true, 'Finite mock schedule exhausted')
  if (error) throw error
  return value
}
function finish(f, receipt, end = f.clock.time + 1) {
  recordGameplayProducerCleanup(receipt, end, true)
  return validateGameplayProducerPreflight(receipt, f.args.report, { executableSha256 })
}

test('metadata-only success records actual tuple and same page identity after fresh tasks', async () => {
  const f = fixture(), before = JSON.stringify(f.args.report), r = await run(f)
  assert.equal(r.status, 'observed'); assert.equal(r.expectedPinMatched, true)
  assert.deepEqual(r.browser, pin); assert.deepEqual(r.target, { targetId: 'target-fixture', type: 'page' })
  assert.equal(r.snapshot_attempted, false); assert.equal(r.capture_ready, false)
  assert.equal(JSON.stringify(f.args.report), before)
  assert.deepEqual(f.calls.map(call => call.name), ['page-task', 'root-create', 'page-create',
    'Browser.getVersion', 'Target.getTargetInfo', 'Runtime.getIsolateId', 'Target.getTargetInfo',
    'Runtime.getIsolateId', 'page-task', 'root-detach', 'page-detach'])
  assert.deepEqual(finish(f, r), { metadataObserved: true, snapshotAttempted: false, captureReady: false })
  assert.equal(f.clock.timers.size, 0)
  const text = JSON.stringify(r)
  for (const privateValue of ['PRIVATE-', 'private.invalid', 'userAgent', 'browserContextId']) assert.ok(!text.includes(privateValue))
})
test('insufficient original headroom attaches nothing and never resets the 180s budget', async () => {
  const f = fixture(); f.clock.time = 177001
  const r = await run(f)
  assert.equal(r.status, 'not-started-headroom'); assert.deepEqual(f.calls, [])
  assert.equal(r.timing.operationsDeadlineMs, 179001); assert.equal(r.timing.cleanupDeadlineMs, 180000)
  finish(f, r); assert.throws(() => validateGameplayProducerPreflight(r, f.args.report, { requireObserved: true }))
})
test('exactly 3s headroom is admitted and actual producer mismatch stays visible, not capture ready', async () => {
  const f = fixture({ args: { executableSha256: 'a'.repeat(64) } }); f.clock.time = 177000
  const r = await run(f); assert.equal(r.status, 'observed'); assert.equal(r.expectedPinMatched, false)
  assert.equal(r.capture_ready, false); recordGameplayProducerCleanup(r, 180001, true)
  assert.equal(r.timing.remainingAfterOrdinaryCleanupMs, -1)
  assert.equal(r.timing.cleanupDeadlineEnforced, false)
  validateGameplayProducerPreflight(r, f.args.report, { executableSha256: 'a'.repeat(64) })
})
test('prior complete three-cycle metrics and original observer cleanup are mandatory', async () => {
  for (const mutate of [r => { r.cycles.pop() }, r => { r.resources.heap.sessionDetached = false },
    r => { r.resourceObserverCleanupFailure = 'fixed-fixture' }, r => { r.resources.heap.samples[2].status = 'failed' },
    r => { r.resources.heap.samples[0].status = 'failed' }, r => { r.resources.heap.samples[1].boundary = 'wrong' }]) {
    const report = metricReport(); mutate(report); const f = fixture({ report }), r = await run(f)
    assert.equal(r.status, 'failed'); assert.deepEqual(f.calls, []); assert.equal(r.snapshot_attempted, false)
  }
})
test('identity changes and residual aliases reject without reading game values', async () => {
  for (const broken of ['alias', 'document', 'isolate', 'target']) {
    const f = fixture({ invoke: ({ name, value, count }) => {
      if (broken === 'alias' && name === 'page-task') return { ...value, aliasesAbsent: false }
      if (broken === 'document' && name === 'page-task' && count === 2) return { ...value, timeOriginUnixMs: 999 }
      if (broken === 'isolate' && name === 'Runtime.getIsolateId' && count === 2) return { id: 'different' }
      if (broken === 'target' && name === 'Target.getTargetInfo' && count === 2) return { targetInfo: { ...value.targetInfo, targetId: 'different' } }
      return value
    } })
    const r = await run(f); assert.equal(r.status, 'failed'); assert.equal(r.snapshot_attempted, false)
    assert.ok(['IDENTITY', 'OBSERVER_CLEANUP'].includes(r.code)); assert.equal(r.sessionCleanup.promisesSettled, true)
  }
})
test('unsupported commands, malformed/oversize fields and private exceptions use fixed errors', async () => {
  for (const bad of [null, { ...pin, revision: 'x'.repeat(257) }, { ...pin, product: '\nPRIVATE' }, new Error('PRIVATE-ERROR')]) {
    const f = fixture({ invoke: ({ name, value }) => {
      if (name !== 'Browser.getVersion') return value
      if (bad instanceof Error) throw bad
      return bad
    } }), r = await run(f)
    assert.equal(r.status, 'failed'); assert.ok(!JSON.stringify(r).includes('PRIVATE'))
    assert.ok(['CONTRACT', 'PROTOCOL'].includes(r.code)); assert.equal(r.sessionCleanup.detached, 2)
  }
})
test('all metadata commands share one deadline including exact 2s response boundary', async () => {
  for (const delay of [2000, 2500]) {
    const f = fixture({ invoke: ({ name, value, clock }) => name === 'Browser.getVersion' ? clock.later(delay, value) : value })
    const r = await run(f); assert.equal(r.status, 'failed'); assert.equal(r.code, 'DEADLINE')
    assert.equal(r.timing.operationsDeadlineMs, 3000); assert.equal(r.timing.cleanupDeadlineMs, 4000)
    assert.ok(!f.calls.some(call => call.name === 'Target.getTargetInfo'))
    assert.equal(r.sessionCleanup.promisesSettled, true); assert.equal(r.sessionCleanup.detached, 2)
  }
})
test('late root or page session creation is tracked and detached without further reads', async () => {
  for (const create of ['root-create', 'page-create']) {
    const f = fixture({ invoke: ({ name, value, clock }) => name === create ? clock.later(2500, value) : value })
    const r = await run(f); assert.equal(r.status, 'failed'); assert.equal(r.code, 'DEADLINE')
    assert.equal(r.timing.cleanupDeadlineMs, 4000); assert.equal(r.sessionCleanup.promisesSettled, true)
    assert.equal(r.sessionCleanup.created, r.sessionCleanup.detached)
    assert.ok(!f.calls.some(call => call.name === 'Browser.getVersion'))
  }
})
test('creation/detach at or beyond exact 3s boundary never gets a fresh cleanup interval', async () => {
  for (const blocked of ['root-create', 'page-detach']) {
    const f = fixture({ invoke: ({ name, value, clock }) => name === blocked ? clock.later(3000, value) : value })
    const r = await run(f); assert.equal(r.status, 'failed'); assert.equal(r.timing.endedMs, 4000)
    assert.equal(r.timing.cleanupDeadlineMs, 4000)
    assert.ok(r.sessionCleanup.detached < r.sessionCleanup.created || !r.sessionCleanup.promisesSettled || r.code === 'CLEANUP')
    if (blocked === 'root-create') assert.ok(!f.calls.some(call => call.name === 'root-detach'))
  }
})
test('unresolved promises and rejected detach remain failed, never observed', async () => {
  for (const blocked of ['page-task', 'root-create', 'page-detach']) {
    const f = fixture({ invoke: ({ name, value }) => name === blocked ? new Promise(() => {}) : value })
    const r = await run(f); assert.equal(r.status, 'failed'); assert.equal(r.sessionCleanup.promisesSettled, false)
    assert.equal(r.timing.endedMs, 4000); assert.equal(r.snapshot_attempted, false)
  }
  const f = fixture({ invoke: ({ name, value }) => name === 'root-detach' ? Promise.reject(new Error('PRIVATE')) : value })
  const r = await run(f); assert.equal(r.code, 'CLEANUP'); assert.equal(r.sessionCleanup.promisesSettled, true)
  assert.equal(r.sessionCleanup.detached, 1)
})
test('creation or rejection after 3s and helper return cannot dispatch work or upgrade returned evidence', async () => {
  for (const reject of [false, true]) {
    const f = fixture({ invoke: ({ name, value, clock }) => name === 'root-create' ? clock.later(4000, value, reject) : value })
    const r = await run(f), frozen = JSON.stringify(r), calls = JSON.stringify(f.calls)
    assert.equal(r.status, 'failed'); assert.equal(r.sessionCleanup.promisesSettled, false)
    assert.equal(r.timing.endedMs, 4000)
    f.clock.advance(5000)
    for (let i = 0; i < 200; i++) await Promise.resolve()
    assert.equal(JSON.stringify(r), frozen); assert.equal(JSON.stringify(f.calls), calls)
    assert.equal(f.clock.timers.size, 0)
  }
})
test('abort is checked at actual dispatch and still permits bounded session cleanup', async () => {
  const f = fixture({ invoke: ({ name, value, controller }) => { if (name === 'root-create') controller.abort(); return value } })
  const r = await run(f); assert.equal(r.code, 'ABORTED'); assert.equal(r.status, 'failed')
  assert.ok(!f.calls.some(call => call.name === 'page-create')); assert.equal(r.sessionCleanup.detached, 1)
})
test('queued operation and detach dispatch recheck exact deadline after scheduling', async () => {
  for (const point of ['metadata', 'detach']) {
    const f = fixture()
    let tripped = false
    f.args.schedule = (fn, ms) => {
      const id = f.clock.schedule(fn, ms)
      if (!tripped && ((point === 'metadata' && f.calls.length === 0) ||
        (point === 'detach' && f.calls.filter(call => call.name === 'page-task').length === 2))) {
        tripped = true; f.clock.time = point === 'metadata' ? 3000 : 4000
      }
      return id
    }
    const r = await run(f); assert.equal(r.status, 'failed')
    if (point === 'metadata') assert.deepEqual(f.calls, [])
    else assert.ok(!f.calls.some(call => call.name.endsWith('-detach')))
  }
})
test('receipt validator rejects contradictory facts, unknown fields and absent observed proof', async () => {
  const f = fixture(), r = await run(f); finish(f, r)
  for (const mutate of [v => { v.snapshot_attempted = true }, v => { v.capture_ready = true },
    v => { v.extra = 'PRIVATE' }, v => { v.browser.userAgent = 'PRIVATE' }, v => { v.expectedPinMatched = false },
    v => { v.sessionCleanup.promisesSettled = false }, v => { v.timing.cleanupDeadlineMs++ },
    v => { v.timing.metadataCompletedMs = v.timing.operationsDeadlineMs },
    v => { v.timing.remainingAfterOrdinaryCleanupMs++ }]) {
    const bad = structuredClone(r); mutate(bad)
    assert.throws(() => validateGameplayProducerPreflight(bad, f.args.report, { executableSha256 }))
  }
  const failed = structuredClone(r); failed.status = 'failed'; failed.code = 'CLEANUP'; failed.expectedPinMatched = false
  assert.throws(() => validateGameplayProducerPreflight(failed, f.args.report, { executableSha256 }))
})
test('final continuation at the operations boundary is failed, never observed', async () => {
  const f = fixture(); let finalReads = 0
  f.args.now = () => {
    if (f.calls.filter(call => call.name === 'page-task').length === 2 && ++finalReads === 2) f.clock.time = 3000
    return f.clock.time
  }
  const r = await run(f); assert.equal(r.status, 'failed'); assert.equal(r.code, 'DEADLINE')
  assert.equal(r.timing.metadataCompletedMs, null); assert.equal(r.sessionCleanup.detached, 2)
})
test('runner keeps existing timer/workload/artifact recipe and hooks only after scenario return', () => {
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  const start = runner.indexOf('receipt.gameplayResources = await '), hook = runner.indexOf('receipt.heapProducerPreflight = await ')
  assert.ok(start > 0 && hook > start)
  assert.match(runner.slice(start, hook), /ownershipProbe === 'weak-v1'/)
  assert.equal((runner.match(/timer = setTimeout\(\(\) =>/g) ?? []).length, 1)
  assert.match(runner, /browserDeadlineAt = Date.now\(\) \+ receipt.browserCapMs/)
  assert.ok(runner.indexOf('clearTimeout(timer)') < runner.indexOf('producerCleanup(receipt.'))
  assert.match(runner, /assert\.deepEqual\(receipt.errors, \[\]/)
  const config = readFileSync(new URL('../scripts/tutorial-browser/browser-config.mjs', import.meta.url), 'utf8')
  assert.match(config, /chromiumSandbox: true/); assert.doesNotMatch(config, /--no-sandbox/)
})
