// Diagnostic-only public UI observer. The hosted runner owns browser/context/time bounds.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'

const badges = [
  { name: 'bullfrog', x: 4, y: 386, width: 75, height: 91 },
  { name: 'qsound', x: 568, y: 415, width: 69, height: 62 },
]
export default async function badgeSampling({ page, context, url, output, sourceCommit, expectedOverlay }) {
  assert.match(sourceCommit, /^[a-f0-9]{40}$/)
  assert.equal(typeof expectedOverlay, 'boolean')
  const report = { status: 'running', sourceCommit, expectedOverlay, states: [], errors: [] }
  const save = () => writeFileSync(resolve(output, 'badge-sampling.json'), JSON.stringify(report, null, 2))
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  page.setDefaultTimeout(6000); page.setDefaultNavigationTimeout(15000)
  page.on('pageerror', error => report.errors.push(String(error)))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  save()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const main = page.getByRole('dialog', { name: 'Main menu', exact: true })
    await main.waitFor()
    const frame = main.locator(':scope > div').first()
    const background = frame.locator(':scope > canvas').first()
    const overlays = main.locator('[data-frontend-badge]')
    assert.equal(await overlays.count(), expectedOverlay ? 2 : 0)
    assert.equal(await background.evaluate(el => getComputedStyle(el).imageRendering), 'auto')
    const viewport = page.viewportSize()
    const capture = async label => {
      await settle()
      const dimensions = page.viewportSize()
      const rect = await frame.boundingBox()
      const scale = Math.min(dimensions.width / 640, dimensions.height / 480)
      assert.ok(Math.abs(rect.width - 640 * scale) < .1)
      assert.ok(Math.abs(rect.height - 480 * scale) < .1)
      const record = { label, viewport: dimensions, dpr: await page.evaluate(() => devicePixelRatio),
        frame: rect, badges: [], buttons: await main.locator('nav button').evaluateAll(elements => elements.map(el => {
          const r = el.getBoundingClientRect(); return { name: el.getAttribute('aria-label'), x: r.x, y: r.y, width: r.width, height: r.height }
        })) }
      for (const badge of badges) {
        // Add two native pixels around the guard to expose any join or halo.
        const clip = { x: rect.x + (badge.x - 2) * scale, y: rect.y + (badge.y - 2) * scale,
          width: (badge.width + 4) * scale, height: (badge.height + 4) * scale }
        await page.screenshot({ path: resolve(output, `${label}-${badge.name}.png`), clip, timeout: 3000 })
        const pixels = await background.evaluate((canvas, badge) => {
          const offset = (canvas.width - 640) / 2
          return Array.from(canvas.getContext('2d').getImageData(badge.x + offset, badge.y, badge.width, badge.height).data)
        }, badge)
        const entry = { name: badge.name, clip, backgroundPixels: pixels }
        if (expectedOverlay) {
          const overlay = main.locator(`[data-frontend-badge="${badge.name}"]`)
          const bounds = await overlay.boundingBox()
          for (const key of ['x', 'y', 'width', 'height']) {
            const expected = key === 'x' ? rect.x + badge.x * scale : key === 'y' ? rect.y + badge.y * scale : badge[key] * scale
            assert.ok(Math.abs(bounds[key] - expected) < .1, `${badge.name} ${key} matches native frame`)
          }
          const info = await overlay.evaluate(canvas => ({ width: canvas.width, height: canvas.height,
            sampling: getComputedStyle(canvas).imageRendering,
            pixels: Array.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data) }))
          assert.equal(info.sampling, 'crisp-edges')
          assert.equal(info.width, badge.width); assert.equal(info.height, badge.height)
          let copied = 0, transparent = 0
          for (let at = 0; at < info.pixels.length; at += 4) {
            if (info.pixels[at + 3] === 255) {
              assert.deepEqual(info.pixels.slice(at, at + 4), pixels.slice(at, at + 4), 'live overlay copies same composed RGBA')
              copied++
            } else { assert.equal(info.pixels[at + 3], 0); transparent++ }
          }
          assert.ok(copied > 0 && transparent > 0)
          entry.overlay = { bounds, sampling: info.sampling, copied, transparent }
        }
        record.badges.push(entry)
      }
      report.states.push(record); save(); return record
    }
    await page.mouse.move(viewport.width / 2, viewport.height / 2)
    await page.keyboard.press('Tab')
    const staticState = await capture('static')
    const frameBounds = await frame.boundingBox(), scale = frameBounds.width / 640
    for (const [index, badge] of badges.entries()) {
      await page.mouse.move(frameBounds.x + (badge.x + 25) * scale, frameBounds.y + (badge.y + 25) * scale)
      const lit = await capture(`glow-${badge.name}`)
      assert.notDeepEqual(lit.badges[index].backgroundPixels, staticState.badges[index].backgroundPixels, 'pointer glow crosses original badge')
      assert.deepEqual(lit.buttons, staticState.buttons, 'pointer glow does not move hit targets')
    }
    await page.setViewportSize({ width: viewport.width - 137, height: viewport.height - 83 })
    await page.keyboard.press('Tab')
    await capture('resized')
    await page.setViewportSize(viewport)
    await main.getByRole('button', { name: 'Options', exact: true }).click()
    await main.locator('[data-original-options]').waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await main.getByRole('button', { name: 'Options', exact: true }).evaluate(el => el === document.activeElement), true)
    assert.deepEqual(report.errors, [])
    report.status = 'passed'; report.limits = ['Actual source build; no CSS replacement or asset substitution.',
      'Reduced-motion context keeps glow at its first frame; actual pointer crossings still redraw the live composition.',
      'Crops and DOM geometry are viewport-specific visual evidence, not hardware-performance proof.']
    save(); return { status: 'passed', states: report.states.length, limits: report.limits }
  } catch (error) { report.status = 'failed'; report.error = String(error.stack); save(); throw error }
}
