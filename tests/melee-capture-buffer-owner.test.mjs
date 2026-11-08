import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { ownBrowser } from '../scripts/native-ui-evidence/browser-owner.mjs'
const png = Buffer.from('89504e470d0a1a0a00000000', 'hex')
const observed = () => ({ viewport: { width: 960, height: 720 }, dpr: 1, userAgent: 'supplied fixture', renderers: [] })
function deferred() { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
async function fixture(t, { enabled = true } = {}) {
  const output = mkdtempSync(resolve(tmpdir(), 'capture-owner-')), controller = new AbortController()
  let clock = 1000, closed = false, nativeCalls = 0, evaluateCalls = 0
  t.mock.method(performance, 'now', () => clock)
  const hooks = {}, report = { observations: [], errors: [], warnings: [], injectedRequests: [], expectedErrors: [] }
  const context = new EventEmitter(), page = new EventEmitter(), pages = []
  context.route = context.unroute = page.route = page.unroute = async () => {}
  context.pages = () => pages
  page.setDefaultTimeout = page.setDefaultNavigationTimeout = () => {}
  page.isClosed = () => closed
  page.close = context.close = async () => { closed = true; pages.length = 0; context.emit('close') }
  page.evaluate = async () => { evaluateCalls++; return hooks.observe ? hooks.observe() : observed() }
  page.screenshot = async options => {
    nativeCalls++; hooks.options = options
    if (hooks.capture) return hooks.capture(options)
    if (options.path) writeFileSync(options.path, png, { flag: 'wx' })
    return png
  }
  context.newPage = async () => { pages.push(page); context.emit('page', page); return page }
  const browser = { newContext: async () => context, close: async () => context.close() }
  const owner = ownBrowser(browser, output, report, enabled ? { singleBufferScreenshot: { signal: controller.signal, deadlineMs: 5000 } } : {})
  owner.beginEpisode({ id: 'fixture' })
  await owner.browser.newContext(); await context.newPage()
  t.after(async () => { await owner.close(); rmSync(output, { recursive: true, force: true }) })
  return { owner, report, context, page, hooks, controller, output, clock: value => { clock = value }, counts: () => ({ nativeCalls, evaluateCalls }) }
}
test('actual owner reserves one buffer screenshot, records observation, and preserves fixed native PNG options', async t => {
  const f = await fixture(t), result = await f.page.screenshot({ timeout: 1000 })
  assert.equal(result, png)
  assert.deepEqual(f.hooks.options, { type: 'png', fullPage: false, timeout: 1000 })
  assert.deepEqual(f.report.bufferScreenshot, { attempted: 1, succeeded: 1, pending: false, status: 'succeeded', bytes: png.length, errors: [] })
  assert.equal(f.report.observations[0].screenshot, 'owned-buffer')
  assert.deepEqual(f.counts(), { nativeCalls: 1, evaluateCalls: 1 })
})
for (const [name, options] of Object.entries({ missing: undefined, path: { timeout: 100, path: 'bad.png' }, fullPage: { timeout: 100, fullPage: true },
  type: { timeout: 100, type: 'jpeg' }, zero: { timeout: 0 }, negative: { timeout: -1 }, infinite: { timeout: Infinity }, nan: { timeout: NaN },
  tooLong: { timeout: 10001 }, outsideRoute: { timeout: 4001 } }))
  test(`invalid ${name} is counted, sticky and never invokes native screenshot`, async t => {
    const f = await fixture(t)
    await assert.rejects(f.page.screenshot(options))
    await assert.rejects(f.page.screenshot({ timeout: 100 }))
    assert.equal(f.report.bufferScreenshot.attempted, 2); assert.equal(f.report.bufferScreenshot.succeeded, 0)
    assert.equal(f.report.errors.length, 2); assert.equal(f.counts().nativeCalls, 0)
  })
test('caught second screenshot remains fatal after first success', async t => {
  const f = await fixture(t); await f.page.screenshot({ timeout: 100 })
  await assert.rejects(f.page.screenshot({ timeout: 100 }))
  assert.equal(f.report.bufferScreenshot.attempted, 2); assert.equal(f.report.bufferScreenshot.succeeded, 1)
  assert.equal(f.report.bufferScreenshot.status, 'failed'); assert.equal(f.counts().nativeCalls, 1)
})
for (const [name, value] of Object.entries({ bytes: new Uint8Array(png), empty: Buffer.alloc(0), oversized: Buffer.alloc(8 * 1024 * 1024 + 1), notPng: Buffer.alloc(8) }))
  test(`native ${name} result rejects without success`, async t => {
    const f = await fixture(t); f.hooks.capture = () => value
    await assert.rejects(f.page.screenshot({ timeout: 1000 }))
    assert.equal(f.report.bufferScreenshot.succeeded, 0); assert.equal(f.report.bufferScreenshot.pending, false)
  })
for (const phase of ['observe', 'capture']) for (const reason of ['abort', 'route-expiry', 'action-expiry', 'clock-reversal', 'context-close', 'native-rejection'])
  test(`${phase} ${reason} cannot return a late accepted buffer`, async t => {
    const f = await fixture(t)
    f.hooks[phase] = async () => {
      if (reason === 'abort') f.controller.abort(Error('supplied abort'))
      if (reason === 'route-expiry') f.clock(5000)
      if (reason === 'action-expiry') f.clock(2000)
      if (reason === 'clock-reversal') f.clock(999)
      if (reason === 'context-close') await f.context.close()
      if (reason === 'native-rejection') throw Error('supplied native rejection')
      return phase === 'observe' ? observed() : png
    }
    await assert.rejects(f.page.screenshot({ timeout: 1000 }))
    assert.equal(f.report.bufferScreenshot.succeeded, 0); assert.equal(f.report.bufferScreenshot.pending, false)
    assert.equal(f.counts().nativeCalls, phase === 'observe' ? 0 : 1)
  })
for (const field of ['viewport', 'dpr']) test(`wrong observed ${field} is rejected before native capture`, async t => {
  const f = await fixture(t); f.hooks.observe = () => ({ ...observed(), [field]: field === 'dpr' ? 2 : { width: 961, height: 720 } })
  await assert.rejects(f.page.screenshot({ timeout: 1000 })); assert.equal(f.counts().nativeCalls, 0)
})
test('observation latency consumes the same screenshot allowance', async t => {
  const f = await fixture(t); f.hooks.observe = () => { f.clock(1250); return observed() }
  await f.page.screenshot({ timeout: 1000 }); assert.equal(f.hooks.options.timeout, 750)
})
for (const phase of ['observe', 'capture']) test(`cleanup waits for unknown ${phase} settlement and cannot authenticate a late result`, async t => {
  const f = await fixture(t), gate = deferred(), started = deferred()
  f.hooks[phase] = async () => { started.resolve(); await gate.promise; return phase === 'observe' ? observed() : png }
  const pending = f.page.screenshot({ timeout: 1000 }), rejected = assert.rejects(pending)
  await started.promise
  let settled = false
  const cleanup = f.owner.closeContexts().then(() => { settled = true })
  await Promise.resolve(); await Promise.resolve()
  assert.equal(settled, false); assert.equal(f.report.bufferScreenshot.pending, true)
  gate.resolve(); await rejected; await cleanup
  assert.equal(f.report.bufferScreenshot.succeeded, 0); assert.equal(f.report.bufferScreenshot.pending, false)
})
test('caught concurrent duplicate does not hide first pending native operation', async t => {
  const f = await fixture(t), gate = deferred(), started = deferred()
  f.hooks.capture = async () => { started.resolve(); await gate.promise; return png }
  const first = f.page.screenshot({ timeout: 1000 }), rejected = assert.rejects(first)
  await started.promise; await assert.rejects(f.page.screenshot({ timeout: 1000 }))
  assert.equal(f.report.bufferScreenshot.pending, true)
  gate.resolve(); await rejected
  assert.equal(f.report.bufferScreenshot.pending, false); assert.equal(f.report.bufferScreenshot.succeeded, 0)
})
test('default owner still requires an output path and preserves original path screenshot options', async t => {
  const f = await fixture(t, { enabled: false })
  await assert.rejects(f.page.screenshot({ timeout: 1000 }), /remain in evidence output/)
  const path = resolve(f.output, 'unchanged.png'); await f.page.screenshot({ path, timeout: 10001 })
  assert.deepEqual(f.hooks.options, { path, timeout: 10000 }); assert.equal(f.report.bufferScreenshot, undefined)
  assert.equal(f.report.observations[0].screenshot, 'unchanged.png')
})
