import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  projectionCoverage,
  projectionFunctions,
} from '../scripts/tutorial-browser/spell-projection-coverage.mjs'
import {
  assertProjectionWindow,
  finishSpellProjection,
  spellProjectionLimitMs,
} from '../scripts/tutorial-browser/spell-projection.mjs'

function coverageFixture() {
  const original = projectionFunctions.map(name => `function ${name}() { return 1 }`).join('\n')
  const lines = ['function a(){return 1}', 'function b(){return 1}', 'function c(){return 1}']
  const code = lines.join('\n')
  let start = 0
  const functions = lines.map((line, i) => {
    const result = {
      functionName: String.fromCharCode(97 + i),
      ranges: [{ startOffset: start, endOffset: start + line.length, count: 8 }],
    }
    start += line.length + 1
    return result
  })
  return {
    code,
    original,
    functions,
    map: {
      version: 3,
      file: 'bundle.js',
      sources: ['../../app/computer-runtime.ts'],
      sourcesContent: [original],
      names: [],
      mappings: 'AAAA;AACA;AACA',
    },
  }
}
test('exact original declarations resolve through maps to their own called minified functions', () => {
  const result = projectionCoverage(coverageFixture())
  assert.deepEqual(
    result.map(fn => fn.name),
    projectionFunctions
  )
  assert.ok(result.every(fn => fn.count === 8))
})
test('coverage rejects missing, ambiguous, zero and wrong-source evidence', () => {
  const changes = [
    f => {
      f.functions.pop()
    },
    f => {
      f.functions.push(structuredClone(f.functions[0]))
    },
    f => {
      f.functions[0].ranges[0].count = 0
    },
    f => {
      f.functions[0].ranges[0].count = NaN
    },
    f => {
      f.map.sourcesContent[0] += '\n// stale source'
    },
    f => {
      f.map.sources[0] = '../../app/other.ts'
    },
    f => {
      f.map.mappings = ''
    },
    f => {
      f.functions[0].ranges[0].endOffset = f.code.length + 1
    },
  ]
  for (const change of changes) {
    const fixture = coverageFixture()
    change(fixture)
    assert.throws(() => projectionCoverage(fixture))
  }
})
test('an executed callback body or top-level script cannot replace an uncalled parent', () => {
  const fixture = coverageFixture()
  fixture.functions[0].ranges[0].count = 0
  fixture.functions.push({
    functionName: '',
    ranges: [{ startOffset: 13, endOffset: 20, count: 100 }],
  })
  fixture.functions.push({
    functionName: '',
    ranges: [{ startOffset: 0, endOffset: fixture.code.length, count: 1 }],
  })
  assert.throws(() => projectionCoverage(fixture))
  fixture.functions.shift() // Even a called script beginning with a declaration is not that function.
  assert.throws(() => projectionCoverage(fixture))
})
const snapshot = turn => ({
  level: 1,
  turn,
  paused: true,
  sameIdentity: true,
  canvasConnected: true,
  inputMask: 0,
  landFlags: 0,
  loadFlags: 0,
  gameFlags: 0,
  levelFlags2: 0,
  computerTribes: [1],
  eligiblePeople: 20,
})
test('ordinary window requires natural turns, actual identity, rendered scene and all callback gates', () => {
  assert.doesNotThrow(() => assertProjectionWindow(snapshot(12), snapshot(20)))
  for (const patch of [
    { level: 2 },
    { turn: 19 },
    { paused: false },
    { sameIdentity: false },
    { canvasConnected: false },
    { inputMask: 1 },
    { landFlags: 2 },
    { landFlags: 0x800000 },
    { loadFlags: 0x200 },
    { gameFlags: 2 },
    { gameFlags: 32 },
    { levelFlags2: 0x100000 },
    { computerTribes: [] },
    { eligiblePeople: 0 },
    { gameFlags: undefined },
  ]) {
    assert.throws(() => assertProjectionWindow(snapshot(12), { ...snapshot(20), ...patch }))
  }
})
async function fixture(run) {
  const output = mkdtempSync(join(tmpdir(), 'spell-projection-browser-'))
  const calls = [],
    report = { status: 'running', errors: [] }
  const cdp = {
    async send(name) {
      calls.push(name)
    },
    async detach() {
      calls.push('detach')
    },
  }
  const context = {
    async close() {
      calls.push('close')
    },
  }
  try {
    await run({ output, report, cdp, context, calls, coverageStarted: true })
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
}
test('coverage and context close before a passed receipt', () =>
  fixture(async options => {
    const result = await finishSpellProjection(options)
    assert.equal(result.status, 'passed')
    assert.equal(result.coverageClosed, true)
    assert.equal(result.contextClosed, true)
    assert.deepEqual(options.calls, [
      'Profiler.stopPreciseCoverage',
      'Profiler.disable',
      'Debugger.disable',
      'detach',
      'close',
    ])
  }))
test('coverage cleanup failure does not skip context cleanup; late errors remain failures', () =>
  fixture(async options => {
    options.cdp.send = async () => {
      throw Error('coverage cleanup')
    }
    options.context.close = async () => {
      options.calls.push('close')
      options.report.errors.push('late runtime failure')
    }
    await assert.rejects(finishSpellProjection(options), AggregateError)
    assert.deepEqual(options.calls, ['close'])
    const receipt = JSON.parse(readFileSync(join(options.output, 'spell-projection.json'), 'utf8'))
    assert.equal(receipt.status, 'failed')
    assert.equal(receipt.contextClosed, true)
    assert.equal(receipt.failures.length, 2)
  }))
test('original failure and timeout survive successful cleanup', () =>
  fixture(async options => {
    options.report.timedOut = true
    options.failure = Error('mapping mismatch')
    await assert.rejects(finishSpellProjection(options), AggregateError)
    assert.equal(options.report.failures.length, 2)
  }))
test('hosted runner preserves old episodes, Tutorial aggregate headroom and source-bound new scenario', () => {
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  const scenario = readFileSync(
    new URL('../scripts/tutorial-browser/spell-projection.mjs', import.meta.url),
    'utf8'
  )
  const builder = readFileSync(
    new URL('../scripts/tutorial-browser/build-home.mjs', import.meta.url),
    'utf8'
  )
  assert.equal(spellProjectionLimitMs, 35000)
  assert.ok(
    source.indexOf('receipt.sceneryPlacement =') < source.indexOf('receipt.spellProjection =')
  )
  assert.match(source, /spellProjectionScenarioSha256: hash\(spellProjectionScenario\)/)
  assert.match(source, /spellProjectionCoverageSha256:/)
  assert.match(source, /if \(selectedScenario === 'tutorial'\) receipt\.spellProjection/)
  const m2Index = source.indexOf(
    'receipt.m2PointerF8 =',
    source.indexOf('receipt.sceneryPlacement =')
  )
  const spellIndex = source.indexOf('receipt.spellProjection =')
  assert.ok(m2Index >= 0 && spellIndex >= 0 && m2Index < spellIndex)
  assert.equal(browserCapMs('tutorial'), 240000)
  assert.match(source, /}, receipt.browserCapMs\)/)
  assert.match(builder, /sourcemap: true/)
  assert.match(scenario, /callCount:\s*true,\s*detailed:\s*false/)
  assert.match(scenario, /assert\.equal\(\s*observed\.scriptSource,\s*code/)
  assert.ok(
    scenario.indexOf("await cdp.send('Profiler.takePreciseCoverage')") <
      scenario.indexOf("await setWorldPaused(page, false, { timeout: 10000 })", scenario.indexOf("Profiler.startPreciseCoverage"))
  )
})
