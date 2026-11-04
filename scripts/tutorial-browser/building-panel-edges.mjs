import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { bindGame } from '../browser-game.mjs'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { createStageTiming } from './stage-timing.mjs'
import { assertReplacement, assertCompletion } from './building-panel-identity.mjs'
import { buildingEdgeCases, readBuildingEdgeWitness, assertBuildingEdgeWitness, focusBuildingAtEdge } from './building-panel-edge-witness.mjs'

export const buildingPanelEdgesLimitMs = 90000

export default async function buildingPanelEdges({ browser, url, output }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const timing = createStageTiming(), report = { status: 'running', errors: [], timing: timing.report,
    screenshots: {}, cases: [], limits: [
      'Actual Home, public startup, automatic HUD sizing and actual BuildingPanels render frames and DOM controls',
      'Supplied allocation/entry boundary and bounded camera focus, not natural campaign acquisition or ordinary camera navigation',
      'Three clamped edges at 960x720/DPR1; no bottom-clamp, tiny viewport, DPR2, native parity or performance claim',
      'Current built source only; unmodified baseline needs a separately identified run, never CSS-injected counterfactual',
    ] }
  let page, failure
  const timer = setTimeout(() => { report.timedOut = true; void context.close().catch(error => report.errors.push(String(error))) }, buildingPanelEdgesLimitMs)
  const capture = async name => {
    const file = `building-edge-${name}.png`, path = resolve(output, file)
    await page.screenshot({ path, timeout: 10000 })
    report.screenshots[name] = { file, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }
  }
  try {
    page = await context.newPage(); page.setDefaultTimeout(10000)
    page.on('pageerror', error => report.errors.push(String(error)))
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
    page.on('crash', () => report.errors.push('Building edge page crashed'))
    const target = new URL(url); target.searchParams.set('building-panel-identity', '1')
    await page.goto(target.href, { waitUntil: 'domcontentloaded' })
    const button = name => page.getByRole('button', { name, exact: true })
    await waitForStartupMenu(page); await button('New Game').click()
    await page.locator('[data-original-tutorial-recommendation]').waitFor()
    await button('No').click(); await button('Start Mission 1').click(); await bindGame(page)
    const startup = await page.waitForFunction(() => {
      const world = window.testStore.getWorld()
      if (!world.inputMask && world.levelStart.every(site => site.phase === 4)) return 'ready'
      const skip = document.querySelector('button.skip-introduction')
      return skip && skip.getClientRects().length && !skip.disabled ? 'skip' : false
    })
    if ((await startup.jsonValue()) === 'skip') await page.getByRole('button', { name: /^Skip introduction/ }).click()
    await startup.dispose()
    await page.waitForFunction(() => {
      const world = window.testStore.getWorld()
      return !world.inputMask && window.__pndBuildingPanelFixture && world.levelStart.every(site =>
        site.phase === 4 && !site.wave && !site.carriers.length && site.stoneTurns.every(turn => turn === null || world.turn - turn >= 20))
    })
    await button('Pause game').click(); await page.waitForFunction(() => window.testStore.getWorld().paused)
    await page.evaluate(() => { window.buildingIdentity = window.__pndBuildingPanelFixture.createBoundary(window.testSceneRef.current) })
    await page.waitForFunction(() => window.testSceneRef.current.buildingMeshes.has(window.buildingIdentity.old.id))
    const point = await page.evaluate(() => {
      const { scene, old } = window.buildingIdentity, p = scene.screen(old), r = scene.renderer.domElement.getBoundingClientRect()
      const cx = r.left + ((p.x + 1) * r.width) / 2, cy = r.top + ((1 - p.y) * r.height) / 2
      for (const dy of [-40, -60, -20, -80, 0, -100, -120, -140, 20, 40, 60])
        for (const dx of [0, -10, 10, -20, 20, -40, 40, -60, 60, -80, 80]) {
          const event = { clientX: cx + dx, clientY: cy + dy }
          if (document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement && scene.picking.pick(event) === old.id)
            return { x: event.clientX, y: event.clientY }
        }
      throw Error('No actual original building pointer target')
    })
    await page.mouse.move(point.x, point.y)
    const panel = page.locator('.tower-panel:not([hidden])')
    await panel.waitFor({ state: 'visible' }); assert.equal(await panel.count(), 1)
    await panel.locator('.dismantle-control').focus()
    report.replacement = await page.evaluate(() => window.__pndBuildingPanelFixture.replaceBetweenPaints(window.buildingIdentity))
    assertReplacement(report.replacement)
    await page.waitForFunction(() => {
      const h = window.buildingIdentity
      return !h.panel.hidden && h.panel.children[1].dataset.person === String(h.unit.id)
    })
    // A new context has no saved preference. Actual automatic resizing computes1.44;
    // no test writes CSS, layout dimensions, panel positions or localStorage.
    assert.equal(await page.evaluate(() => localStorage.getItem('hud-size')), null)
    await page.setViewportSize({ width: 960, height: 720 })
    await page.waitForFunction(() => Math.abs(Number.parseFloat(getComputedStyle(document.querySelector('.game-shell')).getPropertyValue('--hud-scale')) - 1.44) < 1e-9)
    // The ordinary bird's-eye preset has no ground horizon. Let its production
    // transition finish in real frames; close-ground sky cannot prove a top edge.
    await page.evaluate(() => window.buildingIdentity.scene.startGroundView(2))
    await page.waitForFunction(() => !window.buildingIdentity.scene.viewTransition)
    for (const edge of buildingEdgeCases) {
      timing.mark(`${edge.name}:start`)
      const boundary = await page.evaluate(focusBuildingAtEdge, edge)
      await page.waitForFunction(frame => window.testSceneRef.current.renderer.info.render.frame >= frame + 2, boundary.frame)
      const witness = await page.evaluate(readBuildingEdgeWitness)
      report.cases.push({ edge: edge.name, boundary, witness })
      // Retain the real image even when the exact baseline escapes by a fraction.
      await capture(edge.name)
      assertBuildingEdgeWitness(witness, edge.name)
      timing.mark(`${edge.name}:passed`)
    }
    const clickControl = async (name, control) => {
      const hit = await control.evaluate(button => {
        const r = button.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2
        const target = document.elementFromPoint(x, y)
        return { x, y, width: r.width, height: r.height, ownsCenter: target !== null && button.contains(target) }
      })
      report.controlHits ??= {}
      report.controlHits[name] = hit
      assert.ok(hit.width > 0 && hit.height > 0 && hit.ownsCenter, name + ' must own its actual pointer center')
      await control.click()
    }
    await clickControl('occupant', panel.getByRole('button', { name: 'Occupant 1: brave', exact: true }))
    report.selection = await page.evaluate(() => {
      const h = window.buildingIdentity
      return { selected: [...h.world.selected], expected: h.unit.id, inside: h.unit.inside, building: h.building.id }
    })
    assert.deepEqual(report.selection.selected, [report.selection.expected]); assert.equal(report.selection.inside, report.selection.building)
    await capture('selected')
    await clickControl('dismantle', panel.locator('.dismantle-control'))
    report.completed = await page.evaluate(() => window.__pndBuildingPanelFixture.advanceDismantle(window.buildingIdentity, true))
    assertCompletion(report.completed)
    await capture('completed'); timing.mark('episode:complete')
  } catch (error) { failure = error }
  finally {
    clearTimeout(timer)
    try { await context.close(); report.contextClosed = true } catch (error) { report.errors.push(String(error)) }
    if (report.timedOut) report.errors.push('Building edges exceeded90second cap')
    if (failure) report.errors.push(String(failure))
    report.status = report.errors.length ? 'failed' : 'passed'
    writeFileSync(resolve(output, 'building-panel-edges.json'), JSON.stringify(report, null, 2) + '\n')
  }
  assert.equal(report.status, 'passed', 'Building panel edge episode failed; retained receipt and images')
  return report
}
