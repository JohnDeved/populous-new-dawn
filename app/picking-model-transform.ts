// Internal ScenePicking kernel, not a replacement for public modelPoint.
// The caller owns a fresh modelMatrix result for one synchronous model-cache miss.
// Copy only its numeric coefficients: model resources, coordinates, scale, origin
// and returned points are not retained. Global Array.slice instrumentation of this
// private basis is deliberately not part of this API's contract.
export function preparePickingModelTransform(basis: readonly number[]) {
  const m0 = basis[0],
    m1 = basis[1],
    m2 = basis[2],
    m3 = basis[3],
    m4 = basis[4],
    m5 = basis[5],
    m6 = basis[6],
    m7 = basis[7],
    m8 = basis[8]
  return (raw: number[], scale: number, origin: { x: number; y: number; z: number }) => {
    // Keep public modelPoint's raw.map and origin read order. In particular, an
    // origin getter runs after its row, not before all three dot products.
    const p = raw.map(n => Math.imul(n, scale) >> 8)
    return {
      x: (((Math.imul(m0, p[0]) + Math.imul(m1, p[1]) + Math.imul(m2, p[2])) | 0) >> 14) + origin.x,
      y: (((Math.imul(m3, p[0]) + Math.imul(m4, p[1]) + Math.imul(m5, p[2])) | 0) >> 14) + origin.y,
      z: (((Math.imul(m6, p[0]) + Math.imul(m7, p[1]) + Math.imul(m8, p[2])) | 0) >> 14) + origin.z,
    }
  }
}
