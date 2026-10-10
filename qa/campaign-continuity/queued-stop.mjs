// Host-only observation of the next task-owned command. Never executes a command.
import { createHash } from 'node:crypto'
import { openSync, closeSync, fstatSync, lstatSync, readFileSync, constants } from 'node:fs'
import { resolve } from 'node:path'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function readQueuedPreservingStop(commandsPath, ordinal, runId, { includeOrdinary = false } = {}) {
  if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 501 || !runId) throw Error('Invalid current-run stop boundary')
  const path = resolve(commandsPath, `${String(ordinal).padStart(4, '0')}.json`)
  let fd
  try { fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW) }
  catch (error) { if (error.code === 'ENOENT') return null; throw error }
  let bytes, before
  try {
    before = fstatSync(fd)
    if (!before.isFile() || before.nlink !== 1 || before.uid !== process.getuid() || before.size > 65536)
      throw Error('Queued stop must be a bounded owned regular file')
    bytes = readFileSync(fd)
    const after = fstatSync(fd), named = lstatSync(path)
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs || named.isSymbolicLink() ||
      named.ino !== before.ino || named.dev !== before.dev) throw Error('Queued command changed while inspected')
  } finally { closeSync(fd) }
  const record = { path, ordinal, runId, bytes, sha256: sha256(bytes) }
  let commands
  try { commands = JSON.parse(bytes) } catch {
    // An incomplete/malformed control cannot safely be classified as ordinary.
    // Retain its exact readable bytes and stop with preservation intent.
    return { ...record, preserving: true, valid: false, reason: 'Malformed queued command JSON' }
  }
  const preserving = Array.isArray(commands)
    ? commands.some(command => command?.action === 'stop-preserve-latest')
    : commands?.action === 'stop-preserve-latest'
  if (!preserving) return includeOrdinary ? { ...record, preserving: false } : null
  const valid = Array.isArray(commands) && commands.length === 1 &&
    Object.keys(commands[0]).every(key => ['action', 'runId'].includes(key)) &&
    (commands[0].runId === undefined || commands[0].runId === runId)
  return { ...record, preserving: true, valid,
    reason: valid ? null : 'Preserving stop must be the sole command and match the current run' }
}

export async function pollWithPreservation(check, { checkStop, timeout, label,
  interval = 100, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now }) {
  if (!Number.isFinite(timeout) || timeout <= 0) throw Error('Polling requires a finite positive timeout')
  const deadline = now() + timeout
  for (;;) {
    await checkStop()
    if (await check()) return
    if (now() >= deadline) throw Error(`Timed out waiting for ${label}`)
    await sleep(interval)
  }
}
