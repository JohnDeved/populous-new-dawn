import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, lstatSync, statfsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [candidateArg, baselineArg, outputArg] = process.argv.slice(2)
assert.ok(candidateArg && baselineArg && outputArg)
const candidate = resolve(candidateArg), baseline = resolve(baselineArg), output = resolve(outputArg)
assert.ok(!existsSync(output)); mkdirSync(output, { recursive: true })
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
assert.equal(git(candidate, 'rev-parse', 'HEAD'), 'c078343e705cf31b194a6326f82b752f90c0ca23')
assert.equal(git(baseline, 'rev-parse', 'HEAD'), '480a1493a62c3b015ae97ebb22dfc20b6b284eae')
for (const path of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'eslint.config.mjs'])
  assert.deepEqual(readFileSync(resolve(candidate, path)), readFileSync(resolve(baseline, path)), path)
assert.equal(existsSync(resolve(candidate, '.npmrc')), false, 'No untracked pnpm config override')
assert.equal(existsSync(resolve(baseline, '.npmrc')), false, 'No untracked baseline config override')
const source = root => Object.fromEntries(execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).map(path => [path, sha256(readFileSync(resolve(root, path)))]))
const dependencies = root => {
  const entries = {}
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const name = prefix + entry.name, path = resolve(dir, entry.name)
      if (entry.isDirectory()) walk(path, name + '/')
      else if (entry.isFile()) { const stat = statSync(path); entries[name] = [stat.size, stat.mtimeMs] }
    }
  }
  assert.equal(lstatSync(resolve(root, 'node_modules')).isSymbolicLink(), false)
  walk(resolve(root, 'node_modules'))
  return sha256(JSON.stringify(entries))
}
const before = { candidate: source(candidate), baseline: source(baseline), dependencies: { candidate: dependencies(candidate) } }
const receipt = { status: 'running', command: ['pnpm', 'run', 'lint', '--format', 'json', '--no-cache'],
  candidate: git(candidate, 'rev-parse', 'HEAD'), baseline: git(baseline, 'rev-parse', 'HEAD'),
  scenarioSha256: sha256(readFileSync(import.meta.filename)), source: before, runs: [],
  limits: ['Normal full lint script, JSON reporter and cache disabled; no file-selection omissions.',
    'Candidate uses an independent normal frozen-lockfile installation. Baseline source/config is checked out for identity; completed baseline lint is retained from run42762369253, not repeated here.',
    'Dependency preservation compares regular-file size/mtime, not cryptographic identity or symlink targets.',
    'Both source trees are pristine in this lint-only retry. Any untracked targets and diagnostics remain separately identified.',
    'Baseline-attributed failures are not clean passes and do not replace the final Full check/build.'] }
const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
async function lint(side, root) {
  const available = Number(readFileSync('/proc/meminfo', 'utf8').match(/^MemAvailable:\s+(\d+) kB$/m)[1]) * 1024
  const disk = statfsSync(root)
  assert.ok(available >= 3.75 * 1024 ** 3); assert.ok(disk.bavail * disk.bsize >= 4 * 1024 ** 3); assert.ok(disk.ffree >= 50000)
  const run = { side, commit: git(root, 'rev-parse', 'HEAD'), startedAt: new Date().toISOString(),
    admission: { availableMemory: available, availableDisk: disk.bavail * disk.bsize, freeInodes: disk.ffree } }
  receipt.runs.push(run); save()
  const child = spawn('pnpm', ['run', 'lint', '--format', 'json', '--no-cache'], { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  const chunks = { stdout: [], stderr: [] }; let bytes = 0
  const kill = signal => { if (child.pid) try { process.kill(-child.pid, signal) } catch (e) { if (e.code !== 'ESRCH') throw e } }
  const collect = stream => chunk => {
    bytes += chunk.length
    if (bytes > 32 * 1024 ** 2) { run.outputOverflow = true; kill('SIGTERM'); return }
    chunks[stream].push(chunk)
  }
  child.stdout.on('data', collect('stdout')); child.stderr.on('data', collect('stderr'))
  const timer = setTimeout(() => { run.timedOut = true; kill('SIGTERM') }, 120000)
  const force = setTimeout(() => { run.forced = true; kill('SIGKILL') }, 125000)
  await new Promise(done => {
    child.once('error', error => { run.error = String(error) })
    child.once('close', (code, signal) => { Object.assign(run, { code, signal }); done() })
  })
  clearTimeout(timer); clearTimeout(force)
  for (const stream of ['stdout', 'stderr']) {
    const buffer = Buffer.concat(chunks[stream]); writeFileSync(resolve(output, `${side}-${stream}.log`), buffer)
    run[stream] = { bytes: buffer.length, sha256: sha256(buffer) }
  }
  run.finishedAt = new Date().toISOString(); save()
  const groupAlive = () => { try { process.kill(-child.pid, 0); return true } catch (e) { if (e.code !== 'ESRCH') throw e; return false } }
  if (child.pid && groupAlive()) {
    run.unexpectedSurvivors = true
    kill('SIGTERM')
    let deadline = Date.now() + 5000
    while (groupAlive() && Date.now() < deadline) await new Promise(done => setTimeout(done, 25))
    if (groupAlive()) {
      kill('SIGKILL'); deadline = Date.now() + 5000
      while (groupAlive() && Date.now() < deadline) await new Promise(done => setTimeout(done, 25))
    }
    run.cleanupVerified = !groupAlive(); save()
    throw Error('Unexpected owned lint descendants survived command completion; cleanup=' + run.cleanupVerified)
  }
  run.cleanupVerified = true; save()
  assert.equal(run.error, undefined); assert.equal(run.timedOut, undefined); assert.equal(run.forced, undefined); assert.equal(run.outputOverflow, undefined)
  assert.ok(run.code === 0 || run.code === 1, 'Lint infrastructure failure, not ordinary diagnostics')
  const stdout = Buffer.concat(chunks.stdout).toString('utf8'), lines = stdout.split(/\r?\n/)
  const payloads = lines.filter(line => line.startsWith('[{"filePath"'))
  assert.equal(payloads.length, 1, 'Require exactly one complete ESLint JSON line')
  assert.ok(lines.every(line => !line || line === payloads[0] || line === '[ELIFECYCLE] Command failed with exit code 1.'), 'Unexpected lint stdout outside JSON')
  const results = JSON.parse(payloads[0])
  assert.ok(Array.isArray(results) && results.length > 1000, 'Require complete repository lint scope')
  const diagnostics = []
  run.untrackedTargets = []
  for (const file of results) {
    assert.ok(file.filePath.startsWith(root + '/'))
    const path = file.filePath.slice(root.length + 1), lines = readFileSync(file.filePath, 'utf8').split('\n')
    const tracked = Object.hasOwn(before[side], path)
    if (!tracked) run.untrackedTargets.push(path)
    for (const m of file.messages) diagnostics.push({ path, tracked, ruleId: m.ruleId, severity: m.severity, message: m.message,
      sourceLine: m.line ? lines[m.line - 1]?.trim() : null, line: m.line, column: m.column, endLine: m.endLine, endColumn: m.endColumn, fatal: m.fatal ?? false })
  }
  run.fatalErrors = diagnostics.filter(d => d.fatal).length
  run.result = run.code === 0 ? 'passed' : run.fatalErrors ? 'failed-with-parse-diagnostics' : 'failed-with-diagnostics'
  run.files = results.length; run.errors = diagnostics.filter(d => d.severity === 2).length; run.warnings = diagnostics.filter(d => d.severity === 1).length
  writeFileSync(resolve(output, `${side}-diagnostics.json`), JSON.stringify(diagnostics, null, 2) + '\n')
  save(); return diagnostics
}
try {
  save()
  await lint('candidate', candidate)
  receipt.status = receipt.runs[0].result
  receipt.baselineReference = { runId: '42762369253', artifactId: '13738685071', commit: '480a1493a62c3b015ae97ebb22dfc20b6b284eae', stdoutSha256: '5e34be0f3f59a1f501a2ae0125faaef9532f21d9e5bf504f6f7d1dac45e062da', note: 'Complete failed baseline diagnostics retained separately; this candidate-only receipt does not claim a comparison or a clean baseline.' }
  process.exitCode = receipt.runs[0].code
} catch (error) { receipt.status = 'failed'; receipt.failure = error.stack ?? String(error); process.exitCode = 1 }
finally {
  try {
    assert.deepEqual(source(candidate), before.candidate); assert.deepEqual(source(baseline), before.baseline)
    assert.equal(dependencies(candidate), before.dependencies.candidate)
    assert.equal(git(candidate, 'diff', '--name-only', 'HEAD', '--'), ''); assert.equal(git(baseline, 'diff', '--name-only', 'HEAD', '--'), '')
    receipt.inputsUnchanged = true
  } catch (error) { receipt.status = 'failed'; receipt.inputFailure = String(error); process.exitCode = 1 }
  save()
}
