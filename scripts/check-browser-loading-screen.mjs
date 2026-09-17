import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const url = process.env.POPULOUS_URL ?? 'http://localhost:3000'

async function bindStoreOnly(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    if (!main) return false
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld) {
          globalThis.loadingTestStore = hook.memoizedState
          return true
        }
    return false
  })
}

async function bindInternals(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    if (!main) return false
    const scenes = [], stores = []
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        if (hook.memoizedState?.current?.unitMeshes) scenes.push(hook.memoizedState)
        if (hook.memoizedState?.getWorld) stores.push(hook.memoizedState)
      }
    for (const store of stores) {
      const sceneRef = scenes.find(ref => ref.current?.world === store.getWorld())
      if (!sceneRef?.current) continue
      globalThis.loadingTestStore = store
      globalThis.loadingTestSceneRef = sceneRef
      globalThis.loadingTestScene = sceneRef.current
      return true
    }
    return false
  })
}

async function snapshot(page) {
  await bindInternals(page)
  return page.evaluate(() => {
    const store = globalThis.loadingTestStore,
      scene = globalThis.loadingTestSceneRef.current,
      world = store.getWorld()
    return {
      level: world.outcome.level,
      paused: world.paused,
      turn: world.turn,
      time: world.time,
      randomState: world.randomState,
      cosmeticRandomState: world.cosmeticRandom.randomState,
      flyby: structuredClone(world.flyby),
      mode: world.mode,
      selected: [...world.selected],
      camera: {
        position: { ...scene.cameraPosition },
        bearing: scene.cameraBearing,
        time: scene.cameraTime,
        viewPoint: { ...scene.viewPoint },
      },
      scene: {
        started: scene.started,
        disposed: scene.disposed,
        previous: scene.previous,
        frame: scene.frame,
        keys: [...scene.keys].sort(),
      },
    }
  })
}

async function waitForCount(read, expected, timeout = 10000) {
  const end = Date.now() + timeout
  while (read() < expected && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 25))
  assert.ok(read() >= expected, `expected count ${expected}, got ${read()}`)
}

async function selectMission(page, mission) {
  const button = page.getByRole('button', { name: `Mission ${mission}`, exact: true })
  await button.waitFor()
  await button.focus()
  await page.keyboard.press('Enter')
}

async function skipIntroduction(page) {
  const button = page.getByRole('button', { name: /Skip introduction/ })
  await button.waitFor()
  await button.click()
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
}

async function assertPendingFrozen(page, expectedLevel, holdMs = 1200) {
  await page.locator('.world-viewport canvas.battlefield').waitFor()
  const before = await snapshot(page)
  assert.equal(before.level, expectedLevel)
  assert.equal(before.scene.started, false)
  assert.equal(before.scene.previous, null)
  assert.equal(before.scene.frame, 0)
  assert.equal(await page.locator('.loading-world').count(), 1)

  // Real scene camera input is not installed yet.
  await page.keyboard.press('ArrowRight')
  // The HUD is visibly outside the loading overlay, so its own React actions must also be gated.
  const buildings = page.getByRole('button', { name: 'buildings B', exact: true })
  await buildings.click()
  assert.equal(await buildings.getAttribute('aria-pressed'), 'false')
  // The native minimap pointer listener is likewise inactive until readiness.
  await page.getByLabel('Minimap. Click to move the camera.').click({ position: { x: 50, y: 48 } })
  await page.waitForTimeout(holdMs)

  const after = await snapshot(page)
  assert.deepEqual(
    {
      paused: after.paused,
      turn: after.turn,
      time: after.time,
      randomState: after.randomState,
      cosmeticRandomState: after.cosmeticRandomState,
      flyby: after.flyby,
      mode: after.mode,
      selected: after.selected,
      camera: after.camera,
      scene: after.scene,
    },
    {
      paused: before.paused,
      turn: before.turn,
      time: before.time,
      randomState: before.randomState,
      cosmeticRandomState: before.cosmeticRandomState,
      flyby: before.flyby,
      mode: before.mode,
      selected: before.selected,
      camera: before.camera,
      scene: before.scene,
    },
    'pending load advanced simulation/flyby/camera/RNG or accepted interaction'
  )
  return before
}

async function finishHeldLoad(page, hold, frozen, expectedLevel) {
  const releasedAt = Date.now()
  hold.release()
  await page.locator('.loading-world').waitFor({ state: 'detached' })
  await bindGame(page)
  const ready = await page.evaluate(() => ({
    level: globalThis.testStore.getWorld().outcome.level,
    paused: globalThis.testStore.getWorld().paused,
    turn: globalThis.testStore.getWorld().turn,
    time: globalThis.testStore.getWorld().time,
    speed: globalThis.testStore.getWorld().speed,
    started: globalThis.testScene.started,
    previous: globalThis.testScene.previous,
  }))
  const playableWallSeconds = (Date.now() - releasedAt) / 1000,
    maximumOrdinaryAdvance = playableWallSeconds * ready.speed + 0.5
  assert.equal(ready.level, expectedLevel)
  assert.equal(ready.started, true)
  assert.ok(ready.previous !== null, ready)
  assert.ok(
    ready.time - frozen.time <= maximumOrdinaryAdvance,
    { frozen, ready, playableWallSeconds, maximumOrdinaryAdvance }
  )
  assert.ok(
    ready.turn - frozen.turn <= Math.ceil(maximumOrdinaryAdvance * 12) + 2,
    { frozen, ready, playableWallSeconds, maximumOrdinaryAdvance }
  )
  if (!ready.paused) {
    await page.waitForTimeout(250)
    const later = await page.evaluate(() => globalThis.testStore.getWorld().time)
    assert.ok(later > ready.time, { ready: ready.time, later })
  }
  return ready
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      pageErrors.push(message.text())
  })

  let activeHold = null
  let failLandscape = false
  const beginHold = () => {
    let releaseGate
    const hold = {
      count: 0,
      gate: new Promise(resolve => { releaseGate = resolve }),
      release: () => {
        if (activeHold === hold) activeHold = null
        releaseGate()
      },
    }
    activeHold = hold
    return hold
  }
  await page.route('**/original/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    if (failLandscape && pathname.endsWith('/landscape.bin')) {
      failLandscape = false
      await route.abort('failed')
      return
    }
    const hold = activeHold
    if (
      hold &&
      (pathname.endsWith('/landscape.bin') || pathname.endsWith('/waves.bin'))
    ) {
      hold.count++
      await hold.gate
    }
    try { await route.continue() } catch {}
  })

  // Cold Mission 1: real resources stay pending while every gameplay clock/input surface remains inert.
  await page.goto(url, { waitUntil: 'networkidle' })
  let hold = beginHold()
  await selectMission(page, 1)
  await waitForCount(() => hold.count, 2)
  const cold = await assertPendingFrozen(page, 1)
  await page.setViewportSize({ width: 1100, height: 700 })
  const loadingBox = await page.locator('.loading-world').boundingBox()
  assert.ok(loadingBox && loadingBox.height >= 699 && loadingBox.width > 500, loadingBox)
  await finishHeldLoad(page, hold, cold, 1)
  await skipIntroduction(page)

  // Restart is a normal entry path and gets exactly the same dormant-before-ready lifecycle.
  await page.getByRole('button', { name: 'Game settings' }).click()
  hold = beginHold()
  await page.getByRole('button', { name: 'Restart world', exact: true }).click()
  await waitForCount(() => hold.count, 2)
  const restarted = await assertPendingFrozen(page, 1, 300)
  assert.equal(restarted.paused, false)
  await finishHeldLoad(page, hold, restarted, 1)
  await skipIntroduction(page)

  // Continue uses the shipped result button; only the outcome prerequisite is bounded here.
  await page.evaluate(() => {
    // Stop the completed world's renderer only long enough to expose the shipped result action;
    // Continue itself still owns the Mission 2 transition and new-scene lifecycle.
    cancelAnimationFrame(globalThis.testScene.frame)
    globalThis.testScene.frame = 0
    const world = globalThis.testStore.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    globalThis.testStore.update()
  })
  hold = beginHold()
  await page.getByRole('button', { name: /Continue to Mission 2/ }).click()
  await waitForCount(() => hold.count, 2)
  const continued = await assertPendingFrozen(page, 2, 300)
  await finishHeldLoad(page, hold, continued, 2)
  await skipIntroduction(page)

  // A stale pending restart must abort/dispose without ever installing input or RAF.
  await page.getByRole('button', { name: 'Game settings' }).click()
  hold = beginHold()
  await page.getByRole('button', { name: 'Restart world', exact: true }).click()
  await waitForCount(() => hold.count, 2)
  await bindInternals(page)
  await page.evaluate(() => { globalThis.staleLoadingScene = globalThis.loadingTestScene })
  activeHold = null
  await page.evaluate(() => globalThis.loadingTestStore.startMission(3))
  hold.release()
  await page.locator('.loading-world').waitFor({ state: 'detached' })
  await bindGame(page)
  assert.equal(await page.evaluate(() => globalThis.testStore.getWorld().outcome.level), 3)
  assert.deepEqual(
    await page.evaluate(() => ({
      started: globalThis.staleLoadingScene.started,
      disposed: globalThis.staleLoadingScene.disposed,
      aborted: globalThis.staleLoadingScene.terrainLoad.signal.aborted,
      frame: globalThis.staleLoadingScene.frame,
    })),
    { started: false, disposed: true, aborted: true, frame: 0 }
  )
  await skipIntroduction(page)

  // Keep the original direct Mission retry coverage: a critical resource failure retries Mission 3.
  await page.reload({ waitUntil: 'networkidle' })
  failLandscape = true
  await selectMission(page, 3)
  await page.getByRole('heading', { name: 'The world could not awaken' }).waitFor()
  await bindStoreOnly(page)
  assert.equal(await page.evaluate(() => globalThis.loadingTestStore.getWorld().outcome.level), 3)
  await page.getByRole('button', { name: 'Try again' }).click()
  await page.locator('.loading-world').waitFor({ state: 'detached' })
  await bindGame(page)
  assert.equal(await page.evaluate(() => globalThis.testStore.getWorld().outcome.level), 3)
  await skipIntroduction(page)

  // A checkpoint saved while paused still follows existing shipped intent: Load Game resumes it
  // unpaused, but no turn/RNG/flyby/camera activity begins while its resources remain pending.
  const pausedSaved = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld()
    world.paused = true
    globalThis.testStore.update()
    await globalThis.testStore.saveCheckpoint()
    return { turn: world.turn, time: world.time, level: world.outcome.level }
  })
  await page.reload({ waitUntil: 'networkidle' })
  hold = beginHold()
  const loadPaused = page.getByRole('button', { name: 'Load Game', exact: true })
  await loadPaused.waitFor()
  await loadPaused.focus()
  await page.keyboard.press('Enter')
  await waitForCount(() => hold.count, 2)
  const pausedCheckpoint = await assertPendingFrozen(page, pausedSaved.level, 300)
  assert.equal(pausedCheckpoint.paused, false)
  assert.equal(pausedCheckpoint.turn, pausedSaved.turn)
  assert.equal(pausedCheckpoint.time, pausedSaved.time)
  await finishHeldLoad(page, hold, pausedCheckpoint, pausedSaved.level)

  // Save an unpaused checkpoint, fail its first terrain load, mutate the failed world, and verify
  // Try again reloads the exact checkpoint rather than merely restarting the current mission.
  const unpausedSaved = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld()
    world.paused = false
    world.shots.blast = 17
    const expected = { level: world.outcome.level, blast: world.shots.blast, paused: world.paused }
    globalThis.testStore.update()
    await globalThis.testStore.saveCheckpoint()
    return expected
  })
  await page.reload({ waitUntil: 'networkidle' })
  failLandscape = true
  const loadUnpaused = page.getByRole('button', { name: 'Load Game', exact: true })
  await loadUnpaused.waitFor()
  await loadUnpaused.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'The world could not awaken' }).waitFor()
  await bindStoreOnly(page)
  const failedCheckpoint = await page.evaluate(() => {
    const world = globalThis.loadingTestStore.getWorld()
    return { level: world.outcome.level, blast: world.shots.blast, paused: world.paused }
  })
  assert.deepEqual(failedCheckpoint, unpausedSaved)
  await page.evaluate(() => {
    globalThis.loadingTestStore.change(world => { world.shots.blast = 3 })
  })
  hold = beginHold()
  await page.getByRole('button', { name: 'Try again' }).click()
  await waitForCount(() => hold.count, 2)
  await bindStoreOnly(page)
  assert.equal(await page.evaluate(() => globalThis.loadingTestStore.getWorld().shots.blast), 17)
  const retriedCheckpoint = await assertPendingFrozen(page, unpausedSaved.level, 300)
  assert.equal(retriedCheckpoint.paused, false)
  await finishHeldLoad(page, hold, retriedCheckpoint, unpausedSaved.level)

  assert.deepEqual(pageErrors, [])
  await context.close()
  console.log(
    'PASS: delayed loading freezes simulation/RNG/flyby/camera and blocks camera/HUD/minimap input; activation has no catch-up, restart/Continue/checkpoint lifecycle works, stale loads never start, and mission/checkpoint retries preserve request identity'
  )
} finally {
  await browser.close()
}
