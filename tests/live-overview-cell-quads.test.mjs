import assert from 'node:assert/strict'
import test from 'node:test'
import { globeFootprint, globeVisible } from '../app/globe.ts'

const view = { x: 0, y: 0, width: 640, height: 480 }
const blue = { player: 0, turn: 2, fog: true, concealed: 0 }
// A visible origin/visible limb are distinct from the quad's winding. The
// zero-area limb is admitted by the native <= tests (the raster may draw nothing).
const cases = [
  { cell: 0, a: [320, 240], b: [330, 240], c: [330, 230], d: [320, 230], signs: [-1, -1] },
  { cell: 36, a: [511, 240], b: [511, 240], c: [511, 235], d: [511, 235], signs: [0, 0] },
  { cell: 39, a: [512, 240], b: [512, 240], c: [511, 244], d: [512, 235], signs: [0, 1] },
  { cell: 347, a: [129, 230], b: [129, 229], c: [130, 224], d: [129, 225], signs: [1, -1] },
  {
    cell: 16383, a: [310, 250], b: [320, 250], c: [320, 240], d: [310, 240], signs: [-1, -1],
  },
]

function signs({ a, b, c, d }) {
  // Re-express the two retained native branch predicates as a determinant
  // over the already projected points, in 32-bit signed arithmetic.
  const cross = (p, q, r) => {
    const ux = BigInt(q[0] - p[0]), uy = BigInt(q[1] - p[1])
    const vx = BigInt(r[0] - q[0]), vy = BigInt(r[1] - q[1])
    return Math.sign(Number(BigInt.asIntN(32, ux * vy - uy * vx)))
  }
  return [cross(a, b, c), cross(a, c, d)]
}

test('overview construction marks retain both signed quad tests in each paint role', () => {
  for (const point of cases) {
    const { cell, a, b, c, d } = point
    const winding = signs(point)
    assert.deepEqual(winding, point.signs, `fixture winding, cell ${cell}`)
    assert.equal(globeVisible(view, (cell & 127) << 9, (cell >> 7) << 9), true)
    const quad = winding.some(sign => sign > 0)
      ? null
      : [a, b, c, d].map(([x, y]) => ({ x, y }))
    assert.deepEqual(globeFootprint(view, cell, 0x188, undefined, blue), {
      color: 0x43, translucent: true, buildingId: null, quad,
    }, `even plan pulse, cell ${cell}`)
    assert.deepEqual(globeFootprint(view, cell, 0x188, undefined, { ...blue, turn: 3 }), {
      color: 23, translucent: false, buildingId: null, quad,
    }, `odd plan pulse, cell ${cell}`)
  }
  assert.equal(globeFootprint(view, 0, 0x180, undefined, blue), null, 'unrevealed under fog')
  assert.equal(globeFootprint(view, 0, 8, undefined, blue), null, 'unoccupied even when revealed')
})
