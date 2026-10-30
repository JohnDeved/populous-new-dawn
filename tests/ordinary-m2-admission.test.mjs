import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import runM2Functional from '../scripts/tutorial-browser/m2-pointer-f8.mjs'
import { createM2Admission } from '../scripts/tutorial-browser/m2-admission.mjs'
import { guardBrowserAdmission } from '../scripts/browser-admission-guard.mjs'
import { ordinaryM2Budget as budget, browserCapMs, compactAggregateBudget } from '../scripts/tutorial-browser/scenario-policy.mjs'

const pending = () => Promise.withResolvers()
const tick = () => new Promise(resolve => setImmediate(resolve))
function fixture(options = {}) {
  let time = 0
  const timers = [], saves = [], controller = new AbortController()
  const admission = createM2Admission({ deadlineAt: 180000, now: () => time, wallNow: () => 0,
    schedule(fn, ms) { const timer = { fn, ms, cancelled: false }; timers.push(timer); return timer },
    cancel(timer) { if (timer) timer.cancelled = true }, signal: controller.signal,
    onUpdate: report => saves.push(structuredClone(report)), ...options })
  return { admission, timers, saves, controller, at(value) { time = value } }
}
const evidence = () => ({ loadBoundaryMatched: true, introductionReady: true, compactViewportReady: true,
  before: { level: 2, paused: true, sameScene: true }, restoredPopup: { serial: '7', open: true },
  campaignPopup: { serial: '7', initiallyOpen: true } })
const result = () => ({ status: 'passed', contextClosed: true, errors: [],
  layouts: [[640, 480], [900, 360], [1280, 720], [1440, 1000]].map(viewport => ({ viewport })),
  exports: [{ keyboard: false, viewport: { width: 640 } }, { keyboard: true, viewport: { width: 1280 } }],
  before: { turn: 10 }, resetWindow: '0 samples', resumed: { turn: 11, paused: false },
  menu: { sameScene: true }, returned: { sameScene: true, level: 2, paused: false },
  stages: ['f8-reset-matched', 'resumed', 'menu-returned'].map(name => ({ name })) })
const acquire = f => f.admission.acquire('context', async () => ({ async close() {} }), c => c.close())

test('ordinary M2 explicitly adds45s without changing any enclosing or companion cap', () => {
  assert.deepEqual(budget, { version: 1, setupMs: 45000, functionalMs: 45000, totalMs: 90000 })
  assert.equal(browserCapMs('tutorial'), 240000); assert.equal(browserCapMs('m2-pointer-f8'), 180000)
  assert.equal(compactAggregateBudget.compactMs, 90000); assert.equal(compactAggregateBudget.totalBrowserMs, 225000)
  assert.equal(compactAggregateBudget.pickingMs, 45000); assert.equal(browserCapMs('gameplay-frames'), 355000)
})

test('setup starts before acquisition and one functional window includes every case and cleanup', async () => {
  const f = fixture(); assert.equal(f.admission.report.phases[0].deadlineMs, 45000)
  await acquire(f); f.at(44999); f.admission.beginFunctional(evidence())
  assert.deepEqual(f.admission.report.phases.map(p => p.deadlineMs), [45000, 89999])
  f.timers[1].fn(); assert.equal(f.admission.report.timedOut, undefined)
  f.at(89998); assert.equal(await f.admission.cleanup(), true); f.admission.complete(result())
  assert.equal(f.admission.report.status, 'passed'); assert.ok(f.timers.every(t => t.cancelled))
})

test('unused setup cannot transfer into functional time and no viewport can reset it', () => {
  const f = fixture(); f.at(1000); f.admission.beginFunctional(evidence())
  assert.equal(f.admission.report.phases[1].deadlineMs, 46000)
  assert.throws(() => f.admission.beginFunctional(evidence()), /exactly one/)
  f.at(46000); assert.throws(() => f.admission.check(), /functional deadline/); f.admission.dispose()
})

for (const [name, at, setup] of [
  ['setup', 45000, () => {}], ['functional', 46000, f => { f.at(1000); f.admission.beginFunctional(evidence()) }],
  ['total', 90000, f => { f.at(44999); f.admission.beginFunctional(evidence()) }],
]) test(`${name} expiry is sticky and monotonic even if timer delivery is delayed`, () => {
  const f = fixture(); setup(f); f.at(at)
  assert.throws(() => f.admission.check(), new RegExp(`${name} deadline`))
  f.at(1); assert.throws(() => f.admission.check(), new RegExp(`${name} deadline`))
  assert.equal(f.admission.report.status, 'failed'); f.admission.dispose()
})

test('existing host remainder clips setup, functional and cleanup rather than granting90s', async () => {
  const f = fixture({ deadlineAt: 30000 }); await acquire(f)
  assert.equal(f.admission.report.allowanceMs, 30000)
  f.at(1000); f.admission.beginFunctional(evidence())
  assert.deepEqual(f.admission.report.phases.map(p => p.deadlineMs), [30000, 30000])
  f.at(29999); assert.equal(await f.admission.cleanup(), true)
  f.at(30000); assert.throws(() => f.admission.complete(result()), /total deadline/); f.admission.dispose()
})

for (const [name, mutate] of [
  ['Load boundary', e => { e.loadBoundaryMatched = false }], ['intro', e => { e.introductionReady = false }],
  ['compact admission', e => { e.compactViewportReady = false }], ['level', e => { e.before.level = 1 }],
  ['pause', e => { e.before.paused = false }], ['scene', e => { e.before.sameScene = false }],
  ['restored popup', e => { e.restoredPopup.open = false }], ['original identity', e => { e.restoredPopup.serial = undefined }],
  ['current owner', e => { e.campaignPopup.initiallyOpen = false }], ['wrong retained owner', e => { e.campaignPopup.serial = '8' }],
]) test(`single phase transition rejects missing or wrong ${name}`, () => {
  const f = fixture(), e = evidence(); mutate(e)
  assert.throws(() => f.admission.beginFunctional(e)); assert.equal(f.admission.report.phases.length, 1); f.admission.dispose()
})

for (const [name, mutate] of [
  ['fourth viewport', r => { r.layouts.pop() }], ['duplicate viewport', r => { r.layouts[3] = r.layouts[2] }],
  ['keyboard export', r => { r.exports.pop() }], ['wrong export input', r => { r.exports[1].keyboard = false }],
  ['F8 empty reset', r => { r.resetWindow = '1 samples' }], ['live resumed turn', r => { r.resumed.turn = 10 }],
  ['resumed pause', r => { r.resumed.paused = true }], ['menu scene', r => { delete r.menu }],
  ['return level', r => { r.returned.level = 1 }], ['return paused', r => { r.returned.paused = true }],
  ['tail stage', r => { r.stages.pop() }], ['context cleanup', r => { r.contextClosed = false }],
  ['runtime error', r => { r.errors.push('late error') }], ['failed geometry', r => { r.status = 'failed' }],
]) test(`completion cannot bypass ${name}`, async () => {
  const f = fixture(); await acquire(f); f.admission.beginFunctional(evidence()); await f.admission.cleanup()
  const r = result(); mutate(r); assert.throws(() => f.admission.complete(r)); f.admission.dispose()
})

test('pending context acquisition cannot outlive admission or admit a late page', async () => {
  const f = fixture(), creation = pending(), closing = pending(); let closes = 0
  const acquiring = f.admission.acquire('context', () => creation.promise, c => c.close())
  await Promise.resolve(); f.at(45000); f.timers[1].fn()
  await assert.rejects(acquiring, /setup deadline/); f.admission.dispose()
  creation.resolve({ close() { closes++; return closing.promise } }); await tick()
  assert.equal(closes, 1); assert.equal(f.saves.at(-1).resources[0].status, 'late-cleanup-pending')
  closing.reject(new Error('actual late close failure')); await tick()
  assert.equal(f.saves.at(-1).resources[0].status, 'late-close-failed')
  assert.deepEqual(f.saves.at(-1).cleanupErrors, ['Error: actual late close failure'])
})

function browserFixture(f, { read, action } = {}) {
  const calls = []
  const locator = { async click(options) { assert.equal(this, locator); calls.push(['click', options]); return action?.promise }, first() { return locator } }
  const keyboard = { async press(key) { calls.push(['press', key]) }, async down(key) { calls.push(['down', key]) }, async up(key) { calls.push(['up', key]) } }
  const page = { keyboard, getByRole(...args) { calls.push(['role', ...args]); return locator },
    evaluate: async () => read?.promise, async close() { calls.push(['page-close']) } }
  const context = { async newPage() { return page }, async close() { calls.push(['context-close']); action?.reject(new Error('action cancelled')) } }
  const raw = { async newContext(options) { assert.equal(this, raw); calls.push(['context', options]); return context } }
  return { calls, browser: guardBrowserAdmission(raw, f.admission) }
}

test('pending read cannot send late Space; only the exact owned held key may release', async () => {
  const f = fixture(), read = pending(), b = browserFixture(f, { read })
  const context = await b.browser.newContext(), page = await context.newPage()
  await page.keyboard.down('Shift')
  const input = (async () => { await page.evaluate(); await page.keyboard.press('Space') })()
  f.at(45000); read.resolve(); await assert.rejects(input, /setup deadline/)
  await page.keyboard.up('Shift'); await page.keyboard.up('w')
  assert.deepEqual(b.calls.filter(c => ['press', 'up'].includes(c[0])), [['up', 'Shift']]); f.admission.dispose()
})

test('expiry immediately closes owned pending action, preserving real receiver and options', async () => {
  const f = fixture(), action = pending(), b = browserFixture(f, { action })
  const context = await b.browser.newContext(), page = await context.newPage(), options = { timeout: 10000 }
  const click = page.getByRole('button', { name: 'Menu', exact: true }).first().click(options)
  assert.equal(b.calls.find(c => c[0] === 'click')[1], options)
  f.at(45000); f.timers[1].fn(); await assert.rejects(click, /action cancelled/)
  assert.throws(() => page.keyboard.press('Space'), /setup deadline/)
  assert.equal(b.calls.filter(c => c[0] === 'context-close').length, 1); f.admission.dispose()
})

test('outer abort remains original and late acquired page gets durable cleanup', async () => {
  const f = fixture(), creation = pending(); let closes = 0
  const acquiring = f.admission.acquire('page', () => creation.promise, p => p.close())
  await Promise.resolve(); const reason = new Error('original outer abort'); f.controller.abort(reason)
  await assert.rejects(acquiring, error => error === reason); f.admission.dispose()
  creation.resolve({ async close() { closes++ } }); await tick()
  assert.equal(closes, 1); assert.equal(f.saves.at(-1).failure, String(reason))
})

test('primary failure plus pending cleanup still expires, attempts all closes, and retains late rejection', async () => {
  const f = fixture(), closing = pending(), calls = [], original = new Error('original public input failure')
  await f.admission.acquire('context', async () => ({ close() { calls.push('context'); return closing.promise } }), c => c.close())
  await f.admission.acquire('page', async () => ({ async close() { calls.push('page'); throw new Error('page cleanup failure') } }), p => p.close())
  f.admission.fail(original)
  const cleanup = f.admission.cleanup(); await tick(); f.at(45000); f.timers[1].fn()
  assert.equal(await cleanup, false); assert.deepEqual(calls, ['context', 'page'])
  assert.equal(f.saves.at(-1).failure, String(original)); assert.equal(f.saves.at(-1).timedOut, 'setup')
  assert.equal(f.saves.at(-1).closes[0].status, 'pending')
  f.admission.dispose(); closing.reject(new Error('late context cleanup failure')); await tick()
  assert.equal(f.saves.at(-1).failure, String(original))
  assert.deepEqual(f.saves.at(-1).cleanupErrors, ['Error: page cleanup failure', 'Error: late context cleanup failure'])
})

test('late completion cannot pass failed or pending cleanup, or receipt persistence failure', async () => {
  const f = fixture(), closing = pending()
  await f.admission.acquire('context', async () => ({ close: () => closing.promise }), c => c.close())
  f.admission.beginFunctional(evidence()); const cleanup = f.admission.cleanup()
  assert.throws(() => f.admission.complete(result()), /settle successfully/)
  closing.resolve(); assert.equal(await cleanup, true)
  assert.throws(() => f.admission.complete(result()), /settle successfully/); f.admission.dispose()
  const g = fixture({ onUpdate() { throw new Error('receipt persistence failed') } })
  assert.throws(() => g.admission.check(), /receipt persistence failed/); g.admission.dispose()
})

test('real runner clips both ordinary callers, without migrating compact or picking', () => {
  const run = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  const m2 = readFileSync(new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url), 'utf8')
  assert.equal([...run.matchAll(/m2Scenario\)\.href\)\)\.default\(\{ browser, url, output: out, fixture: m2Fixture, deadlineAt: browserDeadlineAt, signal: abort.signal \}\)/g)].length, 2)
  const branch = m2.indexOf('export default async function runM2Functional(options)')
  assert.ok(m2.indexOf('if (options.compactMessages || options.pickingPaths) return runM2Episode(options)', branch) > branch)
  assert.ok(m2.indexOf('createM2Admission({', branch) < m2.indexOf('ordinaryAdmission.wait(runM2Episode(', branch))
  assert.match(m2, /if \(pickingPaths\) timer = setTimeout/)
  const transition = m2.indexOf('ordinaryAdmission.beginFunctional(')
  assert.ok(transition > m2.indexOf('report.before = await observe()'))
  assert.ok(transition > m2.indexOf("assert.equal(await openPopup.count(), 1"))
  assert.ok(transition > m2.indexOf('report.campaignMessagesBefore ='))
  assert.ok(transition < m2.indexOf("stage('campaign-closed-for-camera-input')"))
  assert.equal([...m2.matchAll(/ordinaryAdmission.beginFunctional\(/g)].length, 1)
  assert.match(m2, /ordinaryAdmission\.complete\(result\)/)
  assert.match(m2, /ordinaryAdmission\.cleanup\(\)/)
})

test('actual ordinary wrapper retains outer abort and late context-close rejection after bounded return', async t => {
  const output = mkdtempSync(join(tmpdir(), 'ordinary-m2-admission-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  const creation = pending(), started = pending(), controller = new AbortController()
  const run = runM2Functional({ output, deadlineAt: Date.now() + 5000, signal: controller.signal,
    browser: { newContext() { started.resolve(); return creation.promise } } })
  await started.promise
  const original = new Error('actual enclosing host abort'); controller.abort(original)
  await assert.rejects(run, error => error === original)
  const read = () => JSON.parse(readFileSync(join(output, 'm2-admission.json'), 'utf8'))
  assert.equal(read().status, 'failed'); assert.equal(read().failure, String(original))
  assert.equal(read().resources[0].status, 'pending')
  creation.resolve({ async close() { throw new Error('actual late context rejection') } })
  await tick()
  assert.equal(read().resources[0].status, 'late-close-failed')
  assert.deepEqual(read().cleanupErrors, ['Error: actual late context rejection'])
  assert.equal(read().failure, String(original))
})
