import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'

// Hosted runner owns production navigation, Chrome sandbox, deadline and output
// caps. This case creates no browser/server and does not mutate storage/game state.
export default async function quitWarningCase({ page, context, url, output, servingDescription }) {
  const viewport = page.viewportSize()
  assert.ok(viewport && ((viewport.width === 640 && viewport.height === 480) || (viewport.width === 1920 && viewport.height === 1080)), 'runner supplies compact or wide case viewport')
  assert.equal(page.context(), context)
  const report = { status: 'running', viewport, servingDescription, phases: [], errors: [], limits: ['Browser adaptation typography, not native runtime pixel parity.', 'No checkpoint writes or successful-persistence claim.'] }
  const save = () => writeFileSync(resolve(output, 'quit-warning.json'), JSON.stringify(report, null, 2) + '\n')
  const phase = name => { report.phases.push(name); save() }
  const capture = async name => {
    const png = await page.screenshot({ type: 'png', fullPage: false })
    assert.ok(png.length <= 8 * 1024 * 1024, 'bounded viewport PNG')
    writeFileSync(resolve(output, name), png)
  }
  const onError = error => { report.errors.push(String(error)); save() }
  page.on('pageerror', onError)
  const main = page.getByRole('dialog', { name: 'Main menu', exact: true })
  const button = name => main.getByRole('button', { name, exact: true })
  const panel = page.locator('[data-original-quit-menu]')
  try {
    const { width, height } = viewport
    phase('navigate')
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    phase('open-quit')
    await button('Quit').click()
    await panel.waitFor()
    await page.waitForFunction(() => document.querySelector('#frontend-quit-guidance i')?.style.backgroundImage.includes('felo33we'))
    assert.equal(await button('Yes').isDisabled(), true)
    assert.equal(await panel.getAttribute('aria-describedby'), 'frontend-quit-guidance')
    const description = (await page.locator('#frontend-quit-guidance').textContent()).replace(/\s+/g, ' ').trim()
    assert.equal(description, 'Yes is unavailable in this browser. Close this browser tab to quit. Unsaved progress will be lost. Only checkpoints successfully saved to browser storage will remain after closing it.')
    const geometry = await panel.evaluate(element => {
      const frame = element.parentElement.getBoundingClientRect()
      const scale = frame.width / 640
      const guide = element.querySelector('#frontend-quit-guidance')
      const lines = [...guide.children].filter(line => line.getAttribute('aria-hidden') === 'true')
      return lines.map(line => {
        const text = line.querySelector('span'), bounds = text.getBoundingClientRect()
        return { x: (bounds.x - frame.x) / scale, y: (bounds.y - frame.y) / scale,
          width: bounds.width / scale, height: bounds.height / scale,
          fonts: [...text.querySelectorAll('i')].map(glyph => glyph.style.backgroundImage) }
      })
    })
    assert.equal(geometry.length, 2)
    for (const [index, line] of geometry.entries()) {
      const expectedWidth = [464, 442][index]
      assert.ok(Math.abs(line.width - expectedWidth) < 0.1)
      assert.ok(Math.abs(line.x - (640 - expectedWidth) / 2) < 0.1)
      assert.ok(Math.abs(line.y - (278 + 30 * index)) < 0.1)
      assert.ok(line.height <= 30 && line.fonts.length > 20)
      assert.ok(line.fonts.every(font => font.includes('felo33we.png')))
    }
    report.description = description
    report.geometry = geometry
    phase('warning-verified')
    await capture(`quit-native-warning-${width}x${height}.png`)
    phase('no-return')
    await button('No').click()
    assert.equal(await button('Quit').evaluate(element => element === document.activeElement), true)
    await button('Quit').click()
    await panel.waitFor()
    phase('back-return')
    await button('Back').click()
    assert.equal(await button('Quit').evaluate(element => element === document.activeElement), true)
    await button('Quit').click()
    await panel.waitFor()
    assert.equal(await button('Yes').isDisabled(), true)
    phase('escape-return')
    await page.keyboard.press('Escape')
    await button('Quit').waitFor()
    assert.equal(await button('Quit').evaluate(element => element === document.activeElement), true)
    assert.deepEqual(report.errors, [])
    report.status = 'passed'
    phase('complete')
    return report
  } catch (error) {
    report.status = 'failed'
    report.error = String(error.stack ?? error)
    save()
    try { await capture('quit-warning-failure.png') } catch (captureError) { report.captureError = String(captureError); save() }
    throw error
  } finally {
    page.off('pageerror', onError)
  }
}

