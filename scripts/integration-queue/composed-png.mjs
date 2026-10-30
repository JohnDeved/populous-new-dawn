// Data-only, single-image RGB8/RGBA8 screenshot decoder. No color-profile guessing.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
export function decodeComposedPng(bytes, { width, height, maxWidth = 1440, maxHeight = 1000 } = {}) {
  assert.ok(Buffer.isBuffer(bytes) && bytes.length > 64 && bytes.length <= 16 * 1024 * 1024, 'PNG byte bound')
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  let at = 8, w, h, channels, ended = false, count = 0
  const packed = [], metadata = new Set()
  while (at < bytes.length) {
    // Hosted Chrome screenshots have up to 445 IDAT chunks. Bound all chunks,
    // including IHDR/IEND and the three permitted metadata chunks, at 512.
    assert.ok(++count <= 512 && at + 12 <= bytes.length, 'PNG chunk bound')
    const length = bytes.readUInt32BE(at), end = at + 8 + length
    assert.ok(end + 4 <= bytes.length)
    const type = bytes.toString('latin1', at + 4, at + 8), data = bytes.subarray(at + 8, end)
    assert.match(type, /^[A-Za-z]{2}[A-Z][A-Za-z]$/)
    let crc = 0xffffffff
    for (const byte of bytes.subarray(at + 4, end)) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
    assert.equal((crc ^ 0xffffffff) >>> 0, bytes.readUInt32BE(end), 'PNG CRC')
    if (type === 'IHDR') {
      assert.equal(at, 8); assert.equal(length, 13)
      w = data.readUInt32BE(0); h = data.readUInt32BE(4)
      assert.ok(w > 0 && h > 0 && w <= maxWidth && h <= maxHeight && maxWidth <= 1440 && maxHeight <= 1000, 'PNG dimensions')
      if (width !== undefined) assert.equal(w, width)
      if (height !== undefined) assert.equal(h, height)
      assert.equal(data[8], 8); assert.ok([2, 6].includes(data[9]))
      channels = data[9] === 6 ? 4 : 3
      assert.deepEqual([...data.subarray(10)], [0, 0, 0])
    } else if (type === 'IDAT') {
      assert.ok(channels && !ended); packed.push(data)
    } else if (type === 'IEND') {
      assert.equal(length, 0); assert.ok(channels && packed.length); assert.equal(end + 4, bytes.length); ended = true
    } else {
      // Explicitly excludes APNG, tRNS, arbitrary profiles and unknown metadata.
      assert.ok(channels && packed.length === 0 && ['sRGB', 'gAMA', 'pHYs'].includes(type), 'Unsupported PNG ancillary chunk')
      assert.ok(!metadata.has(type), 'Duplicate PNG metadata'); metadata.add(type)
      if (type === 'sRGB') { assert.equal(length, 1); assert.ok(data[0] <= 3) }
      if (type === 'gAMA') { assert.equal(length, 4); assert.equal(data.readUInt32BE(0), 45455) }
      if (type === 'pHYs') {
        assert.equal(length, 9); assert.ok(data[8] <= 1 && data.readUInt32BE(0) > 0 && data.readUInt32BE(4) > 0)
      }
    }
    at = end + 4
  }
  assert.ok(ended)
  const stride = w * channels, compressed = Buffer.concat(packed), expected = h * (stride + 1)
  const inflated = inflateSync(compressed, { maxOutputLength: expected, info: true })
  assert.equal(inflated.engine.bytesWritten, compressed.length, 'PNG trailing compressed bytes')
  assert.equal(inflated.buffer.length, expected)
  const raw = inflated.buffer, decoded = new Uint8Array(h * stride), rgba = new Uint8Array(w * h * 4)
  const paeth = (a, b, c) => { const p = a + b - c, x = Math.abs(p - a), y = Math.abs(p - b), z = Math.abs(p - c); return x <= y && x <= z ? a : y <= z ? b : c }
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]; assert.ok(filter <= 4)
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, a = x >= channels ? decoded[i - channels] : 0,
        b = y ? decoded[i - stride] : 0, c = y && x >= channels ? decoded[i - stride - channels] : 0
      decoded[i] = (raw[y * (stride + 1) + 1 + x] + [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter]) & 255
    }
  }
  const colors = new Set()
  for (let p = 0; p < w * h; p++) {
    const j = p * channels, i = p * 4
    rgba.set([decoded[j], decoded[j + 1], decoded[j + 2], channels === 4 ? decoded[j + 3] : 255], i)
    if (rgba[i + 3]) colors.add((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2])
  }
  return { width: w, height: h, rgba, opaqueColors: colors.size, sha256: createHash('sha256').update(bytes).digest('hex') }
}
