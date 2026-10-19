import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
// Resolved when staged beside the other admitted ui-readiness-browser helpers.
import { bindGame } from '../browser-game.mjs'

export class DiagnosticTimeoutError extends Error {
  constructor(message) { super(message); this.name = 'DiagnosticTimeoutError' }
}

// Runner signature is unchanged. Admit frontend and gameplay as SEPARATE <=90s
// cases. This helper launches no browser/server and owns only its fresh context.
// No API patches, fullscreenElement injection, game-state writes, storage seeds,
// or programmatic DOM click calls. evaluate/waitForFunction are observations only.
export default async function frontend(args) { return run(args, 'frontend') }
export async function gameplay(args) { return run(args, 'gameplay-tutorial') }
export async function placement(args) { return run(args, 'placement') }

async function run({ context: runnerContext, output, url, servingDescription }, scenario) {
  mkdirSync(output, { recursive: true })
  const report = { status: 'running', scenario, url, servingDescription, started: new Date().toISOString(),
    capMs: 80000, cleanupMs: 4000, phases: [], errors: [],
    limits: ['Actual Fullscreen API and source-pinned CDP synthetic browser-key exit; failure is not a pass.',
      'Physical OS Escape is NOT TESTED; nativeVirtualKeyCode selects browser processing but is still synthetic input.',
      'Public Tutorial/API and Mission 1 placement setup test controls, not campaign progression.',
      'DOM-visible selection/mode invariants, not simulation-equivalence or hardware-performance proof.'] }
  const save = () => writeFileSync(resolve(output, 'fullscreen-report.json'), JSON.stringify(report, null, 2) + '\n')
  const phase = name => { report.phases.push({ name, at: new Date().toISOString() }); save() }
  save()
  let owned, page, cdp, expired = false, creationPending = false, closing
  const timeoutError = new DiagnosticTimeoutError('Fullscreen diagnostic exceeded 80000ms')
  let rejectDeadline
  const deadline = new Promise((_, reject) => { rejectDeadline = reject })
  const close = () => {
    if (!owned) return Promise.resolve()
    if (closing) return closing
    closing = (async () => {
      let timer
      try {
        await Promise.race([owned.close(), new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Fullscreen context cleanup exceeded 4000ms')), 4000)
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
  const snapshot = () => step(() => page.evaluate(() => {
    const button = document.querySelector('[data-fullscreen-control] button')
    const r = button?.getBoundingClientRect()
    const hit = r && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    const dialog = button?.closest('dialog')
    const viewport = document.querySelector('.world-viewport')?.getBoundingClientRect()
    const canvas = document.querySelector('.world-viewport canvas.battlefield')
    return {
      fullscreen: Boolean(document.fullscreenElement), fullscreenEnabled: document.fullscreenEnabled,
      fullscreenTag: document.fullscreenElement?.tagName ?? null,
      controlCount: document.querySelectorAll('[data-fullscreen-control] button').length,
      label: button?.getAttribute('aria-label'), pressed: button?.getAttribute('aria-pressed'),
      reachable: Boolean(button && (hit === button || button.contains(hit))),
      modal: dialog?.getAttribute('aria-label') ?? null,
      modalOpen: dialog?.open ?? false, focused: document.activeElement === button,
      options: document.querySelector('[data-original-options]')?.getAttribute('data-category') ?? null,
      pausePanel: document.querySelector('[data-original-pause-menu]')?.getAttribute('data-panel') ?? null,
      mainMenu: Boolean(document.querySelector('[data-original-main-menu][open]')),
      pauseMenu: Boolean(document.querySelector('[data-original-pause-menu][open]')),
      targetPrompt: document.querySelector('.target-prompt')?.textContent ?? null,
      selection: [...document.querySelectorAll('.native-hud button[aria-pressed="true"]')].map(el => el.getAttribute('aria-label')),
      pausedBadge: Boolean(document.querySelector('.paused-badge')),
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      battlefield: viewport && { width: viewport.width, height: viewport.height, bufferWidth: canvas?.width, bufferHeight: canvas?.height },
      statusText: document.querySelector('#fullscreen-status')?.textContent ?? null,
    }
  }))
  const visibleControl = async expectedModal => {
    const state = await snapshot()
    assert.equal(state.controlCount, 1)
    assert.equal(state.reachable, true, 'Fullscreen control must win real elementFromPoint hit test')
    assert.equal(state.modal, expectedModal)
    if (expectedModal) assert.equal(state.modalOpen, true)
    return state
  }
  const enter = async (name, modal, keyboard = false) => {
    await visibleControl(modal)
    const button = page.getByRole('button', { name: 'Fullscreen', exact: true })
    if (keyboard) {
      await step(() => button.focus())
      await step(() => page.keyboard.press('Enter'))
    } else await step(() => button.click())
    try { await step(() => page.waitForFunction(() => Boolean(document.fullscreenElement), null, { timeout: 6000 })) }
    catch (error) { report.fullscreenFailure = await snapshot(); save(); throw error }
    await step(() => page.getByRole('button', { name: 'Exit fullscreen', exact: true }).waitFor({ state: 'visible' }))
    const state = await visibleControl(modal)
    assert.equal(state.fullscreenTag, 'HTML')
    assert.equal(state.pressed, 'true')
    if (keyboard) assert.equal(state.focused, true, 'Keyboard focus survives fullscreen/modal re-promotion')
    report[name] = state
    phase(name)
    await capture(name)
  }
  const exit = async (name, escape = false) => {
    if (escape) {
      // Linux XKB Escape=9, VKEY_ESCAPE=27, pinned Chrome155 source below.
      // Unlike Playwright.keyboard, this provides the native-key field needed
      // for Chrome's browser prehandler. It is NOT physical OS keyboard input.
      const key = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
        nativeVirtualKeyCode: 9, modifiers: 0, autoRepeat: false, isKeypad: false, location: 0 }
      await step(() => cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...key }))
      await step(() => cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key }))
    }
    else await step(() => page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click())
    try { await step(() => page.waitForFunction(() => !document.fullscreenElement, null, { timeout: 6000 })) }
    catch (error) { report.nativeExitFailure = await snapshot(); save(); throw error }
    await step(() => page.getByRole('button', { name: 'Fullscreen', exact: true }).waitFor({ state: 'visible' }))
    report[name] = await snapshot()
    assert.equal(report[name].pressed, 'false')
    phase(name)
    await capture(name)
  }
  const publicGameState = state => ({ pauseMenu: state.pauseMenu, mainMenu: state.mainMenu,
    selection: state.selection, targetPrompt: state.targetPrompt, pausedBadge: state.pausedBadge })
  const work = async () => {
    assert.equal(process.platform, 'linux', 'Reviewed synthetic native-key mapping is Linux only')
    assert.match(runnerContext.browser().version(), /155\.0\.8059\.39$/, 'Re-review key routing if Chrome changes')
    report.escapeInput = { method: 'CDP Input.dispatchKeyEvent', key: 'Escape', code: 'Escape',
      windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 9, platform: 'linux',
      scope: 'synthetic browser-key path; physical OS Escape unknown',
      sourceTag: 'chromium/155.0.8059.39' }
    phase('context-creating')
    creationPending = true
    owned = await step(() => runnerContext.browser().newContext({ viewport: scenario === 'placement' ? { width: 800, height: 600 } : { width: 1280, height: 800 }, deviceScaleFactor: 1, serviceWorkers: 'block' })
      .then(async created => {
        owned = created
        creationPending = false
        if (expired) { await close(); throw timeoutError }
        return created
      }, error => { creationPending = false; throw error }))
    page = await step(() => owned.newPage())
    cdp = await step(() => owned.newCDPSession(page))
    page.setDefaultTimeout(6000)
    page.setDefaultNavigationTimeout(20000)
    page.on('pageerror', error => { report.errors.push(String(error)); save() })
    await step(() => page.goto(url, { waitUntil: 'domcontentloaded' }))
    const main = page.getByRole('dialog', { name: 'Main menu', exact: true })
    await step(() => main.getByRole('button', { name: 'Tutorial', exact: true }).waitFor({ state: 'visible', timeout: 20000 }))
    phase('frontend-ready')
    if (scenario === 'placement') {
      const hit = async (locator, label) => {
        const value = await step(() => locator.evaluate(element => {
          const r = element.getBoundingClientRect(), found = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2)
          return { left:r.left, top:r.top, right:r.right, bottom:r.bottom,
            reachable: found === element || element.contains(found), label: element.getAttribute('aria-label') }
        }))
        assert.equal(value.reachable, true, `${label} must win its actual public hit test`)
        return value
      }
      const disjoint = (a, b, label) => assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, label)
      await step(() => main.getByRole('button', { name: 'New Game', exact: true }).click())
      const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
      const recommendation = page.locator('[data-original-tutorial-recommendation]')
      await step(() => recommendation.or(selector).first().waitFor({ state: 'visible' }))
      if (await step(() => recommendation.isVisible()))
        await step(() => recommendation.getByRole('button', { name: 'No', exact: true }).click())
      await step(() => selector.waitFor({ state: 'visible' }))
      const start = selector.getByRole('button', { name: 'Start Mission 1', exact: true })
      await step(() => start.waitFor({ state: 'visible' }))
      const control = page.locator('[data-fullscreen-control] button')
      const controls = selector.getByRole('button', { name: 'Browser controls', exact: true })
      report.selectorPlacement = { fullscreen: await hit(control, 'selector Fullscreen'),
        start: await hit(start, 'Start Mission 1'), browserControls: await hit(controls, 'Browser controls') }
      disjoint(report.selectorPlacement.fullscreen, report.selectorPlacement.start, 'Fullscreen must not overlap Start')
      disjoint(report.selectorPlacement.fullscreen, report.selectorPlacement.browserControls, 'Fullscreen must not overlap Browser controls')
      await enter('selector-placement-enter', 'Start game')
      await exit('selector-placement-exit')
      await hit(start, 'Start after fullscreen roundtrip')
      await capture('selector-start-reachable-800x600')
      // This actual public click failed47times with the original lower-right overlay.
      await step(() => start.click())
      await step(() => page.locator('.world-viewport canvas.battlefield').waitFor({ state: 'visible', timeout: 25000 }))
      await step(() => page.locator('.loading-world').waitFor({ state: 'hidden', timeout: 25000 }))
      await step(() => selector.waitFor({ state: 'hidden' }))
      phase('selector-public-start-succeeded')
      await step(() => page.setViewportSize({ width:640, height:480 }))
      const desktop = page.locator('.desktop-recommendation')
      if (await step(() => desktop.isVisible()))
        await step(() => desktop.getByRole('button', { name: /Continue anyway/ }).click())
      const skip = page.locator('.skip-introduction')
      if (await step(() => skip.isVisible())) await step(() => skip.click())
      await step(() => page.keyboard.press('F8'))
      await step(() => page.locator('.fps-graph').waitFor({ state:'visible' }))
      // Exercise the actual compact F8 pause layout, with no state injection.
      const pause = page.getByRole('button', { name:'Pause game', exact:true })
      if (await step(() => pause.isVisible())) await step(() => pause.click())
      const resume = page.locator('.paused-badge')
      await step(() => resume.waitFor({ state:'visible' }))
      report.compactPlacement = { fullscreen:await hit(control, 'compact HUD Fullscreen'), resume:await hit(resume, 'compact F8 Resume') }
      disjoint(report.compactPlacement.fullscreen, report.compactPlacement.resume, 'Fullscreen must not overlap compact Resume')
      const docked = await step(() => control.evaluate(element => Boolean(element.closest('.top-actions'))))
      assert.equal(docked, true, 'Gameplay control must be docked in native HUD actions')
      await enter('compact-hud-placement-enter', null)
      await exit('compact-hud-placement-exit')
      await hit(resume, 'Resume after fullscreen roundtrip')
      await hit(control, 'HUD Fullscreen after roundtrip')
      await capture('compact-f8-resume-reachable-640x480')
      await step(() => resume.click())
      await step(() => resume.waitFor({ state:'hidden' }))
      await hit(control, 'HUD Fullscreen after public resume')
      phase('compact-f8-public-resume-succeeded')
    } else if (scenario === 'frontend') {
      await enter('main-enter-click', 'Main menu')
      await exit('main-exit-click')
      await step(() => main.getByRole('button', { name: 'Options', exact: true }).click())
      await step(() => page.locator('[data-original-options]').waitFor({ state: 'visible' }))
      const before = await snapshot()
      assert.notEqual(before.options, null, 'Frontend Options baseline must be real')
      await enter('options-enter-keyboard', 'Main menu', true)
      await exit('options-exit-synthetic-browser-escape', true)
      const after = await visibleControl('Main menu')
      assert.equal(after.options, before.options, 'Synthetic browser-key fullscreen exit must not leave Options')
      assert.notEqual(after.options, null)
      phase('frontend-options-preserved')
    } else {
      await step(() => main.getByRole('button', { name: 'Tutorial', exact: true }).click())
      await step(() => page.locator('.world-viewport canvas.battlefield').waitFor({ state: 'visible', timeout: 25000 }))
      await step(() => page.locator('.loading-world').waitFor({ state: 'hidden', timeout: 25000 }))
      await step(() => main.waitFor({ state: 'hidden' }))
      // A rendered/loading-free canvas does not establish native input readiness.
      // Observe the current scene/store exactly as the cursor diagnostic does;
      // never change masks, advance ticks, or create a flyby to satisfy this gate.
      await step(() => bindGame(page))
      const readiness = () => step(() => page.evaluate(() => {
        const scene = window.testSceneRef?.current, world = scene?.world
        if (!scene || !world) return { ready:false, reason:'No bound scene' }
        const state = {
          level:world.outcome.level, started:scene.started, current:scene.isCurrent(),
          storeMatches:world === window.testStore?.getWorld(),
          connected:scene.renderer.domElement.isConnected,
          loading:Boolean(document.querySelector('.loading-world')),
          status:world.status, paused:world.paused, inputMask:world.inputMask,
          flybyFlags:world.flyby.flags, wasFlying:scene.wasFlying,
          modalSuspended:scene.modalSuspended, overviewActive:scene.overviewActive,
          overviewStage:scene.overviewStage, gameFlags:world.manaWorld.gameFlags,
          dialogOpen:Boolean(document.querySelector('dialog[open]')),
          selectedKinds:world.units.filter(u => world.selected.includes(u.id)).map(u => u.kind),
          blueBraves:world.units.filter(u => u.team === 'blue' && u.hp > 0 && u.kind === 'brave').length,
        }
        return { ...state, ready:state.level === 79 && state.started && state.current &&
          state.storeMatches && state.connected && !state.loading && state.status === 'playing' &&
          !state.paused && !state.inputMask && !(state.flybyFlags & 1) && !state.wasFlying &&
          !state.modalSuspended && !state.overviewActive && !state.overviewStage &&
          !(state.gameFlags & 32) && !state.dialogOpen }
      }))
      report.tutorialReadiness = { before:await readiness(), skippedIntroduction:false }
      save()
      const readyDeadline = Date.now() + 25000
      for (;;) {
        const observed = await readiness()
        report.tutorialReadiness.after = observed
        save()
        if (observed.ready) {
          if (report.tutorialReadiness.overviewAction)
            report.tutorialReadiness.overviewAction.after = observed
          save()
          break
        }
        assert.ok(Date.now() < readyDeadline, `Tutorial input readiness timed out: ${JSON.stringify(observed)}`)
        // Tutorial starts in native overview when drawMode is 2. Class selection
        // is intentionally blocked there. Use one real canvas-focused Enter to
        // leave it, then observe the normal morph; never toggle repeatedly or
        // write overview state. Only act on the current, otherwise healthy scene.
        if (!report.tutorialReadiness.overviewAction && observed.overviewActive &&
            !observed.overviewStage && !observed.inputMask && !observed.modalSuspended &&
            !observed.dialogOpen && observed.started && observed.current && observed.storeMatches &&
            observed.connected && !observed.loading && observed.level === 79 &&
            observed.status === 'playing' && !observed.paused && !(observed.flybyFlags & 1) &&
            !observed.wasFlying && !(observed.gameFlags & 32)) {
          report.tutorialReadiness.overviewAction = { before:observed, input:'canvas-focused public Enter', attempted:true }
          save()
          const canvas = page.locator('canvas.battlefield')
          await step(() => canvas.focus())
          assert.equal(await step(() => canvas.evaluate(el => document.activeElement === el)), true,
            'Overview exit Enter must target actual battlefield, not a HUD button')
          await step(() => page.keyboard.press('Enter'))
          report.tutorialReadiness.overviewAction.afterInput = await readiness()
          save()
        }
        // Tutorial has authored flyby opcodes. Skip only an actually visible
        // public introduction, once; this case does not test its completion.
        const skip = page.getByRole('button', { name:/^Skip introduction/ })
        if (!report.tutorialReadiness.skippedIntroduction && observed.flybyFlags & 1 &&
            await step(() => skip.isVisible())) {
          await step(() => skip.click())
          report.tutorialReadiness.skippedIntroduction = true
        }
        await step(() => page.waitForTimeout(100))
      }
      phase('tutorial-input-ready')
      // Native class selection is additive (hud-selection.ts). aria-pressed
      // means EVERY selected unit has that class, not that a Brave was selected.
      // Mixed native selection is valid: retain visible pressed-state observations
      // while checking actual selected IDs/mode and object identity read-only.
      report.tutorialSelectionBaseline = await readiness()
      const brave = page.getByRole('button', { name: 'Select brave', exact: true })
      assert.equal(await step(() => brave.isEnabled()), true, 'Public Brave control must be enabled')
      await step(() => brave.click())
      await step(() => page.waitForFunction(() => {
        const scene = window.testSceneRef?.current, world = scene?.world
        return scene?.isCurrent() && world === window.testStore?.getWorld() &&
          world.units.some(u => world.selected.includes(u.id) && u.team === 'blue' && u.hp > 0 && u.kind === 'brave')
      }, null, { timeout: 6000 }))
      // A Playwright handle retains references without installing game/test globals
      // or changing scene/world data. Context cleanup also releases it on timeout.
      const selectionIdentity = await step(() => page.evaluateHandle(() => ({
        scene:window.testSceneRef.current, world:window.testStore.getWorld(), store:window.testStore,
      })))
      const selectionState = () => step(() => selectionIdentity.evaluate(({ scene, world, store }) => ({
        sameScene:window.testSceneRef?.current === scene,
        sameWorld:scene.world === world && window.testStore?.getWorld() === world,
        sameStore:window.testStore === store,
        current:scene.isCurrent(), selectedIds:[...world.selected], mode:world.mode,
        selectedLiveBlueBraveIds:world.units.filter(u => world.selected.includes(u.id) &&
          u.team === 'blue' && u.hp > 0 && u.kind === 'brave').map(u => u.id),
      })))
      try {
        const selectedBefore = await selectionState()
        assert.ok(selectedBefore.sameScene && selectedBefore.sameWorld && selectedBefore.sameStore && selectedBefore.current)
        assert.ok(selectedBefore.selectedLiveBlueBraveIds.length > 0, 'Public click must establish selected live Blue Brave')
        report.gameplaySelection = { before:selectedBefore, transitions:[] }
        phase('tutorial-playing')
        const before = await snapshot()
        assert.equal(before.mainMenu, false)
        assert.ok(before.battlefield?.bufferWidth > 0)
        const unchanged = async name => {
          const after = await selectionState()
          report.gameplaySelection.transitions.push({ name, ...after })
          save()
          assert.deepEqual(after, selectedBefore, 'Fullscreen must preserve exact selected IDs/mode and live scene/world identity')
          assert.deepEqual(publicGameState(await snapshot()), publicGameState(before),
            'Fullscreen must preserve Tutorial visible menu/selection/mode state')
        }
        await enter('gameplay-enter-click', null)
        await unchanged('enter-click')
        await exit('gameplay-exit-click')
        await unchanged('exit-click')
        await enter('gameplay-enter-keyboard', null, true)
        await unchanged('enter-keyboard')
        await exit('gameplay-exit-synthetic-browser-escape', true)
        await unchanged('exit-synthetic-browser-escape')
      // Test pause/options re-promotion separately from free gameplay Escape.
      await step(() => page.getByRole('button', { name: 'Menu', exact: true }).click())
      const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
      await step(() => menu.getByRole('button', { name: 'Options', exact: true }).click())
      await step(() => menu.locator('[data-original-options]').waitFor({ state: 'visible' }))
      const paused = await snapshot()
      assert.equal(paused.pausePanel, 'options', 'Pause menu must actually enter Options')
      assert.notEqual(paused.options, null, 'Pause Options category baseline must be real')
      await enter('pause-options-enter', 'Game menu')
      assert.deepEqual(await selectionState(), selectedBefore, 'Pause/options fullscreen entry must preserve selection and scene/world')
      await exit('pause-options-exit-synthetic-browser-escape', true)
      assert.deepEqual(await selectionState(), selectedBefore, 'Pause/options fullscreen exit must preserve selection and scene/world')
      const after = await visibleControl('Game menu')
      assert.equal(after.pausePanel, paused.pausePanel)
      assert.equal(after.options, paused.options)
      assert.equal(after.pauseMenu, true, 'Fullscreen Escape must not resume gameplay')
      // Resize while the scene remains behind its unchanged pause/options dialog.
      report.resizes = []
      for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
        await step(() => page.setViewportSize(viewport))
        await step(() => page.waitForFunction(({ width, height }) => {
          const root = document.querySelector('.world-viewport'), canvas = root?.querySelector('canvas.battlefield')
          if (!root || !canvas) return false
          const r = root.getBoundingClientRect(), c = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 1.8)
          return innerWidth === width && innerHeight === height && Math.abs(c.width - r.width) < 1 && Math.abs(c.height - r.height) < 1 &&
            canvas.width === Math.floor(r.width * dpr) && canvas.height === Math.floor(r.height * dpr)
        }, viewport, { timeout: 6000 }))
        report.resizes.push(await snapshot())
      }
      phase('exit-resize-renderer-roundtrip-passed')
      await capture('exit-resize-renderer-roundtrip')
      } finally {
        await selectionIdentity.dispose()
      }
    }
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
