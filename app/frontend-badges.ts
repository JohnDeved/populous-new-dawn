// These original baked badge bounds/trademark spans are shared with the existing
// widescreen compositor. No artwork is regenerated or recolored.
export const frontendBadges = [
  { x: 5, y: 387, width: 54, height: 89, trademarkX: 61 },
  { x: 569, y: 416, width: 48, height: 60, trademarkX: 619 },
] as const

// One native-pixel guard covers the old bilinear footprint around every mark.
// Without it the smooth background would show a soft halo through transparent
// neighbors of the sharp overlay, especially the tiny trademark glyphs.
export const frontendBadgeBounds = frontendBadges.map(badge => ({
  x: badge.x - 1,
  y: badge.y - 1,
  width: badge.trademarkX + 17 - badge.x + 2,
  height: badge.height + 2,
}))

export const trademarkRows = [
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

// Copy only badge and trademark pixels from the *current* composed frame, so
// native pointer glow remains visible while the stone outside keeps its filter.
export function frontendBadgePixels(rgba: Uint8ClampedArray, frameWidth: number, index: number) {
  const badge = frontendBadges[index]
  const { x, y, width, height } = frontendBadgeBounds[index]
  const pixels = new Uint8ClampedArray(width * height * 4)
  const offset = (frameWidth - 640) / 2
  const copy = (row: number, start: number, end: number) => {
    const source = ((y + row) * frameWidth + offset + x + start) * 4
    pixels.set(rgba.subarray(source, source + (end - start) * 4), (row * width + start) * 4)
  }
  for (let row = 0; row < height; row++) copy(row, 0, badge.width + 2)
  for (const [row, spans] of trademarkRows.entries())
    for (const [start, end] of spans)
      for (let neighbor = row; neighbor <= row + 2; neighbor++)
        copy(neighbor, badge.trademarkX - badge.x + start, badge.trademarkX - badge.x + end + 3)
  return { pixels, width, height }
}
