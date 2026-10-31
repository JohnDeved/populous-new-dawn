import type { SceneUpdateMetrics } from './scene-update-metrics.ts'
import { GpuRenderTimer } from './gpu-render-timer.ts'
import type { GpuFrameSample } from './gpu-frame-timing.ts'
import { boundedFrameExport } from './frame-export-size.ts'
import { FramePerformance, RECENT_FRAME_CAPACITY } from './frame-performance.ts'
import type { PointerFrameMetrics } from './pointer-frame-metrics.ts'
import { readHardwareInfo, readHeapEstimate } from './performance-hardware.ts'

declare const __PND_BUILD_REVISION__: string

function stopGameInput(event: Event) {
  if (!(event instanceof KeyboardEvent && event.key === 'F8')) event.stopPropagation()
}

// FPS is requestAnimationFrame cadence. CPU wall times are not GPU execution time.
export class FpsGraph {
  readonly element = document.createElement('aside')
  readonly samples = new FramePerformance()
  private readonly level: number | null
  private readonly enabledAt = new Date().toISOString()
  private readonly gl: WebGLRenderingContext | WebGL2RenderingContext
  private readonly hardware: ReturnType<typeof readHardwareInfo>
  private exportButton: HTMLButtonElement
  private interactionEpoch: object = {}
  // A lightweight identity for pointer baselines; never retain this graph in metrics.
  get interactionRecording() {
    return this.interactionEpoch
  }
  private cleared = false
  private previous: number | null = null
  private gpuRendering = false
  private disposed = false
  private gpuTimer: GpuRenderTimer | null = null
  private gpuFrame: GpuFrameSample | undefined
  private fields: Record<string, HTMLElement> = {}
  private line: SVGPolylineElement
  private budget: SVGPathElement

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, level?: number) {
    this.gl = gl
    this.level = level !== undefined && Number.isInteger(level) ? level : null
    this.hardware = readHardwareInfo(gl, navigator)
    this.element.className = 'fps-graph'
    this.element.setAttribute(
      'aria-label',
      'Game performance. Toggle with F8 or the battlefield menu.'
    )
    this.element.innerHTML = `<div class="fps-primary"><header><span>Performance</span><button type="button" class="fps-picking-toggle" aria-expanded="false">Picking paths</button><kbd>F8</kbd></header>
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
        <div title="Nearest-rank p95 and maximum pointer/tooltip CPU over the last up to 240 accepted frames, published with the other readouts. Not the short-window mean."><dt>Pointer p95 / peak · ≤240f</dt><dd data-metric="pointer-tail">--</dd></div>
        <div title="Callback minus simulation, scene render and pointer/tooltip stages. Other callback work, not idle time. A negative value signals inconsistent measurement ownership."><dt>Other callback CPU</dt><dd data-metric="other">--</dd></div>
        <div><dt>Scene draw calls / frame</dt><dd data-metric="calls">--</dd></div>
      </dl>
      <section class="fps-picking" aria-label="Picking path details" hidden>
        <div class="fps-caption" data-metric="picking-window">No samples yet</div>
        <dl>
          <div><dt>Numeric instances</dt><dd data-metric="pick-numeric">--</dd></div>
          <div><dt>Packed-vector instances</dt><dd data-metric="pick-packed">--</dd></div>
          <div><dt>Sparse-vector instances</dt><dd data-metric="pick-sparse">--</dd></div>
          <div title="Native-edge cache misses caused only by a packed/sparse representation change, with unchanged position identity and cache key."><dt>Native repr.-only misses</dt><dd data-metric="pick-representation">--</dd></div>
        </dl>
        <p>Ordinary terrain instance paths after culling, not query or vertex counts. Unknown = incomplete sampling.</p>
        <div class="fps-caption" title="Context from the latest accepted sample when readouts publish, not a window average. Change flags compare with the prior recorded pointer sample, which need not have been accepted into the timing window.">Latest accepted sample at publication</div>
        <dl>
          <div title="Recorded pointer/tooltip input route, not a separate hit-test."><dt>Recorded route</dt><dd data-metric="pick-route">--</dd></div>
          <div title="Position changed since the prior recorded pointer sample. Unknown means no comparable pointer baseline."><dt>Pointer changed</dt><dd data-metric="pick-pointer-change">--</dd></div>
          <div title="View invalidation inputs changed since the prior recorded pointer sample, including camera and viewport inputs; not camera motion alone. Unknown means a new recording baseline."><dt>View inputs changed</dt><dd data-metric="pick-view-change">--</dd></div>
        </dl>
      </section>
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
      <p>RAF cadence, not presented FPS. Means: ≥250 ms windows.<br>CPU stages sum to inclusive callback.<br>CPU excludes overlay/GPU. Async GPU: export only.</p>
      <button type="button" class="fps-export">Export recent frames</button>
      <div class="fps-caption">Up to 1,200 frames · local JSON only</div>
      <div class="fps-caption" data-metric="export-status" role="status"></div></div>`
    for (const field of this.element.querySelectorAll<HTMLElement>('[data-metric]'))
      this.fields[field.dataset.metric!] = field
    this.exportButton = this.element.querySelector<HTMLButtonElement>('.fps-export')!
    const pickingToggle = this.element.querySelector<HTMLButtonElement>('.fps-picking-toggle')!
    const pickingDetails = this.element.querySelector<HTMLElement>('.fps-picking')!
    pickingToggle.addEventListener('click', () => {
      pickingDetails.hidden = !pickingDetails.hidden
      pickingToggle.setAttribute('aria-expanded', String(!pickingDetails.hidden))
      this.element.tabIndex = pickingDetails.hidden ? -1 : 0
      this.element.scrollTop = 0
    })
    // Collapsed readouts stay click-through. Expanded readouts can scroll, so
    // isolate their input too while retaining native scrolling and activation.
    for (const type of [
      'click',
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
    ]) {
      for (const button of [this.exportButton, pickingToggle])
        button.addEventListener(type, stopGameInput)
      this.element.addEventListener(type, event => {
        if (!pickingDetails.hidden) stopGameInput(event)
      })
    }
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

  renderGpu(draw: () => void) {
    if (this.disposed || this.gpuRendering) return draw()
    this.gpuRendering = true
    try {
      this.gpuTimer?.poll()
      const token = this.samples.reserveGpuFrame()
      this.gpuFrame = { token, timing: { status: 'pending' } }
      if (!('createQuery' in this.gl)) {
        this.gpuFrame.timing = { status: 'unsupported' }
        return draw()
      }
      if (!this.gpuTimer) {
        const generation = token.generation
        this.gpuTimer = new GpuRenderTimer(
          this.gl as WebGL2RenderingContext,
          result => {
            const origin = { generation, serial: result.frame }
            const timing = {
              status: result.status,
              ...(result.milliseconds === undefined ? {} : { milliseconds: result.milliseconds }),
            }
            if (
              this.gpuFrame?.token.generation === generation &&
              this.gpuFrame.token.serial === result.frame
            )
              this.gpuFrame.timing = timing
            else this.samples.completeGpuFrame(origin, timing)
          },
          serial =>
            (this.gpuFrame?.token.generation === generation &&
              this.gpuFrame.token.serial === serial) ||
            this.samples.acceptsGpuFrame({ generation, serial })
        )
      }
      return this.gpuTimer.render(token.serial, draw)
    } catch (error) {
      this.gpuFrame = undefined
      throw error
    } finally {
      this.gpuRendering = false
    }
  }

  dispose() {
    this.disposed = true
    this.gpuFrame = undefined
    this.gpuTimer?.dispose()
    this.gpuTimer = null
    this.samples.reset()
    this.element.remove()
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
      session: { level: this.level },
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
        'Optional sceneUpdateCpu terrain/water/HUD timings are disjoint subsets of otherCallbackCpuMs, not extra callback costs. The remainder is unclassified.',
        'Optional sceneRenderGpu is asynchronous elapsed GPU render work attributed to its originating frame; pending/unsupported/disjoint/lost/busy/failed are unknown, never zero. It is not added to CPU buckets.',
        'Callback includes all CPU stages; other is a signed remainder. Overlay and export work are excluded.',
        'Pointer breakdown phases overlap: tooltipInput includes nested picks; objectPick includes units/models/occlusion; tooltipRender is outside pointerTooltip CPU. Do not sum them.',
        'Browser layout flushes execute in the phase that reads layout, which may differ from the phase that dirtied it.',
        'Capture resets on focus loss, hidden tab or F8 disable. No account, URL, save or world contents are included.',
      ],
      frames,
    }
    let url: string | undefined
    try {
      // Keep the actual download within the offline parser's bounded input budget.
      // Pretty printing adds substantial overhead to a full diagnostic ring.
      const bounded = boundedFrameExport(report)
      url = URL.createObjectURL(bounded.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `populous-frames-${report.exportedAt.replace(/[:.]/g, '-')}.json`
      link.click()
      this.text(
        'export-status',
        `Exported ${bounded.frameCount} frames · ${(bounded.capturedSpanMs / 1000).toFixed(1)} s` +
          (bounded.droppedOldestFrames
            ? ` · omitted ${bounded.droppedOldestFrames} oldest of ${frames.length} frames to fit 2 MiB`
            : '')
      )
    } catch {
      this.text(
        'export-status',
        'Export failed: capture could not fit the size limit or download failed.'
      )
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
    this.gpuFrame = undefined
    this.gpuTimer?.dispose()
    this.gpuTimer = null
    if (this.cleared) {
      this.text('state', state)
      return
    }
    this.cleared = true
    this.interactionEpoch = {}
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
      'pointer-tail',
      'other',
      'raf-tail',
      'cpu-tail',
      'cpu-peak',
      'heap',
      'pick-numeric',
      'pick-packed',
      'pick-sparse',
      'pick-representation',
      'pick-route',
      'pick-pointer-change',
      'pick-view-change',
    ])
      this.text(name, '--')
    this.text('state', state)
    this.text('export-status', '')
    this.text('window', '0 samples')
    this.text('picking-window', 'No samples yet')
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
    pointer = 0,
    metrics?: PointerFrameMetrics,
    waterUpdateReasons?: number,
    simulationSteps?: number,
    sceneUpdates?: SceneUpdateMetrics
  ) {
    if (this.disposed) return
    const gpu = this.gpuFrame
    this.gpuFrame = undefined
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
              : 'unknown',
        metrics,
        waterUpdateReasons,
        simulationSteps,
        gpu,
        sceneUpdates
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
    const { picking } = samples
    this.text(
      'picking-window',
      `Means/frame · ${picking.frames} frames / ${picking.milliseconds.toFixed(0)} ms`
    )
    for (const [name, value] of [
      ['pick-numeric', picking.numeric],
      ['pick-packed', picking.packedVector],
      ['pick-sparse', picking.sparseVector],
      ['pick-representation', picking.representationChanged],
    ] as const)
      this.text(name, value === null ? 'Unknown' : value.toFixed(2))
    const interaction = metrics?.interaction
    const route = interaction?.route
    this.text(
      'pick-route',
      route === 'world'
        ? 'World'
        : route === 'hud'
          ? 'HUD'
          : route === 'outside'
            ? 'Outside'
            : 'Unknown'
    )
    for (const [name, value] of [
      ['pick-pointer-change', interaction?.pointerMoved],
      ['pick-view-change', interaction?.viewChanged],
    ] as const)
      this.text(name, value === true ? 'Yes' : value === false ? 'No' : 'Unknown')
    this.text('pointer', `${samples.pointerMs.toFixed(2)} ms`)
    this.text(
      'pointer-tail',
      `${samples.pointerPercentiles.p95.toFixed(1)} / ${samples.pointerPercentiles.max.toFixed(1)} ms`
    )
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
