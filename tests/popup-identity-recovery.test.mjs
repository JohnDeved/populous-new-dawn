import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { capturePreparationIdentity, observePreparationIdentity, createIdentityLease } from '../scripts/native-ui-evidence/setup-v2-proposal/popup-identity.mjs'

function popup(serial = '7', open = true) {
  const detail = { isConnected: true, open, getAttribute: () => serial, children: [] }
  detail.children.push({ tagName: 'DIV', isConnected: true, parentElement: detail,
    getBoundingClientRect: () => ({ width: detail.open ? 100 : 0, height: detail.open ? 20 : 0 }) })
  return detail
}
function fixture(details = [popup()]) {
  const world = {}, scene = { world }
  const context = vm.createContext({ window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
    document: { querySelectorAll: () => details }, getComputedStyle: () => ({ visibility: 'visible' }) })
  const evaluate = (fn, arg) => { context.arg = arg; return vm.runInContext(`(${fn})(arg)`, context) }
  const expected = evaluate(capturePreparationIdentity)
  const read = requested => JSON.parse(JSON.stringify(evaluate(observePreparationIdentity, { expected, requested })))
  return { details, world, scene, context, read }
}
test('real observations retain open and closed identity', () => {
  const f = fixture(); f.read({ serial: '7', open: true }); f.details[0].open = false
  assert.deepEqual(f.read({ serial: '7', open: false }), [{ serial: '7', open: false }])
})
test('empty entry binds original World and Scene', () => {
  const f = fixture([]); assert.deepEqual(f.read(), [])
  const world = {}; f.context.window.testStore.getWorld = () => world; f.context.window.testSceneRef.current = { world }
  assert.throws(() => f.read(), /World or Scene replaced/)
})
for (const [name, mutate] of [
  ['same serial replacement', f => { f.details[0] = popup('7', false) }],
  ['body replacement', f => { const d = f.details[0]; d.children = [{ ...d.children[0] }] }],
  ['removal', f => { f.details.pop() }],
  ['disconnected body', f => { f.details[0].children[0].isConnected = false }],
  ['duplicate serial', f => { f.details.push(popup()) }],
]) test(`rejects ${name}`, () => { const f = fixture(); mutate(f); assert.throws(() => f.read()) })
test('new owner becomes identity-bound', () => {
  const f = fixture([]); f.details.push(popup('8')); f.read(); f.details[0] = popup('8')
  assert.throws(() => f.read(), /identity replaced/)
})
test('hidden wait is insufficient when retained body remains visible', () => {
  const f = fixture(); f.details[0].open = false
  f.details[0].children[0].getBoundingClientRect = () => ({ width: 10, height: 10 })
  assert.throws(() => f.read({ serial: '7', open: false }), /visibility/)
})
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }
test('normal lease disposes once and rejects reuse', async () => {
  let disposed = 0
  const trace = {}, lease = createIdentityLease({ evaluateHandle: async () => ({ dispose: async () => { disposed++ } }), evaluate: async () => [] }, trace)
  await lease.acquire(); assert.deepEqual(await lease.observe(), []); await lease.close()
  assert.equal(disposed, 1); assert.equal(trace.identityCleanup.status, 'settled')
  assert.throws(() => lease.observe(), /unavailable/)
})
test('late acquisition disposes without exposing a reusable handle', async () => {
  const deferredHandle = deferred(); let disposed = 0
  const trace = {}, lease = createIdentityLease({ evaluateHandle: () => deferredHandle.promise }, trace, { cleanupMs: 5 })
  const acquire = lease.acquire(); const rejection = assert.rejects(acquire, /closed/)
  await Promise.resolve(); await Promise.resolve()
  await assert.rejects(lease.close(), /teardown/)
  assert.equal(trace.teardownRequired, true)
  deferredHandle.resolve({ dispose: async () => { disposed++ } })
  await rejection; assert.equal(disposed, 1)
})
test('disposal rejection remains a teardown requirement', async () => {
  const trace = {}, lease = createIdentityLease({ evaluateHandle: async () => ({ dispose: async () => { throw Error('dispose failed') } }) }, trace)
  await lease.acquire(); await assert.rejects(lease.close(), /teardown/)
  assert.equal(trace.identityCleanup.errors, 1)
})
test('hung observation demands teardown without replay', async () => {
  const wait = deferred(); let calls = 0
  const trace = {}, lease = createIdentityLease({ evaluateHandle: async () => ({ dispose: async () => {} }), evaluate: () => { calls++; return wait.promise } }, trace, { cleanupMs: 5 })
  await lease.acquire(); const observed = lease.observe(); await Promise.resolve()
  await assert.rejects(lease.close(), /teardown/); assert.equal(calls, 1)
  wait.resolve([]); await observed; assert.equal(trace.teardownRequired, true)
})
test('closing before acquisition RPC starts never starts it', async () => {
  let calls = 0
  const trace = {}, lease = createIdentityLease({ evaluateHandle: () => { calls++; throw Error('unexpected') } }, trace)
  const acquire = lease.acquire(), rejection = assert.rejects(acquire, /closed/)
  await lease.close(); await rejection; assert.equal(calls, 0)
})
