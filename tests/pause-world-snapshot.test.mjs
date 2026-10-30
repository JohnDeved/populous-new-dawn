import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { capturePauseWorld, assertPauseWorldUnchanged, disposePauseWorld } from '../scripts/local-render/pause-world-snapshot.mjs'

function fixture(world) {
  const runtime = vm.createContext({ window: { testStore: { getWorld: () => world } } })
  const invoke = (fn, arg) => { runtime.arg = arg; return vm.runInContext(`(${fn})(arg)`, runtime) }
  let reads = 0, transferred = [], disposed = 0, handle
  const page = {
    async evaluateHandle(fn) { const value = invoke(fn); handle = { value, dispose: async () => { disposed++ } }; return handle },
    async evaluate(fn, arg) { reads++; const value = invoke(fn, arg?.value); transferred.push(value); return value },
  }
  return { page, world, reads: () => reads, transferred, disposed: () => disposed, handle: () => handle }
}

test('snapshot is an immutable full serialized string, not a live object or selected fields', async () => {
  const f = fixture({ nested: { units: [{ health: 100 }] }, terrain: [1, 2], paused: true })
  const h = await capturePauseWorld(f.page)
  assert.equal(typeof h.value, 'string')
  assert.equal(h.value, JSON.stringify(f.world))
  await assertPauseWorldUnchanged(f.page, h)
  assert.equal(f.transferred[0], true)
  await disposePauseWorld(h)
  assert.equal(f.disposed(), 1)
})

test('differential full JSON equality rejects nested mutations and retains exact same-evaluation mismatch', async () => {
  const changes = [w => w.nested.units[0].health--, w => w.terrain[1]++, w => w.nested.units.push({ health: 5 }),
    w => w.extra = { arbitrary: ['new'] }, w => delete w.nested, w => { const x = w.paused; delete w.paused; w.paused = x }]
  for (const mutate of changes) {
    const f = fixture({ paused: true, nested: { units: [{ health: 100 }] }, terrain: [1, 2] })
    const expected = JSON.stringify(f.world), h = await capturePauseWorld(f.page)
    mutate(f.world)
    const actual = JSON.stringify(f.world)
    let oldError
    try { assert.equal(actual, expected) } catch (error) { oldError = error }
    assert.ok(oldError)
    await assert.rejects(assertPauseWorldUnchanged(f.page, h), error => {
      assert.equal(error.actual, oldError.actual); assert.equal(error.expected, oldError.expected)
      assert.equal(error.operator, oldError.operator); assert.equal(error.message, oldError.message)
      return true
    })
    assert.equal(f.reads(), 1)
    assert.equal(f.transferred[0].actual, actual)
    assert.equal(f.transferred[0].expected, expected)
  }
})

test('JSON semantics are unchanged for omitted values, NaN and serialization failures', async () => {
  const f = fixture({ a: undefined, b: NaN, nested: [undefined] }), h = await capturePauseWorld(f.page)
  f.world.a = () => {}; f.world.b = Infinity
  await assertPauseWorldUnchanged(f.page, h) // Exact existing JSON oracle, not stronger or weaker fields.
  f.world.circular = f.world
  await assert.rejects(assertPauseWorldUnchanged(f.page, h), /circular/i)
  delete f.world.circular; f.world.big = 1n
  await assert.rejects(assertPauseWorldUnchanged(f.page, h), /BigInt/i)
})

test('evaluation errors retain identity and handle cleanup cannot mask primary errors', async () => {
  const reason = Error('real page closed'), page = { evaluate: async () => { throw reason } }
  await assert.rejects(assertPauseWorldUnchanged(page, {}), error => error === reason)
  const cleanup = Error('handle disposed after page closed'), handle = { dispose: async () => { throw cleanup } }
  await disposePauseWorld(handle, reason)
  assert.equal(reason.worldSnapshotDisposeError, String(cleanup))
  await assert.rejects(disposePauseWorld(handle), error => error === cleanup)
})


test('cleanup cannot replace falsy or primitive thrown values', async () => {
  const cleanup = Error('handle already closed'), handle = { dispose: async () => { throw cleanup } }
  for (const primary of [undefined, null, false, 0, '', 'primary failure', 1n, Symbol('failure')])
    await assert.doesNotReject(disposePauseWorld(handle, primary))
})

test('cleanup annotation cannot replace a frozen or nonextensible primary Error', async () => {
  const cleanup = Error('handle already closed'), handle = { dispose: async () => { throw cleanup } }
  for (const primary of [Object.freeze(Error('original')), Object.preventExtensions(Error('original'))]) {
    await assert.doesNotReject(disposePauseWorld(handle, primary))
    assert.equal(primary.message, 'original')
  }
})
