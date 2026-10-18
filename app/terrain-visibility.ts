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

// Original draw order, with the central copy first. Each tile is 128 cells wide.
export const terrainTiles = [
  [0, 0],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

export function visibleTerrainCopies(bounds: number[][], center: { x: number; y: number }) {
  let mask = 0
  for (let row = 0; row < bounds.length; row++) {
    const [start, end] = bounds[row]
    if (start <= 0 || end <= start) continue
    const y = (center.y >> 9) + row - 111,
      tileZ = Math.floor((59 - y) / 128)
    if (tileZ < -1 || tileZ > 1) continue
    const x = (center.x >> 9) - 110 + 60,
      first = Math.max(-1, Math.floor((x + start) / 128)),
      last = Math.min(1, Math.floor((x + end - 1) / 128))
    for (let tileX = first; tileX <= last; tileX++) mask |= 1 << ((tileX + 1) * 3 + tileZ + 1)
  }
  return terrainTiles.filter(([x, z]) => mask & (1 << ((x + 1) * 3 + z + 1)))
}

// One bounded selection per view, shared by picking and render preparation.
// Snapshot values, not array identities: callers may replace or mutate spans.
export class TerrainVisibilityPreparation {
  private state?: {
    overview: boolean
    x: number
    y: number
    bounds: number[][]
    vertices: number
    indices: Uint32Array
    count: number
    tiles: number[][]
    tileOrder: number[][]
  }

  prepare(
    bounds: number[][],
    center: { x: number; y: number },
    overview: boolean,
    vertices: number
  ) {
    const x = center.x >> 9,
      y = center.y >> 9,
      state = this.state
    if (
      state &&
      state.overview === overview &&
      state.vertices === vertices &&
      (overview ||
        (state.x === x &&
          state.y === y &&
          state.bounds.length === bounds.length &&
          bounds.every(
            ([start, end], row) => start === state.bounds[row][0] && end === state.bounds[row][1]
          ))) &&
      state.tileOrder.length === terrainTiles.length &&
      terrainTiles.every(([x, z], i) => x === state.tileOrder[i][0] && z === state.tileOrder[i][1])
    )
      return state

    const cells = overview ? null : visibleTerrainCells(bounds, center),
      indices = new Uint32Array(Math.ceil(vertices / 6) * 6),
      tiles = overview ? terrainTiles : visibleTerrainCopies(bounds, center)
    let count = 0
    for (let cell = 0; cell < vertices / 6; cell++) {
      if (cells && !cells[cell]) continue
      for (let vertex = cell * 6; vertex < cell * 6 + 6; vertex++) indices[count++] = vertex
    }
    this.state = {
      overview,
      x,
      y,
      vertices,
      indices,
      count,
      bounds: overview ? [] : bounds.map(([start, end]) => [start, end]),
      tiles,
      tileOrder: terrainTiles.map(([x, z]) => [x, z]),
    }
    return this.state
  }
}
