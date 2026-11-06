import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { settleWithin } from './deadline.mjs'
export function verifiedImage(bytes, expectedBlob) {
  assert.match(expectedBlob, /^[a-f0-9]{40}$/)
  assert.ok(Buffer.isBuffer(bytes) && bytes.length > 8 && bytes.length <= 2 * 1024 * 1024)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  const gitBlob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
  assert.equal(gitBlob, expectedBlob, 'Held sky response differs from the exact candidate asset')
  return { bytes: bytes.length, gitBlob, sha256: createHash('sha256').update(bytes).digest('hex') }
}

// Own only this exact response. Terminal actions are reserved before dispatch:
// a rejected fulfillment/abort never authorizes a second terminal attempt.
export async function holdSkyResponse(page, url, expectedBlob) {
  const target = new URL('/original/sky.png', url).href
  let release, closed = false, released = false, seen = 0, closePromise
  const waiting = new Promise(resolve => { release = resolve }), pending = new Set(), routes = new WeakMap()
  const record = { url: target, requests: 0, status: 'waiting', failure: null, events: [], dropped: 0 }
  const message = error => String(error).slice(0, 512)
  const event = (kind, detail = {}) => {
    if (record.events.length < 32) record.events.push({ at: new Date().toISOString(), monotonicMs: performance.now(), kind, ...detail })
    else record.dropped++
  }
  const fail = (error, kind) => { record.failure ??= message(error); record.status = 'failed'; event(kind, { error: message(error) }) }
  const terminal = async (route, state, action, options) => {
    assert.equal(state.terminal, null, 'Owned route already has a terminal action')
    state.terminal = { action, status: 'pending' }; event('terminal-start', { request: state.request, action })
    try {
      await route[action](options); state.terminal.status = 'fulfilled'; event('terminal-complete', { request: state.request, action })
    } catch (error) {
      state.terminal.status = 'rejected'; state.terminal.error = message(error)
      try { const failure = route.request?.().failure?.()?.errorText; state.terminal.requestFailure = failure == null ? null : message(failure) }
      catch { state.terminal.requestFailure = 'unavailable' }
      event('terminal-rejected', { request: state.request, action, error: message(error), requestFailure: state.terminal.requestFailure })
      throw error
    }
  }
  const handler = route => {
    const existing = routes.get(route)
    if (existing) { fail(Error('Owned route callback repeated'), 'duplicate-route'); return existing.task }
    const state = { request: ++seen, terminal: null }; record.requests = seen
    if (seen === 1) record.owned = state
    event('request', { request: seen })
    const task = Promise.resolve().then(async () => {
      try {
        assert.ok(!closed && state.request === 1, 'Expected exactly one owned sky request')
        event('fetch-start'); const response = await route.fetch({ timeout: 5000, maxRedirects: 0 })
        assert.equal(response.status(), 200); assert.equal(response.url(), target)
        const bytes = await response.body(); record.image = verifiedImage(bytes, expectedBlob)
        record.status = record.failure ? 'failed' : 'held'; event('response-held')
        await waiting
        if (closed) {
          await terminal(route, state, 'abort'); record.status = record.failure ? 'failed' : 'cancelled'; return
        }
        await terminal(route, state, 'fulfill', { response, body: bytes }); record.status = record.failure ? 'failed' : 'fulfilled'
      } catch (error) {
        fail(error, 'request-failure')
        if (!state.terminal) {
          try { await terminal(route, state, 'abort') }
          catch (cleanupError) { event('secondary-abort-failure', { error: message(cleanupError) }) }
        }
      }
    })
    routes.set(route, { state, task }); pending.add(task)
    return task.finally(() => pending.delete(task))
  }
  await page.route(target, handler)
  return { record, release() {
    assert.ok(!closed && !released && record.status === 'held', 'Sky is not held or was already released')
    released = true; event('release'); release()
  }, close() {
    if (!closePromise) closePromise = (async () => {
      closed = true; event('close-start'); release()
      record.cleanup = {}
      try {
        event('drain-start', { pending: pending.size })
        // Both waits fit inside the caller's unchanged 1500ms cleanup step.
        record.cleanup.drain = await settleWithin(() => Promise.allSettled([...pending]), 1000)
        delete record.cleanup.drain.value
        event('drain-finish', { status: record.cleanup.drain.status, pending: pending.size })
        if (record.cleanup.drain.status !== 'fulfilled' || pending.size !== 0)
          fail(Error('Owned route drain did not complete'), 'drain-failure')
      } finally {
        // Removal is independently attempted even when the owned drain fails.
        event('unroute-start')
        record.cleanup.unroute = await settleWithin(() => page.unroute(target, handler), 250)
        event('unroute-finish', { status: record.cleanup.unroute.status })
        if (record.cleanup.unroute.status !== 'fulfilled')
          fail(Error(`Owned unroute did not complete: ${record.cleanup.unroute.error ?? record.cleanup.unroute.status}`), 'unroute-failure')
      }
      event('close-finish', { pending: pending.size })
      return { closed: true, pending: pending.size, failure: record.failure }
    })()
    return closePromise
  } }
}
