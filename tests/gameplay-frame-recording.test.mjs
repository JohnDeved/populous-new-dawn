import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FramePerformance } from '../app/frame-performance.ts'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { gameplayFramePlan as plan, summarizeGameplayPhase } from '../scripts/tutorial-browser/gameplay-frame-evidence.mjs'
import { buildRevision } from '../scripts/tutorial-browser/build-provenance.mjs'

const revision = 'a'.repeat(40)
function fixture(route = 'world') {
  const ring = new FramePerformance()
  for (let i = 0; i < 18; i++) {
    const pointer = createPointerFrameMetrics(true)
    Object.assign(pointer.interaction, { route, pointerMoved: true, viewChanged: true })
    pointer.terrainPickCalls = 1; pointer.objectPickCalls = 1
    pointer.nativeOcclusion.submittedTriangles = 5
    pointer.ordinaryTerrain.visitedTriangles = 7
    // Quantized zero CPU time is valid. Work is established by counters, not timers.
    ring.sample(100, 0, 0, 12, 0, 0, (i + 1) * 100, 'live', pointer)
  }
  const frames = ring.recentFrames()
  const before = { timestampMs: 100, timeOriginUnixMs: 10000, level: 2, turn: 1,
    paused: false, inputMask: 0, speed: 1, sameScene: true, camera: { x: 0, y: 0, angle: 0 },
    viewport: plan.viewport, visibility: 'visible' }
  const after = { ...before, timestampMs: 1700, turn: 40, camera: { x: 1, y: 1, angle: 1 } }
  const raw = { schema: 'populous-new-dawn/frame-performance', schemaVersion: 1, buildRevision: revision,
    units: { durations: 'milliseconds', timestamps: 'milliseconds since performance.timeOrigin', counters: 'per frame' },
    session: { level: 2 }, environment: { viewportCssPixels: plan.viewport, devicePixelRatio: 1, visibility: 'visible' },
    timing: { timeOriginUnixMs: 10000, capacityFrames: 1200, count: frames.length,
      startTimestampMs: 0, endTimestampMs: 1800, capturedSpanMs: 1800 }, frames }
  return { raw, before, after }
}
const summarize = ({ raw, before, after }, phase = plan.phases[0]) =>
  summarizeGameplayPhase(JSON.stringify(raw), phase, before, after, revision)

test('actual-schema parser and overlapping cohorts summarize only complete independent phase intervals', () => {
  const input = fixture(), original = JSON.stringify(input)
  const summary = summarize(input)
  assert.equal(summary.rawFrameCount, 18)
  assert.equal(summary.analysis.sampleCount, 16)
  assert.deepEqual(summary.selectedRawFrameIndices, Array.from({ length: 16 }, (_, i) => i + 1))
  assert.equal(summary.work.nativeTriangles, 80)
  assert.equal(summary.work.ordinaryTriangles, 112)
  assert.equal(summary.analysis.callback.max, 0)
  assert.equal(summary.cohorts.groupsOverlap, true)
  assert.equal(JSON.stringify(input), original, 'raw report and observations remain unchanged')
  assert.match(summary.rawSha256, /^[a-f0-9]{64}$/)
})

test('menu-only, paused, no-tick, zero-query and non-rendered captures fail closed', () => {
  const cases = [
    value => { value.raw.frames.forEach(f => { f.state = 'menu' }) },
    value => { value.raw.frames.forEach(f => { f.state = 'paused' }) },
    value => { value.after.turn = value.before.turn },
    value => { value.after.paused = true },
    value => { value.raw.frames.forEach(f => { f.sceneDrawCalls = 0 }) },
    value => { value.raw.frames.forEach(f => { f.pointerBreakdown.terrainPickCalls = 0 }) },
    value => { value.raw.frames.forEach(f => { f.pointerBreakdown.objectPickCalls = 0 }) },
    value => { value.raw.frames.forEach(f => { f.pointerBreakdown.ordinaryTerrain.visitedTriangles = 0 }) },
    value => { value.raw.frames.forEach(f => { f.pointerBreakdown.nativeOcclusion.submittedTriangles = 0 }) },
    value => { value.raw.frames.forEach(f => { f.pointerBreakdown.interaction.pointerMoved = false }) },
    value => { value.raw.frames.forEach(f => { f.pointerBreakdown = null }) },
  ]
  for (const mutate of cases) { const value = fixture(); mutate(value); assert.throws(() => summarize(value)) }
})

test('wrong build, mission, viewport, DPR, time origin and short phase are rejected', () => {
  const cases = [
    value => { value.raw.buildRevision = 'unknown' },
    value => { value.raw.buildRevision += '-dirty' },
    value => { value.raw.session.level = 1 },
    value => { value.after.level = 1 },
    value => { value.raw.environment.viewportCssPixels = { width: 640, height: 480 } },
    value => { value.raw.environment.devicePixelRatio = 2 },
    value => { value.raw.environment.visibility = 'hidden' },
    value => { value.before.timeOriginUnixMs++ },
    value => { value.after.timestampMs = 200 },
    value => { value.before.sameScene = false },
    value => { value.after.inputMask = 1 },
    value => { value.after.speed = 2 },
  ]
  for (const mutate of cases) { const value = fixture(); mutate(value); assert.throws(() => summarize(value)) }
})

test('HUD must have actual HUD samples and camera must have observed and exported changes', () => {
  assert.equal(summarize(fixture('hud'), plan.phases[2]).work.hudFrames, 16)
  assert.throws(() => summarize(fixture(), plan.phases[2]), /hud pointer route/)
  assert.equal(summarize(fixture(), plan.phases[1]).work.cameraChangedFrames, 16)
  const still = fixture(); still.after.camera = still.before.camera
  assert.throws(() => summarize(still, plan.phases[1]), /rotation/)
  const unobserved = fixture()
  unobserved.raw.frames.forEach(f => { f.pointerBreakdown.interaction.viewChanged = false })
  assert.throws(() => summarize(unobserved, plan.phases[1]), /camera changes/)
})

test('boundary-frame work cannot rescue an empty measured phase or mislabeled route', () => {
  const value = fixture()
  value.raw.frames.slice(1, 17).forEach(f => { f.pointerBreakdown.terrainPickCalls = 0 })
  assert.throws(() => summarize(value), /actual terrain and object queries/)
  const mixed = fixture()
  mixed.raw.frames.slice(1, 6).forEach(f => { f.pointerBreakdown.interaction.route = 'hud' })
  assert.throws(() => summarize(mixed), /80%/)
})

test('a reset leaving a short tail cannot masquerade as the complete scheduled phase', () => {
  const value = fixture()
  value.raw.frames = value.raw.frames.slice(9)
  Object.assign(value.raw.timing, { count: 9, startTimestampMs: 900, capturedSpanMs: 900 })
  assert.throws(() => summarize(value), /75%/)
})

test('a long observed phase rejects a valid but short surviving export tail', () => {
  const value = fixture()
  value.after.timestampMs = value.before.timestampMs + 10000
  value.raw.frames.forEach(frame => { frame.timestampMs += 8200 })
  Object.assign(value.raw.timing, { startTimestampMs: 8200, endTimestampMs: 10000 })
  assert.equal(value.raw.frames.length, 18)
  assert.equal(value.raw.timing.capturedSpanMs, 1800)
  assert.throws(() => summarize(value), /75%/, '18% of observed duration must not pass as a complete phase')
})

test('extended captures pass only when they cover at least 75% of the observed duration', () => {
  const value = fixture()
  value.raw.frames.forEach((frame, index) => {
    frame.rafIntervalMs = 500
    frame.timestampMs = value.before.timestampMs + (index + 1) * 500
  })
  Object.assign(value.raw.timing, { startTimestampMs: 100, endTimestampMs: 9100, capturedSpanMs: 9000 })
  value.after.timestampMs = value.before.timestampMs + 10000
  assert.equal(summarize(value).coveredSpanMs, 9000, '90% of an extended phase remains valid')
  value.after.timestampMs = value.before.timestampMs + 12000
  assert.equal(summarize(value).coveredSpanMs, 9000, 'exactly 75% is accepted')
  value.after.timestampMs += 1
  assert.throws(() => summarize(value), /75%/, 'less than 75% is rejected even with substantial live work')
})

test('build identity is derived from actual Git checkout and preserves dirty state', t => {
  const root = mkdtempSync(join(tmpdir(), 'gameplay-build-provenance-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  git('init'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
  writeFileSync(join(root, 'source.txt'), 'clean')
  git('add', 'source.txt'); git('commit', '-m', 'fixture')
  const clean = git('rev-parse', 'HEAD')
  assert.equal(buildRevision(root), clean)
  writeFileSync(join(root, 'untracked.txt'), 'untracked')
  assert.equal(buildRevision(root), `${clean}-dirty`)
  rmSync(join(root, 'untracked.txt')); writeFileSync(join(root, 'source.txt'), 'changed')
  assert.equal(buildRevision(root), `${clean}-dirty`)
})

test('live recording extends existing ready-only workflow without replacing its other episodes', () => {
  const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
  const workflow = read('.github/workflows/tutorial-browser.yml')
  for (const scenario of ['tutorial', 'pause-checkpoint-recovery', 'profile-recovery', 'gameplay-frames'])
    assert.ok(workflow.includes(`scenario: ${scenario}\n`))
  assert.match(workflow, /types: \[ready_for_review\]/)
  assert.match(workflow, /outputs\/tutorial-browser\/\*\.json/)
  assert.match(workflow, /retention-days: 7/)
  assert.doesNotMatch(workflow, /continue-on-error|workflow_dispatch|no-sandbox/)
  const source = read('scripts/tutorial-browser/gameplay-frames.mjs')
  assert.match(source, /download\.saveAs\(target\)/)
  assert.match(source, /summarizeGameplayPhase\(readFileSync\(target, 'utf8'\)/)
  assert.match(source, /Mission 2/)
  assert.doesNotMatch(source, /advanceGame\(|\.animate\(|cancelAnimationFrame\(|\.exportRecentFrames\(/)
  assert.match(read('scripts/tutorial-browser/build-home.mjs'), /define: \{ __PND_BUILD_REVISION__:/)
})
