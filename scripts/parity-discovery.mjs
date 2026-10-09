// Bounded filesystem reads for evidence discovery. No receipt interpretation here.
import fs from 'node:fs'
import { basename, dirname, resolve } from 'node:path'

export const RECEIPT_ENTRY_LIMIT = 10000
export const RECEIPT_FILE_LIMIT = 64 * 1024 * 1024
export const RECEIPT_TOTAL_LIMIT = 256 * 1024 * 1024
const CACHE_PROBE_LIMIT = 1024

export class DiscoveryLimitError extends Error {}
export class DiscoveryReadError extends Error {}

function reducedLimit(value, maximum) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum)
    throw new RangeError('Discovery limits may only be reduced')
  return value
}

export function createJsonBudget({ fileLimit = RECEIPT_FILE_LIMIT, totalLimit = RECEIPT_TOTAL_LIMIT } = {}) {
  return { fileLimit: reducedLimit(fileLimit, RECEIPT_FILE_LIMIT),
    totalLimit: reducedLimit(totalLimit, RECEIPT_TOTAL_LIMIT), bytesRead: 0 }
}

const sameFile = (a, b) => ['dev', 'ino', 'mode', 'size', 'mtimeNs', 'ctimeNs'].every(key => a[key] === b[key])
const metadata = path => fs.lstatSync(path, { bigint: true })

export function readDiscoveryJson(path, budget) {
  reducedLimit(budget.fileLimit, RECEIPT_FILE_LIMIT)
  reducedLimit(budget.totalLimit, RECEIPT_TOTAL_LIMIT)
  reducedLimit(budget.bytesRead, budget.totalLimit)
  let fd
  try {
    const before = metadata(path)
    if (!before.isFile()) throw new DiscoveryReadError('not a regular file')
    if (before.size > BigInt(budget.fileLimit)) throw new DiscoveryReadError('oversized')
    if (before.size > BigInt(budget.totalLimit - budget.bytesRead))
      throw new DiscoveryLimitError('Receipt JSON byte limit reached; no partial report written')
    // NONBLOCK also prevents a concurrent replacement with a FIFO from hanging.
    fd = fs.openSync(path, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK)
    const opened = fs.fstatSync(fd, { bigint: true })
    if (!opened.isFile() || !sameFile(before, opened) || !sameFile(before, metadata(path)))
      throw new DiscoveryReadError('changed during read')
    const size = Number(before.size), bytes = Buffer.allocUnsafe(size)
    let offset = 0
    while (offset < size) {
      const read = fs.readSync(fd, bytes, offset, Math.min(1024 * 1024, size - offset), offset)
      budget.bytesRead += read
      if (read === 0) throw new DiscoveryReadError('changed during read')
      offset += read
    }
    if (!sameFile(before, fs.fstatSync(fd, { bigint: true })) || !sameFile(before, metadata(path)))
      throw new DiscoveryReadError('changed during read')
    try {
      return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes))
    } catch {
      throw new DiscoveryReadError('invalid JSON')
    }
  } catch (error) {
    if (error instanceof DiscoveryLimitError || error instanceof DiscoveryReadError) throw error
    throw new DiscoveryReadError('unreadable')
  } finally {
    if (fd !== undefined) fs.closeSync(fd)
  }
}

export function boundedDirectoryEntries(directory, remaining) {
  reducedLimit(remaining, RECEIPT_ENTRY_LIMIT)
  const entries = [], stream = fs.opendirSync(directory)
  try {
    for (let entry; (entry = stream.readSync()) !== null;) {
      if (entries.length === remaining)
        throw new DiscoveryLimitError('Receipt discovery limit reached; no partial report written')
      entries.push(entry)
    }
  } finally {
    stream.closeSync()
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

export function verifiedNodeCompileCache(directory, root, { maxEntries = CACHE_PROBE_LIMIT } = {}) {
  reducedLimit(maxEntries, CACHE_PROBE_LIMIT)
  const parent = dirname(directory)
  if (basename(directory) !== 'node-compile-cache' || !basename(parent).endsWith('-tmp') ||
    dirname(parent) !== root) return false
  let visited = 0
  function inspect(path, accept) {
    const stream = fs.opendirSync(path)
    try {
      for (let entry; (entry = stream.readSync()) !== null;) {
        if (++visited > maxEntries || !accept(entry)) return false
      }
      return true
    } finally {
      stream.closeSync()
    }
  }
  try {
    const parentBefore = metadata(parent), rootBefore = metadata(directory)
    if (!parentBefore.isDirectory() || !rootBefore.isDirectory()) return false
    let version
    if (!inspect(directory, entry => {
      if (version || !entry.isDirectory() || !/^v\d+\.\d+\.\d+-[a-z0-9_]+-[0-9a-f]{8}-\d+$/.test(entry.name)) return false
      version = resolve(directory, entry.name)
      return true
    }) || !version) return false
    const versionBefore = metadata(version)
    if (!versionBefore.isDirectory() || !inspect(version, entry => entry.isFile() && /^[0-9a-f]{8}$/.test(entry.name)))
      return false
    return sameFile(parentBefore, metadata(parent)) && sameFile(rootBefore, metadata(directory)) &&
      sameFile(versionBefore, metadata(version))
  } catch {
    // Unknown shape, concurrent changes and errors must use ordinary discovery.
    return false
  }
}
