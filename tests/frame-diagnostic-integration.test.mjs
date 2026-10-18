import test from 'node:test'
import assert from 'node:assert/strict'
import { FramePerformance } from '../app/frame-performance.ts'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { WATER_UPDATE_REASON } from '../app/water-update-reasons.ts'
import { analyzeFrameExport } from '../app/frame-export-analysis.ts'
import { summarizeFrameExportCohorts } from '../app/frame-export-cohorts.ts'

test('water scalar, visibility and context survive ring wrap independently and remain optional', () => {
  const ring = new FramePerformance(), pointer = createPointerFrameMetrics(true)
  for (let i = 1; i <= 1202; i++) {
    pointer.interaction.route = 'world'
    pointer.interaction.pointerMoved = i % 2 === 0
    pointer.interaction.viewChanged = false
    pointer.ordinaryTerrain.visibility.indexReuseCalls = i
    ring.sample(10, 1, 2, 3, 4, 1, i * 10, 'live', pointer,
      i % 2 ? WATER_UPDATE_REASON.turn : undefined)
  }
  const frames = ring.recentFrames()
  assert.equal(frames[0].waterUpdateReasons, WATER_UPDATE_REASON.turn)
  assert.equal(frames[0].pointerBreakdown.ordinaryTerrain.visibility.indexReuseCalls, 3)
  assert.equal(frames.at(-1).waterUpdateReasons, undefined)
  const json = JSON.stringify({
    schema: 'populous-new-dawn/frame-performance', schemaVersion: 1,
    units: { durations: 'milliseconds', timestamps: 'milliseconds since performance.timeOrigin', counters: 'per frame' },
    timing: { timeOriginUnixMs: 100, capacityFrames: 1200, count: 1200,
      startTimestampMs: 20, endTimestampMs: 12020, capturedSpanMs: 12000 }, frames,
  })
  const analysis = analyzeFrameExport(json), cohorts = summarizeFrameExportCohorts(json)
  assert.equal(analysis.sampleCount, 1200)
  for (const name of ['worldPointerMoving', 'worldPointerStationary'])
    assert.equal(cohorts.cohorts.find(group => group.name === name).sampleCount, 600)
  frames[0].waterUpdateReasons = 127
  frames[0].pointerBreakdown.ordinaryTerrain.visibility.indexReuseCalls = 999
  assert.equal(ring.recentFrames()[0].waterUpdateReasons, WATER_UPDATE_REASON.turn)
  assert.equal(ring.recentFrames()[0].pointerBreakdown.ordinaryTerrain.visibility.indexReuseCalls, 3)
  ring.reset()
  ring.sample(10, 1, 2, 3, 4, 1, 12030, 'live')
  assert.equal(ring.recentFrames()[0].waterUpdateReasons, undefined)
  assert.equal(ring.recentFrames()[0].pointerBreakdown, null)
})
