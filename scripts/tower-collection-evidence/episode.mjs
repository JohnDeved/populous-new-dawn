import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { towerWorldObservation, assertTowerGift, assertTowerPresentation, assertTowerContinuation, assertTowerRestore } from './contracts.mjs'

// Source-derived from the existing M4 natural-victory and pause-recovery routes.
// Deliberately no model import, direct tick, supplied actor, teleport, reward
// mutation, construction, native execution, or browser flag/runtime selection.
export async function runTowerCollectionEpisode({ browser, url, output, signal, deadlineAt, revision }) {
  assert.match(revision, /^[a-f0-9]{40}$/)
  assert.ok(Number.isFinite(deadlineAt))
  const report = { status: 'running', revision, checks: [], screenshots: [], errors: [], warnings: [],
    controlledFrames: 0, observedGiftIds: [], cleanupVerified: false,
    limitations: ['Direct public Mission 4 selection, not earned campaign progression.',
      'Scene.animate receives controlled 1/24-second timestamps while the document RAF scheduler is held. This is not natural wall-clock pacing or hardware performance.',
      'Read-only React Scene/store discovery; camera focus and bounded actual-picker search are setup, not ordinary user camera navigation.',
      'Checkpoint equality covers the complete Tower shrine, Tower gifts, giftCounts, turn/time and unlock flag, not whole-world replay equivalence.',
      'Screenshots and actual WebGL state require independent visual review; no original-raster parity is inferred.'] }
  const saveReport = () => writeFileSync(resolve(output, 'tower-collection.json'), JSON.stringify(report, null, 2) + '\n')
  const check = () => { signal.throwIfAborted(); assert.ok(Date.now() < deadlineAt, 'Tower episode deadline'); assert.ok(report.controlledFrames <= 24000, 'Controlled-frame budget') }
  let context, page, failed = false, primary
  try {
    check()
    context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
    await context.addInitScript({ content: `window.__towerRead = (${towerWorldObservation.toString()});` })
    await context.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window)
      let held = false
      window.requestAnimationFrame = callback => held ? 0 : request(callback)
      window.__towerHold = value => { held = value }
      window.__towerInputs = []
      document.addEventListener('pointerup', event => {
        if (window.__towerInputs.length >= 64) return
        const target = event.target, button = target instanceof Element ? target.closest('button') : null
        window.__towerInputs.push({ trusted: event.isTrusted, canvas: target instanceof HTMLCanvasElement,
          x: event.clientX, y: event.clientY,
          label: button?.getAttribute('aria-label') ?? button?.textContent?.trim() ?? null })
      }, true)
    })
    page = await context.newPage()
    page.setDefaultTimeout(25000)
    page.setDefaultNavigationTimeout(30000)
    page.on('pageerror', error => report.errors.push(String(error)))
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(message.text())
      if (message.type() === 'warning') report.warnings.push(message.text())
    })
    const button = name => page.getByRole('button', { name, exact: true })
    const bind = async () => {
      check()
      await page.waitForFunction(() => {
        const main = document.querySelector('main')
        if (!main || document.querySelector('.loading-world')) return false
        let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
        const stores = [], scenes = []
        for (; fiber; fiber = fiber.return) for (let hook = fiber.memoizedState; hook; hook = hook.next) {
          if (hook.memoizedState?.getWorld) stores.push(hook.memoizedState)
          if (hook.memoizedState?.current?.unitMeshes) scenes.push(hook.memoizedState)
        }
        for (const store of stores) for (const ref of scenes) {
          const scene = ref.current
          if (scene?.world === store.getWorld() && scene.renderer?.domElement?.isConnected) {
            window.testStore = store; window.testSceneRef = ref
            return true
          }
        }
        return false
      }, undefined, { polling: 50 })
    }
    const observe = () => page.evaluate(() => window.__towerRead(window.testStore.getWorld()))
    const hold = () => page.evaluate(() => {
      const scene = window.testSceneRef.current
      window.__towerHold(true)
      if (scene.frame) cancelAnimationFrame(scene.frame)
      scene.frame = 0
      window.__towerClock = scene.previous ?? performance.now()
    })
    const frame = async (count = 1, stopAtGift = false) => {
      check()
      assert.ok(Number.isInteger(count) && count > 0 && count <= 24)
      assert.ok(report.controlledFrames + count <= 24000, 'Controlled-frame budget must admit the whole batch')
      const result = await page.evaluate(({ count, stopAtGift }) => {
        const scene = window.testSceneRef.current, world = window.testStore.getWorld()
        if (scene.world !== world || scene.frame || !scene.isCurrent()) throw Error('Lost controlled Scene ownership')
        const ids = []
        let visits = 0
        for (; visits < count; visits++) {
          if (world.status !== 'playing') throw Error('Mission ended before Tower acceptance')
          window.__towerClock += 1000 / 24
          scene.animate(window.__towerClock)
          for (const gift of world.gifts) if (gift.reward === 'tower') ids.push(gift.id)
          if (scene.frame) throw Error('Unexpected live RAF during controlled episode')
          if (stopAtGift && ids.length) { visits++; break }
        }
        return { visits, ids, state: window.__towerRead(world) }
      }, { count, stopAtGift })
      report.controlledFrames += result.visits
      report.observedGiftIds.push(...result.ids.filter(id => !report.observedGiftIds.includes(id)))
      check()
      return result.state
    }
    const capture = async name => {
      check(); assert.ok(report.screenshots.length < 4)
      await page.screenshot({ path: resolve(output, name), timeout: Math.min(25000, deadlineAt - Date.now()) })
      report.screenshots.push(name); saveReport()
    }
    const presentation = async giftId => page.evaluate(giftId => {
      const scene = window.testSceneRef.current, world = window.testStore.getWorld()
      const shrine = world.shrines.find(value => value.kind === 'vault' && value.reward === 'tower')
      const group = giftId == null ? scene.shrineMeshes.get(shrine.id)?.g.userData.vaultKnowledgeMarker : scene.fxMeshes.get(giftId)
      if (!group) throw Error('Actual Tower render group missing')
      const body = group.userData.layers?.[0], image = body?.material?.map?.image
      return { visible: group.visible, frame: group.userData.frame, bodyFrame: body?.userData.hfxFrame,
        glowFrame: group.userData.glow?.userData.frame, atlas: image?.currentSrc || image?.src,
        width: image?.naturalWidth, height: image?.naturalHeight,
        visibleLayers: group.userData.layers?.filter(layer => layer.visible).length ?? 0 }
    }, giftId)

    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const menu = page.getByRole('dialog', { name: /^(Main menu|Start game)$/ })
    const logo = page.getByRole('dialog', { name: 'Opening logo', exact: true })
    await menu.or(logo).filter({ visible: true }).first().waitFor()
    if (await logo.isVisible()) await logo.getByRole('button', { name: 'Skip logo', exact: true }).click()
    const main = page.getByRole('dialog', { name: 'Main menu', exact: true })
    await main.waitFor()
    await main.getByRole('button', { name: 'New Game', exact: true }).click()
    const recommend = page.locator('[data-original-tutorial-recommendation]')
    const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
    await recommend.or(selector).filter({ visible: true }).first().waitFor()
    if (await recommend.isVisible()) await recommend.getByRole('button', { name: 'No', exact: true }).click()
    await selector.getByRole('button', { name: 'Browser controls', exact: true }).click()
    await selector.getByRole('button', { name: 'All missions', exact: true }).click()
    await button('Mission 4').click()
    await bind()
    await page.waitForFunction(() => window.testStore.getWorld().outcome.level === 4, undefined, { polling: 50 })
    const skip = page.getByRole('button', { name: /^Skip introduction/ })
    await page.waitForFunction(() => {
      const world = window.testStore.getWorld(), control = document.querySelector('button.skip-introduction')
      return !world.inputMask || (control && control.getClientRects().length && !control.disabled)
    }, undefined, { polling: 50 })
    if (await skip.isVisible()) await skip.click()
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask, undefined, { polling: 50 })
    await hold()
    report.renderer = await page.evaluate(() => {
      const gl = window.testSceneRef.current.renderer.getContext()
      if (!gl || gl.isContextLost()) throw Error('No functioning WebGL context')
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      return { version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER), dpr: devicePixelRatio }
    })
    report.before = await observe()
    assert.equal(report.before.shrine.active, true)
    assert.equal(report.before.unlockedTower, false)
    assert.equal(report.before.gifts.length, 0)
    await page.evaluate(() => {
      const scene = window.testSceneRef.current
      scene.focus(scene.world.shrines.find(value => value.kind === 'vault' && value.reward === 'tower'))
      scene.onChange()
    })
    await frame()
    report.marker = await presentation(null)
    assertTowerPresentation(report.marker)
    await capture('tower-before.png')
    await button('Select and focus shaman').click()
    check(); assert.ok(report.controlledFrames < 24000, 'Admit the zero-delta picker presentation visit')
    const target = await page.evaluate(() => {
      const scene = window.testSceneRef.current, world = window.testStore.getWorld()
      const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0)
      if (!shaman || world.selected.length !== 1 || world.selected[0] !== shaman.id) throw Error('Public Shaman selection failed')
      const vault = world.shrines.find(value => value.kind === 'vault' && value.reward === 'tower')
      scene.focus(vault); scene.onChange()
      // Zero-delta presentation visit, not direct renderer substitution.
      scene.animate(window.__towerClock)
      const mesh = scene.shrineMeshes.get(vault.id)?.g, point = scene.screen(mesh?.position ?? vault)
      const bounds = scene.container.getBoundingClientRect()
      const x = bounds.left + (point.x + 1) * bounds.width / 2, y = bounds.top + (1 - point.y) * bounds.height / 2
      for (let dy = -140; dy <= 60; dy += 4) for (let dx = -100; dx <= 100; dx += 4) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.picking.pickPerson(event) === null && scene.pickWorldObject(event)?.id === vault.id)
          return { x: event.clientX, y: event.clientY, shrine: vault.id, shaman: shaman.id }
      }
      throw Error('No exposed Tower Vault hit point')
    })
    report.controlledFrames++
    await page.mouse.click(target.x, target.y)
    report.target = target
    report.command = await page.evaluate(({ shrine, shaman }) => {
      const world = window.testStore.getWorld(), person = world.units.find(unit => unit.id === shaman)
      return { accepted: person?.work === shrine, lastOrderTurn: world.lastOrderTurn, selected: [...world.selected] }
    }, target)
    assert.equal(report.command.accepted, true, 'Trusted click must create ordinary Vault work')
    let acquired = await observe()
    while (!acquired.gifts.length) acquired = await frame(24, true)
    assertTowerGift(acquired)
    report.acquired = acquired
    report.giftPresentation = await presentation(acquired.gifts[0].id)
    assertTowerPresentation(report.giftPresentation)
    await capture('tower-gift.png')

    await button('Game settings').click()
    await button('Save Game').click()
    await button('Save checkpoint').click()
    await page.getByRole('dialog', { name: 'Game menu', exact: true }).getByRole('status').filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor()
    report.saved = await page.evaluate(async () => {
      if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) throw Error('Checkpoint database missing')
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('populous-new-dawn')
        request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Observer must not create storage')) }
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })
      try {
        const record = await new Promise((resolve, reject) => {
          const transaction = db.transaction('checkpoints', 'readonly'), request = transaction.objectStore('checkpoints').get('latest')
          transaction.oncomplete = () => resolve(request.result)
          transaction.onerror = () => reject(transaction.error)
          transaction.onabort = () => reject(transaction.error ?? Error('Read aborted'))
        })
        if (!record?.world) throw Error('No committed checkpoint')
        return window.__towerRead(record.world)
      } finally { db.close() }
    })
    assert.deepEqual(report.saved, acquired, 'Public Save must commit the captured pending gift')
    await button('Back').click()
    await button('Continue Game').click()
    report.beforeLoad = await frame(4)
    assertTowerGift(report.beforeLoad)
    assert.ok(report.beforeLoad.turn > report.saved.turn, 'Public resume must actually advance before Load')
    assert.ok(report.beforeLoad.gifts[0].remaining < report.saved.gifts[0].remaining, 'Live gift must differ from saved gift before Load')
    await button('Game settings').click()
    await button('Load Game').click()
    await page.evaluate(() => {
      const store = window.testStore, original = store.getWorld()
      window.__towerUnsubscribe = store.subscribe(() => {
        const current = store.getWorld()
        if (current === original) return
        window.__towerLoaded = window.__towerRead(current)
        window.__towerUnsubscribe(); window.__towerUnsubscribe = null
      })
    })
    await button('Load checkpoint').click()
    await page.waitForFunction(() => !!window.__towerLoaded, undefined, { polling: 50 })
    report.loaded = await page.evaluate(() => window.__towerLoaded)
    assertTowerRestore(report.saved, report.beforeLoad, report.loaded)
    await bind(); await hold()
    check(); assert.ok(report.controlledFrames < 24000, 'Admit the zero-delta restored presentation visit')
    await page.evaluate(() => {
      const scene = window.testSceneRef.current
      scene.focus(scene.world.shrines.find(value => value.kind === 'vault' && value.reward === 'tower'))
      scene.onChange(); scene.animate(window.__towerClock)
    })
    report.controlledFrames++
    report.loadedGiftPresentation = await presentation(acquired.gifts[0].id)
    assertTowerPresentation(report.loadedGiftPresentation)
    await capture('tower-loaded-gift.png')
    let completed = await observe()
    while (!completed.unlockedTower || completed.gifts.length) completed = await frame(24)
    // Retain one additional bounded 120-visit interval to expose immediate replay.
    for (let batch = 0; batch < 5; batch++) completed = await frame(24)
    report.completed = completed
    assertTowerContinuation(report.saved, report.loaded, completed, report.observedGiftIds)
    await page.getByRole('button', { name: /^buildings B/ }).click()
    assert.equal(await button('Guard Tower, 5 wood').isEnabled(), true)
    await capture('tower-unlocked.png')
    report.inputEvents = await page.evaluate(() => window.__towerInputs)
    assert.ok(report.inputEvents.some(event => event.trusted && event.canvas &&
      Math.abs(event.x - target.x) < 1 && Math.abs(event.y - target.y) < 1), 'Tower click must be a trusted canvas input')
    for (const label of ['Save checkpoint', 'Load checkpoint'])
      assert.ok(report.inputEvents.some(event => event.trusted && event.label === label), `Missing trusted ${label} input`)
    assert.deepEqual(report.errors, [])
    report.checks.push('Trusted Tower command and actual marker/gift atlas', 'Public Save commits pending gift', 'Public Load restores committed Tower state', 'Restored gift completes and Guard Tower control unlocks without second observed gift')
    report.status = 'passed'
  } catch (error) {
    failed = true; primary = error
    report.status = 'failed'; report.failure = String(error)
  } finally {
    try { await context?.close(); report.cleanupVerified = true }
    catch (error) { report.cleanupError = String(error); report.status = 'failed'; if (!failed) { failed = true; primary = error } }
    try { check(); assert.deepEqual(report.errors, [], 'Late browser errors invalidate the episode') }
    catch (error) { report.status = 'failed'; report.terminalFailure = String(error); if (!failed) { failed = true; primary = error } }
    try { saveReport() }
    catch (error) { report.status = 'failed'; report.receiptFailure = String(error); if (!failed) { failed = true; primary = error } }
  }
  if (failed) throw primary
  return report
}
