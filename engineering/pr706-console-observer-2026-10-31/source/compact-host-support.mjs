import assert from 'node:assert/strict'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

// Same synchronous write points and JSON value semantics; whitespace only changes.
export function writeCompactReport(path, report) {
  writeFileSync(path, JSON.stringify(report) + '\n')
}

// Host wall time, not browser GPU/CPU timing. Begin records survive interrupted
// operations; no timers, deadline changes, retries or asynchronous writes.
export function createHostTiming(path, { now = () => performance.now(), append = appendFileSync, onError = () => {} } = {}) {
  const origin = now()
  let serial = 0
  const failures = []
  const emit = entry => {
    try { append(path, JSON.stringify(entry) + '\n') } catch (error) { failures.push(error); onError(error) }
  }
  const begin = (category, label) => {
    const span = { id: ++serial, category, label, startMs: now() - origin }
    emit({ ...span, phase: 'begin' })
    return span
  }
  const end = (span, status, error) => {
    const endMs = now() - origin
    emit({ ...span, phase: 'end', endMs, durationMs: endMs - span.startMs, status,
      ...(error === undefined ? {} : { error: String(error) }) })
  }
  return {
    async run(category, label, operation) {
      const span = begin(category, label)
      let value
      try { value = await operation() } catch (error) { end(span, 'failed', error); throw error }
      end(span, 'passed')
      if (failures.length) throw failures[0]
      return value
    },
    sync(category, label, operation) {
      const span = begin(category, label)
      let value
      try { value = operation() } catch (error) { end(span, 'failed', error); throw error }
      end(span, 'passed')
      if (failures.length) throw failures[0]
      return value
    },
  }
}

export async function closeUnusedHarness({ browser, context, page, receipt }) {
  assert.ok(receipt && !receipt.profile, 'Only the explicit non-profile harness run is supported')
  assert.ok(context && page && !page.isClosed(), 'Expected the unused live harness page')
  assert.equal(context.browser(), browser)
  assert.equal(page.context(), context)
  assert.deepEqual(context.pages(), [page], 'Never close a context containing unrelated pages')
  await context.close()
}

export async function retainActiveCase({ page, output, caseId, observe, signal, measured }) {
  const evidence = { caseId }
  if (signal.aborted) { evidence.unavailable = 'Overall deadline already aborted; no extra browser work started'; return evidence }
  try { evidence.observation = await measured('observations', 'failure-diagnostics', observe) }
  catch (error) { evidence.observationError = String(error) }
  if (signal.aborted) { evidence.screenshotUnavailable = 'Overall deadline aborted before failure screenshot'; return evidence }
  try {
    if (page && !page.isClosed()) {
      const filename = `${caseId}-failure.png`
      await measured('screenshots', 'failure', () => page.screenshot({ path: resolve(output, filename) }))
      evidence.screenshot = { filename, sha256: createHash('sha256').update(readFileSync(resolve(output, filename))).digest('hex') }
    } else evidence.screenshotUnavailable = 'Case page absent or already closed'
  } catch (error) { evidence.screenshotError = String(error) }
  return evidence
}
