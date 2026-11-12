import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { mkdtempSync, readFileSync, rmSync, writeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createObservedSupervisor } from '../scripts/native-ui-evidence/setup-v2-proposal/supervise-observed.mjs'

function fixture(t, { observation = async () => ({ status: 'absent' }), signalFailure, writeLog } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'observed-owner-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const child = Object.assign(new EventEmitter(), { pid: 42, stdout: new PassThrough(), stderr: new PassThrough() })
  const signals = [], requests = []
  const run = createObservedSupervisor({
    ...(writeLog ? { writeLog } : {}),
    spawnProcess(command, args, options) { assert.equal(options.detached, true); return child },
    signalChild(target, signal) { assert.equal(target, child); signals.push(signal); if (signalFailure) throw signalFailure },
    observe: async (pid, options) => { requests.push({ pid, options }); return observation() },
  })
  return { root, child, signals, requests, start: (capMs = 1000) => run(['-e', ''], { cwd: root, log: join(root, 'raw.log'), capMs }) }
}
test('exit zero awaits absent observation before passed receipt', async t => {
  let finish
  const f = fixture(t, { observation: () => new Promise(resolve => { finish = resolve }) })
  let settled = false
  const result = f.start().then(value => { settled = true; return value })
  f.child.stdout.write('actual supplied raw output')
  f.child.emit('close', 0, null)
  await Promise.resolve(); assert.equal(settled, false)
  finish({ status: 'absent' })
  assert.equal((await result).status, 'passed')
  assert.deepEqual(f.signals, [])
  assert.equal(f.requests[0].pid, 42)
  assert.equal(readFileSync(join(f.root, 'raw.log'), 'utf8'), 'actual supplied raw output')
})
test('unverified group prevents success even after zero exit', async t => {
  const f = fixture(t, { observation: async () => ({ status: 'unverified', error: Error('still present') }) })
  const pending = f.start(); f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.status, 'failed'); assert.match(result.failure, /disappearance unverified/)
})
test('observer rejection becomes explicit unverified cleanup', async t => {
  const f = fixture(t, { observation: async () => { throw Error('probe denied') } })
  const pending = f.start(); f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.groupCleanup.status, 'unverified'); assert.match(result.groupCleanup.error, /probe denied/)
})
test('nonzero command exit remains failed even after absent group', async t => {
  const f = fixture(t), pending = f.start(); f.child.emit('close', 3, null)
  assert.equal((await pending).status, 'failed')
})
test('signal denial stays failed despite later absent observation', async t => {
  const f = fixture(t, { signalFailure: Object.assign(Error('denied'), { code: 'EPERM' }) })
  const pending = f.start(); f.child.stdout.write(Buffer.alloc(65537)); f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.status, 'failed'); assert.equal(result.signalErrors.length, 1)
})
test('direct-child ESRCH does not create a signal failure but preserves triggering failure', async t => {
  const f = fixture(t, { signalFailure: Object.assign(Error('missing'), { code: 'ESRCH' }) })
  const pending = f.start(); f.child.stdout.write(Buffer.alloc(65537)); f.child.emit('close', 0, null)
  const result = await pending; assert.equal(result.status, 'failed'); assert.deepEqual(result.signalErrors, [])
})
test('log overflow triggers termination and remains failed after close', async t => {
  const f = fixture(t), pending = f.start()
  f.child.stdout.write(Buffer.alloc(65537))
  f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.status, 'failed'); assert.match(result.failure, /Log budget/)
  assert.deepEqual(f.signals, ['SIGTERM']); assert.equal(result.logBytes, 0)
})
test('live child error does not reject before owned close cleanup', async t => {
  const f = fixture(t), pending = f.start()
  f.child.emit('error', Error('live error'))
  f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.status, 'failed'); assert.match(result.failure, /live error/)
  assert.deepEqual(f.signals, ['SIGTERM'])
})
test('spawn failure without a group rejects original error without signalling', async t => {
  const f = fixture(t), error = Error('spawn failure'); f.child.pid = undefined
  const pending = f.start(); const rejected = assert.rejects(pending, reason => reason === error)
  f.child.emit('error', error); f.child.emit('close', -1, null)
  await rejected; assert.deepEqual(f.signals, []); assert.deepEqual(f.requests, [])
})
test('timeout remains failed even when child later exits zero and group is absent', async t => {
  const f = fixture(t), pending = f.start(5)
  await new Promise(resolve => setTimeout(resolve, 20))
  f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.status, 'failed'); assert.match(result.failure, /deadline/)
  assert.deepEqual(f.signals, ['SIGTERM'])
})
test('uncooperative supplied child gets escalation before close and cannot pass', async t => {
  const f = fixture(t), pending = f.start(5)
  await new Promise(resolve => setTimeout(resolve, 130))
  assert.deepEqual(f.signals, ['SIGTERM', 'SIGKILL'])
  f.child.emit('close', null, 'SIGKILL')
  const result = await pending
  assert.equal(result.status, 'failed'); assert.equal(result.groupCleanup.status, 'absent')
})
test('leader exit retires signalling before delayed close or possible group reuse', async t => {
  const f = fixture(t, { observation: async () => ({ status: 'unverified' }) }), pending = f.start(5)
  f.child.emit('exit', 0, null)
  await new Promise(resolve => setTimeout(resolve, 130))
  f.child.emit('close', 0, null)
  const result = await pending
  assert.deepEqual(f.signals, [])
  assert.equal(result.status, 'failed')
})
test('a still-present group after normal close is never signalled', async t => {
  const f = fixture(t, { observation: async () => ({ status: 'unverified' }) }), pending = f.start()
  f.child.emit('close', 0, null)
  const result = await pending
  assert.deepEqual(f.signals, []); assert.equal(result.status, 'failed')
})
test('partial writes retain every byte with exact accounting', async t => {
  const f = fixture(t, { writeLog: (fd, data, offset, length) => writeSync(fd, data, offset, Math.min(length, 2)) })
  const pending = f.start(); f.child.stdout.write('seven!!'); f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.status, 'passed'); assert.equal(result.logBytes, 7)
  assert.equal(readFileSync(join(f.root, 'raw.log'), 'utf8'), 'seven!!')
})
test('zero write progress fails and never certifies missing bytes', async t => {
  const f = fixture(t, { writeLog: () => 0 }), pending = f.start()
  f.child.stdout.write('missing'); f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.status, 'failed'); assert.equal(result.logBytes, 0)
  assert.match(result.failure, /zero log write/)
})
test('partial write followed by error retains actual written count and failure', async t => {
  let writes = 0
  const f = fixture(t, { writeLog: (fd, data, offset, length) => {
    if (++writes > 1) throw Error('disk full')
    return writeSync(fd, data, offset, 2)
  } }), pending = f.start()
  f.child.stdout.write('abcdef'); f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.status, 'failed'); assert.equal(result.logBytes, 2)
  assert.equal(readFileSync(join(f.root, 'raw.log'), 'utf8'), 'ab')
})
test('leader exit after TERM cancels pending escalation before delayed stream close', async t => {
  const f = fixture(t), pending = f.start(5)
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.deepEqual(f.signals, ['SIGTERM'])
  f.child.emit('exit', 0, null)
  await new Promise(resolve => setTimeout(resolve, 130))
  assert.deepEqual(f.signals, ['SIGTERM'], 'Retired leader must not receive scheduled SIGKILL')
  f.child.emit('close', 0, null)
  const result = await pending
  assert.equal(result.status, 'failed')
  assert.match(result.failure, /deadline/)
  assert.equal(result.groupCleanup.status, 'absent')
  assert.deepEqual(f.signals, ['SIGTERM'])
})
