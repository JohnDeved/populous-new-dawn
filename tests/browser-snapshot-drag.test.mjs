import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { inspectDragSource, dragSourceProfiles } from '../scripts/browser-performance/snapshot-drag-contract.mjs'
import { installSnapshotDragObserver } from '../scripts/browser-performance/snapshot-drag-observer.mjs'
import { RenderView } from '../app/render-view.ts'
const root = resolve(import.meta.dirname, '..')

test('source-owner admission selects one exact bounded route; projection kernel remains changeable', () => {
  const read = path => readFileSync(resolve(root, path), 'utf8')
  const admitted = inspectDragSource(root)
  assert.equal(admitted.status, 'admitted'); assert.equal(admitted.version, 2)
  assert.equal(admitted.profiles.filter(profile => profile.status === 'admitted').length, 1)
  const profile = dragSourceProfiles.find(profile => profile.id === admitted.profile)
  assert.ok(profile); assert.equal(profile.slices.length, 16)
  for (const slice of profile.slices) {
    const changed = inspectDragSource(root, path => {
      if (path !== slice.path) return read(path)
      if (slice.absentFile) return ''
      if (slice.absentMarker) return `${read(path)}\n${slice.absentMarker}`
      return slice.start === null ? `${read(path)}\n`
        : read(path).replace(slice.start, `${slice.start}\n/* changed admission */`)
    })
    assert.equal(changed.status, 'unsupported-source-contract', slice.id)
    assert.equal(changed.profile, null)
    assert.ok(changed.profiles.find(p => p.id === profile.id).slices.find(s => s.id === slice.id).reason)
  }
  const boundary = profile.slices.find(s => s.id === 'query-inputs')
  for (const replacement of ['', `${boundary.start}\n${boundary.start}`, ' '.repeat(1024 * 1024 + 1),
    `${read(boundary.path)}\n${boundary.end}`]) {
    assert.equal(inspectDragSource(root, path => path === boundary.path ? replacement : read(path)).status, 'unsupported-source-contract')
  }
  assert.equal(inspectDragSource(root, path => path !== boundary.path ? read(path)
    : read(path).replace(boundary.end, `${boundary.end}\n          // reviewable projection kernel change`)).status, 'admitted')
})

test('body owner admits only its exact route and preserves the historical owned route', () => {
  const read = path => readFileSync(resolve(root, path), 'utf8')
  const current = `        diagnostic.renderGpu(() =>
          this.view.painter.render(this.renderer, this.scene, this.camera, this.unitMeshes)
        )
      else this.view.painter.render(this.renderer, this.scene, this.camera, this.unitMeshes)`
  const previous = `        diagnostic.renderGpu(() => this.view.painter.render(this.renderer, this.scene, this.camera))
      else this.view.painter.render(this.renderer, this.scene, this.camera)`
  const source = read('app/scene.ts')
  assert.equal(source.split(current).length, 2)
  const inspect = text => inspectDragSource(root, path => path === 'app/scene.ts' ? text : read(path))
  const admitted = inspect(source)
  assert.equal(admitted.profile, 'owned-numeric-terrain-body-v1')
  assert.equal(admitted.profiles.filter(p => p.status === 'admitted').length, 1)
  const historical = inspect(source.replace(current, previous))
  assert.equal(historical.profile, 'owned-numeric-terrain-v1')
  assert.equal(historical.profiles.filter(p => p.status === 'admitted').length, 1)
  for (const [before, after] of [
    [current, current.replaceAll('this.unitMeshes', 'new Map()')],
    [current, current.replace('this.camera, this.unitMeshes', 'this.camera')],
    ['    if (this.modalSuspended) {', '    if (!this.modalSuspended) {'],
    ['    this.updatePointerFrame(now, pointerMetrics)', '    this.updatePointerFrame(now + 1, pointerMetrics)'],
    ['    this.renderTooltip(pointerMetrics)', '    this.updatePointerFrame(now, pointerMetrics)\n    this.renderTooltip(pointerMetrics)'],
  ]) {
    assert.equal(source.split(before).length, 2)
    assert.equal(inspect(source.replace(before, after)).status, 'unsupported-source-contract')
  }
})

test('atomic route profiles cache both source reads and failures; only ENOENT establishes helper absence', () => {
  const calls = new Map(), helper = 'app/runtime-terrain-picking.ts'
  const read = path => readFileSync(resolve(root, path), 'utf8')
  const result = inspectDragSource(root, path => { calls.set(path, (calls.get(path) ?? 0) + 1); return read(path) })
  assert.equal(result.status, 'admitted'); assert.ok([...calls.values()].every(count => count === 1))
  assert.equal(calls.size, new Set(dragSourceProfiles.flatMap(p => p.slices.map(s => s.path))).size)
  for (const replacement of [() => '', () => undefined, () => ' '.repeat(1024 * 1024 + 1),
    () => { throw Object.assign(Error('unreadable'), { code: 'EACCES' }) }, () => { throw Error('unknown failure') }]) {
    let failures = 0
    const changed = inspectDragSource(root, path => {
      if (path !== helper) return read(path)
      failures++; return replacement()
    })
    assert.equal(changed.status, 'unsupported-source-contract'); assert.equal(failures, 1)
  }
  // A failed RenderView read cannot establish the absence of an owned method.
  assert.equal(inspectDragSource(root, path => {
    if (path === 'app/render-view.ts') throw Object.assign(Error('missing'), { code: 'ENOENT' })
    return read(path)
  }).status, 'unsupported-source-contract')
})

test('route admission binds numeric lease gates, actual constructor order and helper lifecycle, not just query signatures', () => {
  const read = path => readFileSync(resolve(root, path), 'utf8')
  const checks = [
    ['app/render-view.ts', '          const scratch =\n            !nativeEdges &&', '          const scratch =\n            nativeEdges &&'],
    ['app/scene.ts', '    this.cursor.visible = false\n    this.range.visible = false', '    this.range.visible = false\n    this.cursor.visible = false'],
    ['app/scene-input-runtime.ts', 'export function pick(', 'export function pick(\n/* altered public dispatch */'],
  ]
  if (['owned-numeric-terrain-v1', 'owned-numeric-terrain-body-v1'].includes(inspectDragSource(root).profile)) checks.push(
    ['app/render-view.ts', 'owned && scratch && runtimeTerrainPicking(this, object)', 'owned && scratch'],
    ['app/runtime-terrain-picking.ts', 'if (released.has(scene.view)) return', 'if (false) return'],
    ['app/scene-terrain-runtime.ts', '    rebindRuntimeTerrainPicking(scene)', '    /* omitted rebind */'])
  for (const [path, before, after] of checks) {
    assert.equal(read(path).split(before).length, 2)
    assert.equal(inspectDragSource(root, name => name === path ? read(name).replace(before, after) : read(name)).status,
      'unsupported-source-contract', path)
  }
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
  return { context, window, api, witness, scene, recorder, input, tick, move, callbacks, events, arm: () => api.arm({ geometryWitness: [...witness], type: 'pointermove', x: 821, y: 380, buttons: 2 }) }
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
    { name: 'native-view-drag-warm', status: 'incomplete', rawFile: 'failed-raw.json', failure: 'first callback missing' },
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

test('observer stop records absolute epoch and rejects replacement or reset even before a subsequent RAF', () => {
  const valid = observer(); valid.arm(); valid.input(); valid.move()
  for (let serial = 2; serial <= 5; serial++) valid.tick(serial)
  const result = valid.api.stop()
  assert.deepEqual(JSON.parse(JSON.stringify(result.recorder)), { startSerial: 1, startTimestampMs: 20, endSerial: 5, endTimestampMs: 100 })
  for (const change of [o => { o.scene.fpsGraph.samples = { ...o.recorder } }, o => { o.recorder.recentCount = 0 }]) {
    const value = observer(); change(value); assert.equal(value.api.stop().error, 'Recorder epoch changed')
  }
})

test('two fixed six-input observers retain one absolute recorder epoch and never select a later first callback', () => {
  const o = observer(), sequences = []
  let serial = 1
  for (let sequence = 0; sequence < 2; sequence++) {
    const api = o.window.__pndSnapshotObserver
    for (let step = 0; step < 6; step++) {
      const angle = (step + 1) % 2, x = 820 + angle
      api.arm({ geometryWitness: [...o.witness], type: 'pointermove', x, y: 380, buttons: 2 })
      o.input({ clientX: x }); o.scene.cameraPosition.angle = angle; o.scene.cameraBearing = angle * Math.PI / 1024
      o.scene.pointerScreen.clientX = x
      o.scene.view.update(1240, 1000, o.scene.viewPoint, o.scene.cameraBearing, 0, false, 1440)
      o.witness[10]++; o.witness[19] = angle ? 21636 : 22032
      for (let i = 0; i < 4; i++) o.tick(++serial)
      const block = api.finish(4)
      assert.equal(block.event.sequence, step + 1)
      assert.equal(block.frames[0].serial, sequence * 24 + step * 4 + 2)
      assert.equal(block.frames[0].serial, block.event.anchorSerial + 1)
    }
    sequences.push(api.stop())
    if (sequence === 0) vm.runInContext(`(${installSnapshotDragObserver.toString()})()`, o.context)
  }
  assert.equal(sequences[0].recorder.endSerial, 25); assert.equal(sequences[1].recorder.startSerial, 25)
  assert.equal(sequences[0].recorder.endTimestampMs, sequences[1].recorder.startTimestampMs)
  assert.equal(o.recorder.recentCount, 49); assert.equal(o.scene.cameraPosition.angle, 0)
  for (const result of sequences) { assert.equal(result.error, null); assert.equal(result.events.length, 6); assert.equal(result.frames.length, 24) }
})
