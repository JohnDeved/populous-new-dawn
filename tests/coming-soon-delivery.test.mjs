import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { stripTypeScriptTypes } from 'node:module'

const source = readFileSync(new URL('../worker/coming-soon.ts', import.meta.url), 'utf8')
const { serveComingSoon } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`)
const tick = () => new Promise(resolve => setImmediate(resolve))
const hash = text => createHash('sha256').update(text).digest('hex')

// Actual route with Node streams and supplied ASSETS/FixedLengthStream boundaries.
// This tests byte/range/control flow, not Cloudflare's HTTP headers, CPU or memory.
function fixture(options = {}) {
  const parts = options.parts ?? ['abcdefgh', 'ijklmnop', 'qrstuvwx', 'yz012345']
  const full = parts.join(''), sha256 = hash(full)
  const manifest = { bytes: full.length, sha256, parts: parts.map((part, index) => ({
    path: `/original/coming-soon/trailer-${sha256}-${String(index).padStart(2, '0')}.bin`,
    bytes: part.length, sha256: hash(part),
  })) }
  const pending = [], lengths = [], requests = [], bodies = [], metrics = { reads: 0, bytes: 0, active: 0, maxActive: 0, cancelled: 0 }
  const fixedStream = length => {
    lengths.push(length)
    let bytes = 0
    return new TransformStream({
      transform(value, controller) {
        bytes += value.byteLength
        if (bytes > length) throw new Error('Fixed stream overflow')
        controller.enqueue(value)
      },
      flush() { if (bytes !== length) throw new Error('Fixed stream underflow') },
    })
  }
  const assets = { async fetch(request) {
    requests.push(request)
    const index = manifest.parts.findIndex(part => part.path === new URL(request.url).pathname)
    assert.ok(index >= 0, 'only generated part paths are requested')
    assert.equal(request.method, 'GET')
    assert.equal([...request.headers].length, 0, 'client Range, auth and cookies are not forwarded')
    if (options.pendingFetch) {
      await new Promise((resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true })
      })
    }
    const bytes = new TextEncoder().encode(options.truncated === index ? parts[index].slice(0, -1) :
      options.overflow === index ? parts[index] + 'X' : parts[index])
    let at = 0, active = true, emptyTail = options.emptyTail === index
    metrics.active++
    metrics.maxActive = Math.max(metrics.maxActive, metrics.active)
    const finish = () => { if (active) { active = false; metrics.active-- } }
    const body = new ReadableStream({
      async pull(controller) {
        metrics.reads++
        if (options.onRead) await options.onRead({ index, at, request })
        if (!active) return
        if (at === bytes.length) {
          if (emptyTail) { emptyTail = false; controller.enqueue(new Uint8Array()); return }
          finish()
          if (options.lateError === index) controller.error(new Error('late part error'))
          else controller.close()
          return
        }
        const end = Math.min(at + (options.chunkSize ?? 2), bytes.length)
        const chunk = bytes.slice(at, end)
        metrics.bytes += chunk.byteLength
        at = end
        controller.enqueue(chunk)
      },
      async cancel() {
        metrics.cancelled++
        finish()
        if (options.onCancel) await options.onCancel(request)
      },
    }, { highWaterMark: 0 })
    bodies.push(body)
    return new Response(body, { status: options.missing === index ? 404 : 200,
      headers: { 'Content-Length': String(manifest.parts[index].bytes + (options.badSize === index ? 1 : 0)) } })
  } }
  const context = { waitUntil(promise) { pending.push(promise) } }
  const request = (headers = {}, method = 'GET', signal) => new Request('https://example.test/original/coming-soon/trailer.webm?ignored=1', { method, headers, signal })
  const serve = (headers, method, signal) => serveComingSoon(request(headers, method, signal), assets, context, manifest, fixedStream)
  return { serve, request, assets, context, manifest, fixedStream, full, lengths, requests, bodies, metrics,
    async settled() { await Promise.all(pending) } }
}

test('GET streams the exact ordered byte representation with one active part', async () => {
  const f = fixture(), response = f.serve()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Content-Type'), 'video/webm')
  assert.equal(response.headers.get('Content-Length'), String(f.full.length))
  assert.equal(response.headers.get('Accept-Ranges'), 'bytes')
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate')
  assert.equal(await response.text(), f.full)
  await f.settled()
  assert.deepEqual(f.lengths, [f.full.length])
  assert.equal(f.requests.length, 4)
  assert.equal(f.metrics.maxActive, 1)
  assert.equal(f.metrics.active, 0)
})

test('HEAD ignores Range and creates no body, asset fetch, fixed stream or background task', async () => {
  const f = fixture(), response = f.serve({ Range: 'bytes=99999-' }, 'HEAD')
  assert.equal(response.status, 200)
  assert.equal(response.body, null)
  assert.equal(response.headers.get('Content-Length'), String(f.full.length))
  assert.equal(response.headers.has('Content-Range'), false)
  assert.equal(f.requests.length + f.lengths.length, 0)
  await f.settled()
})

test('single ranges cover first, middle, cross-part, suffix, open and clipped end bytes', async () => {
  for (const [range, start, end] of [
    ['bytes=0-0', 0, 0], ['bytes=3-5', 3, 5], ['bytes=7-10', 7, 10],
    ['bytes=31-', 31, 31], ['bytes=-3', 29, 31], ['bytes=30-999', 30, 31],
    ['bytes=-999', 0, 31], ['bytes=8-', 8, 31],
    ['bytes=-9007199254740993', 0, 31], ['bytes=31-9007199254740993', 31, 31],
  ]) {
    const f = fixture(), response = f.serve({ Range: range })
    assert.equal(response.status, 206, range)
    assert.equal(response.headers.get('Content-Range'), `bytes ${start}-${end}/32`)
    assert.equal(await response.text(), f.full.slice(start, end + 1))
    await f.settled()
    assert.deepEqual(f.lengths, [end - start + 1])
    assert.equal(f.metrics.active, 0)
  }
})

test('unsatisfiable ranges return 416 and never fetch data', () => {
  for (const range of ['bytes=32-', 'bytes=8-7', 'bytes=-0', 'bytes=999999999999999999999999999-']) {
    const f = fixture(), response = f.serve({ Range: range })
    assert.equal(response.status, 416)
    assert.equal(response.headers.get('Content-Range'), 'bytes */32')
    assert.equal(response.body, null)
    assert.equal(f.requests.length + f.lengths.length, 0)
  }
})

test('unsupported, malformed and multiple ranges deliberately fall back to full 200', async () => {
  for (const range of ['items=1-3', 'bytes=1-2,5-7', 'bytes=-', 'bytes=hello', 'bytes=1.5-7']) {
    const f = fixture(), response = f.serve({ Range: range })
    assert.equal(response.status, 200)
    assert.equal(await response.text(), f.full)
    await f.settled()
  }
})

test('only an exact strong If-Range permits partial delivery', async () => {
  for (const validator of ['correct', '"older"', 'weak', 'Wed, 01 Jan 2025 00:00:00 GMT']) {
    const f = fixture(), etag = `"sha256-${f.manifest.sha256}"`
    const ifRange = validator === 'correct' ? etag : validator === 'weak' ? `W/${etag}` : validator
    const response = f.serve({ Range: 'bytes=0-0', 'If-Range': ifRange })
    assert.equal(response.status, validator === 'correct' ? 206 : 200)
    assert.equal(await response.text(), validator === 'correct' ? 'a' : f.full)
    await f.settled()
  }
})

test('If-None-Match has priority over Range and uses weak GET/HEAD comparison', () => {
  for (const method of ['GET', 'HEAD']) for (const form of ['strong', 'weak', 'list', 'star']) {
    const f = fixture(), tag = `"sha256-${f.manifest.sha256}"`
    const value = form === 'strong' ? tag : form === 'weak' ? `W/${tag}` : form === 'list' ? `"old", ${tag}` : '*'
    const response = f.serve({ 'If-None-Match': value, Range: 'bytes=999-' }, method)
    assert.equal(response.status, 304)
    assert.equal(response.body, null)
    assert.equal(f.requests.length + f.lengths.length, 0)
  }
})

test('other methods cannot start media work', () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const f = fixture(), response = f.serve({}, method)
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('Allow'), 'GET, HEAD')
    assert.equal(f.requests.length + f.lengths.length, 0)
  }
})

test('downstream backpressure prevents reading the complete asset or fetching another part', async () => {
  const f = fixture(), response = f.serve()
  await tick()
  assert.ok(f.metrics.bytes <= 4, `read-ahead bytes: ${f.metrics.bytes}`)
  assert.ok(f.requests.length <= 1)
  await response.body.cancel('consumer stopped')
  await f.settled()
  assert.equal(f.metrics.active, 0)
  assert.equal(f.requests.length, 1)
})

test('cancellation during a pending asset fetch aborts the request and starts no next part', async () => {
  const f = fixture({ pendingFetch: true }), response = f.serve()
  await tick()
  assert.equal(f.requests.length, 1)
  await response.body.cancel('stop pending fetch')
  await f.settled()
  assert.equal(f.requests[0].signal.aborted, true)
  assert.equal(f.requests.length, 1)
})

test('incoming abort cancels current work and errors the response stream', async () => {
  const f = fixture({ pendingFetch: true }), abort = new AbortController()
  const response = f.serve({}, 'GET', abort.signal)
  await tick()
  abort.abort(new Error('request disconnected'))
  await assert.rejects(response.text(), /request disconnected/)
  await f.settled()
  assert.equal(f.requests[0].signal.aborted, true)
})

test('upstream is aborted before a delayed cancel algorithm waits for that signal', async () => {
  let cancelled = false
  const f = fixture({ async onCancel(request) {
    cancelled = true
    assert.equal(request.signal.aborted, true)
    await tick()
  } })
  const response = f.serve()
  await tick()
  await response.body.cancel('consumer done')
  await f.settled()
  assert.equal(cancelled, true)
  assert.ok(f.bodies.every(body => !body.locked))
  assert.equal(f.metrics.active, 0)
})

test('a rejecting upstream cancel still releases the owned reader and settles the pipeline', async () => {
  const f = fixture({ onCancel() { throw new Error('cancel failed') } })
  const response = f.serve()
  await tick()
  await response.body.cancel('consumer done')
  await f.settled()
  assert.ok(f.bodies.every(body => !body.locked))
  assert.equal(f.metrics.active, 0)
})

test('expected upstream abort rejection does not corrupt a fully delivered range', async () => {
  const f = fixture({ onCancel(request) { throw request.signal.reason } })
  const response = f.serve({ Range: 'bytes=0-0' })
  assert.equal(await response.text(), 'a')
  await f.settled()
  assert.ok(f.bodies.every(body => !body.locked))
})

test('already-aborted requests fetch no parts', async () => {
  const f = fixture(), abort = new AbortController()
  abort.abort(new Error('already stopped'))
  const response = f.serve({}, 'GET', abort.signal)
  await assert.rejects(response.text(), /already stopped/)
  await f.settled()
  assert.equal(f.requests.length, 0)
})

test('missing, wrong-sized and truncated parts fail the stream without a false complete body', async () => {
  for (const options of [{ missing: 0 }, { missing: 2 }, { badSize: 0 }, { truncated: 1 }]) {
    const f = fixture(options), response = f.serve()
    await assert.rejects(response.text(), /Trailer part/)
    await f.settled()
    assert.equal(f.metrics.active, 0)
    assert.ok(f.requests.length <= 3)
  }
})

test('invalid responses abort before delayed or rejecting body cancellation and retain the validation error', async () => {
  for (const invalid of [{ missing: 0 }, { badSize: 0 }]) for (const reject of [false, true]) {
    let cancelled = false
    const f = fixture({ ...invalid, async onCancel(request) {
      cancelled = true
      assert.equal(request.signal.aborted, true)
      await tick()
      if (reject) throw new Error('secondary cancellation failure')
    } })
    await assert.rejects(f.serve().text(), /^Error: Trailer part is unavailable or has an unexpected size$/)
    await f.settled()
    assert.equal(cancelled, true)
    assert.equal(f.requests.length, 1)
    assert.equal(f.metrics.active, 0)
    assert.ok(f.bodies.every(body => !body.locked))
  }
})

test('tiny tail range measures the real discard cost without buffering or reading other parts', async () => {
  const f = fixture({ parts: ['a'.repeat(1024), 'b'.repeat(1024)], chunkSize: 64 })
  const response = f.serve({ Range: 'bytes=1023-1023' })
  assert.equal(await response.text(), 'a')
  await f.settled()
  assert.equal(f.metrics.bytes, 1024, 'one output byte requires the whole first-part prefix')
  assert.equal(f.requests.length, 1)
  assert.deepEqual(f.lengths, [1])
})

test('abort during prefix discard cancels that reader before fetching a later part', async () => {
  const abort = new AbortController()
  const f = fixture({ parts: ['a'.repeat(1024), 'b'.repeat(1024)], chunkSize: 64,
    onRead({ at }) { if (at >= 128) abort.abort(new Error('stop discarding')) },
  })
  const response = f.serve({ Range: 'bytes=1023-1023' }, 'GET', abort.signal)
  await assert.rejects(response.text(), /stop discarding/)
  await f.settled()
  assert.ok(f.metrics.bytes <= 128)
  assert.equal(f.requests.length, 1)
  assert.equal(f.metrics.active, 0)
})

test('concurrent full/range requests own independent readers and validators', async () => {
  const f = fixture()
  const a = f.serve({ Range: 'bytes=0-3' }), b = f.serve({ Range: 'bytes=20-23' }), c = f.serve()
  assert.deepEqual(await Promise.all([a.text(), b.text(), c.text()]), ['abcd', 'uvwx', f.full])
  await f.settled()
  assert.equal(f.metrics.active, 0)
})

test('invalid importer manifests fail before any upstream URL can be requested', () => {
  for (const mutate of [
    m => { m.bytes++ }, m => { m.sha256 = 'bad' },
    m => { m.parts[0].path = 'https://other.example/private' },
    m => { m.parts[0].bytes = 25 * 1024 * 1024 },
  ]) {
    const f = fixture()
    mutate(f.manifest)
    assert.throws(() => serveComingSoon(f.request(), f.assets, f.context, f.manifest, f.fixedStream), /Invalid Coming Soon/)
    assert.equal(f.requests.length, 0)
  }
})

test('full GET rejects final-part surplus regardless of chunk boundaries', async () => {
  for (const chunkSize of [2, 8, 9]) {
    const f = fixture({ overflow: 3, chunkSize })
    await assert.rejects(f.serve().text(), /Trailer part exceeds its declared size/)
    await f.settled()
    assert.equal(f.metrics.active, 0)
    assert.ok(f.bodies.every(body => !body.locked))
  }
})

test('part-boundary ranges validate EOF before completing the response', async () => {
  for (const [range, overflow] of [
    ['bytes=0-7', 0], ['bytes=4-15', 1], ['bytes=-8', 3], ['bytes=31-', 3],
  ]) {
    const f = fixture({ overflow, chunkSize: 8 })
    await assert.rejects(f.serve({ Range: range }).text(), /Trailer part exceeds its declared size/, range)
    await f.settled()
    assert.equal(f.metrics.active, 0)
    assert.ok(f.bodies.every(body => !body.locked))
  }
})

test('interior ranges cancel without consuming an unrequested tail', async () => {
  for (const chunkSize of [2, 8]) {
    const f = fixture({ overflow: 0, chunkSize })
    assert.equal(await f.serve({ Range: 'bytes=0-0' }).text(), 'a')
    await f.settled()
    assert.equal(f.metrics.reads, 1)
    assert.equal(f.metrics.cancelled, 1)
    assert.equal(f.metrics.active, 0)
  }
})

test('empty final chunks are accepted but a late source error rejects completion', async () => {
  const exact = fixture({ emptyTail: 3 })
  assert.equal(await exact.serve().text(), exact.full)
  await exact.settled()
  assert.equal(exact.metrics.active, 0)
  const failed = fixture({ lateError: 3 })
  await assert.rejects(failed.serve().text(), /late part error/)
  await failed.settled()
  assert.equal(failed.metrics.active, 0)
  assert.ok(failed.bodies.every(body => !body.locked))
})

test('incoming abort cancels a pending terminal EOF read without reporting completion', async () => {
  let entered
  const reached = new Promise(resolve => { entered = resolve })
  const abort = new AbortController()
  const f = fixture({ parts: ['abcdefgh'], chunkSize: 8,
    onRead({ at, request }) {
      if (at !== 8) return
      entered()
      return new Promise((resolve, reject) => {
        if (request.signal.aborted) reject(request.signal.reason)
        else request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true })
      })
    },
  })
  const response = f.serve({}, 'GET', abort.signal)
  const rejected = assert.rejects(response.text(), /stop terminal read/)
  await reached
  abort.abort(new Error('stop terminal read'))
  await rejected
  await f.settled()
  assert.equal(f.metrics.active, 0)
  assert.equal(f.requests.length, 1)
  assert.equal(f.requests[0].signal.aborted, true)
  assert.ok(f.bodies.every(body => !body.locked))
})

test('Node downstream cancellation releases a pending terminal EOF read', async () => {
  let entered
  const reached = new Promise(resolve => { entered = resolve })
  const f = fixture({ parts: ['abcdefgh'], chunkSize: 8,
    onRead({ at, request }) {
      if (at !== 8) return
      entered()
      return new Promise((resolve, reject) => {
        if (request.signal.aborted) reject(request.signal.reason)
        else request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true })
      })
    },
  })
  const response = f.serve()
  const reader = response.body.getReader()
  const reading = reader.read()
  await reached
  await reader.cancel('consumer stopped before EOF')
  assert.deepEqual(await reading, { done: true, value: undefined })
  reader.releaseLock()
  await f.settled()
  assert.equal(f.metrics.active, 0)
  assert.equal(f.requests[0].signal.aborted, true)
  assert.ok(f.bodies.every(body => !body.locked))
})

for (const [label, cleanupError] of [
  ['undefined', undefined], ['null', null], ['false', false], ['zero', 0],
  ['NaN', NaN], ['empty string', ''], ['Error', new Error('secondary cancel failed')],
]) for (const range of [undefined, 'bytes=0-3']) {
  test(`part-integrity failure retains ${label} cleanup rejection (${range ?? 'full GET'})`, async () => {
    const f = fixture({ parts: ['abcd'], overflow: 0, chunkSize: 5,
      onCancel() { throw cleanupError },
    })
    await assert.rejects(f.serve(range ? { Range: range } : {}).text(), error => {
      assert.ok(error instanceof AggregateError)
      assert.equal(error.errors.length, 2)
      assert.equal(error.errors[0].message, 'Trailer part exceeds its declared size')
      assert.ok(Object.is(error.errors[1], cleanupError))
      return true
    })
    await f.settled()
    assert.equal(f.requests.length, 1)
    assert.equal(f.requests[0].signal.aborted, true)
    assert.equal(f.metrics.active, 0)
    assert.ok(f.bodies.every(body => !body.locked))
  })
}

test('unexpected cleanup failure after an otherwise valid interior range stays fatal', async () => {
  const cleanupError = new Error('valid-range cancel failed')
  const f = fixture({ onCancel() { throw cleanupError } })
  await assert.rejects(f.serve({ Range: 'bytes=0-0' }).text(), error => error === cleanupError)
  await f.settled()
  assert.equal(f.metrics.active, 0)
  assert.ok(f.bodies.every(body => !body.locked))
})
