import { createHash } from 'node:crypto'

// Inactive engine: caller owns this same live descriptor before and after use.
// No open/reopen/close, worker launch, IPC or filesystem path access here.
export async function hashRetainedDescriptor(handle, { dev, ino, expectedSize,
  budgetMs = 5000, chunkBytes = 1048576, now = () => performance.now(), trace = {} }) {
  if (!handle || !Number.isSafeInteger(handle.fd) || handle.fd < 0 ||
      typeof handle.stat !== 'function' || typeof handle.read !== 'function' ||
      !/^\d+$/.test(dev ?? '') || !/^\d+$/.test(ino ?? '') ||
      !Number.isSafeInteger(expectedSize) || expectedSize < 0 || expectedSize > 268435456 ||
      !Number.isFinite(budgetMs) || budgetMs < 1 || budgetMs > 5000 ||
      !Number.isSafeInteger(chunkBytes) || chunkBytes < 1 || chunkBytes > 1048576)
    throw Error('Invalid retained-descriptor hash admission')
  const fd = handle.fd, started = now()
  if (!Number.isFinite(started)) throw Error('Invalid hash clock')
  let previous = started, active = true, reads = 0
  Object.assign(trace, { status: 'running', phase: 'start', pending: false, bytesHashed: 0, readOperations: 0 })
  const check = () => {
    const time = now()
    if (!Number.isFinite(time) || time < previous) throw Error('Hash clock moved backward')
    previous = time
    trace.elapsedMs = time - started
    if (!active || trace.elapsedMs >= budgetMs) throw Error('Retained hash deadline exceeded')
    if (handle.fd !== fd) throw Error('Retained descriptor changed or closed')
    return budgetMs - trace.elapsedMs
  }
  const call = async (phase, action) => {
    const remaining = check()
    trace.phase = phase; trace.pending = true
    let timer
    const operation = Promise.resolve().then(() => {
      if (!active) throw Error('Retained hash already retired')
      return action()
    })
    operation.then(() => { trace.pending = false }, () => { trace.pending = false })
    try {
      const result = await Promise.race([operation, new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error('Retained hash pending-I/O deadline exceeded')), remaining)
      })])
      check()
      return result
    } catch (error) {
      if (trace.pending) trace.teardownRequired = true
      throw error
    } finally { clearTimeout(timer) }
  }
  const snapshot = value => {
    const result = {}
    for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs']) {
      if (typeof value?.[key] !== 'bigint') throw Error('Bigint descriptor metadata required')
      result[key] = value[key].toString()
    }
    if (result.dev !== dev || result.ino !== ino || result.size !== String(expectedSize))
      throw Error('Retained descriptor metadata mismatch')
    return result
  }
  try {
    const before = snapshot(await call('stat-before', () => handle.stat({ bigint: true })))
    const hash = createHash('sha256'), buffer = Buffer.alloc(Math.min(chunkBytes, Math.max(expectedSize, 1)))
    let position = 0
    while (position < expectedSize) {
      if (++reads > 1024) throw Error('Retained hash read-operation quota exceeded')
      trace.readOperations = reads
      const length = Math.min(buffer.length, expectedSize - position)
      const result = await call('read', () => handle.read(buffer, 0, length, position))
      if (result?.buffer !== buffer || !Number.isSafeInteger(result.bytesRead) ||
          result.bytesRead <= 0 || result.bytesRead > length) throw Error('Invalid or premature retained-file read')
      hash.update(buffer.subarray(0, result.bytesRead))
      position += result.bytesRead
      trace.bytesHashed = position
      check()
    }
    const tail = Buffer.alloc(1)
    const eof = await call('eof', () => handle.read(tail, 0, 1, expectedSize))
    if (eof?.buffer !== tail || eof.bytesRead !== 0) throw Error('Retained file grew beyond admitted size')
    const after = snapshot(await call('stat-after', () => handle.stat({ bigint: true })))
    if (JSON.stringify(before) !== JSON.stringify(after)) throw Error('Retained file metadata changed during hash')
    check()
    const digest = hash.digest('hex')
    check()
    trace.status = 'complete'; trace.phase = 'complete'
    return { status: 'complete', fd, dev, ino, bytes: position, sha256: digest,
      metadata: after, readOperations: reads, elapsedMs: trace.elapsedMs }
  } catch (error) {
    trace.status = 'failed'
    try { trace.error = String(error) } catch { trace.error = 'Unserializable hash failure' }
    throw error
  } finally { active = false }
}
