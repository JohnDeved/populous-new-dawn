import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkSelectorRecovery } from '../scripts/check-browser-selector-recovery.mjs'

// Complete real module imports; browser/DOM/WebGL ports and elapsed time are supplied.
// No browser, network, native renderer, real deadline or screenshot is exercised.
const has = (value, key) => Object.hasOwn(value, key)
const reasons = [
  ['Error', new Error('primary')], ['undefined', undefined], ['null', null],
  ['false', false], ['zero', 0], ['NaN', NaN], ['empty string', ''],
  ['symbol', Symbol('primary')], ['object', Object.freeze({ reason: 'primary' })],
  ['hostile string conversion', Object.freeze({ toString() { throw new Error('must not coerce') } })],
]

function fixture(t, options = {}) {
  const output = mkdtempSync(join(tmpdir(), 'selector-cleanup-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  const receipt = join(output, 'selector-recovery.json')
  const calls = []
  let hold, ready = false, generation = 1, clockReads = 0, unroutes = 0
  let receiptPresentDuringClose
  t.mock.method(performance, 'now', () => clockReads++ === 0 ? 0 : 10000)
  const chain = {
    or() { return this }, filter() { return this }, first() { return this },
    getByRole() { return this }, async waitFor() {}, async click() {},
    async isVisible() { return false }, async isDisabled() { return true },
    async isEnabled() { return true }, async count() { return 0 },
  }
  const extension = {
    async evaluate() {
      calls.push('restore')
      if (has(options, 'restoreError')) throw options.restoreError
      ready = true; generation++
    },
    async dispose() {
      calls.push('dispose')
      if (has(options, 'disposeError')) throw options.disposeError
    },
  }
  const scene = {
    async waitFor() {},
    async getAttribute(name) {
      if (name === 'data-ready') return ready ? 'true' : null
      assert.equal(name, 'data-generation'); return String(generation)
    },
    async evaluate() { return ready ? 'visible' : 'hidden' },
    async evaluateHandle() { ready = false; calls.push('lose-context'); return extension },
  }
  const retry = {
    async waitFor() {},
    async click() { ready = true; calls.push('retry') },
    async count() { return ready ? 0 : 1 },
  }
  const page = {
    setDefaultTimeout(value) { assert.equal(value, 15000) },
    setDefaultNavigationTimeout(value) { assert.equal(value, 30000) },
    on(name, callback) { assert.equal(name, 'pageerror'); assert.equal(typeof callback, 'function') },
    locator(selector) { return selector === 'canvas[data-world-scene]' ? scene : chain },
    getByRole(role, options) { return role === 'button' && options.name === 'Retry scene' ? retry : chain },
    async route(pattern, handler) {
      assert.equal(pattern, '**/original/world-selector/globes/sun.png')
      calls.push('route'); hold = handler
    },
    async goto(url, options2) {
      assert.equal(url, 'supplied-url'); assert.deepEqual(options2, { waitUntil: 'domcontentloaded' })
      calls.push('goto')
      if (!has(options, 'gotoError') || options.activeHeld) {
        // The real handler is retained and released by the actual helper. Do not
        // await it here: that would prevent entry into the cleanup that releases it.
        hold({ async abort(reason) {
          assert.equal(reason, 'failed'); calls.push('abort')
          if (has(options, 'abortError')) throw options.abortError
        } })
      }
      if (has(options, 'gotoError')) throw options.gotoError
    },
    async unrouteAll(options2) {
      assert.deepEqual(options2, { behavior: 'wait' }); calls.push('unroute'); unroutes++
      if (options.unrouteFailures?.has(unroutes)) throw options.unrouteFailures.get(unroutes)
    },
    async screenshot() { calls.push('screenshot') },
    async waitForFunction() { assert.equal(ready, true) },
    keyboard: { async press(key) { assert.equal(key, 'Escape'); calls.push('escape') } },
  }
  const context = {
    async newPage() {
      calls.push('newPage')
      if (has(options, 'newPageError')) throw options.newPageError
      return page
    },
    async close() {
      calls.push('close'); receiptPresentDuringClose = existsSync(receipt)
      await Promise.resolve()
      calls.push('close-settled')
      if (has(options, 'closeError')) throw options.closeError
    },
  }
  const browser = { async newContext(options2) {
    assert.deepEqual(options2, { viewport: { width: 640, height: 480 } })
    calls.push('newContext')
    if (has(options, 'newContextError')) throw options.newContextError
    return context
  } }
  return { calls, receipt, run: () => checkSelectorRecovery({ browser, url: 'supplied-url', output }),
    receiptPresentDuringClose: () => receiptPresentDuringClose }
}

async function rejected(run) {
  let failed = false, reason
  try { await run() } catch (error) { failed = true; reason = error }
  assert.equal(failed, true)
  return reason
}

function aggregate(error, reasons) {
  assert.ok(error instanceof AggregateError)
  assert.equal(Object.hasOwn(error, 'cause'), true)
  assert.ok(Object.is(error.cause, reasons[0]))
  assert.equal(error.errors.length, reasons.length)
  reasons.forEach((reason, i) => assert.ok(Object.is(error.errors[i], reason)))
}

for (const [label, primary] of reasons) {
  for (const cleanup of ['none', 'unroute', 'close', 'both']) {
    test(`navigation ${label}; cleanup ${cleanup}`, async t => {
      const unroute = new Error('unroute'), close = new Error('close')
      const options = { gotoError: primary }
      const errors = []
      if (cleanup === 'unroute' || cleanup === 'both') {
        options.unrouteFailures = new Map([[1, unroute]]); errors.push(unroute)
      }
      if (cleanup === 'close' || cleanup === 'both') { options.closeError = close; errors.push(close) }
      const f = fixture(t, options), actual = await rejected(f.run)
      if (errors.length) aggregate(actual, [primary, ...errors])
      else assert.ok(Object.is(actual, primary))
      assert.deepEqual(f.calls, ['newContext', 'newPage', 'route', 'goto', 'unroute', 'close', 'close-settled'])
      assert.equal(existsSync(f.receipt), false)
    })
  }
}

for (const [label, reason] of reasons) {
  test(`active held abort ${label} preserves primary and skips unsafe unroute`, async t => {
    const primary = new Error('navigation'), close = new Error('close')
    const f = fixture(t, { gotoError: primary, activeHeld: true, abortError: reason, closeError: close })
    aggregate(await rejected(f.run), [primary, reason, close])
    assert.deepEqual(f.calls, ['newContext', 'newPage', 'route', 'goto', 'abort', 'close', 'close-settled'])
    assert.equal(existsSync(f.receipt), false)
  })
  test(`WebGL restore ${label} survives disposal failure`, async t => {
    const dispose = new Error('dispose'), f = fixture(t, { restoreError: reason, disposeError: dispose })
    aggregate(await rejected(f.run), [reason, dispose])
    assert.deepEqual(f.calls.slice(-5), ['restore', 'dispose', 'unroute', 'close', 'close-settled'])
    assert.equal(existsSync(f.receipt), false)
  })
  test(`single WebGL disposal ${label} stays exact`, async t => {
    const f = fixture(t, { disposeError: reason })
    assert.ok(Object.is(await rejected(f.run), reason))
    assert.equal(f.calls.filter(x => x === 'dispose').length, 1)
    assert.deepEqual(f.calls.slice(-3), ['unroute', 'close', 'close-settled'])
    assert.equal(existsSync(f.receipt), false)
  })
}

test('held release success precedes unroute after navigation failure', async t => {
  const primary = new Error('navigation'), f = fixture(t, { gotoError: primary, activeHeld: true })
  assert.equal(await rejected(f.run), primary)
  assert.deepEqual(f.calls, ['newContext', 'newPage', 'route', 'goto', 'abort', 'unroute', 'close', 'close-settled'])
})

test('failed initial release remains primary; final release failure does not skip close', async t => {
  const abort = new Error('abort'), close = new Error('close')
  const f = fixture(t, { abortError: abort, closeError: close })
  aggregate(await rejected(f.run), [abort, abort, close])
  assert.equal(f.calls.filter(x => x === 'abort').length, 1, 'one actual route.abort call')
  assert.equal(f.calls.includes('unroute'), false)
  assert.deepEqual(f.calls.slice(-2), ['close', 'close-settled'])
  assert.equal(existsSync(f.receipt), false)
})

test('inner primary/disposal failures remain ordered when outer cleanup also fails', async t => {
  const primary = undefined, dispose = null, unroute = false, close = 0
  const f = fixture(t, { restoreError: primary, disposeError: dispose,
    unrouteFailures: new Map([[2, unroute]]), closeError: close })
  const actual = await rejected(f.run)
  aggregate(actual, [primary, dispose, unroute, close])
  assert.equal(existsSync(f.receipt), false)
})

for (const cleanup of ['unroute', 'close', 'both']) {
  test(`completed supplied scenario rejects cleanup ${cleanup} without a passed receipt`, async t => {
    const unroute = undefined, close = false, options = {}
    const errors = []
    if (cleanup === 'unroute' || cleanup === 'both') {
      options.unrouteFailures = new Map([[2, unroute]]); errors.push(unroute)
    }
    if (cleanup === 'close' || cleanup === 'both') { options.closeError = close; errors.push(close) }
    const f = fixture(t, options), actual = await rejected(f.run)
    if (errors.length > 1) aggregate(actual, errors)
    else assert.ok(Object.is(actual, errors[0]))
    assert.equal(f.receiptPresentDuringClose(), false)
    assert.equal(existsSync(f.receipt), false)
    assert.deepEqual(f.calls.slice(-3), ['unroute', 'close', 'close-settled'])
  })
}

test('fully successful supplied scenario writes unchanged result only after cleanup settles', async t => {
  const f = fixture(t), result = await f.run()
  assert.equal(f.receiptPresentDuringClose(), false)
  assert.equal(result.status, 'passed')
  assert.equal(result.heldRequests, 1)
  assert.equal(result.pendingMilliseconds, 10000, 'supplied clock, not a real deadline measurement')
  assert.equal(result.checks.length, 4)
  assert.deepEqual(JSON.parse(readFileSync(f.receipt, 'utf8')), result)
  assert.deepEqual(f.calls.slice(-3), ['unroute', 'close', 'close-settled'])
  assert.equal(f.calls.filter(x => x === 'screenshot').length, 4, 'supplied screenshot calls only')
})

test('newPage failure still closes acquired context and retains both falsey failures', async t => {
  const f = fixture(t, { newPageError: undefined, closeError: false })
  aggregate(await rejected(f.run), [undefined, false])
  assert.deepEqual(f.calls, ['newContext', 'newPage', 'close', 'close-settled'])
})

test('newContext failure stays exact without attempting unowned cleanup', async t => {
  const f = fixture(t, { newContextError: undefined })
  assert.ok(Object.is(await rejected(f.run), undefined))
  assert.deepEqual(f.calls, ['newContext'])
})
