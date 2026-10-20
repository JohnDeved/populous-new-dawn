import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { crc32 } from 'node:zlib'

// Change PNG framing only. The ordered compressed IDAT payload and every other
// chunk remain byte-identical; no image decode, filtering or recompression.
export function compactPngChunks(bytes) {
  assert.ok(Buffer.isBuffer(bytes) && bytes.length > 64 && bytes.length <= 16 * 1024 * 1024)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  const before = [bytes.subarray(0, 8)], after = [], idat = []
  let at = 8, count = 0, phase = 'before', ended = false
  while (at < bytes.length) {
    assert.ok(++count <= 4096 && at + 12 <= bytes.length)
    const length = bytes.readUInt32BE(at), end = at + 8 + length
    assert.ok(end + 4 <= bytes.length)
    const type = bytes.toString('ascii', at + 4, at + 8)
    assert.equal(crc32(bytes.subarray(at + 4, end)), bytes.readUInt32BE(end), 'PNG CRC mismatch')
    if (at === 8) { assert.equal(type, 'IHDR'); assert.equal(length, 13) }
    else assert.notEqual(type, 'IHDR')
    if (type === 'IDAT') {
      assert.notEqual(phase, 'after', 'IDAT chunks must be consecutive')
      phase = 'idat'; idat.push(bytes.subarray(at + 8, end))
    } else {
      if (phase === 'idat') phase = 'after'
      const retainedChunks = phase === 'before' ? before : after
      retainedChunks.push(bytes.subarray(at, end + 4))
      if (type === 'IEND') {
        assert.equal(length, 0); assert.equal(end + 4, bytes.length); ended = true
      } else if (type !== 'IHDR') assert.equal(type[0], type[0].toLowerCase(), 'Unexpected critical PNG chunk')
    }
    at = end + 4
  }
  assert.ok(ended && idat.length)
  assert.ok(before.length + after.length + 1 <= 129, 'Output must fit the existing 128-chunk decoder')
  const payload = Buffer.concat(idat), chunk = Buffer.alloc(payload.length + 12)
  chunk.writeUInt32BE(payload.length); chunk.write('IDAT', 4); payload.copy(chunk, 8)
  chunk.writeUInt32BE(crc32(chunk.subarray(4, -4)), chunk.length - 4)
  const retained = Buffer.concat([...before, chunk, ...after])
  const sha = value => createHash('sha256').update(value).digest('hex')
  return { bytes: retained, encoding: { method: 'lossless-consecutive-IDAT-consolidation',
    originalSha256: sha(bytes), retainedSha256: sha(retained), compressedStreamSha256: sha(payload),
    originalChunks: count, retainedChunks: before.length + after.length } }
}
