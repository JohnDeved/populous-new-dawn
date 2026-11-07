import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { observeBuildingPanelPointerTarget } from '../scripts/tutorial-browser/building-panel-pointer-target.mjs'

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
    const op = async name => { calls.push(name); await pending; return { x: 110, y: 115 } }
    const page = { mouse: { move: () => op('move') }, evaluate: () => op('evaluate'), waitForFunction: () => op('frame') }
    const panel = { locator: () => ({ focus: () => op('focus') }),
      isVisible: async () => { await op('visible'); return true }, count: async () => { await op('count'); return 0 } }
    const run = new AsyncFunction('hold', 'boundary', 'timing', 'page', 'panel', 'assert', 'before', 'transition', 'observeBuildingPanelPointerTarget', '{' + block(stage) + '}')
    const result = run(hold, 'ownership', { mark: x => marks.push(x) }, page, panel, assert, { frame: 1 }, { frame: 3 }, observeBuildingPanelPointerTarget)
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

test('fourteen marks remain bounded; outside the reviewed pointer change all original trajectory bytes are identical', () => {
  const added = source.split('\n').filter(line => stages.some(stage => line.includes('/' + stage + ':')))
  assert.equal(added.length, 14)
  // The pointer observer/input/guard are an intentional behavior change, covered
  // by building-panel-pointer-target.test.mjs. Do not bless other changes by
  // refreshing the old trajectory hash: reverse only those three edit regions.
  const guardStart = source.indexOf("          if (hold === 'pointer') {\n            const expected = h.pointerTargetBefore"),
    guardEnd = source.indexOf("          const held = hold === 'pointer'", guardStart)
  assert.ok(guardStart > 0 && guardEnd > guardStart)
  const restored = (source.slice(0, guardStart) + source.slice(guardEnd))
    .replace("import { observeBuildingPanelPointerTarget } from './building-panel-pointer-target.mjs'\n", '')
    .replace("          const target = await page.evaluate(observeBuildingPanelPointerTarget)\n          assert.ok(target && Number.isFinite(target.x) && Number.isFinite(target.y), 'Expected observed pointer coordinates')\n          await page.mouse.move(target.x, target.y)", '          await panel.hover()')
  const original = restored.split('\n').filter(line => !stages.some(stage => line.includes('/' + stage + ':'))).join('\n')
  assert.equal(createHash('sha256').update(original).digest('hex'), 'd2974d12566574c452034e7553bd5d75498db74fe7c521af295bccff332d7b53')
  // Four fixed cases: fourteen marks each, never dependent on polling counts.
  assert.equal(added.length * 4, 56)
  assert.ok(source.includes('buildingPanelIdentityLimitMs = 35000'))
})

const runInput = new AsyncFunction('hold', 'boundary', 'timing', 'page', 'panel', 'assert', 'observeBuildingPanelPointerTarget', '{' + block('hold-input') + '}')
test('pointer hold-input mark spans separate observation and move settlement', async () => {
  const calls = [], marks = []; let releaseObservation, releaseMove
  const observed = new Promise(resolve => { releaseObservation = () => resolve({ x: 110, y: 115 }) }),
    moved = new Promise(resolve => { releaseMove = resolve })
  const page = { evaluate: callback => {
    assert.equal(callback, observeBuildingPanelPointerTarget); calls.push('observe'); return observed
  }, mouse: { move: (x, y) => { assert.deepEqual([x, y], [110, 115]); calls.push('move'); return moved } } }
  const result = runInput('pointer', 'ownership', { mark: mark => marks.push(mark) }, page, {}, assert, observeBuildingPanelPointerTarget)
  assert.deepEqual(calls, ['observe'])
  assert.deepEqual(marks, ['pointer/ownership/hold-input:start'])
  releaseObservation(); await Promise.resolve(); await Promise.resolve()
  assert.deepEqual(calls, ['observe', 'move'])
  assert.deepEqual(marks, ['pointer/ownership/hold-input:start'])
  releaseMove(); await result
  assert.deepEqual(marks, ['pointer/ownership/hold-input:start', 'pointer/ownership/hold-input:complete'])
})

for (const operation of ['observe', 'move']) test(`pointer hold-input retains falsey ${operation} failures before the completion mark`, async () => {
  for (const failure of [undefined, null, false, 0, NaN, '', Error('transport failed')]) for (const synchronous of [false, true]) {
    const calls = [], marks = []
    const invoke = name => {
      calls.push(name)
      if (name !== operation) return { x: 110, y: 115 }
      if (synchronous) throw failure
      return Promise.reject(failure)
    }
    const page = { evaluate: callback => { assert.equal(callback, observeBuildingPanelPointerTarget); return invoke('observe') },
      mouse: { move: () => invoke('move') } }
    const result = await runInput('pointer', 'ownership', { mark: mark => marks.push(mark) }, page, {}, assert, observeBuildingPanelPointerTarget)
      .then(() => ({ rejected: false }), error => ({ rejected: true, error }))
    assert.equal(result.rejected, true)
    assert.ok(Object.is(result.error, failure))
    assert.deepEqual(calls, operation === 'observe' ? ['observe'] : ['observe', 'move'])
    assert.deepEqual(marks, ['pointer/ownership/hold-input:start'])
  }
})
