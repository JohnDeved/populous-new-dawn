// Frozen into each admitted job's argv, so even an older drainer enters this
// boundary. It is not a second controller and never acquires/releases queue locks.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { spawnSync } = require('node:child_process')
const envelope = JSON.parse(process.argv[1])
const { id, output, command, ports, protocol, controllerSourceSha256, payloadEnvironmentSha256 } = envelope
const cleanup = path.join(output, 'cleanup.json')
const receipt = path.join(output, 'launch.json')
let controller, receiptWritten = false

function saveReceipt(value) {
  fs.writeFileSync(receipt, JSON.stringify(value) + '\n', {
    flag: receiptWritten ? 'w' : 'wx', mode: 0o600,
  })
  receiptWritten = true
}

// execve does not search PATH. Resolve it using the payload's environment, not
// the launcher's, without starting another process or interpolating a shell.
function executable(file, env) {
  const candidates = file.includes('/') ? [path.resolve(file)]
    : (env.PATH ?? '/usr/bin:/bin').split(':').map(dir => path.resolve(dir || '.', file))
  let denied
  for (const candidate of candidates) {
    try {
      assert(fs.statSync(candidate).isFile(), `Executable is not a regular file: ${candidate}`)
      fs.accessSync(candidate, fs.constants.X_OK)
      return candidate
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error.code)) denied = error
    }
  }
  throw denied ?? new Error(`ENOENT: executable not found: ${file}`)
}

function rejectBeforeLaunch(error) {
  const reason = `Queue payload not launched: ${error.message}`
  saveReceipt({
    status: 'rejected', reason, command, ports, controller,
  })
  // No payload or descendants have been created. This is a real prelaunch
  // cleanup receipt, not permission to infer cleanup of any existing process.
  fs.writeFileSync(cleanup, JSON.stringify({
    jobId: id, resourcesReleased: true, releasedAt: new Date().toISOString(), processes: [],
  }) + '\n', { flag: 'wx', mode: 0o600 })
  fs.writeFileSync(2, reason + '\n')
  process.exit(1)
}

try {
  assert.equal(process.env.PND_QUEUE_JOB_ID, id, 'Queue job identity differs')
  assert.equal(process.env.PND_QUEUE_OUTPUT, output, 'Queue output differs')
  assert.equal(process.env.PND_QUEUE_CLEANUP, cleanup, 'Queue cleanup path differs')
  controller = JSON.parse(fs.readFileSync(path.join(output, '../../controller.lock/owner.json'), 'utf8'))
  assert.equal(controller.pid, process.ppid, 'Queue controller is not the launching parent')
  const parent = spawnSync('ps', ['-p', String(process.ppid), '-o', 'lstart='], { encoding: 'utf8' })
  assert(parent.status === 0 && parent.stdout.trim() === controller.identity, 'Queue controller identity differs')
  assert.equal(controller.protocol, protocol, 'Unsupported queue controller protocol')
  assert.equal(controller.sourceSha256, controllerSourceSha256, 'Unsupported queue controller source')
  assert.equal(process.env.PND_QUEUE_PORTS, ports.join(','), 'Queue declared-port environment differs')
  const job = JSON.parse(fs.readFileSync(`${output}.json`, 'utf8'))
  const payloadEnv = { ...job.requestedSpec.env, NODE_OPTIONS: job.executionEnvelope.nodeOptions }
  assert.equal(createHash('sha256').update(JSON.stringify(payloadEnv)).digest('hex'),
    payloadEnvironmentSha256, 'Queue payload environment changed after submission')
  assert(typeof process.execve === 'function', 'Guarded queue payloads require process.execve on a supported POSIX Node runtime')
  const env = { ...process.env, ...payloadEnv }
  // Match the controller's original precedence: caller env cannot replace these.
  for (const key of ['JOB_ID', 'OUTPUT', 'DEADLINE', 'CLEANUP', 'PORTS']) {
    const name = `PND_QUEUE_${key}`
    if (process.env[name] === undefined) delete env[name]
    else env[name] = process.env[name]
  }
  assert(Object.entries(env).every(([key, value]) =>
    !key.includes('\0') && typeof value === 'string' && !value.includes('\0')), 'Invalid payload environment')
  const file = executable(command[0], env)
  // This is a synchronous pre-exec record, NOT proof that exec succeeded. Node
  // 24 can abort on a syscall error: no cleanup receipt then means fail-closed.
  saveReceipt({ status: 'handoff', command, ports, controller, pid: process.pid, executable: file })
  // Replace this process rather than adding a grandchild. The controller retains
  // its original child PID/group and can reap it even after group-wide SIGKILL.
  // No exit/cleanup hooks run after successful exec; the payload owns its receipt.
  process.execve(file, command, env)
  throw new Error('process.execve unexpectedly returned')
} catch (error) {
  rejectBeforeLaunch(error)
}
