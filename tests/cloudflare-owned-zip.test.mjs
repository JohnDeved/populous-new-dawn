import test from 'node:test'
import assert from 'node:assert/strict'
import { crc32 } from 'node:zlib'
import { readArtifactZip, readOwnedArtifactZip } from '../scripts/artifact-zip.mjs'

const options = { maxArchiveBytes: 256, maxFileBytes: 100, maxTotalBytes: 100, maxEntries: 8, allowName: name => name === 'client/test.txt' }
const contents = Buffer.from('buffer is owned')
const fileName = Buffer.from('client/test.txt')
const dataOffset = 30 + fileName.length

function storedZip() {
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50)
  local.writeUInt16LE(20, 4)
  local.writeUInt32LE(crc32(contents), 14)
  local.writeUInt32LE(contents.length, 18)
  local.writeUInt32LE(contents.length, 22)
  local.writeUInt16LE(fileName.length, 26)
  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50)
  central.writeUInt16LE(20, 4)
  central.writeUInt16LE(20, 6)
  central.writeUInt32LE(crc32(contents), 16)
  central.writeUInt32LE(contents.length, 20)
  central.writeUInt32LE(contents.length, 24)
  central.writeUInt16LE(fileName.length, 28)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50)
  end.writeUInt16LE(1, 8)
  end.writeUInt16LE(1, 10)
  end.writeUInt32LE(central.length + fileName.length, 12)
  end.writeUInt32LE(dataOffset + contents.length, 16)
  return Buffer.concat([local, fileName, contents, central, fileName, end])
}

test('owned archive parser reuses stored bytes while generic parser snapshots input', () => {
  const archive = storedZip()
  const owned = readOwnedArtifactZip(archive, options).get(fileName.toString())
  const independent = readArtifactZip(archive, options).get(fileName.toString())
  assert.deepEqual(owned, contents)
  assert.deepEqual(independent, contents)
  assert.equal(owned.byteOffset, archive.byteOffset + dataOffset)
  assert.equal(owned.buffer, archive.buffer)
  archive[dataOffset] = 0x42
  assert.equal(owned[0], 0x42)
  assert.deepEqual(independent, contents)
})

test('borrow path rejects shared and non-Buffer archive inputs without coercion', () => {
  const raw = Uint8Array.from(storedZip()).buffer
  const shared = new SharedArrayBuffer(raw.byteLength)
  new Uint8Array(shared).set(new Uint8Array(raw))
  for (const archive of [new Uint8Array(raw), raw, shared, Buffer.from(shared)]) {
    assert.throws(() => readOwnedArtifactZip(archive, options), /Expected an owned, non-shared ZIP Buffer/)
  }
  const entry = readArtifactZip(Buffer.from(shared), options).get(fileName.toString())
  new Uint8Array(shared)[dataOffset] = 0x42
  assert.deepEqual(entry, contents)
})

test('owned input still requires checksums, supported paths, and declared bounds', () => {
  const archive = storedZip()
  assert.throws(() => readOwnedArtifactZip(archive, { ...options, maxArchiveBytes: archive.length - 1 }), /Invalid artifact archive size/)
  assert.throws(() => readOwnedArtifactZip(archive, { ...options, allowName: () => false }), /Unexpected artifact path/)
  archive[dataOffset] = 0xff
  assert.throws(() => readOwnedArtifactZip(archive, options), /Artifact checksum mismatch/)
})
