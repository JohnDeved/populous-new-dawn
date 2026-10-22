import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import { pauseStartupReady, skipPauseIntroduction } from './original-pause-checkpoint-recovery.mjs'
import { observeFullscreenClearance, assertFullscreenClearance } from './fullscreen-clearance.mjs'
import { assertCheckpointBodyClearance } from './checkpoint-body-clearance.mjs'

async function waitForPauseFrame(page) {
  // Resizing is asynchronous in React. Inspect the actual rendered frame.
  await page.waitForFunction(({ width, height }) => {
    const dialog = document.querySelector('dialog[data-original-pause-menu]')
    const frame = dialog?.firstElementChild?.getBoundingClientRect()
    const scale = Math.min(width / 640, height / 480)
    return innerWidth === width && innerHeight === height && frame &&
      Math.abs(frame.width - 640 * scale) < .1 && Math.abs(frame.height - 480 * scale) < .1
  }, page.viewportSize())
}

// A cleanup RPC must not hide the assertion/timeout that caused the failure.
export async function restorePausePreferenceWrite(page, primaryError) {
  try { await page.evaluate(() => window.restorePausePreferenceWrite()) }
  catch (error) {
    if (!primaryError) throw error
    primaryError.preferenceRestoreError = String(error)
  }
}

export function writePauseInputBudgets(output, inputBudgets, primaryError) {
  try { writeFileSync(resolve(output, 'pause-style-input-budgets.json'), JSON.stringify(inputBudgets, null, 2) + '\n') }
  catch (error) {
    if (!primaryError) throw error
    primaryError.traceWriteError = String(error)
  }
}

// A presentation-only supplement to the durable/retry/save-failure scenarios.
// Storage is deliberately unavailable before startup, producing the real store's
// session-only Save and longest ordinary Load explanation without injected worlds.
export default async function ({ browser, page, url, root, output, receipt, signal, deadlineAt }) {
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const records = [], screenshots = [], fullscreen = [], inputBudgets = []
  receipt.pauseStyleInputBudgets = inputBudgets
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
      async function fullscreenClearance(label) {
        await waitForPauseFrame(page)
        // Reach the real portal through ordinary keyboard navigation, never .focus().
        let tabs = 0
        do {
          await page.keyboard.press('Tab')
          tabs++
        } while (tabs < 32 && !await button('Fullscreen').evaluate(node => node === document.activeElement))
        assert.equal(await page.locator('.native-hud').count(), 1, 'Live native HUD/minimap geometry is required')
        assert.ok(await modal.locator(':scope > :not([data-fullscreen-control]) button').count() > 0,
          'Native menu controls cannot disappear from clearance coverage')
        const sample = await observeFullscreenClearance(page, 'dialog[data-original-pause-menu]',
          '.native-hud, dialog[data-original-pause-menu] > :not([data-fullscreen-control]) button, ' +
          'dialog[data-original-pause-menu] [aria-label="Checkpoint details"], ' +
          'dialog[data-original-pause-menu] h2 > span, [data-original-options] [data-option-key], ' +
          '[data-original-options] input, [data-original-options] [role="status"], ' +
          '[data-original-options] [data-menu-tooltip], [data-original-options] label[for]')
        fullscreen.push({ label, fallback, tabs, ...sample })
        writeFileSync(resolve(output, 'pause-fullscreen-clearance.json'), JSON.stringify(fullscreen, null, 2))
        assertFullscreenClearance(sample)
        assert.equal(sample.focused, true, 'Fullscreen is reached by normal Tab navigation')
        assert.equal(sample.focusVisible, true, 'Keyboard focus has its real visible ring')
        assert.equal(sample.activeLabel, 'Fullscreen', 'Compact artwork retains its accessible name')
      }
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await openCampaignFromMainMenu(page)
      await button('Start Mission 1').click()
      await bindGame(page)
      const desktop = page.getByRole('button', { name: 'Continue anyway', exact: false })
      if (await desktop.isVisible()) await desktop.click()
      const startup = await page.waitForFunction(pauseStartupReady)
      const action = await startup.jsonValue()
      await startup.dispose()
      if (action === 'skip') {
        const trace = { fallback }; inputBudgets.push(trace)
        let inputError
        try {
          await skipPauseIntroduction(page, Number.isFinite(deadlineAt)
            ? { setupTimeout: 25000, deadlineAt, signal, trace } : { signal, trace })
        } catch (error) { inputError = error; throw error }
        finally { writePauseInputBudgets(output, inputBudgets, inputError) }
      }
      await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
      await page.waitForFunction(() => window.testStore.getCheckpointReadStatus() === 'unavailable')
      await button('Menu').click()
      for (const [width, height] of [[320, 240], [640, 480], [800, 450], [1920, 1080]]) {
        await page.setViewportSize({ width, height })
        await fullscreenClearance(`root-${width}x${height}`)
      }
      await button('Options').click()
      // Same ordinary Game-options storage boundary as the reported overlap;
      // neither font availability nor preference/world state is forged.
      await page.evaluate(() => {
        const set = Storage.prototype.setItem
        window.restorePausePreferenceWrite = () => { Storage.prototype.setItem = set }
        Storage.prototype.setItem = function (key, value) {
          if (key === 'populous-game-preferences')
            throw new DOMException('Controlled preference write failure', 'SecurityError')
          return set.call(this, key, value)
        }
      })
      let optionsError
      try {
        await page.locator('[data-option-key="rotation"]').click()
        await modal.getByRole('status').filter({ hasText: 'browser storage is unavailable' }).waitFor()
        for (const category of ['Game', 'Sound', 'Graphics']) {
          if (category !== 'Game') await button(category).click()
          for (const [width, height] of [[320, 240], [640, 480], [800, 450], [1920, 1080]]) {
            await page.setViewportSize({ width, height })
            await fullscreenClearance(`options-${category}-${width}x${height}`)
            if (fallback && category === 'Game' && width === 320) {
              const name = 'pause-options-fullscreen-fallback-320x240.png'
              await page.screenshot({ path: resolve(output, name) })
              screenshots.push(name)
            }
          }
        }
      } catch (error) { optionsError = error; throw error }
      finally { await restorePausePreferenceWrite(page, optionsError) }
      await button('Back').click()
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
        for (const [width, height] of [[320, 240], [640, 480], [1920, 1080], [800, 450]]) {
          signal.throwIfAborted()
          await page.setViewportSize({ width, height })
          await waitForPauseFrame(page)
          const details = modal.locator('[aria-label="Checkpoint details"]')
          await details.focus()
          await page.keyboard.press('Home')
          await page.waitForFunction(() => document.querySelector('[aria-label="Checkpoint details"]').scrollTop === 0)
          const layout = await modal.evaluate(dialog => {
            const panel = dialog.querySelector('section'), body = panel.querySelector('[aria-label="Checkpoint details"]')
            const box = node => {
              const rect = node.getBoundingClientRect()
              return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom }
            }
            const text = node => {
              const glyphs = node.querySelectorAll('i').length
              const visible = node.matches('p') ? node.lastElementChild : node.firstElementChild
              const style = getComputedStyle(visible)
              const range = document.createRange()
              range.selectNodeContents(visible)
              return {
                glyphs,
                lines: glyphs ? [...node.querySelectorAll(':scope > [aria-hidden="true"] > span')].map(box)
                  : [...range.getClientRects()].map(rect => ({ x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom })),
                images: [...new Set([...node.querySelectorAll('i')].map(glyph => getComputedStyle(glyph).backgroundImage))],
                fallback: glyphs ? null : { text: visible.textContent, box: box(visible),
                  display: style.display, visibility: style.visibility, opacity: Number(style.opacity) },
              }
            }
            return {
              panel: dialog.dataset.panel, dpr: devicePixelRatio,
              viewport: { width: innerWidth, height: innerHeight }, hud: box(document.querySelector('.native-hud')),
              background: getComputedStyle(panel).backgroundColor, border: getComputedStyle(panel).borderTopWidth,
              titleTop: panel.querySelector('h2').offsetTop,
              title: { copy: panel.querySelector('h2').getAttribute('aria-label'), ...text(panel.querySelector('h2')) },
              body: { top: body.offsetTop, height: body.offsetHeight, width: body.offsetWidth,
                overflow: body.scrollHeight > body.clientHeight, horizontalOverflow: body.scrollWidth > body.clientWidth,
                box: box(body), paragraphs: [...body.querySelectorAll('p')].map(node => ({
                  copy: node.firstElementChild.textContent, ...text(node),
                  pitches: [...node.querySelectorAll(':scope > [aria-hidden="true"]')].filter(line => line.querySelector('i')).map(line => line.offsetHeight),
                })) },
              buttons: [...dialog.querySelectorAll(':scope > :not([data-fullscreen-control]) button')].map(node => ({
                label: node.getAttribute('aria-label'), top: node.offsetTop, box: box(node), ...text(node),
                reachable: node.contains(document.elementFromPoint(node.getBoundingClientRect().x + node.getBoundingClientRect().width / 2,
                  node.getBoundingClientRect().y + node.getBoundingClientRect().height / 2)),
              })),
            }
          })
          records.push({ viewport: { width, height }, fallback, blockedFontRequests, ...layout })
          writeFileSync(resolve(output, 'checkpoint-style-progress.json'), JSON.stringify({ records, screenshots }, null, 2))
          assert.equal(layout.panel, panel)
          assert.equal(layout.background, 'rgba(0, 0, 0, 0)')
          assert.equal(layout.border, '0px')
          assert.equal(layout.titleTop, 39)
          assert.deepEqual([layout.body.top, layout.body.width, layout.body.height], [81, 432, 270])
          assertCheckpointBodyClearance(layout)
          assert.equal(layout.body.horizontalOverflow, false)
          assert.equal(layout.body.paragraphs[0].copy, 'One browser checkpoint. No original multi-slot saves.')
          assert.ok(layout.body.paragraphs.some(paragraph => paragraph.copy === (panel === 'save'
            ? 'Checkpoint saved for this session only; browser storage is unavailable.'
            : 'Loading replaces the current world and discards unsaved progress.')))
          if (panel === 'load') assert.ok(layout.body.paragraphs.some(paragraph => paragraph.copy === 'Checkpoint available in this session.'))
          assert.deepEqual(layout.buttons.map(control => control.label).sort(),
            ['Back', panel === 'save' ? 'Save checkpoint' : 'Load checkpoint'].sort(),
            'Native action collection must remain complete and nonempty, separate from the portal')
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
          // Compact body geometry reuses the live dialog without adding a capture
          // or changing the existing 44 fullscreen-clearance cases.
          const capture = width !== 320
          if (capture) await fullscreenClearance(`${panel}-${width}x${height}`)
          const name = `checkpoint-${panel}-${fallback ? 'fallback-dpr2' : 'native'}-${width}x${height}`
          if (capture) {
            await page.screenshot({ path: resolve(output, `${name}.png`) })
            screenshots.push(`${name}.png`)
          }
          if (layout.body.overflow) {
            await details.focus()
            await page.keyboard.press('End')
            await page.waitForFunction(() => {
              const body = document.querySelector('[aria-label="Checkpoint details"]')
              return body.scrollTop > 0 && body.scrollTop + body.clientHeight >= body.scrollHeight - 1
            })
            assert.equal(await modal.getAttribute('data-panel'), panel)
            assert.equal(await details.evaluate(node => node === document.activeElement), true)
            if (capture) {
              await page.screenshot({ path: resolve(output, `${name}-scrolled.png`) })
              screenshots.push(`${name}-scrolled.png`)
            }
          }
          assert.equal(await page.evaluate(() => JSON.stringify(window.testStore.getWorld())), frozen)
          writeFileSync(resolve(output, 'checkpoint-style-progress.json'), JSON.stringify({ records, screenshots }, null, 2))
        }
      }
      await button('Back').click()
      assert.equal(await button('Load Game').evaluate(node => node === document.activeElement), true)
      await button('Continue Game').click()
      assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), false)
    } finally { await context.close() }
  }
  return { records, screenshots, fullscreen, limits: [
    'Controlled unavailable IndexedDB and a separately blocked font request. Saves and menus use shipped controls; no game world is injected.',
    'This supplements the durable-save, retry-race and save-failure scenarios; it does not replace them.',
    'Fullscreen clearance covers native/fallback menus, ordinary Tab focus and physical hit testing, not wide fullscreen error-tooltip clearance.',
    'Browser adaptation geometry and software-renderer screenshots do not prove original multi-slot functionality, exact native pixels or hardware performance.',
  ] }
}
