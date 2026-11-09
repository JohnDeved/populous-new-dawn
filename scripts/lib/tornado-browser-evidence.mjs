// Final success is owned by completed cleanup plus the aggregate deadline.
// The watchdog requesting context.close() is not evidence that close finished.
export async function finishTornadoAcceptance(report, { close, elapsed, expired, budgetMs }) {
  await close()
  const elapsedMs = elapsed()
  if (expired() || elapsedMs > budgetMs) {
    report.status = 'FAIL'
    report.timeout = { budgetMs, elapsedMs, expired: expired() }
    throw new Error(
      `Tornado aggregate budget exhausted during completion (${elapsedMs}ms / ${budgetMs}ms)`
    )
  }
  report.status = 'PASS'
}

// Read actual context settings; absent optional extensions remain explicitly absent.
export function tornadoGraphicsMetadata(scene, devicePixelRatio) {
  const renderer = scene.renderer,
    gl = renderer.getContext(),
    extension = gl.getExtension('WEBGL_debug_renderer_info')
  return {
    webgl: {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      debugRendererInfo: {
        available: extension !== null,
        unmaskedVendor: extension ? gl.getParameter(extension.UNMASKED_VENDOR_WEBGL) : null,
        unmaskedRenderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : null,
      },
      drawingBuffer: { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight },
      contextAttributes: gl.getContextAttributes(),
      contextLost: gl.isContextLost(),
    },
    devicePixelRatio,
    rendererPixelRatio: renderer.getPixelRatio(),
    canvas: {
      width: renderer.domElement.width,
      height: renderer.domElement.height,
      clientWidth: renderer.domElement.clientWidth,
      clientHeight: renderer.domElement.clientHeight,
    },
    renderer: {
      outputColorSpace: renderer.outputColorSpace,
      toneMapping: renderer.toneMapping,
      toneMappingExposure: renderer.toneMappingExposure,
      precision: renderer.capabilities.precision,
      isWebGL2: renderer.capabilities.isWebGL2,
    },
  }
}
