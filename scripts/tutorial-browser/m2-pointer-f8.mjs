import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { checkpointCodec } from './checkpoint-codec.mjs'

export const m2FunctionalLimitMs = 45000
export function assertM2Input(before, after) {
  assert.equal(after.level, 2)
  assert.equal(after.sameScene, true)
  assert.deepEqual(after.selected, before.selected, 'Pointer/camera inputs must not select units')
  assert.deepEqual(after.orders, before.orders, 'Pointer/camera inputs must not issue orders')
  assert.equal(after.turn, before.turn, 'Paused diagnostic must preserve the simulation turn')
}

export async function finishM2Functional({ context, report, output, failure }) {
  try {
    await context.close()
    report.contextClosed = true
  } catch (error) {
    report.errors.push(String(error))
  }
  report.status = failure || report.errors.length || report.timedOut ? 'failed' : 'passed'
  if (failure) report.failure = { message: String(failure), stack: failure.stack }
  writeFileSync(resolve(output, 'm2-pointer-f8.json'), JSON.stringify(report, null, 2))
  assert.equal(report.status, 'passed', 'M2 functional scenario failed; see receipt')
  return report
}

export const m2RouteReady = ({ x, y, world }) => {
  const s = window.testSceneRef.current,
    t = s.tooltipInput
  const worldRoute = ['world', 'unmapped-cell', 'unmapped-object'].includes(t?.route)
  if (!world) return s.pointerScreen === null && !worldRoute
  return (
    s.pointerScreen?.clientX === x &&
    s.pointerScreen?.clientY === y &&
    t?.pointer?.clientX === x &&
    t?.pointer?.clientY === y &&
    worldRoute &&
    Number.isInteger(t.cell) &&
    t.cell >= 0 &&
    t.cell <= 0xfefe &&
    (t.cell & ~0xfefe) === 0
  )
}

export function m2LoadReady() {
  const button = document.querySelector(
    'nav[aria-label="Main menu choices"] button[aria-label="Load Game"]'
  )
  return button?.getAttribute('aria-disabled') === 'false'
}

export function m2StartupReady() {
  const world = window.testStore.getWorld()
  const button = document.querySelector('button.skip-introduction')
  const skipVisible =
    !!button &&
    button.getClientRects().length > 0 &&
    getComputedStyle(button).visibility !== 'hidden' &&
    !button.disabled
  if (world.inputMask && !skipVisible) return false
  return {
    action: world.inputMask ? 'skip' : 'ready',
    inputMask: world.inputMask,
    flybyFlags: world.flyby.flags,
    level: world.outcome.level,
    skipVisible,
  }
}

export default async function ({ browser, url, output, fixture }) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })
  const report = {
    status: 'running',
    setup: fixture.receipt,
    errors: [],
    samples: [],
    limits: [
      'Test-only imported M2 checkpoint, not campaign progression/unlock proof',
      'Paused functional pointer/camera/F8 coverage, not timing, hardware FPS or responsiveness acceptance',
      'Seam crossing and hidden-tab transition not covered; actual reached camera states recorded',
    ],
  }
  let failure, timer
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  page.on('pageerror', e => report.errors.push(String(e)))
  page.on('console', m => {
    if (m.type() === 'error') report.errors.push(m.text())
  })
  page.on('crash', () => report.errors.push('Page crashed'))
  timer = setTimeout(() => {
    report.timedOut = true
    void context.close().catch(() => {})
  }, m2FunctionalLimitMs)
  try {
    // Only test setup writes storage. This context is new, has no user data/profile,
    // and closes at termination. The identical codec preserves structured values.
    await page.addInitScript({
      content: `window.m2CheckpointCodec = ${checkpointCodec.toString()};`,
    })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const readback = await page.evaluate(async transfer => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('populous-new-dawn', 1)
        request.onupgradeneeded = () => request.result.createObjectStore('checkpoints')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction('checkpoints', 'readwrite')
          tx.objectStore('checkpoints').put(window.m2CheckpointCodec(transfer, true), 'latest')
          tx.oncomplete = resolve
          tx.onerror = () => reject(tx.error)
          tx.onabort = () => reject(tx.error)
        })
        return await new Promise((resolve, reject) => {
          const tx = db.transaction('checkpoints', 'readonly')
          let value
          const request = tx.objectStore('checkpoints').get('latest')
          request.onsuccess = () => {
            value = request.result
          }
          tx.oncomplete = () => resolve(window.m2CheckpointCodec(value))
          tx.onerror = () => reject(tx.error)
          tx.onabort = () => reject(tx.error)
        })
      } finally {
        db.close()
      }
    }, fixture.transfer)
    assert.deepEqual(
      readback,
      fixture.transfer,
      'Committed IDB preserves entire structured checkpoint'
    )
    await page.reload({ waitUntil: 'domcontentloaded' })
    const load = page
      .getByRole('dialog', { name: 'Main menu', exact: true })
      .getByRole('button', { name: 'Load Game', exact: true })
    await load.waitFor({ state: 'visible' })
    await page.waitForFunction(m2LoadReady)
    await page.evaluate(() => {
      const main = document.querySelector('main')
      let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))],
        store
      for (; fiber && !store; fiber = fiber.return)
        for (let hook = fiber.memoizedState; hook; hook = hook.next)
          if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) {
            store = hook.memoizedState
            break
          }
      if (!store) throw Error('Store unavailable before public Load')
      const before = store.getWorld()
      window.m2LoadBoundary = null
      window.m2LoadError = null
      const unsubscribe = store.subscribe(() => {
        if (store.getWorld() === before) return
        try {
          window.m2LoadBoundary = window.m2CheckpointCodec(store.getWorld())
        } catch (error) {
          window.m2LoadError = String(error)
        } finally {
          unsubscribe()
        }
      })
    })
    await load.click()
    assert.equal(await page.evaluate(() => window.m2LoadError), null)
    assert.deepEqual(
      await page.evaluate(() => window.m2LoadBoundary),
      fixture.expected,
      'Exact full post-migration world at public Load boundary'
    )
    report.loadBoundaryMatched = true
    await bindGame(page)
    // Scene binding can precede the campaign script's first flyby and React's
    // public Skip control. Wait for an actionable state, never sample once.
    const startup = await page.waitForFunction(m2StartupReady)
    report.startup = await startup.jsonValue()
    await startup.dispose()
    assert.equal(report.startup.level, 2)
    if (report.startup.action === 'skip')
      await page.getByRole('button', { name: /^Skip introduction/ }).click()
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await page.getByRole('button', { name: 'Pause game', exact: true }).click()
    await page.waitForFunction(() => window.testStore.getWorld().paused)
    const observe = () =>
      page.evaluate(() => {
        const s = window.testSceneRef.current,
          w = window.testStore.getWorld(),
          canvas = s.renderer.domElement
        const gl = s.renderer.getContext(),
          debug = gl.getExtension('WEBGL_debug_renderer_info')
        return {
          level: w.outcome.level,
          turn: w.turn,
          paused: w.paused,
          sameScene: s === window.testScene && s.world === w && canvas.isConnected,
          selected: [...w.selected],
          orders: w.units.map(u => [
            u.id,
            u.target,
            u.work,
            u.tree,
            u.guard,
            u.path.map(p => [p.x, p.z]),
          ]),
          pointerScreen: s.pointerScreen ? { ...s.pointerScreen } : null,
          hover: s.hoveredObject,
          tooltip: s.tooltipInput
            ? {
                route: s.tooltipInput.route,
                cell: s.tooltipInput.cell,
                picked: s.tooltipInput.picked,
                pointer: s.tooltipInput.pointer,
              }
            : null,
          camera: {
            position: { ...s.cameraPosition },
            bearing: s.cameraBearing,
            zoom: s.viewZoom,
            viewPoint: { ...s.viewPoint },
          },
          renderer: debug
            ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER),
          webgl: gl.getParameter(gl.VERSION),
          viewport: [innerWidth, innerHeight],
          dpr: devicePixelRatio,
        }
      })
    report.before = await observe()
    assert.equal(report.before.level, 2)
    assert.match(report.before.webgl, /WebGL 2/)
    const graph = page.locator('.fps-graph')
    await graph.waitFor({ state: 'hidden' })
    await page.keyboard.press('F8')
    await graph.waitFor({ state: 'visible' })
    assert.match(await graph.innerText(), /Pointer \+ tooltip CPU/)
    assert.match(await graph.innerText(), /GPU not measured/)
    assert.equal(await graph.evaluate(el => getComputedStyle(el).pointerEvents), 'none')
    const moveAndObserve = async (x, y, world) => {
      await page.mouse.move(x, y)
      await page.waitForFunction(m2RouteReady, { x, y, world })
      const state = await observe()
      assertM2Input(report.before, state)
      return state
    }
    // Pause gives an exact no-orders witness while ordinary RAF still drives picks.
    for (const [x, y, world] of [
      [700, 340, true],
      [100, 300, false],
      [900, 400, true],
    ]) {
      report.samples.push(await moveAndObserve(x, y, world))
    }
    await page.screenshot({ path: resolve(output, 'm2-pointer-wide.png') })
    const beforeCamera = await observe()
    for (const key of ['ArrowRight', 'w']) {
      await page.keyboard.down(key)
      await page.waitForTimeout(250)
      await page.keyboard.up(key)
    }
    await page.keyboard.press('-')
    await page.waitForFunction(
      zoom => window.testSceneRef.current.viewZoom !== zoom,
      beforeCamera.camera.zoom
    )
    report.cameraAfter = await observe()
    assertM2Input(report.before, report.cameraAfter)
    assert.notEqual(
      report.cameraAfter.camera.position.angle,
      beforeCamera.camera.position.angle,
      'Public rotation changed angle'
    )
    assert.notDeepEqual(
      [report.cameraAfter.camera.position.x, report.cameraAfter.camera.position.y],
      [beforeCamera.camera.position.x, beforeCamera.camera.position.y],
      'Public pan changed coordinates'
    )
    assert.notEqual(
      report.cameraAfter.camera.zoom,
      beforeCamera.camera.zoom,
      'Public zoom changed reached zoom'
    )
    for (const [width, height] of [
      [640, 480],
      [1440, 1000],
    ]) {
      await page.setViewportSize({ width, height })
      await page.evaluate(
        () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      )
      const layout = await graph.evaluate(el => {
        const r = el.getBoundingClientRect()
        return {
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
          overflow: document.documentElement.scrollWidth > innerWidth,
          events: getComputedStyle(el).pointerEvents,
          rowsFit: [...el.querySelectorAll('dl > div')].every(row => {
            const bounds = row.getBoundingClientRect()
            return (
              bounds.left >= r.left &&
              bounds.right <= r.right &&
              bounds.top >= r.top &&
              bounds.bottom <= r.bottom &&
              row.scrollWidth <= row.clientWidth
            )
          }),
        }
      })
      assert.ok(
        layout.left >= 0 && layout.top >= 0 && layout.right <= width && layout.bottom <= height
      )
      assert.equal(layout.rowsFit, true, 'Metric rows must fit without horizontal clipping')
      assert.equal(layout.overflow, false)
      assert.equal(layout.events, 'none')
      const routed = await moveAndObserve(width - 60, height - 100, true)
      const sidebar = await moveAndObserve(100, 300, false)
      report.samples.push({ viewport: [width, height], layout, routed, sidebar })
      await page.screenshot({ path: resolve(output, `m2-pointer-${width}.png`) })
    }
    await page.keyboard.press('F8')
    await graph.waitFor({ state: 'hidden' })
    await page.evaluate(() => {
      window.m2ResetWindow = null
      const observer = new MutationObserver(() => {
        const graph = document.querySelector('.fps-graph')
        if (!graph) return
        window.m2ResetWindow = graph.querySelector('[data-metric="window"]').textContent
        observer.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    })
    await page.keyboard.press('F8')
    await graph.waitFor({ state: 'visible' })
    report.resetWindow = await page.evaluate(() => window.m2ResetWindow)
    assert.equal(
      report.resetWindow,
      '0 samples',
      'New F8 overlay begins with an empty window before RAF'
    )
    report.after = await observe()
    assertM2Input(report.before, report.after)
    await page.getByRole('button', { name: 'Resume game', exact: true }).click()
    await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, report.before.turn)
    await page.waitForFunction(
      () => document.querySelector('.fps-graph [data-metric="window"]')?.textContent !== '0 samples'
    )
    report.resumed = await observe()
    await page.getByRole('button', { name: 'Game settings', exact: true }).click()
    await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'visible' })
    await page.waitForFunction(() =>
      document.querySelector('.fps-graph [data-metric="state"]')?.textContent.startsWith('Menu')
    )
    report.menu = await observe()
    await page.keyboard.press('Escape')
    await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'hidden' })
    await page.waitForFunction(() => !window.testStore.getWorld().paused)
    report.returned = await observe()
    assert.equal(report.returned.level, 2)
    assert.equal(report.returned.sameScene, true)
  } catch (error) {
    failure = error
    try {
      report.failureState = await page.evaluate(() => {
        const w = window.testStore?.getWorld(),
          button = document.querySelector('button.skip-introduction')
        return {
          level: w?.outcome.level,
          turn: w?.turn,
          inputMask: w?.inputMask,
          flybyFlags: w?.flyby.flags,
          paused: w?.paused,
          skipVisible: !!button && button.getClientRects().length > 0,
          skipText: button?.textContent,
          body: document.body.innerText.slice(0, 2000),
        }
      })
    } catch (diagnosticError) {
      report.diagnosticError = String(diagnosticError)
    }
    try {
      await page.screenshot({ path: resolve(output, 'm2-pointer-failure.png'), timeout: 3000 })
    } catch {}
  } finally {
    clearTimeout(timer)
  }
  return finishM2Functional({ context, report, output, failure })
}
