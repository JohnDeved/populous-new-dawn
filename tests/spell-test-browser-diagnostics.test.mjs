import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import vm from 'node:vm'
import spellTestMenu, { spellTestDiagnosticSnapshot, startSpellTestDiagnostics, spellTestLimitMs,
  assertSpellTestDeadline, closeSpellTestContext, spellTestControlsReady } from '../scripts/tutorial-browser/spell-test-menu.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { SPELLS } from '../app/world-rules.ts'

test('batched F9 observation retains every exact spell and rejects missing, duplicate or disabled controls', () => {
  const names = SPELLS.map(spell => `Test ${spell.name}, 4 shots`)
  const read = rows => vm.runInNewContext(`(${spellTestControlsReady})(names)`, {
    names, getComputedStyle: button => button.style, document: { querySelectorAll: selector => {
      assert.equal(selector, 'dialog[data-spell-test-menu][open]')
      return [{ querySelectorAll: selector => {
        assert.equal(selector, 'button')
        return rows.map(row => ({
          style: { display: row.displayNone ? 'none' : 'block', visibility: row.visibilityHidden ? 'hidden' : 'visible' },
          getClientRects: () => row.zeroLayout ? [] : [{ width: 100, height: 25 }],
          getAttribute: name => { assert.equal(name, 'aria-label'); return row.name },
          matches: selector => { assert.equal(selector, ':disabled'); return !!row.disabled },
          closest: selector => {
            if (selector === '[hidden], [inert], [aria-hidden="true"]') return row.hidden ? {} : null
            assert.equal(selector, '[aria-disabled="true"]'); return row.ariaDisabled ? {} : null
          },
        }))
      } }]
    } },
  })
  const rows = names.map(name => ({ name })), before = structuredClone(rows)
  assert.deepEqual(JSON.parse(JSON.stringify(read(rows))), names.map(name => ({ name, count: 1, enabled: true })))
  assert.deepEqual(rows, before, 'Observation does not mutate controls')
  for (const index of [0, Math.floor(rows.length / 2), rows.length - 1]) {
    assert.equal(read(rows.filter((_, i) => i !== index)), false)
    assert.equal(read([...rows, rows[index]]), false)
    for (const field of ['disabled', 'ariaDisabled', 'hidden', 'displayNone', 'visibilityHidden', 'zeroLayout']) {
      const changed = structuredClone(rows); changed[index][field] = true
      assert.equal(read(changed), false)
    }
    const stale = structuredClone(rows); stale[index].name = stale[index].name.replace('4 shots', '3 shots')
    assert.equal(read(stale), false, 'A different stock label is not the expected exact control')
  }
})

test('F9 diagnostics read current readiness and modal state without mutating the game', () => {
  const world = { turn: 4, inputMask: 192, paused: false, flyby: { flags: 16 }, status: 'playing' },
    before = structuredClone(world),
    scene = { world, renderer: { domElement: { isConnected: true } }, started: true, disposed: false, modalSuspended: false },
    document = { hidden: false, querySelector: selector => selector === '.loading-world' ? {} : null,
      querySelectorAll: () => [{ getAttribute: () => 'Game menu' }] }
  const state = vm.runInNewContext(`(${spellTestDiagnosticSnapshot})()`, {
    window: { testStore: { getWorld: () => world }, testSceneRef: { current: scene } }, document,
  })
  assert.deepEqual(JSON.parse(JSON.stringify(state)), {
    turn: 4, inputMask: 192, paused: false, flybyFlags: 16, status: 'playing',
    sceneMatchesWorld: true, sceneConnected: true, sceneStarted: true, sceneDisposed: false,
    modalSuspended: false, hidden: false, loading: true, introductionActive: false, dialogs: ['Game menu'],
  })
  assert.deepEqual(world, before)
  for (const flags of [0, 1, 16, 17, 64, 65]) {
    const current = { ...world, flyby: { flags } }, saved = structuredClone(current)
    const snapshot = vm.runInNewContext(`(${spellTestDiagnosticSnapshot})()`, {
      window: { testStore: { getWorld: () => current }, testSceneRef: { current: { ...scene, world: current } } }, document,
    })
    assert.equal(snapshot.introductionActive, !!(flags & 1), 'native active bit, not a removed Skip element')
    assert.deepEqual(current, saved, 'diagnostic reads cannot mutate introduction state')
  }
  assert.doesNotThrow(() => vm.runInNewContext(`(${spellTestDiagnosticSnapshot})()`, { window: {}, document }))
})

test('F9 retains stage timing and last state; pending reads cannot delay cleanup or mutate a stopped report', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] })
  let resolve, calls = 0
  const page = { evaluate: () => { calls++; return new Promise(done => { resolve = done }) } },
    report = {}, diagnostics = startSpellTestDiagnostics(page, report)
  diagnostics.stage('new game: bind scene')
  t.mock.timers.tick(1000)
  assert.equal(calls, 1, 'never stack observations behind a stalled page')
  resolve({ turn: 0, inputMask: 128 })
  await Promise.resolve()
  assert.equal(report.diagnostics.lastState.stage, 'new game: bind scene')
  assert.equal(report.diagnostics.lastState.inputMask, 128)
  diagnostics.stage('restart: await input or introduction')
  assert.equal(calls, 2)
  assert.equal(diagnostics.stop(), undefined, 'cleanup is synchronous, without a page await')
  const stopped = structuredClone(report)
  resolve({ turn: 99, inputMask: 0 })
  await Promise.resolve()
  t.mock.timers.tick(1000)
  diagnostics.stage('must not overwrite terminal state')
  diagnostics.stop()
  assert.equal(calls, 2)
  assert.deepEqual(report, stopped, 'late observation cannot rewrite the terminal report')
  assert.deepEqual(report.diagnostics.stages.map(entry => entry.stage),
    ['new game: bind scene', 'restart: await input or introduction'])
  assert.ok(report.diagnostics.stages.every(entry => Number.isFinite(entry.elapsedMs) && entry.elapsedMs >= 0))
  assert.ok(report.diagnostics.stoppedAtMs >= report.diagnostics.stages.at(-1).elapsedMs)
})

test('diagnostic read errors are retained without rejecting the scenario', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] })
  const report = {}, diagnostics = startSpellTestDiagnostics({
    evaluate: async () => { throw Error('read interrupted') },
  }, report)
  diagnostics.stage('checkpoint load')
  await Promise.resolve()
  diagnostics.stop()
  assert.equal(report.diagnostics.observationError, 'Error: read interrupted')
})

test('F9 uses one absolute measured-headroom cap without changing readiness or the shared deadline', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
  assert.equal(spellTestLimitMs, 75000)
  assert.equal(browserCapMs('frontend-held-escape'), 180000)
  assert.equal((source.match(/setTimeout\(/g) ?? []).length, 1, 'never restart the watchdog per stage')
  assert.match(source, /report\.timedOut = true; diagnostics\.stop\(\); void context\.close\(\)\.catch/)
  assert.match(source, /Math\.max\(0, spellTestLimitMs - \(performance\.now\(\) - started\)\)/)
  assert.match(source, /try \{ await closeSpellTestContext\(context, report, started\) \}[\s\S]+clearTimeout\(timer\)/,
    'the existing watchdog remains active throughout final cleanup')
  assert.match(source, /page\.setDefaultTimeout\(12000\)/)
  assert.match(source, /report\.status = failure \? 'failed' : 'passed'/)
  assert.doesNotMatch(source, /report\.status = 'passed'/, 'no success before final cleanup validation')
  for (const phase of ['new game', 'checkpoint load', 'restart'])
    assert.ok(source.includes(`await waitReady('${phase}')`))
  assert.match(source, /import \{ skipIntroductionWithSpace \} from '\.\.\/browser-introduction\.mjs'/)
  assert.match(source, /await bindGame\(page\)[\s\S]*?await skipIntroductionWithSpace\(page, \{ timeout: 12000 \}\)[\s\S]*?await page\.waitForFunction\(\(\) => !window\.testStore\.getWorld\(\)\.inputMask\)/,
    'shared bounded native readiness precedes the final unlocked-input wait')
  assert.equal((source.match(/await skipIntroductionWithSpace\(page, \{ timeout: 12000 \}\)/g) ?? []).length, 1)
  assert.equal((source.match(/await page\.waitForFunction\(\(\) => !window\.testStore\.getWorld\(\)\.inputMask/g) ?? []).length, 1,
    'final readiness wait remains after the shared native helper')
  assert.doesNotMatch(source, /\.skip-introduction/, 'readiness cannot depend on the removed browser button')
})

test('F9 absolute deadline admits measured slow progress but never resets elapsed time', () => {
  const report = { capMs: spellTestLimitMs }, started = 1000
  assert.equal(assertSpellTestDeadline(report, started, () => started + 50327), 24673)
  assert.equal(assertSpellTestDeadline(report, started, () => started + 57040), 17960)
  assert.equal(report.elapsedMs, 57040)
  for (const elapsed of [75000, 75001, Infinity, NaN, -1])
    assert.throws(() => assertSpellTestDeadline({}, started, () => started + elapsed), /absolute deadline/)
  assert.throws(() => assertSpellTestDeadline({ timedOut: true }, started, () => started + 70000),
    /absolute deadline/, 'a fired watchdog cannot be certified by an earlier clock reading')
})

test('F9 cleanup rejects late resolution and watchdog expiry, retaining explicit elapsed evidence', async () => {
  let now = 74000, release
  const report = {}, context = { close: () => new Promise(resolve => { release = resolve }) },
    pending = closeSpellTestContext(context, report, 0, () => now)
  now = 75001
  release()
  await assert.rejects(pending, /absolute deadline/)
  assert.equal(report.elapsedMs, 75001)
  assert.equal(report.contextClosed, true)
  await assert.rejects(closeSpellTestContext({ close: async () => {} },
    { timedOut: true }, 0, () => 74000), /absolute deadline/)
  const passed = {}
  await closeSpellTestContext({ close: async () => {} }, passed, 0, () => 74999)
  assert.deepEqual(passed, { contextClosed: true, elapsedMs: 74999 })
})

test('F9 expired setup cannot enter gameplay or write a passing report', async t => {
  const output = mkdtempSync(join(tmpdir(), 'pnd-f9-deadline-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  let now = 0, navigation = 0
  t.mock.method(performance, 'now', () => now)
  const page = { setDefaultTimeout() {}, on() {}, getByRole: () => ({}), evaluate: async () => ({}),
    goto: async () => { navigation++ }, screenshot: async () => {} },
    context = { newPage: async () => page, close: async () => {} },
    browser = { newContext: async () => { now = spellTestLimitMs; return context } }
  await assert.rejects(spellTestMenu({ browser, url: 'http://unused.invalid', output }), /absolute deadline/)
  assert.equal(navigation, 0)
  const report = JSON.parse(readFileSync(join(output, 'f9-cheats.json'), 'utf8'))
  assert.equal(report.status, 'failed')
  assert.equal(report.capMs, 75000)
  assert.equal(report.elapsedMs, 75000)
  assert.equal(report.contextClosed, true)
})
