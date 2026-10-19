import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import { bindGame } from '../browser-game.mjs'

export class DiagnosticTimeoutError extends Error {
  constructor(message) { super(message); this.name = 'DiagnosticTimeoutError' }
}

// Runner signature is unchanged. Admit standard and compact as SEPARATE <=90s
// cases. This helper launches no browser/server and owns only its fresh context.
// No API patches, game-state writes, storage seeds,
// or programmatic DOM click calls. evaluate/waitForFunction are observations only.
export default async function standard(args) { return run(args, 'standard') }
export async function compact(args) { return run(args, 'compact') }

async function run({ context: runnerContext, output, url, servingDescription }, scenario) {
  mkdirSync(output, { recursive: true })
  const report = { status: 'running', scenario, url, servingDescription, started: new Date().toISOString(),
    capMs: 80000, cleanupMs: 4000, phases: [], errors: [],
    limits: ['Cancel-only Mission 6 presentation test; no destructive quit destination execution.',
      'Public mission selection is setup, not earned campaign progression.',
      'Synthetic browser keyboard only; not physical keyboard or original native pixel parity.',
      'Normal asset availability only; no forced decode failure or network fault coverage.'] }
  const save = () => writeFileSync(resolve(output, 'quit-warning-report.json'), JSON.stringify(report, null, 2) + '\n')
  const phase = name => { report.phases.push({ name, at: new Date().toISOString() }); save() }
  save()
  let owned, page, expired = false, creationPending = false, closing
  const timeoutError = new DiagnosticTimeoutError('Quit-warning diagnostic exceeded 80000ms')
  let rejectDeadline
  const deadline = new Promise((_, reject) => { rejectDeadline = reject })
  const close = () => {
    if (!owned) return Promise.resolve()
    if (closing) return closing
    closing = (async () => {
      let timer
      try {
        await Promise.race([owned.close(), new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Quit-warning context cleanup exceeded 4000ms')), 4000)
        })])
        report.cleanup = 'context-closed'
      } finally { clearTimeout(timer) }
    })()
    return closing
  }
  const timer = setTimeout(() => {
    expired = true
    report.status = 'timed-out'
    save()
    rejectDeadline(timeoutError)
    void close().catch(() => {})
  }, 80000)
  const step = async action => {
    if (expired) throw timeoutError
    const value = await Promise.race([Promise.resolve().then(() => {
      if (expired) throw timeoutError
      return action()
    }), deadline])
    if (expired) throw timeoutError
    return value
  }
  const capture = name => step(() => page.screenshot({ path: resolve(output, `${name}.png`), timeout: 5000 }))
  const work = async () => {
    phase('context-creating')
    creationPending = true
    owned = await step(() => runnerContext.browser().newContext({
      viewport: scenario === 'compact' ? { width: 800, height: 600 } : { width: 1280, height: 800 },
      deviceScaleFactor: 1, serviceWorkers: 'block',
    }).then(async created => {
      owned = created; creationPending = false
      if (expired) { await close(); throw timeoutError }
      return created
    }, error => { creationPending = false; throw error }))
    page = await step(() => owned.newPage())
    page.setDefaultTimeout(6000); page.setDefaultNavigationTimeout(15000)
    page.on('pageerror', error => { report.errors.push(String(error)); save() })
    await step(() => page.goto(url, { waitUntil: 'domcontentloaded' }))
    await step(() => openCampaignFromMainMenu(page))
    await step(() => page.getByRole('button', { name: 'Browser controls', exact: true }).click())
    await step(() => page.getByRole('button', { name: 'All missions', exact: true }).click())
    await step(() => page.getByRole('button', { name: 'Mission 6', exact: true }).click())
    await step(() => page.locator('canvas.battlefield').waitFor({ state: 'visible', timeout: 25000 }))
    await step(() => page.locator('.loading-world').waitFor({ state: 'hidden', timeout: 25000 }))
    await step(() => bindGame(page))
    const readinessSnapshot = () => step(() => page.evaluate(() => {
      const scene = window.testSceneRef?.current, world = scene?.world
      const notice = document.querySelector('.desktop-recommendation')
      const visibleNotice = Boolean(notice && notice.getClientRects().length && getComputedStyle(notice).visibility !== 'hidden')
      return { viewport: { width: innerWidth, height: innerHeight },
        desktopNoticeVisible: visibleNotice,
        started: scene?.started ?? null, current: scene?.isCurrent() ?? false,
        worldMatches: Boolean(world && world === window.testStore?.getWorld()),
        level: world?.outcome.level ?? null, status: world?.status ?? null,
        paused: world?.paused ?? null, inputMask: world?.inputMask ?? null,
        flybyFlags: world?.flyby.flags ?? null, wasFlying: scene?.wasFlying ?? null,
        modalSuspended: scene?.modalSuspended ?? null,
        overviewActive: scene?.overviewActive ?? null, overviewStage: scene?.overviewStage ?? null,
        cameraMotionActive: scene?.cameraMotion.active ?? null,
        resultCameraActive: scene?.resultCamera.active ?? null,
        openDialogs: [...document.querySelectorAll('dialog[open]')].map(dialog => dialog.getAttribute('aria-label')) }
    }))
    report.readinessBeforeNotice = await readinessSnapshot(); phase('mission6-readiness-observed')
    const continueAnyway = page.locator('.desktop-recommendation').getByRole('button', { name: /^Continue anyway/ })
    if (await step(() => continueAnyway.isVisible())) {
      // Production startup pauses widths below 900. Only this public control
      // dismisses the compact-screen notice and resumes that world.
      await step(() => continueAnyway.click())
      await step(() => page.locator('.desktop-recommendation').waitFor({ state: 'hidden' }))
      report.readinessAfterNotice = await readinessSnapshot(); phase('compact-notice-dismissed-publicly')
    }
    try {
      await step(() => page.waitForFunction(() => {
        const scene = window.testSceneRef?.current, world = scene?.world
        return scene?.started && scene.isCurrent() && world === window.testStore?.getWorld() &&
          world.outcome.level === 6 && world.status === 'playing' && !world.paused &&
          !world.inputMask && !(world.flyby.flags & 1) && !scene.wasFlying &&
          !scene.modalSuspended && !scene.overviewActive && !scene.overviewStage &&
          !scene.cameraMotion.active && !scene.resultCamera.active && !document.querySelector('dialog[open]')
      }))
    } catch (error) {
      // Keep the original failure. Diagnostic observation cannot turn timeout
      // into success, and the fixed episode deadline still owns every action.
      try { report.readinessFailure = await readinessSnapshot(); save(); await capture('readiness-failure') }
      catch (observationError) { report.readinessObservationError = String(observationError); save() }
      throw error
    }
    report.readinessSettled = await readinessSnapshot()
    phase('public-mission6-ready')
    await step(() => page.getByRole('button', { name: 'Game settings', exact: true }).click())
    const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
    await step(() => menu.waitFor({ state: 'visible' }))
    const state = () => step(() => page.evaluate(() => {
      const scene = window.testSceneRef.current, world = window.testStore.getWorld()
      return { level: world.outcome.level, turn: world.turn, time: world.time,
        current: scene.isCurrent() && scene.world === world, suspended: scene.modalSuspended,
        paused: world.paused, panel: document.querySelector('[data-original-pause-menu]')?.getAttribute('data-panel'),
        focus: document.activeElement?.getAttribute('aria-label'),
        mainMenu: Boolean(document.querySelector('[data-original-main-menu][open]')) }
    }))
    const identity = await step(() => page.evaluateHandle(() => ({ world: window.testStore.getWorld(), scene: window.testSceneRef.current, canvas: document.querySelector('canvas.battlefield') })))
    const baseline = await state()
    assert.equal(baseline.panel, 'root'); assert.equal(baseline.suspended, true)
    const unchanged = async (panel, focus) => {
      assert.equal(await step(() => page.evaluate(previous => previous.world === window.testStore.getWorld() && previous.scene === window.testSceneRef.current && previous.canvas === document.querySelector('canvas.battlefield'), identity)), true, 'Cancel must retain the actual world, scene and canvas')
      const current = await state()
      assert.deepEqual(current, { ...baseline, panel, focus })
      return current
    }
    report.confirmations = []
    for (const [label, panel, destination] of [
      ['Quit Level', 'quit-level', 'Return to world selection.'],
      ['Quit Game', 'quit-game', 'Return to the main menu.'],
    ]) {
      await step(() => menu.getByRole('button', { name: label, exact: true }).click())
      await step(() => page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'No'))
      await unchanged(panel, 'No')
      const warning = menu.locator('#pause-quit-warning')
      const expected = `${destination} Unsaved progress will be lost.`
      assert.equal(await step(() => menu.getAttribute('aria-describedby')), 'pause-quit-warning')
      assert.equal((await step(() => warning.locator(':scope > span:not([aria-hidden])').textContent())).trim(), expected)
      assert.ok((await step(() => menu.ariaSnapshot())).includes(expected), 'Accessible dialog description must expose the material warning')
      assert.ok(!(await step(() => menu.textContent())).includes('Close the browser tab'))
      const visual = await step(() => warning.evaluate(element => {
        const lines = [...element.children].filter(child => child.getAttribute('aria-hidden') === 'true')
        return lines.map(line => {
          const rect = line.getBoundingClientRect(), glyphs = [...line.querySelectorAll('i')]
          return { glyphs: glyphs.length, fallback: line.textContent.trim(), width: rect.width,
            glyphsInViewport: glyphs.every(glyph => { const r = glyph.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }),
            atlas: glyphs.every(glyph => getComputedStyle(glyph).backgroundImage.includes('/original/pause-font.png')) }
        })
      }))
      assert.equal(visual.length, 2)
      for (const [index, line] of visual.entries()) {
        assert.ok(line.glyphs > 0 || line.fallback === [destination, 'Unsaved progress will be lost.'][index])
        if (line.glyphs) { assert.equal(line.atlas, true); assert.equal(line.glyphsInViewport, true) }
      }
      const hits = []
      for (const name of ['Yes', 'No', 'Back']) {
        const hit = await step(() => menu.getByRole('button', { name, exact: true }).evaluate(button => {
          const r = button.getBoundingClientRect(), found = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
          return { label: button.getAttribute('aria-label'), reachable: found === button || button.contains(found),
            inViewport: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }
        }))
        assert.equal(hit.reachable, true); assert.equal(hit.inViewport, true); hits.push(hit)
      }
      report.confirmations.push({ label, expected, visual, hits }); phase(`${panel}-verified`)
      await capture(`${scenario}-${panel}`)
      await step(() => menu.getByRole('button', { name: 'No', exact: true }).click())
      await step(() => page.waitForFunction(label => document.activeElement?.getAttribute('aria-label') === label, label))
      await unchanged('root', label)
      // Reopen and dismiss with a fresh synthetic Escape; never activate Yes.
      await step(() => page.keyboard.press('Enter'))
      await step(() => page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'No'))
      await unchanged(panel, 'No')
      await step(() => page.keyboard.press('Escape'))
      await step(() => page.waitForFunction(label => document.activeElement?.getAttribute('aria-label') === label, label))
      await unchanged('root', label)
      phase(`${panel}-cancel-reopen-escape-preserved`)
    }
    await step(() => identity.dispose())
    assert.deepEqual(report.errors, [])
  }
  let failure
  try {
    await Promise.race([work(), deadline])
    if (expired) throw timeoutError
  } catch (error) {
    failure = expired ? timeoutError : error
    report.status = expired ? 'timed-out' : 'failed'
    report.error = String(failure.stack || failure)
  } finally {
    clearTimeout(timer)
    try { await close() }
    catch (error) { report.cleanupError = String(error); failure ??= error }
    report.creationPending = creationPending
    if (creationPending) failure ??= new Error('Context creation still pending at cleanup')
    if (expired) report.status = 'timed-out'
    else report.status = failure ? 'failed' : 'passed'
    report.finished = new Date().toISOString()
    save()
  }
  if (failure) throw failure
  return report
}
