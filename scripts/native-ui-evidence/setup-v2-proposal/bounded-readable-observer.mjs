import { createBoundedStreamRecord } from './bounded-stream-record.mjs'

// Stream-local observation only. Does not destroy streams or own a child.
export function observeBoundedReadable(stream, { capBytes = 65536, deadlineMs = 1000,
  now = () => performance.now() } = {}) {
  if (!stream || typeof stream.on !== 'function' || typeof stream.off !== 'function' ||
      !Number.isFinite(deadlineMs) || deadlineMs < 1 || deadlineMs > 5000)
    throw Error('Invalid readable observation admission')
  const record = createBoundedStreamRecord(capBytes)
  const started = now()
  if (!Number.isFinite(started)) throw Error('Invalid readable clock')
  let previous = started, ended = false, closed = false, retired = false, detached = false
  let teardownRequired = false, notified = false, resolveCompletion, resolveFailure, timer
  const completion = new Promise(resolve => { resolveCompletion = resolve })
  const failure = new Promise(resolve => { resolveFailure = resolve })
  const fail = reason => {
    record.fail(reason)
    if (!notified) { notified = true; resolveFailure({ reason }) }
  }
  const check = () => {
    const time = now()
    if (!Number.isFinite(time) || time < previous) throw Error('Invalid readable clock progression')
    previous = time
    if (time - started >= deadlineMs) throw Error('Readable observation deadline exceeded')
  }
  const retire = reason => {
    fail(reason); retired = true
    if (!closed) teardownRequired = true
    clearTimeout(timer)
    resolveCompletion({ kind: 'retired' })
  }
  const onData = bytes => {
    try { record.append(bytes) } catch (error) { fail(error) }
  }
  const onError = reason => fail(reason)
  const onEnd = () => {
    if (ended) { fail(Error('Duplicate readable end')); return }
    ended = true
    try { record.end() } catch (error) { fail(error) }
  }
  const onClose = () => {
    if (closed) { fail(Error('Duplicate readable close')); return }
    closed = true
    clearTimeout(timer)
    if (!ended) fail(Error('Readable closed without end'))
    if (!retired) {
      try { check() } catch (error) { retire(error); return }
      resolveCompletion({ kind: 'closed' })
    }
  }
  const listeners = [['data', onData], ['error', onError], ['end', onEnd], ['close', onClose]]
  try {
    // Attach data last: a real readable can begin flowing when this listener is added.
    for (const name of ['error', 'end', 'close', 'data']) stream.on(name, listeners.find(([key]) => key === name)[1])
    timer = setTimeout(() => retire(Error('Readable observation pending-close deadline exceeded')), deadlineMs)
    if (closed) clearTimeout(timer)
  } catch (error) {
    retire(error)
  }
  return Object.freeze({
    completion, failure,
    snapshot() { return { ...record.snapshot(), ended, closed, retired, detached, teardownRequired } },
    disposeAfterClose() {
      if (!closed) throw Error('Cannot detach before owned stream close')
      if (detached) return
      for (const [name, listener] of listeners) stream.off(name, listener)
      detached = true
    },
  })
}
