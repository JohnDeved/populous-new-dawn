import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
const source = readFileSync(new URL('../scripts/tutorial-browser/capture-diagnostic-budget.mjs', import.meta.url), 'utf8')
function fixture() {
  let now = 1000
  const context = vm.createContext({ assert, performance: { now: () => now } })
  vm.runInContext(source.replace(/^import .*\n/gm, '').replace('export function', 'function') + '\nthis.create = captureBudget', context)
  return { create: context.create, set: n => { now = n } }
}
let count = 0
const test = async (name, run) => { await run(); count++; console.log(name) }
await test('delayed sampling subtracts RPC return latency; origins never reset', async () => {
  const f = fixture(), b = f.create(0, 180000)
  f.set(2000)
  const origins = await b.pageOrigins({ evaluate: async fn => {
    assert.equal(fn.toString(), '() => performance.now()'); f.set(7000); return 100
  } })
  assert.equal(origins.launcherDeadlineMs, 173100)
  assert.equal(origins.routeStartMs, -6900)
  assert.equal(origins.caseStartMs, -5900)
  assert.equal(Math.min(origins.routeStartMs + 180000, origins.caseStartMs + 75000, origins.launcherDeadlineMs), 69100)
  assert.equal(b.deadlineMs, 76000)
  f.set(76000); assert.throws(b.check)
})
await test('outer limit clips case start and no fresh allowance on delayed setup', async () => {
  const f = fixture(), b = f.create(0, 1200)
  f.set(1190); assert.equal(b.check(), 10)
  await assert.rejects(b.pageOrigins({ evaluate: async () => { f.set(1200); return 10 } }))
  f.set(1000); assert.throws(b.check)
})
await test('wall clock irrelevant, backward host monotonic timer fails closed', () => {
  const f = fixture(), b = f.create(0, 180000)
  const old = Date.now; Date.now = () => -999999
  try { assert.equal(b.check(), 75000) } finally { Date.now = old }
  f.set(999); assert.throws(b.check)
})
await test('abort and unknown input cannot be cleared by fresh sampling', async () => {
  const f = fixture(), controller = new AbortController(), b = f.create(0, 180000, controller.signal)
  controller.abort(); assert.throws(b.check)
  await assert.rejects(b.pageOrigins({ evaluate: () => { throw Error('must not sample') } }))
  const f2 = fixture(), b2 = f2.create(0, 180000)
  b2.fail('Unknown public input outcome'); assert.throws(b2.check, /Unknown public input/)
})
await test('invalid route origins and enlarged outer cap fail before setup', () => {
  for (const args of [[NaN, 1], [1001, 1002], [0, 180001], [0, 1000]]) assert.throws(() => fixture().create(...args))
})
console.log(JSON.stringify({ controls: count, status: 'passed', scope: 'supplied host clocks only' }))
