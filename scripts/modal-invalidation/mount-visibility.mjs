import assert from 'node:assert/strict'
import { openSync, closeSync, fstatSync, constants } from 'node:fs'
import { readTextBounded } from './telemetry-reader.mjs'
const within = (path, parent) => path === parent || path.startsWith(parent === '/' ? '/' : parent + '/')
// Linux O_PATH observes the kernel's resolved mount without reading its contents
// or requiring directory read permission. O_CLOEXEC prevents inheritance.
// These Linux flags do not grant write access; there is no O_RDONLY fallback.
function fdMountId(raw) {
  assert.equal(raw.complete, true); assert.equal(raw.truncated, false)
  assert.ok(Buffer.byteLength(raw.text) <= 2048); assert.equal(raw.bytes, Buffer.byteLength(raw.text))
  const matches = [...raw.text.matchAll(/^mnt_id:[ \t]+([0-9]+)$/gm)]; assert.equal(matches.length, 1)
  const id = Number(matches[0][1]); assert.ok(Number.isSafeInteger(id) && id > 0)
  return id
}
export function probeMountTarget(target, read = readTextBounded, close = closeSync) {
  let fd
  try {
    assert.equal(process.platform, 'linux'); assert.equal(process.arch, 'x64')
    assert.ok(target.startsWith('/') && !/[\0\n]/.test(target) && (target === '/' || !target.slice(1).split('/').some(part => ['', '.', '..'].includes(part))))
    fd = openSync(target, 0x200000 | 0x80000 | constants.O_NOFOLLOW)
    const stat = fstatSync(fd); assert.ok(stat.isDirectory() || stat.isFile(), 'Mount target must not be a symlink or special file')
    const raw = read(`/proc/self/fdinfo/${fd}`, 2048), mountId = fdMountId(raw)
    return { target, status: 'read', mountId, rawFdinfo: raw }
  } catch (error) { return { target, status: 'unavailable', error: String(error).slice(0, 512) } }
  finally { if (fd !== undefined) close(fd) }
}
export function captureMountVisibility(rows) {
  const targets = [...new Set(rows.map(row => row.target))]; assert.ok(targets.length > 0 && targets.length <= 256)
  const proof = { method: 'linux-O_PATH-own-fdinfo-mnt_id', platform: process.platform, architecture: process.arch, targets: [] }
  for (const target of targets) {
    try { proof.targets.push(probeMountTarget(target)) }
    catch (error) {
      proof.targets.push({ target, status: 'unavailable', error: String(error).slice(0, 512) })
      for (const rest of targets.slice(proof.targets.length)) proof.targets.push({ target: rest, status: 'not-probed' })
      break
    }
  }
  return proof
}
export function visibleMounts(snapshot) {
  const rows = snapshot.mountInfo, proof = snapshot.visibility
  assert.equal(snapshot.namespaceAfter, snapshot.namespace, 'Mount namespace changed during proof')
  assert.equal(snapshot.rawMountInfo.complete, true); assert.equal(snapshot.rawMountInfoAfter.complete, true)
  assert.equal(snapshot.rawMountInfoAfter.text, snapshot.rawMountInfo.text, 'Mount graph changed during proof')
  assert.equal(proof.method, 'linux-O_PATH-own-fdinfo-mnt_id'); assert.equal(proof.platform, 'linux'); assert.equal(proof.architecture, 'x64')
  assert.ok(rows.length > 0 && rows.length <= 256)
  const byId = new Map(rows.map(row => [row.id, row])); assert.equal(byId.size, rows.length, 'Duplicate mount IDs')
  const roots = rows.filter(row => !byId.has(row.parent)); assert.equal(roots.length, 1); assert.equal(roots[0].target, '/')
  for (const row of rows) {
    assert.ok(Number.isSafeInteger(row.id) && row.id > 0 && Number.isSafeInteger(row.parent) && row.parent >= 0)
    const visited = new Set(); let at = row
    while (byId.has(at.parent)) {
      assert.ok(!visited.has(at.id), 'Cyclic mount graph'); visited.add(at.id)
      const parent = byId.get(at.parent); assert.ok(within(at.target, parent.target), 'Impossible mount ancestry'); at = parent
    }
    assert.equal(at.id, roots[0].id)
  }
  const observations = new Map(proof.targets.map(value => [value.target, value]))
  assert.equal(observations.size, proof.targets.length)
  assert.deepEqual([...observations.keys()].sort(), [...new Set(rows.map(row => row.target))].sort())
  for (const value of observations.values()) {
    assert.equal(value.status, 'read', `Unknown effective mount: ${value.target}`)
    assert.equal(value.mountId, fdMountId(value.rawFdinfo), 'FD mount ID contradicts retained raw proof')
    const selected = byId.get(value.mountId); assert.ok(selected, 'Effective mount ID absent from retained graph')
    assert.ok(within(value.target, selected.target), 'Resolved mount does not contain target')
    assert.equal(observations.get(selected.target)?.mountId, selected.id, 'Inconsistent effective mount selections')
  }
  const effective = rows.filter(row => observations.get(row.target).mountId === row.id)
  proof.resolved = rows.map(row => ({ id: row.id, parent: row.parent, target: row.target,
    visible: observations.get(row.target).mountId === row.id, resolvedMountId: observations.get(row.target).mountId }))
  return effective
}
