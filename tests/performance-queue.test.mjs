import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import net from 'node:net'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  queueDirectory,
  submit,
  recover,
  superviseBrowserCheck,
  waitForResult,
} from '../scripts/performance-queue.mjs'

const cli = fileURLToPath(new URL('../scripts/performance-queue.mjs', import.meta.url))
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const fixtureSource = `
const fs = require('node:fs'), { spawn } = require('node:child_process');
const mode = process.argv[2], id = process.env.PND_QUEUE_JOB_ID;
const log = text => fs.appendFileSync(process.env.EVENTS, id+' '+text+'\\n');
const release = () => fs.writeFileSync(process.env.PND_QUEUE_CLEANUP, JSON.stringify({jobId:id,resourcesReleased:true,releasedAt:new Date().toISOString(),processes:[]}));
log('start');
if(mode === 'missing') process.exit(0);
if(mode === 'detached') {
 const child=spawn(process.execPath,['-e','setTimeout(()=>{},30000)'],{detached:true,stdio:'ignore'});child.unref();
 fs.writeFileSync(process.env.PND_QUEUE_CLEANUP,JSON.stringify({jobId:id,resourcesReleased:true,releasedAt:new Date().toISOString(),processes:[{pid:child.pid,group:true}]}));
 process.exit(0);
}
process.on('SIGTERM',()=>{release();log('stop');process.exit(0)});
setTimeout(()=>{release();log('end');process.exit(mode==='fail'?2:0)},mode==='wait'?30000:160);
`
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pnd-queue-')),
    repo = path.join(root, 'repo'),
    dir = path.join(root, 'queue')
  fs.mkdirSync(repo)
  fs.mkdirSync(dir)
  fs.writeFileSync(path.join(repo, 'fixture.cjs'), fixtureSource)
  const git = (...a) =>
    execFileSync('git', ['-C', repo, ...a], { stdio: 'pipe' })
      .toString()
      .trim()
  git('init', '-q')
  git('add', '.')
  git(
    '-c',
    'user.name=Queue test',
    '-c',
    'user.email=queue@example.invalid',
    'commit',
    '-qm',
    'fixture'
  )
  t.after(async () => {
    for (const file of fs
      .readdirSync(path.join(dir, 'jobs'), { withFileTypes: true })
      .filter(x => x.name.endsWith('.json'))) {
      const job = read(path.join(dir, 'jobs', file.name))
      if (job.pid && ['running', 'starting'].includes(job.status))
        try {
          process.kill(-job.pid, 'SIGTERM')
        } catch {}
      const receipt = path.join(job.output, 'cleanup.json')
      if (fs.existsSync(receipt))
        for (const p of read(receipt).processes ?? [])
          try {
            process.kill(-p.pid, 'SIGTERM')
          } catch {}
    }
    await wait(250)
    const lock = path.join(dir, 'controller.lock', 'owner.json')
    if (fs.existsSync(lock))
      try {
        process.kill(read(lock).pid, 'SIGTERM')
      } catch {}
    await wait(100)
    fs.rmSync(root, { recursive: true, force: true })
  })
  fs.mkdirSync(path.join(dir, 'jobs'))
  const events = path.join(root, 'events')
  const spec = (mode = 'ok', extra = {}) => ({
    owner: 'queue-test',
    label: mode,
    cwd: repo,
    command: [process.execPath, 'fixture.cjs', mode],
    inputs: ['fixture.cjs'],
    ports: [],
    cleanup: 'receipt',
    timeoutMs: 5000,
    env: { EVENTS: events },
    ...extra,
  })
  const job = id => read(path.join(dir, 'jobs', `${id}.json`))
  return { root, repo, dir, events, git, spec, job }
}
async function until(predicate, description, timeout = 8000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const value = predicate()
    if (value) return value
    await wait(30)
  }
  assert.fail(`Timed out: ${description}`)
}
async function released(f) {
  await until(() => !fs.existsSync(path.join(f.dir, 'controller.lock')), 'controller release')
}

async function unusedPort() {
  const server = net.createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}

async function supervisorFault(
  t,
  checkerSource,
  expected,
  { serverCommand, serverSource, expectedProcesses } = {}
) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pnd-supervisor-')),
    output = path.join(root, 'output'),
    checker = path.join(root, 'checker.mjs'),
    server = path.join(root, 'server.cjs'),
    cleanup = path.join(output, 'cleanup.json'),
    marker = path.join(root, 'checker-started'),
    port = await unusedPort()
  fs.mkdirSync(output)
  fs.writeFileSync(checker, checkerSource)
  fs.writeFileSync(
    server,
    serverSource ??
      `const http=require('node:http');http.createServer((q,r)=>r.end('ready')).listen(Number(process.argv[3]),process.argv[2]);\n`
  )
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const env = {
    ...process.env,
    CHECKER_MARKER: marker,
    PND_QUEUE_JOB_ID: 'supervisor-fault-test',
    PND_QUEUE_OUTPUT: output,
    PND_QUEUE_CLEANUP: cleanup,
    PND_QUEUE_PORTS: String(port),
    POPULOUS_URL: `http://127.0.0.1:${port}`,
  }
  await assert.rejects(
    superviseBrowserCheck({
      checkerCommand: [process.execPath, checker],
      cwd: root,
      env,
      serverCommand: serverCommand ?? [process.execPath, server, '127.0.0.1', String(port)],
      readinessTimeoutMs: 1_000,
      checkerStdio: 'ignore',
    }),
    expected
  )
  const receipt = read(cleanup)
  assert.equal(receipt.jobId, env.PND_QUEUE_JOB_ID)
  assert.equal(receipt.resourcesReleased, true)
  assert.equal(receipt.processes.length, expectedProcesses ?? 2)
  for (const processRecord of receipt.processes)
    assert.throws(() => process.kill(-processRecord.pid, 0), { code: 'ESRCH' })
  return { marker }
}

test('browser supervisor verifies cleanup after a missing checker dependency', async t => {
  await supervisorFault(
    t,
    `import '@pnd/missing-browser-supervisor-fixture'\n`,
    /Checker failed/
  )
})

test('browser supervisor does not start the checker while the server port refuses connections', async t => {
  const { marker } = await supervisorFault(
    t,
    `import fs from 'node:fs';fs.writeFileSync(process.env.CHECKER_MARKER,'started')\n`,
    /Server startup failed/,
    { serverCommand: [process.execPath, '-e', 'setTimeout(()=>{},30000)'], expectedProcesses: 1 }
  )
  assert.equal(fs.existsSync(marker), false)
})

test('browser supervisor verifies cleanup after a checker exception', async t => {
  const { marker } = await supervisorFault(
    t,
    `import fs from 'node:fs';if(process.env.PND_QUEUE_CLEANUP)throw new Error('checker inherited cleanup authority');fs.writeFileSync(process.env.CHECKER_MARKER,'started');throw new Error('runner exception')\n`,
    /Checker failed/
  )
  assert.equal(fs.existsSync(marker), true)
})

test('browser supervisor classifies server spawn failure and verifies empty cleanup', async t => {
  await supervisorFault(
    t,
    `throw new Error('checker must not start')\n`,
    /Server startup failed/,
    { serverCommand: ['/pnd/missing-server-command'], expectedProcesses: 0 }
  )
})

test('browser supervisor stops the checker when the ready server exits', async t => {
  await supervisorFault(
    t,
    `setTimeout(()=>{},30000)\n`,
    /Server exited during checking: 9/,
    {
      serverSource: `const http=require('node:http');const server=http.createServer((q,r)=>r.end('ready'));server.listen(Number(process.argv[3]),process.argv[2],()=>setTimeout(()=>process.exit(9),500));\n`,
    }
  )
})

test('browser supervisor SIGTERM includes a detached checker descendant', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pnd-supervisor-signal-')),
    output = path.join(root, 'output'),
    cleanup = path.join(output, 'cleanup.json'),
    checker = path.join(root, 'checker.mjs'),
    server = path.join(root, 'server.cjs'),
    wrapper = path.join(root, 'wrapper.mjs'),
    browserPidFile = path.join(root, 'browser.pid'),
    browserTerm = path.join(root, 'browser-term'),
    checkerPidFile = path.join(root, 'checker.pid'),
    serverPidFile = path.join(root, 'server.pid'),
    errorFile = path.join(root, 'supervisor-error'),
    port = await unusedPort()
  fs.mkdirSync(output)
  fs.writeFileSync(
    server,
    `const fs=require('node:fs'),http=require('node:http');fs.writeFileSync(process.env.SERVER_PID,String(process.pid));http.createServer((q,r)=>r.end('ready')).listen(Number(process.argv[3]),process.argv[2]);\n`
  )
  fs.writeFileSync(
    checker,
    `import fs from 'node:fs';import {spawn} from 'node:child_process';fs.writeFileSync(process.env.CHECKER_PID,String(process.pid));const source="const fs=require('node:fs');process.on('SIGTERM',()=>{fs.writeFileSync(process.env.BROWSER_TERM,'SIGTERM');process.exit(0)});setInterval(()=>{},1000)";const child=spawn(process.execPath,['-e',source],{detached:true,stdio:'ignore',env:process.env});child.unref();fs.writeFileSync(process.env.BROWSER_PID,String(child.pid));setInterval(()=>{},1000);\n`
  )
  fs.writeFileSync(
    wrapper,
    `import fs from 'node:fs';import {inspect} from 'node:util';import {superviseBrowserCheck} from ${JSON.stringify(new URL('../scripts/performance-queue.mjs', import.meta.url).href)};try{await superviseBrowserCheck({checkerCommand:[process.execPath,${JSON.stringify(checker)}],cwd:${JSON.stringify(root)},env:process.env,serverCommand:[process.execPath,${JSON.stringify(server)},'127.0.0.1',process.env.PND_QUEUE_PORTS],readinessTimeoutMs:1000,checkerStdio:'ignore'})}catch(error){fs.writeFileSync(process.env.SUPERVISOR_ERROR,inspect(error,{depth:8}));process.exitCode=1}\n`
  )
  const env = {
      ...process.env,
      BROWSER_PID: browserPidFile,
      BROWSER_TERM: browserTerm,
      CHECKER_PID: checkerPidFile,
      SERVER_PID: serverPidFile,
      SUPERVISOR_ERROR: errorFile,
      PND_QUEUE_JOB_ID: 'supervisor-signal-test',
      PND_QUEUE_OUTPUT: output,
      PND_QUEUE_CLEANUP: cleanup,
      PND_QUEUE_PORTS: String(port),
      POPULOUS_URL: `http://127.0.0.1:${port}`,
    },
    supervisor = spawn(process.execPath, [wrapper], { cwd: root, env, stdio: 'ignore' })
  t.after(async () => {
    for (const pidFile of [browserPidFile, checkerPidFile, serverPidFile])
      if (fs.existsSync(pidFile))
        try {
          process.kill(-Number(fs.readFileSync(pidFile, 'utf8')), 'SIGKILL')
        } catch {
          // The fixture process already exited.
        }
    await wait(100)
    fs.rmSync(root, { recursive: true, force: true })
  })
  await until(() => fs.existsSync(browserPidFile), 'detached browser start')
  await wait(350)
  process.kill(supervisor.pid, 'SIGTERM')
  const result = await new Promise(resolve =>
    supervisor.once('exit', (code, signal) => resolve({ code, signal }))
  )
  assert.equal(result.signal, null)
  assert.notEqual(result.code, 0)
  assert.equal(fs.readFileSync(browserTerm, 'utf8'), 'SIGTERM')
  assert(
    fs.existsSync(cleanup),
    fs.existsSync(errorFile) ? fs.readFileSync(errorFile, 'utf8') : 'supervisor wrote no cleanup receipt'
  )
  const browserPid = Number(fs.readFileSync(browserPidFile, 'utf8')),
    receipt = read(cleanup)
  assert(receipt.processes.some(processRecord => processRecord.pid === browserPid))
  assert.equal(receipt.processes.length, 3)
  for (const processRecord of receipt.processes)
    assert.throws(() => process.kill(-processRecord.pid, 0), { code: 'ESRCH' })
})

test('concurrent submitters and controllers preserve FIFO without overlap', async t => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.dir, 'pause.json'), '{}')
  const specs = Array.from({ length: 3 }, (_, i) => {
    const file = path.join(f.root, `spec${i}.json`)
    fs.writeFileSync(file, JSON.stringify(f.spec('ok', { label: `distinct workload ${i}` })))
    return file
  })
  await Promise.all(
    specs.map(
      file =>
        new Promise((resolve, reject) => {
          const p = spawn(process.execPath, [cli, 'submit', file, '--dir', f.dir], {
            stdio: 'ignore',
          })
          p.on('exit', code => (code === 0 ? resolve() : reject(Error(`submit ${code}`))))
        })
    )
  )
  await released(f)
  await recover(f.dir)
  const ids = fs.readFileSync(path.join(f.dir, 'order'), 'utf8').trim().split('\n')
  await until(() => ids.every(id => f.job(id).status === 'passed'), 'all jobs')
  assert.deepEqual(
    fs.readFileSync(f.events, 'utf8').trim().split('\n'),
    ids.flatMap(id => [`${id} start`, `${id} end`])
  )
  assert(ids.every(id => f.job(id).status === 'passed'))
})

test('failed and timed-out jobs release before automatic next job', async t => {
  const f = fixture(t),
    a = submit(f.spec('fail'), f.dir),
    b = submit(f.spec('wait', { timeoutMs: 400 }), f.dir),
    c = submit(f.spec(), f.dir)
  await until(() => f.job(c.id).status === 'passed', 'following job')
  assert.equal(f.job(a.id).status, 'failed')
  assert.equal(f.job(b.id).status, 'timed-out')
  const events = fs.readFileSync(f.events, 'utf8')
  assert(events.indexOf(`${b.id} stop`) < events.indexOf(`${c.id} start`))
})

test('cancel running and queued jobs without running queued command', async t => {
  const f = fixture(t),
    a = submit(f.spec('wait'), f.dir)
  await until(() => fs.existsSync(f.events), 'first started')
  const b = submit(f.spec('ok', { label: 'cancel this workload' }), f.dir),
    c = submit(f.spec('ok', { label: 'following workload' }), f.dir)
  fs.writeFileSync(path.join(b.output, 'cancel'), '')
  fs.writeFileSync(path.join(a.output, 'cancel'), '')
  await until(() => f.job(c.id).status === 'passed', 'after cancellation')
  assert.equal(f.job(a.id).status, 'cancelled')
  assert.equal(f.job(b.id).status, 'cancelled')
  assert(!fs.readFileSync(f.events, 'utf8').includes(`${b.id} start`))
})

test('missing cleanup blocks handoff, recovery requires a fresh matching receipt', async t => {
  const f = fixture(t),
    a = submit(f.spec('missing'), f.dir),
    b = submit(f.spec(), f.dir)
  await until(() => f.job(a.id).status === 'cleanup-blocked', 'cleanup failure')
  await released(f)
  assert.equal(f.job(b.id).status, 'queued')
  await assert.rejects(recover(f.dir), /receipt is missing/)
  fs.writeFileSync(
    path.join(a.output, 'cleanup.json'),
    JSON.stringify({
      jobId: 'wrong',
      resourcesReleased: true,
      releasedAt: new Date().toISOString(),
      processes: [],
    })
  )
  await assert.rejects(recover(f.dir), /stale cleanup/)
  fs.writeFileSync(
    path.join(a.output, 'cleanup.json'),
    JSON.stringify({
      jobId: a.id,
      resourcesReleased: true,
      releasedAt: new Date().toISOString(),
      processes: [],
    })
  )
  await recover(f.dir)
  await until(() => f.job(b.id).status === 'passed', 'recovered queue')
})

test('live detached child prevents next test and is never killed by the queue', async t => {
  const f = fixture(t),
    a = submit(f.spec('detached'), f.dir),
    b = submit(f.spec(), f.dir)
  await until(() => f.job(a.id).status === 'cleanup-blocked', 'detached process check')
  await released(f)
  const pid = read(path.join(a.output, 'cleanup.json')).processes[0].pid
  process.kill(pid, 0)
  await assert.rejects(recover(f.dir), /still alive/)
  assert.equal(f.job(b.id).status, 'queued')
  process.kill(-pid, 'SIGTERM')
  await until(() => {
    try {
      process.kill(pid, 0)
      return false
    } catch {
      return true
    }
  }, 'fixture child exit')
  await recover(f.dir)
  await until(() => f.job(b.id).status === 'passed', 'detached cleanup recovery')
})

test('controller crash retains lock; recovery refuses live owner or job', async t => {
  const f = fixture(t),
    a = submit(f.spec('wait'), f.dir),
    b = submit(f.spec(), f.dir)
  await until(() => f.job(a.id).status === 'running' && fs.existsSync(f.events), 'active job')
  await assert.rejects(recover(f.dir), /Controller is still alive/)
  const controller = read(path.join(f.dir, 'controller.lock', 'owner.json')).pid
  process.kill(controller, 'SIGKILL')
  await wait(100)
  await assert.rejects(recover(f.dir), /still alive/)
  assert.equal(f.job(b.id).status, 'queued')
  process.kill(-f.job(a.id).pid, 'SIGTERM')
  await wait(200)
  await recover(f.dir)
  await until(() => f.job(b.id).status === 'passed', 'post-crash recovery')
})

test('source drift and busy ports block commands without touching existing server', async t => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.dir, 'pause.json'), '{}')
  const a = submit(f.spec(), f.dir)
  fs.appendFileSync(path.join(f.repo, 'fixture.cjs'), '\n// queued input changed\n')
  await released(f)
  await recover(f.dir)
  await until(() => f.job(a.id).status === 'blocked', 'source drift')
  assert(!fs.existsSync(f.events))
  const server = net.createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => server.close())
  const b = submit(f.spec('ok', { ports: [server.address().port] }), f.dir)
  await until(() => f.job(b.id).status === 'blocked', 'occupied port')
  assert(server.listening)
  assert(!fs.existsSync(f.events))
})

test('all linked worktrees resolve the same queue; invalid specs never launch', async t => {
  const f = fixture(t),
    other = path.join(f.root, 'worktree')
  f.git('worktree', 'add', '-qb', 'test-worker', other)
  assert.equal(queueDirectory(other), queueDirectory(f.repo))
  assert.throws(() => submit(f.spec('ok', { command: 'echo unsafe' }), f.dir), /argv/)
  assert.throws(() => submit(f.spec('ok', { timeoutMs: Infinity }), f.dir), /timeout/)
  assert.throws(() => submit(f.spec('ok', { notify: ['echo', 'done'] }), f.dir), /Use run/)
  assert(!fs.existsSync(f.events))
})

test('submission preserves PATH and run returns one compact result without agent polling', async t => {
  const f = fixture(t),
    bin = path.join(f.root, 'bin'),
    oldPath = process.env.PATH
  fs.mkdirSync(bin)
  fs.writeFileSync(path.join(bin, 'queue-fixture'), `#!${process.execPath}\n${fixtureSource}`, {
    mode: 0o700,
  })
  fs.writeFileSync(path.join(f.dir, 'pause.json'), '{}')
  process.env.PATH = `${bin}:${oldPath}`
  let job
  try {
    job = submit(f.spec('ok', { command: ['queue-fixture', 'ok'] }), f.dir)
  } finally {
    process.env.PATH = oldPath
  }
  assert.equal((await waitForResult(f.dir, job.id)).status, 'deferred')
  await released(f)
  await recover(f.dir)
  assert.equal((await waitForResult(f.dir, job.id)).status, 'passed')
  const spec = path.join(f.root, 'run.json')
  fs.writeFileSync(spec, JSON.stringify(f.spec()))
  const result = await new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [cli, 'run', spec, '--dir', f.dir]),
      output = []
    p.stdout.on('data', c => output.push(c))
    p.on('exit', code =>
      code === 0 ? resolve(JSON.parse(Buffer.concat(output))) : reject(Error(`run ${code}`))
    )
  })
  assert.equal(result.status, 'passed')
  assert.equal(result.spec, undefined)
})

test('concurrent identical retries share one unfinished job; completed work can run again', async t => {
  const f = fixture(t),
    specFile = path.join(f.root, 'retry.json')
  fs.writeFileSync(path.join(f.dir, 'pause.json'), '{}')
  fs.writeFileSync(specFile, JSON.stringify(f.spec()))
  const jobs = await Promise.all(
    Array.from(
      { length: 4 },
      () =>
        new Promise((resolve, reject) => {
          const child = spawn(process.execPath, [cli, 'submit', specFile, '--dir', f.dir]),
            output = []
          child.stdout.on('data', data => output.push(data))
          child.on('exit', code =>
            code === 0
              ? resolve(JSON.parse(Buffer.concat(output)))
              : reject(Error(`submit ${code}`))
          )
        })
    )
  )
  assert.equal(new Set(jobs.map(job => job.id)).size, 1)
  assert.deepEqual(fs.readFileSync(path.join(f.dir, 'order'), 'utf8').trim().split('\n'), [
    jobs[0].id,
  ])
  fs.appendFileSync(path.join(f.repo, 'fixture.cjs'), '\n// changed queued input\n')
  assert.throws(
    () => submit(f.spec(), f.dir),
    new RegExp(`Unfinished job ${jobs[0].id} has different inputs`)
  )
  fs.writeFileSync(path.join(f.repo, 'fixture.cjs'), fixtureSource)
  assert.equal(submit(f.spec(), f.dir).id, jobs[0].id)
  await released(f)
  await recover(f.dir)
  await until(() => f.job(jobs[0].id).status === 'passed', 'one execution')
  assert.equal(fs.readFileSync(f.events, 'utf8').trim().split('\n').length, 2)
  const next = submit(f.spec(), f.dir)
  assert.notEqual(next.id, jobs[0].id)
  await until(() => f.job(next.id).status === 'passed', 'intentional later execution')
})

test('run exposes a recovery ID before caller interruption; retry keeps the running job', async t => {
  const f = fixture(t),
    spec = f.spec('wait'),
    specFile = path.join(f.root, 'interrupted.json')
  fs.writeFileSync(specFile, JSON.stringify(spec))
  const caller = spawn(process.execPath, [cli, 'run', specFile, '--dir', f.dir]),
    output = []
  t.after(() => caller.kill('SIGTERM'))
  caller.stderr.on('data', data => output.push(data))
  const receipt = await until(() => {
    const line = Buffer.concat(output).toString().split('\n')[0]
    try {
      return JSON.parse(line)
    } catch {
      return null
    }
  }, 'early job ID')
  assert.equal(receipt.resume, `wait ${receipt.id}`)
  await until(
    () => f.job(receipt.id).status === 'running' && fs.existsSync(f.events),
    'detached job'
  )
  await new Promise(resolve => {
    caller.once('exit', resolve)
    caller.kill('SIGTERM')
  })
  assert.equal(f.job(receipt.id).status, 'running')
  assert.equal(submit(spec, f.dir).id, receipt.id)
  fs.writeFileSync(path.join(f.job(receipt.id).output, 'cancel'), '')
  await until(() => f.job(receipt.id).status === 'cancelled', 'owned job cancellation')
  assert.equal((await waitForResult(f.dir, receipt.id)).status, 'cancelled')
  assert.equal(fs.readFileSync(f.events, 'utf8').trim().split('\n').length, 2)
})
