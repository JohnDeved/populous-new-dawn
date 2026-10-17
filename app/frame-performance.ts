export const RECENT_FRAME_CAPACITY = 1200
const RAW_WIDTH = 8

export interface RecentFrame {
  timestampMs: number
  rafIntervalMs: number
  simulationCpuMs: number
  sceneRenderCpuMs: number
  sceneDrawCalls: number
  callbackCpuMs: number
  pointerTooltipCpuMs: number
  otherCallbackCpuMs: number
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
  private readonly sorted = new Float64Array(240)
  readonly rafPercentiles = { p50: 0, p95: 0, p99: 0, max: 0 }
  readonly callbackPercentiles = { p50: 0, p95: 0, p99: 0, max: 0 }
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
    this.recentCursor = this.recentCount = this.timestamp = 0
    this.pointer = this.pointerMs = this.otherMs = 0
    for (const summary of [this.rafPercentiles, this.callbackPercentiles])
      summary.p50 = summary.p95 = summary.p99 = summary.max = 0
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
    state: RecentFrame['state'] = 'unknown'
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
    this.recentCursor = (this.recentCursor + 1) % RECENT_FRAME_CAPACITY
    this.recentCount = Math.min(this.recentCount + 1, RECENT_FRAME_CAPACITY)
    this.callbackHistory[this.cursor] = callback
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
      return {
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
