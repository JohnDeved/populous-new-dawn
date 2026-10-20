import assert from 'node:assert/strict'
import test from 'node:test'
import { withAngelVisualContext, angelVisualBudgetMs } from '../scripts/tutorial-browser/angel-visuals-budget.mjs'
function fixture() {
  let now = 0, callback, cancelled = 0, closes = 0, creates = 0
  const report = {}, saves = []
  return { report, saves, browser: { async newContext() { creates++; return { async close() { closes++ } } } },
    deadlineAt: 180000, save: () => saves.push(structuredClone(report)),
    clock: { now: () => now, wallNow: () => now, schedule: (fn, delay) => { assert.equal(delay, 50000); callback = fn; return 1 }, cancel: () => { cancelled++ } },
    advance: n => { now = n }, expire: () => { now = 50000; callback() },
    counts: () => ({ cancelled, closes, creates }) }
}
const turn = () => new Promise(resolve => setImmediate(resolve))
test('fixed 50s inclusive episode requires60s admission; exact60 is allowed', async () => {
  assert.deepEqual(angelVisualBudgetMs, { episode: 50000, admission: 60000, outerReserve: 10000 })
  for (const deadlineAt of [59999, 0, NaN, Infinity]) {
    const f = fixture()
    await assert.rejects(withAngelVisualContext({ ...f, deadlineAt, operation: async () => assert.fail() }), /60 seconds/)
    assert.equal(f.report.status, 'failed'); assert.equal(f.counts().creates, 0)
  }
  const f = fixture(); await withAngelVisualContext({ ...f, deadlineAt: 60000, operation: async () => f.advance(49999) })
  assert.equal(f.report.status, 'passed'); assert.equal(f.report.contextClosed, true)
  assert.deepEqual(f.counts(), { cancelled: 1, closes: 1, creates: 1 })
})
test('creation latency and synchronous fixture work consume the same deadline', async () => {
  const f = fixture()
  f.browser.newContext = async () => { f.advance(30000); return { async close() {} } }
  await assert.rejects(withAngelVisualContext({ ...f, operation: async (_context, check) => { f.advance(50000); check() } }), /50-second/)
  assert.equal(f.report.status, 'failed'); assert.equal(f.report.timedOut, true)
})
test('operation failure closes context and cannot become passed', async () => {
  const f = fixture()
  await assert.rejects(withAngelVisualContext({ ...f, operation: async () => { throw Error('bad geometry') } }), /bad geometry/)
  assert.equal(f.report.status, 'failed'); assert.equal(f.report.contextClosed, true)
})
test('creation failure cannot pass or claim an opened context', async () => {
  const f = fixture(); f.browser.newContext = async () => { throw Error('creation failed') }
  await assert.rejects(withAngelVisualContext({ ...f, operation: async () => assert.fail() }), /creation failed/)
  assert.equal(f.report.status, 'failed'); assert.equal(f.report.contextCreationPending, false)
  assert.equal(f.report.contextClosed, undefined)
})
test('a context arriving after deadline is closed and its late cleanup is retained', async () => {
  const f = fixture(); let resolveContext, closes = 0
  f.browser.newContext = () => new Promise(resolve => { resolveContext = resolve })
  const pending = withAngelVisualContext({ ...f, operation: async () => assert.fail() })
  const rejected = assert.rejects(pending, /50-second/)
  await turn(); f.expire(); await rejected
  assert.equal(f.report.contextCreationPending, true); assert.equal(f.report.cleanupPending, true)
  resolveContext({ async close() { closes++ } }); await turn()
  assert.equal(closes, 1); assert.equal(f.report.contextClosed, true); assert.equal(f.report.cleanupPending, false)
  assert.equal(f.report.status, 'failed'); assert.equal(f.saves.at(-1).contextClosed, true)
})
test('cleanup delay shares the deadline and is not successful retention', async () => {
  const f = fixture(); let resolveClose
  f.browser.newContext = async () => ({ close: () => new Promise(resolve => { resolveClose = resolve }) })
  const pending = withAngelVisualContext({ ...f, operation: async () => {} }), rejected = assert.rejects(pending, /50-second/)
  await turn(); f.expire(); await rejected
  assert.equal(f.report.status, 'failed'); assert.equal(f.report.cleanupPending, true)
  resolveClose(); await turn(); assert.equal(f.report.contextClosed, true); assert.equal(f.report.status, 'failed')
})
test('cleanup rejection is explicit failure and a body timeout closes only once', async () => {
  const f = fixture(); f.browser.newContext = async () => ({ async close() { throw Error('cannot close') } })
  await assert.rejects(withAngelVisualContext({ ...f, operation: async () => {} }), /cannot close/)
  assert.match(f.report.cleanupFailure, /cannot close/); assert.equal(f.report.status, 'failed')
  const g = fixture(), pending = withAngelVisualContext({ ...g, operation: () => new Promise(() => {}) })
  const rejected = assert.rejects(pending, /50-second/); await turn(); g.expire(); await rejected; await turn()
  assert.equal(g.counts().closes, 1); assert.equal(g.report.status, 'failed')
})
test('final synchronous receipt retention is inside the inclusive deadline', async () => {
  for (const elapsed of [50000, 50001]) {
    const f = fixture()
    const save = () => { if (f.report.status === 'passed') f.advance(elapsed); f.save() }
    await assert.rejects(withAngelVisualContext({ ...f, save, operation: async () => {} }), /50-second/)
    assert.equal(f.report.status, 'failed'); assert.equal(f.report.timedOut, true)
    assert.equal(f.report.elapsedMs, elapsed); assert.equal(f.saves.at(-1).status, 'failed')
    assert.equal(f.counts().cancelled, 1)
  }
})
