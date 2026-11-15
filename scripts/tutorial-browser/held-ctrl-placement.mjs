import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { bindGame, settleOpeningMessages } from '../browser-game.mjs'

export const heldCtrlPlacementLimitMs = 60000

export function assertPlacementStep(before, after, added, mode) {
  assert.equal(after.level, 1)
  assert.equal(after.paused, false)
  assert.equal(after.mode, mode)
  assert.deepEqual(after.selected, before.selected, 'Placement preserves selected authored Braves')
  assert.equal(new Set(after.buildingIds).size, after.buildingIds.length)
  assert.ok(
    before.buildingIds.every(id => after.buildingIds.includes(id)),
    'Existing plans survive'
  )
  assert.equal(after.buildingIds.length, before.buildingIds.length + added)
}

export async function finishHeldCtrlPlacement({
  context,
  report,
  output,
  failure,
  failed = false,
}) {
  const failures = failed ? [failure] : []
  try {
    await context.close()
    report.contextClosed = true
  } catch (error) {
    report.cleanupError = String(error)
    failures.push(error)
  }
  if (report.errors.length)
    failures.push(Error(`Held-Ctrl runtime errors: ${JSON.stringify(report.errors)}`))
  if (report.timedOut) failures.push(Error('Held-Ctrl placement exceeded its 60-second bound'))
  report.status = failures.length ? 'failed' : 'passed'
  report.failures = failures.map(error => ({ message: String(error), stack: error?.stack }))
  writeFileSync(resolve(output, 'held-ctrl-placement.json'), JSON.stringify(report, null, 2) + '\n')
  if (failures.length)
    throw new AggregateError(failures, 'Held-Ctrl placement failed; see held-ctrl-placement.json')
  return report
}

// Actual Home and shipped controls only. Evaluations observe state/project world
// coordinates; they never call simulation, placement, rendering or camera mutators.
export default async function heldCtrlPlacement({ browser, url, output }) {
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
      'Real Ctrl-held valid-invalid-valid then plain valid click; no save/load/restart or native raster claim',
      'Actual Home through plain Vite; not Vinext/Cloudflare/RSC or native raster equivalence',
      'Headless renderer recorded below; no hardware FPS or timing claim',
    ],
  }
  let page,
    failure,
    failed = false
  const timer = setTimeout(() => {
    report.timedOut = true
    void context.close().catch(error => {
      report.errors.push(`Deadline cleanup: ${error}`)
    })
  }, heldCtrlPlacementLimitMs)
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
    await settleOpeningMessages(page)
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
    assert.equal(report.before.paused, false)
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
      return state
    }
    const findValid = async () => {
      for (const point of probes) {
        const state = await hover(point)
        report.previews.push({ point, cursor: state.cursor, pointer: state.pointer })
        if (!state.cursor.invalid) return point
      }
      throw Error('No distinct valid visible Hut footprint within 50 authored settlement probes')
    }
    const click = async (point, previous, added, mode, label) => {
      const preview = await hover(point)
      assert.equal(Boolean(preview.cursor.invalid), added === 0)
      assert.equal(
        await page.evaluate(
          point =>
            document.elementFromPoint(point.x, point.y) ===
            window.testSceneRef.current.renderer.domElement,
          point
        ),
        true,
        'Input must reach the same live canvas'
      )
      await page.mouse.click(point.x, point.y)
      if (added)
        await page.waitForFunction(
          count => window.testStore.getWorld().buildings.length === count,
          previous.buildingIds.length + added,
          { timeout: 3000 }
        )
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve())))
      const after = await read()
      assertPlacementStep(previous, after, added, mode)
      report[label] = after
      await page.screenshot({ path: resolve(output, `held-ctrl-placement-${label}.png`) })
      return after
    }
    await page.keyboard.down('Control')
    const firstPoint = await findValid()
    const first = await click(firstPoint, report.before, 1, 'hut', 'first')
    // The first plan's occupied footprint is the actual invalid intermediate click.
    const rejected = await click(firstPoint, first, 0, 'hut', 'rejected')
    const second = await click(await findValid(), rejected, 1, 'hut', 'second')
    await page.keyboard.up('Control')
    report.after = await click(await findValid(), second, 1, null, 'plain')
    assertPlacementStep(report.before, report.after, 3, null)
  } catch (error) {
    failure = error
    failed = true
    try {
      await page?.screenshot({
        path: resolve(output, 'held-ctrl-placement-failure.png'),
        timeout: 3000,
      })
    } catch (diagnosticError) {
      report.diagnosticError = String(diagnosticError)
    }
  }
  try {
    return await finishHeldCtrlPlacement({ context, report, output, failure, failed })
  } finally {
    clearTimeout(timer)
  }
}
