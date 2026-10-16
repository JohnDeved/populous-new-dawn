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
      // Only source stone above the baked badges; average it rather than stretching
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
  if (cached?.width === width) return cached.indexed.slice()
  const indexed = new Uint8Array(width * 480)
  const offset = (width - 640) / 2
  const strength = smooth(Math.min(1, (width - 640) / 214))
  const edges = edgeColors(source)
  const palette = Array.from({ length: 256 }, (_, index) =>
    Array.from({ length: 3 }, (_, channel) => source[640 * 480 + index * 4 + channel])
  )
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
    for (let index = 0; index < palette.length; index++) {
      const color = palette[index]
      const next = (color[0] - r) ** 2 + (color[1] - g) ** 2 + (color[2] - b) ** 2
      if (next < distance) {
        closest = index
        distance = next
      }
    }
    quantized.set(key, closest)
    return closest
  }
  for (let y = 0; y < 480; y++) {
    const band = Math.min(1, Math.floor(y / 240))
    const vertical = (y - band * 240) / 240
    const sides = edges.map(side =>
      side[band].map(
        (value, channel) => value * (1 - vertical) + side[band + 1][channel] * vertical
      )
    )
    for (let x = 0; x < width; x++) {
      const sourceX = x - offset
      const withinArt = sourceX >= 0 && sourceX < 640
      const edge = withinArt ? smooth(Math.min(1, Math.min(sourceX, 639 - sourceX) / 120)) : 0
      // Quantized opacity gives an exact zero-change center at the one-pixel
      // breakpoint rather than perturbing source colors through a color lookup.
      const amount = withinArt ? Math.round((1 - edge) * strength * 255) / 255 : 1
      const original = withinArt ? source[y * 640 + sourceX] : 0
      if (amount === 0) {
        indexed[y * width + x] = original
        continue
      }
      const horizontal = x / (width - 1)
      const color = sides[0].map((value, channel) => {
        const field = value * (1 - horizontal) + sides[1][channel] * horizontal
        return palette[original][channel] * (1 - amount) + field * amount
      })
      indexed[y * width + x] = nearest(color[0], color[1], color[2])
    }
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
  return indexed.slice()
}
