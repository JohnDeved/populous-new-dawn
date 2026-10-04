import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Ordinary public UI and real RAF only. React references are observation-only.
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
  const { bindGame, showAllMissions } = await import(
    pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href
  )
  const report = {
    scenarioSha256: createHash('sha256')
      .update(readFileSync(new URL(import.meta.url)))
      .digest('hex'),
    method:
      'Public UI; ordinary mouse/keyboard input and elapsed real clock. No clock/tick stepping or world/entity/outcome/storage fixtures. Read-only scene/store/IndexedDB observation.',
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
        const dialog = page.getByRole('dialog', { name: 'Start game', exact: true })
        await dialog.waitFor()
        if (level === 1) {
          await dialog.getByRole('button', { name: 'Select Mission 1', exact: true }).click()
          await dialog.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
        } else {
          await showAllMissions(page)
          await dialog.getByRole('button', { name: `Mission ${level}`, exact: true }).click()
        }
        await bindGame(page)
        await page.waitForFunction(
          () => !!(window.testScene.world.flyby.flags & 1) || !window.testScene.world.inputMask
        )
        const skip = page.locator('.skip-introduction'),
          introductionSkipped = await skip.isVisible()
        if (introductionSkipped) await skip.click()
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
      await check('Space and pause-button hold/resume', async () => {
        await page.keyboard.press('Space')
        await page.getByRole('button', { name: 'Resume game', exact: true }).waitFor()
        const paused = await snap(page)
        await page.waitForTimeout(1200)
        assert.equal((await snap(page)).turn, paused.turn)
        await page.getByRole('button', { name: 'Resume game', exact: true }).click()
        await page.waitForFunction(t => window.testScene.world.turn > t, paused.turn)
        await page.getByRole('button', { name: 'Pause game', exact: true }).click()
        const second = await snap(page)
        await page.waitForTimeout(1000)
        assert.equal((await snap(page)).turn, second.turn)
        await page.getByRole('button', { name: 'Resume game', exact: true }).click()
        await page.waitForFunction(t => window.testScene.world.turn > t, second.turn)
        return { pausedTurn: paused.turn, secondPausedTurn: second.turn, resumed: await snap(page) }
      })
      await check('Settings, objective visibility and level-selector interruption', async () => {
        await page.getByRole('button', { name: 'Game settings', exact: true }).click()
        const menu = page.locator('dialog.game-dialog')
        await menu.waitFor({ state: 'visible' })
        await menu.locator('summary').filter({ hasText: 'Objectives' }).click()
        const objectives = await menu.locator('.menu-objectives').innerText()
        assert.ok(objectives.includes('0 / 3'))
        const before = await snap(page)
        await menu.getByRole('button', { name: 'Select Level', exact: true }).click()
        const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
        await selector.waitFor()
        await page.waitForTimeout(800)
        assert.equal((await snap(page)).turn, before.turn)
        await selector.getByRole('button', { name: 'Back', exact: true }).click()
        await menu.waitFor({ state: 'visible' })
        assert.equal((await snap(page)).paused, true)
        await menu.getByRole('button', { name: 'Select Level', exact: true }).click()
        await selector.waitFor()
        await page.keyboard.press('Escape')
        await menu.waitFor({ state: 'visible' })
        assert.equal((await snap(page)).paused, true)
        assert.equal((await snap(page)).level, level)
        await menu.getByRole('button', { name: 'Continue Game', exact: false }).click()
        await menu.waitFor({ state: 'hidden' })
        await page.waitForFunction(t => window.testScene.world.turn > t, before.turn)
        return { objectives, before, after: await snap(page) }
      })
      await check('Checkpoint survives a fresh page reload', async () => {
        await page.getByRole('button', { name: 'Game settings', exact: true }).click()
        const menu = page.locator('dialog.game-dialog')
        await menu.waitFor({ state: 'visible' })
        const saved = await snap(page)
        await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
        // Await the normal asynchronous save by reading its committed IDB record.
        await page.waitForFunction(async expected => {
          const request = indexedDB.open('populous-new-dawn', 1)
          const db = await new Promise((res, rej) => {
            request.onsuccess = () => res(request.result)
            request.onerror = () => rej(request.error)
          })
          try {
            const r = db.transaction('checkpoints').objectStore('checkpoints').get('latest')
            const value = await new Promise((res, rej) => {
              r.onsuccess = () => res(r.result)
              r.onerror = () => rej(r.error)
            })
            return value?.world?.turn === expected
          } finally {
            db.close()
          }
        }, saved.turn)
        await page.screenshot({ path: resolve(output, `mission-${level}-saved-settings.png`) })
        await page.reload({ waitUntil: 'domcontentloaded' })
        const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
        await selector.waitFor()
        await selector.getByRole('button', { name: 'Load Game', exact: true }).click()
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
        assert.deepEqual(restored.stats, saved.stats)
        assert.equal(restored.contextLost, false)
        await page.getByRole('button', { name: 'Pause game', exact: true }).click()
        const paused = await snap(page)
        await page.waitForTimeout(700)
        assert.equal((await snap(page)).turn, paused.turn)
        await page.screenshot({ path: resolve(output, `mission-${level}-restored-paused.png`) })
        await page.getByRole('button', { name: 'Resume game', exact: true }).click()
        await page.waitForFunction(t => window.testScene.world.turn > t, paused.turn)
        return { saved, restored, resumed: await snap(page) }
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
