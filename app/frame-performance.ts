// Browser presentation telemetry only. Never feeds the simulation clock.
export class FramePerformance {
  readonly history = new Float64Array(240)
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
    callback: number
  ) {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return false
    this.history[this.cursor] = milliseconds
    this.cursor = (this.cursor + 1) % this.history.length
    this.count = Math.min(this.count + 1, this.history.length)
    this.elapsed += milliseconds
    this.frames++
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
    this.elapsed = 0
    this.frames = 0
    this.simulation = 0
    this.callback = 0
    this.render = 0
    this.calls = 0
    return true
  }

  frame(index: number) {
    return this.history[
      (this.cursor - this.count + index + this.history.length) % this.history.length
    ]
  }
}
