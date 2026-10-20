import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { crc32, deflateSync } from 'node:zlib'
import { compactPngChunks } from '../scripts/tutorial-browser/compact-png.mjs'
import { validateAngelPng, angelAttributeChecksum } from '../scripts/integration-queue/spell-visuals-render-evidence.mjs'
const signature = Buffer.from('89504e470d0a1a0a', 'hex')
const hash = b => createHash('sha256').update(b).digest('hex')
function chunk(type, data = Buffer.alloc(0)) {
  const b = Buffer.alloc(data.length + 12)
  b.writeUInt32BE(data.length); b.write(type, 4); data.copy(b, 8)
  b.writeUInt32BE(crc32(b.subarray(4, -4)), b.length - 4); return b
}
function fixture() {
  const header = Buffer.alloc(13); header.writeUInt32BE(32); header.writeUInt32BE(32, 4); header[8] = 8; header[9] = 6
  const pixels = Buffer.alloc(32 * 32 * 4), raw = Buffer.alloc(32 * (32 * 4 + 1))
  for (let i = 0; i < pixels.length; i++) pixels[i] = i % 4 === 3 ? 255 : (Math.imul(i, 12347) ^ (i >> 4)) & 255
  for (let y = 0; y < 32; y++) pixels.copy(raw, y * 129 + 1, y * 128, (y + 1) * 128)
  const packed = deflateSync(raw), ancillary = chunk('tEXt', Buffer.from('kind\0actual pixels'))
  const ids = [...packed].map(b => chunk('IDAT', Buffer.from([b])))
  return { packed, pixels, ancillary, ids, header: chunk('IHDR', header), end: chunk('IEND') }
}
test('fragmented PNG retains exact compressed bytes and decoded pixels under the unchanged reader bound', async () => {
  const f = fixture(), bytes = Buffer.concat([signature, f.header, f.ancillary, ...f.ids, f.end])
  assert.ok(f.ids.length > 128)
  await assert.rejects(() => validateAngelPng(bytes, 32, 32))
  const result = compactPngChunks(bytes), decoded = await validateAngelPng(result.bytes, 32, 32)
  assert.equal(decoded.pixelChecksum, angelAttributeChecksum(f.pixels))
  assert.deepEqual(result.bytes, Buffer.concat([signature, f.header, f.ancillary, chunk('IDAT', f.packed), f.end]))
  assert.equal(result.encoding.originalSha256, hash(bytes)); assert.equal(result.encoding.retainedSha256, hash(result.bytes))
  assert.equal(result.encoding.compressedStreamSha256, hash(f.packed)); assert.equal(result.encoding.retainedChunks, 4)
  assert.deepEqual(compactPngChunks(result.bytes).bytes, result.bytes)
})
test('consolidation rejects corrupt or illegally ordered input instead of laundering it', () => {
  const f = fixture(), valid = Buffer.concat([signature, f.header, ...f.ids, f.end])
  const corrupt = Buffer.from(valid); corrupt[corrupt.length - 1] ^= 1
  for (const bytes of [corrupt, valid.subarray(0, -1), Buffer.concat([valid, Buffer.from([0])]),
    Buffer.concat([signature, f.header, f.ids[0], f.ancillary, ...f.ids.slice(1), f.end]),
    Buffer.concat([signature, f.header, f.header, ...f.ids, f.end]),
    Buffer.concat([signature, f.header, chunk('BAD!'), ...f.ids, f.end]),
    Buffer.concat([signature, f.header, f.ancillary, f.end])]) assert.throws(() => compactPngChunks(bytes))
})
