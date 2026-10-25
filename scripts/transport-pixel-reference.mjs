// Test-only reference for the recorded Chrome154 Linux/x64 compositor. Its DEPS
// pins Skia2466dcf3937437e217e7f284afe0e1aae15891ce. Source rules:
// src/core/SkScan_Antihair.cpp: SkFixedToFDot8, antifilldot8, do_scanline
// src/core/SkBitmapProcState.cpp: paint alpha; SkBlitRow_D32.cpp: SSE2 source-over.
// This models source rectangles, not game components or captured result colors.
const fixed8 = value => Math.floor((Math.trunc(value * 65536) + 128) / 256)

function pixelCoverage({ left, top, right, bottom }, x, y) {
  const width = Math.max(0, Math.min((x + 1) * 256, right) - Math.max(x * 256, left))
  const height = Math.max(0, Math.min((y + 1) * 256, bottom) - Math.max(y * 256, top))
  if (Math.floor(top / 256) === Math.floor((bottom - 1) / 256))
    return Math.floor(width * (bottom - top - 1) / 256)
  if (height === 256) {
    if (Math.floor(left / 256) === Math.floor((right - 1) / 256)) return right - left - 1
    return width === 256 ? 255 : width
  }
  return Math.floor(width * height / 256)
}

export function composePixelLayers(width, height, layers) {
  // Keep premultiplied byte colors while composing, as the pinned raster does.
  const output = new Uint8ClampedArray(width * height * 4)
  for (const { image, source, x, y, scale, opacity = 1 } of layers) {
    const bounds = { left: fixed8(x), top: fixed8(y), right: fixed8(x + source.width * scale), bottom: fixed8(y + source.height * scale) }
    const paintScale = Math.floor(opacity * 255 + 0.5) + 1
    for (let py = Math.max(0, Math.floor(bounds.top / 256)); py < Math.min(height, Math.ceil(bounds.bottom / 256)); py++) {
      for (let px = Math.max(0, Math.floor(bounds.left / 256)); px < Math.min(width, Math.ceil(bounds.right / 256)); px++) {
        const coverage = pixelCoverage(bounds, px, py)
        if (coverage <= 0) continue
        const sx = source.x + Math.min(source.width - 1, Math.max(0, Math.floor((px + 0.5 - x) / scale)))
        const sy = source.y + Math.min(source.height - 1, Math.max(0, Math.floor((py + 0.5 - y) / scale)))
        const from = (sy * image.width + sx) * 4, to = (py * width + px) * 4
        const sourceAlpha = image.data[from + 3], alpha = Math.floor(sourceAlpha * paintScale / 256)
        const sourceScale = coverage + 1, inverse = 65535 - alpha * sourceScale
        const destinationScale = Math.floor((inverse + Math.floor(inverse / 256)) / 256)
        for (let channel = 0; channel < 4; channel++) {
          const premultiplied = channel === 3 ? sourceAlpha : Math.floor((image.data[from + channel] * sourceAlpha + 127) / 255)
          const painted = Math.floor(premultiplied * paintScale / 256)
          output[to + channel] = Math.floor((painted * sourceScale + output[to + channel] * destinationScale) / 256)
        }
      }
    }
  }
  // ImageData expects straight alpha. The panel-backed captures are all opaque.
  for (let i = 0; i < output.length; i += 4) if (output[i + 3] && output[i + 3] !== 255)
    for (let c = 0; c < 3; c++) output[i + c] = Math.floor(output[i + c] * 255 / output[i + 3] + 0.5)
  return output
}
