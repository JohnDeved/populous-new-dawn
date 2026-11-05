import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, statfsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { admitModal } from './hosted-policy.mjs'
const GiB = 1024 ** 3, MiB = 1024 ** 2
export const capacityPolicy = Object.freeze({
  workerBytes: 4 * GiB, hostReserveBytes: GiB,
  // This isolated hosted job owns all planned writes. No source/assets are copied.
  preparation: { toolchain: 256 * MiB, runtime: 2 * GiB, cache: 2 * GiB, evidence: 64 * MiB, scratch: GiB, rollback: 256 * MiB },
  execution: { toolchain: 0, runtime: 0, cache: 256 * MiB, evidence: 64 * MiB, scratch: GiB, rollback: 256 * MiB },
  preparationInodes: 200000, executionInodes: 50000,
  rationale: 'Declared conservative hosted-only reserves for one locked install, two sequential 4GiB-capped stages and bounded artifacts; not measured workload demand or a universal platform threshold.',
})
const read = path => { try { return readFileSync(path, 'utf8').trim() } catch { return null } }
const numbers = text => text === null ? null : Object.fromEntries(text.split('\n').map(line => {
  const [key, value, unit] = line.trim().split(/\s+/); return [key.replace(/:$/, ''), Number(value) * (unit === 'kB' ? 1024 : 1)]
}))
function destination(path) {
  let existing = resolve(path)
  while (!existsSync(existing)) { const parent = dirname(existing); assert.notEqual(parent, existing); existing = parent }
  const fs = statfsSync(existing), stat = statSync(existing)
  let mount = null
  try { mount = JSON.parse(execFileSync('findmnt', ['--json', '--target', existing, '--output', 'TARGET,FSTYPE,SOURCE,OPTIONS'], { encoding: 'utf8', timeout: 5000 })) } catch { /* Missing mount telemetry remains unknown and blocks admission below. */ }
  return { path: resolve(path), measuredAt: existing, device: stat.dev, filesystemType: fs.type,
    availableBytes: fs.bavail * fs.bsize, freeInodes: fs.ffree, mount, quota: 'unknown; no quota provider was queried' }
}
export function assessCapacity(snapshot) {
  const reasons = [], prepare = snapshot.stage === 'preparation', reserves = prepare ? capacityPolicy.preparation : capacityPolicy.execution,
    inodeReserve = prepare ? capacityPolicy.preparationInodes : capacityPolicy.executionInodes, devices = new Map()
  for (const [name, reserve] of Object.entries(reserves)) {
    const target = snapshot.destinations[name]
    if (!target || !Number.isSafeInteger(target.availableBytes) || !Number.isSafeInteger(target.freeInodes) || !target.mount) {
      reasons.push(`Required filesystem capacity is unknown: ${name}`); continue
    }
    const group = devices.get(target.device) ?? { requiredBytes: 0, availableBytes: target.availableBytes, freeInodes: target.freeInodes, tmpfs: false }
    group.requiredBytes += reserve; group.availableBytes = Math.min(group.availableBytes, target.availableBytes)
    group.freeInodes = Math.min(group.freeInodes, target.freeInodes)
    group.tmpfs ||= target.mount.filesystems?.some(mount => mount.fstype === 'tmpfs') === true
    devices.set(target.device, group)
  }
  let tmpfsReserve = 0
  for (const [device, group] of devices) {
    if (group.availableBytes < group.requiredBytes) reasons.push(`Filesystem ${device} has ${group.availableBytes} bytes; ${group.requiredBytes} reserved`)
    if (group.freeInodes < inodeReserve) reasons.push(`Filesystem ${device} has ${group.freeInodes} inodes; ${inodeReserve} required`)
    if (group.tmpfs) tmpfsReserve += group.requiredBytes
  }
  const minimum = capacityPolicy.workerBytes + capacityPolicy.hostReserveBytes + tmpfsReserve
  if (!Number.isSafeInteger(snapshot.memory?.MemAvailable) || snapshot.memory.MemAvailable < minimum)
    reasons.push(`MemAvailable is ${snapshot.memory?.MemAvailable ?? 'unknown'}; ${minimum} required including tmpfs writes`)
  if (!snapshot.cgroups.length || snapshot.cgroups.some(group =>
    (group.memoryMax === null || group.memoryCurrent === null) && !(group.path === '/' && snapshot.rootCgroup?.verified === true)))
    reasons.push('Required parent cgroup capacity is unknown')
  for (const group of snapshot.cgroups) if (group.memoryMax !== 'max' && !(group.path === '/' && group.memoryMax === null && snapshot.rootCgroup?.verified === true)) {
    const remaining = Number(group.memoryMax) - Number(group.memoryCurrent)
    if (!Number.isSafeInteger(remaining) || remaining < minimum) reasons.push(`Cgroup ${group.path} headroom ${remaining} is below ${minimum}`)
  }
  return { admitted: reasons.length === 0, reasons, requiredMemoryBytes: minimum,
    devices: Object.fromEntries(devices), plannedOtherOwnerWrites: 0,
    ownership: 'One isolated GitHub-hosted job; build and browser stages are sequential. Measurements are not reservations.' }
}
export function captureCapacity({ root, workspace, stage, identity }) {
  const memory = numbers(read('/proc/meminfo')), current = read('/proc/self/cgroup')
  const path = current?.split('\n').find(line => line.startsWith('0::'))?.slice(3)
  const cgroups = []
  if (path?.startsWith('/')) {
    let at = path
    for (;;) {
      const directory = resolve('/sys/fs/cgroup', `.${at}`)
      cgroups.push({ path: at, memoryMax: read(resolve(directory, 'memory.max')),
        memoryCurrent: read(resolve(directory, 'memory.current')), memoryPeak: read(resolve(directory, 'memory.peak')),
        swapMax: read(resolve(directory, 'memory.swap.max')), swapCurrent: read(resolve(directory, 'memory.swap.current')),
        memoryEvents: numbers(read(resolve(directory, 'memory.events'))), pidsMax: read(resolve(directory, 'pids.max')),
        pidsCurrent: read(resolve(directory, 'pids.current')) })
      if (at === '/') break
      at = dirname(at)
    }
  }
  let rootType = null
  try { rootType = statfsSync('/sys/fs/cgroup').type } catch { /* Unsupported cgroup mounts stay unknown. */ }
  const rootCgroup = { filesystemType: rootType, controllers: read('/sys/fs/cgroup/cgroup.controllers'),
    pidOne: read('/proc/1/comm'), pidOneCgroup: read('/proc/1/cgroup') }
  rootCgroup.verified = rootType === 0x63677270 && rootCgroup.controllers?.split(/\s+/).includes('memory') === true &&
    rootCgroup.pidOne === 'systemd' && ['0::/', '0::/init.scope'].includes(rootCgroup.pidOneCgroup)
  const status = numbers(read('/proc/self/status')), vmstat = numbers(read('/proc/vmstat'))
  const snapshot = { at: new Date().toISOString(), stage, identity, owner: `modal-${identity.runId}-${identity.runAttempt}`,
    command: process.argv, tools: { node: process.version }, policy: capacityPolicy,
    destinations: { toolchain: destination(dirname(process.execPath)), runtime: destination(root), cache: destination(resolve(workspace, 'cache')),
      evidence: destination(resolve(workspace, 'evidence')), scratch: destination(resolve(workspace, 'dist')),
      rollback: destination(workspace) },
    memory: memory && { MemAvailable: memory.MemAvailable, Shmem: memory.Shmem, SwapTotal: memory.SwapTotal, SwapFree: memory.SwapFree },
    process: { pid: process.pid, rssBytes: status?.VmRSS ?? null, threads: status?.Threads ?? null },
    oomKill: vmstat?.oom_kill ?? null, cgroups, rootCgroup,
    rootCgroupNote: 'The unified root may omit memory.max/current because limits apply to descendants. Missing non-root capacity blocks admission; host MemAvailable and the new worker hard limit remain independently required.' }
  snapshot.decision = assessCapacity(snapshot)
  return snapshot
}
export function requireCapacity({ root, workspace, output, stage, identity }) {
  const snapshot = captureCapacity({ root, workspace, stage, identity })
  writeFileSync(resolve(output, `${stage}-capacity.json`), JSON.stringify(snapshot, null, 2) + '\n')
  if (!snapshot.decision.admitted) {
    const error = Error(`Resource admission blocked before ${stage}: ${snapshot.decision.reasons.join('; ')}`)
    error.code = 'PND_RESOURCE_ADMISSION'; throw error
  }
  return snapshot
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.equal(process.argv[2], 'prepare')
  const identity = admitModal(JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')), process.env)
  const root = resolve(import.meta.dirname, '../..'), workspace = resolve(process.env.RUNNER_TEMP, `modal-invalidation-${identity.runId}-${identity.runAttempt}`)
  assert.equal(existsSync(workspace), false, 'Fresh preparation output required'); mkdirSync(workspace)
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', timeout: 5000 }).trim()
  assert.equal(git('rev-parse', 'HEAD'), identity.merge)
  const preparation = requireCapacity({ root, workspace, output: workspace, stage: 'preparation',
    identity: { ...identity, tree: git('rev-parse', 'HEAD^{tree}') } })
  assert.equal(preparation.decision.admitted, true)
}
