// Baseline observation only. CSS content-box overlap is not a visual failure:
// the original nine-patch slices include flat gold fill outside that box.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

export default async function ({ page, context, output, url }) {
  let timedOut = false
  const report = { status: 'running', observations: [], errors: [], limits: [
    'Baseline only at 1280x800/DPR1, using public Mission 1 startup and building controls.',
    'No native mapping proof, unlock injection, simulation mutation, or frame replacement.',
    'CSS content-box intrusion is recorded, not treated as a defect: nine-patch slices include flat fill.',
    'Screenshots show the existing shared icons; missing original building mappings remain unresolved.',
  ] }
  const save = () => writeFileSync(resolve(output, 'palette.json'), JSON.stringify(report, null, 2) + '\n')
  page.on('pageerror', error => report.errors.push(String(error)))
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
  let cap
  try {
    save()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await openCampaignFromMainMenu(page)
    await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
    await page.locator('.battlefield').waitFor({ state: 'visible' })
    await page.locator('.loading-world').waitFor({ state: 'hidden' })
    cap = setTimeout(() => { timedOut = true; report.status = 'timed-out'; save(); void context.close() }, 30_000)
    const skip = page.getByRole('button', { name: /Skip introduction/ })
    await skip.click()
    await skip.waitFor({ state: 'hidden' })
    page.setDefaultTimeout(5000)
    await page.getByRole('button', { name: 'buildings B', exact: true }).click()
    const cards = page.locator('.building-card'), hut = page.getByRole('button', { name: 'Hut, 3 wood', exact: true })
    assert.equal(await cards.count(), 8)
    const capture = async name => {
      const observation = await page.evaluate(() => {
        const box = el => {
          const r = el.getBoundingClientRect()
          return Object.fromEntries(['x', 'y', 'width', 'height', 'right', 'bottom'].map(k => [k, r[k]]))
        }
        const hud = document.querySelector('.native-hud'), scale = hud.getBoundingClientRect().width / 100
        return { viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, scale,
          cards: [...document.querySelectorAll('.building-card')].map(el => {
            const sprite = el.querySelector('.hud-sprite'), css = getComputedStyle(el), art = getComputedStyle(sprite)
            const card = box(el), icon = box(sprite)
            return { label: el.getAttribute('aria-label'), disabled: el.disabled, pressed: el.getAttribute('aria-pressed'),
              card, icon, border: ['Top', 'Right', 'Bottom', 'Left'].map(edge => parseFloat(css[`border${edge}Width`])),
              borderImage: css.borderImageSource, borderSlice: css.borderImageSlice,
              image: art.backgroundImage, position: art.backgroundPosition, opacity: css.opacity,
              logicalSprite: [parseFloat(art.width), parseFloat(art.height)],
              withinHitTarget: icon.x >= card.x - .1 && icon.y >= card.y - .1 && icon.right <= card.right + .1 && icon.bottom <= card.bottom + .1 }
          }) }
      })
      report.observations.push({ name, ...observation }); save()
      await page.locator('.command-dock').screenshot({ path: resolve(output, `${name}.png`), timeout: 5000 })
      assert.ok(observation.cards.every(card => card.withinHitTarget), 'A sprite escaped its own hit target')
      return observation
    }
    await page.mouse.move(600, 400)
    const normal = await capture('normal')
    assert.ok(normal.cards.some(card => card.disabled), 'Expected authored locked controls')
    await hut.hover()
    await capture('hover-hut')
    await hut.click()
    assert.equal(await hut.getAttribute('aria-pressed'), 'true')
    await page.mouse.move(600, 400)
    await capture('selected-hut')
    await hut.click()
    assert.equal(await hut.getAttribute('aria-pressed'), 'false')
    // A real pointer click, not force-click or synthetic DOM dispatch, targets
    // the first disabled card. Playwright locator.click intentionally rejects it.
    const disabled = page.locator('.building-card:disabled').first()
    const r = await disabled.boundingBox()
    assert.ok(r)
    await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2)
    const after = await capture('locked-click')
    assert.ok(after.cards.every(card => card.pressed === 'false'), 'Disabled click selected a plan')
    assert.deepEqual(after.cards.map(card => card.disabled), normal.cards.map(card => card.disabled))
    assert.deepEqual(report.errors, [])
    report.status = timedOut ? 'timed-out' : 'passed'
    return report
  } catch (error) { report.status = timedOut ? 'timed-out' : 'failed'; report.error = String(error.stack); throw error }
  finally { clearTimeout(cap); save() }
}
