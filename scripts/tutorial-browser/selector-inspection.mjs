import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { bindGame } from '../browser-game.mjs'

export async function finishInspection({ context, observation, output, episodes, helpEntry, errors, failure, diagnostics }) {
  const cleanup = { observationDisconnected: false, contextClosed: false, errors: [] }
  const failures = failure ? [failure] : []
  for (const [phase, action] of [
    ['observationDisconnected', () => observation?.evaluate(observer => observer.disconnect())],
    ['contextClosed', () => context.close()],
  ]) {
    try { await action(); cleanup[phase] = true } catch (error) {
      cleanup.errors.push({ phase, message: String(error), stack: error.stack })
      failures.push(error)
    }
  }
  if (errors.length) failures.push(new Error(`Selector runtime/console errors: ${JSON.stringify(errors)}`))
  const terminal = { status: failures.length ? 'failed' : 'passed', episodes, ...(helpEntry ? { helpEntry } : {}), errors, cleanup,
    failure: failure ? { message: String(failure), stack: failure.stack, ...diagnostics } : null }
  writeFileSync(resolve(output, 'selector-inspection.json'), JSON.stringify(terminal, null, 2) + '\n')
  if (failures.length) throw new AggregateError(failures, 'Selector inspection failed; see selector-inspection.json')
  return terminal
}

// Observe Home's existing refs without changing the store, scene, clocks or loaders.
async function observeGame(page) {
  return page.evaluateHandle(() => {
    const store = window.testStore, sceneRef = window.testSceneRef
    const scene = sceneRef.current, world = store.getWorld(), canvas = scene.renderer.domElement
    let sessionRef, session, frozen, loadingSeen = false, canvasRemoved = false
    const mutations = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1 && (node.matches('.loading-world') || node.querySelector('.loading-world'))) loadingSeen = true
        }
        for (const node of record.removedNodes) {
          if (node === canvas || node.contains(canvas)) canvasRemoved = true
        }
      }
    })
    mutations.observe(document.body, { childList: true, subtree: true })
    const clock = () => ({ level: world.outcome.level, turn: world.turn, time: world.time })
    return {
      captureSession() {
        const main = document.querySelector('main')
        let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
        const refs = []
        for (; fiber; fiber = fiber.return) {
          for (let hook = fiber.memoizedState; hook; hook = hook.next) {
            const ref = hook.memoizedState
            if (ref?.current?.world === world && typeof ref.current.paused === 'boolean') refs.push(ref)
          }
        }
        if (refs.length !== 1) throw Error(`Expected one captured menuSession, found ${refs.length}`)
        sessionRef = refs[0]
        session = sessionRef.current
        frozen = clock()
        return { ...frozen, capturedPaused: session.paused }
      },
      read() {
        return {
          sameWorld: store.getWorld() === world,
          sameScene: sceneRef.current === scene,
          sameSceneWorld: scene.world === world,
          sameCanvas: scene.renderer.domElement === canvas && document.querySelector('.world-viewport canvas') === canvas && canvas.isConnected,
          disposed: scene.disposed,
          terrainAborted: scene.terrainLoad.signal.aborted,
          loading: loadingSeen || !!document.querySelector('.loading-world'),
          canvasRemoved,
          sameSession: sessionRef?.current === session && session?.world === world,
          sessionCleared: sessionRef?.current === null,
          paused: world.paused,
          modalSuspended: scene.modalSuspended,
          frozen: JSON.stringify(clock()) === JSON.stringify(frozen),
          ...clock(),
        }
      },
      disconnect() { mutations.disconnect() },
    }
  })
}

export default async function ({ browser, url, output }) {
  const context = await browser.newContext({ viewport: { width: 960, height: 720 } })
  const episodes = [], helpEntry = [], errors = []
  let page, observation, failure, result
  const diagnostics = {}
  try {
    page = await context.newPage()
    page.setDefaultTimeout(25000)
    page.on('pageerror', error => errors.push(String(error)))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    const button = name => page.getByRole('button', { name, exact: true })
    const selector = page.getByRole('dialog', { name: 'Start game', exact: true })
    const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await button('New Game').click()
    await page.locator('[data-original-tutorial-recommendation]').waitFor()
    await button('No').click()
    await selector.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
    await bindGame(page)
    await skipIntroductionWithSpace(page)
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    observation = await observeGame(page)
    const read = () => page.evaluate(observer => observer.read(), observation)
    const retained = state => {
      for (const key of ['sameWorld', 'sameScene', 'sameSceneWorld', 'sameCanvas']) assert.equal(state[key], true, key)
      for (const key of ['disposed', 'terrainAborted', 'loading', 'canvasRemoved']) assert.equal(state[key], false, key)
      assert.equal(state.level, 1)
    }
    const frozen = async () => {
      const state = await read()
      retained(state)
      for (const key of ['sameSession', 'paused', 'modalSuspended', 'frozen']) assert.equal(state[key], true, key)
      return state
    }
    let checkedHelpEntry = false
    const checkHelpEntry = async () => {
      const help = menu.getByRole('region', { name: 'Browser compatibility and help', exact: true })
      for (const exit of ['Back', 'Escape', 'continue']) {
        await page.waitForFunction(() => document.activeElement?.hasAttribute('data-browser-help-heading'))
        const layout = await help.evaluate(element => {
          const heading = element.querySelector('[data-browser-help-heading]')
          const bounds = element.getBoundingClientRect(), title = heading.getBoundingClientRect()
          return { scrollTop: element.scrollTop, scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight, headingTop: title.top, headingBottom: title.bottom,
            panelTop: bounds.top, panelBottom: bounds.bottom, focused: document.activeElement === heading }
        })
        helpEntry.push({ exit, ...layout })
        assert.equal(layout.focused, true)
        assert.ok(layout.scrollHeight > layout.clientHeight, 'Use the real overflowing in-game help')
        assert.ok(layout.scrollTop <= 1, 'Opening and reopening help must start at the top')
        assert.ok(layout.headingTop >= layout.panelTop && layout.headingBottom <= layout.panelBottom,
          'The complete heading must be visible before any scrolling action')
        await frozen()
        if (exit === 'continue') break
        if (exit === 'Back') {
          await page.screenshot({ path: resolve(output, 'options-help-entry.png') })
          await help.getByRole('button', { name: 'Back to Options', exact: true }).click()
        } else {
          await help.getByRole('button', { name: 'Back to Options', exact: true }).focus()
          assert.ok(await help.evaluate(element => element.scrollTop > 0), 'Exercise Escape after scrolling down')
          await page.keyboard.press('Escape')
        }
        await help.waitFor({ state: 'hidden' })
        await page.waitForFunction(() => document.activeElement?.hasAttribute('data-compatibility'))
        assert.equal(await menu.locator('[data-original-options]').getAttribute('data-category'), 'Game')
        await frozen()
        await button('Browser compatibility and help').click()
      }
      checkedHelpEntry = true
    }
    const inspect = async () => {
      await button('Options').click()
      await frozen()
      await button('Browser compatibility and help').click()
      await frozen()
      if (!checkedHelpEntry) await checkHelpEntry()
      await page.getByRole('region', { name: 'Browser compatibility and help', exact: true })
        .getByRole('button', { name: 'Select Level', exact: true }).click()
      await selector.getByRole('button', { name: 'Browser controls', exact: true }).click()
      await selector.getByRole('combobox', { name: 'Inspect campaign world', exact: true }).selectOption('2')
      assert.equal(await selector.getByRole('combobox', { name: 'Inspect campaign world', exact: true }).inputValue(), '2')
      await frozen()
      await page.waitForTimeout(200)
      await frozen()
    }
    const openMenu = async paused => {
      await button('Game settings').click()
      await menu.waitFor()
      const captured = await page.evaluate(observer => observer.captureSession(), observation)
      assert.equal(captured.capturedPaused, paused)
      await frozen()
      return captured
    }
    const restored = async (paused, captured) => {
      await menu.waitFor({ state: 'hidden' })
      const state = await read()
      retained(state)
      assert.equal(state.paused, paused)
      assert.equal(state.modalSuspended, false)
      assert.equal(state.sessionCleared, true)
      if (paused) {
        await page.waitForTimeout(250)
        assert.equal((await read()).frozen, true, 'Initially paused world remains frozen')
      } else {
        await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, captured.turn, { timeout: 10000 })
        const resumed = await read()
        retained(resumed)
        assert.ok(resumed.time > captured.time, 'Initially running world resumes its clock')
      }
    }
    for (const paused of [true, false]) {
      await button(paused ? 'Pause game' : 'Resume game').click()
      const captured = await openMenu(paused)
      await inspect()
      await page.screenshot({ path: resolve(output, `selector-inspection-${paused ? 'paused' : 'running'}.png`) })
      await selector.getByRole('button', { name: 'Back', exact: true }).click()
      await menu.waitFor()
      const afterBack = await frozen()
      await inspect()
      await page.keyboard.press('Escape')
      await menu.waitFor()
      const afterEscape = await frozen()
      await button('Continue Game').click()
      await restored(paused, captured)

      const repeated = await openMenu(paused)
      await inspect()
      await page.keyboard.press('Escape')
      await menu.waitFor()
      await frozen()
      await page.keyboard.press('Escape')
      await restored(paused, repeated)
      episodes.push({ initiallyPaused: paused, captured, afterBack, afterEscape, repeatedEscape: await read() })
    }
    result = { checks: ['selector-inspection-same-live-world-back-escape-repeat-and-pause-policy',
      'options-help-heading-focus-scroll-back-escape-and-reopen'], episodes, helpEntry,
      limits: ['Browser regression only; no new native campaign rules or original-executable evidence', 'Actual Home through plain Vite; no Vinext/Cloudflare/RSC or hardware performance claim'] }
  } catch (error) {
    failure = error
    try {
      diagnostics.state = await observation?.evaluate(observer => observer.read())
      await page?.screenshot({ path: resolve(output, 'selector-inspection-failure.png'), timeout: 10000 })
    } catch (diagnosticError) { diagnostics.error = String(diagnosticError) }
  }
  const terminal = await finishInspection({ context, observation, output, episodes, helpEntry, errors, failure, diagnostics })
  return { ...result, cleanup: terminal.cleanup }
}
