import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { inspectCapturePng } from '../scripts/tutorial-browser/capture-diagnostic-png.mjs'
const crc32 = bytes => {
  let crc = 0xffffffff
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0) }
  return (crc ^ 0xffffffff) >>> 0
}
const chunk = (kind, data) => {
  const raw = Buffer.concat([Buffer.from(kind), data]), size = Buffer.alloc(4), crc = Buffer.alloc(4)
  size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(raw)); return Buffer.concat([size, raw, crc])
}
const rgba = Buffer.from([255, 0, 0, 255, 0, 255, 0, 255]), rawPixelSha256 = createHash('sha256').update(rgba).digest('hex')
const header = Buffer.alloc(13); header.writeUInt32BE(2, 0); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header),
  chunk('IDAT', deflateSync(Buffer.concat([Buffer.from([0]), rgba]))), chunk('IEND', Buffer.alloc(0))])
const expected = { width: 2, height: 1, rawPixelSha256, readbackColorSpace: 'srgb' }
assert.equal(inspectCapturePng(png, expected).opaqueColors, 2)
for (const bad of [png.subarray(0, 8), png.subarray(0, -1), Buffer.concat([png, Buffer.from([0])]), Buffer.from(png)]) {
  if (bad.length === png.length) bad[40] ^= 1
  assert.throws(() => inspectCapturePng(bad, expected))
}
assert.throws(() => inspectCapturePng(png, { ...expected, width: 3 }))
assert.throws(() => inspectCapturePng(png, { ...expected, rawPixelSha256: '0'.repeat(64) }))
const insert = (...chunks) => Buffer.concat([png.subarray(0, 33), ...chunks, png.subarray(33)])
assert.equal(inspectCapturePng(insert(chunk('sRGB', Buffer.from([0]))), expected).decoded, true)
for (const chunks of [
  [chunk(Buffer.from([0xf3, 82, 71, 66]), Buffer.from([0]))],
  [chunk('sRgB', Buffer.from([0]))],
  [chunk('gAMA', Buffer.from([1]))], [chunk('sRGB', Buffer.from([255]))],
  [chunk('sRGB', Buffer.alloc(0))], [chunk('sRGB', Buffer.from([0, 0]))],
  [chunk('sRGB', Buffer.from([0])), chunk('sRGB', Buffer.from([0]))],
  [chunk('iCCP', Buffer.from([0, 0]))], [chunk('cHRM', Buffer.alloc(32))],
  [chunk('gAMA', Buffer.from([0, 0, 177, 143])), chunk('sRGB', Buffer.from([0]))],
  [chunk('tEXt', Buffer.from('ignored'))],
]) assert.throws(() => inspectCapturePng(insert(...chunks), expected))
const afterData = Buffer.concat([png.subarray(0, -12), chunk('sRGB', Buffer.from([0])), png.subarray(-12)])
assert.throws(() => inspectCapturePng(afterData, expected))
assert.throws(() => inspectCapturePng(png, { ...expected, readbackColorSpace: 'display-p3' }))
console.log(JSON.stringify({ controls: 21, status: 'passed', scope: 'supported sRGB/RGBA8 PNG and invalid metadata negatives; no browser pixels' }))
