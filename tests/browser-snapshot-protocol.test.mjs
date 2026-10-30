import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { sha256 } from '../scripts/browser-performance/browser-runtime.mjs'
import { FramePerformance } from '../app/frame-performance.ts'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { installSnapshotObserver } from '../scripts/browser-performance/snapshot-observer.mjs'
import { plan, shards, order, repository, metricEligibility, eligibility, metrics, protocolHash, summarizeSnapshotPhase,
  validateReport, parseReport, comparableWork, compareReports, maxReportBytes } from '../scripts/browser-performance/snapshot-protocol.mjs'
const revision = 'a'.repeat(40), digest = 'c'.repeat(64)
const identity = { repository, prNumber: 42, baseSha: revision, headSha: 'b'.repeat(40), harnessSha: revision, runId: 1234, runAttempt: 1 }
function fixture(name = 'ordinary-hover', cpu = 10, buildRevision = revision) {
  const ring = new FramePerformance(), hud = name === 'hud', drag = name === 'native-view-drag-warm', native = name === 'native-hover' || drag
  for (let i = 0; i < (drag ? 64 : 32); i++) {
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
  if (drag) {
    camera.position = { x: 40192, y: 23808, angle: 0 }; camera.viewPoint = { x: -107, z: -101 }
    const boundary = (angle, version, time) => {
      const count = angle ? 21636 : 22032, witness = Array(113).fill(0)
      witness.splice(0, 6, 1, 1, 1, 1, 1, 0); witness[10] = version; witness[19] = count; witness[20] = 4
      return { fingerprintSha256: (angle ? 'd' : 'c').repeat(64), positionSha256: digest, indexSha256: (angle ? 'e' : 'f').repeat(64),
        instancesSha256: digest, consumerMethodsSha256: digest,
        metadata: { drawRange: { start: 0, count }, index: { submittedCount: count }, instanceCount: 4 },
        witness, observationStartTimestampMs: time, timestampMs: time }
    }
    for (const [step, block] of recording.blocks.entries()) {
      const angle = (step + 1) % 2, anchor = block.event.anchorSerial
      block.geometryBefore = boundary(step % 2, step + 1, anchor * 20)
      block.geometryAfter = boundary(angle, step + 2, (anchor + 4) * 20)
      block.preparation = null; block.event.x = 900 + angle; block.event.y = 400; block.event.buttons = 2
      const pose = a => [40192, 23808, a, -107, -101, a * Math.PI / 1024, 0, 0, 900 + a, 400, 2, 1, 70,
        ...Array(12).fill(0), 1, -1, 54, 40192, 23808, -25344, 23808, a, 0, ...Array(21).fill(0), a, ...Array(16).fill(0)]
      block.event.beforePose = pose(step % 2); block.event.geometryWitness = [...block.geometryBefore.witness]
      for (const [i, observed] of block.frames.entries()) {
        observed.pose = pose(angle); observed.geometryWitness = [...block.geometryAfter.witness]
        const frame = raw.frames[observed.serial - 1], pointer = frame.pointerBreakdown, n = pointer.nativeOcclusion
        frame.simulationSteps = 0
        pointer.terrainPickCalls = pointer.objectPickCalls = i ? 0 : 1
        pointer.interaction.pointerMoved = pointer.interaction.viewChanged = i === 0
        n.pixelCacheHits = 0; n.pixelCacheMisses = i ? 0 : 1
        n.cacheHits = n.cacheCold = n.cachePositionChanged = 0; n.cacheKeyChanged = i ? 0 : 4
        n.projectedVertices = i ? 0 : 15000; n.submittedTriangles = i ? 0 : block.geometryBefore.metadata.index.submittedCount * 4 / 3
      }
    }
  }
  if (drag) {
    const warmupBlocks = structuredClone(recording.blocks)
    for (const block of recording.blocks) {
      block.event.anchorSerial += 32; block.event.anchorTimestampMs += 640; block.event.timestampMs += 640
      block.event.geometryWitness[10] += 6
      for (const boundary of [block.geometryBefore, block.geometryAfter]) {
        boundary.witness[10] += 6; boundary.timestampMs += 640; boundary.observationStartTimestampMs += 640
      }
      for (const observed of block.frames) {
        const prior = structuredClone(raw.frames[observed.serial - 1])
        observed.serial += 32; observed.timestampMs += 640; observed.geometryWitness[10] += 6
        prior.timestampMs += 640; raw.frames[observed.serial - 1] = prior
      }
    }
    const epoch = (startSerial, endSerial) => ({ startSerial, startTimestampMs: startSerial * 20, endSerial, endTimestampMs: endSerial * 20 })
    const held = { ...camera, pointerButtons: 2, pointerGesture: true }
    recording.warmup = { before: { ...before, camera: held, timestampMs: 12, observationStartTimestampMs: 11 },
      after: { ...before, camera: structuredClone(held), timestampMs: 630, observationStartTimestampMs: 620 }, blocks: warmupBlocks,
      observer: { error: null, recorder: epoch(1, 32), events: warmupBlocks.map(block => block.event) } }
    recording.observer = { error: null, recorder: epoch(32, 64), events: recording.blocks.map(block => block.event) }
    recording.after.timestampMs = 1350; recording.after.observationStartTimestampMs = 1340
    raw.timing.endTimestampMs = raw.timing.capturedSpanMs = 1280
  }

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
  assert.equal(result.complete, true); assert.equal(result.rows.length, Object.values(shards).flat().length * 2 * Object.keys(metrics).length)
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
  const wrong = report(); wrong.runs[1].environmentSha256 = 'd'.repeat(64)
  assert.equal(compareReports([wrong, report('recovery')], identity).rows[0].p50.status, 'environment-mismatch')
  assert.throws(() => compareReports([report()], { ...identity, runId: 9 }))
})
test('snapshot pinning preserves within-cell host/runtime refusals and independent shard admission', () => {
  const environment = { browserVersion: 'Google Chrome 155.0.8059.84', browserSha256: '1'.repeat(64),
    browserPinSha256: '2'.repeat(64), release: '7.0.0-1017-azure', runnerVersion: '20261018.339.1' }
  const runtime = change => sha256(JSON.stringify({ ...environment, ...change }))
  const make = (shard, change = {}) => {
    const value = report(shard)
    value.runtimeSha256 = runtime(change)
    for (const run of value.runs) run.environmentSha256 = runtime(change)
    return value
  }
  const matched = compareReports([make('world'), make('recovery')], identity)
  assert.equal(matched.complete, true)
  for (const change of [{ release: '6.17.0-1022-azure' }, { runnerVersion: '20261012.334.1' },
    { browserVersion: 'Google Chrome 155.0.8059.39' }, { browserSha256: '3'.repeat(64) }, { browserPinSha256: '4'.repeat(64) }]) {
    // V2 never pools disjoint shard cells; each shard still owns six matched arms.
    assert.deepEqual(compareReports([make('world'), make('recovery', change)], identity), matched)
    const changed = make('world'); changed.runs[1].environmentSha256 = runtime(change)
    const result = compareReports([changed, make('recovery')], identity)
    assert.ok(result.rows.filter(row => row.shard === 'world').every(row =>
      row.p50.status === 'environment-mismatch' && row.p95.status === 'environment-mismatch'))
    assert.deepEqual(result.rows.filter(row => row.shard === 'recovery'), matched.rows.filter(row => row.shard === 'recovery'))
  }
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
  for (const row of result.rows) if (eligibility(row.phase, row.stratum, row.metric) !== 'terrain-input-matched')
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
  assert.equal(plan.cohortRevision, 4)
  assert.equal(plan.nativeViewInvalidation, 'separate-warmed-native-view-drag-first-callback')
  assert.equal(metricEligibility.nativeProjection, 'observation-only-warm-projection-cache')
})

test('held drag admits exact first-work callbacks and preserves both geometry endpoints and pre-input projection', () => {
  const input = fixture('native-view-drag-warm'), copy = JSON.stringify(input), result = summarize(input)
  assert.equal(result.phase.frames, 24)
  assert.equal(result.phase.blocks.length, 6)
  assert.notEqual(result.phase.blocks[0].geometrySha256, result.phase.blocks[0].geometryAfterSha256)
  assert.match(result.phase.blocks[0].inputPoseSha256, /^[a-f0-9]{64}$/)
  assert.equal(result.phase.work.first.nativeTriangles.mean, (29376 + 28848) / 2)
  assert.equal(result.phase.work.settled.nativeTriangles.mean, 0)
  assert.equal(JSON.stringify(input), copy)
  const resultRows = compareReports([report(), report('recovery')], identity).rows
  assert.equal(resultRows.find(r => r.phase === 'native-view-drag-warm' && r.stratum === 'first' && r.metric === 'nativeProjection').p50.status, 'possible-improvement')
  assert.equal(resultRows.find(r => r.phase === 'native-view-drag-warm' && r.stratum === 'settled' && r.metric === 'nativeProjection').p50.status, 'unknown')
  assert.equal(resultRows.find(r => r.phase === 'native-hover' && r.stratum === 'first' && r.metric === 'nativeProjection').p50.status, 'observation-only-warm-projection-cache')
})

test('held drag rejects wrong first input, swapped geometry, hidden projection drift and extra or absent work', () => {
  const mutations = [
    x => { x.recording.blocks[0].event.type = 'pointerup' },
    x => { x.recording.blocks[0].geometryAfter.witness[10]++ },
    x => { x.recording.blocks[0].geometryBefore.witness[10] = 0.5 },
    x => { x.recording.blocks[1].event.beforePose[54]++ },
    x => { x.recording.blocks[1].geometryBefore.fingerprintSha256 = 'a'.repeat(64) },
    x => { x.recording.blocks[0].event.buttons = 0 },
    x => { x.recording.blocks[0].event.beforePose[2] = 1 },
    x => { x.recording.blocks[0].event.geometryWitness[19]-- },
    x => { x.recording.blocks[0].frames.shift() },
    x => { x.recording.blocks[0].frames[0].serial++ },
    x => { x.recording.blocks[0].frames[1].geometryWitness[10]++ },
    x => { x.recording.blocks[0].frames[0].pose[27] = 55 },
    x => { x.recording.blocks[0].frames[0].pose[10] = 0 },
    x => { x.recording.blocks[0].frames[1].pose[55]++ },
    x => { x.recording.blocks[0].frames[0].pose[30]++ },
    x => { x.recording.blocks[0].geometryAfter.positionSha256 = 'a'.repeat(64) },
    x => { x.recording.blocks[0].geometryAfter.instancesSha256 = 'a'.repeat(64) },
    x => { x.recording.blocks[0].geometryAfter.consumerMethodsSha256 = 'a'.repeat(64) },
    x => { const b = x.recording.blocks[0]; [b.geometryBefore, b.geometryAfter] = [b.geometryAfter, b.geometryBefore] },
    x => { x.raw.frames[1].pointerBreakdown.nativeOcclusion.submittedTriangles = 28848 },
    x => { x.raw.frames[1].pointerBreakdown.nativeOcclusion.projectedVertices = 0 },
    x => { x.raw.frames[1].pointerBreakdown.nativeOcclusion.cacheKeyChanged = 0 },
    x => { x.raw.frames[1].pointerBreakdown.nativeOcclusion.pixelCacheHits = 1 },
    x => { x.raw.frames[1].pointerBreakdown.objectPickCalls = 2 },
    x => { x.raw.frames[2].pointerBreakdown.nativeOcclusion.submittedTriangles = 1 },
    x => { x.raw.frames[1].pointerBreakdown.interaction.viewChanged = false },
    x => { x.raw.frames[1].pointerBreakdown.interaction.dragQuery = true },
    x => { x.raw.frames[1].simulationSteps = 1 },
    x => { delete x.raw.frames[1].simulationSteps },
  ]
  for (const mutation of mutations) { const input = fixture('native-view-drag-warm'); mutation(input); assert.throws(() => summarize(input)) }
})

test('held-drag effective projection and both prefix identities must match across all paired sessions; internal work need not', () => {
  for (const field of ['geometrySha256', 'geometryAfterSha256', 'inputPoseSha256', 'poses']) {
    const reports = [report(), report('recovery')], p = reports[0].runs[1].phases.at(-1)
    if (field === 'poses') p.blocks[0].poses[0] = 'a'.repeat(64)
    else p.blocks[0][field] = 'a'.repeat(64)
    const row = compareReports(reports, identity).rows.find(r => r.phase === 'native-view-drag-warm' && r.metric === 'nativeProjection')
    assert.equal(row.p50.status, field.startsWith('geometry') ? 'geometry-input-mismatch' : 'workload-mismatch')
  }
  const reports = [report(), report('recovery')], phases = reports[0].runs.map(r => r.phases.at(-1))
  phases[1].work.first.nativeVertices.mean = 5000; phases[1].work.first.nativeVertices.p50 = 5000
  assert.equal(comparableWork(phases), true)
})

test('unsupported held-drag source binding cannot signal and does not invalidate the qualified five phases', () => {
  const reports = [report(), report('recovery')]
  reports[0].runs[1].phases[2] = { name: 'native-view-drag-warm', unsupported: 'source-contract' }
  const result = compareReports(reports, identity)
  assert.equal(result.complete, true)
  assert.ok(result.rows.filter(r => r.phase === 'native-view-drag-warm').every(r => r.p50.status === 'unsupported-source-contract'))
  assert.equal(result.rows.find(r => r.phase === 'ordinary-hover' && r.stratum === 'first' && r.metric === 'terrainPick').p50.status, 'possible-improvement')
  for (const change of [p => { p.name = 'native-hover' }, p => { p.unsupported = 'free text' }, p => { p.command = 'execute' }]) {
    const value = structuredClone(reports[0]); change(value.runs[1].phases[2]); assert.throws(() => validateReport(value))
  }
})

test('warmed drag retains all 24 warmup and 24 measured callbacks in one raw epoch, without changing measured quotas', () => {
  const input = fixture('native-view-drag-warm'), result = summarize(input)
  assert.deepEqual(result.warmupRawFrameIndices, input.recording.warmup.blocks.flatMap(b => b.frames.map(f => f.serial - 1)))
  assert.deepEqual(result.selectedRawFrameIndices, input.recording.blocks.flatMap(b => b.frames.map(f => f.serial - 1)))
  assert.equal(new Set([...result.warmupRawFrameIndices, ...result.selectedRawFrameIndices]).size, 48)
  assert.equal(result.phase.rawFrames, 64); assert.equal(result.phase.frames, 24); assert.equal(result.phase.warmup.frames, 24)
  assert.equal(result.phase.warmup.firstCpuMs.nativeProjection.length, 6)
  assert.deepEqual(result.phase.warmup.blocks, result.phase.blocks)
  const original = JSON.stringify(result.phase.timings)
  for (const index of result.warmupRawFrameIndices) input.raw.frames[index].pointerBreakdown.nativeOcclusion.projectionMs = 999
  const changed = summarize(input)
  assert.equal(JSON.stringify(changed.phase.timings), original)
  assert.deepEqual(changed.phase.warmup.firstCpuMs.nativeProjection, Array(6).fill(999))
  delete input.raw.frames[result.warmupRawFrameIndices[0]].pointerBreakdown.nativeOcclusion.projectionMs
  assert.throws(() => summarize(input), /projectionMs/, 'Required raw instrumentation must not be invented')
})

test('warmup missing first/intermediate work, reset epochs, return drift or any raw trimming fails closed', () => {
  const mutations = [
    x => { delete x.recording.warmup },
    x => { x.recording.name = 'native-view-drag' },
    x => { x.recording.warmup.blocks.pop() }, x => { x.recording.warmup.blocks.push(x.recording.warmup.blocks[0]) },
    x => { x.recording.warmup.blocks[0].frames.shift() },
    x => { x.recording.warmup.blocks[0].event.anchorSerial++ },
    x => { x.recording.warmup.blocks[0].frames[0].serial++ },
    x => { x.recording.warmup.blocks[0].frames[1].timestampMs++ },
    x => { x.recording.warmup.blocks[0].event.sequence++ },
    x => { x.recording.warmup.blocks[0].frames[0].sequence++ },
    x => { x.recording.warmup.observer.error = 'Recorder replaced' },
    x => { x.recording.warmup.observer.events.pop() },
    x => { x.recording.warmup.observer.recorder.endSerial-- },
    x => { x.recording.observer.recorder.startTimestampMs-- },
    x => { x.recording.observer.recorder.startSerial-- },
    x => { x.recording.warmup.after.turn++ },
    x => { x.recording.warmup.after.timeOriginUnixMs++ },
    x => { x.recording.warmup.after.camera.position.angle++ },
    x => { x.recording.warmup.after.camera.pointerButtons = 0 },
    x => { x.recording.warmup.before.camera.pointerGesture = false },
    x => { x.recording.warmup.blocks.at(-1).frames.at(-1).pose[55]++ },
    x => { x.recording.warmup.blocks.at(-1).geometryAfter.witness[10]++ },
    x => { x.recording.warmup.blocks.at(-1).geometryAfter.witness[7]++ },
    x => { x.recording.warmup.blocks.at(-1).geometryAfter.indexSha256 = 'a'.repeat(64) },
    x => { x.recording.blocks[0].event.beforePose[54]++ },
    x => { x.recording.blocks[0].geometryBefore.witness[10]++ },
    x => { x.raw.retention = { availableFrames: 65, droppedOldestFrames: 1, reason: 'serialized-size-limit' } },
    x => { x.raw.frames[1].pointerBreakdown.nativeOcclusion.projectedVertices = 0 },
  ]
  for (const change of mutations) { const input = fixture('native-view-drag-warm'); change(input); assert.throws(() => summarize(input), change.toString()) }
})

test('warmup input identity, never first-use CPU, controls new-cohort matching; five stable cohorts remain independent', () => {
  const input = [report(), report('recovery')], original = compareReports(input, identity)
  input[0].runs[1].phases[2].warmup.firstCpuMs.nativeProjection = Array(6).fill(999)
  assert.deepEqual(compareReports(input, identity), original)
  for (const field of ['geometrySha256', 'inputPoseSha256', 'poses']) {
    const changed = structuredClone(input), block = changed[0].runs[1].phases[2].warmup.blocks[1]
    if (field === 'poses') block.poses[0] = 'a'.repeat(64)
    else block[field] = 'a'.repeat(64)
    const comparison = compareReports(changed, identity)
    assert.ok(comparison.rows.filter(row => row.phase === 'native-view-drag-warm').every(row => row.p50.status === 'workload-mismatch'))
    assert.deepEqual(comparison.rows.filter(row => row.phase !== 'native-view-drag-warm'), original.rows.filter(row => row.phase !== 'native-view-drag-warm'))
  }
})


test('capture handoff checks return before measured inputs or sidecar restart, with no retry after first failure', async () => {
  const { captureDragWarmup } = await import('../scripts/browser-performance/snapshot-capture.mjs')
  const { installSnapshotDragObserver } = await import('../scripts/browser-performance/snapshot-drag-observer.mjs')
  for (const failure of [null, 'input', 'return']) {
    const { recording: record } = fixture('native-view-drag-warm'), prior = record.warmup, calls = []
    let observations = 0
    if (failure === 'return') prior.after.turn++
    const page = { evaluate: async (fn, source) => { calls.push('restart-sidecar'); assert.equal(source, installSnapshotDragObserver.toString()); return prior.observer } }
    const run = captureDragWarmup({ page, record,
      observe: async () => { calls.push('observe'); return observations++ === 0 ? prior.before : prior.after },
      runBlocks: async blocks => { calls.push('six-fixed-inputs'); blocks.push(...prior.blocks); if (failure === 'input') throw Error('first failed input') }, save: () => calls.push('save') })
    const measured = run.then(() => calls.push('measured-inputs'))
    if (failure) {
      await assert.rejects(measured)
      assert.equal(calls.includes('measured-inputs'), false)
      assert.equal(calls.includes('restart-sidecar'), false)
    } else {
      await measured
      assert.deepEqual(calls, ['observe', 'save', 'six-fixed-inputs', 'observe', 'save', 'restart-sidecar', 'save', 'measured-inputs'])
    }
    assert.equal(calls.filter(call => call === 'six-fixed-inputs').length, 1)
    assert.equal(record.warmup.blocks.length, 6)
  }
})


test('independent shard runtimes do not contaminate disjoint comparison cells', () => {
  const reports = [report(), report('recovery')]
  const before = compareReports(reports, identity)
  reports[1].runtimeSha256 = 'd'.repeat(64)
  for (const run of reports[1].runs) run.environmentSha256 = 'e'.repeat(64)
  assert.deepEqual(compareReports(reports, identity), before)
})

test('within-cell environment changes fail closed, even when each pair agrees', () => {
  for (const indexes of [[0], [1], [2], [3], [4], [5], [0, 1], [2, 3], [4, 5]]) {
    const reports = [report(), report('recovery')]
    for (const index of indexes) reports[0].runs[index].environmentSha256 = 'e'.repeat(64)
    const result = compareReports(reports, identity)
    for (const row of result.rows.filter(row => row.shard === 'world')) {
      assert.deepEqual(row.p50, { status: 'environment-mismatch' })
      assert.deepEqual(row.p95, row.p50)
    }
    assert.deepEqual(result.rows.filter(row => row.shard === 'recovery'),
      compareReports([report(), report('recovery')], identity).rows.filter(row => row.shard === 'recovery'))
  }
})

test('same-cell evidence cannot be combined from reports with same or different runtimes', () => {
  for (const runtime of [digest, 'd'.repeat(64)]) {
    const duplicate = report(); duplicate.runtimeSha256 = runtime
    assert.throws(() => compareReports([report(), duplicate, report('recovery')], identity), /One report per shard/)
  }
  const transplanted = report('recovery')
  transplanted.runs[0].phases[0] = structuredClone(report().runs[0].phases[0])
  assert.throws(() => compareReports([report(), transplanted], identity))
})

test('environment scope change does not admit missing identity or historical protocol reports', () => {
  for (const mutate of [r => { r.runtimeSha256 = null },
    r => { r.runs[0].environmentSha256 = null },
    r => { r.runs[0].runtimeSha256 = 'd'.repeat(64) },
    r => { r.protocolSha256 = '6697351a369a029e19401a6a10e0a20763bcd4379a9b6fa02c2fd465503a5c51' }]) {
    const value = report(); mutate(value)
    assert.throws(() => compareReports([value, report('recovery')], identity))
  }
})
