// Source-art reference raster only. CSS clips each image element separately,
// including partial device-pixel coverage at fractional rectangle edges.
export function composePixelLayers(width, height, layers) {
  const output = new Uint8ClampedArray(width * height * 4)
  for (const { image, source, x, y, scale, opacity = 1 } of layers) {
    const right = x + source.width * scale, bottom = y + source.height * scale
    for (let py = Math.max(0, Math.floor(y)); py < Math.min(height, Math.ceil(bottom)); py++) {
      const coverY = Math.max(0, Math.min(py + 1, bottom) - Math.max(py, y))
      for (let px = Math.max(0, Math.floor(x)); px < Math.min(width, Math.ceil(right)); px++) {
        const coverX = Math.max(0, Math.min(px + 1, right) - Math.max(px, x))
        const sx = source.x + Math.min(source.width - 1, Math.max(0, Math.floor((px + 0.5 - x) / scale)))
        const sy = source.y + Math.min(source.height - 1, Math.max(0, Math.floor((py + 0.5 - y) / scale)))
        const from = (sy * image.width + sx) * 4, to = (py * width + px) * 4
        const alpha = image.data[from + 3] / 255 * coverX * coverY * opacity
        const behind = output[to + 3] / 255 * (1 - alpha), combined = alpha + behind
        for (let channel = 0; channel < 3; channel++)
          output[to + channel] = combined ? Math.floor((image.data[from + channel] * alpha + output[to + channel] * behind) / combined + 0.5) : 0
        output[to + 3] = Math.floor(combined * 255 + 0.5)
      }
    }
  }
  return output
}
