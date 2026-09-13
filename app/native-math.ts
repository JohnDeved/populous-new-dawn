import rules from './original-rules.json' with { type: 'json' }
export const short = (v: number) => (v << 16) >> 16
interface Point {
  x: number
  z: number
}

// 0x4e6a70: signed-short distance, fixed-point sine, unsigned toroidal position.
export function movePosition(p: { x: number; y: number }, angle: number, distance: number) {
  const length = (distance << 16) >> 16
  p.x = (p.x + (Math.imul(rules.sine[angle & 2047], length) >> 16)) & 65535
  p.y = (p.y + (Math.imul(rules.sine[(angle + 512) & 2047], length) >> 16)) & 65535
}

// 0x44df40: bit 0 chooses B-C when A or D is furthest from the rounded mean.
export function nativeTerrainCross(a: number, b: number, c: number, d: number) {
  const mean = (a + b + c + d) >> 2
  return (
    Math.max(Math.abs(a - mean), Math.abs(d - mean)) >=
    Math.max(Math.abs(b - mean), Math.abs(c - mean))
  )
}

export function cellDelta(a: number, b: number) {
  const d = Math.abs((a & 255) - (b & 255))
  return Math.min(d, 256 - d)
}
// 0x49c720: halve each wrapped byte-coordinate difference before squaring.
export function cellDistanceSquared(a: number, b: number) {
  const x = cellDelta(a, b) >> 1,
    y = cellDelta(a >>> 8, b >>> 8) >> 1
  return x * x + y * y
}
// 0x4f2fc0: square proximity in byte coordinates, without even-cell rounding.
export function cellsNear(a: number, b: number, radius: number) {
  return cellDelta(a, b) <= radius && cellDelta(a >>> 8, b >>> 8) <= radius
}
// 0x450450: squared shortest 16-bit toroidal distance.
export function positionDistanceSquared(a: { x: number; y: number }, b: { x: number; y: number }) {
  const x = Math.abs(((a.x - b.x) << 16) >> 16),
    y = Math.abs(((a.y - b.y) << 16) >> 16)
  return (x * x + y * y) >>> 0
}

// 0x4503f0, truncated by fast_sqrt.
export function positionDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.floor(Math.sqrt(positionDistanceSquared(a, b)))
}

// 0x49c890: clockwise square rings, excluding the center, in doubled cells.
export function spiralCell(center: number, index: number, rotation: number) {
  let ring = 1
  while ((ring + 1) * ring * 4 <= index) ring++
  const step = index + (1 - ring) * ring * 4,
    side = ring * 2
  let x = -ring + Math.min(step, side) - Math.max(0, Math.min(step - side * 2, side))
  let y =
    ring - Math.max(0, Math.min(step - side, side)) + Math.max(0, Math.min(step - side * 3, side))
  if (rotation === 1) [x, y] = [y, -x]
  else if (rotation === 2) [x, y] = [-x, -y]
  else if (rotation === 3) [x, y] = [-y, x]
  return (((center & 255) + x * 2) & 255) | ((((center >>> 8) + y * 2) & 255) << 8)
}

// 0x586074: integer octant lookup. Input Z is already reflected from the native map.
export function nativeAngle(dx: number, dz: number) {
  const x = Math.abs(dx),
    z = Math.abs(dz)
  if (!x && !z) return 0
  const a = rules.atan[Math.floor((Math.min(x, z) * 256) / Math.max(x, z))]
  let angle = x < z ? a : 512 - a
  if (dz >= 0) angle = 1024 - angle
  if (dx < 0) angle = 2048 - angle
  return angle & 2047
}
// 0x4e6a70: signed high word of a 16.16 sine product, then reflect native Y.
export function nativeStep(p: Point, angle: number, length: number): Point {
  return {
    x: (Math.round(p.x * 256) + Math.floor((rules.sine[angle & 2047] * length) / 65536)) / 256,
    z:
      (Math.round(p.z * 256) - Math.floor((rules.sine[(angle + 512) & 2047] * length) / 65536)) /
      256,
  }
}
export function random(w: { randomState: number }) {
  const n = (Math.imul(w.randomState, 0x24a1) + 0x24df) >>> 0
  return (w.randomState = ((n >>> 13) | (n << 19)) >>> 0)
}
