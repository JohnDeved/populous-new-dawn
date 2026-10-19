// Proposed scripts/ui-readiness-browser/neutral-cursor.mjs. Not admitted/run.
// Public controls and DOM observations only; no game-state hooks or writes.
// Failed run39211854397 used Mission19, whose authored blue roster contains only
// a Shaman. Select brave was correctly disabled. Mission6 starts6 Braves+1Shaman
// (level-six.ts; model2=brave in unit-kinds.ts), preserving a visible selected
// aria-pressed witness rather than weakening the exclusion to keyboard reset.
// No shrine/acquisition command is issued; only the ordinary intro skip/cancel.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

export default async function ({ page, context, output, url }) {
  const browser = context.browser()
  const scopes = [], report = { status: 'running', cases: [], limits: [
    'Bounded browser adaptation, not complete native cursor-state parity.',
    'Computed CSS and source dimensions do not prove OS cursor pixels or hotspot rendering; screenshots normally omit the OS cursor.',
    'No picking accuracy, full-frame performance or hardware/DPI parity claim.',
    'Direct Mission 6 selector is public setup, not earned campaign progression.',
  ] }
  let timedOut = false
  const save = () => writeFileSync(resolve(output, 'neutral-cursor.json'), JSON.stringify(report, null, 2) + '\n')
  const timer = setTimeout(() => {
    timedOut = true; report.status = 'timed-out'; save()
    void context.close(); for (const scope of scopes) void scope.close()
  }, 85_000)
  try {
    for (const [dpr, failDecode] of [[1, false], [2, false], [1, true]]) {
      let current = page, currentScope = null
      if (dpr !== 1 || failDecode) {
        const scope = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: dpr, serviceWorkers: 'block' })
        scopes.push(scope); currentScope = scope; current = await scope.newPage()
      }
      current.setDefaultTimeout(10_000); current.setDefaultNavigationTimeout(15_000)
      const row = { dpr, failDecode, assetRequests: 0, errors: [], observations: [] }
      report.cases.push(row); save()
      current.on('pageerror', error => row.errors.push(String(error)))
      if (failDecode) await current.route('**/original/cursor-point14.png', route => {
        row.assetRequests++
        return route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('deliberately invalid PNG for decode-failure case') })
      })
      await current.mouse.move(1, 1) // Keep initial physical pointer outside the battlefield.
      await current.goto(url, { waitUntil: 'domcontentloaded' })
      await openCampaignFromMainMenu(current)
      await current.getByRole('button', { name: 'Browser controls', exact: true }).click()
      await current.getByRole('button', { name: 'All missions', exact: true }).click()
      await current.getByRole('button', { name: 'Mission 6', exact: true }).click()
      const canvas = current.locator('canvas.battlefield')
      await canvas.waitFor({ state: 'visible' })
      await current.locator('.loading-world').waitFor({ state: 'hidden' })
      const skip = current.getByRole('button', { name: /Skip introduction/ })
      // Mission 6's ordinary opening flyby may start after loading disappears.
      // Await its public control, rather than racing a one-shot visibility read.
      await skip.waitFor({ state: 'visible' })
      await skip.click(); await skip.waitFor({ state: 'hidden' })
      await current.getByRole('dialog').waitFor({ state: 'hidden' })
      await current.keyboard.press('Escape') // public cancel selection/mode
      const box = await canvas.boundingBox(); assert.ok(box)
      const point = { x: box.x + box.width * 0.7, y: box.y + box.height * 0.65 }
      const observe = () => canvas.evaluate(el => ({ inline: el.style.cursor, computed: getComputedStyle(el).cursor, dpr: devicePixelRatio }))
      await current.waitForFunction(() => document.querySelector('canvas.battlefield')?.style.cursor === '')
      assert.ok(await canvas.evaluate((el, p) => document.elementFromPoint(p.x, p.y) === el, point), 'Probe point must target the actual canvas, not an overlay')
      const baseline = await observe(); row.baseline = baseline
      assert.equal(baseline.dpr, dpr)
      assert.equal(baseline.inline, '', 'Fresh scene should not retain owned inline cursor')
      const move = async () => { await current.mouse.move(point.x + 1, point.y); await current.mouse.move(point.x, point.y) }
      const expectOriginal = async () => {
        await current.waitForFunction(() => /cursor-point14\.png.*0 0, auto/.test(getComputedStyle(document.querySelector('canvas.battlefield')).cursor))
      }
      const focusCanvas = async () => {
        await canvas.focus()
        assert.ok(await canvas.evaluate(el => document.activeElement === el), 'Keyboard input must target battlefield, not a menu button')
      }
      const expectRestored = async state => {
        await current.waitForFunction(expected => document.querySelector('canvas.battlefield')?.style.cursor === expected, baseline.inline)
        // A keydown resets synchronously, but a wrongly eligible cursor reinstalls
        // on the next game frame. Sample three RAFs, spanning >=2 full intervals.
        const frames = await canvas.evaluate(el => new Promise(resolve => {
          const samples = []
          const sample = () => {
            samples.push({ inline: el.style.cursor, computed: getComputedStyle(el).cursor, dpr: devicePixelRatio })
            if (samples.length === 3) resolve(samples)
            else requestAnimationFrame(sample)
          }
          requestAnimationFrame(sample)
        }))
        for (const frame of frames) assert.deepEqual(frame, baseline, `Restoration must persist: ${state}`)
        row.observations.push({ state, frames })
      }
      const selectedBrave = current.getByRole('button', { name: 'Select brave', exact: true })
      const selectBrave = async () => {
        await selectedBrave.click()
        await current.waitForFunction(() => document.querySelector('[aria-label="Select brave"]')?.getAttribute('aria-pressed') === 'true')
        await focusCanvas()
      }
      const cancelSelection = async () => {
        await current.keyboard.press('Escape')
        await current.waitForFunction(() => document.querySelector('[aria-label="Select brave"]')?.getAttribute('aria-pressed') === 'false')
      }
      await move()
      if (failDecode) {
        assert.ok(row.assetRequests > 0, 'Failure route must actually intercept the asset')
        await expectRestored('fallback')
        // Repeated public interaction must not revive the failed cursor.
        await selectBrave(); await move(); await expectRestored('failed-decode-selected')
        await cancelSelection(); await move(); await expectRestored('failed-decode-neutral')
      } else {
        await expectOriginal(); row.observations.push({ state: 'neutral', ...await observe() })
        await current.keyboard.down('Shift'); await move(); await expectRestored('modifier'); await current.keyboard.up('Shift')
        await move(); await expectOriginal()
        await selectBrave(); await move(); await expectRestored('selected-brave')
        await cancelSelection(); await move(); await expectOriginal()
        await focusCanvas()
        await current.keyboard.press('Space')
        await current.locator('.paused-badge').waitFor({ state: 'visible' })
        await move(); await expectRestored('paused')
        await focusCanvas(); await current.keyboard.press('Space')
        await current.locator('.paused-badge').waitFor({ state: 'hidden' })
        await move(); await expectOriginal()
        await current.getByRole('button', { name: 'Game settings', exact: true }).click()
        await current.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor()
        await expectRestored('fallback')
        await current.getByRole('button', { name: 'Continue Game', exact: true }).click()
        await current.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor({ state: 'hidden' })
        await move(); await expectOriginal()
        await current.mouse.move(1, 1); await expectRestored('fallback')
        await move(); await expectOriginal()
      }
      row.observations.push({ state: failDecode ? 'decode-failure-fallback' : 'reacquired', ...await observe() })
      await current.screenshot({ path: resolve(output, `neutral-cursor-dpr${dpr}${failDecode ? '-failure' : ''}.png`), timeout: 5000 })
      assert.deepEqual(row.errors, [])
      row.status = 'passed'; save()
      // Do not leave an earlier live gameplay simulation consuming resources
      // while the next DPR/failure case runs.
      await current.close()
      if (currentScope) {
        await currentScope.close()
        scopes.splice(scopes.indexOf(currentScope), 1)
      }
    }
    if (timedOut) throw new Error('Cursor helper deadline expired')
    report.status = 'passed'; return report
  } catch (error) {
    report.status = timedOut ? 'timed-out' : 'failed'; report.error = String(error.stack)
    if (timedOut) throw Object.assign(new Error('Cursor helper deadline expired', { cause: error }), { name: 'DiagnosticTimeoutError' })
    throw error
  } finally { clearTimeout(timer); for (const scope of scopes) await scope.close(); save() }
}
