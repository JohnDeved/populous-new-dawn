import { roundPixel, type HitBounds } from './world-picking.ts'
import type { Projection } from './projection.ts'

export interface ModelRawBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}
interface Interval {
  low: number
  high: number
}
const interval = (): Interval => ({ low: 0, high: 0 })
const int32 = (n: number) => Number.isInteger(n) && n >= -2147483648 && n <= 2147483647

// Fixed-size workspace for the independently reviewed integer interval rules.
// This encloses native modelPoint + projectPoint, not a projected-corner AABB.
// No coordinates, faces, commands or per-query interval arrays are materialized.
export class ModelPickBounds {
  readonly bounds: HitBounds = { x: 0, y: 0, width: 0, height: 0 }
  private valid = true
  private px = interval()
  private py = interval()
  private pz = interval()
  private rx = interval()
  private ry = interval()
  private rz = interval()
  private x = interval()
  private y = interval()
  private z = interval()
  private a = interval()
  private b = interval()
  private c = interval()
  private radius = interval()
  private curve = interval()
  private depth = interval()
  private perspective = interval()
  private sx = interval()
  private sy = interval()

  private set(out: Interval, low: number, high: number) {
    out.low = low
    out.high = high
  }
  private wrap(out: Interval, low: number, high: number) {
    if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high)) {
      this.valid = false
      this.set(out, -2147483648, 2147483647)
      return
    }
    const first = Math.floor((low + 2147483648) / 4294967296),
      last = Math.floor((high + 2147483648) / 4294967296)
    if (first === last) this.set(out, low - first * 4294967296, high - first * 4294967296)
    else this.set(out, -2147483648, 2147483647)
  }
  private shift(out: Interval, value: Interval, bits: number) {
    const divisor = 2 ** (bits & 31)
    this.set(out, Math.floor(value.low / divisor), Math.floor(value.high / divisor))
  }
  private scale(out: Interval, value: Interval, scalar: number, bits = 0) {
    const first = value.low * scalar,
      last = value.high * scalar
    if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last)) {
      this.valid = false
      this.set(out, -2147483648, 2147483647)
      return
    }
    this.wrap(
      out,
      Math.floor(Math.min(first, last) / 2 ** bits),
      Math.floor(Math.max(first, last) / 2 ** bits)
    )
  }
  private multiplyShift16(out: Interval, left: Interval, right: Interval) {
    const a = left.low * right.low,
      b = left.low * right.high,
      c = left.high * right.low,
      d = left.high * right.high
    if (
      !Number.isSafeInteger(a) ||
      !Number.isSafeInteger(b) ||
      !Number.isSafeInteger(c) ||
      !Number.isSafeInteger(d)
    ) {
      this.valid = false
      this.set(out, -2147483648, 2147483647)
      return
    }
    this.wrap(
      out,
      Math.floor(Math.min(a, b, c, d) / 65536),
      Math.floor(Math.max(a, b, c, d) / 65536)
    )
  }
  private row(
    out: Interval,
    x: Interval,
    y: Interval,
    z: Interval,
    matrix: number[],
    offset: number
  ) {
    this.scale(this.a, x, matrix[offset])
    this.scale(this.b, y, matrix[offset + 1])
    this.scale(this.c, z, matrix[offset + 2])
    this.wrap(out, this.a.low + this.b.low + this.c.low, this.a.high + this.b.high + this.c.high)
    this.shift(out, out, 14)
  }
  private square(out: Interval, value: Interval) {
    const a = value.low * value.low,
      b = value.high * value.high
    this.wrap(out, value.low <= 0 && value.high >= 0 ? 0 : Math.min(a, b), Math.max(a, b))
  }

  enclose(
    raw: Readonly<ModelRawBounds>,
    size: number,
    basis: number[],
    origin: { x: number; y: number; z: number },
    v: Projection
  ) {
    this.valid = true
    if (!int32(size) || basis.length !== 9 || v.matrix.length !== 9) return false
    for (let i = 0; i < 9; i++) if (!int32(basis[i]) || !int32(v.matrix[i])) return false
    if (!int32(origin.x) || !int32(origin.y) || !int32(origin.z)) return false
    if (
      !int32(v.curvature) ||
      !int32(v.scale) ||
      !Number.isSafeInteger(v.depth) ||
      !Number.isSafeInteger(v.perspective) ||
      !Number.isSafeInteger(v.fractionX) ||
      !Number.isSafeInteger(v.fractionY)
    )
      return false
    if (
      !(v.width > 0) ||
      !(v.height > 0) ||
      !Number.isFinite(v.width) ||
      !Number.isFinite(v.height) ||
      !Number.isFinite(v.centerX) ||
      !Number.isFinite(v.centerY) ||
      !Number.isFinite(v.pixelScaleX) ||
      !Number.isFinite(v.pixelScaleY)
    )
      return false
    this.set(this.px, raw.minX, raw.maxX)
    this.set(this.py, raw.minY, raw.maxY)
    this.set(this.pz, raw.minZ, raw.maxZ)
    if (
      !int32(raw.minX) ||
      !int32(raw.maxX) ||
      raw.minX > raw.maxX ||
      !int32(raw.minY) ||
      !int32(raw.maxY) ||
      raw.minY > raw.maxY ||
      !int32(raw.minZ) ||
      !int32(raw.maxZ) ||
      raw.minZ > raw.maxZ
    )
      return false
    this.scale(this.px, this.px, size)
    this.scale(this.py, this.py, size)
    this.scale(this.pz, this.pz, size)
    this.shift(this.px, this.px, 8)
    this.shift(this.py, this.py, 8)
    this.shift(this.pz, this.pz, 8)
    this.row(this.rx, this.px, this.py, this.pz, basis, 0)
    this.row(this.ry, this.px, this.py, this.pz, basis, 3)
    this.row(this.rz, this.px, this.py, this.pz, basis, 6)
    this.set(this.rx, this.rx.low + origin.x, this.rx.high + origin.x)
    this.set(this.ry, this.ry.low + origin.y, this.ry.high + origin.y)
    this.set(this.rz, this.rz.low + origin.z, this.rz.high + origin.z)
    if (
      !int32(this.rx.low) ||
      !int32(this.rx.high) ||
      !int32(this.ry.low) ||
      !int32(this.ry.high) ||
      !int32(this.rz.low) ||
      !int32(this.rz.high)
    )
      return false
    this.scale(this.a, this.rx, v.matrix[0])
    this.scale(this.b, this.rz, v.matrix[2])
    this.wrap(this.x, this.a.low + this.b.low, this.a.high + this.b.high)
    this.shift(this.x, this.x, 14)
    this.row(this.y, this.rx, this.ry, this.rz, v.matrix, 3)
    this.row(this.z, this.rx, this.ry, this.rz, v.matrix, 6)
    this.scale(this.a, this.x, 2)
    this.scale(this.b, this.z, 2)
    this.square(this.a, this.a)
    this.square(this.b, this.b)
    this.wrap(this.radius, this.a.low + this.b.low, this.a.high + this.b.high)
    this.scale(this.curve, this.radius, v.curvature, 16)
    this.shift(this.curve, this.curve, 16)
    this.wrap(this.y, this.y.low - this.curve.high, this.y.high - this.curve.low)
    this.wrap(this.depth, this.z.low + v.depth, this.z.high + v.depth)
    if (!this.valid || this.depth.low <= 0) return false
    const numerator = 1 << (v.perspective + 16),
      low = Math.trunc(numerator / this.depth.low),
      high = Math.trunc(numerator / this.depth.high)
    this.set(this.perspective, Math.min(low, high), Math.max(low, high))
    this.scale(this.sx, this.x, v.scale)
    this.shift(this.sx, this.sx, 16 - v.fractionX)
    this.multiplyShift16(this.sx, this.sx, this.perspective)
    this.scale(this.sy, this.y, v.scale)
    this.shift(this.sy, this.sy, 16 - v.fractionY)
    this.multiplyShift16(this.sy, this.sy, this.perspective)
    const x0 = Math.fround(v.pixelScaleX * this.sx.low + v.centerX),
      x1 = Math.fround(v.pixelScaleX * this.sx.high + v.centerX),
      y0 = Math.fround(v.centerY - v.pixelScaleY * this.sy.low),
      y1 = Math.fround(v.centerY - v.pixelScaleY * this.sy.high)
    if (
      !this.valid ||
      !Number.isFinite(x0) ||
      !Number.isFinite(x1) ||
      !Number.isFinite(y0) ||
      !Number.isFinite(y1) ||
      Math.max(Math.abs(x0), Math.abs(x1), Math.abs(y0), Math.abs(y1)) > 2 ** 30
    )
      return false
    // Preserve modelHitBounds' initial extrema, inclusive edges and ties-to-even.
    const left = Math.min(0xfffffff, roundPixel(Math.min(x0, x1))),
      right = Math.max(-1, roundPixel(Math.max(x0, x1))),
      top = Math.min(0xfffffff, roundPixel(Math.min(y0, y1))),
      bottom = Math.max(-1, roundPixel(Math.max(y0, y1)))
    this.bounds.x = left
    this.bounds.y = top
    this.bounds.width = right - left
    this.bounds.height = bottom - top
    return true
  }
}
