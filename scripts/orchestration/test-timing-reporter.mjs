// Optional diagnostics only. Never supplies a test result or changes acceptance.
import { constants, openSync, closeSync, writeSync, mkdirSync, lstatSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const MAX_FILES = 2048, MAX_BYTES = 1024 * 1024
export default async function* timingReporter(events) {
  let fd, bytes = 0, disabled = false
  const seen = new Set()
  const warn = () => { if (!disabled) process.stderr.write('PND_TIMING_DIAGNOSTIC_UNAVAILABLE\n'); disabled = true }
  try {
    const slot = process.env.PND_TEST_TIMING_SLOT
    if (!/^shard-[0-3]-group-[01]$/.test(slot ?? '')) throw new Error('Invalid slot')
    for (const path of ['work', 'work/ci', 'work/ci/timings']) {
      try { mkdirSync(path) } catch (error) { if (error.code !== 'EEXIST') throw error }
      if (!lstatSync(path).isDirectory() || lstatSync(path).isSymbolicLink()) throw new Error('Invalid directory')
    }
    fd = openSync(join('work/ci/timings', `${slot}.jsonl`), constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  } catch { warn() }
  try {
    for await (const event of events) {
      if (disabled || event.type !== 'test:summary' || !event.data?.file) continue
      try {
        const file = relative(process.cwd(), event.data.file).split('\\').join('/')
        if (!/^tests\/[^/.\0\r\n][^/\0\r\n]*\.test\.mjs$/.test(file) || seen.has(file) || seen.size >= MAX_FILES) throw new Error('Invalid file')
        const elapsed = event.data.duration_ms
        if (!Number.isFinite(elapsed) || elapsed < 0 || typeof event.data.success !== 'boolean') throw new Error('Invalid summary')
        const row = { version: 1, kind: 'node-test-summary-duration', file,
          fileSha256: hash(readFileSync(file)), reporterSha256: hash(readFileSync(fileURLToPath(import.meta.url))),
          node: process.versions.node, durationMs: elapsed, success: event.data.success }
        const line = `${JSON.stringify(row)}\n`
        bytes += Buffer.byteLength(line)
        if (bytes > MAX_BYTES) throw new Error('Diagnostic bound exceeded')
        if (writeSync(fd, line) !== Buffer.byteLength(line)) throw new Error('Partial diagnostic write')
        seen.add(file)
      } catch { warn() }
    }
  } finally { if (fd !== undefined) { try { closeSync(fd) } catch { warn() } } }
  // No yielded output: TAP owns stdout; diagnostic errors are bounded stderr notices.
}
