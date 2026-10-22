import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { finishM2Functional } from '../scripts/tutorial-browser/m2-pointer-f8.mjs'
import { createCompactAdmission } from '../scripts/tutorial-browser/compact-admission.mjs'
import { guardBrowserAdmission } from '../scripts/browser-admission-guard.mjs'
import { guardGameplayBrowser } from '../scripts/tutorial-browser/gameplay-admission.mjs'
import { compactAggregateBudget as budget, browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'

const pending = () => Promise.withResolvers()
function fixture(options = {}) {
  let time = 0
  const timers = [], closed = [], controller = new AbortController()
  const admission = createCompactAdmission({ deadlineAt: 225000, now: () => time, wallNow: () => 0,
    schedule(fn, ms) { const t = { fn, ms, cancelled: false }; timers.push(t); return t },
    cancel(t) { if (t) t.cancelled = true }, signal: controller.signal,
    onExpire(error) { closed.push(error); return options.close?.(error) }, ...options })
  return { admission, timers, closed, controller, at(value) { time = value } }
}
const evidence = () => ({ loadBoundaryMatched: true, introductionReady: true, compactViewportReady: true,
  before: { level: 2, paused: true, sameScene: true }, popupSerial: '7', popupRestored: true })
const result = () => ({ status: 'passed', contextClosed: true, compactMessages: { cases: [
  ['4', 900, 360], ['4', 640, 480], ['auto', 900, 360], ['auto', 640, 480],
].map(([preference, ...viewport]) => ({ preference, viewport, restored: { hidden: true } })) } })
const begin = f => f.admission.beginCompact()
const layouts = f => f.admission.beginLayouts(evidence())
const finish = f => f.admission.finishCompact(result())
const companions = f => {
  f.admission.finishCompanion('picking', { status: 'passed', contextClosed: true })
  f.admission.finishCompanion('hypnotise', { status: 'passed', contextClosed: true, capMs: 75000 })
}

test('new 225s policy is the explicit workload sum, not transferred ordinary or gameplay caps', () => {
  assert.deepEqual(budget, { version: 1, preparationMs: 45000, layoutsMs: 45000, compactMs: 90000,
    pickingMs: 45000, hypnotiseMs: 75000, lifecycleMs: 15000, totalBrowserMs: 225000, buildMs: 120000, hostedJobMs: 900000 })
  assert.equal(budget.compactMs + budget.pickingMs + budget.hypnotiseMs + budget.lifecycleMs, budget.totalBrowserMs)
  assert.equal(browserCapMs('compact-message-layout'), 225000)
  assert.equal(browserCapMs('m2-pointer-f8'), 180000); assert.equal(browserCapMs('gameplay-frames'), 355000)
  assert.equal(guardGameplayBrowser, guardBrowserAdmission, 'Existing gameplay export remains the exact shared function')
})

test('two phases include acquisition and cleanup, four cases share one allowance, and final cleanup is aggregate-owned', async () => {
  const f = fixture(); f.at(1000); begin(f); f.at(45999); layouts(f)
  assert.deepEqual(f.admission.report.episodes[0].phases.map(p => p.deadlineMs), [46000, 90999])
  f.at(90998); finish(f)
  const stale = f.timers.slice(1); for (const timer of stale) timer.fn()
  assert.equal(f.closed.length, 0)
  f.at(210000); companions(f)
  f.at(224999); assert.equal(await f.admission.cleanup({ browser: { async close() {} }, server: { async close() {} } }), true)
  f.admission.complete(); assert.equal(f.admission.report.status, 'passed'); assert.ok(f.timers.every(t => t.cancelled))
})

for (const [name, at, setup] of [
  ['preparation', 45000, () => {}], ['layouts', 46000, f => { f.at(1000); layouts(f) }],
  ['episode', 90000, f => { f.at(44999); layouts(f) }],
]) test(`${name} expiry is monotonic and sticky even without timer delivery`, () => {
  const f = fixture(); begin(f); setup(f); f.at(at)
  assert.throws(() => f.admission.check(), new RegExp(`${name} deadline`))
  f.at(1); assert.throws(() => f.admission.check(), new RegExp(`${name} deadline`))
  assert.equal(f.closed.length, 1); assert.equal(f.admission.report.status, 'failed'); f.admission.dispose()
})

test('unused preparation does not enlarge layouts, and no preference/case can reset its phase', () => {
  const f = fixture(); begin(f); f.at(1); layouts(f)
  assert.equal(f.admission.report.episodes[0].phases[1].deadlineMs, 45001)
  assert.throws(() => layouts(f)); assert.throws(() => begin(f))
  f.at(45001); assert.throws(() => finish(f), /layouts deadline/); f.admission.dispose()
})

for (const [name, mutate] of [
  ['load', e => { e.loadBoundaryMatched = false }], ['introduction', e => { e.introductionReady = false }],
  ['compact viewport', e => { e.compactViewportReady = false }], ['paused world', e => { e.before.paused = false }],
  ['same scene', e => { e.before.sameScene = false }], ['level', e => { e.before.level = 1 }],
  ['same popup', e => { e.popupSerial = undefined }], ['public popup restoration', e => { e.popupRestored = false }],
]) test(`phase boundary rejects absent ${name} evidence`, () => {
  const f = fixture(); begin(f); const e = evidence(); mutate(e)
  assert.throws(() => f.admission.beginLayouts(e)); assert.equal(f.admission.report.episodes[0].phases.length, 1); f.admission.dispose()
})

for (const [name, mutate] of [
  ['missing fourth case', r => { r.compactMessages.cases.pop() }], ['duplicate case', r => { r.compactMessages.cases[3] = r.compactMessages.cases[2] }],
  ['extra case', r => { r.compactMessages.cases.push(r.compactMessages.cases[0]) }], ['unfinished F8 restoration', r => { delete r.compactMessages.cases[0].restored }],
  ['context cleanup', r => { r.contextClosed = false }], ['failed geometry', r => { r.status = 'failed' }],
]) test(`compact completion rejects ${name}`, () => {
  const f = fixture(); begin(f); layouts(f); const r = result(); mutate(r)
  assert.throws(() => f.admission.finishCompact(r)); f.admission.dispose()
})

test('outer deadline clips every phase and late aggregate cleanup cannot pass', async () => {
  const f = fixture({ deadlineAt: 30000 }); begin(f); f.at(1000); layouts(f)
  assert.deepEqual(f.admission.report.episodes[0].phases.map(p => p.deadlineMs), [30000, 30000])
  f.at(29999); finish(f); companions(f); await f.admission.cleanup({})
  f.at(30000); assert.throws(() => f.admission.complete(), /aggregate deadline/); f.admission.dispose()
})

test('pending acquisition returns on expiry and a late resource is closed without admitting new input', async () => {
  const f = fixture(), creation = pending(), cleanup = pending(); let closes = 0
  begin(f)
  const acquiring = f.admission.acquire('context', () => creation.promise, async r => { closes++; await r.close() })
  await Promise.resolve(); f.at(45000); f.timers[2].fn()
  await assert.rejects(acquiring, /preparation deadline/)
  creation.resolve({ close: () => cleanup.promise }); await Promise.resolve(); await Promise.resolve()
  assert.equal(closes, 1); assert.equal(f.admission.report.resources[0].lateCloseAttempted, true)
  cleanup.reject(new Error('late close failed')); await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(f.admission.report.cleanupErrors, ['Error: late close failed']); f.admission.dispose()
})

function browserFixture(f, { read, action, closing } = {}) {
  const calls = []
  const target = { async click(options) { assert.equal(this, target); calls.push(['click', options]); return action?.promise }, first() { return target } }
  const keyboard = { async press(key) { assert.equal(this, keyboard); calls.push(['press', key]) },
    async down(key) { calls.push(['down', key]) }, async up(key) { calls.push(['up', key]) } }
  const page = { keyboard, getByRole(...args) { assert.equal(this, page); calls.push(['role', ...args]); return target },
    evaluate: async () => read?.promise, async close() { calls.push(['page-close']) } }
  const context = { async newPage() { return page }, async close() { calls.push(['context-close']); action?.reject(new Error('action cancelled')); await closing?.promise } }
  const raw = { async newContext(options) { assert.equal(this, raw); calls.push(['context', options]); return context },
    async close() { calls.push(['browser-close']); await context.close() } }
  return { calls, page, raw, browser: guardBrowserAdmission(raw, f.admission) }
}

test('pending read cannot dispatch late Space; only exact held keys can be released', async () => {
  const f = fixture(), read = pending(); begin(f)
  const b = browserFixture(f, { read }), context = await b.browser.newContext(), page = await context.newPage()
  await page.keyboard.down('Shift')
  const input = (async () => { await page.evaluate(); await page.keyboard.press('Space') })()
  f.at(45000); read.resolve(); await assert.rejects(input, /preparation deadline/)
  await page.keyboard.up('Shift'); await page.keyboard.up('w')
  assert.deepEqual(b.calls.filter(c => ['press', 'up'].includes(c[0])), [['up', 'Shift']]); f.admission.dispose()
})

test('already-forwarded real locator action is cancelled immediately and preserves exact options', async () => {
  let b
  const f = fixture({ close: () => b.raw.close() }), action = pending(), closing = pending(); begin(f)
  b = browserFixture(f, { action, closing }); const options = { timeout: 10000 }
  const context = await b.browser.newContext(), page = await context.newPage()
  const click = page.getByRole('button', { name: 'Menu', exact: true }).first().click(options)
  assert.equal(b.calls.find(c => c[0] === 'click')[1], options)
  f.at(45000); f.timers[2].fn(); await assert.rejects(click, /action cancelled/)
  assert.throws(() => page.keyboard.press('Space'), /preparation deadline/)
  assert.equal(b.calls.filter(c => c[0] === 'browser-close').length, 1)
  closing.resolve(); f.admission.dispose()
})

test('outer abort preserves its reason and late page acquisition closes after the race has rejected', async () => {
  const f = fixture(), creation = pending(); begin(f)
  let closes = 0
  const acquired = f.admission.acquire('page', () => creation.promise, p => p.close())
  await Promise.resolve(); const reason = new Error('original outer abort'); f.controller.abort(reason)
  await assert.rejects(acquired, error => error === reason)
  creation.resolve({ async close() { closes++ } }); await new Promise(resolve => setImmediate(resolve))
  assert.equal(closes, 1); assert.equal(f.admission.report.failure, String(reason)); f.admission.dispose()
})

test('primary failure plus stalled first close still attempts all cleanup and deadline shutdown', async () => {
  const f = fixture(), stalled = pending(), calls = [], original = new Error('original input failure'); begin(f)
  f.admission.fail(original)
  const cleanup = f.admission.cleanup({
    context: { close() { calls.push('context'); return stalled.promise } },
    browser: { async close() { calls.push('browser'); throw new Error('browser close failed') } },
    server: { async close() { calls.push('server') } },
  })
  await Promise.resolve(); await Promise.resolve(); f.at(45000); f.timers[2].fn()
  assert.equal(await cleanup, false); assert.deepEqual(calls, ['context', 'browser', 'server'])
  assert.equal(f.closed.length, 1); assert.equal(f.admission.report.failure, String(original))
  assert.deepEqual(f.admission.report.cleanupErrors, ['Error: browser close failed'])
  assert.throws(() => f.admission.complete(), error => error === original)
  stalled.resolve(); f.admission.dispose()
})

test('runner and M2 keep explicit compact admission separate from ordinary M2, with bounded cleanup', () => {
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  const m2 = readFileSync(new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url), 'utf8')
  assert.ok(runner.indexOf('createCompactAdmission({') < runner.indexOf('(gameplayBrowser ?? compactBrowser ?? browser).newContext'))
  assert.match(runner, /compactAdmission\.wait\([\s\S]*runCompactDiagnosticEpisodes\(\{\s*browser: compactBrowser/)
  assert.match(runner, /compactAdmission\.wait\([\s\S]*hypnotiseScenario/)
  assert.ok(runner.indexOf('await compactAdmission.cleanup(') < runner.indexOf('compactAdmission.complete()'))
  assert.match(m2, /if \(pickingPaths\) timer = setTimeout/)
  assert.match(m2, /if \(options.compactMessages \|\| options.pickingPaths\) return runM2Episode\(options\)/)
  assert.ok(m2.indexOf('admission?.beginCompact()') < m2.indexOf('report.compactMessageLayout = await runEpisode'))
  assert.ok(m2.indexOf('report.before = await observe()') < m2.indexOf('admission.beginLayouts('))
  assert.ok(m2.indexOf('admission.beginLayouts(') < m2.indexOf('await checkCompactMessages('))
  assert.ok(m2.indexOf("await admission.close('compact-context', context)") < m2.indexOf('admission.finishCompact(report)'))
})

test('Hypnotise completion accepts its existing shorter outer-clipped cap and rejects invalid expansion', () => {
  for (const capMs of [1, 74000, 75000]) {
    const f = fixture(); begin(f); layouts(f); finish(f)
    f.admission.finishCompanion('picking', { status: 'passed', contextClosed: true })
    f.admission.finishCompanion('hypnotise', { status: 'passed', contextClosed: true, capMs })
    f.admission.dispose()
  }
  for (const capMs of [0, -1, NaN, Infinity, 75001, undefined]) {
    const f = fixture(); begin(f); layouts(f); finish(f)
    f.admission.finishCompanion('picking', { status: 'passed', contextClosed: true })
    assert.throws(() => f.admission.finishCompanion('hypnotise', { status: 'passed', contextClosed: true, capMs }), /75s maximum/)
    f.admission.dispose()
  }
})

test('primary failure and pending inner-context close preserve actual late rejection durably', async () => {
  const saves = [], closing = pending(), f = fixture({ onUpdate: r => saves.push(structuredClone(r)) })
  begin(f); const original = new Error('original public action failure'); f.admission.fail(original)
  const close = f.admission.close('compact-context', { close: () => closing.promise })
  assert.equal(saves.at(-1).closes[0].status, 'pending')
  f.at(45000); f.timers[2].fn(); await assert.rejects(close, error => error === original)
  f.admission.dispose(); closing.reject(new Error('actual late inner close rejection'))
  await new Promise(resolve => setImmediate(resolve))
  const saved = saves.at(-1)
  assert.equal(saved.status, 'failed'); assert.equal(saved.failure, String(original))
  assert.equal(saved.closes.find(c => c.name === 'compact-context').status, 'failed')
  assert.deepEqual(saved.cleanupErrors, ['Error: actual late inner close rejection'])
})

test('late acquisition and shutdown-browser settlements remain durable without extending expiry', async () => {
  const saves = [], creation = pending(), closing = pending(), f = fixture({ close: () => closing.promise,
    onUpdate: r => saves.push(structuredClone(r)) })
  begin(f)
  const acquired = f.admission.acquire('context', () => creation.promise, c => c.close())
  await Promise.resolve(); f.at(45000); f.timers[2].fn(); await assert.rejects(acquired, /preparation deadline/)
  assert.equal(saves.at(-1).resources[0].status, 'pending')
  assert.equal(saves.at(-1).closes[0].status, 'pending')
  f.admission.dispose()
  creation.resolve({ async close() { throw new Error('late acquired close rejected') } })
  closing.reject(new Error('deadline browser close rejected'))
  await new Promise(resolve => setImmediate(resolve))
  const saved = saves.at(-1)
  assert.equal(saved.status, 'failed'); assert.equal(saved.resources[0].status, 'late-close-failed')
  assert.match(saved.failure, /preparation deadline/)
  assert.deepEqual(saved.cleanupErrors.toSorted(), ['Error: deadline browser close rejected', 'Error: late acquired close rejected'].toSorted())
})

test('final pending cleanup is recorded at expiry and later closure persists as failed admission', async () => {
  const saves = [], closing = pending(), f = fixture({ onUpdate: r => saves.push(structuredClone(r)) })
  begin(f); layouts(f); finish(f); companions(f)
  const cleanup = f.admission.cleanup({ server: { close: () => closing.promise } })
  f.at(225000); f.timers[0].fn(); assert.equal(await cleanup, false)
  f.admission.dispose(); closing.resolve(); await new Promise(resolve => setImmediate(resolve))
  assert.equal(saves.at(-1).cleanup[0].status, 'closed')
  assert.equal(saves.at(-1).status, 'failed'); assert.equal(saves.at(-1).timedOut, 'aggregate')
})

test('settlement persistence failure is fail-closed and cannot replace an original input failure', async () => {
  const original = new Error('original input'), f = fixture({ onUpdate() { throw new Error('receipt write failed') } })
  begin(f); f.admission.fail(original)
  await f.admission.close('compact-context', { async close() {} })
  assert.equal(f.admission.report.failure, String(original))
  assert.ok(f.admission.report.persistenceErrors.every(e => e === 'Error: receipt write failed'))
  assert.ok(f.admission.report.persistenceErrors.length > 0)
  assert.throws(() => f.admission.complete(), error => error === original); f.admission.dispose()
})


test('actual M2 finalizer records a late inner close rejection after its bounded failed receipt', async t => {
  const output = mkdtempSync(join(tmpdir(), 'compact-close-evidence-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  const saves = [], closing = pending(), f = fixture({ onUpdate: r => saves.push(structuredClone(r)) })
  begin(f)
  const original = new Error('original navigation failure'), report = { status: 'running', errors: [] }
  f.admission.fail(original)
  const completed = assert.rejects(finishM2Functional({ context: { close: () => closing.promise }, report,
    output, failure: original, admission: f.admission }), /M2 functional scenario failed/)
  f.at(45000); f.timers[2].fn(); await completed
  const receipt = JSON.parse(readFileSync(join(output, 'm2-pointer-f8.json'), 'utf8'))
  assert.equal(receipt.status, 'failed'); assert.equal(receipt.failure.message, String(original))
  closing.reject(new Error('late inner context close failed')); await new Promise(resolve => setImmediate(resolve))
  assert.equal(saves.at(-1).failure, String(original))
  assert.deepEqual(saves.at(-1).cleanupErrors, ['Error: late inner context close failed'])
  assert.equal(saves.at(-1).closes.find(c => c.name === 'compact-context').status, 'failed')
  f.admission.dispose()
})
