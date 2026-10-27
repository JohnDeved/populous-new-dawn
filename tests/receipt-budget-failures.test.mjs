import assert from 'node:assert/strict'
import fs from 'node:fs'
import cp from 'node:child_process'
import { createHash } from 'node:crypto'
import { syncBuiltinESMExports } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { runCommandReceipt } from '../scripts/orchestration/command-receipt.mjs'
import { readReceiptStreams } from '../scripts/orchestration/receipt-streams.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
function fixture(t) {
  const repo = fs.mkdtempSync(join(tmpdir(), 'receipt-boundary-'))
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }))
  fs.writeFileSync(join(repo, '.gitignore'), 'work/\n')
  const git = (...args) => cp.execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
  git('init', '-q'); git('add', '.gitignore')
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture')
  let attempt = 0
  return { repo, run: (version, source, maxRawBytes, extra = {}) => runCommandReceipt(repo, {
    output: `work/orchestration/attempt-${++attempt}.json`, streamVersion: version,
    command: [process.execPath, '-e', source], maxRawBytes, ...extra,
  }) }
}
const raw = receipt => Object.fromEntries(['stdout', 'stderr'].map(name => [name, fs.readFileSync(receipt.artifacts[name])]))
function assertStreams(receipt) {
  for (const [name, bytes] of Object.entries(raw(receipt)))
    assert.deepEqual(receipt.rawCapture.streams[name], { bytes: bytes.length, sha256: sha(bytes) })
}

for (const version of [1, 2]) {
  test(`v${version} zero and exact combined caps preserve complete binary/BOM semantics`, async t => {
    const f = fixture(t), empty = await f.run(version, ';', 0)
    assert.equal(empty.status, 'passed'); assert.equal(empty.rawCapture.complete, true)
    assert.deepEqual(empty.rawBudget, { maxBytes: 0, usedBytes: 0, exceeded: false })
    const bytes = Buffer.from([239, 187, 191, 65, 255, 0, 13, 10])
    const receipt = await f.run(version,
      `process.stdout.write(Buffer.from(${JSON.stringify([...bytes])}));process.stderr.write('xyz')`, bytes.length + 3)
    assert.equal(receipt.status, 'passed'); assert.equal(receipt.rawCapture.complete, true)
    assert.equal(receipt.rawBudget.usedBytes, bytes.length + 3); assert.equal(receipt.rawBudget.exceeded, false)
    assert.deepEqual(raw(receipt).stdout, bytes); assertStreams(receipt)
    if (version === 1) {
      assert.equal(receipt.stdout, bytes.toString('utf8'))
      assert.equal(receipt.stdoutSha256, sha(bytes.toString('utf8')))
    } else {
      assert.equal(receipt.stdout, undefined); assert.equal(receipt.stdoutSha256, sha(bytes))
      assert.equal(receipt.streams.stdout.reason, 'not-utf8')
    }
    const eof = await f.run(version, "process.stdin.on('end',()=>process.stdout.write('eof'));process.stdin.resume()", 3)
    assert.equal(eof.status, 'passed'); assert.equal(eof.stdout, 'eof')
  })

  test(`v${version} over-limit output cannot pass even if the leader exits zero`, async t => {
    const f = fixture(t), receipt = await f.run(version,
      "require('node:fs').writeSync(1,'123456789');process.exit(0)", 8)
    assert.equal(receipt.status, 'failed'); assert.equal(receipt.rawCapture.complete, false)
    assert.equal(receipt.error.code, 'ERR_RAW_LOG_LIMIT'); assert.equal(receipt.rawBudget.usedBytes, 8)
    assertStreams(receipt)
    if (version === 2) {
      const path = receipt.artifacts.stdout.replace(f.repo + '/', '').replace('.json.artifacts/stdout.log', '.json')
      assert.throws(() => readReceiptStreams(f.repo, path, receipt), /publication is pending/)
    }
  })
}

test('configuration is rejected synchronously before output allocation or launch', t => {
  const f = fixture(t), source = "require('node:fs').writeFileSync('launched','bad')"
  for (const version of [1, 2]) {
    for (const maxRawBytes of [-1, 1.5, Infinity, NaN, '8', null, Number.MAX_SAFE_INTEGER + 1])
      assert.throws(() => f.run(version, source, maxRawBytes), /nonnegative safe integer/)
    for (const value of ['', '-1', '1.5', ' 8 ', '1e6', '9007199254740992'])
      assert.throws(() => f.run(version, source, undefined, { env: { ...process.env, POPULOUS_RECEIPT_MAX_RAW_BYTES: value } }), /safe integer/)
  }
  assert(!fs.existsSync(join(f.repo, 'work'))); assert(!fs.existsSync(join(f.repo, 'launched')))
})

test('receipt budget charges successful short writes, preserving exact output hashes', async t => {
  const f = fixture(t), originalOpen = fs.openSync, originalWrite = fs.writeSync, rawFds = new Set()
  const open = t.mock.method(fs, 'openSync', (path, ...args) => {
    const fd = originalOpen(path, ...args)
    if (/\/(stdout|stderr)\.log$/.test(String(path))) rawFds.add(fd)
    return fd
  })
  const write = t.mock.method(fs, 'writeSync', (fd, bytes, offset, length, ...rest) =>
    originalWrite(fd, bytes, offset, rawFds.has(fd) ? Math.min(length, 2) : length, ...rest))
  syncBuiltinESMExports()
  try {
    for (const version of [1, 2]) {
      const receipt = await f.run(version, "process.stdout.write('12345');process.stderr.write('abcde')", 10)
      assert.equal(receipt.status, 'passed'); assert.equal(receipt.rawBudget.usedBytes, 10)
      assert.equal(receipt.stdout, '12345'); assert.equal(receipt.stderr, 'abcde'); assertStreams(receipt)
      rawFds.clear()
    }
  } finally { open.mock.restore(); write.mock.restore(); syncBuiltinESMExports() }
})

test('failed owned-child signals bound rejection and never claim the live producer exited', async t => {
  for (const mode of ['false', 'throw']) {
    const f = fixture(t), originalSpawn = cp.spawn
    let child, realKill, closed
    const mocked = t.mock.method(cp, 'spawn', (...args) => {
      child = originalSpawn(...args); realKill = child.kill.bind(child)
      closed = new Promise(resolve => child.once('close', resolve))
      child.kill = () => { if (mode === 'throw') throw new Error('fixture signal denied'); return false }
      return child
    })
    syncBuiltinESMExports()
    try {
      const started = performance.now()
      const receipt = await f.run(2, "process.stdout.write('over');setInterval(()=>{},1000);setTimeout(()=>process.exit(0),10000)", 1)
      assert(performance.now() - started < 5000)
      assert.equal(receipt.status, 'failed'); assert.equal(receipt.rawCapture.complete, false)
      assert.equal(receipt.rawCapture.drainIncomplete, true)
      assert.equal(receipt.rawCapture.ownedChildExited, false); assert.equal(receipt.rawCapture.ownedChildPid, child.pid)
      assert.equal(receipt.exitCode, null); assert.equal(child.exitCode, null); assert.equal(child.signalCode, null)
      assert(!fs.existsSync(receipt.artifacts.stdout.replace('stdout.log', 'publication.complete')))
      assertStreams(receipt)
    } finally {
      mocked.mock.restore(); syncBuiltinESMExports()
      if (child?.exitCode === null && child.signalCode === null) realKill('SIGKILL')
      await closed
    }
  }
})

test('descendant-held output pipes are bounded only after capture failure, without descendant signals', async t => {
  const f = fixture(t)
  const descendant = "const fs=require('node:fs');process.on('SIGTERM',()=>fs.writeFileSync('signaled','bad'));fs.writeSync(1,'overflow');setTimeout(()=>fs.writeFileSync('done','yes'),3000)"
  const started = performance.now()
  const receipt = await f.run(2, `require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(descendant)}],{stdio:['ignore',1,2]});setInterval(()=>{},1000)`, 0)
  assert(performance.now() - started < 2900)
  assert.equal(receipt.status, 'failed'); assert.equal(receipt.rawCapture.drainIncomplete, true)
  const deadline = Date.now() + 5000
  while (!fs.existsSync(join(f.repo, 'done')) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20))
  assert(fs.existsSync(join(f.repo, 'done'))); assert(!fs.existsSync(join(f.repo, 'signaled')))
})

test('launch failures retain historical null exitCode and a nonpassing receipt', async t => {
  const f = fixture(t)
  for (const version of [1, 2]) {
    const receipt = await f.run(version, '', 8, { command: ['/pnd-receipt-missing-executable'] })
    assert.equal(receipt.status, 'failed'); assert.equal(receipt.exitCode, null)
    assert.equal(receipt.error.code, 'ENOENT'); assert.equal(receipt.rawCapture.complete, true)
    assertStreams(receipt)
  }
})

test('both standalone CLIs enforce the explicit environment cap and preserve exit status', t => {
  const f = fixture(t)
  const closure = ['command-receipt.mjs', 'command-receipt-v1.mjs', 'command-log.mjs',
    'receipt-streams.mjs', 'cli.mjs', 'dependency-profile.mjs', 'research-evidence.mjs', 'review-bundle.mjs']
    .map(name => 'scripts/orchestration/' + name)
    .concat(['parity-measure.mjs', 'parity-discovery.mjs', 'parity-json-metadata.mjs', 'parity-owned-checkpoint.mjs', 'parity-owned-blast.mjs'].map(name => 'scripts/' + name))
  for (const path of closure) {
    const file = join(f.repo, path); fs.mkdirSync(join(file, '..'), { recursive: true })
    fs.writeFileSync(file, fs.readFileSync(new URL('../' + path, import.meta.url)))
  }
  for (const [index, [name, flags]] of [['command-receipt.mjs', []], ['command-receipt.mjs', ['--stream-version', '2']], ['command-receipt-v1.mjs', []]].entries()) {
    for (const [kind, command] of [['overflow', [process.execPath, '-e', "require('node:fs').writeSync(1,'123456')"]], ['missing', ['/pnd-receipt-missing-executable']]]) {
      const output = `work/orchestration/cli-${index}-${kind}.json`
      const result = cp.spawnSync(process.execPath, [join(f.repo, 'scripts/orchestration', name),
        '--output', output, ...flags, '--', ...command], {
        cwd: f.repo, env: { ...process.env, POPULOUS_RECEIPT_MAX_RAW_BYTES: '5' }, encoding: 'utf8', timeout: 10000,
      })
      assert.equal(result.status, 1, result.stderr)
      const receipt = JSON.parse(fs.readFileSync(join(f.repo, output)))
      assert.equal(receipt.status, 'failed'); assert.equal(receipt.rawBudget.maxBytes, 5)
      if (kind === 'overflow') { assert.equal(receipt.rawCapture.complete, false); assert.equal(receipt.rawBudget.usedBytes, 5) }
      else { assert.equal(receipt.exitCode, null); assert.equal(receipt.error.code, 'ENOENT') }
    }
  }
})

test('legacy raw verification and decoding use one bounded pass with UTF-8 split across reads', async t => {
  const f = fixture(t), originalRead = fs.readSync, originalReadFile = fs.readFileSync
  const read = t.mock.method(fs, 'readSync', (fd, buffer, offset, length, position) =>
    originalRead(fd, buffer, offset, Math.min(length, 1), position))
  const readFile = t.mock.method(fs, 'readFileSync', (path, ...args) => {
    assert(!/\/(stdout|stderr)\.log$/.test(String(path)), 'Do not reopen complete raw output for a second unbounded read')
    return originalReadFile(path, ...args)
  })
  syncBuiltinESMExports()
  try {
    const bytes = Buffer.from([239, 187, 191, 240, 159, 140, 177, 255, 226, 130])
    const receipt = await f.run(1, `process.stdout.write(Buffer.from(${JSON.stringify([...bytes])}))`, bytes.length)
    assert.equal(receipt.status, 'passed'); assert.equal(receipt.stdout, bytes.toString('utf8'))
    assert.equal(receipt.stdoutSha256, sha(bytes.toString('utf8')))
    assert.equal(receipt.rawCapture.streams.stdout.sha256, sha(bytes))
  } finally { read.mock.restore(); readFile.mock.restore(); syncBuiltinESMExports() }
})

test('an explicit programmatic allowance overrides an invalid environment fallback', async t => {
  const f = fixture(t)
  for (const version of [1, 2]) {
    const receipt = await f.run(version, "process.stdout.write('exact')", 5,
      { env: { ...process.env, POPULOUS_RECEIPT_MAX_RAW_BYTES: 'ignored-invalid-fallback' } })
    assert.equal(receipt.status, 'passed')
    assert.deepEqual(receipt.rawBudget, { maxBytes: 5, usedBytes: 5, exceeded: false })
  }
})
