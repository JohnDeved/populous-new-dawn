import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

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

test('only fourteen bounded marks are added; original trajectory, assertions, input and deadline bytes are identical', () => {
  const added = source.split('\n').filter(line => stages.some(stage => line.includes('/' + stage + ':')))
  assert.equal(added.length, 14)
  const original = source.split('\n').filter(line => !stages.some(stage => line.includes('/' + stage + ':'))).join('\n')
  assert.equal(createHash('sha256').update(original).digest('hex'), 'd2974d12566574c452034e7553bd5d75498db74fe7c521af295bccff332d7b53')
  // Four fixed cases: fourteen marks each, never dependent on polling counts.
  assert.equal(added.length * 4, 56)
  assert.ok(source.includes('buildingPanelIdentityLimitMs = 35000'))
})
