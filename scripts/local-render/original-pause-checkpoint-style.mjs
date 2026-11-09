import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import { waitForPauseStartup, skipPauseIntroduction } from './original-pause-checkpoint-recovery.mjs'

// A presentation-only supplement to the durable/retry/save-failure scenarios.
// Storage is deliberately unavailable before startup, producing the real store's
// session-only Save and ordinary Load explanations without injected worlds.
// Separate synthetic component records prove scrolling; they are not gameplay evidence.
export default async function ({ browser, page, url, root, output, receipt, signal }) {
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const records = [], stressRecords = [], screenshots = []
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
      const action = await waitForPauseStartup(page)
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
              buttons: [...dialog.querySelectorAll('nav[aria-label="Game menu choices"] button, section button')].map(node => ({
                label: node.getAttribute('aria-label'), top: node.offsetTop, box: box(node), ...text(node),
                reachable: node.contains(document.elementFromPoint(node.getBoundingClientRect().x + node.getBoundingClientRect().width / 2,
                  node.getBoundingClientRect().y + node.getBoundingClientRect().height / 2)),
              })),
            }
          })
          const name = `checkpoint-${panel}-${fallback ? 'fallback-dpr2' : 'native'}-${width}x${height}`
          // Retain the actual first failing layout before assertions or context cleanup.
          writeFileSync(resolve(output, 'checkpoint-style-current.json'), JSON.stringify({
            viewport: { width, height }, fallback, blockedFontRequests, layout,
          }, null, 2))
          await page.screenshot({ path: resolve(output, `${name}.png`) })
          assert.equal(layout.panel, panel)
          assert.deepEqual(layout.buttons.map(control => control.label),
            ['Back', panel === 'save' ? 'Save checkpoint' : 'Load checkpoint'])
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
            assert.equal(text.glyphs > 0, !fallback, `${name}: bitmap glyphs for ${text.copy ?? text.label}`)
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
          records.push({ evidenceScope: 'ordinary-shipped-copy', viewport: { width, height }, fallback, blockedFontRequests, ...layout })
          writeFileSync(resolve(output, 'checkpoint-style-progress.json'), JSON.stringify({ ordinaryRecords: records, stressRecords, screenshots }, null, 2))
        }
      }
      await button('Back').click()
      assert.equal(await button('Load Game').evaluate(node => node === document.activeElement), true)
      await button('Continue Game').click()
      assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), false)
      // Ordinary gameplay proof is complete before navigating to the separate component fixture.
      signal.throwIfAborted()
      await page.setViewportSize({ width: 640, height: 480 })
      const blockedBeforeStress = blockedFontRequests
      const stressUrl = new URL(url)
      stressUrl.searchParams.set('pause-checkpoint-scroll-stress', '1')
      const fontFailure = fallback ? page.waitForEvent('requestfailed', {
        predicate: request => request.url().endsWith('/original/pause-font.png'), timeout: 25000,
      }) : Promise.resolve()
      await Promise.all([page.goto(stressUrl.href, { waitUntil: 'domcontentloaded' }), fontFailure])
      await page.locator('[data-evidence-scope="component-scroll-stress"]').waitFor({ state: 'attached' })
      await modal.waitFor({ state: 'visible' })
      await button('Save Game').click()
      const stressDetails = modal.locator('[aria-label="Checkpoint details"]')
      if (fallback) {
        assert.ok(blockedFontRequests > blockedBeforeStress, 'Stress fallback requires a new blocked font request')
        await stressDetails.locator('p').last().locator(':scope > [aria-hidden="true"]').waitFor({ state: 'visible' })
        assert.equal(await stressDetails.locator('i').count(), 0)
      } else {
        // Production image.decode(), not a prepared-font prop, enables these glyphs.
        await stressDetails.locator('i').first().waitFor({ state: 'visible' })
      }
      const observeStress = () => stressDetails.evaluate(body => {
        const box = body.getBoundingClientRect(), paragraphs = [...body.querySelectorAll('p')]
        const glyphs = body.querySelectorAll('i')
        let lastLine
        if (glyphs.length) lastLine = paragraphs.at(-1).lastElementChild.getBoundingClientRect()
        else {
          const visible = paragraphs.at(-1).lastElementChild
          const walker = document.createTreeWalker(visible, NodeFilter.SHOW_TEXT)
          let node, last
          while ((node = walker.nextNode())) if (node.textContent.trim()) last = node
          const range = document.createRange()
          range.setStart(last, last.textContent.trimEnd().length - 1)
          range.setEnd(last, last.textContent.trimEnd().length)
          lastLine = range.getBoundingClientRect()
        }
        const back = body.closest('dialog').querySelector('button[aria-label="Back"]')
        const backBox = back.getBoundingClientRect()
        const save = body.closest('section').querySelector('button[aria-label="Save checkpoint"]')
        const saveBox = save.getBoundingClientRect()
        return {
          top: body.offsetTop, width: body.offsetWidth, height: body.offsetHeight,
          overflow: body.scrollHeight > body.clientHeight,
          horizontalOverflow: body.scrollWidth > body.clientWidth,
          scrollTop: body.scrollTop, clientHeight: body.clientHeight, scrollHeight: body.scrollHeight,
          focused: document.activeElement === body, panel: body.closest('dialog').dataset.panel,
          glyphCount: glyphs.length,
          fontImages: [...new Set([...glyphs].map(glyph => getComputedStyle(glyph).backgroundImage))],
          pitches: [...body.querySelectorAll('p > [aria-hidden="true"]')].filter(line => line.querySelector('i')).map(line => line.offsetHeight),
          reason: paragraphs.at(-1).firstElementChild.textContent,
          lastLineVisible: lastLine.height > 0 && lastLine.top >= box.top - 1 && lastLine.bottom <= box.bottom + 1,
          backReachable: back.contains(document.elementFromPoint(backBox.x + backBox.width / 2, backBox.y + backBox.height / 2)),
          backTop: back.offsetTop,
          saveDisabled: save.disabled, saveTop: save.offsetTop,
          saveBelowBody: saveBox.top > box.bottom,
          saveWithinViewport: saveBox.width > 0 && saveBox.height > 0 && saveBox.x >= -1 && saveBox.y >= -1 &&
            saveBox.right <= innerWidth + 1 && saveBox.bottom <= innerHeight + 1,
        }
      })
      await stressDetails.focus()
      await page.keyboard.press('Home')
      await page.waitForFunction(() => document.querySelector('[aria-label="Checkpoint details"]').scrollTop === 0)
      const start = await observeStress()
      writeFileSync(resolve(output, 'checkpoint-style-stress-current.json'), JSON.stringify({ fallback, start }, null, 2))
      assert.deepEqual([start.top, start.width, start.height], [81, 576, 270])
      assert.ok(start.overflow, 'Component stress must actually overflow')
      assert.equal(start.horizontalOverflow, false)
      assert.equal(start.focused, true)
      assert.equal(start.panel, 'save')
      assert.equal(start.saveDisabled, true)
      assert.equal(start.saveTop, 399)
      assert.equal(start.saveBelowBody, true)
      assert.equal(start.saveWithinViewport, true)
      assert.ok(start.reason.length > 0 && start.reason.length < 1024)
      assert.match(start.reason, /^[\x20-\x7e]+$/)
      assert.equal(start.glyphCount > 0, !fallback)
      if (!fallback) {
        assert.ok(start.fontImages.every(image => image.includes('/original/pause-font.png')))
        assert.ok(start.pitches.length > 0 && start.pitches.every(pitch => pitch === 30))
      }
      const stressName = `checkpoint-style-component-stress-${fallback ? 'fallback-dpr2' : 'native'}`
      await page.screenshot({ path: resolve(output, `${stressName}-top.png`) })
      screenshots.push(`${stressName}-top.png`)
      await page.keyboard.press('End')
      await page.waitForFunction(() => {
        const body = document.querySelector('[aria-label="Checkpoint details"]')
        return body.scrollTop > 0 && body.scrollTop + body.clientHeight >= body.scrollHeight - 1
      })
      const end = await observeStress()
      writeFileSync(resolve(output, 'checkpoint-style-stress-current.json'), JSON.stringify({ fallback, start, end }, null, 2))
      assert.equal(end.focused, true)
      assert.equal(end.panel, 'save')
      assert.equal(end.lastLineVisible, true)
      assert.equal(end.backReachable, true)
      assert.equal(end.backTop, 454)
      await page.screenshot({ path: resolve(output, `${stressName}-end.png`) })
      screenshots.push(`${stressName}-end.png`)
      await page.keyboard.press('Home')
      await page.waitForFunction(() => document.querySelector('[aria-label="Checkpoint details"]').scrollTop === 0)
      const home = await observeStress()
      writeFileSync(resolve(output, 'checkpoint-style-stress-current.json'), JSON.stringify({ fallback, start, end, home }, null, 2))
      assert.equal(home.focused, true)
      assert.equal(home.panel, 'save')
      await button('Back').click()
      assert.equal(await modal.getAttribute('data-panel'), 'root')
      assert.equal(await button('Save Game').evaluate(node => node === document.activeElement), true)
      stressRecords.push({ evidenceScope: 'component-scroll-stress', syntheticCopy: true,
        fallback, viewport: { width: 640, height: 480 }, blockedFontRequests: blockedFontRequests - blockedBeforeStress,
        start, end, home, backReturned: true })
      writeFileSync(resolve(output, 'checkpoint-style-progress.json'), JSON.stringify({ ordinaryRecords: records, stressRecords, screenshots }, null, 2))
    } finally { await context.close() }
  }
  assertStyleCoverage(records, stressRecords)
  return { ordinaryRecords: records, stressRecords, screenshots, limits: [
    'Controlled unavailable IndexedDB and a separately blocked font request. Saves and menus use shipped controls; no game world is injected.',
    'Component scroll stress mounts the production menu with synthetic long props, without mounting Home or injecting a world. It is not ordinary gameplay or shipped-copy parity proof.',
    'This supplements the durable-save, retry-race and save-failure scenarios; it does not replace them.',
    'Browser adaptation geometry and software-renderer screenshots do not prove original multi-slot functionality, exact native pixels or hardware performance.',
  ] }
}

// Coverage is mandatory and evidence domains remain separate.
export function assertStyleCoverage(ordinaryRecords, stressRecords) {
  assert.equal(ordinaryRecords.length, 12, 'All twelve ordinary cases required')
  assert.deepEqual(ordinaryRecords.map(record => [record.fallback, record.panel, record.viewport.width, record.viewport.height]),
    [false, true].flatMap(fallback => ['save', 'load'].flatMap(panel =>
      [[640, 480], [1920, 1080], [800, 450]].map(([width, height]) => [fallback, panel, width, height]))))
  assert.ok(ordinaryRecords.every(record => record.evidenceScope === 'ordinary-shipped-copy'))
  assert.equal(stressRecords.length, 2, 'Native and fallback component stress required')
  assert.deepEqual(stressRecords.map(record => record.fallback), [false, true])
  for (const record of stressRecords) {
    assert.equal(record.evidenceScope, 'component-scroll-stress')
    assert.equal(record.syntheticCopy, true)
    assert.ok(record.start.overflow && record.end.overflow && record.home.overflow, 'Real component overflow required')
    assert.ok(record.end.scrollTop > 0 && record.end.scrollTop + record.end.clientHeight >= record.end.scrollHeight - 1, 'End must reach scroll bottom')
    assert.equal(record.start.scrollTop, 0)
    assert.equal(record.home.scrollTop, 0)
    for (const state of [record.start, record.end, record.home]) {
      assert.equal(state.focused, true)
      assert.equal(state.panel, 'save')
      assert.equal(state.horizontalOverflow, false)
      assert.equal(state.saveDisabled, true)
      assert.equal(state.saveTop, 399)
      assert.equal(state.saveBelowBody, true)
      assert.equal(state.saveWithinViewport, true)
    }
    assert.equal(record.end.lastLineVisible, true)
    assert.equal(record.end.backReachable, true)
    assert.equal(record.backReturned, true)
    assert.equal(record.start.glyphCount > 0, !record.fallback)
    if (record.fallback) assert.ok(record.blockedFontRequests > 0)
  }
}
