import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

export async function runShortcutEpisode({ browser, sourceRoot, output, expectedCommit }) {
  assert.equal(expectedCommit, '3c7d9c80b4eabbb2b36c4831bd941fd6ce3c0059')
  const { bindGame } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/browser-game.mjs')))
  const { openCampaignFromMainMenu } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/browser-new-game.mjs')))
  const { collapseObservedCampaignMessages } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/public-keyboard-owner.mjs')))
  mkdirSync(output, { recursive: false })
  const report = { status: 'running', expectedCommit, cases: [], images: [], errors: [], warnings: [], cleanup: [] }
  const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(report, null, 2) + '\n')
  let context
  try {
    for (const dpr of [1, 2]) {
      context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: dpr, serviceWorkers: 'block', acceptDownloads: false })
      // The build is served locally; do not allow navigation or assets to external hosts.
      await context.route('**/*', async route => {
        const url = new URL(route.request().url())
        if (url.origin !== 'http://127.0.0.1:5198') {
          report.errors.push('Unexpected external request: ' + url.origin); await route.abort(); return
        }
        await route.continue()
      })
      const page = await context.newPage()
      page.setDefaultTimeout(15000)
      page.setDefaultNavigationTimeout(25000)
      page.on('pageerror', error => report.errors.push(String(error)))
      page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); if (message.type() === 'warning') report.warnings.push(message.text()) })
      const button = name => page.getByRole('button', { name, exact: true })
      const nav = page.getByRole('navigation', { name: 'Command categories', exact: true })
      const settle = () => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
      const observe = () => page.evaluate(() => {
        const world = window.testStore.getWorld(), scene = window.testSceneRef.current
        const gl = scene.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
        return {
          level: world.outcome.level, paused: world.paused, mode: world.mode, selected: [...world.selected], turn: world.turn,
          sceneCurrent: scene.world === world, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
          scroll: [scrollX, scrollY], renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          tabs: [...document.querySelectorAll('.dock-tabs button')].map(node => ({
            label: node.getAttribute('aria-label'), title: node.title, key: node.getAttribute('aria-keyshortcuts'), pressed: node.getAttribute('aria-pressed'),
            rect: (() => { const r = node.getBoundingClientRect(); return [r.x, r.y, r.width, r.height] })(),
          })),
        }
      })
      const shot = async name => {
        assert.ok(report.images.length < 9)
        await settle()
        const state = await observe()
        assert.match(state.renderer, /SwiftShader/i)
        const bytes = await page.screenshot({ fullPage: false, type: 'png', timeout: 15000 })
        assert.ok(bytes.length < 12 * 1024 * 1024)
        const file = `${name}-dpr${dpr}.png`
        writeFileSync(resolve(output, file), bytes)
        report.images.push({ name: file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), state }); save()
      }
      const expectTab = async (key, label) => {
        const before = await observe()
        await page.keyboard.press(key)
        await settle()
        const after = await observe()
        assert.equal(after.tabs.filter(tab => tab.pressed === 'true').length, 1)
        assert.equal(after.tabs.find(tab => tab.pressed === 'true').label.trim(), label)
        assert.equal(after.mode, null)
        assert.deepEqual(after.selected, before.selected)
        assert.deepEqual(after.scroll, before.scroll)
        assert.equal(after.sceneCurrent, true)
        report.cases.push({ name: `${key}-selects-${label}`, dpr, before, after }); save()
      }
      const focusBattlefield = () => page.getByLabel('Island battlefield. Click to select, right-click to move, drag to select a group.', { exact: true }).click({ position: { x: 250, y: 200 } })
      const exitIntroduction = async () => {
        await bindGame(page)
        await page.waitForFunction(() => window.testStore.getWorld().flyby.flags & 1 || !window.testStore.getWorld().inputMask)
        const skip = page.getByRole('button', { name: /Skip introduction/ })
        if (await page.evaluate(() => !!window.testStore.getWorld().inputMask)) {
          try { await skip.click({ noWaitAfter: true }) }
          catch (error) { if (error.name !== 'TimeoutError' || await skip.isVisible() || await page.evaluate(() => !!window.testStore.getWorld().inputMask)) throw error }
        }
        await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
      }
      const response = await page.goto('http://127.0.0.1:5198/', { waitUntil: 'domcontentloaded' })
      assert.equal(response.status(), 200); assert.equal(page.url(), 'http://127.0.0.1:5198/')
      await openCampaignFromMainMenu(page); await button('Start Mission 1').click(); await exitIntroduction()
      await button('Pause game').click(); await page.waitForFunction(() => window.testStore.getWorld().paused)
      await collapseObservedCampaignMessages(page)
      await focusBattlefield()
      for (const [key, label, title] of [['Insert', 'buildings B', 'buildings · Insert'], ['Home', 'spells 1–3', 'spells · Home'], ['PageUp', 'followers', 'followers · Page Up']]) {
        await expectTab(key, label)
        const control = nav.locator(`[aria-keyshortcuts="${key}"]`)
        assert.equal(await control.count(), 1); assert.equal(await control.getAttribute('title'), title)
        await control.hover(); await shot(`tab-${key}-1440x1000`)
      }
      // A public spell button arms targeting. A repeated held key cannot cancel it;
      // the next distinct tab key must clear it exactly as a tab click would.
      await expectTab('Home', 'spells 1–3')
      await page.getByRole('button', { name: /^Blast, \d+ shots$/ }).click()
      assert.equal((await observe()).mode, 'blast')
      await page.keyboard.down('Home')
      assert.equal((await observe()).mode, null)
      await page.getByRole('button', { name: /^Blast, \d+ shots$/ }).click()
      assert.equal((await observe()).mode, 'blast')
      await page.keyboard.down('Home'); await settle()
      assert.equal((await observe()).mode, 'blast')
      await page.keyboard.up('Home')
      await expectTab('Insert', 'buildings B')
      for (const key of ['Shift+Home', 'Shift+PageUp', 'Shift+Insert']) {
        const before = await observe(); await page.keyboard.press(key); await settle(); const after = await observe()
        assert.deepEqual(after.tabs.map(tab => tab.pressed), before.tabs.map(tab => tab.pressed))
        report.cases.push({ name: 'rejected-' + key, dpr, before, after })
      }
      await button('Game settings').click()
      const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
      await menu.waitFor({ state: 'visible' })
      const beforeMenu = await observe()
      for (const key of ['Home', 'Insert', 'PageUp']) await page.keyboard.press(key)
      assert.deepEqual((await observe()).tabs.map(tab => tab.pressed), beforeMenu.tabs.map(tab => tab.pressed))
      await menu.getByRole('button', { name: 'Options', exact: true }).click()
      for (const key of ['Home', 'Insert', 'PageUp']) await page.keyboard.press(key)
      assert.deepEqual((await observe()).tabs.map(tab => tab.pressed), beforeMenu.tabs.map(tab => tab.pressed))
      await menu.getByRole('button', { name: 'Back', exact: true }).click()
      await menu.getByRole('button', { name: 'Continue Game', exact: true }).click()
      await menu.waitFor({ state: 'hidden' }); assert.equal((await observe()).paused, true)
      await focusBattlefield(); await expectTab('Home', 'spells 1–3')
      await page.setViewportSize({ width: 1920, height: 1080 })
      await expectTab('PageUp', 'followers'); await shot('followers-wide-1920x1080')
      if (dpr === 1) {
        const oldWorld = await page.evaluateHandle(() => window.testStore.getWorld())
        await button('Game settings').click(); await menu.waitFor({ state: 'visible' })
        await menu.getByRole('button', { name: 'Restart Level', exact: true }).click()
        await menu.getByRole('button', { name: 'Yes', exact: true }).click()
        await menu.waitFor({ state: 'hidden' }); await page.waitForFunction(oldWorld => window.testStore.getWorld() !== oldWorld, oldWorld)
        await exitIntroduction(); await oldWorld.dispose()
        await button('Pause game').click(); await page.waitForFunction(() => window.testStore.getWorld().paused)
        await collapseObservedCampaignMessages(page); await focusBattlefield()
        await expectTab('Insert', 'buildings B'); await expectTab('Home', 'spells 1–3'); await expectTab('PageUp', 'followers')
        await shot('after-public-restart')
      }
      report.cases.push({ name: 'public-menu-options-replacement', dpr, after: await observe() })
      await context.close(); context = null; report.cleanup.push({ dpr, closed: true }); save()
    }
    assert.deepEqual(report.errors, [])
    assert.deepEqual(report.warnings.filter(text => /hydrat|server.rendered|didn.t match|#418|#423/i.test(text)), [])
    assert.equal(report.images.length, 9)
    report.status = 'passed-awaiting-pixel-review'
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack ?? String(error); throw error
  } finally { if (context) { await context.close(); report.cleanup.push({ failureContextClosed: true }) } save() }
  return report
}
