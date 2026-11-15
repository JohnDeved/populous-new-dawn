import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { bindGame, settleOpeningMessages } from '../browser-game.mjs'

export const heldCtrlPlacementLimitMs = 60000

// Symmetric authored-settlement coverage, bounded independently of visibility.
// These are candidates only; no offline placement result determines acceptance.
export function settlementProbeCandidates(hut) {
  const offsets = [-16, -12, -8, 0, 8, 12, 16]
  return offsets
    .flatMap(dx =>
      offsets.map(dz => ({
        x: hut.x + dx,
        z: hut.z + dz,
        kind: 'settlement-ground',
        id: null,
        ring: Math.max(Math.abs(dx), Math.abs(dz)),
      }))
    )
    .sort((a, b) => a.ring - b.ring || a.x - b.x || a.z - b.z)
    .map(({ ring, ...point }) => point)
}

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

// Observe current hit ownership before using an earlier projected candidate.
export async function inspectPlacementProbe(page, point) {
  return page.evaluate(point => {
    const scene = window.testSceneRef.current
    const hit = document.elementFromPoint(point.x, point.y)
    return {
      point,
      canvasOwned: hit === scene.renderer.domElement,
      element: hit ? { tag: hit.tagName, role: hit.getAttribute('role'), id: hit.id } : null,
      pointerScreen: scene.pointerScreen,
      pointer: scene.pointer ? { x: scene.pointer.x, z: scene.pointer.z } : null,
      cursorVisible: scene.cursor.visible,
      mode: scene.world.mode,
      inputMask: scene.world.inputMask,
      modalSuspended: scene.modalSuspended,
    }
  }, point)
}

// Consume each bounded candidate once across placements; always validate its live state.
export function createPlacementProbeSearch(probes, { inspect, hover, skipped, observed }) {
  let next = 0
  return async () => {
    while (next < probes.length) {
      const point = probes[next++]
      const target = await inspect(point)
      if (!target.canvasOwned) {
        skipped(target)
        continue
      }
      const state = await hover(point)
      observed(point, state)
      if (!state.cursor.invalid) return point
    }
    throw Error('No distinct valid visible Hut footprint within bounded authored settlement probes')
  }
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
  const unique = new Set(report.previews.map(probe => `${probe.point.x},${probe.point.y}`)).size
  report.probeMetrics = {
    observed: report.previews.length,
    unique,
    repeated: report.previews.length - unique,
    skipped: report.skippedProbes?.length ?? 0,
  }
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
    skippedProbes: [],
    contextClosed: false,
    limits: [
      'One authored Mission 1 scene; no injected entities or forced ticks',
      'Each candidate consumed once; may miss a newly valid earlier site; exhaustion fails, not proof no terrain exists',
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
    page.on('crash', () => report.errors.push('Held-Ctrl page crashed'))
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

    const hut = await page.evaluate(() => {
      const hut = window.testSceneRef.current.world.buildings.find(
        b => b.team === 'blue' && b.kind === 'hut'
      )
      if (!hut) throw Error('Authored Mission 1 Hut is missing')
      return { x: hut.x, z: hut.z }
    })
    const candidates = settlementProbeCandidates(hut)
    report.candidates = candidates
    const probes = await page.evaluate(candidates => {
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
      for (const point of candidates) add(point, point.kind, point.id)
      return points.slice(0, 50)
    }, candidates)
    report.projectedProbes = probes
    assert.ok(
      probes.length > 0,
      'Authored settlement must be visible without injected camera changes'
    )
    const hover = async point => {
      report.pendingProbe = point
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
    const findValid = createPlacementProbeSearch(probes, {
      inspect: point => inspectPlacementProbe(page, point),
      hover,
      skipped: target => report.skippedProbes.push(target),
      observed: (point, state) =>
        report.previews.push({ point, cursor: state.cursor, pointer: state.pointer }),
    })
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
      if (page && report.pendingProbe)
        report.failedProbe = await inspectPlacementProbe(page, report.pendingProbe)
    } catch (diagnosticError) {
      report.probeDiagnosticError = String(diagnosticError)
    }
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
