// No I/O on import. Synchronous hashing reuses one fixed scratch buffer.
import { openSync, readSync, closeSync } from 'node:fs'
import { createHash } from 'node:crypto'

export const HASH_CHUNK_BYTES = 64 * 1024
const scratch = Buffer.allocUnsafe(HASH_CHUNK_BYTES)
export function fileSha256(path, io = { openSync, readSync, closeSync }) {
  const digest = createHash('sha256')
  const fd = io.openSync(path, 'r')
  try {
    for (;;) {
      const count = io.readSync(fd, scratch, 0, scratch.length, null)
      if (count === 0) return digest.digest('hex')
      digest.update(scratch.subarray(0, count))
    }
  } finally {
    io.closeSync(fd)
  }
}
