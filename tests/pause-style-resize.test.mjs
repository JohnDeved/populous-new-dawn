import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { settlePauseStyleViewport } from '../scripts/local-render/pause-style-resize.mjs'

const composition = readFileSync(new URL('../app/frontend-composition.ts', import.meta.url), 'utf8')
const formula = composition.match(/export const frontendScale = (.*)/)[1]
const frontendScale = vm.runInNewContext(formula.replaceAll(': number', ''))

// Execute the shipped wait predicate; supplied DOM/transport is not browser proof.
function fixture(change = () => {}) {
  const world = { paused: true }, frame = { isConnected: true }
  const dialog = { isConnected: true, open: true, firstElementChild: frame, dataset: { panel: 'load' } }
  const details = { scrollTop: 0, async focus() { calls.push('focus') } }
  const calls = [], timeouts = []
  let scale = frontendScale(1920, 1080), current = dialog, currentWorld = world
  const scene = { world }
  const context = {
    window: { testStore: { getWorld: () => currentWorld }, testSceneRef: { current: scene } },
    document: { querySelector: selector => selector.includes('Checkpoint details') ? details : current },
    innerWidth: 1920, innerHeight: 1080,
    getComputedStyle: () => ({ getPropertyValue: () => String(scale), transform: String(scale) }),
    DOMMatrixReadOnly: class { constructor(value) { this.a = Number(value) } },
  }
  const evaluate = (fn, arg) => vm.runInNewContext(`(${fn})`, context)(arg)
  const handle = { dialog, frame, panel: 'load', world, scene }
  const owner = { value: handle, async dispose() { calls.push('dispose-owner') } }
  const unwrap = arg => arg?.owner ? { ...arg, owner: arg.owner.value } : arg
  const page = {
    async setViewportSize(viewport) { Object.assign(context, { innerWidth: viewport.width, innerHeight: viewport.height }); calls.push('resize') },
    async waitForFunction(fn, arg, options) {
      timeouts.push(options.timeout)
      if (arg?.owner) {
        change({ dialog, frame, replace: () => { current = { ...dialog } }, replaceWorld: () => { currentWorld = {} } })
        assert.equal(evaluate(fn, unwrap(arg)), false, 'old scale must not be accepted')
        scale = frontendScale(context.innerWidth, context.innerHeight)
        assert.equal(evaluate(fn, unwrap(arg)), true)
        calls.push('settled')
      } else assert.equal(evaluate(fn, arg), true)
      return { async dispose() {} }
    },
    async evaluate(fn, arg) { return evaluate(fn, unwrap(arg)) },
    keyboard: { async press(key) { calls.push(key) } },
  }
  const modal = {
    async evaluateHandle(fn) { assert.equal(evaluate(fn, dialog).dialog, dialog); return owner },
    locator: () => details,
  }
  return { page, modal, calls, timeouts }
}
const signal = { throwIfAborted() {} }
test('actual resize owner predicate rejects stale scale then accepts production scale before focus/Home', async () => {
  const f = fixture()
  await settlePauseStyleViewport(f.page, f.modal, { width: 800, height: 450 }, signal)
  assert.deepEqual(f.calls, ['resize', 'settled', 'focus', 'Home', 'dispose-owner'])
  assert.ok(f.timeouts.every(value => value > 0 && value <= 25000))
  assert.ok(f.timeouts[1] <= f.timeouts[0])
})
for (const [name, change] of [
  ['replaced dialog', f => f.replace()],
  ['disconnected dialog', f => { f.dialog.isConnected = false }],
  ['disconnected frame', f => { f.frame.isConnected = false }],
  ['replaced frame', f => { f.dialog.firstElementChild = {} }],
  ['replaced World', f => f.replaceWorld()],
  ['closed dialog', f => { f.dialog.open = false }],
]) test(`${name} fails before later input and still releases owner`, async () => {
  const f = fixture(change)
  await assert.rejects(settlePauseStyleViewport(f.page, f.modal, { width: 800, height: 450 }, signal), /owner changed/)
  assert.deepEqual(f.calls, ['resize', 'dispose-owner'])
})
