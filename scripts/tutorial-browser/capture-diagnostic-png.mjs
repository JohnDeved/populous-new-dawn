import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'

const crc32 = bytes => {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
// Bounded independent decoder. Unsupported PNG encodings fail closed; no
// browser image decoding, extra canvas draw, or replacement capture is used.
export function inspectCapturePng(bytes, { width, height, rawPixelSha256, readbackColorSpace }) {
  assert.equal(readbackColorSpace, 'srgb', 'PNG path requires authenticated sRGB readback')
  assert.ok(Buffer.isBuffer(bytes) && bytes.length <= 1048576)
  assert.ok(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
  assert.ok(Number.isInteger(width) && width > 0 && width <= 256 && Number.isInteger(height) && height > 0 && height <= 256)
  let at = 8, header = false, end = false, srgb = false
  const compressed = []
  while (at < bytes.length) {
    assert.ok(at + 12 <= bytes.length)
    const length = bytes.readUInt32BE(at), type = bytes.subarray(at + 4, at + 8)
    assert.ok(type.every(byte => byte >= 65 && byte <= 90 || byte >= 97 && byte <= 122), 'PNG type must use ASCII letters')
    assert.ok(type[2] >= 65 && type[2] <= 90, 'PNG reserved type bit must be zero')
    const kind = type.toString('ascii')
    assert.ok(length <= 1048576 && at + 12 + length <= bytes.length)
    const data = bytes.subarray(at + 8, at + 8 + length)
    assert.equal(crc32(bytes.subarray(at + 4, at + 8 + length)), bytes.readUInt32BE(at + 8 + length))
    assert.ok(header || kind === 'IHDR')
    if (kind === 'IHDR') {
      assert.equal(header, false); assert.equal(length, 13)
      assert.equal(data.readUInt32BE(0), width); assert.equal(data.readUInt32BE(4), height)
      assert.deepEqual([...data.subarray(8)], [8, 6, 0, 0, 0], 'Expected noninterlaced RGBA8 PNG')
      header = true
    } else if (kind === 'IDAT') {
      compressed.push(data)
    } else if (kind === 'IEND') {
      assert.equal(length, 0); assert.ok(compressed.length); end = true
    } else if (kind === 'sRGB') {
      assert.equal(srgb, false, 'Duplicate sRGB declaration')
      assert.equal(compressed.length, 0, 'sRGB must precede image data')
      assert.equal(length, 1, 'Invalid sRGB declaration length')
      assert.ok(data[0] <= 3, 'Invalid sRGB rendering intent')
      srgb = true
    } else {
      // Narrow RGBA8/sRGB contract. No arbitrary ICC, gamma, chromaticity,
      // text or other ancillary interpretation is accepted or ignored.
      assert.fail(`Unsupported PNG chunk: ${kind}`)
    }
    at += length + 12
    if (end) break
  }
  assert.ok(end && at === bytes.length)
  const stride = width * 4, expected = height * (stride + 1)
  const raw = inflateSync(Buffer.concat(compressed), { maxOutputLength: expected })
  assert.equal(raw.length, expected)
  const rgba = Buffer.alloc(width * height * 4)
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    assert.ok(filter <= 4)
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x, a = x >= 4 ? rgba[index - 4] : 0,
        b = y ? rgba[index - stride] : 0, c = y && x >= 4 ? rgba[index - stride - 4] : 0
      const prediction = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter]
      rgba[index] = (raw[y * (stride + 1) + x + 1] + prediction) & 255
    }
  }
  const digest = createHash('sha256').update(rgba).digest('hex')
  assert.equal(digest, rawPixelSha256, 'Decoded PNG must match the same retained raw RGBA bytes')
  const colors = new Set()
  for (let i = 0; i < rgba.length; i += 4)
    if (rgba[i + 3]) colors.add((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2])
  assert.ok(colors.size > 1, 'PNG must be nonblank')
  return { width, height, rawPixelSha256: digest, opaqueColors: colors.size, decoded: true }
}
