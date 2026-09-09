// The terrain keeps its original six vertices per cell. An index buffer selects
// only cells used by the native row spans; gl_VertexID retains painter face IDs.
export function visibleTerrainCells(bounds: number[][], center: { x: number; y: number }) {
  const cells = new Uint8Array(128 * 128)
  for (let row = 0; row < bounds.length; row++) {
    const [start, end] = bounds[row]
    if (start <= 0) continue
    const y = (center.y >> 9) + row - 111,
      z = (59 - y) & 127
    for (let column = start; column < end; column++) {
      const x = (center.x >> 9) + column - 110
      cells[z * 128 + ((x + 60) & 127)] = 1
    }
  }
  return cells
}
