// Synthetic STORE/DEFLATE ZIPs, never browser evidence.
import { deflateRawSync } from 'node:zlib'
export function artifactZip(files, { compress = false } = {}) {
  const locals = [], entries = []; let offset = 0
  for (const [name, value] of files) {
    const data = Buffer.from(value), filename = Buffer.from(name), encoded = compress ? deflateRawSync(data) : data
    let crc = 0xffffffff
    for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0) }
    crc = (crc ^ 0xffffffff) >>> 0
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4)
    local.writeUInt16LE(compress ? 8 : 0, 8)
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(encoded.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(filename.length, 26)
    const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6)
    central.writeUInt16LE(compress ? 8 : 0, 10)
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(encoded.length, 20); central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(filename.length, 28); central.writeUInt32LE(offset, 42)
    locals.push(local, filename, encoded); entries.push(central, filename); offset += local.length + filename.length + encoded.length
  }
  const central = Buffer.concat(entries), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50)
  end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, central, end])
}
