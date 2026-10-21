import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { readCommittedCheckpoint } from './checkpoint-observer.mjs'

// External browser evidence only. This controls GameScene RAF delivery, not
// production methods, model state, checkpoint contents, input handlers or timers.
// Other RAF users (React, actionability, screenshots) retain normal scheduling.
function holdSceneFrames() {
  if (window.cameraEvidenceScheduler) return
  const request = window.requestAnimationFrame.bind(window)
  window.cameraEvidenceScheduler = { held: 0 }
  window.requestAnimationFrame = callback => {
    const id = request(callback)
    const main = document.querySelector('main')
    let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const scene = hook.memoizedState?.current
        if (scene?.animate === callback && scene?.world?.cameras) {
          cancelAnimationFrame(id)
          window.cameraEvidenceScheduler.held++
          return id
        }
      }
    }
    return id
  }
  const current = window.testSceneRef?.current
  if (current) {
    cancelAnimationFrame(current.frame)
    // Presentation timestamp only: controlled snapshots do not accrue wall time
    // while Node writes evidence or real pointer events are delivered.
    current.previous = null
  }
}

async function readCameraCheckpoint(page) {
  return page.evaluate(async () => {
    if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn'))
      throw Error('Expected existing checkpoint database')
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn')
      request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Unexpected database creation')) }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('checkpoints', 'readonly')
        const request = tx.objectStore('checkpoints').get('latest')
        tx.oncomplete = () => {
          const value = request.result
          resolve({ version: value.version, level: value.world.outcome.level,
            drawMode: value.world.drawMode,
            cameras: { ...value.world.cameras, keys: [...value.world.cameras.keys] } })
        }
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      })
    } finally { db.close() }
  })
}

export default async function scenario({ page, context, url, output, openMission, signal }) {
  const report = {
    kind: 'camera-restore-four-targeted-cases', timeoutMs: 480000,
    viewport: { width: 1440, height: 1000 }, cases: [], captures: [], checks: [],
    limitations: ['Software renderer; no performance claim',
      'Fresh isolated nonpersistent browser context; IDB continuity is across fresh pages in this context',
      'GameScene RAF held after ordinary overview settles; real Home/store/Scene and renderer unchanged',
      'Controlled store snapshots are separate from ordinary UI Save/Load; menus intentionally clear input',
      'Only transient Scene.previous is reset to null between controlled steps; no camera/checkpoint field assignment'],
  }
  const flush = () => writeFileSync(resolve(output, 'camera-report.json'), JSON.stringify(report, null, 2) + '\n')
  const check = (label, fn) => { fn(); report.checks.push(label); flush() }
  const capture = async (p, label) => {
    signal.throwIfAborted()
    await p.screenshot({ path: resolve(output, `${label}.png`), timeout: 10000 })
    report.captures.push(label); flush()
  }
  const state = p => p.evaluate(() => {
    const s = window.testSceneRef.current
    return { cameras: { ...structuredClone(s.world.cameras), keys: [...s.world.cameras.keys] }, drawMode: s.world.drawMode,
      point: { ...s.viewPoint }, bearing: s.cameraBearing,
      globe: s.view.globeBlend, flat: s.view.globeFlatScale }
  })
  const frame = async p => {
    const result = await p.evaluate(() => {
      const s = window.testSceneRef.current
      // Playwright transports plain values, not Set contents. Keep all owner
      // fields (including own undefined properties), normalizing only keys.
      // JSON.stringify would erase both Set contents and undefined properties.
      const snapshot = () => ({ ...structuredClone(s.world.cameras), keys: [...s.world.cameras.keys] })
      const before = snapshot()
      s.previous = null
      s.animate(performance.now())
      cancelAnimationFrame(s.frame)
      s.previous = null
      return { before, after: snapshot() }
    })
    assert.deepEqual(result.after, result.before, 'zero-time rendered frame preserves complete camera owner')
    return state(p)
  }
  const advance = async (p, seconds) => p.evaluate(async seconds => {
    const { advanceGame } = await import('/app/game-clock.ts')
    const s = window.testSceneRef.current
    advanceGame(s.world, s.gameClock, seconds)
  }, seconds)
  const settle = async p => p.evaluate(async () => {
    const { advanceGame } = await import('/app/game-clock.ts')
    const s = window.testSceneRef.current
    for (let visits = 0; s.overviewStage && visits < 80; visits++) advanceGame(s.world, s.gameClock, 1 / 24)
    if (s.overviewStage) throw Error('Overview did not settle within 80 controller visits')
  })
  const enter = async p => {
    await p.evaluate(() => document.activeElement?.blur())
    await p.keyboard.press('Enter')
  }
  const restoredScene = async p => {
    await bindGame(p)
    await p.waitForFunction(() => window.testSceneRef.current.started)
    await p.evaluate(() => { window.testSceneRef.current.previous = null })
  }
  try {
    await page.setViewportSize(report.viewport)
    await openMission(1)
    await page.mouse.move(720, 500)
    await page.evaluate(() => document.activeElement?.blur())
    await page.keyboard.press('Space')
    assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), true)
    check('ordinary Space pause', () => {})
    await enter(page)
    await page.waitForFunction(() => window.testSceneRef.current.overviewActive && !window.testSceneRef.current.overviewStage)
    await page.evaluate(holdSceneFrames)
    const stable = await frame(page)
    check('stable overview reached through real Enter', () => {
      assert.equal(stable.drawMode, 2); assert.equal(stable.cameras.overviewStage, null)
      assert.equal(stable.cameras.overviewActive, true)
    })
    await capture(page, '01-stable-overview-before-save')
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await page.getByRole('button', { name: 'Save Game', exact: true }).click()
    await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
    await page.getByText('Checkpoint saved in this browser.', { exact: true }).waitFor()
    const committed = await readCameraCheckpoint(page)
    const identity = await readCommittedCheckpoint(page)
    await capture(page, '02-ordinary-ui-save-confirmation')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page.getByRole('button', { name: 'Load Game', exact: true }).click()
    await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
    await restoredScene(page)
    const restored = await frame(page)
    check('ordinary UI Load keeps stable overview phase and complete saved camera owner', () => {
      assert.deepEqual(restored.cameras, committed.cameras)
      assert.equal(restored.cameras.overviewStage, null); assert.equal(restored.drawMode, 2)
    })
    await capture(page, '03-ordinary-ui-load-first-render')
    const fresh = await context.newPage()
    await fresh.setViewportSize(report.viewport)
    await fresh.goto(url, { waitUntil: 'domcontentloaded' })
    await waitForStartupMenu(fresh)
    const freshIdentity = await readCommittedCheckpoint(fresh)
    const freshCamera = await readCameraCheckpoint(fresh)
    check('fresh-page IndexedDB readback preserves full checkpoint digest and camera owner', () => {
      assert.deepEqual(freshIdentity, identity); assert.deepEqual(freshCamera, committed)
    })
    await fresh.evaluate(holdSceneFrames)
    await fresh.getByRole('button', { name: 'Load Game', exact: true }).click()
    await restoredScene(fresh)
    const freshRestored = await frame(fresh)
    check('fresh-page UI Load does not start exit morph', () => {
      assert.deepEqual(freshRestored.cameras, committed.cameras)
      assert.equal(freshRestored.drawMode, 2)
    })
    await capture(fresh, '04-fresh-page-idb-load-first-render')
    report.cases.push({ name: 'ordinary-ui-stable-overview', stable, committed, identity, restored, freshIdentity, freshRestored }); flush()
    await fresh.close()

    const tutorial = await context.newPage()
    await tutorial.setViewportSize(report.viewport)
    await tutorial.goto(url, { waitUntil: 'domcontentloaded' })
    await waitForStartupMenu(tutorial)
    await tutorial.evaluate(holdSceneFrames)
    await tutorial.getByRole('button', { name: 'Tutorial', exact: true }).click()
    await restoredScene(tutorial)
    const tutorialFirst = await frame(tutorial)
    check('fresh tutorial Home requests overview entry', () => {
      assert.equal(tutorialFirst.drawMode, 2); assert.equal(tutorialFirst.cameras.overviewStage, 'enter')
    })
    await capture(tutorial, '05-fresh-tutorial-first-render')
    await settle(tutorial)
    const tutorialSettled = await frame(tutorial)
    check('fresh tutorial overview completes', () => {
      assert.equal(tutorialSettled.cameras.overviewActive, true); assert.equal(tutorialSettled.cameras.overviewStage, null)
    })
    await capture(tutorial, '06-fresh-tutorial-stable-overview')
    report.cases.push({ name: 'fresh-tutorial', tutorialFirst, tutorialSettled }); flush()
    await tutorial.close()

    await page.bringToFront()
    await page.mouse.move(720, 500)
    await enter(page)
    await advance(page, 1 / 96)
    const exit = await state(page)
    check('real Enter starts active overview exit', () => assert.equal(exit.cameras.overviewStage, 'exit'))
    assert.equal(await page.evaluate(() => window.testStore.saveCheckpoint()), true)
    const exitCommitted = await readCameraCheckpoint(page)
    const exitFirst = await frame(page)
    await capture(page, '07-active-exit-snapshot')
    assert.equal(await page.evaluate(() => window.testStore.loadCheckpoint()), true)
    await restoredScene(page)
    const exitRestored = await frame(page)
    check('controlled active-exit snapshot retains owner and first rendered view through Home', () => {
      assert.deepEqual(exitRestored.cameras, exitCommitted.cameras); assert.deepEqual(exitRestored, exitFirst)
    })
    await capture(page, '08-active-exit-restored-first-render')
    report.cases.push({ name: 'controlled-active-exit', exitCommitted, exitFirst, exitRestored }); flush()

    await settle(page)
    await frame(page)
    // Pause via real UI, preserving camera behavior while isolating actor turns.
    if (!(await page.evaluate(() => window.testStore.getWorld().paused))) {
      await page.evaluate(() => document.activeElement?.blur())
      await page.keyboard.press('Space')
    }
    await page.mouse.move(1, 500)
    const edge = await state(page)
    check('real stationary left-edge pointer is owned by camera', () => {
      assert.equal(edge.cameras.overviewActive, false); assert.equal(edge.cameras.overviewStage, null)
      assert.equal(edge.cameras.input.buttons, 4); assert.equal(edge.cameras.input.pointer.x, 1)
    })
    await advance(page, (1 / 24 - edge.cameras.time) + 1 / 96)
    assert.equal(await page.evaluate(() => window.testStore.saveCheckpoint()), true)
    const edgeCommitted = await readCameraCheckpoint(page)
    const first = await frame(page)
    const committedPoint = await page.evaluate(async () => {
      const { browserPosition } = await import('/app/model.ts')
      return browserPosition(window.testSceneRef.current.cameraPosition)
    })
    check('first edge frame is fractional prediction, not committed camera position', () => {
      assert.ok(first.cameras.time > 0 && first.cameras.time < 1 / 24)
      assert.notDeepEqual(first.point, committedPoint)
    })
    await capture(page, '09-edge-control-fractional-first-render')
    const step = 1 / 32 + 1 / 192
    await advance(page, step)
    const controlNext = await frame(page)
    await capture(page, '10-edge-control-next-visit-and-remainder')
    await page.mouse.move(-10, 500)
    const controlReleased = await frame(page)
    check('real pointer leaving viewport clears stationary edge', () => {
      assert.equal(controlReleased.cameras.input.pointer, null); assert.equal(controlReleased.cameras.input.buttons, 0)
    })
    await capture(page, '11-edge-control-pointer-released')
    // Put the physical pointer back at the saved edge before replacing the old
    // world. Its old-world input is discarded by the real checkpoint restore.
    await page.mouse.move(1, 500)
    assert.equal(await page.evaluate(() => window.testStore.loadCheckpoint()), true)
    await restoredScene(page)
    const loadedFirst = await frame(page)
    check('controlled edge snapshot survives real store/Home/Scene without new pointer input', () => {
      assert.deepEqual(loadedFirst.cameras, edgeCommitted.cameras); assert.deepEqual(loadedFirst, first)
    })
    await capture(page, '12-edge-restored-fractional-first-render')
    await advance(page, step)
    const loadedNext = await frame(page)
    check('restored next controller visit plus small remainder matches uninterrupted control', () => assert.deepEqual(loadedNext, controlNext))
    await capture(page, '13-edge-restored-next-visit-and-remainder')
    await page.mouse.move(-10, 500)
    const loadedReleased = await frame(page)
    check('real restored pointer release matches complete uninterrupted control state', () => {
      assert.equal(loadedReleased.cameras.input.pointer, null); assert.equal(loadedReleased.cameras.input.buttons, 0)
      assert.deepEqual(loadedReleased, controlReleased)
    })
    await capture(page, '14-edge-restored-pointer-released')
    report.cases.push({ name: 'controlled-stationary-edge', edgeCommitted, first, controlNext, controlReleased,
      loadedFirst, loadedNext, loadedReleased, step })
    report.status = 'passed'; flush()
    return report
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack ?? String(error)
    try { report.lastState = await state(page) } catch (e) { report.lastStateError = String(e) }
    flush(); throw error
  }
}
