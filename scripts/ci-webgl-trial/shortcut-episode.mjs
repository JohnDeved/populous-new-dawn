import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

// Public checkpoint continuation only. This replaces, rather than repeats, the
// accepted nine-image first-entry/restart episode retained in run 42956765545.
export async function runShortcutEpisode({ browser, sourceRoot, output, expectedCommit }) {
  assert.equal(expectedCommit, '33f6a87ac7ae7e2087ce47cfe2516531716ae32a')
  const { bindGame } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/browser-game.mjs')))
  const { openCampaignFromMainMenu, waitForStartupMenu } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/browser-new-game.mjs')))
  const { collapseObservedCampaignMessages } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/public-keyboard-owner.mjs')))
  mkdirSync(output, { recursive: false })
  const report = { status: 'running', expectedCommit, cases: [], images: [], errors: [], warnings: [], cleanup: [],
    limits: ['Passively subscribes to the shipped store to observe the first replacement publication; does not mutate World, Scene, clocks, handlers or storage.',
      'Checks current-v3 durable checkpoint summaries and public input after in-session and fresh-document Load; not complete checkpoint equivalence, native saves, editable/loading guard acceptance or hardware performance.'] }
  const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(report, null, 2) + '\n')
  let context
  try {
    for (const dpr of [1, 2]) {
      context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: dpr, serviceWorkers: 'block', acceptDownloads: false })
      await context.route('**/*', async route => {
        const url = new URL(route.request().url())
        if (url.origin !== 'http://127.0.0.1:5198') {
          report.errors.push('Unexpected external request: ' + url.origin); await route.abort(); return
        }
        await route.continue()
      })
      const page = await context.newPage()
      page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(25000)
      page.on('pageerror', error => report.errors.push(String(error)))
      page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); if (message.type() === 'warning') report.warnings.push(message.text()) })
      const button = name => page.getByRole('button', { name, exact: true })
      const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
      const settle = () => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
      const installProjection = () => page.evaluate(() => {
        // Observer-only aliases. Reload removes them; install again explicitly.
        window.hudCheckpointProjection = w => ({ level: w.outcome.level, turn: w.turn, time: w.time,
          paused: w.paused, status: w.status, selected: [...w.selected], mode: w.mode,
          randomState: w.randomState, cosmeticRandom: w.cosmeticRandom.randomState,
          mana: w.mana, wood: w.wood, shots: { ...w.shots }, nextId: w.nextId,
          units: w.units.map(u => ({ id: u.id, kind: u.kind, team: u.team, hp: u.hp, x: u.x, z: u.z })),
          buildings: w.buildings.map(b => ({ id: b.id, kind: b.kind, team: b.team, hp: b.hp, x: b.x, z: b.z })) })
      })
      const installReplacementObserver = () => page.evaluate(() => {
        // Same read-only React-owner discovery used by the product's browser
        // observer, also valid before a fresh document has created any Scene.
        const main = document.querySelector('main')
        let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
        let store
        for (; fiber && !store; fiber = fiber.return) {
          for (let hook = fiber.memoizedState; hook; hook = hook.next) {
            if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) store = hook.memoizedState
          }
        }
        if (!store) throw Error('Current Home store was not observable')
        const oldWorld = store.getWorld()
        window.hudReplacement = null
        window.hudReplacementWorld = null
        window.hudUnsubscribe = store.subscribe(() => {
          if (!window.hudReplacement && store.getWorld() !== oldWorld) {
            window.hudReplacementWorld = store.getWorld()
            window.hudReplacement = window.hudCheckpointProjection(window.hudReplacementWorld)
          }
        })
      })
      const removeReplacementObserver = () => page.evaluate(() => { window.hudUnsubscribe?.(); delete window.hudUnsubscribe })
      const readStored = () => page.evaluate(async () => {
        const database = await new Promise((resolve, reject) => {
          const request = indexedDB.open('populous-new-dawn', 1)
          request.onupgradeneeded = () => {
            request.transaction.abort(); request.result.close()
            reject(Error('Expected existing checkpoint database; refused observer-created storage'))
          }
          request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
        })
        try {
          const value = await new Promise((resolve, reject) => {
            const request = database.transaction('checkpoints', 'readonly').objectStore('checkpoints').get('latest')
            request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
          })
          if (!value?.world) throw Error('Missing durable latest checkpoint')
          const bytes = new TextEncoder().encode(JSON.stringify(value))
          const digest = await crypto.subtle.digest('SHA-256', bytes)
          return { version: value.version, projection: window.hudCheckpointProjection(value.world),
            jsonBytes: bytes.length, jsonSha256: Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('') }
        } finally { database.close() }
      })
      const observe = () => page.evaluate(() => {
        const w = window.testStore.getWorld(), scene = window.testSceneRef.current
        const gl = scene.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
        return { level: w.outcome.level, turn: w.turn, paused: w.paused, mode: w.mode, selected: [...w.selected],
          randomState: w.randomState, mana: w.mana, sceneCurrent: scene.world === w,
          replacementOwnerCurrent: w === window.hudReplacementWorld && scene.world === window.hudReplacementWorld && scene.renderer.domElement.isConnected,
          viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, scroll: [scrollX, scrollY],
          renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          tabs: [...document.querySelectorAll('.dock-tabs button')].map(n => ({ label: n.getAttribute('aria-label'), pressed: n.getAttribute('aria-pressed') })) }
      })
      const expectTab = async (stage, key, label) => {
        const before = await observe()
        assert.equal(before.paused, true)
        if (stage !== 'before-save') assert.equal(before.replacementOwnerCurrent, true)
        await page.keyboard.press(key); await settle()
        const after = await observe()
        assert.equal(after.tabs.filter(t => t.pressed === 'true').length, 1)
        assert.equal(after.tabs.find(t => t.pressed === 'true').label.trim(), label)
        assert.equal(after.mode, null); assert.equal(after.paused, true)
        for (const field of ['selected', 'scroll', 'turn', 'mana', 'randomState']) assert.deepEqual(after[field], before[field], field)
        assert.equal(after.sceneCurrent, true)
        if (stage !== 'before-save') assert.equal(after.replacementOwnerCurrent, true)
        report.cases.push({ name: `${stage}-${key}-selects-${label}`, dpr, before, after }); save()
      }
      const shot = async stage => {
        assert.ok(report.images.length < 4); await settle()
        const state = await observe(); assert.match(state.renderer, /SwiftShader/i)
        assert.equal(state.replacementOwnerCurrent, true)
        const bytes = await page.screenshot({ fullPage: false, type: 'png', timeout: 15000 })
        assert.ok(bytes.length < 12 * 1024 * 1024)
        assert.equal((await observe()).replacementOwnerCurrent, true)
        const name = `${stage}-followers-1440x1000-dpr${dpr}.png`
        writeFileSync(resolve(output, name), bytes)
        report.images.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), state }); save()
      }
      const focusBattlefield = () => page.getByLabel('Island battlefield. Click to select, right-click to move, drag to select a group.', { exact: true }).click({ position: { x: 250, y: 200 } })
      const pauseReady = async () => {
        await bindGame(page)
        await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
        if (!(await observe()).paused) await button('Pause game').click()
        await page.waitForFunction(() => window.testStore.getWorld().paused)
        await collapseObservedCampaignMessages(page)
      }
      const exerciseLoaded = async stage => {
        await pauseReady()
        assert.equal((await observe()).replacementOwnerCurrent, true)
        await focusBattlefield()
        for (const [key, label] of [['Insert', 'buildings B'], ['Home', 'spells 1–3'], ['PageUp', 'followers']]) await expectTab(stage, key, label)
        await shot(stage)
      }
      const response = await page.goto('http://127.0.0.1:5198/', { waitUntil: 'domcontentloaded' })
      assert.equal(response.status(), 200)
      await openCampaignFromMainMenu(page); await button('Start Mission 1').click(); await bindGame(page)
      await page.waitForFunction(() => window.testStore.getWorld().flyby.flags & 1 || !window.testStore.getWorld().inputMask)
      const skip = page.getByRole('button', { name: /Skip introduction/ })
      if (await page.evaluate(() => !!window.testStore.getWorld().inputMask)) {
        try { await skip.click({ noWaitAfter: true }) }
        catch (error) { if (error.name !== 'TimeoutError' || await skip.isVisible() || await page.evaluate(() => !!window.testStore.getWorld().inputMask)) throw error }
      }
      await pauseReady(); await focusBattlefield(); await installProjection()
      await expectTab('before-save', 'PageUp', 'followers')
      await button('Game settings').click(); await menu.waitFor({ state: 'visible' })
      await menu.getByRole('button', { name: 'Save Game', exact: true }).click()
      await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
      await menu.getByRole('status').filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor({ state: 'visible' })
      const stored = await readStored()
      assert.equal(stored.version, 3); assert.equal(stored.projection.paused, true)
      assert.equal(stored.projection.level, 1); assert.ok(stored.jsonBytes > 0)
      const liveAtSave = await page.evaluate(() => window.hudCheckpointProjection(window.testStore.getWorld()))
      assert.deepEqual(stored.projection, liveAtSave)
      report.cases.push({ name: 'public-save-durable-readback', dpr, stored }); save()
      await menu.getByRole('button', { name: 'Back', exact: true }).click()
      await menu.getByRole('button', { name: 'Continue Game', exact: true }).click(); await menu.waitFor({ state: 'hidden' })
      await button('Resume game').click()
      await page.waitForFunction(turn => window.testStore.getWorld().turn >= turn + 24, stored.projection.turn)
      await button('Game settings').click(); await menu.waitFor({ state: 'visible' })
      const beforeLoad = await observe()
      await menu.getByRole('button', { name: 'Load Game', exact: true }).click()
      // The first changed World is recorded inside the existing publication, before
      // Home unpauses or any animation frame runs. Listener returns without writes.
      await installReplacementObserver()
      try {
        await menu.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
        await page.waitForFunction(() => window.hudReplacement !== null)
        const replacement = await page.evaluate(() => window.hudReplacement)
        assert.deepEqual(replacement, stored.projection)
        assert.ok(beforeLoad.turn >= replacement.turn + 24)
        report.cases.push({ name: 'public-load-exact-replacement-summary', dpr, beforeLoad, replacement }); save()
      } finally { await removeReplacementObserver() }
      try { await exerciseLoaded('in-session-load') }
      finally { await page.evaluate(() => { delete window.hudReplacementWorld }) }
      assert.deepEqual(await readStored(), stored, 'Load and shortcut exercise must preserve durable checkpoint')
      // Reload destroys both original store and observation aliases. Startup Load
      // must discover the checkpoint from real browser storage without reseeding.
      await page.reload({ waitUntil: 'domcontentloaded' }); await waitForStartupMenu(page); await installProjection()
      assert.deepEqual(await readStored(), stored, 'Fresh document retains durable checkpoint')
      await installReplacementObserver()
      try {
        await page.getByRole('dialog', { name: 'Main menu', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
        await page.waitForFunction(() => window.hudReplacement !== null)
        const replacement = await page.evaluate(() => window.hudReplacement)
        assert.deepEqual(replacement, stored.projection)
        report.cases.push({ name: 'fresh-document-exact-replacement-summary', dpr, replacement }); save()
      } finally { await removeReplacementObserver() }
      try { await exerciseLoaded('fresh-document-load') }
      finally { await page.evaluate(() => { delete window.hudReplacementWorld }) }
      assert.deepEqual(await readStored(), stored, 'Fresh-document Load must preserve durable checkpoint')
      report.cases.push({ name: 'fresh-document-public-load', dpr, storedDigest: stored.jsonSha256, capturedAfter: report.images.at(-1).state, observerAliasReleased: true }); save()
      await context.close(); context = null; report.cleanup.push({ dpr, closed: true }); save()
    }
    assert.deepEqual(report.errors, [])
    assert.deepEqual(report.warnings.filter(text => /hydrat|server.rendered|didn.t match|#418|#423/i.test(text)), [])
    assert.equal(report.images.length, 4)
    report.status = 'passed-awaiting-pixel-review'
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack ?? String(error); throw error
  } finally { if (context) { await context.close(); report.cleanup.push({ failureContextClosed: true }) } save() }
  return report
}
