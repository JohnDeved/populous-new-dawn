import { summarizeFrameExportCohorts } from '../app/frame-export-cohorts.ts'
import { Painter } from '../app/painter.ts'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createPointerFrameMetrics, resetPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { FramePerformance } from '../app/frame-performance.ts'

test('frame telemetry computes time-weighted cadence and per-frame CPU/call means at four Hz', () => {
  const sample = new FramePerformance()
  for (let i = 0; i < 24; i++) assert.equal(sample.sample(10, 2, 3, 100, 6), false)
  assert.equal(sample.sample(10, 4, 8, 200, 6), true)
  assert.equal(sample.fps, 100)
  assert.equal(sample.frameMs, 10)
  assert.equal(sample.simulationMs, 52 / 25)
  assert.equal(sample.renderMs, 80 / 25)
  assert.equal(sample.drawCalls, 2600 / 25)
  assert.equal(sample.callbackMs, 6)
  assert.equal(sample.elapsed, 0)
  assert.equal(sample.frames, 0)
})

test('picking path means share the publication window and exclude rejected samples', () => {
  const frames = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  const sample = (ms = 10) => frames.sample(ms, 0, 0, 0, 0, 0, undefined, 'live', metrics)
  metrics.ordinaryTerrain.paths.numeric = 2
  metrics.ordinaryTerrain.paths.packedVector = 3
  metrics.ordinaryTerrain.paths.sparseVector = 4
  metrics.nativeOcclusion.cacheRepresentationChanged = 1
  for (let i = 0; i < 24; i++) assert.equal(sample(), false)
  assert.equal(frames.picking.frames, 0)
  metrics.ordinaryTerrain.paths.numeric = -1
  assert.equal(sample(), false)
  metrics.ordinaryTerrain.paths.numeric = 27
  assert.equal(sample(), true)
  assert.deepEqual(frames.picking, { frames: 25, milliseconds: 250, numeric: 3, packedVector: 3, sparseVector: 4, representationChanged: 1 })
  resetPointerFrameMetrics(metrics)
  assert.equal(sample(250), true)
  assert.deepEqual(frames.picking, { frames: 1, milliseconds: 250, numeric: 0, packedVector: 0, sparseVector: 0, representationChanged: 0 })
})

test('missing or partial optional counters remain independently unknown instead of becoming zero', () => {
  const frames = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  const sample = detail => frames.sample(125, 0, 0, 0, 0, 0, undefined, 'live', detail)
  sample(metrics); sample(undefined)
  assert.deepEqual(frames.picking, { frames: 2, milliseconds: 250, numeric: null, packedVector: null, sparseVector: null, representationChanged: null })
  sample(metrics)
  delete metrics.ordinaryTerrain.paths
  sample(metrics)
  assert.deepEqual(frames.picking, { frames: 2, milliseconds: 250, numeric: null, packedVector: null, sparseVector: null, representationChanged: 0 })
  const pathsOnly = createPointerFrameMetrics(true)
  delete pathsOnly.nativeOcclusion.cacheRepresentationChanged
  sample(pathsOnly); sample(pathsOnly)
  assert.deepEqual(frames.picking, { frames: 2, milliseconds: 250, numeric: 0, packedVector: 0, sparseVector: 0, representationChanged: null })
})

test('picking reset clears both published and unfinished window counters', () => {
  const frames = new FramePerformance(), metrics = createPointerFrameMetrics(true), published = frames.picking
  metrics.ordinaryTerrain.paths.numeric = 50
  metrics.nativeOcclusion.cacheRepresentationChanged = 10
  const sample = ms => frames.sample(ms, 0, 0, 0, 0, 0, undefined, 'live', metrics)
  sample(250); sample(100)
  frames.reset()
  assert.equal(frames.picking, published, 'fixed aggregate storage')
  assert.deepEqual(frames.picking, { frames: 0, milliseconds: 0, numeric: null, packedVector: null, sparseVector: null, representationChanged: null })
  resetPointerFrameMetrics(metrics)
  sample(250)
  assert.deepEqual(frames.picking, { frames: 1, milliseconds: 250, numeric: 0, packedVector: 0, sparseVector: 0, representationChanged: 0 })
})

test('a slow frame remains visible and affects cadence rather than being clamped away', () => {
  const sample = new FramePerformance()
  for (let i = 0; i < 10; i++) sample.sample(10, 1, 2, 3, 6)
  assert.equal(sample.sample(150, 1, 2, 3, 6), true)
  assert.equal(sample.fps, 44)
  assert.equal(sample.frameMs, 250 / 11)
  assert.equal(sample.frame(10), 150)
  assert.equal(Math.max(...Array.from({ length: sample.count }, (_, i) => sample.frame(i))), 150)
})

test('history is one fixed 240-frame chronological ring and reset exposes no old window', () => {
  const sample = new FramePerformance(), storage = sample.history
  for (let i = 1; i <= 601; i++) sample.sample(i, 1, 2, 3, 6)
  assert.equal(sample.history, storage)
  assert.equal(sample.history.length, 240)
  assert.equal(sample.count, 240)
  assert.equal(sample.frame(0), 362)
  assert.equal(sample.frame(239), 601)
  sample.reset()
  assert.equal(sample.history, storage)
  for (const field of ['count', 'cursor', 'elapsed', 'frames', 'fps', 'frameMs', 'simulationMs', 'renderMs', 'drawCalls', 'callbackMs', 'callback']) assert.equal(sample[field], 0, field)
  sample.sample(16, 1, 2, 3, 6)
  assert.equal(sample.count, 1)
  assert.equal(sample.frame(0), 16)
})

test('invalid or nonpositive frame intervals cannot poison telemetry', () => {
  const sample = new FramePerformance()
  for (const interval of [0, -1, NaN, Infinity, -Infinity]) assert.equal(sample.sample(interval, 1, 2, 3, 6), false)
  assert.equal(sample.count, 0)
  assert.equal(sample.sample(250, 1, 2, 3, 6), true)
  assert.equal(sample.fps, 4)
})

import { readHardwareInfo, readHeapEstimate } from '../app/performance-hardware.ts'

test('hardware hints use the supplied live context and explicit approximate units', () => {
  const calls = [], gl = { RENDERER: 1, getExtension(name) { calls.push(name); return { UNMASKED_RENDERER_WEBGL: 2 } }, getParameter(name) { calls.push(name); return '  Test renderer  ' } }
  assert.deepEqual(readHardwareInfo(gl, { hardwareConcurrency: 12, deviceMemory: 8 }), { renderer: 'Test renderer', cores: '12', memory: '~8 GiB' })
  assert.deepEqual(calls, ['WEBGL_debug_renderer_info', 2])
  assert.equal(readHeapEstimate({ memory: { usedJSHeapSize: 1572864 } }), '~2 MiB')
  assert.equal(readHeapEstimate({ memory: { usedJSHeapSize: 0 } }), '~0 MiB')
})

test('unsupported or privacy-restricted telemetry never fabricates hardware numbers', () => {
  const unsupported = { getExtension: () => null, getParameter: () => null }
  assert.deepEqual(readHardwareInfo(unsupported, {}), { renderer: 'Unavailable', cores: 'Unavailable', memory: 'Unavailable' })
  const denied = { getExtension() { throw Error('privacy') } }, navigator = { get hardwareConcurrency() { throw Error('privacy') }, get deviceMemory() { throw Error('privacy') } }
  assert.deepEqual(readHardwareInfo(denied, navigator), { renderer: 'Unavailable', cores: 'Unavailable', memory: 'Unavailable' })
  assert.equal(readHeapEstimate({ get memory() { throw Error('privacy') } }), 'Unavailable')
  assert.equal(readHeapEstimate({ memory: { get usedJSHeapSize() { throw Error('privacy') } } }), 'Unavailable')
  assert.equal(readHeapEstimate({}), 'Unavailable')
  for (const value of [NaN, Infinity, -1]) {
    const info = readHardwareInfo(unsupported, { hardwareConcurrency: value, deviceMemory: value })
    assert.equal(info.cores, 'Unavailable'); assert.equal(info.memory, 'Unavailable')
    assert.equal(readHeapEstimate({ memory: { usedJSHeapSize: value } }), 'Unavailable')
  }
  const masked = { RENDERER: 5, getExtension: () => null, getParameter: name => name === 5 ? 'WebKit WebGL' : null }
  assert.equal(readHardwareInfo(masked, {}).renderer, 'WebKit WebGL')
})

import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import { createResultClock, advanceResultClock } from '../app/result-session.ts'

// Exercise the actual callback body with deterministic boundary stubs. No
// renderer, asset loading or timing benchmark is involved in this contract test.
function runCallback({ enabled = true, hidden = false, modal = false, current = true, nestedPointer = 0, waterReason, simulationSteps = 0 } = {}) {
  const source = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
  const body = source.slice(source.indexOf('  animate = (now:'), source.indexOf('  private updateTerrainFrame()'))
  const resultClock = source.match(/^  resultClock = createResultClock\(\)$/m)?.[0]
  assert.ok(resultClock, 'include the actual scene result-clock initializer')
  let clock = 0, reads = 0
  const events = [], updates = []
  let gpuCalls = 0
  const step = name => () => { events.push(name); clock += 1 }
  const context = {
    resetPointerFrameMetrics, createResultClock, advanceResultClock, sceneTextureRevision: () => 0,
    performance: { now() { reads++; return clock } },
    document: { hidden, querySelector() { return null } }, devicePixelRatio: 1,
    requestAnimationFrame() { events.push('schedule'); clock += 1; return 42 },
    syncSecondaryReservations: step('reservations'), advanceGame: (_world, _clock, _dt, metrics) => { step('simulation')(); if (metrics) metrics.steps += simulationSteps },
    updateVehiclesFrame: step('vehicles'), SPELLS: []
  }
  const scene = vm.runInNewContext(stripTypeScriptTypes(`new (class { ${resultClock}
${body} })()`), context)
  Object.assign(scene, {
    view: { painter: new Painter({}) },
    pointerFrameMetrics: createPointerFrameMetrics(),
    isCurrent: () => current, previous: 0, modalSuspended: modal,
    modalRenderVersion: 0, modalRenderedVersion: -1, modalTextureVersion: -1,
    hoveredObject: null, world: { selected: [], buildings: [], trees: [] },
    renderer: { getPixelRatio: () => 1, render: step('render'), info: { render: { calls: 7 } } },
    fpsGraph: enabled ? { renderGpu(draw) { gpuCalls++; return draw() }, update(...args) { events.push('telemetry'); updates.push(args); clock += 100 }, reset: step('reset') } : null
  })
  for (const name of ['cancelNearbyFollowers', 'dispatchNearbyFollowers', 'playWorldSounds',
    'updateTerrainFrame', 'updateDecorationsFrame', 'updateCameraMotion', 'cancelTooltipInspection',
    'updateFlyby', 'updateView', 'updateUnitsFrame', 'renderTooltip', 'updateBuildingsFrame',
    'updateEffectsFrame', 'updateShrinesFrame', 'updatePointerFrame', 'updatePlacement',
    'updateSpellPointerFrame', 'updateEnvironmentFrame', 'renderSceneFrame', 'updateHudFrame'])
    scene[name] = step(name)
  if (nestedPointer) scene.updatePointerFrame = () => {
    events.push('updatePointerFrame'); clock += 1
    events.push('nested tooltip pick'); clock += nestedPointer
  }
  if (waterReason !== undefined) scene.updateEnvironmentFrame = (_ticks, metrics) => {
    events.push('updateEnvironmentFrame'); clock += 1
    if (metrics) metrics.reasons |= waterReason
  }
  scene.animate(10)
  return { scene, events, reads, updates, clock, gpuCalls }
}

test('live callback CPU includes preparation, HUD and scheduling, excluding overlay work', () => {
  const { scene, events, reads, updates, clock } = runCallback()
  assert.equal(scene.frame, 42)
  assert.equal(reads, 12)
  assert.equal(updates.length, 1)
  const [now, simulation, render, calls, state, callback, pointer] = updates[0]
  assert.equal(pointer, 1)
  assert.deepEqual(JSON.parse(JSON.stringify(updates[0][10])), { terrainCpuMs: 1, waterCpuMs: 0, hudCpuMs: 1 })
  assert.deepEqual([now, simulation, render, calls, state], [10, 1, 1, 7, 'Live'])
  assert.equal(callback, clock - 100)
  assert.ok(callback > simulation + render)
  assert.deepEqual(events.slice(-4), ['renderSceneFrame', 'updateHudFrame', 'schedule', 'telemetry'])
  assert.ok(events.indexOf('updateTerrainFrame') < events.indexOf('renderSceneFrame'))
})

test('modal callback measures rendering and scheduling without simulation or HUD', () => {
  const { events, updates, reads } = runCallback({ modal: true })
  assert.deepEqual(events, ['render', 'schedule', 'telemetry'])
  assert.equal(reads, 4)
  assert.deepEqual(JSON.parse(JSON.stringify(updates[0])), [10, 0, 1, 7, 'Menu · rendering', 2, 0, createPointerFrameMetrics(), 0, 0, { terrainCpuMs: 0, waterCpuMs: 0, hudCpuMs: 0 }])
})

test('disabled and hidden diagnostics add no clock reads and preserve game callback order', () => {
  const enabled = runCallback(), disabled = runCallback({ enabled: false })
  assert.equal(disabled.reads, 0)
  assert.equal(disabled.updates.length, 0)
  assert.deepEqual(disabled.events, enabled.events.filter(event => event !== 'telemetry'))
  const hidden = runCallback({ hidden: true })
  assert.equal(hidden.reads, 0)
  assert.equal(hidden.updates.length, 0)
  assert.equal(hidden.events[0], 'reset')
  const stale = runCallback({ current: false })
  assert.equal(stale.reads, 0)
  assert.equal(stale.updates.length, 0)
  assert.deepEqual(stale.events, ['cancelNearbyFollowers'])
})

test('120 FPS cadence and total CPU remain separate measurements across reset', () => {
  const sample = new FramePerformance()
  for (let i = 0; i < 31; i++) sample.sample(1000 / 120, 1, 2, 7, 5)
  assert.ok(Math.abs(sample.fps - 120) < 1e-9)
  assert.equal(sample.callbackMs, 5)
  sample.reset()
  sample.sample(250, 0, 1, 7, 2)
  assert.equal(sample.callbackMs, 2)
  const graph = readFileSync(new URL('../app/fps-graph.ts', import.meta.url), 'utf8')
  assert.ok(graph.includes('120 FPS: 8.33 ms'))
  assert.ok(graph.includes('1000 / 120 / ceiling'))
})

import { FpsGraph } from '../app/fps-graph.ts'

test('actual graph keeps a startup spike, auto scale and 120 FPS guide consistent until expiry', () => {
  // Exercise production update without constructing browser UI or replacing globals.
  const sink = () => ({
    textContent: '',
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value) },
    getAttribute(name) { return this.attributes.get(name) },
  })
  const graph = Object.create(FpsGraph.prototype)
  Object.assign(graph, {
    previous: null,
    samples: new FramePerformance(),
    fields: Object.fromEntries(['state', 'fps', 'frame', 'peak', 'callback', 'simulation',
      'render', 'calls', 'heap', 'scale', 'pointer', 'pointer-tail', 'other', 'window', 'raf-tail', 'cpu-tail', 'cpu-peak',
      'picking-window', 'pick-numeric', 'pick-packed', 'pick-sparse', 'pick-representation'].map(name => [name, sink()])),
    line: sink(),
    budget: sink(),
  })
  const metric = name => graph.fields[name].textContent
  const guideY = () => {
    const match = /^M0 ([\d.]+)H240$/.exec(graph.budget.getAttribute('d'))
    assert.ok(match, 'actual SVG guide path is present')
    return Number(match[1])
  }
  graph.update(0, 1, 2, 3, 'Live', 4)
  graph.update(1020, 1, 2, 3, 'Live', 4)
  assert.equal(graph.samples.frame(0), 1020)
  assert.equal(graph.samples.frameMs, 1020)
  assert.equal(graph.samples.fps, 1000 / 1020)
  assert.equal(metric('peak'), '1020.0 ms')
  assert.equal(metric('scale'), '0–1020 ms')
  assert.equal(graph.line.getAttribute('points').trim(), '239,1.0')
  assert.ok(Math.abs(guideY() - (59 - 58 * (1000 / 120) / 1020)) < 1e-12)

  // Averages recover before the spike leaves recent history.
  for (let i = 1; i <= 225; i++) graph.update(1020 + i * 10, 1, 2, 3, 'Live', 4)
  assert.equal(metric('fps'), '100')
  assert.equal(metric('frame'), '10.0 ms')
  assert.equal(metric('peak'), '1020.0 ms')
  assert.equal(metric('scale'), '0–1020 ms')
  assert.equal(graph.samples.frame(0), 1020)
  assert.ok(Math.abs(guideY() - (59 - 58 * (1000 / 120) / 1020)) < 1e-12)

  // Cross the 240-frame ring boundary and the next 250 ms publication.
  for (let i = 226; i <= 250; i++) graph.update(1020 + i * 10, 1, 2, 3, 'Live', 4)
  assert.equal(graph.samples.count, 240)
  for (let i = 0; i < graph.samples.count; i++) assert.equal(graph.samples.frame(i), 10)
  assert.equal(metric('peak'), '10.0 ms')
  assert.equal(metric('scale'), '0–40 ms')
  assert.ok(Math.abs(guideY() - (59 - 58 * (1000 / 120) / 40)) < 1e-12)
  const points = graph.line.getAttribute('points').trim().split(/\s+/)
  assert.equal(points.length, 240)
  for (const [index, point] of points.entries()) assert.equal(point, `${index},44.5`)
})


test('disjoint stage means retain inclusive callback and expose inconsistent ownership', () => {
  const samples = new FramePerformance()
  samples.sample(250, 2, 3, 10, 12, 4)
  assert.equal(samples.pointerMs, 4)
  assert.equal(samples.otherMs, 3)
  assert.equal(samples.simulationMs + samples.renderMs + samples.pointerMs + samples.otherMs, samples.callbackMs)
  samples.sample(250, 2, 3, 10, 4, 1)
  assert.equal(samples.otherMs, -2, 'do not clamp away overlapping or invalid boundaries')
  samples.sample(250, 0, 1, 10, 2)
  assert.equal(samples.pointerMs, 0, 'modal/default sample has no stale pointer stage')
  assert.equal(samples.otherMs, 1)
})

test('rolling RAF and callback nearest-rank summaries use partial windows and expire together', () => {
  const samples = new FramePerformance()
  const history = samples.callbackHistory
  samples.sample(250, 0, 0, 0, 9)
  assert.deepEqual(samples.rafPercentiles, { p50: 250, p95: 250, p99: 250, max: 250 })
  assert.deepEqual(samples.callbackPercentiles, { p50: 9, p95: 9, p99: 9, max: 9 })
  samples.reset()
  for (let i = 1; i <= 100; i++) samples.sample(250 + i, 0, 0, 0, i)
  assert.deepEqual(samples.callbackPercentiles, { p50: 50, p95: 95, p99: 99, max: 100 })
  assert.deepEqual(samples.rafPercentiles, { p50: 300, p95: 345, p99: 349, max: 350 })
  for (let i = 1; i <= 240; i++) samples.sample(250, 0, 0, 0, 2)
  assert.deepEqual(samples.callbackPercentiles, { p50: 2, p95: 2, p99: 2, max: 2 })
  assert.deepEqual(samples.rafPercentiles, { p50: 250, p95: 250, p99: 250, max: 250 })
  assert.equal(samples.callbackHistory, history)
  samples.reset()
  assert.equal(samples.callbackHistory, history)
  assert.equal(history.length, 240)
  assert.deepEqual(samples.callbackPercentiles, { p50: 0, p95: 0, p99: 0, max: 0 })
  assert.deepEqual(samples.rafPercentiles, { p50: 0, p95: 0, p99: 0, max: 0 })
  assert.equal(samples.pointerMs, 0)
  assert.equal(samples.otherMs, 0)
  samples.sample(250, 0, 0, 0, 5)
  assert.deepEqual(samples.callbackPercentiles, { p50: 5, p95: 5, p99: 5, max: 5 })
})

test('nonfinite or negative CPU/call measurements reject both windows without partial mutation', () => {
  const samples = new FramePerformance()
  for (const index of [1, 2, 3, 4, 5]) {
    for (const invalid of [NaN, Infinity, -Infinity, -1]) {
      const args = [250, 1, 2, 3, 6, 1]
      args[index] = invalid
      assert.equal(samples.sample(...args), false)
      assert.equal(samples.count, 0)
      assert.equal(samples.elapsed, 0)
      assert.equal(samples.pointer, 0)
    }
  }
  samples.sample(250, 1, 2, 3, 6, 1)
  assert.equal(samples.count, 1)
  assert.equal(samples.otherMs, 2)
})


test('pointer stage includes nested tooltip picking without counting it twice', () => {
  const ordinary = runCallback(), nested = runCallback({ nestedPointer: 7 })
  assert.equal(nested.reads, ordinary.reads)
  assert.equal(nested.updates[0][6], 8)
  assert.equal(nested.updates[0][5] - ordinary.updates[0][5], 7)
  const samples = new FramePerformance()
  const [, simulation, render, calls, , callback, pointer] = nested.updates[0]
  samples.sample(250, simulation, render, calls, callback, pointer)
  assert.equal(samples.otherMs, callback - simulation - render - pointer)
})

test('live to modal publication includes both samples, then replaces the pointer mean', () => {
  const samples = new FramePerformance()
  assert.equal(samples.sample(100, 2, 3, 10, 12, 4), false)
  assert.equal(samples.sample(150, 0, 1, 5, 2, 0), true)
  assert.equal(samples.pointerMs, 2, 'mean covers the full publication window, not just current mode')
  assert.equal(samples.callbackMs, 7)
  assert.equal(samples.otherMs, 2)
  assert.equal(samples.sample(250, 0, 1, 5, 2, 0), true)
  assert.equal(samples.pointerMs, 0)
  assert.equal(samples.otherMs, 1)
})

test('export capture is bounded, chronological and independent of graph summary publication', () => {
  const samples = new FramePerformance()
  for (let i = 1; i <= 1301; i++) samples.sample(10, i, 2, 30, i + 9, 4, i * 10, i % 2 ? 'live' : 'menu')
  const frames = samples.recentFrames()
  assert.equal(samples.count, 240)
  assert.equal(frames.length, 1200)
  assert.deepEqual(frames[0], { timestampMs: 1020, rafIntervalMs: 10, simulationCpuMs: 102,
    sceneRenderCpuMs: 2, sceneDrawCalls: 30, callbackCpuMs: 111, pointerTooltipCpuMs: 4,
    otherCallbackCpuMs: 3, state: 'menu', pointerBreakdown: null })
  assert.equal(frames.at(-1).timestampMs, 13010)
  frames[0].simulationCpuMs = -999
  assert.equal(samples.recentFrames()[0].simulationCpuMs, 102, 'export is detached from mutable storage')
  samples.sample(10, 0, 0, 0, 1, 3, 13020, 'paused')
  assert.equal(samples.recentFrames().at(-1).otherCallbackCpuMs, -2)
  samples.reset()
  assert.deepEqual(samples.recentFrames(), [])
  samples.sample(8, 1, 2, 3, 6, 1, 20000, 'live')
  assert.equal(samples.recentFrames().length, 1)
  assert.equal(samples.recentFrames()[0].timestampMs, 20000)
})

test('invalid sample rejects raw export without partially writing any fields', () => {
  const samples = new FramePerformance()
  samples.sample(10, 1, 2, 3, 6, 1, 10, 'live')
  const before = samples.recentFrames()
  for (const index of [0, 1, 2, 3, 4, 5, 6]) {
    const args = [10, 1, 2, 3, 6, 1, 20, 'live']
    args[index] = NaN
    samples.sample(...args)
    assert.deepEqual(samples.recentFrames(), before)
  }
})

test('explicit export produces bounded parser-compatible local JSON with actual span and no game/account contents', async t => {
  const originals = new Map(), urls = [], links = [], revoked = [], timers = []
  const replace = (name, value) => {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, value })
  }
  let blob
  replace('navigator', { userAgent: 'Test browser', account: 'DO NOT EXPORT' })
  replace('document', { visibilityState: 'visible', createElement(tag) {
    assert.equal(tag, 'a')
    const link = { click() { links.push({ href: this.href, download: this.download }) } }
    return link
  } })
  replace('innerWidth', 1280); replace('innerHeight', 720); replace('devicePixelRatio', 2)
  replace('URL', { createObjectURL(value) { blob = value; urls.push('blob:local'); return 'blob:local' }, revokeObjectURL(url) { revoked.push(url) } })
  replace('setTimeout', fn => { timers.push(fn) })
  const graph = Object.create(FpsGraph.prototype)
  Object.assign(graph, { samples: new FramePerformance(), enabledAt: '2026-10-17T00:00:00.000Z',
    hardware: { renderer: 'Test renderer', cores: '8', memory: '~8 GiB' },
    gl: { drawingBufferWidth: 2560, drawingBufferHeight: 1440 },
    fields: { 'export-status': { textContent: '' } }, world: { save: 'DO NOT EXPORT' } })
  try {
    graph.exportRecentFrames()
    assert.equal(urls.length, 0)
    assert.match(graph.fields['export-status'].textContent, /No frames/)
    graph.samples.sample(10, 1, 2, 3, 6, 1, 100, 'live')
    graph.samples.sample(30, 2, 3, 4, 9, 2, 130, 'paused')
    graph.exportRecentFrames()
    const report = JSON.parse(await blob.text())
    assert.equal(report.schema, 'populous-new-dawn/frame-performance')
    assert.equal(report.schemaVersion, 1)
    assert.equal(report.buildRevision, 'unknown')
    assert.equal(report.timing.capturedSpanMs, 40)
    assert.equal(report.timing.count, 2)
    assert.equal(report.timing.startTimestampMs, 90)
    assert.equal(report.timing.endTimestampMs, 130)
    assert.equal(report.frames[1].state, 'paused')
    assert.equal(report.environment.userAgent, 'Test browser')
    assert.deepEqual(report.environment.viewportCssPixels, { width: 1280, height: 720 })
    assert.ok(!JSON.stringify(report).includes('DO NOT EXPORT'))
    assert.equal(links.length, 1)
    assert.match(links[0].download, /^populous-frames-.*\.json$/)
    assert.equal(links[0].href, 'blob:local')
    assert.deepEqual(revoked, [])
    timers[0]()
    assert.deepEqual(revoked, ['blob:local'])
    assert.equal(graph.samples.recentFrames().length, 2, 'export neither clears nor modifies capture')
    graph.exportRecentFrames()
    assert.equal(links.length, 2, 'repeated explicit export is supported')
    // Exercise the shipped Blob serializer, not a separately compacted report.
    // Populate every current optional detail so future additive diagnostics are
    // automatically covered here too (including nullable interaction flags).
    const metrics = createPointerFrameMetrics(true)
    const populate = object => {
      for (const [key, value] of Object.entries(object)) {
        if (key === 'version') continue
        if (value && typeof value === 'object') populate(value)
        else if (typeof value === 'number')
          object[key] = key.endsWith('Ms') ? 1234567.8901234567 : Number.MAX_SAFE_INTEGER
        else if (value === null) object[key] = false
      }
    }
    populate(metrics)
    graph.samples.reset()
    for (let i = 1; i <= 1200; i++)
      graph.samples.sample(16.666666666666668, 1234567.8901234567, 1234567.8901234567,
        Number.MAX_SAFE_INTEGER, 4938281.560493827, 1234567.8901234567, i * 16.666666666666668, 'live', metrics, 127, Number.MAX_SAFE_INTEGER)
    graph.exportRecentFrames()
    const downloaded = await blob.text()
    const boundedDownload = JSON.parse(downloaded), downloadedFrames = boundedDownload.frames
    assert.ok(downloadedFrames.length > 0 && downloadedFrames.length <= 1200)
    assert.deepEqual(downloadedFrames, graph.samples.recentFrames().slice(-downloadedFrames.length))
    if (downloadedFrames.length < 1200)
      assert.deepEqual(boundedDownload.retention, { availableFrames: 1200, droppedOldestFrames: 1200 - downloadedFrames.length, reason: 'serialized-size-limit' })
    assert.deepEqual(downloadedFrames[0].pointerBreakdown.modelWork, Array(3).fill(Number.MAX_SAFE_INTEGER))
    assert.equal(downloadedFrames[0].waterUpdateReasons, 127)
    assert.equal(downloadedFrames[0].simulationSteps, Number.MAX_SAFE_INTEGER)
    assert.equal(downloadedFrames[0].pointerBreakdown.ordinaryTerrain.visibility.indexEntriesWritten, Number.MAX_SAFE_INTEGER)
    assert.equal(downloadedFrames.at(-1).pointerBreakdown.interaction.route, metrics.interaction.route)
    assert.ok(blob.size <= 2 * 1024 * 1024, 'actual download obeys CLI byte bound')
    assert.ok(downloaded.length <= 2 * 1024 * 1024, 'actual download obeys parser code-unit bound')
    const { analyzeFrameExport } = await import('../app/frame-export-analysis.ts')
    assert.equal(analyzeFrameExport(downloaded).sampleCount, downloadedFrames.length)
    const cohorts = summarizeFrameExportCohorts(downloaded)
    assert.equal(cohorts.sampleCount, downloadedFrames.length)
    assert.equal(cohorts.cohorts.find(group => group.name === 'all').metrics['pointerBreakdown.ordinaryTerrain.visibility.indexEntriesWritten'].max, Number.MAX_SAFE_INTEGER)
    assert.equal(cohorts.cohorts.find(group => group.name === 'all').metrics.waterUpdateReasons, undefined, 'water is a separate scalar, not an inferred metric or grouping')
    const fullDetailBytes = blob.size
    const { boundedFrameExport } = await import('../app/frame-export-size.ts')
    const baseReport = { ...boundedDownload, frames: graph.samples.recentFrames() }
    delete baseReport.retention
    const measure = (name, full) => {
      const baseline = structuredClone(full)
      for (const frame of baseline.frames) {
        delete frame.pointerBreakdown.ordinaryTerrain.paths
        delete frame.pointerBreakdown.nativeOcclusion.cacheRepresentationChanged
      }
      const old = boundedFrameExport(baseline), added = boundedFrameExport(full)
      t.diagnostic(JSON.stringify({ capture: name, baseline: { bytes: old.blob.size, frames: old.frameCount },
        instrumented: { bytes: added.blob.size, frames: added.frameCount },
        unboundedBaselineBytes: new Blob([JSON.stringify(baseline)]).size,
        unboundedInstrumentedBytes: new Blob([JSON.stringify(full)]).size }))
      return { old, added }
    }
    const maximumSize = measure('maximal-safe-integer-detail', baseReport)
    assert.equal(maximumSize.old.frameCount, 1200, 'preserve historical no-extension maximum-detail coverage')
    assert.ok(maximumSize.added.frameCount >= 1100, 'new maximum-detail capture budget')
    assert.ok(new Blob([JSON.stringify(baseReport)]).size - new Blob([JSON.stringify({
      ...baseReport, frames: baseReport.frames.map(frame => {
        const copy = structuredClone(frame)
        delete copy.pointerBreakdown.ordinaryTerrain.paths
        delete copy.pointerBreakdown.nativeOcclusion.cacheRepresentationChanged
        return copy
      }),
    })]).size <= 160 * 1200, 'new fields add at most 160 bytes per maximal-count frame')
    const normal = structuredClone(baseReport)
    for (const frame of normal.frames) {
      frame.pointerBreakdown = createPointerFrameMetrics(true)
      frame.pointerBreakdown.ordinaryTerrain.paths.numeric = 9
      frame.rafIntervalMs = 16.666666666666668
      frame.simulationCpuMs = 1.1234567890123456
      frame.sceneRenderCpuMs = 2.1234567890123456
      frame.sceneDrawCalls = 100
      frame.callbackCpuMs = 5.1234567890123456
      frame.pointerTooltipCpuMs = 0.1234567890123456
      frame.otherCallbackCpuMs = 1.7530864219753088
      frame.waterUpdateReasons = 0
      frame.simulationSteps = 0
    }
    const normalSize = measure('representative-small-counts', normal)
    assert.equal(normalSize.old.frameCount, 1200)
    assert.equal(normalSize.added.frameCount, 1200)
    for (const frame of normal.frames) {
      frame.sceneRenderGpu = { status: 'available', milliseconds: 2.1234567890123456 }
      frame.sceneUpdateCpu = { terrainCpuMs: 0.1234567890123456, waterCpuMs: 0.1234567890123456, hudCpuMs: 0.1234567890123456 }
    }
    const normalGpuSize = measure('representative-small-counts-gpu-updates', normal)
    assert.equal(normalGpuSize.old.frameCount, 1200)
    assert.equal(normalGpuSize.added.frameCount, 1200)
    // Adversarial valid fields exceed the old optimistic max-counter fixture.
    for (const [state, agent] of [['live', 'Test browser'], ['paused', 'Test browser'], ['paused', 'GPU 😀'.repeat(2000)]]) {
      metrics.terrainPickMs = Number('0.12345678901234567')
      navigator.userAgent = agent
      graph.samples.reset()
      for (let i = 1; i <= 1200; i++)
        graph.samples.sample(16.666666666666668, 1234567.8901234567, 1234567.8901234567,
          Number.MAX_SAFE_INTEGER, 4938281.560493827, 1234567.8901234567, i * 16.666666666666668, state, metrics, 127, Number.MAX_SAFE_INTEGER,
          { token: graph.samples.reserveGpuFrame(), timing: { status: 'available', milliseconds: Number.MAX_SAFE_INTEGER / 1e6 } },
          { terrainCpuMs: Number('0.12345678901234567'), waterCpuMs: Number('0.12345678901234567'), hudCpuMs: Number('0.12345678901234567') })
      const original = graph.samples.recentFrames()
      graph.exportRecentFrames()
      const json = await blob.text(), bounded = JSON.parse(json), analysis = analyzeFrameExport(json)
      t.diagnostic(`GPU ${state}: ${blob.size} bytes, ${bounded.frames.length}/1200 retained, agent ${agent.length} code units`)
      assert.ok(blob.size <= 2 * 1024 * 1024)
      assert.ok(json.length <= 2 * 1024 * 1024)
      assert.ok(bounded.frames.length < original.length, 'overflow must be explicitly bounded')
      assert.deepEqual(bounded.frames, original.slice(-bounded.frames.length), 'retain exact newest contiguous measurements')
      assert.deepEqual(graph.samples.recentFrames(), original, 'export never trims the recording ring')
      assert.equal(bounded.retention.availableFrames, 1200)
      assert.equal(bounded.retention.droppedOldestFrames, 1200 - bounded.frames.length)
      assert.equal(analysis.retention.droppedOldestFrames, bounded.retention.droppedOldestFrames)
      assert.equal(analysis.sampleCount, bounded.frames.length)
      assert.ok(bounded.frames.every(f => f.sceneRenderGpu.status === 'available'))
      assert.equal(bounded.frames[0].sceneRenderGpu.milliseconds, Number.MAX_SAFE_INTEGER / 1e6)
      assert.match(graph.fields['export-status'].textContent, /omitted .* oldest/)
      assert.ok(analysis.warnings.some(warning => warning.includes('omitted')))
      const repeated = json
      graph.exportRecentFrames()
      const again = JSON.parse(await blob.text()), prior = JSON.parse(repeated)
      delete again.exportedAt; delete prior.exportedAt
      assert.deepEqual(again, prior)
    }
    const countBeforeRefusal = links.length, retained = graph.samples.recentFrames()
    navigator.userAgent = '😀'.repeat(600000)
    graph.exportRecentFrames()
    assert.equal(links.length, countBeforeRefusal, 'oversized metadata cannot emit an invalid file')
    assert.match(graph.fields['export-status'].textContent, /Export failed/)
    assert.deepEqual(graph.samples.recentFrames(), retained)
    const indentedBytes = new Blob([JSON.stringify(JSON.parse(downloaded), null, 2)]).size
    t.diagnostic(`${fullDetailBytes} bytes in actual full-detail exported Blob; ${indentedBytes} bytes if indented`)
    assert.ok(indentedBytes > 2 * 1024 * 1024, 'compact serializer is required for populated interaction captures')

  } finally {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  }
})

test('download failures are surfaced without clearing capture and still revoke the URL', () => {
  const originals = new Map(), timers = [], revoked = []
  const replace = (name, value) => {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, value })
  }
  replace('navigator', { userAgent: 'Test browser' })
  replace('document', { visibilityState: 'visible', createElement() { throw Error('download unavailable') } })
  replace('innerWidth', 1280); replace('innerHeight', 720); replace('devicePixelRatio', 1)
  replace('URL', { createObjectURL() { return 'blob:failed' }, revokeObjectURL(url) { revoked.push(url) } })
  replace('setTimeout', fn => timers.push(fn))
  const graph = Object.create(FpsGraph.prototype)
  Object.assign(graph, { samples: new FramePerformance(), hardware: {}, gl: {}, fields: { 'export-status': { textContent: '' } } })
  try {
    graph.samples.sample(10, 1, 2, 3, 6, 1, 10)
    assert.doesNotThrow(() => graph.exportRecentFrames())
    assert.match(graph.fields['export-status'].textContent, /Export failed/)
    assert.equal(graph.samples.recentFrames().length, 1)
    timers[0]()
    assert.deepEqual(revoked, ['blob:failed'])
  } finally {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  }
})

test('raw pointer phase export snapshots all counters, marks unavailable and clears modal/reset state', () => {
  const samples = new FramePerformance(), metrics = createPointerFrameMetrics()
  for (const [index, key] of Object.keys(metrics).entries()) metrics[key] = index + 1
  const expected = { ...metrics }
  samples.sample(10, 1, 2, 3, 6, 1, 10, 'live', metrics)
  resetPointerFrameMetrics(metrics)
  assert.deepEqual(samples.recentFrames()[0].pointerBreakdown, expected)
  samples.sample(10, 0, 1, 3, 2, 0, 20, 'menu', metrics)
  assert.deepEqual(samples.recentFrames()[1].pointerBreakdown, createPointerFrameMetrics())
  metrics.objectModelsMs = NaN
  samples.sample(10, 1, 2, 3, 6, 1, 30, 'live', metrics)
  assert.equal(samples.recentFrames().length, 2)
  samples.reset()
  samples.sample(10, 1, 2, 3, 6, 1, 40, 'live')
  assert.equal(samples.recentFrames()[0].pointerBreakdown, null)
})

test('export control focus releases held gameplay keys and stale edge navigation without changing game state', () => {
  const source = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
  const body = source.slice(source.indexOf('  togglePerformance()'), source.indexOf('  previous: number'))
  const listeners = new Map()
  class FakeGraph {
    constructor(gl, level) { this.level = level }
    element = { addEventListener(type, fn) { listeners.set(type, fn) }, remove() {} }
  }
  const scene = vm.runInNewContext(stripTypeScriptTypes(`new (class { ${body} })()`), { FpsGraph: FakeGraph })
  Object.assign(scene, { fpsGraph: null, renderer: { getContext: () => ({}) },
    world: { outcome: { level: 2 }, paused: false, selected: [7] },
    container: { appendChild() {} }, keys: new Set(['arrowright']), navigationPointer: { x: 1279, y: 100, buttons: 0 } })
  const worldBefore = JSON.stringify(scene.world)
  scene.togglePerformance()
  assert.equal(scene.fpsGraph.level, 2)
  listeners.get('pointerenter')()
  assert.equal(scene.navigationPointer, null)
  assert.ok(scene.keys.has('arrowright'), 'entering button without focus does not consume held keys')
  listeners.get('focusin')()
  assert.equal(scene.keys.size, 0, 'release cannot be stranded by stopped keyup on focused button')
  assert.equal(JSON.stringify(scene.world), worldBefore)
})


test('pointer percentiles use fixed bounded storage, nearest rank and reset partial windows', () => {
  const sample = new FramePerformance()
  const history = sample.pointerHistory
  const summary = sample.pointerPercentiles
  for (let i = 1; i <= 240; i++) sample.sample(250, 0, 0, 0, i, i)
  assert.equal(summary.p95, 228)
  assert.equal(summary.max, 240)
  for (let i = 0; i < 240; i++) sample.sample(250, 0, 0, 0, 3, 3)
  assert.equal(summary.p95, 3)
  assert.equal(summary.max, 3, 'Old spikes leave the 240-frame ring')
  assert.equal(sample.pointerHistory, history)
  assert.equal(sample.pointerPercentiles, summary)
  assert.equal(history.length, 240)
  sample.sample(250, 0, 0, 0, 100, NaN)
  assert.equal(summary.max, 3, 'Rejected pointer samples do not poison tails')
  sample.reset()
  assert.equal(summary.max, 0)
  sample.sample(250, 0, 0, 0, 8, 8)
  assert.equal(summary.p95, 8)
  assert.equal(summary.max, 8, 'Partial window cannot expose stale ring values')
  assert.equal(sample.pointerHistory, history)
})

test('optional native occlusion extension snapshots independently and never fabricates old data', () => {
  const samples = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  metrics.nativeOcclusion.cacheCold = 1
  metrics.nativeOcclusion.projectedVertices = 42
  metrics.nativeOcclusion.triangleScanMs = 3.5
  const expected = structuredClone(metrics)
  samples.sample(10, 1, 2, 3, 6, 1, 10, 'live', metrics)
  assert.equal(samples.recentFrames().length, 1)
  resetPointerFrameMetrics(metrics)
  assert.deepEqual(samples.recentFrames()[0].pointerBreakdown, expected)
  const first = samples.recentFrames()
  first[0].pointerBreakdown.nativeOcclusion.cacheCold = 999
  assert.deepEqual(samples.recentFrames()[0].pointerBreakdown, expected)
  samples.sample(10, 0, 1, 3, 2, 0, 20, 'live', createPointerFrameMetrics())
  assert.equal(samples.recentFrames()[1].pointerBreakdown.nativeOcclusion, undefined)
  for (const value of [-1, NaN, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    metrics.nativeOcclusion.projectedVertices = value
    assert.equal(samples.sample(10, 0, 1, 3, 2, 0, 30, 'live', metrics), false)
  }
  resetPointerFrameMetrics(metrics)
  metrics.nativeOcclusion.version = 2
  assert.equal(samples.sample(10, 0, 1, 3, 2, 0, 30, 'live', metrics), false)
  assert.equal(samples.recentFrames().length, 2)
})

test('optional ordinary terrain extension snapshots independently and never fabricates old data', () => {
  const samples = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  metrics.ordinaryTerrain.visitedTriangles = 1
  metrics.ordinaryTerrain.projectedVertices = 42
  metrics.ordinaryTerrain.triangleScanMs = 3.5
  const expected = structuredClone(metrics)
  samples.sample(10, 1, 2, 3, 6, 1, 10, 'live', metrics)
  assert.equal(samples.recentFrames().length, 1)
  resetPointerFrameMetrics(metrics)
  assert.deepEqual(samples.recentFrames()[0].pointerBreakdown, expected)
  const first = samples.recentFrames()
  first[0].pointerBreakdown.ordinaryTerrain.visitedTriangles = 999
  assert.deepEqual(samples.recentFrames()[0].pointerBreakdown, expected)
  samples.sample(10, 0, 1, 3, 2, 0, 20, 'live', createPointerFrameMetrics())
  assert.equal(samples.recentFrames()[1].pointerBreakdown.ordinaryTerrain, undefined)
  for (const value of [-1, NaN, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    metrics.ordinaryTerrain.projectedVertices = value
    assert.equal(samples.sample(10, 0, 1, 3, 2, 0, 30, 'live', metrics), false)
  }
  resetPointerFrameMetrics(metrics)
  metrics.ordinaryTerrain.version = 2
  assert.equal(samples.sample(10, 0, 1, 3, 2, 0, 30, 'live', metrics), false)
  assert.equal(samples.recentFrames().length, 2)
})


test('optional visibility counters snapshot and old ordinary captures retain absence', () => {
  const frames = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  metrics.ordinaryTerrain.visibility.indexEntriesWritten = 12
  frames.sample(10, 0, 0, 0, 1, 1, 10, 'live', metrics)
  resetPointerFrameMetrics(metrics)
  assert.equal(frames.recentFrames()[0].pointerBreakdown.ordinaryTerrain.visibility.indexEntriesWritten, 12)
  for (const invalid of [-1, 0.5, null, Number.MAX_SAFE_INTEGER + 1]) {
    metrics.ordinaryTerrain.visibility.indexReuseCalls = invalid
    frames.sample(10, 0, 0, 0, 1, 1, 20, 'live', metrics)
    assert.equal(frames.recentFrames().length, 1)
  }
  delete metrics.ordinaryTerrain.visibility
  frames.sample(10, 0, 0, 0, 1, 1, 20, 'live', metrics)
  assert.equal(frames.recentFrames()[1].pointerBreakdown.ordinaryTerrain.visibility, undefined)
})


test('visibility and interaction snapshots remain separate across ring wrap and missing old fields', () => {
  const frames = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  for (let i = 1; i <= 1205; i++) {
    metrics.ordinaryTerrain.visibility.indexReuseCalls = i
    metrics.interaction.route = i % 2 ? 'hud' : 'world'
    frames.sample(10, 0, 0, 0, 1, 1, i * 10, 'live', metrics)
  }
  const recent = frames.recentFrames()
  assert.equal(recent.length, 1200)
  assert.equal(recent[0].pointerBreakdown.ordinaryTerrain.visibility.indexReuseCalls, 6)
  assert.equal(recent[0].pointerBreakdown.interaction.route, 'world')
  assert.equal(recent.at(-1).pointerBreakdown.ordinaryTerrain.visibility.indexReuseCalls, 1205)
  assert.equal(recent.at(-1).pointerBreakdown.interaction.route, 'hud')
  recent[0].pointerBreakdown.ordinaryTerrain.visibility.indexReuseCalls = 999
  assert.equal(frames.recentFrames()[0].pointerBreakdown.ordinaryTerrain.visibility.indexReuseCalls, 6)
  delete metrics.ordinaryTerrain.visibility
  frames.sample(10, 0, 0, 0, 1, 1, 12060, 'live', metrics)
  assert.equal(frames.recentFrames().at(-1).timestampMs, 12060)
  assert.equal(frames.recentFrames().at(-1).pointerBreakdown.ordinaryTerrain.visibility, undefined)
  frames.reset()
  assert.equal(frames.recentFrames().length, 0)
})


test('actual animate propagates frame-local water reasons without disabled allocations or clocks', () => {
  const enabled = runCallback({ waterReason: 32 })
  assert.equal(enabled.updates[0][8], 32)
  assert.equal(enabled.reads, 12)
  enabled.scene.waterFrameMetrics.reasons = 127
  enabled.scene.updateEnvironmentFrame = () => {}
  enabled.scene.animate(20)
  assert.equal(enabled.updates[1][8], 0, 'new frame clears prior/off-frame state')
  for (const options of [{ enabled: false }, { hidden: true }, { current: false }]) {
    const result = runCallback({ ...options, waterReason: 32 })
    assert.equal(result.reads, 0)
    assert.equal(result.scene.waterFrameMetrics, undefined)
    assert.equal(result.scene.sceneUpdateMetrics, undefined)
  }
  assert.equal(runCallback({ modal: true, waterReason: 32 }).updates[0][8], 0)
})


test('actual callback carries simulation counts including menu zero and disabled no allocation', () => {
  for (const steps of [0, 1, 4]) assert.equal(runCallback({ simulationSteps: steps }).updates[0][9], steps)
  assert.equal(runCallback({ modal: true, simulationSteps: 4 }).updates[0][9], 0)
  const disabled = runCallback({ enabled: false, simulationSteps: 4 })
  assert.equal(disabled.scene.simulationFrameMetrics, undefined)
  assert.equal(disabled.reads, 0)
  assert.equal(runCallback({ hidden: true }).scene.simulationFrameMetrics, undefined)
})

test('simulation count ring preserves unknown, zero, catch-up and reset without stale slots', () => {
  const s = new FramePerformance()
  for (let i = 0; i < 1203; i++) s.sample(16, 1, 1, 1, 3, 0, i + 1, 'live', undefined, undefined, i % 3 === 0 ? undefined : i % 3 === 1 ? 0 : 4)
  const f = s.recentFrames()
  assert.equal(f.length, 1200)
  assert.equal(f[0].simulationSteps, undefined)
  assert.equal(f[1].simulationSteps, 0)
  assert.equal(f[2].simulationSteps, 4)
  for (const count of [-1, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1])
    assert.equal(s.sample(16, 1, 1, 1, 3, 0, 2000, 'live', undefined, undefined, count), false)
  s.reset()
  s.sample(16, 1, 1, 1, 3)
  assert.equal(s.recentFrames()[0].simulationSteps, undefined)
})


test('actual live/modal render callers invoke GPU seam only with active visible profiling', () => {
 for(const modal of [false,true]) {
  assert.equal(runCallback({modal}).gpuCalls,1)
  assert.equal(runCallback({modal,enabled:false}).gpuCalls,0)
  assert.equal(runCallback({modal,hidden:true}).gpuCalls,0)
  assert.equal(runCallback({modal,current:false}).gpuCalls,0)
 }
})

test('optional actual pick paths and native representation misses survive export, reset and ring reuse', () => {
  const frames = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  const paths = metrics.ordinaryTerrain.paths
  assert.deepEqual(paths, { version: 1, numeric: 0, packedVector: 0, sparseVector: 0 })
  for (let i = 1; i <= 1202; i++) {
    paths.numeric = i
    paths.packedVector = 2
    paths.sparseVector = 3
    metrics.nativeOcclusion.cacheRepresentationChanged = i
    frames.sample(10, 0, 0, 0, 1, 1, i * 10, 'live', metrics)
  }
  const exported = frames.recentFrames()
  assert.equal(exported.length, 1200)
  assert.deepEqual(exported[0].pointerBreakdown.ordinaryTerrain.paths, { version: 1, numeric: 3, packedVector: 2, sparseVector: 3 })
  assert.equal(exported.at(-1).pointerBreakdown.nativeOcclusion.cacheRepresentationChanged, 1202)
  exported[0].pointerBreakdown.ordinaryTerrain.paths.numeric = 999
  assert.equal(frames.recentFrames()[0].pointerBreakdown.ordinaryTerrain.paths.numeric, 3)
  resetPointerFrameMetrics(metrics)
  assert.equal(metrics.ordinaryTerrain.paths, paths)
  assert.deepEqual(paths, { version: 1, numeric: 0, packedVector: 0, sparseVector: 0 })
  assert.equal(metrics.nativeOcclusion.cacheRepresentationChanged, 0)
  // Historical metrics do not gain a fabricated zero when slots wrap around.
  delete metrics.ordinaryTerrain.paths
  delete metrics.nativeOcclusion.cacheRepresentationChanged
  frames.sample(10, 0, 0, 0, 1, 1, 12030, 'live', metrics)
  const historical = frames.recentFrames().at(-1).pointerBreakdown
  assert.equal(historical.ordinaryTerrain.paths, undefined)
  assert.equal(historical.nativeOcclusion.cacheRepresentationChanged, undefined)
  frames.reset()
  assert.equal(frames.recentFrames().length, 0)
})

test('invalid optional path counts and versions reject the frame rather than fabricating evidence', () => {
  for (const key of ['numeric', 'packedVector', 'sparseVector', 'cacheRepresentationChanged']) {
    for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, undefined]) {
      if (key === 'cacheRepresentationChanged' && value === undefined) continue
      const frames = new FramePerformance(), metrics = createPointerFrameMetrics(true)
      if (key === 'cacheRepresentationChanged') metrics.nativeOcclusion[key] = value
      else metrics.ordinaryTerrain.paths[key] = value
      frames.sample(10, 0, 0, 0, 1, 1, 10, 'live', metrics)
      assert.equal(frames.recentFrames().length, 0, key + ':' + value)
    }
  }
  for (const paths of [null, { version: 2, numeric: 0, packedVector: 0, sparseVector: 0 }]) {
    const frames = new FramePerformance(), metrics = createPointerFrameMetrics(true)
    metrics.ordinaryTerrain.paths = paths
    frames.sample(10, 0, 0, 0, 1, 1, 10, 'live', metrics)
    assert.equal(frames.recentFrames().length, 0)
  }
})
