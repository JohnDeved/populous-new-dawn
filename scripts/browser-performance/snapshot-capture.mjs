import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadSnapshot, observeSnapshotState, assertSnapshotAdmission } from './snapshot-setup.mjs'
import { createSnapshotGeometryObserver } from './snapshot-geometry.mjs'
import { installSnapshotObserver } from './snapshot-observer.mjs'
import { installSnapshotDragObserver } from './snapshot-drag-observer.mjs'
import { dragContract } from './snapshot-drag-contract.mjs'
import { plan, shards, invariant, summarizeSnapshotPhase } from './snapshot-protocol.mjs'
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
export default async function capture({ page, url, output, expectedRevision, fixture, shard, dragSource, allowDragFailure = false, getErrorCount = () => 0 }) {
  assert.ok(Object.hasOwn(shards, shard))
  const report = { version: 2, kind: plan.kind, plan, shard, expectedRevision, status: 'incomplete', phases: [] }
  const save = () => writeFileSync(resolve(output, 'snapshot-frames.json'), JSON.stringify(report, null, 2) + '\n')
  const observe = () => page.evaluate(observeSnapshotState), graph = page.locator('.fps-graph')
  save()
  try {
    report.setup = await loadSnapshot({ page, url, fixture, expectedRevision }); save()
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
        record.preparation.push({ action: 'open-public-settings', before: await observe() })
        await page.getByRole('button', { name: 'Game settings', exact: true }).click()
        await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'visible' })
        record.menu = await observe(); assert.equal(record.menu.paused, true)
        await page.keyboard.press('Escape')
        await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'hidden' })
        record.preparation.push({ action: 'close-public-settings', after: await observe() })
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
      await page.evaluate(source => { window.__pndSnapshotGeometry = (0, eval)(`(${source})`)(window.testSceneRef.current) }, createSnapshotGeometryObserver.toString())
      await page.evaluate(viewChange ? installSnapshotDragObserver : installSnapshotObserver)
      try {
        if (viewChange) {
          record.preparation.push({ action: 'right-down-unmeasured', before: await observe() })
          await page.mouse.down({ button: 'right' })
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          record.preparation.push({ action: 'right-down-settled', after: await observe() })
        }
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
          record.blocks.push({ preparation, geometryBefore, geometryAfter, ...block }); save()
        }
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
    if (retainStablePhasesAfterDragFailure(report, allowDragFailure)) return report
    throw error
  }
  finally { save() }
}
