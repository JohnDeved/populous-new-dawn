// Complete raw artifacts are authoritative. Inline text is a bounded convenience.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { dirname, join, parse, resolve } from 'node:path'

export const RECEIPT_INLINE_BYTES = 32 * 1024
export const RECEIPT_PARSE_BYTES = 4 * 1024 * 1024
const CHUNK_BYTES = 64 * 1024
const names = ['stdout', 'stderr']
const PUBLICATION_PENDING = 'publication.pending'
const PUBLICATION_COMPLETE = 'publication.complete'
const PUBLICATION_FORMAT = 'guard-v1'
const verified = Symbol('verified complete receipt streams')
const sameNode = (a, b) => a.dev === b.dev && a.ino === b.ino && a.mode === b.mode
const sameContent = (a, b) => sameNode(a, b) && a.size === b.size && a.mtimeNs === b.mtimeNs && a.ctimeNs === b.ctimeNs
const flags = fs.constants

function attemptClose(descriptors) {
  const errors = []
  for (const fd of descriptors) {
    try { fs.closeSync(fd) } catch (error) { errors.push(error) }
  }
  return errors
}

function raiseCleanup(errors, primaryError) {
  if (errors.length) throw new AggregateError(primaryError ? [primaryError, ...errors] : errors,
    'Receipt descriptor cleanup failed', primaryError ? { cause: primaryError } : undefined)
}

function pinnedDirectories(directory, create = false) {
  const absolute = resolve(directory), root = parse(absolute).root, pins = []
  const parts = absolute.slice(root.length).split('/').filter(Boolean)
  assert(parts.length <= 128, 'Receipt path is too deep')
  let path = root
  try {
    for (const part of [null, ...parts]) {
      if (part !== null) path = join(path, part)
      let before
      try { before = fs.lstatSync(path, { bigint: true }) } catch (error) {
        if (!create || error.code !== 'ENOENT') throw error
        validateDirectories(pins)
        fs.mkdirSync(path)
        before = fs.lstatSync(path, { bigint: true })
      }
      assert(before.isDirectory(), 'Receipt ancestors must be physical directories')
      const fd = fs.openSync(path, flags.O_RDONLY | flags.O_DIRECTORY | flags.O_NOFOLLOW)
      pins.push({ path, fd, before })
      validateDirectories(pins)
    }
    return pins
  } catch (error) { raiseCleanup(attemptClose(pins.map(pin => pin.fd)), error); throw error }
}

function validateDirectories(pins) {
  for (const { path, fd, before } of pins) {
    assert(sameNode(before, fs.fstatSync(fd, { bigint: true })) &&
      sameNode(before, fs.lstatSync(path, { bigint: true })), 'Receipt ancestor changed')
  }
}

function regular(fd, path) {
  const held = fs.fstatSync(fd, { bigint: true }), named = fs.lstatSync(path, { bigint: true })
  assert(held.isFile() && named.isFile() && held.nlink === 1n && named.nlink === 1n &&
    sameNode(held, named), 'Receipt file changed, aliased or is not regular')
  return held
}

function rawStream(fd, path, keepBytes, expectedBytes) {
  const before = regular(fd, path)
  if (expectedBytes !== undefined) assert(before.size === BigInt(expectedBytes), 'Raw stream identity mismatch: size differs from descriptor')
  assert(before.size <= BigInt(Number.MAX_SAFE_INTEGER), 'Raw stream size is not representable')
  const size = Number(before.size), hash = createHash('sha256'), buffer = Buffer.alloc(CHUNK_BYTES)
  const keep = size <= keepBytes, parts = []
  let offset = 0
  while (offset < size) {
    const n = fs.readSync(fd, buffer, 0, Math.min(buffer.length, size - offset), offset)
    assert(n > 0, 'Raw stream shortened during capture')
    offset += n
    hash.update(buffer.subarray(0, n))
    if (keep) parts.push(Buffer.from(buffer.subarray(0, n)))
  }
  assert(fs.readSync(fd, buffer, 0, 1, offset) === 0 && sameContent(before, regular(fd, path)),
    'Raw stream changed during capture')
  const result = { bytes: size, sha256: hash.digest('hex'), inline: 'omitted', reason: 'over-inline-budget' }
  if (keep) {
    const bytes = Buffer.concat(parts)
    // Only a decoding error means binary output. Allocation/I/O errors propagate.
    try {
      result.text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
      result.inline = 'complete'
      delete result.reason
    } catch (error) {
      if (error.code !== 'ERR_ENCODING_INVALID_ENCODED_DATA') throw error
      result.reason = 'not-utf8'
    }
  }
  return { result, identity: before }
}

// Existing receipt and raw log handles remain open through terminal capture.
// No child-selected path is reopened for writing or hashing after execution.
export function createReceiptArtifacts(target) {
  target = resolve(target)
  const pins = pinnedDirectories(dirname(target), true), files = new Map(), captured = new Map()
  const artifacts = `${target}.artifacts`
  let committed = false, terminalValidated = false, closed = false, cleanupErrors = []
  const validate = () => {
    validateDirectories(pins)
    for (const [name, file] of files) {
      if (committed && name === 'receipt') continue
      regular(file.fd, file.path)
      if (captured.has(name)) assert(sameContent(captured.get(name), regular(file.fd, file.path)), 'Captured raw stream changed')
    }
  }
  const close = primaryError => {
    if (closed) return
    closed = true
    let finalizationError
    if (terminalValidated && !primaryError) {
      try { validate() } catch (error) { finalizationError = error }
    }
    cleanupErrors = attemptClose([...files.values(), ...pins].map(item => item.fd))
    raiseCleanup(cleanupErrors, primaryError ?? finalizationError)
    if (finalizationError) throw finalizationError
    if (terminalValidated && !primaryError) {
      // The guard predates publication and survives any validation/close failure.
      // Do not depend on a corrective write to turn a failed finalization into
      // non-evidence. All descriptors are closed before releasing eligibility.
      for (const pin of pins) assert(sameNode(pin.before, fs.lstatSync(pin.path, { bigint: true })), 'Receipt ancestor changed')
      const guard = files.get('publication'), named = fs.lstatSync(guard.path, { bigint: true })
      assert(named.isFile() && named.nlink === 1n && sameNode(guard.before, named), 'Receipt publication guard changed')
      const complete = join(artifacts, PUBLICATION_COMPLETE)
      requireAbsent(complete, 'Receipt completion marker already exists')
      fs.renameSync(guard.path, complete)
    }
  }
  try {
    fs.mkdirSync(artifacts)
    pins.push(...pinnedDirectories(artifacts))
    for (const [name, path] of [['receipt', target], ['terminal', `${target}.${randomUUID()}.tmp`],
      ...names.map(name => [name, join(artifacts, `${name}.log`)])]) {
      validateDirectories(pins)
      const fd = fs.openSync(path, flags.O_RDWR | flags.O_CREAT | flags.O_EXCL | flags.O_NOFOLLOW, 0o600)
      files.set(name, { fd, path })
      validate()
    }
    return {
      fd: name => files.get(name).fd,
      validate,
      close,
      get cleanupErrors() { return [...cleanupErrors] },
      capture() {
        const result = { streams: {} }
        for (const name of names) {
          validate()
          const file = files.get(name), { result: stream, identity } = rawStream(file.fd, file.path, RECEIPT_INLINE_BYTES)
          captured.set(name, identity)
          const { text, ...metadata } = stream
          result.streams[name] = metadata
          result[`${name}Sha256`] = stream.sha256
          if (stream.inline === 'complete') result[name] = text
        }
        validate()
        return result
      },
      write(receipt, terminal = false) {
        assert(!committed, 'Receipt is already terminal')
        validate()
        const file = files.get(terminal ? 'terminal' : 'receipt')
        const document = receipt.version === 2 ? { ...receipt, publication: PUBLICATION_FORMAT } : receipt
        const bytes = Buffer.from(JSON.stringify(document, null, 2) + '\n'), fd = file.fd
        let offset = 0
        while (offset < bytes.length) {
          const n = fs.writeSync(fd, bytes, offset, bytes.length - offset, offset)
          assert(n > 0, 'Receipt write made no progress')
          offset += n
        }
        fs.ftruncateSync(fd, bytes.length)
        validate()
        if (terminal) {
          // Keep prepared/unknown JSON intact throughout serialization and write.
          // Publish only the complete new document, retaining both pinned handles.
          // A renamed passed document is not yet eligible for ingestion. Keep
          // this owned guard through post-rename validation and descriptor close.
          if (!files.has('publication')) {
            const path = join(artifacts, PUBLICATION_PENDING)
            const fd = fs.openSync(path, flags.O_RDWR | flags.O_CREAT | flags.O_EXCL | flags.O_NOFOLLOW, 0o600)
            const guard = { fd, path }
            files.set('publication', guard)
            guard.before = fs.fstatSync(fd, { bigint: true })
          }
          validate()
          requireAbsent(join(artifacts, PUBLICATION_COMPLETE), 'Receipt completion marker already exists')
          fs.renameSync(file.path, target)
          file.path = target
          committed = true
          validate()
          terminalValidated = true
        }
        return document
      },
    }
  } catch (error) { close(error); throw error }
}

function requireAbsent(path, message) {
  try { fs.lstatSync(path) } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  assert.fail(message)
}

function requirePublishedArtifacts(artifacts, receipt) {
  requireAbsent(join(artifacts, PUBLICATION_PENDING), 'Receipt publication is pending or failed')
  assert(receipt.publication === undefined || receipt.publication === PUBLICATION_FORMAT, 'Unknown receipt publication format')
  if (receipt.publication === undefined) return // Older opt-in v2: raw-verified snapshot only.
  const complete = fs.lstatSync(join(artifacts, PUBLICATION_COMPLETE), { bigint: true })
  assert(complete.isFile() && complete.nlink === 1n, 'Receipt completion marker is not physical and exclusive')
  return complete
}

export function requireVerifiedReceiptStreams(receipt) {
  assert(receipt.version === undefined || receipt.version === 1 || receipt.version === 2, 'Unknown receipt version')
  if (receipt.version === 2) assert(receipt[verified] === true, 'Version 2 raw streams were not verified')
}

// V1 historical interpretation is unchanged. V2 evidence is materialized only at
// an explicit, bounded semantic-reader or measurement-validation boundary.
export function readReceiptStreams(repo, receiptPath, receipt, { maxBytes = RECEIPT_PARSE_BYTES } = {}) {
  if (receipt.version !== 2) { requireVerifiedReceiptStreams(receipt); return receipt }
  assert(Number.isSafeInteger(maxBytes) && maxBytes >= 0 && maxBytes <= RECEIPT_PARSE_BYTES, 'Invalid raw parse budget')
  assert(receipt.streamFormat === 'raw-artifact-v1', 'Unknown raw stream format')
  const root = resolve(repo), target = resolve(root, receiptPath)
  assert(target.startsWith(root + '/work/orchestration/') && target.endsWith('.json'), 'Receipt path escapes orchestration root')
  const artifacts = `${target}.artifacts`, pins = pinnedDirectories(artifacts), result = { ...receipt }
  let operationError
  try {
    const publication = requirePublishedArtifacts(artifacts, receipt)
    for (const name of names) {
      const path = join(artifacts, `${name}.log`), descriptor = receipt.streams?.[name]
      assert(receipt.artifacts?.[name] === path, 'Raw artifact does not match this receipt')
      assert(descriptor && Number.isSafeInteger(descriptor.bytes) && descriptor.bytes >= 0 &&
        descriptor.bytes <= maxBytes && /^[a-f0-9]{64}$/.test(descriptor.sha256), 'Invalid or oversized raw stream descriptor')
      assert(['complete', 'omitted'].includes(descriptor.inline), 'Invalid raw inline state')
      if (descriptor.inline === 'complete') assert(descriptor.bytes <= RECEIPT_INLINE_BYTES, 'Oversized inline stream')
      else assert(!Object.hasOwn(receipt, name), 'Omitted raw stream has misleading inline text')
      validateDirectories(pins)
      const fd = fs.openSync(path, flags.O_RDONLY | flags.O_NOFOLLOW | flags.O_NONBLOCK)
      let stream, rawError
      try {
        assert(regular(fd, path).size <= BigInt(maxBytes), 'Raw log exceeds semantic parse budget')
        stream = rawStream(fd, path, maxBytes, descriptor.bytes).result
      } catch (error) { rawError = error; throw error }
      finally { raiseCleanup(attemptClose([fd]), rawError) }
      validateDirectories(pins)
      assert(stream.bytes === descriptor.bytes && stream.sha256 === descriptor.sha256 &&
        stream.sha256 === receipt[`${name}Sha256`], 'Raw stream identity mismatch')
      assert(stream.inline === 'complete', 'Raw stream is not valid UTF-8')
      if (descriptor.inline === 'complete') assert(receipt[name] === stream.text, 'Inline/raw stream mismatch')
      result[name] = stream.text
    }
    validateDirectories(pins)
    const completed = requirePublishedArtifacts(artifacts, receipt)
    if (publication) assert(sameContent(publication, completed), 'Receipt completion marker changed')
    Object.defineProperty(result, verified, { value: true })
    return result
  } catch (error) { operationError = error; throw error }
  finally { raiseCleanup(attemptClose(pins.map(pin => pin.fd)), operationError) }
}
