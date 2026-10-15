import { useEffect, useRef, useState } from 'react'
import { advanceGlobeRaster, globeBackingSize, rasterGlobeRows } from './world-globe-raster'

export function WorldGlobe({ mission }: { mission: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    let disposed = false
    let texture: Uint8ClampedArray | undefined
    let lastSize = 0
    let frame = 0
    let rendering: { size: number; rows: ReturnType<typeof rasterGlobeRows> } | undefined
    const image = new Image()
    function fail() {
      if (!disposed) setFailed(true)
    }
    function draw() {
      frame = 0
      if (disposed || !texture || !context || !canvas) return
      const size = globeBackingSize(canvas.getBoundingClientRect().width, window.devicePixelRatio)
      if (!size || size === lastSize) {
        rendering = undefined
        return
      }
      if (rendering?.size !== size) rendering = { size, rows: rasterGlobeRows(texture, size) }
      const result = advanceGlobeRaster(rendering.rows)
      if (!result.done) {
        frame = requestAnimationFrame(draw)
        return
      }
      // Publish only the completed current-size generation. Until then the last
      // complete image stays visible, scaled by CSS. Unmount cancels the frame.
      canvas.width = canvas.height = size
      context.putImageData(new ImageData(result.value, size, size), 0, 0)
      rendering = undefined
      lastSize = size
      canvas.dataset.ready = 'true'
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(draw)
    }
    image.onload = () => {
      if (disposed) return
      try {
        if (image.naturalWidth !== 128 || image.naturalHeight !== 128 || !context) {
          fail()
          return
        }
        const source = document.createElement('canvas')
        source.width = source.height = 128
        const sourceContext = source.getContext('2d')
        if (!sourceContext) {
          fail()
          return
        }
        sourceContext.drawImage(image, 0, 0)
        texture = sourceContext.getImageData(0, 0, 128, 128).data
        schedule()
      } catch {
        fail()
      }
    }
    image.onerror = fail
    image.src = `/original/world-selector/globes/mission-${mission}.png`
    const observer = new ResizeObserver(schedule)
    observer.observe(canvas)
    // A display-scale change can leave CSS dimensions unchanged.
    let resolution: MediaQueryList
    function watchResolution() {
      resolution?.removeEventListener('change', watchResolution)
      resolution = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      resolution.addEventListener('change', watchResolution)
      schedule()
    }
    watchResolution()
    window.addEventListener('resize', schedule)
    return () => {
      disposed = true
      image.onload = image.onerror = null
      observer.disconnect()
      resolution.removeEventListener('change', watchResolution)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
  }, [mission])
  return failed ? (
    <span>World image unavailable</span>
  ) : (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-world-globe={mission}
      style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
