import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createReceiptArtifacts, readReceiptStreams, requireVerifiedReceiptStreams, RECEIPT_INLINE_BYTES, RECEIPT_PARSE_BYTES } from '../scripts/orchestration/receipt-streams.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
function fixture(t) {
  const root = fs.mkdtempSync(join(tmpdir(), 'receipt-streams-')), path = 'work/orchestration/test.json', target = join(root, path)
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const evidence = createReceiptArtifacts(target)
  t.after(() => evidence.close())
  const header = { version: 2, kind: 'pnd-command-receipt', streamFormat: 'raw-artifact-v1', status: 'unknown',
    artifacts: { stdout: target + '.artifacts/stdout.log', stderr: target + '.artifacts/stderr.log' } }
  evidence.write(header)
  return { root, path, target, evidence, header }
}

test('complete small streams preserve bytes, hashes, BOM and CRLF', t => {
  const f = fixture(t), bytes = Buffer.from('\ufeff🌱\r\n')
  fs.writeSync(f.evidence.fd('stdout'), bytes)
  const receipt = { ...f.header, ...f.evidence.capture() }
  assert.equal(receipt.stdout, bytes.toString()); assert.equal(receipt.stdoutSha256, sha(bytes))
  assert.equal(receipt.stderr, ''); assert.equal(receipt.streams.stderr.bytes, 0)
  const hydrated = readReceiptStreams(f.root, f.path, receipt)
  assert.doesNotThrow(() => requireVerifiedReceiptStreams(hydrated))
  assert.throws(() => requireVerifiedReceiptStreams(JSON.parse(JSON.stringify(hydrated))), /not verified/)
})

test('exact inline boundary is complete and boundary plus one is raw-only', t => {
  const f = fixture(t), exact = Buffer.alloc(RECEIPT_INLINE_BYTES, 120), larger = Buffer.alloc(RECEIPT_INLINE_BYTES + 1, 121)
  fs.writeSync(f.evidence.fd('stdout'), exact); fs.writeSync(f.evidence.fd('stderr'), larger)
  const receipt = { ...f.header, ...f.evidence.capture() }
  assert.equal(receipt.stdout, exact.toString()); assert.equal(Object.hasOwn(receipt, 'stderr'), false)
  assert.deepEqual(receipt.streams.stderr, { bytes: larger.length, sha256: sha(larger), inline: 'omitted', reason: 'over-inline-budget' })
  assert.deepEqual(fs.readFileSync(receipt.artifacts.stderr), larger)
  assert.equal(readReceiptStreams(f.root, f.path, receipt).stderr, larger.toString())
})

test('invalid UTF-8 has exact raw hash and cannot become semantic text', t => {
  const f = fixture(t), bytes = Buffer.from([255, 128, 0])
  fs.writeSync(f.evidence.fd('stdout'), bytes)
  const receipt = { ...f.header, ...f.evidence.capture() }
  assert.equal(receipt.streams.stdout.reason, 'not-utf8'); assert.equal(receipt.stdoutSha256, sha(bytes))
  assert.equal(Object.hasOwn(receipt, 'stdout'), false)
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt), /valid UTF-8/)
})

test('semantic reader rejects budget overflow rather than truncating JSON', t => {
  const f = fixture(t)
  fs.writeSync(f.evidence.fd('stdout'), Buffer.from('{"x":"' + 'x'.repeat(RECEIPT_INLINE_BYTES) + '"}'))
  const receipt = { ...f.header, ...f.evidence.capture() }
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt, { maxBytes: 1024 }), /oversized/)
})

test('default 4 MiB semantic limit rejects complete larger output without deleting bytes', t => {
  const f = fixture(t), chunk = Buffer.alloc(64 * 1024, 120)
  for (let offset = 0; offset < RECEIPT_PARSE_BYTES; offset += chunk.length) fs.writeSync(f.evidence.fd('stdout'), chunk)
  fs.writeSync(f.evidence.fd('stdout'), 'x')
  const receipt = { ...f.header, ...f.evidence.capture() }
  assert.equal(receipt.streams.stdout.bytes, RECEIPT_PARSE_BYTES + 1)
  assert.equal(Object.hasOwn(receipt, 'stdout'), false)
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt), /oversized/)
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt, { maxBytes: RECEIPT_PARSE_BYTES + 1 }), /Invalid raw parse budget/)
  assert.equal(fs.statSync(receipt.artifacts.stdout).size, RECEIPT_PARSE_BYTES + 1)
})

test('terminal serialization and rename failures preserve prepared unknown JSON', t => {
  const f = fixture(t); fs.writeSync(f.evidence.fd('stdout'), 'retained raw')
  const receipt = { ...f.header, ...f.evidence.capture(), status: 'passed' }, prepared = fs.readFileSync(f.target)
  assert.throws(() => f.evidence.write({ ...receipt, cannotSerialize: 1n }, true), /BigInt/)
  assert.deepEqual(fs.readFileSync(f.target), prepared)
  const rename = t.mock.method(fs, 'renameSync', () => { throw Object.assign(new Error('injected rename failure'), { code: 'EIO' }) })
  assert.throws(() => f.evidence.write(receipt, true), /injected rename failure/)
  rename.mock.restore()
  assert.deepEqual(fs.readFileSync(f.target), prepared)
  assert.equal(fs.readFileSync(receipt.artifacts.stdout, 'utf8'), 'retained raw')
})

test('successful terminal publication replaces prepared JSON and caller closes all file handles', t => {
  const root = fs.mkdtempSync(join(tmpdir(), 'receipt-close-')), target = join(root, 'work/orchestration/test.json')
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const evidence = createReceiptArtifacts(target), handles = ['receipt', 'terminal', 'stdout', 'stderr'].map(name => evidence.fd(name))
  try {
    evidence.write({ status: 'unknown' })
    const preparedInode = fs.statSync(target).ino
    evidence.write({ status: 'passed', ...evidence.capture() }, true)
    assert.notEqual(fs.statSync(target).ino, preparedInode)
    assert.equal(JSON.parse(fs.readFileSync(target)).status, 'passed')
    assert(fs.existsSync(target + '.artifacts/publication.pending'))
    assert.throws(() => evidence.write({ status: 'failed' }, true), /already terminal/)
  } finally { evidence.close() }
  assert.equal(fs.existsSync(target + '.artifacts/publication.pending'), false)
  assert.equal(fs.existsSync(target + '.artifacts/publication.complete'), true)
  for (const fd of handles) assert.throws(() => fs.fstatSync(fd), { code: 'EBADF' })
  assert.doesNotThrow(() => evidence.close())
  assert.deepEqual(evidence.cleanupErrors, [])
})

test('post-rename mutation leaves a persisted pass guarded against ingestion', t => {
  const f = fixture(t); fs.writeSync(f.evidence.fd('stdout'), 'abc')
  const receipt = { ...f.header, ...f.evidence.capture(), status: 'passed' }, renameSync = fs.renameSync
  const rename = t.mock.method(fs, 'renameSync', (from, to) => {
    renameSync(from, to)
    fs.writeSync(f.evidence.fd('stdout'), 'abd', 0)
  })
  assert.throws(() => f.evidence.write(receipt, true), /Captured raw stream changed/)
  rename.mock.restore()
  f.evidence.close()
  const persisted = JSON.parse(fs.readFileSync(f.target))
  assert.equal(persisted.status, 'passed') // The child outcome is not publication eligibility.
  assert(fs.existsSync(f.target + '.artifacts/publication.pending'))
  assert.throws(() => readReceiptStreams(f.root, f.path, persisted), /publication is pending/)
  // Restoring the original bytes must not make a failed finalization eligible.
  fs.writeFileSync(receipt.artifacts.stdout, 'abc')
  assert.throws(() => readReceiptStreams(f.root, f.path, persisted), /publication is pending/)
})

test('same-byte metadata mutation during rename remains an ineligible finalization', t => {
  const f = fixture(t); fs.writeSync(f.evidence.fd('stdout'), 'abc')
  const receipt = { ...f.header, ...f.evidence.capture(), status: 'passed' }, renameSync = fs.renameSync
  const rename = t.mock.method(fs, 'renameSync', (from, to) => {
    renameSync(from, to)
    fs.futimesSync(f.evidence.fd('stdout'), new Date(0), new Date(0))
  })
  assert.throws(() => f.evidence.write(receipt, true), /Captured raw stream changed/)
  rename.mock.restore(); f.evidence.close()
  assert.equal(fs.readFileSync(receipt.artifacts.stdout, 'utf8'), 'abc')
  assert.equal(JSON.parse(fs.readFileSync(f.target)).status, 'passed')
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt), /publication is pending/)
})

test('guard descriptor is closed if its initial identity read fails', t => {
  const f = fixture(t), receipt = { ...f.header, ...f.evidence.capture(), status: 'passed' }
  const openSync = fs.openSync, fstatSync = fs.fstatSync
  let guardFd
  const open = t.mock.method(fs, 'openSync', (path, ...args) => {
    const fd = openSync(path, ...args)
    if (path.endsWith('/publication.pending')) guardFd = fd
    return fd
  })
  const stat = t.mock.method(fs, 'fstatSync', (fd, ...args) => {
    if (fd === guardFd) throw new Error('guard fstat failure')
    return fstatSync(fd, ...args)
  })
  assert.throws(() => f.evidence.write(receipt, true), /guard fstat failure/)
  open.mock.restore(); stat.mock.restore(); f.evidence.close()
  assert(Number.isInteger(guardFd))
  assert.throws(() => fs.fstatSync(guardFd), { code: 'EBADF' })
  assert.equal(JSON.parse(fs.readFileSync(f.target)).status, 'unknown')
})

test('failed guard release and descriptor cleanup cannot expose terminal evidence', t => {
  for (const fault of ['rename', 'close']) {
    const f = fixture(t), receipt = { ...f.header, ...f.evidence.capture(), status: 'passed' }
    f.evidence.write(receipt, true)
    const method = fault === 'rename' ? 'renameSync' : 'closeSync', original = fs[method]
    const mocked = t.mock.method(fs, method, value => {
      if (fault === 'close') original(value) // Do not leak the real test descriptor.
      if (fault === 'rename' || value === f.evidence.fd('terminal')) throw new Error('injected release failure')
    })
    assert.throws(() => f.evidence.close(), /release failure|cleanup failed/)
    mocked.mock.restore()
    assert(fs.existsSync(f.target + '.artifacts/publication.pending'))
    assert.throws(() => readReceiptStreams(f.root, f.path, JSON.parse(fs.readFileSync(f.target))), /publication is pending/)
  }
})

test('post-rename path replacement never reopens or rewrites the replacement', t => {
  const f = fixture(t), receipt = { ...f.header, ...f.evidence.capture(), status: 'passed' }, renameSync = fs.renameSync
  const replacement = JSON.stringify({ outside: 'preserved' })
  const rename = t.mock.method(fs, 'renameSync', (from, to) => {
    renameSync(from, to)
    renameSync(to, to + '.owned')
    fs.writeFileSync(to, replacement)
  })
  assert.throws(() => f.evidence.write(receipt, true), /changed|regular/)
  rename.mock.restore()
  f.evidence.close()
  assert.equal(fs.readFileSync(f.target, 'utf8'), replacement)
  assert.equal(JSON.parse(fs.readFileSync(f.target + '.owned')).status, 'passed')
  assert(fs.existsSync(f.target + '.artifacts/publication.pending'))
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt), /publication is pending/)
})

test('post-rename ancestor substitution retains the original guard and preserves replacement', t => {
  const f = fixture(t), receipt = { ...f.header, ...f.evidence.capture(), status: 'passed' }, renameSync = fs.renameSync
  const parent = join(f.root, 'work/orchestration'), replacement = 'unrelated replacement'
  const rename = t.mock.method(fs, 'renameSync', (from, to) => {
    renameSync(from, to)
    renameSync(parent, parent + '.original')
    fs.mkdirSync(parent); fs.writeFileSync(f.target, replacement)
  })
  assert.throws(() => f.evidence.write(receipt, true), /ancestor changed/)
  rename.mock.restore(); f.evidence.close()
  assert.equal(fs.readFileSync(f.target, 'utf8'), replacement)
  assert(fs.existsSync(parent + '.original/test.json.artifacts/publication.pending'))
  assert.equal(JSON.parse(fs.readFileSync(parent + '.original/test.json')).status, 'passed')
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt))
})

test('close attempts every held descriptor once and retains original plus cleanup failures', t => {
  const f = fixture(t), original = new Error('original capture failure'), closeSync = fs.closeSync, attempted = []
  const first = f.evidence.fd('receipt'), injected = new Error('injected close failure')
  const close = t.mock.method(fs, 'closeSync', fd => {
    attempted.push(fd)
    // Close the real test handle, then simulate the reported failure. No leak is introduced by this fixture.
    closeSync(fd)
    if (fd === first) throw injected
  })
  let failure
  try { f.evidence.close(original) } catch (error) { failure = error }
  close.mock.restore()
  assert(failure instanceof AggregateError)
  assert.deepEqual(failure.errors, [original, injected]); assert.equal(failure.cause, original)
  assert.deepEqual(f.evidence.cleanupErrors, [injected])
  assert(attempted.length > 4); assert.equal(new Set(attempted).size, attempted.length)
  for (const fd of attempted) assert.throws(() => fs.fstatSync(fd), { code: 'EBADF' })
  assert.doesNotThrow(() => f.evidence.close())
})

test('same-size raw mutation and inline mismatch cannot pass verification', t => {
  const f = fixture(t); fs.writeSync(f.evidence.fd('stdout'), 'abc')
  const receipt = { ...f.header, ...f.evidence.capture() }
  assert.throws(() => readReceiptStreams(f.root, f.path, { ...receipt, stdout: 'xyz' }), /Inline\/raw/)
  fs.writeFileSync(receipt.artifacts.stdout, 'abd')
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt), /identity mismatch/)
  assert.throws(() => f.evidence.write({ ...receipt, status: 'passed' }), /Captured raw stream changed/)
  assert.equal(JSON.parse(fs.readFileSync(f.target)).status, 'unknown')
})

test('artifact path substitution and unknown versions fail closed', t => {
  const f = fixture(t), receipt = { ...f.header, ...f.evidence.capture() }
  assert.throws(() => readReceiptStreams(f.root, f.path, { ...receipt, artifacts: { ...receipt.artifacts, stdout: '/elsewhere' } }), /does not match/)
  assert.throws(() => readReceiptStreams(f.root, f.path, { version: 3 }), /Unknown receipt version/)
})

test('misleading inline field on an omitted stream is rejected', t => {
  const f = fixture(t); fs.writeSync(f.evidence.fd('stdout'), Buffer.alloc(RECEIPT_INLINE_BYTES + 1))
  const receipt = { ...f.header, ...f.evidence.capture(), stdout: '' }
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt), /misleading/)
})

test('raw symlink replacement cannot redirect capture or terminal write', t => {
  const f = fixture(t), outside = join(f.root, 'outside')
  fs.writeFileSync(outside, 'preserved')
  fs.renameSync(f.header.artifacts.stdout, f.header.artifacts.stdout + '.original')
  fs.symlinkSync(outside, f.header.artifacts.stdout)
  assert.throws(() => f.evidence.capture(), /changed|regular/)
  assert.throws(() => f.evidence.write({ status: 'passed' }), /changed|regular/)
  assert.equal(fs.readFileSync(outside, 'utf8'), 'preserved')
})

test('hardlink aliases are refused and original raw evidence is retained', t => {
  const f = fixture(t); fs.linkSync(f.header.artifacts.stdout, join(f.root, 'alias'))
  assert.throws(() => f.evidence.capture(), /aliased/)
  assert.equal(JSON.parse(fs.readFileSync(f.target)).status, 'unknown')
})

test('ancestor replacement is detected before any terminal write', t => {
  const f = fixture(t), parent = join(f.root, 'work/orchestration')
  fs.renameSync(parent, parent + '.original'); fs.mkdirSync(parent)
  fs.writeFileSync(f.target, 'outside replacement')
  assert.throws(() => f.evidence.write({ status: 'passed' }), /ancestor changed/)
  assert.equal(fs.readFileSync(f.target, 'utf8'), 'outside replacement')
})

test('preexisting symlink ancestor is never followed for output creation', t => {
  const root = fs.mkdtempSync(join(tmpdir(), 'receipt-path-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  fs.mkdirSync(join(root, 'elsewhere')); fs.symlinkSync(join(root, 'elsewhere'), join(root, 'work'))
  assert.throws(() => createReceiptArtifacts(join(root, 'work/test.json')), /physical directories/)
  assert.deepEqual(fs.readdirSync(join(root, 'elsewhere')), [])
})

test('existing attempts are not overwritten and legacy v1 objects are unchanged', t => {
  const f = fixture(t)
  assert.throws(() => createReceiptArtifacts(f.target), { code: 'EEXIST' })
  const legacy = { version: 1, stdout: 'old', stderr: '', stdoutSha256: sha('old'), stderrSha256: sha('') }
  const before = JSON.stringify(legacy)
  assert.equal(readReceiptStreams(f.root, f.path, legacy), legacy)
  assert.equal(JSON.stringify(legacy), before)
})


test('reader rejects understated raw size before reading uncharged payload bytes', t => {
  const f = fixture(t); fs.writeSync(f.evidence.fd('stdout'), 'payload')
  const receipt = { ...f.header, ...f.evidence.capture() }
  receipt.streams.stdout.bytes = 0
  const read = t.mock.method(fs, 'readSync', () => { assert.fail('Mismatched payload must not be read') })
  assert.throws(() => readReceiptStreams(f.root, f.path, receipt), /size differs from descriptor/)
  assert.equal(read.mock.callCount(), 0)
  read.mock.restore()
})


test('a disappeared pending marker cannot turn detected finalization failure into success', t => {
  const f = fixture(t), receipt = { ...f.header, ...f.evidence.capture(), status: 'passed' }, renameSync = fs.renameSync
  const rename = t.mock.method(fs, 'renameSync', (from, to) => {
    renameSync(from, to)
    fs.unlinkSync(f.target + '.artifacts/publication.pending')
  })
  assert.throws(() => f.evidence.write(receipt, true), /ENOENT|changed/)
  rename.mock.restore(); f.evidence.close()
  const persisted = JSON.parse(fs.readFileSync(f.target))
  assert.equal(persisted.status, 'passed'); assert.equal(persisted.publication, 'guard-v1')
  assert.equal(fs.existsSync(f.target + '.artifacts/publication.pending'), false)
  assert.equal(fs.existsSync(f.target + '.artifacts/publication.complete'), false)
  assert.throws(() => readReceiptStreams(f.root, f.path, persisted), /ENOENT/)
})


test('completion-path substitution before release is preserved and cannot become success', t => {
  for (const alias of [false, true]) {
    const f = fixture(t), receipt = { ...f.header, ...f.evidence.capture(), status: 'passed' }
    f.evidence.write(receipt, true)
    const complete = f.target + '.artifacts/publication.complete', outside = join(f.root, 'outside-complete')
    fs.writeFileSync(outside, 'preserved')
    if (alias) fs.symlinkSync(outside, complete)
    else fs.writeFileSync(complete, 'preexisting')
    assert.throws(() => f.evidence.close(), /completion marker already exists/)
    assert.equal(fs.readFileSync(outside, 'utf8'), 'preserved')
    assert.equal(fs.readFileSync(complete, 'utf8'), alias ? 'preserved' : 'preexisting')
    assert.throws(() => readReceiptStreams(f.root, f.path, JSON.parse(fs.readFileSync(f.target))), /publication is pending/)
  }
})
