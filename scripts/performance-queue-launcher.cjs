// Frozen into each admitted job's argv, so even an older drainer enters this
// boundary. It is not a second controller and never acquires/releases queue locks.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')
const envelope = JSON.parse(process.argv[1])
const { id, output, command, ports, protocol } = envelope
const cleanup = path.join(output, 'cleanup.json')
const receipt = path.join(output, 'launch.json')
let controller, child, interrupted

function rejectBeforeLaunch(error) {
  const reason = `Queue payload not launched: ${error.message}`
  fs.writeFileSync(receipt, JSON.stringify({
    status: 'rejected', reason, command, ports, controller,
  }) + '\n', { flag: 'wx', mode: 0o600 })
  // No payload or descendants have been created. This is a real prelaunch
  // cleanup receipt, not permission to infer cleanup of any existing process.
  fs.writeFileSync(cleanup, JSON.stringify({
    jobId: id, resourcesReleased: true, releasedAt: new Date().toISOString(), processes: [],
  }) + '\n', { flag: 'wx', mode: 0o600 })
  console.error(reason)
  process.exitCode = 1
}

// The controller signals our entire process group. Stay alive to reap the
// payload; forwarding also covers a signal received just before its spawn.
for (const name of ['SIGTERM', 'SIGINT'])
  process.on(name, () => {
    interrupted ??= name
    if (child) child.kill(name)
  })

try {
  assert.equal(process.env.PND_QUEUE_JOB_ID, id, 'Queue job identity differs')
  assert.equal(process.env.PND_QUEUE_OUTPUT, output, 'Queue output differs')
  assert.equal(process.env.PND_QUEUE_CLEANUP, cleanup, 'Queue cleanup path differs')
  controller = JSON.parse(fs.readFileSync(path.join(output, '../../controller.lock/owner.json'), 'utf8'))
  assert.equal(controller.pid, process.ppid, 'Queue controller is not the launching parent')
  const parent = spawnSync('ps', ['-p', String(process.ppid), '-o', 'lstart='], { encoding: 'utf8' })
  assert(parent.status === 0 && parent.stdout.trim() === controller.identity, 'Queue controller identity differs')
  assert.equal(controller.protocol, protocol, 'Unsupported queue controller protocol')
  assert.match(controller.sourceSha256 ?? '', /^[a-f0-9]{64}$/, 'Queue controller source is missing')
  assert.equal(process.env.PND_QUEUE_PORTS, ports.join(','), 'Queue declared-port environment differs')
  assert(!interrupted, 'Queue payload cancelled before launch')
} catch (error) {
  rejectBeforeLaunch(error)
  process.exit(1)
}

child = spawn(command[0], command.slice(1), { stdio: 'inherit', detached: false })
child.on('spawn', () => fs.writeFileSync(receipt, JSON.stringify({
  status: 'launched', command, ports, controller, pid: child.pid,
}) + '\n', { flag: 'wx', mode: 0o600 }))
child.on('error', error => {
  if (!child.pid) return rejectBeforeLaunch(error)
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code, signal) => {
  if (signal) {
    process.removeAllListeners(signal)
    process.kill(process.pid, signal)
  } else process.exitCode = code
})
