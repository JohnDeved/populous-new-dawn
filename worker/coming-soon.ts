interface MoviePart {
  path: string
  bytes: number
  sha256: string
}

export interface ComingSoonMedia {
  bytes: number
  sha256: string
  parts: MoviePart[]
}

interface Assets {
  fetch(request: Request): Promise<Response>
}

interface Lifetime {
  waitUntil(promise: Promise<unknown>): void
}

type FixedStream = {
  readable: ReadableStream<Uint8Array>
  writable: WritableStream<Uint8Array>
}

// Unsupported units, malformed syntax and multiple ranges fall back to 200.
// A syntactically valid but unsatisfiable single byte range returns 416.
function byteRange(value: string | null, bytes: number) {
  const match = value?.match(/^bytes=(\d*)-(\d*)$/)
  if (!match || (!match[1] && !match[2])) return null
  const size = BigInt(bytes)
  if (!match[1]) {
    const suffix = BigInt(match[2])
    if (!suffix) return false
    return { start: Number(suffix >= size ? 0n : size - suffix), end: bytes - 1 }
  }
  const start = BigInt(match[1])
  const end = match[2] ? BigInt(match[2]) : size - 1n
  if (start >= size || start > end) return false
  return { start: Number(start), end: Number(end >= size ? size - 1n : end) }
}

function validManifest(media: ComingSoonMedia) {
  return (
    Number.isSafeInteger(media.bytes) &&
    media.bytes > 0 &&
    /^[a-f0-9]{64}$/.test(media.sha256) &&
    media.parts.length > 0 &&
    media.parts.length <= 4 &&
    media.parts.every(
      (part, index) =>
        part.path ===
          `/original/coming-soon/trailer-${media.sha256}-${String(index).padStart(2, '0')}.bin` &&
        /^[a-f0-9]{64}$/.test(part.sha256) &&
        Number.isSafeInteger(part.bytes) &&
        part.bytes > 0 &&
        part.bytes <= 20 * 1024 * 1024
    ) &&
    media.parts.reduce((total, part) => total + part.bytes, 0) === media.bytes
  )
}

// The manifest and byte parts are importer-owned. This route never accepts an
// upstream path/URL from the client and never buffers the complete movie/part.
export function serveComingSoon(
  request: Request,
  assets: Assets,
  context: Lifetime,
  media: ComingSoonMedia,
  fixedStream: (length: number) => FixedStream = length => new FixedLengthStream(length)
): Response {
  if (!validManifest(media)) throw new Error('Invalid Coming Soon media manifest')
  if (request.method !== 'GET' && request.method !== 'HEAD')
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })

  const etag = `"sha256-${media.sha256}"`
  const headers = new Headers({
    'Content-Type': 'video/webm',
    'Accept-Ranges': 'bytes',
    ETag: etag,
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  })
  const cached = request.headers.get('If-None-Match')?.split(',').some(value => {
    const candidate = value.trim()
    return candidate === '*' || candidate === etag || candidate === `W/${etag}`
  })
  if (cached) return new Response(null, { status: 304, headers })

  // Only the exact strong validator permits a range; dates and weak validators
  // deliberately fall back to the whole current representation.
  const ifRange = request.headers.get('If-Range')
  const range =
    request.method === 'HEAD' || (ifRange !== null && ifRange !== etag)
      ? null
      : byteRange(request.headers.get('Range'), media.bytes)
  if (range === false) {
    headers.set('Content-Range', `bytes */${media.bytes}`)
    return new Response(null, { status: 416, headers })
  }
  const start = range?.start ?? 0
  const end = range?.end ?? media.bytes - 1
  const length = end - start + 1
  headers.set('Content-Length', String(length))
  if (range) headers.set('Content-Range', `bytes ${start}-${end}/${media.bytes}`)
  if (request.method === 'HEAD') {
    // HEAD has no source stream to pump or owned asynchronous work. workerd's
    // HTTP implementation has a HEAD exception for caller-supplied length;
    // validate actual HTTP/2 and HTTP/3 headers before shipping this route.
    return new Response(null, { headers })
  }
  const output = fixedStream(length)

  const abort = new AbortController()
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  let controller: ReadableStreamDefaultController<Uint8Array>
  let finished = false
  let index = 0
  let offset = 0
  let consumed = 0
  let remaining = length
  while (offset + media.parts[index].bytes <= start) offset += media.parts[index++].bytes
  let skip = start - offset

  async function dispose(reason?: unknown) {
    if (finished) return
    finished = true
    request.signal.removeEventListener('abort', interrupted)
    const ownedReader = reader
    reader = undefined
    // The upstream cancellation algorithm may itself wait for this signal.
    // Abort first, then settle cancellation and always release our reader lock.
    abort.abort(reason)
    try {
      await ownedReader?.cancel(reason)
    } catch (error) {
      if (error !== abort.signal.reason) throw error
    } finally {
      ownedReader?.releaseLock()
    }
  }
  function interrupted() {
    const reason = request.signal.reason ?? new Error('Trailer request aborted')
    controller.error(reason)
    context.waitUntil(dispose(reason))
  }

  const input = new ReadableStream<Uint8Array>(
    {
      start(value) {
        controller = value
        request.signal.addEventListener('abort', interrupted, { once: true })
        if (request.signal.aborted) interrupted()
      },
      async pull(target) {
        try {
          while (!finished) {
            const part = media.parts[index]
            if (!part) throw new Error('Trailer parts ended before the requested range')
            if (!reader) {
              const response = await assets.fetch(
                new Request(new URL(part.path, request.url), { signal: abort.signal })
              )
              if (finished) {
                await response.body?.cancel(abort.signal.reason)
                return
              }
              if (
                response.status !== 200 ||
                !response.body ||
                response.headers.get('Content-Length') !== String(part.bytes)
              ) {
                const error = new Error('Trailer part is unavailable or has an unexpected size')
                // This body has no owned reader yet. Its cancellation can still
                // wait for the fetch signal, or reject; retain the validation error.
                abort.abort(error)
                await response.body?.cancel(error).catch(() => undefined)
                throw error
              }
              reader = response.body.getReader()
              consumed = 0
            }
            const result = await reader.read()
            if (finished) return
            if (result.done) {
              if (consumed !== part.bytes) throw new Error('Trailer part is truncated')
              reader.releaseLock()
              reader = undefined
              index++
              continue
            }
            consumed += result.value.byteLength
            if (consumed > part.bytes) throw new Error('Trailer part exceeds its declared size')
            if (skip >= result.value.byteLength) {
              skip -= result.value.byteLength
              continue
            }
            const chunk = result.value.subarray(skip, skip + remaining)
            skip = 0
            remaining -= chunk.byteLength
            target.enqueue(chunk)
            if (!remaining) {
              await dispose()
              target.close()
            }
            return
          }
        } catch (error) {
          await dispose(error)
          target.error(error)
        }
      },
      cancel: dispose,
    },
    { highWaterMark: 0 }
  )
  // pipeTo propagates output cancellation to input.cancel. FixedLengthStream
  // supplies real platform length and errors if too few/many bytes are written.
  context.waitUntil(input.pipeTo(output.writable).catch(() => undefined))
  return new Response(output.readable, { status: range ? 206 : 200, headers })
}
