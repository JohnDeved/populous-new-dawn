import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../scripts/tutorial-browser/building-panel-identity.mjs', import.meta.url), 'utf8')
const stages = ['hold-input', 'held-snapshot', 'positive-frames', 'positive-visible', 'transition', 'hidden-frame', 'hidden-count']
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
function block(stage) {
  const start = '        timing.mark(`${hold}/${boundary}/' + stage + ':start`)'
  const complete = '        timing.mark(`${hold}/${boundary}/' + stage + ':complete`)'
  const a = source.indexOf(start), b = source.indexOf(complete, a)
  assert.ok(a >= 0 && b > a, `Unique paired stage ${stage}`)
  assert.equal(source.indexOf(start, a + 1), -1)
  return source.slice(a, b + complete.length)
}
for (const stage of stages) test(`actual ${stage} marks bracket settled transport and retain falsey rejection`, async () => {
  for (const hold of ['pointer', 'focus']) for (const reject of [false, true]) {
    const marks = [], calls = []; let release
    const pending = new Promise((resolve, fail) => { release = () => reject ? fail(null) : resolve() })
    const op = async name => { calls.push(name); await pending }
    const page = { mouse: { move: () => op('move') }, evaluate: () => op('evaluate'), waitForFunction: () => op('frame') }
    const panel = { hover: () => op('hover'), locator: () => ({ focus: () => op('focus') }),
      isVisible: async () => { await op('visible'); return true }, count: async () => { await op('count'); return 0 } }
    const run = new AsyncFunction('hold', 'boundary', 'timing', 'page', 'panel', 'assert', 'before', 'transition', '{' + block(stage) + '}')
    const result = run(hold, 'ownership', { mark: x => marks.push(x) }, page, panel, assert, { frame: 1 }, { frame: 3 })
    assert.deepEqual(marks, [`${hold}/ownership/${stage}:start`])
    assert.equal(calls.length, 1)
    const observed = result.then(() => ({ rejected: false }), error => ({ rejected: true, error }))
    release()
    const outcome = await observed
    assert.equal(outcome.rejected, reject)
    if (reject) { assert.equal(outcome.error, null); assert.equal(marks.length, 1) }
    else assert.deepEqual(marks, [`${hold}/ownership/${stage}:start`, `${hold}/ownership/${stage}:complete`])
  }
})

test('stage marks stay bounded and retain the witness deadline', () => {
  const added = source.split('\n').filter(line => stages.some(stage => line.includes('/' + stage + ':')))
  assert.equal(added.length, 14)
  assert.ok(source.includes('buildingPanelIdentityLimitMs = 45000'))
})

// These supplied transport outcomes exercise the actual diagnostic-only blocks.
// They do not establish browser timing or dismantle completion.
const dismantleStages = ['click', 'partial', 'paint']
for (const stage of dismantleStages) test(`dismantle ${stage} marks wait for settlement and preserve rejection`, async () => {
  const start = `    timing.mark('dismantle/${stage}:start')`
  const complete = `    timing.mark('dismantle/${stage}:complete')`
  const a = source.indexOf(start), b = source.indexOf(complete, a)
  assert.ok(a >= 0 && b > a)
  assert.equal(source.indexOf(start, a + 1), -1)
  assert.equal(source.indexOf(complete, b + 1), -1)
  const run = new AsyncFunction('timing', 'page', 'panel', 'report', source.slice(a, b + complete.length))
  for (const reject of [false, true]) {
    const marks = [], calls = [], report = {}, partial = { hp: 260, progress: 0.8 }
    let release
    const pending = new Promise((resolve, fail) => { release = () => reject ? fail(null) : resolve(partial) })
    const op = name => { calls.push(name); return pending }
    const panel = { locator: selector => {
      assert.equal(selector, '.dismantle-control')
      return { click: () => op('click') }
    } }
    const page = { evaluate: () => op('partial'), waitForFunction: () => op('paint') }
    const result = run({ mark: value => marks.push(value) }, page, panel, report)
    assert.deepEqual(marks, [`dismantle/${stage}:start`])
    assert.deepEqual(calls, [stage])
    assert.equal(report.partial, undefined)
    const observed = result.then(() => ({ rejected: false }), error => ({ rejected: true, error }))
    release()
    const outcome = await observed
    assert.equal(outcome.rejected, reject)
    if (reject) {
      assert.equal(outcome.error, null)
      assert.deepEqual(marks, [`dismantle/${stage}:start`])
      assert.equal(report.partial, undefined)
    } else {
      assert.deepEqual(marks, [`dismantle/${stage}:start`, `dismantle/${stage}:complete`])
      assert.equal(report.partial, stage === 'partial' ? partial : undefined)
    }
  }
})

test('dismantle diagnostics add only six marks and retain the episode deadline', () => {
  const added = source.split('\n').filter(line => line.includes("timing.mark('dismantle/"))
  assert.equal(added.length, 6)
  assert.ok(source.includes('buildingPanelIdentityLimitMs = 45000'))
})
