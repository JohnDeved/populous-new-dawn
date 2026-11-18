import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Real-clock Mission 5 startup. Observers never mutate World, clock or storage.
export default async function ({ page, root, output, receipt, openMission, observeCheckpoint, signal }) {
  assert.ok(receipt.profile, 'Requires a task-owned persistent profile')
  const { bindGame, collapseCampaignMessages } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { waitForCheckpointReadback } = await import(pathToFileURL(resolve(root, 'scripts/checkpoint-readback.mjs')).href)
  await page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
    for (; fiber && !store; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
    if (!store) throw Error('Store unavailable before mission start')
    window.singleMarkerTrace = { first: {}, last: {}, guardViolations: [], errors: [] }
    window.singleMarkerUnsubscribe = store.subscribe(() => {
      try {
        const w = store.getWorld(), trace = window.singleMarkerTrace
        if (w.outcome.level !== 5) return
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
  let saved
  if (receipt.profile.mode === 'created') {
    await openMission(5)
    await collapseCampaignMessages(page)
  } else {
    saved = receipt.profile.checkpointAtStart
    assert.equal(saved.level, 5)
    assert.ok(receipt.profile.previousRun.cleanupVerified)
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
    await bindGame(page)
    await collapseCampaignMessages(page)
  }
  if (await page.getByRole('button', { name: 'Resume game', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Resume game', exact: true }).click()
  if (receipt.profile.mode === 'created') {
    await page.waitForFunction(() => window.testStore.getWorld().turn >= 65, null, { timeout: 90000 })
    await page.getByRole('button', { name: 'Pause game', exact: true }).click()
    const dispatch = await page.evaluate(() => structuredClone(window.singleMarkerTrace))
    assert.ok(Object.keys(dispatch.first).length > 0, 'Natural single-marker move must be observed')
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
  await page.screenshot({ path: resolve(output, 'single-marker-resumed-preaching.png') })
  return { phase: 'loaded-and-resumed-preaching', trace, saved, method: 'Shipped Load and real RAF; no state/tick/storage injection.' }
}
