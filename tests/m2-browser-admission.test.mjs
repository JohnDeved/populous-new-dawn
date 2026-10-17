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
  assert.match(run, /\['tutorial', 'm2-pointer-f8'\]/)
  assert.match(run, /180000/)
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
