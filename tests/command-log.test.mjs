import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { captureCommand } from '../scripts/orchestration/command-log.mjs'
import { verifyContract } from '../scripts/orchestration/verify.mjs'
import { fingerprintPaths, repositoryCheckCoverage, validateContract } from '../scripts/orchestration/cli.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
const json = path => JSON.parse(fs.readFileSync(path, 'utf8'))
const put = (repo, path, value) => {
  fs.mkdirSync(dirname(join(repo, path)), { recursive: true })
  fs.writeFileSync(join(repo, path), typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value) + '\n')
}
function temporary(t) {
  const root = fs.mkdtempSync(join(tmpdir(), 'pnd-command-log-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}
const capture = (root, script, options = {}) => captureCommand([process.execPath, '-e', script],
  { cwd: root, env: process.env, timeoutMs: 5000, directory: join(root, 'capture'), ...options })
function completed(outcome) {
  assert.equal(outcome.capture.complete, true)
  assert.equal(Object.hasOwn(outcome, 'stdout'), false); assert.equal(Object.hasOwn(outcome, 'stderr'), false)
  const path = outcome.capture.path, metadata = json(path)
  assert.equal(metadata.status, 'complete')
  assert.equal(fs.existsSync(join(dirname(path), 'publication.pending')), false)
  assert.equal(fs.existsSync(join(dirname(path), 'publication.complete')), true)
  for (const stream of [...Object.values(metadata.streams), metadata.log]) {
    const bytes = fs.readFileSync(stream.path)
    assert.equal(bytes.length, stream.bytes); assert.equal(sha(bytes), stream.sha256)
  }
  return metadata
}

test('real capture preserves raw BOM/binary and per-stream UTF8 replacement, then stdout before stderr', async t => {
  const root = temporary(t)
  const stdout = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.alloc(65532, 120),
    Buffer.from([0xe2, 0x82, 0xac, 0xff, 0, 0xe2, 0x82])])
  const stderr = Buffer.from([0xef, 0xbb, 0xbf, 0xf0, 0x9f, 0x92, 0xa9, 0xc0, 0x80, 0xe2])
  put(root, 'out.bin', stdout); put(root, 'err.bin', stderr)
  const result = await capture(root, "const fs=require('node:fs'); const a=fs.readFileSync('out.bin'), b=fs.readFileSync('err.bin'); fs.writeSync(2,b); for(let i=0;i<a.length;i+=7) fs.writeSync(1,a.subarray(i,i+7))")
  const metadata = completed(result)
  assert.deepEqual(fs.readFileSync(metadata.streams.stdout.path), stdout)
  assert.deepEqual(fs.readFileSync(metadata.streams.stderr.path), stderr)
  assert.equal(fs.readFileSync(metadata.log.path, 'utf8'), stdout.toString('utf8') + stderr.toString('utf8'))
  const before = sha(fs.readFileSync(result.capture.path))
  await assert.rejects(capture(root, "throw new Error('must not spawn')"), /capture incomplete/)
  assert.equal(sha(fs.readFileSync(result.capture.path)), before)
})

test('real capture waits for stream closure and preserves failure, launch error, and timeout status', async t => {
  for (const [name, script, expected] of [
    ['failed', "process.stdout.write('failed output'); process.exitCode=7", { exitCode: 7, timedOut: false }],
    ['timeout', "process.stdout.write('before timeout'); setInterval(()=>{},1000)", { exitCode: 1, timedOut: true }],
    ['late', "setTimeout(()=>process.stdout.write('last bytes'),40)", { exitCode: 0, timedOut: false }],
  ]) {
    const root = temporary(t), result = await capture(root, script, { timeoutMs: name === 'timeout' ? 500 : 5000 })
    assert.equal(result.exitCode, expected.exitCode); assert.equal(result.timedOut, expected.timedOut)
    const metadata = completed(result)
    assert(metadata.streams.stdout.bytes > 0)
  }
  const root = temporary(t), result = await captureCommand([join(root, 'missing-executable')],
    { cwd: root, env: process.env, timeoutMs: 1000, directory: join(root, 'capture') })
  const metadata = completed(result)
  assert.equal(result.exitCode, 1); assert.equal(result.timedOut, false)
  assert.equal(metadata.streams.stdout.bytes, 0); assert.equal(metadata.streams.stderr.bytes, 0)
  assert.match(fs.readFileSync(metadata.log.path, 'utf8'), /ENOENT/)
})

// Production copies, not replacement implementations. This explicit closure is
// statically audited before execution; fixture checks never import app/game code.
const closure = ['scripts/orchestration/verify.mjs', 'scripts/orchestration/command-log.mjs',
  'scripts/orchestration/dependency-profile.mjs', 'scripts/orchestration/cli.mjs',
  'scripts/orchestration/research-evidence.mjs', 'scripts/orchestration/review-bundle.mjs',
  'scripts/orchestration/receipt-streams.mjs', 'scripts/parity-measure.mjs',
  'scripts/parity-discovery.mjs', 'scripts/parity-json-metadata.mjs',
  'scripts/parity-owned-checkpoint.mjs', 'scripts/parity-owned-blast.mjs']
function fixture(t, { action = "process.stdout.write('check stdout'); process.stderr.write('check stderr')", count = 1 } = {}) {
  const repo = temporary(t), contractPath = 'work/orchestration/task.json'
  for (const path of closure) put(repo, path, fs.readFileSync(new URL('../' + path, import.meta.url)))
  put(repo, '.gitignore', 'work/\n')
  put(repo, 'package.json', { type: 'module' })
  put(repo, 'GOAL.md', '# Goal\n\n## Current execution order: fixture\nTransport only, not gameplay.\n')
  put(repo, 'docs.md', '# Evidence\nSynthetic capture only. Integration remains open.\n')
  put(repo, 'app/a.ts', 'export const a = 1\n')
  put(repo, 'fixture.mjs', action)
  const check = { id: 'portable', kind: 'portable', automation: 'safe', purpose: 'Synthetic log capture',
    coveredBehavior: ['Command output'], knownLimits: ['No gameplay'], executable: process.execPath,
    args: ['fixture.mjs'], cwd: '.', env: [], inputs: ['app/a.ts', ...closure],
    prerequisites: [], sideEffects: [], resources: [], expected: { exitCode: 0, artifacts: [] } }
  put(repo, 'engineering/checks.json', { version: 1, checks: Array.from({ length: count }, (_, i) => ({ ...check, id: 'portable' + i })) })
  put(repo, 'engineering/generated-files.json', { version: 1, owners: [{ id: 'fixture', kind: 'fixture',
    generator: { executable: 'node', args: [] }, callers: ['package.json'], inputs: ['app/a.ts'],
    outputs: [{ path: 'work/generated', type: 'directory', tracked: false, protected: true }], recording: 'Never' }] })
  put(repo, 'parity.json', { groups: [{ id: 'group', items: [{ id: 'group.item' }] }] })
  put(repo, 'engineering/project-map.json', { version: 1, subsystems: [{ id: 'fixture', title: 'Fixture',
    mappingStatus: 'reviewed', implementationPaths: ['app/a.ts'], sharedPaths: [], researchPaths: [],
    entrySymbols: [{ path: 'app/a.ts', symbol: 'a' }], parityIds: ['group.item'],
    evidence: [{ path: 'docs.md', heading: 'Evidence' }], nativeAddresses: [], checkIds: ['portable0'],
    generatedInputIds: ['fixture'], risks: ['Synthetic only'], unresolved: ['Gameplay remains open'] }],
    crossCutting: [{ path: 'app/a.ts', subsystemIds: ['fixture'], checkIds: ['portable0'] }],
    unmappedAreas: [{ id: 'unknown', mappingStatus: 'unmapped', paths: ['docs.md'], note: 'Synthetic' }] })
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim()
  git('init', '-q'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Fixture')
  git('add', '.'); git('commit', '-qm', 'synthetic verification fixture')
  const task = { version: 1, identity: { taskId: 'task', baseCommit: git('rev-parse', 'HEAD'), baseline: [], inputFingerprints: {} },
    intent: { objective: 'Test log transport', nonGoals: ['Gameplay'], acceptance: ['Raw bytes preserved'], risk: 'low' },
    scope: { subsystemIds: ['fixture'], parityIds: ['group.item'], boundaries: ['No game execution'] },
    ownership: { implementationOwner: 'fixture', allowedPaths: ['app/a.ts'], prohibitedPaths: [], generatedPaths: [] },
    research: { nativeQuestions: [], evidence: [], assumptions: [] },
    modernization: { risks: [], measurementNeeds: [], corrections: [] },
    verification: { requiredCheckIds: Array.from({ length: count }, (_, i) => 'portable' + i),
      rationale: ['Capture only'], artifacts: ['work/orchestration'], results: [] },
    completion: { requiredReview: 'Fixture', permittedBookkeeping: [], stoppingConditions: ['Inspect output'] } }
  put(repo, contractPath, task)
  const run = (preload = '') => spawnSync(process.execPath,
    [...(preload ? ['--import', join(repo, 'work/preload.mjs')] : []),
      join(repo, 'scripts/orchestration/verify.mjs'), '--contract', contractPath],
    { cwd: repo, env: process.env, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 })
  return { repo, contractPath, task, git, run, saved: () => json(join(repo, contractPath)) }
}

test('actual copied verify CLI records complete capture, preserves earlier attempts, and retains source identity', t => {
  const f = fixture(t), first = f.run()
  assert.equal(first.status, 0, first.stderr)
  const old = f.saved().verification.results[0], oldBytes = fs.readFileSync(join(f.repo, old.log))
  assert.equal(old.status, 'passed'); assert.equal(old.capture.complete, true)
  assert.equal(old.testedFingerprint, fingerprintPaths(f.repo, old.inputPaths))
  completed({ capture: { ...old.capture, path: join(f.repo, old.capture.path) } })
  const second = f.run()
  assert.equal(second.status, 0, second.stderr)
  const fresh = f.saved().verification.results[0]
  assert.notEqual(fresh.log, old.log); assert.notEqual(fresh.capture.path, old.capture.path)
  assert.deepEqual(fs.readFileSync(join(f.repo, old.log)), oldBytes)
  assert.equal(oldBytes.toString(), 'check stdoutcheck stderr')
  validateContract(f.repo, f.saved())
})

test('injected executor keeps legacy first log path but preserves colliding evidence', async t => {
  const f = fixture(t)
  const execute = async () => ({ exitCode: 0, stdout: 'legacy stdout', stderr: 'legacy stderr', timedOut: false })
  const first = await verifyContract(f.repo, f.contractPath, { execute })
  assert.equal(first.results[0].log, 'work/orchestration/task/checks/portable0.log')
  const second = await verifyContract(f.repo, f.contractPath, { execute })
  assert.notEqual(second.results[0].log, first.results[0].log)
  for (const result of [first, second]) assert.equal(fs.readFileSync(join(f.repo, result.results[0].log), 'utf8'), 'legacy stdoutlegacy stderr')
  validateContract(f.repo, f.saved())
})

test('actual copied verify CLI keeps failure and source drift nonpassing and later checks blocked', t => {
  for (const action of ["process.stdout.write('failure'); process.exitCode=7",
    "import { appendFileSync } from 'node:fs'; appendFileSync('scripts/orchestration/command-log.mjs','\\n// drift\\n'); process.stdout.write('drift')"]) {
    const f = fixture(t, { action, count: 2 }), outcome = f.run()
    assert.equal(outcome.status, 1, outcome.stderr)
    const [active, next] = f.saved().verification.results
    assert.equal(active.status, 'failed'); assert.equal(active.capture.complete, true)
    assert.equal(next.status, action.includes('appendFileSync') ? 'blocked' : 'failed')
    if (action.includes('appendFileSync')) assert.match(active.reason, /changed the tracked/)
    else assert.equal(active.exitCode, 7)
  }
})

test('copied verify CLI persists pending capture before the child and preserves interrupted finalization', async t => {
  const f = fixture(t, { action: "import { readFileSync } from 'node:fs'; const row=JSON.parse(readFileSync('work/orchestration/task.json')).verification.results[0]; const capture=JSON.parse(readFileSync(row.capture.path)); if(row.status!=='blocked'||row.capture.complete!==false||capture.status!=='pending') throw new Error('not pending before child'); process.stdout.write('partial')" , count: 2 })
  // Interrupt after child close, while the actual verifier starts hashing raw
  // output. No orphan child or process-group ownership is created by this test.
  put(f.repo, 'work/preload.mjs', [
    "import fs from 'node:fs'; const open=fs.openSync,read=fs.readSync,paths=new Map();",
    "fs.openSync=(path,...args)=>{const fd=open(path,...args);paths.set(fd,String(path));return fd};",
    "fs.readSync=(fd,...args)=>{if(paths.get(fd)?.endsWith('/stdout.log')){fs.writeFileSync('work/started','child already closed');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10000)}return read(fd,...args)};",
  ].join('\n'))
  const child = spawn(process.execPath, ['--import', join(f.repo, 'work/preload.mjs'),
    join(f.repo, 'scripts/orchestration/verify.mjs'), '--contract', f.contractPath],
    { cwd: f.repo, env: process.env, stdio: 'ignore' })
  const closed = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })))
  try {
    const deadline = Date.now() + 5000
    while (!fs.existsSync(join(f.repo, 'work/started')) && Date.now() < deadline && child.exitCode === null)
      await new Promise(resolve => setTimeout(resolve, 10))
    assert(fs.existsSync(join(f.repo, 'work/started')))
    child.kill('SIGKILL')
    assert.equal((await closed).signal, 'SIGKILL')
    const [active, next] = f.saved().verification.results
    assert.equal(active.status, 'blocked'); assert.equal(next.status, 'not-run')
    const descriptor = join(f.repo, active.capture.path)
    assert.equal(json(descriptor).status, 'pending')
    assert(fs.existsSync(join(dirname(descriptor), 'publication.pending')))
    assert.equal(fs.existsSync(join(dirname(descriptor), 'publication.complete')), false)
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await closed
  }
})

test('write, read, close and both publication faults leave guarded artifacts and blocked contract', t => {
  for (const fault of ['write', 'read', 'close', 'rename', 'guard']) {
    const f = fixture(t, { count: 2 })
    put(f.repo, 'work/preload.mjs', [
      "import fs from 'node:fs'; const paths=new Map(); const open=fs.openSync,write=fs.writeSync,read=fs.readSync,close=fs.closeSync,rename=fs.renameSync;",
      "fs.openSync=(path,...args)=>{const fd=open(path,...args);paths.set(fd,String(path));return fd};",
      fault === 'write' ? "fs.writeSync=(fd,...args)=>{if(paths.get(fd)?.endsWith('/stdout.log')) throw new Error('fixture write failure');return write(fd,...args)};" : '',
      fault === 'read' ? "fs.readSync=(fd,...args)=>{if(paths.get(fd)?.endsWith('/stdout.log')) throw new Error('fixture read failure');return read(fd,...args)};" : '',
      fault === 'guard' ? "fs.renameSync=(from,...args)=>{if(String(from).endsWith('/publication.pending')) throw new Error('fixture guard failure');return rename(from,...args)};" : '',
      fault === 'close' ? "fs.closeSync=fd=>{const path=paths.get(fd);paths.delete(fd);const result=close(fd);if(path?.endsWith('/stdout.log')) throw new Error('fixture close failure');return result};" : '',
      fault === 'rename' ? "fs.renameSync=(from,...args)=>{if(String(from).endsWith('/terminal.json.tmp')) throw new Error('fixture rename failure');return rename(from,...args)};" : '',
    ].join('\n'))
    const result = f.run('preload')
    assert.equal(result.status, 1, result.stderr)
    assert.match(result.stderr, fault === 'guard' ? /fixture guard failure/ : /Command log capture incomplete/)
    const [active, next] = f.saved().verification.results
    assert.equal(active.status, 'blocked'); assert.equal(active.capture.complete, false); assert.equal(next.status, 'not-run')
    const directory = dirname(join(f.repo, active.capture.path))
    assert(fs.existsSync(join(directory, 'publication.pending')))
    assert.equal(fs.existsSync(join(directory, 'publication.complete')), false)
  }
})

test('same-inode raw mutation before or after hashing cannot become complete evidence', async t => {
  for (const late of [false, true]) {
    const root = temporary(t), original = fs.readSync
    let changed = false
    fs.readSync = (fd, buffer, offset, length, position) => {
      // At stderr hashing, stdout has already been captured. Otherwise mutate
      // stdout immediately before its first held-fd read.
      const stdout = join(root, 'capture/stdout.log'), stderr = join(root, 'capture/stderr.log')
      const target = fs.existsSync(late ? stderr : stdout) && fs.fstatSync(fd).ino === fs.statSync(late ? stderr : stdout).ino
      if (!changed && target) { changed = true; fs.appendFileSync(stdout, 'tamper') }
      return original(fd, buffer, offset, length, position)
    }
    try { await assert.rejects(capture(root, "process.stdout.write('out');process.stderr.write('err')"), /capture incomplete/) }
    finally { fs.readSync = original }
    assert(changed)
    assert(fs.existsSync(join(root, 'capture/publication.pending')))
    assert.equal(fs.existsSync(join(root, 'capture/publication.complete')), false)
  }
})

test('aggregate accepts only the exact historical or current workflow argv', t => {
  const root = temporary(t)
  put(root, 'package.json', { scripts: {
    check: 'npm run typecheck && npm test && npm run parity:check && npm run orchestration:check',
    test: 'node --test tests/*.test.mjs', 'orchestration:check': 'node scripts/orchestration/cli.mjs check' } })
  const current = JSON.parse(fs.readFileSync(new URL('../engineering/checks.json', import.meta.url))).checks.find(check => check.id === 'orchestration-tests').args
  const make = args => ({ checks: { checks: [
    { id: 'repository-check', executable: 'npm', args: ['run', 'check'] },
    { id: 'orchestration-tests', executable: 'node', args },
    { id: 'orchestration-structural', executable: 'node', args: ['scripts/orchestration/cli.mjs', 'check'] },
  ].map(check => ({ ...check, cwd: '.', automation: 'safe', env: [], expected: { exitCode: 0, artifacts: [] } })) } })
  assert.deepEqual(repositoryCheckCoverage(root, make(current)), ['orchestration-tests', 'orchestration-structural'])
  assert.deepEqual(repositoryCheckCoverage(root, make(current.filter(path => path !== 'tests/command-log.test.mjs'))), ['orchestration-tests', 'orchestration-structural'])
  for (const args of [current.slice(0, -1), [...current].reverse(), [...current, 'tests/extra.test.mjs'],
    current.map(path => path === 'tests/command-log.test.mjs' ? 'tests/unknown.test.mjs' : path)])
    assert.deepEqual(repositoryCheckCoverage(root, make(args)), ['orchestration-structural'])
})


test('observed output hashes reject same-inode edits while the real child is still running', async t => {
  const root = temporary(t)
  await assert.rejects(capture(root,
    "const fs=require('node:fs'); process.stdout.write('out'); const timer=setInterval(()=>{if(fs.statSync('capture/stdout.log').size===3){clearInterval(timer);fs.appendFileSync('capture/stdout.log','tamper')}},5)"),
  /capture incomplete/)
  assert(fs.existsSync(join(root, 'capture/publication.pending')))
  assert.equal(fs.existsSync(join(root, 'capture/publication.complete')), false)
})

test('slow short-write sinks retain bounded chunks and metadata for increasing real output', t => {
  const root = temporary(t), helper = new URL('../scripts/orchestration/command-log.mjs', import.meta.url).href
  put(root, 'measure.mjs', [
    "import fs from 'node:fs';",
    "import { captureCommand } from " + JSON.stringify(helper) + ";",
    "const size=Number(process.argv[2]), paths=new Map(), originalOpen=fs.openSync, originalWrite=fs.writeSync;",
    "const baseline=process.memoryUsage(), peak={...baseline}; let maxWrite=0,writes=0; const wait=new Int32Array(new SharedArrayBuffer(4));",
    "fs.openSync=(path,...args)=>{const fd=originalOpen(path,...args); paths.set(fd,String(path)); return fd};",
    "fs.writeSync=(fd,buffer,offset,length,...args)=>{",
    "  if(/\\/(stdout|stderr|combined)\\.log$/.test(paths.get(fd)??'')){",
    "    maxWrite=Math.max(maxWrite,length); writes++;",
    "    if(writes%16===0) Atomics.wait(wait,0,0,1);",
    "    const memory=process.memoryUsage(); for(const key of Object.keys(peak)) peak[key]=Math.max(peak[key],memory[key]);",
    "    return originalWrite(fd,buffer,offset,Math.min(length,4096),...args);",
    "  } return originalWrite(fd,buffer,offset,length,...args);",
    "};",
    "const script=\"const fs=require('node:fs'), chunk=Buffer.alloc(65536,120); for(let n=0;n<\"+size+\";n+=chunk.length){fs.writeSync(1,chunk);fs.writeSync(2,chunk)}\";",
    "const outcome=await captureCommand([process.execPath,'-e',script], {cwd:process.cwd(),env:process.env,timeoutMs:10000,directory:'capture-'+size});",
    "const metadata=JSON.parse(fs.readFileSync(outcome.capture.path));",
    "console.log(JSON.stringify({size,baseline,peak,maxWrite,writes,outcome,metadata}));",
  ].join('\n'))
  for (const size of [1024 * 1024, 6 * 1024 * 1024]) {
    const child = spawnSync(process.execPath, [join(root, 'measure.mjs'), String(size)],
      { cwd: root, env: process.env, encoding: 'utf8', timeout: 20000, maxBuffer: 65536 })
    assert.equal(child.status, 0, child.stderr)
    const measurement = JSON.parse(child.stdout)
    assert(measurement.maxWrite <= 64 * 1024); assert(measurement.writes > size / 4096)
    assert.equal(Object.hasOwn(measurement.outcome, 'stdout'), false)
    assert.equal(Object.hasOwn(measurement.outcome, 'stderr'), false)
    assert(JSON.stringify(measurement.outcome).length < 4096)
    assert.equal(measurement.metadata.streams.stdout.bytes, size)
    assert.equal(measurement.metadata.streams.stderr.bytes, size)
    assert.equal(measurement.metadata.log.bytes, size * 2)
    const expected = createHash('sha256'), chunk = Buffer.alloc(65536, 120)
    for (let offset = 0; offset < size; offset += chunk.length) expected.update(chunk)
    const hash = expected.digest('hex')
    assert.equal(measurement.metadata.streams.stdout.sha256, hash)
    assert.equal(measurement.metadata.streams.stderr.sha256, hash)
    // This deliberately loose fixture envelope is not a production RSS promise.
    assert(measurement.peak.rss - measurement.baseline.rss < 64 * 1024 * 1024)
    t.diagnostic(JSON.stringify({ fixtureOnly: true, rawBytes: size * 2, diagnosticBytes: size * 2,
      maxWriteBytes: measurement.maxWrite, baseline: measurement.baseline, peak: measurement.peak }))
  }
})


test('empty successful capture is complete and raw path substitutions are rejected', async t => {
  const empty = completed(await capture(temporary(t), ''))
  assert.equal(empty.streams.stdout.bytes, 0); assert.equal(empty.streams.stderr.bytes, 0)
  assert.equal(empty.log.bytes, 0)
  for (const kind of ['symlink', 'hardlink']) {
    const root = temporary(t)
    put(root, 'sentinel', 'unrelated evidence')
    const action = "const fs=require('node:fs'); fs.unlinkSync('capture/stdout.log'); " +
      (kind === 'symlink' ? "fs.symlinkSync('../sentinel','capture/stdout.log')" :
        "fs.linkSync('capture/stderr.log','capture/stdout.log')")
    await assert.rejects(capture(root, action), /capture incomplete/)
    assert.equal(fs.readFileSync(join(root, 'sentinel'), 'utf8'), 'unrelated evidence')
    assert(fs.existsSync(join(root, 'capture/publication.pending')))
    assert.equal(fs.existsSync(join(root, 'capture/publication.complete')), false)
  }
})
