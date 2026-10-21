import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const diagnosticMs = 1000, maximumBytes = 512 * 1024
async function bounded(operation) {
  let timer
  try {
    return await Promise.race([operation, new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error('Profile input trace diagnostic deadline')), diagnosticMs)
    })])
  } finally { clearTimeout(timer) }
}

// One narrow trace of the real input interval, not a replacement input path.
// No screenshots, DOM snapshots, sources or network resources are collected.
// The existing scenario owns/closes the context even if trace cleanup stalls.
export async function traceProfileInput(context, report, output, run) {
  const record = report.inputActionTrace = { status: 'starting', options: {
    screenshots: false, snapshots: false, sources: false,
  }, diagnosticMs, maximumBytes }, started = performance.now(),
    directory = mkdtempSync(resolve(output, '.profile-input-trace-')),
    path = resolve(directory, 'trace.zip')
  let value, primary, stopped = false
  try {
    await bounded(context.tracing.start(record.options))
    record.status = 'recording'
    record.inputStartedMs = performance.now() - started
    try { value = await run() }
    catch (error) { primary = error; record.inputError = String(error) }
    finally { record.inputFinishedMs = performance.now() - started }
  } catch (error) { primary ??= error; record.startError = String(error) }
  finally {
    let late = false, stopSettled = false
    const remove = () => {
      try { rmSync(directory, { recursive: true, force: true }) }
      catch (error) { record.removeError = String(error) }
    }
    const stopping = Promise.resolve().then(() => context.tracing.stop({ path }))
    const settled = () => { stopSettled = true; if (late) remove() }
    void stopping.then(settled, settled)
    try {
      await bounded(stopping)
      stopped = true
      const size = statSync(path).size
      if (size > maximumBytes) throw Error(`Profile input trace exceeds ${maximumBytes} bytes`)
      const bytes = readFileSync(path)
      record.archive = { format: 'Playwright trace ZIP, base64', bytes: size,
        sha256: createHash('sha256').update(bytes).digest('hex'), base64: bytes.toString('base64') }
      record.status = 'retained'
    } catch (error) { late = !stopped; record.status = 'diagnostic-failed'; record.cleanupError = String(error) }
    finally {
      record.stopped = stopped
      record.elapsedMs = performance.now() - started
      // This fresh exclusive directory contains only our temporary trace. Remove
      // partial output after either stop outcome; late settlement also removes it.
      // The bounded JSON copy is retained by the existing workflow.
      if (stopSettled) remove()
    }
  }
  if (primary) throw primary
  return value
}
