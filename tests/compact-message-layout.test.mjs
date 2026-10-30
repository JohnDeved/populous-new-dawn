import { createCompactAdmission } from '../scripts/tutorial-browser/compact-admission.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import {
  assertCompactMessageWitness,
  compactMessageCases,
  compactMessageWitness,
  compactMessageSnapshotSource,
  scrollCompactDiagnostics,
  diagnosticMetricIds,
} from '../scripts/tutorial-browser/compact-message-layout.mjs'
import runM2Functional, { m2DiagnosticLayout, m2FunctionalLimitMs, runCompactDiagnosticEpisodes } from '../scripts/tutorial-browser/m2-pointer-f8.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { hudScale } from '../app/hud-layout.ts'
import { pickingPathMetricIds, pickingPathViewports } from '../scripts/tutorial-browser/picking-path-readout.mjs'

const box = (left, top, right, bottom) => ({ left, top, right, bottom })
const text = (bounds, value) => ({
  ...bounds,
  text: value,
  fragments: [bounds],
  clips: [],
  contentFits: true,
  fontSize: 12,
  lineHeight: '18px',
})
function clearWitness() {
  const panel = {
    ...box(72, 241, 412, 341),
    text: 'Authored campaign text',
    contentFits: true,
    closeActionable: true,
  }
  return {
    layout: {
      ...box(428, 8, 892, 317),
      pause: box(844, 341, 898, 360),
      rowsFit: true,
      pointerTail: '1.0 / 2.0 ms',
      overflow: false,
      events: 'auto',
      overflowY: 'auto',
      exportFits: true,
      exportActionable: true,
      pausePointerEvents: 'none',
      pauseText: 'Paused',
      campaignPanels: [panel],
      interactiveUi: [
        { ...box(0, 0, 72, 360), name: 'native-hud' },
        { ...panel, name: 'campaign-panel' },
      ],
    },
    witness: {
      overflow: false,
      inventedMessageCards: 0,
      campaignText: [text(box(86, 255, 398, 327), 'Authored campaign text')],
      diagnosticRows: Array.from({ length: 15 }, () =>
        text(box(435, 140, 654, 157), 'Diagnostic label/value')
      ),
      diagnosticFields: diagnosticMetricIds.map(metric => ({
        metric,
        ...text(box(435, 140, 654, 157), 'Measured value'),
      })),
      diagnosticTextRuns: [
        { text: 'First leaf', fragments: [box(435, 20, 480, 32)], clips: [] },
        { text: 'Second leaf', fragments: [box(490, 20, 550, 32)], clips: [] },
      ],
    },
  }
}

test('serialized diagnostic layout excludes only explicitly collapsed picking rows', () => {
  const good = clearWitness()
  const node = bounds => ({
    bounds,
    clientWidth: bounds.right - bounds.left,
    clientHeight: bounds.bottom - bounds.top,
    scrollWidth: bounds.right - bounds.left,
    scrollHeight: bounds.bottom - bounds.top,
    getBoundingClientRect() { return this.bounds },
    getClientRects() { return this.bounds.right > this.bounds.left ? [this.bounds] : [] },
  })
  const zero = box(0, 0, 0, 0), rowBounds = box(435, 140, 654, 157)
  const picking = { hidden: true }
  const mandatory = Array.from({ length: 15 }, () => ({ ...node(rowBounds), closest: () => null }))
  const optional = pickingPathMetricIds.slice(1).map(() => ({
    ...node(zero),
    closest(selector) {
      assert.equal(selector, '.fps-picking[hidden]')
      return picking.hidden ? picking : null
    },
  }))
  const pause = { ...node(good.layout.pause), getAttribute: () => good.layout.pauseText }
  const exportButton = node(box(435, 270, 550, 290))
  const exportStatus = node(box(435, 294, 550, 310))
  const close = node(box(380, 245, 405, 265))
  const campaign = {
    ...node(good.layout.campaignPanels[0]),
    querySelector: selector => selector === '[data-campaign-text]' ? { getAttribute: () => 'Authored campaign text' } : close,
  }
  const overlay = {
    ...node(good.layout),
    querySelector: selector => ({
      '.fps-export': exportButton,
      '[data-metric="export-status"]': exportStatus,
      '[data-metric="pointer-tail"]': { textContent: good.layout.pointerTail },
    })[selector],
    querySelectorAll: selector => {
      assert.equal(selector, 'dl > div')
      return [...mandatory, ...optional]
    },
  }
  // Execute the actual page-serialized witness, not a fixture's rowsFit result.
  // DOM geometry is controlled here; rendered CSS remains a separate browser gate.
  const readLayout = runInNewContext(`(${m2DiagnosticLayout.toString()})`, {
    innerWidth: 900,
    getComputedStyle: node => ({ visibility: 'visible', pointerEvents: node === overlay ? 'auto' : 'none', overflowY: 'auto' }),
    document: {
      documentElement: { scrollWidth: 900 },
      querySelector: selector => selector === '[data-original-pause-status]' ? pause : null,
      querySelectorAll: selector => selector === '.campaign-messages details[open] [data-native-campaign-panel]' ? [campaign] : [],
      elementFromPoint: (x, y) => [pause, exportButton, close].find(({ bounds: r }) =>
        x >= r.left && x <= r.right && y >= r.top && y <= r.bottom),
    },
  })
  const layout = () => readLayout(overlay)
  assert.equal(optional.length, 4)
  assertCompactMessageWitness(layout(), good.witness, 900, 360)
  for (const damaged of [zero, box(427, 140, 654, 157), box(435, 140, 893, 157),
    box(435, 7, 654, 157), box(435, 140, 654, 318)]) {
    mandatory[0].bounds = damaged
    assert.equal(layout().rowsFit, false, 'mandatory hidden or out-of-panel rows cannot be skipped')
  }
  mandatory[0].bounds = rowBounds
  mandatory[0].scrollWidth++
  assert.equal(layout().rowsFit, false, 'mandatory horizontal clipping must still fail')
  mandatory[0].scrollWidth--
  picking.hidden = false
  assert.equal(layout().rowsFit, false, 'unhidden optional rows must have visible in-panel geometry')
  for (const row of optional) Object.assign(row, node(rowBounds))
  assert.equal(layout().rowsFit, true, 'expanded optional rows are measured too')
  optional[0].bounds = box(435, 140, 893, 157)
  assert.equal(layout().rowsFit, false, 'expanded optional rows cannot escape panel bounds')
  optional[0].bounds = rowBounds
  optional[0].scrollWidth++
  assert.equal(layout().rowsFit, false, 'expanded optional horizontal clipping must still fail')
})

test('compact message acceptance rejects status occlusion, clipping, missing content and unreachable controls', () => {
  const good = clearWitness()
  assertCompactMessageWitness(good.layout, good.witness, 900, 360)
  for (const damage of [
    ({ witness }) => {
      witness.inventedMessageCards = 1
    },
    ({ witness }) => {
      witness.campaignText = []
    },
    ({ witness }) => {
      witness.diagnosticRows.pop()
    },
    ({ witness }) => {
      witness.diagnosticFields.pop()
    },
    ({ witness }) => {
      witness.diagnosticFields.find(node => node.metric === 'renderer').contentFits = false
    },
    ({ witness }) => {
      witness.campaignText[0] = text(box(309, 296, 693, 348), 'Escaping campaign glyphs')
    },
    ({ witness }) => {
      witness.campaignText[0].contentFits = false
    },
    ({ witness }) => {
      witness.campaignText[0].fragments[0].right = 430
    },
    ({ witness }) => {
      witness.campaignText[0].fragments = []
    },
    ({ witness }) => {
      witness.overflow = true
    },
    ({ layout }) => {
      layout.exportActionable = false
    },
    ({ layout }) => {
      layout.campaignPanels[0].closeActionable = false
    },
    ({ layout }) => {
      layout.pausePointerEvents = 'auto'
    },
    ({ layout }) => {
      layout.events = 'none'
    },
    ({ layout }) => {
      layout.overflowY = 'hidden'
    },
    ({ layout }) => {
      layout.rowsFit = false
    },
  ]) {
    const bad = structuredClone(good)
    damage(bad)
    assert.throws(() => assertCompactMessageWitness(bad.layout, bad.witness, 900, 360))
  }
})

function scrollingWitness() {
  const initial = clearWitness()
  Object.assign(initial.layout, { rowsFit: false, exportFits: false, exportActionable: false,
    scroll: { top: 0, left: 0, width: 462, clientWidth: 462, height: 400, clientHeight: 309 } })
  const clip = { ...box(429, 9, 891, 316), name: 'fps-graph', diagnosticViewport: true,
    clipX: true, clipY: true, overflowX: 'auto', overflowY: 'auto', contain: 'none', clipPath: 'none', clip: 'auto' }
  for (const name of ['diagnosticRows', 'diagnosticFields'])
    for (const node of initial.witness[name]) {
      Object.assign(node, box(435, 315, 654, 332))
      node.fragments = [box(435, 315, 654, 332)]
      node.clips = [clip]
    }
  initial.witness.diagnosticTextRuns[1].fragments = [box(490, 320, 550, 332)]
  for (const run of initial.witness.diagnosticTextRuns) run.clips = [clip]
  const ancestor = { ...clip, ...box(0, 0, 900, 360), name: 'game-shell', diagnosticViewport: false,
    diagnosticAncestor: true, overflowY: 'hidden' }
  for (const name of ['diagnosticRows', 'diagnosticFields', 'diagnosticTextRuns'])
    for (const node of initial.witness[name]) node.clips.push(ancestor)
  const bottom = structuredClone(initial)
  Object.assign(bottom.layout, { exportFits: true, exportActionable: true })
  bottom.layout.scroll.top = 91
  for (const name of ['diagnosticRows', 'diagnosticFields', 'diagnosticTextRuns'])
    for (const node of bottom.witness[name]) {
      if (Number.isFinite(node.top)) { node.top -= 91; node.bottom -= 91 }
      for (const fragment of node.fragments) { fragment.top -= 91; fragment.bottom -= 91 }
    }
  return { initial, bottom }
}

test('overflowing F8 requires actual complete scroll coverage, strict horizontal fit and retained native text', () => {
  const { initial, bottom } = scrollingWitness()
  assertCompactMessageWitness(initial.layout, initial.witness, 900, 360, [bottom])
  assert.throws(() => assertCompactMessageWitness(initial.layout, initial.witness, 900, 360), /scrolling/)
  for (const damage of [
    (a, b) => { b.layout.scroll.top = 0 },
    (a, b) => { b.layout.scroll.top = 50 },
    (a, b) => { b.layout.exportActionable = false },
    (a, b) => { b.layout.exportFits = false },
    (a, b) => { b.witness.diagnosticFields.pop() },
    (a, b) => { b.witness.diagnosticTextRuns.pop() },
    (a, b) => { b.witness.campaignText[0].top++ },
    (a, b) => { b.witness.diagnosticRows[0].right = 1000 },
    (a, b) => { b.witness.diagnosticFields[0].contentFits = false },
    (a, b) => { b.witness.diagnosticFields[0].top = 800; b.witness.diagnosticFields[0].bottom = 820 },
    (a, b) => { b.witness.diagnosticTextRuns[1].fragments[0].top = 800; b.witness.diagnosticTextRuns[1].fragments[0].bottom = 820 },
    (a, b) => { b.layout.scroll.width++ },
    (a, b) => { b.witness.overflow = true },
    (a, b) => { b.layout.overflowY = 'hidden' },
    (a, b) => { a.witness.diagnosticFields[0].clips[0].diagnosticViewport = false },
    (a, b) => { b.witness.diagnosticFields[0].clips[0].clipPath = 'inset(2px)' },
    (a, b) => { b.witness.diagnosticFields[0].clips[1].bottom = 300 },
    (a, b) => { b.layout.scroll.height-- },
  ]) {
    const a = structuredClone(initial), b = structuredClone(bottom)
    damage(a, b)
    assert.throws(() => assertCompactMessageWitness(a.layout, a.witness, 900, 360, [b]), String(damage))
  }
})

test('actual compact scroll driver uses public wheel input and rejects world or camera movement', async () => {
  for (const fromBottom of [false, true]) for (const damage of [null, 'camera', 'turn']) {
    const { initial, bottom } = scrollingWitness(), calls = []
    let current = fromBottom ? bottom : initial, reads = 0, advanced = false
    const conditions = [{}, ...(fromBottom ? [{ scrollTop: 0 }] : []), { scrollAfter: 0 }]
    const sample = structuredClone(current)
    const page = {
      mouse: {
        move: async () => calls.push('move'),
        wheel: async (x, y) => {
          assert.equal(x, 0)
          if (y > 0) assert.ok(y <= initial.layout.scroll.clientHeight / 2)
          else assert.equal(y, -initial.layout.scroll.height)
          current = y > 0 ? bottom : initial
          advanced = y > 0
          calls.push(y > 0 ? 'wheel' : 'wheel-top')
        },
      },
      evaluate: async read => {
        assert.equal(read, compactMessageSnapshotSource(conditions[reads]))
        calls.push('atomic-snapshot')
        reads++
        return { ...structuredClone(current), world: { paused: true, sameScene: true,
          turn: 10 + Number(advanced && damage === 'turn'),
          camera: { x: Number(advanced && damage === 'camera') } } }
      },
    }
    const run = scrollCompactDiagnostics(page, sample, 900, 360)
    if (damage) await assert.rejects(run, /preserves world/)
    else {
      await run
      assertCompactMessageWitness(sample.layout, sample.witness, 900, 360, sample.scrollSamples)
      assert.equal(sample.beforeScrollReset?.layout.scroll.top, fromBottom ? 91 : undefined)
    }
    assert.deepEqual(calls, ['move', 'atomic-snapshot', ...(fromBottom ? ['wheel-top', 'atomic-snapshot'] : []), 'wheel', 'atomic-snapshot'])
    assert.equal(reads, fromBottom ? 3 : 2, 'each settle/layout/text/world observation uses one RPC')
  }
})

// Execute the full composed browser source with deterministic frame/timer queues.
// No observer is stubbed: geometry below supports the real layout/text readers.
function snapshotPage() {
  let visible = true, now = 0, nextId = 0, overrun = false
  const frames = new Map(), timers = new Map(), observations = []
  const world = { paused: true, turn: 10, selected: [], mode: 'select', randomState: 1,
    cosmeticRandom: 2, messages: [] }
  const scene = { world, cameraPosition: { x: 1 }, cameraBearing: 0, viewZoom: 1,
    viewPoint: { x: 2 } }
  const graph = {
    scrollTop: 0, scrollLeft: 0, clientWidth: 100, clientHeight: 100, scrollWidth: 100, scrollHeight: 200,
    pointerTail: '1.0 / 2.0 ms',
    getBoundingClientRect: () => ({ ...box(0, 0, 100, 100), width: 100, height: visible ? 100 : 0 }),
    querySelector(selector) {
      if (selector === '.fps-export') observations.push('layout')
      return selector === '[data-metric="pointer-tail"]' ? { textContent: this.pointerTail } : null
    },
    querySelectorAll: () => [],
  }
  const globals = {
    innerWidth: 900, innerHeight: 360, structuredClone,
    performance: { now: () => now },
    requestAnimationFrame: callback => { frames.set(++nextId, callback); return nextId },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: callback => { timers.set(++nextId, callback); return nextId },
    clearTimeout: id => timers.delete(id),
    window: { testScene: scene, testStore: { getWorld: () => world },
      testSceneRef: { get current() { observations.push('world'); if (overrun) now = 10001; return scene } } },
    NodeFilter: { SHOW_TEXT: 4 },
    localStorage: { getItem: () => { observations.push('text'); return '4' } },
    getComputedStyle: () => ({ visibility: visible ? 'visible' : 'hidden', pointerEvents: 'auto',
      overflowY: 'auto', display: 'contents', getPropertyValue: () => '1' }),
    document: {
      documentElement: { scrollWidth: 900, scrollHeight: 360 },
      querySelector: selector => selector === '.fps-graph' ? graph : null,
      querySelectorAll: () => [],
      createTreeWalker: () => ({ nextNode: () => null }),
    },
  }
  return {
    graph, world, observations,
    read: options => runInNewContext(compactMessageSnapshotSource(options), globals),
    visible: value => { visible = value },
    now: value => { now = value },
    overrun: () => { overrun = true },
    frame: () => { const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback() },
    expire: () => { for (const callback of [...timers.values()]) callback() },
    pending: () => [frames.size, timers.size],
  }
}

test('composed snapshot retains two RAF frames and atomically reads actual layout, text and world', async () => {
  const ui = snapshotPage(), result = ui.read()
  assert.deepEqual(ui.observations, [])
  ui.frame()
  assert.deepEqual(ui.observations, [], 'one RAF is insufficient')
  ui.world.turn = 11
  ui.frame()
  const sample = await result
  assert.deepEqual(ui.observations, ['layout', 'text', 'world'])
  assert.equal(sample.layout.scroll.top, 0)
  assert.equal(sample.witness.preference, '4')
  assert.equal(sample.world.turn, 11)
  assert.equal(sample.world.storeTurn, 11)
  assert.equal(sample.world.sameScene, true)
  assert.deepEqual(ui.pending(), [0, 0])
  const source = compactMessageSnapshotSource()
  assert.ok(source.includes(m2DiagnosticLayout.toString()))
  assert.ok(source.includes(compactMessageWitness.toString()))
  assert.doesNotMatch(source, /localStorage\.setItem|\.scrollTop\s*=(?!=)|\.scrollTo\(|dispatchEvent|\.setWorld\(/)
})

test('composed snapshot rejects stale F8 hiding, absent pointer readiness and non-progressing scroll', async () => {
  for (const mode of ['hidden-stale', 'pointer-missing', 'scroll-stuck', 'scroll-stale', 'reset-stuck']) {
    const ui = snapshotPage()
    const options = mode === 'hidden-stale' ? { state: 'hidden' } :
      mode === 'reset-stuck' ? { scrollTop: 0 } : mode.startsWith('scroll') ? { scrollAfter: 0 } : {}
    if (mode === 'hidden-stale') ui.visible(false)
    if (mode === 'pointer-missing') ui.graph.pointerTail = '--'
    if (mode === 'scroll-stale' || mode === 'reset-stuck') ui.graph.scrollTop = 1
    const result = ui.read(options), rejection = assert.rejects(result, /snapshot timed out/)
    ui.frame()
    if (mode === 'hidden-stale') ui.visible(true)
    if (mode === 'scroll-stale') ui.graph.scrollTop = 0
    ui.frame()
    assert.deepEqual(ui.observations, [], mode)
    ui.expire()
    await rejection
    assert.deepEqual(ui.pending(), [0, 0])
  }
})

test('composed hidden and scroll observations require their live precondition through both settling frames', async () => {
  for (const options of [{ state: 'hidden' }, { scrollAfter: 0 }, { scrollTop: 0 }]) {
    const ui = snapshotPage()
    if (options.scrollTop === 0) ui.graph.scrollTop = 20
    const result = ui.read(options)
    ui.frame()
    assert.deepEqual(ui.observations, [])
    if (options.state === 'hidden') ui.visible(false)
    else ui.graph.scrollTop = options.scrollAfter === 0 ? 1 : 0
    ui.frame() // First live readiness observation, then the same two frames.
    ui.frame()
    assert.deepEqual(ui.observations, [])
    ui.frame()
    const sample = await result
    assert.equal(sample.layout === null, options.state === 'hidden')
    assert.deepEqual(ui.observations, options.state === 'hidden' ? ['text', 'world'] : ['layout', 'text', 'world'])
    assert.deepEqual(ui.pending(), [0, 0])
  }
})

test('composed snapshot rejects delayed RAF and synchronous read overruns before a timer can report success', async () => {
  for (const mode of ['delayed-raf', 'read-overrun']) {
    const ui = snapshotPage(), result = ui.read(), rejection = assert.rejects(result, /snapshot timed out/)
    ui.frame()
    if (mode === 'delayed-raf') ui.now(10000)
    else ui.overrun()
    ui.frame()
    await rejection
    assert.deepEqual(ui.observations, mode === 'delayed-raf' ? [] : ['layout', 'text', 'world'])
    assert.deepEqual(ui.pending(), [0, 0])
  }
})

test('actual compact episode keeps all four public F8 round trips and rejects restored-text or paused-turn changes', async () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/compact-message-layout.mjs', import.meta.url), 'utf8')
  const body = source.slice(source.indexOf('export async function checkCompactMessages'),
    source.indexOf('export async function checkExpandedPickingPaths')).replace('export async', 'async')
  for (const damage of [null, 'text', 'turn']) {
    const calls = [], report = { cases: [] }
    let preference, visible = false, viewport, snapshots = 0, baselineReads = 0
    const page = {
      evaluate: async () => { baselineReads++; return { world: 10, scene: true } },
      setViewportSize: async size => { viewport = [size.width, size.height] },
      keyboard: { press: async key => { assert.equal(key, 'F8'); visible = !visible; calls.push(['F8', visible]) } },
      screenshot: async () => calls.push(['capture']),
    }
    const read = async (owner, options) => {
      assert.equal(owner, page)
      assert.equal(options?.state === 'hidden', !visible)
      snapshots++
      const restored = !visible && snapshots % 3 === 0
      return { layout: { tag: snapshots }, witness: { preference, statusLayout: 'contents',
        text: restored && damage === 'text' ? 'changed' : 'original' },
        world: { storeTurn: restored && damage === 'turn' ? 11 : 10, sameScene: true } }
    }
    const check = new Function('assert', 'compactMessageCases', 'selectHudPreference', 'readCompactMessageSnapshot',
      'scrollCompactDiagnostics', 'assertCompactMessageWitness', 'resolve', body + '\nreturn checkCompactMessages;')(
      assert, compactMessageCases,
      async (owner, value) => { assert.equal(owner, page); preference = value; calls.push(['preference', value]) },
      read,
      async (owner, sample, width, height) => {
        assert.equal(owner, page); assert.deepEqual(viewport, [width, height]); sample.scrollSamples = []
      },
      (layout, witness, width, height, scrollSamples) => {
        assert.equal(layout.tag, snapshots); assert.equal(witness.preference, preference)
        assert.deepEqual(viewport, [width, height]); assert.deepEqual(scrollSamples, [])
        calls.push(['assert', preference, width, height])
      }, join)
    const run = check({ page, output: 'fixture-output', stage: () => {}, report })
    if (damage) await assert.rejects(run, damage === 'turn' ? /preserve the paused world/ : /restore ordinary text/)
    else {
      await run
      assert.equal(snapshots, 12, 'three atomic observations per preference/viewport case')
      assert.equal(report.cases.length, 4)
      assert.deepEqual(calls.filter(([name]) => name === 'assert'), [
        ['assert', '4', 900, 360], ['assert', '4', 640, 480],
        ['assert', 'auto', 900, 360], ['assert', 'auto', 640, 480],
      ])
      assert.equal(calls.filter(([name]) => name === 'F8').length, 8)
      assert.equal(calls.filter(([name]) => name === 'capture').length, 4)
      assert.deepEqual(calls.filter(([name]) => name === 'preference'), [['preference', '4'], ['preference', 'auto']])
    }
    assert.equal(baselineReads, 1, 'restored world turn comes from the same snapshot as restored text')
  }
})

test('retained 1440x1000 campaign bitmap overhang remains a real own-box failure', () => {
  const { initial, bottom } = scrollingWitness()
  // Hosted dbb9 M2 receipt: client388/scroll391 at2x, glyph right1214
  // outside its text box right1208. RPC consolidation must not forgive this.
  for (const sample of [initial, bottom]) Object.assign(sample.witness.campaignText[0], {
    clientSize: [388, 95], scrollSize: [391, 95], contentFits: false,
  })
  assert.throws(() => assertCompactMessageWitness(initial.layout, initial.witness, 900, 360, [bottom]),
    /Text must not overflow its own box/)
})

test('accurate campaign content extent never excuses panel escape, glyph escape or ancestor clipping', () => {
  const good = clearWitness(), node = good.witness.campaignText[0]
  node.right += 6
  node.fragments[0].right = node.right
  assertCompactMessageWitness(good.layout, good.witness, 900, 360)
  for (const damage of [
    sample => { sample.witness.campaignText[0].right = sample.layout.campaignPanels[0].right + 1 },
    sample => { sample.witness.campaignText[0].fragments[0].right++ },
    sample => {
      const text = sample.witness.campaignText[0]
      text.clips = [{ ...box(text.left, text.top, text.right - 1, text.bottom), name: 'real-clip',
        clipX: true, clipY: true, clipPath: 'none', clip: 'auto' }]
    },
    sample => { sample.witness.diagnosticTextRuns[1].fragments = sample.witness.diagnosticTextRuns[0].fragments },
  ]) {
    const bad = structuredClone(good)
    damage(bad)
    assert.throws(() => assertCompactMessageWitness(bad.layout, bad.witness, 900, 360))
  }
})

test('real FPS font overhang is allowed only inside actual clipping and non-overlap boundaries', () => {
  const good = clearWitness()
  // Retained run 39175629111 / artifact 12154202752, Automatic 900x360:
  // 26px font with 28.6px line-height has a 30px text Range, not a clipped glyph.
  const fps = {
    metric: 'fps',
    ...text(box(435, 34.390625, 463.921875, 62.984375), '24'),
    fragments: [box(435, 33.390625, 463.921875, 63.390625)],
    fontSize: 26,
    lineHeight: '28.6px',
  }
  good.witness.diagnosticFields[0] = fps
  good.witness.diagnosticTextRuns[0] = { text: fps.text, fragments: fps.fragments, clips: [] }
  assertCompactMessageWitness(good.layout, good.witness, 900, 360)
  const clipping = {
    ...box(435, 34.390625, 463.921875, 62.984375),
    name: 'actual-parent', clipX: true, clipY: false,
    overflowX: 'clip', overflowY: 'visible', contain: 'none', clipPath: 'none', clip: 'auto',
  }
  const horizontalOnly = structuredClone(good)
  horizontalOnly.witness.diagnosticFields[0].clips = [clipping]
  assertCompactMessageWitness(horizontalOnly.layout, horizontalOnly.witness, 900, 360)
  for (const damage of [
    ({ witness }) => {
      witness.diagnosticFields[0].clips = [{ ...clipping, clipY: true, overflowY: 'hidden' }]
    },
    ({ witness }) => {
      witness.diagnosticTextRuns[0].clips = [{ ...clipping, clipY: true, contain: 'paint' }]
    },
    ({ witness }) => {
      witness.diagnosticFields[0].fragments[0].top = 7
    },
    ({ witness }) => {
      witness.diagnosticTextRuns[1].fragments = witness.diagnosticTextRuns[0].fragments
    },
    ({ witness }) => {
      witness.diagnosticTextRuns[0].clips = [{ ...clipping, clipPath: 'inset(2px)' }]
    },
    ({ witness }) => {
      witness.diagnosticTextRuns = []
    },
  ]) {
    const bad = structuredClone(good)
    damage(bad)
    assert.throws(() => assertCompactMessageWitness(bad.layout, bad.witness, 900, 360))
  }
})

test('compact preferences use public controls with genuine text geometry and F8-off restoration', () => {
  assert.deepEqual(compactMessageCases, [
    {
      preference: '4',
      label: '400%',
      sizes: [
        [900, 360],
        [640, 480],
      ],
    },
    {
      preference: 'auto',
      label: 'Automatic',
      sizes: [
        [900, 360],
        [640, 480],
      ],
    },
  ])
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/compact-message-layout.mjs', import.meta.url),
    'utf8'
  )
  for (const control of [
    'Menu',
    'Options',
    'Browser compatibility and help',
    'HUD size',
    'Back to Options',
    'Continue Game',
  ])
    assert.ok(source.includes(control))
  assert.match(source, /await chooseHudSize\(page, preference\)/)
  assert.match(source, /setting\.getAttribute\('data-hud-size'\)/)
  assert.match(source, /range\.getClientRects\(\)/)
  assert.match(source, /style\.overflowX/)
  assert.match(source, /style\.overflowY/)
  assert.match(source, /style\.contain/)
  assert.match(source, /parent\.clientLeft \+ parent\.clientWidth/)
  assert.match(source, /parent\.clientTop \+ parent\.clientHeight/)
  assert.ok(source.indexOf('await page.screenshot({ path: resolve(output, screenshot) })') <
    source.indexOf('assertCompactMessageWitness(sample.layout, sample.witness, width, height, sample.scrollSamples)', source.indexOf('report.cases.push(sample)')))
  assert.match(
    source,
    /node\.scrollWidth <= node\.clientWidth && node\.scrollHeight <= node\.clientHeight/
  )
  assert.match(source, /assert\.deepEqual\(\s*restored,\s*before/)
  assert.match(source, /await page.mouse.wheel\(0,/)
  assert.match(source, /assert.deepEqual\(sample.scrollAfter, sample.scrollBefore/)
  assert.doesNotMatch(source, /\.scrollTop\s*=(?!=)|\.scrollTo\(/)
  assert.doesNotMatch(
    source,
    /localStorage\.setItem|force:|\.tick\(|\.setWorld\(|\.startMission\(|style\.setProperty|document\.querySelector[^\n]+\.click\(/
  )
  for (const [width, height] of [
    [900, 360],
    [640, 480],
  ]) {
    for (const preference of ['1', '1.5', '2', '2.5', '3', '4'])
      assert.equal(
        hudScale(width, height, preference),
        hudScale(width, height, 'auto'),
        'Source-proven compact scaling equivalence is not a claim every preference was browser tested'
      )
  }
})

test('compact coexistence changes placement and whitespace only within diagnostic conditions', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  assert.match(css, /\.game-status\{display:contents\}/)
  assert.match(page, /<div className="game-status">/)
  const bounded = css.slice(
    css.indexOf('/* At the bounded 640x480'),
    css.indexOf('/* Browser diagnostics are exempt')
  )
  assert.match(bounded, /min-width:640px/)
  assert.match(bounded, /min-height:480px/)
  assert.match(
    bounded,
    /\.game-shell:has\(\.fps-graph\):has\(\.campaign-messages details\[open\]\):has\(\.world-message\)/
  )
  assert.match(bounded, /display:grid;gap:8px/)
  assert.doesNotMatch(
    bounded,
    /font-size|line-height|overflow:hidden|display:none|visibility:hidden|scale\(/
  )
  const popup = css.slice(css.indexOf('/* Browser diagnostics are exempt'), css.indexOf('.primary-button,.secondary-button'))
  assert.match(popup, /@media \(min-width:560px\) and \(max-height:700px\)/)
  assert.match(popup, /font-size:11px;line-height:1\.2/)
  assert.match(popup, /@media \(min-width:900px\) and \(max-height:500px\)/)
  assert.match(popup, /grid-template-columns:2\.35fr 2\.15fr/)
  assert.match(popup, /bottom:max\(22px,calc\(24px \* var\(--hud-scale\)\)\)/)
  assert.match(popup, /var\(--side\) - var\(--message-width,32px\) - 16px/)
  assert.match(popup, /var\(--campaign-popup-bottom,0px\) - 3px/)
  assert.match(popup, /overflow:auto;pointer-events:auto;overscroll-behavior:contain/)

  assert.doesNotMatch(popup, /overflow:hidden|display:none|visibility:hidden|scale\(/)
  for (const rule of popup.split('\n').filter(line => line.includes('{') && !line.startsWith('@')))
    assert.ok(rule.includes('.game-shell:has(.campaign-messages details[open])'), 'F8 adaptation is conditional on an open native popup')

})

test('separate compact scenario has explicit new admission and retains ordinary bounds/groups', () => {
  assert.equal(m2FunctionalLimitMs, 45000)
  assert.equal(browserCapMs('compact-message-layout'), 225000)
  const runner = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  const scenario = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(runner, /compactMessageScenarioSha256: hash/)
  assert.match(runner, /await compactAdmission\.wait\([\s\S]*?\.runCompactDiagnosticEpisodes\(\{\s*browser: compactBrowser, url, output: out, fixture: m2Fixture, report: receipt, admission: compactAdmission/)
  assert.match(
    scenario,
    /if \(compactMessages\) \{\s+admission\.beginLayouts\([\s\S]*?const \{ checkCompactMessages \} = await import/
  )
  assert.match(scenario, /pickingPaths \? 'picking-path-readout' : compactMessages \? 'compact-message-layout' : 'm2-pointer-f8'/)
  assert.match(scenario, /fileName: `\$\{scenario\}\.json`/)
  assert.ok(scenario.indexOf('timer = setTimeout') < scenario.indexOf('await page.goto'))
  assert.ok(scenario.indexOf('await page.goto') < scenario.indexOf('if (compactMessages)'))
})

test('actual compact routing awaits independent bounded episodes and preserves partial failure evidence', async () => {
  const report = {}, calls = [], first = Promise.withResolvers()
  const common = { browser: {}, url: 'http://fixture', output: 'fixture-output', fixture: {} }
  const run = runCompactDiagnosticEpisodes({ ...common, report }, async options => {
    calls.push(options)
    if (options.compactMessages) return first.promise
    assert.deepEqual(report.compactMessageLayout, { status: 'passed', contextClosed: true })
    return { status: 'passed', contextClosed: true, scenario: 'picking-path-readout' }
  })
  assert.deepEqual(calls, [{ ...common, compactMessages: true }], 'expanded work cannot start before compact finishes')
  first.resolve({ status: 'passed', contextClosed: true })
  await run
  assert.deepEqual(calls, [{ ...common, compactMessages: true }, { ...common, pickingPaths: true }])
  assert.equal(report.pickingPathReadout.scenario, 'picking-path-readout')
  for (const failAt of [0, 1]) {
    const partial = {}, attempted = []
    await assert.rejects(runCompactDiagnosticEpisodes({ ...common, report: partial }, async options => {
      attempted.push(options)
      if (attempted.length - 1 === failAt) throw Error('episode failure')
      return { status: 'passed', contextClosed: true }
    }), /episode failure/)
    assert.equal(attempted.length, failAt + 1, 'a failed legacy episode cannot be hidden by expanded success')
    assert.equal(!!partial.compactMessageLayout, failAt === 1, 'retain completed legacy evidence if expanded fails')
    assert.equal(partial.pickingPathReadout, undefined)
  }
})

test('real compact preparation and unchanged expanded M2 each close at their explicit 45-second bound', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const output = mkdtempSync(join(tmpdir(), 'compact-episode-deadline-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  let created = 0
  for (const [flag, name] of [['compactMessages', 'compact-message-layout'], ['pickingPaths', 'picking-path-readout']]) {
    const entered = Promise.withResolvers(), navigation = Promise.withResolvers()
    let closed = 0, elapsed = 0, ownedContext
    const page = {
      setDefaultTimeout() {}, on() {}, async addInitScript() {},
      goto() { entered.resolve(); return navigation.promise },
      async evaluate() { throw Error('context closed') },
      async screenshot() { throw Error('context closed') },
    }
    const browser = { async newContext() {
      created++
      return ownedContext = {
        async newPage() { return page },
        async close() { closed++; navigation.reject(Error('context closed by deadline')) },
      }
    } }
    const admission = flag === 'compactMessages' ? createCompactAdmission({ deadlineAt: 225000, wallNow: () => 0,
      now: () => elapsed, onExpire: () => ownedContext.close() }) : undefined
    admission?.beginCompact()
    const completed = assert.rejects(runM2Functional({ browser, url: 'http://fixture', output,
      fixture: { receipt: {} }, [flag]: true, admission }), /M2 functional scenario failed/)
    await entered.promise
    elapsed = m2FunctionalLimitMs - 1
    t.mock.timers.tick(elapsed)
    assert.equal(closed, 0, 'the episode retains its own full original allowance')
    elapsed++
    t.mock.timers.tick(1)
    await completed
    const receipt = JSON.parse(readFileSync(join(output, `${name}.json`), 'utf8'))
    assert.equal(receipt.scenario, name)
    assert.equal(receipt.status, 'failed')
    if (admission) {
      assert.equal(receipt.admission.timedOut, 'preparation')
      assert.ok(closed >= 1, 'Compact expiry immediately attempts owned context cancellation')
      admission.dispose()
    } else {
      assert.equal(receipt.timedOut, true)
      assert.equal(receipt.contextClosed, true)
      assert.equal(receipt.stages.at(-1).name, 'deadline')
    }
  }
  assert.equal(created, 2)
  assert.equal(m2FunctionalLimitMs, 45000)
  assert.equal(browserCapMs('compact-message-layout'), 225000)
  await assert.rejects(runM2Functional({ compactMessages: true, pickingPaths: true }), /independent contexts/)
})

test('collapsed and optional diagnostic inventories cover every shipped F8 metric without hiding missing fields', () => {
  const graph = readFileSync(new URL('../app/fps-graph.ts', import.meta.url), 'utf8')
  const optional = graph.match(/<section class="fps-picking"[^>]*hidden>[\s\S]*?<\/section>/)?.[0]
  assert.ok(optional, 'optional fields must be explicitly collapsed by default')
  assert.deepEqual(
    [...graph.replace(optional, '').matchAll(/data-metric="([^"]+)"/g)].map(match => match[1]),
    diagnosticMetricIds
  )
  assert.deepEqual([...optional.matchAll(/data-metric="([^"]+)"/g)].map(match => match[1]), pickingPathMetricIds)
  assert.equal(new Set([...diagnosticMetricIds, ...pickingPathMetricIds]).size, diagnosticMetricIds.length + pickingPathMetricIds.length)
})

test('existing compact hosted job invokes shared expanded picking cases against the bundled app and retains artifacts', () => {
  assert.deepEqual(pickingPathViewports, [[640, 480], [1280, 799], [1280, 800], [1280, 801], [1280, 820]])
  const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const compact = read('scripts/tutorial-browser/compact-message-layout.mjs')
  const originalEpisode = compact.slice(compact.indexOf('export async function checkCompactMessages'), compact.indexOf('export async function checkExpandedPickingPaths'))
  const expandedEpisode = compact.slice(compact.indexOf('export async function checkExpandedPickingPaths'))
  const shared = read('scripts/tutorial-browser/picking-path-readout.mjs')
  const standalone = read('scripts/check-browser-fps.mjs')
  assert.match(compact, /import \{ checkPickingPathReadout, pickingPathMetricIds \} from '\.\/picking-path-readout\.mjs'/)
  assert.match(compact, /report\.pickingPaths = await checkPickingPathReadout\(\{ page, output \}\)/)
  assert.match(standalone, /await checkPickingPathReadout\(\{ page, output \}\)/)
  assert.doesNotMatch(originalEpisode, /checkPickingPathReadout|pickingPaths/)
  assert.match(originalEpisode, /await selectHudPreference\(page, preference\)/)
  assert.match(originalEpisode, /compact-\$\{preference\}-\$\{width\}x\$\{height\}-captured-and-restored/)
  assert.match(expandedEpisode, /report\.pickingPaths = await checkPickingPathReadout/)
  assert.match(expandedEpisode, /await selectHudPreference\(page, '4'\)/)
  assert.match(compact, /await toggle\.focus\(\)\s+await page\.keyboard\.press\('F8'\)/)
  assert.match(compact, /await toggle\.click\(\)\s+await graph\.focus\(\)\s+await page\.keyboard\.press\('F8'\)/)
  assert.match(compact, /report\.pickingPaths\.focusedF8Reset = true/)
  assert.match(compact, /cancelAnimationFrame\(scene\.frame\)/)
  assert.match(compact, /scene\.frame = requestAnimationFrame\(scene\.animate\)/)
  assert.match(expandedEpisode, /await detail\.locator\('summary'\)\.click\(\)/)
  assert.match(expandedEpisode, /assert\.notEqual\(await detail\.getAttribute\('open'\), null/)
  assert.match(expandedEpisode, /stage\('expanded-picking-campaign-restored'\)/)
  for (const interaction of ["press('Space')", "press('End')", "press('Home')", 'page.mouse.wheel', 'target.scrollIntoViewIfNeeded'])
    assert.ok(shared.includes(interaction), interaction)
  assert.match(shared, /assert\.deepEqual\(inputEvents, \[\]/)
  assert.match(shared, /performance-picking-layout-fixture-\$\{width\}x\$\{height\}-top\.png/)
  assert.match(shared, /performance-picking-layout-fixture-\$\{width\}x\$\{height\}-bottom\.png/)
  assert.doesNotMatch(shared, /chromium\.launch|newContext|createServer|preview\(|no-sandbox/)
  const workflow = read('.github/workflows/tutorial-browser.yml')
  assert.match(workflow, /scenario: compact-message-layout\n +timeoutMinutes: 15\n +name: Compact message layout browser\n +artifact: compact-message-layout-browser/)
  assert.match(workflow, /outputs\/tutorial-browser\/\*\.png/)
  assert.match(workflow, /outputs\/tutorial-browser\/\*\.json/)
  assert.match(read('scripts/tutorial-browser/fixture/main.tsx'), /import Home from '\.\.\/\.\.\/\.\.\/app\/page'/)
  assert.match(read('scripts/tutorial-browser/build-home.mjs'), /mode: 'production'/)
})

// Bitmap route text has its own projection/paint/lifetime fixtures; the compact
// popup/F8 episode must not silently exempt the removed route card.
test('compact observer rejects every retired world-message card including route 603', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/compact-message-layout.mjs', import.meta.url), 'utf8')
  assert.match(source, /querySelectorAll\('\.world-message, \.route-notice'\)\.length/)
  assert.doesNotMatch(source, /world-message:not\(\.route-notice\)|Keep the shipped status font|worldMessages/)
})
