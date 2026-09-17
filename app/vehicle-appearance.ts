import models from './original-models.json' with { type: 'json' }
import { modelFaceVisible, modelTextureUV } from './model-faces.ts'
import { tribeForTeam, type Team } from './world-types.ts'

// 00463ba0 selects the vehicle descriptor's +4 mesh and draw type 2.
// Models 1/2 share Boat143; models 3/4 share Balloon144, for every owner/state.
// The adjacent descriptor+6 IDs838/839 feed tooltip strings, not geometry.
export function originalVehicleMesh(model: number): 143 | 144 {
  switch (model) {
    case 1:
    case 2:
      return 143
    case 3:
    case 4:
      return 144
    default:
      throw new RangeError(`Unsupported original vehicle model: ${model}`)
  }
}

// 00418de0 sets the vehicle model's tribe-texture flag after loading. Only
// texture IDs marked at005aa218 receive owner offset in00471a80. The adjacent
// original tiles already exist in the shared atlas; never recolor their pixels.
export function originalVehicleTextureTile(tile: number, team: Team) {
  return [186, 202, 210].includes(tile) ? tile + tribeForTeam(team) : tile
}

const uvCache = new Map<string, Float32Array>()
export function originalVehicleUV(model: number, team: Team) {
  const id = originalVehicleMesh(model), key = `${id}:${team}`
  const cached = uvCache.get(key)
  if (cached) return cached
  const data = models[id], uv: number[] = []
  for (let face = 0, vertex = 0; face < data.tiles.length; face++) {
    const count = data.faces[face * 2] === 3 ? 3 : 6
    if (modelFaceVisible(data, face, 4)) {
      const source = data.tiles[face], target = originalVehicleTextureTile(source, team)
      for (let corner = 0; corner < count; corner++) {
        const u = data.uv[(vertex + corner) * 2], v = data.uv[(vertex + corner) * 2 + 1]
        const localU = u * 8 - (source & 7), localV = (1 - v) * 32 - (source >> 3)
        uv.push(...modelTextureUV(target, ((target & 7) + localU) / 8, 1 - ((target >> 3) + localV) / 32))
      }
    }
    vertex += count
  }
  const result = new Float32Array(uv)
  uvCache.set(key, result)
  return result
}
