import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'
import { checkpointObservation, readCommittedCheckpoint } from './checkpoint-observer.mjs'

// Actual Home and committed UI save. Only the real landscape requests and the
// explicitly labeled discarded-world mutations below are controlled by the test.
export default async function ({ page, output }) {
  const button = name => page.getByRole('button', { name, exact: true })
  const report = { status: 'running', attempts: [], pageErrors: [], crashes: 0 }
  const saveReport = () => writeFileSync(resolve(output, 'checkpoint-loading-retry.json'), JSON.stringify(report, null, 2) + '\n')
  page.on('pageerror', error => report.pageErrors.push(String(error)))
  page.on('crash', () => { report.crashes++; saveReport() })
  let requests = 0, wavesRequests = 0
  const gates = []
  try {
    await page.setViewportSize({ width: 1280, height: 800 })
    await openCampaignFromMainMenu(page)
    await button('Start Mission 1').click()
    await bindGame(page)
    await skipIntroductionWithSpace(page, { timeout: 45000 })
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await page.waitForFunction(() => window.testStore.getWorld().turn > 0)
    report.landscape = await page.evaluate(() => window.testScene.environment.landscape.terrain)
    await button('Menu').click()
    const savedTurn = await page.evaluate(() => window.testStore.getWorld().turn)
    await button('Save Game').click()
    await button('Save checkpoint').click()
    await page.getByText('Checkpoint saved in this browser.', { exact: true }).waitFor()
    report.saved = await readCommittedCheckpoint(page)
    assert.equal(report.saved.turn, savedTurn)
    assert.equal(report.saved.level, 1)
    await page.screenshot({ path: resolve(output, 'committed-save.png') })

    // A fresh document reads the committed checkpoint. The three load attempts
    // below then remain in this one page/context, without storageState injection.
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
    assert.deepEqual(await readCommittedCheckpoint(page), report.saved)
    await page.route(`**/original/${report.landscape}`, async route => {
      requests++
      const action = await new Promise(resolve => gates.push(resolve))
      if (action === 'fail') await route.abort('failed')
      else await route.continue()
    })
    await page.route('**/original/waves.bin', async route => {
      wavesRequests++
      await route.continue()
    })
    await page.evaluate(version => {
      const main = document.querySelector('main')
      let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
      for (; fiber && !store; fiber = fiber.return)
        for (let hook = fiber.memoizedState; hook; hook = hook.next)
          if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
      if (!store) throw Error('Home store unavailable')
      window.checkpointRetryStore = store
      window.checkpointRetryWorlds = []
      window.checkpointRetryScenes = []
      window.checkpointRetryBoundaries = []
      let previous = store.getWorld()
      window.unsubscribeCheckpointRetry = store.subscribe(() => {
        const world = store.getWorld()
        if (world === previous) return
        previous = world
        window.checkpointRetryWorlds.push(world)
        window.checkpointRetryBoundaries.push({ version, world: structuredClone(world) })
      })
    }, report.saved.version)
    await button('Load Game').click()
    for (let attempt = 1; attempt <= 3; attempt++) {
      await page.locator('[data-loading-phase="loading"]').waitFor()
      await page.waitForFunction(expected => {
        const main = document.querySelector('main')
        let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
        for (; fiber; fiber = fiber.return)
          for (let hook = fiber.memoizedState; hook; hook = hook.next) {
            const scene = hook.memoizedState?.current
            if (scene?.terrainLoad && scene.world === window.checkpointRetryStore.getWorld() &&
              !window.checkpointRetryScenes.includes(scene)) window.checkpointRetryScenes.push(scene)
          }
        return window.checkpointRetryScenes.length === expected && window.checkpointRetryWorlds.length === expected
      }, attempt)
      const deadline = Date.now() + 10000
      while (requests < attempt && Date.now() < deadline) await page.waitForTimeout(25)
      assert.equal(requests, attempt)
      await page.evaluate(() => { window.checkpointRetryBoundary = window.checkpointRetryBoundaries.at(-1) })
      const boundary = await page.evaluate(checkpointObservation, { observationName: 'checkpointRetryBoundary' })
      for (const field of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
        assert.deepEqual(boundary[field], report.saved[field], `attempt ${attempt}: saved ${field}`)
      const snapshot = () => page.evaluate(() => {
        const scene = window.checkpointRetryScenes.at(-1), world = window.checkpointRetryStore.getWorld()
        return { level: world.outcome.level, turn: world.turn, time: world.time,
          randomState: world.randomState, cosmeticRandomState: world.cosmeticRandom.randomState,
          paused: world.paused, phase: document.querySelector('.loading-world')?.dataset.loadingPhase,
          started: scene.started, disposed: scene.disposed, aborted: scene.terrainLoad.signal.aborted,
          previous: scene.previous, frame: scene.frame, canvasConnected: scene.renderer.domElement.isConnected,
          ownsWorld: scene.world === world, worldCount: new Set(window.checkpointRetryWorlds).size,
          sceneCount: new Set(window.checkpointRetryScenes).size,
          oldDisposed: window.checkpointRetryScenes.slice(0, -1).every(s => s.disposed && s.terrainLoad.signal.aborted && !s.renderer.domElement.isConnected) }
      })
      const before = await snapshot()
      assert.equal(before.level, 1)
      assert.equal(before.turn, report.saved.turn)
      assert.equal(before.time, report.saved.time)
      assert.equal(before.phase, 'loading')
      assert.equal(before.paused, false)
      assert.equal(before.started, false)
      assert.equal(before.previous, null)
      assert.equal(before.frame, 0)
      assert.equal(before.disposed, false)
      assert.equal(before.aborted, false)
      assert.equal(before.canvasConnected, true)
      assert.equal(before.ownsWorld, true)
      assert.equal(before.worldCount, attempt)
      assert.equal(before.sceneCount, attempt)
      assert.equal(before.oldDisposed, true)
      await page.waitForTimeout(1200)
      assert.deepEqual(await snapshot(), before, 'held checkpoint load must stay frozen')
      const observation = { attempt, boundary, pending: before, holdMs: 1200 }
      report.attempts.push(observation)
      saveReport()
      await page.screenshot({ path: resolve(output, `checkpoint-loading-${attempt}.png`) })
      if (attempt === 3) await page.evaluate(() => { window.checkpointRetryReleasedAt = performance.now() })
      gates[attempt - 1](attempt < 3 ? 'fail' : 'continue')
      if (attempt === 3) break
      await page.getByRole('heading', { name: 'Loading failed', exact: true }).waitFor()
      observation.failed = await snapshot()
      assert.equal(observation.failed.disposed, true)
      assert.equal(observation.failed.aborted, true)
      assert.equal(observation.failed.canvasConnected, false)
      assert.equal(await button('Try again').evaluate(el => el === document.activeElement), true)
      observation.injectedFailedWorldMutation = await page.evaluate(n => {
        const world = window.checkpointRetryStore.getWorld()
        const before = { blast: world.shots.blast, turn: world.turn, time: world.time, hp: world.units[0].hp }
        world.shots.blast += 100 + n
        world.turn += 1000 + n
        world.time = world.turn / 12
        world.units[0].hp = -n
        return { before, after: { blast: world.shots.blast, turn: world.turn, time: world.time, hp: world.units[0].hp } }
      }, attempt)
      assert.deepEqual(await readCommittedCheckpoint(page), report.saved, 'failed-world mutation must not change persisted checkpoint')
      await page.screenshot({ path: resolve(output, `checkpoint-failed-${attempt}.png`) })
      observation.retryInput = attempt === 1 ? 'Enter' : 'pointer'
      saveReport()
      if (attempt === 1) await page.keyboard.press('Enter')
      else await button('Try again').click()
    }
    await page.locator('.loading-world').waitFor({ state: 'detached' })
    await bindGame(page)
    report.activated = await page.evaluate(() => {
      const scene = window.testScene, world = window.testStore.getWorld()
      return { thirdScene: scene === window.checkpointRetryScenes[2], ownsWorld: scene.world === world,
        level: world.outcome.level, time: world.time, turn: world.turn, speed: world.speed,
        paused: world.paused, started: scene.started, disposed: scene.disposed,
        elapsedSinceRelease: (performance.now() - window.checkpointRetryReleasedAt) / 1000 }
    })
    assert.equal(report.activated.thirdScene, true)
    assert.equal(report.activated.ownsWorld, true)
    assert.equal(report.activated.level, report.saved.level)
    assert.equal(report.activated.paused, false)
    assert.equal(report.activated.started, true)
    assert.equal(report.activated.disposed, false)
    assert.ok(report.activated.time - report.saved.time <= report.activated.elapsedSinceRelease * report.activated.speed + 1 / 12,
      'loaded checkpoint must not catch up held loading time; allow its saved fractional turn')
    await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, report.activated.turn)
    report.advancedTurn = await page.evaluate(() => window.testStore.getWorld().turn)
    await page.waitForTimeout(500)
    assert.equal(requests, 3, 'no fourth landscape request')
    assert.equal(wavesRequests, 3, 'one waves request per scene')
    assert.deepEqual(await readCommittedCheckpoint(page), report.saved, 'load/retry must preserve committed save')
    assert.deepEqual(report.pageErrors, [])
    assert.equal(report.crashes, 0)
    await page.screenshot({ path: resolve(output, 'checkpoint-recovered.png') })
    report.status = 'passed'
    return report
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    throw error
  } finally {
    report.landscapeRequests = requests
    report.wavesRequests = wavesRequests
    saveReport()
    if (!page.isClosed()) await page.evaluate(() => window.unsubscribeCheckpointRetry?.()).catch(() => {})
  }
}
