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
    '45-second bound includes admission'
  )
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
  assert.match(source, /name: \/\^Skip introduction\//)
  assert.doesNotMatch(source, /name: 'Skip introduction', exact: true/)
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

test('M2 waits for delayed public Skip or naturally ready input, not one-shot visibility', async () => {
  const { m2StartupReady } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const world = { inputMask: 128, flyby: { flags: 16 }, outcome: { level: 2 } }
  let visible = false,
    mounted = false
  const button = { disabled: false, getClientRects: () => (visible ? [{}] : []) }
  const ready = runInNewContext(`(${m2StartupReady.toString()})`, {
    window: { testStore: { getWorld: () => world } },
    document: { querySelector: () => (mounted ? button : null) },
    getComputedStyle: () => ({ visibility: 'visible' }),
  })
  assert.equal(ready(), false)
  world.flyby.flags = 17
  world.inputMask = 192
  assert.equal(ready(), false, 'Active script before React control is still waiting')
  mounted = true
  assert.equal(ready(), false, 'Hidden Skip is not actionable')
  visible = true
  assert.equal(ready().action, 'skip')
  assert.equal(ready().inputMask, 192)
  world.inputMask = 0
  mounted = false
  assert.equal(ready().action, 'ready')
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

test('compact notice is publicly dismissed before the paused witness, never during it', () => {
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  const dismiss = source.indexOf(
    "desktopNotice.getByRole('button', { name: /^Continue anyway/ }).click()"
  )
  assert.ok(dismiss > 0)
  assert.ok(source.indexOf("await desktopNotice.waitFor({ state: 'visible' })") < dismiss)
  assert.ok(dismiss < source.indexOf("name: 'Pause game'"))
  assert.ok(dismiss < source.indexOf('report.before = await observe()'))
  assert.equal(source.match(/Continue anyway/g).length, 1)
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
  assert.match(source, /pauseActionable/)
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

test('open campaign panel regression rejects the captured short-wide collision without hiding either panel', async () => {
  const { m2RectanglesOverlap } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const message = { left: 72, top: 241, right: 412, bottom: 341 }
  assert.equal(m2RectanglesOverlap({ left: 332, top: 8, right: 892, bottom: 350 }, message), true)
  assert.equal(m2RectanglesOverlap({ left: 428, top: 8, right: 892, bottom: 350 }, message), false)
  assert.equal(
    m2RectanglesOverlap(
      { left: 104, top: 8, right: 632, bottom: 350 },
      { left: 96, top: 355, right: 436, bottom: 455 }
    ),
    false
  )
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /layout\.campaignPanels\.length > 0/)
  assert.match(source, /m2RectanglesOverlap\(layout, panel\)/)
  assert.match(source, /panel\.contentFits, true/)
  assert.match(source, /layout\.exportFits, true/)
  assert.match(source, /layout\.exportActionable,\s*true/)
  assert.match(source, /panel\.closeActionable,\s*true/)
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /--campaign-message-width:340px/)
  assert.match(css, /\.world-viewport\{position:absolute;inset:0 0 0 var\(--side\)/)
  assert.match(css, /@media \(min-width:900px\) and \(max-height:700px\)/)
  assert.match(css, /max-width:calc\(100% - var\(--campaign-message-width\) - 24px\)/)
  assert.match(css, /\.campaign-messages details\[open\]\{width:var\(--campaign-message-width\)\}/)
  assert.match(css, /\.fps-renderer\{max-height:none;overflow:visible\}/)
  for (const side of [72, 100, 140]) {
    const worldWidth = 900 - side
    const graphWidth = Math.min(560, worldWidth - 340 - 24)
    const graphLeft = 900 - 8 - graphWidth
    assert.equal(graphLeft - (side + 340), 16, 'HUD is excluded once by the containing viewport')
  }
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
