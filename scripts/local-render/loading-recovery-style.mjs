import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { observeFullscreenClearance, assertFullscreenClearance } from './fullscreen-clearance.mjs'

export async function finishLoadingRecovery({ primaryError, report, gates, fallback, save }) {
  const failures = []
  const failed = error => {
    failures.push(error)
    report.status = 'failed'
    report.cleanupErrors = failures.map(String)
  }
  for (const release of gates.splice(0)) {
    try { release() } catch (error) { failed(error) }
  }
  try { if (fallback) await fallback.close() } catch (error) { failed(error) }
  try { save() } catch (error) { failed(error) }
  if (failures.length) {
    const cleanupError = new AggregateError(failures, 'Loading recovery cleanup or report persistence failed')
    if (primaryError) primaryError.cleanupError = cleanupError
    else throw cleanupError
  }
}

// Actual Home and real loader failures. Only landscape responses and, in the
// separate sequential fallback contexts, frontend font availability are controlled. No world,
// store, error-prop, save or React state is injected. This is not a ready-scene test.
export default async function ({ page, browser, url, output }) {
  const report = { status: 'running', captures: [], fullscreenGeometry: [], requests: [], fontCases: [], errors: [] }
  const save = () => writeFileSync(resolve(output, 'loading-recovery-style.json'), JSON.stringify(report, null, 2) + '\n')
  const button = p => p.getByRole('button', { name: 'Try again', exact: true })
  const failed = p => p.getByRole('dialog', { name: 'Browser loading recovery', exact: true })
  const waitFailed = async p => {
    await p.getByRole('heading', { name: 'Loading failed', exact: true }).waitFor()
    assert.equal(await button(p).evaluate(node => node === document.activeElement), true)
  }
  const startTutorial = async p => {
    await waitForStartupMenu(p)
    await p.getByRole('button', { name: 'New Game', exact: true }).click()
    await p.getByRole('button', { name: 'Yes', exact: true }).click()
  }
  const capture = async (p, name) => {
    const geometry = await observeFullscreenClearance(p, 'body', '.loading-original-art,.loading-original-label,.loading-recovery,.loading-recovery button,.loading-recovery summary,.loading-recovery-note,.loading-recovery details[open] .loading-recovery-error')
    report.fullscreenGeometry.push({name,geometry}); save()
    assertFullscreenClearance(geometry)
    await p.screenshot({ path: resolve(output, `${name}.png`) })
    report.captures.push({ name, viewport: p.viewportSize() })
    save()
  }
  const assertHit = async locator => {
    await locator.scrollIntoViewIfNeeded()
    assert.equal(await locator.evaluate(node => {
      const box = node.getBoundingClientRect()
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return box.x >= 0 && box.y >= 0 && box.right <= innerWidth && box.bottom <= innerHeight && node.contains(hit)
    }), true, 'Recovery control must remain reachable and the actual hit target')
  }
  const assertFont = async (locator, name) => {
    const images = await locator.locator('.loading-recovery-word i').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundImage))
    assert.ok(images.length > 0)
    assert.ok(images.every(image => image.endsWith(`/original/frontend/${name}.png")`)), `Expected original ${name} artwork`)
  }
  const gates = []
  let fallback, primaryError
  page.on('pageerror', error => report.errors.push(String(error)))
  try {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.route('**/original/landscape.bin', async route => {
      report.requests.push(route.request().url())
      await new Promise(resolve => gates.push(resolve))
      await route.abort('failed')
    })
    const failHeld = async () => {
      await page.waitForFunction(() => document.querySelector('[data-loading-phase="loading"]'))
      const deadline = Date.now() + 10000
      while (!gates.length && Date.now() < deadline) await page.waitForTimeout(20)
      assert.equal(gates.length, 1)
      gates.shift()()
      await waitFailed(page)
    }
    await startTutorial(page)
    await page.locator('[data-loading-phase="loading"]').waitFor()
    assert.equal(await button(page).count(), 0, 'Pending phase must not expose recovery controls')
    const mask = await page.locator('.loading-original-art').boundingBox()
    assert.deepEqual([mask.x, mask.y, mask.width, mask.height], [575, 319, 130, 161])
    await capture(page, 'pending-1280x800')
    await failHeld()
    await failed(page).locator('.loading-recovery-text').first().waitFor()
    assert.equal(await button(page).locator('.loading-recovery-text').evaluate(node => node.getBoundingClientRect().width), 134)
    await assertFont(failed(page).locator('h2'), 'felo33we')
    await assertFont(failed(page).locator(':scope > section > p').first(), 'felo33we')
    await assertFont(failed(page).locator('.loading-recovery-note'), 'felo33we')
    await page.mouse.move(1, 1)
    await page.keyboard.press('Tab')
    const summary = failed(page).locator('summary')
    assert.equal(await summary.evaluate(node => node === document.activeElement), true)
    await assertFont(summary, 'fehi33we')
    await assertFont(button(page), 'felo33we')
    await page.keyboard.press('Shift+Tab')
    await assertFont(button(page), 'fehi33we')
    await assertFont(summary, 'felo33we')
    await summary.hover()
    await assertFont(summary, 'fehi33we')
    await page.keyboard.press('Tab')
    await button(page).hover()
    await assertFont(button(page), 'fehi33we')
    assert.equal(await button(page).locator('.loading-recovery-text').evaluate(node => node.getBoundingClientRect().width), 134)
    await page.mouse.move(1, 1)
    await assertFont(button(page), 'felo33we')
    await capture(page, 'native-recovery-1280x800')
    for (const [width, height] of [[640, 480], [900, 360], [320, 240]]) {
      await page.setViewportSize({ width, height })
      await assertHit(button(page))
      await capture(page, `native-recovery-${width}x${height}`)
      const summary = failed(page).locator('summary')
      await summary.click()
      const diagnostics = failed(page).locator('.loading-recovery-error')
      assert.ok((await diagnostics.innerText()).length > 0)
      assert.equal(await diagnostics.evaluate(node => node.scrollWidth <= node.clientWidth), true)
      await diagnostics.scrollIntoViewIfNeeded()
      await capture(page, `native-details-${width}x${height}`)
      await assertHit(button(page))
      if (width === 320) {
        await failed(page).locator('.loading-recovery-note').scrollIntoViewIfNeeded()
        await capture(page, 'native-footer-scrolled-320x240')
      }
      await summary.click()
    }
    await page.setViewportSize({ width: 640, height: 480 })
    await button(page).focus()
    await page.keyboard.press('Tab')
    assert.equal(await failed(page).locator('summary').evaluate(node => node === document.activeElement), true)
    await page.keyboard.press('Shift+Tab')
    assert.equal(await button(page).evaluate(node => node === document.activeElement), true)
    await page.keyboard.down('Enter')
    await failHeld()
    for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down('Enter')
    assert.equal(report.requests.length, 2, 'Held Enter must not retry the replacement failure')
    await page.keyboard.up('Enter')
    await page.keyboard.press('Enter')
    await page.locator('[data-loading-phase="loading"]').waitFor()
    await page.keyboard.down('Space')
    await failHeld()
    for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down('Space')
    await page.keyboard.up('Space')
    assert.equal(report.requests.length, 3, 'Unowned Space release must not retry the replacement failure')
    assert.equal(await failed(page).count(), 1)
    assert.equal(new Set(report.requests).size, 1, 'Retries must retain the same real landscape request')
    await capture(page, 'native-recovery-held-input')

    for (const blockedFont of ['felo33we', 'fehi33we', 'feft33we']) {
      fallback = await browser.newContext({ viewport: { width: 320, height: 240 } })
      const p = await fallback.newPage()
      const aborted = []
      p.on('pageerror', error => report.errors.push(String(error)))
      await p.route(`**/original/frontend/${blockedFont}.png`, async route => {
        aborted.push(route.request().url())
        await route.abort('failed')
      })
      await p.route('**/original/landscape.bin', route => route.abort('failed'))
      await p.goto(url, { waitUntil: 'domcontentloaded' })
      await startTutorial(p)
      await waitFailed(p)
      assert.ok(aborted.length > 0, 'The specified font request must actually fail')
      if (blockedFont === 'feft33we') {
        await failed(p).locator('.loading-recovery-text').first().waitFor()
        assert.equal(await failed(p).locator('.loading-recovery-fallback').count(), 0, 'Unused dark font cannot block recovery artwork')
        await assertFont(failed(p).locator('h2'), 'felo33we')
        await p.keyboard.press('Tab')
        await p.keyboard.press('Shift+Tab')
        await assertFont(button(p), 'fehi33we')
      } else {
        assert.equal(await failed(p).locator('.loading-recovery-text').count(), 0)
        assert.equal(await failed(p).locator('.loading-recovery-fallback').count(), 5)
        assert.equal(await button(p).innerText(), 'Try again')
        assert.equal(await button(p).evaluate(node => getComputedStyle(node).color), 'rgb(255, 241, 187)')
      }
      await assertHit(button(p))
      if (blockedFont === 'felo33we') await capture(p, 'recovery-font-fallback-320x240')
      await failed(p).locator('summary').click()
      assert.ok((await failed(p).locator('.loading-recovery-error').innerText()).length > 0)
      await assertHit(button(p))
      if (blockedFont === 'felo33we') await capture(p, 'recovery-font-fallback-details-320x240')
      report.fontCases.push({ blockedFont, aborted, bitmap: blockedFont === 'feft33we' }); save()
      await fallback.close()
      fallback = undefined
    }
    assert.deepEqual(report.errors, [])
    report.status = 'passed'
    report.limits = ['Controlled loader failures and font availability; no native failure-dialog claim', 'Loading retains its existing summary/Retry keyboard trap; fullscreen placement does not change focus ownership', 'No completed scene or full checkpoint continuation proof', 'No hardware performance or pixel-parity claim']
    return report
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    primaryError = error instanceof Error ? error : new Error(String(error))
    throw primaryError
  } finally {
    await finishLoadingRecovery({ primaryError, report, gates, fallback, save })
  }
}
