import { projectPoint, type Projection } from './projection.ts'

const capacity = 128 * 128 * 6

// Query working storage, not a geometry/projection cache. Float64 retains the
// exact JS numbers (including signed zero) consumed by the original scan.
export class OrdinaryNumericProjection {
  values = new Float64Array(0)
  length = 0
  private relative = { x: 0, y: 0, z: 0 }
  private projected = { x: 0, y: 0, z: 0, screenX: 0, screenY: 0, flags: 0 }

  reset() {
    this.length = 0
  }

  append(
    x: number,
    y: number,
    z: number,
    matrix: number[],
    centerX: number,
    centerY: number,
    projection: Projection,
    configDepth: number
  ) {
    if (this.length >= capacity) throw new RangeError('Ordinary terrain working capacity exceeded')
    if (this.length * 6 === this.values.length) {
      const next = new Float64Array(Math.min(capacity, Math.max(256, this.length * 2)) * 6)
      next.set(this.values)
      this.values = next
    }
    // Same full expression order as Vector3.applyMatrix4, even for translation.
    const w = 1 / (matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15])
    const wx = (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) * w,
      wy = (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) * w,
      wz = (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) * w
    const p = this.relative
    p.x = (Math.round((wx + 8) * 256) - centerX) >> 1
    p.y = Math.round(((wy * 128) / 45) * 45)
    p.z = (Math.round((-wz - 8) * 256) - centerY) >> 1
    // Numeric picking consumes coordinates only; the scan owns visibility rejection.
    const projected = projectPoint(p, projection, false, this.projected)
    const slot = this.length++,
      offset = slot * 6
    this.values[offset] = wx
    this.values[offset + 1] = wy
    this.values[offset + 2] = wz
    this.values[offset + 3] = (projected.screenX * 2) / projection.width - 1
    this.values[offset + 4] = 1 - (projected.screenY * 2) / projection.height
    this.values[offset + 5] = (projected.z + configDepth) / 16384 - 1
    return slot
  }
}
