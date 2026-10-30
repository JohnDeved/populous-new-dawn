import assert from 'node:assert/strict'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { pauseStartupReady } from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'

function fixture({ failLog = false, failDom = false, largeDom = false } = {}) {
  const world = { inputMask: 128, flyby: { flags: 0 }, paused: true, outcome: { level: 1 }, levelStart: [{ phase: 2 }] }
  const logs = []
  const context = { window: { testStore: { getWorld: () => world } }, console: { warn: (...args) => {
    logs.push(args); if (failLog) throw Error('logger failed')
  } }, document: {
    activeElement: { tagName: 'BODY' },
    querySelector: () => { if (failDom) throw Error('DOM unavailable'); return largeDom ? { textContent: '\u0001'.repeat(120) } : null },
    querySelectorAll: selector => selector === 'canvas' ? [] : largeDom
      ? Array.from({ length: 4 }, () => ({ getAttribute: () => '\u0001'.repeat(60), getClientRects: () => [1] })) : [],
  } }
  const poll = snapshot => runInNewContext(`(${pauseStartupReady.toString()})(${Boolean(snapshot)})`, context)
  return { world, logs, context, poll }
}

test('startup trace retains initial and changed snapshots without changing native readiness or World', () => {
  const f = fixture(), before = JSON.stringify(f.world)
  assert.equal(f.poll(), false); assert.equal(f.poll(), false)
  assert.equal(JSON.stringify(f.world), before); assert.equal(f.logs.length, 1)
  const initial = JSON.parse(f.logs[0][1])
  assert.equal(initial.inputMask, 128); assert.equal(initial.paused, true)
  assert.deepEqual(initial.levelStart, [2])
  f.world.inputMask = 64; f.world.flyby.flags = 17
  assert.equal(f.poll(), 'skip'); assert.equal(f.logs.length, 2)
  f.world.inputMask = 0
  assert.equal(f.poll(), 'ready'); assert.equal(f.logs.length, 3)
  assert.deepEqual(JSON.parse(JSON.stringify(f.poll(true))), { action: 'ready', paused: true })
  assert.equal(f.logs.length, 3, 'snapshot calls retain their original return and do not log')
})

test('startup trace caps attempts at16 even when logging throws', () => {
  for (const failLog of [false, true]) {
    const f = fixture({ failLog })
    for (let i = 0; i < 40; i++) { f.world.flyby.flags = i; assert.equal(f.poll(), false) }
    assert.equal(f.logs.length, 16)
  }
})

test('startup trace bounds serialized text while retaining valid native-state JSON', () => {
  const f = fixture({ largeDom: true })
  assert.equal(f.poll(), false)
  assert.ok(f.logs[0][1].length <= 2048)
  const state = JSON.parse(f.logs[0][1]); assert.equal(state.domOmitted, true); assert.equal(state.inputMask, 128)
})

test('diagnostic failures leave readiness unchanged and original World errors still throw', () => {
  const f = fixture({ failDom: true })
  assert.equal(f.poll(), false)
  f.world.inputMask = 0; assert.equal(f.poll(), 'ready')
  f.context.window.testStore.getWorld = () => { throw Error('original World error') }
  assert.throws(() => f.poll(), /original World error/)
})
