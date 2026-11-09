// The 97 by 97 compatibility surface samples native positions
// ((column - 40) * 256, (40 - row) * 256), half a native cell apart.
// The caller supplies full native planes and the existing 9409-element array.
export function resampleTerrainSurface(heights: Int16Array, flags: Uint32Array, output: number[]) {
  for (let row = 0; row < 96; row += 2) {
    const nativeTop = ((40 - row) & 255) >>> 1,
      upper = nativeTop << 7,
      lower = ((nativeTop + 127) & 127) << 7,
      topTarget = row * 97,
      bottomTarget = topTarget + 97
    let column = 108,
      a = heights[lower + column],
      b = heights[upper + column]
    for (let x = 0; x < 96; x += 2) {
      const nextColumn = (column + 1) & 127,
        c = heights[upper + nextColumn],
        d = heights[lower + nextColumn],
        vertical = a + ((b - a) >> 1)
      // Native Y points up: a/d are the lower corners, b/c the upper ones.
      // Retain each triangle term's signed rounding before adding the terms.
      const center =
        flags[lower + column] & 1 ? c + ((d - c) >> 1) + ((b - c) >> 1) : vertical + ((c - b) >> 1)
      output[topTarget + x] = b / 45 || -0.35
      output[topTarget + x + 1] = (b + ((c - b) >> 1)) / 45 || -0.35
      output[bottomTarget + x] = vertical / 45 || -0.35
      // The two rounded triangle terms can leave the signed 16-bit range.
      output[bottomTarget + x + 1] = ((center << 16) >> 16) / 45 || -0.35
      column = nextColumn
      a = d
      b = c
    }
    output[topTarget + 96] = b / 45 || -0.35
    output[bottomTarget + 96] = (a + ((b - a) >> 1)) / 45 || -0.35
  }

  // The final row contains only native vertices and horizontal midpoints.
  const base = (((40 - 96) & 255) >>> 1) << 7,
    target = 96 * 97
  let column = 108,
    a = heights[base + column]
  for (let x = 0; x < 96; x += 2) {
    const nextColumn = (column + 1) & 127,
      d = heights[base + nextColumn]
    output[target + x] = a / 45 || -0.35
    output[target + x + 1] = (a + ((d - a) >> 1)) / 45 || -0.35
    column = nextColumn
    a = d
  }
  output[target + 96] = a / 45 || -0.35
}
