import { campaignPopupSnapshot } from '../scripts/browser-world-input.mjs'
import { browserCapMs, browserScenarios } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { assertNativeFrameExport, m2NativePointerTarget } from '../scripts/tutorial-browser/frame-export.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { assertM2Input, m2FunctionalLimitMs } from '../scripts/tutorial-browser/m2-pointer-f8.mjs'

test('checkpoint codec preserves shared buffers, typed offsets, Maps, Sets, cycles and special scalars', () => {
  const buffer = new ArrayBuffer(32),
    view = new Uint16Array(buffer, 4, 5)
  view.set([1, 257, 65535, 42, 19])
  const a = {
    view,
    second: new Uint8Array(buffer),
    data: new DataView(buffer, 2, 7),
    map: new Map(),
    set: new Set(),
    sparse: Array(4),
    values: [undefined, NaN, Infinity, -Infinity, -0, 1n],
  }
  a.self = a
  a.map.set(a, view)
  a.set.add(a)
  const encoded = checkpointCodec(a)
  const result = checkpointCodec(JSON.parse(JSON.stringify(encoded)), true)
  assert.deepEqual(result, a)
  assert.equal(result.view.buffer, result.second.buffer)
  assert.equal(result.map.get(result), result.view)
  assert.equal(result.self, result)
  assert.deepEqual(checkpointCodec(result), encoded)
})

test('codec is self-contained for browser initialization and rejects unsupported values', () => {
  const remote = runInNewContext(`(${checkpointCodec.toString()})`)
  const encoded = checkpointCodec({ a: new Float32Array([1.25, -0]), b: new Map([[2, 3]]) })
  const copied = JSON.parse(JSON.stringify(remote(remote(encoded, true))))
  assert.deepEqual(copied, encoded)
  assert.throws(() => checkpointCodec({ fn() {} }), /Unsupported/)
  assert.throws(() => checkpointCodec(new Date()), /Unsupported/)
  assert.throws(
    () => checkpointCodec({ root: ['ref', 0], nodes: [{ type: 'view', name: 'Function' }] }, true),
    /Unsupported/
  )
})

test('M2 functional acceptance rejects level, selection, order, clock and Scene drift', () => {
  const before = { level: 2, sameScene: true, selected: [1], orders: [[1, null]], turn: 12 }
  assertM2Input(before, structuredClone(before))
  for (const change of [
    { level: 1 },
    { sameScene: false },
    { selected: [2] },
    { orders: [[1, 'attack']] },
    { turn: 13 },
  ])
    assert.throws(() => assertM2Input(before, { ...before, ...change }))
})

test('M2 has isolated selection and default append; legacy scenarios and bounds retained', () => {
  const run = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(run, /POPULOUS_BROWSER_SCENARIO \|\| 'tutorial'/)
  assert.deepEqual(browserScenarios, ['tutorial', 'm2-pointer-f8', 'pause-checkpoint-recovery', 'profile-recovery', 'mission10-profile', 'gameplay-frames', 'gameplay-resources', 'snapshot-protocol', 'compact-message-layout', 'frontend-held-escape'])
  assert.equal(browserCapMs('m2-pointer-f8'), 180000)
  assert.match(run, /120000/)
  assert.ok(run.indexOf('receipt.result =') < run.indexOf('receipt.selectorInspection ='))
  assert.ok(run.indexOf('receipt.selectorInspection =') < run.indexOf('receipt.sceneryPlacement ='))
  assert.ok(run.indexOf('receipt.sceneryPlacement =') < run.lastIndexOf('receipt.m2PointerF8 ='))
  assert.equal(m2FunctionalLimitMs, 45000)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /loadBoundaryMatched = true/)
  assert.ok(
    source.indexOf('timer = setTimeout') < source.indexOf('await page.goto'),
    'Independent picking retains its 45-second total admission bound'
  )
  assert.match(source, /if \(pickingPaths\) timer = setTimeout/)
  assert.match(source, /createM2Admission\(\{ deadlineAt: options.deadlineAt, signal: options.signal/)
  assert.match(source, /tx.oncomplete = resolve/)
  assert.doesNotMatch(source, /showAllMissions|\.tick\(|\.startMission\(|\.setWorld\(|--no-sandbox/)
})

test('M2 terminal acceptance includes late errors, timeout and cleanup failure', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { finishM2Functional } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const output = mkdtempSync(join(tmpdir(), 'm2-contract-'))
  try {
    const good = { errors: [] }
    await finishM2Functional({ context: { async close() {} }, report: good, output })
    assert.equal(good.status, 'passed')
    assert.equal(good.contextClosed, true)
    for (const kind of ['late', 'cleanup', 'timeout', 'scenario']) {
      const report = { errors: [], timedOut: kind === 'timeout' }
      const context = {
        async close() {
          if (kind === 'late') report.errors.push('late page error')
          if (kind === 'cleanup') throw Error('close failure')
        },
      }
      await assert.rejects(
        finishM2Functional({
          context,
          report,
          output,
          failure: kind === 'scenario' ? Error('original') : undefined,
        })
      )
      assert.equal(JSON.parse(readFileSync(join(output, 'm2-pointer-f8.json'))).status, 'failed')
    }
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
})

test('ordinary null-mode pointer witnesses use processed tooltip cells, not placement pointer', async () => {
  const { m2RouteReady } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const scene = {
    pointer: null,
    pointerScreen: { clientX: 700, clientY: 340 },
    tooltipInput: {
      pointer: { clientX: 700, clientY: 340 },
      route: 'unmapped-cell',
      cell: 12000,
    },
  }
  const ready = runInNewContext(`(${m2RouteReady.toString()})`, {
    window: { testSceneRef: { current: scene } },
  })
  assert.equal(ready({ x: 700, y: 340, world: true }), true)
  scene.tooltipInput.cell = 0xa020
  assert.equal(ready({ x: 700, y: 340, world: true }), true)
  for (const invalid of [1, 0xffff, -2, 2 ** 32, NaN]) {
    scene.tooltipInput.cell = invalid
    assert.equal(ready({ x: 700, y: 340, world: true }), false)
  }
  scene.tooltipInput.cell = null
  assert.equal(ready({ x: 700, y: 340, world: true }), false)
  scene.tooltipInput.cell = 12000
  scene.tooltipInput.pointer.clientX = 699
  assert.equal(ready({ x: 700, y: 340, world: true }), false)
  scene.pointerScreen = null
  scene.tooltipInput.route = 'hud'
  assert.equal(ready({ x: 100, y: 300, world: false }), true)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /await skipIntroductionWithSpace\(page, \{ timeout: 10000, closedPopups: report.inputPopups \}\)/)
  assert.doesNotMatch(source, /getByRole\([^\n]*Skip introduction|skip-introduction/)
})

test('public Load readiness uses accessible bitmap-menu state, not absent text or native disabled', async () => {
  const { m2LoadReady } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  let state = 'true',
    present = true
  const ready = runInNewContext(`(${m2LoadReady.toString()})`, {
    document: {
      querySelector(selector) {
        assert.equal(selector, 'nav[aria-label="Main menu choices"] button[aria-label="Load Game"]')
        return present
          ? {
              textContent: '',
              disabled: false,
              getAttribute(name) {
                assert.equal(name, 'aria-disabled')
                return state
              },
            }
          : null
      },
    },
  })
  assert.equal(ready(), false)
  state = 'false'
  assert.equal(ready(), true)
  state = null
  assert.equal(ready(), false)
  present = false
  assert.equal(ready(), false)
})

test('M2 waits for active interruptible native Space or naturally ready input', async () => {
  const { m2StartupReady } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const world = { inputMask: 64, flyby: { flags: 16 }, outcome: { level: 2 } }
  const ready = runInNewContext(`(${m2StartupReady.toString()})`, {
    window: { testStore: { getWorld: () => world } },
  })
  for (const flags of [0, 1, 16, 64, 65, 80, 81, 85]) {
    world.flyby.flags = flags
    assert.equal(ready(), false, `flags ${flags} cannot accept native interruption`)
  }
  world.flyby.flags = 17
  world.inputMask = 128
  assert.equal(ready(), false, 'another input owner cannot enable Space')
  world.inputMask = 192
  assert.equal(ready().action, 'skip', 'the flyby can release its bit without bypassing another owner')
  assert.equal(ready().inputMask, 192)
  assert.equal(ready().skipAvailable, true)
  world.inputMask = 0
  assert.equal(ready().action, 'ready', 'completed introduction must not issue a pause toggle')
  assert.equal(ready().skipAvailable, false)
})

test('HUD witness stays inside transformed compact and wide docks and rejects an obstructed target', async () => {
  const { m2HudPoint } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  for (const [width, height, right] of [
    [640, 480, 96],
    [1440, 1000, 200],
  ]) {
    const hud = { getBoundingClientRect: () => ({ left: 0, top: 0, right, bottom: height - 20 }) }
    let owned = true
    const point = runInNewContext(`(${m2HudPoint.toString()})`, {
      innerWidth: width,
      innerHeight: height,
      document: {
        querySelector: () => hud,
        elementFromPoint(x, y) {
          assert.ok(x > 0 && x < right)
          assert.ok(y > 0 && y < height - 20)
          return { closest: () => (owned ? hud : null) }
        },
      },
    })
    assert.equal(point().x, right / 2)
    owned = false
    assert.throws(point, /not owned/)
  }
})

test('sample publication readiness rejects absent, empty and reset overlay fields', async () => {
  const { m2SamplesReady } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  let field = null
  const ready = runInNewContext(`(${m2SamplesReady.toString()})`, {
    document: { querySelector: () => field },
  })
  assert.equal(ready(), false)
  for (const textContent of ['', '0 samples', '0 / 240 samples']) {
    field = { textContent }
    assert.equal(ready(), false)
  }
  field = { textContent: '12 / 240 samples' }
  assert.equal(ready(), true)
})

test('compact witness has no invented advisory and still pauses before observing gameplay', () => {
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url), 'utf8'
  )
  assert.doesNotMatch(source, /desktopNotice|Continue anyway|desktop-only-notice/)
  const skip = source.indexOf('await skipIntroductionWithSpace(page, { timeout: 10000, closedPopups: report.inputPopups })'),
    pause = source.indexOf('await setWorldPaused(page, true)'), baseline = source.indexOf('report.before = await observe()')
  assert.ok(skip >= 0 && pause > skip && baseline > pause, 'Exact bounded skip and public pause must precede observation')
  assert.match(source, /await page\.setViewportSize\(\{ width: 640, height: 480 \}\)/)
  assert.equal(m2FunctionalLimitMs, 45000)
})

test('public zoom readiness follows settled preset/configuration, not flyby zoom scalar', async () => {
  const { m2ViewReady } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const target = { scale: 42, pitch: 300, bounds: [1, 2] }
  const scene = {
    viewZoom: 0,
    viewPreset: 0,
    viewTransition: null,
    overviewActive: false,
    view: { config: structuredClone(target), projection: { width: 544, height: 480 } },
    container: { clientWidth: 544, clientHeight: 480 },
    currentPreset: () => structuredClone(target),
  }
  const ready = runInNewContext(`(${m2ViewReady.toString()})`, {
    window: { testSceneRef: { current: scene } },
  })
  assert.equal(ready(2), false)
  scene.viewPreset = 2
  scene.viewTransition = { remaining: 1 }
  assert.equal(ready(2), false)
  scene.viewTransition = null
  assert.equal(ready(2), true, 'Ordinary preset change correctly leaves viewZoom at zero')
  scene.view.config.scale = 41
  assert.equal(ready(2), false, 'Requested preset alone is not reached-render proof')
  scene.view.config.scale = 42
  scene.view.projection.width = 1240
  assert.equal(ready(2), false, 'Stale pre-resize projection must not pass')
  scene.view.projection.width = 544
  scene.overviewActive = true
  assert.equal(ready(2), false)
})

test('pause-overlay regression detects occlusion while permitting edge-touching rectangles', async () => {
  const { m2RectanglesOverlap } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const graph = { left: 104, top: 8, right: 632, bottom: 350 }
  assert.equal(m2RectanglesOverlap(graph, { left: 272, top: 177, right: 464, bottom: 254 }), true)
  assert.equal(m2RectanglesOverlap(graph, { left: 490, top: 410, right: 632, bottom: 464 }), false)
  assert.equal(m2RectanglesOverlap(graph, { left: 8, top: 20, right: 104, bottom: 80 }), false)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /\[900, 360\]/)
  assert.match(source, /m2RectanglesOverlap\(layout, layout.pause\)/)
  assert.match(source, /m2RectanglesOverlap\(layout.pause, ui\)/)
  assert.match(source, /pausePointerEvents, 'none'/)
  assert.match(source, /pauseText, 'Paused'/)
  assert.doesNotMatch(source, /pauseActionable|Click to resume|WORLD PAUSED/)
})

test('bounded M2 avoids duplicate initial-wide PNG while retaining all viewport captures and stage evidence', () => {
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.doesNotMatch(source, /m2-pointer-wide\.png/)
  assert.match(source, /m2-pointer-\$\{width\}\.png/)
  assert.match(source, /\[1440, 1000\]/)
  assert.match(source, /stage\('deadline'\)/)
  assert.match(source, /stage\('load-boundary-matched'\)/)
  assert.match(source, /stage\('menu-returned'\)/)
  assert.match(source, /assert\.deepEqual\(\s*readback,\s*fixture\.transfer/)
  assert.equal(m2FunctionalLimitMs, 45000)
})

test('campaign popup regression retains collision, content, export and native pause admission', async () => {
  const { m2RectanglesOverlap, assertM2DiagnosticLayout } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  // Retain the originally captured short-wide collision and boundary oracle.
  const message = { left: 72, top: 241, right: 412, bottom: 341 }
  assert.equal(m2RectanglesOverlap({ left: 332, top: 8, right: 892, bottom: 350 }, message), true)
  assert.equal(m2RectanglesOverlap({ left: 428, top: 8, right: 892, bottom: 350 }, message), false)
  assert.equal(m2RectanglesOverlap(
    { left: 104, top: 8, right: 632, bottom: 350 },
    { left: 96, top: 355, right: 436, bottom: 455 }
  ), false)
  // Synthetic layout admission, not a rendered layout claim. Native popup
  // artwork/layout is independently tested; F8 must retain every existing oracle.
  const layout = {
    left: 108, top: 180, right: 892, bottom: 330, rowsFit: true,
    pointerTail: '1.0 / 2.0 ms', overflow: false, events: 'auto', overflowY: 'auto',
    exportFits: true, exportActionable: true,
    campaignPanels: [{ left: 330, top: 16, right: 568, bottom: 150,
      text: 'Authored campaign text', contentFits: true, closeActionable: true }],
    pause: { left: 843, top: 348, right: 898, bottom: 360 },
    pausePointerEvents: 'none', pauseText: 'Paused',
    interactiveUi: [{ name: 'native-hud', left: 0, top: 0, right: 100, bottom: 360 }],
  }
  assert.doesNotThrow(() => assertM2DiagnosticLayout(layout, 900, 360))
  for (const change of [
    value => { value.left = -1 },
    value => { value.rowsFit = false },
    value => { value.pointerTail = '' },
    value => { value.overflow = true },
    value => { value.events = 'none' },
    value => { value.exportFits = false },
    value => { value.exportActionable = false },
    value => { value.campaignPanels = [] },
    value => { value.campaignPanels[0].top = 200; value.campaignPanels[0].bottom = 250 },
    value => { value.campaignPanels[0].left = -1 },
    value => { value.campaignPanels[0].text = ' ' },
    value => { value.campaignPanels[0].contentFits = false },
    value => { value.campaignPanels[0].closeActionable = false },
    value => { value.pause = null },
    value => { value.pausePointerEvents = 'auto' },
    value => { value.overflowY = 'hidden' },
    value => { value.pauseText = 'Click to resume' },
    value => { value.pause.right-- },
    value => { value.pause.bottom-- },
    value => { value.pause.top = 300 },
    value => { value.interactiveUi.push({ name: 'overlap', ...value.pause }) },
  ]) {
    const candidate = structuredClone(layout)
    change(candidate)
    assert.throws(() => assertM2DiagnosticLayout(candidate, 900, 360))
  }
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\.world-viewport\{position:absolute;inset:0 0 0 var\(--side\)/)
})

test('hosted M2 route awaits actual pointer and keyboard export checks inside existing scene deadline', () => {
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /import \{ checkFrameExport, m2NativePointerTarget \} from '\.\/frame-export\.mjs'/)
  assert.match(source, /await checkFrameExport\(\{ page, output, keyboard: width === 1280 \}\)/)
  assert.match(source, /\[1280, 720\]/)
  const helper = readFileSync(
    new URL('../scripts/tutorial-browser/frame-export.mjs', import.meta.url),
    'utf8'
  )
  assert.match(helper, /waitForEvent\('download'\)/)
  assert.match(helper, /readFileSync\(await download\.path\(\), 'utf8'\)/)
  assert.match(helper, /keyboard\.press\('Space'\)/)
  assert.doesNotMatch(helper, /newContext|page\.goto|setTimeout/)
  assert.equal(m2FunctionalLimitMs, 45000)
})

test('full checkpoint protocol transport uses JSON text without weakening structured equality', () => {
  const buffer = new ArrayBuffer(16)
  const view = new Float64Array(buffer)
  view.set([NaN, -0])
  const world = { buffer, view, map: new Map([[1n, Infinity]]), absent: undefined }
  world.self = world
  const encoded = checkpointCodec(world)
  const transported = JSON.parse(JSON.stringify(encoded))
  assert.deepEqual(transported, encoded)
  const decoded = checkpointCodec(transported, true)
  assert.equal(decoded.self, decoded)
  assert.equal(decoded.view.buffer, decoded.buffer)
  assert.ok(Number.isNaN(decoded.view[0]))
  assert.ok(Object.is(decoded.view[1], -0))
  assert.equal(decoded.map.get(1n), Infinity)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /const transfer = JSON\.parse\(transferJson\)/)
  assert.match(source, /JSON\.stringify\(fixture\.transfer\)/)
  assert.match(source, /const readback = JSON\.parse\(readbackJson\)/)
  assert.match(source, /assert\.deepEqual\(\s*readback,\s*fixture\.transfer/)
  assert.match(
    source,
    /JSON\.parse\(await page\.evaluate\(\(\) => window\.m2LoadBoundary\)\),\s*fixture\.expected/
  )
  assert.match(source, /JSON\.stringify\(window\.m2CheckpointCodec\(store\.getWorld\(\)\)\)/)
  assert.equal(m2FunctionalLimitMs, 45000)
})


test('actual downloaded M2 frames require versioned finite native counters without duration thresholds', () => {
  const native = { version: 1, submissionKeyMs: 0, projectionMs: 0, triangleScanMs: 0,
    pixelCacheHits: 0, pixelCacheMisses: 1, cacheCold: 1, cachePositionChanged: 0,
    cacheKeyChanged: 0, cacheHits: 0, projectedVertices: 6, submittedTriangles: 2 }
  const frames = [{ pointerBreakdown: null }, { pointerBreakdown: { nativeOcclusion: native } }]
  const result = assertNativeFrameExport(frames)
  assert.equal(result.measuredFrames, 1)
  assert.equal(result.nativeWorkFrames, 1)
  assert.equal(result.counters.projectedVertices, 6)
  for (const mutate of [
    value => { value.version = 2 }, value => { delete value.projectionMs },
    value => { value.triangleScanMs = Infinity }, value => { value.submissionKeyMs = -1 },
    value => { value.pixelCacheMisses = 0.5 }, value => { value.cacheHits = NaN },
    value => { value.submittedTriangles = Number.MAX_SAFE_INTEGER + 1 },
  ]) {
    const invalid = structuredClone(frames)
    mutate(invalid[1].pointerBreakdown.nativeOcclusion)
    assert.throws(() => assertNativeFrameExport(invalid))
  }
  assert.throws(() => assertNativeFrameExport([{ pointerBreakdown: {} }]))
  assert.throws(() => assertNativeFrameExport([{ pointerBreakdown: null }]))
  const helper = readFileSync(new URL('../scripts/tutorial-browser/frame-export.mjs', import.meta.url), 'utf8')
  assert.match(helper, /const nativeDiagnostics = assertNativeFrameExport\(report.frames\)/)
  assert.match(helper, /bounds, nativeDiagnostics/)
  assert.match(helper, /assert.ok\(nativeDiagnostics.nativeWorkFrames > 0/)
  assert.doesNotMatch(helper, /newContext|page\.goto|setTimeout|waitForTimeout/)
  assert.equal(m2FunctionalLimitMs, 45000)
})


test('native export target uses rendered bounds and real input without invoking the picker', () => {
  const canvas = { getBoundingClientRect: () => ({ left: 200, top: 0, right: 1000, bottom: 600 }) }
  const layer = { visible: true }
  const group = { visible: true, userData: { layers: [layer] } }
  const scene = { renderer: { domElement: canvas }, unitMeshes: new Map([[54, group]]),
    view: { painter: { source: value => value === layer ? {} : null } },
    picking: { personBounds: () => ({ x: 100, y: 100, width: 20, height: 30 }),
      pick: () => assert.fail('must not invoke picker') } }
  const context = { window: { testSceneRef: { current: scene } },
    document: { elementFromPoint: () => canvas } }
  const choose = () => runInNewContext(`(${m2NativePointerTarget.toString()})()`, context)
  assert.equal(choose().x, 310)
  assert.equal(choose().y, 115)
  context.document.elementFromPoint = () => ({})
  assert.equal(choose(), null, 'HUD-obstructed points are rejected')
  context.document.elementFromPoint = () => canvas
  group.userData.pickable = false
  assert.equal(choose(), null)
  delete group.userData.pickable
  scene.view.painter.source = () => null
  assert.equal(choose(), null, 'unsubmitted sprites cannot establish native hit route')
  const route = readFileSync(new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url), 'utf8')
  assert.match(route, /page.evaluate\(m2NativePointerTarget\)/)
  assert.match(route, /\[nativeTarget.x, nativeTarget.y, true\]/)
  const helper = readFileSync(new URL('../scripts/tutorial-browser/frame-export.mjs', import.meta.url), 'utf8')
  assert.ok(helper.indexOf('await download.saveAs') < helper.indexOf('const report = JSON.parse'))
  assert.ok(helper.indexOf("filename.replace('.json', '-native-summary.json')") < helper.indexOf('assert.ok(nativeDiagnostics.nativeWorkFrames'))
  assert.match(helper, /examined > 128/)
  assert.equal(m2FunctionalLimitMs, 45000)
})


test('normal M2 establishes closed camera/pointer ownership and restores the same popup for layout', async () => {
  const { setM2CampaignPopupOpen } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  let open = true, present = true
  const calls = [], notification = { serial: 7, stringId: 641, oneShot: true }, original = structuredClone(notification)
  const detail = {
    count: async () => Number(present),
    getAttribute: async name => { assert.equal(name, 'open'); return open ? '' : null },
    locator: selector => selector === 'summary'
      ? { click: async () => { calls.push('summary'); open = !open } }
      : { waitFor: async ({ state }) => { assert.equal(selector, '[data-native-campaign-panel]'); assert.equal(state, open ? 'visible' : 'hidden') } },
  }
  const page = { evaluate: async read => {
    assert.equal(read, campaignPopupSnapshot)
    return present ? [{ serial: '7', open }] : []
  }, locator: selector => {
    if (selector === '.campaign-messages details[open]') return { count: async () => Number(open) }
    assert.equal(selector, '.campaign-messages details[data-message-serial="7"]')
    return detail
  } }
  for (const desired of [false, false, true, false, true]) {
    await setM2CampaignPopupOpen(page, '7', desired)
    assert.equal(open, desired)
    assert.deepEqual(notification, original, 'Neither ordinary nor one-shot records are acknowledged by summary toggles')
  }
  assert.deepEqual(calls, ['summary', 'summary', 'summary', 'summary'])
  present = false
  await assert.rejects(setM2CampaignPopupOpen(page, '7', true), /same campaign notification/)
  await assert.rejects(setM2CampaignPopupOpen(page, '7"]', true), /real retained campaign/)

  const source = readFileSync(new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url), 'utf8')
  const normal = source.slice(source.indexOf('const popupSerial ='), source.indexOf("stage('camera-reached')"))
  assert.ok(normal.indexOf('await setM2CampaignPopupOpen(page, popupSerial, false)') < normal.indexOf("page.keyboard.down(key)"))
  assert.match(normal, /graph\.evaluate\(el => \(\{ text: el\.innerText, pointerEvents: getComputedStyle\(el\)\.pointerEvents \}\)\)/)
  assert.match(normal, /assert\.equal\(graphEntry\.pointerEvents, 'none'\)/)
  const loop = source.slice(source.indexOf('// Keep the original world-route coordinates'), source.indexOf("stage(`viewport-${width}x${height}-captured`)"))
  const close = loop.indexOf('await setM2CampaignPopupOpen(page, popupSerial, false)'),
    pointer = loop.indexOf('await moveAndObserve(width - 60, height - 100, true)'),
    reopen = loop.indexOf('await setM2CampaignPopupOpen(page, popupSerial, true)'),
    layout = loop.indexOf('assertCompactMessageWitness(sample.layout, sample.witness, width, height, sample.scrollSamples)')
  assert.ok(close >= 0 && close < pointer && pointer < reopen && reopen < layout)
  assert.ok(reopen < loop.indexOf('await checkFrameExport('))
  assert.ok(loop.indexOf('await checkFrameExport(') < loop.indexOf('await scrollCompactDiagnostics('))
  assert.ok(loop.indexOf('await scrollCompactDiagnostics(') < layout)
  assert.match(loop, /pointerPopupState: 'closed', layoutPopupState: 'open', popupSerial/)
  assert.match(source, /Public close\/reopen retains the complete paused notification state/)
  assert.equal(m2FunctionalLimitMs, 45000, 'Functional phase and separate picking cap remain45s; ordinary setup is explicitly separate')
})


test('atomic M2 popup ownership rejects missing, pending, stale and unrelated final owners', async () => {
  const { assertM2PopupOwnership } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const good = { phase: 'verify-retained-popup-and-owners', pending: false, serial: '7', observedOpen: true, owners: [{ serial: '7' }] }
  assertM2PopupOwnership(good, '7', true)
  assertM2PopupOwnership({ ...good, observedOpen: false, owners: [] }, '7', false)
  for (const change of [v => { delete v.owners }, v => { v.phase = 'observe-retained-popups' },
    v => { v.pending = true }, v => { v.serial = '99' }, v => { v.observedOpen = false },
    v => { v.owners = [{ serial: '99' }] }, v => { v.owners.push({ serial: '99' }) }]) {
    const value = structuredClone(good); change(value)
    assert.throws(() => assertM2PopupOwnership(value, '7', true))
  }
})

test('atomic export observation retains event, world and hit-test rejection oracles', async () => {
  const { assertFrameExportObservation } = await import('../scripts/tutorial-browser/frame-export.mjs')
  const before = { turn: 17, paused: true, selected: [7], camera: { x: 1, y: 2, angle: 3 }, mode: 'normal' }
  const good = { inputs: [], state: structuredClone(before), bounds: { buttonFits: true, statusFits: true, hit: true } }
  assertFrameExportObservation(before, good)
  for (const change of [v => { delete v.inputs }, v => { v.inputs.push('keydown') },
    v => { v.state.turn++ }, v => { v.state.paused = false }, v => { v.state.selected = [99] },
    v => { v.state.camera.angle++ }, v => { v.state.mode = 'spell' },
    v => { v.bounds.buttonFits = false }, v => { v.bounds.statusFits = false }, v => { v.bounds.hit = false }]) {
    const value = structuredClone(good); change(value)
    assert.throws(() => assertFrameExportObservation(before, value))
  }
})

test('atomic export reader observes current post-action state, never a cached before snapshot', async () => {
  const { readFrameExportObservation } = await import('../scripts/tutorial-browser/frame-export.mjs')
  const { runInNewContext } = await import('node:vm')
  const scene = { world: { turn: 17, paused: true, selected: [7], mode: 'normal' }, cameraPosition: { x: 1, y: 2, angle: 3 } }
  const button = { getBoundingClientRect: () => ({ left: 0, top: 0, right: 20, bottom: 20 }), contains: node => node === button }
  const context = { window: { testSceneRef: { current: scene }, frameExportInputs: [] }, innerWidth: 100, innerHeight: 100,
    document: { querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 25 }) }), elementFromPoint: () => button }, button }
  const read = () => JSON.parse(JSON.stringify(runInNewContext(`(${readFrameExportObservation.toString()})(button)`, context)))
  const first = read(); scene.world.turn++; scene.cameraPosition.angle++; context.window.frameExportInputs.push('click')
  const second = read()
  assert.equal(first.state.turn, 17); assert.equal(second.state.turn, 18)
  assert.equal(second.state.camera.angle, 4); assert.deepEqual(second.inputs, ['click'])
  assert.deepEqual(second.bounds, { buttonFits: true, statusFits: true, hit: true })
})
