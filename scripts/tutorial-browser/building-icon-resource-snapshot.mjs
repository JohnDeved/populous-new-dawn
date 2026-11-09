import { openSync, readSync, closeSync, statfsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

// Bounded read-only observations, not a memory reservation or capacity guarantee.
export function iconResourceSnapshot({ phase, cwd, env, read, statfs, command, now }) {
  if (!['before-preparation', 'before-launch'].includes(phase)) throw Error('Unknown resource phase')
  const observe = fn => { try { return { status: 'observed', value: fn() } } catch { return { status: 'unknown' } } }
  const paths = { runtime: cwd, evidence: resolve(cwd, 'outputs/tutorial-browser'),
    npmCache: resolve(env.HOME || cwd, '.npm'), pnpmStore: resolve(env.HOME || cwd, '.local/share/pnpm/store'),
    scratch: env.RUNNER_TEMP || '/tmp' }
  const filesystems = Object.fromEntries(Object.entries(paths).map(([name, requested]) => {
    let path = resolve(requested)
    for (let i = 0; i < 32; i++) {
      try { const s = statfs(path); return [name, { requested, measuredAncestor: path,
        filesystemTypeHex: `0x${s.type.toString(16)}`, userAvailableBytes: String(s.bavail * s.bsize),
        freeInodes: String(s.ffree), inodeTotal: String(s.files), quota: 'unknown' }] }
      catch { const parent = dirname(path); if (parent === path) break; path = parent }
    }
    return [name, { requested, status: 'unknown' }]
  }))
  const memory = observe(() => { const text = read('/proc/meminfo'); if (!['MemAvailable', 'Shmem', 'SwapTotal', 'SwapFree'].every(key => text.includes(`${key}:`))) throw Error('Incomplete memory telemetry'); return text.split('\n').filter(line => /^(MemAvailable|Shmem|SwapTotal|SwapFree):/.test(line)).join('\n') })
  const process = observe(() => { const text = read('/proc/self/status'); if (!['Name', 'Pid', 'PPid', 'VmRSS', 'Threads'].every(key => text.split('\n').some(line => line.startsWith(`${key}:`)))) throw Error('Incomplete process telemetry'); return text.split('\n').filter(line => /^(Name|Pid|PPid|VmRSS|Threads):/.test(line)).join('\n') })
  const cgroupMembership = observe(() => read('/proc/self/cgroup'))
  const member = cgroupMembership.value?.split('\n').find(line => line.startsWith('0::'))?.slice(3)
  const cgroupRoot = member?.startsWith('/') && !member.split('/').includes('..') ? resolve('/sys/fs/cgroup', `.${member}`) : null
  const cgroup = Object.fromEntries(['memory.max', 'memory.current', 'memory.swap.max', 'memory.swap.current', 'memory.events'].map(name => [name, cgroupRoot ? observe(() => read(resolve(cgroupRoot, name))) : { status: 'unknown' }]))
  return { version: 1, at: now(), phase, owner: { job: env.GITHUB_JOB || 'unknown', run: env.GITHUB_RUN_ID || 'unknown', attempt: env.GITHUB_RUN_ATTEMPT || 'unknown' },
    source: { commit: observe(() => command('git', ['rev-parse', 'HEAD'])), tree: observe(() => command('git', ['rev-parse', 'HEAD^{tree}'])), head: env.PR_HEAD_SHA || 'unknown', base: env.PR_BASE_SHA || 'unknown' },
    command: phase === 'before-preparation' ? 'workflow locked dependency preparation' : 'node scripts/tutorial-browser/run.mjs',
    node: globalThis.process.version, filesystems, memory, process, swap: observe(() => read('/proc/swaps')), cgroupMembership, cgroup, cachePathQualification: 'Presumed defaults only, not configured npm cache or pnpm store proof',
    bounds: { jobMs: 360000, routeMs: 180000, operationMs: 178000, cleanupMs: 2000, maxSequentialContexts: 2, uploadBytes: 24 * 1024 * 1024 },
    limits: 'Snapshot process only; no browser descendant RSS or peak. cgroup leaf files only, not ancestor-effective limits. cgroup v1 and inaccessible or possibly truncated telemetry unknown. No capacity reservation.',
    estimates: { installBytes: 'unknown', buildBytes: 'unknown', cacheBytes: 'unknown', rollbackBytes: 'unknown', otherOwnersPlannedWrites: 'unknown' },
    admission: 'Telemetry only; coordinator resource/queue admission remains required. Existing job/route deadlines and upload quotas unchanged.' }
}

export function readResourceFile(path, io = { openSync, readSync, closeSync }) {
  const fd = io.openSync(path, 'r')
  try {
    const buffer = Buffer.alloc(4096)
    const bytes = io.readSync(fd, buffer, 0, buffer.length, 0)
    if (bytes === buffer.length) throw Error('Possibly truncated resource telemetry')
    return buffer.subarray(0, bytes).toString('utf8')
  } finally { io.closeSync(fd) }
}

if (globalThis.process.argv[1] && import.meta.url === pathToFileURL(resolve(globalThis.process.argv[1])).href) {
  const read = path => readResourceFile(path)
  const result = iconResourceSnapshot({ phase: globalThis.process.argv[2], cwd: globalThis.process.cwd(), env: globalThis.process.env, read,
    statfs: path => statfsSync(path, { bigint: true }), command: (file, args) => execFileSync(file, args, { encoding: 'utf8', timeout: 1000, maxBuffer: 8192 }).trim(), now: () => new Date().toISOString() })
  const text = JSON.stringify(result)
  if (Buffer.byteLength(text) > 32768) throw Error('Resource snapshot exceeds log cap')
  console.log(text)
}
