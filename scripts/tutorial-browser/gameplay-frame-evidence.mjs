import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { analyzeFrameExport } from '../../app/frame-export-analysis.ts'
import { summarizeFrameExportCohorts } from '../../app/frame-export-cohorts.ts'

export const gameplayFramePlan = {
  version: 1,
  level: 2,
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  warmupMs: 2000,
  phaseDurationMs: 1600,
  pointerOffsets: [[0, 0], [3, 0], [3, 3], [0, 3], [-3, 3], [-3, 0],
    [-3, -3], [0, -3], [3, -3], [3, 0], [0, 0], [-3, 0]],
  pointerIntervalMs: 120,
  cameraInputs: [{ offsetMs: 0, key: 'ArrowRight', action: 'down' },
    { offsetMs: 600, key: 'ArrowRight', action: 'up' },
    { offsetMs: 600, key: 'w', action: 'down' },
    { offsetMs: 1200, key: 'w', action: 'up' }],
  phases: [
    { name: 'world-hover', route: 'world', moving: true, nativeWork: true },
    { name: 'camera-world', route: 'world', camera: true },
    { name: 'hud', route: 'hud' },
    { name: 'world-recovery', route: 'world', moving: true },
    { name: 'menu-recovery', route: 'world', moving: true },
  ],
}

export const gameplayFrameLimits = [
  'Authored Level 2 via public All missions, not earned campaign progression.',
  'Actual production Home/store/scene with natural RAF and public inputs, served by plain Vite; not Vinext/Cloudflare/RSC hosting.',
  'Hosted renderer/CPU wall-time diagnostics are not Mac GPU timings, presented FPS, or hardware smoothness acceptance.',
  'Input sequence, viewport and requested durations are fixed; actual durations, turns and work counts vary. Match build, environment, phase and observed workload before comparing builds.',
  'F8 is enabled for every measured phase. Instrumentation cost is present; nested timing buckets overlap and must not be added.',
  'Phase boundaries are independent performance.now observations. Only complete RAF intervals inside each phase enter its summary; raw downloads are unchanged.',
]

function assertLive(state) {
  assert.equal(state.level, 2, 'authored Level 2 required')
  assert.equal(state.sameScene, true, 'live scene/store identity required')
  assert.equal(state.paused, false, 'gameplay must be unpaused')
  assert.equal(state.inputMask, 0, 'startup input lock must have cleared')
  assert.equal(state.speed, 1, 'normal game speed required')
  assert.equal(state.visibility, 'visible')
  assert.deepEqual(state.viewport, gameplayFramePlan.viewport)
}

// The production parsers validate actual downloaded bytes. Labels and observations
// stay in a sidecar; neither test-only fields nor synthetic samples enter raw JSON.
export function summarizeGameplayPhase(json, phase, before, after, expectedRevision) {
  const analysis = analyzeFrameExport(json)
  const raw = JSON.parse(json)
  assert.equal(raw.buildRevision, expectedRevision, 'download must identify the actual build')
  assert.equal(raw.session.level, 2)
  assert.deepEqual(raw.environment.viewportCssPixels, gameplayFramePlan.viewport)
  assert.equal(raw.environment.devicePixelRatio, 1)
  assert.equal(raw.environment.visibility, 'visible')
  assertLive(before); assertLive(after)
  assert.ok(Number.isFinite(before.timestampMs) && Number.isFinite(after.timestampMs))
  const observedDurationMs = after.timestampMs - before.timestampMs
  assert.ok(observedDurationMs >= gameplayFramePlan.phaseDurationMs,
    'complete requested phase duration required')
  assert.equal(raw.timing.timeOriginUnixMs, before.timeOriginUnixMs)
  assert.equal(after.timeOriginUnixMs, before.timeOriginUnixMs)
  assert.ok(Number.isSafeInteger(before.turn) && Number.isSafeInteger(after.turn) && after.turn > before.turn,
    'simulation turns must actually advance during every measured phase')
  assert.ok(raw.frames.length < 1200, 'phase must not silently overwrite its frame ring')
  const indices = raw.frames.flatMap((frame, index) =>
    frame.timestampMs - frame.rafIntervalMs >= before.timestampMs && frame.timestampMs <= after.timestampMs ? [index] : [])
  const frames = indices.map(index => raw.frames[index])
  assert.ok(frames.length >= 8, 'at least eight complete in-phase rendered frames required')
  const coveredSpanMs = frames.at(-1).timestampMs - (frames[0].timestampMs - frames[0].rafIntervalMs)
  assert.ok(coveredSpanMs >= observedDurationMs * 0.75,
    'capture must cover at least 75% of the phase, not only a short surviving tail')
  assert.ok(frames.every(frame => frame.state === 'live'), 'menu/paused/unknown samples cannot pass gameplay')
  assert.ok(frames.every(frame => frame.sceneDrawCalls > 0), 'every sampled gameplay frame must draw')
  const routed = frames.filter(frame => frame.pointerBreakdown?.interaction?.route === phase.route)
  assert.ok(routed.length >= 8, `actual ${phase.route} pointer route required`)
  assert.ok(routed.length / frames.length >= 0.8, 'expected pointer route must cover at least 80% of the phase')
  const sum = read => frames.reduce((total, frame) => total + (read(frame.pointerBreakdown) ?? 0), 0)
  const work = {
    terrainPickCalls: sum(p => p?.terrainPickCalls), objectPickCalls: sum(p => p?.objectPickCalls),
    nativeTriangles: sum(p => p?.nativeOcclusion?.submittedTriangles),
    ordinaryTriangles: sum(p => p?.ordinaryTerrain?.visitedTriangles),
    modelFacesVisited: sum(p => p?.modelWork?.[1]),
    worldFrames: frames.filter(f => f.pointerBreakdown?.interaction?.route === 'world').length,
    hudFrames: frames.filter(f => f.pointerBreakdown?.interaction?.route === 'hud').length,
    movingFrames: frames.filter(f => f.pointerBreakdown?.interaction?.pointerMoved === true).length,
    cameraChangedFrames: frames.filter(f => f.pointerBreakdown?.interaction?.viewChanged === true).length,
  }
  if (phase.route === 'world') {
    assert.ok(work.terrainPickCalls > 0 && work.objectPickCalls > 0, 'actual terrain and object queries required')
    assert.ok(work.ordinaryTriangles > 0, 'actual terrain triangle work required')
  }
  if (phase.moving) assert.ok(work.movingFrames > 0, 'moving-pointer frames required')
  if (phase.nativeWork) assert.ok(work.nativeTriangles > 0, 'rendered-person native occlusion work required')
  if (phase.camera) {
    assert.ok(work.cameraChangedFrames > 0, 'camera changes must be recorded')
    assert.notEqual(after.camera.angle, before.camera.angle, 'public rotation must change camera')
    assert.notDeepEqual([after.camera.x, after.camera.y], [before.camera.x, before.camera.y], 'public pan must change camera')
  }
  const first = frames[0], last = frames.at(-1)
  const start = first.timestampMs - first.rafIntervalMs
  // A derived in-memory selection uses the same schema solely for parser reuse.
  // The saved raw file remains the exact browser download, including boundary frames.
  const scoped = JSON.stringify({ ...raw, frames, timing: { ...raw.timing, count: frames.length,
    startTimestampMs: start, endTimestampMs: last.timestampMs, capturedSpanMs: last.timestampMs - start } })
  return {
    schema: 'populous-new-dawn/gameplay-frame-phase', schemaVersion: 1,
    phase: phase.name, rawSha256: createHash('sha256').update(json).digest('hex'),
    boundary: { before, after }, requestedDurationMs: gameplayFramePlan.phaseDurationMs,
    observedDurationMs, coveredSpanMs, turnsAdvanced: after.turn - before.turn,
    rawFrameCount: raw.frames.length, selectedRawFrameIndices: indices, work,
    rawAnalysis: analysis, analysis: analyzeFrameExport(scoped), cohorts: summarizeFrameExportCohorts(scoped),
    limits: gameplayFrameLimits,
  }
}
