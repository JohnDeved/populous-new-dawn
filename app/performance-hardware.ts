interface HardwareNavigator {
  readonly hardwareConcurrency?: number
  readonly deviceMemory?: number
}
interface HeapPerformance {
  readonly memory?: { readonly usedJSHeapSize?: number }
}

// Optional, privacy-limited browser hints. Read once per enable, using the live context.
export function readHardwareInfo(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  source: HardwareNavigator
) {
  let renderer = 'Unavailable',
    cores = 'Unavailable',
    memory = 'Unavailable'
  try {
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    const value: unknown = gl.getParameter(
      extension ? extension.UNMASKED_RENDERER_WEBGL : gl.RENDERER
    )
    if (typeof value === 'string' && value.trim()) renderer = value.trim()
  } catch {
    /* Browsers may hide renderer identity. */
  }
  try {
    const value = source.hardwareConcurrency
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) cores = String(value)
  } catch {
    /* Privacy-restricted navigator. */
  }
  try {
    const value = source.deviceMemory
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) memory = `~${value} GiB`
  } catch {
    /* Not supported by every browser. */
  }
  return { renderer, cores, memory }
}

// Legacy Chromium-only estimate. It can include shared heaps and omit workers.
export function readHeapEstimate(source: HeapPerformance) {
  try {
    const bytes = source.memory?.usedJSHeapSize
    if (typeof bytes === 'number' && Number.isFinite(bytes) && bytes >= 0)
      return `~${(bytes / 1048576).toFixed(0)} MiB`
  } catch {
    /* Unsupported/denied telemetry must never affect play. */
  }
  return 'Unavailable'
}
