import assert from 'node:assert/strict'
import { openSync, readSync, closeSync, constants } from 'node:fs'

const eventLimit = 128, textLimit = 512, fileLimit = 4096
export function boundedTimeline() {
  const report = { events: [], dropped: 0, limit: eventLimit }
  return { report, record(kind, detail = '') {
    if (report.events.length === eventLimit) { report.dropped++; return }
    report.events.push({ sequence: report.events.length + 1, at: new Date().toISOString(),
      monotonicMs: performance.now(), kind: String(kind).slice(0, 80), detail: String(detail).slice(0, textLimit) })
  } }
}
export function lifecycleRecorder(sink = () => {}) {
  const timeline = boundedTimeline()
  return { report: timeline.report, record(kind, detail) {
    timeline.record(kind, detail)
    try { sink(kind, detail) } catch (error) {
      try { timeline.report.sinkFailure = String(error).slice(0, textLimit) }
      catch { timeline.report.sinkFailure = 'Unprintable diagnostic sink failure' }
    }
  } }
}
function readBounded(path) {
  let fd
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
    const buffer = Buffer.alloc(fileLimit + 1), bytes = readSync(fd, buffer, 0, buffer.length, 0)
    return { status: 'read', text: buffer.subarray(0, fileLimit).toString('utf8').trim(), truncated: bytes > fileLimit }
  } catch (error) { return { status: 'unavailable', code: String(error.code ?? error.name).slice(0, 80) } }
  finally { if (fd !== undefined) closeSync(fd) }
}

// Only the previously proven worker service. No sibling processes, environment,
// command lines or global journal are inspected. Missing data stays unknown.
export function captureOwnedCgroup(proof, read = readBounded) {
  assert.match(proof.unit, /^pnd-modal-[1-9][0-9]*-[1-9][0-9]*-browser\.service$/)
  assert.equal(proof.controlGroup, `/system.slice/${proof.unit}`)
  const snapshot = { at: new Date().toISOString(), monotonicMs: performance.now(),
    controlGroup: proof.controlGroup, files: {}, status: 'read' }
  const membership = read('/proc/self/cgroup'); snapshot.membership = membership
  if (membership.status !== 'read' || membership.truncated || membership.text !== `0::${proof.controlGroup}`) {
    snapshot.status = 'owner-unverified'; return snapshot
  }
  snapshot.processLimits = read('/proc/self/limits')
  if (snapshot.processLimits.status !== 'read' || snapshot.processLimits.truncated) snapshot.status = 'partial'
  for (const name of ['memory.current', 'memory.peak', 'memory.events', 'memory.events.local', 'memory.swap.current',
    'pids.current', 'pids.peak', 'pids.events', 'cgroup.events', 'cgroup.procs']) {
    const value = read(`/sys/fs/cgroup${proof.controlGroup}/${name}`)
    snapshot.files[name] = value
    if (value.status !== 'read' || value.truncated) snapshot.status = 'partial'
  }
  return snapshot
}
