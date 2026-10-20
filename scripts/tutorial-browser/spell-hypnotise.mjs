// Prepared, not yet wired into a hosted lane or fixture entry.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { installHypnotiseObserver, validateHypnotiseObservation,
  hypnotiseLimitMs, hypnotiseObservationMs } from './hypnotise-observer.mjs'

export default async function spellHypnotise({ browser, url, output }) {
  const started = performance.now(), context = await browser.newContext({
    viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 }),
    report = { status: 'running', capMs: hypnotiseLimitMs, errors: [], limits: [
      'Public Mission22 access, not campaign unlock proof.',
      'Accelerated ordinary simulation preparation with existing mana-focus adapter, not real-time earned gameplay.',
      'No stock, actors, callbacks, animation fields or rendered pixels are supplied.',
      'Public pre-cast checkpoint save/load; in-progress effect continuation is covered separately by CPU tests.',
      'Actual production Home through Vite, not deployed Vinext/Cloudflare hosting.',
      'Real same-frame canvas crops; no original framebuffer or hardware-performance equivalence claim.',
      'Display callbacks may skip frames; exhaustive16-frame coverage remains in source/CPU oracle.' ] }
  let page, failure
  const save = () => writeFileSync(resolve(output, 'spell-hypnotise.json'), JSON.stringify(report, null, 2) + '\n')
  const timer = setTimeout(() => { report.timedOut = true; void context.close().catch(() => {}) }, hypnotiseLimitMs)
  const retain = async () => {
    if (!page || page.isClosed() || report.observation) return
    report.observation = await page.evaluate(() => window.__pndHypnotiseObservation?.retain() ?? null)
    if (!report.observation) return
    for (const crop of report.observation.crops) {
      if (!crop.png) continue
      assert.match(crop.filename, /^spell-hypnotise-frame-(?:[0-9]|1[0-5])\.png$/)
      const bytes = Buffer.from(crop.png.split(',')[1], 'base64')
      writeFileSync(resolve(output, crop.filename), bytes, { flag: 'wx' })
      crop.sha256 = createHash('sha256').update(bytes).digest('hex')
      delete crop.png
    }
    save()
  }
  try {
    page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror', e => report.errors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
    page.on('crash', () => report.errors.push('Page crashed'))
    const button = name => page.getByRole('button', { name, exact: true })
    await page.goto(`${url}/?hypnotise-fixture=1`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => Object.isFrozen(window.__pndHypnotiseFixture) &&
      typeof window.__pndHypnotiseFixture?.prepareEarnedHypnotise === 'function')
    await showAllMissions(page)
    await button('Mission 22').click()
    await bindGame(page)
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask || document.querySelector('.skip-introduction'))
    if (await page.locator('.skip-introduction').isVisible()) await page.locator('.skip-introduction').click()
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await button('Pause game').click()
    report.preparation = await page.evaluate(() =>
      window.__pndHypnotiseFixture.prepareEarnedHypnotise(window.testSceneRef.current))
    assert.equal(report.preparation.stock, 1)
    const saved = await page.evaluate(() => {
      window.__hypnotiseBeforeLoad = window.testStore.getWorld()
      const w = window.testStore.getWorld()
      return { turn: w.turn, stock: w.shots.hypnotise, randomState: w.randomState, paused: w.paused }
    })
    await button('Menu').click()
    await button('Save Game').click()
    await button('Save checkpoint').click()
    await page.getByText('Checkpoint saved in this browser.', { exact: true }).waitFor()
    await button('Back').click()
    await button('Load Game').click()
    await button('Load checkpoint').click()
    await bindGame(page)
    report.checkpoint = await page.evaluate(() => {
      const w = window.testStore.getWorld(), scene = window.testSceneRef.current
      if (w === window.__hypnotiseBeforeLoad || scene.world !== w) throw Error('Public load did not replace and bind the world')
      scene.focus(window.__pndHypnotiseFixture.hypnotiseTarget)
      return { turn: w.turn, stock: w.shots.hypnotise, randomState: w.randomState, paused: w.paused }
    })
    assert.deepEqual(report.checkpoint, saved)
    await page.getByRole('button', { name: 'Hypnotise, 1 shots', exact: true }).click()
    const target = await page.evaluate(() => {
      const scene = window.testSceneRef.current, canvas = scene.renderer.domElement,
        p = scene.screen(window.__pndHypnotiseFixture.hypnotiseTarget), r = canvas.getBoundingClientRect(),
        x = r.left + (p.x + 1) * r.width / 2, y = r.top + (1 - p.y) * r.height / 2
      if (document.elementFromPoint(x, y) !== canvas) throw Error('Actual cast point is covered by UI')
      return { x, y }
    })
    await button('Resume game').click()
    await page.evaluate(installHypnotiseObserver, { observationMs: hypnotiseObservationMs })
    await page.mouse.click(target.x, target.y)
    await page.waitForFunction(() => window.__pndHypnotiseObservation.result.done, null,
      { timeout: hypnotiseObservationMs + 1000, polling: 25 })
    await retain()
    const atlas = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../app/original-effects.json'), 'utf8'))
    validateHypnotiseObservation(report.observation, atlas)
    assert.deepEqual(report.errors, [])
  } catch (error) {
    failure = error
    report.failure = String(error)
    report.stack = error.stack
    try { await retain() } catch (e) { report.retainFailure = String(e) }
  } finally {
    try { await context.close(); report.contextClosed = true }
    catch (e) { report.cleanupFailure = String(e); failure ??= e }
    clearTimeout(timer)
    report.elapsedMs = performance.now() - started
    if (report.timedOut || report.elapsedMs > hypnotiseLimitMs) failure ??= Error('Hypnotise exceeded its75s allowance')
    report.status = failure ? 'failed' : 'passed'
    save()
  }
  if (failure) throw failure
  return report
}
