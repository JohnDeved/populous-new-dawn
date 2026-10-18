import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { summarizeFrameExportCohorts } from '../app/frame-export-cohorts.ts'
import { FramePerformance } from '../app/frame-performance.ts'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'

function capture(contexts) {
  const ring = new FramePerformance()
  contexts.forEach((context, i) => {
    const pointer = context === undefined ? undefined : createPointerFrameMetrics(true)
    if (pointer) {
      if (context === null) delete pointer.interaction
      else Object.assign(pointer.interaction, context)
      pointer.ordinaryTerrain.visibility.indexEntriesWritten = i
    }
    ring.sample(10, 1, 2, 3, 10 + i, 4, (i + 1) * 10, 'live', pointer)
  })
  const frames = ring.recentFrames(), start = frames[0].timestampMs - 10, end = frames.at(-1).timestampMs
  return {
    schema: 'populous-new-dawn/frame-performance', schemaVersion: 1,
    units: { durations: 'milliseconds', timestamps: 'milliseconds since performance.timeOrigin', counters: 'per frame' },
    timing: { timeOriginUnixMs: 100, capacityFrames: 1200, count: frames.length, startTimestampMs: start, endTimestampMs: end, capturedSpanMs: end - start }, frames,
  }
}
const summarize = value => summarizeFrameExportCohorts(JSON.stringify(value))
const group = (result, name) => result.cohorts.find(cohort => cohort.name === name)

test('mixed overlapping groups retain unknown changes and independently measured metrics', () => {
  const result = summarize(capture([
    { route: 'world', pointerMoved: true, viewChanged: true },
    { route: 'world', pointerMoved: false, viewChanged: false },
    { route: 'world', pointerMoved: null, viewChanged: null },
    { route: 'hud', pointerMoved: false, viewChanged: true },
    { route: 'outside', pointerMoved: true, viewChanged: false },
    null, undefined,
  ]))
  assert.equal(result.groupsOverlap, true)
  for (const [name, count] of Object.entries({ all: 7, worldPointerMoving: 1, worldPointerStationary: 1,
    worldPointerUnknown: 1, cameraChanged: 2, cameraUnknown: 3, hud: 1, outside: 1, unknown: 3 }))
    assert.equal(group(result, name).sampleCount, count, name)
  assert.equal(group(result, 'all').metrics['pointerBreakdown.ordinaryTerrain.visibility.indexEntriesWritten'].sampleCount, 6)
  assert.deepEqual(group(result, 'cameraChanged').metrics.callbackCpuMs,
    { unit: 'milliseconds', sampleCount: 2, p50: 10, p95: 13, p99: 13, max: 13 })
  assert.ok(result.warnings.some(value => value.includes('causal speedup')))
})

test('old captures never become stationary and empty cohorts have null quantiles', () => {
  const result = summarize(capture([null, undefined]))
  assert.equal(group(result, 'unknown').sampleCount, 2)
  assert.deepEqual(group(result, 'worldPointerStationary').metrics.callbackCpuMs,
    { unit: 'milliseconds', sampleCount: 0, p50: null, p95: null, p99: null, max: null })
  assert.equal(group(result, 'all').metrics['pointerBreakdown.terrainPickMs'].sampleCount, 1)
})

test('existing parser rejects malformed context and empty captures rather than guessing', () => {
  for (const bad of [null, {}, { version: 2 }, { pointerMoved: 'false' }]) {
    const value = capture([{}])
    value.frames[0].pointerBreakdown.interaction = bad
    assert.throws(() => summarize(value), /interaction/)
  }
  const value = capture([{}]); value.frames = []; value.timing.count = 0
  assert.throws(() => summarize(value), /1–1200/)
})

test('actual 1200-frame ring wrap excludes evicted contexts and uses nearest rank p99', () => {
  const result = summarize(capture(Array.from({ length: 1202 }, (_, i) => ({
    route: 'world', pointerMoved: i < 2, viewChanged: false,
  }))))
  assert.equal(result.sampleCount, 1200)
  assert.equal(result.startTimestampMs, 20)
  assert.equal(group(result, 'worldPointerMoving').sampleCount, 0)
  assert.equal(group(result, 'worldPointerStationary').sampleCount, 1200)
  assert.deepEqual(group(result, 'all').metrics.callbackCpuMs,
    { unit: 'milliseconds', sampleCount: 1200, p50: 611, p95: 1151, p99: 1199, max: 1211 })
})

test('CLI emits machine-readable output and rejects invalid/oversized inputs', t => {
  const dir = mkdtempSync(join(tmpdir(), 'frame-cohorts-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const file = join(dir, 'capture.json'), cli = new URL('../scripts/summarize-frame-cohorts.mjs', import.meta.url)
  const run = path => spawnSync(process.execPath, [cli.pathname, path], { encoding: 'utf8' })
  writeFileSync(file, JSON.stringify(capture([null])))
  const good = run(file)
  assert.equal(good.status, 0, good.stderr)
  assert.equal(JSON.parse(good.stdout).schema, 'populous-new-dawn/frame-cohorts')
  writeFileSync(file, '{}'); assert.equal(run(file).status, 1)
  writeFileSync(file, ' '.repeat(2 * 1024 * 1024 + 1)); assert.equal(run(file).status, 1)
  assert.equal(run(dir).status, 1)
})
