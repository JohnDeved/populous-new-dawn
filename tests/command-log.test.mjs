import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { captureCommand, createServerLog } from '../scripts/orchestration/command-log.mjs'
import { startGameServer, verifyContract } from '../scripts/orchestration/verify.mjs'
import { browserSourceFingerprint, captureMeasurement, discoverReceipts, evaluateCheck } from '../scripts/parity-measure.mjs'
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

function browserFixture(t, kinds = ['browser', 'browser']) {
  const f = fixture(t, { count: kinds.length })
  const manifest = json(join(f.repo, 'engineering/checks.json'))
  manifest.checks.forEach((check, i) => { check.kind = kinds[i]; check.args = ['fixture.mjs', String(i)] })
  put(f.repo, 'engineering/checks.json', manifest)
  put(f.repo, 'package-lock.json', {})
  put(f.repo, 'public/original/fixture.txt', 'synthetic only')
  put(f.repo, 'parity-history.json', [])
  put(f.repo, 'engineering/parity-capabilities.json', { version: 1, capabilities: [
    { id: 'synthetic', title: 'Synthetic', scope: 'scenario', parityId: 'group.item',
      browserCheckIds: manifest.checks.filter(check => check.kind === 'browser').map(check => check.id),
      originalCheckIds: [], limits: 'Transport only' },
  ] })
  f.git('add', '.'); f.git('commit', '-qm', 'browser transport fixture')
  return { ...f, checks: manifest.checks }
}

function assertUnverified(f, id = 'portable0') {
  const row = f.saved().verification.results.find(row => row.checkId === id)
  assert.equal(row.status, 'blocked')
  assert.deepEqual(row.coveredCheckIds, [])
  assert(row.parityMeasurements.length > 0)
  assert(row.parityMeasurements.every(item => item.status === 'blocked'))
  validateContract(f.repo, f.saved())
  const check = f.checks.find(check => check.id === id)
  const current = captureMeasurement(f.repo, [check.executable, ...check.args])[0]
  const discovered = discoverReceipts(f.repo)
  assert.equal(evaluateCheck(check, discovered.receipts, current).status, 'blocked')
  return row
}

test('owned browser segments remain unverified until stop, then promote original measurement identities', async t => {
  const f = browserFixture(t, ['browser', 'browser', 'portable', 'browser'])
  const events = [], pending = new Map()
  let starts = 0
  const result = await verifyContract(f.repo, f.contractPath, { env: {},
    startServer: async (_repo, _env, log) => {
      starts++
      const initiating = f.saved().verification.results.find(row => row.serverCapture?.log === log.slice(f.repo.length + 1))
      assert.equal(initiating.status, 'blocked')
      events.push('start')
      return { url: 'http://fixture.invalid', sourceFingerprint: browserSourceFingerprint(f.repo),
        stop: async () => {
          for (const row of f.saved().verification.results.filter(row => row.reason === 'Owned game server capture is pending finalization')) {
            pending.set(row.checkId, assertUnverified(f, row.checkId))
          }
          // Legacy adapters may return a number rather than capture metadata.
          return events.push('stop')
        } }
    },
    execute: async command => {
      const index = Number(command.at(-1))
      events.push(index)
      if (index === 1) assertUnverified(f)
      if (index === 2) assert.equal(f.saved().verification.results[0].status, 'passed')
      return { exitCode: 0, stdout: '', stderr: '', timedOut: false }
    },
  })
  assert.equal(result.status, 'passed'); assert.equal(starts, 2)
  assert.deepEqual(events, ['start', 0, 1, 'stop', 2, 'start', 3, 'stop'])
  for (const [id, before] of pending) {
    const after = result.results.find(row => row.checkId === id)
    assert.equal(after.testedFingerprint, before.testedFingerprint)
    assert.equal(after.durationMs, before.durationMs)
    assert.deepEqual(after.parityMeasurements, before.parityMeasurements.map(item => ({ ...item, status: 'passed' })))
  }
})

test('injected stop failure blocks all owned candidates and external URL is never stopped or owned-gated', async t => {
  const f = browserFixture(t)
  let stops = 0
  await assert.rejects(verifyContract(f.repo, f.contractPath, { env: {},
    startServer: async () => ({ url: 'http://fixture.invalid', stop: async () => { stops++; throw new Error('cleanup failed') } }),
    execute: async () => ({ exitCode: 0, stdout: '', stderr: '', timedOut: false }),
  }), /cleanup failed/)
  assert.equal(stops, 1); assertUnverified(f); assertUnverified(f, 'portable1')
  const supplied = browserFixture(t)
  const result = await verifyContract(supplied.repo, supplied.contractPath, { env: { POPULOUS_URL: 'http://external.invalid' },
    startServer: async () => ({ url: 'http://external.invalid', stop: async () => assert.fail('external stop must not run') }),
    execute: async command => {
      if (command.at(-1) === '1') assert.equal(supplied.saved().verification.results[0].status, 'passed')
      return { exitCode: 0, stdout: '', stderr: '', timedOut: false }
    },
  })
  assert.equal(result.status, 'passed')
})

test('server raw sink preserves observed byte order without decoding, uses bounded short writes, and retains prior attempts', t => {
  const root = temporary(t), path = join(root, 'server.log'), sink = createServerLog(path)
  const write = fs.writeSync
  let maxWrite = 0, writes = 0
  fs.writeSync = (fd, buffer, offset, length, ...args) => {
    maxWrite = Math.max(maxWrite, length); writes++
    return write(fd, buffer, offset, Math.min(length, 4096), ...args)
  }
  const expected = createHash('sha256'), chunks = [Buffer.from([0xef, 0xbb, 0xbf, 0xff, 0]), Buffer.from([0xe2]), Buffer.from([0x82, 0xac])]
  try {
    for (const bytes of chunks) { sink.write(bytes); expected.update(bytes) }
    const chunk = Buffer.alloc(65536, 120)
    for (let i = 0; i < 192; i++) { sink.write(chunk); expected.update(chunk) }
    const result = sink.finish()
    assert.equal(result.complete, true); assert.equal(sink.finish(), result)
    const metadata = json(result.path)
    assert.equal(metadata.log.sha256, expected.digest('hex'))
    assert.equal(metadata.log.bytes, 192 * 65536 + 8)
    assert.deepEqual(fs.readFileSync(path).subarray(0, 8), Buffer.concat(chunks))
    assert(maxWrite <= 65536); assert(writes > 192)
    assert.equal(Object.hasOwn(metadata, 'streams'), false)
    assert.equal(fs.readdirSync(root).filter(name => name.endsWith('.log')).length, 1)
    assert.throws(() => createServerLog(path), /setup incomplete/)
    assert.equal(json(result.path).log.sha256, metadata.log.sha256)
  } finally { fs.writeSync = write }
})

test('server raw write, read, close, descriptor mutation and publication faults stay incomplete', t => {
  for (const fault of ['write', 'read', 'close', 'terminal', 'rename', 'guard']) {
    const root = temporary(t), path = join(root, 'server.log'), sink = createServerLog(path)
    const originals = { writeSync: fs.writeSync, readSync: fs.readSync, closeSync: fs.closeSync, renameSync: fs.renameSync }
    let injected = false
    const raw = fd => fs.fstatSync(fd).ino === fs.statSync(path).ino
    if (fault === 'write') fs.writeSync = (fd, ...args) => {
      if (raw(fd)) { injected = true; throw new Error('fixture write') } return originals.writeSync(fd, ...args)
    }
    if (fault === 'read' || fault === 'terminal') fs.readSync = (fd, ...args) => {
      if (!injected && (fault === 'read' ? raw(fd) : fs.fstatSync(fd).ino === fs.statSync(path + '.capture.json').ino)) {
        injected = true
        if (fault === 'read') throw new Error('fixture read')
        const bytes = fs.readFileSync(path + '.capture.json')
        bytes[0] = 32; fs.writeFileSync(path + '.capture.json', bytes)
      }
      return originals.readSync(fd, ...args)
    }
    if (fault === 'close') fs.closeSync = fd => {
      const target = raw(fd); const result = originals.closeSync(fd)
      if (target) { injected = true; throw new Error('fixture close') } return result
    }
    if (fault === 'rename' || fault === 'guard') fs.renameSync = (from, ...args) => {
      if (String(from).endsWith(fault === 'rename' ? '.capture.json.tmp' : '.publication.pending')) {
        injected = true; throw new Error('fixture publication')
      }
      return originals.renameSync(from, ...args)
    }
    try {
      if (fault === 'write') assert.throws(() => sink.write(Buffer.from('raw')), /fixture write/)
      else sink.write(Buffer.from('raw'))
      assert.throws(() => sink.finish())
      assert.throws(() => sink.finish())
      assert(injected)
      assert(fs.existsSync(path + '.publication.pending'))
      assert(!fs.existsSync(path + '.publication.complete'))
    } finally { Object.assign(fs, originals) }
  }
})

// Only the dev-server command is substituted by a tiny owned Node child. The
// copied production verifier/capture and real OS pipes are exercised unchanged.
// Readiness is synthetic: no application modules, package manager or network.
function serverPreload(f, script, extra = '') {
  put(f.repo, 'work/server-child.cjs', script)
  put(f.repo, 'work/preload.mjs', [
    "import fs from 'node:fs'; import cp from 'node:child_process'; import { syncBuiltinESMExports } from 'node:module';",
    "const spawn=cp.spawn; let started=false;",
    "globalThis.fetch=async()=>{if(!started)throw new Error('fixture port empty');return {ok:fs.existsSync('work/server-ready')}};",
    "cp.spawn=(command,args,options)=>{if(command!=='npm')return spawn(command,args,options);",
    " const rows=JSON.parse(fs.readFileSync('work/orchestration/task.json')).verification.results;",
    " const row=rows.find(row=>row.serverCapture);if(row.status!=='blocked'||!fs.existsSync(row.serverCapture.path))throw new Error('server guard missing before spawn');",
    " started=true;const child=spawn(process.execPath,['work/server-child.cjs'],options);",
    " for(const stream of [child.stdout,child.stderr])stream.on('data',bytes=>fs.appendFileSync('work/observed.bin',bytes));return child};",
    "syncBuiltinESMExports();",
    extra,
    "syncBuiltinESMExports();",
  ].join('\n'))
}
const ordinaryServer = "const fs=require('node:fs'); process.stdout.write(Buffer.from([0xef,0xbb,0xbf,0xff])); setTimeout(()=>{process.stderr.write(Buffer.from([0,0xe2]));setTimeout(()=>{process.stdout.write(Buffer.from([0x82,0xac]));fs.writeFileSync('work/server-ready','ready')},20)},20);setInterval(()=>{},1000);"

test('copied production CLI drains owned raw server pipes and preserves repeated attempt evidence', t => {
  const f = browserFixture(t, ['browser'])
  serverPreload(f, ordinaryServer)
  const first = f.run('preload')
  assert.equal(first.status, 0, first.stderr)
  const row = f.saved().verification.results[0], capture = row.serverCapture
  assert.equal(row.status, 'passed'); assert.equal(capture.complete, true)
  const bytes = fs.readFileSync(join(f.repo, capture.log))
  assert.deepEqual(bytes, fs.readFileSync(join(f.repo, 'work/observed.bin')))
  assert.equal(bytes.length, 8)
  assert.equal(json(join(f.repo, capture.path)).log.sha256, sha(bytes))
  assert(fs.existsSync(join(f.repo, capture.log + '.publication.complete')))
  fs.unlinkSync(join(f.repo, 'work/server-ready')); fs.unlinkSync(join(f.repo, 'work/observed.bin'))
  const second = f.run('preload')
  assert.equal(second.status, 0, second.stderr)
  assert.notEqual(f.saved().verification.results[0].serverCapture.log, capture.log)
  assert.deepEqual(fs.readFileSync(join(f.repo, capture.log)), bytes)
})

test('owned production cleanup escalates only its child and capture failure blocks browser evidence', t => {
  for (const mode of ['term', 'read', 'guard', 'publish-contract']) {
    const f = browserFixture(t, ['browser'])
    let extra = ''
    if (mode === 'read') extra = "const paths=new Map(),open=fs.openSync,read=fs.readSync;fs.openSync=(path,...args)=>{const fd=open(path,...args);paths.set(fd,String(path));return fd};fs.readSync=(fd,...args)=>{if(paths.get(fd)?.match(/game-server\\.[^/]+\\.log$/))throw new Error('server read fault');return read(fd,...args)};"
    if (mode === 'guard') extra = "const rename=fs.renameSync;fs.renameSync=(from,...args)=>{if(String(from).endsWith('.log.publication.pending'))throw new Error('server guard fault');return rename(from,...args)};"
    if (mode === 'publish-contract') extra = "const rename=fs.renameSync;fs.renameSync=(from,to,...args)=>{if(String(to).endsWith('/task.json')&&JSON.parse(fs.readFileSync(from)).verification.results.some(row=>row.status==='passed'))throw new Error('contract promotion fault');return rename(from,to,...args)};"
    serverPreload(f, (mode === 'term' ? "process.on('SIGTERM',()=>{});" : '') + ordinaryServer, extra)
    const result = f.run('preload')
    if (mode === 'term') assert.equal(result.status, 0, result.stderr)
    else {
      assert.equal(result.status, 1, result.stderr)
      assertUnverified(f)
      const row = f.saved().verification.results[0]
      const log = join(f.repo, row.serverCapture.log)
      if (mode !== 'publish-contract') assert(fs.existsSync(log + '.publication.pending'))
      else assert(fs.existsSync(log + '.publication.complete'))
    }
  }
})

test('owned startup error remains blocked with a predeclared capture reference', t => {
  const f = browserFixture(t, ['browser'])
  serverPreload(f, "process.stderr.write('startup failed');process.exitCode=7")
  const result = f.run('preload')
  assert.equal(result.status, 2, result.stderr)
  const row = f.saved().verification.results[0]
  assert.equal(row.status, 'blocked'); assert(row.serverCapture.path)
  assert(fs.existsSync(join(f.repo, row.serverCapture.path)))
  assert(fs.existsSync(join(f.repo, row.serverCapture.log + '.publication.pending')))
})

test('descendant-held stdio expires as incomplete without process-group signaling', async t => {
  const f = browserFixture(t, ['browser'])
  // The descendant has its own finite self-exit and a done marker. The helper
  // never signals it; the test waits for that terminal marker before cleanup.
  const descendant = "const fs=require('node:fs');setTimeout(()=>{fs.writeFileSync('work/descendant-done','done')},5500)"
  serverPreload(f, "const fs=require('node:fs'),cp=require('node:child_process');cp.spawn(process.execPath,['-e'," + JSON.stringify(descendant) + "],{stdio:['ignore',1,2]});fs.writeFileSync('work/server-ready','ready');setInterval(()=>{},1000)")
  const result = f.run('preload')
  assert.equal(result.status, 1, result.stderr)
  assertUnverified(f)
  const deadline = Date.now() + 10000
  while (!fs.existsSync(join(f.repo, 'work/descendant-done')) && Date.now() < deadline)
    await new Promise(resolve => setTimeout(resolve, 50))
  assert(fs.existsSync(join(f.repo, 'work/descendant-done')))
  assert.match(result.stderr, /Server capture incomplete/)
})

test('interruption after owned server close but before capture publication cannot preserve a pass', async t => {
  const f = browserFixture(t, ['browser'])
  serverPreload(f, ordinaryServer,
    "const paths=new Map(),open=fs.openSync,read=fs.readSync;fs.openSync=(path,...args)=>{const fd=open(path,...args);paths.set(fd,String(path));return fd};fs.readSync=(fd,...args)=>{if(paths.get(fd)?.match(/game-server\\.[^/]+\\.log$/)){fs.writeFileSync('work/server-closed','closed');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10000)}return read(fd,...args)};")
  const child = spawn(process.execPath, ['--import', join(f.repo, 'work/preload.mjs'),
    join(f.repo, 'scripts/orchestration/verify.mjs'), '--contract', f.contractPath],
    { cwd: f.repo, env: process.env, stdio: 'ignore' })
  const closed = new Promise(resolve => child.once('close', resolve))
  try {
    const deadline = Date.now() + 10000
    while (!fs.existsSync(join(f.repo, 'work/server-closed')) && Date.now() < deadline)
      await new Promise(resolve => setTimeout(resolve, 20))
    assert(fs.existsSync(join(f.repo, 'work/server-closed')))
    assertUnverified(f)
    child.kill('SIGKILL'); await closed
    const row = assertUnverified(f)
    assert(fs.existsSync(join(f.repo, row.serverCapture.log + '.publication.pending')))
    assert(!fs.existsSync(join(f.repo, row.serverCapture.log + '.publication.complete')))
  } finally { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); await closed }
})
