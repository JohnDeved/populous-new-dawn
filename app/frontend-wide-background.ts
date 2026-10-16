// Source-only modern framing experiment. This crop deliberately changes the
// original composition. Native 4:3 continues to use the untouched source field.
// Corner trademark row masks are an adapted extraction, not original alpha data.
const artHeight = 384
// Both source trademarks have this same 17×9 glyph shape. Keep original indices,
// including antialias pixels; do not threshold black or copy a stone rectangle.
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

export function frontendWideIndexedBackground(source: Uint8Array, width: number) {
  const cached = backgrounds.get(source)
  if (cached?.width === width) return cached.indexed.slice()
  const indexed = new Uint8Array(width * 480)
  const scale = Math.max(width / 640, 480 / artHeight)
  const left = (640 - width / scale) / 2
  const top = artHeight - 480 / scale
  for (let y = 0; y < 480; y++) {
    const sourceY = Math.min(artHeight - 1, Math.floor(top + y / scale))
    for (let x = 0; x < width; x++) {
      const sourceX = Math.min(639, Math.floor(left + x / scale))
      indexed[y * width + x] = source[sourceY * 640 + sourceX]
    }
  }
  // The white Bullfrog and black QSound panels are exact opaque source crops.
  for (const [x, y, w, h, offset] of [
    [5, 387, 54, 89, 0],
    [569, 416, 48, 60, width - 640],
  ]) {
    for (let row = 0; row < h; row++) {
      const at = (y + row) * 640 + x
      indexed.set(source.subarray(at, at + w), (y + row) * width + x + offset)
    }
  }
  for (const [x, y, offset] of [
    [61, 387, 0],
    [619, 416, width - 640],
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
