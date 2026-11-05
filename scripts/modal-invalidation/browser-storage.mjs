import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { openSync, readSync, closeSync, statSync, statfsSync, readlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { browserMounts, limits } from './hosted-policy.mjs'
import { capacityPolicy } from './capacity.mjs'

// Short reads are not EOF on procfs. Bound allocation and cumulative reads,
// but continue until zero bytes or maximum + 1 establishes overflow.
export function readTextBounded(path, maximum, reader = readSync) {
  assert.ok(Number.isSafeInteger(maximum) && maximum > 0)
  const fd = openSync(path, 'r')
  try {
    const data = Buffer.alloc(maximum + 1); let count = 0
    while (count < data.length) {
      const bytes = reader(fd, data, count, data.length - count, count)
      assert.ok(Number.isSafeInteger(bytes) && bytes >= 0 && bytes <= data.length - count)
      if (bytes === 0) break
      count += bytes
    }
    return { text: data.subarray(0, Math.min(count, maximum)).toString('utf8'), bytes: Math.min(count, maximum),
      complete: count <= maximum, truncated: count > maximum }
  } finally { closeSync(fd) }
}
function textFile(path, maximum) {
  const value = readTextBounded(path, maximum)
  assert.ok(value.complete, `Owned telemetry exceeds its bound: ${path}`)
  return value.text
}
const numericFile = path => { const value = textFile(path, 64).trim(); assert.match(value, /^[0-9]+$/); return Number(value) }
const unescape = text => text.replace(/\\(040|011|012|134)/g, (_, value) => String.fromCharCode(parseInt(value, 8)))
export function parseMountInfo(text) {
  assert.ok(Buffer.byteLength(text) <= 256 * 1024)
  const lines = text.trim().split('\n'); assert.ok(lines.length > 0 && lines.length <= 256)
  return lines.map(line => {
    const fields = line.split(' '), divider = fields.indexOf('-'); assert.ok(divider >= 6)
    return { target: unescape(fields[4]), options: fields[5].split(','), type: fields[divider + 1] }
  })
}
export function fileSizeLimit(text) {
  const match = text.match(/^Max file size\s+(\S+)\s+(\S+)\s+bytes\s*$/m)
  assert.ok(match); assert.match(match[1], /^\d+$/); assert.match(match[2], /^\d+$/)
  return { soft: Number(match[1]), hard: Number(match[2]) }
}
const apiMount = row => (row.type === 'proc' && (row.target === '/proc' || row.target.startsWith('/proc/'))) ||
  (row.type === 'sysfs' && (row.target === '/sys' || row.target.startsWith('/sys/'))) ||
  (row.type === 'cgroup2' && (row.target === '/sys/fs/cgroup' || row.target.startsWith('/sys/fs/cgroup/'))) ||
  (['devtmpfs', 'tmpfs'].includes(row.type) && row.target === '/dev') ||
  (row.type === 'devpts' && row.target === '/dev/pts') || (row.type === 'mqueue' && row.target === '/dev/mqueue')
export function validateBrowserStorage(snapshot, { temporary, output, root, dist, uid, gid }) {
  const mounts = browserMounts(temporary, uid, gid), runtime = mounts[0].path
  assert.match(snapshot.systemdVersion, /^systemd [0-9]+\b/)
  assert.match(snapshot.namespace, /^mnt:\[[0-9]+\]$/); assert.match(snapshot.parentNamespace, /^mnt:\[[0-9]+\]$/)
  assert.notEqual(snapshot.namespace, snapshot.parentNamespace, 'Service filesystem namespace must be private')
  assert.equal(snapshot.fileLimit.soft, limits.browserFileBytes); assert.equal(snapshot.fileLimit.hard, limits.browserFileBytes)
  assert.equal(snapshot.memoryMax, limits.memoryBytes); assert.equal(snapshot.swapMax, 0)
  assert.ok(Number.isSafeInteger(snapshot.memoryCurrent) && snapshot.memoryCurrent >= 0 && snapshot.memoryCurrent < limits.memoryBytes)
  assert.ok(Number.isSafeInteger(snapshot.memoryAvailable) && snapshot.memoryAvailable >=
    capacityPolicy.workerBytes + capacityPolicy.hostReserveBytes + capacityPolicy.browserTmpfsBytes)
  assert.ok(Number.isSafeInteger(snapshot.outputAvailable) && snapshot.outputAvailable >=
    capacityPolicy.execution.evidence + capacityPolicy.execution.rollback)
  assert.deepEqual(snapshot.environment, { HOME: `${runtime}/home`, TMPDIR: '/tmp', XDG_CACHE_HOME: `${runtime}/cache`,
    XDG_CONFIG_HOME: `${runtime}/config`, XDG_RUNTIME_DIR: `${runtime}/run`, PND_MODAL_RUNTIME: runtime })
  assert.equal(snapshot.mounts.length, mounts.length)
  for (const expected of mounts) {
    const actual = snapshot.mounts.find(mount => mount.path === expected.path); assert.ok(actual)
    for (const key of ['bytes', 'inodes', 'uid', 'gid', 'mode']) assert.equal(actual[key], expected[key], `${expected.path} ${key}`)
    assert.equal(actual.filesystemType, 0x01021994)
    const row = snapshot.mountInfo.find(row => row.target === expected.path)
    assert.equal(row?.type, 'tmpfs'); assert.ok(['rw', 'nosuid', 'nodev'].every(option => row.options.includes(option)))
  }
  assert.ok(snapshot.devOwnership.uid === 0 && (snapshot.devOwnership.mode & 0o022) === 0,
    'Writable /dev API mount must not permit ordinary file creation by the service user')
  const writable = new Set([...mounts.map(mount => mount.path), output])
  assert.ok(snapshot.mountInfo.some(row => row.target === output && row.options.includes('rw')))
  for (const row of snapshot.mountInfo) {
    assert.ok(row.options.includes('ro') || row.options.includes('rw'))
    if (row.options.includes('rw')) assert.ok(writable.has(row.target) || apiMount(row), `Unexpected ordinary writable mount: ${row.target}`)
  }
  for (const path of [root, dist]) {
    assert.ok(!writable.has(path) && !path.startsWith(output + '/'))
    const mounted = snapshot.mountInfo.filter(row => path === row.target || path.startsWith(row.target === '/' ? '/' : row.target + '/'))
      .sort((a, b) => b.target.length - a.target.length)[0]
    assert.ok(mounted?.options.includes('ro'), `Source/build must be read-only inside browser service: ${path}`)
  }
  return { status: 'passed', scope: 'Private finite runtime allocations and separately bounded evidence producers; not measured Chrome minimum demand.' }
}
export function assessBrowserStorage(snapshot, options) {
  try { snapshot.acceptance = validateBrowserStorage(snapshot, options) }
  catch (error) { snapshot.acceptance = { status: 'blocked', error: String(error) } }
  return snapshot
}
export function captureBrowserStorage({ temporary, output, root, dist, supervisor }) {
  const uid = process.getuid(), gid = process.getgid(), cgroup = `/sys/fs/cgroup${supervisor.controlGroup}`
  const snapshot = { at: new Date().toISOString() }
  try {
    snapshot.systemdVersion = execFileSync('systemd', ['--version'], { encoding: 'utf8', timeout: 5000 }).split('\n')[0]
    snapshot.namespace = readlinkSync('/proc/self/ns/mnt'); snapshot.parentNamespace = process.env.PND_MODAL_PARENT_MOUNT_NS
    snapshot.rawMountInfo = readTextBounded('/proc/self/mountinfo', 256 * 1024)
    assert.ok(snapshot.rawMountInfo.complete, 'Mount telemetry exceeds its bound')
    snapshot.mountInfo = parseMountInfo(snapshot.rawMountInfo.text)
    snapshot.rawLimits = readTextBounded('/proc/self/limits', 16 * 1024)
    assert.ok(snapshot.rawLimits.complete, 'Limit telemetry exceeds its bound')
    snapshot.fileLimit = fileSizeLimit(snapshot.rawLimits.text)
    snapshot.memoryMax = numericFile(`${cgroup}/memory.max`); snapshot.memoryCurrent = numericFile(`${cgroup}/memory.current`)
    snapshot.swapMax = numericFile(`${cgroup}/memory.swap.max`)
    snapshot.memoryAvailable = Number(textFile('/proc/meminfo', 64 * 1024).match(/^MemAvailable:\s+(\d+) kB$/m)?.[1]) * 1024
    const fs = statfsSync(output); snapshot.outputAvailable = fs.bavail * fs.bsize
    snapshot.environment = Object.fromEntries(['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'XDG_CONFIG_HOME', 'XDG_RUNTIME_DIR', 'PND_MODAL_RUNTIME'].map(key => [key, process.env[key]]))
    snapshot.mounts = []
    for (const mount of browserMounts(temporary, uid, gid)) {
      const fs = statfsSync(mount.path), stat = statSync(mount.path)
      snapshot.mounts.push({ path: mount.path, filesystemType: fs.type, bytes: fs.blocks * fs.bsize, availableBytes: fs.bavail * fs.bsize,
        inodes: fs.files, availableInodes: fs.ffree, uid: stat.uid, gid: stat.gid, mode: stat.mode & 0o7777 })
    }
    const dev = statSync('/dev'); snapshot.devOwnership = { uid: dev.uid, mode: dev.mode & 0o7777 }
    assessBrowserStorage(snapshot, { temporary: resolve(temporary), output, root, dist, uid, gid })
  } catch (error) { snapshot.acceptance = { status: 'blocked', error: String(error) } }
  return snapshot
}
