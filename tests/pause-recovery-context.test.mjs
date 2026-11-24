import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-recovery.mjs', import.meta.url), 'utf8')
// The helper lives in the already fingerprinted scenario, avoiding an unbound import.
const helper = /export async function closePauseRecoveryContext\([\s\S]*?\n}/.exec(source)?.[0]
const closePauseRecoveryContext = helper
  ? new Function('return (' + helper.replace('export ', '') + ')')()
  : undefined // Original baseline owner has no helper and calls context.close directly.
// Execute the verified caller's actual context creation/catch/finally owner.
// Only its long browser-interaction body is supplied as a leaf; no browser opens.
const start = source.indexOf('  const emptyContext = await browser.newContext(')
assert.ok(start >= 0)
const body = source.indexOf('  try {', start)
assert.ok(body > start)
const catchAt = source.indexOf('  } catch (error) {', body)
const finallyAt = source.indexOf('  } finally {', body)
const boundary = catchAt >= 0 && catchAt < finallyAt ? catchAt : finallyAt
const end = source.indexOf('\n  return {\n    checks, screenshots, saved, renderers', boundary)
assert.ok(boundary > body && end > boundary)
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const execute = new AsyncFunction('browser', 'receipt', 'run', 'closePauseRecoveryContext',
  'checkSelectionTexture', 'url', 'output', 'signal', 'enterMission',
  source.slice(start, body + '  try {'.length) + '\n    await run()\n' + source.slice(boundary, end))

function fixture(close, receipt = { errors: [] }, selection) {
  const events = [], renderers = ['legacy'],
    url = 'http://local.invalid/', output = '/tmp/controlled-recovery', signal = new AbortController().signal,
    selectionPage = {}, selectionViewport = { viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 }
  let oldContextClosed = false
  const browser = {
    newContext: async options => {
      if (selection && options.viewport.height === 600) {
        assert.equal(oldContextClosed, true, 'Selection opens only after legacy teardown')
        events.push('selection context')
        assert.deepEqual(options, selectionViewport)
        return { close: async () => events.push('selection close') }
      }
      events.push('context')
      assert.deepEqual(options, { viewport: { width: 800, height: 450 }, deviceScaleFactor: 2 })
      return { close: async () => {
        events.push('close')
        const result = await close()
        oldContextClosed = true
        return result
      } }
    },
  }
  // The actual containing source passes these through the new helper boundary.
  // Supply only the work of the independent Selection episode, no browser.
  const checkSelectionTexture = async options => {
    assert.equal(oldContextClosed, true)
    assert.equal(options.browser, browser)
    assert.equal(options.url, url)
    assert.equal(options.output, output)
    assert.equal(options.signal, signal, 'Do not replace the outer owning budget signal')
    assert.equal(options.outerReceipt, receipt)
    assert.equal(options.closeContext, closePauseRecoveryContext)
    if (!selection) return
    const context = await options.browser.newContext(selectionViewport)
    let failed = false
    try {
      await options.enterMission(selectionPage)
      return await selection()
    } catch (error) {
      failed = true
      throw error
    } finally {
      await options.closeContext(context, failed, options.outerReceipt)
    }
  }
  const enterMission = async (page, reportRenderer = true) => {
    assert.equal(page, selectionPage)
    assert.equal(reportRenderer, false, 'Independent Selection does not change the old renderer inventory')
    if (reportRenderer) renderers.push('selection')
    events.push('selection entry')
  }
  return {
    receipt, events, renderers,
    run: action => execute(browser, receipt, action, closePauseRecoveryContext,
      checkSelectionTexture, url, output, signal, enterMission),
  }
}
async function rejection(work, expected) {
  let caught = false
  try { await work } catch (error) { caught = true; assert.equal(error, expected) }
  assert.equal(caught, true, 'expected exact rejection, including falsey values')
}
test('actual caller preserves primary assertion when close also rejects', async () => {
  const primary = Error('assertion'), cleanup = Error('disconnect')
  const f = fixture(async () => { throw cleanup })
  await rejection(f.run(async () => { throw primary }), primary)
  assert.deepEqual(f.events, ['context', 'close'])
  assert.deepEqual(f.receipt.errors, ['Pause recovery context cleanup failed: Error: disconnect'])
})
test('actual caller preserves falsey primary throws across close rejection', async () => {
  for (const primary of [undefined, null, false, 0, '']) {
    const f = fixture(async () => { throw Error('close') })
    await rejection(f.run(async () => { throw primary }), primary)
    assert.equal(f.receipt.errors.length, 1)
  }
})
test('actual caller rejects cleanup-only failure, including falsey rejection', async () => {
  for (const cleanup of [Error('close'), undefined, null, false, 0, '']) {
    const f = fixture(async () => { throw cleanup })
    await rejection(f.run(async () => {}), cleanup)
  }
})
test('actual caller successful cleanup remains awaited exactly once', async () => {
  let release, entered, settled = false
  const closing = new Promise(resolve => { entered = resolve })
  const gate = new Promise(resolve => { release = resolve })
  const f = fixture(async () => { entered(); await gate })
  const work = f.run(async () => f.events.push('work')).then(() => { settled = true })
  await closing
  assert.equal(settled, false)
  assert.deepEqual(f.events, ['context', 'work', 'close'])
  release(); await work
  assert.equal(settled, true)
  assert.deepEqual(f.receipt.errors, [])
})
test('actual caller preserves primary error when secondary recording also fails', async () => {
  const primary = Error('assertion')
  const f = fixture(async () => { throw Error('close') }, { get errors() { throw Error('sink') } })
  await rejection(f.run(async () => { throw primary }), primary)
})
test('recording failure does not swallow cleanup-only rejection', async () => {
  const cleanup = Error('close')
  const f = fixture(async () => { throw cleanup }, { errors: Object.freeze([]) })
  await rejection(f.run(async () => {}), cleanup)
})
test('primary rejection still propagates when cleanup succeeds', async () => {
  const primary = Error('assertion'), f = fixture(async () => {})
  await rejection(f.run(async () => { throw primary }), primary)
  assert.deepEqual(f.events, ['context', 'close'])
  assert.deepEqual(f.receipt.errors, [])
})


test('actual caller runs independent Selection only after DPR2 closes, with same budget and old renderer inventory', async () => {
  const receipt = { errors: [] }
  const f = fixture(async () => {}, receipt, async () => f.events.push('selection work'))
  await f.run(async () => f.events.push('work'))
  assert.deepEqual(f.events, ['context', 'work', 'close', 'selection context', 'selection entry', 'selection work', 'selection close'])
  assert.deepEqual(f.renderers, ['legacy'])
  assert.deepEqual(receipt.errors, [])
})

test('independent Selection primary failure still closes only the owning separate context', async () => {
  const receipt = { errors: [] }, primary = Error('selection witness')
  const f = fixture(async () => {}, receipt, async () => { throw primary })
  await rejection(f.run(async () => {}), primary)
  assert.deepEqual(f.events, ['context', 'close', 'selection context', 'selection entry', 'selection close'])
  assert.deepEqual(f.renderers, ['legacy'])
  assert.deepEqual(receipt.errors, [])
})
