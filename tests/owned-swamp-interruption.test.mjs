import test from 'node:test'
import assert from 'node:assert/strict'
import { interruptOwnedSwamp, dispatchInterruption } from '../scripts/owned-swamp-evidence/interruption.mjs'

const witness = { current: true, effectPresent: true, meshPresent: true, remaining: 32000 }
function harness(change = false, paused = false, miss = false) {
  const calls = [], stages = []
  let reads = 0
  const page = {
    evaluate: async (fn, kind) => {
      if (fn.name === 'readWitness') {
        reads++
        return { ...witness, paused: paused && reads === 2, remaining: change && reads === 3 ? 0 : 32000 }
      }
      if (kind && typeof kind === 'object') return { current: true, canvasOwned: true, distance: miss ? 8 : 0, paused: false, inputMask: 0, mode: null }
      if (kind) { calls.push(kind); return { kind, syntheticInterruption: true } }
      calls.push('observe-press')
    },
    getByRole: (_, opts) => ({ focus: async () => calls.push(opts.name) }),
    waitForFunction: async () => calls.push('unpaused'),
    keyboard: { press: async key => calls.push('press-' + key), down: async key => calls.push('down-' + key), up: async key => calls.push('up-' + key) },
    mouse: { move: async () => calls.push('move'), down: async () => calls.push('press'), up: async () => calls.push('release') },
  }
  return { calls, stages, page, deadline: { run: fn => fn() }, point: { x: 100, y: 100 }, stage: (name, data) => stages.push({ name, data }) }
}
test('each interruption is delivered between stationary press and release, retaining live witness', async () => {
  const h = harness()
  await interruptOwnedSwamp(h)
  assert.equal(h.stages.length, 3)
  for (const [i, kind] of ['canvas-pointercancel', 'window-pointercancel', 'window-blur'].entries()) {
    assert.deepEqual(h.calls.slice(i * 8, i * 8 + 8), ['observe-press', 'down-Shift', 'move', 'press', kind, 'move', 'release', 'up-Shift'])
    assert.deepEqual(h.stages[i].data.before, h.stages[i].data.after)
  }
})
test('an interrupted release that removes the trap fails closed', async () => {
  const h = harness(true)
  await assert.rejects(interruptOwnedSwamp(h), /live, unexpired trap/)
  assert.equal(h.stages.length, 0)
})

test('blur-like pause is publicly resumed before stale release', async () => {
  const h = harness(false, true)
  await interruptOwnedSwamp(h)
  assert.ok(h.calls.indexOf('Resume game') > h.calls.indexOf('canvas-pointercancel'))
  assert.deepEqual(h.calls.slice(h.calls.indexOf('Resume game'), h.calls.indexOf('release')), ['Resume game', 'press-Enter', 'unpaused', 'move'])
})
test('a pick miss cannot count as interruption acceptance', async () => {
  await assert.rejects(interruptOwnedSwamp(harness(false, false, true)), /still pick trap/)
})

for (const fault of ['unarmed', 'mismatched', 'moved', 'not-cleared']) {
  test(`interruption rejects ${fault} ownership`, t => {
    const world = {}, scene = { world, pointerButtons: 2,
      pointerGesture: fault === 'unarmed' ? null : { pointerId: fault === 'mismatched' ? 9 : 1, moved: fault === 'moved' },
      renderer: { domElement: {} } }
    const dispatchEvent = () => { if (fault !== 'not-cleared') { scene.pointerGesture = null; scene.pointerButtons = 0 } }
    scene.renderer.domElement.dispatchEvent = dispatchEvent
    const oldWindow = globalThis.window, oldPointer = globalThis.PointerEvent
    t.after(() => { globalThis.window = oldWindow; globalThis.PointerEvent = oldPointer })
    globalThis.PointerEvent = class { constructor() { this.isTrusted = false } }
    globalThis.window = { __ownedSwampPress: { button: 2, pointerId: 1 }, __ownedSwampWitness: { scene, world },
      testSceneRef: { current: scene }, testStore: { getWorld: () => world }, dispatchEvent }
    assert.throws(() => dispatchInterruption('canvas-pointercancel'), /matching armed|immediately clear/)
  })
}

test('failed Resume readiness cannot reach stale release', async () => {
  const h = harness(false, true)
  h.page.waitForFunction = async () => { throw Error('still paused') }
  await assert.rejects(interruptOwnedSwamp(h), /still paused/)
  assert.equal(h.calls.includes('release'), false)
  assert.equal(h.calls.at(-1), 'up-Shift')
})
