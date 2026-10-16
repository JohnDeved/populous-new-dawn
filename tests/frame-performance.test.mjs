import assert from 'node:assert/strict'
import test from 'node:test'
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

// Exercise the actual callback body with deterministic boundary stubs. No
// renderer, asset loading or timing benchmark is involved in this contract test.
function runCallback({ enabled = true, hidden = false, modal = false, current = true } = {}) {
  const source = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
  const body = source.slice(source.indexOf('  animate = (now:'), source.indexOf('  private updateTerrainFrame()'))
  let clock = 0, reads = 0
  const events = [], updates = []
  const step = name => () => { events.push(name); clock += 1 }
  const context = {
    performance: { now() { reads++; return clock } },
    document: { hidden, querySelector() { return null } }, devicePixelRatio: 1,
    requestAnimationFrame() { events.push('schedule'); clock += 1; return 42 },
    syncSecondaryReservations: step('reservations'), advanceGame: step('simulation'),
    updateVehiclesFrame: step('vehicles'), SPELLS: []
  }
  const scene = vm.runInNewContext(stripTypeScriptTypes(`new (class { ${body} })()`), context)
  Object.assign(scene, {
    isCurrent: () => current, previous: 0, modalSuspended: modal,
    hoveredObject: null, world: { selected: [], buildings: [], trees: [] },
    renderer: { getPixelRatio: () => 1, render: step('render'), info: { render: { calls: 7 } } },
    fpsGraph: enabled ? { update(...args) { events.push('telemetry'); updates.push(args); clock += 100 }, reset: step('reset') } : null
  })
  for (const name of ['cancelNearbyFollowers', 'dispatchNearbyFollowers', 'playWorldSounds',
    'updateTerrainFrame', 'updateDecorationsFrame', 'updateCameraMotion', 'cancelTooltipInspection',
    'updateFlyby', 'updateView', 'updateUnitsFrame', 'renderTooltip', 'updateBuildingsFrame',
    'updateEffectsFrame', 'updateShrinesFrame', 'updatePointerFrame', 'updatePlacement',
    'updateSpellPointerFrame', 'updateEnvironmentFrame', 'renderSceneFrame', 'updateHudFrame'])
    scene[name] = step(name)
  scene.animate(10)
  return { scene, events, reads, updates, clock }
}

test('live callback CPU includes preparation, HUD and scheduling, excluding overlay work', () => {
  const { scene, events, reads, updates, clock } = runCallback()
  assert.equal(scene.frame, 42)
  assert.equal(reads, 6)
  assert.equal(updates.length, 1)
  const [now, simulation, render, calls, state, callback] = updates[0]
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
  assert.deepEqual(Array.from(updates[0]), [10, 0, 1, 7, 'Menu · rendering', 2])
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
