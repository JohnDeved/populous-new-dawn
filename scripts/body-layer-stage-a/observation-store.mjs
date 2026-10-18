import assert from 'node:assert/strict'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  linkSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { sha, accounting } from './io.mjs'

const logicalPattern =
  /^(camera|animation)-(baseline|candidate)\/(initial-state\.json|[a-zA-Z0-9-]+\.(state\.json|rgba))\.gz$/
function safe(root, relative) {
  assert.ok(logicalPattern.test(relative), 'Unsafe observation path')
  for (const part of [root, join(root, relative.split('/')[0])])
    if (existsSync(part))
      assert.ok(
        lstatSync(part).isDirectory() && !lstatSync(part).isSymbolicLink(),
        'Unsafe observation directory'
      )
  return join(root, relative)
}
function location(root) {
  const dir = join(root, 'observation-cas')
  if (existsSync(dir))
    assert.ok(
      lstatSync(dir).isDirectory() && !lstatSync(dir).isSymbolicLink(),
      'Unsafe CAS directory'
    )
  else mkdirSync(dir)
  return dir
}
function regular(path) {
  assert.ok(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(), 'Unsafe CAS file')
  return readFileSync(path)
}
export function manifest(root) {
  const path = join(location(root), 'manifest.json')
  if (!existsSync(path)) return { version: 1, paths: {} }
  const value = JSON.parse(regular(path))
  assert.equal(value.version, 1)
  assert.ok(value.paths && typeof value.paths === 'object' && !Array.isArray(value.paths))
  return value
}
export function storeObservation(root, relative, compressed) {
  safe(root, relative)
  const dir = location(root),
    value = manifest(root)
  assert.ok(!Object.hasOwn(value.paths, relative), 'Observation already stored')
  const hash = sha(compressed),
    blob = join(dir, `${hash}.blob.gz`)
  if (existsSync(blob)) assert.ok(regular(blob).equals(compressed), 'CAS collision or corruption')
  else writeFileSync(blob, compressed, { flag: 'wx' })
  value.paths[relative] = { sha256: hash, bytes: compressed.length }
  const temporary = join(dir, 'manifest.next.json')
  writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
  renameSync(temporary, join(dir, 'manifest.json'))
}
export function materializeObservations(root) {
  const dir = location(root),
    value = manifest(root)
  for (const [relative, entry] of Object.entries(value.paths)) {
    const target = safe(root, relative)
    assert.match(entry.sha256, /^[a-f0-9]{64}$/)
    assert.ok(Number.isSafeInteger(entry.bytes) && entry.bytes >= 0)
    const blob = join(dir, `${entry.sha256}.blob.gz`),
      data = regular(blob)
    assert.equal(data.length, entry.bytes, 'CAS size mismatch')
    assert.equal(sha(data), entry.sha256, 'CAS hash mismatch')
    mkdirSync(dirname(target), { recursive: true })
    if (existsSync(target))
      assert.ok(regular(target).equals(data), 'Materialized observation mismatch')
    else linkSync(blob, target)
  }
  return value
}
export function enforceBudget(root, cap) {
  const count = accounting(root)
  if (count.physicalBytes >= cap) {
    const error = new Error(
      `Evidence budget exceeded: physical=${count.physicalBytes}, logical=${count.logicalBytes}, cap=${cap}`
    )
    error.accounting = { ...count, cap }
    throw error
  }
  return { ...count, cap }
}

// Final launcher receipt is included in its own stable content-byte accounting.
export function finalizeEvidence(root, receipt, report, cap) {
  writeFileSync(receipt, JSON.stringify(report, null, 2) + '\n')
  const stat = lstatSync(receipt)
  assert.equal(stat.nlink, 1, 'Launcher receipt must not be shared')
  const start = accounting(root)
  const basePhysical = start.physicalBytes - stat.size
  const baseLogical = start.logicalBytes - stat.size
  let size = stat.size
  for (let attempt = 0; attempt < 16; attempt++) {
    const physicalBytes = basePhysical + size
    if (physicalBytes >= cap) {
      report.status = 'failed'
      report.budgetFailure = 'Final whole-output evidence cap exceeded; all evidence retained'
    }
    report.finalEvidenceAccounting = {
      scope: 'Whole launcher output, including this final receipt and driver log',
      physicalBytes,
      logicalBytes: baseLogical + size,
      files: start.files,
      uniqueFiles: start.uniqueFiles,
      receiptBytes: size,
      cap,
    }
    const encoded = JSON.stringify(report, null, 2) + '\n'
    const nextSize = Buffer.byteLength(encoded)
    if (nextSize !== size) {
      size = nextSize
      continue
    }
    writeFileSync(receipt, encoded)
    const final = accounting(root)
    assert.equal(final.physicalBytes, physicalBytes, 'Final evidence accounting drift')
    assert.equal(final.logicalBytes, baseLogical + size, 'Final logical accounting drift')
    return physicalBytes < cap
  }
  throw new Error('Final receipt accounting did not stabilize')
}
