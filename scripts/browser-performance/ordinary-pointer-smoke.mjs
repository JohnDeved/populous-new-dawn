// Separately selected functional smoke. No comparative report or default cohort.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { captureOrdinaryPointerBrowser } from './ordinary-pointer-browser-adapter.mjs'
import { ordinaryPointerWallWatchdog } from './ordinary-pointer-driver-primitives.mjs'
import { ordinaryPointerSmokePolicy as policy, ordinaryPointerSmokeArtifact,
  closeOrdinaryPointerSmokeOwner } from './ordinary-pointer-smoke-policy.mjs'

async function prepareOrdinaryPointerSmoke({ page, url, output, source, expectedRevision, dist, receipt, save, assertActive }) {
  const step = async operation => { assertActive(); const value = await operation(); assertActive(); return value }
  const { loadSnapshot, observeSnapshotState, assertSnapshotAdmission, createSnapshotFixture, validateSnapshotFixture } = await import('./snapshot-setup.mjs')
  const { readerDependencyManifest, readerBundleManifest, readerBuildProvenance, readerSourceEvidence } = await import('./reader-build.mjs')
  const { inspectDragSource } = await import('./snapshot-drag-contract.mjs')
  const { readerImportSha256 } = await import('./snapshot-reader-proof.mjs')
  const { plan, invariant } = await import('./snapshot-protocol.mjs')
  const { createSnapshotGeometryObserver } = await import('./snapshot-geometry.mjs')
  const { installSnapshotPhaseGeometry, recordSnapshotReaders } = await import('./snapshot-capture.mjs')
  assertActive()
  assert.ok(dist, 'Source/runtime reader provenance required')
  const root = resolve(import.meta.dirname, '../..'), dependencies = readerDependencyManifest(root), bundle = readerBundleManifest(dist)
  const dragSource = inspectDragSource(root), readerSource = readerSourceEvidence(root, dragSource)
  assert.ok(readerSource.profile && readerSource.importSha256 === readerImportSha256, 'Unadmitted source/import reader contract')
  const readerProvenance = readerBuildProvenance(root, dependencies, bundle,
    ['scripts/tutorial-browser/build-home.mjs', 'scripts/tutorial-browser/fixture/main.tsx', 'scripts/browser-performance/reader-build.mjs'])
  receipt.provenance = { dependencies, bundle, dragSource, readerSource, readerProvenance }; save()
  const fixture = await step(() => createSnapshotFixture({ source })), { transferText, expectedText } = validateSnapshotFixture(fixture)
  for (const [name, text] of [['ordinary-pointer-transfer.json', transferText], ['ordinary-pointer-expected.json', expectedText],
    ['ordinary-pointer-source.json', JSON.stringify(fixture.receipt)]]) {
    assert.ok(Buffer.byteLength(text) <= policy.artifactBytes, 'Fixture artifact exceeds fixed cap')
    assertActive()
    writeFileSync(resolve(output, name), text, { flag: 'wx' })
  }
  receipt.setup = await step(() => loadSnapshot({ page, url, fixture, expectedRevision })); save()
  await step(() => page.evaluate(() => {
    const d = Object.getOwnPropertyDescriptor(globalThis, '__pndReaderTypes')
    if (!d || d.writable !== false || d.configurable !== false || !Object.isFrozen(d.value) || typeof d.value.Matrix4 !== 'function')
      throw Error('Trusted fixture reader binding missing')
    window.__pndSnapshotReaderSession = { Matrix4: d.value.Matrix4 }
  }))
  await step(() => page.mouse.move(900, 400))
  receipt.warmupBefore = await step(() => page.evaluate(observeSnapshotState))
  await step(() => page.waitForTimeout(plan.warmupMs))
  receipt.warmupAfter = await step(() => page.evaluate(observeSnapshotState))
  assertSnapshotAdmission(receipt.warmupAfter, fixture)
  assert.equal(invariant(receipt.warmupBefore), invariant(receipt.warmupAfter))
  const graph = page.locator('.fps-graph'); await step(() => graph.waitFor({ state: 'hidden' }))
  await step(() => page.keyboard.press('F8')); await step(() => graph.waitFor({ state: 'visible' }))
  assertActive()
  const handle = await page.waitForFunction(() => window.testSceneRef.current.fpsGraph.samples.recentCount >= 2)
  await handle.dispose()
  assertActive()
  receipt.before = await step(() => page.evaluate(observeSnapshotState)); assertSnapshotAdmission(receipt.before, fixture)
  const evidence = await step(() => page.evaluate(installSnapshotPhaseGeometry, createSnapshotGeometryObserver.toString()))
  assert.equal(recordSnapshotReaders({ report: receipt, evidence, readerSource, readerProvenance, save }), true,
    'Unadmitted actual runtime reader evidence')
  save()
  return () => {
    assert.equal(readerDependencyManifest(root).sha256, dependencies.sha256)
    assert.deepEqual(readerBundleManifest(dist), bundle)
  }
}

export default async function ordinaryPointerSmoke({ browser, url, output, source, expectedRevision, dist,
  prepare = prepareOrdinaryPointerSmoke, capture = captureOrdinaryPointerBrowser,
  watchdog = ordinaryPointerWallWatchdog, closeOwner = closeOrdinaryPointerSmokeOwner, receipt = {} }) {
  Object.assign(receipt, { version: 1, role: policy.role, sourceCommit: source.commit, expectedRevision,
    status: 'incomplete', policy, comparisonEligible: false, errors: [],
    limits: ['One candidate functional capture, not scheduling calibration, A/A or speedup.',
      'Observed cleanup and operation settlement are separate; no process-tree termination proof.',
      'Unsupported event normalization must fail rather than relax the observer policy.'] })
  let finalized = false, terminal = false
  const save = () => { if (!finalized) writeFileSync(resolve(output, 'ordinary-pointer-smoke.json'), ordinaryPointerSmokeArtifact(receipt)) }
  let context, result, verify, primary, failed = false, operationSettled = false,
    contextRequested = false, contextCreationSettled = false, rawWritten = false
  try {
    save()
    const outer = await watchdog(async signal => {
      try {
      const check = () => { if (signal.aborted) throw signal.reason; if (terminal || finalized) throw Error('Smoke already terminal') }
      check(); contextRequested = true
      try { context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 }) }
      finally { contextCreationSettled = true }
      check(); const page = await context.newPage(); page.setDefaultTimeout(15000)
      const error = value => { if (!finalized && receipt.errors.length < 20) receipt.errors.push(String(value).slice(0, 2000)) }
      page.on('pageerror', error); page.on('crash', () => error('Page crashed'))
      page.on('console', message => { if (message.type() === 'error') error(message.text()) })
      const preparation = {}
      check(); verify = await prepare({ page, url, output, source, expectedRevision, dist, receipt: preparation,
        assertActive: check, save: () => { check(); receipt.preparation = structuredClone(preparation); save() } })
      check(); receipt.preparation = structuredClone(preparation); receipt.readerAdmission = preparation.readerAdmission
      assert.equal(receipt.readerAdmission, 'admitted', 'Runtime readers must be admitted before opt-in')
      result = await capture({ page, enabled: true })
      check() // Never materialize a late result after the terminal receipt.
      writeFileSync(resolve(output, 'ordinary-pointer-raw.json'), ordinaryPointerSmokeArtifact(result), { flag: 'wx' })
      rawWritten = true; check()
      assert.equal(result.outcome.status, 'completed', 'Adapter failed; inspect raw outcome/normalization diagnostics')
      assert.equal(result.comparisonEligible, false)
      assert.equal(result.cleanupConfirmed, true); assert.equal(result.observerCleanupConfirmed, true)
      assert.equal(result.operationSettled, true); assert.equal(result.waitCleanupFailed, false)
      assert.deepEqual(receipt.errors, []); verify(); return true
      } finally { operationSettled = true }
    })
    terminal = true; receipt.outerOutcome = outer
    if (outer.status !== 'completed') throw Object.hasOwn(outer, 'error') ? outer.error : Error(`Smoke ${outer.status}`)
    assert.equal(outer.timerCleanupFailed, false, 'Outer watchdog timer cleanup failed')
    receipt.status = 'passed'
  } catch (error) { terminal = true; failed = true; primary = error; receipt.status = 'failed'; receipt.failure = error }
  finally {
    // No second capture/export attempt after uncertain transport. Preserve any
    // returned result before closing the exclusively owned context and browser.
    receipt.contextCleanup = context ? await closeOwner(() => context.close()) :
      { confirmed: !contextRequested || contextCreationSettled, notCreated: true }
    receipt.browserCleanup = await closeOwner(() => browser.close())
    if (receipt.errors.length) {
      receipt.status = 'failed'
      if (!failed) { failed = true; primary = Error('Runtime errors observed through owner cleanup') }
    }
    receipt.operationSettled = operationSettled; receipt.rawWritten = rawWritten
    receipt.contextCreationSettled = contextCreationSettled
    if (result) receipt.adapter = { outcome: result.outcome, cleanupConfirmed: result.cleanupConfirmed,
      observerCleanupConfirmed: result.observerCleanupConfirmed, operationSettled: result.operationSettled,
      waitCleanupFailed: result.waitCleanupFailed, cleanupFailed: result.cleanupFailed, cleanupError: result.cleanupError }
    if (!receipt.contextCleanup.confirmed || !receipt.browserCleanup.confirmed) {
      receipt.status = 'failed'
      if (!failed) { failed = true; primary = Error('Smoke owner cleanup unconfirmed') }
    }
    try { save() } catch (error) {
      receipt.receiptWriteFailed = true; receipt.receiptWriteError = String(error)
      receipt.status = 'failed'
      if (!failed) { failed = true; primary = error }
    } finally { finalized = true }
  }
  if (failed) throw primary
  return receipt
}
