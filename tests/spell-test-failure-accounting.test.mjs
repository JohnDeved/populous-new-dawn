import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Execute the entire authored episode, including its helpers and finalizers.
// Only imports/exports are replaced. Browser, clock, timer and output ports are
// supplied in memory; these controls do not qualify a rendered browser run.
const raw = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
assert.equal((raw.match(/^import .*$/gm) ?? []).length, 9)
const source = raw.replace(/^import .*\n/gm, '').replace(/^export default /gm, '').replace(/^export /gm, '')
const failures = [
  ['undefined', undefined], ['null', null], ['false', false], ['zero', 0], ['NaN', NaN], ['empty', ''],
  ['Error', Error('supplied failure')], ['object', { message: 'supplied object' }],
  ['symbol', Symbol('supplied failure')], ['bigint', 0n],
]

async function runEpisode(faults = {}) {
  const writes = [], timers = new Set(), cancelled = [], screenshots = []
  let now = 0, closed = 0, dispatchClosed = 0, retained = 0, snapshotsRead = 0
  const saved = { checkpoint: { turn: 1 }, profile: null }, ordinary = { turn: 1, paused: false },
    unlocked = { cheatsUsed: true, shots: { blast: 3 } },
    casting = { shots: { blast: 2 }, shaman: { casting: { remaining: 1 } },
      projectiles: [{ spell: 'blast', phase: 'windup', remaining: 1 }], castingTribes: [{ cooldown: 1 }] },
    reset = { cheatsUsed: false, shots: { teleport: 0 } },
    snapshots = [ordinary, ordinary, ordinary, ordinary, ordinary, ordinary,
      unlocked, { manaTribes: [{ available: 1_000_000 }] }, { mode: 'blast' }, casting, casting, casting, reset, reset, reset, reset]
  const rejectAt = name => { if (Object.hasOwn(faults, name)) throw faults[name] },
    timer = callback => { timers.add(callback); return callback }, clear = id => timers.delete(id),
    control = {
      click: async () => {}, waitFor: async () => {}, focus: async () => {}, scrollIntoViewIfNeeded: async () => {},
      count: async () => 0, isVisible: async () => true, isDisabled: async () => true,
      evaluate: async () => true, boundingBox: async () => ({ x: 0, y: 0, width: 100, height: 100 }),
    },
    page = {
      setDefaultTimeout(value) { assert.equal(value, 12000) }, on() {},
      getByRole: () => control, getByText: () => control, locator: () => control,
      keyboard: { down: async () => {}, up: async () => {}, press: async () => {} },
      addInitScript: async () => rejectAt('startup'), goto: async () => {}, setViewportSize: async () => {},
      waitForTimeout: async () => {}, waitForFunction: async () => ({ dispose: async () => {} }),
      isClosed: () => false,
      async screenshot({ path }) { screenshots.push(path); rejectAt('screenshot') },
      async evaluate(fn) {
        const body = String(fn)
        if (fn.name === 'spellTestDiagnosticSnapshot') return {}
        if (body.includes("indexedDB.open('populous-new-dawn'")) return structuredClone(saved)
        if (body.includes('const w = window.testStore.getWorld()')) {
          assert.ok(snapshotsRead < snapshots.length, 'unexpected snapshot request')
          return structuredClone(snapshots[snapshotsRead++])
        }
        if (body.includes('scene.screen(')) return { x: 1, y: 1, before: 0 }
        assert.match(body, /shamanCastingObserver\.(arm|beginHold|endHold)\(/)
      },
    },
    context = { newPage: async () => page, async close() { closed++; now = faults.closeAt ?? now; rejectAt('context') } },
    bindings = {
      assert, writeFileSync(path, body) { assert.equal(path, '/supplied/f9-cheats.json'); writes.push(JSON.parse(body)) },
      resolve: (...parts) => parts.join('/'), bindGame: async () => {}, waitForStartupMenu: async () => {},
      SPELLS: [], rules: {}, beginOrdinaryCastingWitness: async () => ({}), waitForCastingWitness: async () => {},
      retainCastingWitness: async () => { retained++; rejectAt('retention'); return {} },
      prepareCastingF9: async () => ({
        click: async () => rejectAt('cast'), cancel: reason => cancelled.push(reason),
        async close() { dispatchClosed++; if (dispatchClosed > 1 || Object.hasOwn(faults, 'cast')) rejectAt('dispatch') },
      }),
      installShamanCastingInputTiming() {}, performance: { now: () => now },
      setInterval: timer, clearInterval: clear, setTimeout: timer, clearTimeout: clear,
    },
    episode = new Function(...Object.keys(bindings), source + '\nreturn spellTestMenu')(...Object.values(bindings))
  let rejected = false, reason, result
  try { result = await episode({ browser: { newContext: async () => context }, url: 'https://unused.invalid', output: '/supplied' }) }
  catch (error) { rejected = true; reason = error }
  assert.equal(closed, 1, 'context cleanup still runs once')
  assert.equal(timers.size, 0, 'watchdog and diagnostics are stopped')
  assert.equal(writes.length, 1, 'one terminal report is retained')
  return { rejected, reason, result, report: writes[0], cancelled, dispatchClosed, retained, screenshots, snapshotsRead }
}

function assertFailure(outcome, expected) {
  assert.equal(outcome.rejected, true, 'the episode must reject even a falsey value')
  assert.ok(Object.is(outcome.reason, expected), `the first rejection identity must survive cleanup: ${String(outcome.reason)}`)
  assert.equal(outcome.report.status, 'failed')
  assert.equal(outcome.report.failure, String(expected))
  assert.equal(outcome.report.stack, expected?.stack)
}

for (const [name, value] of failures) {
  test(`F9 startup rejection retains ${name}`, async () => {
    const outcome = await runEpisode({ startup: value })
    assertFailure(outcome, value)
    assert.equal(outcome.snapshotsRead, 0)
    assert.equal(outcome.retained, 1, 'partial observations are still retained')
    assert.deepEqual(outcome.screenshots, ['/supplied/f9-cheats-failure.png'])
  })

  test(`F9 context cleanup-only rejection retains ${name}`, async () => {
    const outcome = await runEpisode({ context: value })
    assertFailure(outcome, value)
    assert.equal(outcome.report.savePreservedAndLoadRestartReset, true, 'the supplied successful episode completed')
    assert.equal(outcome.snapshotsRead, 16)
    assert.equal(outcome.dispatchClosed, 2)
  })

  test(`F9 dispatch cleanup-only rejection retains ${name}`, async () => {
    const outcome = await runEpisode({ dispatch: value })
    assertFailure(outcome, value)
    assert.equal(outcome.report.savePreservedAndLoadRestartReset, true)
    assert.equal(outcome.dispatchClosed, 2)
    assert.equal(outcome.report.contextClosed, true)
  })

  test(`F9 casting rejection ${name} survives later dispatch and context errors`, async () => {
    const outcome = await runEpisode({ cast: value, dispatch: Error('later dispatch'), context: Error('later context') })
    assertFailure(outcome, value)
    assert.equal(outcome.cancelled.length, 1)
    assert.ok(Object.is(outcome.cancelled[0], value), 'dispatch cancellation receives the original reason')
    assert.equal(outcome.retained, 1)
  })

  test(`F9 startup ${name} survives retention, screenshot and context errors`, async () => {
    const outcome = await runEpisode({ startup: value, retention: Error('later retention'),
      screenshot: Error('later screenshot'), context: Error('later context') })
    assertFailure(outcome, value)
    assert.equal(outcome.report.castingRetentionError, 'Error: later retention')
    assert.equal(outcome.report.screenshotError, 'Error: later screenshot')
  })

  test(`F9 ordinary retention rejection retains ${name} without retry`, async () => {
    const outcome = await runEpisode({ retention: value })
    assertFailure(outcome, value)
    assert.equal(outcome.retained, 1)
    assert.equal(outcome.report.refillPreservesLiveCasting, true)
  })
}

test('F9 successful supplied episode still returns one passed report after cleanup', async () => {
  const outcome = await runEpisode()
  assert.equal(outcome.rejected, false)
  assert.equal(outcome.report.status, 'passed')
  assert.deepEqual(JSON.parse(JSON.stringify(outcome.result)), outcome.report)
  assert.equal(outcome.report.contextClosed, true)
  assert.equal(outcome.report.diagnostics.stage, 'completed')
  assert.equal(outcome.report.savePreservedAndLoadRestartReset, true)
  assert.equal(outcome.report.failure, undefined)
  assert.equal(outcome.retained, 1)
  assert.equal(outcome.snapshotsRead, 16)
  assert.equal(outcome.dispatchClosed, 2)
  assert.equal(outcome.cancelled[0]?.message, 'F9 episode cleanup')
})

test('F9 cleanup crossing the unchanged absolute deadline cannot pass', async () => {
  const outcome = await runEpisode({ closeAt: 75000 })
  assert.equal(outcome.rejected, true)
  assert.equal(outcome.reason?.code, 'ERR_ASSERTION')
  assert.match(outcome.report.failure, /absolute deadline/)
  assert.equal(outcome.report.status, 'failed')
  assert.equal(outcome.report.capMs, 75000)
  assert.equal(outcome.report.elapsedMs, 75000)
  assert.equal(outcome.report.contextClosed, true)
})

test('F9 first nullish failure survives deadline errors during cleanup', async () => {
  for (const startup of [undefined, null]) {
    const outcome = await runEpisode({ startup, closeAt: 75000 })
    assertFailure(outcome, startup)
    assert.equal(outcome.report.elapsedMs, 75000)
  }
})
