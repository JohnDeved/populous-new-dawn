import test from 'node:test'
import assert from 'node:assert/strict'
import { readSpySourceReadiness, awaitSpySourceReadiness } from '../scripts/tutorial-browser/spy-source-readiness.mjs'

test('Spy readiness closes the exact public message before Skip and retains the eight-second deadline', async t => {
  const world = { outcome: { level: 1 }, inputMask: 64, flyby: { flags: 21 }, messages: { slots: [] } }
  const scene = { world, messageModal: true, renderer: { domElement: { isConnected: true } } }
  let open = true
  const prior = { window: globalThis.window, document: globalThis.document, getComputedStyle: globalThis.getComputedStyle }
  t.after(() => Object.assign(globalThis, prior))
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  globalThis.document = { querySelector: selector => selector === 'button.skip-introduction'
    ? { disabled: false, getClientRects: () => [1] }
    : selector === '.campaign-messages details[open]' && open ? { getAttribute: () => '7' } : null }
  globalThis.getComputedStyle = () => ({ visibility: 'visible' })
  const actions = [], report = {}
  assert.equal(readSpySourceReadiness().action, 'close-message')
  const page = {
    evaluate: async fn => fn(),
    waitForFunction: async (fn, mode, options) => {
      assert.ok(options.timeout > 0 && options.timeout <= 8000)
      const value = fn(mode); assert.ok(value)
      return { jsonValue: async () => value, dispose: async () => {} }
    },
    locator: selector => { assert.match(selector, /data-message-serial="7"/); return { click: async () => { open = false; scene.messageModal = false } } },
    getByRole: () => ({ click: async () => { assert.equal(open, false); world.inputMask = 0 } }),
  }
  await awaitSpySourceReadiness({ page, report, action: async (name, run) => { actions.push(name); await run() }, save() {}, deadlineAt: Date.now() + 45000 })
  assert.deepEqual(actions, ['Public collapse campaign message', 'Public Skip introduction'])
  assert.deepEqual(report.readiness.closedMessages, ['7'])
  assert.equal(report.readiness.after.action, 'ready')
  world.messages.slots = [{ flags: 0x20000 }]
  assert.equal(readSpySourceReadiness('actionable'), false, 'requested-but-not-yet-open modal cannot be declared ready')
})
