import { modelCapUV, type NativeModel } from './model-faces.ts'
import { modelMatrix, modelPoint } from './projection.ts'
import { moveDirectedEffect, type DirectedEffect } from './effect-motion.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import { random } from './native-math.ts'
import rules from './original-rules.json' with { type: 'json' }

type Ground = Pick<NativeTerrain, 'heights' | 'flags' | 'categories'>
export interface BuildingDebris extends DirectedEffect {
  face: number
  vertices: number[][]
  uv: number[]
  cap: boolean
  heading: number
  tilt: number
  roll: number
  spin: number[]
  bounce: number
}
const short = (n: number) => (n << 16) >> 16

// 0x407860's collapse mode: null retains the face; boolean selects its texture.
function lostFace(flags: number, stage: number): boolean | null {
  if (stage === 4) return !(flags & 15) || (flags & 0x88) === 0x88 ? false : null
  if (stage === 0) return flags & 1 ? !!(flags & 16) : null
  const current = 1 << stage
  if (flags & current && flags & (current << 4)) return true
  const previous = current >> 1
  return flags & previous && flags & (previous << 4) ? false : null
}

// Collapse caller arguments to 0x407860: (0,1,oldStage,0,1,-1,-1,0).
// Yield one allocation at a time: its first motion/impact must run before the
// next fragment consumes RNG, just as in the original face loop.
export function* collapseBuildingFaces(
  land: Ground,
  model: NativeModel,
  source: { x: number; y: number; h: number; angle: number; flags3: number; tribe: number },
  oldStage: number,
  rng: { randomState: number }
): Generator<BuildingDebris> {
  const basis = modelMatrix(source.angle)
  let vertex = 0
  for (let face = 0; face < model.faces.length / 2; face++) {
    const count = model.faces[face * 2]
    const cap = lostFace(model.faces[face * 2 + 1], oldStage)
    const first = vertex
    vertex += count === 3 ? 3 : 6
    if (cap === null) continue
    const corners = count === 3 ? [0, 1, 2] : [0, 1, 2, 5]
    const points = corners.map(corner => {
      const index = (first + corner) * 3
      const raw = [model.p[index], model.p[index + 1], -model.p[index + 2]].map(n =>
        Math.round(n * model.scale * 3)
      )
      const p = modelPoint(raw, model.scale, basis, { x: 0, y: 0, z: 0 })
      const position = { x: (source.x + p.x * 2) & 65535, y: (source.y + p.z * 2) & 65535 }
      const cell = (position.y >> 9) * 128 + (position.x >> 9)
      if (land.flags[cell] & 0x20000 && !(source.flags3 & 0x100000)) {
        p.y += terrainPointHeight(land, position) - source.h
      }
      return [p.x, p.y, p.z]
    })
    const center = [0, 1, 2].map(axis =>
      Math.trunc(points.reduce((sum, p) => sum + p[axis], 0) / count)
    )
    const x = (source.x + short(center[0]) * 2) & 65535
    const y = (source.y + short(center[2]) * 2) & 65535
    const h = short(source.h + short(center[1]))
    // 0x502460 initializes travel and spin, then the collapse caller overrides
    // their strengths. Keep the initializer's six draws even when overwritten.
    const yaw = random(rng) & 2047
    random(rng) // Initial speed, replaced with 32 below.
    random(rng) // Initial vertical launch and bounce strength.
    for (let axis = 0; axis < 3; axis++) random(rng) // Initial spin.
    const upward = (random(rng) & 31) + 64
    const spin = [random(rng) & 0x15, random(rng) & 0xa9, random(rng) & 0x15]
    const triangles = count === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]
    const tile = model.tiles[face]
    const tribeTile = rules.textureFlags[tile] & 1 ? (tile + source.tribe) & 255 : tile
    const uv = triangles.flatMap((corner, index) => {
      if (cap) return modelCapUV(corner)
      const u = model.uv[(first + index) * 2] + ((tribeTile % 8) - (tile % 8)) / 8
      const v = model.uv[(first + index) * 2 + 1] - ((tribeTile >> 3) - (tile >> 3)) / 32
      return [u, v]
    })
    yield {
      x,
      y,
      h,
      face,
      cap,
      vertices: points.map(p => [
        short(p[0] + (short(source.x - x) >> 1)),
        short(p[1] - h + source.h),
        short(p[2] + (short(source.y - y) >> 1)),
      ]),
      uv,
      flags2: 0x80,
      flags4: 0,
      speed: 32,
      yaw,
      pitch: 512,
      velocity: { x: 0, y: upward, z: 0 },
      heading: 0,
      tilt: 0,
      roll: 0,
      spin,
      bounce: 24,
    }
  }
}

// 0x502660, unattached fragment path. Native collapse fragments use physics 0.
export function stepBuildingDebris(
  land: Ground,
  p: BuildingDebris,
  rng: { randomState: number },
  impact: (water: boolean) => void
) {
  moveDirectedEffect(land, p, 0)
  p.heading = (p.heading + p.spin[0]) & 2047
  p.tilt = (p.tilt + p.spin[1]) & 2047
  p.roll = (p.roll + p.spin[2]) & 2047
  if (p.flags4 & 0x400) return true
  const cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
  const water = !!(rules.terrainCategoryFlags[land.categories[cell] & 15] & 2)
  impact(water)
  if (!water && !(random(rng) & 1) && p.bounce > 31) {
    p.bounce >>= 1
    p.velocity.y = p.bounce
    return true
  }
  return false
}

export function debrisVertices(p: BuildingDebris) {
  const basis = modelMatrix(p.heading, p.tilt, p.roll)
  const points = p.vertices.map(vertex => modelPoint(vertex, 256, basis, { x: 0, y: 0, z: 0 }))
  const triangles = points.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]
  return triangles.flatMap(i => [points[i].x / 128, points[i].y / 128, -points[i].z / 128])
}
