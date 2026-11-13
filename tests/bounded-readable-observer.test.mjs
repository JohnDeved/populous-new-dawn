import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { observeBoundedReadable } from '../scripts/native-ui-evidence/setup-v2-proposal/bounded-readable-observer.mjs'
test('end alone does not settle completion; close does', async () => {
  const stream = new EventEmitter(), o = observeBoundedReadable(stream)
  let settled = false; o.completion.then(() => { settled = true })
  stream.emit('data', Buffer.from('abc')); stream.emit('end')
  await Promise.resolve(); assert.equal(settled, false)
  stream.emit('close'); assert.deepEqual(await o.completion, { kind: 'closed' })
  assert.equal(o.snapshot().status, 'complete'); assert.equal(o.snapshot().bytes.toString(), 'abc')
  o.disposeAfterClose(); assert.equal(stream.listenerCount('error'), 0)
})
test('premature close fails even though completion says closed', async () => {
  const stream = new EventEmitter(), o = observeBoundedReadable(stream)
  stream.emit('close'); await o.completion
  assert.equal(o.snapshot().status, 'failed')
  assert.match((await o.failure).reason.message, /without end/)
  o.disposeAfterClose()
})
test('overflow notifies owner promptly and keeps draining bounded bytes', async () => {
  const stream = new EventEmitter(), o = observeBoundedReadable(stream, { capBytes: 2 })
  stream.emit('data', Buffer.from('abc'))
  assert.match((await o.failure).reason.message, /ceiling/)
  stream.emit('data', Buffer.from('def')); stream.emit('end'); stream.emit('close')
  await o.completion; const s = o.snapshot()
  assert.equal(s.observedBytes, 6); assert.equal(s.capturedBytes, 2); assert.equal(s.status, 'failed')
  o.disposeAfterClose()
})
test('pending close timeout requires teardown and late close never clears it', async () => {
  const stream = new EventEmitter(), o = observeBoundedReadable(stream, { deadlineMs: 5 })
  assert.deepEqual(await o.completion, { kind: 'retired' })
  assert.equal(o.snapshot().teardownRequired, true)
  assert.throws(() => o.disposeAfterClose(), /before owned/)
  stream.emit('end'); stream.emit('close')
  assert.equal(o.snapshot().retired, true); assert.equal(o.snapshot().teardownRequired, true)
  assert.equal(o.snapshot().status, 'failed'); o.disposeAfterClose()
})
test('original falsy stream failure survives timeout', async () => {
  const stream = new EventEmitter(), o = observeBoundedReadable(stream, { deadlineMs: 5 })
  stream.emit('error', undefined); assert.equal((await o.failure).reason, undefined)
  await o.completion; assert.equal(o.snapshot().originalFailure, undefined)
  assert.equal(o.snapshot().hasFailure, true)
  stream.emit('close'); o.disposeAfterClose()
})
test('late data and error remain observable until owner disposal', async () => {
  const stream = new EventEmitter(), o = observeBoundedReadable(stream)
  stream.emit('end'); stream.emit('close'); await o.completion
  stream.emit('data', Buffer.from('x')); stream.emit('error', Error('late'))
  const s = o.snapshot()
  assert.equal(s.status, 'failed'); assert.equal(s.observedBytes, 1); assert.equal(s.truncated, true)
  o.disposeAfterClose()
})
test('close checks elapsed time even before timer callback', async () => {
  const stream = new EventEmitter(); let time = 0
  const o = observeBoundedReadable(stream, { deadlineMs: 10, now: () => time })
  stream.emit('end'); time = 10; stream.emit('close')
  assert.deepEqual(await o.completion, { kind: 'retired' })
  assert.equal(o.snapshot().status, 'failed'); o.disposeAfterClose()
})
test('duplicate events fail closed without replacing original error', async () => {
  const stream = new EventEmitter(), o = observeBoundedReadable(stream)
  stream.emit('end'); stream.emit('end')
  const first = (await o.failure).reason
  stream.emit('close'); stream.emit('close'); await o.completion
  assert.equal(o.snapshot().originalFailure, first); o.disposeAfterClose()
})

for (const event of ['error', 'end', 'close', 'data']) {
  for (const attachFirst of [false, true]) {
    test('owner releases failed attachment at ' + event + ' attached=' + attachFirst, async () => {
      const stream = new EventEmitter(), originalOn = stream.on.bind(stream)
      const ownerError = () => {}
      originalOn('error', ownerError)
      const original = Object.freeze(Error('attach failed'))
      stream.on = (name, listener) => {
        if (name === event) {
          if (attachFirst) originalOn(name, listener)
          throw original
        }
        return originalOn(name, listener)
      }
      const o = observeBoundedReadable(stream)
      assert.deepEqual(await o.completion, { kind: 'retired' })
      assert.equal((await o.failure).reason, original)
      assert.equal(o.snapshot().setupFailed, true)
      assert.equal(o.snapshot().teardownRequired, true)
      // The supplied owner has now completed its teardown; adapter may have missed close.
      stream.emit('close')
      assert.equal(o.disposeAfterOwnerTeardown(), true)
      const s = o.snapshot()
      assert.equal(s.ownerReleased, true); assert.equal(s.detached, true)
      assert.equal(s.status, 'failed'); assert.equal(s.originalFailure, original)
      assert.equal(s.teardownRequired, true)
      for (const name of ['end', 'close', 'data']) assert.equal(stream.listenerCount(name), 0)
      assert.deepEqual(stream.listeners('error'), [ownerError])
    })
  }
}
test('synchronous end and close while attaching data does not leave a timer failure', async () => {
  const stream = new EventEmitter(), originalOn = stream.on.bind(stream)
  stream.on = (name, listener) => {
    originalOn(name, listener)
    if (name === 'data') { stream.emit('end'); stream.emit('close') }
    return stream
  }
  const o = observeBoundedReadable(stream, { deadlineMs: 5, now: () => 0 })
  assert.deepEqual(await o.completion, { kind: 'closed' })
  await new Promise(resolve => setTimeout(resolve, 15))
  assert.equal(o.snapshot().status, 'complete'); assert.equal(o.snapshot().retired, false)
  o.disposeAfterClose()
})
test('failed listener removal remains explicit and retry preserves primary failure', async () => {
  const stream = new EventEmitter(), off = stream.off.bind(stream)
  const o = observeBoundedReadable(stream, { deadlineMs: 5 })
  await o.completion; const original = o.snapshot().originalFailure
  stream.off = (name, listener) => { if (name === 'error') throw Error('remove failed'); return off(name, listener) }
  assert.equal(o.disposeAfterOwnerTeardown(), false)
  assert.equal(o.snapshot().detached, false)
  assert.equal(o.snapshot().originalFailure, original)
  stream.off = off
  assert.equal(o.disposeAfterOwnerTeardown(), true)
  assert.equal(o.snapshot().teardownRequired, true)
})
