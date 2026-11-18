import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkpointObservation } from './checkpoint-observer.mjs'

// Pure map projection finds a public minimap click; the camera changes only via UI.
async function focusPreacher(page, id) {
  const target = await page.evaluate(async id => {
    const { nativePosition } = await import('/app/model.ts')
    const { minimapPick } = await import('/app/minimap.ts')
    const scene = window.testSceneRef.current, w = scene.world
    const u = w.units.find(u => u.id === id)
    if (!u) throw Error('Observed Preacher disappeared before camera focus')
    const goal = nativePosition(w, u), center = nativePosition(w, scene.viewPoint)
    const width = scene.mini.width, height = scene.mini.height
    const heading = Math.round(scene.cameraBearing * 1024 / Math.PI)
    const delta = (a, b) => ((a - b + 32768) & 65535) - 32768
    let best = { distance: Infinity }
    for (let y = 1; y < height; y += 2) for (let x = 1; x < width; x += 2) {
      const p = minimapPick(width, height, center, heading, { x, y })
      const distance = Math.hypot(delta(p.x, goal.x), delta(p.y, goal.y))
      if (distance < best.distance) best = { distance, x: x / width, y: y / height }
    }
    return { ...best, id, goal }
  }, id)
  assert.ok(target.distance < 2048, 'Public minimap projection must reach the observed person')
  const box = await page.getByLabel('Minimap. Click to move the camera.', { exact: true }).boundingBox()
  await page.mouse.click(box.x + box.width * target.x, box.y + box.height * target.y)
  await page.waitForFunction(({ id }) => {
    const s = window.testSceneRef.current, u = s.world.units.find(u => u.id === id)
    const wrap = n => ((n + 384) % 256) - 128
    return Math.hypot(wrap(s.viewPoint.x - u.x), wrap(s.viewPoint.z - u.z)) < 10
  }, target, { timeout: 10000 })
  return target
}

// Real-clock Mission 5 startup. Observers never mutate World, clock or storage.
export default async function ({ page, root, output, receipt, observeCheckpoint, signal }) {
  assert.ok(receipt.profile, 'Requires a task-owned persistent profile')
  const { bindGame, collapseCampaignMessages, showAllMissions } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { waitForCheckpointReadback } = await import(pathToFileURL(resolve(root, 'scripts/checkpoint-readback.mjs')).href)
  await page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
    for (; fiber && !store; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
    if (!store) throw Error('Store unavailable before mission start')
    const before = store.getWorld()
    window.singleMarkerBoundary = null
    window.singleMarkerTrace = { first: {}, last: {}, guardViolations: [], errors: [] }
    window.singleMarkerUnsubscribe = store.subscribe(() => {
      try {
        const w = store.getWorld(), trace = window.singleMarkerTrace
        if (w.outcome.level !== 5) return
        if (w !== before && !window.singleMarkerBoundary)
          window.singleMarkerBoundary = { version: 4, world: structuredClone(w) }
        for (const u of w.units) {
          if (u.team !== 'red' || u.kind !== 'preacher') continue
          const p = u.native ?? u.entry?.person
          if (!p) continue
          const orders = p.commands.filter(Boolean).map(id => w.buildingOrders.records[id].model)
          const row = { id: u.id, turn: w.turn, x: u.x, z: u.z, orders }
          if (orders.includes(3) && !trace.first[u.id]) trace.first[u.id] = row
          if (trace.first[u.id]) {
            trace.last[u.id] = row
            if (orders.includes(11) && trace.guardViolations.length < 10) trace.guardViolations.push(row)
          }
        }
      } catch (error) { window.singleMarkerTrace.errors.push(String(error)) }
    })
  })
  let saved, loaded
  if (receipt.profile.mode === 'created') {
    // Avoid the generic optional-introduction 45s wait: it would miss this
    // authored early move. These are the same shipped selector controls.
    await showAllMissions(page)
    await page.getByRole('button', { name: 'Mission 5', exact: true }).click()
    await bindGame(page)
    const skip = page.locator('.skip-introduction')
    if (await skip.isVisible()) await skip.click()
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await collapseCampaignMessages(page)
  } else {
    saved = receipt.profile.checkpointAtStart
    assert.equal(saved.level, 5)
    assert.ok(receipt.profile.previousRun.cleanupVerified)
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
    loaded = await page.evaluate(checkpointObservation, { observationName: 'singleMarkerBoundary' })
    for (const key of ['version', 'level', 'turn', 'time', 'checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256'])
      assert.deepEqual(loaded[key], saved[key], `Load boundary ${key} matches committed save`)
    await bindGame(page)
    await collapseCampaignMessages(page)
  }
  if (await page.getByRole('button', { name: 'Resume game', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Resume game', exact: true }).click()
  if (receipt.profile.mode === 'created') {
    await page.waitForFunction(() => window.testStore.getWorld().turn >= 65, null, { timeout: 90000 })
    await page.getByRole('button', { name: 'Pause game', exact: true }).click()
    const dispatch = await page.evaluate(() => structuredClone(window.singleMarkerTrace))
    assert.deepEqual(dispatch.errors, [])
    assert.deepEqual(dispatch.guardViolations, [])
    assert.ok(Object.values(dispatch.last).some(row => row.orders.includes(3)), 'Save must capture a still-active natural single-marker move')
    receipt.movementCamera = await focusPreacher(page, Object.values(dispatch.last).find(row => row.orders.includes(3)).id)
    await page.screenshot({ path: resolve(output, 'single-marker-moving.png') })
    await page.getByRole('button', { name: 'Game settings', exact: true }).click()
    const menu = page.locator('dialog[data-original-pause-menu]')
    await menu.waitFor({ state: 'visible' })
    const savedTurn = await page.evaluate(() => window.testStore.getWorld().turn)
    await menu.getByRole('button', { name: 'Save Game', exact: true }).click()
    await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
    assert.equal(await waitForCheckpointReadback(async () => {
      signal.throwIfAborted()
      saved = (await observeCheckpoint('Natural single-marker movement saved')).checkpoint
      return saved?.level === 5 && saved.turn === savedTurn
    }), true)
    await page.screenshot({ path: resolve(output, 'single-marker-saved.png') })
    await page.evaluate(() => window.singleMarkerUnsubscribe())
    return { phase: 'saved-natural-single-marker-movement', dispatch, saved, method: 'Ordinary UI and real RAF; read-only store observation, no world/tick injection.' }
  }
  await page.waitForFunction(() => window.testStore.getWorld().turn >= 150, null, { timeout: 90000 })
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  const trace = await page.evaluate(() => { window.singleMarkerUnsubscribe(); return structuredClone(window.singleMarkerTrace) })
  assert.deepEqual(trace.errors, [])
  assert.deepEqual(trace.guardViolations, [])
  assert.ok(Object.entries(trace.first).some(([id, first]) => {
    const last = trace.last[id]
    return last.orders.includes(17) && Math.hypot(last.x - first.x, last.z - first.z) > 10
  }), 'Loaded natural move must travel and return to preaching, without guard')
  const retained = (await observeCheckpoint('After ordinary Load continuation')).checkpoint
  assert.equal(retained.checkpointSha256, saved.checkpointSha256)
  receipt.continuationCamera = await focusPreacher(page, Number(Object.keys(trace.first).find(id => trace.last[id].orders.includes(17))))
  await page.screenshot({ path: resolve(output, 'single-marker-resumed-preaching.png') })
  return { phase: 'loaded-and-resumed-preaching', trace, saved, loaded, method: 'Shipped Load and real RAF; no state/tick/storage injection.' }
}
