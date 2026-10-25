// Bounded data-only ZIP reader. No filesystem extraction, URLs or execution.
import assert from 'node:assert/strict'
import { inflateRawSync } from 'node:zlib'
export function readArtifactZip(input, { maxArchiveBytes, maxFileBytes, maxTotalBytes, maxEntries, allowName }) {
  const zip = Buffer.from(input), entries = new Map()
  assert.ok(zip.length >= 22 && zip.length <= maxArchiveBytes, 'Invalid artifact archive size')
  const end = zip.length - 22
  assert.equal(zip.readUInt32LE(end), 0x06054b50, 'Unexpected archive footer')
  for (const at of [4, 6, 20]) assert.equal(zip.readUInt16LE(end + at), 0)
  const count = zip.readUInt16LE(end + 10), central = zip.readUInt32LE(end + 16)
  assert.ok(count > 0 && count <= maxEntries && count < 65535)
  assert.equal(zip.readUInt16LE(end + 8), count)
  assert.equal(central + zip.readUInt32LE(end + 12), end)
  let at = central, localEnd = 0, total = 0
  const extras = (start, length) => {
    const stop = start + length
    while (start < stop) {
      assert.ok(start + 4 <= stop)
      const tag = zip.readUInt16LE(start), size = zip.readUInt16LE(start + 2)
      assert.notEqual(tag, 1, 'ZIP64 is unsupported'); start += 4 + size
      assert.ok(start <= stop)
    }
  }
  for (let i = 0; i < count; i++) {
    assert.ok(at + 46 <= end); assert.equal(zip.readUInt32LE(at), 0x02014b50)
    const flags = zip.readUInt16LE(at + 8), method = zip.readUInt16LE(at + 10)
    assert.equal(flags & ~0x808, 0); assert.ok([0, 8].includes(method))
    const crc = zip.readUInt32LE(at + 16), compressed = zip.readUInt32LE(at + 20), size = zip.readUInt32LE(at + 24)
    total += size
    assert.ok(size <= maxFileBytes && total <= maxTotalBytes && compressed <= maxArchiveBytes)
    const nameLength = zip.readUInt16LE(at + 28), extraLength = zip.readUInt16LE(at + 30), commentLength = zip.readUInt16LE(at + 32)
    assert.equal(commentLength, 0); assert.equal(zip.readUInt16LE(at + 34), 0)
    const next = at + 46 + nameLength + extraLength
    assert.ok(next <= end)
    const mode = zip.readUInt32LE(at + 38) >>> 16
    assert.ok((mode & 0xf000) === 0 || (mode & 0xf000) === 0x8000, 'Not a regular file')
    assert.equal(zip.readUInt32LE(at + 38) & 0x10, 0, 'Directory attribute')
    const nameBytes = zip.subarray(at + 46, at + 46 + nameLength)
    const name = new TextDecoder('utf-8', { fatal: true }).decode(nameBytes)
    // '~' is an ordinary URL-unreserved filename character used by Vinext
    // shared chunks. Paths are data, never shell-expanded; segment checks stay.
    assert.ok(/^[a-zA-Z0-9][a-zA-Z0-9._/~-]*$/.test(name) &&
      name.split('/').every(part => part && part !== '.' && part !== '..') && allowName(name), 'Unexpected artifact path')
    assert.ok(!entries.has(name), 'Duplicate artifact path')
    extras(at + 46 + nameLength, extraLength)
    const local = zip.readUInt32LE(at + 42)
    assert.equal(local, localEnd, 'Overlapping, reordered or hidden ZIP entries')
    assert.ok(local + 30 <= central); assert.equal(zip.readUInt32LE(local), 0x04034b50)
    assert.equal(zip.readUInt16LE(local + 6), flags); assert.equal(zip.readUInt16LE(local + 8), method)
    assert.equal(zip.readUInt16LE(local + 26), nameLength)
    assert.deepEqual(zip.subarray(local + 30, local + 30 + nameLength), nameBytes)
    const localExtra = zip.readUInt16LE(local + 28), start = local + 30 + nameLength + localExtra
    assert.ok(start <= central && start + compressed <= central); extras(local + 30 + nameLength, localExtra)
    if (!(flags & 8)) {
      assert.equal(zip.readUInt32LE(local + 14), crc)
      assert.equal(zip.readUInt32LE(local + 18), compressed); assert.equal(zip.readUInt32LE(local + 22), size)
    } else for (const [offset, value] of [[14, crc], [18, compressed], [22, size]])
      assert.ok([0, value].includes(zip.readUInt32LE(local + offset)))
    localEnd = start + compressed
    if (flags & 8) {
      assert.ok(localEnd + 12 <= central)
      if (zip.readUInt32LE(localEnd) === 0x08074b50) localEnd += 4
      assert.ok(localEnd + 12 <= central)
      assert.equal(zip.readUInt32LE(localEnd), crc)
      assert.equal(zip.readUInt32LE(localEnd + 4), compressed); assert.equal(zip.readUInt32LE(localEnd + 8), size)
      localEnd += 12
    }
    const compressedBytes = zip.subarray(start, start + compressed)
    const inflated = method === 0 ? null : inflateRawSync(compressedBytes, { maxOutputLength: Math.max(1, size), info: true })
    if (inflated) assert.equal(inflated.engine.bytesWritten, compressed, 'Trailing compressed data')
    const bytes = inflated ? inflated.buffer : compressedBytes
    assert.equal(bytes.length, size)
    let checksum = 0xffffffff
    for (const byte of bytes) {
      checksum ^= byte
      for (let bit = 0; bit < 8; bit++) checksum = (checksum >>> 1) ^ ((checksum & 1) ? 0xedb88320 : 0)
    }
    assert.equal((checksum ^ 0xffffffff) >>> 0, crc, 'Artifact checksum mismatch')
    entries.set(name, bytes); at = next
  }
  assert.equal(at, end); assert.equal(localEnd, central)
  return entries
}
