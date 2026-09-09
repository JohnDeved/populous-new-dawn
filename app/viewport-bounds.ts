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
