import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { checkFrameExport, m2NativePointerTarget } from './frame-export.mjs'
import { checkpointCodec } from './checkpoint-codec.mjs'

export const m2FunctionalLimitMs = 45000
export function assertM2Input(before, after) {
  assert.equal(after.level, 2)
  assert.equal(after.sameScene, true)
  assert.deepEqual(after.selected, before.selected, 'Pointer/camera inputs must not select units')
  assert.deepEqual(after.orders, before.orders, 'Pointer/camera inputs must not issue orders')
  assert.equal(after.turn, before.turn, 'Paused diagnostic must preserve the simulation turn')
}

export async function finishM2Functional({
  context,
  report,
  output,
  failure,
  fileName = 'm2-pointer-f8.json',
}) {
  try {
    await context.close()
    report.contextClosed = true
  } catch (error) {
    report.errors.push(String(error))
  }
  report.status = failure || report.errors.length || report.timedOut ? 'failed' : 'passed'
  if (failure) report.failure = { message: String(failure), stack: failure.stack }
  writeFileSync(resolve(output, fileName), JSON.stringify(report, null, 2))
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

export function m2RectanglesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

export function m2ViewReady(preset) {
  const s = window.testSceneRef.current
  return (
    s.viewPreset === preset &&
    s.viewTransition === null &&
    !s.overviewActive &&
    JSON.stringify(s.view.config) === JSON.stringify(s.currentPreset()) &&
    s.view.projection.width === Math.max(1, Math.round(s.container.clientWidth)) &&
    s.view.projection.height === Math.max(1, Math.round(s.container.clientHeight))
  )
}

export function m2HudPoint() {
  const hud = document.querySelector('.native-hud')
  if (!hud) throw new Error('Native HUD missing')
  const r = hud.getBoundingClientRect()
  const x = Math.floor((Math.max(0, r.left) + Math.min(innerWidth, r.right)) / 2)
  const y = Math.floor((Math.max(0, r.top) + Math.min(innerHeight, r.bottom)) / 2)
  if (
    !(x > r.left && x < r.right && y > r.top && y < r.bottom) ||
    document.elementFromPoint(x, y)?.closest('.native-hud') !== hud
  )
    throw new Error('Measured HUD point is not owned by native HUD')
  return { x, y, left: r.left, right: r.right, top: r.top, bottom: r.bottom }
}

export function m2SamplesReady() {
  const text = document.querySelector('.fps-graph [data-metric="window"]')?.textContent
  return /^[1-9]\d* \/ 240 samples$/.test(text ?? '')
}

export function m2LoadReady() {
  const button = document.querySelector(
    'nav[aria-label="Main menu choices"] button[aria-label="Load Game"]'
  )
  return button?.getAttribute('aria-disabled') === 'false'
}

export function m2StartupReady() {
  const world = window.testStore.getWorld()
  const skipAvailable = (world.inputMask & 64) !== 0 && (world.flyby.flags & 0x51) === 0x11
  if (world.inputMask && !skipAvailable) return false
  return {
    action: world.inputMask ? 'skip' : 'ready',
    inputMask: world.inputMask,
    flybyFlags: world.flyby.flags,
    level: world.outcome.level,
    skipAvailable,
  }
}

// Keep the legacy compact episode within its original deadline. The expanded
// readout has its own fresh context and deadline inside the existing job cap.
export async function runCompactDiagnosticEpisodes({ report, ...options }, runEpisode = runM2Functional) {
  report.compactMessageLayout = await runEpisode({ ...options, compactMessages: true })
  report.pickingPathReadout = await runEpisode({ ...options, pickingPaths: true })
}

export default async function runM2Functional({ browser, url, output, fixture, compactMessages = false, pickingPaths = false }) {
  assert.ok(!(compactMessages && pickingPaths), 'Diagnostic episodes must have independent contexts')
  const scenario = pickingPaths ? 'picking-path-readout' : compactMessages ? 'compact-message-layout' : 'm2-pointer-f8'
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })
  const report = {
    status: 'running',
    scenario,
    setup: fixture.receipt,
    errors: [],
    samples: [],
    stages: [],
    limits: [
      'Test-only imported M2 checkpoint, not campaign progression/unlock proof',
      compactMessages || pickingPaths
        ? 'Paused compact message/F8 layout and public HUD preference coverage, not performance acceptance'
        : 'Paused functional pointer/camera/F8 coverage, not timing, hardware FPS or responsiveness acceptance',
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
  const started = performance.now()
  const stage = name => report.stages.push({ name, elapsedMs: performance.now() - started })
  stage('start')
  timer = setTimeout(() => {
    stage('deadline')
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
    stage('home-open')
    // The codec graph is already lossless JSON-safe tagged data. Transfer its
    // complete JSON text instead of expanding every numeric node through the
    // browser protocol serializer; keep full structural equality at both boundaries.
    const readbackJson = await page.evaluate(async transferJson => {
      const transfer = JSON.parse(transferJson)
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
          tx.oncomplete = () => resolve(JSON.stringify(window.m2CheckpointCodec(value)))
          tx.onerror = () => reject(tx.error)
          tx.onabort = () => reject(tx.error)
        })
      } finally {
        db.close()
      }
    }, JSON.stringify(fixture.transfer))
    const readback = JSON.parse(readbackJson)
    assert.deepEqual(
      readback,
      fixture.transfer,
      'Committed IDB preserves entire structured checkpoint'
    )
    stage('idb-readback-matched')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForStartupMenu(page)
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
          window.m2LoadBoundary = JSON.stringify(window.m2CheckpointCodec(store.getWorld()))
        } catch (error) {
          window.m2LoadError = String(error)
        } finally {
          unsubscribe()
        }
      })
    })
    stage('public-load-ready')
    await load.click()
    assert.equal(await page.evaluate(() => window.m2LoadError), null)
    assert.deepEqual(
      JSON.parse(await page.evaluate(() => window.m2LoadBoundary)),
      fixture.expected,
      'Exact full post-migration world at public Load boundary'
    )
    report.loadBoundaryMatched = true
    stage('load-boundary-matched')
    await bindGame(page)
    stage('scene-bound')
    // Scene binding can precede the campaign script's first flyby and React's
    // public Skip control. Wait for an actionable state, never sample once.
    const startup = await page.waitForFunction(m2StartupReady)
    report.startup = await startup.jsonValue()
    await startup.dispose()
    assert.equal(report.startup.level, 2)
    if (report.startup.action === 'skip')
      await skipIntroductionWithSpace(page)
    await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
    stage('introduction-ready')
    // Compact viewports no longer add a browser-authored blocking advisory.
    await page.setViewportSize({ width: 640, height: 480 })
    assert.equal(await page.locator('.desktop-recommendation').count(), 0)
    report.compactViewportReady = true
    stage('compact-admitted')
    await page.setViewportSize({ width: 1440, height: 1000 })
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
            preset: s.viewPreset,
            transitionRemaining: s.viewTransition?.remaining ?? null,
            config: s.view.config,
            targetConfig: s.currentPreset(),
            projectionSize: [s.view.projection.width, s.view.projection.height],
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
    stage('paused-baseline')
    assert.equal(report.before.level, 2)
    assert.match(report.before.webgl, /WebGL 2/)
    if (pickingPaths) {
      const { checkExpandedPickingPaths } = await import('./compact-message-layout.mjs')
      report.pickingPaths = {}
      await checkExpandedPickingPaths({ page, output, stage, report: report.pickingPaths })
    } else if (compactMessages) {
      const { checkCompactMessages } = await import('./compact-message-layout.mjs')
      report.compactMessages = { cases: [] }
      await checkCompactMessages({ page, output, stage, report: report.compactMessages })
    } else {
      const graph = page.locator('.fps-graph')
      await graph.waitFor({ state: 'hidden' })
      await page.keyboard.press('F8')
      await graph.waitFor({ state: 'visible' })
      assert.match(await graph.innerText(), /Pointer \+ tooltip CPU/)
      assert.match(await graph.innerText(), /CPU excludes overlay\/GPU\. Async GPU: export only/)
      assert.equal(await graph.evaluate(el => getComputedStyle(el).pointerEvents), 'none')
      const moveAndObserve = async (x, y, world) => {
        await page.mouse.move(x, y)
        await page.waitForFunction(m2RouteReady, { x, y, world })
        const state = await observe()
        assertM2Input(report.before, state)
        return state
      }
      const moveToHud = async () => {
        const point = await page.evaluate(m2HudPoint)
        report.hudPoints ??= []
        report.hudPoints.push(point)
        return moveAndObserve(point.x, point.y, false)
      }
      // Replace one arbitrary ground pixel with a rendered native person hit.
      const nativeTarget = await page.evaluate(m2NativePointerTarget)
      assert.ok(nativeTarget, 'bounded rendered-person target must be available')
      report.nativePointerTarget = nativeTarget
      // Pause gives an exact no-orders witness while ordinary RAF still drives picks.
      for (const [x, y, world] of [
        [nativeTarget.x, nativeTarget.y, true],
        [null, null, false],
        [900, 400, true],
      ]) {
        report.samples.push(world ? await moveAndObserve(x, y, true) : await moveToHud())
      }
      stage('initial-pointer-routes-matched')
      // The restored-wide capture below covers this unchanged layout too; avoid
      // another large PNG encode inside the bounded functional episode.
      const beforeCamera = await observe()
      report.cameraBefore = beforeCamera
      assert.equal(beforeCamera.camera.preset, 0, 'Loaded ground view begins at normal preset')
      for (const key of ['ArrowRight', 'w']) {
        await page.keyboard.down(key)
        await page.waitForTimeout(250)
        await page.keyboard.up(key)
      }
      await page.keyboard.press('-')
      report.cameraRequested = await observe()
      await page.waitForFunction(m2ViewReady, 2)
      report.cameraAfter = await observe()
      stage('camera-reached')
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
      assert.equal(report.cameraAfter.camera.preset, 2, 'Public zoom reached bird’s-eye preset')
      assert.equal(report.cameraAfter.camera.transitionRemaining, null)
      assert.deepEqual(report.cameraAfter.camera.config, report.cameraAfter.camera.targetConfig)
      assert.notDeepEqual(
        report.cameraAfter.camera.config,
        beforeCamera.camera.config,
        'Public zoom changed actual rendered camera configuration'
      )
      for (const [width, height] of [
        [640, 480],
        [900, 360],
        [1280, 720],
        [1440, 1000],
      ]) {
        await page.setViewportSize({ width, height })
        await page.evaluate(
          () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        )
        await page.waitForFunction(m2ViewReady, 2)
        if (width === 640 || width === 1280) {
          report.exports ??= []
          report.exports.push(await checkFrameExport({ page, output, keyboard: width === 1280 }))
          stage(`export-${width}-verified`)
        }
        const layout = await graph.evaluate(m2DiagnosticLayout)
        report.layouts ??= []
        report.layouts.push({ viewport: [width, height], ...layout })
        assertM2DiagnosticLayout(layout, width, height)
        const routed = await moveAndObserve(width - 60, height - 100, true)
        const sidebar = await moveToHud()
        report.samples.push({ viewport: [width, height], layout, routed, sidebar })
        stage(`viewport-${width}x${height}-asserted`)
        await page.screenshot({ path: resolve(output, `m2-pointer-${width}.png`) })
        stage(`viewport-${width}x${height}-captured`)
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
      stage('f8-reset-matched')
      assertM2Input(report.before, report.after)
      await page.getByRole('button', { name: 'Resume game', exact: true }).click()
      await page.waitForFunction(
        turn => window.testStore.getWorld().turn > turn,
        report.before.turn
      )
      await page.waitForFunction(m2SamplesReady)
      report.resumed = await observe()
      stage('resumed')
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
      stage('menu-returned')
      assert.equal(report.returned.level, 2)
      assert.equal(report.returned.sameScene, true)
    }
  } catch (error) {
    failure = error
    try {
      report.failureState = await page.evaluate(() => {
        const w = window.testStore?.getWorld()
        return {
          level: w?.outcome.level,
          turn: w?.turn,
          inputMask: w?.inputMask,
          flybyFlags: w?.flyby.flags,
          paused: w?.paused,
          camera: window.testSceneRef?.current && {
            preset: window.testSceneRef.current.viewPreset,
            zoom: window.testSceneRef.current.viewZoom,
            position: window.testSceneRef.current.cameraPosition,
            transitionRemaining: window.testSceneRef.current.viewTransition?.remaining ?? null,
            config: window.testSceneRef.current.view.config,
          },
          skipAvailable: !!w && (w.inputMask & 64) !== 0 && (w.flyby.flags & 0x51) === 0x11,
          body: document.body.innerText.slice(0, 2000),
        }
      })
    } catch (diagnosticError) {
      report.diagnosticError = String(diagnosticError)
    }
    try {
      await page.screenshot({
        path: resolve(
          output,
          pickingPaths ? 'picking-path-failure.png' : compactMessages ? 'compact-message-failure.png' : 'm2-pointer-failure.png'
        ),
        timeout: 3000,
      })
    } catch {
      // A closed deadline context may prevent capture; preserve the original failure.
    }
  } finally {
    clearTimeout(timer)
  }
  return finishM2Functional({
    context,
    report,
    output,
    failure,
    fileName: `${scenario}.json`,
  })
}

// Shared read-only DOM witness for pointer and compact-preference episodes.
export function m2DiagnosticLayout(el) {
  const r = el.getBoundingClientRect()
  const badge = document.querySelector('[data-original-pause-status]')
  const b = badge?.getBoundingClientRect()
  const exportButton = el.querySelector('.fps-export')
  const exportStatus = el.querySelector('[data-metric="export-status"]')
  const fits = node => {
    const bounds = node?.getBoundingClientRect()
    return (
      !!bounds &&
      bounds.left >= r.left &&
      bounds.right <= r.right &&
      bounds.top >= r.top &&
      bounds.bottom <= r.bottom &&
      node.scrollWidth <= node.clientWidth &&
      node.scrollHeight <= node.clientHeight
    )
  }
  const e = exportButton?.getBoundingClientRect()
  return {
    exportFits: fits(exportButton) && fits(exportStatus),
    exportActionable:
      !!e &&
      !exportButton.disabled &&
      document.elementFromPoint((e.left + e.right) / 2, (e.top + e.bottom) / 2) === exportButton,
    pause: b && { left: b.left, top: b.top, right: b.right, bottom: b.bottom },
    pausePointerEvents: badge && getComputedStyle(badge).pointerEvents,
    pauseText: badge?.getAttribute('aria-label'),
    pointerTail: el.querySelector('[data-metric="pointer-tail"]')?.textContent,
    campaignPanels: [...document.querySelectorAll('.campaign-messages details[open]>div')]
      .filter(
        node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'
      )
      .map(node => {
        const r = node.getBoundingClientRect()
        const close = node.querySelector('button[aria-label="Dismiss campaign message"]')
        const c = close?.getBoundingClientRect()
        return {
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
          text: node.querySelector('p')?.textContent,
          contentFits:
            node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight,
          closeActionable:
            !!close &&
            !close.disabled &&
            !!c &&
            document.elementFromPoint((c.left + c.right) / 2, (c.top + c.bottom) / 2) === close,
        }
      }),
    interactiveUi: [
      ...document.querySelectorAll(
        '.native-hud,.top-actions,.campaign-messages summary,.campaign-messages details[open]>div'
      ),
    ]
      .filter(
        node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'
      )
      .map(node => {
        const r = node.getBoundingClientRect()
        return {
          name: node.className || node.tagName,
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
        }
      }),
    left: r.left,
    top: r.top,
    right: r.right,
    bottom: r.bottom,
    overflow: document.documentElement.scrollWidth > innerWidth,
    events: getComputedStyle(el).pointerEvents,
    rowsFit: [...el.querySelectorAll('dl > div')].every(row => {
      // Optional picking rows remain in the DOM while explicitly collapsed.
      // Do not skip other hidden rows: mandatory diagnostics must still fit.
      if (row.closest('.fps-picking[hidden]')) return true
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
}

export function assertM2DiagnosticLayout(layout, width, height) {
  assert.ok(layout.left >= 0 && layout.top >= 0 && layout.right <= width && layout.bottom <= height)
  assert.equal(layout.rowsFit, true, 'Metric rows must fit without horizontal clipping')
  assert.match(
    layout.pointerTail,
    /^\d+\.\d \/ \d+\.\d ms$/,
    'Recent pointer p95 and peak must be visible'
  )
  assert.equal(layout.overflow, false)
  assert.equal(layout.events, 'none')
  assert.equal(layout.exportFits, true, 'Export button and status must fit at every viewport')
  assert.equal(layout.exportActionable, true, 'Export must remain reachable beside campaign text')
  assert.ok(layout.campaignPanels.length > 0, 'Authored open campaign message must be observed')
  for (const panel of layout.campaignPanels) {
    assert.equal(
      m2RectanglesOverlap(layout, panel),
      false,
      'Campaign text must not obscure F8 diagnostics'
    )
    assert.ok(panel.left >= 0 && panel.top >= 0 && panel.right <= width && panel.bottom <= height)
    assert.ok(panel.text?.trim(), 'Campaign text must remain present')
    assert.equal(panel.contentFits, true, 'Campaign text must not be clipped')
    assert.equal(
      panel.closeActionable,
      true,
      'Public campaign message control must remain hit-testable'
    )
  }
  assert.ok(layout.pause, 'Public pause indicator must remain present')
  assert.equal(layout.pausePointerEvents, 'none', 'Native pause text must not intercept gameplay input')
  assert.equal(layout.pauseText, 'Paused')
  assert.equal(layout.pause.right, width - 2, 'Native pause text stays two pixels from the screen edge')
  assert.equal(layout.pause.bottom, height, 'Native pause text uses the bottom A-height line')
  assert.equal(
    m2RectanglesOverlap(layout, layout.pause),
    false,
    'Native pause text must not obscure F8 diagnostics'
  )
  for (const ui of layout.interactiveUi)
    assert.equal(
      m2RectanglesOverlap(layout.pause, ui),
      false,
      `Native pause text must not cover interactive UI: ${ui.name}`
    )
}
