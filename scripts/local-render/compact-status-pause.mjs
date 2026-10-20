import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Ordinary public Mission 1 controls only. No world, DOM, clock or storage injection.
export default async function ({ browser, url, root, output, signal }) {
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { openCampaignFromMainMenu } = await import(pathToFileURL(resolve(root, 'scripts/browser-new-game.mjs')).href)
  const { compactMessageWitness, assertCompactMessageWitness } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/compact-message-layout.mjs')).href)
  const { m2DiagnosticLayout, m2RectanglesOverlap } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/m2-pointer-f8.mjs')).href)
  const report = { checks: [], captures: [], errors: [], scenarioSha256: createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex') }
  const save = () => writeFileSync(resolve(output, 'compact-status-pause.json'), JSON.stringify(report, null, 2))
  const record = (name, observation) => { report.checks.push({ name, observation }); save() }
  try {
    for (const dpr of [1, 2]) {
      const context = await browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: dpr })
      try {
        const page = await context.newPage()
        page.setDefaultTimeout(20000)
        page.on('pageerror', error => { report.errors.push(String(error)); save() })
        const button = name => page.getByRole('button', { name, exact: true })
        const advisory = page.getByRole('button', { name: /^Continue anyway/ })
        const paused = () => page.evaluate(() => window.testStore.getWorld().paused)
        const settle = () => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
        const capture = async name => {
          signal.throwIfAborted()
          const filename = `${name}-dpr${dpr}.png`
          await page.screenshot({ path: resolve(output, filename) })
          report.captures.push({ filename, viewport: page.viewportSize(), dpr }); save()
        }
        const initiallyPaused = dpr === 2
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await openCampaignFromMainMenu(page)
        await button('Start Mission 1').click()
        await bindGame(page)
        await page.getByRole('button', { name: /Skip introduction/ }).click()
        await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
        if (initiallyPaused) await button('Pause game').click()
        await button('Game settings').click()
        await button('Options').click()
        await button('Browser compatibility and help').click()
        await page.setViewportSize({ width: 640, height: 480 })
        assert.equal(await page.locator('[data-original-options]').isVisible(), true)
        assert.equal(await page.evaluate(() => window.testSceneRef.current.modalSuspended), true)
        // A modal above the advisory must retain pointer ownership.
        assert.equal(await advisory.evaluate(el => {
          const r = el.getBoundingClientRect()
          return !!document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.desktop-recommendation')
        }), false)
        await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
        assert.equal(await paused(), initiallyPaused)
        await capture('advisory-before-dismiss')
        await advisory.focus(); await page.keyboard.press('Enter')
        assert.equal(await paused(), initiallyPaused, 'Display advisory must not resume a paused world')
        assert.equal(await advisory.count(), 0)
        await capture('advisory-after-dismiss')
        await page.setViewportSize({ width: 1920, height: 1080 })
        await page.setViewportSize({ width: 640, height: 480 })
        assert.equal(await advisory.count(), 0, 'Resize cannot reopen a dismissed advisory')
        record(`advisory-pause-${initiallyPaused}-dpr${dpr}`, { paused: await paused(), modalSuspended: await page.evaluate(() => window.testSceneRef.current.modalSuspended) })
        if (!initiallyPaused) await button('Pause game').click()
        const turn = await page.evaluate(() => window.testStore.getWorld().turn)
        for (const preference of ['auto', '4']) {
          await page.setViewportSize({ width: 960, height: 720 })
          await button('Game settings').click(); await button('Options').click(); await button('Browser compatibility and help').click()
          await page.getByRole('combobox', { name: 'HUD size', exact: true }).selectOption(preference)
          await button('Back to Options').click(); await button('Back').click(); await button('Continue Game').click()
          assert.equal(await paused(), true)
          for (const [width, height] of [[640, 480], [900, 360], [1920, 1080]]) {
            await page.setViewportSize({ width, height }); await settle()
            const ordinary = await page.evaluate(compactMessageWitness)
            assert.equal(ordinary.worldMessages.length, 1)
            assert.equal(ordinary.campaignText.length, 1)
            const status = ordinary.worldMessages[0], campaign = ordinary.campaignText[0]
            assert.equal(status.fontSize, 12); assert.equal(campaign.fontSize, 12)
            assert.equal(status.contentFits, true); assert.equal(campaign.contentFits, true)
            assert.equal(ordinary.overflow, false)
            for (const text of [status, campaign]) {
              assert.ok(text.fragments.length > 0)
              for (const f of text.fragments)
                assert.ok(f.left >= 0 && f.top >= 0 && f.right <= width && f.bottom <= height, 'Every wrapped text fragment fits the viewport')
            }
            assert.equal(m2RectanglesOverlap(status, campaign), false, 'Ordinary status and campaign text must not overlap')
            assert.equal(m2RectanglesOverlap(status, ordinary.pause), false, 'Status must not cover Resume')
            await capture(`messages-${preference}-${width}x${height}`)
            record(`ordinary-${preference}-${width}x${height}-dpr${dpr}`, ordinary)
            if (width !== 1920) {
              await page.keyboard.press('F8'); await page.locator('.fps-graph').waitFor(); await settle()
              const diagnostic = await page.locator('.fps-graph').evaluate(m2DiagnosticLayout)
              assertCompactMessageWitness(diagnostic, await page.evaluate(compactMessageWitness), width, height)
              await page.keyboard.press('F8'); await page.locator('.fps-graph').waitFor({ state: 'detached' }); await settle()
              assert.deepEqual(await page.evaluate(compactMessageWitness), ordinary, 'F8 off restores ordinary text layout exactly')
            }
          }
        }
        await page.setViewportSize({ width: 640, height: 480 }); await settle()
        const summary = page.getByLabel('Read campaign message').first()
        await summary.focus(); await page.keyboard.press('Enter')
        assert.equal(await page.locator('.campaign-messages details[open]').count(), 0)
        await page.keyboard.press('Enter')
        assert.equal(await page.locator('.campaign-messages details[open]').count(), 1)
        await button('Dismiss campaign message').first().focus(); await page.keyboard.press('Enter')
        assert.equal(await page.locator('.campaign-messages details').count(), 0)
        assert.equal(await paused(), true)
        assert.equal(await page.evaluate(() => window.testStore.getWorld().turn), turn)
        record(`message-reopen-dismiss-frozen-dpr${dpr}`, { turn })
        // Repeated menu close/open and fresh-page current-format checkpoint loading.
        await page.setViewportSize({ width: 960, height: 720 })
        await button('Game settings').click(); await button('Save Game').click(); await button('Save checkpoint').click()
        await page.getByRole('status').filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor()
        await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
        assert.equal(await paused(), true)
        await button('Game settings').click(); await button('Continue Game').click(); assert.equal(await paused(), true)
        await page.reload({ waitUntil: 'domcontentloaded' }); await button('Load Game').click(); await bindGame(page)
        await button('Pause game').click()
        await page.setViewportSize({ width: 640, height: 480 }); await advisory.waitFor()
        await advisory.focus(); await page.keyboard.press('Enter')
        assert.equal(await paused(), true, 'Fresh-load advisory must preserve an explicit pause')
        await capture('fresh-load-paused')
        record(`fresh-load-advisory-dpr${dpr}`, { paused: await paused() })
      } finally { await context.close() }
    }
    assert.deepEqual(report.errors, [])
    report.status = 'passed'
    return report
  } catch (error) { report.status = 'failed'; report.failure = String(error); throw error }
  finally { save() }
}
