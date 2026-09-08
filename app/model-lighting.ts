import rules from './original-rules.json' with { type: 'json' }
import { nativeAngle } from './native-math.ts'
import { modelMatrix, modelPoint, multiplyShift16 } from './projection.ts'
import type { NativeModel } from './model-faces.ts'

// 0x401790, with the default sunlight parameters from 0x401040.
export function sunlightShades(x = 147, z = 147, y = 147, ambient = 28, strength = 15) {
  return Array.from({ length: 1024 }, (_, index) => {
    const azimuth = (index & 31) * 64,
      elevation = (index & ~31) * 2,
      cos = rules.sine[(elevation + 512) & 2047],
      nx = multiplyShift16(rules.sine[(azimuth + 512) & 2047], cos) >> 2,
      nz = multiplyShift16(rules.sine[azimuth], cos) >> 2,
      ny = rules.sine[elevation] >> 2,
      length = Math.floor(Math.sqrt((nx * nx + ny * ny + nz * nz) >>> 0)),
      unit = (n: number) => (length ? Math.trunc((n << 8) / length) : 0),
      dot = Math.max(
        0,
        (Math.imul(x, unit(nx)) + Math.imul(y, unit(ny)) + Math.imul(z, unit(nz))) | 0
      )
    return (ambient + Math.trunc(Math.imul(strength, dot) / 65536)) & 255
  })
}

// 0x40cd00 quantizes the cross product to a 32 by 32 normal table.
const normalAngle = (x: number, y: number) => ((nativeAngle(x, y) + 32) >> 6) & 31
export function faceNormal(a: number[], b: number[], c: number[]) {
  const u = b.map((n, i) => (n - a[i]) | 0),
    v = c.map((n, i) => (n - a[i]) | 0),
    x = (Math.imul(u[1], v[2]) - Math.imul(u[2], v[1])) | 0,
    y = (Math.imul(v[0], u[2]) - Math.imul(u[0], v[2])) | 0,
    z = (Math.imul(u[0], v[1]) - Math.imul(v[0], u[1])) | 0,
    length = Math.floor(Math.sqrt((Math.imul(z, z) + Math.imul(x, x)) >>> 0))
  return normalAngle(y, -length) * 32 + normalAngle(z, -x)
}

const sunlight = sunlightShades()

// 0x4718c0 / 0x471c40 fade numeric face shades by the first vertex's camera Z.
export function modelShade(shade: number, depth: number) {
  return depth > -3328 && !(shade & 0xff000000)
    ? Math.max(1, (shade + Math.trunc(Math.imul(-3328 - depth, 32) / 8192)) | 0)
    : shade
}

// 0x4708d0 / 0x471c40: the hovered object's color replaces sunlight and
// distance fading. 0x4a4450 changes the phase every two simulation turns.
export function modelHighlight(
  object: { type: number; model: number; owner: number; buildingFlags?: number },
  turn: number,
  { player = 0, allTribes = false, construction = false } = {}
) {
  const owned = object.owner === player,
    special = object.type === 6 && object.model === 8
  if (!construction && special && owned) return 0
  const eligible =
    allTribes ||
    owned ||
    object.owner === -1 ||
    (object.type === 2 && !!((object.buildingFlags ?? 0) & 16)) ||
    (!construction && (object.type === 4 || special))
  if (!eligible) return 0
  return (turn >>> 1) & 1 ? 255 : 200
}

// Whole faces share a shade and first-vertex depth anchor, including both
// triangles of a quad. Positions may already include a live vault morph.
export function modelLighting(
  data: NativeModel,
  positions: ArrayLike<number>,
  stage: number,
  heading: number,
  size = data.scale
) {
  const shades: number[] = [],
    anchors: number[] = [],
    basis = modelMatrix(heading)
  let vertex = 0
  for (let face = 0; face < data.faces.length / 2; face++) {
    const count = data.faces[face * 2] === 3 ? 3 : 6
    if (stage !== 4 && !(data.faces[face * 2 + 1] & (1 << stage))) continue
    const point = (offset: number) =>
      [0, 1, 2].map(axis =>
        Math.round(positions[(vertex + offset) * 3 + axis] * data.scale * 3 * (axis === 2 ? -1 : 1))
      )
    const raw = point(0),
      normals = data.normals[face]
    let normal = normals[(heading & 2047) >> 9]
    if (normal < 0) {
      const transformed = [raw, point(1), point(2)].map(p => {
        const q = modelPoint(p, size, basis, { x: 0, y: 0, z: 0 })
        return [q.x, q.y, q.z]
      })
      normal = faceNormal(transformed[0], transformed[1], transformed[2])
    }
    for (let i = 0; i < count; i++) {
      shades.push(sunlight[normal])
      anchors.push(...raw)
    }
    vertex += count
  }
  return { shades, anchors }
}
