// Public Options route only; no game-state writes, hooks or storage seeding.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

export default async function ({ page, context, output, url }) {
  const report = { status: 'running', cases: [], limits: [
    'Browser compatibility help, not native message-body layout or pixel parity.',
    'Public direct-mission selector exercises content context, not earned campaign progression.',
    'Headless geometry and screenshots do not certify hardware performance.',
  ] }
  const save = () => writeFileSync(resolve(output, 'contextual-help.json'), JSON.stringify(report, null, 2) + '\n')
  const owned = []
  const timer = setTimeout(() => {
    report.status = 'timed-out'; save()
    void context.close()
    for (const scope of owned) void scope.close()
  }, 85_000)
  try {
    for (const [mission, width, height, dpr] of [[1, 1024, 768, 1], [2, 1920, 1080, 1], [19, 1280, 800, 2]]) {
      let current = page
      if (mission === 1) await page.setViewportSize({ width, height })
      else {
        const scope = await context.browser().newContext({ viewport: { width, height }, deviceScaleFactor: dpr, serviceWorkers: 'block' })
        owned.push(scope); current = await scope.newPage()
      }
      current.setDefaultTimeout(10_000); current.setDefaultNavigationTimeout(15_000)
      const row = { mission, viewport: { width, height, dpr }, errors: [] }
      report.cases.push(row); save()
      current.on('pageerror', error => row.errors.push(String(error)))
      await current.goto(url, { waitUntil: 'domcontentloaded' })
      await openCampaignFromMainMenu(current)
      if (mission === 1) await current.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
      else {
        await current.getByRole('button', { name: 'Browser controls', exact: true }).click()
        await current.getByRole('button', { name: 'All missions', exact: true }).click()
        await current.getByRole('button', { name: `Mission ${mission}`, exact: true }).click()
      }
      await current.locator('.battlefield').waitFor({ state: 'visible' })
      await current.locator('.loading-world').waitFor({ state: 'hidden' })
      const skip = current.getByRole('button', { name: /Skip introduction/ })
      if (mission === 1 || await skip.isVisible()) {
        await skip.click()
        await skip.waitFor({ state: 'hidden' })
      }
      // Top-action settings is an explicitly supported menu entry even while
      // opening input masks block the battlefield HUD. No hidden-state polling.
      await current.getByRole('button', { name: 'Game settings', exact: true }).click()
      await current.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor({ state: 'visible' })
      await current.getByRole('button', { name: 'Options', exact: true }).click()
      await current.locator('[data-compatibility]').click()
      const help = current.getByRole('region', { name: 'Browser compatibility and help', exact: true })
      await help.getByRole('heading', { name: 'Browser compatibility and help', exact: true }).waitFor()
      assert.equal(await help.locator('[data-mission-help="1"]').count(), Number(mission === 1))
      if (mission !== 1) assert.doesNotMatch(await help.innerText(), /southern head for Land Bridge|central head for four Lightning/)
      if (mission === 19) assert.doesNotMatch(await help.innerText(), /seek Armageddon/)
      await current.screenshot({ path: resolve(output, `help-mission-${mission}-${width}-dpr${dpr}.png`), timeout: 5000 })
      await help.getByRole('heading', { name: 'Controls', exact: true }).scrollIntoViewIfNeeded()
      await help.locator('.help-tip').last().scrollIntoViewIfNeeded()
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
      await help.getByRole('button', { name: 'Back to Options', exact: true }).click()
      await help.waitFor({ state: 'hidden' })
      await current.waitForFunction(() => document.activeElement?.hasAttribute('data-compatibility'))
      await current.getByRole('button', { name: 'Back', exact: true }).click()
      await current.getByRole('button', { name: 'Continue Game', exact: true }).click()
      await current.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor({ state: 'hidden' })
      assert.deepEqual(row.errors, [])
      row.status = 'passed'; save()
    }
    report.status = 'passed'
    return report
  } catch (error) { report.status = 'failed'; report.error = String(error.stack); throw error }
  finally { clearTimeout(timer); for (const scope of owned) await scope.close(); save() }
}
