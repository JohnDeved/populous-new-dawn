import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { spellTestDiagnosticSnapshot, startSpellTestDiagnostics } from '../scripts/tutorial-browser/spell-test-menu.mjs'

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
    modalSuspended: false, hidden: false, loading: true, skipIntroduction: false, dialogs: ['Game menu'],
  })
  assert.deepEqual(world, before)
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

test('F9 timeout closes immediately with the same cap and final cleanup stops observations', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
  assert.match(source, /setTimeout\(\(\) => \{ report\.timedOut = true; diagnostics\.stop\(\); void context\.close\(\) \}, 55000\)/)
  assert.match(source, /finally \{\s+clearTimeout\(timer\)\s+diagnostics\.stop\(\)\s+await context\.close\(\)/)
  for (const phase of ['new game', 'checkpoint load', 'restart'])
    assert.ok(source.includes(`await waitReady('${phase}')`))
  assert.equal((source.match(/await page\.waitForFunction\(\(\) => !window\.testStore\.getWorld\(\)\.inputMask/g) ?? []).length, 2,
    'both original readiness waits remain')
})
