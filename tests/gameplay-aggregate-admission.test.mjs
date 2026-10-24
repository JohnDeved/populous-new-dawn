import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createGameplayAdmission, guardGameplayBrowser, cleanupGameplayResources } from '../scripts/tutorial-browser/gameplay-admission.mjs'
import { gameplayAggregateBudget as caps, browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { gameplayFramePlan } from '../scripts/tutorial-browser/gameplay-frame-evidence.mjs'

const revision = 'a'.repeat(40)
const frames = () => ({ status: 'passed', expectedRevision: revision,
  measuredPhases: gameplayFramePlan.phases.map(p => p.name), phases: gameplayFramePlan.phases.map(p => ({ name: p.name, status: 'passed' })) })
const melee = () => ({ status: 'passed', expectedRevision: revision, capMs: 75000, contextClosed: true })
const corpse = () => ({ status: 'passed', expectedRevision: revision, contextClosed: true,
  budgetCapsMs: { deathAndSave: 75000, loadAndVerify: 25000 }, budgets: [
    { name: 'death-through-committed-save', completedElapsedMs: 74000, deadlineElapsedMs: 75000, committedSave: { checkpointSha256: 'b'.repeat(64), turn: 648, effectId: 2249 } },
    { name: 'load-reframe-resume-and-terminal-verification', completedElapsedMs: 98000, deadlineElapsedMs: 99000 },
  ] })
function fixture(options = {}) {
  let time = 0
  const timers = [], expired = [], controller = new AbortController()
  const admission = createGameplayAdmission({ deadlineAt: 355000, expectedRevision: revision,
    now: () => time, wallNow: () => 0, signal: controller.signal,
    schedule(fn, ms) { const timer = { fn, ms, cancelled: false }; timers.push(timer); return timer },
    cancel(timer) { if (timer) timer.cancelled = true }, onExpire(error) { expired.push(error); options.onExpire?.(error) }, ...options })
  return { admission, timers, expired, controller, at(value) { time = value } }
}
const finishFrames = f => { f.admission.finishEpisode('frames', frames()); f.admission.begin('melee') }
const finishMelee = f => { f.admission.finishEpisode('melee', melee()); f.admission.begin('corpse') }
const pending = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }

test('aggregate is the documented sum and does not change real frame windows or build/job bounds', () => {
  assert.deepEqual(caps, { version: 1, frameMs: 180000, meleeMs: 75000, corpseDeathMs: 75000, corpseLoadMs: 25000, totalBrowserMs: 355000, buildMs: 120000, hostedJobMs: 900000 })
  assert.equal(browserCapMs('gameplay-frames'), caps.totalBrowserMs)
  assert.equal(gameplayFramePlan.warmupMs, 2000); assert.equal(gameplayFramePlan.phaseDurationMs, 1600)
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.ok(runner.indexOf('createGameplayAdmission({') < runner.indexOf('(gameplayBrowser ?? compactBrowser ?? browser).newContext'))
  assert.match(runner, /await context\.close\(\); context = undefined; page = undefined\n    gameplayAdmission\.finishEpisode\('frames'/)
  assert.ok(runner.indexOf('await cleanupGameplayResources(gameplayAdmission') < runner.indexOf('gameplayAdmission.complete()'))
})

test('complete order includes original frame envelope, all companions and cleanup in one aggregate', () => {
  const f = fixture(); f.at(179999); finishFrames(f)
  f.at(254000); finishMelee(f); f.at(353000); f.admission.finishEpisode('corpse', corpse())
  f.at(354999); f.admission.complete()
  assert.equal(f.admission.report.status, 'passed'); assert.equal(f.admission.report.finishedMs, 354999)
  assert.ok(f.timers.every(t => t.cancelled))
})

test('frame180 expires without timer delivery and cannot be hidden inside aggregate355', () => {
  const f = fixture(); f.at(180000)
  assert.throws(() => f.admission.finishEpisode('frames', frames()), /frames deadline/)
  f.at(1); assert.throws(() => f.admission.check(), /frames deadline/)
  assert.equal(f.expired.length, 1); assert.equal(f.admission.report.status, 'failed'); f.admission.dispose()
})

test('aggregate expiry is sticky during final cleanup even when every episode passed', () => {
  const f = fixture(); finishFrames(f); finishMelee(f); f.admission.finishEpisode('corpse', corpse()); f.at(355000)
  assert.throws(() => f.admission.complete(), /aggregate deadline/)
  assert.equal(f.admission.report.status, 'failed'); f.admission.dispose()
})

test('shorter original outer allowance is never extended and stale frame timer cannot end a later episode', () => {
  const f = fixture({ deadlineAt: 170000 }); assert.equal(f.admission.report.allowanceMs, 170000)
  finishFrames(f); f.timers[1].fn(); assert.equal(f.expired.length, 0)
  f.at(170000); assert.throws(() => f.admission.check(), /aggregate deadline/); f.admission.dispose()
})

for (const [label, mutate] of [
  ['missing phase', r => { r.phases.pop() }], ['wrong revision', r => { r.expectedRevision = 'x' }],
  ['skipped phase', r => { r.phases[0].status = 'skipped' }], ['incomplete report', r => { r.status = 'running' }],
]) test(`frame admission rejects ${label}`, () => {
  const f = fixture(), result = frames(); mutate(result)
  assert.throws(() => f.admission.finishEpisode('frames', result)); f.admission.dispose()
})

test('missing, repeated and out-of-order companions cannot complete or restart admission', () => {
  const f = fixture(); assert.throws(() => f.admission.begin('corpse')); finishFrames(f)
  assert.throws(() => f.admission.begin('melee')); assert.throws(() => f.admission.complete())
  const report = melee(); report.contextClosed = false
  assert.throws(() => f.admission.finishEpisode('melee', report)); f.admission.dispose()
})

for (const [label, mutate] of [
  ['no exact save transition', r => { delete r.budgets[0].committedSave }],
  ['missing load', r => { r.budgets.pop() }], ['expired load', r => { r.budgets[1].completedElapsedMs = 99000 }],
  ['changed local cap', r => { r.budgetCapsMs.loadAndVerify++ }],
]) test(`corpse admission rejects ${label}`, () => {
  const f = fixture(); finishFrames(f); finishMelee(f); const report = corpse(); mutate(report)
  assert.throws(() => f.admission.finishEpisode('corpse', report)); f.admission.dispose()
})

test('existing local phase guards fail before an input when their timer delivery is delayed', () => {
  const f = fixture(); finishFrames(f)
  const original = new Error('local75 deadline'); let localTime = 0
  f.admission.setLocalCheck(() => { if (localTime >= 75000) throw original })
  localTime = 75000; assert.throws(() => f.admission.check(), error => error === original)
  f.admission.clearLocalCheck(); assert.throws(() => f.admission.check(), error => error === original); f.admission.dispose()
})

function browserFixture(f, overrides = {}) {
  const calls = [], target = { async click(...args) { assert.equal(this, target); calls.push(['click', ...args]) },
    getByRole(...args) { assert.equal(this, target); calls.push(['nested', ...args]); return target },
    or(other) { assert.equal(this, target); assert.equal(other, target); return target },
    first() { return target }, async waitFor(...args) { calls.push(['wait', ...args]) },
    async focus(...args) { calls.push(['focus', ...args]) } }
  const keyboard = Object.fromEntries(['press', 'down', 'up'].map(method => [method, async function (...args) {
    assert.equal(this, keyboard); calls.push([method, ...args])
  }]))
  const page = { keyboard, mouse: { async click(...args) { calls.push(['mouse', ...args]) } },
    getByRole(...args) { assert.equal(this, page); calls.push(['role', ...args]); return target },
    locator() { return target }, async evaluate(fn) { assert.equal(this, page); return fn() }, async close() { calls.push(['page-close']) }, ...overrides.page }
  const context = { async newPage(...args) { assert.equal(this, context); calls.push(['newPage', ...args]); return page },
    async close(...args) { assert.equal(this, context); calls.push(['context-close', ...args]); await overrides.close?.() } }
  const browser = { async newContext(...args) { assert.equal(this, browser); calls.push(['newContext', ...args]); return overrides.context ? await overrides.context : context } }
  return { calls, page, context, target, browser: guardGameplayBrowser(browser, f.admission) }
}

test('facade preserves receiver, arguments, real chained locator actions and read-only observations', async () => {
  const f = fixture(), b = browserFixture(f), options = { viewport: { width: 960, height: 720 } }
  const context = await b.browser.newContext(options), page = await context.newPage()
  const named = { name: 'Menu', exact: true }, click = { timeout: 10000 }
  const locator = page.getByRole('button', named)
  await locator.or(page.locator('x')).first().getByRole('button', named).click(click)
  await page.keyboard.press('Space'); assert.equal(await page.evaluate(() => 42), 42)
  assert.equal(b.calls[0][1], options); assert.equal(b.calls.find(c => c[0] === 'role')[2], named)
  assert.equal(b.calls.find(c => c[0] === 'click')[1], click); assert.deepEqual(b.calls.at(-1), ['press', 'Space'])
  f.admission.dispose()
})

test('pending read resolving after expiry cannot dispatch Space and only owned releases remain allowed', async () => {
  const f = fixture(), read = pending(), b = browserFixture(f, { page: { async evaluate() { return read.promise } } })
  const context = await b.browser.newContext(), page = await context.newPage()
  await page.keyboard.down('Shift')
  const action = (async () => { await page.evaluate(() => 0); await page.keyboard.press('Space') })()
  f.at(180000); read.resolve(0); await assert.rejects(action, /frames deadline/)
  await page.keyboard.up('Shift'); await page.keyboard.up('w')
  assert.deepEqual(b.calls.filter(c => ['up', 'press'].includes(c[0])), [['up', 'Shift']]); f.admission.dispose()
})

test('late context acquisition is closed without admitting a page and preserves the expiry error if close fails', async () => {
  const f = fixture(), creation = pending(), cleanup = new Error('cleanup failed')
  const b = browserFixture(f, { context: creation.promise }), acquired = b.browser.newContext()
  f.at(180000); creation.resolve({ async close() { throw cleanup } })
  await assert.rejects(acquired, /frames deadline/)
  assert.equal(f.admission.report.cleanupErrors[0], String(cleanup))
  assert.ok(!b.calls.some(c => c[0] === 'newPage')); f.admission.dispose()
})

test('aggregate expiry closes a pending public action and blocks all later dispatch while close is pending', async () => {
  const action = pending(), closing = pending(); let context
  const f = fixture({ onExpire() { void context.close() } }), b = browserFixture(f, { close() { action.reject(new Error('context closing')); return closing.promise } })
  b.target.click = async function () { assert.equal(this, b.target); b.calls.push(['pending-click']); return action.promise }
  context = await b.browser.newContext(); const page = await context.newPage()
  const click = page.getByRole('button', { name: 'Menu' }).click()
  f.at(180000); assert.throws(() => f.admission.check(), /frames deadline/)
  await assert.rejects(click, /context closing/)
  assert.throws(() => page.keyboard.press('Space'), /frames deadline/)
  closing.resolve(); await context.close(); f.admission.dispose()
})

test('outer abort and late-created page are cleaned without hiding the original abort', async () => {
  const f = fixture(), creation = pending(), b = browserFixture(f), context = await b.browser.newContext()
  b.context.newPage = async () => creation.promise
  const acquiring = context.newPage(), original = new Error('original outer abort')
  f.controller.abort(original); creation.resolve(b.page)
  await assert.rejects(acquiring, error => error === original)
  assert.ok(b.calls.some(c => c[0] === 'page-close')); f.admission.dispose()
})


test('closing an owned local context gates pending-page acquisition and new input before global expiry', async () => {
  const f = fixture(), creation = pending(), b = browserFixture(f), context = await b.browser.newContext()
  const page = await context.newPage()
  b.context.newPage = async () => creation.promise
  const acquiring = context.newPage()
  await context.close(); creation.resolve(b.page)
  await assert.rejects(acquiring, /resource is closing/)
  assert.throws(() => page.keyboard.press('Space'), /resource is closing/)
  assert.ok(b.calls.some(c => c[0] === 'page-close')); f.admission.dispose()
})


test('a primary failure cannot disable deadline shutdown during pending cleanup', () => {
  const f = fixture(), original = new Error('original action failure')
  f.admission.fail(original); f.at(180000); f.timers[1].fn()
  assert.equal(f.expired.length, 1); assert.equal(f.admission.report.failure, String(original))
  assert.equal(f.admission.report.timedOut, 'frames')
  f.at(355000); f.timers[0].fn()
  assert.equal(f.expired.length, 1); assert.throws(() => f.admission.check(), error => error === original)
  f.admission.cleanupFailed(new Error('final close failure'))
  assert.equal(f.admission.report.status, 'failed'); assert.equal(f.admission.report.failure, String(original))
  assert.deepEqual(f.admission.report.cleanupErrors, ['Error: final close failure']); f.admission.dispose()
})

test('outer abort immediately closes an already-forwarded action and retains its original reason', async () => {
  const action = pending(); let context
  const f = fixture({ onExpire() { return context.close() } })
  const b = browserFixture(f, { close() { action.reject(new Error('context closing')) } })
  b.target.click = async () => action.promise
  context = await b.browser.newContext(); const page = await context.newPage()
  const click = page.getByRole('button', { name: 'Menu' }).click(), original = new Error('outer stop')
  f.controller.abort(original); await assert.rejects(click, /context closing/)
  assert.equal(f.expired.length, 0) // custom close callback, not the fixture recorder
  assert.throws(() => f.admission.check(), error => error === original)
  assert.equal(f.admission.report.failure, String(original)); f.admission.dispose()
})


test('first cleanup failure cannot skip remaining closes or replace the primary error', async () => {
  const f = fixture(), original = new Error('original failure'), calls = []
  f.admission.fail(original)
  const closed = await cleanupGameplayResources(f.admission, {
    context: { async close() { calls.push('context'); throw new Error('context close failed') } },
    browser: { async close() { calls.push('browser'); throw new Error('browser close failed') } },
    server: { async close() { calls.push('server') } },
  })
  assert.equal(closed, false); assert.deepEqual(calls, ['context', 'browser', 'server'])
  assert.equal(f.admission.report.failure, String(original)); assert.equal(f.admission.report.status, 'failed')
  assert.deepEqual(f.admission.report.cleanup.map(r => [r.name, r.status]), [['context', 'failed'], ['browser', 'failed'], ['server', 'closed']])
  assert.equal(f.timers.some(t => t.cancelled), false, 'cleanup itself never disarms the deadline')
  f.admission.dispose()
})
