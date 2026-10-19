// Diagnostic-only: CSS interventions are labeled comparisons, not baseline-commit captures.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'

export default async function bitmapSampling({ page, context, url, output, expectedSampling, sourceCommit, skin = 'frontend' }) {
  assert.match(sourceCommit, /^[a-f0-9]{40}$/)
  assert.ok(['auto', 'crisp-edges'].includes(expectedSampling))
  assert.ok(['frontend', 'ingame'].includes(skin))
  const records = []
  const report = { status: 'running', sourceCommit, expectedSampling, skin, records }
  const save = () => writeFileSync(resolve(output, 'bitmap-sampling.json'), JSON.stringify(report, null, 2))
  save()
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  const { width, height } = page.viewportSize()
  page.setDefaultTimeout(6000); page.setDefaultNavigationTimeout(15000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  try {
    const dpr = await page.evaluate(() => devicePixelRatio)
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      const main = page.getByRole('dialog', { name: 'Main menu', exact: true })
      await main.waitFor()
      const button = name => main.getByRole('button', { name, exact: true })
      const prefix = `${width}x${height}-dpr${dpr}`
      const capture = async (state, scope, logo = null) => {
        await page.keyboard.press('Tab') // Stops the glow; focus is identical across sampling interventions.
        await page.mouse.move(-5, -5)
        const selector = '[data-original-main-menu] i, [data-original-main-menu] h1 span, [data-original-pause-menu] i'
        const bounds = async () => scope.locator('button').evaluateAll(elements => elements.map(el => {
          const r = el.getBoundingClientRect(); return { label: el.getAttribute('aria-label') ?? el.textContent,
            x: r.x, y: r.y, width: r.width, height: r.height }
        }))
        const originalBounds = await bounds()
        for (const sampling of ['source', 'pixelated']) {
          const style = sampling === 'source' ? null : await page.addStyleTag({ content: `${selector} { image-rendering: ${sampling} !important; }` })
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          const computed = await scope.locator('i').evaluateAll(elements => [...new Set(elements.map(el => getComputedStyle(el).imageRendering))])
          assert.ok(computed.length, `${state}: original bitmap glyphs must be loaded`)
          assert.deepEqual(computed, [sampling === 'source' ? expectedSampling : sampling])
          const logoSampling = logo ? await logo.evaluate(el => getComputedStyle(el).imageRendering) : null
          if (logo) assert.equal(logoSampling, sampling === 'source' ? expectedSampling : sampling)
          assert.deepEqual(await bounds(), originalBounds, 'sampling must not move hit targets')
          const filename = `${prefix}-${state}-${sampling}`
          if (sampling === 'source')
            await page.screenshot({ timeout: 3000, path: resolve(output, `${filename}.png`) })
          const glyphs = scope.locator('i').first().locator('..')
          await glyphs.screenshot({ timeout: 3000, path: resolve(output, `${filename}-text.png`) })
          if (logo) await logo.screenshot({ timeout: 3000, path: resolve(output, `${filename}-logo.png`) })
          records.push({ width, height, dpr, state, sampling, computed, logoSampling, originalBounds,
            comparison: sampling === 'source' ? 'unaltered source CSS' : 'diagnostic CSS override, not a baseline source build',
            environment: await page.evaluate(() => ({ dpr: devicePixelRatio, width: innerWidth, height: innerHeight,
              crispEdgesSupported: CSS.supports('image-rendering', 'crisp-edges'), userAgent: navigator.userAgent })) })
          save()
          if (style) await style.evaluate(el => el.remove())
        }
      }
      if (skin === 'frontend') {
      await button('Options').focus()
      await capture('main', main, main.locator('h1 span'))
      await button('Options').click()
      const options = main.locator('[data-original-options]')
      await options.waitFor()
      for (const category of ['Game', 'Sound', 'Graphics']) {
        if (await options.getAttribute('data-category') !== category) await button(category).click()
        assert.equal(await options.getAttribute('data-category'), category)
        await capture(`options-${category.toLowerCase()}`, options)
      }
      await button('Back').click()
      await button('Quit').click()
      await capture('quit', main)
      await button('Back').click()
      assert.equal(await button('Quit').evaluate(el => el === document.activeElement), true)
      assert.equal(await page.locator('.world-viewport canvas:visible').count(), 0)
      // One bounded ordinary gameplay entry checks the shared pause-font owner too.
      } else {
        await button('Tutorial').click()
        await page.locator('canvas.battlefield').waitFor({ state: 'visible', timeout: 30000 })
        await page.locator('.loading-world').waitFor({ state: 'hidden', timeout: 30000 })
        await page.getByRole('button', { name: 'Game settings', exact: true }).click()
        const pause = page.getByRole('dialog', { name: 'Game menu', exact: true })
        await pause.waitFor()
        await capture('pause', pause)
        await pause.getByRole('button', { name: 'Options', exact: true }).click()
        await capture('options-ingame', pause.locator('[data-original-options]'))
        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
        await pause.waitFor({ state: 'hidden' })
      }
      // Actual pointer clicks and keyboard dismissal above check ordinary hit geometry.
    assert.deepEqual(errors, [], 'no browser page errors')
    report.status = 'passed'
    report.limits = [
      'Pixelated variants are diagnostic CSS interventions. Source captures use the exact sourceCommit without overrides.',
      'Screenshots are browser/viewport rendering evidence, not higher-resolution assets or hardware-performance proof.',
    ]
    save()
    return { status: 'passed', checks: records.length, limits: report.limits }
  } catch (error) {
    report.status = 'failed'
    report.error = String(error.stack)
    save()
    throw error
  }
}

export const pauseSampling = args => bitmapSampling({ ...args, skin: 'ingame' })
