import assert from 'node:assert/strict'
import { readdirSync, lstatSync, openSync, fstatSync, ftruncateSync, writeFileSync, closeSync, constants } from 'node:fs'
import { resolve } from 'node:path'
import { limits } from './hosted-policy.mjs'

export const evidenceReserves = Object.freeze({ preparation: 1024 ** 2, receipt: 1024 ** 2,
  stream: limits.logBytes / 2, other: limits.artifactBytes - 1024 ** 2 - 1024 ** 2 - 2 * limits.logBytes })
const streams = new Set(['build.stdout.log', 'build.stderr.log', 'browser.stdout.log', 'browser.stderr.log'])
export function admitEvidenceWrite(files, name, bytes) {
  assert.match(name, /^[a-z0-9][a-z0-9.-]*$/)
  assert.ok(Number.isSafeInteger(bytes) && bytes >= 0)
  assert.ok(files.length <= 256 && new Set(files.map(file => file.name)).size === files.length)
  for (const file of files) assert.ok(Number.isSafeInteger(file.bytes) && file.bytes >= 0)
  const after = [...files.filter(file => file.name !== name), { name, bytes }]
  assert.ok(after.length <= 256, 'Evidence file count exceeds its bound')
  assert.ok(after.filter(file => file.name.endsWith('.png')).length <= 1, 'Only one evidence screenshot is admitted')
  let otherBytes = 0
  for (const file of after) {
    if (streams.has(file.name)) assert.ok(file.bytes <= evidenceReserves.stream, 'Raw stream exceeds its unchanged allowance')
    else if (file.name === 'receipt.json') assert.ok(file.bytes <= evidenceReserves.receipt, 'Final receipt reserve exceeded')
    else otherBytes += file.bytes
  }
  assert.ok(otherBytes <= evidenceReserves.other, 'Evidence would consume reserved logs, final receipt or preparation space')
  return { otherBytes, reservedBytes: 4 * evidenceReserves.stream + evidenceReserves.receipt + evidenceReserves.preparation,
    totalCeilingBytes: limits.artifactBytes }
}

// Reviewed producers write serially. Reserve all four full raw-log allowances,
// a final receipt and the separately uploaded preparation receipt before writes.
// This is an application write bound, not a claim of an OS filesystem quota.
export function writeEvidence(directory, name, data, { exclusive = false } = {}) {
  assert.ok(typeof data === 'string' || Buffer.isBuffer(data))
  assert.ok(lstatSync(directory).isDirectory() && !lstatSync(directory).isSymbolicLink())
  const names = readdirSync(directory); assert.ok(names.length <= 256)
  const files = names.map(name => {
    const stat = lstatSync(resolve(directory, name))
    assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, 'Only private regular evidence files are writable')
    return { name, bytes: stat.size }
  })
  const bytes = Buffer.byteLength(data)
  admitEvidenceWrite(files, name, bytes)
  let fd
  try {
    fd = openSync(resolve(directory, name), constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW |
      (exclusive ? constants.O_EXCL : 0), 0o600)
    const stat = fstatSync(fd); assert.ok(stat.isFile() && stat.nlink === 1)
    ftruncateSync(fd, 0); writeFileSync(fd, data)
  } finally { if (fd !== undefined) closeSync(fd) }
  return bytes
}
