import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { inspectDragSource, dragSourceSlices } from '../scripts/browser-performance/snapshot-drag-contract.mjs'
import { installSnapshotDragObserver } from '../scripts/browser-performance/snapshot-drag-observer.mjs'
import { RenderView } from '../app/render-view.ts'
const root = resolve(import.meta.dirname, '..')

test('source-owner admission is exact, bounded and read-only; projection kernel remains changeable', () => {
  const read = path => readFileSync(resolve(root, path), 'utf8')
  assert.equal(inspectDragSource(root).status, 'admitted')
  for (const slice of dragSourceSlices) {
    const changed = inspectDragSource(root, path => path !== slice.path ? read(path)
      : slice.start === null ? `${read(path)}\n` : read(path).replace(slice.start, `${slice.start}\n/* changed admission */`))
    assert.equal(changed.status, 'unsupported-source-contract', slice.id)
    assert.ok(changed.slices.find(s => s.id === slice.id).reason)
  }
  const boundary = dragSourceSlices.find(s => s.id === 'query-inputs')
  for (const replacement of ['', `${boundary.start}\n${boundary.start}`, ' '.repeat(1024 * 1024 + 1)]) {
    assert.equal(inspectDragSource(root, path => path === boundary.path ? replacement : read(path)).status, 'unsupported-source-contract')
  }
  assert.equal(inspectDragSource(root, path => path !== boundary.path ? read(path)
    : read(path).replace(boundary.end, `${boundary.end}\n          // reviewable projection kernel change`)).status, 'admitted')
})

function observer() {
  const callbacks = new Map(), events = new Map(); let id = 0
  const recorder = { recentCount: 1, timestamp: 20 }, view = new RenderView()
  view.update(1240, 1000, { x: -107, z: -101 }, 0, 0, false, 1440)
  const scene = { fpsGraph: { samples: recorder }, view, cameraPosition: { x: 40192, y: 23808, angle: 0 },
    viewPoint: { x: -107, z: -101 }, cameraBearing: 0, viewZoom: 0, viewPreset: 0,
    pointerScreen: { clientX: 820, clientY: 380 }, pointerButtons: 2,
    world: { paused: true, turn: 70, inputMask: 0, flyby: { flags: 0 } }, modalSuspended: false, viewTransition: null,
    overviewActive: false, overviewStage: null, globeMorph: { active: false }, keys: new Set(), cameraMotion: { active: 0 }, resultCamera: { active: 0 },
    cameraVelocity: { turn: 0, forward: 0, side: 0 }, navigationButtons: () => 0, pointerGesture: { pointerId: 1, button: 2 },
    hoveredObject: null, tooltipInput: { picked: 54 } }
  const witness = Array(113).fill(0); witness[10] = 1; witness[19] = 22032
  const window = { __pndSnapshotGeometry: { witnessWidth: 113, writeWitness(buffer, offset) { for (let i = 0; i < 113; i++) buffer[offset + i] = witness[i] } }, testSceneRef: { current: scene },
    addEventListener: (name, fn, options) => { assert.equal(options.capture, true); events.set(name, fn) }, removeEventListener: name => events.delete(name) }
  const context = vm.createContext({ window, performance: { now: () => 45 }, Float64Array,
    requestAnimationFrame: fn => { callbacks.set(++id, fn); return id }, cancelAnimationFrame: i => callbacks.delete(i) })
  vm.runInContext(`(${installSnapshotDragObserver.toString()})()`, context)
  const api = window.__pndSnapshotObserver
  const input = (event = {}) => events.get('pointermove')({ type: 'pointermove', clientX: 821, clientY: 380, buttons: 2, isTrusted: true, ...event })
  const tick = (serial, now = serial * 20) => { recorder.recentCount = serial; recorder.timestamp = now
    const list = [...callbacks.values()]; callbacks.clear(); list.forEach(fn => fn(now)) }
  const move = () => { scene.cameraPosition.angle = 1; scene.cameraBearing = Math.PI / 1024; scene.pointerScreen.clientX = 821
    view.update(1240, 1000, scene.viewPoint, scene.cameraBearing, 0, false, 1440); witness[10] = 2; witness[19] = 21636 }
  return { api, witness, scene, recorder, input, tick, move, callbacks, events, arm: () => api.arm({ geometryWitness: [...witness], type: 'pointermove', x: 821, y: 380, buttons: 2 }) }
}

test('separate held-drag observer binds synchronous old input, exact next sample and all effective projection values', () => {
  const o = observer(); o.arm(); o.input(); o.move()
  for (let i = 2; i <= 5; i++) o.tick(i)
  const block = o.api.finish(4)
  assert.equal(block.event.timestampMs, 45); assert.equal(block.frames[0].timestampMs, 40)
  assert.equal(block.event.beforePose[2], 0); assert.equal(block.event.geometryWitness[19], 22032)
  for (const frame of block.frames) { assert.equal(frame.pose.length, 72); assert.equal(frame.pose[2], 1); assert.equal(frame.pose[27], 54); assert.equal(frame.geometryWitness[19], 21636) }
  assert.notDeepEqual(block.event.beforePose.slice(55, 64), block.frames[0].pose.slice(55, 64))
  assert.equal(o.api.stop().error, null); assert.equal(o.events.size, 0); assert.equal(o.callbacks.size, 0)
})

test('held-drag observer never accepts stale pre-input geometry, duplicate input, missing first sample or changed later prefix', () => {
  for (const change of [o => { o.witness[10]++; o.input() }, o => { o.input({ buttons: 0 }) },
    o => { o.input(); o.input() }, o => { o.input(); o.tick(3) },
    o => { o.input(); o.move(); o.tick(2); o.witness[10]++; o.tick(3) },
    o => { o.input(); o.scene.fpsGraph.samples = { ...o.recorder }; o.tick(2) }, o => { o.input(); o.tick(1200) }]) {
    const o = observer(); o.arm(); change(o); assert.throws(() => o.api.ready(4)); assert.ok(o.api.stop().error)
  }
})

test('projection shape changes fail admission without traversing extra fields on every RAF', () => {
  const o = observer(); o.scene.view.projection.extra = 1; assert.throws(() => o.arm(), /projection input shape/); o.api.stop()
})

test('a last-move projection expansion is rejected outside selected callbacks, not silently truncated', () => {
  for (const mutate of [p => { p.extra = 1 }, p => p.matrix.push(1), p => p.bounds.push(1)]) {
    const o = observer(); o.arm(); o.input(); o.move(); mutate(o.scene.view.projection)
    for (let serial = 2; serial <= 5; serial++) o.tick(serial)
    assert.throws(() => o.api.finish(4), /projection input shape/); o.api.stop()
  }
})

test('production held-right pointer callback calls native object query before ordinary terrain and leaves settled callbacks idle', async t => {
  const { tooltipCallerFixture } = await import('./support/tooltip-scene.mjs')
  const { scene, point } = await tooltipCallerFixture(t)
  const { updatePointerFrame, pointerMove } = await import('../app/scene-input-runtime.ts')
  const { createPointerFrameMetrics } = await import('../app/pointer-frame-metrics.ts')
  const unit = scene.world.units.find(person => person.hp > 0)
  assert.ok(unit)
  const calls = []; let prefix = 'old'
  // Supplied leaf queries expose caller order, not browser or geometry parity.
  scene.picking.pick = () => { calls.push(['native', prefix]); return unit.id }
  scene.pick = () => { calls.push(['ordinary', prefix]); prefix = 'new'; return null }
  scene.pointerScreen = { ...point }; scene.pointerButtons = 2; scene.pointerState = ''
  scene.cameraPosition = { x: 40192, y: 23808, angle: 0 }; scene.cameraVelocity = { turn: 0, forward: 0, side: 0 }
  scene.pointerGesture = { pointerId: 1, button: 2 }; scene.dragLast = { x: point.clientX, y: point.clientY }
  scene.cameraMotion = { active: 0 }; scene.captureCamera = () => {}; scene.updateView = () => {}
  pointerMove(scene, { pointerId: 1, buttons: 2, clientX: point.clientX + 1, clientY: point.clientY })
  assert.equal(scene.cameraPosition.angle, 1); assert.deepEqual(scene.cameraVelocity, { turn: 0, forward: 0, side: 0 })
  const first = createPointerFrameMetrics(true); updatePointerFrame(scene, 100, first)
  assert.deepEqual(calls, [['native', 'old'], ['ordinary', 'old']]); assert.equal(prefix, 'new')
  assert.equal(scene.hoveredObject, null); assert.equal(scene.tooltipInput.picked, unit.id)
  assert.equal(first.objectPickCalls, 1); assert.equal(first.terrainPickCalls, 1)
  const settled = createPointerFrameMetrics(true); updatePointerFrame(scene, 120, settled)
  assert.equal(calls.length, 2); assert.equal(settled.objectPickCalls, 0); assert.equal(settled.terrainPickCalls, 0)
})

test('only comparative runner opt-in retains completed stable phases after the final added capture fails', async () => {
  const { retainStablePhasesAfterDragFailure } = await import('../scripts/browser-performance/snapshot-capture.mjs')
  const make = () => ({ shard: 'world', status: 'incomplete', phases: [
    { name: 'native-hover', status: 'passed', summaryFile: 'native.json' },
    { name: 'ordinary-hover', status: 'passed', summaryFile: 'ordinary.json' },
    { name: 'native-view-drag', status: 'incomplete', rawFile: 'failed-raw.json', failure: 'first callback missing' },
  ] })
  const report = make(), prior = structuredClone(report.phases)
  assert.equal(retainStablePhasesAfterDragFailure(report, true), true)
  assert.equal(report.status, 'passed-with-incomplete-drag'); assert.deepEqual(report.phases, prior)
  for (const modify of [r => { r.phases[0].status = 'incomplete' }, r => { r.phases.pop() },
    r => { r.shard = 'recovery' }, r => { r.phases[2].name = 'ordinary-hover' }]) {
    const value = make(); modify(value); const before = JSON.stringify(value)
    assert.equal(retainStablePhasesAfterDragFailure(value, true), false); assert.equal(JSON.stringify(value), before)
  }
  const smoke = make(); assert.equal(retainStablePhasesAfterDragFailure(smoke, false), false)
  assert.equal(smoke.status, 'incomplete')
})
