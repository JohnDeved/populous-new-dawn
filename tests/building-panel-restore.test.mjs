import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { readEligibleBuildingHit, settleBuildingRestorePair } from '../scripts/tutorial-browser/building-panel-identity.mjs'

// Actual serialized reader and actual nested restoration, with supplied DOM,
// transport and pointer completions. This is not rendered-browser timing proof.
function hitFixture() {
  const calls = [], state = { team: 'blue', visible: true, covered: false, hit: 7 }
  const building = Object.freeze({ id: 7, get team() { return state.team } })
  const forbidden = () => { throw Error('Observer must not mutate focus, render or input') }
  const canvas = Object.freeze({ getBoundingClientRect: () => {
    calls.push(['rect']); return { left: 100, top: 50, width: 400, height: 200 }
  } })
  const scene = Object.freeze({
    visible: value => { assert.equal(value, building); calls.push(['visible']); return state.visible },
    screen: value => { assert.equal(value, building); calls.push(['screen']); return { x: 0, y: 0 } },
    renderer: Object.freeze({ domElement: canvas, render: forbidden }),
    picking: Object.freeze({ pick: event => {
      calls.push(['pick', event.clientX, event.clientY])
      return typeof state.hit === 'function' ? state.hit(event) : state.hit
    } }),
    focus: forbidden, render: forbidden, paint: forbidden,
  })
  const context = { window: { buildingIdentity: { scene, building } }, document: {
    elementFromPoint: (x, y) => { calls.push(['element', x, y]); return state.covered ? {} : canvas },
    dispatchEvent: forbidden,
  } }
  const observe = () => JSON.parse(JSON.stringify(runInNewContext(`(${readEligibleBuildingHit.toString()})()`, context)))
  return { calls, state, observe }
}

test('serialized restore reader fails ownership and visibility before projection or picking', () => {
  const f = hitFixture()
  f.state.team = 'red'
  assert.equal(f.observe(), false)
  assert.deepEqual(f.calls, [])
  f.state.team = 'blue'; f.state.visible = false
  assert.equal(f.observe(), false)
  assert.deepEqual(f.calls, [['visible']])
})

test('serialized restore reader retains exact candidate order and requires unobscured current building hit', () => {
  const expected = []
  for (const dy of [-40, -60, -20, -80, 0, -100, -120, -140, 20, 40, 60])
    for (const dx of [0, -10, 10, -20, 20, -40, 40, -60, 60, -80, 80]) expected.push([300 + dx, 150 + dy])
  for (const state of [{ covered: true }, { hit: null }, { hit: 8 }]) {
    const f = hitFixture(); Object.assign(f.state, state)
    assert.equal(f.observe(), false)
    assert.deepEqual(f.calls.filter(x => x[0] === 'element').map(x => x.slice(1)), expected)
    assert.equal(f.calls.filter(x => x[0] === 'pick').length, state.covered ? 0 : expected.length)
  }
  const f = hitFixture()
  f.state.hit = event => event.clientX === 290 ? 7 : 8
  assert.deepEqual(f.observe(), { x: 290, y: 110 })
  assert.deepEqual(f.calls.filter(x => x[0] === 'pick').map(x => x.slice(1)), expected.slice(0, 2))
})

test('each serialized observation jointly rechecks restored eligibility and current painter hit', () => {
  const f = hitFixture()
  f.state.visible = false
  assert.equal(f.observe(), false)
  f.state.visible = true; f.state.hit = 8
  assert.equal(f.observe(), false)
  f.state.hit = 7
  assert.deepEqual(f.observe(), { x: 300, y: 110 })
  f.state.team = 'red'
  assert.equal(f.observe(), false, 'an earlier eligible hit is not cached')
  f.state.team = 'blue'; f.state.covered = true
  assert.equal(f.observe(), false, 'a later overlay cannot reuse the old target')
})

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const flush = () => new Promise(resolve => setImmediate(resolve))

test('restore pair starts both callbacks once and awaits both while retaining argument order', async () => {
  const first = deferred(), second = deferred(), calls = []
  let settled = false
  const result = settleBuildingRestorePair(() => { calls.push('first'); return first.promise },
    () => { calls.push('second'); return second.promise }).finally(() => { settled = true })
  await flush()
  assert.deepEqual(calls, ['first', 'second'])
  second.resolve('second-value'); await flush()
  assert.equal(settled, false)
  first.resolve('first-value')
  assert.deepEqual(await result, ['first-value', 'second-value'])
  assert.deepEqual(calls, ['first', 'second'])
})

for (const failing of [0, 1]) test(`restore pair rejection ${failing} stays fatal and awaits its counterpart`, async () => {
  const controls = [deferred(), deferred()], failure = Error(`operation-${failing}`)
  let settled = false
  const result = settleBuildingRestorePair(() => controls[0].promise, () => controls[1].promise)
  const rejected = assert.rejects(result, error => {
    settled = true
    assert.ok(error instanceof AggregateError)
    assert.deepEqual(error.errors, [failure])
    return true
  })
  controls[failing].reject(failure); await flush()
  assert.equal(settled, false)
  controls[1 - failing].resolve('counterpart-complete')
  await rejected
})

test('restore pair retains both failures and synchronous throws without unhandled rejection', async t => {
  const unhandled = [], onUnhandled = error => unhandled.push(error)
  process.on('unhandledRejection', onUnhandled)
  t.after(() => process.off('unhandledRejection', onUnhandled))
  const second = deferred(), firstError = Error('sync-first'), secondError = Error('async-second')
  let counterpartStarted = false, settled = false
  const result = settleBuildingRestorePair(() => { throw firstError }, () => {
    counterpartStarted = true; return second.promise
  })
  const rejected = assert.rejects(result, error => {
    settled = true
    assert.ok(error instanceof AggregateError)
    assert.deepEqual(error.errors, [firstError, secondError])
    return true
  })
  await flush()
  assert.equal(counterpartStarted, true)
  assert.equal(settled, false)
  second.reject(secondError)
  await rejected; await flush()
  assert.deepEqual(unhandled, [])
})

const scenarioSource = readFileSync(new URL('../scripts/tutorial-browser/building-panel-identity.mjs', import.meta.url), 'utf8')
const syntax = ts.createSourceFile('building-panel-identity.mjs', scenarioSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
const restoreNodes = [], callsiteStatements = []
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'revealCurrentPanel') restoreNodes.push(node)
  if (ts.isExpressionStatement(node) && ts.isAwaitExpression(node.expression) &&
      ts.isCallExpression(node.expression.expression) && node.expression.expression.expression.getText(syntax) === 'revealCurrentPanel') {
    const statements = node.parent.statements, index = statements.indexOf(node)
    callsiteStatements.push([node.getText(syntax), statements[index + 1].getText(syntax)])
  }
  ts.forEachChild(node, visit)
}
visit(syntax)
assert.equal(restoreNodes.length, 1, 'one actual restoration owner')
assert.equal(callsiteStatements.length, 1, 'one actual restoration callsite')
assert.equal(callsiteStatements[0][1], "assert.equal(await panel.isVisible(), true, 'Current eligible panel can reopen')")

function restoreFixture() {
  const calls = [], marks = [], controls = { json: deferred(), away: deferred(), dispose: deferred(), back: deferred() }
  const target = { x: 300, y: 110 }
  const handle = { jsonValue: () => { calls.push('json'); return controls.json.promise },
    dispose: () => { calls.push('dispose'); return controls.dispose.promise } }
  const page = { waitForFunction: async callback => {
    assert.equal(callback, readEligibleBuildingHit); calls.push('eligible-hit'); return handle
  }, mouse: { move: (x, y) => {
    if (x === 10 && y === 10) { calls.push('away'); return controls.away.promise }
    assert.deepEqual({ x, y }, target); calls.push('back'); return controls.back.promise
  } } }
  const panel = { waitFor: async options => { assert.deepEqual(options, { state: 'visible' }); calls.push('visible-wait') },
    isVisible: async () => { calls.push('visible-assert'); return true } }
  const timing = { mark: value => marks.push(value) }
  const restore = new Function('page', 'panel', 'timing', 'readEligibleBuildingHit', 'settleBuildingRestorePair', 'assert',
    `return (${restoreNodes[0].getText(syntax)})`)(page, panel, timing, readEligibleBuildingHit, settleBuildingRestorePair, assert)
  return { restore, calls, marks, controls, target, page, panel }
}

test('actual restoration waits away before return and both paired operations before visibility', async () => {
  const f = restoreFixture(), result = f.restore('observed')
  await flush()
  assert.deepEqual(f.calls, ['eligible-hit', 'json', 'away'])
  f.controls.json.resolve(f.target); await flush()
  assert.deepEqual(f.calls, ['eligible-hit', 'json', 'away'])
  f.controls.away.resolve(); await flush()
  assert.deepEqual(f.calls, ['eligible-hit', 'json', 'away', 'dispose', 'back'])
  f.controls.back.resolve(); await flush()
  assert.equal(f.calls.includes('visible-wait'), false)
  f.controls.dispose.resolve(); await result
  assert.deepEqual(f.calls, ['eligible-hit', 'json', 'away', 'dispose', 'back', 'visible-wait'])
  assert.deepEqual(f.marks, ['observed:eligible-hit:start', 'observed:eligible-hit:complete',
    'observed:pointer-away-start', 'observed:pointer-return-start', 'observed:visible-start', 'observed:complete'])
})

for (const failing of ['json', 'away', 'dispose', 'back'])
  test(`actual restoration failure in ${failing} settles its pair and stops the next phase`, async () => {
    const f = restoreFixture(), failure = Error(failing)
    let settled = false
    const rejected = assert.rejects(f.restore('failed'), error => {
      settled = true
      assert.ok(error instanceof AggregateError)
      assert.deepEqual(error.errors, [failure])
      return true
    })
    await flush()
    const secondPair = failing === 'dispose' || failing === 'back'
    if (secondPair) {
      f.controls.json.resolve(f.target); f.controls.away.resolve(); await flush()
      assert.deepEqual(f.calls, ['eligible-hit', 'json', 'away', 'dispose', 'back'])
    }
    f.controls[failing].reject(failure); await flush()
    assert.equal(settled, false)
    const counterpart = { json: 'away', away: 'json', dispose: 'back', back: 'dispose' }[failing]
    f.controls[counterpart].resolve(counterpart === 'json' ? f.target : undefined)
    await rejected
    assert.equal(f.calls.includes('visible-wait'), false)
    if (!secondPair) assert.deepEqual(f.calls, ['eligible-hit', 'json', 'away'])
  })

test('actual restoration preserves failed hit and visible wait without advancing its caller', async () => {
  const observed = restoreFixture(), failure = Error('no eligible hit')
  observed.page.waitForFunction = async () => { throw failure }
  await assert.rejects(observed.restore('missing'), error => error === failure)
  assert.deepEqual(observed.calls, [])
  const hidden = restoreFixture(), waitFailure = Error('visible wait failed')
  hidden.panel.waitFor = async () => { hidden.calls.push('visible-wait'); throw waitFailure }
  const rejected = assert.rejects(hidden.restore('hidden'), error => error === waitFailure)
  hidden.controls.json.resolve(hidden.target); hidden.controls.away.resolve()
  hidden.controls.dispose.resolve(); hidden.controls.back.resolve()
  await rejected
  assert.ok(hidden.calls.includes('visible-wait'))
  assert.equal(hidden.calls.includes('visible-assert'), false)
})

test('actual enclosing callsite independently asserts visibility after restoration', async () => {
  for (const visible of [true, false]) {
    const f = restoreFixture()
    f.panel.isVisible = async () => { f.calls.push('visible-assert'); return visible }
    // Execute both original adjacent AST statements, including the real outer
    // assertion. Do not pretend that assertion is inside revealCurrentPanel.
    const callsite = new Function('revealCurrentPanel', 'panel', 'assert', 'hold', 'boundary',
      `return (async () => { ${callsiteStatements[0].join('\n')} })()`)
    const result = callsite(f.restore, f.panel, assert, 'pointer', 'ownership')
    const outcome = visible ? result : assert.rejects(result, /Current eligible panel can reopen/)
    f.controls.json.resolve(f.target); f.controls.away.resolve()
    f.controls.dispose.resolve(); f.controls.back.resolve()
    await outcome
    assert.deepEqual(f.calls, ['eligible-hit', 'json', 'away', 'dispose', 'back', 'visible-wait', 'visible-assert'])
  }
})
