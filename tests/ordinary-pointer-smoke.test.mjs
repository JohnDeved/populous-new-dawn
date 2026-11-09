import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import smoke from '../scripts/browser-performance/ordinary-pointer-smoke.mjs'
import { ordinaryPointerSmokeSelection as selected, ordinaryPointerSmokeArtifact as artifact,
  ordinaryPointerSmokePolicy as policy, closeOrdinaryPointerSmokeOwner as closeOwner } from '../scripts/browser-performance/ordinary-pointer-smoke-policy.mjs'
const head = 'a'.repeat(40)
const event = () => ({ action: 'ready_for_review', pull_request: { draft: false, head: { sha: head },
  labels: [{ name: `op-smoke:${head}` }] } })
test('only exact-head reviewed Ready selection enables the separate smoke', () => {
  assert.equal(`op-smoke:${head}`.length, 49)
  assert.equal(selected(event(), 'pull_request', head, 'ordinary-pointer-smoke'), true)
  for (const mutate of [e => { e.action = 'synchronize' }, e => { e.pull_request.draft = true },
    e => { e.pull_request.head.sha = 'b'.repeat(40) }, e => { e.pull_request.labels = [] },
    e => { e.pull_request.labels[0].name = 'ordinary-pointer-smoke' }]) {
    const e = event(); mutate(e); assert.equal(selected(e, 'pull_request', head, 'ordinary-pointer-smoke'), false)
  }
  assert.equal(selected(event(), 'workflow_dispatch', head, 'ordinary-pointer-smoke'), false)
  assert.equal(selected(event(), 'pull_request', head, 'snapshot-protocol'), false)
})
test('bounded artifact preserves typed bytes and special/falsey scalar diagnostics', () => {
  const values = new Float64Array([NaN, Infinity, -Infinity, -0, 0])
  const data = JSON.parse(artifact({ values, n: NaN, z: -0, absent: undefined, failure: null, flag: false }))
  assert.equal(data.values.type, 'Float64Array'); assert.equal(data.values.length, 5)
  assert.deepEqual(Buffer.from(data.values.base64, 'base64'), Buffer.from(values.buffer))
  assert.deepEqual(data.n, { type: 'Number', value: 'NaN' })
  assert.deepEqual(data.z, { type: 'Number', value: '-0' })
  assert.deepEqual(data.absent, { type: 'Undefined' }); assert.equal(data.failure, null); assert.equal(data.flag, false)
  assert.throws(() => artifact('x'.repeat(policy.artifactBytes)), /fixed cap/)
})
const goodResult = () => ({ outcome: { status: 'completed' }, comparisonEligible: false,
  cleanupConfirmed: true, observerCleanupConfirmed: true, operationSettled: true, waitCleanupFailed: false,
  packet: { rows: new Float64Array([NaN, -0]) } })
function fixture(t) {
  const output = mkdtempSync(join(tmpdir(), 'pnd-ordinary-smoke-test-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  const calls = [], listeners = {}, page = { setDefaultTimeout: n => calls.push(['timeout', n]), on(name, fn) { listeners[name] = fn } }
  const context = { newPage: async () => page, close: async () => { calls.push('context-close') } }
  const browser = { newContext: async options => { calls.push(['context', options]); return context },
    close: async () => { calls.push('browser-close') } }
  return { output, calls, listeners, page, context, browser, source: { commit: head }, expectedRevision: head,
    prepare: async ({ receipt }) => { calls.push('prepare'); receipt.readerAdmission = 'admitted'; return () => calls.push('verify') },
    capture: async options => { calls.push(['capture', options.enabled, options.page === page]); return goodResult() } }
}
test('actual smoke owner runs one admitted capture and closes exclusive owners', async t => {
  const f = fixture(t), result = await smoke(f)
  assert.equal(result.status, 'passed'); assert.equal(result.comparisonEligible, false)
  assert.deepEqual(f.calls[0], ['context', { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 }])
  assert.deepEqual(f.calls.slice(2), ['prepare', ['capture', true, true], 'verify', 'context-close', 'browser-close'])
  assert.equal(result.operationSettled, true); assert.equal(result.rawWritten, true)
  assert.equal(JSON.parse(readFileSync(join(f.output, 'ordinary-pointer-raw.json'))).packet.rows.type, 'Float64Array')
})
test('reader refusal prevents adapter opt-in but still closes owners', async t => {
  const f = fixture(t); f.prepare = async () => () => {}
  await assert.rejects(smoke(f), /Runtime readers must be admitted/)
  assert.equal(f.calls.some(x => Array.isArray(x) && x[0] === 'capture'), false)
  assert.deepEqual(f.calls.slice(-2), ['context-close', 'browser-close'])
})
test('failed adapter retains typed raw outcome and is never accepted as smoke pass', async t => {
  const f = fixture(t)
  f.capture = async () => ({ ...goodResult(), outcome: { status: 'failed', error: null }, cleanupConfirmed: false })
  await assert.rejects(smoke(f), /Adapter failed/)
  const raw = JSON.parse(readFileSync(join(f.output, 'ordinary-pointer-raw.json')))
  assert.equal(raw.outcome.error, null)
  const receipt = JSON.parse(readFileSync(join(f.output, 'ordinary-pointer-smoke.json')))
  assert.equal(receipt.status, 'failed'); assert.equal(receipt.adapter.cleanupConfirmed, false)
  assert.equal(receipt.contextCleanup.confirmed, true); assert.equal(receipt.browserCleanup.confirmed, true)
})
test('falsey primary capture failures survive secondary context/browser rejection', async t => {
  for (const primary of [null, undefined, false, 0, '']) {
    const f = fixture(t); f.capture = async () => { throw primary }
    f.context.close = async () => { throw false }; f.browser.close = async () => { throw 0 }
    let caught = false
    try { await smoke(f) } catch (error) { caught = true; assert.equal(error, primary) }
    assert.equal(caught, true)
    const receipt = JSON.parse(readFileSync(join(f.output, 'ordinary-pointer-smoke.json')))
    assert.equal(receipt.contextCleanup.error, false); assert.equal(receipt.browserCleanup.error, 0)
  }
})
test('cleanup falsey failures, timer errors and delayed completion are explicit', async () => {
  for (const error of [null, undefined, false, 0]) assert.equal((await closeOwner(async () => { throw error })).error, error)
  const clock = [0, 2000]
  assert.equal((await closeOwner(async () => {}, { now: () => clock.shift(), schedule: () => 1, cancel() {} })).confirmed, false)
  const result = await closeOwner(async () => {}, { schedule: () => 1, cancel() { throw null }, now: () => 0 })
  assert.equal(result.confirmed, false); assert.equal(result.timerCleanupError, null)
})
test('outer timeout closes owners without inferring operation settlement', async t => {
  const f = fixture(t); let finish, pending
  f.capture = () => new Promise(resolve => { finish = resolve })
  f.watchdog = async operation => {
    const controller = new AbortController()
    pending = operation(controller.signal).catch(() => {})
    while (!finish) await Promise.resolve()
    controller.abort(null)
    return { status: 'timed-out', error: null, timerCleanupFailed: false }
  }
  let caught = false
  try { await smoke(f) } catch (error) { caught = true; assert.equal(error, null) }
  assert.equal(caught, true)
  const receipt = JSON.parse(readFileSync(join(f.output, 'ordinary-pointer-smoke.json')))
  assert.equal(receipt.operationSettled, false); assert.equal(receipt.status, 'failed')
  assert.deepEqual(f.calls.slice(-2), ['context-close', 'browser-close'])
  assert.equal(existsSync(join(f.output, 'ordinary-pointer-raw.json')), false)
  finish(goodResult()); await pending // late result cannot change frozen failure receipt to pass
  assert.equal(existsSync(join(f.output, 'ordinary-pointer-raw.json')), false)
  assert.equal(JSON.parse(readFileSync(join(f.output, 'ordinary-pointer-smoke.json'))).status, 'failed')
})
test('hosted route is head-bound and keeps the default snapshot baseline separate', () => {
  const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const workflow = read('.github/workflows/tutorial-browser.yml')
  const job = workflow.slice(workflow.indexOf('\n  ordinary-pointer-smoke:\n'))
  assert.match(job, /if: \$\{\{ github.event.pull_request.draft == false && contains\(github.event.pull_request.labels.\*.name, format\('op-smoke:\{0\}', github.event.pull_request.head.sha\)\) \}\}/)
  assert.match(job, /timeout-minutes: 6/); assert.match(job, /ref: \$\{\{ github.sha \}\}/)
  assert.match(job, /persist-credentials: false/)
  assert.match(job, /POPULOUS_BROWSER_SCENARIO: ordinary-pointer-smoke/)
  assert.equal((job.match(/run: node scripts\/tutorial-browser\/run.mjs/g) ?? []).length, 1)
  assert.match(job, /stat.size <= 8 \* 1024 \* 1024/); assert.match(job, /total <= 32 \* 1024 \* 1024/)
  assert.match(job, /always\(\) && steps.smoke-bounds.outcome == 'success'/)
  assert.doesNotMatch(job, /: write|secrets\.|continue-on-error|--no-sandbox|enable-unsafe/)
  const runner = read('scripts/tutorial-browser/run.mjs')
  assert.match(runner, /if \(selectedScenario === 'ordinary-pointer-smoke'\) \{/)
  assert.match(runner, /policy.ordinaryPointerSmokeSelection/)
  assert.match(runner, /receipt.ordinaryPointerSmoke = \{\}/)
  assert.match(runner, /receipt: receipt.ordinaryPointerSmoke/)
  assert.match(runner, /receipt.snapshotSmoke = await/)
  const implementation = read('scripts/browser-performance/ordinary-pointer-smoke.mjs')
  assert.match(implementation, /readerSource.profile && readerSource.importSha256 === readerImportSha256/)
  assert.match(implementation, /recordSnapshotReaders/)
  assert.ok(implementation.indexOf("receipt.readerAdmission, 'admitted'") < implementation.indexOf('result = await capture'))
  assert.match(implementation, /loadSnapshot\(\{ page, url, fixture, expectedRevision \}\)/)
  assert.match(implementation, /assertSnapshotAdmission\(receipt.before, fixture\)/)
  assert.match(implementation, /await handle.dispose\(\)/)
})
test('cleanup-time runtime errors cannot produce a passed smoke', async t => {
  for (const type of ['pageerror', 'crash', 'console']) {
    const f = fixture(t)
    f.context.close = async () => f.listeners[type](type === 'console' ? { type: () => 'error', text: () => 'late error' } : Error('late error'))
    await assert.rejects(smoke(f), /Runtime errors observed through owner cleanup/)
    const receipt = JSON.parse(readFileSync(join(f.output, 'ordinary-pointer-smoke.json')))
    assert.equal(receipt.status, 'failed'); assert.equal(receipt.errors.length, 1)
  }
})
test('receipt write failure cannot mask an existing falsey primary', async t => {
  const f = fixture(t), receipt = {}
  f.capture = async () => { throw null }
  f.context.close = async () => { const path = join(f.output, 'ordinary-pointer-smoke.json'); rmSync(path); mkdirSync(path) }
  let caught = false
  try { await smoke({ ...f, receipt }) } catch (error) { caught = true; assert.equal(error, null) }
  assert.equal(caught, true); assert.equal(receipt.receiptWriteFailed, true)
  assert.match(receipt.receiptWriteError, /EISDIR/)
})
test('late preparation cannot overwrite a terminal receipt', async t => {
  const f = fixture(t); let finish, saveLate, preparation, pending
  f.prepare = ({ save, receipt }) => { saveLate = save; preparation = receipt; return new Promise(resolve => { finish = resolve }) }
  f.watchdog = async operation => {
    const c = new AbortController(); pending = operation(c.signal).catch(() => {})
    while (!finish) await Promise.resolve()
    // Clock/timer failure need not signal abort; terminal state still blocks late writes.
    return { status: 'failed', error: false, timerCleanupFailed: false }
  }
  try { await smoke(f); assert.fail('must reject') } catch (error) { assert.equal(error, false) }
  const before = readFileSync(join(f.output, 'ordinary-pointer-smoke.json'), 'utf8')
  preparation.readerAdmission = 'admitted'; assert.throws(saveLate, /terminal/)
  finish(() => {}); await pending
  assert.equal(readFileSync(join(f.output, 'ordinary-pointer-smoke.json'), 'utf8'), before)
  assert.equal(f.calls.some(x => Array.isArray(x) && x[0] === 'capture'), false)
})
test('actual runner smoke cleanup branch avoids duplicate unbounded browser close', async () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  const start = source.indexOf("  if (selectedScenario === 'ordinary-pointer-trace') {", source.indexOf('} finally {\n  clearTimeout(timer)'))
  assert.ok(start > 0)
  const end = source.indexOf('  // The original timer', start)
  const run = new (Object.getPrototypeOf(async function () {}).constructor)(
    'selectedScenario', 'receipt', 'context', 'browser', 'server', 'closeOrdinaryPointerSmokeOwner', 'process', source.slice(start, end))
  let closes = 0, serverCloses = 0, boundedCalls = 0
  const browser = { close: async () => { closes++ } }, server = { close: async () => { serverCloses++ } }
  const bounded = async fn => { boundedCalls++; return closeOwner(fn) }
  const receipt = { ordinaryPointerSmoke: { browserCleanup: { confirmed: true } } }
  await run('ordinary-pointer-smoke', receipt, undefined, browser, server, bounded, {})
  assert.equal(closes, 0); assert.equal(serverCloses, 1); assert.equal(boundedCalls, 1)
  assert.equal(receipt.cleanupVerified, true)
  const uncertain = {}, processState = {}
  await run('ordinary-pointer-smoke', uncertain, undefined, browser, server, async () => ({ confirmed: false }), processState)
  assert.equal(uncertain.cleanupVerified, false); assert.equal(uncertain.status, 'failed'); assert.equal(processState.exitCode, 1)
})
