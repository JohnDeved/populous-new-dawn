import test from 'node:test'
import assert from 'node:assert/strict'
import { withNaturalF8Context, captureNaturalF8Identity, assertNaturalF8Identity } from '../scripts/tutorial-browser/natural-f8-context.mjs'
function setup() {
  const calls = [], receipt = {}, page = { setDefaultTimeout: n => calls.push(['timeout', n]) }
  const context = { newPage: async () => page, close: async () => calls.push(['close']) }
  return { calls, context, receipt, options: { browser: { newContext: async () => context },
    routeDeadlineUnixMs: Date.now() + 1000, receipt, run: async () => 42 } }
}
test('owned context closes once and records verified cleanup', async () => {
  const f = setup(); assert.equal(await withNaturalF8Context(f.options), 42)
  assert.equal(f.receipt.cleanupVerified, true)
  assert.equal(f.calls.filter(x => x[0] === 'close').length, 1)
})
test('primary falsey failure survives cleanup error', async () => {
  const f = setup(); f.options.run = async () => { throw null }; f.context.close = async () => { throw Error('close') }
  let caught = false
  try { await withNaturalF8Context(f.options) } catch (e) { caught = true; assert.equal(e, null) }
  assert.equal(caught, true); assert.equal(f.receipt.cleanupVerified, false)
  assert.match(f.receipt.cleanupError, /close/)
})
test('late acquired context closes without creating page or running episode', async () => {
  const f = setup(); let resolve
  f.options.browser.newContext = () => new Promise(r => { resolve = r })
  f.options.routeDeadlineUnixMs = Date.now() + 25
  f.context.newPage = async () => { throw Error('must not create late page') }
  await assert.rejects(withNaturalF8Context(f.options), /deadline/)
  resolve(f.context); await new Promise(r => setTimeout(r, 5))
  assert.equal(f.receipt.cleanupVerified, true)
  assert.deepEqual(f.calls, [['close']])
})
test('hung run and hung cleanup remain bounded and cleanup unverified', async () => {
  const f = setup(); f.options.routeDeadlineUnixMs = Date.now() + 25
  f.options.run = () => new Promise(() => {}); f.context.close = () => new Promise(() => {})
  await assert.rejects(withNaturalF8Context(f.options), /deadline/)
  assert.equal(f.receipt.cleanupVerified, false)
})
test('page identity capture binds actual page clock and rejects replaced graph', () => {
  const world = { outcome: { level: 2 }, paused: false, inputMask: 0 }
  const graph = { interactionRecording: {} }, store = { getWorld: () => world }
  const scene = { world, fpsGraph: graph, renderer: { domElement: { isConnected: true } } }
  const prior = globalThis.window
  globalThis.window = { testSceneRef: { current: scene }, testStore: store }
  try {
    const before = performance.now(), identity = captureNaturalF8Identity()
    assert.ok(identity.afterTimestamp >= before && identity.afterTimestamp <= performance.now())
    assert.equal(assertNaturalF8Identity(identity), true)
    scene.fpsGraph = { interactionRecording: {} }
    assert.throws(() => assertNaturalF8Identity(identity), /identity changed/)
  } finally { if (prior === undefined) delete globalThis.window; else globalThis.window = prior }
})

test('wall deadline converts only remaining route budget into monotonic clock', async () => {
  const f = setup()
  f.options.wallNow = () => 1700000000000; f.options.now = () => 500
  f.options.routeDeadlineUnixMs = 1700000000123
  f.options.run = async ({ deadlineAt }) => { assert.equal(deadlineAt, 623) }
  await withNaturalF8Context(f.options)
  assert.equal(f.receipt.clockBinding.remainingRouteMs, 123)
})
test('monotonic deadline supplied as Unix deadline is rejected before context', async () => {
  const f = setup(); f.options.routeDeadlineUnixMs = performance.now() + 1000
  await assert.rejects(withNaturalF8Context(f.options), /Date.now route deadline/)
  assert.deepEqual(f.calls, [])
})
for (const field of ['paused', 'inputMask', 'messageModal', 'modalSuspended', 'overviewActive', 'level'])
  test(`continued live admission rejects changed ${field}`, () => {
    const world = { outcome: { level: 2 }, paused: false, inputMask: 0 }
    const graph = { interactionRecording: {} }, store = { getWorld: () => world }
    const scene = { world, fpsGraph: graph, renderer: { domElement: { isConnected: true } } }
    const prior = globalThis.window
    globalThis.window = { testSceneRef: { current: scene }, testStore: store }
    try {
      const identity = captureNaturalF8Identity()
      if (field === 'level') world.outcome.level = 1
      else if (field === 'paused' || field === 'inputMask') world[field] = 1
      else scene[field] = true
      assert.throws(() => assertNaturalF8Identity(identity), /admission changed/)
    } finally { if (prior === undefined) delete globalThis.window; else globalThis.window = prior }
  })
