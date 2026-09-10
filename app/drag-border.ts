interface Point {
  x: number
  y: number
}
const offsets = [
  [0, 8],
  [-8, 0],
  [0, -8],
  [8, 0],
] as const

// 0x4673b0 type 0x1c: extrude along screen axes, not a line normal.
export function dragBorderQuad(a: Point, b: Point, direction: number, corner = false) {
  const [dx, dy] = offsets[direction & 3]
  const [nx, ny] = offsets[(direction + 1) & 3]
  const end = corner ? { x: Math.fround(a.x + dx), y: Math.fround(a.y + dy) } : b
  const ox = corner ? nx : dx,
    oy = corner ? ny : dy
  return [
    a,
    end,
    { x: Math.fround(end.x + ox), y: Math.fround(end.y + oy) },
    { x: Math.fround(a.x + ox), y: Math.fround(a.y + oy) },
  ]
}

// Original 21-bit texture coordinates sample the lower half of tiles 23/31.
const textureCoordinate = (value: number) => Math.fround(1 / 64 + (value * (31 / 32)) / 2097152)
export const dragBorderUV = [
  [1 / 64, textureCoordinate(1048575)],
  [textureCoordinate(2097151), textureCoordinate(1048575)],
  [textureCoordinate(2097151), textureCoordinate(2097151)],
  [1 / 64, textureCoordinate(2097151)],
]

// 0x424320: cell sides and both diagonals split the perimeter. Preserve the
// original rounding: side intersections add 1/2; diagonals add 1/4 to Y.
export function dragBorderCrossings(a: Point, b: Point) {
  const points: { x: number; y: number; mode: number }[] = []
  for (const mode of [1, 2, 4, 3]) {
    const axis = (p: Point) => {
      if (mode === 1) return p.x
      if (mode === 2) return p.y
      return p.x + (mode === 4 ? -p.y : p.y)
    }
    const [start, end] = axis(a) <= axis(b) ? [a, b] : [b, a]
    const low = axis(start),
      high = axis(end),
      dx = end.x - start.x,
      dy = end.y - start.y
    if (low === high) continue
    const slope = Math.fround(mode === 1 ? dy / dx : dx / dy)
    for (
      let grid = Math.floor((low + (mode < 3 ? 511 : 510)) / 512) * 512;
      grid <= high;
      grid += 512
    ) {
      let x: number, y: number
      if (mode === 1) {
        x = grid
        y = start.y + (grid - low) * slope + 0.5
      } else if (mode === 2) {
        x = start.x + (grid - low) * slope + 0.5
        y = grid
      } else {
        y = start.y + ((low - grid) * dy) / (mode === 4 ? dy - dx : -dy - dx) + 0.25
        x = mode === 4 ? y + grid : grid - y
      }
      points.push({ x: Math.trunc(x), y: Math.trunc(y), mode })
    }
  }
  return points
}
export function dragBorderPoints(a: Point, b: Point) {
  const points: Point[] = [a, b, ...dragBorderCrossings(a, b)],
    dx = b.x - a.x,
    dy = b.y - a.y
  points.sort((p, q) => (p.x - q.x) * dx + (p.y - q.y) * dy)
  return points.filter((p, i) => !i || p.x !== points[i - 1].x || p.y !== points[i - 1].y)
}
