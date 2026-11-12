import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { hashRetainedDescriptor } from '../scripts/native-ui-evidence/setup-v2-proposal/retained-hash-core.mjs'
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
function fixture(text = 'abcdef') {
  const bytes = Buffer.from(text), state = { calls: [], stats: 0, mtime: 1n }
  const handle = { fd: 7,
    async stat(options) { assert.deepEqual(options, { bigint: true }); state.calls.push('stat'); state.stats++
      return { dev: 1n, ino: 2n, size: BigInt(bytes.length), mtimeNs: state.mtime, ctimeNs: 1n } },
    async read(buffer, offset, length, position) { state.calls.push('read')
      const count = Math.min(length, Math.max(0, bytes.length - position))
      bytes.copy(buffer, offset, position, position + count); return { buffer, bytesRead: count } },
  }
  const options = { dev: '1', ino: '2', expectedSize: bytes.length, budgetMs: 1000, chunkBytes: 2, trace: {} }
  return { bytes, state, handle, options, run: extra => hashRetainedDescriptor(handle, { ...options, ...extra }) }
}
test('chunked retained handle yields complete digest and never closes it', async () => {
  const f = fixture(), result = await f.run()
  assert.equal(result.sha256, digest(f.bytes)); assert.equal(result.bytes, 6); assert.equal(result.readOperations, 3)
  assert.equal(f.handle.fd, 7); assert.equal(f.options.trace.status, 'complete')
})
test('empty retained file is checked for EOF and metadata', async () => {
  const f = fixture(''), result = await f.run()
  assert.equal(result.sha256, digest(Buffer.alloc(0))); assert.equal(result.readOperations, 0)
  assert.equal(f.state.stats, 2)
})
test('positive partial reads are fully hashed', async () => {
  const f = fixture(), read = f.handle.read
  f.handle.read = (buffer, offset, length, position) => read(buffer, offset, Math.min(length, 1), position)
  assert.equal((await f.run()).sha256, digest(f.bytes))
})
for (const [name, replacement] of [
  ['zero before end', (buffer) => ({ buffer, bytesRead: 0 })],
  ['oversized count', (buffer) => ({ buffer, bytesRead: 3 })],
  ['wrong returned buffer', () => ({ buffer: Buffer.alloc(2), bytesRead: 2 })],
]) test('rejects ' + name, async () => {
  const f = fixture(); f.handle.read = async buffer => replacement(buffer)
  await assert.rejects(f.run(), /Invalid or premature/)
})
test('changed descriptor integer fails before digest acceptance', async () => {
  const f = fixture(), read = f.handle.read
  f.handle.read = async (...args) => { const result = await read(...args); f.handle.fd = 8; return result }
  await assert.rejects(f.run(), /descriptor changed/)
})
test('device/inode mismatch fails before reading', async () => {
  const f = fixture()
  await assert.rejects(f.run({ ino: '3' }), /metadata mismatch/)
  assert.deepEqual(f.state.calls, ['stat'])
})
test('metadata change invalidates complete byte digest', async () => {
  const f = fixture(), stat = f.handle.stat
  f.handle.stat = async options => { if (f.state.stats) f.state.mtime = 2n; return stat(options) }
  await assert.rejects(f.run(), /metadata changed/)
})
test('file growth at explicit EOF probe is rejected', async () => {
  const f = fixture(), read = f.handle.read
  f.handle.read = async (buffer, offset, length, position) => position === f.bytes.length
    ? { buffer, bytesRead: 1 } : read(buffer, offset, length, position)
  await assert.rejects(f.run(), /grew/)
})
test('original frozen read error is preserved', async () => {
  const f = fixture(), error = Object.freeze(Error('read failed'))
  f.handle.read = async () => { throw error }
  await assert.rejects(f.run(), reason => reason === error)
})
test('late successful read cannot pass a retired deadline', async () => {
  const f = fixture(), read = f.handle.read
  let finish, invoked
  const started = new Promise(resolve => { invoked = resolve })
  const pending = new Promise(resolve => { finish = resolve })
  f.handle.read = async (...args) => { invoked(); await pending; return read(...args) }
  const result = f.run({ budgetMs: 10 })
  const rejected = assert.rejects(result, /pending-I\/O deadline/)
  await started; await rejected
  assert.equal(f.options.trace.teardownRequired, true)
  finish(); await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.options.trace.status, 'failed'); assert.equal(f.options.trace.teardownRequired, true)
  assert.equal(f.state.stats, 1)
})
test('pending stat deadline requires owner teardown', async () => {
  const f = fixture(); f.handle.stat = () => new Promise(() => {})
  await assert.rejects(f.run({ budgetMs: 5 }), /pending-I\/O deadline/)
  assert.equal(f.options.trace.teardownRequired, true)
})
test('after-read clock expiry rejects success even before timer callback', async () => {
  const f = fixture(), read = f.handle.read; let clock = 0
  f.handle.read = async (...args) => { const result = await read(...args); clock = 10; return result }
  await assert.rejects(f.run({ budgetMs: 10, now: () => clock }), /deadline/)
})
test('backward clock fails closed', async () => {
  const f = fixture(), stat = f.handle.stat; let clock = 10
  f.handle.stat = async options => { clock = 9; return stat(options) }
  await assert.rejects(f.run({ now: () => clock }), /backward/)
})
test('invalid allocation or budget admission performs no operations', async () => {
  for (const extra of [{ budgetMs: 5001 }, { chunkBytes: 1048577 }, { expectedSize: 268435457 }, { chunkBytes: 0 }]) {
    const f = fixture(); await assert.rejects(f.run(extra), /admission/); assert.deepEqual(f.state.calls, [])
  }
})
test('finite read quota bounds a nonadvancing supplied clock', async () => {
  const f = fixture('x'.repeat(1025))
  await assert.rejects(f.run({ chunkBytes: 1, now: () => 0 }), /quota/)
  assert.equal(f.options.trace.bytesHashed, 1024)
})

test('EOF accounting includes exactly one extra read including empty files', async () => {
  for (const text of ['', 'abc', 'x'.repeat(1024)]) {
    const f = fixture(text)
    const result = await f.run({ chunkBytes: 1, now: () => 0 })
    assert.equal(result.readOperations, text.length)
    assert.equal(f.state.calls.filter(value => value === 'read').length, text.length + 1)
    assert.equal(f.state.stats, 2)
  }
})
for (const phase of ['eof', 'stat-after']) {
  test('pending ' + phase + ' cannot publish digest after retirement', async () => {
    const f = fixture('x'), read = f.handle.read, stat = f.handle.stat
    let finish, entered = 0
    const pending = new Promise(resolve => { finish = resolve })
    if (phase === 'eof') {
      f.handle.read = async (...args) => {
        if (args[3] === f.bytes.length) { entered++; await pending }
        return read(...args)
      }
    } else {
      f.handle.stat = async options => {
        if (f.state.stats === 1) { entered++; await pending }
        return stat(options)
      }
    }
    // Supplied clock avoids expiring before the selected phase is entered;
    // real pending-operation timer is the boundary under test.
    const result = f.run({ budgetMs: 10, now: () => 0 })
    await assert.rejects(result, /pending-I\/O deadline/)
    assert.equal(entered, 1)
    assert.equal(f.options.trace.phase, phase)
    assert.equal(f.options.trace.pending, true)
    assert.equal(f.options.trace.teardownRequired, true)
    finish()
    await new Promise(resolve => setImmediate(resolve))
    const settledCalls = [...f.state.calls]
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(f.state.calls, settledCalls)
    assert.equal(f.options.trace.pending, false)
    assert.equal(f.options.trace.status, 'failed')
    assert.equal(f.options.trace.teardownRequired, true)
    assert.equal(f.state.stats, phase === 'eof' ? 1 : 2)
  })
  test('original ' + phase + ' rejection identity is preserved', async () => {
    const f = fixture('x'), read = f.handle.read, stat = f.handle.stat
    const original = Object.freeze(Error(phase + ' rejected'))
    if (phase === 'eof') {
      f.handle.read = (...args) => args[3] === f.bytes.length
        ? Promise.reject(original) : read(...args)
    } else {
      f.handle.stat = options => f.state.stats === 1
        ? Promise.reject(original) : stat(options)
    }
    await assert.rejects(f.run(), reason => reason === original)
    assert.equal(f.options.trace.status, 'failed')
    assert.notEqual(f.options.trace.teardownRequired, true)
  })
}
