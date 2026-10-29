import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { bindGame } from '../browser-game.mjs'

export const worshipPanelLifecycleLimitMs = 35000
export default async function worshipPanelLifecycle({ browser, url, output }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const report = { status: 'running', errors: [], screenshots: {}, limits: [
    'Actual production Home and renderer through test host; existing native friendly people relocated to supplied authored-shrine slots; not natural prayer acquisition',
    'Panel opening and slot/follower setup supplied; single/group selection and right-click focus use actual browser pointer input',
    'Retained stale DOM callbacks use synthetic event dispatch after supplied identity/overview/disposal boundaries and actual store replacement; not trusted stale user input',
    'Focus/sound/change observers delegate actual consumers and are restored; no production hooks, native pixel parity, deployment or performance claim',
  ] }
  let page, failure
  const screenshot = async name => {
    const file = `worship-panel-${name}.png`, path = resolve(output, file)
    await page.screenshot({ path, timeout: 10000 })
    report.screenshots[name] = { file, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }
  }
  const timer = setTimeout(() => { report.timedOut = true; void context.close().catch(e => report.errors.push(String(e))) }, worshipPanelLifecycleLimitMs)
  try {
    page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror', e => report.errors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
    page.on('crash', () => report.errors.push('Worship page crashed'))
    const target = new URL(url); target.searchParams.set('worship-panel-lifecycle', '1')
    await page.goto(target.href, { waitUntil: 'domcontentloaded' })
    const button = name => page.getByRole('button', { name, exact: true })
    await button('New Game').click()
    await page.locator('[data-original-tutorial-recommendation]').waitFor()
    await button('No').click(); await button('Start Mission 1').click(); await bindGame(page)
    const startup = await page.waitForFunction(() => {
      const w = window.testStore.getWorld(), skip = document.querySelector('button.skip-introduction')
      return !w.inputMask && w.levelStart.every(s => s.phase === 4) ? 'ready' : skip && skip.getClientRects().length && !skip.disabled ? 'skip' : false
    })
    if ((await startup.jsonValue()) === 'skip') await page.getByRole('button', { name: /^Skip introduction/ }).click()
    await startup.dispose()
    await page.waitForFunction(() => {
      const w = window.testStore.getWorld()
      return window.__pndWorshipPanelFixture && !w.inputMask && w.levelStart.every(s => s.phase === 4 && !s.wave && !s.carriers.length && s.stoneTurns.every(t => t === null || w.turn - t >= 20))
    })
    await button('Pause game').click(); await page.waitForFunction(() => window.testStore.getWorld().paused)
    await page.mouse.move(10, 10)
    report.setup = await page.evaluate(() => {
      const h = window.worshipLifecycle = window.__pndWorshipPanelFixture.prepare(window.testSceneRef.current)
      const gl = h.scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      return { shrine: h.head.id, people: h.units.map(u => u.id), expectedFocus: { x: h.units[0].x, z: h.units[0].z },
        renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) }
    })
    const panel = page.locator('.worship-panel:not([hidden])'), person = panel.locator(`button[data-person="${report.setup.people[0]}"]`)
    await person.waitFor({ state: 'visible' }); await person.focus()
    await screenshot('eligible')
    await person.click()
    report.single = await page.evaluate(() => [...window.worshipLifecycle.world.selected])
    assert.deepEqual(report.single, [report.setup.people[0]])
    await screenshot('single-selected')
    await person.click()
    assert.deepEqual(await page.evaluate(() => [...window.worshipLifecycle.world.selected]), [], 'Trusted second click deselects')
    await person.click({ modifiers: ['Shift'] })
    report.group = await page.evaluate(() => [...window.worshipLifecycle.world.selected])
    assert.deepEqual(report.group, report.setup.people)
    await screenshot('group-selected')
    await page.evaluate(() => {
      const h = window.worshipLifecycle
      h.button = h.scene.objectPanels.panels.get(h.head.id).element.querySelector(`button[data-person="${h.units[0].id}"]`)
      h.focusOriginal = h.scene.focus; h.soundOriginal = h.scene.onSound; h.changeOriginal = h.scene.onChange; h.events = []
      h.scene.focus = function (...args) { h.events.push(['focus', ...args]); return h.focusOriginal.apply(this, args) }
      h.scene.onSound = function (...args) { h.events.push(['sound', ...args]); return h.soundOriginal.apply(this, args) }
      h.scene.onChange = function (...args) { h.events.push(['change']); return h.changeOriginal.apply(this, args) }
    })
    await person.click({ button: 'right' })
    report.focus = await page.evaluate(() => {
      const h = window.worshipLifecycle
      return { events: h.events, inspected: h.scene.objectPanels.inspected, hasPersonPanel: h.scene.objectPanels.panels.has(h.units[0].id) }
    })
    assert.equal(report.focus.events.filter(e => e[0] === 'focus').length, 1)
    assert.equal(report.focus.events.find(e => e[0] === 'focus')[2].animate, true)
    assert.deepEqual(report.focus.events.find(e => e[0] === 'focus')[1], report.setup.expectedFocus)
    assert.equal(report.focus.inspected, report.setup.people[0]); assert.equal(report.focus.hasPersonPanel, true)
    await screenshot('right-focus')
    report.stale = await page.evaluate(() => {
      const h = window.worshipLifecycle, results = h.staleResults = []
      const activate = () => {
        h.button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
        h.button.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
      }
      try {
        for (const mode of ['removed shrine', 'same-ID replacement', 'overview', 'disposed', 'store replacement']) {
          const shrines = h.world.shrines, overview = h.scene.overviewActive, disposed = h.scene.disposed
          const selected = [...h.world.selected], inspected = h.scene.objectPanels.inspected
          h.events = []
          try {
            if (mode === 'removed shrine') h.world.shrines = shrines.filter(s => s !== h.head)
            if (mode === 'same-ID replacement') h.world.shrines = shrines.map(s => s === h.head ? { ...s } : s)
            if (mode === 'overview') h.scene.overviewActive = true
            if (mode === 'disposed') h.scene.disposed = true
            if (mode === 'store replacement') window.testStore.startMission(2)
            const currentSelected = [...window.testStore.getWorld().selected], boundaryEvents = [...h.events]
            h.events = []
            activate()
            const unchanged = JSON.stringify(selected) === JSON.stringify(h.world.selected) &&
              JSON.stringify(currentSelected) === JSON.stringify(window.testStore.getWorld().selected) &&
              inspected === h.scene.objectPanels.inspected && h.events.length === 0
            results.push({ mode, unchanged, boundaryEvents, events: [...h.events] })
            if (!unchanged) throw Error(`Stale ${mode} callback changed selection, inspection or feedback`)
          } finally { h.world.shrines = shrines; h.scene.overviewActive = overview; h.scene.disposed = disposed }
        }
        return results
      } finally { h.scene.focus = h.focusOriginal; h.scene.onSound = h.soundOriginal; h.scene.onChange = h.changeOriginal }
    })
    assert.equal(report.stale.length, 5); assert.ok(report.stale.every(x => x.unchanged))
  } catch (error) {
    failure = error
    try {
      if (page && !page.isClosed()) report.stale = await page.evaluate(() => window.worshipLifecycle?.staleResults ?? [])
    } catch (e) { report.staleReceiptError = String(e) }
    try { if (page && !page.isClosed()) await screenshot('failure') } catch (e) { report.diagnosticError = String(e) }
  } finally {
    clearTimeout(timer)
    try {
      if (page && !page.isClosed()) await page.evaluate(() => {
        const h = window.worshipLifecycle
        if (h?.focusOriginal) h.scene.focus = h.focusOriginal
        if (h?.soundOriginal) h.scene.onSound = h.soundOriginal
        if (h?.changeOriginal) h.scene.onChange = h.changeOriginal
      })
    } catch (e) { report.observerCleanupError = String(e) }
    try { await context.close(); report.contextClosed = true } catch (e) { report.errors.push(String(e)) }
    report.status = failure || report.timedOut || report.errors.length ? 'failed' : 'passed'
    if (failure) report.failure = { message: String(failure), stack: failure.stack }
    writeFileSync(resolve(output, 'worship-panel-lifecycle.json'), JSON.stringify(report, null, 2) + '\n')
  }
  assert.equal(report.status, 'passed', 'Worship lifecycle failed; preserved receipt')
  return report
}
