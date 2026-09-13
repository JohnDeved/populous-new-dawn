import type { Point, NativePoint } from './world-types.ts'
import { GRID } from './world-rules.ts'
import { short, nativeAngle, nativeTerrainCross } from './native-math.ts'
import rules from './original-rules.json' with { type: 'json' }

export function worldPoint(terrain: number[], p: Point) {
  return { x: p.x, y: (height(terrain, p.x, p.z) * 45) / 128, z: p.z }
}
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z)
// 0x4e6ac0: native XYZ, including signed-short wrap and half-scale vertical steps.
export function nativeStep3D(
  p: NativePoint,
  yaw: number,
  pitch: number,
  length: number
): NativePoint {
  const horizontal = Math.imul(rules.sine[pitch & 2047], length) >> 16
  return {
    x: short(p.x + (Math.imul(rules.sine[yaw & 2047], horizontal) >> 16)),
    y: short(p.y + (Math.imul(rules.sine[(yaw + 512) & 2047], horizontal) >> 16)),
    h: short(p.h + (Math.imul(rules.sine[(pitch + 512) & 2047], length >> 1) >> 16)),
  }
}
export const browserPosition = (p: Pick<NativePoint, 'x' | 'y'>): Point => ({
  x: short(p.x - 2048) / 256,
  z: -short(p.y + 2048) / 256,
})
export const nativeDistance = (a: NativePoint, b: NativePoint) =>
  Math.floor(Math.hypot(short(a.x - b.x), short(a.y - b.y), a.h - b.h))
export function shotAngles(p: NativePoint, d: NativePoint) {
  const dx = short(d.x - p.x),
    dy = short(d.y - p.y)
  return [nativeAngle(dx, -dy), nativeAngle(Math.max(Math.abs(dx), Math.abs(dy)), -2 * (d.h - p.h))]
}
// 0x44e940: toroidal 128-cell map, 512 coordinates/cell, separate signed shifts.
export function nativeTerrainHeight(terrain: ArrayLike<number>, x: number, y: number) {
  const ix = (x & 65535) >> 9,
    iy = (y & 65535) >> 9,
    fx = (x & 510) >> 1,
    fy = (y & 510) >> 1
  const a = terrain[iy * 128 + ix],
    b = terrain[iy * 128 + ((ix + 1) & 127)],
    c = terrain[((iy + 1) & 127) * 128 + ix],
    d = terrain[((iy + 1) & 127) * 128 + ((ix + 1) & 127)]
  return short(
    nativeTerrainCross(a, b, c, d)
      ? fx + fy < 256
        ? a + (((b - a) * fx) >> 8) + (((c - a) * fy) >> 8)
        : d + (((b - d) * (256 - fy)) >> 8) + (((c - d) * (256 - fx)) >> 8)
      : fy < fx
        ? a + (((d - b) * fy) >> 8) + (((b - a) * fx) >> 8)
        : a + (((d - c) * fx) >> 8) + (((c - a) * fy) >> 8)
  )
}
// Browser Z reflects native Y, exchanging the two diagonals. Quantize like the water shader.
export function terrainCross(a: number, b: number, c: number, d: number) {
  return !nativeTerrainCross(
    Math.floor(c * 45 + 0.5),
    Math.floor(d * 45 + 0.5),
    Math.floor(a * 45 + 0.5),
    Math.floor(b * 45 + 0.5)
  )
}
export function height(terrain: number[], x: number, z: number) {
  const gx = Math.max(0, Math.min(96, x + 48)),
    gz = Math.max(0, Math.min(96, z + 48))
  const ix = Math.min(95, Math.floor(gx)),
    iz = Math.min(95, Math.floor(gz)),
    fx = gx - ix,
    fz = gz - iz
  const a = terrain[iz * GRID + ix],
    b = terrain[iz * GRID + ix + 1],
    c = terrain[(iz + 1) * GRID + ix],
    d = terrain[(iz + 1) * GRID + ix + 1]
  // Match the rendered triangles, including their diagonal, rather than bilinear interpolation.
  return terrainCross(a, b, c, d)
    ? fx + fz <= 1
      ? a + fx * (b - a) + fz * (c - a)
      : d + (1 - fx) * (c - d) + (1 - fz) * (b - d)
    : fz < fx
      ? a + fx * (b - a) + fz * (d - b)
      : a + fx * (d - c) + fz * (c - a)
}
export function surface(terrain: number[], p: Point) {
  return height(terrain, p.x, p.z)
}
// 0x492920: marker queries read the coarse vertex; odd coordinate bits are ignored.
export function nativeCellPoint(packed: number): Point {
  return browserPosition({ x: (packed & 254) << 8, y: packed & 0xfe00 })
}
