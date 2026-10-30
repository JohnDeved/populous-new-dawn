import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'

export async function waitForSavedCheckpoint(page, turn, signal) {
  const committed = await waitForCheckpointReadback(async () => {
    signal.throwIfAborted()
    return page.evaluate(async expected => {
      const request = indexedDB.open('populous-new-dawn', 1)
      const db = await new Promise((res, rej) => {
        request.onsuccess = () => res(request.result)
        request.onerror = () => rej(request.error)
      })
      try {
        const r = db.transaction('checkpoints', 'readonly').objectStore('checkpoints').get('latest')
        const value = await new Promise((res, rej) => {
          r.onsuccess = () => res(r.result)
          r.onerror = () => rej(r.error)
        })
        return value?.world?.turn === expected
      } finally {
        db.close()
      }
    }, turn)
  }, { attempts: 300, pause: () => page.waitForTimeout(100) })
  signal.throwIfAborted()
  assert.equal(committed, true, 'Save checkpoint must commit the expected turn before reloading')
}

// Independent native mission entries and real RAF. M2/M3 start from declared
// availability-only fixtures, not naturally earned prior campaign progression.
// After fixture restore, gameplay uses public UI; React references are read-only.
export default async function ({
  browser,
  page: initialPage,
  context: initialContext,
  url,
  root,
  output,
  receipt,
  signal,
}) {
  const { bindGame, prepareCampaignFixture, launchCampaignMission } = await import(
    pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href
  )
  const report = {
    scenarioSha256: createHash('sha256')
      .update(readFileSync(new URL(import.meta.url)))
      .digest('hex'),
    method:
      'M1 starts with ordinary initial availability. M2/M3 use explicit availability-only profile fixtures in separate empty contexts before reload and public native launch. No earned-prerequisite claim, checkpoint/world/entity/outcome injection, or clock/tick stepping. Gameplay is ordinary mouse/keyboard and real clock; scene/store/IndexedDB observations are read-only.',
    missions: [],
    limits:
      'Sandboxed headless software WebGL functional QA, not hardware performance or full original-game parity.',
  }
  const save = () =>
    writeFileSync(resolve(output, 'journey.json'), JSON.stringify(report, null, 2) + '\n')
  const snap = page =>
    page.evaluate(() => {
      const s = window.testSceneRef.current,
        w = s.world,
        g = s.renderer.getContext(),
        d = g.getExtension('WEBGL_debug_renderer_info')
      return {
        level: w.outcome.level,
        turn: w.turn,
        time: w.time,
        paused: w.paused,
        status: w.status,
        inputMask: w.inputMask,
        selected: [...w.selected],
        mode: w.mode,
        blue: w.units
          .filter(u => u.team === 'blue' && u.hp > 0)
          .map(u => ({ id: u.id, kind: u.kind, hp: u.hp, x: u.x, z: u.z })),
        stats: { ...w.stats },
        renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER),
        contextLost: g.isContextLost(),
        canvas: [g.drawingBufferWidth, g.drawingBufferHeight],
      }
    })
  for (const level of [1, 2, 3]) {
    signal.throwIfAborted()
    const context =
      level === 1
        ? initialContext
        : await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = level === 1 ? initialPage : await context.newPage()
    if (level !== 1) {
      page.on('pageerror', e => receipt.errors.push(String(e)))
      page.on('console', m => {
        if (m.type() === 'error') receipt.errors.push(m.text())
        if (m.type() === 'warning') receipt.warnings.push(m.text())
      })
      await page.goto(url, { waitUntil: 'domcontentloaded' })
    }
    page.setDefaultTimeout(30000)
    const entry = { level, checks: [], errorsBefore: receipt.errors.length }
    report.missions.push(entry)
    save()
    const check = async (name, fn) => {
      signal.throwIfAborted()
      console.log(`Mission ${level}: ${name}`)
      try {
        const evidence = await fn()
        entry.checks.push({ name, status: 'passed', evidence })
        save()
      } catch (error) {
        entry.checks.push({ name, status: 'failed', error: error.stack })
        await page
          .screenshot({
            path: resolve(output, `mission-${level}-${entry.checks.length}-failed.png`),
          })
          .catch(() => {})
        save()
        throw error
      }
    }
    try {
      await check('Public mission entry', async () => {
        entry.setup = { mission: level, kind: level === 1 ? 'fresh-native-campaign' : 'declared-availability-fixture' }
        if (level !== 1) await prepareCampaignFixture(page, level)
        await launchCampaignMission(page, level)
        await bindGame(page)
        await page.waitForFunction(
          () => !!(window.testScene.world.flyby.flags & 1) || !window.testScene.world.inputMask
        )
        const introductionSkipped = (await skipIntroductionWithSpace(page)) === 'skip'
        await page.waitForFunction(() => !window.testScene.world.inputMask)
        const before = await snap(page)
        assert.equal(before.level, level)
        assert.equal(before.status, 'playing')
        assert.equal(before.contextLost, false)
        await page.waitForFunction(turn => window.testScene.world.turn >= turn + 12, before.turn, {
          timeout: 30000,
        })
        await page.screenshot({ path: resolve(output, `mission-${level}-opening.png`) })
        return {
          introductionSkipped,
          before,
          after: await snap(page),
          messages: await page.locator('.campaign-messages').innerText(),
        }
      })
      await check('Ordinary HUD group selection and Escape', async () => {
        // Ordinary startup preselects the Shaman. Clear it before testing additive selection.
        await page.keyboard.press('Escape')
        await page.waitForFunction(() => !window.testScene.world.selected.length)
        await page
          .getByRole('button', { name: 'Select brave', exact: true })
          .click({ modifiers: ['Control'] })
        const selected = await snap(page)
        assert.equal(selected.selected.length, 5)
        assert.ok(
          selected.selected.every(id => selected.blue.some(u => u.id === id && u.kind === 'brave'))
        )
        await page.keyboard.press('Escape')
        await page.waitForFunction(() => !window.testScene.world.selected.length)
        return { selected: selected.selected, after: (await snap(page)).selected }
      })
      await check('Space hold/resume', async () => {
        await page.keyboard.press('Space')
        await page.getByRole('status', { name: 'Paused', exact: true }).waitFor()
        const paused = await snap(page)
        await page.waitForTimeout(1200)
        assert.equal((await snap(page)).turn, paused.turn)
        await page.locator('.world-viewport').press('Space')
        await page.waitForFunction(t => window.testScene.world.turn > t, paused.turn)
        await page.locator('.world-viewport').press('Space')
        const second = await snap(page)
        await page.waitForTimeout(1000)
        assert.equal((await snap(page)).turn, second.turn)
        await page.locator('.world-viewport').press('Space')
        await page.waitForFunction(t => window.testScene.world.turn > t, second.turn)
        return { pausedTurn: paused.turn, secondPausedTurn: second.turn, resumed: await snap(page) }
      })
      await check('Native menu, browser controls and level-selector interruption', async () => {
        await page.getByRole('button', { name: 'Menu', exact: true }).click()
        const menu = page.locator('dialog[data-original-pause-menu]')
        await menu.waitFor({ state: 'visible' })
        const compatibility = async () => {
          await menu.getByRole('button', { name: 'Options', exact: true }).click()
          await menu.getByRole('button', { name: 'Browser compatibility and help', exact: true }).click()
          assert.equal(await menu.locator('.menu-objectives,.help-grid,.help-tip,.reference-details').count(), 0)
          await menu.getByRole('button', { name: /^HUD size : </ }).waitFor()
        }
        await compatibility()
        const before = await snap(page)
        await menu.getByRole('button', { name: 'Select Level', exact: true }).click()
        const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
        await selector.waitFor()
        await page.waitForTimeout(800)
        assert.equal((await snap(page)).turn, before.turn)
        // The native selector exposes cancellation via Escape, not the retired
        // browser-compatibility Back button. Repeat the real cancel/reentry path.
        await page.keyboard.press('Escape')
        await menu.waitFor({ state: 'visible' })
        assert.equal((await snap(page)).paused, true)
        await compatibility()
        await menu.getByRole('button', { name: 'Select Level', exact: true }).click()
        await selector.waitFor()
        await page.keyboard.press('Escape')
        await menu.waitFor({ state: 'visible' })
        assert.equal((await snap(page)).paused, true)
        assert.equal((await snap(page)).level, level)
        await menu.getByRole('button', { name: 'Continue Game', exact: true }).click()
        await menu.waitFor({ state: 'hidden' })
        await page.waitForFunction(t => window.testScene.world.turn > t, before.turn)
        return { before, after: await snap(page) }
      })
      await check('Checkpoint survives a fresh page reload', async () => {
        await page.getByRole('button', { name: 'Menu', exact: true }).click()
        const menu = page.locator('dialog[data-original-pause-menu]')
        await menu.waitFor({ state: 'visible' })
        const saved = await snap(page)
        await menu.getByRole('button', { name: 'Save Game', exact: true }).click()
        await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
        // Await the normal asynchronous save by reading its committed IDB record.
        await waitForSavedCheckpoint(page, saved.turn, signal)
        await page.screenshot({ path: resolve(output, `mission-${level}-saved-settings.png`) })
        await page.reload({ waitUntil: 'domcontentloaded' })
        const selector = page.getByRole('dialog', { name: 'Main menu', exact: true })
        await selector.waitFor()
        // Observe replacement synchronously; scene binding may span real turns.
        await page.evaluate(() => {
          const main = document.querySelector('main')
          let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
          let store
          for (; fiber && !store; fiber = fiber.return)
            for (let hook = fiber.memoizedState; hook; hook = hook.next)
              if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) {
                store = hook.memoizedState
                break
              }
          if (!store) throw Error('Checkpoint store unavailable before public Load')
          const before = store.getWorld()
          window.journeyLoadedCheckpoint = null
          const unsubscribe = store.subscribe(() => {
            const world = store.getWorld()
            if (world === before) return
            window.journeyLoadedCheckpoint = structuredClone({
              turn: world.turn,
              level: world.outcome.level,
              stats: world.stats,
              blue: world.units.filter(u => u.team === 'blue' && u.hp > 0).map(u => [u.id, u.kind]),
            })
            unsubscribe()
          })
        })
        await selector.getByRole('button', { name: 'Load Game', exact: true }).click()
        const loaded = await page.evaluate(() => window.journeyLoadedCheckpoint)
        assert.ok(loaded, 'Public Load must replace the actual stored world')
        assert.equal(loaded.turn, saved.turn)
        assert.equal(loaded.level, level)
        assert.deepEqual(loaded.blue, saved.blue.map(u => [u.id, u.kind]))
        assert.deepEqual(loaded.stats, saved.stats)
        await bindGame(page)
        const restored = await snap(page)
        assert.equal(restored.level, level)
        assert.equal(restored.status, 'playing')
        assert.ok(
          restored.turn >= saved.turn && restored.turn < saved.turn + 36,
          `Saved turn ${saved.turn}, restored ${restored.turn}`
        )
        assert.deepEqual(
          restored.blue.map(u => [u.id, u.kind]),
          saved.blue.map(u => [u.id, u.kind])
        )
        assert.equal(restored.contextLost, false)
        await page.locator('.world-viewport').press('Space')
        const paused = await snap(page)
        await page.waitForTimeout(700)
        assert.equal((await snap(page)).turn, paused.turn)
        await page.screenshot({ path: resolve(output, `mission-${level}-restored-paused.png`) })
        await page.locator('.world-viewport').press('Space')
        await page.waitForFunction(t => window.testScene.world.turn > t, paused.turn)
        return { saved, loaded, restored, resumed: await snap(page) }
      })
      assert.equal(receipt.errors.length, entry.errorsBefore, 'Browser error during mission')
    } catch (error) {
      entry.failure = String(error)
    } finally {
      entry.errorsAfter = receipt.errors.length
      save()
      await context.close()
    }
  }
  const failures = report.missions
    .filter(m => m.failure)
    .map(m => `Mission ${m.level}: ${m.failure}`)
  assert.deepEqual(failures, [], failures.join('\n'))
  assert.deepEqual(receipt.errors, [])
  return report
}
