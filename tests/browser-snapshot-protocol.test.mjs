import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { FramePerformance } from '../app/frame-performance.ts'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { installSnapshotObserver } from '../scripts/browser-performance/snapshot-observer.mjs'
import { plan, shards, order, repository, metricEligibility, metrics, protocolHash, summarizeSnapshotPhase,
  validateReport, parseReport, comparableWork, compareReports, maxReportBytes } from '../scripts/browser-performance/snapshot-protocol.mjs'
const revision = 'a'.repeat(40), digest = 'c'.repeat(64)
const identity = { repository, prNumber: 42, baseSha: revision, headSha: 'b'.repeat(40), harnessSha: revision, runId: 1234, runAttempt: 1 }
function fixture(name = 'ordinary-hover', cpu = 10, buildRevision = revision) {
  const ring = new FramePerformance(), hud = name === 'hud', native = name === 'native-hover'
  for (let i = 0; i < 32; i++) {
    const pointer = createPointerFrameMetrics(true)
    pointer.interaction.route = hud ? 'hud' : 'world'
    pointer.terrainPickCalls = hud ? 0 : 1; pointer.objectPickCalls = hud ? 0 : 1
    pointer.terrainPickMs = cpu; pointer.objectPickMs = cpu; pointer.objectModelsMs = cpu
    pointer.nativeOcclusion.submittedTriangles = hud ? 0 : 8
    pointer.nativeOcclusion.projectionMs = cpu; pointer.nativeOcclusion.pixelCacheMisses = hud ? 0 : 1
    ring.sample(20, 0, cpu, 12, cpu * 3, cpu, (i + 1) * 20, 'paused', pointer)
  }
  const frames = ring.recentFrames(), camera = { position: { x: 1, y: 2, angle: 0 }, viewPoint: { x: 3, z: 4 }, bearing: 0, zoom: 0, preset: 0, config: {} }
  const before = { level: 2, paused: true, sameScene: true, sceneConnected: true, latchRemoved: true,
    inputMask: 0, flybyActive: false, modalSuspended: false, selected: [], mode: null,
    visibility: 'visible', viewport: { ...plan.viewport, devicePixelRatio: 1, canvas: {} },
    turn: 70, time: 2, pendingTime: 0, randomState: 0xffffffff,
    simulationSha256: digest, unitsSha256: digest, terrainSha256: digest, geometrySha256: digest,
    camera, timeOriginUnixMs: 10000, timestampMs: 10, observationStartTimestampMs: 9 }
  const recording = { name, point: { x: 900, y: 400, ...(native ? { id: 54, canvas: { left: 200, top: 0 }, initialNativePixel: [700, 400],
    nativePixels: plan.nativePointerOffsets.map(([dx, dy]) => [700 + dx, 400 + dy]) } : {}) }, before,
    after: { ...before, timestampMs: 710, observationStartTimestampMs: 700 }, observer: { error: null }, blocks: [] }
  for (let step = 0; step < 6; step++) {
    const [dx, dy] = (native ? plan.nativePointerOffsets : plan.pointerOffsets)[step]
    const angle = 0, anchor = 1 + step * 5
    const witness = Array(113).fill(0), geometry = { fingerprintSha256: digest, witness, timestampMs: anchor * 20, observationStartTimestampMs: (anchor + 4) * 20 }
    const pose = [1, 2, angle, 3, 4, angle * Math.PI / 1024, 0, 0, ...(hud ? [-1, -1] : [900 + dx, 400 + dy]), 0, 1, 70, ...Array(13).fill(0), native ? 54 : -1]
    recording.blocks.push({ geometryBefore: geometry, geometryAfter: geometry, preparation: native ? { pixel: [700 + dx, 400 + dy], cached: false, timestampMs: anchor * 20 } : null,
    event: { sequence: step + 1, type: 'pointermove', x: 900 + dx, y: 400 + dy, buttons: 0,
      anchorSerial: anchor, anchorTimestampMs: anchor * 20, timestampMs: (anchor + 1) * 20 + 5 },
    frames: Array.from({ length: 4 }, (_, i) => ({ serial: anchor + i + 1, timestampMs: (anchor + i + 1) * 20, sequence: step + 1, pose: [...pose], geometryWitness: [...witness] })) })
  }
  const raw = { schema: 'populous-new-dawn/frame-performance', schemaVersion: 1, buildRevision,
    units: { durations: 'milliseconds', timestamps: 'milliseconds since performance.timeOrigin', counters: 'per frame' },
    session: { level: 2 }, environment: { viewportCssPixels: plan.viewport, devicePixelRatio: 1, visibility: 'visible' },
    timing: { timeOriginUnixMs: 10000, capacityFrames: 1200, count: frames.length, startTimestampMs: 0,
      endTimestampMs: 640, capturedSpanMs: 640 }, frames }
  return { raw, recording }
}
const summarize = ({ raw, recording }) => summarizeSnapshotPhase(JSON.stringify(raw), recording, raw.buildRevision)
function report(shard = 'world') {
  return { version: 2, identity: { ...identity }, protocolSha256: protocolHash(), runtimeSha256: digest, snapshotSha256: digest, shard, status: 'complete',
    runs: order.map((side, index) => ({ index, side, revision: identity[`${side}Sha`], status: 'complete', environmentSha256: digest,
      phases: shards[shard].map(name => summarize(fixture(name, side === 'base' ? 10 : 8, identity[`${side}Sha`])).phase) })) }
}
test('v2 uses exactly 4/4 serial-bound callbacks, first and settled separately; event clock may follow RAF now', () => {
  const input = fixture(), json = JSON.stringify(input), result = summarize(input)
  assert.equal(result.selectedRawFrameIndices.length, 24)
  assert.deepEqual(result.selectedRawFrameIndices.slice(0, 4), [1, 2, 3, 4])
  assert.equal(result.phase.timings.first.pointer.all.n, 6); assert.equal(result.phase.timings.settled.pointer.all.n, 18)
  assert.equal(result.phase.rawFrames, 32); assert.equal(JSON.stringify(input), json)
  for (const name of Object.values(shards).flat()) assert.equal(summarize(fixture(name)).phase.frames, 24)
})
test('wrong first/intermediate serial, index, timestamp, route, live/menu state or short retained tail fails closed', () => {
  const changes = [
    x => { x.recording.blocks[0].frames.shift() }, x => { x.recording.blocks[0].frames[0].serial++ },
    x => { x.recording.blocks[0].frames[1].timestampMs += 20 }, x => { x.recording.blocks[0].event.anchorSerial++ },
    x => { x.recording.blocks[0].event.anchorTimestampMs++ }, x => { x.recording.blocks[0].frames[0].sequence++ },
    x => { x.raw.frames[1].pointerBreakdown.interaction.route = 'hud' }, x => { x.raw.frames[1].state = 'menu' },
    x => { x.raw.frames[1].sceneDrawCalls = 0 }, x => { x.raw.frames[1].pointerBreakdown.objectPickCalls = 0 },
    x => { x.recording.blocks[0].frames[0].pose[2]++ }, x => { x.recording.after.turn++ },
    x => { x.recording.after.unitsSha256 = 'd'.repeat(64) }, x => { x.recording.before.latchRemoved = false },
    x => { x.recording.observer.error = 'ordering' },
    x => { x.recording.blocks[0].frames[0].geometryWitness[0] = 1 },
    x => { x.recording.blocks[0].geometryAfter = { ...x.recording.blocks[0].geometryAfter, fingerprintSha256: 'd'.repeat(64) } }, x => { x.raw.buildRevision = 'unknown' },
    x => { x.raw.frames = x.raw.frames.slice(10); x.raw.timing.count -= 10; x.raw.timing.startTimestampMs = 200; x.raw.timing.capturedSpanMs = 440 },
  ]
  for (const change of changes) { const input = fixture(); change(input); assert.throws(() => summarize(input)) }
})
test('stable native hover requires first-callback miss, unique unwarmed native pixels, authored ownership and fixed pose', () => {
  for (const change of [x => { x.raw.frames[1].pointerBreakdown.nativeOcclusion.submittedTriangles = 0 },
    x => { x.recording.blocks[0].frames[0].pose[10] = 2 }, x => { x.recording.blocks[0].frames[0].pose[26] = 5 }, x => { x.recording.blocks[0].frames[0].pose[2]++ },
    x => { x.raw.frames[1].pointerBreakdown.nativeOcclusion.pixelCacheMisses = 0 },
    x => { x.recording.blocks[0].preparation.cached = true },
    x => { x.recording.blocks[0].preparation.pixel[0]++ },
    x => { x.recording.point.nativePixels[1] = x.recording.point.nativePixels[0] },
    x => { x.recording.point.nativePixels.push([1, 2]) }, x => { x.recording.point.canvas.left = NaN },
    x => { x.recording.point.initialNativePixel[0]++ }, x => { x.recording.blocks[0].preparation.timestampMs = -1 },
    x => { x.recording.point.nativePixels[0] = x.recording.point.initialNativePixel },
    x => { x.recording.name = 'native-view-release' }]) {
    const input = fixture('native-hover'); change(input); assert.throws(() => summarize(input))
  }
})
test('strict v2 bounded schema rejects new metrics, unknown fields, incomplete strata and false coverage', () => {
  const value = report(); assert.deepEqual(parseReport(JSON.stringify(value)), value)
  for (const change of [r => { r.version = 1 }, r => { r.identity.repository = 'evil/repo' }, r => { r.command = 'execute' },
    r => { r.runs[0].phases[0].timings.first.evil = {} }, r => { r.runs[0].phases[0].timings.first.pointer.all.n = 5 },
    r => { r.runs[0].phases[0].blocks[0].poses.pop() }, r => { r.runs[0].phases[0].frames = 23 },
    r => { r.runs.pop() }, r => { r.runs[0].revision = identity.headSha }, r => { r.snapshotSha256 = null }]) {
    const x = structuredClone(value); change(x); assert.throws(() => validateReport(x))
  }
  assert.throws(() => parseReport(' '.repeat(maxReportBytes + 1)))
})
test('paired classification requires exact query/submission inventory, state, source and complete shards, not internal work equality', () => {
  const reports = [report(), report('recovery')]
  let result = compareReports(reports, identity)
  assert.equal(result.complete, true); assert.equal(result.rows.length, 150)
  assert.equal(result.rows.find(r => r.metric === 'terrainPick').p50.status, 'possible-improvement')
  assert.equal(result.rows.find(r => r.metric === 'simulation').p50.status, 'not-measured-paused')
  assert.equal(result.rows.find(r => r.metric === 'render').p50.status, 'observation-only-presentation-clocks')
  const phases = reports[0].runs.map(r => r.phases[0]); phases[1].work.first.nativeVertices = null
  assert.equal(comparableWork(phases), true)
  phases[1].blocks[0].inventory[0][2]++
  assert.equal(compareReports(reports, identity).rows[0].p50.status, 'workload-mismatch')
  assert.equal(compareReports([report()], identity).rows.find(r => r.metric === 'terrainPick').p50.status, 'incomplete-shards-observation-only')
  const geometry = report(); geometry.runs[1].phases[0].blocks[0].geometrySha256 = 'd'.repeat(64)
  assert.equal(compareReports([geometry, report('recovery')], identity).rows[0].p50.status, 'geometry-input-mismatch')
  const wrong = report(); wrong.runtimeSha256 = 'd'.repeat(64)
  assert.equal(compareReports([wrong, report('recovery')], identity).rows[0].p50.status, 'environment-mismatch')
  assert.throws(() => compareReports([report()], { ...identity, runId: 9 }))
})
function observer(actualRecorder) {
  const callbacks = new Map(), events = new Map(); let id = 0
  const recorder = actualRecorder ?? { recentCount: 1, timestamp: 20 }, scene = { fpsGraph: { samples: recorder }, cameraPosition: { x: 1, y: 2, angle: 0 },
    viewPoint: { x: 3, z: 4 }, cameraBearing: 0, viewZoom: 0, viewPreset: 0, pointerScreen: { clientX: 903, clientY: 400 }, pointerButtons: 0,
    world: { paused: true, turn: 70, inputMask: 0, flyby: { flags: 0 } }, modalSuspended: false, viewTransition: null,
    overviewActive: false, overviewStage: null, globeMorph: { active: false }, keys: new Set(), cameraMotion: { active: 0 }, resultCamera: { active: 0 },
    cameraVelocity: { turn: 0, forward: 0, side: 0 }, navigationButtons: () => 0, pointerGesture: null }
  const window = { __pndSnapshotGeometry: { witnessWidth: 113, writeWitness(buffer, offset) { buffer.fill(0, offset, offset + 113) } }, testSceneRef: { current: scene }, addEventListener: (n, f) => events.set(n, f), removeEventListener: n => events.delete(n) }
  const context = vm.createContext({ window, performance: { now: () => 45 }, Float64Array,
    requestAnimationFrame: f => { callbacks.set(++id, f); return id }, cancelAnimationFrame: i => callbacks.delete(i) })
  vm.runInContext(`(${installSnapshotObserver.toString()})()`, context)
  const tick = (serial, now = serial * 20, timestamp = now) => { recorder.recentCount = serial; recorder.timestamp = timestamp
    const list = [...callbacks.values()]; callbacks.clear(); list.forEach(f => f(now)) }
  const input = () => events.get('pointermove')({ type: 'pointermove', clientX: 903, clientY: 400, buttons: 0, isTrusted: true })
  return { recorder, scene, api: window.__pndSnapshotObserver, tick, input, callbacks, events }
}
test('read-only sidecar captures synchronous event anchor and all first callbacks despite RAF time preceding event performance.now', () => {
  const o = observer(); o.api.arm({ geometryWitness: Array(113).fill(0), type: 'pointermove', x: 903, y: 400, buttons: 0 }); o.input()
  for (let i = 2; i <= 5; i++) o.tick(i)
  const block = o.api.finish(4)
  assert.equal(block.event.timestampMs, 45); assert.equal(block.frames[0].timestampMs, 40)
  assert.deepEqual(Array.from(block.frames, f => f.serial), [2, 3, 4, 5]); assert.equal(block.frames[0].pose.length, 27)
  assert.equal(o.api.stop().error, null); assert.equal(o.events.size, 0); assert.equal(o.callbacks.size, 0)
})
test('sidecar rejects callback ordering, gaps, reset, replacement and cap, without selecting a later convenient sample', () => {
  for (const change of [o => o.tick(2, 40, 20), o => o.tick(3), o => o.tick(0),
    o => { o.scene.fpsGraph.samples = { ...o.recorder }; o.tick(2) }, o => o.tick(1200)]) {
    const o = observer(); change(o); assert.throws(() => o.api.ready(4)); assert.equal(o.callbacks.size, 0)
    assert.ok(o.api.stop().error)
  }
})

test('only the explicit terrain allowlist can signal; missing observations remain unknown', () => {
  assert.deepEqual(Object.keys(metricEligibility).sort(), Object.keys(metrics).sort())
  const reports = [report(), report('recovery')], result = compareReports(reports, identity)
  for (const row of result.rows) if (metricEligibility[row.metric] !== 'terrain-input-matched')
    assert.ok(!row.p50.status.startsWith('possible-') && !row.p95.status.startsWith('possible-'))
  for (const metric of Object.keys(metrics)) reports[0].runs[1].phases[0].timings.first[metric] = { all: null, nonzero: null, perQuery: null }
  for (const row of compareReports(reports, identity).rows.filter(r => r.phase === 'native-hover' && r.stratum === 'first'))
    assert.equal(row.p50.status, 'unknown')
})

test('actual export helper preserves original download bytes and never retries an uncertain action', async () => {
  const { exportSnapshotRaw } = await import('../scripts/browser-performance/snapshot-capture.mjs')
  const { mkdtempSync, readFileSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const output = mkdtempSync(join(tmpdir(), 'snapshot-export-test-')), raw = JSON.stringify(fixture().raw)
  let exports = 0
  const page = { getByRole: () => ({ focus: async () => {} }), keyboard: { press: async key => { assert.equal(key, 'Space'); exports++ } },
    waitForEvent: async () => ({ suggestedFilename: () => 'populous-frames-test.json', saveAs: async target => writeFileSync(target, raw) }) }
  try {
    const record = { name: 'ordinary-hover' }
    await exportSnapshotRaw({ page, output, record })
    assert.equal(readFileSync(join(output, record.rawFile), 'utf8'), raw)
    await assert.rejects(exportSnapshotRaw({ page, output, record }), /Never retry/)
    assert.equal(exports, 1)
    const failed = { name: 'hud' }, broken = { ...page, waitForEvent: async () => { throw Error('download unavailable') } }
    await assert.rejects(exportSnapshotRaw({ page: broken, output, record: failed }), /download unavailable/)
    await assert.rejects(exportSnapshotRaw({ page, output, record: failed }), /Never retry/)
  } finally { rmSync(output, { recursive: true, force: true }) }
})

test('an event between completed app callback and its observer never relabels that pre-input sample', () => {
  const o = observer()
  o.api.arm({ geometryWitness: Array(113).fill(0), type: 'pointermove', x: 903, y: 400, buttons: 0 })
  o.recorder.recentCount = 2; o.recorder.timestamp = 40 // app completed, observer has not run
  o.input(); o.tick(2)
  for (let serial = 3; serial <= 6; serial++) o.tick(serial)
  const block = o.api.finish(4)
  assert.equal(block.event.anchorSerial, 2)
  assert.deepEqual(Array.from(block.frames, f => f.serial), [3, 4, 5, 6])
  o.api.stop()
})
test('v2 baseline repeat spread is noisy, not a possible regression/improvement', () => {
  const reports = [report(), report('recovery')]
  const phase = reports[0].runs[3].phases[0]
  for (const field of ['all', 'nonzero', 'perQuery']) for (const key of ['mean', 'p50', 'p95', 'max'])
    phase.timings.first.terrainPick[field][key] = 14
  const row = compareReports(reports, identity).rows.find(r => r.phase === phase.name && r.stratum === 'first' && r.metric === 'terrainPick')
  assert.equal(row.p50.status, 'noisy'); assert.equal(row.p95.status, 'noisy')
})

test('explicit size-retained suffix is usable only when every input anchor and contiguous sample survives', () => {
  const input = fixture()
  input.raw.retention = { availableFrames: 34, droppedOldestFrames: 2, reason: 'serialized-size-limit' }
  for (const block of input.recording.blocks) {
    block.event.anchorSerial += 2
    for (const frame of block.frames) frame.serial += 2
  }
  assert.equal(summarize(input).phase.frames, 24)
  for (const change of [x => { x.raw.retention.availableFrames++ }, x => { x.raw.retention.reason = 'unknown' },
    x => { x.raw.retention.droppedOldestFrames = -1 }, x => { x.raw.retention.extra = true },
    x => { x.raw.retention.availableFrames = 1200; x.raw.retention.droppedOldestFrames = 1168 },
    x => { x.recording.blocks[0].event.anchorSerial = 2 }]) {
    const copy = structuredClone(input); change(copy); assert.throws(() => summarize(copy))
  }
})

test('sidecar serial/timestamp contract matches the actual recorder including optional simulation-step layout', () => {
  const recorder = new FramePerformance()
  const sample = timestamp => {
    const previous = recorder.recentCount
    // sample() returns the four-Hz summary publication flag, not raw admission.
    recorder.sample(20, 0, 0, 1, 0, 0, timestamp, 'paused', undefined, 0, 0)
    assert.equal(recorder.recentCount, previous + 1); assert.equal(recorder.timestamp, timestamp)
  }
  sample(20)
  const o = observer(recorder)
  o.api.arm({ geometryWitness: Array(113).fill(0), type: 'pointermove', x: 903, y: 400, buttons: 0 }); o.input()
  for (const timestamp of [40, 60, 80, 100]) { sample(timestamp); o.tick(recorder.recentCount, timestamp, recorder.timestamp) }
  const block = o.api.finish(4), raw = recorder.recentFrames()
  assert.equal(recorder.recentCount, 5)
  for (const observed of block.frames) {
    assert.equal(raw[observed.serial - 1].timestampMs, observed.timestampMs)
    assert.equal(raw[observed.serial - 1].simulationSteps, 0)
  }
  o.api.stop()
})

test('fixed native hover offsets follow production pixel quantization, exclude warmed center and never clear caches', async () => {
  const { snapshotNativeTarget, observeNativePixelAdmission } = await import('../scripts/browser-performance/snapshot-capture.mjs')
  const { readFileSync } = await import('node:fs')
  const production = readFileSync(new URL('../app/scene-picking.ts', import.meta.url), 'utf8')
  assert.match(production, /x: Math.trunc\(event.clientX - rect.left\)/)
  assert.match(production, /y: Math.trunc\(event.clientY - rect.top\)/)
  for (const left of [200, 200.25]) {
    const rect = { left, top: 0.5 }, bounds = { x: 610, y: 370, width: 20, height: 20 }
    const canvas = { getBoundingClientRect: () => rect }, layer = { visible: true }
    const groundHits = new Map([['620,380', []]])
    const scene = { renderer: { domElement: canvas }, unitMeshes: new Map([[54, { visible: true, userData: { layers: [layer] } }]]),
      view: { painter: { source: () => ({}) } }, picking: { personBounds: () => bounds, groundHits } }
    const context = vm.createContext({ window: { testSceneRef: { current: scene } }, document: { elementFromPoint: () => canvas }, performance: { now: () => 12 } })
    const target = vm.runInContext(`(${snapshotNativeTarget.toString()})`, context)(plan.nativePointerOffsets)
    assert.equal(new Set(target.nativePixels.map(p => p.join(','))).size, 6)
    assert.ok(target.nativePixels.every(p => p.join(',') !== target.initialNativePixel.join(',')))
    const admission = vm.runInContext(`(${observeNativePixelAdmission.toString()})`, context)
    for (const [dx, dy] of plan.nativePointerOffsets) {
      const proof = admission({ x: target.x + dx, y: target.y + dy })
      assert.equal(proof.cached, false)
      assert.deepEqual(Array.from(proof.pixel), [Math.trunc(target.x + dx - left), Math.trunc(target.y + dy - rect.top)])
    }
    assert.equal(admission({ x: target.x, y: target.y }).cached, true)
    assert.equal(groundHits.size, 1)
    assert.throws(() => vm.runInContext(`(${snapshotNativeTarget.toString()})`, context)([[0, 0]]), /exclude warmed/)
    assert.throws(() => vm.runInContext(`(${snapshotNativeTarget.toString()})`, context)([[1, 0], [1, 0]]), /unique/)
    bounds.width = 1; assert.throws(() => vm.runInContext(`(${snapshotNativeTarget.toString()})`, context)(plan.nativePointerOffsets), /bounds/)
  }
  assert.equal(plan.cohortRevision, 2)
  assert.equal(plan.nativeViewInvalidation, 'unsupported-unmeasured')
  assert.equal(metricEligibility.nativeProjection, 'observation-only-warm-projection-cache')
})
