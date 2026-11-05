import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import { pauseStartupReady, skipPauseIntroduction } from './original-pause-checkpoint-recovery.mjs'

// A presentation-only supplement to the durable/retry/save-failure scenarios.
// Storage is deliberately unavailable before startup, producing the real store's
// session-only Save and longest ordinary Load explanation without injected worlds.
export default async function ({ browser, page, url, root, output, receipt, signal }) {
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const records = [], screenshots = []
  await page.close()
  for (const fallback of [false, true]) {
    signal.throwIfAborted()
    const context = await browser.newContext({ viewport: { width: 640, height: 480 }, deviceScaleFactor: fallback ? 2 : 1 })
    let blockedFontRequests = 0
    try {
      await context.addInitScript(() => Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined }))
      if (fallback) await context.route('**/original/pause-font.png', route => {
        blockedFontRequests++
        return route.abort('failed')
      })
      const page = await context.newPage()
      page.setDefaultTimeout(25000)
      page.on('pageerror', error => receipt.errors.push(String(error)))
      page.on('console', message => {
        if (message.type() === 'error') {
          if (fallback && message.location().url.endsWith('/original/pause-font.png') && message.text().includes('net::ERR_FAILED'))
            receipt.warnings.push(`Expected blocked pause-font request: ${message.text()}`)
          else receipt.errors.push(message.text())
        } else if (message.type() === 'warning') receipt.warnings.push(message.text())
      })
      const button = name => page.getByRole('button', { name, exact: true })
      const modal = page.getByRole('dialog', { name: 'Game menu', exact: true })
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await openCampaignFromMainMenu(page)
      await button('Start Mission 1').click()
      await bindGame(page)
      const desktop = page.getByRole('button', { name: 'Continue anyway', exact: false })
      if (await desktop.isVisible()) await desktop.click()
      const startup = await page.waitForFunction(pauseStartupReady)
      const action = await startup.jsonValue()
      await startup.dispose()
      if (action === 'skip') await skipPauseIntroduction(page)
      await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
      await page.waitForFunction(() => window.testStore.getCheckpointReadStatus() === 'unavailable')
      await button('Menu').click()
      await button('Save Game').click()
      await button('Save checkpoint').click()
      await modal.getByRole('status').filter({ hasText: 'Checkpoint saved for this session only; browser storage is unavailable.' }).waitFor()
      assert.equal(await page.evaluate(() => window.testStore.hasCheckpoint()), true)
      if (fallback) assert.ok(blockedFontRequests > 0)
      const frozen = await page.evaluate(() => JSON.stringify(window.testStore.getWorld()))
      for (const panel of ['save', 'load']) {
        if (panel === 'load') {
          await button('Back').click()
          await button('Load Game').click()
        }
        for (const [width, height] of [[640, 480], [1920, 1080], [800, 450]]) {
          signal.throwIfAborted()
          await page.setViewportSize({ width, height })
          const details = modal.locator('[aria-label="Checkpoint details"]')
          await details.focus()
          await page.keyboard.press('Home')
          await page.waitForFunction(() => document.querySelector('[aria-label="Checkpoint details"]').scrollTop === 0)
          const layout = await modal.evaluate(dialog => {
            const panel = dialog.querySelector('section'), body = panel.querySelector('[aria-label="Checkpoint details"]')
            const box = node => {
              const rect = node.getBoundingClientRect()
              return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom }
            }
            const text = node => {
              const glyphs = node.querySelectorAll('i').length
              const visible = node.matches('p') ? node.lastElementChild : node.firstElementChild
              const style = getComputedStyle(visible)
              return {
                glyphs,
                images: [...new Set([...node.querySelectorAll('i')].map(glyph => getComputedStyle(glyph).backgroundImage))],
                fallback: glyphs ? null : { text: visible.textContent, box: box(visible),
                  display: style.display, visibility: style.visibility, opacity: Number(style.opacity) },
              }
            }
            return {
              panel: dialog.dataset.panel, dpr: devicePixelRatio,
              background: getComputedStyle(panel).backgroundColor, border: getComputedStyle(panel).borderTopWidth,
              titleTop: panel.querySelector('h2').offsetTop,
              title: { copy: panel.querySelector('h2').getAttribute('aria-label'), ...text(panel.querySelector('h2')) },
              body: { top: body.offsetTop, height: body.offsetHeight, width: body.offsetWidth,
                overflow: body.scrollHeight > body.clientHeight, horizontalOverflow: body.scrollWidth > body.clientWidth,
                box: box(body), paragraphs: [...body.querySelectorAll('p')].map(node => ({
                  copy: node.firstElementChild.textContent, ...text(node),
                  pitches: [...node.querySelectorAll(':scope > [aria-hidden="true"]')].filter(line => line.querySelector('i')).map(line => line.offsetHeight),
                })) },
              buttons: [...dialog.querySelectorAll('button')].map(node => ({
                label: node.getAttribute('aria-label'), top: node.offsetTop, box: box(node), ...text(node),
                reachable: node.contains(document.elementFromPoint(node.getBoundingClientRect().x + node.getBoundingClientRect().width / 2,
                  node.getBoundingClientRect().y + node.getBoundingClientRect().height / 2)),
              })),
            }
          })
          assert.equal(layout.panel, panel)
          assert.equal(layout.background, 'rgba(0, 0, 0, 0)')
          assert.equal(layout.border, '0px')
          assert.equal(layout.titleTop, 39)
          assert.deepEqual([layout.body.top, layout.body.width, layout.body.height], [81, 576, 270])
          assert.equal(layout.body.horizontalOverflow, false)
          assert.equal(layout.body.paragraphs[0].copy, 'One browser checkpoint. No original multi-slot saves.')
          assert.ok(layout.body.paragraphs.some(paragraph => paragraph.copy === (panel === 'save'
            ? 'Checkpoint saved for this session only; browser storage is unavailable.'
            : 'Loading replaces the current world and discards unsaved progress.')))
          if (panel === 'load') assert.ok(layout.body.paragraphs.some(paragraph => paragraph.copy === 'Checkpoint available in this session.'))
          for (const text of [layout.title, ...layout.body.paragraphs, ...layout.buttons]) {
            assert.equal(text.glyphs > 0, !fallback)
            if (fallback) {
              assert.equal(text.fallback.text, text.copy ?? text.label)
              assert.notEqual(text.fallback.display, 'none')
              assert.equal(text.fallback.visibility, 'visible')
              assert.ok(text.fallback.opacity > 0)
              assert.ok(text.fallback.box.width > 0 && text.fallback.box.height > 0)
              assert.ok(text.fallback.box.x >= -1 && text.fallback.box.x + text.fallback.box.width <= width + 1)
            } else assert.ok(text.images.every(image => image.includes('/original/pause-font.png')))
          }
          for (const paragraph of layout.body.paragraphs) assert.ok(paragraph.pitches.every(pitch => pitch === 30))
          for (const control of layout.buttons) {
            assert.equal(control.top, control.label === 'Back' ? 454 : 399)
            assert.ok(control.box.y > layout.body.box.bottom)
            assert.ok(control.box.x >= -1 && control.box.y >= -1 && control.box.x + control.box.width <= width + 1 && control.box.bottom <= height + 1)
            assert.equal(control.reachable, true)
          }
          const name = `checkpoint-${panel}-${fallback ? 'fallback-dpr2' : 'native'}-${width}x${height}`
          await page.screenshot({ path: resolve(output, `${name}.png`) })
          screenshots.push(`${name}.png`)
          if (layout.body.overflow) {
            await page.keyboard.press('End')
            await page.waitForFunction(() => {
              const body = document.querySelector('[aria-label="Checkpoint details"]')
              return body.scrollTop > 0 && body.scrollTop + body.clientHeight >= body.scrollHeight - 1
            })
            assert.equal(await modal.getAttribute('data-panel'), panel)
            assert.equal(await details.evaluate(node => node === document.activeElement), true)
            await page.screenshot({ path: resolve(output, `${name}-scrolled.png`) })
            screenshots.push(`${name}-scrolled.png`)
          }
          assert.equal(await page.evaluate(() => JSON.stringify(window.testStore.getWorld())), frozen)
          records.push({ viewport: { width, height }, fallback, blockedFontRequests, ...layout })
          writeFileSync(resolve(output, 'checkpoint-style-progress.json'), JSON.stringify({ records, screenshots }, null, 2))
        }
      }
      await button('Back').click()
      assert.equal(await button('Load Game').evaluate(node => node === document.activeElement), true)
      await button('Continue Game').click()
      assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), false)
    } finally { await context.close() }
  }
  return { records, screenshots, limits: [
    'Controlled unavailable IndexedDB and a separately blocked font request. Saves and menus use shipped controls; no game world is injected.',
    'This supplements the durable-save, retry-race and save-failure scenarios; it does not replace them.',
    'Browser adaptation geometry and software-renderer screenshots do not prove original multi-slot functionality, exact native pixels or hardware performance.',
  ] }
}
