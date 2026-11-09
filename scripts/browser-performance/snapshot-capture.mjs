import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadSnapshot, observeSnapshotState, assertSnapshotAdmission } from './snapshot-setup.mjs'
import { recognizeReaderSources } from './snapshot-readers.mjs'
import { validateReaderEvidence } from './snapshot-reader-proof.mjs'
import { createSnapshotGeometryObserver } from './snapshot-geometry.mjs'
import { installSnapshotObserver } from './snapshot-observer.mjs'
import { installSnapshotDragObserver } from './snapshot-drag-observer.mjs'
import { dragContract } from './snapshot-drag-contract.mjs'
import { recoverSnapshotMenu } from './snapshot-menu-recovery.mjs'
import { plan, shards, invariant, assertDragWarmupReturn, summarizeSnapshotPhase, sha256 } from './snapshot-protocol.mjs'
import { m2HudPoint } from '../tutorial-browser/m2-pointer-f8.mjs'

// Fixed authored Shaman, never opportunistically choose a different visible person.
export function snapshotNativeTarget(offsets) {
  const scene = window.testSceneRef.current, canvas = scene.renderer.domElement, group = scene.unitMeshes.get(54)
  if (!group?.visible || group.userData.pickable === false) throw Error('Authored target 54 is not visible/pickable')
  const layer = group.userData.layers?.findLast(piece => piece.visible)
  if (!layer || !scene.view.painter.source(layer)) throw Error('Authored target has no rendered native layer')
  const rect = canvas.getBoundingClientRect(), bounds = scene.picking.personBounds(54, rect)
  if (!bounds || bounds.width < 2 || bounds.height < 2) throw Error('Authored target has no usable screen bounds')
  const x = rect.left + Math.floor(bounds.x + bounds.width / 2), y = rect.top + Math.floor(bounds.y + bounds.height / 2)
  if (document.elementFromPoint(x, y) !== canvas) throw Error('Authored target is obscured')
  // Match ScenePicking.pick's actual native pixel key, not CSS-distance guesses.
  const initialNativePixel = [Math.trunc(x - rect.left), Math.trunc(y - rect.top)]
  const nativePixels = offsets.map(([dx, dy]) => {
    const px = x + dx, py = y + dy, pixel = [Math.trunc(px - rect.left), Math.trunc(py - rect.top)]
    if (document.elementFromPoint(px, py) !== canvas || pixel[0] < bounds.x || pixel[0] >= bounds.x + bounds.width ||
      pixel[1] < bounds.y || pixel[1] >= bounds.y + bounds.height) throw Error('Fixed native pixel is outside authored target bounds')
    return pixel
  })
  if (new Set(nativePixels.map(p => p.join(','))).size !== offsets.length ||
    nativePixels.some(p => p.join(',') === initialNativePixel.join(','))) throw Error('Native input pixels must be unique and exclude warmed initial pixel')
  return { x, y, id: 54, nativePixels, initialNativePixel, canvas: { left: rect.left, top: rect.top } }
}
// Read-only admission outside selected callbacks; never clear or replace caches.
export function observeNativePixelAdmission({ x, y }) {
  const s = window.testSceneRef.current, rect = s.renderer.domElement.getBoundingClientRect()
  const pixel = [Math.trunc(x - rect.left), Math.trunc(y - rect.top)]
  return { pixel, cached: s.picking.groundHits.has(pixel.join(',')), timestampMs: performance.now() }
}
export async function exportSnapshotRaw({ page, output, record }) {
  assert.equal(record.exportAttempted, undefined, 'Never retry an uncertain export action')
  record.exportAttempted = true
  const button = page.getByRole('button', { name: 'Export recent frames', exact: true })
  await button.focus()
  const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Space')])
  assert.match(download.suggestedFilename(), /^populous-frames-.*\.json$/)
  record.rawFile = `snapshot-frame-${record.name}.json`
  await download.saveAs(resolve(output, record.rawFile))
}
// This opt-in belongs only to the comparative runner. Functional smoke never
// converts an admitted new-cohort failure into a passed candidate scenario.
export function retainStablePhasesAfterDragFailure(report, allow) {
  const record = report.phases.at(-1)
  if (!allow || report.shard !== 'world' || record?.name !== dragContract.phase ||
      report.phases.length !== shards.world.length || !report.phases.slice(0, -1).every(phase => phase.status === 'passed')) return false
  record.status = 'incomplete'; report.status = 'passed-with-incomplete-drag'
  return true
}
// Exactly one preregistered real-input sequence. Never wait for a timing or cache
// outcome, retry, release the held gesture, or reset the production F8 recorder.
export async function captureDragWarmup({ page, record, observe, runBlocks, save }) {
  record.warmup = { before: await observe(), blocks: [] }; save()
  await runBlocks(record.warmup.blocks)
  record.warmup.after = await observe()
  save(); assertDragWarmupReturn(record)
  // Reset only the bounded read-only sidecar's event namespace. F8, the
  // held gesture, production caches and absolute recorder serials persist.
  record.warmup.observer = await page.evaluate(source => {
    const result = window.__pndSnapshotObserver.stop()
    if (!result.error) (0, eval)(`(${source})`)()
    return result
  }, installSnapshotDragObserver.toString())
  save(); assert.equal(record.warmup.observer.error, null)
}
// Optional semantic admission happens before installing/arming any sample
// observer. Never replace an observer after a measured input fails.
export function installSnapshotPhaseGeometry(source) {
  const create = (0, eval)(`(${source})`), scene = window.testSceneRef.current
  const session = window.__pndSnapshotReaderSession
  if (!session) { window.__pndSnapshotGeometry = create(scene); return null }
  try {
    window.__pndSnapshotGeometry = create(scene, session)
    return window.__pndSnapshotGeometry.readerEvidence()
  } catch {
    session.stable = false
    window.__pndSnapshotGeometry = create(scene)
    return { ...window.__pndSnapshotGeometry.observedReaders(session.Matrix4), strictData: false, matrixBinding: false, sessionStable: false }
  }
}
// Retain bounded observed bodies BEFORE deciding whether their syntax qualifies.
// A rejected future bundler spelling must not recreate hash-only evidence.
export function recordSnapshotReaders({ report, evidence, readerSource, readerProvenance, save }) {
  const observed = { ...evidence, rawSha256: sha256(JSON.stringify(evidence.sources.slice(0, 7))) }
  report.observedReaders ??= observed
  if (JSON.stringify(report.observedReaders) !== JSON.stringify(observed)) {
    report.readerChanges ??= []; assert.ok(report.readerChanges.length < 6)
    report.readerChanges.push(observed)
  }
  save()
  try {
    assert.notEqual(report.readerAdmission, 'unsupported')
    const recognized = recognizeReaderSources(evidence.sources)
    const readers = { ...evidence, rawSha256: recognized.rawSha256, allSourcesSha256: recognized.allSourcesSha256,
      semanticSha256: recognized.semanticSha256, source: readerSource, provenance: readerProvenance }
    validateReaderEvidence(readers)
    if (report.readers) assert.deepEqual(readers, report.readers)
    report.readers = readers; report.readerAdmission = 'admitted'; save(); return true
  } catch {
    // Optional semantic proof never suppresses original exact-hash measurements.
    delete report.readers; report.readerAdmission = 'unsupported'; save(); return false
  }
}
// Proof is optional; only this finalization can fail without changing any
// completed exact phase status. It never recaptures or selects different frames.
export function finalizeSnapshotReaderSummaries(report, summarize, write) {
  if (!report.readers) return false
  try {
    const summaries = report.phases.filter(record => record.status === 'passed').map(record => ({ record,
      summary: summarize(record), name: `snapshot-summary-${record.name}-readers.json` }))
    for (const { name, summary } of summaries) write(name, summary)
    for (const { record, name } of summaries) { record.exactSummaryFile = record.summaryFile; record.summaryFile = name }
    return true
  } catch (error) {
    delete report.readers; report.readerAdmission = 'unsupported'
    report.readerFinalizationFailure = String(error).slice(0, 2000)
    return false
  }
}
export default async function capture({ page, url, output, expectedRevision, fixture, shard, dragSource, readerSource, readerProvenance, allowDragFailure = false, getErrorCount = () => 0 }) {
  assert.ok(Object.hasOwn(shards, shard))
  const report = { version: 2, kind: plan.kind, plan, shard, expectedRevision, status: 'incomplete', phases: [] }
  const save = () => writeFileSync(resolve(output, 'snapshot-frames.json'), JSON.stringify(report, null, 2) + '\n')
  const observe = () => page.evaluate(observeSnapshotState), graph = page.locator('.fps-graph')
  const finalizeReaderSummaries = () => finalizeSnapshotReaderSummaries(report,
    record => summarizeSnapshotPhase(readFileSync(resolve(output, record.rawFile), 'utf8'), record, expectedRevision, report.readers),
    (name, summary) => writeFileSync(resolve(output, name), JSON.stringify(summary, null, 2) + '\n'))

  save()
  try {
    report.setup = await loadSnapshot({ page, url, fixture, expectedRevision }); save()
    if (readerProvenance) await page.evaluate(() => {
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, '__pndReaderTypes')
      if (!descriptor || descriptor.writable !== false || descriptor.configurable !== false ||
          !Object.isFrozen(descriptor.value) || typeof descriptor.value.Matrix4 !== 'function') throw Error('Trusted fixture reader binding missing')
      window.__pndSnapshotReaderSession = { Matrix4: descriptor.value.Matrix4 }
    })
    await page.mouse.move(900, 400)
    report.warmupBefore = await observe()
    await page.waitForTimeout(plan.warmupMs)
    report.warmupAfter = await observe(); assertSnapshotAdmission(report.warmupAfter, fixture)
    assert.equal(invariant(report.warmupBefore), invariant(report.warmupAfter))
    // Shards have independent explicit v2 prerequisites. Recovery performs the
    // HUD episode before returning to world; no v1 live camera hold is implied.
    for (const name of shards[shard]) {
      const record = { name, status: 'incomplete', preparation: [], blocks: [] }
      report.phases.push(record); save()
      const viewChange = name === dragContract.phase
      if (viewChange && dragSource?.status !== 'admitted') {
        record.status = 'unsupported-source-contract'; record.sourceAdmission = dragSource ?? null; save(); continue
      }
      if (name === 'menu-recovery') {
        await recoverSnapshotMenu({ page, record, observe, save,
          assertAdmission: state => assertSnapshotAdmission(state, fixture) })
        // This measures subsequent pointer-input CPU, NOT first post-close work.
      }
      const point = name === 'hud' ? await page.evaluate(m2HudPoint)
        : name === 'native-hover' || viewChange ? await page.evaluate(snapshotNativeTarget, plan.nativePointerOffsets) : { x: 900, y: 400 }
      assert.ok(point, 'Visible authored native target required'); record.point = point
      await page.mouse.move(point.x, point.y)
      record.preparation.push({ action: 'initial-pointer', point })
      await graph.waitFor({ state: 'hidden' }); await page.keyboard.press('F8'); await graph.waitFor({ state: 'visible' })
      await page.waitForFunction(() => window.testSceneRef.current.fpsGraph.samples.recentCount >= 2)
      record.before = await observe(); invariant(record.before); assertSnapshotAdmission(record.before, fixture)
      const evidence = await page.evaluate(installSnapshotPhaseGeometry, createSnapshotGeometryObserver.toString())
      if (readerProvenance && !recordSnapshotReaders({ report, evidence, readerSource, readerProvenance, save }))
        await page.evaluate(source => {
          window.__pndSnapshotReaderSession.stable = false
          window.__pndSnapshotGeometry = (0, eval)(`(${source})`)(window.testSceneRef.current)
        }, createSnapshotGeometryObserver.toString())
      await page.evaluate(viewChange ? installSnapshotDragObserver : installSnapshotObserver)
      try {
        if (viewChange) {
          record.preparation.push({ action: 'right-down-unmeasured', before: await observe() })
          await page.mouse.down({ button: 'right' })
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          record.preparation.push({ action: 'right-down-settled', after: await observe() })
        }
        const runBlocks = async blocks => {
          for (let step = 0; step < plan.steps; step++) {
            const [dx, dy] = (viewChange ? dragContract.pointerOffsets : name === 'native-hover' ? plan.nativePointerOffsets : plan.pointerOffsets)[step]
            const x = point.x + dx, y = point.y + dy
            const geometryBefore = await page.evaluate(() => window.__pndSnapshotGeometry.captureBoundary())
            const preparation = name === 'native-hover' ? await page.evaluate(observeNativePixelAdmission, { x, y }) : null
            if (preparation) assert.equal(preparation.cached, false, 'Fixed native pixel was warmed before measured input')
            const expected = { geometryWitness: geometryBefore.witness, type: 'pointermove', x, y, buttons: viewChange ? 2 : 0 }
            await page.evaluate(expected => window.__pndSnapshotObserver.arm(expected), expected)
            // The capture-phase listener binds the exact next completed callback.
            await page.mouse.move(x, y)
            await page.waitForFunction(() => window.__pndSnapshotObserver.ready(4))
            const block = await page.evaluate(() => window.__pndSnapshotObserver.finish(4))
            const geometryAfter = await page.evaluate(() => window.__pndSnapshotGeometry.captureBoundary())
            blocks.push({ preparation, geometryBefore, geometryAfter, ...block }); save()
          }
        }
        if (viewChange) await captureDragWarmup({ page, record, observe, runBlocks, save })
        await runBlocks(record.blocks)
        if (viewChange) {
          record.preparation.push({ action: 'right-up-unmeasured', before: await observe() })
          await page.mouse.up({ button: 'right' })
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          record.preparation.push({ action: 'right-up-settled', after: await observe() })
        }
        record.after = await observe(); assertSnapshotAdmission(record.after, fixture)
      } finally {
        record.observer = await page.evaluate(() => { try { return window.__pndSnapshotObserver?.stop() ?? null } finally { delete window.__pndSnapshotGeometry } })
        await page.mouse.up({ button: 'right' })
        save()
      }
      await exportSnapshotRaw({ page, output, record }); save()
      // Keep downloaded bytes even if strict attribution/work admission fails.
      const summary = summarizeSnapshotPhase(readFileSync(resolve(output, record.rawFile), 'utf8'), record, expectedRevision)
      record.summaryFile = `snapshot-summary-${name}.json`
      writeFileSync(resolve(output, record.summaryFile), JSON.stringify(summary, null, 2) + '\n')
      assert.equal(getErrorCount(), 0, 'Browser errors before completed phase admission')
      record.status = 'passed'; save()
      await page.keyboard.press('F8'); await graph.waitFor({ state: 'hidden' })
    }
    finalizeReaderSummaries()
    report.status = 'passed'; return report
  } catch (error) {
    report.failure = String(error)
    const record = report.phases.at(-1)
    // Preserve an available recorder even when attribution fails. This is one
    // diagnostic export, never a retry or a replacement successful measurement.
    if (record && !record.exportAttempted && !page.isClosed()) {
      try { if (await graph.isVisible()) await exportSnapshotRaw({ page, output, record }) }
      catch (exportError) { record.exportFailure = String(exportError) }
    }
    if (retainStablePhasesAfterDragFailure(report, allowDragFailure)) {
      let stable = false
      try { stable = !page.isClosed() && await page.evaluate(() => window.__pndSnapshotReaderSession?.stable === true) } catch { /* unavailable proof */ }
      if (!stable) delete report.readers
      finalizeReaderSummaries(); return report
    }
    throw error
  }
  finally { save(); if (!page.isClosed()) await page.evaluate(() => { delete window.__pndSnapshotReaderSession }) }
}
