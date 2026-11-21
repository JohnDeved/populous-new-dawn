import test from 'node:test'
import assert from 'node:assert/strict'
import { runNaturalF8Inputs } from '../scripts/tutorial-browser/natural-f8-input.mjs'
function fixture() {
  let time = 0
  const events = []
  return { events, options: { page: { mouse: { move: async (x, y) => events.push(['move', x, y]) },
    keyboard: { down: async k => events.push(['down', k]), up: async k => events.push(['up', k]) } },
    closeOwner: async () => events.push(['close']), hud: { x: 10, y: 20 }, world: { x: 500, y: 400, radius: 8 }, deadlineAt: 45000,
    now: () => time, wait: async ms => { time += ms },
    observe: async edge => { events.push(['observe', edge.stage, edge.edge]); return { time } } } }
}
test('bounded four-stage driver preserves public movement and camera route', async () => {
  const f = fixture(), result = await runNaturalF8Inputs(f.options)
  assert.equal(result.stages.length, 4)
  assert.equal(f.events.filter(e => e[0] === 'move').length, 24)
  assert.deepEqual(f.events.filter(e => ['down', 'up'].includes(e[0])), [['down', 'ArrowRight'], ['up', 'ArrowRight']])
  assert.equal(f.events.filter(e => e[0] === 'observe').length, 8)
  assert.equal(f.options.now(), 2400)
})
test('expired inherited deadline closes owner without inputs', async () => {
  const f = fixture(); f.options.deadlineAt = 0
  await assert.rejects(runNaturalF8Inputs(f.options))
  assert.deepEqual(f.events, [['close']])
})
test('remaining episode deadline stops, never renewed by next stage', async () => {
  const f = fixture(); f.options.deadlineAt = 600
  await assert.rejects(runNaturalF8Inputs(f.options), /exhausted/)
  assert.equal(f.options.now(), 600)
  assert.equal(f.events.filter(e => e[0] === 'close').length, 1)
  assert.equal(f.events.some(e => e[1] === 'world-moving'), false)
})
test('uncertain keydown releases ArrowRight and propagates exact failure', async () => {
  const f = fixture(), failure = new Error('keydown rejected')
  f.options.page.keyboard.down = async () => { throw failure }
  await assert.rejects(runNaturalF8Inputs(f.options), e => e === failure)
  assert.deepEqual(f.events.at(-1), ['up', 'ArrowRight'])
})
test('invalid movement geometry fails before input', async () => {
  const f = fixture(); f.options.world.radius = Infinity
  await assert.rejects(runNaturalF8Inputs(f.options))
  assert.deepEqual(f.events, [])
})
for (const failure of [undefined, null, false, 0, '']) test(`primary falsey rejection ${String(failure)} survives release failure`, async () => {
  const f = fixture(), release = new Error('release'), diagnostics = []
  f.options.releaseErrors = diagnostics
  f.options.page.keyboard.down = async () => { throw failure }
  f.options.page.keyboard.up = async () => { throw release }
  let rejected = false
  try { await runNaturalF8Inputs(f.options) } catch (actual) { rejected = true; assert.equal(actual, failure) }
  assert.equal(rejected, true)
  assert.equal(diagnostics[0].error, release)
  assert.deepEqual(f.events.at(-1), ['close'])
})
test('release-only failure fails and closes owner', async () => {
  const f = fixture(), release = new Error('release')
  f.options.page.keyboard.up = async () => { throw release }
  await assert.rejects(runNaturalF8Inputs(f.options), e => e === release)
  assert.deepEqual(f.events.at(-1), ['close'])
})
test('hung initial movement closes owner at inherited deadline; late completion cannot continue', async () => {
  const f = fixture(); let finish
  f.options.now = () => performance.now()
  f.options.deadlineAt = performance.now() + 40
  f.options.page.mouse.move = () => new Promise(resolve => { finish = resolve })
  await assert.rejects(runNaturalF8Inputs(f.options), /deadline exceeded/)
  assert.deepEqual(f.events, [['close']])
  finish(); await new Promise(resolve => setTimeout(resolve, 10))
  assert.deepEqual(f.events, [['close']])
})
test('hung observation closes owner without later movement', async () => {
  const f = fixture()
  f.options.now = () => performance.now(); f.options.deadlineAt = performance.now() + 40
  f.options.observe = () => new Promise(() => {})
  await assert.rejects(runNaturalF8Inputs(f.options), /deadline exceeded/)
  assert.deepEqual(f.events.map(e => e[0]), ['move', 'close'])
})
test('hung keydown uses separate absolute 500ms teardown, no later observation', async () => {
  const f = fixture(); let finish
  f.options.page.keyboard.down = () => new Promise(resolve => { finish = resolve })
  await assert.rejects(runNaturalF8Inputs(f.options), /key-hold deadline exceeded/)
  assert.deepEqual(f.events.at(-1), ['close'])
  const count = f.events.length; finish(); await new Promise(resolve => setTimeout(resolve, 10))
  assert.equal(f.events.length, count)
})
test('hung keyup closes owner within remaining hold allowance', async () => {
  const f = fixture()
  f.options.page.keyboard.up = () => new Promise(() => {})
  await assert.rejects(runNaturalF8Inputs(f.options), /key-release deadline exceeded/)
  assert.deepEqual(f.events.at(-1), ['close'])
})
test('resolved move past deadline before timer dispatch closes exactly once', async () => {
  const f = fixture(); let clock = 0
  f.options.now = () => clock; f.options.deadlineAt = 100
  f.options.page.mouse.move = async () => { clock = 101 }
  await assert.rejects(runNaturalF8Inputs(f.options), /deadline exceeded/)
  assert.deepEqual(f.events, [['close']])
})
test('resolved keydown past absolute hold deadline tears down without continuation', async () => {
  const f = fixture(); let extra = 0
  const originalNow = f.options.now
  f.options.now = () => originalNow() + extra
  f.options.page.keyboard.down = async () => { extra = 501 }
  await assert.rejects(runNaturalF8Inputs(f.options), /key-hold deadline exceeded/)
  assert.equal(f.events.filter(e => e[0] === 'close').length, 1)
  assert.equal(f.events.some(e => e[0] === 'up'), false, 'expired owner uses teardown, not new browser actions')
  assert.equal(f.events.some(e => e[1] === 'view-moving' && e[2] === 'after'), false)
})
