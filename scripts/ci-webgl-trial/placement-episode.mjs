import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

export async function runPlacementEpisode({ browser, sourceRoot, output, expectedCommit }) {
  assert.equal(expectedCommit, 'b704aed96880184dcdde689c203741b5a225e3b9')
  const { bindGame } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/browser-game.mjs')))
  const { openCampaignFromMainMenu } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/browser-new-game.mjs')))
  const { collapseObservedCampaignMessages } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/public-keyboard-owner.mjs')))
  mkdirSync(output, { recursive: false })
  const report = { status: 'running', expectedCommit, cases: [], images: [], siteSearches: [], errors: [], warnings: [], cleanup: [],
    limits: ['Ordinary public input with read-only World/Scene and rendered preview observations. No game state, clock, handlers or storage are assigned.',
      'One fresh context at 1440x1000 DPR 1. Software-rendered browser behavior, not native consumer parity, hardware performance or complete checkpoint equivalence.'] }
  const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(report, null, 2) + '\n')
  let context
  try {
    context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: false })
    await context.route('**/*', async route => {
      const origin = new URL(route.request().url()).origin
      if (origin !== 'http://127.0.0.1:5198') { report.errors.push('Unexpected external request: ' + origin); await route.abort(); return }
      await route.continue()
    })
    const page = await context.newPage()
    page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(25000)
    page.on('pageerror', error => report.errors.push(String(error)))
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(message.text())
      if (message.type() === 'warning') report.warnings.push(message.text())
    })
    const button = name => page.getByRole('button', { name, exact: true })
    const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
    const settle = () => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
    const observe = () => page.evaluate(() => {
      const w = window.testStore.getWorld(), s = window.testSceneRef.current
      const gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
      return { mode: w.mode, paused: w.paused, inputMask: w.inputMask, level: w.outcome.level, turn: w.turn,
        hutDirection: w.buildingDirections.hut,
        buildings: w.buildings.filter(b => b.team === 'blue').map(b => ({ id: b.id, kind: b.kind, x: b.x, z: b.z, angle: b.angle })),
        selected: [...w.selected], sceneCurrent: s.world === w && s.renderer.domElement.isConnected,
        gesture: !!s.pointerGesture, cursor: { visible: s.cursor.visible, invalid: s.cursor.userData.invalid, point: s.pointer && { x: s.pointer.x, z: s.pointer.z } },
        pointerScreen: s.pointerScreen && { x: s.pointerScreen.clientX, y: s.pointerScreen.clientY },
        camera: { viewPoint: { x: s.viewPoint.x, z: s.viewPoint.z }, zoom: s.viewZoom, preset: s.viewPreset, transitioning: !!s.viewTransition, overview: s.overviewActive },
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        viewport: [innerWidth, innerHeight], dpr: devicePixelRatio }
    })
    const record = (name, before, after, details = {}) => { report.cases.push({ name, before, after, ...details }); save() }
    const ready = async () => {
      await bindGame(page)
      await page.waitForFunction(() => window.testStore.getWorld().flyby.flags & 1 || !window.testStore.getWorld().inputMask)
      const skip = page.getByRole('button', { name: /Skip introduction/ })
      if ((await observe()).inputMask) {
        try { await skip.click({ noWaitAfter: true }) }
        catch (error) { if (error.name !== 'TimeoutError' || await skip.isVisible() || (await observe()).inputMask) throw error }
      }
      await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
      if (!(await observe()).paused) await button('Pause game').click()
      await page.waitForFunction(() => window.testStore.getWorld().paused)
      await collapseObservedCampaignMessages(page)
      await button('Resume game').click()
      await page.waitForFunction(() => !window.testStore.getWorld().paused)
      assert.equal((await observe()).sceneCurrent, true)
      // Ordinary public zoom makes the island usable by the unchanged pointer grid.
      // Loaded games may already retain bird's-eye view: do not enter world view.
      await page.waitForFunction(() => !window.testSceneRef.current.viewTransition)
      const cameraBefore = await observe()
      assert.equal(cameraBefore.camera.overview, false)
      assert.ok([0, 2].includes(cameraBefore.camera.preset), "Expected normal or retained bird's-eye view")
      if (cameraBefore.camera.preset === 0) {
        await page.keyboard.press('-')
        await page.waitForFunction(() => window.testSceneRef.current.viewPreset === 2 && !window.testSceneRef.current.viewTransition)
      }
      const cameraAfter = await observe()
      assert.equal(cameraAfter.camera.preset, 2); assert.equal(cameraAfter.camera.overview, false)
      record('ordinary-birds-eye-camera', cameraBefore, cameraAfter, { key: cameraBefore.camera.preset === 0 ? '-' : null })
    }
    const selectHut = async () => {
      await page.getByRole('button', { name: /^buildings B\s*$/ }).click()
      await page.getByRole('button', { name: /^Hut, \d+ wood$/ }).click()
      await page.waitForFunction(() => window.testStore.getWorld().mode === 'hut')
    }
    // Find a site by moving the real pointer and reading the shipped preview.
    // Do not invoke placement validators, pickers, camera methods or handlers.
    const validSite = async () => {
      const rect = await page.getByLabel('Island battlefield. Click to select, right-click to move, drag to select a group.', { exact: true }).boundingBox()
      assert.ok(rect)
      assert.ok(report.siteSearches.length < 32, 'Bound diagnostic site-search records')
      const search = { index: report.siteSearches.length, rect, samples: [] }
      report.siteSearches.push(search); save()
      for (const fy of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
        for (const fx of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
          const point = { x: rect.x + rect.width * fx, y: rect.y + rect.height * fy }
          const hit = await page.evaluate(p => {
            const target = document.elementFromPoint(p.x, p.y)
            return { exposed: target === window.testSceneRef.current.renderer.domElement, tag: target?.tagName,
              class: target?.getAttribute('class'), label: target?.getAttribute('aria-label') }
          }, point)
          if (!hit.exposed) { search.samples.push({ point, hit, pointerMoveIssued: false }); save(); continue }
          await page.mouse.move(point.x, point.y); await settle()
          const state = await observe()
          search.samples.push({ point, hit, pointerMoveIssued: true, state }); save()
          if (state.mode === 'hut' && state.cursor.visible && state.cursor.invalid === false) { search.accepted = point; save(); return point }
        }
      }
      search.failure = 'No exposed valid hut preview found within the bounded ordinary pointer grid'
      try { await shot('diagnostic-no-valid-preview-' + search.index) }
      catch (error) { search.screenshotFailure = String(error); save() }
      throw Error(search.failure)
    }
    const click = async (point, downKeys = [], upKeys = downKeys, mouseButton = 'left') => {
      const keys = new Set([...downKeys, ...upKeys])
      try {
        for (const key of downKeys) await page.keyboard.down(key)
        await page.mouse.move(point.x, point.y); await page.mouse.down({ button: mouseButton })
        for (const key of downKeys) if (!upKeys.includes(key)) await page.keyboard.up(key)
        for (const key of upKeys) if (!downKeys.includes(key)) await page.keyboard.down(key)
        await page.mouse.up({ button: mouseButton }); await settle()
      } finally {
        await page.mouse.up({ button: mouseButton })
        for (const key of keys) await page.keyboard.up(key)
      }
    }
    const place = async (name, downKeys, upKeys = downKeys, retained = true) => {
      const point = await validSite(), before = await observe()
      await click(point, downKeys, upKeys)
      const after = await observe()
      assert.equal(after.buildings.length, before.buildings.length + 1, name)
      const created = after.buildings.filter(b => !before.buildings.some(old => old.id === b.id))
      assert.equal(created.length, 1); assert.equal(created[0].kind, 'hut')
      assert.ok(Math.abs(created[0].angle - before.hutDirection * Math.PI / 2) < 1e-12, 'New hut must use the selected quarter-turn direction')
      assert.equal(after.mode, retained ? 'hut' : null, name)
      assert.equal(after.sceneCurrent, true); assert.equal(after.gesture, false)
      assert.deepEqual(after.selected, before.selected)
      record(name, before, after, { point }); return point
    }
    const shot = async name => {
      assert.ok(report.images.length < 5); await settle()
      const state = await observe(); assert.equal(state.sceneCurrent, true); assert.match(state.renderer, /SwiftShader/i)
      const bytes = await page.screenshot({ fullPage: false, type: 'png', timeout: 15000 })
      assert.ok(bytes.length < 12 * 1024 * 1024)
      writeFileSync(resolve(output, name + '.png'), bytes)
      report.images.push({ name: name + '.png', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), state }); save()
    }
    const replace = async (name, action) => {
      const old = await page.evaluateHandle(() => window.testStore.getWorld())
      const before = await observe()
      try {
        await action()
        await page.waitForFunction(old => window.testStore.getWorld() !== old, old)
        await ready()
        const after = await observe()
        assert.equal(after.mode, null); assert.equal(after.gesture, false); assert.equal(after.sceneCurrent, true)
        record(name, before, after)
      } finally { await old.dispose() }
    }
    const response = await page.goto('http://127.0.0.1:5198/', { waitUntil: 'domcontentloaded' })
    assert.equal(response.status(), 200)
    await openCampaignFromMainMenu(page); await button('Start Mission 1').click(); await ready()
    await selectHut()
    const first = await place('first-Ctrl-plan', ['Control'])
    const beforeOverlap = await observe()
    await click(first, ['Control'])
    const afterOverlap = await observe()
    assert.deepEqual(afterOverlap.buildings, beforeOverlap.buildings); assert.equal(afterOverlap.mode, 'hut')
    record('overlap-rejection-retains-mode', beforeOverlap, afterOverlap, { point: first })
    await place('second-Ctrl-plan', ['Control'])
    await shot('01-consecutive-retained-plans')
    for (const keys of [['Shift'], ['Control', 'Alt'], ['Control', 'Shift'], ['Alt', 'Shift'], ['Control', 'Alt', 'Shift']]) {
      const point = await validSite(), before = await observe()
      await click(point, keys)
      const after = await observe()
      assert.deepEqual(after.buildings, before.buildings); assert.equal(after.mode, 'hut')
      record('rejected-modifiers-' + keys.join('+'), before, after, { point })
    }
    const beforeRotation = await observe()
    await page.keyboard.press('Space'); await settle()
    const afterRotation = await observe()
    assert.equal(afterRotation.hutDirection, (beforeRotation.hutDirection + 1) & 3)
    assert.equal(afterRotation.mode, 'hut')
    assert.deepEqual(afterRotation.buildings, beforeRotation.buildings)
    record('public-Space-advances-quarter-turn', beforeRotation, afterRotation)
    await place('Alt-plan-after-public-rotation', ['Alt'])
    await place('Ctrl-added-at-release', [], ['Control'])
    await place('Ctrl-removed-at-release-finishes', ['Control'], [], false)
    await shot('02-release-time-finish')
    await selectHut()
    const cancelPoint = await validSite(), beforeCancel = await observe()
    await click(cancelPoint, ['Control'], ['Control'], 'right')
    const afterCancel = await observe()
    assert.deepEqual(afterCancel.buildings, beforeCancel.buildings); assert.equal(afterCancel.mode, null)
    record('right-release-cancels', beforeCancel, afterCancel)
    // Save a mode-null checkpoint, then create a retained plan before loading it.
    await button('Game settings').click(); await menu.waitFor({ state: 'visible' })
    await menu.getByRole('button', { name: 'Save Game', exact: true }).click()
    await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
    await menu.getByRole('status').filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor({ state: 'visible' })
    const saved = await observe()
    await menu.getByRole('button', { name: 'Back', exact: true }).click()
    await menu.getByRole('button', { name: 'Continue Game', exact: true }).click(); await menu.waitFor({ state: 'hidden' })
    await selectHut(); await place('retained-plan-after-save', ['Control'])
    await replace('public-load-replaces-retained-world', async () => {
      await button('Game settings').click(); await menu.waitFor({ state: 'visible' })
      await menu.getByRole('button', { name: 'Load Game', exact: true }).click()
      await menu.getByRole('button', { name: 'Load checkpoint', exact: true }).click(); await menu.waitFor({ state: 'hidden' })
    })
    assert.deepEqual((await observe()).buildings, saved.buildings)
    await selectHut(); await place('retained-placement-after-load', ['Control']); await shot('03-loaded-retained-plan')
    await replace('public-restart-replaces-retained-world', async () => {
      await button('Game settings').click(); await menu.waitFor({ state: 'visible' })
      await menu.getByRole('button', { name: 'Restart Level', exact: true }).click()
      await menu.getByRole('button', { name: 'Yes', exact: true }).click(); await menu.waitFor({ state: 'hidden' })
    })
    await selectHut(); await place('retained-placement-after-restart', ['Control']); await shot('04-restarted-retained-plan')
    await replace('public-new-game-replaces-retained-world', async () => {
      await button('Game settings').click(); await menu.waitFor({ state: 'visible' })
      await menu.getByRole('button', { name: 'Quit Game', exact: true }).click()
      await menu.getByRole('button', { name: 'Yes', exact: true }).click(); await menu.waitFor({ state: 'hidden' })
      await openCampaignFromMainMenu(page); await button('Start Mission 1').click()
    })
    await selectHut(); await place('retained-placement-after-new-game', ['Control']); await shot('05-new-game-retained-plan')
    assert.deepEqual(report.errors, [])
    assert.deepEqual(report.warnings.filter(text => /hydrat|server.rendered|didn.t match|#418|#423/i.test(text)), [])
    assert.equal(report.images.length, 5)
    report.status = 'passed-awaiting-pixel-review'
  } catch (error) { report.status = 'failed'; report.failure = error.stack ?? String(error); throw error }
  finally { if (context) { await context.close(); report.cleanup.push({ contextClosed: true }) } save() }
  return report
}
