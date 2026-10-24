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
  let offset = 0
  assert(before.size <= BigInt(Number.MAX_SAFE_INTEGER), 'Command log size is not representable')
  while (offset < Number(before.size)) {
    const count = fs.readSync(file.fd, buffer, 0, Math.min(buffer.length, Number(before.size) - offset), offset)
    assert(count > 0, 'Command log shortened during capture')
    const bytes = buffer.subarray(0, count)
    hash.update(bytes)
    if (decoder) write(combined, Buffer.from(decoder.write(bytes)))
    offset += count
  }
  if (decoder) write(combined, Buffer.from(decoder.end()))
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

export async function captureCommand(command, { cwd, env, timeoutMs, directory }) {
  assert(Array.isArray(command) && command.length && command.every(arg => typeof arg === 'string'), 'Command arguments are required')
  assert(command[0].length, 'Command executable is required')
  assert(Number.isSafeInteger(timeoutMs) && timeoutMs > 0, 'Command timeout must be positive')
  const target = resolve(directory), pins = pinDirectories(dirname(target)), files = new Map()
  const runId = randomUUID(), descriptor = join(target, 'capture.json')
  let child, outcome, operationError, renamed = false, closing, timer
  const validate = (closed = false) => {
    validateDirectories(pins, closed)
    for (const [name, file] of files) if (!(renamed && name === 'capture.json')) regular(file, closed)
  }
  try {
    fs.mkdirSync(target)
    pins.push(...pinDirectories(target))
    for (const name of ['capture.json', 'terminal.json.tmp', 'stdout.log', 'stderr.log', 'combined.log', 'publication.pending']) {
      validateDirectories(pins)
      const path = join(target, name)
      const fd = fs.openSync(path, fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600)
      const file = { path, fd }
      files.set(name, file)
      file.before = fs.fstatSync(fd, { bigint: true })
      if (names.some(stream => name === stream + '.log') || ['combined.log', 'terminal.json.tmp'].includes(name)) file.observed = { hash: createHash('sha256'), bytes: 0 }
      validate()
    }
    const pending = { version: 1, kind: 'pnd-verification-command-log', publication: 'guard-v1', runId, status: 'pending',
      command, cwd: resolve(cwd), streams: Object.fromEntries(names.map(name => [name, { path: join(target, name + '.log') }])),
      log: join(target, 'combined.log'), limits: ['Bounded parent-memory capture only; complete raw disk growth is not bounded'] }
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
    const combined = files.get('combined.log'), streams = {}
    for (const name of names) streams[name] = hashAndDecode(files.get(name + '.log'), combined)
    if (spawnError) write(combined, Buffer.from(spawnError.message))
    const log = hashAndDecode(combined, null, false)
    const terminal = { ...pending, status: 'complete', ...outcome, streams, log,
      ...(spawnError ? { error: { code: spawnError.code, message: spawnError.message } } : {}) }
    write(files.get('terminal.json.tmp'), Buffer.from(JSON.stringify(terminal, null, 2) + '\n'))
    validate()
    requireAbsent(join(target, 'publication.complete'))
    const terminalFile = files.get('terminal.json.tmp')
    fs.renameSync(terminalFile.path, descriptor)
    terminalFile.path = descriptor
    renamed = true
    validate()
    hashAndDecode(terminalFile, null, false)
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
  return { ...outcome, capture: { version: 1, path: descriptor, runId, complete: true,
    log: files.get('combined.log').path } }
}

