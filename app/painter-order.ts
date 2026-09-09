// 0x46e930 / 0x4718c0: ground bias precedes division; model bias follows it.
export function polygonBucket(depths: number[], bias = 0, raised = false) {
  let distance = Math.imul((depths[0] + depths[1] + depths[2] + 0x15000) | 0, 85) >> 8
  if (raised) distance = (distance + 256) | 0
  return distance < 64 ? 0 : Math.max(0, Math.min(3584, ((distance >> 4) + bias) | 0))
}

// 0x47c7e0 / 0x4f9380: each submitted triangle has a constant float32 depth.
export const painterDepth = (submission: number) =>
  Math.fround(Math.fround(0.999) - submission / 16384)
export const comparePolygons = (
  a: { bucket: number; order: number },
  b: { bucket: number; order: number }
) => b.bucket - a.bucket || b.order - a.order

// 0x46d970: completed models reject shared left/right/bottom outcodes, then
// rear-facing triangles. There is deliberately no shared top-edge rejection.
export function modelTriangleVisible(
  points: { screenX: number; screenY: number }[],
  width: number,
  height: number
) {
  if (
    points.every(p => p.screenX < 0) ||
    points.every(p => p.screenX >= width) ||
    points.every(p => p.screenY >= height)
  )
    return false
  const [a, b, c] = points
  return (
    (b.screenX - a.screenX) * (c.screenY - b.screenY) >
    (b.screenY - a.screenY) * (c.screenX - b.screenX)
  )
}
