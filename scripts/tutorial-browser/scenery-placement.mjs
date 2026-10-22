import { setWorldPaused } from '../browser-world-input.mjs'
import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { bindGame } from '../browser-game.mjs'

export const sceneryPlacementLimitMs = 60000

export function assertPreview(before, after) {
  assert.equal(after.level, 1)
  assert.equal(after.paused, true)
  assert.equal(after.turn, before.turn, 'Public pause freezes the simulation during preview')
  assert.deepEqual(after.buildingIds, before.buildingIds, 'Hover must not create a plan')
  assert.deepEqual(
    after.shadows,
    before.shadows,
    'Repeated placement queries preserve retained scenery poses'
  )
  assert.ok(after.treeMeshes > 0, 'Authored scenery remains attached to the rendered scene')
}

export async function finishSceneryPlacement({ context, report, output, failure }) {
  const failures = failure ? [failure] : []
  try {
    await context.close()
    report.contextClosed = true
  } catch (error) {
    report.cleanupError = String(error)
    failures.push(error)
  }
  if (report.errors.length)
    failures.push(Error(`Scenery runtime errors: ${JSON.stringify(report.errors)}`))
  if (report.timedOut) failures.push(Error('Scenery placement exceeded its 60-second bound'))
  report.status = failures.length ? 'failed' : 'passed'
  report.failures = failures.map(error => ({ message: String(error), stack: error.stack }))
  writeFileSync(resolve(output, 'scenery-placement.json'), JSON.stringify(report, null, 2) + '\n')
  if (failures.length)
    throw new AggregateError(failures, 'Scenery placement failed; see scenery-placement.json')
  return report
}

// Actual Home and shipped controls only. Evaluations observe state/project world
// coordinates; they never call simulation, placement, rendering or camera mutators.
export default async function sceneryPlacement({ browser, url, output }) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })
  const report = {
    status: 'running',
    errors: [],
    previews: [],
    contextClosed: false,
    limits: [
      'One authored Mission 1 scene; no injected entities or forced ticks',
      'Preview, rejected placement and accepted plan only; no completed construction, depletion or replant claim',
      'Actual Home through plain Vite; not Vinext/Cloudflare/RSC or native raster equivalence',
      'Headless renderer recorded below; no hardware FPS or timing claim',
    ],
  }
  let page, failure
  const timer = setTimeout(() => {
    report.timedOut = true
    void context.close().catch(error => {
      report.errors.push(`Deadline cleanup: ${error}`)
    })
  }, sceneryPlacementLimitMs)
  try {
    page = await context.newPage()
    page.setDefaultTimeout(15000)
    page.on('pageerror', error => report.errors.push(String(error)))
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(message.text())
    })
    page.on('crash', () => report.errors.push('Scenery page crashed'))
    const button = name => page.getByRole('button', { name, exact: true })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await button('New Game').click()
    await page.locator('[data-original-tutorial-recommendation]').waitFor()
    await button('No').click()
    await button('Start Mission 1').click()
    await bindGame(page)
    await skipIntroductionWithSpace(page, { timeout: 15000 })
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await setWorldPaused(page, true, { timeout: 15000 })
    await page.waitForFunction(() => window.testStore.getWorld().paused)
    await button('Select brave').click()
    await button('buildings B').click()
    await button('Hut, 3 wood').click()
    await page.waitForFunction(() => window.testStore.getWorld().mode === 'hut')

    const read = () =>
      page.evaluate(() => {
        const s = window.testSceneRef.current,
          w = s.world
        return {
          level: w.outcome.level,
          turn: w.turn,
          paused: w.paused,
          buildingIds: w.buildings.map(b => b.id),
          shadows: [...w.sceneryShadows].map(([id, p]) => [
            id,
            p.object,
            p.shapeIndex,
            p.anchorX,
            p.anchorY,
          ]),
          treeMeshes: s.decorations.children.filter(g => w.trees.includes(g.userData.point)).length,
          selected: [...w.selected],
          mode: w.mode,
          cursor: {
            visible: s.cursor.visible,
            invalid: s.cursor.userData.invalid,
            cells: [...(s.cursor.userData.cells ?? [])],
          },
          pointer: s.pointer ? { x: s.pointer.x, z: s.pointer.z } : null,
        }
      })
    report.before = await read()
    assert.equal(report.before.level, 1)
    assert.ok(report.before.selected.length > 0, 'Public HUD selected authored Braves')
    assert.ok(report.before.shadows.length > 0 && report.before.treeMeshes > 0)
    report.renderer = await page.evaluate(() => {
      const s = window.testSceneRef.current,
        gl = s.renderer.getContext(),
        debug = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        version: gl.getParameter(gl.VERSION),
        renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        viewport: [innerWidth, innerHeight],
        dpr: devicePixelRatio,
        canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight],
      }
    })
    assert.ok(report.renderer.version.startsWith('WebGL 2.0'))

    const probes = await page.evaluate(() => {
      const s = window.testSceneRef.current,
        rect = s.container.getBoundingClientRect(),
        points = []
      const add = (point, kind, id) => {
        const p = s.screen(point),
          x = Math.round(rect.left + ((p.x + 1) * rect.width) / 2),
          y = Math.round(rect.top + ((1 - p.y) * rect.height) / 2)
        if (
          x > rect.left + 30 &&
          x < rect.right - 30 &&
          y > rect.top + 60 &&
          y < rect.bottom - 40 &&
          document.elementFromPoint(x, y) === s.renderer.domElement
        )
          points.push({ x, y, kind, id })
      }
      const hut = s.world.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
      if (!hut) throw Error('Authored Mission 1 Hut is missing')
      add(hut, 'authored-hut', hut.id)
      for (const tree of s.world.trees.filter(t => t.logs > 0).slice(0, 24))
        add(tree, 'authored-tree', tree.id)
      for (const dx of [-8, -4, 0, 4, 8])
        for (const dz of [-8, -4, 0, 4, 8])
          add({ x: hut.x + dx, z: hut.z + dz }, 'settlement-ground', null)
      return points.slice(0, 50)
    })
    assert.ok(
      probes.length > 0,
      'Authored settlement must be visible without injected camera changes'
    )
    const hover = async point => {
      await page.mouse.move(point.x, point.y)
      await page.waitForFunction(
        point => {
          const s = window.testSceneRef.current
          return (
            s.pointerScreen?.clientX === point.x &&
            s.pointerScreen?.clientY === point.y &&
            s.cursor.visible &&
            s.pointer
          )
        },
        point,
        { timeout: 3000 }
      )
      // Await a normal rendered frame after pointer processing, never force a draw.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve())))
      const state = await read()
      assertPreview(report.before, state)
      return state
    }
    let valid, invalid, scenery
    const shadowCells = new Set(report.before.shadows.map(p => (p[4] >>> 9) * 128 + (p[3] >>> 9)))
    for (const point of probes) {
      const state = await hover(point)
      report.previews.push({ point, cursor: state.cursor, pointer: state.pointer })
      if (state.cursor.invalid) invalid ??= point
      else valid ??= point
      if (state.cursor.cells.some(cell => shadowCells.has(cell))) scenery ??= point
      if (valid && invalid && scenery) break
    }
    assert.ok(valid, 'A normal settlement Hut preview must be valid')
    assert.ok(
      invalid,
      'A normal settlement Hut preview must reject an occupied or unsuitable footprint'
    )
    assert.ok(scenery, 'At least one live placement footprint must overlap authored scenery')
    await hover(scenery)
    await page.screenshot({ path: resolve(output, 'scenery-placement-preview.png') })
    await hover(valid)
    await hover(invalid)
    await hover(valid)
    report.repeated = await read()
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => window.testStore.getWorld().mode === null)
    await setWorldPaused(page, false, { timeout: 15000 })
    await page.waitForFunction(() => !window.testStore.getWorld().paused)
    await button('Hut, 3 wood').click()
    await page.waitForFunction(() => window.testStore.getWorld().mode === 'hut')
    await page.mouse.move(invalid.x, invalid.y)
    await page.waitForFunction(
      () =>
        window.testSceneRef.current.cursor.visible &&
        window.testSceneRef.current.cursor.userData.invalid
    )
    await page.mouse.click(invalid.x, invalid.y)
    assert.deepEqual(
      (await read()).buildingIds,
      report.before.buildingIds,
      'Rejected click must not create a plan'
    )
    await page.screenshot({ path: resolve(output, 'scenery-placement-rejected.png') })
    await page.mouse.move(valid.x, valid.y)
    await page.waitForFunction(
      () =>
        window.testSceneRef.current.cursor.visible &&
        !window.testSceneRef.current.cursor.userData.invalid
    )
    await page.mouse.click(valid.x, valid.y)
    await page.waitForFunction(
      ids => window.testStore.getWorld().buildings.some(b => !ids.includes(b.id)),
      report.before.buildingIds
    )
    report.after = await read()
    assert.equal(report.after.buildingIds.length, report.before.buildingIds.length + 1)
    assert.equal(report.after.mode, null, 'Accepted public placement exits plan mode')
    assert.ok(report.after.treeMeshes > 0 && report.after.shadows.length > 0)
    await page.screenshot({ path: resolve(output, 'scenery-placement-accepted.png') })
  } catch (error) {
    failure = error
    try {
      await page?.screenshot({
        path: resolve(output, 'scenery-placement-failure.png'),
        timeout: 3000,
      })
    } catch (diagnosticError) {
      report.diagnosticError = String(diagnosticError)
    }
  }
  try {
    return await finishSceneryPlacement({ context, report, output, failure })
  } finally {
    clearTimeout(timer)
  }
}
