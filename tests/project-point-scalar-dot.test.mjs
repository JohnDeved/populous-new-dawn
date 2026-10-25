import assert from 'node:assert/strict'
import test from 'node:test'
import { stripTypeScriptTypes } from 'node:module'
import { projectPoint, multiplyShift16, cameraMatrix } from '../app/projection.ts'
import { RenderView } from '../app/render-view.ts'

// Frozen ac6973e6 projection body, including its original temporary dot arrays.
const source = `const dot = (a: number[], b: number[]) => (Math.imul(a[0], b[0]) + Math.imul(a[1], b[1]) + Math.imul(a[2], b[2])) | 0
function legacyProjectPoint(
  p: { x: number; y: number; z: number; flags?: number },
  v: Projection,
  clip = true,
  output?: ProjectedPoint
): ProjectedPoint {
  const m = v.matrix
  const x = (Math.imul(p.x, m[0]) + Math.imul(p.z, m[2])) >> 14
  let y = dot([m[3], m[4], m[5]], [p.x, p.y, p.z]) >> 14
  const z = dot([m[6], m[7], m[8]], [p.x, p.y, p.z]) >> 14
  const radiusSquared = (Math.imul(x << 1, x << 1) + Math.imul(z << 1, z << 1)) | 0
  y = (y - (multiplyShift16(radiusSquared, v.curvature) >> 16)) | 0
  const depth = (z + v.depth) | 0
  let sx: number, sy: number
  if (depth <= 0) {
    sx = -(v.centerX << (v.fractionX + 100)) | 0
    sy = -(v.centerY << (v.fractionY + 100)) | 0
  } else {
    const perspective = Math.trunc((1 << (v.perspective + 16)) / depth)
    sx = multiplyShift16(Math.imul(v.scale, x) >> (16 - v.fractionX), perspective)
    sy = multiplyShift16(Math.imul(v.scale, y) >> (16 - v.fractionY), perspective)
  }
  const screenX = Math.fround(v.pixelScaleX * sx + v.centerX),
    screenY = Math.fround(v.centerY - v.pixelScaleY * sy)
  let flags = p.flags ?? 0
  if (clip) {
    if (screenX < 0) flags |= 2
    else if (screenX >= v.width) flags |= 4
    else if (screenY < 0) flags |= 8
    else if (screenY >= v.height) flags |= 16
  }
  const result = output ?? { x: 0, y: 0, z: 0, screenX: 0, screenY: 0, flags: 0 }
  result.x = x
  result.y = y
  result.z = z
  result.screenX = screenX
  result.screenY = screenY
  result.flags = flags
  return result
}
`
const legacyProjectPoint = new Function('multiplyShift16', stripTypeScriptTypes(source) + '; return legacyProjectPoint')(multiplyShift16)

test('scalar projection dots exactly match the frozen array oracle, including aliases and read order', () => {
  const view = new RenderView()
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  const values = [-2147483648, -65537, -32768, -1, -0, 0, 0.000001, 1, 32768, 65535, 2147483647]
  const output = { x: 1, y: 2, z: 3, screenX: 4, screenY: 5, flags: 6 }
  for (const heading of [0, 1, 511, 1024, 2047]) for (const depth of [-1, 0, 1, 28672]) {
    const projection = { ...view.projection, matrix: cameraMatrix(heading, 256), depth }
    for (const x of values) for (const z of values) for (const clip of [false, true]) {
      const input = { x, y: -x, z, flags: 128 }
      const expected = legacyProjectPoint(input, projection, clip)
      assert.deepEqual(projectPoint(input, projection, clip), expected)
      assert.equal(projectPoint(input, projection, clip, output), output)
      assert.deepEqual(output, expected)
      const alias = { ...input, screenX: 0, screenY: 0 }
      projectPoint(alias, projection, clip, alias)
      assert.deepEqual(alias, expected)
    }
  }
  function observed(fn) {
    const reads = [], p = new Proxy({ x: -1, y: 3, z: 7, flags: 8 }, { get(o, k) { reads.push('p.' + k); return o[k] } })
    const matrix = new Proxy(view.projection.matrix, { get(o, k) { reads.push('m.' + k); return o[k] } })
    const v = new Proxy({ ...view.projection, matrix }, { get(o, k) { reads.push('v.' + k); return o[k] } })
    return { result: fn(p, v), reads }
  }
  assert.deepEqual(observed(projectPoint), observed(legacyProjectPoint))
  view.dispose()
})
