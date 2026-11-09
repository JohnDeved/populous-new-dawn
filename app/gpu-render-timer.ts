// Opt-in WebGL2 elapsed queries. Construct only while GPU recording is enabled.
// Results belong to the supplied originating-frame token, never the polling frame.
export interface GpuRenderResult {
  frame: number
  status: 'available' | 'unsupported' | 'disjoint' | 'context-lost' | 'busy' | 'failed'
  milliseconds?: number
}

interface TimerExtension {
  TIME_ELAPSED_EXT: number
  GPU_DISJOINT_EXT: number
}
interface Pending {
  query: WebGLQuery
  frame: number
}
const MAX_PENDING = 8
// GPU_DISJOINT_EXT is context-global/read-to-clear. All timer consumers must
// cooperate with this sole owner; foreign timers cannot safely share the context.
const owners = new WeakMap<WebGL2RenderingContext, GpuRenderTimer>()

export class GpuRenderTimer {
  private extension: TimerExtension | null = null
  private pending: Pending[] = []
  private active: Pending | null = null
  private disposed = false
  private notifying = false
  private readonly ownsContext: boolean
  private lost = false
  private readonly canvas: HTMLCanvasElement | OffscreenCanvas

  private readonly gl: WebGL2RenderingContext
  private readonly publish: (result: GpuRenderResult) => void
  private readonly acceptsFrame: (frame: number) => boolean

  constructor(
    gl: WebGL2RenderingContext,
    publish: (result: GpuRenderResult) => void,
    acceptsFrame: (frame: number) => boolean
  ) {
    this.gl = gl
    this.publish = publish
    this.acceptsFrame = acceptsFrame
    this.canvas = gl.canvas
    this.ownsContext = !owners.has(gl)
    if (!this.ownsContext) return
    owners.set(gl, this)
    this.lost = gl.isContextLost()
    if (!this.lost) this.extension = this.readExtension()
    this.canvas.addEventListener('webglcontextlost', this.contextLost)
    this.canvas.addEventListener('webglcontextrestored', this.contextRestored)
  }

  private readExtension(): TimerExtension | null {
    try {
      return this.gl.getExtension('EXT_disjoint_timer_query_webgl2')
    } catch {
      return null
    }
  }

  private emit(frame: number, status: GpuRenderResult['status'], milliseconds?: number) {
    if (this.notifying || this.disposed) return
    this.notifying = true
    try {
      if (this.acceptsFrame(frame) && !this.disposed)
        this.publish({ frame, status, ...(milliseconds === undefined ? {} : { milliseconds }) })
    } catch {
      // Diagnostic observers must not skip draw or replace its original exception.
    } finally {
      this.notifying = false
    }
  }

  private discard(status: 'context-lost' | 'disjoint') {
    const { pending } = this
    this.pending = []
    const { active } = this
    this.active = null
    if (active) pending.push(active)
    // Complete all GL cleanup before invoking any observer.
    if (status === 'disjoint') for (const item of pending) this.gl.deleteQuery(item.query)
    for (const item of pending) this.emit(item.frame, status)
  }

  private contextLost = () => {
    this.lost = true
    this.extension = null
    // Context loss implicitly destroys queries; detach handles before publication.
    this.discard('context-lost')
  }

  private contextRestored = () => {
    if (this.disposed) return
    this.lost = this.gl.isContextLost()
    if (!this.lost) this.extension = this.readExtension()
  }

  // The sink must reject expired generation/slot tokens via acceptsFrame.
  // Call once on a later animation callback, not in a wait/spin loop.
  poll() {
    if (this.disposed || this.notifying || this.active || !this.extension) return
    const { gl } = this
    if (gl.isContextLost()) {
      this.contextLost()
      return
    }
    if (gl.getParameter(this.extension.GPU_DISJOINT_EXT)) {
      this.discard('disjoint')
      return
    }
    const ready: GpuRenderResult[] = []
    for (let i = 0; i < this.pending.length;) {
      const item = this.pending[i]
      if (!gl.getQueryParameter(item.query, gl.QUERY_RESULT_AVAILABLE)) {
        i++
        continue
      }
      this.pending.splice(i, 1)
      const ns = gl.getQueryParameter(item.query, gl.QUERY_RESULT)
      gl.deleteQuery(item.query)
      ready.push(
        typeof ns === 'number' && Number.isSafeInteger(ns) && ns >= 0
          ? { frame: item.frame, status: 'available', milliseconds: ns / 1e6 }
          : { frame: item.frame, status: 'failed' }
      )
    }
    // No GL calls follow observer callbacks, which can lose/dispose the context.
    for (const result of ready) this.emit(result.frame, result.status, result.milliseconds)
  }

  // Render is invoked exactly once; its exception propagates after ending the query.
  render(frame: number, draw: () => void) {
    if (this.disposed || this.notifying) return draw()
    if (!this.ownsContext) {
      this.emit(frame, 'busy')
      return draw()
    }
    const { gl, extension: ext } = this
    if (gl.isContextLost()) this.contextLost()
    if (this.disposed) return draw()
    if (this.lost || !ext) {
      this.emit(frame, this.lost ? 'context-lost' : 'unsupported')
      return draw()
    }
    // Never interfere with a query owned by another consumer or nested renderer.
    if (
      this.active ||
      this.pending.length >= MAX_PENDING ||
      gl.getQuery(ext.TIME_ELAPSED_EXT, gl.CURRENT_QUERY)
    ) {
      this.emit(frame, 'busy')
      return draw()
    }
    if (gl.getParameter(ext.GPU_DISJOINT_EXT)) {
      this.discard('disjoint')
      this.emit(frame, 'disjoint')
      return draw()
    }
    const query = gl.createQuery()
    if (!query) {
      this.emit(frame, 'failed')
      return draw()
    }
    const item = { query, frame }
    this.active = item
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query)
    let complete = false
    try {
      const result = draw()
      complete = true
      return result
    } finally {
      if (this.active === item) {
        if (gl.isContextLost()) this.contextLost()
        else {
          this.active = null
          gl.endQuery(ext.TIME_ELAPSED_EXT)
          if (complete) this.pending.push(item)
          else {
            gl.deleteQuery(query)
            this.emit(frame, 'failed')
          }
        }
      }
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    if (!this.ownsContext) return
    owners.delete(this.gl)
    this.canvas.removeEventListener('webglcontextlost', this.contextLost)
    this.canvas.removeEventListener('webglcontextrestored', this.contextRestored)
    if (!this.gl.isContextLost()) {
      if (this.active && this.extension) this.gl.endQuery(this.extension.TIME_ELAPSED_EXT)
      if (this.active) this.gl.deleteQuery(this.active.query)
      for (const item of this.pending) this.gl.deleteQuery(item.query)
    }
    this.active = null
    this.pending.length = 0
    this.extension = null
  }
}
