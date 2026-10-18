import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadSnapshot, observeSnapshotState, assertSnapshotAdmission } from './snapshot-setup.mjs'
import { createSnapshotGeometryObserver } from './snapshot-geometry.mjs'
import { installSnapshotObserver } from './snapshot-observer.mjs'
import { plan, shards, invariant, summarizeSnapshotPhase } from './snapshot-protocol.mjs'
import { m2HudPoint } from '../tutorial-browser/m2-pointer-f8.mjs'

// Fixed authored Shaman, never opportunistically choose a different visible person.
export function snapshotNativeTarget() {
  const scene = window.testSceneRef.current, canvas = scene.renderer.domElement, group = scene.unitMeshes.get(54)
  if (!group?.visible || group.userData.pickable === false) throw Error('Authored target 54 is not visible/pickable')
  const layer = group.userData.layers?.findLast(piece => piece.visible)
  if (!layer || !scene.view.painter.source(layer)) throw Error('Authored target has no rendered native layer')
  const rect = canvas.getBoundingClientRect(), bounds = scene.picking.personBounds(54, rect)
  if (!bounds || bounds.width < 2 || bounds.height < 2) throw Error('Authored target has no usable screen bounds')
  const x = rect.left + Math.floor(bounds.x + bounds.width / 2), y = rect.top + Math.floor(bounds.y + bounds.height / 2)
  if (document.elementFromPoint(x, y) !== canvas) throw Error('Authored target is obscured')
  return { x, y, id: 54 }
}
// Preparation reads are outside selected callbacks. No renderer/picker invocation.
export function observeDragPreparation() {
  const s = window.testSceneRef.current
  return { position: { ...s.cameraPosition }, bearing: s.cameraBearing, buttons: s.pointerButtons,
    point: s.pointerScreen && { ...s.pointerScreen }, serial: s.fpsGraph.samples.recentCount,
    timestampMs: performance.now() }
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
export default async function capture({ page, url, output, expectedRevision, fixture, shard }) {
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
        : name === 'native-view-release' ? await page.evaluate(snapshotNativeTarget) : { x: 900, y: 400 }
      assert.ok(point, 'Visible authored native target required'); record.point = point
      await page.mouse.move(point.x, point.y)
      record.preparation.push({ action: 'initial-pointer', point })
      await graph.waitFor({ state: 'hidden' }); await page.keyboard.press('F8'); await graph.waitFor({ state: 'visible' })
      await page.waitForFunction(() => window.testSceneRef.current.fpsGraph.samples.recentCount >= 2)
      record.before = await observe(); invariant(record.before); assertSnapshotAdmission(record.before, fixture)
      await page.evaluate(source => { window.__pndSnapshotGeometry = (0, eval)(`(${source})`)(window.testSceneRef.current) }, createSnapshotGeometryObserver.toString())
      await page.evaluate(installSnapshotObserver)
      try {
        let x = point.x, y = point.y
        for (let step = 0; step < plan.steps; step++) {
          let preparation = null
          if (name === 'native-view-release') {
            await page.mouse.down({ button: 'right' })
            x += plan.rightDragPixels[step]
            await page.mouse.move(x, y)
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
            preparation = await page.evaluate(observeDragPreparation)
            assert.equal(preparation.buttons, 2)
          } else [x, y] = [point.x + plan.pointerOffsets[step][0], point.y + plan.pointerOffsets[step][1]]
          const geometryBefore = await page.evaluate(() => window.__pndSnapshotGeometry.captureBoundary())
          const expected = { geometryWitness: geometryBefore.witness, type: name === 'native-view-release' ? 'pointerup' : 'pointermove', x, y, buttons: 0 }
          await page.evaluate(expected => window.__pndSnapshotObserver.arm(expected), expected)
          // Event capture synchronously anchors the pre-input recorder serial;
          // no remote-command roundtrip or route-readiness predicate selects it.
          if (name === 'native-view-release') await page.mouse.up({ button: 'right' })
          else await page.mouse.move(x, y)
          await page.waitForFunction(() => window.__pndSnapshotObserver.ready(4))
          const block = await page.evaluate(() => window.__pndSnapshotObserver.finish(4))
          const geometryAfter = await page.evaluate(() => window.__pndSnapshotGeometry.captureBoundary())
          record.blocks.push({ preparation, geometryBefore, geometryAfter, ...block }); save()
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
    throw error
  }
  finally { save() }
}
