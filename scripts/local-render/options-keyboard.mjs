import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

export default async function ({ page, output }) {
  const report = { mode: process.env.POPULOUS_KEYBOARD_BASELINE === '1' ? 'baseline-observation' : 'fixed-regression', status: 'running', observations: [], pageErrors: [] }
  const save = () => writeFileSync(resolve(output, 'keyboard.json'), JSON.stringify(report, null, 2) + '\n')
  page.on('pageerror', error => report.pageErrors.push(String(error)))
  const button = name => page.getByRole('button', { name, exact: true })
  const options = page.locator('[data-original-options]')
  const focused = () => page.evaluate(() => {
    const el = document.activeElement
    return { label: el?.getAttribute('aria-label') ?? el?.textContent?.trim(), key: el?.getAttribute('data-option-key'), tag: el?.tagName }
  })
  const category = async name => {
    if (await options.getAttribute('data-category') !== name) await button(name).click()
    assert.equal(await options.getAttribute('data-category'), name)
  }
  async function keys(skin, control, locator) {
    for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
      await locator.focus()
      const before = await focused()
      await page.keyboard.press(key)
      const after = await focused()
      report.observations.push({ skin, control, key, before, after, retained: JSON.stringify(before) === JSON.stringify(after) })
      if (skin === 'frontend' || report.mode === 'fixed-regression') assert.deepEqual(after, before, `${skin} ${control} ${key}: outer menu must not redirect Options focus`)
      save()
    }
  }
  try {
    await page.setViewportSize({ width: 1280, height: 800 })
    for (const skin of ['frontend', 'ingame']) {
      await button('Options').click()
      assert.equal(await options.getAttribute('data-skin'), skin)
      await category('Game')
      await keys(skin, 'Rotation', options.locator('[data-option-key="rotation"]'))
      await keys(skin, 'Flip Rotation', options.locator('[data-option-key="flipRotation"]'))
      await keys(skin, 'Back', button('Back'))
      await keys(skin, 'Browser compatibility', button('Browser compatibility and help'))
      await category('Graphics')
      await keys(skin, 'Direct3D', button('Direct3D Options'))
      await category('Sound')
      for (const name of ['Master volume', 'Music volume']) {
        const slider = page.getByRole('slider', { name, exact: true })
        await slider.focus()
        await page.keyboard.press('Home')
        assert.equal(await slider.inputValue(), '0')
        await page.keyboard.press('ArrowUp')
        assert.ok(Number(await slider.inputValue()) > 0)
        await page.keyboard.press('End')
        assert.equal(await slider.inputValue(), '1')
        await page.keyboard.press('ArrowDown')
        assert.ok(Number(await slider.inputValue()) < 1)
        assert.equal(await slider.evaluate(el => el === document.activeElement), true)
      }
      await category('Game')
      await button('Browser compatibility and help').focus()
      await page.keyboard.press('Enter')
      await keys(skin, 'Back to Options', button('Back to Options'))
      await button('Back to Options').click()
      assert.equal(await options.getAttribute('data-category'), 'Game')
      await button('Back').focus()
      await page.evaluate(() => {
        window.optionsTabPrevented = null
        window.addEventListener('keydown', event => { window.optionsTabPrevented = event.defaultPrevented }, { once: true })
      })
      await page.keyboard.press('Tab')
      report[`${skin}Tab`] = { focus: await focused(), prevented: await page.evaluate(() => window.optionsTabPrevented) }
      assert.equal(report[`${skin}Tab`].prevented, false, 'native Tab is not intercepted by the menu')
      await button('Back').focus()
      await page.screenshot({ path: resolve(output, `${skin}-back-focus.png`) })
      await page.keyboard.press('Escape')
      await options.waitFor({ state: 'detached' })
      assert.equal(await button('Options').evaluate(el => el === document.activeElement), true, 'Escape returns focus to Options entry')
      await button('Options').click()
      await button('Back').click()
      await options.waitFor({ state: 'detached' })
      assert.equal(await button('Options').evaluate(el => el === document.activeElement), true, 'Back returns focus to Options entry')
      if (skin === 'frontend') {
        await openCampaignFromMainMenu(page)
        await button('Start Mission 1').click()
        await bindGame(page)
        await skipIntroductionWithSpace(page, { timeout: 45000 })
        await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
        await button('Menu').click()
      } else {
        assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), true)
        await button('Continue Game').click()
        await page.waitForFunction(() => !window.testStore.getWorld().paused)
      }
    }
    report.jumps = report.observations.filter(row => !row.retained)
    if (report.mode === 'baseline-observation') assert.ok(report.jumps.some(row => row.skin === 'ingame'), 'baseline must reproduce the suspected in-game focus jump')
    else assert.deepEqual(report.jumps, [])
    assert.deepEqual(report.pageErrors, [])
    report.status = 'passed'
    return report
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    throw error
  } finally { save() }
}
