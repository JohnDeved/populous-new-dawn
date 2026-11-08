import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { openCampaignFromMainMenu } from './browser-new-game.mjs'

// Controlled stalled artwork and WebGL loss, not a naturally observed outage.
// Use the real React effect, loader, deadline and public retry/mission controls.
export async function checkSelectorRecovery({ browser, url, output }) {
  const context = await browser.newContext({ viewport: { width: 640, height: 480 } })
  let page, releasing = false
  const releases = [], handlers = []
  const releaseHeld = async () => {
    releasing = true
    for (const release of releases.splice(0)) release()
    await Promise.all(handlers)
  }
  let result, failed = false, failure
  const cleanupErrors = []
  try {
    page = await context.newPage()
    page.setDefaultTimeout(15000)
    page.setDefaultNavigationTimeout(30000)
    const errors = [], checks = []
    page.on('pageerror', error => errors.push(String(error)))
    const scene = page.locator('canvas[data-world-scene]')
    const retry = page.getByRole('button', { name: 'Retry scene', exact: true })
    const sun = '**/original/world-selector/globes/sun.png'
    let heldAt, held = 0
    const hold = route => {
      held++
      heldAt ??= performance.now()
      const task = (async () => {
        if (!releasing) await new Promise(resolve => { releases.push(resolve) })
        // The deadline disposes the image request. Do not fulfill canceled bytes.
        await route.abort('failed')
      })()
      handlers.push(task)
      return task
    }
    const ready = () => page.waitForFunction(() =>
      document.querySelector('canvas[data-world-scene]')?.dataset.ready === 'true')
    await page.route(sun, hold)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await openCampaignFromMainMenu(page)
    await scene.waitFor()
    await retry.waitFor({ state: 'visible', timeout: 15000 })
    assert.ok(held > 0, 'Real optional sun-image request was held')
    const pendingMilliseconds = performance.now() - heldAt
    assert.ok(pendingMilliseconds <= 15000, 'Deadline fallback must remain bounded')
    assert.ok(pendingMilliseconds >= 9000, 'Fallback must follow the real deadline, not an immediate unrelated load error')
    assert.equal(await scene.getAttribute('data-ready'), null)
    assert.equal(await scene.evaluate(canvas => getComputedStyle(canvas).visibility), 'hidden')
    await page.getByRole('button', { name: 'Panel Mission 2', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Start Mission 2', exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: 'Panel Mission 1', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Start Mission 1', exact: true }).isEnabled(), true)
    assert.equal(await page.locator('.world-viewport canvas').count(), 0)
    await page.screenshot({ path: resolve(output, 'selector-artwork-timeout.png') })
    checks.push('held artwork reaches actual 10-second fallback; locked/unlocked mission inspection remains usable')
    await releaseHeld()
    await page.unrouteAll({ behavior: 'wait' })
    await retry.click()
    await ready()
    assert.equal(await retry.count(), 0)
    assert.equal(await scene.evaluate(canvas => getComputedStyle(canvas).visibility), 'visible')
    await page.screenshot({ path: resolve(output, 'selector-artwork-retry-ready.png') })
    checks.push('public Retry creates a ready visible scene after request release')

    const generation = Number(await scene.getAttribute('data-generation'))
    const extension = await scene.evaluateHandle(canvas => {
      const extension = canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')
      if (!extension) throw Error('WEBGL_lose_context unavailable')
      extension.loseContext()
      return extension
    })
    let extensionFailed = false
    try {
      await retry.waitFor({ state: 'visible' })
      assert.equal(await scene.getAttribute('data-ready'), null)
      assert.equal(await scene.evaluate(canvas => getComputedStyle(canvas).visibility), 'hidden')
      await page.screenshot({ path: resolve(output, 'selector-context-lost.png') })
      await extension.evaluate(extension => extension.restoreContext())
      await ready()
      assert.ok(Number(await scene.getAttribute('data-generation')) > generation)
      assert.equal(await retry.count(), 0)
      assert.equal(await scene.evaluate(canvas => getComputedStyle(canvas).visibility), 'visible')
      await page.screenshot({ path: resolve(output, 'selector-context-restored.png') })
      checks.push('actual WebGL loss presents fallback; context restoration recreates the React-owned renderer/effect')
    } catch (error) {
      extensionFailed = true
      throw error
    } finally {
      try { await extension.dispose() }
      catch (error) {
        if (extensionFailed) cleanupErrors.push(error)
        else throw error
      }
    }
    await page.keyboard.press('Escape')
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
    await openCampaignFromMainMenu(page)
    await ready()
    assert.equal(await retry.count(), 0)
    assert.equal(await page.locator('.world-viewport canvas').count(), 0)
    assert.deepEqual(errors, [])
    checks.push('Escape and public New Game reopen a healthy selector without launching gameplay')
    result = { status: 'passed', heldRequests: held, pendingMilliseconds, checks,
      limits: ['Controlled network stall and WEBGL_lose_context fixture', 'Software browser evidence; not hardware performance or native-game timing'] }
  } catch (error) {
    failed = true
    failure = error
    throw error
  } finally {
    try {
      await releaseHeld()
      await page?.unrouteAll({ behavior: 'wait' })
    } catch (error) { cleanupErrors.push(error) }
    try { await context.close() }
    catch (error) { cleanupErrors.push(error) }
    if (cleanupErrors.length) {
      if (failed) throw new AggregateError([failure, ...cleanupErrors],
        'Selector recovery failed; cleanup also failed', { cause: failure })
      if (cleanupErrors.length === 1) throw cleanupErrors[0]
      throw new AggregateError(cleanupErrors, 'Selector recovery cleanup failed', { cause: cleanupErrors[0] })
    }
  }
  writeFileSync(resolve(output, 'selector-recovery.json'), JSON.stringify(result, null, 2) + '\n')
  return result
}
