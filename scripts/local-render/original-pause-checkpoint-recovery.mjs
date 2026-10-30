import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { openCampaignFromMainMenu, waitForStartupMenu } from '../browser-new-game.mjs'
import { readCommittedCheckpoint } from './checkpoint-observer.mjs'
import { checkPauseHeldEscape } from './pause-held-escape.mjs'
import { observeStablePauseControls } from './pause-capture-controls.mjs'

// Controlled failure/timing at the browser storage boundary. The retry opens a
// real database; only delivery of its success event is held. No game/store state
// or checkpoint contents are supplied by the fixture.
function coldLookupFailure() {
  const open = IDBFactory.prototype.open
  window.pauseLookupAttempts = 0
  IDBFactory.prototype.open = function (...args) {
    if (args[0] !== 'populous-new-dawn') return open.apply(this, args)
    const attempt = ++window.pauseLookupAttempts
    if (attempt === 1)
      throw new DOMException('Controlled cold checkpoint lookup failure', 'UnknownError')
    const request = open.apply(this, args)
    if (attempt === 2) request.addEventListener('success', event => {
      event.stopImmediatePropagation()
      window.finishPauseLookup = () => request.dispatchEvent(new Event('success'))
    }, { once: true })
    return request
  }
}

// Store/Scene binding and flyby flags may precede React's ready-gated Skip
// control. Poll for a public actionable state rather than sampling visibility once.
export function pauseStartupReady() {
  const world = window.testStore.getWorld()
  if (!world.inputMask) return 'ready'
  const skip = document.querySelector('button.skip-introduction')
  return skip && skip.getClientRects().length > 0 &&
    getComputedStyle(skip).visibility !== 'hidden' && !skip.disabled ? 'skip' : false
}

// The introduction may finish between readiness and activation. Always await the
// bounded public click, and forgive its failure only if input is already unlocked.
export async function skipPauseIntroduction(page, { timeout = 2500 } = {}) {
  if (await page.evaluate(() => !window.testStore.getWorld().inputMask)) return
  try {
    // The caller re-observes actual input/native readiness. This setup action
    // need not wait for Playwright's post-click navigation/interceptor work.
    await page.getByRole('button', { name: /^Skip introduction/ }).click({ timeout, noWaitAfter: true })
  } catch (error) {
    if (await page.evaluate(() => !!window.testStore.getWorld().inputMask)) throw error
  }
}

// A later authored flyby can begin after the initial input-unlocked sample.
// This callback only operates an observed public control, once per readiness
// wait. It never changes eligibility or resets the caller's existing deadline.
export function recoverVisibleIntroduction(page) {
  let attempted = false
  return async ({ after, remainingMs }) => {
    if (attempted || remainingMs <= 0 || !(after.inputMask & 64) || !after.introductionSkipVisible) return null
    await skipPauseIntroduction(page, { timeout: Math.min(2500, remainingMs) })
    attempted = true
    return { action: 'public-skip-introduction' }
  }
}

export default async function ({ browser, page, url, root, output, receipt, signal }) {
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const checks = [], screenshots = [], renderers = [], frontendKeyboard = []
  const passed = name => {
    checks.push(name)
    writeFileSync(resolve(output, 'progress.json'), JSON.stringify({ checks, screenshots }, null, 2))
  }
  const button = (page, name) => page.getByRole('button', { name, exact: true })
  const modal = page => page.getByRole('dialog', { name: 'Game menu', exact: true })
  const focused = (page, name) => button(page, name).evaluate(node => node === document.activeElement)
  const snapshot = page => page.evaluate(() => {
    const scene = window.testSceneRef.current
    return JSON.stringify({
      world: window.testStore.getWorld(),
      animation: scene.gameClock.animationFrame,
      animationTime: scene.gameClock.animationTime,
      phase: scene.globe.phase,
      camera: scene.cameraPosition,
      position: scene.camera.position.toArray(),
      quaternion: scene.camera.quaternion.toArray(),
    })
  })
  async function enterMission(page) {
    await openCampaignFromMainMenu(page)
    await button(page, 'Start Mission 1').click()
    await bindGame(page)
    const desktop = page.getByRole('button', { name: 'Continue anyway', exact: false })
    if (await desktop.isVisible()) await desktop.click()
    const startup = await page.waitForFunction(pauseStartupReady)
    const action = await startup.jsonValue()
    await startup.dispose()
    if (action === 'skip') await skipPauseIntroduction(page)
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    renderers.push(await page.evaluate(() => {
      const gl = window.testSceneRef.current.renderer.getContext()
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        version: gl.getParameter(gl.VERSION),
        renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        dpr: devicePixelRatio,
      }
    }))
  }
  async function openFailedLoad(page, captureRoot = false) {
    signal.throwIfAborted()
    await enterMission(page)
    await page.waitForFunction(() => window.testStore.getCheckpointReadStatus() === 'failed')
    await button(page, 'Game settings').click()
    assert.equal(await button(page, 'Load Game').isEnabled(), true)
    if (captureRoot) {
      for (const [width, height] of [[640, 480], [1920, 1080]]) {
        await page.setViewportSize({ width, height })
        await capture(page, `failed-root-${width}x${height}.png`)
      }
    }
    await button(page, 'Load Game').focus()
    await page.keyboard.press('Enter')
    await modal(page).getByRole('status').filter({ hasText: 'Could not read browser storage.' }).waitFor()
    assert.equal(await button(page, 'Load checkpoint').isDisabled(), true)
  }
  async function retry(page) {
    await button(page, 'Retry checkpoint lookup').focus()
    await page.keyboard.down('Enter')
    try {
      await page.keyboard.down('Enter')
      await page.keyboard.down('Enter')
      assert.equal(await modal(page).getAttribute('data-panel'), 'load')
    } finally {
      await page.keyboard.up('Enter')
    }
    await page.waitForFunction(() => typeof window.finishPauseLookup === 'function')
    assert.equal(await page.evaluate(() => window.testStore.getCheckpointReadStatus()), 'pending')
    assert.equal(await button(page, 'Retry checkpoint lookup').isDisabled(), true)
    assert.equal(await focused(page, 'Back'), true)
    // Repeated activation of the now-disabled real control cannot issue a read.
    await button(page, 'Retry checkpoint lookup').evaluate(node => { node.click(); node.click() })
    assert.equal(await page.evaluate(() => window.pauseLookupAttempts), 2)
  }
  async function frontendRetry(key, leaveForOptions = false) {
    signal.throwIfAborted()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForStartupMenu(page)
    const main = page.getByRole('dialog', { name: 'Main menu', exact: true })
    await main.getByRole('status').filter({ hasText: 'Could not read browser storage.' }).waitFor()
    await page.evaluate(() => {
      // Read-only observation of Home's real store, as in profile-recovery.
      const root = document.querySelector('main')
      let fiber = root[Object.keys(root).find(key => key.startsWith('__reactFiber'))]
      for (; fiber; fiber = fiber.return)
        for (let hook = fiber.memoizedState; hook; hook = hook.next)
          if (hook.memoizedState?.getCheckpointReadStatus && hook.memoizedState?.getWorld)
            window.frontendRecoveryStore = hook.memoizedState
      if (!window.frontendRecoveryStore) throw Error('Home checkpoint observer unavailable')
      window.frontendRecoveryWorld = window.frontendRecoveryStore.getWorld()
      window.frontendRecoveryKeys = []
      for (const type of ['keydown', 'keyup'])
        document.addEventListener(type, event => {
          if (event.key === 'Enter' || event.key === ' ')
            window.frontendRecoveryKeys.push({ type, key: event.key,
              repeat: event.repeat, prevented: event.defaultPrevented })
        })
    })
    await button(page, 'Retry checkpoint lookup').focus()
    await page.keyboard.down(key)
    let held = true
    try {
      await page.keyboard.down(key)
      await page.keyboard.down(key)
      if (key === 'Space') {
        assert.equal(await page.evaluate(() => window.pauseLookupAttempts), 1,
          'Space must activate Retry on release, not repeated keydown')
        await page.keyboard.up(key)
        held = false
      }
      await page.waitForFunction(() => typeof window.finishPauseLookup === 'function')
      assert.equal(await button(page, 'Retry checkpoint lookup').isDisabled(), true)
      assert.equal(await focused(page, 'Load Game'), true)
      assert.equal(await page.evaluate(() => window.pauseLookupAttempts), 2)
      if (leaveForOptions) {
        if (held) {
          await page.keyboard.up(key)
          held = false
        }
        await button(page, 'Options').click()
        await button(page, 'Back').focus()
      }
      await page.evaluate(() => window.finishPauseLookup())
      await page.waitForFunction(() => window.frontendRecoveryStore.getCheckpointReadStatus() === 'read')
      if (held) {
        await page.keyboard.down(key)
        await page.keyboard.down(key)
        await page.keyboard.up(key)
        held = false
      }
      assert.equal(await main.isVisible(), true, 'held activation must not load the checkpoint')
      assert.equal(await page.evaluate(() => window.frontendRecoveryStore.getWorld() === window.frontendRecoveryWorld), true)
      if (leaveForOptions) {
        assert.equal(await focused(page, 'Back'), true, 'late lookup must not steal Options focus')
        await button(page, 'Back').click()
      } else assert.equal(await focused(page, 'Load Game'), true)
      assert.equal(await button(page, 'Load Game').getAttribute('aria-disabled'), 'false')
      const events = await page.evaluate(() => window.frontendRecoveryKeys)
      assert.ok(events.some(event => event.type === 'keydown' && event.repeat && event.prevented))
      assert.ok(events.some(event => event.type === 'keyup'))
      frontendKeyboard.push({ key, leaveForOptions, events, lookupAttempts: 2, worldRetained: true })
      const name = `frontend-retry-${key.toLowerCase()}${leaveForOptions ? '-options' : ''}.png`
      await page.screenshot({ path: resolve(output, name) })
      screenshots.push({ name, viewport: page.viewportSize(), dpr: await page.evaluate(() => devicePixelRatio) })
      passed(`frontend Retry preserves keyboard focus through ${key} repeats/release${leaveForOptions ? ' and late Options completion' : ' and successful lookup'}`)
    } finally {
      if (held) await page.keyboard.up(key)
    }
  }
  async function capture(page, name) {
    const viewport = page.viewportSize()
    const controls = await modal(page).getByRole('button').evaluateAll(observeStablePauseControls)
    assert.ok(controls.length > 0, `${name}: no visible modal buttons`)
    for (const box of controls) {
      assert.ok(box.width > 0 && box.height > 0 && box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, `${name}: offscreen button ${box.label}`)
      assert.equal(box.hit, true, `${name}: obstructed button ${box.label}`)
    }
    await page.screenshot({ path: resolve(output, name) })
    screenshots.push({ name, viewport, dpr: await page.evaluate(() => devicePixelRatio) })
  }

  await page.setViewportSize({ width: 800, height: 600 })
  await enterMission(page)
  await button(page, 'Game settings').click()
  await button(page, 'Save Game').click()
  await button(page, 'Save checkpoint').click()
  await modal(page).getByRole('status').filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor()
  const saved = await readCommittedCheckpoint(page)
  assert.ok(saved?.checkpointSha256)
  passed('checkpoint created and persisted by ordinary Save Game UI')
  await button(page, 'Back').click()
  const heldEscape = await checkPauseHeldEscape(page, output)
  passed('native held Escape cancels each subpanel once without resuming; a fresh press resumes')

  await page.addInitScript(coldLookupFailure)
  await frontendRetry('Enter')
  await frontendRetry('Space')
  await frontendRetry('Enter', true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await openFailedLoad(page, true)
  await page.evaluate(() => { window.pauseRecoveryWorld = window.testStore.getWorld() })
  for (const [width, height] of [[640, 480], [1920, 1080], [800, 450]]) {
    await page.setViewportSize({ width, height })
    await capture(page, `failed-load-${width}x${height}.png`)
  }
  const frozen = await snapshot(page)
  await retry(page)
  await capture(page, 'pending-load.png')
  await page.keyboard.press('Escape')
  assert.equal(await focused(page, 'Load Game'), true)
  await button(page, 'Save Game').click()
  assert.equal(await focused(page, 'Back'), true)
  await page.evaluate(() => window.finishPauseLookup())
  await page.waitForFunction(() => window.testStore.getCheckpointReadStatus() === 'read')
  assert.equal(await modal(page).getAttribute('data-panel'), 'save')
  assert.equal(await focused(page, 'Back'), true)
  assert.equal(await snapshot(page), frozen)
  assert.equal(await page.evaluate(() => window.testStore.getWorld() === window.pauseRecoveryWorld), true)
  assert.equal((await readCommittedCheckpoint(page)).checkpointSha256, saved.checkpointSha256)
  passed('retry ignores held/repeated activation, freezes world and clock, and cannot steal focus or navigate from Save')

  await button(page, 'Back').click()
  await button(page, 'Load Game').click()
  assert.equal(await button(page, 'Load checkpoint').isEnabled(), true)
  assert.equal(await button(page, 'Retry checkpoint lookup').count(), 0)
  await page.setViewportSize({ width: 640, height: 480 })
  await capture(page, 'recovered-load-640x480.png')
  // A read-only subscription captures the replacement before a resumed turn.
  await page.evaluate(() => {
    const store = window.testStore, original = store.getWorld()
    const unsubscribe = store.subscribe(() => {
      const world = store.getWorld()
      if (world === original) return
      window.pauseLoadedCheckpoint = { turn: world.turn, time: world.time, level: world.outcome.level, paused: world.paused }
      unsubscribe()
    })
  })
  await button(page, 'Load checkpoint').click()
  await page.waitForFunction(() => !!window.pauseLoadedCheckpoint)
  assert.deepEqual(await page.evaluate(() => window.pauseLoadedCheckpoint), {
    turn: saved.turn, time: saved.time, level: saved.level, paused: false,
  })
  await modal(page).waitFor({ state: 'hidden' })
  passed('only explicit Load checkpoint replaces the world with the persisted checkpoint')
  // Release this scene before opening the independent high-DPI empty-store case.
  await page.close()

  const emptyContext = await browser.newContext({ viewport: { width: 800, height: 450 }, deviceScaleFactor: 2 })
  try {
    await emptyContext.addInitScript(coldLookupFailure)
    const empty = await emptyContext.newPage()
    empty.on('pageerror', error => receipt.errors.push(String(error)))
    empty.on('console', message => {
      if (message.type() === 'error') receipt.errors.push(message.text())
      if (message.type() === 'warning') receipt.warnings.push(message.text())
    })
    empty.setDefaultTimeout(45000)
    for (const finishAtRoot of [false, true]) {
      signal.throwIfAborted()
      await empty.goto(url, { waitUntil: 'domcontentloaded' })
      await openFailedLoad(empty)
      await capture(empty, `empty-failed-dpr2-${finishAtRoot ? 'root' : 'panel'}.png`)
      await retry(empty)
      if (finishAtRoot) {
        await empty.keyboard.press('Escape')
        assert.equal(await focused(empty, 'Load Game'), true)
      }
      await empty.evaluate(() => window.finishPauseLookup())
      await empty.waitForFunction(() => window.testStore.getCheckpointReadStatus() === 'read')
      if (!finishAtRoot) {
        await modal(empty).getByRole('status').filter({ hasText: 'No usable saved checkpoint was found' }).waitFor()
        assert.equal(await focused(empty, 'Back'), true)
        await capture(empty, 'empty-load-dpr2.png')
        await empty.keyboard.press('Escape')
      }
      assert.equal(await button(empty, 'Load Game').isDisabled(), true)
      assert.equal(await focused(empty, 'Continue Game'), true)
      assert.equal(await empty.evaluate(() => window.testStore.getWorld().paused), true)
      await button(empty, 'Continue Game').click()
      assert.equal(await empty.evaluate(() => window.testStore.getWorld().paused), false)
      passed(`empty retry restores usable root focus when completion occurs in ${finishAtRoot ? 'root' : 'Load panel'}`)
    }
  } finally {
    await emptyContext.close()
  }
  return {
    checks, screenshots, saved, renderers, frontendKeyboard, heldEscape,
    limits: [
      'Controlled cold IndexedDB open failure and delayed success delivery; all checkpoint contents, storage transactions, world transitions and UI handlers are real.',
      'Repeated disabled-button clicks are synthetic activation probes; mission entry, saving, retry, Back and loading use rendered controls.',
      'Browser evidence does not establish native save-slot compatibility, exact native pixels or hardware performance.',
    ],
  }
}
