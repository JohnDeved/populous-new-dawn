import assert from 'node:assert/strict'
import {
  readFileSync,
  writeFileSync,
  statfsSync,
  lstatSync,
  readdirSync,
  existsSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { protocol } from './protocol.mjs'
export const sha = bytes => createHash('sha256').update(bytes).digest('hex')
export const fileSha = p => sha(readFileSync(p))
export function space(path, start = false) {
  const s = statfsSync(path, { bigint: true }),
    free = s.bavail * s.bsize
  assert.ok(
    free >= BigInt(start ? protocol.minimumStartBytes : protocol.minimumFreeBytes),
    'Disk safety floor'
  )
  return String(free)
}
export function accounting(path) {
  const seen = new Set()
  let physicalBytes = 0,
    logicalBytes = 0,
    files = 0
  function visit(path) {
    if (!existsSync(path)) return
    const s = lstatSync(path)
    if (s.isSymbolicLink()) return
    if (s.isDirectory()) {
      for (const p of readdirSync(path)) visit(join(path, p))
      return
    }
    logicalBytes += s.size
    files++
    const key = `${s.dev}:${s.ino}`
    if (!seen.has(key)) {
      seen.add(key)
      physicalBytes += s.size
    }
  }
  visit(path)
  return { physicalBytes, logicalBytes, files, uniqueFiles: seen.size }
}
export const bytes = path => accounting(path).physicalBytes
export function save(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}
