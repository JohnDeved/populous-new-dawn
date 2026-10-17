import { FramePerformance, RECENT_FRAME_CAPACITY } from './frame-performance.ts'
import { readHardwareInfo, readHeapEstimate } from './performance-hardware.ts'

declare const __PND_BUILD_REVISION__: string

// FPS is requestAnimationFrame cadence. CPU wall times are not GPU execution time.
export class FpsGraph {
  readonly element = document.createElement('aside')
  readonly samples = new FramePerformance()
  private readonly enabledAt = new Date().toISOString()
  private readonly gl: WebGLRenderingContext | WebGL2RenderingContext
  private readonly hardware: ReturnType<typeof readHardwareInfo>
  private exportButton: HTMLButtonElement
  private cleared = false
  private previous: number | null = null
  private fields: Record<string, HTMLElement> = {}
  private line: SVGPolylineElement
  private budget: SVGPathElement

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl
    this.hardware = readHardwareInfo(gl, navigator)
    this.element.className = 'fps-graph'
    this.element.setAttribute(
      'aria-label',
      'Game performance. Toggle with F8 or the battlefield menu.'
    )
    this.element.innerHTML = `<div class="fps-primary"><header><span>Performance</span><kbd>F8</kbd></header>
      <div class="fps-reading"><strong data-metric="fps">--</strong><span>RAF/s</span><small data-metric="state">Warming up</small></div>
      <div class="fps-caption"><span>RAF interval</span><span data-metric="scale">ms</span></div>
      <svg viewBox="0 0 240 60" aria-hidden="true"><path class="fps-grid" d="M0 1H240M0 30H240M0 59H240"/><path class="fps-budget"/><polyline fill="none"/></svg>
      <div class="fps-caption"><span>Last 240 frames</span><span>120 FPS: 8.33 ms</span></div>
      <dl>
        <div><dt>RAF interval mean</dt><dd data-metric="frame">--</dd></div>
        <div><dt>Peak · recent frames</dt><dd data-metric="peak">--</dd></div>
        <div title="Synchronous game callback including terrain, entities, camera, HUD and scheduling. Excludes this overlay update, deferred browser work and GPU execution. Simulation and scene render are included, not additional costs."><dt>Callback CPU · inclusive</dt><dd data-metric="callback">--</dd></div>
        <div><dt>Simulation CPU</dt><dd data-metric="simulation">--</dd></div>
        <div><dt>Scene render CPU</dt><dd data-metric="render">--</dd></div>
        <div title="updatePointerFrame only: pointer targeting, spell halo and tooltip publishing, including their nested picks. Other HUD and event-handler picking is not included."><dt>Pointer + tooltip CPU</dt><dd data-metric="pointer">--</dd></div>
        <div title="Callback minus simulation, scene render and pointer/tooltip stages. Other callback work, not idle time. A negative value signals inconsistent measurement ownership."><dt>Other callback CPU</dt><dd data-metric="other">--</dd></div>
        <div><dt>Scene draw calls / frame</dt><dd data-metric="calls">--</dd></div>
      </dl>
      </div><div class="fps-secondary">
      <div class="fps-caption"><span>Rolling window</span><span data-metric="window">0 samples</span></div>
      <div class="fps-caption"><span>p50 / p95 / p99 · ms</span></div>
      <dl title="Nearest-rank percentiles of the last up to 240 accepted samples, not the shorter mean publication window. All durations in milliseconds.">
        <div><dt>RAF</dt><dd data-metric="raf-tail">--</dd></div>
        <div><dt>Callback</dt><dd data-metric="cpu-tail">--</dd></div>
        <div><dt>Callback CPU peak</dt><dd data-metric="cpu-peak">--</dd></div>
      </dl>
      <div class="fps-hardware">
        <div class="fps-renderer" data-metric="renderer"></div>
        <dl>
          <div><dt>Logical cores · reported</dt><dd data-metric="cores"></dd></div>
          <div><dt>Device RAM · coarse</dt><dd data-metric="memory"></dd></div>
          <div><dt>JS heap · estimate</dt><dd data-metric="heap">Unavailable</dd></div>
        </dl>
      </div>
      <p>RAF cadence, not presented FPS. Means: ≥250 ms windows.<br>CPU stages sum to inclusive callback.<br>Synchronous CPU excludes overlay; GPU not measured.</p>
      <button type="button" class="fps-export">Export recent frames</button>
      <div class="fps-caption">Up to 1,200 frames · local JSON only</div>
      <div class="fps-caption" data-metric="export-status" role="status"></div></div>`
    for (const field of this.element.querySelectorAll<HTMLElement>('[data-metric]'))
      this.fields[field.dataset.metric!] = field
    this.exportButton = this.element.querySelector<HTMLButtonElement>('.fps-export')!
    // Only the button intercepts input; the graph remains click-through. Keep
    // Enter/Space activation native, but never let input bubble into gameplay.
    for (const type of [
      'pointerdown',
      'pointerup',
      'pointermove',
      'mousedown',
      'mouseup',
      'dblclick',
      'contextmenu',
      'wheel',
      'keydown',
      'keyup',
    ])
      this.exportButton.addEventListener(type, event => {
        if (!(event instanceof KeyboardEvent && event.key === 'F8')) event.stopPropagation()
      })
    this.exportButton.addEventListener('click', event => {
      event.stopPropagation()
      this.exportRecentFrames()
    })
    const hardware = this.hardware
    this.text('renderer', `GPU / renderer: ${hardware.renderer}`)
    this.fields.renderer.title = `Browser-reported renderer: ${hardware.renderer}`
    this.text('cores', hardware.cores)
    this.text('memory', hardware.memory)
    this.fields.cores.title =
      'Logical processor count exposed by the browser; may be reduced for privacy.'
    this.fields.memory.title = 'Rounded and clamped device-memory hint, not available RAM or usage.'
    this.fields.heap.title =
      'Optional Chromium JS-heap estimate; may include shared heaps and exclude workers. Not total memory usage.'
    this.line = this.element.querySelector('polyline')!
    this.budget = this.element.querySelector('.fps-budget')!
  }

  exportRecentFrames() {
    const frames = this.samples.recentFrames()
    if (!frames.length) {
      this.text('export-status', 'No frames yet. Keep F8 open during play, then export.')
      return
    }
    const first = frames[0],
      last = frames[frames.length - 1]
    const report = {
      schema: 'populous-new-dawn/frame-performance',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      buildRevision:
        typeof __PND_BUILD_REVISION__ === 'string' ? __PND_BUILD_REVISION__ : 'unknown',
      units: {
        durations: 'milliseconds',
        timestamps: 'milliseconds since performance.timeOrigin',
        counters: 'per frame',
      },
      timing: {
        timeOriginUnixMs: performance.timeOrigin,
        enabledAt: this.enabledAt,
        capacityFrames: RECENT_FRAME_CAPACITY,
        count: frames.length,
        startTimestampMs: first.timestampMs - first.rafIntervalMs,
        endTimestampMs: last.timestampMs,
        capturedSpanMs: last.timestampMs - first.timestampMs + first.rafIntervalMs,
      },
      environment: {
        userAgent: navigator.userAgent,
        hardware: this.hardware,
        viewportCssPixels: { width: innerWidth, height: innerHeight },
        devicePixelRatio,
        drawingBufferPixels: {
          width: this.gl.drawingBufferWidth,
          height: this.gl.drawingBufferHeight,
        },
        visibility: document.visibilityState,
      },
      notes: [
        'RAF cadence is not presented FPS. CPU wall times are not GPU timings.',
        'Callback includes all CPU stages; other is a signed remainder. Overlay and export work are excluded.',
        'Capture resets on focus loss, hidden tab or F8 disable. No account, URL, save or world contents are included.',
      ],
      frames,
    }
    let url: string | undefined
    try {
      url = URL.createObjectURL(
        new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      )
      const link = document.createElement('a')
      link.href = url
      link.download = `populous-frames-${report.exportedAt.replace(/[:.]/g, '-')}.json`
      link.click()
      this.text(
        'export-status',
        `Exported ${frames.length} frames · ${(report.timing.capturedSpanMs / 1000).toFixed(1)} s`
      )
    } catch {
      this.text('export-status', 'Export failed. Please try again.')
    } finally {
      if (url) {
        const downloadUrl = url
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      }
    }
  }

  private text(name: string, value: string) {
    if (this.fields[name].textContent !== value) this.fields[name].textContent = value
  }

  reset(state = 'Warming up') {
    if (this.cleared) {
      this.text('state', state)
      return
    }
    this.cleared = true
    this.previous = null
    this.samples.reset()
    for (const name of [
      'fps',
      'frame',
      'peak',
      'simulation',
      'render',
      'calls',
      'callback',
      'pointer',
      'other',
      'raf-tail',
      'cpu-tail',
      'cpu-peak',
    ])
      this.text(name, '--')
    this.text('state', state)
    this.text('window', '0 samples')
    this.text('scale', 'ms')
    this.line.setAttribute('points', '')
    this.budget.setAttribute('d', '')
  }

  update(
    now: number,
    simulation: number,
    render: number,
    calls: number,
    state: string,
    callback: number,
    pointer = 0
  ) {
    this.cleared = false
    const { previous } = this
    this.previous = now
    if (previous === null) {
      this.text('state', `${state} · warming up`)
      return
    }
    if (
      !this.samples.sample(
        now - previous,
        simulation,
        render,
        calls,
        callback,
        pointer,
        now,
        state === 'Live'
          ? 'live'
          : state.startsWith('Paused')
            ? 'paused'
            : state.startsWith('Menu')
              ? 'menu'
              : 'unknown'
      )
    )
      return
    this.text('state', state)
    const { samples } = this
    let peak = 0
    for (let i = 0; i < samples.count; i++) peak = Math.max(peak, samples.frame(i))
    const ceiling = Math.max(40, Math.ceil(peak / 10) * 10)
    this.text('fps', samples.fps.toFixed(0))
    this.text('frame', `${samples.frameMs.toFixed(1)} ms`)
    this.text('peak', `${peak.toFixed(1)} ms`)
    this.text('callback', `${samples.callbackMs.toFixed(2)} ms`)
    this.text('simulation', `${samples.simulationMs.toFixed(2)} ms`)
    this.text('render', `${samples.renderMs.toFixed(2)} ms`)
    this.text('calls', samples.drawCalls.toFixed(0))
    this.text('pointer', `${samples.pointerMs.toFixed(2)} ms`)
    const other = Number(samples.otherMs.toFixed(2))
    this.text('other', `${other.toFixed(2)} ms${other < 0 ? ' !' : ''}`)
    this.text('window', `${samples.count} / 240 samples`)
    for (const [name, summary] of [
      ['raf-tail', samples.rafPercentiles],
      ['cpu-tail', samples.callbackPercentiles],
    ] as const)
      this.text(
        name,
        `${summary.p50.toFixed(1)} / ${summary.p95.toFixed(1)} / ${summary.p99.toFixed(1)} ms`
      )
    this.text('cpu-peak', `${samples.callbackPercentiles.max.toFixed(1)} ms`)
    this.text(
      'heap',
      readHeapEstimate(performance as Performance & { memory?: { usedJSHeapSize?: number } })
    )
    this.text('scale', `0–${ceiling} ms`)
    let points = ''
    for (let i = 0; i < samples.count; i++)
      points += `${240 - samples.count + i},${(59 - (samples.frame(i) / ceiling) * 58).toFixed(1)} `
    this.line.setAttribute('points', points)
    this.budget.setAttribute('d', `M0 ${59 - (1000 / 120 / ceiling) * 58}H240`)
  }
}
