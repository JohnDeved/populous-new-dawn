import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { observeFullscreenClearance, assertFullscreenClearance } from './fullscreen-clearance.mjs'

// Actual Home and real loader failures. Only landscape responses and, in the
// separate fallback context, frontend font availability are controlled. No world,
// store, error-prop, save or React state is injected. This is not a ready-scene test.
export default async function ({ page, browser, url, output }) {
  const report = { status: 'running', captures: [], fullscreenGeometry: [], requests: [], errors: [] }
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
  const gates = []
  let fallback
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

    fallback = await browser.newContext({ viewport: { width: 320, height: 240 } })
    const p = await fallback.newPage()
    p.on('pageerror', error => report.errors.push(String(error)))
    await p.route('**/original/frontend/fe*33we.png', route => route.abort('failed'))
    await p.route('**/original/landscape.bin', route => route.abort('failed'))
    await p.goto(url, { waitUntil: 'domcontentloaded' })
    await startTutorial(p)
    await waitFailed(p)
    assert.equal(await failed(p).locator('.loading-recovery-text').count(), 0)
    assert.equal(await button(p).innerText(), 'Try again')
    await assertHit(button(p))
    await capture(p, 'recovery-font-fallback-320x240')
    await failed(p).locator('summary').click()
    assert.ok((await failed(p).locator('.loading-recovery-error').innerText()).length > 0)
    await assertHit(button(p))
    await capture(p, 'recovery-font-fallback-details-320x240')
    assert.deepEqual(report.errors, [])
    report.status = 'passed'
    report.limits = ['Controlled loader failures and font availability; no native failure-dialog claim', 'Loading retains its existing summary/Retry keyboard trap; fullscreen placement does not change focus ownership', 'No completed scene or full checkpoint continuation proof', 'No hardware performance or pixel-parity claim']
    return report
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    throw error
  } finally {
    for (const release of gates.splice(0)) release()
    if (fallback) await fallback.close()
    save()
  }
}
