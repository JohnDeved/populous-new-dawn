import { deflateSync } from 'node:zlib'
const crc32 = bytes => {
  let crc = 0xffffffff
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0) }
  return (crc ^ 0xffffffff) >>> 0
}
const chunk = (kind, data) => {
  const raw = Buffer.concat([Buffer.from(kind), data]), size = Buffer.alloc(4), crc = Buffer.alloc(4)
  size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(raw)); return Buffer.concat([size, raw, crc])
}
export const rgbaPixels = (width, height) => { const data = new Uint8ClampedArray(width * height * 4); for (let i = 0; i < data.length; i += 4) { data[i] = i % 256; data[i + 3] = 255 }; return data }
export function makePng(width, height) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6
  const rgba = Buffer.from(rgbaPixels(width, height)), rows = []
  for (let y = 0; y < height; y++) rows.push(Buffer.from([0]), rgba.subarray(y * width * 4, (y + 1) * width * 4))
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))])
}
