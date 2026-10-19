import assert from 'node:assert/strict'
import { gunzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'

// Self-contained browser function. Existing state/initialState codec graphs and
// pixel base64 are carried verbatim. Small outer metadata also uses that codec,
// preserving undefined/nonfinite/-0 rather than JSON-flattening those fields.
export async function packObservation(observation, codec) {
  const started = performance.now()
  if (typeof CompressionStream !== 'function') throw Error('Native gzip unavailable')
  const metadata = {},
    encoded = []
  for (const key of Object.keys(observation)) {
    if (key === 'state' || key === 'initialState' || key === 'pixels')
      encoded.push([key, observation[key]])
    else metadata[key] = observation[key]
  }
  const text = JSON.stringify({ metadata: codec(metadata), encoded })
  const raw = new TextEncoder().encode(text)
  if (raw.length > 64 * 1024 * 1024) throw Error('Observation transport exceeds bound')
  const encodedAt = performance.now()
  const compressed = new Uint8Array(
    await new Response(
      new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))
    ).arrayBuffer()
  )
  const compressedAt = performance.now()
  let binary = ''
  for (let i = 0; i < compressed.length; i += 32768)
    binary += String.fromCharCode(...compressed.subarray(i, i + 32768))
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', raw)), x =>
    x.toString(16).padStart(2, '0')
  ).join('')
  return {
    version: 1,
    rawBytes: raw.length,
    compressedBytes: compressed.length,
    sha256: digest,
    gzip: btoa(binary),
    phases: {
      encodeMs: encodedAt - started,
      gzipMs: compressedAt - encodedAt,
      packTotalMs: performance.now() - started,
    },
  }
}

export function unpackObservation(envelope, codec) {
  assert.equal(envelope.version, 1)
  assert.ok(
    Number.isSafeInteger(envelope.rawBytes) &&
      envelope.rawBytes > 0 &&
      envelope.rawBytes <= 64 * 1024 * 1024
  )
  assert.ok(typeof envelope.gzip === 'string' && envelope.gzip.length <= 96 * 1024 * 1024)
  const compressed = Buffer.from(envelope.gzip, 'base64')
  assert.equal(compressed.toString('base64'), envelope.gzip, 'Noncanonical base64')
  assert.equal(compressed.length, envelope.compressedBytes)
  const raw = gunzipSync(compressed, { maxOutputLength: 64 * 1024 * 1024 })
  assert.equal(raw.length, envelope.rawBytes)
  assert.equal(createHash('sha256').update(raw).digest('hex'), envelope.sha256)
  const parsed = JSON.parse(raw.toString('utf8'))
  assert.equal(JSON.stringify(parsed), raw.toString('utf8'), 'Transport text changed')
  const result = codec(parsed.metadata, true)
  assert.ok(result && !Array.isArray(result) && Array.isArray(parsed.encoded))
  const seen = new Set()
  for (const [key, value] of parsed.encoded) {
    assert.ok(
      ['state', 'initialState', 'pixels'].includes(key) &&
        !seen.has(key) &&
        !Object.hasOwn(result, key)
    )
    seen.add(key)
    result[key] = value
  }
  for (const value of Object.values(envelope.phases))
    assert.ok(Number.isFinite(value) && value >= 0)
  return result
}
