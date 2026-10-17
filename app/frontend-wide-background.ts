// Modern wide-screen composition: keep the original central artwork at native
// logical size and feather only its outer stone edges into a source-derived field.
// The field has no copied texture or recognizable motifs. This is an explicit
// adaptation; the native 4:3 compositor remains byte-exact.
const trademarkRows = [
  [
    [0, 10],
    [14, 16],
  ],
  [
    [0, 11],
    [13, 16],
  ],
  [
    [3, 4],
    [8, 11],
    [13, 16],
  ],
  [
    [3, 4],
    [8, 11],
    [13, 16],
  ],
  [
    [3, 4],
    [8, 16],
  ],
  [
    [3, 4],
    [8, 16],
  ],
  [
    [3, 4],
    [8, 9],
    [11, 13],
    [15, 16],
  ],
  [
    [3, 4],
    [8, 9],
    [11, 13],
    [15, 16],
  ],
  [
    [3, 4],
    [8, 9],
    [11, 13],
    [15, 16],
  ],
] as const
const backgrounds = new WeakMap<Uint8Array, { width: number; indexed: Uint8Array }>()
const smooth = (value: number) => value * value * (3 - 2 * value)

function edgeColors(source: Uint8Array) {
  const colors: number[][][] = []
  for (const x of [0, 608]) {
    const side: number[][] = []
    for (const y of [0, 152, 304]) {
      const color = [0, 0, 0]
      // Only outer artwork above the baked badges; average it rather than stretching
      // edge pixels or repeating a texture strip across the wider viewport.
      for (let row = y; row < y + 80; row++) {
        for (let col = x; col < x + 32; col++) {
          const at = 640 * 480 + source[row * 640 + col] * 4
          for (let channel = 0; channel < 3; channel++) color[channel] += source[at + channel]
        }
      }
      side.push(color.map(value => value / (32 * 80)))
    }
    colors.push(side)
  }
  return colors
}

export function frontendWideIndexedBackground(source: Uint8Array, width: number) {
  const cached = backgrounds.get(source)
  if (cached?.width === width) return new Uint8Array(cached.indexed)
  const indexed = new Uint8Array(width * 480)
  const offset = (width - 640) / 2
  const feather = Math.min(120, (width - 640) / 2)
  const edges = edgeColors(source)
  const red = new Uint8Array(256)
  const green = new Uint8Array(256)
  const blue = new Uint8Array(256)
  for (let index = 0; index < 256; index++) {
    const at = 640 * 480 + index * 4
    red[index] = source[at]
    green[index] = source[at + 1]
    blue[index] = source[at + 2]
  }
  const quantized = new Map<number, number>()
  function nearest(r: number, g: number, b: number) {
    r = Math.round(r)
    g = Math.round(g)
    b = Math.round(b)
    const key = (r << 16) | (g << 8) | b
    const cached = quantized.get(key)
    if (cached !== undefined) return cached
    let closest = 0
    let distance = Infinity
    for (let index = 0; index < 256; index++) {
      const next = (red[index] - r) ** 2 + (green[index] - g) ** 2 + (blue[index] - b) ** 2
      if (next < distance) {
        closest = index
        distance = next
      }
    }
    quantized.set(key, closest)
    return closest
  }
  // Serpentine error diffusion keeps the source palette without large flat
  // quantization contours. Unchanged source pixels never receive diffusion.
  let currentErrors = new Float32Array((width + 2) * 3)
  let nextErrors = new Float32Array((width + 2) * 3)
  for (let y = 0; y < 480; y++) {
    const band = Math.min(1, Math.floor(y / 240))
    const vertical = (y - band * 240) / 240
    const sides = edges.map(side =>
      side[band].map(
        (value, channel) => value * (1 - vertical) + side[band + 1][channel] * vertical
      )
    )
    const direction = y % 2 === 0 ? 1 : -1
    for (let step = 0; step < width; step++) {
      const x = direction === 1 ? step : width - 1 - step
      const sourceX = x - offset
      const withinArt = sourceX >= 0 && sourceX < 640
      const edge = withinArt ? smooth(Math.min(1, Math.min(sourceX, 639 - sourceX) / feather)) : 0
      // Grow the feather's width rather than leaving an opaque vertical boundary
      // during partial adaptation. At the first wide step only edge columns change.
      const amount = 1 - edge
      const original = withinArt ? source[y * 640 + sourceX] : 0
      if (amount === 0) {
        indexed[y * width + x] = original
        continue
      }
      const horizontal = x / (width - 1)
      const at = (x + 1) * 3
      const r = Math.max(
        0,
        Math.min(
          255,
          red[original] * (1 - amount) +
            (sides[0][0] * (1 - horizontal) + sides[1][0] * horizontal) * amount +
            currentErrors[at]
        )
      )
      const g = Math.max(
        0,
        Math.min(
          255,
          green[original] * (1 - amount) +
            (sides[0][1] * (1 - horizontal) + sides[1][1] * horizontal) * amount +
            currentErrors[at + 1]
        )
      )
      const b = Math.max(
        0,
        Math.min(
          255,
          blue[original] * (1 - amount) +
            (sides[0][2] * (1 - horizontal) + sides[1][2] * horizontal) * amount +
            currentErrors[at + 2]
        )
      )
      const chosen = nearest(r, g, b)
      indexed[y * width + x] = chosen
      for (let channel = 0; channel < 3; channel++) {
        const error =
          channel === 0 ? r - red[chosen] : channel === 1 ? g - green[chosen] : b - blue[chosen]
        currentErrors[at + direction * 3 + channel] += error * (7 / 16)
        nextErrors[at - direction * 3 + channel] += error * (3 / 16)
        nextErrors[at + channel] += error * (5 / 16)
        nextErrors[at + direction * 3 + channel] += error * (1 / 16)
      }
    }
    const previous = currentErrors
    currentErrors = nextErrors
    nextErrors = previous
    nextErrors.fill(0)
  }
  // Keep the original badge positions and pixels over the feathered stone. Moving
  // them would require removing baked marks and can create duplicates mid-resize.
  for (const [x, y, w, h] of [
    [5, 387, 54, 89],
    [569, 416, 48, 60],
  ]) {
    for (let row = 0; row < h; row++) {
      const at = (y + row) * 640 + x
      indexed.set(source.subarray(at, at + w), (y + row) * width + x + offset)
    }
  }
  for (const [x, y] of [
    [61, 387],
    [619, 416],
  ]) {
    for (const [row, spans] of trademarkRows.entries()) {
      for (const [start, end] of spans) {
        const at = (y + row) * 640 + x + start
        indexed.set(
          source.subarray(at, at + end - start + 1),
          (y + row) * width + x + start + offset
        )
      }
    }
  }
  backgrounds.set(source, { width, indexed })
  return new Uint8Array(indexed)
}
