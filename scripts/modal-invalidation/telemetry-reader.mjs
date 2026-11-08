import assert from 'node:assert/strict'
import { openSync, readSync, closeSync } from 'node:fs'
// Short reads are not EOF on procfs. Bound allocation and cumulative reads,
// but continue until zero bytes or maximum + 1 establishes overflow.
export function readTextBounded(path, maximum, reader = readSync) {
  assert.ok(Number.isSafeInteger(maximum) && maximum > 0)
  const fd = openSync(path, 'r')
  try {
    const data = Buffer.alloc(maximum + 1); let count = 0
    while (count < data.length) {
      const bytes = reader(fd, data, count, data.length - count, count)
      assert.ok(Number.isSafeInteger(bytes) && bytes >= 0 && bytes <= data.length - count)
      if (bytes === 0) break
      count += bytes
    }
    return { text: data.subarray(0, Math.min(count, maximum)).toString('utf8'), bytes: Math.min(count, maximum),
      complete: count <= maximum, truncated: count > maximum }
  } finally { closeSync(fd) }
}
