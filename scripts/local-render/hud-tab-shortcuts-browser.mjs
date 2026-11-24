import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Reuse the recovery lane's real, publicly loaded checkpoint. No new context,
// injected world, workflow, launch flags or extension to the outer deadline.
export const hudTabEpisodeLimitMs = 20000
export async function checkHudTabShortcuts(page, output) {
  const report = { status: 'running', cases: [], screenshots: [], limitMs: hudTabEpisodeLimitMs,
    limits: ['One 640x480 DPR1 checkpoint-loaded scene; not native timing or full display parity.',
      'Editable/loading guards have extracted-effect coverage, not browser coverage here.'] }
  const save = () => writeFileSync(resolve(output, 'hud-tab-shortcuts.json'), JSON.stringify(report, null, 2) + '\n')
  const button = name => page.getByRole('button', { name, exact: true })
  const settle = () => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  const observe = () => page.evaluate(() => {
    const world = window.testStore.getWorld(), scene = window.testSceneRef.current
    return { paused: world.paused, mode: world.mode, selected: [...world.selected],
      sceneCurrent: scene?.world === world, loading: !!document.querySelector('.loading-world'),
      scroll: [scrollX, scrollY],
      tabs: [...document.querySelectorAll('.dock-tabs button')].map(node => ({
        label: node.getAttribute('aria-label'), key: node.getAttribute('aria-keyshortcuts'),
        title: node.title, pressed: node.getAttribute('aria-pressed'),
      })) }
  })
  const setPaused = async paused => {
    const before = await observe()
    assert.equal(before.sceneCurrent, true)
    if (before.paused !== paused) await button(before.paused ? 'Resume game' : 'Pause game').click()
    await page.waitForFunction(expected => {
      const world = window.testStore.getWorld()
      return window.testSceneRef.current?.world === world && world.paused === expected
    }, paused)
  }
  const expectTab = async (key, label, paused = true) => {
    const before = await observe()
    assert.equal(before.sceneCurrent, true, 'HUD shortcut requires the current scene before dispatch')
    assert.equal(before.loading, false)
    assert.equal(before.paused, paused)
    await page.keyboard.press(key)
    await settle()
    const after = await observe()
    assert.deepEqual(after.tabs.filter(tab => tab.pressed === 'true').map(tab => tab.label), [label])
    assert.equal(after.paused, paused, 'HUD shortcut does not toggle simulation pause')
    assert.equal(after.mode, null)
    assert.equal(after.sceneCurrent, true)
    assert.equal(after.loading, false)
    assert.deepEqual(after.selected, before.selected)
    assert.deepEqual(after.scroll, before.scroll)
    report.cases.push({ key, before, after }); save()
  }
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; void page.close().catch(() => {}) }, hudTabEpisodeLimitMs)
  save()
  try {
    await settle()
    await page.waitForFunction(() => {
      const world = window.testStore.getWorld()
      return !world.inputMask && window.testSceneRef.current?.world === world &&
        !document.querySelector('.loading-world')
    })
    const loaded = await observe()
    assert.equal(loaded.sceneCurrent, true)
    assert.equal(loaded.loading, false)
    report.loadedPaused = loaded.paused
    // A compact replacement scene may already pause during its attachment,
    // after the recovery job captured the loaded World before activation.
    await setPaused(false)
    // A real HUD control owns focus; no artificial DOM focus target is inserted.
    await button('followers').click()
    await expectTab('Insert', 'buildings B', false)
    await setPaused(true)
    await button('followers').click()
    for (const [key, label, title] of [['Insert', 'buildings B', 'buildings · Insert'],
      ['Home', 'spells', 'spells · Home'], ['PageUp', 'followers', 'followers · Page Up']]) {
      await expectTab(key, label)
      const state = await observe(), tab = state.tabs.find(tab => tab.key === key)
      assert.equal(tab?.title, title)
      const name = `hud-tab-${key}.png`
      await page.screenshot({ path: resolve(output, name), timeout: 5000 })
      report.screenshots.push(name)
    }
    await expectTab('Home', 'spells')
    const blast = page.getByRole('button', { name: /^Blast, \d+ shots$/ })
    await blast.click()
    assert.equal((await observe()).mode, 'blast')
    await page.keyboard.down('Home')
    assert.equal((await observe()).mode, null)
    await blast.click()
    await page.keyboard.down('Home')
    await settle()
    assert.equal((await observe()).mode, 'blast', 'Held Home must not cancel newly armed targeting')
    await page.keyboard.up('Home')
    await expectTab('Insert', 'buildings B')
    for (const key of ['Shift+Home', 'Shift+PageUp', 'Shift+Insert']) {
      const before = await observe()
      await page.keyboard.press(key); await settle()
      assert.deepEqual((await observe()).tabs, before.tabs)
      report.cases.push({ rejected: key })
    }
    await button('Game settings').click()
    const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
    await menu.waitFor()
    for (const panel of ['root', 'options']) {
      if (panel === 'options') await button('Options').click()
      const before = await observe()
      for (const key of ['Home', 'Insert', 'PageUp']) await page.keyboard.press(key)
      assert.deepEqual((await observe()).tabs, before.tabs)
      report.cases.push({ suppressedBy: panel })
    }
    await button('Back').click()
    await button('Continue Game').click()
    await menu.waitFor({ state: 'hidden' })
    assert.equal((await observe()).paused, true)
    await expectTab('Home', 'spells')
    await setPaused(loaded.paused)
    const final = await observe()
    assert.equal(final.sceneCurrent, true)
    report.finalPaused = final.paused
    assert.equal(report.finalPaused, report.loadedPaused)
    assert.equal(timedOut, false)
    report.status = 'passed'
    return report
  } catch (error) {
    report.status = 'failed'; report.error = String(error); report.timedOut = timedOut
    throw error
  } finally {
    clearTimeout(timer)
    save()
    if (!page.isClosed()) await page.keyboard.up('Home')
  }
}
