import assert from 'node:assert/strict'
import { resolve } from 'node:path'

const pickingPathCounterIds = Object.freeze(['pick-numeric', 'pick-packed', 'pick-sparse', 'pick-representation'])
const pickingContextMetricIds = Object.freeze(['pick-route', 'pick-pointer-change', 'pick-view-change'])
export const pickingPathMetricIds = Object.freeze(['picking-window', ...pickingPathCounterIds, ...pickingContextMetricIds])
export const pickingPathViewports = Object.freeze([[640, 480], [1280, 799], [1280, 800], [1280, 801], [1280, 820]])

// Shared UI checks, not a browser/server launcher. Call after a real publication
// with the caller's RAF suspended so layout-fixture labels cannot be overwritten.
export async function checkPickingPathReadout({ page, output }) {
  const overlay = page.locator('.fps-graph')
  const pickingToggle = overlay.getByRole('button', { name: 'Picking paths', exact: true })
  const pickingDetails = overlay.getByRole('region', { name: 'Picking path details', exact: true })
  assert.equal(await pickingToggle.getAttribute('aria-expanded'), 'false')
  assert.equal(await pickingDetails.count(), 0, 'optional detail starts outside the accessibility tree')
  await page.setViewportSize({ width: 640, height: 480 })
  if (output) await page.screenshot({ path: resolve(output, 'performance-picking-collapsed-640x480.png') })
  await page.evaluate(() => {
    window.pickingInputEvents = []
    window.pickingInputListener = event => window.pickingInputEvents.push(event.type)
    for (const type of ['pointerdown', 'pointerup', 'click', 'wheel', 'keydown', 'keyup'])
      window.addEventListener(type, window.pickingInputListener)
  })
  try {
    for (const keyboard of [false, true]) {
      if (keyboard) { await pickingToggle.focus(); await page.keyboard.press('Space') }
      else await pickingToggle.click()
      assert.equal(await pickingToggle.getAttribute('aria-expanded'), 'true')
      assert.equal(await pickingDetails.isVisible(), true)
      assert.match(await pickingDetails.innerText(), /Means\/frame · \d+ frames \/ \d+ ms/)
      for (const name of pickingPathCounterIds)
        assert.match(await overlay.locator(`[data-metric="${name}"]`).innerText(), /^\d+\.\d{2}$/)
      assert.match(await pickingDetails.innerText(), /Latest accepted sample at publication/)
      assert.match(await overlay.locator('[data-metric="pick-route"]').innerText(), /^(World|HUD|Outside|Unknown)$/)
      for (const name of pickingContextMetricIds.slice(1))
        assert.match(await overlay.locator(`[data-metric="${name}"]`).innerText(), /^(Yes|No|Unknown)$/)
      const expanded = await overlay.boundingBox()
      assert.ok(expanded.y + expanded.height <= 480, 'expanded detail remains inside the compact viewport')
      if (output && !keyboard) await page.screenshot({ path: resolve(output, 'performance-picking-640x480.png') })
      await pickingToggle.click()
      assert.equal(await pickingToggle.getAttribute('aria-expanded'), 'false')
    }
    // Layout-only stress labels, not a renderer identity or a real export result.
    // Exercise both sides of the compact-layout breakpoint with all detail open.
    const originalLabels = await overlay.evaluate(el => {
      const names = ['renderer', 'export-status']
      const original = names.map(name => el.querySelector(`[data-metric="${name}"]`).textContent)
      el.querySelector('[data-metric="renderer"]').textContent = 'Layout fixture: ANGLE (vendor, model, graphics backend, shader profile, driver version and long browser-reported renderer description)'
      el.querySelector('[data-metric="export-status"]').textContent = 'Layout fixture: Exported 1,100 frames · 9.2 s · omitted 100 oldest of 1,200 frames to fit 2 MiB'
      return original
    })
    const expandedLayouts = []
    for (const [width, height] of pickingPathViewports) {
      await page.setViewportSize({ width, height })
      const collapsed = await overlay.evaluate(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, pointerEvents: getComputedStyle(el).pointerEvents }))
      assert.equal(collapsed.pointerEvents, 'none', 'collapsed readouts remain click-through')
      await pickingToggle.click()
      const expanded = await overlay.evaluate(el => {
        const box = el.getBoundingClientRect(), style = getComputedStyle(el)
        return { x: box.x, y: box.y, width: box.width, height: box.height, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflow: style.overflowY, pointerEvents: style.pointerEvents, tabIndex: el.tabIndex }
      })
      assert.ok(expanded.x >= 0 && expanded.y >= 0 && expanded.x + expanded.width <= width && expanded.y + expanded.height <= height, `expanded panel fits ${width}x${height}`)
      assert.ok(expanded.scrollWidth <= expanded.clientWidth, 'no horizontal clipping')
      assert.equal(expanded.overflow, 'auto')
      assert.equal(expanded.pointerEvents, 'auto', 'expanded overflow accepts native scrolling')
      assert.equal(expanded.tabIndex, 0, 'expanded panel is keyboard-scrollable')
      if (output) await page.screenshot({ path: resolve(output, `performance-picking-layout-fixture-${width}x${height}-top.png`) })
      if (expanded.scrollHeight > expanded.clientHeight) {
        await overlay.focus()
        await page.keyboard.press('End')
        await page.waitForFunction(() => {
          const el = document.querySelector('.fps-graph')
          return el.scrollTop >= el.scrollHeight - el.clientHeight - 1
        })
        if (output) await page.screenshot({ path: resolve(output, `performance-picking-layout-fixture-${width}x${height}-bottom.png`) })
        await page.keyboard.press('Home')
        await page.waitForFunction(() => document.querySelector('.fps-graph').scrollTop === 0)
        await page.mouse.move(expanded.x + expanded.width / 2, expanded.y + expanded.height / 2)
        await page.mouse.wheel(0, 10000)
        await page.waitForFunction(() => document.querySelector('.fps-graph').scrollTop > 0)
      }
      for (const selector of ['.fps-picking-toggle', '[data-metric="pick-representation"]', ...pickingContextMetricIds.map(name => `[data-metric="${name}"]`), '[data-metric="renderer"]', '.fps-export', '[data-metric="export-status"]']) {
        const target = overlay.locator(selector)
        await target.scrollIntoViewIfNeeded()
        const bounds = await target.boundingBox(), panel = await overlay.boundingBox()
        assert.ok(bounds.y >= panel.y && bounds.y + bounds.height <= panel.y + panel.height, `${selector} reachable at ${width}x${height}`)
      }
      await pickingToggle.click()
      assert.equal(await overlay.evaluate(el => el.scrollTop), 0, 'collapse restores the header')
      assert.equal(await overlay.evaluate(el => el.tabIndex), -1, 'collapsed panel is not an extra tab stop')
      assert.deepEqual(await overlay.evaluate(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, pointerEvents: getComputedStyle(el).pointerEvents })), collapsed, 'collapse restores original layout')
      expandedLayouts.push({ viewport: [width, height], syntheticLayoutLabels: true, collapsed, expanded })
    }
    await overlay.evaluate((el, original) => {
      for (const [index, name] of ['renderer', 'export-status'].entries()) el.querySelector(`[data-metric="${name}"]`).textContent = original[index]
    }, originalLabels)
    await page.setViewportSize({ width: 640, height: 480 })
    const inputEvents = await page.evaluate(() => window.pickingInputEvents)
    assert.deepEqual(inputEvents, [], 'picking controls and native scrolling do not reach gameplay input')
    return { expandedLayouts, inputEvents, activations: ['pointer', 'keyboard'], limits: ['RAF suspended after a real publication; multiline labels are explicit layout fixtures, not measured renderer/export results.'] }
  } finally {
    await page.evaluate(() => {
      for (const type of ['pointerdown', 'pointerup', 'click', 'wheel', 'keydown', 'keyup'])
        window.removeEventListener(type, window.pickingInputListener)
      delete window.pickingInputListener
      delete window.pickingInputEvents
    })
  }
}
