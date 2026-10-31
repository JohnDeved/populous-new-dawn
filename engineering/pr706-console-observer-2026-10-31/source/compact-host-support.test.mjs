import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHostTiming, writeCompactReport, closeUnusedHarness, retainActiveCase } from './compact-host-support.mjs'
import current from './compact-portrait-campaign.mjs'
import previous from './compact-portrait-campaign.v3-original.mjs'

const clone = x => JSON.parse(JSON.stringify(x))
function temporary(run) {
  const dir = mkdtempSync(join(tmpdir(), 'pr706-host-fixture-'))
  return Promise.resolve().then(() => run(dir)).finally(() => rmSync(dir, { recursive: true, force: true }))
}
test('compact serialization preserves every parsed field, snapshot and intermediate synchronous save', () => temporary(async dir => {
  const path = join(dir, 'report.json'), report = { cases: [], values: [null, false, true, 1.25, -0, 'unicode⚡\n"\\'], omitted: undefined }
  for (let i = 0; i < 80; i++) {
    report.cases.push({ before: { selected: [i], people: Array.from({ length: 20 }, (_, id) => ({ id, orders: [i, id] })) }, after: { i } })
    writeCompactReport(path, report)
    assert.deepEqual(JSON.parse(readFileSync(path)), JSON.parse(JSON.stringify(report, null, 2)))
  }
  assert.ok(readFileSync(path).length < Buffer.byteLength(JSON.stringify(report, null, 2)))
}))
test('monotonic host spans retain pending, success, failure and synchronous write timing without timers', async () => {
  let tick = 10; const events = [], failure = new Error('operation failure')
  const timing = createHostTiming('unused', { now: () => tick++, append: (_, value) => events.push(JSON.parse(value)) })
  assert.equal(await timing.run('actions', 'success', async () => 42), 42)
  assert.throws(() => timing.sync('report-writes', 'failure', () => { throw failure }), e => e === failure)
  void timing.run('startup', 'pending', () => new Promise(() => {}))
  assert.deepEqual(events.map(e => [e.id, e.phase]), [[1, 'begin'], [1, 'end'], [2, 'begin'], [2, 'end'], [3, 'begin']])
  assert.equal(events[1].durationMs, 1); assert.equal(events[3].status, 'failed'); assert.match(events[3].error, /operation failure/)
  assert.ok(events.every((e, i) => i === 0 || e.startMs >= events[i - 1].startMs))
})
test('timing write failures are surfaced and do not prevent the operation or cleanup', async () => {
  const errors = [], operations = [], timing = createHostTiming('unused', { append: () => { throw Error('disk') }, onError: e => errors.push(String(e)) })
  await assert.rejects(() => timing.run('cleanup', 'close', async () => operations.push('closed')), /disk/)
  assert.deepEqual(operations, ['closed']); assert.equal(errors.length, 2)
})

function fakeHarness({ failPrimary = false, failNewPage = false, failCloseCase = null, caseEvents = [] } = {}) {
  const contexts = [], inputs = [], events = [], browser = {}
  function emitCaseEvents(ctx, phase, target) {
    for (const event of caseEvents.filter(event => event.caseIndex === contexts.indexOf(ctx) && event.phase === phase)) {
      events.push(`emit-${event.kind}-${phase}-${contexts.indexOf(ctx)}`)
      target.emit(event.kind, event.kind === 'console'
        ? { type: () => event.type, text: () => event.text }
        : new Error(event.text))
    }
  }
  function context(options, initial = false) {
    const listeners = new Map()
    const ctx = { options, initial, closed: false, closeCalls: 0, page: null, extraPages: [], browser: () => browser,
      on(name, callback) { const callbacks = listeners.get(name) ?? []; callbacks.push(callback); listeners.set(name, callbacks) },
      emit(name, value) { for (const callback of listeners.get(name) ?? []) callback(value) },
      pages() { return this.page ? [this.page, ...this.extraPages] : [] },
      async close() {
        this.closeCalls++
        if (!initial && this.page) emitCaseEvents(this, 'close', this.page)
        if (!initial && contexts.indexOf(this) === failCloseCase) {
          events.push(`close-rejected-${failCloseCase}`)
          throw Error(`injected close failure case ${failCloseCase}`)
        }
        this.closed = true; events.push(initial ? 'close-unused' : `close-${contexts.indexOf(this)}`)
      },
      async newPage() {
        if (failNewPage && !initial) throw Error('new page failed')
        assert.equal(this.page, null); this.page = page(this); this.emit('page', this.page); return this.page
      } }
    contexts.push(ctx); return ctx
  }
  function page(ctx) {
    const listeners = new Map()
    let viewport = { ...ctx.options.viewport }, advisory = true, primaries = 0
    const state = { selected: [1], camera: { x: 10, y: 20 }, turn: 7, paused: true, randomState: 123,
      orders: [], soundSerial: 0, sounds: [], shaman: 2, people: [{ id: 1, x: 3, z: 4 }, { id: 2, x: 10, z: 12 }] }
    const sound = cues => { for (const cue of cues) state.sounds.push({ serial: ++state.soundSerial, cue }) }
    const locator = name => ({
      or() { return this }, first() { return this },
      async waitFor() { inputs.push(['waitFor', String(name)]) },
      async focus() { inputs.push(['focus', String(name)]); p.focused = name },
      async count() { return name instanceof RegExp ? Number(advisory) : 1 },
      async click(options = {}) {
        inputs.push(['click', name, options])
        if (name === 'Select brave') state.selected = [1]
        if (name === 'Select shaman') {
          if (options.button === 'right') { state.camera = { x: Math.round(10 * 256 + 2048) & 65535, y: Math.round(-12 * 256 - 2048) & 65535 } }
          else {
            if (failPrimary && ++primaries === 2) throw Error('injected primary failure')
            state.selected = [1, 2]; sound(options.modifiers?.includes('Shift') ? [0x18, 0x58] : [0x18])
          }
        }
      },
      async evaluateAll(fn) { assert.equal(typeof fn, 'function'); return geometry(viewport) },
    })
    const p = { focused: null, context: () => ctx, isClosed: () => ctx.closed, viewportSize: () => viewport,
      setDefaultTimeout(value) { assert.equal(value, 20000) },
      on(name, callback) { const callbacks = listeners.get(name) ?? []; callbacks.push(callback); listeners.set(name, callbacks) },
      emit(name, value) { for (const callback of listeners.get(name) ?? []) callback(value) },
      getByRole: (_, { name }) => locator(name), getByLabel: name => locator(name),
      async goto(url, options) {
        inputs.push(['goto', url, options]); p.currentUrl = url
        emitCaseEvents(ctx, 'goto', p)
        if (caseEvents.some(event => event.caseIndex === contexts.indexOf(ctx) && event.phase === 'popup')) {
          const popup = page(ctx); ctx.extraPages.push(popup); ctx.emit('page', popup)
          emitCaseEvents(ctx, 'popup', popup)
        }
      },
      async setViewportSize(value) { inputs.push(['viewport', value]); viewport = { ...value } },
      async waitForFunction() { inputs.push(['waitForFunction']) },
      keyboard: { async press(key) {
        inputs.push(['key', key]); if (key === 'Enter' && p.focused instanceof RegExp) advisory = false
        if (p.focused === 'Select shaman') sound([0x18])
      } },
      async evaluate(fn) {
        const source = fn.toString()
        if (source.includes('hudPersonSource')) return clone(state)
        if (source.includes('WEBGL_debug_renderer_info')) return { version: 'fixture', renderer: 'fixture; no browser evidence', dpr: ctx.options.deviceScaleFactor }
        return undefined
      },
      async screenshot({ path }) { inputs.push(['screenshot', path.split('/').at(-1)]); events.push('screenshot'); writeFileSync(path, 'fixture bytes, not a rendered PNG') },
    }
    return p
  }
  browser.newContext = async options => { events.push('new-context'); return context(options) }
  const initialContext = context({ viewport: { width: 1440, height: 1000 } }, true)
  initialContext.page = page(initialContext)
  return { browser, context: initialContext, page: initialContext.page, receipt: {}, contexts, inputs, events }
}
function geometry({ width, height }) {
  const box = (left, top, right, bottom) => ({ left, top, right, bottom })
  const text = rect => ({ ...rect, fontSize: 12, contentFits: true, fragments: [rect], clips: [] })
  return { witness: { viewport: [width, height], overflow: false, worldMessages: [text(box(300, 220, 500, 250))],
    campaignText: [text(box(120, 180, 250, 210))], pause: box(400, 100, 500, 150) },
    controls: Object.fromEntries(['portrait', 'brave', 'resume', 'settings', 'campaign', 'dismiss'].map((key, i) => [key,
      { count: 1, supported: true, visible: true, enabled: true, ...box(5 + i * 35, 5, 30 + i * 35, 25), reachable: true }])), unexpectedLabels: [] }
}
async function runScenario(scenario, dir, options = {}) {
  mkdirSync(join(dir, 'scripts/tutorial-browser'), { recursive: true })
  writeFileSync(join(dir, 'scripts/browser-game.mjs'), 'export async function bindGame() {}')
  writeFileSync(join(dir, 'scripts/browser-new-game.mjs'), 'export async function openCampaignFromMainMenu() {}')
  writeFileSync(join(dir, 'scripts/tutorial-browser/compact-message-layout.mjs'), 'export function compactMessageWitness() { return {} }')
  const host = fakeHarness(options), signal = new AbortController().signal
  let result, error
  try { result = await scenario({ ...host, root: dir, url: 'http://fixture.invalid/', output: dir, signal }) }
  catch (e) { error = e }
  const report = JSON.parse(readFileSync(join(dir, 'compact-portrait-campaign.json')))
  return { ...host, result, error, report }
}
test('actual adapter preserves all80 checks/20 captures, parsed evidence and input sequence with FOUR fresh isolated contexts', () => temporary(async dir => {
  const a = join(dir, 'v3'), b = join(dir, 'v4'); mkdirSync(a); mkdirSync(b)
  const old = await runScenario(previous, a), next = await runScenario(current, b)
  assert.ifError(old.error); assert.ifError(next.error)
  const strip = report => { const result = clone(report); delete result.scenarioSha256; return result }
  assert.deepEqual(strip(next.report), strip(old.report)); assert.deepEqual(next.inputs, old.inputs)
  assert.equal(next.report.cases.flatMap(c => c.checks).length, 80)
  assert.equal(next.report.cases.flatMap(c => c.captures).length, 20)
  assert.equal(next.contexts.length, 5); assert.ok(next.contexts.every(c => c.closed))
  assert.deepEqual(next.contexts.slice(1).map(c => c.options), [1, 1, 2, 2].map(dpr => ({ viewport: { width: 960, height: 720 }, deviceScaleFactor: dpr })))
  assert.equal(next.events[0], 'close-unused'); assert.equal(next.events[1], 'new-context')
  assert.ok(!old.contexts[0].closed); assert.ok(old.contexts.slice(1).every(c => c.closed))
  const spans = readFileSync(join(b, 'compact-portrait-campaign-timings.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
  assert.equal(spans.filter(s => s.category === 'report-writes' && s.phase === 'end').length, 109)
  for (const category of ['startup', 'actions', 'observations', 'screenshots', 'report-writes', 'cleanup']) assert.ok(spans.some(s => s.category === category))
  for (const s of spans.filter(s => s.phase === 'end')) { assert.equal(s.status, 'passed'); assert.ok(s.durationMs >= 0) }
}))
for (const phase of ['goto', 'close']) for (const kind of ['console', 'pageerror'])
  test(`actual case observers reject ${kind} errors during ${phase} in all four fresh contexts`, () => temporary(async dir => {
    const caseEvents = [1, 2, 3, 4].map(caseIndex => ({ caseIndex, phase, kind, type: 'error', text: `injected ${kind} ${phase} case ${caseIndex}` }))
    const result = await runScenario(current, dir, { caseEvents })
    assert.ok(result.error); assert.equal(result.report.status, 'failed')
    assert.equal(result.report.errors.length, 4)
    for (const event of caseEvents) assert.ok(result.report.errors.some(error => error.includes(event.text)))
    assert.equal(result.report.cases.flatMap(c => c.checks).length, 80)
    assert.equal(result.report.cases.flatMap(c => c.captures).length, 20)
    assert.equal(result.contexts.length, 5); assert.ok(result.contexts.every(c => c.closed))
    assert.equal(result.result, undefined)
    if (kind === 'console') assert.deepEqual(result.report.cases.map(c => c.consoleMessages), caseEvents.map(event => [{ type: 'error', text: event.text }]))
    else assert.ok(result.report.cases.every(c => !Object.hasOwn(c, 'consoleMessages')))
  }))
test('case console warnings are retained without failing and ordinary console messages stay ignored', () => temporary(async dir => {
  const caseEvents = [1, 2, 3, 4].flatMap(caseIndex => ['warning', 'log', 'info', 'debug'].map(type => ({
    caseIndex, phase: 'goto', kind: 'console', type, text: `injected ${type} case ${caseIndex}`,
  })))
  const result = await runScenario(current, dir, { caseEvents })
  assert.ifError(result.error); assert.equal(result.report.status, 'passed'); assert.deepEqual(result.report.errors, [])
  assert.deepEqual(result.report.cases.map(c => c.consoleMessages), [1, 2, 3, 4].map(caseIndex => [{ type: 'warning', text: `injected warning case ${caseIndex}` }]))
  assert.equal(result.report.cases.flatMap(c => c.checks).length, 80)
  assert.equal(result.report.cases.flatMap(c => c.captures).length, 20)
  assert.ok(result.contexts.every(c => c.closed))
  const spans = readFileSync(join(dir, 'compact-portrait-campaign-timings.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
  assert.equal(spans.filter(s => s.category === 'report-writes' && s.phase === 'end').length, 109)
}))
test('fresh-context ownership also observes a newly opened secondary page before its console event', () => temporary(async dir => {
  const result = await runScenario(current, dir, { caseEvents: [{ caseIndex: 2, phase: 'popup', kind: 'console', type: 'error', text: 'secondary page console error' }] })
  assert.ok(result.error); assert.equal(result.report.status, 'failed')
  assert.deepEqual(result.report.errors, ['900x360/dpr1 console: secondary page console error'])
  assert.deepEqual(result.report.cases[1].consoleMessages, [{ type: 'error', text: 'secondary page console error' }])
  assert.equal(result.contexts[2].extraPages.length, 1)
  assert.ok(result.contexts.every(c => c.closed)); assert.ok(result.contexts[2].extraPages[0].isClosed())
  assert.equal(result.report.cases.flatMap(c => c.checks).length, 80)
  assert.equal(result.report.cases.flatMap(c => c.captures).length, 20)
}))
test('rejected case cleanup retains simultaneous console diagnostics and prior evidence without claiming cleanup or continuing', () => temporary(async dir => {
  const caseEvents = ['error', 'warning'].map(type => ({ caseIndex: 2, phase: 'close', kind: 'console', type, text: `cleanup ${type} before rejection` }))
  const result = await runScenario(current, dir, { failCloseCase: 2, caseEvents })
  assert.ok(result.error); assert.match(result.error.message, /injected close failure case 2/)
  assert.equal(result.report.status, 'failed'); assert.match(result.report.failure, /injected close failure case 2/)
  assert.equal(result.result, undefined)
  assert.deepEqual(result.report.errors, ['900x360/dpr1 console: cleanup error before rejection'])
  assert.deepEqual(result.report.cases[1].consoleMessages, [
    { type: 'error', text: 'cleanup error before rejection' },
    { type: 'warning', text: 'cleanup warning before rejection' },
  ])
  assert.equal(result.report.cases.length, 2)
  assert.deepEqual(result.report.cases.map(c => c.checks.length), [20, 20])
  assert.deepEqual(result.report.cases.map(c => c.captures.length), [5, 5])
  assert.equal(result.contexts.length, 3)
  assert.deepEqual(result.contexts.map(c => c.closeCalls), [1, 1, 1])
  assert.deepEqual(result.contexts.map(c => c.closed), [true, true, false])
  assert.equal(result.contexts[2].page.isClosed(), false)
  assert.deepEqual(result.events.slice(-3), ['emit-console-close-2', 'emit-console-close-2', 'close-rejected-2'])
  const spans = readFileSync(join(dir, 'compact-portrait-campaign-timings.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
  const failedClose = spans.filter(s => s.category === 'cleanup' && s.label === '900x360/dpr1:close-case-context')
  assert.deepEqual(failedClose.map(s => s.phase), ['begin', 'end'])
  assert.equal(failedClose[1].status, 'failed'); assert.match(failedClose[1].error, /injected close failure case 2/)
}))
for (const failure of ['failPrimary', 'failNewPage']) test(`failed ${failure} keeps earlier saved evidence and closes active context`, () => temporary(async dir => {
  const result = await runScenario(current, dir, { [failure]: true })
  assert.ok(result.error); assert.equal(result.report.status, 'failed'); assert.ok(result.contexts.every(c => c.closed))
  if (failure === 'failPrimary') {
    assert.match(result.report.failure, /injected primary failure/)
    assert.equal(result.report.cases[0].checks.length, 1); assert.equal(result.report.cases[0].captures.length, 1)
    assert.ok(result.report.cases[0].failureEvidence.observation.state)
    assert.ok(result.report.cases[0].failureEvidence.screenshot.sha256)
    assert.ok(result.events.lastIndexOf('screenshot') < result.events.lastIndexOf('close-1'))
  }
}))
for (const invalid of ['profile', 'other-page', 'wrong-context', 'closed']) test(`unused harness guard rejects ${invalid} without closing`, async () => {
  const host = fakeHarness()
  if (invalid === 'profile') host.receipt.profile = { path: 'fixture' }
  if (invalid === 'other-page') host.context.pages = () => [host.page, {}]
  if (invalid === 'wrong-context') host.page.context = () => ({})
  if (invalid === 'closed') host.page.isClosed = () => true
  await assert.rejects(() => closeUnusedHarness(host)); assert.equal(host.events.length, 0)
})
test('aborted overall deadline prevents extra browser diagnostics or screenshot work', async () => {
  const abort = new AbortController(); abort.abort(Error('overall deadline'))
  const evidence = await retainActiveCase({ caseId: 'case', signal: abort.signal, observe: () => assert.fail('must not observe'),
    measured: () => assert.fail('must not measure'), page: { screenshot: () => assert.fail('must not capture') } })
  assert.match(evidence.unavailable, /deadline already aborted/)
})
test('diagnostic failure still attempts screenshot before close and never replaces original failure', () => temporary(async dir => {
  const events = [], evidence = await retainActiveCase({ caseId: 'case', output: dir, signal: new AbortController().signal,
    observe: async () => { events.push('observe'); throw Error('diagnostic unavailable') }, measured: async (_, __, operation) => operation(),
    page: { isClosed: () => false, screenshot: async ({ path }) => { events.push('screenshot'); writeFileSync(path, 'fixture') } } })
  assert.deepEqual(events, ['observe', 'screenshot']); assert.match(evidence.observationError, /diagnostic unavailable/); assert.ok(evidence.screenshot.sha256)
}))

for (const failPhase of ['begin', 'end']) test(`actual terminal save fails closed on ${failPhase} timing append failure`, async () => {
  const source = readFileSync(new URL('./compact-portrait-campaign.mjs', import.meta.url), 'utf8')
  const terminal = source.slice(source.lastIndexOf('    assert.equal(report.cases.length'), source.lastIndexOf('\n}'))
  const run = new Function('assert', 'report', 'save', `return (async()=>{try {${terminal}})()`)
  const report = { cases: Array.from({ length: 4 }, () => ({ status: 'passed' })), errors: [], status: 'running' }
  const writes = [], error = new Error(`final ${failPhase} append failed`)
  let injected = false
  const timing = createHostTiming('unused', { append: (_, line) => {
    if (!injected && JSON.parse(line).phase === failPhase) { injected = true; throw error }
  }, onError: e => report.errors.push(String(e)) })
  const save = () => timing.sync('report-writes', 'report', () => writes.push(clone(report)))
  await assert.rejects(run(assert, report, save), e => e === error)
  assert.equal(writes.length, 2); assert.equal(writes.at(-1).status, 'failed')
  assert.match(writes.at(-1).failure, /append failed/); assert.ok(writes.at(-1).errors.length)
  assert.equal(report.status, 'failed')
})
