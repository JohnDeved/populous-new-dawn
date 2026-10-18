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
export function bytes(path) {
  if (!existsSync(path)) return 0
  const s = lstatSync(path)
  if (s.isSymbolicLink()) return 0
  return s.isDirectory() ? readdirSync(path).reduce((n, p) => n + bytes(join(path, p)), 0) : s.size
}
export function save(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}
