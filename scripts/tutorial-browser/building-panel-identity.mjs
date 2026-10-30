import { setWorldPaused } from '../browser-world-input.mjs'
import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { bindGame } from '../browser-game.mjs'

export const buildingPanelIdentityLimitMs = 35000

export function assertReplacement(report) {
  assert.equal(report.oldHp, 0)
  assert.equal(report.samePanel, true)
  assert.equal(
    report.frameAfter,
    report.frameBefore,
    'Replacement finishes before any rendered frame'
  )
  assert.equal(
    report.personAfter,
    report.personBefore,
    'Old DOM remains untouched until the next paint'
  )
  assert.ok(report.entryTurns > 0 && report.entryTurns <= 300)
  assert.ok(Number.isInteger(report.id) && Number.isInteger(report.person))
}

export function assertCompletion(report) {
  assert.equal(report.hp, 0)
  assert.equal(report.removed, true)
  assert.equal(report.dismantled, true, 'Real worker completion, not deletion')
  assert.equal(report.personAlive, true)
  assert.equal(report.inside, null)
  assert.equal(
    report.recoveredTimber,
    report.expectedTimber,
    'Actual dismantling recovers the building timber'
  )
  assert.ok(report.expectedTimber > 0)
}

export async function finishBuildingPanelIdentity({ context, report, output, failure }) {
  const failures = failure ? [failure] : []
  try {
    await context.close()
    report.contextClosed = true
  } catch (error) {
    failures.push(error)
  }
  if (report.timedOut)
    failures.push(Error('Building identity episode exceeded its 35-second bound'))
  if (report.errors.length) failures.push(Error(`Runtime errors: ${JSON.stringify(report.errors)}`))
  report.status = failures.length ? 'failed' : 'passed'
  report.failures = failures.map(error => ({ message: String(error), stack: error.stack }))
  writeFileSync(
    resolve(output, 'building-panel-identity.json'),
    JSON.stringify(report, null, 2) + '\n'
  )
  if (failures.length)
    throw new AggregateError(failures, 'Building identity episode failed; see receipt')
  return report
}

export default async function buildingPanelIdentity({ browser, url, output }) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })
  const report = {
    status: 'running',
    errors: [],
    screenshots: {},
    limits: [
      'Actual Home, visible DOM controls and ordinary renderer; supplied allocation-boundary buildings/person and camera setup',
      'Synchronous bounded real damage, retirement, entry and worker-turn batches under public pause; not naturally timed campaign acquisition',
      'Ownership/camera-exclusion and focus/blur boundaries supplied; actual pointer hover, DOM focus, Scene.visible and render frames observed; not natural enemy capture, keyboard navigation or ordinary camera input',
      'No production hooks, gameplay deletion shortcut, native raster equivalence or performance claim',
    ],
  }
  let page, failure
  const screenshot = async (name, timeout = 10000) => {
    const path = resolve(output, `building-identity-${name}.png`)
    await page.screenshot({ path, timeout })
    report.screenshots[name] = {
      file: `building-identity-${name}.png`,
      sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
    }
  }
  const timer = setTimeout(() => {
    report.timedOut = true
    void context.close().catch(error => report.errors.push(String(error)))
  }, buildingPanelIdentityLimitMs)
  try {
    page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror', error => report.errors.push(String(error)))
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(message.text())
    })
    page.on('crash', () => report.errors.push('Building identity page crashed'))
    const target = new URL(url)
    target.searchParams.set('building-panel-identity', '1')
    await page.goto(target.href, { waitUntil: 'domcontentloaded' })
    const button = name => page.getByRole('button', { name, exact: true })
    await button('New Game').click()
    await page.locator('[data-original-tutorial-recommendation]').waitFor()
    await button('No').click()
    await button('Start Mission 1').click()
    await bindGame(page)
    const startup = await page.waitForFunction(() => {
      const world = window.testStore.getWorld()
      if (!world.inputMask && world.levelStart.every(site => site.phase === 4)) return 'ready'
      return (world.inputMask & 64) && (world.flyby.flags & 0x51) === 0x11 ? 'skip' : false
    })
    if ((await startup.jsonValue()) === 'skip')
      await skipIntroductionWithSpace(page, { timeout: 10000 })
    await page.waitForFunction(() => {
      const world = window.testStore.getWorld()
      return (
        !world.inputMask &&
        window.__pndBuildingPanelFixture &&
        world.levelStart.every(
          site =>
            site.phase === 4 &&
            !site.wave &&
            !site.carriers.length &&
            site.stoneTurns.every(turn => turn === null || world.turn - turn >= 20)
        )
      )
    })
    await setWorldPaused(page, true, { timeout: 10000 })
    await page.waitForFunction(() => window.testStore.getWorld().paused)
    report.setup = await page.evaluate(() => {
      const scene = window.testSceneRef.current
      window.buildingIdentity = window.__pndBuildingPanelFixture.createBoundary(scene)
      const gl = scene.renderer.getContext(),
        debug = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        id: window.buildingIdentity.old.id,
        renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
      }
    })
    await page.waitForFunction(() =>
      window.testSceneRef.current.buildingMeshes.has(window.buildingIdentity.old.id)
    )
    // Projected candidates are observations; only an actual pointer event opens the panel.
    const point = await page.evaluate(() => {
      const { scene, old } = window.buildingIdentity,
        p = scene.screen(old),
        rect = scene.renderer.domElement.getBoundingClientRect(),
        cx = rect.left + ((p.x + 1) * rect.width) / 2,
        cy = rect.top + ((1 - p.y) * rect.height) / 2
      for (const dy of [-40, -60, -20, -80, 0, -100, -120, -140, 20, 40, 60])
        for (const dx of [0, -10, 10, -20, 20, -40, 40, -60, 60, -80, 80]) {
          const event = { clientX: cx + dx, clientY: cy + dy }
          if (
            document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
            scene.picking.pick(event) === old.id
          )
            return { x: event.clientX, y: event.clientY }
        }
      throw Error('No visible original tower hit target')
    })
    await page.mouse.move(point.x, point.y)
    const panel = page.locator('.tower-panel:not([hidden])')
    await panel.waitFor({ state: 'visible' })
    assert.equal(await panel.count(), 1)
    await panel.locator('.dismantle-control').focus()
    await screenshot('original')
    report.replacement = await page.evaluate(() =>
      window.__pndBuildingPanelFixture.replaceBetweenPaints(window.buildingIdentity)
    )
    assertReplacement(report.replacement)
    await page.waitForFunction(() => {
      const h = window.buildingIdentity,
        p = h.scene.buildingPanels.get(h.building.id)
      return p === h.panel && !p.hidden && p.children[1].dataset.person === String(h.unit.id)
    })
    const occupant = panel.getByRole('button', { name: 'Occupant 1: brave', exact: true })
    await occupant.click()
    report.selection = await page.evaluate(() => {
      const h = window.buildingIdentity
      return {
        selected: [...h.world.selected],
        inside: h.unit.inside,
        samePanel: h.scene.buildingPanels.get(h.building.id) === h.panel,
      }
    })
    assert.deepEqual(report.selection, {
      selected: [report.replacement.person],
      inside: report.replacement.id,
      samePanel: true,
    })
    await screenshot('selected')
    // Supplied eligibility boundaries; actual DOM holds, projection eligibility
    // and ordinary render frames must retire the stale UI without forced paint.
    report.heldVisibility = []
    async function revealCurrentPanel() {
      await page.waitForFunction(() => {
        const h = window.buildingIdentity
        return h.building.team === 'blue' && h.scene.visible(h.building)
      })
      // Scene.visible updates on focus, but picking also needs the next ordinary
      // painter submission. Wait for an actual unobscured hit, never force paint.
      const targetHandle = await page.waitForFunction(() => {
        const { scene, building } = window.buildingIdentity,
          p = scene.screen(building), rect = scene.renderer.domElement.getBoundingClientRect(),
          cx = rect.left + ((p.x + 1) * rect.width) / 2,
          cy = rect.top + ((1 - p.y) * rect.height) / 2
        for (const dy of [-40, -60, -20, -80, 0, -100, -120, -140, 20, 40, 60])
          for (const dx of [0, -10, 10, -20, 20, -40, 40, -60, 60, -80, 80]) {
            const event = { clientX: cx + dx, clientY: cy + dy }
            if (document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement && scene.picking.pick(event) === building.id)
              return { x: event.clientX, y: event.clientY }
          }
        return false
      })
      const target = await targetHandle.jsonValue()
      await targetHandle.dispose()
      // Move into the interior sidebar, not (0,0), which requests camera edge motion.
      // Moving away also makes a same-coordinate return produce a real hover.
      await page.mouse.move(10, 10)
      await page.mouse.move(target.x, target.y)
      await panel.waitFor({ state: 'visible' })
    }
    for (const hold of ['pointer', 'focus']) {
      for (const boundary of ['ownership', 'visibility']) {
        await revealCurrentPanel()
        if (hold === 'pointer') {
          await panel.hover()
          await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
        } else {
          await panel.locator('.dismantle-control').focus()
          await page.mouse.move(10, 10)
        }
        const before = await page.evaluate(({ hold, boundary }) => {
          const h = window.buildingIdentity, p = h.panel
          const held = hold === 'pointer' ? p.matches(':hover') : p.contains(document.activeElement)
          const otherHold = hold === 'pointer' ? p.contains(document.activeElement) : p.matches(':hover')
          if (!held || otherHold || p.hidden || h.building.team !== 'blue' || !h.scene.visible(h.building) || h.scene.navigationButtons() !== 0)
            throw Error('Expected held, owned and visible positive control')
          h.heldVisibilityBefore = { frame: h.scene.renderer.info.render.frame, viewPoint: { ...h.scene.viewPoint } }
          return { hold, boundary, held, frame: h.heldVisibilityBefore.frame }
        }, { hold, boundary })
        await page.waitForFunction(frame => window.testSceneRef.current.renderer.info.render.frame >= frame + 2, before.frame)
        assert.equal(await panel.isVisible(), true, 'Eligible held panel remains visible across real frames')
        const transition = await page.evaluate(({ hold, boundary }) => {
          const h = window.buildingIdentity, p = h.panel
          const held = hold === 'pointer' ? p.matches(':hover') : p.contains(document.activeElement)
          if (!held || h.scene.navigationButtons() !== 0) throw Error('Hold lost or camera input active before eligibility boundary')
          const frame = h.scene.renderer.info.render.frame
          if (boundary === 'ownership') h.building.team = 'red'
          else h.scene.focus({ x: h.scene.viewPoint.x + 128, z: h.scene.viewPoint.z })
          return { held, frame, afterVisible: h.scene.visible(h.building), team: h.building.team }
        }, { hold, boundary })
        const witness = { ...before, transition, status: 'pending' }
        report.heldVisibility.push(witness)
        if (boundary === 'ownership') assert.equal(transition.team, 'red')
        else assert.equal(transition.afterVisible, false, 'Real Scene visibility rejects camera-excluded building')
        await page.waitForFunction(frame => {
          const h = window.buildingIdentity
          return h.scene.renderer.info.render.frame > frame && h.panel.hidden
        }, transition.frame)
        assert.equal(await panel.count(), 0, 'No visible tower panel after eligibility loss')
        witness.hidden = true
        if (hold === 'focus') await screenshot(`held-${boundary}-hidden`)
        await page.evaluate(() => {
          const h = window.buildingIdentity
          h.building.team = 'blue'
          h.scene.focus(h.heldVisibilityBefore.viewPoint)
        })
        await revealCurrentPanel()
        assert.equal(await panel.isVisible(), true, 'Current eligible panel can reopen')
        witness.reopened = true
        witness.status = 'passed'
      }
    }
    assert.deepEqual(await page.evaluate(() => {
      const h = window.buildingIdentity
      return { selected: [...h.world.selected], inside: h.unit.inside,
        samePanel: h.scene.buildingPanels.get(h.building.id) === h.panel }
    }), report.selection, 'Eligibility diagnostics preserve selection and occupant ownership')
    await screenshot('held-restored')
    await panel.locator('.dismantle-control').click()
    report.partial = await page.evaluate(() =>
      window.__pndBuildingPanelFixture.advanceDismantle(window.buildingIdentity, false)
    )
    assert.ok(report.partial.hp > 0 && report.partial.progress > 0 && report.partial.progress < 1)
    assert.equal(report.partial.removed, false)
    await page.waitForFunction(() =>
      window.buildingIdentity.panel.classList.contains('construction-panel')
    )
    await screenshot('dismantling')
    report.completed = await page.evaluate(() =>
      window.__pndBuildingPanelFixture.advanceDismantle(window.buildingIdentity, true)
    )
    assertCompletion(report.completed)
    await page.waitForFunction(() => {
      const h = window.buildingIdentity
      return !h.panel.isConnected && !h.scene.buildingMeshes.has(h.building.id)
    })
    await screenshot('completed')
  } catch (error) {
    failure = error
    if (page)
      try {
        await screenshot('failure', 3000)
      } catch (diagnostic) {
        report.diagnosticError = String(diagnostic)
      }
  } finally {
    clearTimeout(timer)
  }
  return finishBuildingPanelIdentity({ context, report, output, failure })
}
