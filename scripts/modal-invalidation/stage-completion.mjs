import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { evidenceReserves } from './evidence-writer.mjs'
const message = error => String(error).slice(0, 1024)
const digest = bytes => createHash('sha256').update(bytes).digest('hex')

// Cleanup has independent attempts, and precedes fallible artifact writes. A
// failed inspection or retention cannot skip targeted stop or terminal checks.
export function completeStage(row, { launch, show, stop, cgroupEvents, parentStorage, retain, save }) {
  let result = {}
  row.failures = []; row.logs = {}
  const attempt = (name, action) => {
    try { return action() } catch (error) { row.failures.push({ action: name, error: message(error) }); return undefined }
  }
  try {
    result = launch()
    row.exitCode = result.status; row.signal = result.signal; row.launchError = result.error ? message(result.error) : null
  } catch (error) {
    row.exitCode = null; row.signal = null; row.launchError = message(error)
  } finally {
    row.afterWait = attempt('inspect-after-wait', show)
    // Even failed inspection leaves this exact, independently owned unit as the
    // cleanup target. A nonexistent unit is accepted only after final proof.
    row.stop = attempt('stop-owned-unit', stop)
    row.final = attempt('inspect-after-stop', show)
    row.cgroupEvents = attempt('inspect-owned-cgroup', cgroupEvents)
    row.parentStorageAfter = attempt('inspect-parent-storage', parentStorage)
    attempt('verify-owned-cleanup', () => {
      assert.ok(row.stop && !row.stop.error && (row.stop.exitCode === 0 || row.final?.LoadState === 'not-found'))
      assert.ok(row.cgroupEvents === 'removed' || /^populated 0$/m.test(row.cgroupEvents), 'Owned control group is not empty')
      assert.deepEqual(row.parentStorageAfter, row.parentStorageBefore)
    })
  }
  for (const stream of ['stdout', 'stderr']) {
    attempt(`retain-${stream}`, () => {
      const captured = result[stream] ?? Buffer.alloc(0); assert.ok(Buffer.isBuffer(captured))
      const retained = captured.subarray(0, evidenceReserves.stream), discarded = captured.length - retained.length
      row.logs[stream] = { capturedBytes: captured.length, capturedSha256: digest(captured),
        retainedBytes: retained.length, retainedSha256: digest(retained), discardedBytes: discarded, truncated: discarded > 0, retained: false }
      if (discarded) row.failures.push({ action: `bound-${stream}`, error: 'Capture exceeded raw stream allowance; only labeled prefix retained' })
      retain(stream, retained); row.logs[stream].retained = true
    })
  }
  const unloaded = row.final?.LoadState === 'not-found'
  row.status = row.exitCode === 0 && !row.signal && !row.launchError && row.failures.length === 0 &&
    (unloaded || (row.final?.Result === 'success' && row.final?.ActiveState === 'inactive' && row.final?.ExecMainStatus === '0')) ? 'passed' : 'failed'
  attempt('retain-terminal-receipt', save)
  if (row.failures.length) row.status = 'failed'
  return row
}
