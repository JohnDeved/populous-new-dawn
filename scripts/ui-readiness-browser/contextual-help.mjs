// Public Options route only; no game-state writes, hooks or storage seeding.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

export default async function ({ page, context, output, url }) {
  let timedOut = false
  const report = { status: 'running', cases: [], limits: [
    'Browser compatibility help, not native message-body layout or pixel parity.',
    'Public direct-mission selector exercises content context, not earned campaign progression.',
    'Headless geometry and screenshots do not certify hardware performance.',
  ] }
  const save = () => writeFileSync(resolve(output, 'contextual-help.json'), JSON.stringify(report, null, 2) + '\n')
  const owned = [], browser = context.browser(), started = performance.now()
  const elapsed = () => Math.round(performance.now() - started)
  const timer = setTimeout(() => {
    timedOut = true; report.status = 'timed-out'; save()
    void context.close()
    for (const scope of owned) void scope.close()
  }, 85_000)
  try {
    for (const [mission, width, height, dpr] of [[1, 1024, 768, 1], [2, 1920, 1080, 1], [19, 1280, 800, 2]]) {
      let current = page, scope
      if (mission === 1) await page.setViewportSize({ width, height })
      else {
        scope = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, serviceWorkers: 'block' })
        owned.push(scope); current = await scope.newPage()
      }
      current.setDefaultTimeout(10_000); current.setDefaultNavigationTimeout(15_000)
      const row = { mission, viewport: { width, height, dpr }, errors: [], startedMs: elapsed(), phases: [] }
      const phase = name => { row.phases.push({ name, elapsedMs: elapsed(), missionElapsedMs: elapsed() - row.startedMs }); save() }
      report.cases.push(row); save()
      current.on('pageerror', error => row.errors.push(String(error)))
      phase('navigate')
      await current.goto(url, { waitUntil: 'domcontentloaded' })
      phase('main-menu')
      await openCampaignFromMainMenu(current)
      phase('mission-selection')
      if (mission === 1) await current.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
      else {
        await current.getByRole('button', { name: 'Browser controls', exact: true }).click()
        await current.getByRole('button', { name: 'All missions', exact: true }).click()
        await current.getByRole('button', { name: `Mission ${mission}`, exact: true }).click()
      }
      phase('mission-loading')
      await current.locator('.battlefield').waitFor({ state: 'visible' })
      await current.locator('.loading-world').waitFor({ state: 'hidden' })
      phase('mission-visible')
      const skip = current.getByRole('button', { name: /Skip introduction/ })
      if (mission === 1 || await skip.isVisible()) {
        await skip.click()
        await skip.waitFor({ state: 'hidden' })
      }
      // Top-action settings is an explicitly supported menu entry even while
      // opening input masks block the battlefield HUD. No hidden-state polling.
      phase('open-game-settings')
      await current.getByRole('button', { name: 'Game settings', exact: true }).click()
      await current.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor({ state: 'visible' })
      await current.getByRole('button', { name: 'Options', exact: true }).click()
      await current.locator('[data-compatibility]').click()
      const help = current.getByRole('region', { name: 'Browser compatibility and help', exact: true })
      await help.getByRole('heading', { name: 'Browser compatibility and help', exact: true }).waitFor()
      phase('help-visible')
      assert.equal(await help.locator('[data-mission-help="1"]').count(), Number(mission === 1))
      if (mission !== 1) assert.doesNotMatch(await help.innerText(), /southern head for Land Bridge|central head for four Lightning/)
      if (mission === 19) assert.doesNotMatch(await help.innerText(), /seek Armageddon/)
      phase('content-assertions-passed')
      await current.screenshot({ path: resolve(output, `help-mission-${mission}-${width}-dpr${dpr}.png`), timeout: 5000 })
      await help.getByRole('heading', { name: 'Controls', exact: true }).scrollIntoViewIfNeeded()
      await help.locator('.help-tip').last().scrollIntoViewIfNeeded()
      phase('tips-scrolled')
      row.geometry = await help.evaluate(el => {
        const box = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom } }
        return { viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, panel: box(el),
          clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight,
          tips: [...el.querySelectorAll('.help-tip')].map(node => ({ text: node.textContent, box: box(node) })) }
      })
      assert.ok(row.geometry.panel.x >= -1 && row.geometry.panel.right <= width + 1, 'Help outside viewport horizontally')
      assert.ok(row.geometry.panel.y >= -1 && row.geometry.panel.bottom <= height + 1, 'Help outside viewport vertically')
      assert.ok(row.geometry.scrollWidth <= row.geometry.clientWidth + 1, 'Unexpected horizontal help overflow')
      if (mission === 1) await current.screenshot({ path: resolve(output, 'help-mission-1-tips.png'), timeout: 5000 })
      phase('geometry-passed')
      await help.getByRole('button', { name: 'Back to Options', exact: true }).click()
      await help.waitFor({ state: 'hidden' })
      await current.waitForFunction(() => document.activeElement?.hasAttribute('data-compatibility'))
      phase('options-returned')
      await current.getByRole('button', { name: 'Back', exact: true }).click()
      await current.getByRole('button', { name: 'Continue Game', exact: true }).click()
      await current.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor({ state: 'hidden' })
      assert.deepEqual(row.errors, [])
      phase('game-resumed')
      await current.close()
      if (scope) { await scope.close(); owned.splice(owned.indexOf(scope), 1) }
      phase('completed-page-closed')
      row.status = 'passed'; row.elapsedMs = elapsed() - row.startedMs; save()
    }
    report.status = timedOut ? 'timed-out' : 'passed'
    return report
  } catch (error) { report.status = timedOut ? 'timed-out' : 'failed'; report.error = String(error.stack);
    if (timedOut) throw Object.assign(new Error('Helper diagnostic deadline expired', { cause: error }), { name: 'DiagnosticTimeoutError' })
    throw error }
  finally { clearTimeout(timer); for (const scope of owned) await scope.close(); save() }
}
