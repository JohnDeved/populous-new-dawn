import { cameraMatrix, type CameraConfig } from './projection.ts'

// Widen the native ground quadrilateral for the browser battlefield. Preserve
// its near/far distances and taper; scaling its depth can cross the near plane.
export function widenGroundBounds(
  config: CameraConfig,
  width: number,
  height: number,
  heights: readonly [number, number]
) {
  const { bounds } = config
  const [nearLeft, near, nearRight, , farRight, far, farLeft] = bounds
  if (config.boundsMode !== 1 || width <= config.width) return bounds
  const nearWidth = Math.max(Math.abs(nearLeft), Math.abs(nearRight)),
    basis = cameraMatrix(0, config.pitch)
  let padding = Math.ceil(nearWidth * (width / config.width - 1))
  // The bottom and side screen edges bound the useful expansion. This avoids
  // widening a magnified close view just because its native table says 640 px.
  const focal = (config.scale * 2 ** config.perspective) / 65536,
    curvature = config.curvature / 0x40000000,
    bottom = (height / 2 - config.offsetY) / focal,
    side = (width / 2 + Math.abs(config.offsetX)) / focal,
    farWidth = Math.max(Math.abs(farRight), Math.abs(farLeft)),
    vertical = basis[5] / 16384,
    forward = basis[8] / 16384,
    heightUp = basis[4] / 16384,
    heightDepth = basis[7] / 16384
  let visiblePadding = 0
  if (curvature > 0 && focal > 0) {
    for (let row = near; row <= far; row++) {
      const z = row * 256 * forward,
        peak = heightDepth
          ? ((heightUp + bottom * heightDepth) / (2 * curvature * heightDepth) - z) / heightDepth
          : heights[1],
        candidates = [...heights, Math.max(heights[0], Math.min(heights[1], peak))]
      let ceiling = 0,
        depth = 0
      for (const h of candidates) {
        const distance = z + h * heightDepth
        ceiling = Math.max(
          ceiling,
          row * 256 * vertical +
            h * heightUp -
            curvature * distance * distance +
            bottom * (distance + config.depth)
        )
        depth = Math.max(depth, distance + config.depth)
      }
      const extent = Math.min(Math.sqrt(ceiling / curvature), side * depth) / 256,
        nativeWidth = nearWidth + ((farWidth - nearWidth) * (row - near)) / (far - near)
      visiblePadding = Math.max(visiblePadding, extent - nativeWidth)
    }
    padding = Math.min(padding, Math.ceil(visiblePadding) + 4)
  }
  for (let corner = 0; corner < 4; corner++) {
    const cornerForward = bounds[corner * 2 + 1],
      // Allow four cells for rotated row edges, camera fractions and integer rounding.
      depths = [cornerForward - 4, cornerForward + 4].flatMap(z =>
        heights.map(h => Math.abs((z * 256 * basis[8] + h * basis[7]) / 16384))
      ),
      farthest = Math.max(...depths),
      // Native radius is 4*(x*x+z*z), held in a signed 32-bit integer. The
      // horizontal scale product must also remain positive before its shift.
      radiusLimit = Math.sqrt(Math.max(0, 0x1fffffff - farthest * farthest)),
      productLimit = 0x7fffffff / Math.max(1, Math.abs(config.scale)),
      safeWidth = Math.min(radiusLimit, productLimit) / 256 - 4
    padding = Math.min(padding, Math.max(0, Math.floor(safeWidth - Math.abs(bounds[corner * 2]))))
  }
  return bounds.map((n, i) => (i % 2 ? n : n + Math.sign(n) * padding))
}

// A native transition's diameter is owned camera state, not a browser viewport
// coverage guarantee. Extend only connected circular-boundary cells whose
// conservative projected volume intersects this display. Leave native config
// and the polygon preset policy untouched; one result feeds GPU/CPU consumers.
export class DisplayGroundFootprint {
  private visited = new Uint8Array(222 * 222)
  private queue = new Uint32Array(222 * 222)
  private key: number[] = []
  private cached: number[][] = []

  cover(
    native: number[][],
    config: CameraConfig,
    width: number,
    height: number,
    heights: readonly [number, number],
    angle: number,
    center: { x: number; y: number }
  ) {
    if (config.boundsMode !== 0 || config.scale <= 0 || config.curvature < 0) return native
    const fractionX = (center.x & 511) / 2,
      fractionZ = (center.y & 511) / 2,
      key = [width, height, ...heights, angle, fractionX, fractionZ, config.diameter,
        config.pitch, config.curvature, config.scale, config.perspective,
        config.depth, config.offsetX, config.offsetY]
    if (key.length === this.key.length && key.every((v, i) => v === this.key[i])) return this.cached
    const rows = native.map(row => [...row]),
      m = cameraMatrix(angle, config.pitch).map(n => n / 16384),
      pitchBasis = cameraMatrix(0, config.pitch),
      forward = pitchBasis[8] / 16384,
      slope = forward > 0 ? pitchBasis[5] / pitchBasis[8] : 0,
      heightSlope = pitchBasis[4] / 16384 - slope * pitchBasis[7] / 16384,
      focal = config.scale * 2 ** config.perspective / 65536,
      curve = config.curvature / 0x40000000,
      middleHeight = (heights[0] + heights[1]) / 2,
      heightRadius = (heights[1] - heights[0]) / 2,
      // Include a native-unit margin for integer basis/projection rounding.
      extentX = (Math.abs(m[0]) + Math.abs(m[2])) * 129 + 2,
      extentY = (Math.abs(m[3]) + Math.abs(m[5])) * 129 + Math.abs(m[4]) * heightRadius + 2,
      extentZ = (Math.abs(m[6]) + Math.abs(m[8])) * 129 + Math.abs(m[7]) * heightRadius + 2,
      screenX = (width >> 1) + config.offsetX,
      screenY = (height >> 1) + config.offsetY
    const couldReachDisplay = (column: number, row: number) => {
      const x = (column - 110) * 256 + 128 - fractionX,
        z = (row - 111) * 256 + 128 - fractionZ,
        cameraX = m[0] * x + m[2] * z,
        cameraY = m[3] * x + m[4] * middleHeight + m[5] * z,
        cameraZ = m[6] * x + m[7] * middleHeight + m[8] * z,
        lowX = cameraX - extentX,
        highX = cameraX + extentX,
        lowZ = cameraZ - extentZ,
        highZ = cameraZ + extentZ,
        maxX = Math.max(Math.abs(lowX), Math.abs(highX)),
        maxZ = Math.max(Math.abs(lowZ), Math.abs(highZ)),
        near = lowZ + config.depth,
        far = highZ + config.depth
      // Added cells must stay within native signed radius/product and near-plane
      // limits. Never enlarge the 222-row buffer or wrap a projection product.
      if (near <= 0 || maxX * maxX + maxZ * maxZ >= 0x1fffffff ||
          maxX * config.scale >= 0x7fffffff || far <= 0) return false
      const minX = lowX > 0 ? lowX : highX < 0 ? -highX : 0,
        minZ = lowZ > 0 ? lowZ : highZ < 0 ? -highZ : 0,
        lowY = cameraY - extentY - curve * (maxX * maxX + maxZ * maxZ) - 2,
        highY = cameraY + extentY - curve * (minX * minX + minZ * minZ) + 2,
        left = screenX + focal * (lowX < 0 ? lowX / near : lowX / far),
        right = screenX + focal * (highX > 0 ? highX / near : highX / far),
        top = screenY - focal * (highY > 0 ? highY / near : highY / far),
        bottom = screenY - focal * (lowY < 0 ? lowY / near : lowY / far)
      // The far side of the curved horizon folds back into the same screen.
      // Do not add that hidden branch: the ray's height derivative changes sign
      // at curve * (depth^2 + cameraX^2) = slope*d + curve*d^2 - heightSlope*h.
      if (curve > 0 && forward > 0 && curve * (near * near + minX * minX) >
          slope * config.depth + curve * config.depth * config.depth -
          Math.min(heightSlope * heights[0], heightSlope * heights[1])) return false
      // This interval contains every projected point at any height in the cell;
      // rejection is conservative, not a sampled-corner or changed-pixel guess.
      return right >= -2 && left <= width + 2 && bottom >= -2 && top <= height + 2
    }
    this.visited.fill(0)
    let head = 0, tail = 0
    for (let row = 1; row < 221; row++)
      for (let column = Math.max(1, rows[row][0]); column < Math.min(221, rows[row][1]); column++) {
        const cell = row * 222 + column
        this.visited[cell] = 2
        this.queue[tail++] = cell
      }
    const visit = (column: number, row: number) => {
      if (column < 1 || column >= 221 || row < 1 || row >= 221) return
      const cell = row * 222 + column
      if (this.visited[cell]) return
      this.visited[cell] = 1
      if (!couldReachDisplay(column, row)) return
      this.visited[cell] = 2
      this.queue[tail++] = cell
      const span = rows[row]
      if (!span[0]) { span[0] = column; span[1] = column + 1 }
      else { span[0] = Math.min(span[0], column); span[1] = Math.max(span[1], column + 1) }
    }
    while (head < tail) {
      const cell = this.queue[head++], column = cell % 222, row = Math.floor(cell / 222)
      visit(column - 1, row); visit(column + 1, row); visit(column, row - 1); visit(column, row + 1)
    }
    this.key = key
    this.cached = rows
    return rows
  }
}
