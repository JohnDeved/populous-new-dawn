import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
function diagnosticsFixture() {
  let reads = 0, interval, clears = 0
  const report = {}, page = { evaluate: async () => { reads++; return { turn: 1 } } }
  const start = source.indexOf('export function startSpellTestDiagnostics(')
  const end = source.indexOf('// Public controls', start)
  assert.ok(start >= 0 && end > start)
  const factory = vm.runInNewContext(source.slice(start, end).replace('export ', '') + '\nstartSpellTestDiagnostics', {
    performance: { now: () => 20 }, setInterval: (fn, ms) => { assert.equal(ms, 250); interval = fn; return 1 },
    clearInterval: () => { clears++ }, spellTestDiagnosticSnapshot: () => {},
  })
  return { api: factory(page, report), report, reads: () => reads, tick: () => interval(), clears: () => clears }
}
test('substage markers retain attribution without added page reads or timers', async () => {
  const f = diagnosticsFixture()
  f.api.mark('pending'); f.api.mark('completed')
  assert.equal(f.reads(), 0)
  assert.equal(f.report.diagnostics.stage, 'completed')
  f.api.stage('normal stage'); await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.reads(), 1)
  await f.tick(); assert.equal(f.reads(), 2)
  f.api.stop(); f.api.mark('ignored'); f.api.stage('ignored'); await f.tick()
  assert.equal(f.reads(), 2); assert.equal(f.clears(), 1)
  assert.equal(f.report.diagnostics.stage, 'normal stage')
})
function flow({ visible = true, fail = null } = {}) {
  const start = source.indexOf('waitReady = async phase => {'), end = source.indexOf('\n    }\n  try {', start)
  assert.ok(start >= 0 && end > start)
  const events = [], stages = [], error = new Error('controlled failure'),
    step = async name => { events.push(name); if (fail === name) throw error }
  let waits = 0
  const page = {
    waitForFunction: async () => { await step(++waits === 1 ? 'predicate' : 'unlocked'); return { dispose: () => step('dispose') } },
    locator: selector => { assert.equal(selector, '.skip-introduction'); return { isVisible: async () => { await step('visible'); return visible }, click: () => step('click') } },
  }
  const run = vm.runInNewContext('(' + source.slice(start + 'waitReady = '.length, end) + '\n})', {
    page, bindGame: () => step('bind'), diagnostics: { stage: s => stages.push(s), mark: s => stages.push(s) },
  })
  return { run: () => run('restart'), events, stages, error }
}
test('visible skip preserves exact action ordering and annotates completion', async () => {
  const f = flow(); await f.run()
  assert.deepEqual(f.events, ['bind', 'predicate', 'visible', 'click', 'dispose', 'unlocked'])
  assert.ok(f.stages.includes('restart: skip introduction click completed'))
  assert.ok(f.stages.includes('restart: readiness handle disposed'))
})
test('absent skip preserves original no-click behavior', async () => {
  const f = flow({ visible: false }); await f.run()
  assert.deepEqual(f.events, ['bind', 'predicate', 'visible', 'dispose', 'unlocked'])
  assert.ok(f.stages.includes('restart: skip introduction visible=false'))
})
for (const [fail, last] of [['visible', 'input or introduction predicate resolved'], ['click', 'skip introduction click pending'], ['dispose', 'readiness handle disposal pending'], ['unlocked', 'await unlocked input']]) {
  test(`original ${fail} failure preserved with last substage`, async () => {
    const f = flow({ fail }); await assert.rejects(f.run(), e => e === f.error)
    assert.equal(f.stages.at(-1), `restart: ${last}`)
  })
}
test('absolute watchdog and readiness predicates stay unchanged', () => {
  assert.match(source, /export const spellTestLimitMs = 75000/)
  assert.match(source, /report\.timedOut = true; diagnostics\.stop\(\); void context\.close\(\)\.catch\(\(\) => \{\}\)/)
  assert.match(source, /Math\.max\(0, spellTestLimitMs - \(performance\.now\(\) - started\)\)/)
  assert.match(source, /const state = await page\.waitForFunction\(\(\) => !window\.testStore\.getWorld\(\)\.inputMask \|\| document\.querySelector\('\.skip-introduction'\)\)/)
  assert.match(source, /await page\.waitForFunction\(\(\) => !window\.testStore\.getWorld\(\)\.inputMask\)/)
})
