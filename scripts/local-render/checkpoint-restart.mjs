import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkpointObservation } from './checkpoint-observer.mjs'

// Run twice with the same --profile/origin/source and separate output paths.
// First run saves via UI and exits; the second uses shipped Load Game.
export default async function ({ page, root, output, receipt, openMission, observeCheckpoint, signal }) {
  assert.ok(receipt.profile, 'This scenario requires --profile')
  const { bindGame, waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { waitForCheckpointReadback } = await import(pathToFileURL(resolve(root, 'scripts/checkpoint-readback.mjs')).href)
  const method = 'Ordinary UI and real RAF only. Committed IndexedDB and store subscription are read-only observations. No world/tick/storage injection.'
  if (receipt.profile.mode === 'created') {
    assert.equal(receipt.profile.checkpointAtStart, null)
    await openMission(1)
    const readiness = await waitForShamanReadiness(page)
    await page.getByRole('button', { name: 'Game settings', exact: true }).click()
    const menu = page.locator('dialog.game-dialog')
    await menu.waitFor({ state: 'visible' })
    const savedTurn = await page.evaluate(() => window.testStore.getWorld().turn)
    await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
    let observed
    assert.equal(await waitForCheckpointReadback(async () => {
      signal.throwIfAborted()
      observed = await observeCheckpoint('UI save committed')
      return observed.checkpoint?.turn === savedTurn && observed.checkpoint?.level === 1
    }), true, 'Shipped Save must commit the paused checkpoint')
    await page.screenshot({ path: resolve(output, 'saved-settings.png') })
    return { phase: 'saved-before-browser-termination', method, readiness, saved: observed }
  }
  const saved = receipt.profile.checkpointAtStart
  assert.ok(saved && saved.level === 1, 'Restart proof needs the first run’s genuine Mission 1 save')
  assert.ok(receipt.profile.previousRun.cleanupVerified)
  // Capture the replacement synchronously, before normal Load auto-resume and
  // asynchronous scene readiness can advance real turns. Only observe, never pause
  // or replace the world through the model/store API.
  await page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
    for (; fiber && !store; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
    if (!store) throw Error('Store unavailable before public Load')
    const before = store.getWorld()
    window.restartCheckpointBoundary = null
    window.restartCheckpointObservationError = null
    const unsubscribe = store.subscribe(() => {
      const w = store.getWorld()
      if (w === before) return
      try { window.restartCheckpointBoundary = { version: 1, world: structuredClone(w) } }
      catch (error) { window.restartCheckpointObservationError = String(error) }
      finally { unsubscribe() }
    })
  })
  await page.getByRole('dialog', { name: 'Start game', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
  assert.equal(await page.evaluate(() => window.restartCheckpointObservationError), null, 'Load-boundary observer must not interfere with shipped resume')
  const loaded = await page.evaluate(checkpointObservation, { observationName: 'restartCheckpointBoundary' })
  for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256']) assert.deepEqual(loaded[key], saved[key], `Load boundary ${key} must match the committed save`)
  await bindGame(page)
  const resumed = await page.evaluate(() => ({ turn: window.testStore.getWorld().turn, paused: window.testStore.getWorld().paused }))
  assert.equal(resumed.paused, false, 'Shipped Load resumes the normal clock')
  await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, saved.turn)
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.screenshot({ path: resolve(output, 'loaded-paused.png') })
  const observed = await observeCheckpoint('After shipped Load')
  assert.equal(observed.checkpoint.checkpointSha256, saved.checkpointSha256, 'Loading must not replace the committed save')
  return { phase: 'loaded-after-browser-restart', method, saved, loaded, resumed, normalAutoResume: true, priorRun: receipt.profile.previousRun.runId }
}
