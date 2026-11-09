import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ownBrowser } from '../native-ui-evidence/browser-owner.mjs'
import { boundedEpisode } from '../native-ui-evidence/policy.mjs'
import { git, fullSha } from '../native-ui-evidence/identity.mjs'
import { artifactInventory, captureLimits, captureContract, candidateEntry, singleCaptureBrowser } from './policy.mjs'

export function assertCaptureResult(result) {
  assert.equal(result?.contract, captureContract)
  assert.equal(result.status, 'passed')
  assert.deepEqual(result.canonical, { status: 'passed' })
  assert.equal(result.diagnostic?.status, 'complete-comparison-only')
  assert.equal(result.diagnostic.cleanupConfirmed, true)
  assert.equal(result.contextClosed, true)
  assert.ok(Array.isArray(result.artifacts))
  const names = [...result.artifacts].sort()
  const expected = ['melee-attack.json', 'melee-capture-diagnostic.json', 'melee-attack-context.png',
    ...Array.from({ length: 4 }, (_, index) => `melee-attack-frame-${index}.png`),
    ...Array.from({ length: 4 }, (_, index) => `diagnostic-melee-B-frame-${index}.png`)].sort()
  assert.deepEqual(names, expected, 'Complete comparison requires all original and diagnostic artifacts')
  return result
}

export async function runMeleeCaptureEvidence({ browser, candidateRoot, output, url, signal,
  routeStartMs, outerDeadlineMs }) {
  assert.ok(signal && typeof signal.throwIfAborted === 'function')
  assert.ok(Number.isFinite(routeStartMs) && Number.isFinite(outerDeadlineMs) &&
    outerDeadlineMs > routeStartMs && outerDeadlineMs <= routeStartMs + captureLimits.browserMs)
  let lastNow = routeStartMs
  const withinDeadline = () => {
    const now = performance.now()
    assert.ok(Number.isFinite(now) && now >= lastNow, 'Adapter clock must not move backward')
    lastNow = now; signal.throwIfAborted()
    assert.ok(now < outerDeadlineMs, 'Original adapter deadline exhausted')
  }
  withinDeadline()
  const revision = fullSha(git(candidateRoot, 'rev-parse', 'HEAD'))
  const report = { revision, status: 'running', contract: captureContract, cleanupVerified: false,
    claim: 'One finite A/B diagnostic; canonical rendered v2 is separate and mandatory',
    originalFailureSuperseded: false, routeStartMs, outerDeadlineMs,
    errors: [], warnings: [], injectedRequests: [], expectedErrors: [], observations: [],
    accounting: { contextsRequested: 0, pagesRequested: 0, pagesObserved: 0, errors: [] } }
  // A persisted provisional result requires the successful supervised worker
  // return. Slow/failing final persistence cannot itself authenticate success.
  const save = () => writeFileSync(resolve(output, 'melee-capture-series.json'), JSON.stringify({ ...report,
    status: report.status === 'passed' ? 'retained-awaiting-host-return' : report.status,
    hostReturnRequired: true }, null, 2) + '\n')
  const owner = ownBrowser(browser, output, report, { singleBufferScreenshot: { signal, deadlineMs: outerDeadlineMs } })
  let failure
  try {
    signal.throwIfAborted()
    const entry = await import(pathToFileURL(resolve(candidateRoot, candidateEntry)).href)
    assert.equal(entry.captureDiagnosticContract, captureContract, 'Candidate lacks the reviewed finite route')
    assert.equal(typeof entry.default, 'function')
    const remaining = outerDeadlineMs - performance.now()
    assert.ok(remaining > 0, 'Original worker deadline exhausted before episode')
    owner.beginEpisode({ id: 'melee-capture-diagnostic' })
    save()
    report.result = await boundedEpisode(async episodeSignal => {
      const result = await entry.default({ browser: singleCaptureBrowser(owner.browser, report.accounting),
        url, output, expectedRevision: revision, routeStartMs, outerDeadlineMs, signal: episodeSignal })
      withinDeadline()
      assertCaptureResult(result)
      assert.deepEqual(report.accounting, { contextsRequested: 1, pagesRequested: 1, pagesObserved: 1, errors: [] })
      assert.deepEqual(report.bufferScreenshot, { attempted: 1, succeeded: 1, pending: false,
        status: 'succeeded', bytes: report.bufferScreenshot.bytes, errors: [] })
      assert.ok(report.bufferScreenshot.bytes > 0 && report.bufferScreenshot.bytes <= 8 * 1024 * 1024)
      assert.deepEqual(report.errors, [])
      assert.deepEqual(report.injectedRequests, [], 'No injected resource/error route belongs to this diagnostic')
      assert.deepEqual(report.expectedErrors, [])
      const inventory = artifactInventory(output)
      for (const name of result.artifacts) assert.ok(inventory.files.some(file => file.path === name), `Missing ${name}`)
      return result
    }, { capMs: remaining, signal, close: () => owner.closeContexts() })
    signal.throwIfAborted()
    report.status = 'passed'
  } catch (error) {
    failure = error
    report.status = 'failed'; report.failure = String(error)
  } finally {
    try { await owner.close(); report.cleanupVerified = true }
    catch (error) { report.cleanupError = String(error); failure ??= error; report.status = 'failed' }
    try {
      signal.throwIfAborted()
      withinDeadline()
      assert.deepEqual(report.errors, []); assert.deepEqual(report.accounting.errors, [])
      artifactInventory(output)
    } catch (error) { report.finalError = String(error); failure ??= error; report.status = 'failed' }
    try { save(); artifactInventory(output); withinDeadline() }
    catch (error) {
      report.artifactError = String(error); failure ??= error; report.status = 'failed'
      try { save() } catch (writeError) { report.receiptWriteError = String(writeError) }
    }
  }
  if (failure) throw failure
  try { withinDeadline() }
  catch (error) { report.status = 'failed'; report.finalError = String(error); try { save() } catch { /* Failed host return stays authoritative. */ } throw error }
  return report
}
