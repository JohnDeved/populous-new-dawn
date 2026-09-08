import rules from './original-rules.json' with { type: 'json' }
import type { NativeTerrain } from './native-terrain.ts'
import type { TerrainTextures } from './terrain-texture.ts'

// Complete 0x4bdcb0 pixel loop; callers own its resource-ready gate.
export function waterTexture(t: TerrainTextures, turn: number) {
  const out = new Uint8Array(65536)
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const d = t.detail[((y + turn) & 255) * 256 + ((x + turn) & 255)]
      out[y * 256 + x] = t.colors[((Math.imul(d, 425) & 0xfffffc03) >> 2) + 0x4b80]
    }
  return out
}

type Ground = Pick<NativeTerrain, 'heights' | 'categories' | 'flags' | 'buildingIds'>
// Point-generation block of 0x46cb90, including 0x46cfc0's shore predicate.
export function waterPoint(land: Ground, i: number, turn: number, waves: Uint8Array) {
  const category = land.categories[i] & 15,
    bits = rules.terrainCategoryFlags[category]
  const dry = !!(bits & 1) || !!(bits & 60 && rules.terrainCategoryMasks[category][7] & 128)
  let height = land.heights[i],
    color = (land.buildingIds[i] >>> 10) + 32,
    flags = 0
  if (!dry) {
    const at = ((i >> 7) << 12) + ((i & 127) << 4),
      phase = (turn & 255) * 257
    const sum = waves[(at + phase) & 65535] + waves[(at - phase + 76) & 65535]
    height = sum >> 3
    color = Math.min(32, (sum >> 4) + 16)
    flags = 128
  }
  if (land.flags[i] & 0x200 && !(land.flags[i] & 0x100000)) flags |= 64
  return { height, color, flags }
}

export function waterCell(land: Pick<NativeTerrain, 'categories'>, i: number) {
  return !!(rules.terrainCategoryFlags[land.categories[i] & 15] & 2)
}
