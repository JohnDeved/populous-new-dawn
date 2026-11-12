import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { prepareWorldInput } from '../scripts/native-ui-evidence/setup-v2-proposal/browser-world-input.mjs'

// Actual helper; supplied Playwright boundary evaluating actual observer bytes.
// This does not execute a browser, CSS selector engine or native event delivery.
function fixture({ empty = false, afterWait, afterFocus } = {}) {
  const state = { clicks: 0, disposals: 0, world: {}, details: [] }
  const canvas = { isConnected: true }
  state.scene = { world: state.world, renderer: { domElement: canvas } }
  function popup() {
    const detail = { open: true, isConnected: true, getAttribute: () => '7', children: [] }
    detail.children.push({ tagName: 'DIV', isConnected: true, parentElement: detail,
      getBoundingClientRect: () => ({ width: detail.open ? 100 : 0, height: detail.open ? 20 : 0 }) })
    return detail
  }
  if (!empty) state.details.push(popup())
  const document = { activeElement: null, querySelector: () => null, querySelectorAll: () => state.details }
  const context = vm.createContext({ window: { testSceneRef: { get current() { return state.scene } },
    testStore: { getWorld: () => state.world } }, document, getComputedStyle: () => ({ visibility: 'visible' }) })
  const evaluate = (fn, arg) => { context.arg = arg; return vm.runInContext(`(${fn})(arg)`, context) }
  const page = {
    evaluateHandle: async fn => ({ bundle: evaluate(fn), dispose: async () => { state.disposals++ } }),
    evaluate: async (fn, arg) => evaluate(fn, { ...arg, expected: arg.expected.bundle }),
    locator(selector) {
      if (selector === '.world-viewport > canvas.battlefield') return {
        count: async () => 1,
        focus: async () => { document.activeElement = canvas; afterFocus?.(state, popup) },
        evaluate: async fn => evaluate(fn, canvas),
      }
      assert.equal(selector, '.campaign-messages details[data-message-serial="7"]')
      return { locator(part) {
        if (part === ':scope > div') return { count: async () => 1, waitFor: async () => { afterWait?.(state, popup) } }
        assert.equal(part, 'summary')
        return { click: async () => { state.clicks++; state.details[0].open = false } }
      } }
    },
  }
  return { page, state }
}
test('unchanged helper close preserves one click and disposes entry handle', async () => {
  const { page, state } = fixture(), trace = {}
  const result = await prepareWorldInput(page, { keyboardFocus: false, trace })
  assert.deepEqual(result, [{ serial: '7' }]); assert.equal(state.clicks, 1)
  assert.equal(state.disposals, 1); assert.equal(trace.identityCleanup.status, 'settled')
})
for (const [name, afterWait] of [
  ['World and Scene', state => { state.world = {}; state.scene = { ...state.scene, world: state.world } }],
  ['same serial detail', (state, popup) => { const replacement = popup(); replacement.open = false; state.details = [replacement] }],
  ['body', state => { const detail = state.details[0]; detail.children = [{ ...detail.children[0] }] }],
]) test(`replacement during hidden wait rejects ${name} without replay`, async () => {
  const { page, state } = fixture({ afterWait }), trace = {}
  await assert.rejects(prepareWorldInput(page, { keyboardFocus: false, trace }), /replaced/)
  assert.equal(state.clicks, 1); assert.equal(state.disposals, 1)
})
test('empty popup preparation rejects coherent World replacement during focus', async () => {
  const { page, state } = fixture({ empty: true, afterFocus: state => {
    state.world = {}; state.scene = { ...state.scene, world: state.world }
  } })
  await assert.rejects(prepareWorldInput(page), /World or Scene replaced/)
  assert.equal(state.clicks, 0); assert.equal(state.disposals, 1)
})
test('pre-aborted helper never acquires or delivers input', async () => {
  const { page, state } = fixture(), controller = new AbortController(), reason = Error('cancelled')
  let acquisitions = 0
  page.evaluateHandle = async () => { acquisitions++; throw Error('unexpected') }
  controller.abort(reason)
  await assert.rejects(prepareWorldInput(page, { signal: controller.signal }), error => error === reason)
  assert.equal(acquisitions, 0); assert.equal(state.clicks, 0)
})
test('successful input cannot hide disposal failure', async () => {
  const { page, state } = fixture(), trace = {}, acquire = page.evaluateHandle
  page.evaluateHandle = async fn => { const handle = await acquire(fn); handle.dispose = async () => { throw Error('dispose failed') }; return handle }
  await assert.rejects(prepareWorldInput(page, { keyboardFocus: false, trace }), /context teardown/)
  assert.equal(state.clicks, 1); assert.equal(trace.teardownRequired, true)
})
test('helper deadline preserves failure and disposes late handle without input', async () => {
  const { page, state } = fixture(), trace = {}, acquire = page.evaluateHandle
  let deliver
  const pending = new Promise(resolve => { deliver = resolve })
  page.evaluateHandle = () => pending
  await assert.rejects(prepareWorldInput(page, { keyboardFocus: false, timeout: 5, trace }), /timed out/)
  assert.equal(trace.teardownRequired, true); assert.equal(state.clicks, 0)
  // Deliver a supplied handle after terminal timeout. No reacquisition/replay.
  const { capturePreparationIdentity } = await import('../scripts/native-ui-evidence/setup-v2-proposal/popup-identity.mjs')
  const handle = await acquire(capturePreparationIdentity)
  let disposed
  const disposal = new Promise(resolve => { disposed = resolve })
  const originalDispose = handle.dispose
  handle.dispose = async () => { await originalDispose(); disposed() }
  deliver(handle); await disposal
  assert.equal(state.disposals, 1); assert.equal(state.clicks, 0)
})
