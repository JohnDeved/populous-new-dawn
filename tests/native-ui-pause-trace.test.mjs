import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, symlinkSync, linkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { pauseTraceLimits, assertPauseTraceVersions, acceptPauseTraceInventory, inspectPauseTraceStorage,
  createPauseTraceStorage, createPauseTraceOwner } from '../scripts/native-ui-evidence/pause-click-trace.mjs'
import { ownBrowser, artifactInventory } from '../scripts/native-ui-evidence/browser-owner.mjs'
import { runNativeUiEvidence } from '../scripts/native-ui-evidence/adapter.mjs'
import { initialEpisodeReport } from '../scripts/native-ui-evidence/ledger.mjs'
import { episodes, limits } from '../scripts/native-ui-evidence/policy.mjs'

const native = episodes.find(e => e.id === 'pause-checkpoint-native')
const fallback = episodes.find(e => e.id === 'pause-checkpoint-fallback')
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }
function fixture(t) {
  const output = mkdtempSync(resolve(tmpdir(), 'pause-trace-fixture-'))
  t.after(() => rmSync(output, { recursive: true, force: true })) // Only this test's fresh private fixture.
  return { output, storage: createPauseTraceStorage(output) }
}
function clock() {
  let time = 0, next = 0
  const timers = new Map()
  return { now: () => time, setTimer(fn, ms) { const id = ++next; timers.set(id, { fn, at: time + ms }); return id },
    clearTimer(id) { timers.delete(id) }, timers,
    tick(ms) { time += ms; for (const [id, timer] of [...timers]) if (timer.at <= time) { timers.delete(id); timer.fn() } },
    elapse(ms) { time += ms },
  }
}
class Context extends EventEmitter {
  calls = []
  constructor({ start, stop, close } = {}) {
    super()
    this.tracing = {
      start: async options => { this.calls.push(['start', options]); return start?.(options) },
      stop: async options => { this.calls.push(['stop', options]); if (stop) return stop(options); writeFileSync(options.path, 'inert ZIP stand-in') },
    }
    this.close = async (...args) => { this.calls.push(['close', ...args]); if (close) return close(...args); this.emit('close'); return 'closed' }
  }
  pages() { return [] }
  async newPage() { throw new Error('No browser page exists in this fixture') }
  async route() {} async unroute() {}
}
const ownerReport = () => ({ errors: [], warnings: [], expectedErrors: [], injectedRequests: [], observations: [] })
const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')

test('trace version qualification rejects a missing, mixed or changed runtime', () => {
  const good = { '@playwright/test': '1.63.0', 'playwright-core': '1.63.0' }
  assertPauseTraceVersions(good)
  for (const value of [{}, { ...good, 'playwright-core': '1.64.0' }, { ...good, extra: '1.63.0' }])
    assert.throws(() => assertPauseTraceVersions(value), /reviewed Playwright/)
})

test('trace storage is exclusively reserved inside the output and never adopts existing paths', t => {
  const { output, storage } = fixture(t)
  assert.equal(storage.work, resolve(output, 'pause-click-traces/work'))
  assert.equal(storage.archives, resolve(output, 'pause-click-traces/archives'))
  const marker = resolve(storage.root, 'retained.json'); writeFileSync(marker, 'old')
  assert.throws(() => createPauseTraceStorage(output), /EEXIST/)
  assert.equal(readFileSync(marker, 'utf8'), 'old')
  assert.ok(inspectPauseTraceStorage(output).allocatedBytes > 0)
})
test('trace threshold includes logical and allocated bytes, count bounds and receipt reserve', () => {
  const base = { bytes: 0, allocatedBytes: 0, files: 0, directories: 0 }
  const edge = pauseTraceLimits.bytes - pauseTraceLimits.receiptReserve
  acceptPauseTraceInventory({ ...base, bytes: edge, allocatedBytes: edge, files: 128, directories: 16 })
  for (const value of [{ bytes: edge + 1 }, { allocatedBytes: edge + 1 }, { files: 129 }, { directories: 17 }, { bytes: NaN }, { allocatedBytes: -1 }])
    assert.throws(() => acceptPauseTraceInventory({ ...base, ...value }))
  assert.deepEqual(pauseTraceLimits, { bytes: 8388608, receiptReserve: 65536, files: 128, directories: 16, stopMs: 1000 })
})
test('inventory accounts intermediate and exported copies together and rejects linked files', t => {
  const { output, storage } = fixture(t)
  writeFileSync(resolve(storage.work, 'native.trace'), 'raw trace')
  writeFileSync(resolve(storage.archives, 'native.zip'), 'archive')
  assert.equal(inspectPauseTraceStorage(output).bytes, 16)
  const file = resolve(storage.root, 'a.json'); writeFileSync(file, 'a')
  linkSync(file, resolve(storage.root, 'b.json'))
  assert.throws(() => inspectPauseTraceStorage(output), /private regular/)
})
test('broken root symlinks and nested symlinks cannot evade the trace inventory', t => {
  const output = mkdtempSync(resolve(tmpdir(), 'pause-trace-link-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  assert.equal(inspectPauseTraceStorage(output), null)
  symlinkSync(resolve(output, 'absent'), resolve(output, 'pause-click-traces'))
  assert.throws(() => inspectPauseTraceStorage(output), /symlinks/)
  const { output: second, storage } = fixture(t)
  symlinkSync(resolve(second, 'absent'), resolve(storage.work, 'link'))
  assert.throws(() => artifactInventory(second), /must not link/)
})
test('normal trace starts without snapshots and exports once before genuine context close', async t => {
  const { storage } = fixture(t), time = clock(), owner = createPauseTraceOwner(storage, time), context = new Context()
  await owner.attach(context, native)
  assert.equal(await context.close({ reason: 'fixture' }), 'closed')
  assert.deepEqual(context.calls.map(c => c[0]), ['start', 'stop', 'close'])
  assert.deepEqual(context.calls[0][1], { name: 'pause-native', snapshots: false, screenshots: false, sources: false, live: false })
  assert.deepEqual(context.calls[1][1], { path: resolve(storage.archives, 'native.zip') })
  assert.equal(time.timers.size, 0)
  owner.assertEpisode(native); owner.finish()
  assert.equal(JSON.parse(readFileSync(resolve(storage.root, 'final.json'))).records.native.status, 'completed')
})
test('only the two exact pause identities can claim one trace slot each', async t => {
  const { storage } = fixture(t), owner = createPauseTraceOwner(storage), ordinary = new Context()
  const close = ordinary.close
  await owner.attach(ordinary, episodes[0]); assert.equal(ordinary.close, close); assert.deepEqual(ordinary.calls, [])
  await assert.rejects(owner.attach(new Context(), { ...native, pauseMode: 'fallback' }), /identity mismatch/)
  const a = new Context(); await owner.attach(a, native); await a.close()
  await assert.rejects(owner.attach(new Context(), native), /one trace context/)
  const b = new Context(); await owner.attach(b, fallback); await b.close()
  owner.assertEpisode(native); owner.assertEpisode(fallback); owner.finish()
})
test('start rejection remains first trace failure while genuine close is still called', async t => {
  const { storage } = fixture(t), owner = createPauseTraceOwner(storage), cause = new Error('start failed')
  const context = new Context({ start() { throw cause } })
  await assert.rejects(owner.attach(context, native), e => e === cause)
  await context.close()
  assert.equal(owner.report.records.native.failure.stage, 'start')
  assert.equal(context.calls.filter(c => c[0] === 'close').length, 1)
  assert.throws(() => owner.assertEpisode(native), /did not complete/)
  assert.throws(() => owner.finish(), /incomplete/)
})
test('stop rejection is retained separately and does not make genuine close throw', async t => {
  const { storage } = fixture(t), owner = createPauseTraceOwner(storage)
  const context = new Context({ stop() { throw new Error('stop failed') } })
  await owner.attach(context, native); assert.equal(await context.close(), 'closed')
  assert.equal(owner.report.records.native.failure.stage, 'stop')
  assert.equal(owner.report.records.native.context, 'closed')
  assert.throws(() => owner.assertEpisode(native))
})
test('fixed stop timeout closes context and cannot become successful after late fulfillment', async t => {
  const { storage } = fixture(t), time = clock(), pending = deferred(), owner = createPauseTraceOwner(storage, time)
  const context = new Context({ stop: () => pending.promise })
  await owner.attach(context, native)
  const closing = context.close(); await flush(); assert.equal(time.timers.size, 1)
  time.tick(1000); await closing
  const failure = owner.report.records.native.failure
  pending.resolve(); await flush()
  assert.equal(owner.report.records.native.failure, failure)
  assert.equal(owner.report.records.native.stop, 'timed-out')
  assert.equal(owner.report.records.native.status, 'failed'); assert.equal(time.timers.size, 0)
  assert.equal(context.calls.filter(c => c[0] === 'close').length, 1)
})
test('late stop rejection has a sink and keeps the first timeout immutable', async t => {
  const { storage } = fixture(t), time = clock(), pending = deferred(), owner = createPauseTraceOwner(storage, time)
  const context = new Context({ stop: () => pending.promise })
  await owner.attach(context, native); const closing = context.close(); await flush(); time.tick(1000); await closing
  const failure = owner.report.records.native.failure
  pending.reject(new Error('late rejection')); await flush()
  assert.equal(owner.report.records.native.failure, failure); assert.ok(Object.isFrozen(failure))
})
test('pending start cannot admit a new stop after the close grace expired', async t => {
  const { storage } = fixture(t), time = clock(), pending = deferred(), owner = createPauseTraceOwner(storage, time)
  const context = new Context({ start: () => pending.promise })
  const attaching = owner.attach(context, native), rejected = assert.rejects(attaching)
  await flush(); const closing = context.close(); await flush(); time.tick(1000); await closing
  pending.resolve(); await rejected; await flush()
  assert.equal(context.calls.filter(c => c[0] === 'stop').length, 0)
  assert.equal(context.calls.filter(c => c[0] === 'close').length, 1)
  assert.equal(owner.report.records.native.status, 'failed')
})
test('late synchronous settlement is rejected even before the timer callback runs', async t => {
  const { storage } = fixture(t), time = clock(), owner = createPauseTraceOwner(storage, time)
  const context = new Context({ stop({ path }) { time.elapse(1000); writeFileSync(path, 'late') } })
  await owner.attach(context, native); await context.close()
  assert.equal(owner.report.records.native.stop, 'timed-out'); assert.equal(time.timers.size, 0)
})
test('concurrent closes share one promise and preserve the first real close arguments', async t => {
  const { storage } = fixture(t), owner = createPauseTraceOwner(storage), context = new Context()
  await owner.attach(context, native)
  const one = context.close({ reason: 'first' }), two = context.close({ reason: 'second' })
  assert.equal(one, two); await one
  assert.equal(context.calls.filter(c => c[0] === 'stop').length, 1)
  assert.deepEqual(context.calls.at(-1), ['close', { reason: 'first' }])
})
test('genuine close error identity survives a separate trace failure', async t => {
  const { storage } = fixture(t), owner = createPauseTraceOwner(storage), cause = Object.freeze({ close: true })
  const context = new Context({ stop() { throw new Error('trace') }, close() { throw cause } })
  await owner.attach(context, native)
  await assert.rejects(context.close(), e => e === cause)
  assert.equal(owner.report.records.native.failure.stage, 'stop')
  assert.equal(owner.report.records.native.context, 'close-failed')
})
test('timer setup or synchronous expiry cannot prevent genuine context close', async t => {
  for (const timer of [() => { throw new Error('timer setup') }, fn => { fn(); return 1 }]) {
    const { storage } = fixture(t), owner = createPauseTraceOwner(storage, { setTimer: timer, clearTimer() {} })
    const context = new Context()
    await owner.attach(context, native); await context.close()
    assert.equal(context.calls.filter(c => c[0] === 'close').length, 1)
    assert.equal(owner.report.records.native.status, 'failed')
  }
})
test('unexpected context closure leaves partial trace evidence unaccepted', async t => {
  const { storage } = fixture(t), owner = createPauseTraceOwner(storage), context = new Context()
  await owner.attach(context, native); context.emit('close'); await context.close()
  assert.equal(owner.report.records.native.failure.stage, 'context')
  assert.equal(context.calls.filter(c => c[0] === 'stop').length, 0)
  assert.throws(() => owner.finish(), /incomplete/)
})
test('actual browser owner keeps acquired traced context capacity through attach and cleanup', async t => {
  const { output, storage } = fixture(t), start = deferred(), context = new Context({ start: () => start.promise })
  const report = ownerReport(), raw = { async newContext() { return context }, async close() {} }
  const owner = ownBrowser(raw, output, report, { pauseTraceStorage: storage })
  owner.beginEpisode(native)
  const creating = owner.browser.newContext(), rejected = assert.rejects(creating, /Late traced context/)
  await flush(); const closing = owner.closeContexts(); await flush()
  assert.throws(() => owner.beginEpisode(fallback))
  start.resolve(); await closing; await rejected
  assert.equal(context.calls.filter(c => c[0] === 'close').length, 1)
  await owner.close(); owner.finishTraces()
})
test('ordinary owner path stays untraced while final trace receipts are still bounded', async t => {
  const { output, storage } = fixture(t), context = new Context(), report = ownerReport()
  const owner = ownBrowser({ async newContext() { return context }, async close() {} }, output, report, { pauseTraceStorage: storage })
  owner.beginEpisode(episodes[0]); await owner.browser.newContext(); await owner.closeContexts()
  assert.deepEqual(context.calls.map(c => c[0]), ['close'])
  owner.assertTraceEpisode(episodes[0]); await owner.close(); owner.finishTraces()
  assert.deepEqual(report.pauseClickTraces.records, {})
})
test('infrastructure wiring retains source ownership, caps and primary-error ordering', () => {
  const worker = read('scripts/native-ui-evidence/browser-worker.mjs'), adapter = read('scripts/native-ui-evidence/adapter.mjs')
  assert.match(worker, /createPauseTraceStorage\(output\)/)
  assert.ok(worker.indexOf('assertPauseTraceVersions(traceVersions)') < worker.indexOf('await chromium.launch'))
  assert.match(worker, /browserIdentity\.launch = \{ \.\.\.config\.launch, tracesDir: pauseTraceStorage\.work \}/)
  assert.ok(worker.indexOf('createPauseTraceStorage(output)') < worker.indexOf('await chromium.launch'))
  assert.match(adapter, /owner\.beginEpisode\(episode\)/)
  assert.ok(adapter.indexOf('record.cleanupVerified = true') < adapter.indexOf('owner.assertTraceEpisode(episode)'))
  assert.ok(adapter.indexOf('await owner.close()') < adapter.indexOf('owner.finishTraces()'))
  assert.match(adapter, /try \{ primaryError\.cleanupError = String\(cleanupError\) \} catch \{\}/)
  assert.deepEqual(limits, { buildMs: 120000, browserMs: 720000, jobMinutes: 20, maxContexts: 2, maxPages: 2,
    screenshots: 100, artifactBytes: 268435456, logBytes: 8388608, heapMiB: 768, cleanupMs: 5000 })
  assert.equal(episodes.length, 9); assert.equal(native.capMs, 90000); assert.equal(fallback.capMs, 90000)
  assert.equal(native.owner, 'candidate'); assert.equal(fallback.owner, 'candidate')
})
test('canonical native evidence check selects the complete tracing regression and inputs', () => {
  const registry = JSON.parse(read('engineering/checks.json'))
  const check = registry.checks.find(c => c.id === 'native-ui-evidence-tests')
  assert.ok(check.args.includes('tests/native-ui-pause-trace.test.mjs'))
  assert.ok(check.inputs.includes('tests/native-ui-pause-trace.test.mjs'))
  assert.ok(check.triggerPaths.includes('tests/native-ui-pause-trace.test.mjs'))
  assert.ok(check.inputs.includes('scripts/native-ui-evidence'))
})

// Actual exported adapter, stopped before episode creation: real owner/finalization
// and an owned exclusive receipt collision, not a browser or nine-episode pass.
for (const frozen of [true, false]) test(`adapter retains ${frozen ? 'frozen' : 'ordinary'} primary identity when final trace receipt fails`, async t => {
  const { output, storage } = fixture(t), cause = new Error('original episode admission failure')
  if (frozen) Object.freeze(cause)
  writeFileSync(resolve(storage.root, 'final.json'), 'retained collision')
  let closed = 0
  await assert.rejects(runNativeUiEvidence({
    browser: { async newContext() { throw new Error('No context may be created') }, async close() { closed++ } },
    candidateRoot: output, infrastructureRoot: output, url: 'http://inert.invalid/', output,
    signal: { throwIfAborted() { throw cause } }, pauseTraceStorage: storage,
  }), error => error === cause)
  assert.equal(closed, 1)
  assert.equal(readFileSync(resolve(storage.root, 'final.json'), 'utf8'), 'retained collision')
  const report = JSON.parse(readFileSync(resolve(output, 'episodes.json')))
  assert.equal(report.status, 'failed'); assert.equal(report.cleanupVerified, true)
  assert.match(report.traceError, /EEXIST/)
  assert.equal(Object.hasOwn(cause, 'cleanupError'), !frozen)
})

// Source-bound finalization-only seam: deliberately replace only the imported
// episode list and acceptSeries policy. Actual function text, owner, report and
// filesystem remain real. This does not qualify the nine production episodes.
function finalizationOnlyAdapter() {
  const source = read('scripts/native-ui-evidence/adapter.mjs')
  const prefix = 'export async function runNativeUiEvidence('
  assert.equal(source.split(prefix).length, 2)
  const functionSource = source.slice(source.indexOf(prefix)).replace(/^export /, '')
  const emptyPolicy = records => {
    assert.equal(records.length, episodes.length)
    assert.ok(records.every(record => record.status === 'not-run'))
  }
  return new Function('mkdirSync', 'writeFileSync', 'resolve', 'episodes', 'acceptSeries',
    'ownBrowser', 'artifactInventory', 'initialEpisodeReport', `return (${functionSource})`)(
    mkdirSync, writeFileSync, resolve, [], emptyPolicy, ownBrowser, artifactInventory, initialEpisodeReport)
}
for (const collision of [true, false]) test(`finalization-only adapter ${collision ? 'rejects trace failure without primary' : 'can succeed without receipt collision'}`, async t => {
  const { output, storage } = fixture(t)
  if (collision) writeFileSync(resolve(storage.root, 'final.json'), 'retained collision')
  let closed = 0
  const result = finalizationOnlyAdapter()({
    browser: { async newContext() { throw new Error('No context may be created') }, async close() { closed++ } },
    candidateRoot: output, infrastructureRoot: output, url: 'http://inert.invalid/', output,
    signal: { throwIfAborted() { throw new Error('Empty policy has no episode admission') } }, pauseTraceStorage: storage,
  })
  if (collision) await assert.rejects(result, /EEXIST/)
  else assert.equal((await result).status, 'passed')
  assert.equal(closed, 1)
  const report = JSON.parse(readFileSync(resolve(output, 'episodes.json')))
  assert.equal(report.status, collision ? 'failed' : 'passed')
  assert.equal(report.cleanupVerified, true)
  assert.equal(Object.hasOwn(report, 'traceError'), collision)
})
