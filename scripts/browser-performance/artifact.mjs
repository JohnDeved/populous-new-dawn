// Read one report.json entry in memory. Never extract or execute an artifact.
import assert from 'node:assert/strict'
import { inflateRawSync } from 'node:zlib'
import { maxReportBytes } from './protocol.mjs'
export function readReportArchive(input) {
  const zip = Buffer.from(input)
  assert.ok(zip.length >= 22 && zip.length <= maxReportBytes + 65536, 'Invalid artifact archive size')
  // upload-artifact uses an ordinary single-disk ZIP. Fail closed on ZIP64,
  // comments, multiple entries, encryption, alternate names, links and directories.
  const end = zip.length - 22
  assert.equal(zip.readUInt32LE(end), 0x06054b50, 'Unexpected archive footer')
  assert.equal(zip.readUInt16LE(end + 4), 0); assert.equal(zip.readUInt16LE(end + 6), 0)
  assert.equal(zip.readUInt16LE(end + 8), 1); assert.equal(zip.readUInt16LE(end + 10), 1)
  assert.equal(zip.readUInt16LE(end + 20), 0)
  const centralSize = zip.readUInt32LE(end + 12), central = zip.readUInt32LE(end + 16)
  assert.ok(central + centralSize === end && centralSize >= 46 && central <= end - 46)
  assert.equal(zip.readUInt32LE(central), 0x02014b50)
  const flags = zip.readUInt16LE(central + 8), method = zip.readUInt16LE(central + 10)
  assert.equal(flags & ~0x808, 0); assert.ok([0, 8].includes(method))
  const crc = zip.readUInt32LE(central + 16), compressed = zip.readUInt32LE(central + 20), size = zip.readUInt32LE(central + 24)
  assert.ok(size > 0 && size <= maxReportBytes && compressed <= maxReportBytes + 4096)
  const nameLength = zip.readUInt16LE(central + 28), extraLength = zip.readUInt16LE(central + 30), commentLength = zip.readUInt16LE(central + 32)
  assert.equal(centralSize, 46 + nameLength + extraLength + commentLength); assert.equal(commentLength, 0)
  assert.equal(zip.readUInt16LE(central + 34), 0)
  const mode = zip.readUInt32LE(central + 38) >>> 16
  assert.ok((mode & 0xf000) === 0 || (mode & 0xf000) === 0x8000, 'Not a regular file')
  assert.equal(zip.subarray(central + 46, central + 46 + nameLength).toString(), 'report.json')
  const local = zip.readUInt32LE(central + 42)
  assert.equal(local, 0); assert.equal(zip.readUInt32LE(local), 0x04034b50)
  assert.equal(zip.readUInt16LE(local + 6), flags); assert.equal(zip.readUInt16LE(local + 8), method)
  assert.equal(zip.readUInt16LE(local + 26), nameLength)
  assert.equal(zip.subarray(local + 30, local + 30 + nameLength).toString(), 'report.json')
  const start = local + 30 + nameLength + zip.readUInt16LE(local + 28)
  assert.ok(start <= central && start + compressed <= central)
  const bytes = method === 0 ? zip.subarray(start, start + compressed) : inflateRawSync(zip.subarray(start, start + compressed), { maxOutputLength: maxReportBytes })
  assert.equal(bytes.length, size)
  let checksum = 0xffffffff
  for (const byte of bytes) {
    checksum ^= byte
    for (let bit = 0; bit < 8; bit++) checksum = (checksum >>> 1) ^ ((checksum & 1) ? 0xedb88320 : 0)
  }
  assert.equal((checksum ^ 0xffffffff) >>> 0, crc, 'Artifact checksum mismatch')
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
