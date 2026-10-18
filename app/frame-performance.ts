import {
  ORDINARY_TERRAIN_FIELDS,
  TERRAIN_VISIBILITY_FIELDS,
  createTerrainVisibilityMetrics,
  createOrdinaryTerrainMetrics,
} from './ordinary-terrain-metrics.ts'
import {
  NATIVE_OCCLUSION_FIELDS,
  createNativeOcclusionMetrics,
} from './native-occlusion-metrics.ts'
import { createPointerFrameMetrics, type PointerFrameMetrics } from './pointer-frame-metrics.ts'

export const RECENT_FRAME_CAPACITY = 1200
const POINTER_FIELDS = [
  'terrainPickMs',
  'terrainPickCalls',
  'objectPickMs',
  'objectPickCalls',
  'objectUnitsMs',
  'objectModelsMs',
  'objectOcclusionMs',
  'objectCacheHits',
  'tooltipInputMs',
  'tooltipRenderMs',
] as const
const NATIVE_OFFSET = 9 + POINTER_FIELDS.length
const ORDINARY_OFFSET = NATIVE_OFFSET + 1 + NATIVE_OCCLUSION_FIELDS.length
const VISIBILITY_OFFSET = ORDINARY_OFFSET + 1 + ORDINARY_TERRAIN_FIELDS.length
const RAW_WIDTH = VISIBILITY_OFFSET + 1 + TERRAIN_VISIBILITY_FIELDS.length

export interface RecentFrame {
  timestampMs: number
  rafIntervalMs: number
  simulationCpuMs: number
  sceneRenderCpuMs: number
  sceneDrawCalls: number
  callbackCpuMs: number
  pointerTooltipCpuMs: number
  otherCallbackCpuMs: number
  pointerBreakdown: PointerFrameMetrics | null
  state: 'live' | 'paused' | 'menu' | 'unknown'
}

// Browser presentation telemetry only. Never feeds the simulation clock.
export class FramePerformance {
  private readonly recent = new Float64Array(RECENT_FRAME_CAPACITY * RAW_WIDTH)
  private recentCursor = 0
  private recentCount = 0
  private timestamp = 0
  readonly history = new Float64Array(240)
  readonly callbackHistory = new Float64Array(240)
  readonly pointerHistory = new Float64Array(240)
  private readonly sorted = new Float64Array(240)
  readonly rafPercentiles = { p50: 0, p95: 0, p99: 0, max: 0 }
  readonly callbackPercentiles = { p50: 0, p95: 0, p99: 0, max: 0 }
  readonly pointerPercentiles = { p50: 0, p95: 0, p99: 0, max: 0 }
  pointer = 0
  pointerMs = 0
  otherMs = 0
  count = 0
  cursor = 0
  elapsed = 0
  frames = 0
  simulation = 0
  callback = 0
  render = 0
  calls = 0
  fps = 0
  frameMs = 0
  simulationMs = 0
  callbackMs = 0
  renderMs = 0
  drawCalls = 0

  reset() {
    this.recentCursor = 0
    this.recentCount = 0
    this.timestamp = 0
    this.pointer = 0
    this.pointerMs = 0
    this.otherMs = 0
    for (const summary of [
      this.rafPercentiles,
      this.callbackPercentiles,
      this.pointerPercentiles,
    ]) {
      summary.p50 = 0
      summary.p95 = 0
      summary.p99 = 0
      summary.max = 0
    }
    this.count = 0
    this.cursor = 0
    this.elapsed = 0
    this.frames = 0
    this.simulation = 0
    this.callback = 0
    this.render = 0
    this.calls = 0
    this.fps = 0
    this.frameMs = 0
    this.simulationMs = 0
    this.callbackMs = 0
    this.renderMs = 0
    this.drawCalls = 0
  }

  sample(
    milliseconds: number,
    simulation: number,
    render: number,
    calls: number,
    callback: number,
    pointer = 0,
    timestamp = this.timestamp + milliseconds,
    state: RecentFrame['state'] = 'unknown',
    metrics?: PointerFrameMetrics
  ) {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return false
    // Reject invalid measurements as a whole, without poisoning either window.
    if (
      !Number.isFinite(simulation) ||
      simulation < 0 ||
      !Number.isFinite(render) ||
      render < 0 ||
      !Number.isFinite(calls) ||
      calls < 0 ||
      !Number.isFinite(callback) ||
      callback < 0 ||
      !Number.isFinite(pointer) ||
      pointer < 0 ||
      !Number.isFinite(timestamp) ||
      timestamp < 0
    )
      return false
    if (metrics)
      for (const key of POINTER_FIELDS)
        if (!Number.isFinite(metrics[key]) || metrics[key] < 0) return false
    const native = metrics?.nativeOcclusion
    if (native !== undefined) {
      if (!native || native.version !== 1) return false
      for (const key of NATIVE_OCCLUSION_FIELDS)
        if (
          !Number.isFinite(native[key]) ||
          native[key] < 0 ||
          (!key.endsWith('Ms') && !Number.isSafeInteger(native[key]))
        )
          return false
    }
    const ordinary = metrics?.ordinaryTerrain
    if (ordinary !== undefined) {
      if (!ordinary || ordinary.version !== 1) return false
      for (const key of ORDINARY_TERRAIN_FIELDS)
        if (
          !Number.isFinite(ordinary[key]) ||
          ordinary[key] < 0 ||
          (!key.endsWith('Ms') && !Number.isSafeInteger(ordinary[key]))
        )
          return false
    }
    const visibility = ordinary?.visibility
    if (visibility !== undefined) {
      if (!visibility) return false
      for (const key of TERRAIN_VISIBILITY_FIELDS)
        if (!Number.isSafeInteger(visibility[key]) || visibility[key] < 0) return false
    }
    this.timestamp = timestamp
    const offset = this.recentCursor * RAW_WIDTH
    this.recent[offset] = timestamp
    this.recent[offset + 1] = milliseconds
    this.recent[offset + 2] = simulation
    this.recent[offset + 3] = render
    this.recent[offset + 4] = calls
    this.recent[offset + 5] = callback
    this.recent[offset + 6] = pointer
    this.recent[offset + 7] =
      state === 'live' ? 1 : state === 'paused' ? 2 : state === 'menu' ? 3 : 0
    this.recent[offset + 8] = metrics ? 1 : 0
    for (let i = 0; i < POINTER_FIELDS.length; i++)
      this.recent[offset + 9 + i] = metrics?.[POINTER_FIELDS[i]] ?? 0
    this.recent[offset + NATIVE_OFFSET] = native ? 1 : 0
    for (let i = 0; i < NATIVE_OCCLUSION_FIELDS.length; i++)
      this.recent[offset + NATIVE_OFFSET + 1 + i] = native?.[NATIVE_OCCLUSION_FIELDS[i]] ?? 0
    this.recent[offset + ORDINARY_OFFSET] = ordinary ? 1 : 0
    for (let i = 0; i < ORDINARY_TERRAIN_FIELDS.length; i++)
      this.recent[offset + ORDINARY_OFFSET + 1 + i] = ordinary?.[ORDINARY_TERRAIN_FIELDS[i]] ?? 0
    this.recent[offset + VISIBILITY_OFFSET] = visibility ? 1 : 0
    for (let i = 0; i < TERRAIN_VISIBILITY_FIELDS.length; i++)
      this.recent[offset + VISIBILITY_OFFSET + 1 + i] =
        visibility?.[TERRAIN_VISIBILITY_FIELDS[i]] ?? 0
    this.recentCursor = (this.recentCursor + 1) % RECENT_FRAME_CAPACITY
    this.recentCount = Math.min(this.recentCount + 1, RECENT_FRAME_CAPACITY)
    this.callbackHistory[this.cursor] = callback
    this.pointerHistory[this.cursor] = pointer
    this.history[this.cursor] = milliseconds
    this.cursor = (this.cursor + 1) % this.history.length
    this.count = Math.min(this.count + 1, this.history.length)
    this.elapsed += milliseconds
    this.frames++
    this.pointer += pointer
    this.simulation += simulation
    this.callback += callback
    this.render += render
    this.calls += calls
    if (this.elapsed < 250) return false
    this.fps = (this.frames * 1000) / this.elapsed
    this.frameMs = this.elapsed / this.frames
    this.simulationMs = this.simulation / this.frames
    this.callbackMs = this.callback / this.frames
    this.renderMs = this.render / this.frames
    this.drawCalls = this.calls / this.frames
    this.pointerMs = this.pointer / this.frames
    // Keep signed remainder: a negative value exposes invalid timing ownership.
    this.otherMs = this.callbackMs - this.simulationMs - this.renderMs - this.pointerMs
    this.summarize(this.history, this.rafPercentiles)
    this.summarize(this.callbackHistory, this.callbackPercentiles)
    this.summarize(this.pointerHistory, this.pointerPercentiles)
    this.pointer = 0
    this.elapsed = 0
    this.frames = 0
    this.simulation = 0
    this.callback = 0
    this.render = 0
    this.calls = 0
    return true
  }

  // Materialize only on explicit export. Sampling writes fixed numeric storage.
  recentFrames(): RecentFrame[] {
    return Array.from({ length: this.recentCount }, (_, index) => {
      const offset =
        ((this.recentCursor - this.recentCount + index + RECENT_FRAME_CAPACITY) %
          RECENT_FRAME_CAPACITY) *
        RAW_WIDTH
      const [
        timestampMs,
        rafIntervalMs,
        simulationCpuMs,
        sceneRenderCpuMs,
        sceneDrawCalls,
        callbackCpuMs,
        pointerTooltipCpuMs,
        state,
      ] = this.recent.subarray(offset, offset + RAW_WIDTH)
      const pointerBreakdown = this.recent[offset + 8] ? createPointerFrameMetrics() : null
      if (pointerBreakdown)
        for (let i = 0; i < POINTER_FIELDS.length; i++)
          pointerBreakdown[POINTER_FIELDS[i]] = this.recent[offset + 9 + i]
      if (pointerBreakdown && this.recent[offset + NATIVE_OFFSET]) {
        const native = createNativeOcclusionMetrics()
        for (let i = 0; i < NATIVE_OCCLUSION_FIELDS.length; i++)
          native[NATIVE_OCCLUSION_FIELDS[i]] = this.recent[offset + NATIVE_OFFSET + 1 + i]
        pointerBreakdown.nativeOcclusion = native
      }
      if (pointerBreakdown && this.recent[offset + ORDINARY_OFFSET]) {
        const ordinary = createOrdinaryTerrainMetrics()
        for (let i = 0; i < ORDINARY_TERRAIN_FIELDS.length; i++)
          ordinary[ORDINARY_TERRAIN_FIELDS[i]] = this.recent[offset + ORDINARY_OFFSET + 1 + i]
        if (this.recent[offset + VISIBILITY_OFFSET]) {
          const visibility = createTerrainVisibilityMetrics()
          for (let i = 0; i < TERRAIN_VISIBILITY_FIELDS.length; i++)
            visibility[TERRAIN_VISIBILITY_FIELDS[i]] =
              this.recent[offset + VISIBILITY_OFFSET + 1 + i]
          ordinary.visibility = visibility
        }
        pointerBreakdown.ordinaryTerrain = ordinary
      }
      return {
        pointerBreakdown,
        timestampMs,
        rafIntervalMs,
        simulationCpuMs,
        sceneRenderCpuMs,
        sceneDrawCalls,
        callbackCpuMs,
        pointerTooltipCpuMs,
        otherCallbackCpuMs:
          callbackCpuMs - simulationCpuMs - sceneRenderCpuMs - pointerTooltipCpuMs,
        state: state === 1 ? 'live' : state === 2 ? 'paused' : state === 3 ? 'menu' : 'unknown',
      }
    })
  }

  private summarize(history: Float64Array, result: typeof this.rafPercentiles) {
    // Nearest-rank quantiles over the accepted partial/full ring; fixed scratch storage.
    const sorted = this.sorted.subarray(0, this.count)
    sorted.set(history.subarray(0, this.count))
    sorted.sort()
    result.p50 = sorted[Math.ceil(this.count * 0.5) - 1]
    result.p95 = sorted[Math.ceil(this.count * 0.95) - 1]
    result.p99 = sorted[Math.ceil(this.count * 0.99) - 1]
    result.max = sorted[this.count - 1]
  }

  frame(index: number) {
    return this.history[
      (this.cursor - this.count + index + this.history.length) % this.history.length
    ]
  }
}
