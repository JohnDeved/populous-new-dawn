// Bounded parent-memory capture. Complete raw files still consume unbounded disk;
// workload admission and storage ownership remain the caller's responsibility.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { dirname, join, parse, resolve } from 'node:path'
import { StringDecoder } from 'node:string_decoder'

const CHUNK_BYTES = 64 * 1024
const sameNode = (a, b) => a.dev === b.dev && a.ino === b.ino && a.mode === b.mode
const sameContent = (a, b) => sameNode(a, b) && a.size === b.size && a.mtimeNs === b.mtimeNs && a.ctimeNs === b.ctimeNs
const names = ['stdout', 'stderr']

function pinDirectories(directory) {
  const target = resolve(directory), root = parse(target).root, pins = []
  const parts = target.slice(root.length).split('/').filter(Boolean)
  assert(parts.length <= 128, 'Command log path is too deep')
  let path = root
  try {
    for (const part of [null, ...parts]) {
      if (part !== null) path = join(path, part)
      const before = fs.lstatSync(path, { bigint: true })
      assert(before.isDirectory(), 'Command log ancestors must be physical directories')
      const fd = fs.openSync(path, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY | fs.constants.O_NOFOLLOW)
      pins.push({ path, fd, before })
      validateDirectories(pins)
    }
    return pins
  } catch (error) {
    const errors = [error]
    for (const pin of pins) try { fs.closeSync(pin.fd) } catch (failure) { errors.push(failure) }
    throw new AggregateError(errors, 'Command log directory capture failed')
  }
}

function validateDirectories(pins, closed = false) {
  for (const pin of pins) assert(sameNode(pin.before, fs.lstatSync(pin.path, { bigint: true })) &&
    (closed || sameNode(pin.before, fs.fstatSync(pin.fd, { bigint: true }))), 'Command log ancestor changed')
}

function regular(file, closed = false) {
  const named = fs.lstatSync(file.path, { bigint: true })
  assert(named.isFile() && named.nlink === 1n && sameNode(file.before, named), 'Command log changed or was aliased')
  if (!closed) {
    const held = fs.fstatSync(file.fd, { bigint: true })
    assert(held.isFile() && held.nlink === 1n && sameNode(named, held), 'Command log descriptor changed')
  }
  if (file.captured) assert(sameContent(file.captured, named), 'Captured command log changed')
  return named
}

function write(file, bytes) {
  for (let offset = 0; offset < bytes.length;) {
    const count = fs.writeSync(file.fd, bytes, offset, Math.min(CHUNK_BYTES, bytes.length - offset))
    assert(count > 0, 'Command log write made no progress')
    if (file.observed) { file.observed.hash.update(bytes.subarray(offset, offset + count)); file.observed.bytes += count }
    offset += count
  }
}

function hashAndDecode(file, combined, decode = true) {
  const before = regular(file), buffer = Buffer.alloc(CHUNK_BYTES), hash = createHash('sha256')
  const decoder = decode ? new StringDecoder('utf8') : null
  const emit = bytes => typeof combined === 'function' ? combined(bytes) : write(combined, bytes)
  let offset = 0
  assert(before.size <= BigInt(Number.MAX_SAFE_INTEGER), 'Command log size is not representable')
  while (offset < Number(before.size)) {
    const count = fs.readSync(file.fd, buffer, 0, Math.min(buffer.length, Number(before.size) - offset), offset)
    assert(count > 0, 'Command log shortened during capture')
    const bytes = buffer.subarray(0, count)
    hash.update(bytes)
    if (decoder) emit(Buffer.from(decoder.write(bytes)))
    offset += count
  }
  if (decoder) emit(Buffer.from(decoder.end()))
  assert(fs.readSync(file.fd, buffer, 0, 1, offset) === 0 && sameContent(before, regular(file)), 'Command log changed during capture')
  const sha256 = hash.digest('hex')
  if (file.observed) assert(file.observed.bytes === offset && file.observed.hash.digest('hex') === sha256,
    'Raw command log differs from observed child output')
  file.captured = before
  return { path: file.path, bytes: offset, sha256 }
}

function requireAbsent(path) {
  try { fs.lstatSync(path) } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  assert.fail('Command log completion marker already exists')
}

// The injected-executor adapter retains the historical name on its first run,
// but never truncates an earlier attempt (including a symlink).
export function writeLegacyLog(directory, name, text) {
  const pins = pinDirectories(directory)
  let file, failure
  try {
    let path = join(directory, name + '.log'), fd
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW
    try { fd = fs.openSync(path, flags, 0o600) } catch (error) {
      if (error.code !== 'EEXIST') throw error
      path = join(directory, name + '.' + randomUUID() + '.log')
      fd = fs.openSync(path, flags, 0o600)
    }
    file = { path, fd }
    file.before = fs.fstatSync(fd, { bigint: true })
    write(file, Buffer.from(text))
    file.captured = regular(file)
    validateDirectories(pins)
  } catch (error) { failure = error }
  const errors = failure ? [failure] : []
  for (const item of [...(file ? [file] : []), ...pins]) try { fs.closeSync(item.fd) } catch (error) { errors.push(error) }
  if (errors.length) throw new AggregateError(errors, 'Injected command log incomplete')
  validateDirectories(pins, true); regular(file, true)
  return file.path
}

export async function captureCommand(command, { cwd, env, timeoutMs, directory, diagnosticMode = 'eager-v1' }) {
  assert(Array.isArray(command) && command.length && command.every(arg => typeof arg === 'string'), 'Command arguments are required')
  assert(command[0].length, 'Command executable is required')
  assert(Number.isSafeInteger(timeoutMs) && timeoutMs > 0, 'Command timeout must be positive')
  assert(['eager-v1', 'raw-only-v2'].includes(diagnosticMode), 'Unsupported command diagnostic mode')
  const lazy = diagnosticMode === 'raw-only-v2'
  const target = resolve(directory), pins = pinDirectories(dirname(target)), files = new Map()
  const runId = randomUUID(), descriptor = join(target, 'capture.json')
  let child, outcome, operationError, renamed = false, closing, timer, diagnostic, descriptorHash
  const validate = (closed = false) => {
    validateDirectories(pins, closed)
    for (const [name, file] of files) if (!(renamed && name === 'capture.json')) regular(file, closed)
  }
  try {
    fs.mkdirSync(target)
    pins.push(...pinDirectories(target))
    for (const name of ['capture.json', 'terminal.json.tmp', 'stdout.log', 'stderr.log', ...(!lazy ? ['combined.log'] : []), 'publication.pending']) {
      validateDirectories(pins)
      const path = join(target, name)
      const fd = fs.openSync(path, fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600)
      const file = { path, fd }
      files.set(name, file)
      file.before = fs.fstatSync(fd, { bigint: true })
      if (names.some(stream => name === stream + '.log') || ['combined.log', 'terminal.json.tmp'].includes(name)) file.observed = { hash: createHash('sha256'), bytes: 0 }
      validate()
    }
    const pending = { version: lazy ? 2 : 1, kind: 'pnd-verification-command-log', publication: 'guard-v1', runId, status: 'pending',
      command, cwd: resolve(cwd), streams: Object.fromEntries(names.map(name => [name, { path: join(target, name + '.log') }])),
      ...(!lazy ? { log: join(target, 'combined.log') } : {}), limits: ['Bounded parent-memory capture only; complete raw disk growth is not bounded'] }
    write(files.get('capture.json'), Buffer.from(JSON.stringify(pending, null, 2) + '\n'))
    files.get('capture.json').captured = regular(files.get('capture.json'))
    let captureError, spawnError
    const failed = error => {
      captureError ??= error
      // This exact spawned child is the only process owned by this helper.
      if (child?.pid && child.exitCode === null && child.signalCode === null) {
        try { child.kill('SIGKILL') } catch (failure) { captureError = new AggregateError([captureError, failure], 'Owned child cleanup failed') }
      }
    }
    child = spawn(command[0], command.slice(1), { cwd, env, shell: false })
    closing = new Promise(resolveOutcome => {
      child.once('error', error => { spawnError = error })
      // close follows process exit and closure of its stdio, unlike exit alone.
      child.once('close', code => {
        clearTimeout(timer)
        resolveOutcome({ exitCode: spawnError ? 1 : code ?? 1, timedOut: spawnError ? false : code === null })
      })
    })
    for (const name of names) {
      child[name].on('data', chunk => {
        if (captureError) return // Partial evidence remains guarded; never promote it.
        // Synchronous bounded writes exert pipe backpressure without a retained
        // JS promise/chunk queue. A slow disk can delay event-loop timers.
        try { write(files.get(name + '.log'), chunk) } catch (error) { failed(error) }
      })
      child[name].on('error', failed)
    }
    timer = setTimeout(() => { try { child.kill('SIGKILL') } catch (error) { failed(error) } }, timeoutMs)
    outcome = await closing
    if (captureError) throw captureError
    validate()
    const combined = files.get('combined.log'), streams = {}, decodedHash = createHash('sha256')
    let decodedBytes = 0
    const emit = bytes => {
      decodedHash.update(bytes); decodedBytes += bytes.length
      assert(Number.isSafeInteger(decodedBytes), 'Diagnostic size is not representable')
      if (combined) write(combined, bytes)
    }
    for (const name of names) streams[name] = hashAndDecode(files.get(name + '.log'), emit)
    if (spawnError) emit(Buffer.from(spawnError.message))
    diagnostic = { version: 1, kind: 'utf8-stdout-then-stderr', bytes: decodedBytes, sha256: decodedHash.digest('hex') }
    const terminal = { ...pending, status: 'complete', ...outcome, streams,
      ...(lazy ? { diagnostic } : { log: hashAndDecode(combined, null, false) }),
      ...(spawnError ? { error: { code: spawnError.code, message: spawnError.message } } : {}) }
    write(files.get('terminal.json.tmp'), Buffer.from(JSON.stringify(terminal, null, 2) + '\n'))
    validate()
    requireAbsent(join(target, 'publication.complete'))
    const terminalFile = files.get('terminal.json.tmp')
    fs.renameSync(terminalFile.path, descriptor)
    terminalFile.path = descriptor
    renamed = true
    validate()
    descriptorHash = hashAndDecode(terminalFile, null, false).sha256
  } catch (error) {
    operationError = error
    if (child?.pid && child.exitCode === null && child.signalCode === null) {
      try { child.kill('SIGKILL') } catch (failure) { operationError = new AggregateError([error, failure], 'Owned child cleanup failed') }
    }
    if (closing) await closing
    clearTimeout(timer)
  }
  const errors = operationError ? [operationError] : []
  for (const file of [...files.values(), ...pins]) try { fs.closeSync(file.fd) } catch (error) { errors.push(error) }
  if (errors.length) throw new AggregateError(errors, 'Command log capture incomplete')
  validate(true)
  requireAbsent(join(target, 'publication.complete'))
  // The guard predates spawn and survives every finalization failure. A terminal
  // JSON alone is never complete evidence. Release eligibility only after close.
  fs.renameSync(files.get('publication.pending').path, join(target, 'publication.complete'))
  // No full raw or diagnostic strings cross the async capture boundary.
  return { ...outcome, capture: { version: lazy ? 2 : 1, path: descriptor, runId, complete: true,
    ...(lazy ? { sha256: descriptorHash, diagnostic } : { log: files.get('combined.log').path }) } }
}


// Materialization is deliberately opt-in. The allowance applies to the complete
// decoded derivative (including replacement characters and spawn-error suffix),
// not to raw capture growth. No partial derivative is returned as successful.
export function materializeCommandDiagnostic(reference, { directory, maxBytes } = {}) {
  assert(Number.isSafeInteger(maxBytes) && maxBytes >= 0, 'An explicit nonnegative diagnostic byte allowance is required')
  assert(reference?.version === 2 && reference.complete === true, 'A complete raw-only v2 capture is required')
  assert(typeof reference.path === 'string' && resolve(reference.path) === reference.path, 'Capture path must be absolute and canonical')
  assert(typeof reference.runId === 'string' && reference.runId.length > 0, 'Capture run identity is required')
  const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
  assert(digest(reference.sha256), 'Capture descriptor hash is required')
  const expected = reference.diagnostic
  assert(expected?.version === 1 && expected.kind === 'utf8-stdout-then-stderr' &&
    Number.isSafeInteger(expected.bytes) && expected.bytes >= 0 && digest(expected.sha256), 'Unsupported diagnostic reference')
  assert(expected.bytes <= maxBytes, 'Diagnostic exceeds the byte allowance')
  const source = dirname(reference.path)
  assert(reference.path === join(source, 'capture.json'), 'Capture descriptor must use its canonical path')
  assert(typeof directory === 'string' && directory.length > 0, 'A fresh diagnostic directory is required')
  const target = resolve(directory)
  assert(target !== source && !target.startsWith(source + '/') && !source.startsWith(target + '/'),
    'Diagnostic directory must be separate from the captured evidence')
  const pins = [], inputs = [], outputs = []
  let operationError, result, guard
  const openInput = path => {
    const before = fs.lstatSync(path, { bigint: true })
    assert(before.isFile() && before.nlink === 1n, 'Diagnostic input must be a singly linked regular file')
    // NONBLOCK prevents a raced regular-file-to-FIFO substitution from hanging.
    const fd = fs.openSync(path, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK)
    const file = { path, fd, before }
    inputs.push(file)
    regular(file)
    file.captured = before
    return file
  }
  const openOutput = path => {
    const fd = fs.openSync(path, fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600)
    const file = { path, fd }
    outputs.push(file)
    file.before = fs.fstatSync(fd, { bigint: true })
    file.observed = { hash: createHash('sha256'), bytes: 0 }
    regular(file)
    return file
  }
  const validate = (closed = false) => {
    validateDirectories(pins, closed)
    for (const file of [...inputs, ...outputs]) regular(file, closed)
    requireAbsent(join(source, 'publication.pending'))
  }
  try {
    pins.push(...pinDirectories(source))
    const publication = openInput(join(source, 'publication.complete'))
    assert(publication.before.size === 0n, 'Capture completion guard must be empty')
    requireAbsent(join(source, 'publication.pending'))
    const descriptor = openInput(reference.path)
    assert(descriptor.before.size > 0n && descriptor.before.size <= 1024n * 1024n,
      'Capture descriptor exceeds the bounded metadata allowance')
    const bytes = Buffer.alloc(Number(descriptor.before.size))
    for (let offset = 0; offset < bytes.length;) {
      const count = fs.readSync(descriptor.fd, bytes, offset, Math.min(CHUNK_BYTES, bytes.length - offset), offset)
      assert(count > 0, 'Capture descriptor shortened during read')
      offset += count
    }
    regular(descriptor)
    assert(createHash('sha256').update(bytes).digest('hex') === reference.sha256, 'Capture descriptor hash mismatch')
    const metadata = JSON.parse(bytes.toString('utf8'))
    assert(metadata.version === 2 && metadata.kind === 'pnd-verification-command-log' &&
      metadata.publication === 'guard-v1' && metadata.status === 'complete' && metadata.runId === reference.runId,
    'Capture descriptor identity or completion mismatch')
    assert(!Object.hasOwn(metadata, 'log'), 'Raw-only capture cannot name an eager log')
    assert(metadata.diagnostic?.version === expected.version && metadata.diagnostic.kind === expected.kind &&
      metadata.diagnostic.bytes === expected.bytes && metadata.diagnostic.sha256 === expected.sha256,
    'Diagnostic reference mismatch')
    assert(metadata.error === undefined || (typeof metadata.error === 'object' && metadata.error !== null &&
      typeof metadata.error.message === 'string'), 'Invalid spawn-error diagnostic')
    assert(metadata.streams && Object.keys(metadata.streams).length === names.length, 'Exactly two raw streams are required')
    const raw = names.map(name => {
      const stream = metadata.streams[name]
      assert(stream?.path === join(source, name + '.log') && Number.isSafeInteger(stream.bytes) &&
        stream.bytes >= 0 && digest(stream.sha256), 'Invalid raw stream reference')
      const file = openInput(stream.path)
      assert(file.before.size === BigInt(stream.bytes), 'Raw stream size mismatch')
      return { file, stream }
    })
    // Do not create a derivative until the bounded descriptor and source paths
    // qualify. The fresh directory is staging, not authoritative source evidence.
    pins.push(...pinDirectories(dirname(target)))
    fs.mkdirSync(target)
    pins.push(...pinDirectories(target))
    guard = openOutput(join(target, 'publication.pending'))
    const output = openOutput(join(target, 'diagnostic.log'))
    let emitted = 0
    const emit = chunk => {
      assert(chunk.length <= maxBytes - emitted, 'Diagnostic exceeds the byte allowance')
      emitted += chunk.length
      write(output, chunk)
    }
    for (const { file, stream } of raw) {
      const actual = hashAndDecode(file, emit)
      assert(actual.bytes === stream.bytes && actual.sha256 === stream.sha256, 'Raw stream hash mismatch')
    }
    if (metadata.error) emit(Buffer.from(metadata.error.message))
    const actual = hashAndDecode(output, null, false)
    assert(actual.bytes === expected.bytes && actual.sha256 === expected.sha256, 'Decoded diagnostic hash mismatch')
    hashAndDecode(guard, null, false)
    validate()
    result = { version: 1, kind: 'pnd-materialized-command-diagnostic', ...actual,
      capture: { path: reference.path, runId: reference.runId, sha256: reference.sha256 },
      publication: join(target, 'publication.complete') }
  } catch (error) { operationError = error }
  const errors = operationError ? [operationError] : []
  for (const file of [...inputs, ...outputs, ...pins]) try { fs.closeSync(file.fd) } catch (error) { errors.push(error) }
  if (errors.length) throw new AggregateError(errors, 'Command diagnostic materialization incomplete')
  validate(true)
  requireAbsent(result.publication)
  fs.renameSync(guard.path, result.publication)
  // Raw files, descriptor, historical logs and failed staging directories are
  // never rewritten, truncated or deleted by this helper.
  return result
}

// Server output historically concatenates raw chunks in observed event order.
// Keep one payload, not the command capture's decoded/per-stream representation.
export function createServerLog(logPath) {
  const pins = pinDirectories(dirname(logPath)), files = []
  let failure, finished
  const open = path => {
    const fd = fs.openSync(path, fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600)
    const file = { path, fd }
    files.push(file)
    file.before = fs.fstatSync(fd, { bigint: true })
    return file
  }
  const close = () => {
    const errors = []
    for (const file of [...files, ...pins]) try { fs.closeSync(file.fd) } catch (error) { errors.push(error) }
    return errors
  }
  const path = logPath + '.capture.json', guardPath = logPath + '.publication.pending'
  const runId = randomUUID()
  let raw, pending, terminal, guard
  try {
    raw = open(logPath)
    raw.observed = { hash: createHash('sha256'), bytes: 0 }
    pending = open(path)
    terminal = open(path + '.tmp')
    terminal.observed = { hash: createHash('sha256'), bytes: 0 }
    guard = open(guardPath)
    write(pending, Buffer.from(JSON.stringify({ version: 1, kind: 'pnd-server-log', runId,
      status: 'pending', log: logPath }) + '\n'))
  } catch (error) {
    throw new AggregateError([error, ...close()], 'Server log setup incomplete')
  }
  return {
    reference: { version: 1, path, runId, log: logPath, complete: false },
    write(bytes) {
      assert(!finished, 'Server capture already finalized')
      if (failure) throw failure
      try { write(raw, bytes) } catch (error) { failure = error; throw error }
    },
    finish(error = null) {
      if (finished) return finished()
      let result, finalError
      try {
        if (error || failure) throw error ?? failure
        validateDirectories(pins)
        const log = hashAndDecode(raw, null, false)
        write(terminal, Buffer.from(JSON.stringify({ version: 1, kind: 'pnd-server-log', runId,
          status: 'complete', log, limits: ['Raw disk growth is not bounded; direct child ownership only'] }) + '\n'))
        for (const file of files) regular(file)
        fs.renameSync(terminal.path, path)
        terminal.path = path
        // The old pending descriptor was intentionally replaced, not mutated.
        files.splice(files.indexOf(pending), 1)
        try { fs.closeSync(pending.fd) } catch (error) { throw error }
        hashAndDecode(terminal, null, false)
      } catch (error) { finalError = error }
      const errors = [...(finalError ? [finalError] : []), ...close()]
      try {
        if (errors.length) throw new AggregateError(errors, 'Server capture incomplete')
        validateDirectories(pins, true)
        for (const file of files) regular(file, true)
        requireAbsent(logPath + '.publication.complete')
        fs.renameSync(guard.path, logPath + '.publication.complete')
        result = { version: 1, path, runId, log: logPath, complete: true }
      } catch (error) { finalError = error }
      finished = () => { if (finalError) throw finalError; return result }
      return finished()
    },
  }
}
