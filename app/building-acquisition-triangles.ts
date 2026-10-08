import models from './original-models.json' with { type: 'json' }
import { modelTextureUV } from './model-faces.ts'
import { faceNormal, sunlightShades } from './model-lighting.ts'
import { comparePolygons } from './painter-order.ts'

export interface BuildingFaceProjection {
  face: number
  transformed: number[][]
  projected: number[][]
  flight: number
}

export interface BuildingAcquisitionVertex {
  corner: number
  x: number
  y: number
  u: number
  v: number
}

export interface BuildingAcquisitionTriangle {
  face: number
  triangle: number
  bucket: number
  order: number
  points: BuildingAcquisitionVertex[]
  flight: number
  shade: number
  diffuse: number
  mode: 6 | 7
  flags: 0x80 | 0x82
}

const { 103: model } = models,
  sunlight = sunlightShades(),
  faces = model.modes.map((mode, face) => {
    if (mode !== 6 && mode !== 7) throw new Error('Unsupported acquisition material')
    return { mode, count: model.faces[face * 2], tile: model.tiles[face], uv: [] as number[][] }
  })
let vertex = 0
for (const face of faces) {
  // Imported quads are 012,023; recover the original four corners without
  // changing the importer-owned model or the native producer's 023,012 order.
  face.uv = (face.count === 3 ? [0, 1, 2] : [0, 1, 2, 5]).map(corner =>
    modelTextureUV(face.tile, model.uv[(vertex + corner) * 2], model.uv[(vertex + corner) * 2 + 1])
  )
  vertex += face.count === 3 ? 3 : 6
}

export const BUILDING_ACQUISITION_TRIANGLE_CAPACITY = vertex / 3

// The screen producer uses a different depth origin from world polygons.
export function buildingAcquisitionBucket(depths: number[], bias: number) {
  const distance = Math.imul((depths[0] + depths[1] + depths[2] + 3072) | 0, 85) >> 8
  return distance < 64 ? 0 : Math.max(0, Math.min(3584, (Math.trunc(distance / 16) + bias) | 0))
}

/** Collect after the controller has performed this visit's eligibility writes.
 * This only reads the saved corners. It never visits faces, RNG, or a clock.
 * Source common-outcode rejection is followed by full-shell GPU clipping. */
export function collectBuildingAcquisitionTriangles(
  command: { whole: boolean; submissions: readonly BuildingFaceProjection[] },
  {
    width,
    height,
    tribe = 0,
    shadeOffset = 0,
  }: {
    width: number
    height: number
    tribe?: number
    shadeOffset?: number
  }
) {
  const triangles: BuildingAcquisitionTriangle[] = []
  let order = 0
  for (const submission of command.submissions) {
    const { face, transformed, projected, flight } = submission,
      data = faces[face]
    if (!data || projected.length !== data.count || transformed.length !== data.count)
      throw new Error('Invalid Mission 1 acquisition face')
    let light = sunlight[model.normals[face][0]] + ((shadeOffset << 24) >> 24)
    if (!command.whole) {
      const [, , firstDepth] = transformed[0]
      light = sunlight[faceNormal(transformed[0], transformed[1], transformed[2])]
      if (firstDepth >= 400) light -= 20
      else if (firstDepth <= -400) light += 4
    }
    const shade = Math.max(command.whole ? 1 : 0, Math.min(63, light)),
      diffuse = shade < 32 ? shade * 8 : 255,
      corners =
        data.count === 3
          ? [[0, 1, 2]]
          : [
              [0, 2, 3],
              [0, 1, 2],
            ]
    for (const [triangle, indices] of corners.entries()) {
      const insertion = order++,
        points = indices.map(corner => ({
          corner,
          x: projected[corner][0],
          y: projected[corner][1],
          // Only tile226 in geometry103 has the original tribe-remap bit.
          u: data.uv[corner][0] + (data.tile === 226 ? tribe / 8 : 0),
          v: data.uv[corner][1],
        }))
      if (
        points.every(p => p.x < 0) ||
        points.every(p => p.x >= width) ||
        points.every(p => p.y >= height)
      )
        continue
      const [a, b, c] = points,
        area = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
      if (command.whole && area <= 0) continue
      if (!command.whole && area <= 0) points.reverse()
      const bucket = buildingAcquisitionBucket(
        indices.map(corner => transformed[corner][2]),
        model.biases[face]
      )
      // This acquisition's queue drains 256 down to0, not the world's full queue.
      if (bucket > 256) continue
      triangles.push({
        face,
        triangle,
        bucket,
        order: insertion,
        points,
        flight,
        shade,
        diffuse,
        mode: data.mode,
        flags: data.mode === 7 ? 0x82 : 0x80,
      })
    }
  }
  return triangles.toSorted(comparePolygons)
}
