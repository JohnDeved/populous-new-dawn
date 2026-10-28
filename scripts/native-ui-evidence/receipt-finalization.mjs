import assert from 'node:assert/strict'
import { constants, closeSync, fstatSync, ftruncateSync, lstatSync, openSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { artifactInventory } from './browser-owner.mjs'
import { limits } from './policy.mjs'

const name = 'receipt.json'
const failureName = 'receipt-finalization-failure.json'
const sorted = files => [...files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
const key = stat => [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeMs, stat.ctimeMs, stat.nlink]

export function artifactFailureText(error) {
  try { return String(error).slice(0, 2048) } catch { return 'Unprintable artifact failure' }
}

// Failure must never fall back to truncating a receipt whose ownership was just
// rejected. This marker is create-only, budgeted, and never claims exactness.
// Unsafe/full inventories or marker collisions are left to bounded caller stderr.
export function recordArtifactFailure(output, report) {
  assert.equal(report.status, 'failed')
  assert.equal(Object.hasOwn(report, 'artifacts'), false, 'No stale inventory in failed evidence')
  const raw = JSON.stringify({ ...report, receiptAccepted: false, kind: 'native-ui-receipt-finalization-failed' }, null, 2) + '\n'
  assert.ok(Buffer.byteLength(raw) <= 64 * 1024, 'Failure receipt bound')
  const inventory = artifactInventory(output)
  assert.ok(inventory.bytes + Buffer.byteLength(raw) <= limits.artifactBytes, 'Failure receipt exceeds artifact budget')
  writeFileSync(resolve(output, failureName), raw, { flag: 'wx', mode: 0o600 })
  artifactInventory(output)
}

// The caller owns this output directory and has finished all artifact writers.
// Stabilize the receipt's self-size before writing, then verify the actual tree.
// This is a final sampled acceptance check, not a filesystem allocation quota.
export function finalizeArtifactReceipt(output, report) {
  const path = resolve(output, name)
  let prior
  try { prior = lstatSync(path) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (prior) assert.ok(prior.isFile() && !prior.isSymbolicLink() && prior.nlink === 1, 'Private regular receipt required')
  const initial = artifactInventory(output)
  assert.ok(!initial.files.some(file => file.path === failureName), 'Terminal failure marker already exists')
  const existing = initial.files.find(file => file.path === name)
  assert.equal(existing?.bytes, prior?.size, 'Receipt changed during initial inventory')
  const others = initial.files.filter(file => file.path !== name)
  const otherBytes = others.reduce((sum, file) => sum + file.bytes, 0)
  const self = { path: name, bytes: 0 }
  const artifacts = { bytes: otherBytes, screenshots: initial.screenshots, files: sorted([...others, self]) }
  const final = { ...report, artifacts }
  let raw, stable = false
  for (let attempt = 0; attempt < 16; attempt++) {
    raw = JSON.stringify(final, null, 2) + '\n'
    const bytes = Buffer.byteLength(raw)
    if (bytes === self.bytes) { stable = true; break }
    self.bytes = bytes; artifacts.bytes = otherBytes + bytes
  }
  assert.ok(stable, 'Receipt self-size did not converge within its fixed bound')
  assert.ok(artifacts.bytes <= limits.artifactBytes, 'Final receipt exceeds artifact byte budget')
  assert.ok(artifacts.screenshots <= limits.screenshots, 'Screenshot budget exceeded')

  // Do not truncate before checking the already-owned inode; never follow a
  // replacement link or adopt a path created after an absent initial snapshot.
  const fd = openSync(path, constants.O_WRONLY | constants.O_NOFOLLOW |
    (prior ? 0 : constants.O_CREAT | constants.O_EXCL), 0o600)
  let written
  try {
    const opened = fstatSync(fd)
    assert.ok(opened.isFile() && opened.nlink === 1, 'Private receipt handle required')
    if (prior) assert.deepEqual(key(opened), key(prior), 'Receipt changed before final write')
    ftruncateSync(fd, 0)
    writeFileSync(fd, raw)
    written = fstatSync(fd)
    assert.equal(written.size, self.bytes)
  } finally { closeSync(fd) }
  const current = lstatSync(path)
  assert.ok(current.isFile() && !current.isSymbolicLink() && current.nlink === 1 &&
    current.dev === written.dev && current.ino === written.ino && current.size === self.bytes,
  'Final receipt identity changed')
  const observed = artifactInventory(output)
  assert.deepEqual({ ...observed, files: sorted(observed.files) }, artifacts, 'Artifacts changed during receipt finalization')
  return artifacts
}
