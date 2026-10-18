import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { drain, submit } from '../scripts/performance-queue.mjs'

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value))
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const hash = data => createHash('sha256').update(data).digest('hex')
const identity = pid => execFileSync('ps', ['-p', String(pid), '-o', 'lstart='], { encoding: 'utf8' }).trim()
const legacySource = fs.readFileSync(new URL('./fixtures/performance-queue-6889ab2.mjs.txt', import.meta.url))
// Exact pre-supervisor controller from 6889ab2beab705edd46749f8c448b7cead3e079b.
assert.equal(hash(legacySource), '92e51c89d5c9456d13ae2a5d02cfb74eedb1bef7ce5b4e59e66963a4ca721a1c')

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pnd-queue-protocol-')),
    repo = path.join(root, 'repo'), dir = path.join(root, 'queue'),
    events = path.join(root, 'events.jsonl'), legacy = path.join(root, 'legacy.mjs')
  fs.mkdirSync(repo)
  fs.mkdirSync(dir)
  fs.writeFileSync(legacy, legacySource)
  fs.writeFileSync(path.join(repo, 'payload.cjs'), `
const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const event=kind=>fs.appendFileSync(process.env.EVENTS,JSON.stringify({kind,pid:process.pid,pgid:Number(execFileSync('ps',['-p',String(process.pid),'-o','pgid='],{encoding:'utf8'}).trim()),ports:process.env.PND_QUEUE_PORTS,argv:process.argv.slice(2)})+'\\n');
const cleanup=()=>fs.writeFileSync(process.env.PND_QUEUE_CLEANUP,JSON.stringify({jobId:process.env.PND_QUEUE_JOB_ID,resourcesReleased:true,releasedAt:new Date().toISOString(),processes:[]}));
event('start');
console.log('payload stdout');console.error('payload stderr');
if(process.argv[2]==='missing')process.exit(0);
if(process.argv[2]==='wait'){process.on('SIGTERM',()=>{event('stop');cleanup();process.exit(0)});setInterval(()=>{},1000)}
else {cleanup();event('end')}
`)
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { stdio: 'pipe' })
  git('init', '-q'); git('add', '.')
  git('-c', 'user.name=Queue protocol test', '-c', 'user.email=queue@example.invalid', 'commit', '-qm', 'fixture')
  fs.writeFileSync(path.join(dir, 'pause.json'), '{}')
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const spec = (extra = {}) => ({
    owner: 'queue-protocol-test', label: 'payload', cwd: repo,
    command: [process.execPath, 'payload.cjs', 'ok'], inputs: ['payload.cjs'],
    ports: [], cleanup: 'receipt', timeoutMs: 3000, env: { EVENTS: events }, ...extra,
  })
  const job = id => read(path.join(dir, 'jobs', `${id}.json`))
  const eventList = () => fs.existsSync(events)
    ? fs.readFileSync(events, 'utf8').trim().split('\n').map(JSON.parse) : []
  return { root, repo, dir, events, legacy, spec, job, eventList }
}

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return
    await wait(20)
  }
  assert.fail('Timed out waiting for owned payload')
}

test('legacy controller rejects a current submission before payload side effects and releases cleanly', t => {
  const f = fixture(t), spec = f.spec(), job = submit(spec, f.dir)
  assert.equal(submit(spec, f.dir).id, job.id)
  fs.unlinkSync(path.join(f.dir, 'pause.json'))
  const env = { ...process.env }; delete env.PND_QUEUE_PORTS
  const result = spawnSync(process.execPath, [f.legacy, 'drain', '--dir', f.dir], {
    env, encoding: 'utf8', timeout: 5000,
  })
  assert.equal(result.error, undefined)
  assert.equal(result.status, 0, result.stderr)
  const completed = f.job(job.id)
  assert.equal(completed.status, 'failed')
  assert.equal(completed.exitCode, 1)
  assert.deepEqual(job.requestedSpec.command, spec.command)
  assert.equal(job.executionEnvelope.version, 1)
  assert.equal(job.executionEnvelope.controllerProtocol, 1)
  assert.equal(job.executionEnvelope.launcherSha256, hash(job.spec.command[3]))
  assert.notDeepEqual(job.spec.command, spec.command)
  const launch = read(path.join(job.output, 'launch.json')),
    cleanup = read(path.join(job.output, 'cleanup.json'))
  assert.equal(launch.status, 'rejected')
  assert.match(launch.reason, /Unsupported queue controller protocol/)
  assert.deepEqual(launch.command, spec.command)
  assert.deepEqual(completed.requestedSpec, job.requestedSpec)
  assert.deepEqual(f.eventList(), [])
  assert.equal(cleanup.jobId, job.id)
  assert.equal(cleanup.resourcesReleased, true)
  assert.deepEqual(cleanup.processes, [])
  assert.equal(fs.existsSync(path.join(f.dir, 'controller.lock')), false)
})

test('current controller runs guarded and historical jobs in FIFO order without changing payload receipts', async t => {
  const f = fixture(t), a = submit(f.spec(), f.dir),
    b = submit(f.spec({ label: 'old unwrapped job' }), f.dir)
  // Historical records have no envelope. A current controller still handles them.
  const historical = f.job(b.id)
  historical.spec = historical.requestedSpec
  delete historical.requestedSpec
  delete historical.executionEnvelope
  write(path.join(f.dir, 'jobs', `${b.id}.json`), historical)
  assert.equal(submit(f.spec({ label: 'old unwrapped job' }), f.dir).id, b.id)
  fs.unlinkSync(path.join(f.dir, 'pause.json'))
  await drain(f.dir)
  assert.equal(f.job(a.id).status, 'passed')
  assert.equal(f.job(b.id).status, 'passed')
  const launch = read(path.join(a.output, 'launch.json'))
  assert.equal(launch.status, 'launched')
  assert.deepEqual(launch.command, a.requestedSpec.command)
  assert.equal(launch.controller.protocol, 1)
  assert.equal(launch.controller.sourceSha256,
    hash(fs.readFileSync(new URL('../scripts/performance-queue.mjs', import.meta.url))))
  const events = f.eventList()
  assert.deepEqual(events.map(event => event.kind), ['start', 'end', 'start', 'end'])
  assert.equal(events[0].pgid, f.job(a.id).pid)
  assert.notEqual(events[0].pid, events[0].pgid)
  assert(events.every(event => event.ports === ''))
  assert.deepEqual(read(path.join(a.output, 'cleanup.json')).processes, [])
  assert.deepEqual(events[0].argv, a.requestedSpec.command.slice(2))
  const log = fs.readFileSync(path.join(a.output, 'command.log'), 'utf8')
  assert.match(log, /payload stdout/)
  assert.match(log, /payload stderr/)
  assert.equal(fs.existsSync(path.join(b.output, 'launch.json')), false)
  assert.equal(fs.existsSync(path.join(f.dir, 'controller.lock')), false)
})

test('legacy retry matching is not upgraded; waiting by original ID cannot return a duplicate success', t => {
  const f = fixture(t), spec = f.spec(), guarded = submit(spec, f.dir)
  // Exercise the exact legacy admission code with only its automatic kick
  // replaced locally. This isolates retry matching without delayed idle runners.
  const admission = `
import assert from 'node:assert/strict';
import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';
const [legacy,dir,spec]=process.argv.slice(1);process.argv[1]='legacy-admission-fixture';
let kicks=0;cp.spawn=(command,args)=>{assert.equal(command,process.execPath);assert.deepEqual(args,[legacy,'drain','--dir',dir]);kicks++;return {unref(){}}};
syncBuiltinESMExports();
const {submit}=await import(legacy);const job=submit(JSON.parse(spec),dir);
assert.equal(kicks,1);console.log(JSON.stringify(job));
`
  const duplicate = JSON.parse(execFileSync(process.execPath,
    ['--input-type=module', '-e', admission, f.legacy, f.dir, JSON.stringify(spec)], { encoding: 'utf8' }))
  assert.notEqual(duplicate.id, guarded.id)
  assert.equal(duplicate.requestedSpec, undefined)
  assert.deepEqual(duplicate.spec, guarded.requestedSpec)
  assert.equal(submit(spec, f.dir).id, guarded.id)
  assert.deepEqual(fs.readFileSync(path.join(f.dir, 'order'), 'utf8').trim().split('\n'),
    [guarded.id, duplicate.id])
  fs.unlinkSync(path.join(f.dir, 'pause.json'))
  const env = { ...process.env }; delete env.PND_QUEUE_PORTS
  const result = spawnSync(process.execPath, [f.legacy, 'drain', '--dir', f.dir],
    { env, encoding: 'utf8', timeout: 5000 })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(f.job(guarded.id).status, 'failed')
  assert.equal(f.job(duplicate.id).status, 'passed')
  assert.deepEqual(f.eventList().map(event => event.kind), ['start', 'end'])
  for (const [id, status, code] of [[guarded.id, 'failed', 1], [duplicate.id, 'passed', 0]]) {
    const waited = spawnSync(process.execPath, [f.legacy, 'wait', id, '--dir', f.dir],
      { encoding: 'utf8', timeout: 3000 })
    assert.equal(waited.status, code, waited.stderr)
    assert.equal(JSON.parse(waited.stdout).id, id)
    assert.equal(JSON.parse(waited.stdout).status, status)
  }
  assert.equal(fs.existsSync(path.join(f.dir, 'controller.lock')), false)
})

test('guard validates empty and nonempty declared ports and parent capability without opening sockets', async t => {
  for (const ports of [[], [4343], [4343, 4344]]) {
    for (const fault of ['none', 'missing ports', 'wrong ports', 'missing protocol', 'wrong protocol', 'missing source', 'wrong parent', 'wrong identity', 'wrong output', 'wrong cleanup']) {
      await t.test(`${JSON.stringify(ports)} / ${fault}`, t => {
        const f = fixture(t), job = submit(f.spec({ ports }), f.dir),
          lock = path.join(f.dir, 'controller.lock'),
          owner = { pid: process.pid, identity: identity(process.pid), protocol: 1, sourceSha256: 'a'.repeat(64) }
        if (fault === 'missing protocol') delete owner.protocol
        if (fault === 'wrong protocol') owner.protocol = 99
        if (fault === 'missing source') delete owner.sourceSha256
        if (fault === 'wrong parent') owner.pid++
        if (fault === 'wrong identity') owner.identity = 'wrong identity'
        fs.mkdirSync(lock); write(path.join(lock, 'owner.json'), owner)
        const env = {
          ...process.env, ...job.requestedSpec.env, PND_QUEUE_JOB_ID: job.id,
          PND_QUEUE_OUTPUT: job.output, PND_QUEUE_CLEANUP: path.join(job.output, 'cleanup.json'),
          PND_QUEUE_PORTS: ports.join(','),
        }
        if (fault === 'missing ports') delete env.PND_QUEUE_PORTS
        if (fault === 'wrong ports') env.PND_QUEUE_PORTS = '9999'
        if (fault === 'wrong output') env.PND_QUEUE_OUTPUT = path.join(f.root, 'wrong-output')
        if (fault === 'wrong cleanup') env.PND_QUEUE_CLEANUP = path.join(f.root, 'wrong-cleanup')
        // Invoke the frozen admission envelope directly: tests do not claim real
        // port admission and never bind any port or launch a browser/server.
        const result = spawnSync(job.spec.command[0], job.spec.command.slice(1), {
          cwd: f.repo, env, encoding: 'utf8', timeout: 3000,
        })
        assert.equal(result.error, undefined)
        assert.equal(result.status, fault === 'none' ? 0 : 1, result.stderr)
        const launch = read(path.join(job.output, 'launch.json')),
          cleanup = read(path.join(job.output, 'cleanup.json'))
        assert.equal(launch.status, fault === 'none' ? 'launched' : 'rejected')
        assert.deepEqual(launch.command, job.requestedSpec.command)
        assert.deepEqual(launch.ports, ports)
        assert.equal(f.eventList().length, fault === 'none' ? 2 : 0)
        if (fault === 'none') assert(f.eventList().every(event => event.ports === ports.join(',')))
        assert.equal(cleanup.jobId, job.id)
        assert.equal(cleanup.resourcesReleased, true)
        assert.deepEqual(cleanup.processes, [])
        assert.deepEqual(read(path.join(lock, 'owner.json')), owner)
        assert.equal(fs.existsSync(path.join(f.root, 'wrong-output')), false)
        assert.equal(fs.existsSync(path.join(f.root, 'wrong-cleanup')), false)
      })
    }
  }
})

test('guard never supplies a cleanup receipt after the actual payload has launched', async t => {
  const f = fixture(t), a = submit(f.spec({ command: [process.execPath, 'payload.cjs', 'missing'] }), f.dir),
    b = submit(f.spec({ label: 'must remain queued' }), f.dir)
  fs.unlinkSync(path.join(f.dir, 'pause.json'))
  await drain(f.dir)
  assert.equal(f.job(a.id).status, 'cleanup-blocked')
  assert.match(f.job(a.id).reason, /cleanup receipt is missing/)
  assert.equal(f.job(b.id).status, 'queued')
  assert.equal(read(path.join(a.output, 'launch.json')).status, 'launched')
  assert.equal(fs.existsSync(path.join(a.output, 'cleanup.json')), false)
  assert.deepEqual(f.eventList().map(event => event.kind), ['start'])
})

test('a missing payload executable remains a failed prelaunch with verified empty cleanup', async t => {
  const f = fixture(t), a = submit(f.spec({ command: ['/pnd-missing-queue-payload'] }), f.dir),
    b = submit(f.spec({ label: 'after spawn failure' }), f.dir)
  fs.unlinkSync(path.join(f.dir, 'pause.json'))
  await drain(f.dir)
  assert.equal(f.job(a.id).status, 'failed')
  assert.equal(f.job(b.id).status, 'passed')
  const launch = read(path.join(a.output, 'launch.json')),
    cleanup = read(path.join(a.output, 'cleanup.json'))
  assert.equal(launch.status, 'rejected')
  assert.match(launch.reason, /ENOENT/)
  assert.deepEqual(launch.command, ['/pnd-missing-queue-payload'])
  assert.equal(cleanup.resourcesReleased, true)
  assert.deepEqual(cleanup.processes, [])
  assert.deepEqual(f.eventList().map(event => event.kind), ['start', 'end'])
})

test('guarded payload cancellation reaps the same process group before the next FIFO job', async t => {
  const f = fixture(t), a = submit(f.spec({ command: [process.execPath, 'payload.cjs', 'wait'] }), f.dir),
    b = submit(f.spec({ label: 'after cancellation' }), f.dir)
  fs.unlinkSync(path.join(f.dir, 'pause.json'))
  const finished = drain(f.dir)
  try {
    await until(() => f.eventList().length === 1)
    fs.writeFileSync(path.join(a.output, 'cancel'), '')
  } finally {
    await finished
  }
  assert.equal(f.job(a.id).status, 'cancelled')
  assert.equal(f.job(b.id).status, 'passed')
  assert.deepEqual(f.eventList().map(event => event.kind), ['start', 'stop', 'start', 'end'])
  const first = f.eventList()[0]
  assert.equal(first.pgid, f.job(a.id).pid)
  assert.throws(() => process.kill(-first.pgid, 0), { code: 'ESRCH' })
  assert.equal(read(path.join(a.output, 'cleanup.json')).resourcesReleased, true)
  assert.equal(fs.existsSync(path.join(f.dir, 'controller.lock')), false)
})
