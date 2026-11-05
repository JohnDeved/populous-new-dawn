import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
export function verifiedImage(bytes, expectedBlob) {
  assert.match(expectedBlob, /^[a-f0-9]{40}$/)
  assert.ok(Buffer.isBuffer(bytes) && bytes.length > 8 && bytes.length <= 2 * 1024 * 1024)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  const gitBlob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
  assert.equal(gitBlob, expectedBlob, 'Held sky response differs from the exact candidate asset')
  return { bytes: bytes.length, gitBlob, sha256: createHash('sha256').update(bytes).digest('hex') }
}

// Registered before navigation, on an exact same-origin path. No cache mutation,
// substitute pixels, arbitrary URLs or authentication/session data are retained.
export async function holdSkyResponse(page, url, expectedBlob) {
  const target = new URL('/original/sky.png', url).href
  let release, closed = false, released = false, seen = 0
  const waiting = new Promise(resolve => { release = resolve }), pending = new Set()
  const record = { url: target, requests: 0, status: 'waiting', failure: null }
  const handler = route => {
    const task = (async () => {
      try {
        assert.ok(!closed && ++seen === 1, 'Expected exactly one owned sky request')
        record.requests = seen
        const response = await route.fetch({ timeout: 5000, maxRedirects: 0 })
        assert.equal(response.status(), 200); assert.equal(response.url(), target)
        const bytes = await response.body()
        record.image = verifiedImage(bytes, expectedBlob); record.status = 'held'
        await waiting
        if (closed) { await route.abort(); record.status = 'cancelled'; return }
        await route.fulfill({ response, body: bytes }); record.status = 'fulfilled'
      } catch (error) {
        record.failure = String(error); record.status = 'failed'
        try { await route.abort() } catch { /* Preserve the original route failure after best-effort abort. */ }
      }
    })()
    pending.add(task); return task.finally(() => pending.delete(task))
  }
  await page.route(target, handler)
  return { record, release() {
    assert.ok(!closed && !released && record.status === 'held', 'Sky is not held or was already released')
    released = true; release()
  }, async close() {
    closed = true; release()
    await page.unroute(target, handler)
    await Promise.allSettled([...pending])
    return { closed: true, pending: pending.size, failure: record.failure }
  } }
}
