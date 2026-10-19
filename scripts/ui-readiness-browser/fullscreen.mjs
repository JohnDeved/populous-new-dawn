import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export class DiagnosticTimeoutError extends Error {
  constructor(message) { super(message); this.name = 'DiagnosticTimeoutError' }
}

// Runner signature is unchanged. Admit frontend and gameplay as SEPARATE <=90s
// cases. This helper launches no browser/server and owns only its fresh context.
// No API patches, fullscreenElement injection, game-state writes, storage seeds,
// or programmatic DOM click calls. evaluate/waitForFunction are observations only.
export default async function frontend(args) { return run(args, 'frontend') }
export async function gameplay(args) { return run(args, 'gameplay-tutorial') }

async function run({ context: runnerContext, output, url, servingDescription }, scenario) {
  mkdirSync(output, { recursive: true })
  const report = { status: 'running', scenario, url, servingDescription, started: new Date().toISOString(),
    capMs: 80000, cleanupMs: 4000, phases: [], errors: [],
    limits: ['Actual Fullscreen API and source-pinned CDP synthetic browser-key exit; failure is not a pass.',
      'Physical OS Escape is NOT TESTED; nativeVirtualKeyCode selects browser processing but is still synthetic input.',
      'Tutorial public-UI setup tests fullscreen mechanics, not campaign progression.',
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
    owned = await step(() => runnerContext.browser().newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, serviceWorkers: 'block' })
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
    if (scenario === 'frontend') {
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
      // Unlike the Shaman portrait, this public class control exposes a real
      // pressed selection witness. Tutorial's authored Blue Braves are present.
      const brave = page.getByRole('button', { name: 'Select brave', exact: true })
      await step(() => brave.click())
      await step(() => page.waitForFunction(() =>
        document.querySelector('.native-hud button[aria-label="Select brave"]')?.getAttribute('aria-pressed') === 'true',
        null, { timeout: 6000 }))
      phase('tutorial-playing')
      const before = await snapshot()
      assert.equal(before.mainMenu, false)
      assert.ok(before.selection.includes('Select brave'), 'Baseline must expose selected Brave class')
      assert.ok(before.battlefield?.bufferWidth > 0)
      await enter('gameplay-enter-click', null)
      await exit('gameplay-exit-click')
      await enter('gameplay-enter-keyboard', null, true)
      await exit('gameplay-exit-synthetic-browser-escape', true)
      assert.deepEqual(publicGameState(await snapshot()), publicGameState(before), 'Fullscreen exit must not open Tutorial pause menu or change visible selection/mode')
      // Test pause/options re-promotion separately from free gameplay Escape.
      await step(() => page.getByRole('button', { name: 'Menu', exact: true }).click())
      const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
      await step(() => menu.getByRole('button', { name: 'Options', exact: true }).click())
      await step(() => menu.locator('[data-original-options]').waitFor({ state: 'visible' }))
      const paused = await snapshot()
      assert.equal(paused.pausePanel, 'options', 'Pause menu must actually enter Options')
      assert.notEqual(paused.options, null, 'Pause Options category baseline must be real')
      await enter('pause-options-enter', 'Game menu')
      await exit('pause-options-exit-synthetic-browser-escape', true)
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
