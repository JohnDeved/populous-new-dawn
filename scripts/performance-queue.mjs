#!/usr/bin/env node
// One local measurement lane with an optional owner for browser-check descendants.
import assert from 'node:assert/strict'
import { spawn, spawnSync, execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const script = fileURLToPath(import.meta.url)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (cwd, ...args) =>
  execFileSync('git', ['-C', cwd, ...args], { maxBuffer: 32 * 1024 * 1024 })
    .toString()
    .trim()
const exists = fs.existsSync
function write(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  fs.renameSync(temporary, file)
}
function identity(pid) {
  const r = spawnSync('ps', ['-p', String(pid), '-o', 'lstart='], { encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : null
}
function processTable() {
  const r = spawnSync('ps', ['-axo', 'pid=,ppid=,pgid=,lstart='], { encoding: 'utf8' })
  assert.equal(r.status, 0, `Could not inspect process ownership: ${r.stderr.trim()}`)
  return r.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/)
      assert(match, `Could not parse process ownership: ${line}`)
      return {
        pid: Number(match[1]),
        ppid: Number(match[2]),
        pgid: Number(match[3]),
        identity: match[4].trim(),
      }
    })
}
function alive(pid, group = false) {
  try {
    process.kill(group ? -pid : pid, 0)
    return true
  } catch (e) {
    if (e.code === 'ESRCH') return false
    throw e
  }
}
function signal(pid, value) {
  try {
    process.kill(-pid, value)
  } catch (e) {
    if (e.code !== 'ESRCH') throw e
  }
}
export function queueDirectory(cwd = process.cwd()) {
  return path.join(
    git(cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir'),
    'pnd-test-queue'
  )
}
function initialize(dir) {
  fs.mkdirSync(path.join(dir, 'jobs'), { recursive: true, mode: 0o700 })
}
function jobFile(dir, id) {
  assert.match(id, /^[0-9a-f-]{36}$/, 'Invalid job ID')
  return path.join(dir, 'jobs', `${id}.json`)
}
function ordered(dir) {
  const file = path.join(dir, 'order')
  return exists(file)
    ? fs
        .readFileSync(file, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(id => json(jobFile(dir, id)))
    : []
}
function fingerprint(spec) {
  return {
    head: git(spec.cwd, 'rev-parse', 'HEAD'),
    trackedDiff: hash(git(spec.cwd, 'diff', 'HEAD', '--binary')),
    inputs: Object.fromEntries(
      spec.inputs.map(file => [file, hash(fs.readFileSync(path.resolve(spec.cwd, file)))])
    ),
  }
}
function argv(value, label) {
  assert(
    Array.isArray(value) &&
      value.length &&
      value.every(x => typeof x === 'string' && x.length && !x.includes('\0')),
    `${label} must be a nonempty argv array`
  )
}
function validate(spec) {
  assert(typeof spec.owner === 'string' && spec.owner.trim(), 'owner is required')
  assert(typeof spec.label === 'string' && spec.label.trim(), 'label is required')
  assert(path.isAbsolute(spec.cwd), 'cwd must be absolute')
  argv(spec.command, 'command')
  assert(
    Number.isInteger(spec.timeoutMs) && spec.timeoutMs >= 100 && spec.timeoutMs <= 3_600_000,
    'timeoutMs must be 100..3600000'
  )
  assert(
    Array.isArray(spec.inputs) &&
      spec.inputs.length &&
      spec.inputs.every(x => typeof x === 'string' && x.length),
    'List command scripts and ignored helper inputs'
  )
  assert(
    Array.isArray(spec.ports) && spec.ports.every(x => Number.isInteger(x) && x > 0 && x < 65536),
    'ports must be an array of TCP port numbers'
  )
  // Receipt-free mode is only for foreground commands whose children never detach.
  assert(
    ['receipt', 'process-group'].includes(spec.cleanup),
    'cleanup must be receipt or process-group'
  )
  assert(
    !('notify' in spec) && !('notifyOn' in spec),
    'Use run/wait for results; messaging belongs to the owned runner'
  )
  assert(
    spec.env === undefined ||
      (spec.env &&
        typeof spec.env === 'object' &&
        !Array.isArray(spec.env) &&
        Object.entries(spec.env).every(
          ([k, v]) => /^[A-Za-z_][A-Za-z_0-9]*$/.test(k) && typeof v === 'string'
        )),
    'Invalid env'
  )
}
async function portFree(port) {
  const probe = host =>
    new Promise(resolve => {
      const server = net.createServer()
      server.once('error', error =>
        resolve(host === '::1' && ['EAFNOSUPPORT', 'EADDRNOTAVAIL'].includes(error.code))
      )
      server.listen({ port, host }, () => server.close(() => resolve(true)))
    })
  return (await probe('127.0.0.1')) && (await probe('::1'))
}
function groupRows(group, table = processTable()) {
  return table.filter(processRecord => processRecord.pgid === group.pid)
}
function verifyGroupIdentity(group, table = processTable()) {
  const rows = groupRows(group, table)
  if (!rows.length) return rows
  assert(
    rows.some(row => group.members.get(row.pid) === row.identity),
    `Refusing to signal process group ${group.pid}: owned process identity is no longer present`
  )
  for (const row of rows) group.members.set(row.pid, row.identity)
  return rows
}
function signalOwnedGroup(group, value) {
  if (!verifyGroupIdentity(group).length) return false
  signal(group.pid, value)
  if (value === 'SIGTERM') group.terminationSent = true
  return true
}
async function stopGroup(group) {
  if (!group.terminationSent && !signalOwnedGroup(group, 'SIGTERM')) return
  for (let i = 0; groupRows(group).length && i < 20; i++) await sleep(50)
  if (groupRows(group).length) signalOwnedGroup(group, 'SIGKILL')
  for (let i = 0; groupRows(group).length && i < 20; i++) await sleep(50)
  assert(!groupRows(group).length, `Owned process group ${group.pid} is still alive`)
}
function childOutcome(child) {
  return new Promise(resolve => {
    child.once('error', error => resolve({ error }))
    child.once('exit', (code, signal) => resolve({ code, signal }))
  })
}
export async function superviseBrowserCheck({
  checkerCommand,
  cwd = process.cwd(),
  env = process.env,
  serverCommand,
  readinessTimeoutMs = 45_000,
  checkerStdio = 'inherit',
}) {
  assert(process.platform !== 'win32', 'Browser supervisor requires POSIX process groups')
  argv(checkerCommand, 'checkerCommand')
  assert(env.PND_QUEUE_JOB_ID, 'PND_QUEUE_JOB_ID is required')
  assert(env.PND_QUEUE_OUTPUT, 'PND_QUEUE_OUTPUT is required')
  assert(env.PND_QUEUE_CLEANUP, 'PND_QUEUE_CLEANUP is required')
  assert(env.POPULOUS_URL, 'POPULOUS_URL is required')
  const url = new URL(env.POPULOUS_URL),
    host = url.hostname,
    port = Number(url.port || 80),
    declaredPorts = (env.PND_QUEUE_PORTS ?? '')
      .split(',')
      .filter(Boolean)
      .map(Number)
  assert.equal(url.protocol, 'http:', 'POPULOUS_URL must use http')
  assert(['127.0.0.1', 'localhost'].includes(host), 'POPULOUS_URL must use loopback')
  assert(Number.isInteger(port) && port > 0 && port < 65536, 'POPULOUS_URL has an invalid port')
  assert.deepEqual(declaredPorts, [port], 'Queue job must declare the POPULOUS_URL port only')
  serverCommand ??= [
    'npm',
    'run',
    'dev',
    '--',
    '--port',
    String(port),
    '--hostname',
    host,
  ]
  argv(serverCommand, 'serverCommand')

  const ownedProcesses = new Map(),
    ownedGroups = new Map(),
    signalHandlers = new Map(),
    interruptErrors = []
  const remember = processRecord => {
    ownedProcesses.set(processRecord.pid, processRecord.identity)
    let group = ownedGroups.get(processRecord.pgid)
    if (!group) {
      group = { pid: processRecord.pgid, members: new Map() }
      ownedGroups.set(group.pid, group)
    }
    group.members.set(processRecord.pid, processRecord.identity)
  }
  const rememberRoot = (child, label) => {
    try {
      assert(child.pid, `${label} did not report a PID`)
      const processRecord = processTable().find(row => row.pid === child.pid)
      assert(processRecord, `${label} PID ${child.pid} disappeared before ownership was recorded`)
      assert.equal(processRecord.pgid, child.pid, `${label} did not start in its owned process group`)
      remember(processRecord)
    } catch (error) {
      interruptErrors.push(error)
      throw error
    }
  }
  const captureDescendants = () => {
    const table = processTable(),
      byPid = new Map(table.map(processRecord => [processRecord.pid, processRecord])),
      confirmed = new Set()
    for (const [pid, processIdentity] of ownedProcesses) {
      const processRecord = byPid.get(pid)
      if (processRecord?.identity === processIdentity) confirmed.add(pid)
    }
    let changed = true
    while (changed) {
      changed = false
      for (const processRecord of table) {
        if (!confirmed.has(processRecord.ppid) || confirmed.has(processRecord.pid)) continue
        remember(processRecord)
        confirmed.add(processRecord.pid)
        changed = true
      }
    }
    for (const pid of confirmed) remember(byPid.get(pid))
  }
  let terminationSignal = null
  const interrupt = signalName => {
    terminationSignal = signalName
    try {
      captureDescendants()
    } catch (error) {
      interruptErrors.push(error)
    }
    for (const group of [...ownedGroups.values()].reverse())
      try {
        signalOwnedGroup(group, 'SIGTERM')
      } catch (error) {
        interruptErrors.push(error)
      }
  }
  for (const signalName of ['SIGTERM', 'SIGINT']) {
    const handler = () => interrupt(signalName)
    signalHandlers.set(signalName, handler)
    process.once(signalName, handler)
  }

  let failure = null
  try {
    let server, serverResult
    try {
      assert(await portFree(port), `Refusing to start over occupied port ${port}`)
      const serverLog = fs.openSync(path.join(env.PND_QUEUE_OUTPUT, 'server.log'), 'wx', 0o600)
      try {
        server = spawn(serverCommand[0], serverCommand.slice(1), {
          cwd,
          detached: true,
          env: { ...env, WRANGLER_LOG_PATH: path.join(env.PND_QUEUE_OUTPUT, 'wrangler.log') },
          stdio: ['ignore', serverLog, serverLog],
        })
      } finally {
        fs.closeSync(serverLog)
      }
      serverResult = childOutcome(server)
      if (!server.pid) {
        const result = await serverResult
        throw result.error ?? new Error('Server did not report a PID')
      }
      rememberRoot(server, 'Server')
      const deadline = Date.now() + readinessTimeoutMs
      let ready = false
      while (Date.now() < deadline) {
        captureDescendants()
        if (terminationSignal) throw new Error(`termination requested: ${terminationSignal}`)
        if (server.exitCode !== null || server.signalCode !== null) {
          const result = await serverResult
          if (result.error) throw result.error
          throw new Error(`server exited with ${result.code ?? result.signal}`)
        }
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(1_000) })
          if (response.ok) {
            ready = true
            break
          }
        } catch {
          // The owned server has not accepted this exact URL yet.
        }
        await sleep(100)
      }
      if (!ready) throw new Error(`server was not ready at ${url}`)
    } catch (error) {
      throw new Error(`Server startup failed: ${error.message}`, { cause: error })
    }

    try {
      const checkerEnv = { ...env, POPULOUS_URL: url.toString() }
      delete checkerEnv.PND_QUEUE_CLEANUP
      const checker = spawn(checkerCommand[0], checkerCommand.slice(1), {
        cwd,
        detached: true,
        env: checkerEnv,
        stdio: checkerStdio,
      })
      const checkerResult = childOutcome(checker)
      if (!checker.pid) {
        const result = await checkerResult
        throw result.error ?? new Error('Checker did not report a PID')
      }
      rememberRoot(checker, 'Checker')
      const checkerEvent = checkerResult.then(result => ({ source: 'checker', result })),
        serverEvent = serverResult.then(result => ({ source: 'server', result }))
      let event
      while (!event) {
        captureDescendants()
        event = await Promise.race([
          checkerEvent,
          serverEvent,
          sleep(250).then(() => null),
        ])
        if (terminationSignal) throw new Error(`termination requested: ${terminationSignal}`)
      }
      captureDescendants()
      if (event.source === 'server') {
        const { result } = event
        if (result.error) throw new Error(`Server exited during checking: ${result.error.message}`)
        throw new Error(`Server exited during checking: ${result.code ?? result.signal}`)
      }
      const { result } = event
      if (terminationSignal) throw new Error(`termination requested: ${terminationSignal}`)
      if (result.error) throw result.error
      if (result.signal) throw new Error(`checker exited from signal ${result.signal}`)
      if (result.code !== 0) throw new Error(`checker exited with code ${result.code}`)
    } catch (error) {
      if (error.message.startsWith('Server exited during checking:')) throw error
      throw new Error(`Checker failed: ${error.message}`, { cause: error })
    }
  } catch (error) {
    failure = error
  } finally {
    let cleanupFailure = null
    try {
      try {
        captureDescendants()
      } catch (error) {
        interruptErrors.push(error)
      }
      const stopped = await Promise.allSettled([...ownedGroups.values()].reverse().map(stopGroup)),
        cleanupErrors = [
          ...interruptErrors,
          ...stopped.filter(result => result.status === 'rejected').map(result => result.reason),
        ]
      for (let i = 0; !(await portFree(port)) && i < 20; i++) await sleep(50)
      if (!(await portFree(port))) cleanupErrors.push(new Error(`Owned port ${port} is still occupied`))
      if (cleanupErrors.length) cleanupFailure = new AggregateError(cleanupErrors, 'Owned resources remain')
      else
        write(env.PND_QUEUE_CLEANUP, {
          jobId: env.PND_QUEUE_JOB_ID,
          resourcesReleased: true,
          releasedAt: new Date().toISOString(),
          processes: [...ownedGroups.values()].map(group => ({
            pid: group.pid,
            group: true,
            members: [...group.members].map(([pid, processIdentity]) => ({
              pid,
              identity: processIdentity,
            })),
          })),
        })
    } catch (cleanupError) {
      cleanupFailure = cleanupError
    }
    if (cleanupFailure)
      failure = failure
        ? new AggregateError([failure, cleanupFailure], 'Browser check and cleanup both failed')
        : cleanupFailure
    for (const [signalName, handler] of signalHandlers)
      process.removeListener(signalName, handler)
  }
  if (failure) throw failure
}
function kick(dir) {
  const log = fs.openSync(path.join(dir, 'controller.log'), 'a', 0o600)
  try {
    const child = spawn(process.execPath, [script, 'drain', '--dir', dir], {
      detached: true,
      stdio: ['ignore', log, log],
    })
    child.unref()
  } finally {
    fs.closeSync(log)
  }
}
export function submit(spec, dir = queueDirectory(spec.cwd)) {
  assert(process.platform !== 'win32', 'Queue requires POSIX process groups')
  validate(spec)
  // A queued job must not inherit another submitter's Node/CLI lookup paths.
  spec = { ...spec, env: { PATH: process.env.PATH, ...spec.env } }
  initialize(dir)
  const inputs = fingerprint(spec),
    lock = path.join(dir, 'submission.lock'),
    deadline = Date.now() + 5000,
    sleeper = new Int32Array(new SharedArrayBuffer(4))
  let fd
  while (fd === undefined) {
    try {
      fd = fs.openSync(lock, 'wx', 0o600)
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      assert(Date.now() < deadline, 'Submission lock busy; inspect its owner before retrying')
      Atomics.wait(sleeper, 0, 0, 20)
    }
  }
  let job
  try {
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, identity: identity(process.pid) }))
    // Serialize only admission: a lost client must not enqueue the same active work twice.
    job = ordered(dir).find(
      previous =>
        ['queued', 'starting', 'running', 'cleanup-blocked'].includes(previous.status) &&
        !exists(path.join(previous.output, 'cancel')) &&
        isDeepStrictEqual(previous.spec, spec)
    )
    if (job)
      assert.deepEqual(
        inputs,
        job.fingerprint,
        `Unfinished job ${job.id} has different inputs; wait for it or cancel it before resubmitting`
      )
    else job = enqueue(spec, inputs, dir)
  } finally {
    fs.closeSync(fd)
    fs.unlinkSync(lock)
  }
  kick(dir)
  return job
}
function enqueue(spec, inputs, dir) {
  const id = randomUUID(),
    output = path.join(dir, 'jobs', id)
  fs.mkdirSync(output)
  const job = {
    id,
    spec,
    fingerprint: inputs,
    status: 'queued',
    submittedAt: new Date().toISOString(),
    output,
  }
  write(jobFile(dir, id), job)
  // Keep one append per admitted job; controller startup remains outside the admission lock.
  fs.appendFileSync(path.join(dir, 'order'), id + '\n', { mode: 0o600 })
  return job
}
async function cleaned(job) {
  if (job.pid && alive(job.pid, true)) return 'Command process group is still alive'
  for (const port of job.spec.ports)
    if (!(await portFree(port))) return `Port ${port} is still occupied`
  if (job.spec.cleanup === 'receipt') {
    const file = path.join(job.output, 'cleanup.json')
    if (!exists(file)) return 'Runner cleanup receipt is missing'
    const r = json(file)
    if (r.jobId !== job.id || r.resourcesReleased !== true || !Array.isArray(r.processes))
      return 'Invalid or stale cleanup receipt'
    if (
      !Number.isFinite(Date.parse(r.releasedAt)) ||
      Date.parse(r.releasedAt) < Date.parse(job.startedAt)
    )
      return 'Invalid cleanup time'
    for (const p of r.processes) {
      if (!Number.isInteger(p.pid) || p.pid < 2 || typeof p.group !== 'boolean')
        return 'Invalid owned process record'
      if (alive(p.pid, p.group)) return `Reported owned process/group ${p.pid} is still alive`
    }
  }
  return null
}
async function execute(job, dir) {
  const file = jobFile(dir, job.id),
    cancel = path.join(job.output, 'cancel')
  job.startedAt = new Date().toISOString()
  job.queueWaitMs = Date.parse(job.startedAt) - Date.parse(job.submittedAt)
  if (exists(cancel)) {
    job.status = 'cancelled'
    job.finishedAt = job.startedAt
    write(file, job)
    return
  }
  try {
    assert.deepEqual(
      fingerprint(job.spec),
      job.fingerprint,
      'Queued source changed; resubmit tested input'
    )
    for (const port of job.spec.ports)
      assert(await portFree(port), `Port ${port} is occupied; nothing launched`)
  } catch (error) {
    job.status = 'blocked'
    job.reason = error.message
    job.finishedAt = new Date().toISOString()
    write(file, job)
    return
  }
  job.status = 'starting'
  write(file, job)
  const log = fs.openSync(path.join(job.output, 'command.log'), 'wx', 0o600)
  let child,
    done = false,
    deadline,
    stopAt = null
  try {
    deadline = Date.now() + job.spec.timeoutMs
    child = spawn(job.spec.command[0], job.spec.command.slice(1), {
      cwd: job.spec.cwd,
      detached: true,
      stdio: ['ignore', log, log],
      env: {
        ...process.env,
        ...job.spec.env,
        PND_QUEUE_JOB_ID: job.id,
        PND_QUEUE_OUTPUT: job.output,
        PND_QUEUE_DEADLINE: new Date(deadline).toISOString(),
        PND_QUEUE_CLEANUP: path.join(job.output, 'cleanup.json'),
        PND_QUEUE_PORTS: job.spec.ports.join(','),
      },
    })
    child.on('error', error => {
      job.error = error.message
      done = true
    })
    child.on('exit', (code, signal) => {
      job.exitCode = code
      job.signal = signal
      done = true
    })
    job.pid = child.pid
    job.pidIdentity = child.pid ? identity(child.pid) : null
    job.status = 'running'
    write(file, job)
    while (!done) {
      if (!stopAt && (Date.now() >= deadline || exists(cancel))) {
        job.stopReason = exists(cancel) ? 'cancelled' : 'timed-out'
        stopAt = Date.now()
        if (job.pidIdentity && identity(child.pid) === job.pidIdentity) signal(child.pid, 'SIGTERM')
      }
      if (stopAt && Date.now() - stopAt >= 5000) {
        if (job.pidIdentity && identity(child.pid) === job.pidIdentity) signal(child.pid, 'SIGKILL')
        break
      }
      await sleep(100)
    }
    // Give the OS time to reap an exited group; this is not permission to reuse a live resource.
    for (let i = 0; job.pid && alive(job.pid, true) && i < 20; i++) await sleep(50)
    const reason = job.error && !job.pid ? null : await cleaned(job)
    job.finishedAt = new Date().toISOString()
    job.executionMs = Date.parse(job.finishedAt) - Date.parse(job.startedAt)
    job.status = reason
      ? 'cleanup-blocked'
      : (job.stopReason ?? (job.exitCode === 0 ? 'passed' : 'failed'))
    if (reason) {
      job.reason = reason
      write(path.join(dir, 'pause.json'), { jobId: job.id, reason })
    }
    write(file, job)
  } finally {
    fs.closeSync(log)
  }
}
export async function drain(dir) {
  initialize(dir)
  if (exists(path.join(dir, 'recovery.lock'))) return
  const lock = path.join(dir, 'controller.lock')
  try {
    fs.mkdirSync(lock)
  } catch (e) {
    if (e.code === 'EEXIST') return
    throw e
  }
  const token = randomUUID()
  write(path.join(lock, 'owner.json'), { pid: process.pid, identity: identity(process.pid), token })
  // A crash deliberately leaves the lock and active job. Recovery never expires a live owner.
  let cleanExit = false
  try {
    while (!exists(path.join(dir, 'pause.json')) && !exists(path.join(dir, 'recovery.lock'))) {
      const jobs = ordered(dir)
      assert(
        !jobs.some(j => ['starting', 'running', 'cleanup-blocked'].includes(j.status)),
        'Unresolved prior job; use recover after verified cleanup'
      )
      const job = jobs.find(j => j.status === 'queued')
      if (!job) break
      await execute(job, dir)
    }
    cleanExit = true
  } finally {
    if (cleanExit && json(path.join(lock, 'owner.json')).token === token) {
      fs.unlinkSync(path.join(lock, 'owner.json'))
      fs.rmdirSync(lock)
      // Close the enqueue/idle-exit race: submissions during lock release still get a runner.
      if (
        !exists(path.join(dir, 'pause.json')) &&
        !exists(path.join(dir, 'recovery.lock')) &&
        ordered(dir).some(j => j.status === 'queued')
      )
        kick(dir)
    }
  }
}
export async function recover(dir) {
  const recovery = path.join(dir, 'recovery.lock')
  const fd = fs.openSync(recovery, 'wx', 0o600)
  fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, identity: identity(process.pid) }))
  fs.closeSync(fd)
  try {
    await recoverLocked(dir)
  } finally {
    fs.unlinkSync(recovery)
  }
  kick(dir)
}
async function recoverLocked(dir) {
  const lock = path.join(dir, 'controller.lock'),
    owner = path.join(lock, 'owner.json')
  let previousOwner
  if (exists(lock)) {
    assert(
      exists(owner),
      'Incomplete controller identity; inspect manually, do not expire the lock'
    )
    const r = json(owner)
    assert(identity(r.pid) !== r.identity, 'Controller is still alive')
    previousOwner = r.token
  }
  for (const job of ordered(dir).filter(j =>
    ['starting', 'running', 'cleanup-blocked'].includes(j.status)
  )) {
    assert(job.pid, 'Launch interrupted before PID recorded; cleanup cannot be inferred')
    const reason = await cleaned(job)
    assert(!reason, reason)
    job.status = 'interrupted'
    job.finishedAt = new Date().toISOString()
    write(jobFile(dir, job.id), job)
  }
  if (previousOwner) {
    assert(json(owner).token === previousOwner, 'Controller changed during recovery')
    fs.unlinkSync(owner)
    fs.rmdirSync(lock)
  }
  fs.rmSync(path.join(dir, 'pause.json'), { force: true })
}
export async function waitForResult(dir, id) {
  const started = Date.now()
  while (true) {
    const job = json(jobFile(dir, id))
    if (!['queued', 'starting', 'running'].includes(job.status)) return job
    // Lock release races readers during ordinary idle handoff.
    const readOptional = file => {
      try {
        return json(file)
      } catch (error) {
        if (error.code === 'ENOENT') return null
        throw error
      }
    }
    const paused = readOptional(path.join(dir, 'pause.json')),
      owner = readOptional(path.join(dir, 'controller.lock', 'owner.json'))
    const reason = paused
      ? paused.reason || 'Queue paused'
      : owner && !alive(owner.pid)
        ? 'Controller stopped; verified recovery required'
        : !owner && Date.now() - started > 5000
          ? 'Controller unavailable; inspect status before recovery'
          : null
    if (reason) return { ...job, status: 'deferred', reason }
    await sleep(250)
  }
}
async function main() {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'supervise') {
    assert(args.length, 'supervise requires a checker path')
    await superviseBrowserCheck({ checkerCommand: [process.execPath, ...args] })
    return
  }
  const index = args.indexOf('--dir')
  const dir = index === -1 ? queueDirectory() : path.resolve(args[index + 1])
  if (index !== -1) args.splice(index, 2)
  initialize(dir)
  if (command === 'run' || command === 'wait') {
    const id = command === 'run' ? submit(json(path.resolve(args[0])), dir).id : args[0]
    if (command === 'run')
      console.error(JSON.stringify({ id, result: jobFile(dir, id), resume: `wait ${id}` }))
    const job = await waitForResult(dir, id)
    console.log(
      JSON.stringify({
        id,
        status: job.status,
        reason: job.reason,
        result: jobFile(dir, id),
        queueWaitMs: job.queueWaitMs,
        executionMs: job.executionMs,
      })
    )
    process.exitCode = job.status === 'passed' ? 0 : job.status === 'deferred' ? 2 : 1
  } else if (command === 'submit')
    console.log(JSON.stringify(submit(json(path.resolve(args[0])), dir), null, 2))
  else if (command === 'drain') await drain(dir)
  else if (command === 'status')
    console.log(
      JSON.stringify(
        {
          dir,
          paused: exists(path.join(dir, 'pause.json')) ? json(path.join(dir, 'pause.json')) : null,
          controller: exists(path.join(dir, 'controller.lock', 'owner.json'))
            ? json(path.join(dir, 'controller.lock', 'owner.json'))
            : null,
          jobs: ordered(dir).map(
            ({ id, spec, status, reason, output, queueWaitMs, executionMs }) => ({
              id,
              label: spec.label,
              owner: spec.owner,
              status,
              reason,
              output,
              queueWaitMs,
              executionMs,
            })
          ),
        },
        null,
        2
      )
    )
  else if (command === 'cancel') {
    const job = json(jobFile(dir, args[0]))
    fs.writeFileSync(path.join(job.output, 'cancel'), 'cancel requested\n')
    kick(dir)
  } else if (command === 'pause')
    write(path.join(dir, 'pause.json'), {
      reason: args.join(' ') || 'Manual pause; active job continues',
    })
  else if (command === 'resume' || command === 'recover') await recover(dir)
  else
    throw Error(
      'Usage: performance-queue.mjs run SPEC | submit SPEC | wait ID | status | cancel ID | pause REASON | resume | recover [--dir PATH] | supervise CHECKER [ARG...]'
    )
}
if (process.argv[1] && path.resolve(process.argv[1]) === script)
  main().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
